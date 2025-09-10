import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const OTPVerification = ({ email, userId, onVerificationSuccess, onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const { resendOTP } = useAuth();

  // Resend verification link
  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const result = await resendOTP(userId);
      showSuccess('New verification link sent to your email');
    } catch (error) {
      console.error('Resend verification link error:', error);
      showError(error.message || 'Failed to resend verification link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
        <p className="text-gray-600 text-sm">
          We've sent a 6-digit verification code to
        </p>
        <p className="text-blue-600 font-semibold">{email}</p>
      </div>

      {/* Verification Message */}
      <div className="mb-6">
        <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
          <p className="text-gray-600 text-sm mb-4">
            We've sent a verification link to <strong>{email}</strong>
          </p>
          <p className="text-gray-500 text-xs">
            Click the link in the email to verify your account. The link will expire in 24 hours.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors disabled:opacity-50"
          >
            ← Back to signup
          </button>

          <button
            onClick={handleResendOTP}
            disabled={isLoading}
            className={`text-sm font-medium transition-colors ${
              !isLoading
                ? 'text-blue-600 hover:text-blue-700'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Sending...' : 'Resend Link'}
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          Didn't receive the email? Check your spam folder or try resending the verification link.
        </p>
      </div>
    </div>
  );
};

export default OTPVerification;
