import config from '../config/index.js';
import OTP from '../models/OTP.js';
import { compareHash, generateNumericOTP, getOtpExpiryTime, hashString } from '../utils/crypto.js';

/**
 * OTP Service
 * Handles all OTP-related operations
 * - Email: We generate and verify OTP ourselves
 * - SMS: MessageCentral generates OTP, we store verificationId
 */
class OTPService {
  /**
   * Generate and store OTP for EMAIL
   */
  async generateEmailOTP(identifier) {
    try {
      // Check cooldown
      const canRequest = await OTP.canRequestNewOtp(identifier);

      if (!canRequest) {
        throw new Error(
          `Please wait ${config.otp.cooldownSeconds} seconds before requesting a new OTP`
        );
      }

      // Delete any existing OTPs for this identifier
      await OTP.deleteMany({ identifier });

      // Generate OTP
      const otp = generateNumericOTP(config.otp.length);

      // Hash OTP
      const hashedOtp = await hashString(otp);

      // Calculate expiry
      const expiresAt = getOtpExpiryTime(config.otp.expiryMinutes);

      // Store OTP
      const otpDoc = await OTP.create({
        identifier,
        hashedOtp,
        type: 'email',
        expiresAt,
        attempts: 0,
      });

      return {
        otp, // Return plain OTP only for sending
        expiresAt,
        otpId: otpDoc._id,
      };
    } catch (error) {
      console.error('Error generating email OTP:', error);
      throw error;
    }
  }

  /**
   * Store SMS OTP info (MessageCentral provides verificationId)
   */
  async storeSMSOTP(identifier, verificationId) {
    try {
      // Check cooldown
      const canRequest = await OTP.canRequestNewOtp(identifier);

      if (!canRequest) {
        throw new Error(
          `Please wait ${config.otp.cooldownSeconds} seconds before requesting a new OTP`
        );
      }

      // Delete any existing OTPs for this identifier
      await OTP.deleteMany({ identifier });

      // Calculate expiry (MessageCentral timeout is usually 60 seconds)
      const expiresAt = getOtpExpiryTime(config.otp.expiryMinutes);

      // Store SMS OTP info
      const otpDoc = await OTP.create({
        identifier,
        verificationId,
        type: 'sms',
        expiresAt,
        attempts: 0,
      });

      return {
        verificationId,
        expiresAt,
        otpId: otpDoc._id,
      };
    } catch (error) {
      console.error('Error storing SMS OTP info:', error);
      throw error;
    }
  }

  /**
   * Verify EMAIL OTP (we verify against our database)
   */
  async verifyEmailOTP(identifier, plainOtp) {
    try {
      // Find the latest OTP for this identifier
      const otpDoc = await OTP.findOne({
        identifier,
        type: 'email',
        isUsed: false,
      }).sort({ createdAt: -1 });

      if (!otpDoc) {
        throw new Error('Invalid or expired OTP');
      }

      // Check if expired
      if (otpDoc.isExpired()) {
        await OTP.deleteOne({ _id: otpDoc._id });
        throw new Error('OTP has expired');
      }

      // Check max attempts
      if (otpDoc.hasMaxAttemptsReached()) {
        await OTP.deleteOne({ _id: otpDoc._id });
        throw new Error('Maximum verification attempts reached');
      }

      // Verify OTP
      const isValid = await compareHash(plainOtp, otpDoc.hashedOtp);

      if (!isValid) {
        // Increment attempts
        await otpDoc.incrementAttempts();
        throw new Error('Invalid OTP');
      }

      // Mark as used and delete
      await OTP.deleteOne({ _id: otpDoc._id });

      return true;
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      throw error;
    }
  }

  /**
   * Get SMS verification info (returns verificationId for MessageCentral verification)
   */
  async getSMSVerificationId(identifier) {
    try {
      // Find the latest OTP for this identifier
      const otpDoc = await OTP.findOne({
        identifier,
        type: 'sms',
        isUsed: false,
      }).sort({ createdAt: -1 });

      if (!otpDoc) {
        throw new Error('No OTP request found. Please request a new OTP.');
      }

      // Check if expired
      if (otpDoc.isExpired()) {
        await OTP.deleteOne({ _id: otpDoc._id });
        throw new Error('OTP has expired. Please request a new OTP.');
      }

      // Check max attempts
      if (otpDoc.hasMaxAttemptsReached()) {
        await OTP.deleteOne({ _id: otpDoc._id });
        throw new Error('Maximum verification attempts reached. Please request a new OTP.');
      }

      // Increment attempts
      await otpDoc.incrementAttempts();

      return {
        verificationId: otpDoc.verificationId,
        otpId: otpDoc._id
      };
    } catch (error) {
      console.error('Error getting SMS verification ID:', error);
      throw error;
    }
  }

  /**
   * Mark SMS OTP as verified and delete
   */
  async markSMSVerified(identifier) {
    try {
      await OTP.deleteMany({ identifier, type: 'sms' });
      return true;
    } catch (error) {
      console.error('Error marking SMS as verified:', error);
      throw error;
    }
  }

  /**
   * Clean up expired OTPs
   */
  async cleanupExpired() {
    try {
      const count = await OTP.cleanupExpired();
      return count;
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
      throw error;
    }
  }
}

export default new OTPService();
