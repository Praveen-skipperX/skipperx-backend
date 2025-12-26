import mongoose from 'mongoose';
import config from '../config/index.js';

const otpSchema = new mongoose.Schema(
  {
    // Identifier (email or phone)
    identifier: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // Hashed OTP (never store plain OTP) - for email
    hashedOtp: {
      type: String,
      required: false, // Not required for SMS (MessageCentral handles it)
    },

    // MessageCentral verification ID (for SMS only)
    verificationId: {
      type: String,
      required: false, // Only required for SMS
    },

    // Type of OTP (email or sms)
    type: {
      type: String,
      enum: ['email', 'sms'],
      required: true,
    },

    // Expiry time
    expiresAt: {
      type: Date,
      required: true,
    },

    // Attempt tracking
    attempts: {
      type: Number,
      default: 0,
      max: config.otp.maxAttempts,
    },

    // Whether this OTP has been used
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound index for efficient queries
otpSchema.index({ identifier: 1, expiresAt: 1 });

// TTL index - MongoDB will automatically delete expired documents
// This runs approximately every 60 seconds
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if OTP is expired
otpSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

// Method to check if max attempts reached
otpSchema.methods.hasMaxAttemptsReached = function () {
  return this.attempts >= config.otp.maxAttempts;
};

// Method to increment attempts
otpSchema.methods.incrementAttempts = async function () {
  this.attempts += 1;
  return await this.save();
};

// Static method to clean up old OTPs (additional cleanup beyond TTL)
otpSchema.statics.cleanupExpired = async function () {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount;
};

// Static method to check cooldown
otpSchema.statics.canRequestNewOtp = async function (identifier) {
  const cooldownTime = new Date(Date.now() - config.otp.cooldownSeconds * 1000);

  const recentOtp = await this.findOne({
    identifier,
    createdAt: { $gt: cooldownTime },
  });

  return !recentOtp;
};

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
