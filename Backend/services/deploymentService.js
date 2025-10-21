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
    let deployedUrl; // ✅ Declare deployedUrl before usage

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

      // For Node.js projects, create and run Docker container
      if (project.projectType === 'node') {
        await this.createDockerfile(project, deploymentDir, deployment);
        const imageName = await this.buildDockerImage(project, deploymentDir, deployment);
        const containerId = await this.runDockerContainer(project, deploymentDir, deployment, imageName);
        deployedUrl = await this.getContainerUrl(project, deployment, containerId);
      } else {
        // Deploy files for static/React projects
        deployedUrl = await this.deployFiles(project, deploymentDir, deployment);
      }
    
      // Skip file copying for Node.js projects (they run in containers)
      if (project.projectType !== 'static' && project.projectType !== 'node') {
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
      const packageJsonPath = path.join(deploymentDir, project.rootDirectory || '.', 'package.json');
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
          // For Node.js, we don't need a build step - just skip it
          project.buildCommand = 'echo "No build step needed for Node.js"';
          project.outputDir = '.';
          await deployment.addLog('info', '✅ Detected Node.js project - will use Docker for containerization');
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
      const packageJsonPath = path.join(deploymentDir, project.rootDirectory || '.', 'package.json');

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
            // Use Docker for Node.js projects with sudo
            const workDir = project.rootDirectory && project.rootDirectory !== '.' ? `/app/${project.rootDirectory}` : '/app';
            installCommand = `sudo docker run --rm -v ${deploymentDir}:/app -w ${workDir} node:18-alpine npm install`;
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
        const workDir = project.rootDirectory && project.rootDirectory !== '.' ? `/app/${project.rootDirectory}` : '/app';
        buildCommand = `sudo docker run --rm -v ${deploymentDir}:/app -w ${workDir} node:18-alpine ${buildCommand}`;
        deployment.addLog('info', '🔨 Building Node.js project using Docker...');
        deployment.addLog('info', '🐳 Using Docker image: node:18-alpine');
        deployment.addLog('info', `📁 Working directory: ${workDir}`);
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
   * Create Dockerfile for Node.js projects
   */
  async createDockerfile(project, deploymentDir, deployment) {
    return new Promise(async (resolve, reject) => {
      try {
        const dockerfileDir = path.join(deploymentDir, project.rootDirectory || '.');
        await fs.mkdir(dockerfileDir, { recursive: true });
        const dockerfilePath = path.join(dockerfileDir, 'Dockerfile');
        const dockerfileContent = `# Use Node.js runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .


# Expose port (default to 3000, can be overridden)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
`;

        await fs.writeFile(dockerfilePath, dockerfileContent);
        await deployment.addLog('info', '🐳 Created Dockerfile for Node.js application');
        await deployment.addLog('info', `📄 Dockerfile path: ${dockerfilePath}`);
        resolve();
      } catch (error) {
        await deployment.addLog('error', `❌ Failed to create Dockerfile: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Build Docker image for Node.js projects
   */
  async buildDockerImage(project, deploymentDir, deployment) {
    return new Promise((resolve, reject) => {
      const imageName = `deployease-${project.name.toLowerCase()}-${deployment._id.toString()}`;
      const buildContext = project.rootDirectory && project.rootDirectory !== '.' ? project.rootDirectory : '.';
      const buildCommand = `sudo docker build -t ${imageName} ${buildContext}`;

      deployment.addLog('info', '🏗️ Building Docker image...');
      deployment.addLog('info', `🏷️ Image name: ${imageName}`);
      deployment.addLog('info', `🚀 Build command: ${buildCommand}`);
      deployment.addLog('info', `📁 Build context: ${buildContext}`);

      exec(buildCommand, { cwd: deploymentDir }, async (error, stdout, stderr) => {
        if (stdout && stdout.trim()) {
          await deployment.addLog('info', `📄 Build output: ${stdout.trim()}`);
        }

        if (error) {
          await deployment.addLog('error', `❌ Docker build failed with exit code ${error.code}`);
          if (stderr && stderr.trim()) {
            await deployment.addLog('error', `📄 Build stderr: ${stderr.trim()}`);
          }
          await deployment.addLog('error', `💥 Build error: ${error.message}`);
          reject(new Error(`Docker build failed: ${error.message}`));
          return;
        }

        await deployment.addLog('info', '✅ Docker image built successfully');
        resolve(imageName);
      });
    });
  }

  /**
   * Find available port for Docker container
   */
  async findAvailablePort(startPort = 3000) {
    const net = require('net');

    return new Promise((resolve, reject) => {
      const server = net.createServer();

      server.listen(startPort, () => {
        const port = server.address().port;
        server.close(() => resolve(port));
      });

      server.on('error', () => {
        // Port is in use, try next one
        resolve(this.findAvailablePort(startPort + 1));
      });
    });
  }

  /**
   * Run Docker container for Node.js projects
   */
  async runDockerContainer(project, deploymentDir, deployment, imageName) {
    return new Promise(async (resolve, reject) => {
      try {
        const containerName = `deployease-${project.name.toLowerCase()}-${deployment._id.toString()}`;

        // Find an available port starting from 3000
        const availablePort = await this.findAvailablePort(3000);
        deployment.addLog('info', `🔍 Found available port: ${availablePort}`);

        const runCommand = `sudo docker run -d --name ${containerName} -p ${availablePort}:3000 ${imageName}`;

        deployment.addLog('info', '🚀 Starting Docker container...');
        deployment.addLog('info', `🏷️ Container name: ${containerName}`);
        deployment.addLog('info', `🔌 Port mapping: ${availablePort}:3000`);
        deployment.addLog('info', `🚀 Run command: ${runCommand}`);

        exec(runCommand, { cwd: deploymentDir }, async (error, stdout, stderr) => {
          if (error) {
            await deployment.addLog('error', `❌ Failed to start container with exit code ${error.code}`);
            if (stderr && stderr.trim()) {
              await deployment.addLog('error', `📄 Error output: ${stderr.trim()}`);
            }
            await deployment.addLog('error', `💥 Container start error: ${error.message}`);
            reject(new Error(`Failed to start container: ${error.message}`));
            return;
          }

          const containerId = stdout.trim();
          await deployment.addLog('info', `✅ Container started successfully with ID: ${containerId}`);

          // Store container info in deployment
          try {
            const updateResult = await Deployment.findByIdAndUpdate(deployment._id, {
              containerId,
              containerName,
              containerPort: availablePort
            });
            await deployment.addLog('info', `✅ Container info stored in database: ID=${containerId}, Port=${availablePort}`);

            if (!updateResult) {
              await deployment.addLog('error', `❌ Failed to update deployment with container info`);
            }
          } catch (updateError) {
            await deployment.addLog('error', `❌ Database update error: ${updateError.message}`);
            console.error('Container info update error:', updateError);
          }

          resolve(containerId);
        });
      } catch (error) {
        await deployment.addLog('error', `❌ Error finding available port: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Get container URL for Node.js deployments
   */
  async getContainerUrl(project, deployment, containerId) {
    const port = deployment.containerPort || process.env.NODE_PORT || 3000; // ✅ use actual dynamic port
    const baseDomain = process.env.BASE_DOMAIN || 'deployease.in';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    let deployedUrl;

    if (project.customDomain) {
      deployedUrl = `${protocol}://${project.customDomain}`;
      await deployment.addLog('info', `🌐 Using custom domain: ${project.customDomain}`);
    } else {
      const subdomain = project.name.toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^[-]+|[-]+$/g, '');

      if (!subdomain || subdomain.length === 0) {
        throw new Error('Project name results in invalid subdomain');
      }

      deployedUrl = `${protocol}://${subdomain}.${baseDomain}`;
      await deployment.addLog('info', `🌐 Using subdomain: ${subdomain}.${baseDomain}`);
    }

    await deployment.addLog('info', `🐳 Container running on port ${port}`);
    await deployment.addLog('info', `✅ Application deployed at: ${deployedUrl}`);

    return deployedUrl;
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
  * Stop and remove Docker containers for old deployments
  */
 async cleanupDockerContainers() {
   try {
     const cutoffDate = new Date();
     cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep deployments for 30 days

     const oldDeployments = await Deployment.find({
       status: 'success',
       createdAt: { $lt: cutoffDate },
       containerId: { $exists: true }
     }).select('_id containerId containerName');

     for (const deployment of oldDeployments) {
       try {
         // Stop and remove container
           if (deployment.containerId) {
             await new Promise((resolve, reject) => {
               exec(`sudo docker stop ${deployment.containerId} && sudo docker rm ${deployment.containerId}`, (error, stdout, stderr) => {
                 if (error) {
                   console.error(`Failed to stop/remove container ${deployment.containerId}:`, error);
                 } else {
                   console.log(`Cleaned up container: ${deployment.containerId}`);
                 }
                 resolve(); // Continue even if cleanup fails
               });
             });
           }

         // Remove deployment directory
         const deploymentDir = path.join(this.deploymentsDir, deployment._id.toString());
         await fs.rm(deploymentDir, { recursive: true, force: true });
         console.log(`Cleaned up deployment directory: ${deployment._id}`);
       } catch (error) {
         console.error(`Failed to cleanup deployment ${deployment._id}:`, error);
       }
     }
   } catch (error) {
     console.error('Error during Docker cleanup:', error);
   }
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

     // Also cleanup Docker containers
     await this.cleanupDockerContainers();
   } catch (error) {
     console.error('Error during cleanup:', error);
   }
 }

}


module.exports = new DeploymentService();