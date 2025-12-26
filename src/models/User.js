import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // User's full name
    fullname: {
      type: String,
      trim: true,
      default: '',
    },

    // Contact information (at least one required)
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true, // Allows unique constraint with null values
      validate: {
        validator: function (v) {
          // Only validate if email is provided
          if (!v) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format',
      },
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows unique constraint with null values
    },

    // Verification status
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Profile completion status
    profileCompleted: {
      type: Boolean,
      default: false,
    },

    // Additional profile data (kept for backward compatibility)
    profile: {
      currentCourse: {
        type: String,
        trim: true,
      },
      enrolledCourse: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Ensure at least one contact method exists
userSchema.pre('save', function (next) {
  if (!this.email && !this.phone) {
    next(new Error('User must have either email or phone'));
  }
  next();
});

// Method to check if user has completed profile
userSchema.methods.hasCompletedProfile = function () {
  return this.fullname && this.fullname.trim().length > 0;
};

// Method to safely get user data (exclude sensitive info if needed in future)
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
