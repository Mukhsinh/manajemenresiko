// Test to verify UUID fix for laporan download
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = http.request(requestOptions, (res) => {
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

async function testUUIDFix() {
  console.log('=== Testing UUID Fix for Laporan Download ===\n');
  
  const BASE_URL = 'http://localhost:3000';

  try {
    // Test 1: Try to login with different credentials
    console.log('1. Testing login...');
    
    const loginCredentials = [
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'test@example.com', password: 'test123' },
      { email: 'user@example.com', password: 'user123' }
    ];

    let token = null;
    
    for (const creds of loginCredentials) {
      try {
        const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(creds)
        });

        if (loginResponse.status === 200) {
          const loginData = JSON.parse(loginResponse.body);
          token = loginData.access_token;
          console.log(`✓ Login successful with ${creds.email}`);
          break;
        } else {
          console.log(`✗ Login failed for ${creds.email}: ${loginResponse.status}`);
        }
      } catch (error) {
        console.log(`✗ Login error for ${creds.email}: ${error.message}`);
      }
    }

    if (!token) {
      console.log('⚠️ No valid login found, testing without auth...');
    }

    // Test 2: Test debug endpoints (no auth required)
    console.log('\n2. Testing debug endpoints...');
    
    const debugEndpoints = [
      '/api/reports/test-excel-download',
      '/api/reports/risk-register-excel-debug'
    ];

    for (const endpoint of debugEndpoints) {
      try {
        const response = await makeRequest(`${BASE_URL}${endpoint}`);
        
        if (response.status === 200) {
          console.log(`✓ ${endpoint} - Success`);
        } else {
          console.log(`✗ ${endpoint} - Failed: ${response.status}`);
          if (response.body.includes('invalid input syntax for type uuid')) {
            console.log('🔍 UUID ERROR still present!');
          }
        }
      } catch (error) {
        console.log(`✗ ${endpoint} - Error: ${error.message}`);
      }
    }

    // Test 3: Test with auth if available
    if (token) {
      console.log('\n3. Testing with authentication...');
      
      // Test user debug first
      try {
        const userDebugResponse = await makeRequest(`${BASE_URL}/api/reports/user-debug`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (userDebugResponse.status === 200) {
          const userData = JSON.parse(userDebugResponse.body);
          console.log('✓ User debug successful');
          console.log('User info:', {
            hasOrganizations: userData.hasOrganizations,
            role: userData.role,
            isSuperAdmin: userData.isSuperAdmin,
            organizationCount: userData.organizationCount
          });
        } else {
          console.log('✗ User debug failed:', userDebugResponse.status);
        }
      } catch (error) {
        console.log('✗ User debug error:', error.message);
      }

      // Test Excel downloads
      const excelEndpoints = [
        '/api/reports/risk-register/excel',
        '/api/reports/risk-profile/excel',
        '/api/reports/residual-risk/excel',
        '/api/reports/monitoring/excel',
        '/api/reports/strategic-map/excel'
      ];

      for (const endpoint of excelEndpoints) {
        try {
          console.log(`\nTesting ${endpoint}...`);
          
          const response = await makeRequest(`${BASE_URL}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.status === 200) {
            const contentType = response.headers['content-type'] || '';
            const contentLength = response.headers['content-length'] || 0;
            console.log(`✓ ${endpoint} - Success`);
            console.log(`  Content-Type: ${contentType}`);
            console.log(`  Size: ${contentLength} bytes`);
          } else {
            console.log(`✗ ${endpoint} - Failed: ${response.status}`);
            
            // Check for UUID error
            if (response.body.includes('invalid input syntax for type uuid')) {
              console.log('🔍 UUID ERROR detected:');
              console.log(response.body.substring(0, 300));
            } else {
              console.log('Error (first 200 chars):', response.body.substring(0, 200));
            }
          }
        } catch (error) {
          console.log(`✗ ${endpoint} - Error: ${error.message}`);
        }
      }
    }

    // Test 4: Test PDF endpoints
    console.log('\n4. Testing PDF endpoints...');
    
    if (token) {
      try {
        const pdfResponse = await makeRequest(`${BASE_URL}/api/reports/residual-risk/pdf`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (pdfResponse.status === 200) {
          console.log('✓ PDF generation successful');
        } else {
          console.log('✗ PDF generation failed:', pdfResponse.status);
          if (pdfResponse.body.includes('invalid input syntax for type uuid')) {
            console.log('🔍 UUID ERROR in PDF generation');
          }
        }
      } catch (error) {
        console.log('✗ PDF test error:', error.message);
      }
    }

    // Test debug PDF without auth
    try {
      const debugPdfResponse = await makeRequest(`${BASE_URL}/api/reports/residual-risk-pdf-debug`);
      
      if (debugPdfResponse.status === 200) {
        console.log('✓ Debug PDF generation successful');
      } else {
        console.log('✗ Debug PDF generation failed:', debugPdfResponse.status);
      }
    } catch (error) {
      console.log('✗ Debug PDF error:', error.message);
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run test
testUUIDFix().catch(console.error);