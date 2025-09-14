const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');
const githubService = require('../services/githubService');
const deploymentService = require('../services/deploymentService');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, repositoryUrl, repositoryName, repositoryOwner, branch, buildCommand, outputDir, customDomain, projectType } = req.body;

    // Validate required fields
    if (!name || !repositoryUrl || !repositoryName || !repositoryOwner) {
      return res.status(400).json({
        success: false,
        message: 'Name, repository URL, repository name, and repository owner are required'
      });
    }

    // Check if project with same repository already exists for this user
    console.log('Checking for existing project...');
    console.log('User ID:', req.user._id);
    console.log('Repository URL:', repositoryUrl);

    const existingProject = await Project.findOne({
      owner: req.user._id,
      repositoryUrl: repositoryUrl
    });

    console.log('Existing project found:', !!existingProject);

    if (existingProject) {
      console.log('Existing project details:', existingProject.name, existingProject.status);
      return res.status(400).json({
        success: false,
        message: 'A project with this repository already exists'
      });
    }

    // Validate project name for subdomain compatibility
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^[-]+|[-]+$/g, '');
    if (!normalizedName || normalizedName.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Project name results in invalid subdomain. Please use a name with alphanumeric characters.'
      });
    }
    if (normalizedName.length > 63) {
      return res.status(400).json({
        success: false,
        message: 'Project name is too long. Subdomain cannot exceed 63 characters.'
      });
    }

    // Check if normalized name conflicts with existing projects
    const existingNormalized = await Project.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
      status: 'active'
    });

    if (existingNormalized) {
      return res.status(400).json({
        success: false,
        message: 'A project with a similar name already exists that would create the same subdomain.'
      });
    }

    // Check if custom domain is already taken
    if (customDomain) {
      const existingDomain = await Project.findOne({
        customDomain: customDomain.toLowerCase(),
        status: 'active'
      });

      if (existingDomain) {
        return res.status(400).json({
          success: false,
          message: 'This custom domain is already taken'
        });
      }
    }

    // Create new project
    const project = new Project({
      name,
      description,
      owner: req.user._id,
      repositoryUrl,
      repositoryName,
      repositoryOwner,
      branch: branch || 'main',
      buildCommand: buildCommand || 'npm run build',
      outputDir: outputDir || 'dist',
      customDomain: customDomain ? customDomain.toLowerCase() : undefined,
      projectType: projectType || 'node'
    });

    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project
      }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/projects
// @desc    Get user's projects
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.findByOwner(req.user._id).populate('lastDeployment');

    res.json({
      success: true,
      message: 'Projects fetched successfully',
      data: {
        projects
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id
    }).populate('lastDeployment');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project fetched successfully',
      data: {
        project
      }
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, branch, buildCommand, outputDir, customDomain, status, projectType } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if custom domain is already taken by another project
    if (customDomain && customDomain !== project.customDomain) {
      const existingDomain = await Project.findOne({
        customDomain: customDomain.toLowerCase(),
        status: 'active',
        _id: { $ne: req.params.id }
      });

      if (existingDomain) {
        return res.status(400).json({
          success: false,
          message: 'This custom domain is already taken'
        });
      }
    }

    // Update project fields
    if (name) {
      // Validate new name for subdomain compatibility
      const normalizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^[-]+|[-]+$/g, '');
      if (!normalizedName || normalizedName.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Project name results in invalid subdomain. Please use a name with alphanumeric characters.'
        });
      }
      if (normalizedName.length > 63) {
        return res.status(400).json({
          success: false,
          message: 'Project name is too long. Subdomain cannot exceed 63 characters.'
        });
      }

      // Check if normalized name conflicts with other projects
      const existingNormalized = await Project.findOne({
        name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
        status: 'active',
        _id: { $ne: req.params.id }
      });

      if (existingNormalized) {
        return res.status(400).json({
          success: false,
          message: 'A project with a similar name already exists that would create the same subdomain.'
        });
      }

      project.name = name;
    }
    if (description !== undefined) project.description = description;
    if (branch) project.branch = branch;
    if (buildCommand) project.buildCommand = buildCommand;
    if (outputDir) project.outputDir = outputDir;
    if (customDomain !== undefined) project.customDomain = customDomain ? customDomain.toLowerCase() : undefined;
    if (status) project.status = status;
    if (projectType) project.projectType = projectType;

    await project.save();

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project
      }
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Soft delete by setting status to inactive
    project.status = 'inactive';
    await project.save();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/projects/:id/deploy
// @desc    Trigger deployment for project
// @access  Private
router.post('/:id/deploy', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Create new deployment
    const deployment = new Deployment({
      project: project._id,
      status: 'pending',
      triggeredBy: req.user._id
    });

    await deployment.save();

    // Update project's last deployment
    project.lastDeployment = deployment._id;
    await project.save();

    // Trigger deployment asynchronously
    setImmediate(() => {
      deploymentService.executeDeployment(deployment._id)
        .catch(error => {
          console.error('Async deployment execution failed:', error);
        });
    });

    res.status(201).json({
      success: true,
      message: 'Deployment triggered successfully',
      data: {
        deployment
      }
    });
  } catch (error) {
    console.error('Error triggering deployment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger deployment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;