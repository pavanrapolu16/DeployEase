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
    const userProjects = await Project.find({ owner: req.user.userId }).select('_id');
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

// @route   GET /api/deployments/:id
// @desc    Get deployment by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id)
      .populate('project', 'name repositoryName repositoryOwner owner')
      .populate('triggeredBy', 'username firstName lastName');

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }

    // Check if user owns the project
    if (deployment.project.owner.toString() !== req.user.userId) {
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
      owner: req.user.userId
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
    if (deployment.project.owner.toString() !== req.user.userId) {
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
    if (deployment.project.owner.toString() !== req.user.userId) {
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
    if (deployment.project.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
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