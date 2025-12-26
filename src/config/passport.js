import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import { normalizeEmail } from '../utils/validators.js';

/**
 * Google OAuth Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable Google+ API
 * 4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
 * 5. Set authorized redirect URIs:
 *    - Development: http://localhost:5000/api/auth/google/callback
 *    - Production: https://yourdomain.com/api/auth/google/callback
 * 6. Copy Client ID and Client Secret
 * 7. Add to .env file:
 *    GOOGLE_CLIENT_ID=your_client_id
 *    GOOGLE_CLIENT_SECRET=your_client_secret
 *    GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
 */

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user data from Google profile
        const email = profile.emails?.[0]?.value;
        const fullname = profile.displayName || '';

        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        const normalizedEmail = normalizeEmail(email);

        // Find existing user or create new one
        let user = await User.findOne({ email: normalizedEmail });

        if (user) {
          // User exists - update fullname if not set
          if (!user.fullname && fullname) {
            user.fullname = fullname;
            user.isVerified = true;
            await user.save();
          }
        } else {
          // Create new user
          user = await User.create({
            email: normalizedEmail,
            fullname: fullname,
            isVerified: true,
            profileCompleted: fullname ? true : false,
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for session (optional - not used with JWT)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session (optional - not used with JWT)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
