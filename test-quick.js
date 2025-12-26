import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testEmailOTP() {
  try {
    console.log('Testing email OTP...');
    const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
      email: 'abbasbaqri234@gmail.com'
    });
    
    console.log('✅ Email OTP Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testPhoneOTP() {
  try {
    console.log('\nTesting phone OTP...');
    const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
      phone: '+919456916070'
    });
    
    console.log('✅ Phone OTP Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function runTests() {
  await testEmailOTP();
  await new Promise(resolve => setTimeout(resolve, 2000));
  await testPhoneOTP();
}

runTests();
