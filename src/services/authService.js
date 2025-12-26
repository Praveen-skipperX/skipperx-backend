import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { normalizeEmail, normalizePhone } from '../utils/validators.js';

/**
 * Auth Service
 * Handles authentication-related operations
 */
class AuthService {
  /**
   * Find or create user by email or phone
   */
  async findOrCreateUser(identifier, isEmail = true) {
    try {
      const query = isEmail
        ? { email: normalizeEmail(identifier) }
        : { phone: normalizePhone(identifier) };

      let user = await User.findOne(query);

      if (!user) {
        // Create new user
        const userData = isEmail
          ? { email: normalizeEmail(identifier), isVerified: true }
          : { phone: normalizePhone(identifier), isVerified: true };

        user = await User.create(userData);
      } else {
        // Update verification status
        if (!user.isVerified) {
          user.isVerified = true;
          await user.save();
        }
      }

      return user;
    } catch (error) {
      console.error('Error finding or creating user:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token for user
   */
  generateAuthToken(user) {
    try {
      const payload = {
        userId: user._id.toString(),
        email: user.email,
        phone: user.phone,
      };

      const token = generateToken(payload);

      return token;
    } catch (error) {
      console.error('Error generating auth token:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, profileData) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Update fullname if provided
      if (profileData.fullname !== undefined) {
        user.fullname = profileData.fullname;
      }

      // Update email if provided and different
      if (profileData.email !== undefined && profileData.email !== user.email) {
        // Check if email is already taken by another user
        const existingUser = await User.findOne({ 
          email: profileData.email,
          _id: { $ne: userId }
        });
        if (existingUser) {
          throw new Error('Email already in use');
        }
        user.email = profileData.email;
      }

      // Update phone if provided and different
      if (profileData.phone !== undefined && profileData.phone !== user.phone) {
        // Check if phone is already taken by another user
        const existingUser = await User.findOne({ 
          phone: profileData.phone,
          _id: { $ne: userId }
        });
        if (existingUser) {
          throw new Error('Phone number already in use');
        }
        user.phone = profileData.phone;
      }

      // Update profile fields (currentCourse, enrolledCourse, etc.)
      if (profileData.profile) {
        if (!user.profile) {
          user.profile = {};
        }
        Object.keys(profileData.profile).forEach((key) => {
          if (profileData.profile[key] !== undefined) {
            user.profile[key] = profileData.profile[key];
          }
        });
        user.markModified('profile');
      }

      // Check if profile is completed (has fullname at minimum)
      if (user.fullname && user.fullname.trim().length > 0) {
        user.profileCompleted = true;
      }

      await user.save();

      return user;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId).select('-__v');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }
}

export default new AuthService();
