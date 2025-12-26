import express from 'express';
import { connectDB } from './config/database.js';
import config from './config/index.js';
import passport from './config/passport.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport for Google OAuth
app.use(passport.initialize());

// CORS middleware - Dynamic origin based on environment
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const frontendUrl = process.env.FRONTEND_URL;
  
  // Build allowed origins list
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  
  // Add production frontend URL if available
  if (frontendUrl) {
    allowedOrigins.push(frontendUrl);
  }
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Connect to database (serverless-friendly - reuses connection)
connectDB().catch((err) => {
  console.error('Failed to connect to database:', err);
});

// Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'OTP Authentication API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      sendOtp: 'POST /api/auth/send-otp',
      resendOtp: 'POST /api/auth/resend-otp',
      verifyOtp: 'POST /api/auth/verify-otp',
      getProfile: 'GET /api/auth/me',
      updateProfile: 'PUT /api/auth/profile',
      logout: 'POST /api/auth/logout',
      googleLogin: 'GET /api/auth/google',
      googleCallback: 'GET /api/auth/google/callback',
    },
  });
});

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// For local development only - NO PORT BINDING IN PRODUCTION
if (process.env.NODE_ENV !== 'production') {
  const PORT = config.port;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running in ${config.env} mode on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);
  });
}

// Export for Vercel serverless
export default app;
