import axios from 'axios';
import readline from 'readline';

const BASE_URL = 'http://localhost:5000/api';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testEmailFlow() {
  console.log('\n' + '='.repeat(70));
  console.log('📧 EMAIL OTP FLOW TEST');
  console.log('='.repeat(70));
  
  const email = 'abbasbaqri234@gmail.com';
  
  try {
    // Step 1: Send OTP
    console.log('\n📤 Step 1: Sending OTP to', email);
    const sendResponse = await axios.post(`${BASE_URL}/auth/send-otp`, { email });
    
    console.log('✅ Response:', JSON.stringify(sendResponse.data, null, 2));
    
    const devOtp = sendResponse.data.data.otp;
    
    if (devOtp) {
      console.log('\n🔑 OTP (from dev response):', devOtp);
    }
    
    console.log('\n📬 Please check your email inbox:', email);
    console.log('   From: onboarding@resend.dev');
    console.log('   Subject: Your SkipperX Login OTP');
    
    // Step 2: Get OTP from user
    const otpInput = await question('\n✏️  Enter the OTP you received (or press Enter to use dev OTP): ');
    const otp = otpInput.trim() || devOtp;
    
    if (!otp) {
      console.log('❌ No OTP provided');
      return;
    }
    
    // Step 3: Verify OTP
    console.log('\n🔍 Step 2: Verifying OTP...');
    const verifyResponse = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      email,
      otp: String(otp)
    });
    
    console.log('✅ Verification successful!');
    console.log('\n👤 User Details:');
    console.log(JSON.stringify(verifyResponse.data.data.user, null, 2));
    console.log('\n🎟️  Token:', verifyResponse.data.data.token.substring(0, 50) + '...');
    console.log('🆕 Is New User:', verifyResponse.data.data.isNewUser);
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testSMSFlow() {
  console.log('\n' + '='.repeat(70));
  console.log('📱 SMS OTP FLOW TEST');
  console.log('='.repeat(70));
  
  const phone = '+919456916070';
  
  try {
    // Step 1: Send OTP via MessageCentral
    console.log('\n📤 Step 1: Requesting OTP from MessageCentral for', phone);
    console.log('⚠️  MessageCentral will generate and send the OTP');
    
    const sendResponse = await axios.post(`${BASE_URL}/auth/send-otp`, { phone });
    
    console.log('✅ Response:', JSON.stringify(sendResponse.data, null, 2));
    
    console.log('\n📱 Please check your phone:', phone);
    console.log('   Sender: SKPRX (MessageCentral)');
    console.log('   Message: OTP from MessageCentral');
    console.log('\n⏰ Waiting for you to receive the SMS...');
    
    // Step 2: Get OTP from user
    const otp = await question('\n✏️  Enter the OTP you received on your phone: ');
    
    if (!otp.trim()) {
      console.log('❌ No OTP provided');
      return;
    }
    
    // Step 3: Verify OTP with MessageCentral
    console.log('\n🔍 Step 2: Verifying OTP with MessageCentral...');
    const verifyResponse = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      phone,
      otp: otp.trim()
    });
    
    console.log('✅ Verification successful!');
    console.log('\n👤 User Details:');
    console.log(JSON.stringify(verifyResponse.data.data.user, null, 2));
    console.log('\n🎟️  Token:', verifyResponse.data.data.token.substring(0, 50) + '...');
    console.log('🆕 Is New User:', verifyResponse.data.data.isNewUser);
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function main() {
  console.log('\n🚀 SkipperX OTP Testing Suite');
  console.log('Testing real email and SMS delivery\n');
  
  const choice = await question('Choose test:\n1. Email OTP (Resend)\n2. SMS OTP (MessageCentral)\n3. Both\n\nEnter choice (1/2/3): ');
  
  let emailSuccess = false;
  let smsSuccess = false;
  
  if (choice === '1' || choice === '3') {
    emailSuccess = await testEmailFlow();
    
    if (choice === '3') {
      console.log('\n⏳ Waiting 65 seconds for rate limit before SMS test...');
      await new Promise(r => setTimeout(r, 65000));
    }
  }
  
  if (choice === '2' || choice === '3') {
    smsSuccess = await testSMSFlow();
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  
  if (choice === '1') {
    console.log('Email OTP:', emailSuccess ? '✅ PASSED' : '❌ FAILED');
  } else if (choice === '2') {
    console.log('SMS OTP:', smsSuccess ? '✅ PASSED' : '❌ FAILED');
  } else {
    console.log('Email OTP:', emailSuccess ? '✅ PASSED' : '❌ FAILED');
    console.log('SMS OTP:', smsSuccess ? '✅ PASSED' : '❌ FAILED');
  }
  
  console.log('\n💡 Tips:');
  console.log('- Check email inbox: abbasbaqri234@gmail.com');
  console.log('- Check phone SMS: +919456916070');
  console.log('- Check server logs for detailed API responses');
  console.log('- MessageCentral generates their own OTP for SMS');
  console.log('\n');
  
  rl.close();
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
