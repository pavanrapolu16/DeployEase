const subdomainHandler = require('./middleware/subdomain');
const Project = require('./models/Project');
const Deployment = require('./models/Deployment');
const mongoose = require('mongoose');
require('dotenv').config();

// Mock request/response objects for testing
const createMockReq = (hostname, path = '/') => ({
  headers: { host: hostname },
  path: path
});

const createMockRes = () => {
  const res = {
    status: (code) => ({ send: (msg) => console.log(`Response: ${code} - ${msg}`) }),
    send: (msg) => console.log(`Response: ${msg}`),
    sendFile: (file) => console.log(`Serving file: ${file}`)
  };
  return res;
};

const createMockNext = () => {
  console.log('Next middleware called');
};

// Test function
async function testSubdomainRouting() {
  console.log('🧪 Testing DeployEase Subdomain Routing\n');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deployease');
    console.log('✅ Connected to database\n');

    // Test cases
    const testCases = [
      {
        name: 'Main domain request',
        hostname: 'deployease.in',
        expected: 'Should call next()'
      },
      {
        name: 'Localhost request',
        hostname: 'localhost:5000',
        expected: 'Should call next()'
      },
      {
        name: 'Invalid subdomain',
        hostname: 'invalid.deployease.in',
        expected: 'Should return 404'
      }
    ];

    for (const testCase of testCases) {
      console.log(`Test: ${testCase.name}`);
      console.log(`Host: ${testCase.hostname}`);
      console.log(`Expected: ${testCase.expected}`);

      const req = createMockReq(testCase.hostname);
      const res = createMockRes();
      const next = createMockNext();

      await subdomainHandler(req, res, next);
      console.log('---\n');
    }

    // Test with a real project (if exists)
    const projects = await Project.find({ status: 'active' }).limit(1);
    if (projects.length > 0) {
      const project = projects[0];
      console.log(`Testing with real project: ${project.name}`);

      const hostname = `${project.name}.deployease.in`;
      const req = createMockReq(hostname);
      const res = createMockRes();
      const next = createMockNext();

      await subdomainHandler(req, res, next);
      console.log('---\n');
    } else {
      console.log('No active projects found for testing\n');
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
  }
}

// Run test if called directly
if (require.main === module) {
  testSubdomainRouting();
}

module.exports = { testSubdomainRouting };