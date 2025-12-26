import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Server
  port: process.env.PORT || 5000,

  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/otp_auth_db',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d', // 7 days
  },

  // OTP
  otp: {
    length: 4,
    expiryMinutes: 3,
    maxAttempts: 3,
    cooldownSeconds: 60, // 1 minute cooldown between OTP requests
  },

  // Resend (Email)
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },

  // MessageCentral (SMS)
  messageCentral: {
    customerId: process.env.MSG_CENTRAL_CUSTOMER_ID || 'C-ABDFD280480048B',
    apiKey: process.env.MSG_CENTRAL_API_KEY,
    senderId: process.env.MSG_CENTRAL_SENDER_ID || 'SKPRX',
    templateId: process.env.MSG_CENTRAL_TEMPLATE_ID, // Optional
  },
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ Error: ${envVar} is not defined in environment variables`);
    if (config.isProduction) {
      process.exit(1);
    }
  }
});

export default config;
