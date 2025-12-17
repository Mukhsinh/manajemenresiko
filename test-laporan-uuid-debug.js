const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testLaporanDownload() {
  console.log('=== Testing Laporan Download UUID Issue ===\n');

  try {
    // Test 1: Login to get token
    console.log('1. Testing login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    console.log('✓ Login successful, token obtained');

    // Test 2: Test user debug endpoint
    console.log('\n2. Testing user debug...');
    const userDebugResponse = await fetch(`${BASE_URL}/api/reports/user-debug`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (userDebugResponse.ok) {
      const userData = await userDebugResponse.json();
      console.log('✓ User debug data:', JSON.stringify(userData, null, 2));
    } else {
      console.log('✗ User debug failed:', userDebugResponse.status);
    }

    // Test 3: Test risk register endpoint (data only)
    console.log('\n3. Testing risk register data...');
    const riskRegisterResponse = await fetch(`${BASE_URL}/api/reports/risk-register`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (riskRegisterResponse.ok) {
      const riskData = await riskRegisterResponse.json();
      console.log('✓ Risk register data count:', riskData.length);
      if (riskData.length > 0) {
        console.log('Sample data:', JSON.stringify(riskData[0], null, 2));
      }
    } else {
      const errorText = await riskRegisterResponse.text();
      console.log('✗ Risk register failed:', riskRegisterResponse.status, errorText);
    }

    // Test 4: Test Excel download endpoint
    console.log('\n4. Testing Excel download...');
    const excelResponse = await fetch(`${BASE_URL}/api/reports/risk-register/excel`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (excelResponse.ok) {
      const contentType = excelResponse.headers.get('content-type');
      const contentLength = excelResponse.headers.get('content-length');
      console.log('✓ Excel download successful');
      console.log('Content-Type:', contentType);
      console.log('Content-Length:', contentLength);
    } else {
      const errorText = await excelResponse.text();
      console.log('✗ Excel download failed:', excelResponse.status);
      console.log('Error details:', errorText);
      
      // Try to parse as JSON to see the error
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Parsed error:', errorJson);
      } catch (e) {
        console.log('Raw error text:', errorText);
      }
    }

    // Test 5: Test without auth (debug endpoint)
    console.log('\n5. Testing debug Excel without auth...');
    const debugExcelResponse = await fetch(`${BASE_URL}/api/reports/risk-register-excel-debug`);

    if (debugExcelResponse.ok) {
      const contentType = debugExcelResponse.headers.get('content-type');
      const contentLength = debugExcelResponse.headers.get('content-length');
      console.log('✓ Debug Excel download successful');
      console.log('Content-Type:', contentType);
      console.log('Content-Length:', contentLength);
    } else {
      const errorText = await debugExcelResponse.text();
      console.log('✗ Debug Excel download failed:', debugExcelResponse.status);
      console.log('Error details:', errorText);
    }

    // Test 6: Test other report endpoints
    const reportEndpoints = [
      '/api/reports/risk-profile/excel',
      '/api/reports/residual-risk/excel',
      '/api/reports/risk-appetite/excel',
      '/api/reports/kri/excel',
      '/api/reports/monitoring/excel'
    ];

    for (const endpoint of reportEndpoints) {
      console.log(`\n6. Testing ${endpoint}...`);
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log(`✓ ${endpoint} successful - ${contentType}`);
      } else {
        const errorText = await response.text();
        console.log(`✗ ${endpoint} failed: ${response.status}`);
        
        // Check if it's the UUID error
        if (errorText.includes('invalid input syntax for type uuid')) {
          console.log('🔍 UUID ERROR FOUND:', errorText);
        }
      }
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run the test
testLaporanDownload().catch(console.error);