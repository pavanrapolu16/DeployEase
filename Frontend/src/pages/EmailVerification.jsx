import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    const handleVerification = async () => {
      const token = searchParams.get('token');
      const message = searchParams.get('message');

      // If we have a message, it means backend already processed and redirected
      if (message) {
        if (message.includes('successfully')) {
          setVerificationStatus('success');
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setVerificationStatus('error');
        }
        setIsVerifying(false);
        return;
      }

      // If we have a token but no message, we need to verify it
      if (token) {
        try {
          const response = await fetch(`/api/auth/verify-email?token=${token}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.redirected) {
            // Backend redirected us, follow the redirect
            window.location.href = response.url;
            return;
          }

          const data = await response.json();

          if (data.success) {
            setVerificationStatus('success');
            setTimeout(() => {
              navigate('/');
            }, 3000);
          } else {
            setVerificationStatus('error');
          }
        } catch (error) {
          console.error('Verification error:', error);
          setVerificationStatus('error');
        } finally {
          setIsVerifying(false);
        }
      } else {
        // No token or message
        setVerificationStatus('error');
        setIsVerifying(false);
      }
    };

    handleVerification();
  }, [searchParams, navigate]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifying Your Email</h2>
          <p className="text-gray-600">Please wait while we verify your email address...</p>
        </motion.div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verified!</h2>
          <p className="text-gray-600 mb-6">Your email has been successfully verified. You can now log in to your account.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
          <p className="text-gray-600 mb-6">The verification link is invalid or has expired. Please try signing up again.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Signup
          </button>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default EmailVerification;