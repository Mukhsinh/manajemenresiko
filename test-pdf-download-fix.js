// Test PDF download fix
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

async function testPDFDownload() {
  console.log('=== Testing PDF Download Fix ===\n');
  
  const BASE_URL = 'http://localhost:3000';

  try {
    // Test 1: Test debug PDF endpoint (should work)
    console.log('1. Testing debug PDF endpoint...');
    const debugPdfResponse = await makeRequest(`${BASE_URL}/api/reports/residual-risk-pdf-debug`);
    
    console.log('Debug PDF Status:', debugPdfResponse.status);
    if (debugPdfResponse.status === 200) {
      const contentType = debugPdfResponse.headers['content-type'] || '';
      console.log('✓ Debug PDF successful - Content-Type:', contentType);
      console.log('✓ File size:', debugPdfResponse.body.length, 'bytes');
    } else {
      console.log('✗ Debug PDF failed:', debugPdfResponse.body.substring(0, 200));
    }

    // Test 2: Try login to get token for auth endpoints
    console.log('\n2. Testing login...');
    const loginCredentials = [
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'test@example.com', password: 'test123' }
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
        }
      } catch (error) {
        console.log(`✗ Login failed for ${creds.email}: ${error.message}`);
      }
    }

    // Test 3: Test PDF endpoints with proper error handling
    const pdfEndpoints = [
      '/api/reports/risk-register/pdf',
      '/api/reports/risk-profile/pdf',
      '/api/reports/residual-risk/pdf',
      '/api/reports/risk-appetite/pdf',
      '/api/reports/kri/pdf',
      '/api/reports/monitoring/pdf',
      '/api/reports/loss-event/pdf',
      '/api/reports/strategic-map/pdf'
    ];

    console.log('\n3. Testing PDF endpoints...');
    
    for (const endpoint of pdfEndpoints) {
      console.log(`\nTesting ${endpoint}...`);
      
      try {
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await makeRequest(`${BASE_URL}${endpoint}`, { headers });
        
        console.log(`Status: ${response.status}`);
        const contentType = response.headers['content-type'] || '';
        console.log(`Content-Type: ${contentType}`);
        
        if (response.status === 200 && contentType.includes('pdf')) {
          console.log(`✓ ${endpoint} - PDF generated successfully`);
          console.log(`  File size: ${response.body.length} bytes`);
        } else if (response.status === 501) {
          // Expected for not implemented endpoints
          try {
            const errorData = JSON.parse(response.body);
            console.log(`⚠️ ${endpoint} - Not implemented (expected)`);
            console.log(`  Message: ${errorData.message}`);
            console.log(`  Available formats: ${errorData.availableFormats?.join(', ')}`);
          } catch (e) {
            console.log(`⚠️ ${endpoint} - Not implemented`);
          }
        } else if (response.status === 401) {
          console.log(`🔒 ${endpoint} - Authentication required`);
        } else {
          console.log(`✗ ${endpoint} - Failed: ${response.status}`);
          
          // Check if it's JSON error response
          if (contentType.includes('json')) {
            try {
              const errorData = JSON.parse(response.body);
              console.log(`  Error: ${errorData.error || errorData.message}`);
            } catch (e) {
              console.log(`  Raw response: ${response.body.substring(0, 200)}`);
            }
          } else {
            console.log(`  Raw response: ${response.body.substring(0, 200)}`);
          }
        }
      } catch (error) {
        console.log(`✗ ${endpoint} - Request error: ${error.message}`);
      }
    }

    // Test 4: Test the working residual-risk PDF endpoint
    if (token) {
      console.log('\n4. Testing working PDF endpoint (residual-risk)...');
      
      try {
        const response = await makeRequest(`${BASE_URL}/api/reports/residual-risk/pdf`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log(`Residual Risk PDF Status: ${response.status}`);
        const contentType = response.headers['content-type'] || '';
        console.log(`Content-Type: ${contentType}`);
        
        if (response.status === 200 && contentType.includes('pdf')) {
          console.log('✓ Residual Risk PDF generated successfully');
          console.log(`  File size: ${response.body.length} bytes`);
        } else {
          console.log('✗ Residual Risk PDF failed');
          if (contentType.includes('json')) {
            try {
              const errorData = JSON.parse(response.body);
              console.log(`  Error: ${errorData.error}`);
            } catch (e) {
              console.log(`  Raw response: ${response.body.substring(0, 200)}`);
            }
          }
        }
      } catch (error) {
        console.log(`✗ Residual Risk PDF error: ${error.message}`);
      }
    }

    console.log('\n=== PDF Test Complete ===');

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run test
testPDFDownload().catch(console.error);