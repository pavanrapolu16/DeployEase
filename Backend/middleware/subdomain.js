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

    // Skip if subdomain is empty or contains dots (invalid)
    if (!subdomain || subdomain.includes('.')) {
      return next();
    }

    // Find project by subdomain (project name)
    const project = await Project.findOne({
      name: subdomain,
      status: 'active'
    }).populate('lastDeployment');

    if (!project || !project.lastDeployment) {
      return res.status(404).send('Project not found');
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