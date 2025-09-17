const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project owner is required']
  },
  repositoryUrl: {
    type: String,
    required: [true, 'Repository URL is required'],
    trim: true
  },
  repositoryName: {
    type: String,
    required: [true, 'Repository name is required'],
    trim: true
  },
  repositoryOwner: {
    type: String,
    required: [true, 'Repository owner is required'],
    trim: true
  },
  branch: {
    type: String,
    default: 'main',
    trim: true
  },
  projectType: {
    type: String,
    enum: ['static', 'node', 'react'],
    default: 'node'
  },
  buildCommand: {
    type: String,
    default: 'npm run build',
    trim: true
  },
  outputDir: {
    type: String,
    default: 'dist',
    trim: true
  },
  customDomain: {
    type: String,
    trim: true,
    lowercase: true
  },
  subdomain: {
    type: String,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastDeployment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deployment'
  }
}, {
  timestamps: true
});

// Indexes
projectSchema.index({ owner: 1 });
projectSchema.index({ repositoryUrl: 1 });
projectSchema.index({ customDomain: 1 }, {
  unique: true,
  partialFilterExpression: { customDomain: { $exists: true } }
});
projectSchema.index({ subdomain: 1 }, {
  unique: true,
  partialFilterExpression: { subdomain: { $exists: true } }
});

// Instance method to get project info
projectSchema.methods.toJSON = function() {
  const projectObject = this.toObject();
  return projectObject;
};

// Static method to find projects by owner
projectSchema.statics.findByOwner = function(ownerId) {
  return this.find({ owner: ownerId, status: 'active' }).populate('owner', 'username firstName lastName').populate('lastDeployment');
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;