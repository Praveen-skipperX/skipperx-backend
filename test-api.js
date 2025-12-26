#!/usr/bin/env node

/**
 * Test Script for SkipperX Backend
 * Tests all APIs and functionality
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
let savedToken = '';
let savedOTP = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log('\n' + '='.repeat(60));
  log(`TEST: ${testName}`, 'blue');
  console.log('='.repeat(60));
}

async function test1_healthCheck() {
  logTest('Health Check');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    
    if (response.data.success) {
      log('✅ Health check passed', 'green');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    }
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
    return false;
  }
}

async function test2_sendEmailOTP() {
  logTest('Send OTP to Email');
  
  const testEmail = 'test@example.com';
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
      email: testEmail
    });
    
    if (response.data.success && response.data.data.otp) {
      savedOTP = response.data.data.otp;
      log('✅ Email OTP sent successfully', 'green');
      log(`Email: ${testEmail}`);
      log(`OTP: ${savedOTP}`, 'yellow');
      log(`Expires At: ${response.data.data.expiresAt}`);
      return true;
    }
  } catch (error) {
    log(`❌ Failed to send email OTP: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function test3_sendPhoneOTP() {
  logTest('Send OTP to Phone');
  
  const testPhone = '+919876543210';
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
      phone: testPhone
    });
    
    if (response.data.success && response.data.data.otp) {
      log('✅ SMS OTP sent successfully', 'green');
      log(`Phone: ${testPhone}`);
      log(`OTP: ${response.data.data.otp}`, 'yellow');
      log(`Expires At: ${response.data.data.expiresAt}`);
      return true;
    }
  } catch (error) {
    log(`❌ Failed to send SMS OTP: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function test4_verifyOTP() {
  logTest('Verify OTP and Login');
  
  const testEmail = 'test@example.com';
  
  if (!savedOTP) {
    log('⚠️  No OTP saved, skipping test', 'yellow');
    return false;
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      email: testEmail,
      otp: savedOTP
    });
    
    if (response.data.success && response.data.data.token) {
      savedToken = response.data.data.token;
      log('✅ OTP verified successfully', 'green');
      log(`Token: ${savedToken.substring(0, 50)}...`);
      log(`User ID: ${response.data.data.user.id}`);
      log(`Email: ${response.data.data.user.email}`);
      log(`Verified: ${response.data.data.user.isVerified}`);
      return true;
    }
  } catch (error) {
    log(`❌ OTP verification failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function test5_getCurrentUser() {
  logTest('Get Current User (Protected Route)');
  
  if (!savedToken) {
    log('⚠️  No token saved, skipping test', 'yellow');
    return false;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${savedToken}`
      }
    });
    
    if (response.data.success) {
      log('✅ Got current user successfully', 'green');
      log(`User: ${JSON.stringify(response.data.data, null, 2)}`);
      return true;
    }
  } catch (error) {
    log(`❌ Failed to get current user: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function test6_updateProfile() {
  logTest('Update User Profile (Protected Route)');
  
  if (!savedToken) {
    log('⚠️  No token saved, skipping test', 'yellow');
    return false;
  }
  
  try {
    const response = await axios.put(`${BASE_URL}/auth/profile`, {
      profile: {
        name: 'Test User',
        currentCourse: 'Web Development',
        enrolledCourse: 'Full Stack Development',
        testField: 'Custom Field Value'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${savedToken}`
      }
    });
    
    if (response.data.success) {
      log('✅ Profile updated successfully', 'green');
      log(`Profile: ${JSON.stringify(response.data.data.profile, null, 2)}`);
      log(`Profile Completed: ${response.data.data.profileCompleted}`);
      return true;
    }
  } catch (error) {
    log(`❌ Failed to update profile: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function test7_invalidOTP() {
  logTest('Invalid OTP Test (Should Fail)');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      email: 'test@example.com',
      otp: '9999'
    });
    
    log('❌ Invalid OTP was accepted (this should not happen)', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      log('✅ Invalid OTP correctly rejected', 'green');
      log(`Error message: ${error.response.data.message}`);
      return true;
    } else {
      log(`❌ Unexpected error: ${error.message}`, 'red');
      return false;
    }
  }
}

async function test8_missingAuth() {
  logTest('Missing Authorization Test (Should Fail)');
  
  try {
    const response = await axios.get(`${BASE_URL}/auth/me`);
    log('❌ Request without auth was accepted (this should not happen)', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log('✅ Unauthorized request correctly rejected', 'green');
      log(`Error message: ${error.response.data.message}`);
      return true;
    } else {
      log(`❌ Unexpected error: ${error.message}`, 'red');
      return false;
    }
  }
}

async function runAllTests() {
  console.log('\n');
  log('🚀 Starting SkipperX Backend Test Suite', 'blue');
  log(`Base URL: ${BASE_URL}`, 'blue');
  console.log('\n');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  // Run all tests
  const tests = [
    test1_healthCheck,
    test2_sendEmailOTP,
    test3_sendPhoneOTP,
    test4_verifyOTP,
    test5_getCurrentUser,
    test6_updateProfile,
    test7_invalidOTP,
    test8_missingAuth
  ];
  
  for (const test of tests) {
    results.total++;
    const passed = await test();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  // Print summary
  console.log('\n\n');
  log('═'.repeat(60), 'blue');
  log('TEST SUMMARY', 'blue');
  log('═'.repeat(60), 'blue');
  log(`Total Tests: ${results.total}`);
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 
      results.failed === 0 ? 'green' : 'yellow');
  log('═'.repeat(60), 'blue');
  
  if (results.failed === 0) {
    console.log('\n');
    log('🎉 All tests passed! Backend is working perfectly! 🎉', 'green');
    console.log('\n');
  } else {
    console.log('\n');
    log('⚠️  Some tests failed. Please check the logs above.', 'yellow');
    console.log('\n');
  }
}

// Run tests
runAllTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
