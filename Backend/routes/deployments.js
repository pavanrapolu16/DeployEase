const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Deployment = require('../models/Deployment');
const Project = require('../models/Project');

const router = express.Router();

// @route   GET /api/deployments
// @desc    Get user's deployments
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get user's projects first
    const userProjects = await Project.find({ owner: req.user._id }).select('_id');
    const projectIds = userProjects.map(p => p._id);

    const deployments = await Deployment.find({
      project: { $in: projectIds }
    })
    .populate('project', 'name repositoryName repositoryOwner')
    .populate('triggeredBy', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Deployment.countDocuments({
      project: { $in: projectIds }
    });

    res.json({
      success: true,
      message: 'Deployments fetched successfully',
      data: {
        deployments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching deployments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deployments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/deployments/stats
// @desc    Get deployment statistics for user
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get user's projects first
    const userProjects = await Project.find({ owner: req.user._id }).select('_id');
    const projectIds = userProjects.map(p => p._id);

    // Get total deployments count
    const totalDeployments = await Deployment.countDocuments({
      project: { $in: projectIds }
    });

    // Get active deployments (building or pending)
    const activeDeployments = await Deployment.countDocuments({
      project: { $in: projectIds },
      status: { $in: ['building', 'pending'] }
    });

    // Get successful deployments
    const successfulDeployments = await Deployment.countDocuments({
      project: { $in: projectIds },
      status: 'success'
    });

    // Calculate success rate
    const successRate = totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 0;

    res.json({
      success: true,
      message: 'Deployment statistics fetched successfully',
      data: {
        total: totalDeployments,
        active: activeDeployments,
        successful: successfulDeployments,
        successRate: successRate
      }
    });
  } catch (error) {
    console.error('Error fetching deployment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deployment statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/deployments/:id
// @desc    Get deployment by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching deployment:', req.params.id);
    console.log('User ID:', req.user._id);

    const deployment = await Deployment.findById(req.params.id)
      .populate('project', 'name repositoryName repositoryOwner owner')
      .populate('triggeredBy', 'username firstName lastName');

    if (!deployment) {
      console.log('Deployment not found');
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }

    console.log('Deployment project owner:', deployment.project?.owner);
    console.log('User owns project?', deployment.project?.owner?.toString() === req.user._id.toString());

    // Check if user owns the project
    if (deployment.project.owner.toString() !== req.user._id.toString()) {
      console.log('Access denied: User does not own the project');
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      message: 'Deployment fetched successfully',
      data: {
        deployment
      }
    });
  } catch (error) {
    console.error('Error fetching deployment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deployment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/deployments/project/:projectId
// @desc    Get deployments for a specific project
// @access  Private
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      owner: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const deployments = await Deployment.findByProject(req.params.projectId, limit);

    res.json({
      success: true,
      message: 'Project deployments fetched successfully',
      data: {
        deployments
      }
    });
  } catch (error) {
    console.error('Error fetching project deployments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project deployments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/deployments/:id/status
// @desc    Update deployment status (for internal use)
// @access  Private
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, errorMessage } = req.body;

    if (!['pending', 'building', 'success', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const deployment = await Deployment.findById(req.params.id)
      .populate('project');

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }

    // Check if user owns the project
    if (deployment.project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await deployment.updateStatus(status, errorMessage);

    res.json({
      success: true,
      message: 'Deployment status updated successfully',
      data: {
        deployment
      }
    });
  } catch (error) {
    console.error('Error updating deployment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update deployment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/deployments/:id/logs
// @desc    Add log to deployment
// @access  Private
router.post('/:id/logs', authenticateToken, async (req, res) => {
  try {
    const { level, message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Log message is required'
      });
    }

    const deployment = await Deployment.findById(req.params.id)
      .populate('project');

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }

    // Check if user owns the project
    if (deployment.project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await deployment.addLog(level || 'info', message);

    res.json({
      success: true,
      message: 'Log added successfully'
    });
  } catch (error) {
    console.error('Error adding deployment log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add deployment log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/deployments/:id
// @desc    Delete deployment
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id)
      .populate('project');

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }

    // Check if user owns the project
    if (deployment.project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get deployment details before deletion for cleanup
    const deploymentToDelete = await Deployment.findById(req.params.id);

    // If this is a Node.js deployment with containers, clean them up
    if (deploymentToDelete && deploymentToDelete.containerId) {
      try {
        // Stop and remove the container
        await new Promise((resolve, reject) => {
          exec(`sudo docker stop ${deploymentToDelete.containerId} && sudo docker rm ${deploymentToDelete.containerId}`, (error, stdout, stderr) => {
            if (error) {
              console.error(`Failed to stop/remove container ${deploymentToDelete.containerId}:`, error);
            } else {
              console.log(`Cleaned up container: ${deploymentToDelete.containerId}`);
            }
            resolve(); // Continue even if cleanup fails
          });
        });

        // Remove the Docker image
        if (deploymentToDelete.containerName) {
          const imageName = `deployease-${deploymentToDelete.containerName.split('-').slice(1).join('-')}`;
          await new Promise((resolve, reject) => {
            exec(`sudo docker rmi ${imageName}`, (error, stdout, stderr) => {
              if (error) {
                console.error(`Failed to remove image ${imageName}:`, error);
              } else {
                console.log(`Removed Docker image: ${imageName}`);
              }
              resolve(); // Continue even if cleanup fails
            });
          });
        }
      } catch (cleanupError) {
        console.error('Error during container cleanup:', cleanupError);
        // Don't fail the deletion if cleanup fails
      }
    }

    await Deployment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Deployment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting deployment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete deployment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;