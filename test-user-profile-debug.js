/**
 * Debug user profile endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function debugUserProfile() {
  console.log('🔍 Debugging User Profile Endpoint...\n');

  try {
    // Get test token
    console.log('1. Getting test token...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    const testToken = loginResponse.data.session?.access_token || loginResponse.data.token;
    console.log(`   ✓ Token obtained: ${testToken ? 'Yes' : 'No'}`);
    console.log(`   ✓ Token length: ${testToken ? testToken.length : 0}`);

    if (!testToken) {
      console.log('   ✗ No token available, cannot continue');
      return;
    }

    // Test debug endpoint first
    console.log('\n2. Testing debug endpoint...');
    try {
      const debugResponse = await axios.get(`${BASE_URL}/api/users/debug`, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log(`   ✓ Debug response: ${debugResponse.status}`);
      console.log(`   ✓ Debug data:`, JSON.stringify(debugResponse.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log(`   ✗ Debug error: ${error.response.status} - ${error.response.statusText}`);
        console.log(`   ✗ Error data:`, JSON.stringify(error.response.data, null, 2));
      } else {
        console.log(`   ✗ Debug error: ${error.message}`);
      }
    }

    // Test user profile endpoint
    console.log('\n3. Testing user profile endpoint...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log(`   ✓ Profile response: ${profileResponse.status}`);
      console.log(`   ✓ Profile data:`, JSON.stringify(profileResponse.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log(`   ✗ Profile error: ${error.response.status} - ${error.response.statusText}`);
        console.log(`   ✗ Error data:`, JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 500) {
          console.log('   ⚠️  This is a server error - check server logs for details');
        }
      } else if (error.request) {
        console.log(`   ✗ No response received: ${error.message}`);
      } else {
        console.log(`   ✗ Request error: ${error.message}`);
      }
    }

    // Test a simple endpoint to verify token works
    console.log('\n4. Testing token with auth verification...');
    try {
      const verifyResponse = await axios.get(`${BASE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      console.log(`   ✓ Token verification: ${verifyResponse.status} - Valid`);
    } catch (error) {
      if (error.response) {
        console.log(`   ✗ Token verification: ${error.response.status} - ${error.response.data.error}`);
      } else {
        console.log(`   ✗ Token verification error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run debug
debugUserProfile();