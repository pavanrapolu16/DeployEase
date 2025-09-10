// Authentication service for DeployEase backend API
const API_BASE_URL = '/api/auth';

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${window.location.origin}${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
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

// Token management
const TOKEN_KEY = 'deployease_token';
const USER_KEY = 'deployease_user';

export const authService = {
  // Get stored token
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get stored user
  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Store token and user
  setAuthData: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Clear stored auth data
  clearAuthData: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = authService.getToken();
    const user = authService.getUser();
    return !!(token && user);
  },

  // User registration (now requires email verification)
  signUpWithEmail: async (userData) => {
    try {
      const response = await apiRequest('/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success) {
        // Registration successful, but requires email verification
        return {
          requiresVerification: response.data.requiresVerification || true,
          userId: response.data.userId,
          email: response.data.email,
          previewUrl: response.data.previewUrl, // For development
          message: response.message
        };
      }

      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  // Verify email with OTP
  verifyEmail: async (userId, otp) => {
    try {
      const response = await apiRequest('/verify-email', {
        method: 'POST',
        body: JSON.stringify({ userId, otp }),
      });

      if (response.success) {
        const { token, user } = response.data;
        authService.setAuthData(token, user);
        return {
          user: {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            provider: 'email'
          },
          token
        };
      }

      throw new Error(response.message || 'Email verification failed');
    } catch (error) {
      throw new Error(error.message || 'Email verification failed');
    }
  },

  // Resend OTP
  resendOTP: async (userId) => {
    try {
      const response = await apiRequest('/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });

      if (response.success) {
        return {
          message: response.message,
          previewUrl: response.data?.previewUrl // For development
        };
      }

      throw new Error(response.message || 'Failed to resend OTP');
    } catch (error) {
      throw new Error(error.message || 'Failed to resend OTP');
    }
  },

  // Get verification status
  getVerificationStatus: async (userId) => {
    try {
      const response = await apiRequest(`/verification-status/${userId}`, {
        method: 'GET',
      });

      if (response.success) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to get verification status');
    } catch (error) {
      throw new Error(error.message || 'Failed to get verification status');
    }
  },

  // User login with email/username and password
  signInWithEmail: async (identifier, password) => {
    try {
      const response = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      if (response.success) {
        const { token, user } = response.data;
        authService.setAuthData(token, user);
        return {
          user: {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            role: user.role,
            lastLogin: user.lastLogin,
            provider: 'email'
          },
          token
        };
      }

      throw new Error(response.message || 'Login failed');
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  },

  // Get user profile (protected route)
  getProfile: async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiRequest('/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.success) {
        const { user } = response.data;
        // Update stored user data
        authService.setAuthData(token, user);
        return {
          user: {
            id: user.id || user._id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            role: user.role,
            provider: 'email'
          }
        };
      }

      throw new Error(response.message || 'Failed to get profile');
    } catch (error) {
      // If token is invalid, clear auth data
      if (error.message.includes('token') || error.message.includes('401')) {
        authService.clearAuthData();
      }
      throw new Error(error.message || 'Failed to get profile');
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiRequest('/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (response.success) {
        const { user } = response.data;
        // Update stored user data
        authService.setAuthData(token, user);
        return {
          user: {
            id: user.id || user._id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            role: user.role,
            provider: 'email'
          }
        };
      }

      throw new Error(response.message || 'Failed to update profile');
    } catch (error) {
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiRequest('/change-password', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.success) {
        return { message: response.message || 'Password changed successfully' };
      }

      throw new Error(response.message || 'Failed to change password');
    } catch (error) {
      throw new Error(error.message || 'Failed to change password');
    }
  },

  // Logout user
  logout: async () => {
    try {
      const token = authService.getToken();
      if (token) {
        // Call logout endpoint (optional, since JWT is stateless)
        await apiRequest('/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error.message);
    } finally {
      // Always clear local auth data
      authService.clearAuthData();
    }
  },

  // OAuth authentication methods
  signInWithGoogle: async () => {
    try {
      // Redirect to Google OAuth
      window.location.href = `${window.location.origin}/api/oauth/google`;
    } catch (error) {
      throw new Error('Failed to initiate Google authentication');
    }
  },

  signInWithGitHub: async () => {
    try {
      // Redirect to GitHub OAuth
      window.location.href = `${window.location.origin}/api/oauth/github`;
    } catch (error) {
      throw new Error('Failed to initiate GitHub authentication');
    }
  },

  // Handle OAuth callback (called from redirect page)
  handleOAuthCallback: async (token, provider) => {
    try {
      if (!token) {
        throw new Error('No authentication token received');
      }

      // Decode token to get user ID
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;

      // Fetch user data
      const response = await fetch(`/api/oauth/user/${userId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get user data');
      }

      const user = data.data.user;
      const userData = {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        provider: provider,
        isEmailVerified: user.isEmailVerified
      };

      // Store auth data
      authService.setAuthData(token, userData);

      return {
        user: userData,
        token: token
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw new Error(error.message || 'OAuth authentication failed');
    }
  },

  // Password reset (placeholder - would need backend implementation)
  resetPassword: async (email) => {
    throw new Error('Password reset not implemented yet. Please contact support.');
  }
};
