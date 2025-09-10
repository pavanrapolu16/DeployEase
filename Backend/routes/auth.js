const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const otpUtils = require('../utils/otpUtils');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Validation
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName
    });

    await user.save();

    // Send verification email with link
    try {
      const verificationToken = otpUtils.generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with verification token
      await User.findByIdAndUpdate(user._id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      });

      const emailResult = await otpUtils.sendVerificationLinkToUser(user._id, user.email, user.firstName, verificationToken);

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification link.',
        data: {
          userId: user._id,
          email: user.email,
          requiresVerification: true,
          previewUrl: emailResult.previewUrl // For development only
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);

      // If email fails, still create user but inform about the issue
      res.status(201).json({
        success: true,
        message: 'User registered successfully, but verification email failed to send. Please contact support.',
        data: {
          userId: user._id,
          email: user.email,
          requiresVerification: true,
          emailError: true
        }
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    // Validation
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required'
      });
    }

    // Find user by email or username
    const user = await User.findByEmailOrUsername(identifier);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address before logging in',
        requiresVerification: true,
        userId: user._id
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, username } = req.body;
    const userId = req.user._id;

    // Check if username is taken by another user
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(username && { username })
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  // In a JWT implementation, logout is typically handled client-side
  // by removing the token from storage. This endpoint is for consistency.
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @route   GET /api/auth/verify-email
// @desc    Verify email with token (for clickable links)
// @access  Public
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const result = await otpUtils.verifyEmailWithToken(token);

    if (result.success) {
      // Redirect to frontend with success message
      const successMessage = 'Email verified successfully! You can now log in.';
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/success?message=${encodeURIComponent(successMessage)}`;
      res.redirect(redirectUrl);
    } else {
      // Redirect to frontend with error message
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/error?message=${encodeURIComponent(result.message)}`;
      res.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('Email verification error:', error);
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/error?message=${encodeURIComponent('Server error during email verification')}`;
    res.redirect(redirectUrl);
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email with OTP (fallback for backward compatibility)
// @access  Public
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required'
      });
    }

    const result = await otpUtils.verifyOTP(userId, otp);

    if (result.success) {
      // Get updated user
      const user = await User.findById(userId).select('-password');

      // Generate token for verified user
      const token = generateToken(user._id);

      res.json({
        success: true,
        message: result.message,
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified
          }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for email verification
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await otpUtils.resendOTP(userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'OTP resent successfully',
        data: {
          previewUrl: result.previewUrl // For development
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending OTP'
    });
  }
});

// @route   GET /api/auth/verification-status/:userId
// @desc    Get email verification status
// @access  Public
router.get('/verification-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const status = await otpUtils.getOTPStatus(userId);

    if (!status.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        isEmailVerified: status.isEmailVerified,
        hasOTP: status.hasOTP,
        isExpired: status.isExpired,
        expiresAt: status.expiresAt
      }
    });
  } catch (error) {
    console.error('Verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking verification status'
    });
  }
});

module.exports = router;
