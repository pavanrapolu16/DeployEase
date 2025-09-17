const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Google OAuth Routes
// @route   GET /api/oauth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// @route   GET /api/oauth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.OAUTH_FAILURE_REDIRECT}?error=authentication_failed`);
      }

      // Generate JWT token
      const token = generateToken(req.user._id);

      // Redirect to frontend with token
      const redirectUrl = `${process.env.OAUTH_SUCCESS_REDIRECT}?token=${token}&provider=google`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.OAUTH_FAILURE_REDIRECT}?error=server_error`);
    }
  }
);

// GitHub OAuth Routes
// @route   GET /api/oauth/github
// @desc    Initiate GitHub OAuth
// @access  Public
router.get('/github',
  passport.authenticate('github', {
    scope: ['user:email', 'repo', 'admin:repo_hook']
  })
);

// @route   GET /api/oauth/github/callback
// @desc    GitHub OAuth callback
// @access  Public
router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.OAUTH_FAILURE_REDIRECT}?error=authentication_failed`);
      }

      // Generate JWT token
      const token = generateToken(req.user._id);

      // Redirect to frontend with token
      const redirectUrl = `${process.env.OAUTH_SUCCESS_REDIRECT}?token=${token}&provider=github`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      res.redirect(`${process.env.OAUTH_FAILURE_REDIRECT}?error=server_error`);
    }
  }
);

// @route   POST /api/oauth/link-account
// @desc    Link OAuth account to existing user
// @access  Private
router.post('/link-account', async (req, res) => {
  try {
    const { provider, oauthId, email } = req.body;
    
    if (!provider || !oauthId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Provider, OAuth ID, and email are required'
      });
    }

    // Check if OAuth account is already linked
    const existingOAuthUser = await User.findOne({
      oauthProvider: provider,
      oauthId: oauthId
    });

    if (existingOAuthUser) {
      return res.status(400).json({
        success: false,
        message: `This ${provider} account is already linked to another user`
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Link OAuth account
    user.oauthProvider = provider;
    user.oauthId = oauthId;
    user.isEmailVerified = true; // OAuth emails are pre-verified
    await user.save();

    res.json({
      success: true,
      message: `${provider} account linked successfully`,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          oauthProvider: user.oauthProvider,
          isEmailVerified: user.isEmailVerified
        }
      }
    });
  } catch (error) {
    console.error('Link account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while linking account'
    });
  }
});

// @route   DELETE /api/oauth/unlink-account
// @desc    Unlink OAuth account from user
// @access  Private
router.delete('/unlink-account', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.oauthProvider) {
      return res.status(400).json({
        success: false,
        message: 'No OAuth account linked'
      });
    }

    // Check if user has password (can't unlink if no password)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Cannot unlink OAuth account. Please set a password first.'
      });
    }

    // Unlink OAuth account
    user.oauthProvider = null;
    user.oauthId = null;
    user.avatar = null;
    user.profileUrl = null;
    await user.save();

    res.json({
      success: true,
      message: 'OAuth account unlinked successfully'
    });
  } catch (error) {
    console.error('Unlink account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unlinking account'
    });
  }
});

// @route   GET /api/oauth/user/:userId
// @desc    Get OAuth user info
// @access  Public (for OAuth callbacks)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          oauthProvider: user.oauthProvider,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Get OAuth user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

module.exports = router;
