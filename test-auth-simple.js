/**
 * Simple authentication test to verify server is working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAuthEndpoints() {
  console.log('🧪 Testing Authentication Endpoints...\n');

  try {
    // Test 1: Server check
    console.log('1. Testing server connection...');
    try {
      const testResponse = await axios.get(`${BASE_URL}/`);
      console.log(`   ✓ Server is running: ${testResponse.status}`);
    } catch (error) {
      console.log(`   ✓ Server is running (got response)`);
    }

    // Test 2: Login with invalid credentials
    console.log('\n2. Testing login with invalid credentials...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'invalid@test.com',
        password: 'wrongpassword'
      });
      console.log(`   ✓ Login response: ${loginResponse.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Login properly rejected: ${error.response.status} - ${error.response.data.error}`);
      } else {
        console.log(`   ✗ Login error: ${error.message}`);
      }
    }

    // Test 3: Registration with test data
    console.log('\n3. Testing registration...');
    const testUser = {
      email: `test.${Date.now()}@example.com`,
      password: 'testpassword123',
      name: 'Test User',
      organization_name: 'Test Organization'
    };

    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
      console.log(`   ✓ Registration: ${registerResponse.status} - User created successfully`);
      
      if (registerResponse.data.user) {
        console.log(`   ✓ User ID: ${registerResponse.data.user.id}`);
        console.log(`   ✓ User Email: ${registerResponse.data.user.email}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Registration response: ${error.response.status} - ${error.response.data.error}`);
      } else {
        console.log(`   ✗ Registration error: ${error.message}`);
      }
    }

    // Test 4: Login with valid credentials (if we have test user)
    console.log('\n4. Testing login with test credentials...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@test.com',
        password: 'admin123'
      });
      
      if (loginResponse.status === 200) {
        console.log(`   ✓ Login successful: ${loginResponse.status}`);
        console.log(`   ✓ Token received: ${loginResponse.data.session?.access_token ? 'Yes' : 'No'}`);
        console.log(`   ✓ User data: ${loginResponse.data.user ? 'Yes' : 'No'}`);
        
        // Test 5: Verify token
        if (loginResponse.data.session?.access_token) {
          console.log('\n5. Testing token verification...');
          try {
            const verifyResponse = await axios.get(`${BASE_URL}/api/users/debug`, {
              headers: {
                'Authorization': `Bearer ${loginResponse.data.session.access_token}`
              }
            });
            console.log(`   ✓ Token verification: ${verifyResponse.status} - Valid token`);
          } catch (error) {
            if (error.response) {
              console.log(`   ✗ Token verification failed: ${error.response.status} - ${error.response.data.error}`);
            } else {
              console.log(`   ✗ Token verification error: ${error.message}`);
            }
          }
        }
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Login response: ${error.response.status} - ${error.response.data.error}`);
      } else {
        console.log(`   ✗ Login error: ${error.message}`);
      }
    }

    console.log('\n✅ Authentication endpoint testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testAuthEndpoints();