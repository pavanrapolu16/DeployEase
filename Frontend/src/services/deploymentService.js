import { apiService } from './apiService';

export const deploymentService = {
  // Get user's deployments
  getUserDeployments: async (page = 1, limit = 10) => {
    try {
      const response = await apiService.get('/deployments', { page, limit });
      return response.data;
    } catch (error) {
      console.error('Error fetching deployments:', error);
      throw new Error(error.message || 'Failed to fetch deployments');
    }
  },

  // Get deployment by ID
  getDeployment: async (deploymentId) => {
    try {
      const response = await apiService.get(`/deployments/${deploymentId}`);
      return response.data.deployment;
    } catch (error) {
      console.error('Error fetching deployment:', error);
      throw new Error(error.message || 'Failed to fetch deployment');
    }
  },

  // Get deployments for a specific project
  getProjectDeployments: async (projectId, limit = 10) => {
    try {
      const response = await apiService.get(`/deployments/project/${projectId}`, { limit });
      return response.data.deployments;
    } catch (error) {
      console.error('Error fetching project deployments:', error);
      throw new Error(error.message || 'Failed to fetch project deployments');
    }
  },

  // Update deployment status
  updateDeploymentStatus: async (deploymentId, status, errorMessage = null) => {
    try {
      const response = await apiService.put(`/deployments/${deploymentId}/status`, {
        status,
        errorMessage
      });
      return response.data.deployment;
    } catch (error) {
      console.error('Error updating deployment status:', error);
      throw new Error(error.message || 'Failed to update deployment status');
    }
  },

  // Add log to deployment
  addDeploymentLog: async (deploymentId, level, message) => {
    try {
      await apiService.post(`/deployments/${deploymentId}/logs`, {
        level,
        message
      });
      return true;
    } catch (error) {
      console.error('Error adding deployment log:', error);
      throw new Error(error.message || 'Failed to add deployment log');
    }
  },

  // Delete deployment
  deleteDeployment: async (deploymentId) => {
    try {
      await apiService.delete(`/deployments/${deploymentId}`);
      return true;
    } catch (error) {
      console.error('Error deleting deployment:', error);
      throw new Error(error.message || 'Failed to delete deployment');
    }
  },
};