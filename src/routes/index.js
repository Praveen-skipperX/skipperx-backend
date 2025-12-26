import { Router } from 'express';
import authRoutes from './authRoutes.js';
import googleAuthRoutes from './googleAuthRoutes.js';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes (includes OTP, profile, logout)
router.use('/auth', authRoutes);

// Google OAuth routes
router.use('/auth', googleAuthRoutes);

export default router;
