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

      // Get commit information
      await this.getCommitInfo(project, deploymentDir, deployment);

      // Detect framework and set build settings for non-static projects
      if (project.projectType !== 'static') {
        await this.detectFramework(project, deploymentDir, deployment);
      }

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
      await deployment.updateStatus('success', null, deployedUrl);
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
   * Copy directory recursively
   */
  async copyDirectory(source, target) {
    const fs = require('fs').promises;
    const path = require('path');

    // Create target directory if it doesn't exist
    await fs.mkdir(target, { recursive: true });

    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  /**
   * Get commit information from cloned repository
   */
  async getCommitInfo(project, deploymentDir, deployment) {
    return new Promise((resolve, reject) => {
      // Get commit SHA
      exec('git rev-parse HEAD', { cwd: deploymentDir }, async (error, shaStdout, shaStderr) => {
        if (error) {
          await deployment.addLog('error', `Failed to get commit SHA: ${error.message}`);
          resolve(); // Don't fail deployment for this
          return;
        }

        const commitSha = shaStdout.trim();

        // Get commit message
        exec('git log --oneline -1 --pretty=format:%s', { cwd: deploymentDir }, async (error, messageStdout, messageStderr) => {
          if (error) {
            await deployment.addLog('error', `Failed to get commit message: ${error.message}`);
            resolve();
            return;
          }

          const commitMessage = messageStdout.trim();

          // Update deployment with commit info
          try {
            await deployment.constructor.updateOne(
              { _id: deployment._id },
              {
                $set: {
                  commitSha,
                  commitMessage,
                  branch: project.branch || 'main'
                }
              }
            );
            await deployment.addLog('info', `Commit: ${commitSha.substring(0, 7)} - ${commitMessage}`);
          } catch (updateError) {
            await deployment.addLog('error', `Failed to update commit info: ${updateError.message}`);
          }

          resolve();
        });
      });
    });
  }

  /**
   * Detect framework and set build settings
   */
  async detectFramework(project, deploymentDir, deployment) {
    try {
      const packageJsonPath = path.join(deploymentDir, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      const devDeps = packageJson.devDependencies || {};
      const deps = packageJson.dependencies || {};
      const scripts = packageJson.scripts || {};

      await deployment.addLog('info', `Package.json found. Dependencies: ${Object.keys(deps).length}, DevDeps: ${Object.keys(devDeps).length}`);

      // Detect Vite
      if (devDeps.vite) {
        project.outputDir = 'dist';
        project.buildCommand = 'npx vite build';
        await deployment.addLog('info', '✅ Detected Vite framework, using output dir: dist, build command: npx vite build');
      }
      // Detect Create React App
      else if (devDeps['react-scripts']) {
        project.outputDir = 'build';
        project.buildCommand = 'npm run build';
        await deployment.addLog('info', '✅ Detected Create React App, using output dir: build, build command: npm run build');
      }
      // Detect Next.js
      else if (deps.next) {
        project.outputDir = 'out'; // For static export
        project.buildCommand = scripts.export ? 'npm run export' : 'npm run build';
        await deployment.addLog('info', `✅ Detected Next.js, using output dir: out, build command: ${project.buildCommand}`);
      }
      // Detect Parcel
      else if (devDeps.parcel) {
        project.outputDir = 'dist';
        project.buildCommand = 'npm run build';
        await deployment.addLog('info', '✅ Detected Parcel, using output dir: dist, build command: npm run build');
      }
      // Generic React detection
      else if (deps.react) {
        // Check for common build scripts
        if (scripts.build) {
          project.buildCommand = 'npm run build';
          // Try to infer output dir from scripts or common patterns
          if (scripts.build.includes('vite') || scripts.build.includes('parcel')) {
            project.outputDir = 'dist';
          } else if (scripts.build.includes('webpack') || scripts.build.includes('react-scripts')) {
            project.outputDir = 'build';
          } else {
            project.outputDir = 'dist'; // Default assumption
          }
          await deployment.addLog('info', `✅ Detected React project with build script, using output dir: ${project.outputDir}, build command: npm run build`);
        } else {
          await deployment.addLog('warn', '⚠️  React detected but no build script found in package.json');
          project.outputDir = 'build';
          project.buildCommand = 'npm run build';
        }
      }
      else {
        if (project.projectType === 'node') {
          project.buildCommand = 'docker run --rm -v $(pwd):/app -w /app node:18-alpine npm run build';
          project.outputDir = 'dist';
          await deployment.addLog('info', '✅ Detected Node.js project - will use Docker for builds');
          await deployment.addLog('info', `Build command set to: ${project.buildCommand}`);
          await deployment.addLog('info', `Output directory set to: ${project.outputDir}`);
        } else {
          await deployment.addLog('info', 'ℹ️  No React framework detected, using project defaults');
        }
      }

      await deployment.addLog('info', `Final build settings - Command: ${project.buildCommand}, Output: ${project.outputDir}`);

    } catch (error) {
      await deployment.addLog('error', `❌ Framework detection failed: ${error.message}, using project defaults`);
    }
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
          if (project.projectType === 'node') {
            deployment.addLog('info', '🔧 Installing Node.js dependencies using Docker...');
            deployment.addLog('info', '📦 Using Docker image: node:18-alpine');
            deployment.addLog('info', `📁 Working directory: ${deploymentDir}`);
          } else {
            deployment.addLog('info', 'Installing dependencies...');
          }

          let installCommand;
          if (project.projectType === 'node') {
            // Use Docker for Node.js projects
            installCommand = `docker run --rm -v ${deploymentDir}:/app -w /app node:18-alpine npm install`;
            deployment.addLog('info', `🚀 Executing: ${installCommand}`);
          } else {
            // Use npm directly for other projects
            installCommand = 'npm install';
          }

          const env = project.projectType === 'node' ? process.env : { ...process.env, NODE_ENV: 'development' };

          exec(installCommand, { cwd: deploymentDir, env }, async (error, stdout, stderr) => {
            if (error) {
              await deployment.addLog('error', `❌ Dependency installation failed with exit code ${error.code}`);
              if (stderr && stderr.trim()) {
                await deployment.addLog('error', `📄 Error output: ${stderr.trim()}`);
              }
              if (stdout && stdout.trim()) {
                await deployment.addLog('info', `📄 Standard output: ${stdout.trim()}`);
              }
              await deployment.addLog('error', `💥 Error message: ${error.message}`);
              reject(new Error(`Failed to install dependencies: ${error.message}`));
              return;
            }

            if (stdout && stdout.trim()) {
              await deployment.addLog('info', `📄 Install output: ${stdout.trim()}`);
            }
            await deployment.addLog('info', '✅ Dependencies installed successfully');
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
      let buildCommand = project.buildCommand || 'npm run build';

      if (project.projectType === 'node') {
        // Use Docker for Node.js builds
        buildCommand = `docker run --rm -v ${deploymentDir}:/app -w /app node:18-alpine ${buildCommand}`;
        deployment.addLog('info', '🔨 Building Node.js project using Docker...');
        deployment.addLog('info', '🐳 Using Docker image: node:18-alpine');
        deployment.addLog('info', `📁 Working directory: ${deploymentDir}`);
      } else {
        deployment.addLog('info', '🔨 Building project...');
      }

      deployment.addLog('info', `🚀 Executing build command: ${buildCommand}`);

      exec(buildCommand, { cwd: deploymentDir, maxBuffer: 1024 * 1024 * 10 }, async (error, stdout, stderr) => {
        // Log stdout if present
        if (stdout && stdout.trim()) {
          await deployment.addLog('info', `📄 Build stdout: ${stdout.trim()}`);
        }

        if (error) {
          await deployment.addLog('error', `❌ Build failed with exit code ${error.code}`);
          if (stderr && stderr.trim()) {
            await deployment.addLog('error', `📄 Build stderr: ${stderr.trim()}`);
          }
          await deployment.addLog('error', `💥 Build error: ${error.message}`);
          reject(new Error(`Build failed: ${error.message}`));
          return;
        }

        // Check if output directory exists
        const outputDir = path.join(deploymentDir, project.outputDir || 'dist');
        deployment.addLog('info', `🔍 Checking for output directory: ${outputDir}`);
        try {
          await fs.access(outputDir);
          await deployment.addLog('info', `✅ Build output directory found: ${project.outputDir || 'dist'}`);
        } catch (accessError) {
          await deployment.addLog('error', `❌ Build output directory not found: ${project.outputDir || 'dist'}`);
          await deployment.addLog('error', `💥 Error details: ${accessError.message}`);
          reject(new Error(`Build output directory '${project.outputDir || 'dist'}' not found after build`));
          return;
        }

        await deployment.addLog('info', '✅ Project built successfully');
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

      // Generate URL based on custom domain or subdomain
      const baseDomain = process.env.BASE_DOMAIN || 'deployease.in';
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

      let deployedUrl;

      if (project.customDomain) {
        // Use custom domain
        deployedUrl = `${protocol}://${project.customDomain}`;
        await deployment.addLog('info', `Using custom domain: ${project.customDomain}`);
      } else {
        // Use project name as subdomain with consistent normalization
        const subdomain = project.name.toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')  // replace special chars with hyphens
          .replace(/--+/g, '-')         // replace multiple hyphens with single
          .replace(/^[-]+|[-]+$/g, ''); // remove leading/trailing hyphens

        if (!subdomain || subdomain.length === 0) {
          throw new Error('Project name results in invalid subdomain');
        }

        deployedUrl = `${protocol}://${subdomain}.${baseDomain}`;
        await deployment.addLog('info', `Using subdomain: ${subdomain}.${baseDomain}`);
      }

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