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

// CORS middleware - Allow requests from frontend
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://skipperx.io',
  'https://www.skipperx.io',
  'https://skipperx-dev.vercel.app'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
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

// Connect to database
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

// Start server
const PORT = config.port;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${config.env} mode on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`📍 Server is listening on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  if (config.isProduction) {
    process.exit(1);
  }
});

export default app;
