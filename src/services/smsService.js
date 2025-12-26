import axios from 'axios';
import config from '../config/index.js';

/**
 * SMS Service using MessageCentral VerifyNow
 * Customer ID: C-ABDFD280480048B
 * 
 * MessageCentral generates and sends their own OTP
 * We get a verificationId which we use to validate the OTP
 */
class SMSService {
  constructor() {
    this.customerId = config.messageCentral.customerId;
    this.apiKey = config.messageCentral.apiKey;
    this.senderId = config.messageCentral.senderId;
    this.sendBaseUrl = 'https://cpaas.messagecentral.com/verification/v3/send';
    this.validateBaseUrl = 'https://cpaas.messagecentral.com/verification/v3/validateOtp';
  }

  /**
   * Send OTP SMS using MessageCentral VerifyNow
   * MessageCentral generates their own OTP and returns verificationId
   */
  async sendOTPSMS(phone) {
    try {
      if (!this.customerId || !this.apiKey) {
        console.log('MessageCentral not configured');
        // In development, return mock verificationId
        if (config.isDevelopment) {
          console.log(`DEV MODE - SMS will be sent to ${phone}`);
          return { 
            success: true, 
            dev: true,
            verificationId: 'DEV-' + Date.now(),
            mockOtp: Math.floor(1000 + Math.random() * 9000) // For dev testing
          };
        }
        throw new Error('MessageCentral credentials not configured');
      }

      // const countryCode = this.extractCountryCode(phone);
      const countryCode = 91;
      const mobileNumber = this.extractMobileNumber(phone);
      
      console.log(`Sending MessageCentral OTP to +${countryCode}${mobileNumber}`);

      // MessageCentral VerifyNow API - they generate the OTP
      const url = `${this.sendBaseUrl}?countryCode=${countryCode}&customerId=${this.customerId}&flowType=SMS&mobileNumber=${mobileNumber}`;

      console.log('MessageCentral URL:', url);

      const response = await axios.post(url, null, {
        headers: {
          'authToken': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      });

      console.log('MessageCentral Send Response:', JSON.stringify(response.data, null, 2));

      // Check for success response
      if (response.data && (response.data.responseCode === 200 || response.data.responseCode === '200')) {
        console.log('SMS OTP sent successfully via MessageCentral');
        console.log('Verification ID:', response.data.data?.verificationId);
        
        return {
          success: true,
          verificationId: response.data.data?.verificationId,
          mobileNumber: response.data.data?.mobileNumber,
          timeout: response.data.data?.timeout || 60
        };
      } else {
        console.error('MessageCentral Error Response:', response.data);
        throw new Error(response.data.message || 'Failed to send SMS OTP');
      }
    } catch (error) {
      console.error('Error sending OTP SMS:', error.response?.data || error.message);
      
      // Log full error details for debugging
      if (error.response) {
        console.error('Error Response Status:', error.response.status);
        console.error('Error Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      // In development, don't fail - return mock data
      if (config.isDevelopment) {
        console.log(`DEV MODE - Simulating SMS OTP for ${phone}`);
        console.log(`MessageCentral error (continuing in dev mode):`, error.message);
        return { 
          success: true, 
          dev: true, 
          error: error.message,
          verificationId: 'DEV-' + Date.now(),
          mockOtp: Math.floor(1000 + Math.random() * 9000)
        };
      }
      
      throw new Error(error.response?.data?.message || 'Failed to send OTP SMS');
    }
  }

  /**
   * Verify OTP using MessageCentral's validation API
   */
  async verifyOTPSMS(phone, otp, verificationId) {
    try {
      if (!this.customerId || !this.apiKey) {
        // In development, allow any 4-digit OTP
        if (config.isDevelopment) {
          console.log(`DEV MODE - Verifying OTP for ${phone}`);
          return { success: true, dev: true };
        }
        throw new Error('MessageCentral credentials not configured');
      }

      // In dev mode with mock verificationId, just verify OTP format
      if (config.isDevelopment && verificationId.startsWith('DEV-')) {
        console.log(`DEV MODE - Accepting OTP: ${otp}`);
        return { success: true, dev: true };
      }

      const countryCode = this.extractCountryCode(phone);
      const mobileNumber = this.extractMobileNumber(phone);
      
      console.log(`Verifying OTP for +${countryCode}${mobileNumber}`);

      // MessageCentral Validate OTP API
      const url = `${this.validateBaseUrl}?countryCode=${countryCode}&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=${this.customerId}&code=${otp}`;

      console.log('MessageCentral Validate URL:', url.replace(otp, '****'));

      const response = await axios.get(url, {
        headers: {
          'authToken': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('MessageCentral Validate Response:', JSON.stringify(response.data, null, 2));

      // Check for success response
      if (response.data && response.data.responseCode === 200) {
        console.log('OTP verified successfully via MessageCentral');
        return {
          success: true,
          verificationStatus: response.data.data?.verificationStatus
        };
      } else {
        console.error('OTP verification failed:', response.data);
        throw new Error(response.data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error.response?.data || error.message);
      
      if (error.response) {
        console.error('Error Response Status:', error.response.status);
        console.error('Error Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw new Error(error.response?.data?.message || 'OTP verification failed');
    }
  }

  /**
   * Extract country code from phone number
   */
  extractCountryCode(phone) {
    // Remove spaces, hyphens, parentheses
    const cleaned = phone.replace(/[\s\-()]/g, '');
    
    // If starts with +, extract country code
    if (cleaned.startsWith('+')) {
      // For India: +91, US: +1, etc.
      const match = cleaned.match(/^\+(\d{1,3})/);
      return match ? match[1] : '91'; // Default to India
    }
    
    // If starts with 91 (India), return 91
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      return '91';
    }
    
    // Default to India country code
    return '91';
  }

  /**
   * Extract mobile number without country code
   */
  extractMobileNumber(phone) {
    // Remove spaces, hyphens, parentheses
    const cleaned = phone.replace(/[\s\-()]/g, '');
    
    // Remove + and country code
    let mobile = cleaned;
    
    if (mobile.startsWith('+')) {
      mobile = mobile.substring(1);
    }
    
    // If starts with 91 (India), remove it
    if (mobile.startsWith('91') && mobile.length > 10) {
      mobile = mobile.substring(2);
    }
    
    // Return last 10 digits
    return mobile.slice(-10);
  }

  /**
   * Verify OTP (if using MessageCentral's verification feature)
   * For now, we handle verification in our backend
   */
  async verifyOTP(phone, otp) {
    // We handle OTP verification in our otpService.js
    // This method is here for future use if needed
    return true;
  }
}

export default new SMSService();
