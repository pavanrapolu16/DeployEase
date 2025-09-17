const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');
const githubService = require('../services/githubService');
const deploymentService = require('../services/deploymentService');

const router = express.Router();

// @route   GET /api/github/repos
// @desc    Get user's GitHub repositories
// @access  Private
router.get('/repos', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'GitHub access token not found. Please reconnect your GitHub account.'
      });
    }

    // Validate token first
    try {
      await githubService.validateToken(user.accessToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid GitHub access token. Please reconnect your GitHub account.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 30;

    const repos = await githubService.getUserRepos(user.accessToken, page, perPage);

    res.json({
      success: true,
      message: 'Repositories fetched successfully',
      data: {
        repositories: repos,
        pagination: {
          page,
          perPage,
          hasMore: repos.length === perPage
        }
      }
    });
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch repositories from GitHub',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/github/repos/:owner/:repo
// @desc    Get repository details
// @access  Public for public repos, Private for private repos
router.get('/repos/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;

    let accessToken = null;

    // If user is authenticated and has token, use it (for private repos)
    if (req.user && req.user._id) {
      const user = await User.findById(req.user._id);
      if (user && user.accessToken) {
        accessToken = user.accessToken;
      }
    }

    const repoDetails = await githubService.getRepoDetails(owner, repo, accessToken);

    // Check if repo is private and user doesn't have access
    if (repoDetails.isPrivate && !accessToken) {
      return res.status(403).json({
        success: false,
        message: 'This is a private repository. Please connect your GitHub account to access it.'
      });
    }

    res.json({
      success: true,
      message: 'Repository details fetched successfully',
      data: {
        repository: repoDetails
      }
    });
  } catch (error) {
    console.error('Error fetching repo details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch repository details from GitHub',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/github/repos/:owner/:repo/branches
// @desc    Get repository branches
// @access  Private
router.get('/repos/:owner/:repo/branches', authenticateToken, async (req, res) => {
  try {
    const { owner, repo } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'GitHub access token not found. Please reconnect your GitHub account.'
      });
    }

    const branches = await githubService.getRepoBranches(owner, repo, user.accessToken);

    res.json({
      success: true,
      message: 'Repository branches fetched successfully',
      data: {
        branches
      }
    });
  } catch (error) {
    console.error('Error fetching repo branches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch repository branches from GitHub',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/github/repos/:owner/:repo/contents
// @desc    Get repository contents
// @access  Private
router.get('/repos/:owner/:repo/contents', authenticateToken, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const path = req.query.path || '';

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'GitHub access token not found. Please reconnect your GitHub account.'
      });
    }

    const contents = await githubService.getRepoContents(owner, repo, path, user.accessToken);

    res.json({
      success: true,
      message: 'Repository contents fetched successfully',
      data: {
        contents,
        path
      }
    });
  } catch (error) {
    console.error('Error fetching repo contents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch repository contents from GitHub',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/github/search/repos
// @desc    Search public GitHub repositories
// @access  Public
router.get('/search/repos', async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Use GitHub search API
    const response = await axios.get(`${githubService.baseURL}/search/repositories`, {
      params: {
        q: query.trim(),
        page,
        per_page: Math.min(perPage, 30), // GitHub search API limit
        sort: 'stars',
        order: 'desc'
      },
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DeployEase-App'
      }
    });

    const repos = response.data.items.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      cloneUrl: repo.clone_url,
      sshUrl: repo.ssh_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      isPrivate: repo.private,
      isFork: repo.fork,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      defaultBranch: repo.default_branch,
      topics: repo.topics || []
    }));

    res.json({
      success: true,
      message: 'Repositories searched successfully',
      data: {
        repositories: repos,
        totalCount: response.data.total_count,
        pagination: {
          page,
          perPage,
          hasMore: response.data.total_count > page * perPage
        }
      }
    });
  } catch (error) {
    console.error('Error searching GitHub repos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search repositories from GitHub',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/github/user
// @desc    Get GitHub user info
// @access  Private
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'GitHub access token not found. Please reconnect your GitHub account.'
      });
    }

    const githubUser = await githubService.validateToken(user.accessToken);

    res.json({
      success: true,
      message: 'GitHub user info fetched successfully',
      data: {
        githubUser,
        isConnected: true
      }
    });
  } catch (error) {
    console.error('Error fetching GitHub user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GitHub user info',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// @route   POST /api/github/webhook
// @desc    Handle GitHub webhooks for automatic deployments
// @access  Public (but verified with signature)
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    const payload = JSON.stringify(req.body);

    console.log('Webhook received:', {
      event,
      signature: signature ? 'present' : 'missing',
      hasBody: !!req.body,
      repository: req.body?.repository?.full_name,
      ref: req.body?.ref
    });

    // Skip signature verification for ping events
    if (event !== 'ping') {
      // Verify webhook signature (implement signature verification)
      if (!verifyWebhookSignature(payload, signature)) {
        console.log('Webhook signature verification failed');
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }

      console.log('Webhook signature verified successfully');
    } else {
      console.log('Skipping signature verification for ping event');
    }

    if (event === 'push') {
      const { repository, ref, commits } = req.body;

      console.log('Processing push event:', {
        repository: repository.full_name,
        ref,
        defaultBranch: repository.default_branch,
        commitsCount: commits?.length || 0
      });

      // Only trigger on main/master branch pushes
      if (ref === `refs/heads/${repository.default_branch}`) {
        console.log('Push is to default branch, looking for matching projects...');

        // Find projects that use this repository
        const projects = await Project.find({
          repositoryUrl: repository.clone_url,
          branch: repository.default_branch
        });

        console.log(`Found ${projects.length} matching projects:`, projects.map(p => p.name));

        for (const project of projects) {
          try {
            // Check if there's already an ongoing deployment for this project
            const existingDeployment = await Deployment.findOne({
              project: project._id,
              status: { $in: ['pending', 'building'] }
            });

            if (existingDeployment) {
              console.log(`Skipping deployment for project ${project.name} - deployment already in progress`);
              continue;
            }

            // Create new deployment
            const deployment = new Deployment({
              project: project._id,
              status: 'pending',
              buildLogs: []
            });
            await deployment.save();

            // Update project's last deployment
            project.lastDeployment = deployment._id;
            await project.save();

            // Trigger deployment asynchronously
            deploymentService.executeDeployment(deployment._id);

            console.log(`Triggered deployment for project: ${project.name}`);
          } catch (error) {
            console.error(`Failed to trigger deployment for project ${project.name}:`, error);
          }
        }
      } else {
        console.log('Push is not to default branch, skipping deployment trigger');
      }
    } else {
      console.log(`Ignoring non-push event: ${event}`);
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to verify webhook signature
function verifyWebhookSignature(payload, signature) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('GITHUB_WEBHOOK_SECRET not set, skipping signature verification');
    return true;
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const expectedSignature = `sha256=${hmac.digest('hex')}`;

  console.log('Webhook signature verification:');
  console.log('Received signature:', signature);
  console.log('Expected signature:', expectedSignature);

  const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  console.log('Signature valid:', isValid);

  return isValid;
}

module.exports = router;