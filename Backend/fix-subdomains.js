const mongoose = require('mongoose');
const Project = require('./models/Project');

async function fixSubdomains() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deployease', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Find all projects without subdomain
    const projectsWithoutSubdomain = await Project.find({
      subdomain: { $exists: false },
      status: 'active'
    });

    console.log(`Found ${projectsWithoutSubdomain.length} projects without subdomain`);

    for (const project of projectsWithoutSubdomain) {
      // Generate normalized name with owner
      const baseNormalized = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^[-]+|[-]+$/g, '');
      const normalizedName = `${baseNormalized}-${project.repositoryOwner.toLowerCase()}`;

      // Check if this subdomain already exists
      const existing = await Project.findOne({
        subdomain: normalizedName,
        status: 'active'
      });

      if (existing) {
        console.log(`Conflict for project ${project.name}: subdomain ${normalizedName} already exists`);
        // Handle conflict - maybe add a suffix
        const conflictResolved = `${normalizedName}-${project._id.toString().slice(-4)}`;
        project.subdomain = conflictResolved;
        console.log(`Resolved to: ${conflictResolved}`);
      } else {
        project.subdomain = normalizedName;
      }

      await project.save();
      console.log(`Updated project ${project.name} with subdomain: ${project.subdomain}`);
    }

    console.log('Subdomain fix completed');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing subdomains:', error);
    process.exit(1);
  }
}

fixSubdomains();