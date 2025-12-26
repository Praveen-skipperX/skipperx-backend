import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { otpRateLimit } from '../middlewares/rateLimit.js';
import validate from '../middlewares/validate.js';

const router = Router();

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to email or phone
 * @access  Public
 */
router.post(
  '/send-otp',
  otpRateLimit,
  [
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone format'),
    body('phoneCode')
      .optional()
      .isString()
      .withMessage('Invalid phone code format'),
    body().custom((value) => {
      if (!value.email && !value.phone) {
        throw new Error('Email or phone is required');
      }
      if (value.email && value.phone) {
        throw new Error('Provide either email or phone, not both');
      }
      return true;
    }),
  ],
  validate,
  authController.sendOTP
);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to email or phone (with cooldown)
 * @access  Public
 */
router.post(
  '/resend-otp',
  otpRateLimit,
  [
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone format'),
    body().custom((value) => {
      if (!value.email && !value.phone) {
        throw new Error('Email or phone is required');
      }
      if (value.email && value.phone) {
        throw new Error('Provide either email or phone, not both');
      }
      return true;
    }),
  ],
  validate,
  authController.resendOTP
);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and login
 * @access  Public
 */
router.post(
  '/verify-otp',
  [
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone format'),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 4, max: 4 })
      .withMessage('OTP must be 4 digits')
      .isNumeric()
      .withMessage('OTP must be numeric'),
    body().custom((value) => {
      if (!value.email && !value.phone) {
        throw new Error('Email or phone is required');
      }
      if (value.email && value.phone) {
        throw new Error('Provide either email or phone, not both');
      }
      return true;
    }),
  ],
  validate,
  authController.verifyOTP
);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to email or phone (with 60s cooldown)
 * @access  Public
 */
router.post(
  '/resend-otp',
  otpRateLimit,
  [
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone format'),
    body().custom((value) => {
      if (!value.email && !value.phone) {
        throw new Error('Email or phone is required');
      }
      if (value.email && value.phone) {
        throw new Error('Provide either email or phone, not both');
      }
      return true;
    }),
  ],
  validate,
  authController.resendOTP
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private (JWT required)
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private (JWT required)
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile (fullname, email, phone)
 * @access  Private (JWT required)
 */
router.put(
  '/profile',
  authenticate,
  [
    body('fullname')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('email')
      .if(body('email').exists())
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('phone')
      .if(body('phone').exists())
      .isMobilePhone()
      .withMessage('Invalid phone format'),
    body('profile.currentCourse')
      .optional()
      .isString()
      .trim(),
    body('profile.enrolledCourse')
      .optional()
      .isString()
      .trim(),
  ],
  validate,
  authController.updateProfile
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private (JWT required)
 */
router.post('/logout', authenticate, authController.logout);

export default router;
