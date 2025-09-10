const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required']
  },
  status: {
    type: String,
    enum: ['pending', 'building', 'success', 'failed'],
    default: 'pending'
  },
  commitSha: {
    type: String,
    trim: true
  },
  commitMessage: {
    type: String,
    trim: true
  },
  branch: {
    type: String,
    trim: true
  },
  buildLogs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    level: {
      type: String,
      enum: ['info', 'warn', 'error'],
      default: 'info'
    },
    message: {
      type: String,
      required: true
    }
  }],
  deployedUrl: {
    type: String,
    trim: true
  },
  buildTime: {
    type: Number, // in milliseconds
    default: 0
  },
  errorMessage: {
    type: String,
    trim: true
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
deploymentSchema.index({ project: 1, createdAt: -1 });
deploymentSchema.index({ status: 1 });

// Instance method to add log
deploymentSchema.methods.addLog = function(level, message) {
  this.buildLogs.push({
    level,
    message
  });
  return this.save();
};

// Instance method to update status
deploymentSchema.methods.updateStatus = function(status, errorMessage = null) {
  this.status = status;
  if (errorMessage) {
    this.errorMessage = errorMessage;
  }
  if (status === 'success' || status === 'failed') {
    this.buildTime = Date.now() - this.createdAt.getTime();
  }
  return this.save();
};

// Static method to find deployments by project
deploymentSchema.statics.findByProject = function(projectId, limit = 10) {
  return this.find({ project: projectId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('triggeredBy', 'username firstName lastName');
};

// Static method to get latest deployment for project
deploymentSchema.statics.getLatestForProject = function(projectId) {
  return this.findOne({ project: projectId })
    .sort({ createdAt: -1 })
    .populate('triggeredBy', 'username firstName lastName');
};

const Deployment = mongoose.model('Deployment', deploymentSchema);

module.exports = Deployment;