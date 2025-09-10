const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Debug OAuth environment variables
console.log('🔍 OAuth Environment Check:', {
  googleClientId: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
  githubClientId: process.env.GITHUB_CLIENT_ID ? 'SET' : 'MISSING',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET ? 'SET' : 'MISSING'
});

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/oauth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth Profile:', {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName
      });

      console.log('🔄 Attempting to find or create OAuth user...');
      const user = await User.findOrCreateOAuthUser(profile, 'google');
      console.log('✅ OAuth user created/found successfully:', {
        id: user._id,
        email: user.email,
        username: user.username
      });
      return done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      console.error('Error stack:', error.stack);
      return done(error, null);
    }
  }));
} else {
  console.warn('⚠️  Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

// GitHub OAuth Strategy (only if credentials are provided)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/oauth/github/callback",
    scope: ['user:email', 'user'] // Request email and user access for repos
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('GitHub OAuth Profile:', {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        username: profile.username,
        name: profile.displayName
      });

      const user = await User.findOrCreateOAuthUser(profile, 'github', accessToken);
      return done(null, user);
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      return done(error, null);
    }
  }));
} else {
  console.warn('⚠️  GitHub OAuth not configured - missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
}

module.exports = passport;
