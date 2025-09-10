import { useEffect, useState } from 'react';
import { useToast } from '../contexts/ToastContext';

const AuthError = () => {
  const { showError } = useToast();
  const [errorMessage, setErrorMessage] = useState('Authentication failed');

  useEffect(() => {
    // Get error from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const message = urlParams.get('message');

    let displayMessage = 'Authentication failed';

    // Check if this is an email verification error
    if (message) {
      if (message.includes('already verified')) {
        displayMessage = 'Your email is already verified! You can now log in.';
      } else {
        displayMessage = message;
      }
    } else {
      // Handle OAuth error codes
      switch (error) {
        case 'authentication_failed':
          displayMessage = 'Authentication was cancelled or failed';
          break;
        case 'server_error':
          displayMessage = 'Server error during authentication';
          break;
        case 'access_denied':
          displayMessage = 'Access was denied by the OAuth provider';
          break;
        default:
          displayMessage = 'An unknown error occurred during authentication';
      }
    }

    setErrorMessage(displayMessage);

    // Only show toast for actual errors, not for already verified emails
    if (!message || !message.includes('already verified')) {
      showError(displayMessage);
    }

    // Auto-redirect to home after 5 seconds (or 3 seconds for already verified)
    const redirectDelay = message && message.includes('already verified') ? 3000 : 5000;
    const timer = setTimeout(() => {
      window.location.href = '/';
    }, redirectDelay);

    return () => clearTimeout(timer);
  }, [showError]);

  const handleRetry = () => {
    window.location.href = '/';
  };

  const isAlreadyVerified = message && message.includes('already verified');

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${isAlreadyVerified ? 'from-green-50 to-blue-50' : 'from-red-50 to-orange-50'}`}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className={`w-16 h-16 ${isAlreadyVerified ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
          {isAlreadyVerified ? (
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {isAlreadyVerified ? 'Already Verified!' : 'Authentication Failed'}
        </h2>

        <p className="text-gray-600 mb-6">
          {errorMessage}
        </p>

        <div className="space-y-4">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
          >
            {isAlreadyVerified ? 'Go to Login' : 'Try Again'}
          </button>

          <p className="text-sm text-gray-500">
            Redirecting to home page in {isAlreadyVerified ? '3' : '5'} seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthError;
