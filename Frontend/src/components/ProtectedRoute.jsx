import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const ProtectedRoute = ({ children, fallback = null, showLoginPrompt = true }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading...</h3>
          <p className="text-gray-500">Checking authentication status</p>
        </motion.div>
      </div>
    );
  }

  // If user is authenticated, render the protected content
  if (isAuthenticated && user) {
    return children;
  }

  // If fallback component is provided, render it
  if (fallback) {
    return fallback;
  }

  // Default: Show login prompt
  if (showLoginPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 px-4">
        <motion.div
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h2>
          
          <p className="text-gray-600 mb-8">
            You need to be logged in to access this page. Please sign in to continue.
          </p>
          
          <div className="space-y-4">
            <motion.button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign In
            </motion.button>
            
            <motion.button
              onClick={() => window.location.href = '/signup'}
              className="w-full border-2 border-primary-200 text-primary-700 py-3 px-6 rounded-lg font-semibold hover:bg-primary-50 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create Account
            </motion.button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <button
                onClick={() => window.location.href = '/signup'}
                className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
              >
                Sign up for free
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // If showLoginPrompt is false, return null
  return null;
};

// Higher-order component version for easier usage
export const withAuth = (Component, options = {}) => {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Hook for checking authentication in components
export const useRequireAuth = (redirectTo = '/login') => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (!isLoading && !isAuthenticated) {
    window.location.href = redirectTo;
    return { isAuthenticated: false, user: null, isLoading: false };
  }

  return { isAuthenticated, user, isLoading };
};

export default ProtectedRoute;
