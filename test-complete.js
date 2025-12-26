import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
let emailOTP = null;
let phoneOTP = null;
let token = null;

async function step1_sendEmailOTP() {
  try {
    console.log('\n=== STEP 1: Send Email OTP ===');
    const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
      email: 'abbasbaqri234@gmail.com'
    });
    
    emailOTP = response.data.data.otp;
    console.log('✅ Email OTP sent successfully');
    console.log(`   OTP: ${emailOTP}`);
    console.log(`   Check your email: abbasbaqri234@gmail.com`);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function step2_verifyEmailOTP() {
  try {
    console.log('\n=== STEP 2: Verify Email OTP ===');
    const response = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      email: 'abbasbaqri234@gmail.com',
      otp: String(emailOTP)
    });
    
    token = response.data.data.token;
    console.log('✅ Email OTP verified successfully');
    console.log(`   User ID: ${response.data.data.user.id}`);
    console.log(`   Email: ${response.data.data.user.email}`);
    console.log(`   Token: ${token.substring(0, 30)}...`);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function step3_getCurrentUser() {
  try {
    console.log('\n=== STEP 3: Get Current User (Protected Route) ===');
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ User profile retrieved successfully');
    console.log(JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function step4_sendPhoneOTP() {
  try {
    console.log('\n=== STEP 4: Send Phone OTP ===');
    const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
      phone: '+919456916070'
    });
    
    phoneOTP = response.data.data.otp;
    console.log('✅ Phone OTP sent successfully');
    console.log(`   OTP: ${phoneOTP}`);
    console.log(`   Check your phone: +919456916070`);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function step5_verifyPhoneOTP() {
  try {
    console.log('\n=== STEP 5: Verify Phone OTP ===');
    const response = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      phone: '+919456916070',
      otp: String(phoneOTP)
    });
    
    console.log('✅ Phone OTP verified successfully');
    console.log(`   User ID: ${response.data.data.user.id}`);
    console.log(`   Phone: ${response.data.data.user.phone}`);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function runCompleteTest() {
  console.log('🚀 Starting Complete OTP Flow Test');
  console.log('Testing with:');
  console.log('  Email: abbasbaqri234@gmail.com');
  console.log('  Phone: +919456916070');
  
  let success = 0;
  let total = 5;
  
  if (await step1_sendEmailOTP()) success++;
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (await step2_verifyEmailOTP()) success++;
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (await step3_getCurrentUser()) success++;
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (await step4_sendPhoneOTP()) success++;
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (await step5_verifyPhoneOTP()) success++;
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Test Results: ${success}/${total} passed`);
  console.log('='.repeat(60));
  
  if (success === total) {
    console.log('🎉 All tests passed! Backend is fully functional!');
  } else {
    console.log('⚠️  Some tests failed. Check logs above.');
  }
}

runCompleteTest();
