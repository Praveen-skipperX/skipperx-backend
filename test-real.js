import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testRealEmail() {
  console.log('\n🧪 Testing Real Email OTP\n');
  console.log('=' .repeat(60));
  
  try {
    console.log('📤 Sending OTP to: abbasbaqri234@gmail.com');
    
    const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
      email: 'abbasbaqri234@gmail.com'
    });
    
    console.log('\n✅ Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.data.otp) {
      console.log('\n📧 OTP:', response.data.data.otp);
      console.log('⏰ Expires at:', response.data.data.expiresAt);
      console.log('\n📬 Please check your email: abbasbaqri234@gmail.com');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

async function testRealPhone() {
  console.log('\n\n🧪 Testing Real Phone OTP\n');
  console.log('='.repeat(60));
  
  try {
    console.log('📤 Sending OTP to: +919456916070');
    
    const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
      phone: '+919456916070'
    });
    
    console.log('\n✅ Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.data.otp) {
      console.log('\n📱 OTP:', response.data.data.otp);
      console.log('⏰ Expires at:', response.data.data.expiresAt);
      console.log('\n📲 Please check your phone: +919456916070');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('\n');
  console.log('🚀 Real OTP Testing Suite');
  console.log('Testing with actual email and phone delivery\n');
  
  // Test email first
  await testRealEmail();
  
  // Wait 65 seconds before testing phone (rate limit)
  console.log('\n\n⏳ Waiting 65 seconds for rate limit...');
  await new Promise(resolve => setTimeout(resolve, 65000));
  
  // Test phone
  await testRealPhone();
  
  console.log('\n\n✅ Testing complete!');
  console.log('Check your email and phone for OTP messages.\n');
}

runTests();
