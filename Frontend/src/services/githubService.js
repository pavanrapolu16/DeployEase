import { apiService } from './apiService';

export const githubService = {
  // Get user's GitHub repositories
  getUserRepos: async (page = 1, perPage = 30) => {
    try {
      const response = await apiService.get('/github/repos', { page, per_page: perPage });
      return response.data.repositories;
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
      throw new Error(error.message || 'Failed to fetch repositories');
    }
  },

  // Get repository details
  getRepoDetails: async (owner, repo) => {
    try {
      const response = await apiService.get(`/github/repos/${owner}/${repo}`);
      return response.data.repository;
    } catch (error) {
      console.error('Error fetching repo details:', error);
      throw new Error(error.message || 'Failed to fetch repository details');
    }
  },

  // Search public repositories
  searchRepos: async (query, page = 1, perPage = 10) => {
    try {
      const response = await apiService.get('/github/search/repos', {
        q: query,
        page,
        per_page: perPage
      });
      return response.data.repositories;
    } catch (error) {
      console.error('Error searching repos:', error);
      throw new Error(error.message || 'Failed to search repositories');
    }
  },

  // Get GitHub user info
  getUserInfo: async () => {
    try {
      const response = await apiService.get('/github/user');
      return response.data.githubUser;
    } catch (error) {
      console.error('Error fetching GitHub user:', error);
      throw new Error(error.message || 'Failed to fetch GitHub user info');
    }
  },
};