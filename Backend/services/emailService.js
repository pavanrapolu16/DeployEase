const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configure email transporter based on environment
    if (process.env.EMAIL_SERVICE === 'gmail') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD // Use App Password for Gmail
        }
      });
    } else if (process.env.EMAIL_SERVICE === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    } else {
      // Development mode - use Ethereal Email (fake SMTP)
      this.setupEtherealEmail();
    }
  }

  async setupEtherealEmail() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('📧 Using Ethereal Email for development');
      console.log('📧 Preview emails at: https://ethereal.email');
    } catch (error) {
      console.error('Failed to setup Ethereal Email:', error);
    }
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate verification token
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send verification email with clickable link
  async sendVerificationEmail(email, firstName, token) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"DeployEase" <noreply@deployease.com>',
        to: email,
        subject: 'Verify Your Email - DeployEase',
        html: this.getVerificationEmailTemplate(firstName, verificationUrl)
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Log preview URL for development
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email sent successfully');
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send verification email');
    }
  }

  // Send welcome email after verification
  async sendWelcomeEmail(email, firstName) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"DeployEase" <noreply@deployease.com>',
        to: email,
        subject: 'Welcome to DeployEase! 🚀',
        html: this.getWelcomeEmailTemplate(firstName)
      };

      const info = await this.transporter.sendMail(mailOptions);

      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Welcome email sent');
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Welcome email error:', error);
      // Don't throw error for welcome email failure
      return { success: false, error: error.message };
    }
  }

  // Email template for link verification
  getVerificationEmailTemplate(firstName, verificationUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - DeployEase</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
          <div style="width: 60px; height: 60px; background-color: white; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="font-size: 28px; font-weight: bold; color: #3b82f6;">D</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Verify Your Email</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Complete your DeployEase registration</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hi ${firstName}! 👋</h2>

          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
            Welcome to DeployEase! To complete your registration and secure your account, please verify your email address by clicking the button below:
          </p>

          <!-- Verification Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);">
              Verify My Email
            </a>
          </div>

          <p style="color: #6b7280; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px;">
            If the button doesn't work, you can also copy and paste this link into your browser:
          </p>

          <p style="background-color: #f8fafc; padding: 15px; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 12px; color: #374151; margin: 15px 0;">
            ${verificationUrl}
          </p>

          <p style="color: #6b7280; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px;">
            This link will expire in 24 hours. If you didn't create an account with DeployEase, please ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            © 2025 DeployEase. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Email template for welcome message
  getWelcomeEmailTemplate(firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to DeployEase!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
          <div style="width: 60px; height: 60px; background-color: white; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="font-size: 28px; font-weight: bold; color: #10b981;">D</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to DeployEase! 🚀</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Your account is now verified and ready to use</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hi ${firstName}! 🎉</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
            Congratulations! Your email has been verified and your DeployEase account is now active. You can now start deploying your applications with ease.
          </p>
          
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%); border-radius: 12px; padding: 30px; margin: 30px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">What's next?</h3>
            <ul style="color: #6b7280; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Explore our deployment features</li>
              <li>Connect your repositories</li>
              <li>Deploy your first application</li>
              <li>Join our community</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px;">
            If you have any questions, feel free to reach out to our support team.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            © 2025 DeployEase. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Verify email service is working
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('📧 Email service is ready');
      return true;
    } catch (error) {
      console.error('📧 Email service verification failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
