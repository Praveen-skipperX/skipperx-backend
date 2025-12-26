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

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CORS middleware - Allow all origins for API
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow all origins
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Connect to database (serverless-friendly - reuses connection)
connectDB().catch((err) => {
  console.error('Failed to connect to database:', err);
});

// Debug endpoint to list all routes
app.get('/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ success: true, routes });
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
