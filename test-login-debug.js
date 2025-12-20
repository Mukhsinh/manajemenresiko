/**
 * Debug login functionality in detail
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function debugLogin() {
  console.log('🔍 Debugging Login Functionality...\n');

  try {
    // Test 1: Register a new user first
    console.log('1. Registering a new test user...');
    const testEmail = `debug.${Date.now()}@test.com`;
    const testPassword = 'debugpassword123';
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
        email: testEmail,
        password: testPassword,
        name: 'Debug User',
        organization_name: 'Debug Organization'
      });
      
      console.log(`   ✓ Registration: ${registerResponse.status}`);
      console.log(`   ✓ Response data:`, JSON.stringify(registerResponse.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Registration response: ${error.response.status} - ${error.response.data.error}`);
      } else {
        console.log(`   ✗ Registration error: ${error.message}`);
      }
    }

    // Test 2: Login with the new user
    console.log('\n2. Testing login with new user...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      
      console.log(`   ✓ Login status: ${loginResponse.status}`);
      console.log(`   ✓ Full login response:`, JSON.stringify(loginResponse.data, null, 2));
      
      // Check what's in the response
      if (loginResponse.data.session) {
        console.log(`   ✓ Session exists: Yes`);
        console.log(`   ✓ Access token: ${loginResponse.data.session.access_token ? 'Yes' : 'No'}`);
        console.log(`   ✓ Token length: ${loginResponse.data.session.access_token ? loginResponse.data.session.access_token.length : 0}`);
        
        if (loginResponse.data.session.access_token) {
          console.log(`   ✓ Token preview: ${loginResponse.data.session.access_token.substring(0, 50)}...`);
        }
      } else {
        console.log(`   ✗ Session missing from response`);
      }
      
      if (loginResponse.data.user) {
        console.log(`   ✓ User data exists: Yes`);
        console.log(`   ✓ User ID: ${loginResponse.data.user.id}`);
        console.log(`   ✓ User email: ${loginResponse.data.user.email}`);
      } else {
        console.log(`   ✗ User data missing from response`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ✗ Login error: ${error.response.status} - ${error.response.statusText}`);
        console.log(`   ✗ Error data:`, JSON.stringify(error.response.data, null, 2));
      } else {
        console.log(`   ✗ Login error: ${error.message}`);
      }
    }

    // Test 3: Login with existing admin user
    console.log('\n3. Testing login with admin user...');
    try {
      const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@test.com',
        password: 'admin123'
      });
      
      console.log(`   ✓ Admin login status: ${adminLoginResponse.status}`);
      console.log(`   ✓ Admin login response:`, JSON.stringify(adminLoginResponse.data, null, 2));
      
      // Test the token if it exists
      if (adminLoginResponse.data.session && adminLoginResponse.data.session.access_token) {
        console.log('\n4. Testing token validation...');
        const token = adminLoginResponse.data.session.access_token;
        
        try {
          const testResponse = await axios.get(`${BASE_URL}/api/users/debug`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log(`   ✓ Token validation: ${testResponse.status} - Working`);
          console.log(`   ✓ User info:`, JSON.stringify(testResponse.data, null, 2));
          
        } catch (tokenError) {
          if (tokenError.response) {
            console.log(`   ✗ Token validation: ${tokenError.response.status} - ${tokenError.response.data.error}`);
          } else {
            console.log(`   ✗ Token validation error: ${tokenError.message}`);
          }
        }
      } else {
        console.log(`   ✗ No token in admin login response`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ✗ Admin login error: ${error.response.status} - ${error.response.statusText}`);
        console.log(`   ✗ Error data:`, JSON.stringify(error.response.data, null, 2));
      } else {
        console.log(`   ✗ Admin login error: ${error.message}`);
      }
    }

    console.log('\n✅ Login debugging completed!');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    process.exit(1);
  }
}

// Run debug
debugLogin();