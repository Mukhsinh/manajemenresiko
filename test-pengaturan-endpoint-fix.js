const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testPengaturanEndpoint() {
  console.log('🔍 Testing Pengaturan Endpoint Fix...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    try {
      const response = await axios.get(`${BASE_URL}/api/test`);
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server connection failed:', error.message);
      return;
    }

    // Test 2: Test pengaturan endpoint without auth (should fail)
    console.log('\n2. Testing pengaturan endpoint without auth...');
    try {
      const response = await axios.get(`${BASE_URL}/api/pengaturan`);
      console.log('❌ Endpoint should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test 3: Get a valid token first
    console.log('\n3. Getting authentication token...');
    let authToken = null;
    
    try {
      // Try to login with test credentials
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'superadmin@example.com',
        password: 'superadmin123'
      });
      
      if (loginResponse.data.session?.access_token) {
        authToken = loginResponse.data.session.access_token;
        console.log('✅ Authentication successful');
      } else {
        console.log('❌ No access token in response');
        return;
      }
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
      return;
    }

    // Test 4: Test pengaturan endpoint with auth
    console.log('\n4. Testing pengaturan endpoint with authentication...');
    try {
      const response = await axios.get(`${BASE_URL}/api/pengaturan`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Pengaturan endpoint working!');
      console.log('📊 Data received:', response.data.length, 'items');
      
      // Show first few items
      if (response.data.length > 0) {
        console.log('\n📋 Sample data:');
        response.data.slice(0, 3).forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.kunci_pengaturan}: ${item.nilai_pengaturan}`);
        });
      }
      
    } catch (error) {
      console.log('❌ Pengaturan endpoint failed:', error.response?.status, error.response?.data);
      
      // Additional debugging
      if (error.response?.status === 404) {
        console.log('🔍 404 Error - checking route registration...');
        
        // Test if the route exists at all
        try {
          const optionsResponse = await axios.options(`${BASE_URL}/api/pengaturan`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          console.log('✅ Route exists (OPTIONS worked)');
        } catch (optionsError) {
          console.log('❌ Route does not exist or server issue');
        }
      }
    }

    // Test 5: Test specific pengaturan key
    console.log('\n5. Testing specific pengaturan key...');
    try {
      const response = await axios.get(`${BASE_URL}/api/pengaturan/nama_aplikasi`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Specific key endpoint working!');
      console.log('📊 Data:', response.data);
      
    } catch (error) {
      console.log('❌ Specific key endpoint failed:', error.response?.status, error.response?.data);
    }

    // Test 6: Test update pengaturan
    console.log('\n6. Testing pengaturan update...');
    try {
      const updateResponse = await axios.put(`${BASE_URL}/api/pengaturan/test_key`, {
        nilai_pengaturan: 'Test Value ' + Date.now()
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Update endpoint working!');
      console.log('📊 Update result:', updateResponse.data.message);
      
    } catch (error) {
      console.log('❌ Update endpoint failed:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if we can also test the frontend loading issue
async function testKopHeaderEndpoint() {
  console.log('\n🔍 Testing Kop Header Issue...\n');
  
  try {
    // Test the specific endpoint that's failing in the console
    const response = await axios.get(`${BASE_URL}/api/pengaturan`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Kop header endpoint accessible without auth');
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Kop header endpoint correctly requires authentication');
      console.log('💡 Frontend needs to include auth token in loadKopHeader function');
    } else if (error.response?.status === 404) {
      console.log('❌ Kop header endpoint not found - route registration issue');
    } else {
      console.log('❌ Kop header endpoint error:', error.response?.status, error.response?.data);
    }
  }
}

async function main() {
  await testPengaturanEndpoint();
  await testKopHeaderEndpoint();
  
  console.log('\n🔧 Recommendations:');
  console.log('1. Ensure server is running on port 3001');
  console.log('2. Check that pengaturan route is properly registered in server.js');
  console.log('3. Verify authentication middleware is working');
  console.log('4. Update frontend loadKopHeader function to include auth token');
  console.log('5. Check browser console for specific error details');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testPengaturanEndpoint, testKopHeaderEndpoint };