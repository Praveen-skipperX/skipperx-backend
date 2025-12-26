import mongoose from 'mongoose';
import config from './index.js';

// Connection state management (important for serverless)
let isConnected = false;

/**
 * Connect to MongoDB
 * - Reuses existing connection if available
 * - Handles connection lifecycle
 * - Fails gracefully with proper error messages
 */
export const connectDB = async () => {
  // If already connected, return
  if (isConnected) {
    console.log('📦 Using existing MongoDB connection');
    return;
  }

  try {
    // Set mongoose options
    mongoose.set('strictQuery', false);

    // Connect to MongoDB
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    isConnected = conn.connections[0].readyState === 1;

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
      isConnected = false;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    isConnected = false;

    // In development, provide helpful error messages
    if (config.isDevelopment) {
      console.log('\n💡 Tips:');
      console.log('   - Make sure MongoDB is running locally');
      console.log('   - Check your MONGODB_URI in .env file');
      console.log('   - Default: mongodb://127.0.0.1:27017/otp_auth_db\n');
    }

    // In production, exit the process
    if (config.isProduction) {
      process.exit(1);
    }

    throw error;
  }
};

/**
 * Get connection status
 */
export const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  };
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

export default { connectDB, getConnectionStatus, disconnectDB };
