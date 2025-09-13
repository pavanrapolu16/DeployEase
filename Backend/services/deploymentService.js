const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const Deployment = require('../models/Deployment');
const Project = require('../models/Project');
const githubService = require('./githubService');

class DeploymentService {
  constructor() {
    this.deploymentsDir = path.join(__dirname, '../../deployments');
    this.ensureDeploymentsDir();
  }

  async ensureDeploymentsDir() {
    try {
      await fs.mkdir(this.deploymentsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating deployments directory:', error);
    }
  }

  /**
   * Execute deployment for a project
   * @param {string} deploymentId - Deployment ID
   */
  async executeDeployment(deploymentId) {
    const deployment = await Deployment.findById(deploymentId).populate('project');
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    const project = deployment.project;
    const deploymentDir = path.join(this.deploymentsDir, deploymentId.toString());

    try {
      // Update status to building
      await deployment.updateStatus('building');
      await deployment.addLog('info', 'Starting deployment process...');

      // Create deployment directory
      await fs.mkdir(deploymentDir, { recursive: true });
      await deployment.addLog('info', `Created deployment directory: ${deploymentDir}`);

      // Clone repository
      await this.cloneRepository(project, deploymentDir, deployment);

      // Install dependencies (skip for static projects)
      if (project.projectType !== 'static') {
        await this.installDependencies(project, deploymentDir, deployment);
      }

      // Build project (skip for static projects)
      if (project.projectType !== 'static') {
        await this.buildProject(project, deploymentDir, deployment);
      }

      // Deploy files
      const deployedUrl = await this.deployFiles(project, deploymentDir, deployment);
    
      // Copy built files to deployment root if not static
      if (project.projectType !== 'static') {
        const outputDir = project.outputDir || 'dist';
        const sourceDir = path.join(deploymentDir, outputDir);
        const targetDir = deploymentDir;
    
        try {
          await this.copyDirectory(sourceDir, targetDir);
          await deployment.addLog('info', `Copied built files from ${outputDir} to deployment root`);
        } catch (error) {
          await deployment.addLog('error', `Failed to copy built files: ${error.message}`);
          throw error;
        }
      }
    
      // Update deployment as successful
      deployment.deployedUrl = deployedUrl;
      await deployment.updateStatus('success');
      await deployment.addLog('info', `Deployment completed successfully. Site available at: ${deployedUrl}`);
    
      // Update project's last deployment
      project.lastDeployment = deployment._id;
      await project.save();

    } catch (error) {
      console.error('Deployment error:', error);
      await deployment.updateStatus('failed', error.message);
      await deployment.addLog('error', `Deployment failed: ${error.message}`);

      // Cleanup on failure
      try {
        await fs.rm(deploymentDir, { recursive: true, force: true });
        await deployment.addLog('info', 'Cleaned up deployment directory');
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }

      throw error;
    }
  }

  /**
   * Clone repository
   */
  async cloneRepository(project, deploymentDir, deployment) {
    return new Promise((resolve, reject) => {
      const cloneCommand = `git clone --branch ${project.branch} --depth 1 ${project.repositoryUrl} .`;

      deployment.addLog('info', `Cloning repository: ${project.repositoryUrl} (branch: ${project.branch})`);

      exec(cloneCommand, { cwd: deploymentDir }, async (error, stdout, stderr) => {
        if (error) {
          await deployment.addLog('error', `Git clone failed: ${stderr}`);
          reject(new Error(`Failed to clone repository: ${error.message}`));
          return;
        }

        await deployment.addLog('info', 'Repository cloned successfully');
        resolve();
      });
    });
  }

  /**
   * Install dependencies
   */
  async installDependencies(project, deploymentDir, deployment) {
    return new Promise((resolve, reject) => {
      // Check if package.json exists
      const packageJsonPath = path.join(deploymentDir, 'package.json');

      fs.access(packageJsonPath)
        .then(() => {
          deployment.addLog('info', 'Installing dependencies...');

          exec('npm install', { cwd: deploymentDir }, async (error, stdout, stderr) => {
            if (error) {
              await deployment.addLog('error', `npm install failed: ${stderr}`);
              reject(new Error(`Failed to install dependencies: ${error.message}`));
              return;
            }

            await deployment.addLog('info', 'Dependencies installed successfully');
            resolve();
          });
        })
        .catch(() => {
          // No package.json, skip dependency installation
          deployment.addLog('info', 'No package.json found, skipping dependency installation');
          resolve();
        });
    });
  }

  /**
   * Build project
   */
  async buildProject(project, deploymentDir, deployment) {
    return new Promise((resolve, reject) => {
      const buildCommand = project.buildCommand || 'npm run build';

      deployment.addLog('info', `Building project with command: ${buildCommand}`);

      exec(buildCommand, { cwd: deploymentDir }, async (error, stdout, stderr) => {
        if (error) {
          await deployment.addLog('error', `Build failed: ${stderr}`);
          reject(new Error(`Build failed: ${error.message}`));
          return;
        }

        await deployment.addLog('info', 'Project built successfully');
        resolve();
      });
    });
  }

  /**
   * Deploy files
   */
  async deployFiles(project, deploymentDir, deployment) {
    const outputDir = project.projectType === 'static' ? '.' : (project.outputDir || 'dist');
    const sourceDir = path.join(deploymentDir, outputDir);
    const deployId = deployment._id.toString();

    try {
      // Check if output directory exists
      await fs.access(sourceDir);
      await deployment.addLog('info', `Output directory found: ${outputDir}`);

      // Generate subdomain-based URL
      const baseDomain = process.env.BASE_DOMAIN || 'deployease.in';
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

      // Use project name as subdomain
      const subdomain = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const deployedUrl = `${protocol}://${subdomain}.${baseDomain}`;

      await deployment.addLog('info', `Files deployed to: ${deployedUrl}`);
      await deployment.addLog('info', `Deployment directory: ${deploymentDir}`);

      return deployedUrl;
    } catch (error) {
      await deployment.addLog('error', `Output directory not found: ${outputDir}`);
      throw new Error(`Build output directory '${outputDir}' not found`);
    }
  }

  /**
   * Get deployment logs
   * @param {string} deploymentId - Deployment ID
   * @returns {Array} Array of log entries
   */
  async getDeploymentLogs(deploymentId) {
    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    return deployment.buildLogs;
  }

 /**
  * Cleanup old deployments
  */
 async cleanupOldDeployments() {
   try {
     const cutoffDate = new Date();
     cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep deployments for 30 days

     const oldDeployments = await Deployment.find({
       status: 'success',
       createdAt: { $lt: cutoffDate }
     }).select('_id');

     for (const deployment of oldDeployments) {
       const deploymentDir = path.join(this.deploymentsDir, deployment._id.toString());
       try {
         await fs.rm(deploymentDir, { recursive: true, force: true });
         console.log(`Cleaned up deployment: ${deployment._id}`);
       } catch (error) {
         console.error(`Failed to cleanup deployment ${deployment._id}:`, error);
       }
     }
   } catch (error) {
     console.error('Error during cleanup:', error);
   }
 }

}


module.exports = new DeploymentService();