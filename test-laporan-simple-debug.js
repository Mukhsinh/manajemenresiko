// Simple test to debug UUID issue in laporan download
const http = require('http');
const https = require('https');
const { URL } = require('url');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testLaporanUUID() {
  console.log('=== Testing Laporan UUID Issue ===\n');
  
  const BASE_URL = 'http://localhost:3000';

  try {
    // Test 1: Login
    console.log('1. Testing login...');
    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    if (loginResponse.status !== 200) {
      console.log('✗ Login failed:', loginResponse.status, loginResponse.body);
      return;
    }

    const loginData = JSON.parse(loginResponse.body);
    const token = loginData.access_token;
    console.log('✓ Login successful');

    // Test 2: Test Excel download that's failing
    console.log('\n2. Testing Excel download (the failing one)...');
    const excelResponse = await makeRequest(`${BASE_URL}/api/reports/risk-register/excel`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Excel Response Status:', excelResponse.status);
    console.log('Excel Response Headers:', excelResponse.headers);
    
    if (excelResponse.status !== 200) {
      console.log('✗ Excel download failed');
      console.log('Error body:', excelResponse.body);
      
      // Check if it contains UUID error
      if (excelResponse.body.includes('invalid input syntax for type uuid')) {
        console.log('🔍 FOUND UUID ERROR!');
        console.log('Error details:', excelResponse.body);
      }
    } else {
      console.log('✓ Excel download successful');
    }

    // Test 3: Test debug endpoint without auth
    console.log('\n3. Testing debug endpoint...');
    const debugResponse = await makeRequest(`${BASE_URL}/api/reports/test-excel-download`);
    
    console.log('Debug Response Status:', debugResponse.status);
    if (debugResponse.status !== 200) {
      console.log('✗ Debug failed:', debugResponse.body);
    } else {
      console.log('✓ Debug successful');
    }

    // Test 4: Test user debug
    console.log('\n4. Testing user debug...');
    const userDebugResponse = await makeRequest(`${BASE_URL}/api/reports/user-debug`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('User Debug Status:', userDebugResponse.status);
    if (userDebugResponse.status === 200) {
      const userData = JSON.parse(userDebugResponse.body);
      console.log('✓ User data:', JSON.stringify(userData, null, 2));
    } else {
      console.log('✗ User debug failed:', userDebugResponse.body);
    }

    // Test 5: Test other endpoints that might have UUID issues
    const testEndpoints = [
      '/api/reports/risk-profile/excel',
      '/api/reports/residual-risk/excel',
      '/api/reports/monitoring/excel'
    ];

    for (const endpoint of testEndpoints) {
      console.log(`\n5. Testing ${endpoint}...`);
      const response = await makeRequest(`${BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`${endpoint} Status:`, response.status);
      if (response.status !== 200) {
        console.log(`✗ ${endpoint} failed`);
        if (response.body.includes('invalid input syntax for type uuid')) {
          console.log('🔍 UUID ERROR in', endpoint);
          console.log('Error:', response.body.substring(0, 200));
        }
      } else {
        console.log(`✓ ${endpoint} successful`);
      }
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run test
testLaporanUUID().catch(console.error);