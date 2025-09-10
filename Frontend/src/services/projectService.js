import { apiService } from './apiService';

export const projectService = {
  // Get user's projects
  getUserProjects: async () => {
    try {
      const response = await apiService.get('/projects');
      return response.data.projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw new Error(error.message || 'Failed to fetch projects');
    }
  },

  // Get project by ID
  getProject: async (projectId) => {
    try {
      const response = await apiService.get(`/projects/${projectId}`);
      return response.data.project;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw new Error(error.message || 'Failed to fetch project');
    }
  },

  // Create new project
  createProject: async (projectData) => {
    try {
      const response = await apiService.post('/projects', projectData);
      return response.data.project;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error(error.message || 'Failed to create project');
    }
  },

  // Update project
  updateProject: async (projectId, updateData) => {
    try {
      const response = await apiService.put(`/projects/${projectId}`, updateData);
      return response.data.project;
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error(error.message || 'Failed to update project');
    }
  },

  // Delete project
  deleteProject: async (projectId) => {
    try {
      await apiService.delete(`/projects/${projectId}`);
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error(error.message || 'Failed to delete project');
    }
  },

  // Trigger deployment for project
  deployProject: async (projectId) => {
    try {
      const response = await apiService.post(`/projects/${projectId}/deploy`);
      return response.data.deployment;
    } catch (error) {
      console.error('Error triggering deployment:', error);
      throw new Error(error.message || 'Failed to trigger deployment');
    }
  },
};