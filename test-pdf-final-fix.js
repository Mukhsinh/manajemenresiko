// Test final PDF fix
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

async function testPDFFinalFix() {
  console.log('=== Testing PDF Final Fix ===\n');
  
  const BASE_URL = 'http://localhost:3000';

  try {
    // Test 1: Test working PDF endpoint (debug)
    console.log('1. Testing working PDF endpoint (debug)...');
    const debugResponse = await makeRequest(`${BASE_URL}/api/reports/residual-risk-pdf-debug`);
    
    console.log('Debug PDF Status:', debugResponse.status);
    const debugContentType = debugResponse.headers['content-type'] || '';
    console.log('Debug PDF Content-Type:', debugContentType);
    
    if (debugResponse.status === 200 && debugContentType.includes('pdf')) {
      console.log('✓ Debug PDF working correctly');
      console.log('✓ File size:', debugResponse.body.length, 'bytes');
    } else {
      console.log('✗ Debug PDF failed');
    }

    // Test 2: Test not implemented endpoints (should return 501 JSON)
    console.log('\n2. Testing not implemented PDF endpoints...');
    
    const notImplementedEndpoints = [
      '/api/reports/risk-register/pdf',
      '/api/reports/risk-profile/pdf',
      '/api/reports/monitoring/pdf'
    ];

    for (const endpoint of notImplementedEndpoints) {
      console.log(`\nTesting ${endpoint}...`);
      
      try {
        const response = await makeRequest(`${BASE_URL}${endpoint}`);
        
        console.log(`Status: ${response.status}`);
        const contentType = response.headers['content-type'] || '';
        console.log(`Content-Type: ${contentType}`);
        
        if (response.status === 501 && contentType.includes('json')) {
          try {
            const errorData = JSON.parse(response.body);
            console.log('✓ Proper 501 Not Implemented response');
            console.log(`✓ Error message: ${errorData.message}`);
            console.log(`✓ Available formats: ${errorData.availableFormats?.join(', ')}`);
          } catch (e) {
            console.log('✗ Could not parse JSON response');
          }
        } else if (response.status === 401) {
          console.log('🔒 Authentication required (expected)');
        } else {
          console.log(`✗ Unexpected response: ${response.status}`);
          console.log('Response body:', response.body.substring(0, 200));
        }
      } catch (error) {
        console.log(`✗ Request error: ${error.message}`);
      }
    }

    // Test 3: Simulate frontend behavior
    console.log('\n3. Simulating frontend PDF download behavior...');
    
    // Simulate what happens when user clicks PDF download for not implemented endpoint
    const testEndpoint = '/api/reports/risk-profile/pdf';
    console.log(`Simulating download for ${testEndpoint}...`);
    
    try {
      const response = await makeRequest(`${BASE_URL}${testEndpoint}`);
      const contentType = response.headers.get ? response.headers.get('content-type') : response.headers['content-type'];
      
      console.log(`Response status: ${response.status}`);
      console.log(`Content-Type: ${contentType}`);
      
      // Simulate the frontend logic
      if (!contentType || !contentType.includes('pdf')) {
        console.log('⚠️ Content type is not PDF (expected for not implemented)');
        
        if (contentType && contentType.includes('json')) {
          try {
            const errorData = JSON.parse(response.body);
            const errorMessage = errorData.error || errorData.message || 'Server returned JSON instead of PDF';
            
            if (errorMessage.includes('not yet implemented') || errorMessage.includes('belum diimplementasikan')) {
              console.log('✓ Frontend should show: Export PDF belum diimplementasikan');
            } else {
              console.log('✓ Frontend should show:', errorMessage);
            }
          } catch (jsonError) {
            console.log('✓ Frontend should show: Server mengembalikan response JSON alih-alih file PDF');
          }
        } else {
          console.log('✓ Frontend should show: Format response tidak sesuai');
        }
      } else {
        console.log('✓ Content type is PDF - would proceed with download');
      }
    } catch (error) {
      console.log(`✗ Simulation error: ${error.message}`);
    }

    console.log('\n=== Test Complete ===');
    console.log('\nExpected behavior:');
    console.log('- Working PDF endpoints (residual-risk-pdf-debug) should download PDF');
    console.log('- Not implemented endpoints should show helpful error message');
    console.log('- No "body stream already read" errors');
    console.log('- Clear user guidance about using Excel export instead');

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run test
testPDFFinalFix().catch(console.error);