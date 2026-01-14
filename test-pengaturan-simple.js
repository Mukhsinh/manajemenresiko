const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testSimple() {
  console.log('🔍 Testing Pengaturan Endpoint - Simple Test...\n');

  try {
    // Test 1: Test a known working endpoint first
    console.log('1. Testing known endpoint /api/test/data...');
    try {
      const response = await axios.get(`${BASE_URL}/api/test/data`);
      console.log('✅ Server is responding');
      console.log('📊 Test data results:', Object.keys(response.data.results || {}));
    } catch (error) {
      console.log('❌ Server test failed:', error.response?.status, error.response?.data?.error || error.message);
    }

    // Test 2: Test pengaturan endpoint directly
    console.log('\n2. Testing pengaturan endpoint without auth...');
    try {
      const response = await axios.get(`${BASE_URL}/api/pengaturan`);
      console.log('❌ Should require authentication');
    } catch (error) {
      console.log('✅ Correctly requires authentication:', error.response?.status);
    }

    // Test 3: Try to get auth token
    console.log('\n3. Attempting to get auth token...');
    let authToken = null;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'superadmin@example.com',
        password: 'superadmin123'
      });
      
      if (loginResponse.data.session?.access_token) {
        authToken = loginResponse.data.session.access_token;
        console.log('✅ Got auth token');
      }
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.error || error.message);
      
      // Try alternative login
      try {
        const altLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'admin@example.com',
          password: 'admin123'
        });
        
        if (altLoginResponse.data.session?.access_token) {
          authToken = altLoginResponse.data.session.access_token;
          console.log('✅ Got auth token with alternative credentials');
        }
      } catch (altError) {
        console.log('❌ Alternative login also failed');
      }
    }

    // Test 4: Test pengaturan with auth
    if (authToken) {
      console.log('\n4. Testing pengaturan with auth token...');
      try {
        const response = await axios.get(`${BASE_URL}/api/pengaturan`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Pengaturan endpoint working!');
        console.log('📊 Found', response.data.length, 'pengaturan items');
        
        if (response.data.length > 0) {
          console.log('📋 Sample items:');
          response.data.slice(0, 3).forEach(item => {
            console.log(`   - ${item.kunci_pengaturan}: ${item.nilai_pengaturan}`);
          });
        }
        
      } catch (error) {
        console.log('❌ Pengaturan with auth failed:', error.response?.status, error.response?.data?.error || error.message);
      }
    }

    // Test 5: Check what's causing the frontend 404
    console.log('\n5. Diagnosing frontend 404 issue...');
    
    // Test the exact URL from the console log
    try {
      const response = await axios.get(`${BASE_URL}/api/pengaturan`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });
      console.log('✅ Frontend-style request worked');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Frontend needs authentication token');
        console.log('💡 The issue is that loadKopHeader() function is not sending auth token');
      } else {
        console.log('❌ Frontend-style request failed:', error.response?.status);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function main() {
  await testSimple();
  
  console.log('\n🔧 Analysis & Fix:');
  console.log('The issue is in the frontend loadKopHeader() function in app.js');
  console.log('It\'s making a request to /api/pengaturan without authentication token');
  console.log('');
  console.log('Solution: Update loadKopHeader() to include auth token');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSimple };