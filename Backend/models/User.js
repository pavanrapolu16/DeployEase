const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      // Password is required only for email/password authentication
      return !this.oauthProvider;
    },
    minlength: [6, 'Password must be at least 6 characters long']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Email verification fields
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpires: {
    type: Date
  },
  emailVerificationOTP: {
    type: String
  },
  emailVerificationOTPExpires: {
    type: Date
  },
  // OAuth fields
  oauthProvider: {
    type: String,
    enum: ['google', 'github']
    // No default - will be undefined for regular users
  },
  oauthId: {
    type: String
    // No default - will be undefined for regular users
  },
  accessToken: {
    type: String
    // OAuth access token for API calls
  },
  avatar: {
    type: String
  },
  profileUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index(
  { oauthProvider: 1, oauthId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      oauthProvider: { $exists: true },
      oauthId: { $exists: true }
    },
    name: 'oauth_compound_unique'
  }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get user info without password
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find user by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier },
      { username: identifier }
    ]
  });
};

// Static method to find or create OAuth user
userSchema.statics.findOrCreateOAuthUser = async function(profile, provider, accessToken = null) {
  try {
    console.log('🔍 Looking for existing OAuth user:', { provider, oauthId: profile.id });
    // First, try to find user by OAuth ID and provider
    let user = await this.findOne({
      oauthProvider: provider,
      oauthId: profile.id
    });
    console.log('🔍 Existing OAuth user found:', !!user);

    if (user) {
      console.log('✅ Found existing OAuth user, updating...');
      // Update user info from OAuth profile
      user.avatar = profile.photos?.[0]?.value || user.avatar;
      user.profileUrl = profile.profileUrl || user.profileUrl;
      user.accessToken = accessToken || user.accessToken;
      user.lastLogin = new Date();
      await user.save();
      console.log('✅ Updated existing OAuth user');
      return user;
    }

    console.log('🔍 Looking for existing user by email:', profile.emails?.[0]?.value);
    // If not found by OAuth ID, try to find by email
    user = await this.findOne({ email: profile.emails?.[0]?.value });
    console.log('🔍 Existing email user found:', !!user);

    if (user) {
      console.log('🔗 Linking existing email account with OAuth...');
      // Link existing account with OAuth
      user.oauthProvider = provider;
      user.oauthId = profile.id;
      user.accessToken = accessToken;
      user.avatar = profile.photos?.[0]?.value || user.avatar;
      user.profileUrl = profile.profileUrl || user.profileUrl;
      user.isEmailVerified = true; // OAuth emails are pre-verified
      user.lastLogin = new Date();
      await user.save();
      console.log('✅ Linked existing account with OAuth');
      return user;
    }

    // Create new OAuth user
    console.log('🆕 Creating new OAuth user...');
    const email = profile.emails?.[0]?.value;
    console.log('📧 Email from profile:', email);
    if (!email) {
      // For GitHub, sometimes email is not provided in the profile
      // We'll create a placeholder email and mark it as unverified
      const placeholderEmail = `${profile.username || profile.id}@${provider}.oauth.placeholder`;
      console.warn(`⚠️  No email provided by ${provider} OAuth. Using placeholder: ${placeholderEmail}`);

      // Use placeholder email but mark as unverified
      const user = new this({
        username: profile.username || `${provider}_${profile.id}`,
        email: placeholderEmail,
        firstName: profile.displayName?.split(' ')[0] || profile.name?.givenName || 'User',
        lastName: profile.displayName?.split(' ').slice(1).join(' ') || profile.name?.familyName || '',
        oauthProvider: provider,
        oauthId: profile.id,
        accessToken: accessToken,
        avatar: profile.photos?.[0]?.value,
        profileUrl: profile.profileUrl,
        isEmailVerified: false, // Not verified since no real email
        isActive: true,
        lastLogin: new Date()
      });

      await user.save();
      return user;
    }

    // Generate username from email or display name
    let username = profile.username ||
                   profile.displayName?.toLowerCase().replace(/\s+/g, '') ||
                   email.split('@')[0];

    // Ensure username is unique
    let baseUsername = username;
    let counter = 1;
    while (await this.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Parse name
    const nameParts = profile.displayName?.split(' ') || [];
    const firstName = nameParts[0] || profile.name?.givenName || 'User';
    const lastName = nameParts.slice(1).join(' ') || profile.name?.familyName || '';

    console.log('🆕 Creating new user with data:', {
      username,
      email,
      firstName,
      lastName: lastName || 'User',
      provider,
      oauthId: profile.id
    });

    user = new this({
      username,
      email,
      firstName,
      lastName: lastName || 'User',
      oauthProvider: provider,
      oauthId: profile.id,
      accessToken: accessToken,
      avatar: profile.photos?.[0]?.value,
      profileUrl: profile.profileUrl,
      isEmailVerified: true, // OAuth emails are pre-verified
      isActive: true,
      lastLogin: new Date()
    });

    console.log('💾 Saving new user...');
    await user.save();
    console.log('✅ New user saved successfully:', user._id);
    return user;
  } catch (error) {
    console.error('OAuth user creation error:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
