const axios = require('axios');

class GitHubService {
  constructor() {
    this.baseURL = 'https://api.github.com';
  }

  /**
   * Get user repositories
   * @param {string} accessToken - GitHub OAuth access token
   * @param {number} page - Page number (default: 1)
   * @param {number} perPage - Repos per page (default: 30, max: 100)
   * @returns {Promise<Array>} Array of repository objects
   */
  async getUserRepos(accessToken, page = 1, perPage = 30) {
    try {
      const response = await axios.get(`${this.baseURL}/user/repos`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DeployEase-App'
        },
        params: {
          page,
          per_page: Math.min(perPage, 100), // GitHub API limit
          sort: 'updated',
          type: 'owner' // Only repos owned by the user
        }
      });

      return response.data.map(repo => ({
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
    } catch (error) {
      console.error('Error fetching GitHub repos:', error.response?.data || error.message);
      throw new Error('Failed to fetch repositories from GitHub');
    }
  }

  /**
   * Get repository details
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} accessToken - GitHub OAuth access token (optional for public repos)
   * @returns {Promise<Object>} Repository details
   */
  async getRepoDetails(owner, repo, accessToken = null) {
    try {
      const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DeployEase-App'
      };

      // Add authorization header only if token is provided
      if (accessToken) {
        headers['Authorization'] = `token ${accessToken}`;
      }

      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}`, {
        headers
      });

      const data = response.data;
      return {
        id: data.id,
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        url: data.html_url,
        cloneUrl: data.clone_url,
        sshUrl: data.ssh_url,
        language: data.language,
        stars: data.stargazers_count,
        forks: data.forks_count,
        isPrivate: data.private,
        isFork: data.fork,
        defaultBranch: data.default_branch,
        topics: data.topics || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        size: data.size,
        hasIssues: data.has_issues,
        hasProjects: data.has_projects,
        hasWiki: data.has_wiki,
        hasPages: data.has_pages,
        hasDownloads: data.has_downloads
      };
    } catch (error) {
      console.error('Error fetching repo details:', error.response?.data || error.message);
      throw new Error('Failed to fetch repository details from GitHub');
    }
  }

  /**
   * Get repository branches
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} accessToken - GitHub OAuth access token
   * @returns {Promise<Array>} Array of branch objects
   */
  async getRepoBranches(owner, repo, accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/branches`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DeployEase-App'
        }
      });

      return response.data.map(branch => ({
        name: branch.name,
        sha: branch.commit.sha,
        protected: branch.protected
      }));
    } catch (error) {
      console.error('Error fetching repo branches:', error.response?.data || error.message);
      throw new Error('Failed to fetch repository branches from GitHub');
    }
  }

  /**
   * Get repository contents (for detecting build configuration)
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} path - Path to get contents for (default: root)
   * @param {string} accessToken - GitHub OAuth access token
   * @returns {Promise<Array>} Array of file/directory objects
   */
  async getRepoContents(owner, repo, path = '', accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DeployEase-App'
        }
      });

      return response.data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type, // 'file' or 'dir'
        size: item.size,
        downloadUrl: item.download_url,
        url: item.url
      }));
    } catch (error) {
      console.error('Error fetching repo contents:', error.response?.data || error.message);
      throw new Error('Failed to fetch repository contents from GitHub');
    }
  }

  /**
   * Validate access token
   * @param {string} accessToken - GitHub OAuth access token
   * @returns {Promise<Object>} User info if token is valid
   */
  async validateToken(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/user`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DeployEase-App'
        }
      });

      return {
        id: response.data.id,
        login: response.data.login,
        name: response.data.name,
        email: response.data.email,
        avatarUrl: response.data.avatar_url
      };
    } catch (error) {
      console.error('Error validating GitHub token:', error.response?.data || error.message);
      throw new Error('Invalid GitHub access token');
    }
  }

  /**
   * Check if user has admin access to repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} accessToken - GitHub OAuth access token
   * @returns {Promise<boolean>} True if user has admin access
   */
  async checkRepoAdminAccess(owner, repo, accessToken) {
    try {
      console.log(`🔍 Checking admin access for ${owner}/${repo}`);
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DeployEase-App'
        }
      });

      // Check if user has admin permission
      const permissions = response.data.permissions || {};
      console.log(`✅ Repo permissions for ${owner}/${repo}:`, permissions);
      const hasAdmin = permissions.admin === true;
      console.log(`Admin access for ${owner}/${repo}: ${hasAdmin}`);
      return hasAdmin;
    } catch (error) {
      console.error(`❌ Error checking repo permissions for ${owner}/${repo}:`, {
        status: error.response?.status,
        data: error.response?.data
      });
      return false;
    }
  }

  /**
   * Create webhook for repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} accessToken - GitHub OAuth access token
   * @param {string} webhookUrl - URL for webhook
   * @param {string} secret - Webhook secret
   * @returns {Promise<Object>} Webhook details
   */
  async createWebhook(owner, repo, accessToken, webhookUrl, secret) {
    try {
      if (!webhookUrl) {
        throw new Error(`Webhook URL is missing for ${owner}/${repo}`);
      }
      // First check if user has admin access
      const hasAdminAccess = await this.checkRepoAdminAccess(owner, repo, accessToken);
      if (!hasAdminAccess) {
        console.log(`Skipping webhook creation for ${owner}/${repo} - user lacks admin access`);
        return null;
      }
      console.log(`📡 Creating webhook for ${owner}/${repo} → ${webhookUrl}`);
      const response = await axios.post(`${this.baseURL}/repos/${owner}/${repo}/hooks`, {
        name: 'web',
        active: true,
        events: ['push'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: secret
        }
      }, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DeployEase-App'
        }
      });

      console.log('✅ Webhook created:', response.data.id);

      return {
        id: response.data.id,
        url: response.data.url,
        active: response.data.active
      };
    } catch (error) {
      console.error('❌ Error creating webhook:', {
        status: error.response?.status,
        data: error.response?.data
      });
      // console.error('Error creating webhook:', error.response?.data || error.message);
      throw new Error('Failed to create webhook');
    }
  }

  /**
   * Delete webhook
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} hookId - Webhook ID
   * @param {string} accessToken - GitHub OAuth access token
   * @returns {Promise<boolean>} Success status
   */
  async deleteWebhook(owner, repo, hookId, accessToken) {
    try {
      await axios.delete(`${this.baseURL}/repos/${owner}/${repo}/hooks/${hookId}`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DeployEase-App'
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting webhook:', error.response?.data || error.message);
      throw new Error('Failed to delete webhook');
    }
  }
}

module.exports = new GitHubService();