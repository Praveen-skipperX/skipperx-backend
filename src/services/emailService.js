import { Resend } from 'resend';
import config from '../config/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Resend client
const resend = new Resend(config.resend.apiKey);

/**
 * Email Service
 * Handles all email-related operations using Resend
 */
class EmailService {
  /**
   * Send OTP email
   */
  async sendOTPEmail(email, otp, expiresAt) {
    try {
      if (!config.resend.apiKey) {
        console.log('Resend API key not configured');
        throw new Error('Resend API key is not configured');
      }

      const expiryMinutes = Math.ceil((expiresAt - new Date()) / 60000);

      const emailContent = {
        from: "SkipperX <no-reply@skipperx.io>",
        to: email,
        subject: 'Your SkipperX Login OTP',
        html: this.getOTPEmailTemplate(otp, expiryMinutes),
      };

      const result = await resend.emails.send(emailContent);

      console.log('Email sent successfully via Resend');

      return result;
    } catch (error) {
      console.error('Error sending OTP email:', error.message);
      throw new Error(error.message || 'Failed to send OTP email');
    }
  }

getOTPEmailTemplate(otp, expiryMinutes) {
  const SKIPPER_LOGO_URL = "https://www.skipperx.io/assets/skipper-black.png";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Login OTP</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding:20px;">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:520px; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.08);">

          <!-- Body -->
          <tr>
            <td style="padding:28px 24px; color:#1f1f1f;">

              <p style="margin:0 0 12px 0; font-size:14px;">
                Hello,
              </p>

              <p style="margin:0 0 24px 0; font-size:14px; line-height:1.6;">
                Use the following One-Time Password (OTP) to securely log in to your SkipperX account.
              </p>

              <!-- OTP BOX -->
              <div style="text-align:center; margin:24px 0;">
                <div style="
                  display:inline-block;
                  padding:14px 28px;
                  border:2px dashed #E46D1E;
                  border-radius:6px;
                  font-size:24px;
                  letter-spacing:6px;
                  font-weight:600;
                  color:#E46D1E;
                  background:#FFF7F2;
                ">
                  ${otp}
                </div>
              </div>

              <p style="margin:0 0 16px 0; font-size:13px; color:#333;">
                This OTP is valid for <strong>${expiryMinutes} minutes</strong>.
              </p>

              <p style="margin:0; font-size:13px; color:#555; line-height:1.5;">
                For your security, do not share this code with anyone.  
                If you did not request this OTP, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9; padding:18px; text-align:center;">
              <p style="margin:0 0 6px 0; font-size:12px; color:#777;">
                © ${new Date().getFullYear()} SkipperX
              </p>
              <p style="margin:0; font-size:11px; color:#999;">
                This is an automated message. Please do not reply.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
}



  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(email, name) {
    try {
      if (!config.resend.apiKey) {
        console.log('Resend API key not configured - skipping welcome email');
        return null;
      }

      const displayName = name || 'there';

      const emailContent = {
        from: "SkipperX <no-reply@skipperx.io>",
        to: email,
        subject: 'Welcome to SkipperX - Start Your Learning Journey',
        html: this.getWelcomeEmailTemplate(displayName),
      };

      const result = await resend.emails.send(emailContent);
      console.log('Welcome email sent successfully');

      return result;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return null;
    }
  }

  /**
   * Welcome email template with professional design
   */
  getWelcomeEmailTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to SkipperX</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1F1F1F; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
          <div style="background-color: #ffffff; margin: 20px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            
            <!-- Header with Logo and Brand Colors -->
            <div style="background: linear-gradient(135deg, #E46D1E 0%, #1F1F1F 100%); padding: 40px 30px; text-align: center;">
              <h3 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome Aboard!</h3>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #E46D1E; font-size: 22px; margin: 0 0 20px 0; font-weight: 600;">
                Hello ${name},
              </h2>
              
              <p style="font-size: 14px; margin-bottom: 20px; color: #1F1F1F; line-height: 1.8;">
                We are thrilled to have you join the SkipperX community. You have taken the first step towards transforming your career and unlocking new opportunities through our comprehensive learning programs.
              </p>
              
              <p style="font-size: 14px; margin-bottom: 30px; color: #1F1F1F; line-height: 1.8;">
                At SkipperX, we believe in empowering individuals with skills that fulfill their passion and lead to meaningful careers. Our platform offers industry-relevant courses designed by experts to help you stay ahead in today's competitive landscape.
              </p>
              
              <!-- Features Box -->
              <div style="background: linear-gradient(135deg, #FFF5EF 0%, #FFF 100%); border-left: 4px solid #E46D1E; padding: 25px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #1F1F1F; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
                  What's Next?
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #1F1F1F;">
                  <li style="margin-bottom: 10px; font-size: 14px;">Explore our wide range of courses tailored to your interests</li>
                  <li style="margin-bottom: 10px; font-size: 14px;">Connect with a community of 20,000+ active learners</li>
                  <li style="margin-bottom: 10px; font-size: 14px;">Access hands-on projects and real-world case studies</li>
                  <li style="margin-bottom: 0; font-size: 14px;">Get personalized guidance from industry professionals</li>
                </ul>
              </div>
              
              <p style="font-size: 14px; margin: 30px 0 20px 0; color: #1F1F1F; line-height: 1.8;">
                Your dashboard is ready and waiting for you. Start exploring courses, track your progress, and take the first step towards achieving your learning goals.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="https://skipperx.io/dashboard" style="display: inline-block; background: linear-gradient(135deg, #E46D1E 0%, #d15c10 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(228, 109, 30, 0.3);">
                  Get Started Now
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin: 30px 0 0 0; text-align: center;">
                If you have any questions, our support team is here to help you every step of the way.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #1F1F1F; padding: 30px; text-align: center;">
              <p style="font-size: 16px; color: #E46D1E; margin: 0 0 10px 0; font-weight: 600;">
                Lead the Change
              </p>
              <p style="font-size: 14px; color: #ffffff; margin: 0 0 15px 0;">
                SkipperX - Empowering Your Future
              </p>
              <p style="font-size: 12px; color: #999; margin: 0;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
            
          </div>
        </body>
      </html>
    `;
  }
}

export default new EmailService();
