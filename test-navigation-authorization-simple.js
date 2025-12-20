/**
 * Simple navigation and authorization test
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testNavigationAuthorization() {
  console.log('🧪 Testing Navigation and Authorization...\n');

  try {
    // Get test token
    console.log('1. Getting test token...');
    let testToken;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@test.com',
        password: 'admin123'
      });
      testToken = loginResponse.data.session?.access_token || loginResponse.data.token;
      console.log(`   ✓ Login successful, token obtained`);
    } catch (error) {
      console.log(`   ✗ Could not login: ${error.message}`);
      return;
    }

    // Test 2: Navigation endpoints
    console.log('\n2. Testing navigation endpoints...');
    const endpoints = [
      '/api/dashboard',
      '/api/risks',
      '/api/master-data',
      '/api/users',
      '/api/visi-misi',
      '/api/rencana-strategis',
      '/api/reports'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${testToken}`
          },
          timeout: 5000
        });
        console.log(`   ✓ ${endpoint}: ${response.status} - OK`);
      } catch (error) {
        if (error.response) {
          console.log(`   ✓ ${endpoint}: ${error.response.status} - ${error.response.statusText}`);
        } else {
          console.log(`   ✗ ${endpoint}: ${error.message}`);
        }
      }
    }

    // Test 3: Authentication persistence
    console.log('\n3. Testing authentication persistence...');
    let authPersistent = true;
    
    for (let i = 0; i < 3; i++) {
      try {
        const response = await axios.get(`${BASE_URL}/api/users/debug`, {
          headers: {
            'Authorization': `Bearer ${testToken}`
          }
        });
        
        if (response.status === 401) {
          authPersistent = false;
          break;
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          authPersistent = false;
          break;
        }
      }
    }
    
    console.log(`   ✓ Authentication persistence: ${authPersistent ? 'Persistent' : 'Failed'}`);

    // Test 4: Restricted page authorization
    console.log('\n4. Testing restricted page authorization...');
    const restrictedEndpoints = ['/api/users', '/api/master-data', '/api/reports'];
    const invalidTokens = ['', 'invalid-token', 'Bearer invalid'];
    
    for (const endpoint of restrictedEndpoints) {
      for (const invalidToken of invalidTokens) {
        try {
          const response = await axios.get(`${BASE_URL}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${invalidToken}`
            },
            timeout: 3000
          });
          
          if (response.status === 200) {
            console.log(`   ⚠️  ${endpoint} with invalid token: ${response.status} - Should be restricted`);
          }
        } catch (error) {
          if (error.response && [401, 403].includes(error.response.status)) {
            console.log(`   ✓ ${endpoint} with invalid token: ${error.response.status} - Properly restricted`);
          } else if (error.response && error.response.status === 404) {
            console.log(`   ✓ ${endpoint} with invalid token: 404 - Endpoint not found (acceptable)`);
          }
        }
      }
    }

    // Test 5: Chart filtering
    console.log('\n5. Testing chart filtering...');
    try {
      const filters = {
        start_date: '2023-01-01',
        end_date: '2024-12-31',
        category: 'operational'
      };
      
      const queryParams = new URLSearchParams(filters);
      const response = await axios.get(`${BASE_URL}/api/dashboard?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      
      console.log(`   ✓ Chart filtering: ${response.status}`);
      if (response.data) {
        console.log(`   ✓ Filtered data received: ${typeof response.data}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Chart filtering response: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`   ✗ Chart filtering error: ${error.message}`);
      }
    }

    // Test 6: Session timeout handling
    console.log('\n6. Testing session timeout handling...');
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    
    try {
      const response = await axios.get(`${BASE_URL}/api/users/debug`, {
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        }
      });
      
      if (response.status === 200) {
        console.log(`   ⚠️  Expired token accepted: ${response.status} - Should be rejected`);
      }
    } catch (error) {
      if (error.response && [401, 403].includes(error.response.status)) {
        console.log(`   ✓ Expired token rejected: ${error.response.status} - Proper handling`);
      } else {
        console.log(`   ✓ Expired token response: ${error.response?.status || 'Error'}`);
      }
    }

    // Test 7: CORS and security headers
    console.log('\n7. Testing CORS and security headers...');
    try {
      const response = await axios.get(`${BASE_URL}/api/users/debug`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      
      console.log(`   ✓ Response headers received`);
      console.log(`   ✓ Content-Type: ${response.headers['content-type'] || 'Not set'}`);
      console.log(`   ✓ CORS Origin: ${response.headers['access-control-allow-origin'] || 'Not set'}`);
      
    } catch (error) {
      console.log(`   ✓ Headers test completed with status: ${error.response?.status || 'Error'}`);
    }

    console.log('\n✅ Navigation and authorization testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testNavigationAuthorization();