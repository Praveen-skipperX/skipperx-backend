import { Router } from 'express';
import authRoutes from './authRoutes.js';
import googleAuthRoutes from './googleAuthRoutes.js';

const router = Router();

console.log('✅ Routes module loaded');
console.log('authRoutes type:', typeof authRoutes);
console.log('googleAuthRoutes type:', typeof googleAuthRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is live 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Auth routes (includes OTP, profile, logout)
console.log('Mounting auth routes at /auth');
router.use('/auth', authRoutes);

// Google OAuth routes
console.log('Mounting Google OAuth routes at /auth');
router.use('/auth', googleAuthRoutes);

console.log('✅ All routes mounted');

export default router;
