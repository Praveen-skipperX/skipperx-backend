import { Router } from 'express';
import passport from '../config/passport.js';
import { generateToken } from '../utils/jwt.js';
import { successResponse } from '../utils/response.js';

const router = Router();

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login?error=google_auth_failed',
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = generateToken({
        userId: req.user._id.toString(),
        email: req.user.email,
        phone: req.user.phone,
      });

      // Check if this is a new user
      const isNewUser = !req.user.createdAt || 
        (new Date() - new Date(req.user.createdAt)) < 10000;

      // In production, redirect to frontend with token as query parameter
      // Frontend should extract token and store it
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&isNewUser=${isNewUser}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
);

/**
 * @route   GET /api/auth/google/status
 * @desc    Check if Google OAuth is configured
 * @access  Public
 */
router.get('/google/status', (req, res) => {
  const isConfigured = 
    process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID' &&
    process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_SECRET !== 'YOUR_GOOGLE_CLIENT_SECRET';

  return res.json(
    successResponse({
      configured: isConfigured,
      message: isConfigured 
        ? 'Google OAuth is configured' 
        : 'Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env',
    })
  );
});

export default router;
