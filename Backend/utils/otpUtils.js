const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');

class OTPUtils {
  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate verification token
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send verification link to user email
  async sendVerificationLinkToUser(userId, email, firstName, token) {
    try {
      // Send email with verification link
      const emailResult = await emailService.sendVerificationEmail(email, firstName, token);

      return {
        success: true,
        message: 'Verification link sent successfully',
        previewUrl: emailResult.previewUrl // For development
      };
    } catch (error) {
      console.error('Send verification link error:', error);
      throw new Error('Failed to send verification link');
    }
  }

  // Send OTP to user email (fallback)
  async sendOTPToUser(userId, email, firstName) {
    try {
      const otp = this.generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update user with OTP
      await User.findByIdAndUpdate(userId, {
        emailVerificationOTP: otp,
        emailVerificationOTPExpires: otpExpires
      });

      // Send email
      const emailResult = await emailService.sendVerificationEmail(email, firstName, otp);

      return {
        success: true,
        message: 'OTP sent successfully',
        previewUrl: emailResult.previewUrl // For development
      };
    } catch (error) {
      console.error('Send OTP error:', error);
      throw new Error('Failed to send OTP');
    }
  }

  // Verify email with token
  async verifyEmailWithToken(token) {
    try {
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired verification token'
        };
      }

      if (user.isEmailVerified) {
        return {
          success: false,
          message: 'Email is already verified'
        };
      }

      // Token is valid - verify the email
      await User.findByIdAndUpdate(user._id, {
        isEmailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined,
        emailVerificationOTP: undefined,
        emailVerificationOTPExpires: undefined
      });

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(user.email, user.firstName);
      } catch (error) {
        console.warn('Welcome email failed:', error);
        // Don't fail verification if welcome email fails
      }

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      console.error('Verify email with token error:', error);
      throw new Error('Failed to verify email');
    }
  }

  // Verify OTP (fallback)
  async verifyOTP(userId, otp) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      if (user.isEmailVerified) {
        return {
          success: false,
          message: 'Email is already verified'
        };
      }

      if (!user.emailVerificationOTP) {
        return {
          success: false,
          message: 'No OTP found. Please request a new one.'
        };
      }

      if (user.emailVerificationOTPExpires < new Date()) {
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.'
        };
      }

      if (user.emailVerificationOTP !== otp) {
        return {
          success: false,
          message: 'Invalid OTP. Please check and try again.'
        };
      }

      // OTP is valid - verify the email
      await User.findByIdAndUpdate(userId, {
        isEmailVerified: true,
        emailVerificationOTP: undefined,
        emailVerificationOTPExpires: undefined,
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined
      });

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(user.email, user.firstName);
      } catch (error) {
        console.warn('Welcome email failed:', error);
        // Don't fail verification if welcome email fails
      }

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw new Error('Failed to verify OTP');
    }
  }

  // Resend OTP
  async resendOTP(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      if (user.isEmailVerified) {
        return {
          success: false,
          message: 'Email is already verified'
        };
      }

      // Check if we can resend (rate limiting)
      const lastOTPTime = user.emailVerificationOTPExpires;
      if (lastOTPTime && (Date.now() - (lastOTPTime.getTime() - 10 * 60 * 1000)) < 60 * 1000) {
        return {
          success: false,
          message: 'Please wait at least 1 minute before requesting a new OTP'
        };
      }

      // Send new OTP
      const result = await this.sendOTPToUser(userId, user.email, user.firstName);
      return result;
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw new Error('Failed to resend OTP');
    }
  }

  // Check if OTP is expired
  isOTPExpired(otpExpires) {
    return !otpExpires || otpExpires < new Date();
  }

  // Clean up expired OTPs (can be called periodically)
  async cleanupExpiredOTPs() {
    try {
      const result = await User.updateMany(
        {
          emailVerificationOTPExpires: { $lt: new Date() }
        },
        {
          $unset: {
            emailVerificationOTP: 1,
            emailVerificationOTPExpires: 1
          }
        }
      );

      console.log(`Cleaned up ${result.modifiedCount} expired OTPs`);
      return result.modifiedCount;
    } catch (error) {
      console.error('Cleanup expired OTPs error:', error);
      return 0;
    }
  }

  // Get OTP status for user
  async getOTPStatus(userId) {
    try {
      const user = await User.findById(userId).select('emailVerificationOTP emailVerificationOTPExpires isEmailVerified');

      if (!user) {
        return { exists: false };
      }

      return {
        exists: true,
        isEmailVerified: user.isEmailVerified,
        hasOTP: !!user.emailVerificationOTP,
        isExpired: this.isOTPExpired(user.emailVerificationOTPExpires),
        expiresAt: user.emailVerificationOTPExpires
      };
    } catch (error) {
      console.error('Get OTP status error:', error);
      return { exists: false, error: error.message };
    }
  }
}

module.exports = new OTPUtils();
