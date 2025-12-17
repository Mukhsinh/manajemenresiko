// Test laporan endpoints without auth to identify UUID issue
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
    req.end();
  });
}

async function testNoAuth() {
  console.log('=== Testing Laporan Endpoints (No Auth) ===\n');
  
  const BASE_URL = 'http://localhost:3000';

  try {
    // Test debug endpoints that don't require auth
    const debugEndpoints = [
      '/api/reports/test-excel-download',
      '/api/reports/risk-register-excel-debug',
      '/api/reports/risk-register-debug',
      '/api/reports/residual-risk-simple',
      '/api/reports/residual-risk-pdf-debug'
    ];

    for (const endpoint of debugEndpoints) {
      console.log(`Testing ${endpoint}...`);
      
      try {
        const response = await makeRequest(`${BASE_URL}${endpoint}`);
        
        console.log(`Status: ${response.status}`);
        
        if (response.status === 200) {
          const contentType = response.headers['content-type'] || '';
          console.log(`✓ Success - Content-Type: ${contentType}`);
          
          if (contentType.includes('json')) {
            try {
              const data = JSON.parse(response.body);
              console.log(`Data preview:`, JSON.stringify(data).substring(0, 200) + '...');
            } catch (e) {
              console.log('Response body length:', response.body.length);
            }
          } else {
            console.log('Response body length:', response.body.length);
          }
        } else {
          console.log(`✗ Failed`);
          console.log('Error body:', response.body.substring(0, 300));
          
          // Check for UUID error
          if (response.body.includes('invalid input syntax for type uuid')) {
            console.log('🔍 UUID ERROR DETECTED!');
            console.log('Full error:', response.body);
          }
        }
        
      } catch (error) {
        console.log(`✗ Request failed: ${error.message}`);
      }
      
      console.log('---');
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run test
testNoAuth().catch(console.error);