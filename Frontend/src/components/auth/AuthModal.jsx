import { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import OTPVerification from "./OTPVerification";
import { useAuth } from "../../contexts/AuthContext";

const AuthModal = ({ isOpen, onClose, mode, onModeChange }) => {
  const { verifyEmail } = useAuth();
  const [verificationData, setVerificationData] = useState(null);
  const [currentStep, setCurrentStep] = useState('auth'); // 'auth' or 'verification'

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle successful registration (show verification step)
  const handleRegistrationSuccess = (data) => {
    setVerificationData(data);
    setCurrentStep('verification');
  };

  // Handle successful verification (redirect to dashboard)
  const handleVerificationSuccess = (data) => {
    setCurrentStep('auth');
    setVerificationData(null);
    onClose();

    // Redirect to dashboard after successful verification
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  };

  // Handle back to signup
  const handleBackToSignup = () => {
    setCurrentStep('auth');
    setVerificationData(null);
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('auth');
      setVerificationData(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#f3f4f6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>

        {/* Content based on current step */}
        {currentStep === 'verification' && verificationData ? (
          <OTPVerification
            email={verificationData.email}
            userId={verificationData.userId}
            onVerificationSuccess={handleVerificationSuccess}
            onBack={handleBackToSignup}
          />
        ) : (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#3b82f6',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                D
              </div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0 0 8px 0',
                color: '#1f2937'
              }}>
                {mode === 'login' ? 'Welcome Back!' : 'Join DeployEase'}
              </h2>
              <p style={{
                color: '#6b7280',
                fontSize: '14px',
                margin: 0
              }}>
                {mode === 'login' ? 'Sign in to your dashboard' : 'Start deploying for free'}
              </p>
            </div>

            {/* Form Content */}
            <div>
              {mode === 'login' ? (
                <LoginForm onClose={onClose} />
              ) : (
                <SignupForm
                  onClose={onClose}
                  onRegistrationSuccess={handleRegistrationSuccess}
                />
              )}
            </div>

            {/* Mode Switch */}
            <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                {mode === 'login' ? "New to DeployEase?" : "Already have an account?"}
              </p>
              <button
                onClick={() => onModeChange(mode === 'login' ? 'signup' : 'login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {mode === 'login' ? 'Create an account' : 'Sign in instead'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
