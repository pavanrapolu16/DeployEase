const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const githubService = require('../services/githubService');

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

module.exports = router;