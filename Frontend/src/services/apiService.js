// General API service for DeployEase backend
const API_BASE_URL = '/api';

// Helper function to make authenticated API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('deployease_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

export const apiService = {
  // Generic GET request
  get: (endpoint, params = {}) => {
    const urlParams = new URLSearchParams(params);
    const queryString = urlParams.toString();
    return apiRequest(`${endpoint}${queryString ? `?${queryString}` : ''}`);
  },

  // Generic POST request
  post: (endpoint, data = {}) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Generic PUT request
  put: (endpoint, data = {}) => {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Generic DELETE request
  delete: (endpoint) => {
    return apiRequest(endpoint, {
      method: 'DELETE',
    });
  },
};