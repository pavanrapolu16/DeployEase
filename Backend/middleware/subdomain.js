const Project = require('../models/Project');
const Deployment = require('../models/Deployment');
const path = require('path');
const fs = require('fs').promises;

/**
 * Middleware to handle subdomain routing for deployed projects
 * Maps subdomains like 'myproject.deployease.in' to the correct deployment
 */
const subdomainHandler = async (req, res, next) => {
  try {
    const host = req.headers.host;
    const baseDomain = process.env.BASE_DOMAIN || 'deployease.in';
    console.log(`[SUBDOMAIN] Middleware triggered for host: ${host}`);

    // Skip if no host header or if it's the main domain
    if (!host) {
      return next();
    }

    // Remove port from host if present
    const hostname = host.split(':')[0];

    // Check if this is a subdomain request
    if (hostname === baseDomain || hostname === `www.${baseDomain}` || hostname === 'localhost') {
      return next();
    }

    // Extract subdomain
    const subdomain = hostname.replace(`.${baseDomain}`, '');
    console.log(`[SUBDOMAIN] Host: ${host}, Base domain: ${baseDomain}, Extracted subdomain: ${subdomain}`);

    // Skip if subdomain is empty or contains dots (invalid)
    if (!subdomain || subdomain.includes('.')) {
      console.log(`[SUBDOMAIN] Skipping - invalid subdomain: ${subdomain}`);
      return next();
    }

    // Find project by subdomain (project name)
    console.log(`[SUBDOMAIN] Looking for project with name: ${subdomain}`);
    const project = await Project.findOne({
      name: subdomain,
      status: 'active'
    }).populate('lastDeployment');

    console.log(`[SUBDOMAIN] Found project:`, project ? {
      id: project._id,
      name: project.name,
      hasLastDeployment: !!project.lastDeployment
    } : 'null');

    if (!project || !project.lastDeployment) {
      console.log(`[SUBDOMAIN] Project not found or no deployment for subdomain: ${subdomain}`);
      // Serve custom 404 page for non-existent subdomains
      const notFoundPath = path.join(__dirname, '../public/subdomain-404.html');
      console.log(`[SUBDOMAIN] Looking for 404 page at: ${notFoundPath}`);
      try {
        await fs.access(notFoundPath);
        console.log(`[SUBDOMAIN] Serving custom 404 page`);
        return res.status(404).sendFile(notFoundPath);
      } catch (error) {
        console.log(`[SUBDOMAIN] Custom 404 page not found: ${error.message}`);
        // Fallback to basic message if custom page doesn't exist
        return res.status(404).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Project Not Found - DeployEase</title>
            <style>
              body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #333; margin: 0; }
              .container { background: white; border-radius: 20px; padding: 60px 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); text-align: center; max-width: 500px; width: 90%; }
              .icon { font-size: 4rem; margin-bottom: 20px; opacity: 0.8; }
              h1 { font-size: 2.5rem; font-weight: 700; color: #2d3748; margin-bottom: 16px; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
              .subtitle { font-size: 1.1rem; color: #718096; margin-bottom: 12px; font-weight: 500; }
              .message { font-size: 1rem; color: #a0aec0; margin-bottom: 40px; line-height: 1.6; }
              .btn { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 1rem; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(102,126,234,0.4); }
              .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(102,126,234,0.6); color: white; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">🚀</div>
              <h1>Project Not Found</h1>
              <div class="subtitle">This subdomain doesn't have a deployed project yet</div>
              <p class="message">There is no project running on this server. If you want to deploy your project, sign up for DeployEase and start building!</p>
              <a href="https://sthara.fun" class="btn">🚀 Start Deploying Now</a>
            </div>
          </body>
          </html>
        `);
      }
    }

    // Get the deployment directory
    const deploymentDir = path.join(__dirname, '../../deployments', project.lastDeployment._id.toString());

    // Check if deployment directory exists
    try {
      await fs.access(deploymentDir);
    } catch (error) {
      return res.status(404).send('Deployment not found');
    }

    // Get the requested file path
    const requestedPath = req.path === '/' ? '/index.html' : req.path;
    const filePath = path.join(deploymentDir, requestedPath);
    console.log(`[SUBDOMAIN] Request for path: ${req.path}, trying file: ${filePath}`);
  
    // Check if file exists
    try {
      const stats = await fs.stat(filePath);
      console.log(`[SUBDOMAIN] File found: ${filePath}, isDirectory: ${stats.isDirectory()}`);
      if (stats.isDirectory()) {
        // If directory, try to serve index.html
        const indexPath = path.join(filePath, 'index.html');
        try {
          await fs.access(indexPath);
          console.log(`[SUBDOMAIN] Serving directory index: ${indexPath}`);
          res.sendFile(indexPath);
        } catch {
          console.log(`[SUBDOMAIN] Directory index not found: ${indexPath}`);
          res.status(404).send('File not found');
        }
      } else {
        // Serve the file
        console.log(`[SUBDOMAIN] Serving file: ${filePath}`);
        res.sendFile(filePath);
      }
    } catch (error) {
      console.log(`[SUBDOMAIN] File not found: ${filePath}, error: ${error.message}`);
      // File doesn't exist, try to serve index.html for SPA routing
      const indexPath = path.join(deploymentDir, 'index.html');
      try {
        await fs.access(indexPath);
        console.log(`[SUBDOMAIN] Falling back to SPA index.html for path: ${req.path}`);
        res.sendFile(indexPath);
      } catch {
        console.log(`[SUBDOMAIN] SPA index.html not found: ${indexPath}`);
        res.status(404).send('File not found');
      }
    }

  } catch (error) {
    console.error('Subdomain routing error:', error);
    res.status(500).send('Internal server error');
  }
};

module.exports = subdomainHandler;