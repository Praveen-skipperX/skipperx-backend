import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test 1: Send Email OTP
async function testEmail() {
  console.log('\n📧 TEST 1: Email OTP');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
      email: 'abbasbaqri234@gmail.com'
    }, {
      timeout: 15000
    });
    
    console.log('✅ API Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n📬 Status: OTP Generated');
      console.log('📧 OTP:', response.data.data.otp);
      console.log('⏰ Expires:', new Date(response.data.data.expiresAt).toLocaleString());
      console.log('\n⚠️  Check server logs to see if email was actually sent');
      console.log('⚠️  Also check your inbox: abbasbaqri234@gmail.com');
      return response.data.data.otp;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Test 2: Verify Email OTP
async function verifyEmail(otp) {
  if (!otp) {
    console.log('\n⏭️  Skipping verification - no OTP');
    return;
  }
  
  console.log('\n✔️  TEST 2: Verify Email OTP');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      email: 'abbasbaqri234@gmail.com',
      otp: String(otp)
    });
    
    console.log('✅ Verification successful!');
    console.log(JSON.stringify(response.data, null, 2));
    
    const userData = response.data.data.user;
    console.log('\n👤 User Details:');
    console.log('   ID:', userData.id);
    console.log('   Email:', userData.email);
    console.log('   Phone:', userData.phone || 'Not set');
    console.log('   Is New User:', response.data.data.isNewUser);
    console.log('   Profile Completed:', userData.profileCompleted);
    console.log('   Created:', new Date(userData.createdAt).toLocaleString());
    console.log('   Updated:', new Date(userData.updatedAt).toLocaleString());
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Test 3: Send Phone OTP
async function testPhone() {
  console.log('\n\n📱 TEST 3: Phone OTP');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
      phone: '+919456916070'
    }, {
      timeout: 15000
    });
    
    console.log('✅ API Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n📬 Status: OTP Generated');
      console.log('📱 OTP:', response.data.data.otp);
      console.log('⏰ Expires:', new Date(response.data.data.expiresAt).toLocaleString());
      console.log('\n⚠️  Check server logs to see if SMS was actually sent');
      console.log('⚠️  Also check your phone: +919456916070');
      return response.data.data.otp;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Test 4: Verify Phone OTP
async function verifyPhone(otp) {
  if (!otp) {
    console.log('\n⏭️  Skipping verification - no OTP');
    return;
  }
  
  console.log('\n✔️  TEST 4: Verify Phone OTP');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      phone: '+919456916070',
      otp: String(otp)
    });
    
    console.log('✅ Verification successful!');
    console.log(JSON.stringify(response.data, null, 2));
    
    const userData = response.data.data.user;
    console.log('\n👤 User Details:');
    console.log('   ID:', userData.id);
    console.log('   Email:', userData.email || 'Not set');
    console.log('   Phone:', userData.phone);
    console.log('   Is New User:', response.data.data.isNewUser);
    console.log('   Profile Completed:', userData.profileCompleted);
    console.log('   Created:', new Date(userData.createdAt).toLocaleString());
    console.log('   Updated:', new Date(userData.updatedAt).toLocaleString());
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function runTests() {
  console.log('\n🚀 Complete OTP Flow Test');
  console.log('Testing: abbasbaqri234@gmail.com & +919456916070');
  console.log('='.repeat(60));
  
  // Test email flow
  const emailOTP = await testEmail();
  await new Promise(r => setTimeout(r, 3000));
  await verifyEmail(emailOTP);
  
  // Wait for rate limit
  console.log('\n⏳ Waiting 65 seconds for rate limit...');
  await new Promise(r => setTimeout(r, 65000));
  
  // Test phone flow
  const phoneOTP = await testPhone();
  await new Promise(r => setTimeout(r, 3000));
  await verifyPhone(phoneOTP);
  
  console.log('\n\n✅ All tests complete!');
  console.log('Check:');
  console.log('1. Server terminal for detailed logs');
  console.log('2. Your email inbox: abbasbaqri234@gmail.com');
  console.log('3. Your phone SMS: +919456916070');
  console.log('\n');
}

runTests();
