/**
 * Application Configuration
 * Uses environment variables with fallback defaults
 */

const config = {
  // Base domain for subdomain deployments
  BASE_DOMAIN: import.meta.env.VITE_BASE_DOMAIN || 'deployease.app',
  
  // API configuration
  API_BASE_URL: '/api',
  
  // App name
  APP_NAME: 'DeployEase',
};

export default config;
