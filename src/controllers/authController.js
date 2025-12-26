import authService from '../services/authService.js';
import emailService from '../services/emailService.js';
import otpService from '../services/otpService.js';
import smsService from '../services/smsService.js';
import { errorResponse, successResponse } from '../utils/response.js';
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '../utils/validators.js';

/**
 * Auth Controller
 * Handles business logic for authentication
 */
class AuthController {
  /**
   * Send OTP to email or phone
   */
  async sendOTP(req, res) {
    try {
      const { email, phone, phoneCode } = req.body;

      // Validate input - must have email OR phone
      if (!email && !phone) {
        return res.status(400).json(
          errorResponse('Email or phone is required')
        );
      }

      if (email && phone) {
        return res.status(400).json(
          errorResponse('Provide either email or phone, not both')
        );
      }

      let identifier;
      let isEmail = false;

      // Validate and normalize email
      if (email) {
        if (!isValidEmail(email)) {
          return res.status(400).json(errorResponse('Invalid email format'));
        }
        identifier = normalizeEmail(email);
        isEmail = true;
      }

      // Validate and normalize phone
      if (phone) {
        // Combine phoneCode with phone if provided
        const fullPhone = phoneCode ? `${phoneCode}${phone}` : phone;
        if (!isValidPhone(fullPhone)) {
          return res.status(400).json(errorResponse('Invalid phone format'));
        }
        identifier = normalizePhone(fullPhone);
        isEmail = false;
      }

      // Handle EMAIL and SMS differently
      if (isEmail) {
        // EMAIL: We generate OTP and send via Resend
        const { otp, expiresAt } = await otpService.generateEmailOTP(identifier);

        try {
          await emailService.sendOTPEmail(identifier, otp, expiresAt);
          console.log('Email OTP sent successfully');
        } catch (emailError) {
          console.error('Email sending failed:', emailError.message);
        }

        return res.json(
          successResponse(
            { identifier, expiresAt },
            'OTP sent successfully to email'
          )
        );
      } else {
        // SMS: MessageCentral generates OTP and sends it
        try {
          const result = await smsService.sendOTPSMS(identifier);
          
          // Store the verificationId from MessageCentral
          const { verificationId, expiresAt } = await otpService.storeSMSOTP(
            identifier,
            result.verificationId
          );

          console.log('SMS OTP sent successfully via MessageCentral');

          return res.json(
            successResponse(
              { identifier, expiresAt },
              'OTP sent successfully to phone'
            )
          );
        } catch (smsError) {
          console.error('SMS sending failed:', smsError.message);
          throw smsError;
        }
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      
      // Return 400 for validation/client errors, 500 for server errors
      const statusCode = error.message.includes('Invalid') || 
                         error.message.includes('required') ||
                         error.message.includes('not valid') ? 400 : 500;
      
      return res.status(statusCode).json(
        errorResponse(error.message || 'Failed to send OTP')
      );
    }
  }

  /**
   * Resend OTP to email or phone (with 60-second cooldown)
   */
  async resendOTP(req, res) {
    try {
      const { email, phone, phoneCode } = req.body;

      // Validate input - must have email OR phone
      if (!email && !phone) {
        return res.status(400).json(
          errorResponse('Email or phone is required')
        );
      }

      if (email && phone) {
        return res.status(400).json(
          errorResponse('Provide either email or phone, not both')
        );
      }

      let identifier;
      let isEmail = false;

      // Validate and normalize
      if (email) {
        if (!isValidEmail(email)) {
          return res.status(400).json(errorResponse('Invalid email format'));
        }
        identifier = normalizeEmail(email);
        isEmail = true;
      } else {
        const fullPhone = phoneCode ? `${phoneCode}${phone}` : phone;
        if (!isValidPhone(fullPhone)) {
          return res.status(400).json(errorResponse('Invalid phone format'));
        }
        identifier = normalizePhone(fullPhone);
      }

      // Check cooldown (60 seconds)
      const OTP = (await import('../models/OTP.js')).default;
      const cooldownSeconds = 60;
      const cooldownTime = new Date(Date.now() - cooldownSeconds * 1000);

      const recentOtp = await OTP.findOne({
        identifier,
        createdAt: { $gt: cooldownTime },
      }).sort({ createdAt: -1 });

      if (recentOtp) {
        const timeSinceLastOtp = Math.floor((Date.now() - recentOtp.createdAt.getTime()) / 1000);
        const remainingTime = cooldownSeconds - timeSinceLastOtp;

        return res.status(429).json(
          errorResponse(`Please wait ${remainingTime} seconds before requesting a new OTP`)
        );
      }

      // Handle EMAIL and SMS differently (same logic as sendOTP)
      if (isEmail) {
        // EMAIL: We generate OTP and send via Resend
        const { otp, expiresAt } = await otpService.generateEmailOTP(identifier);

        try {
          await emailService.sendOTPEmail(identifier, otp, expiresAt);
          console.log('Email OTP resent successfully');
        } catch (emailError) {
          console.error('Email resend failed:', emailError.message);
        }

        return res.json(
          successResponse(
            { identifier, expiresAt },
            'OTP resent successfully to email'
          )
        );
      } else {
        // SMS: MessageCentral generates OTP and sends it
        try {
          const result = await smsService.sendOTPSMS(identifier);
          const { verificationId, expiresAt } = await otpService.storeSMSOTP(
            identifier,
            result.verificationId
          );

          console.log('SMS OTP resent successfully via MessageCentral');

          return res.json(
            successResponse(
              { identifier, expiresAt },
              'OTP resent successfully to phone'
            )
          );
        } catch (smsError) {
          console.error('SMS resend failed:', smsError.message);
          throw smsError;
        }
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      
      // Return 400 for validation/client errors, 500 for server errors
      const statusCode = error.message.includes('Invalid') || 
                         error.message.includes('required') ||
                         error.message.includes('not valid') ||
                         error.message.includes('wait') ? 400 : 500;
      
      return res.status(statusCode).json(
        errorResponse(error.message || 'Failed to resend OTP')
      );
    }
  }

  /**
   * Verify OTP and login
   */
  async verifyOTP(req, res) {
    try {
      const { email, phone, otp } = req.body;

      // Validate input
      if (!email && !phone) {
        return res.status(400).json(
          errorResponse('Email or phone is required')
        );
      }

      if (!otp) {
        return res.status(400).json(errorResponse('OTP is required'));
      }

      if (email && phone) {
        return res.status(400).json(
          errorResponse('Provide either email or phone, not both')
        );
      }

      let identifier;
      let isEmail = false;

      // Normalize identifier
      if (email) {
        identifier = normalizeEmail(email);
        isEmail = true;
      } else {
        identifier = normalizePhone(phone);
        isEmail = false;
      }

      // Verify OTP - different logic for email vs SMS
      if (isEmail) {
        // EMAIL: Verify against our database
        await otpService.verifyEmailOTP(identifier, otp);
      } else {
        // SMS: Get verificationId and verify with MessageCentral
        const { verificationId } = await otpService.getSMSVerificationId(identifier);
        await smsService.verifyOTPSMS(identifier, otp, verificationId);
        await otpService.markSMSVerified(identifier);
      }

      // Find or create user
      const user = await authService.findOrCreateUser(identifier, isEmail);
      
      // Check if this is a new user or returning user
      const isNewUser = !user.createdAt || 
        (new Date() - new Date(user.createdAt)) < 10000; // Created within last 10 seconds

      // Send welcome email for new users
      if (isNewUser && user.email) {
        try {
          await emailService.sendWelcomeEmail(user.email, user.fullname);
        } catch (welcomeError) {
          console.error('Failed to send welcome email:', welcomeError.message);
          // Don't fail the login if welcome email fails
        }
      }

      // Generate JWT token
      const token = authService.generateAuthToken(user);

      // Return comprehensive user data and token
      return res.json(
        successResponse(
          {
            token,
            isNewUser, // Indicates if this is a newly created user
            user: {
              id: user._id,
              fullname: user.fullname,
              email: user.email,
              phone: user.phone,
              profileCompleted: user.profileCompleted,
              isVerified: user.isVerified,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
          },
          isNewUser ? 'Registration successful' : 'Login successful'
        )
      );
    } catch (error) {
      console.error('Verify OTP error:', error);
      
      // Provide specific error messages
      let errorMessage = 'OTP verification failed';
      if (error.message.includes('Invalid') || error.message.includes('incorrect')) {
        errorMessage = 'Invalid OTP. Please check and try again.';
      } else if (error.message.includes('expired')) {
        errorMessage = 'OTP has expired. Please request a new one.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'OTP not found. Please request a new one.';
      }
      
      return res.status(400).json(
        errorResponse(errorMessage)
      );
    }
  }

  /**
   * Get current user (JWT protected)
   */
  async getCurrentUser(req, res) {
    try {
      const user = await authService.getUserProfile(req.userId);

      return res.json(
        successResponse({
          id: user._id,
          fullname: user.fullname,
          email: user.email,
          phone: user.phone,
          profileCompleted: user.profileCompleted,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
      );
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json(
        errorResponse('Failed to get user data')
      );
    }
  }

  /**
   * Update user profile (JWT protected)
   */
  async updateProfile(req, res) {
    try {
      const profileData = req.body;

      // Validate that there's data to update
      if (Object.keys(profileData).length === 0) {
        return res.status(400).json(
          errorResponse('No profile data provided')
        );
      }

      // Prevent updating protected fields
      const protectedFields = ['_id', 'isVerified', 'createdAt', 'updatedAt'];
      const hasProtectedField = protectedFields.some(field => field in profileData);

      if (hasProtectedField) {
        return res.status(400).json(
          errorResponse('Cannot update protected fields')
        );
      }

      // Update profile
      const user = await authService.updateUserProfile(req.userId, profileData);

      return res.json(
        successResponse(
          {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            profileCompleted: user.profileCompleted,
            isVerified: user.isVerified,
          },
          'Profile updated successfully'
        )
      );
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json(
        errorResponse(error.message || 'Failed to update profile')
      );
    }
  }

  /**
   * Logout user
   * Note: With JWT, logout is primarily handled client-side by removing the token
   * This endpoint can be used for logging/analytics or future token blacklisting
   */
  async logout(req, res) {
    try {
      // Log the logout event (optional)
      console.log(`User ${req.userId} logged out at ${new Date().toISOString()}`);

      // In a production system with token blacklisting, you would add:
      // await tokenBlacklistService.addToken(req.headers.authorization.split(' ')[1]);

      return res.json(
        successResponse(
          null,
          'Logged out successfully'
        )
      );
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json(
        errorResponse('Logout failed')
      );
    }
  }
}

export default new AuthController();
