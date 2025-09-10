import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { useToast } from '../contexts/ToastContext';

const AuthSuccess = () => {
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      return;
    }

    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const provider = urlParams.get('provider');
        const message = urlParams.get('message');

        // Check if this is an email verification success
        if (message && message.includes('verified successfully')) {
          // This is an email verification success
          showSuccess(message);
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
          setIsProcessing(false);
          return;
        }

        // Handle OAuth callback
        if (!token) {
          throw new Error('No authentication token received');
        }

        // Handle OAuth callback
        const result = await authService.handleOAuthCallback(token, provider);

        console.log('OAuth callback result:', result);

        // Show success message
        showSuccess(`Welcome! Successfully signed in with ${provider === 'google' ? 'Google' : 'GitHub'}`);

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);

      } catch (error) {
        console.error('Callback error:', error);
        showError(error.message || 'Authentication failed');

        // Redirect to home page with error
        setTimeout(() => {
          window.location.href = '/?auth=error';
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {isProcessing ? (
          <>
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Completing Authentication...
            </h2>
            <p className="text-gray-600">
              Please wait while we finish setting up your account.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Success!
            </h2>
            <p className="text-gray-600">
              {(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const message = urlParams.get('message');
                return message && message.includes('verified successfully')
                  ? 'Your email has been verified successfully! Redirecting you to login...'
                  : 'Authentication successful! Redirecting you to the dashboard...';
              })()}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthSuccess;
