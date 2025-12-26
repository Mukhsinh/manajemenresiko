const http = require('http');

async function testRiskProfileEndpoints() {
  console.log('=== TESTING RISK PROFILE ENDPOINTS ===\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test endpoints
  const endpoints = [
    '/api/risk-profile-real', // Should return 404 (deleted)
    '/api/risk-profile',      // Should work (correct endpoint)
  ];
  
  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`);
    
    try {
      const result = await makeRequest(baseUrl + endpoint);
      
      console.log(`  Status: ${result.statusCode} ${result.statusMessage}`);
      
      if (result.statusCode === 404) {
        console.log('  ✓ Endpoint correctly returns 404 (not found)');
      } else if (result.statusCode === 401) {
        console.log('  ✓ Endpoint requires authentication (expected)');
      } else if (result.statusCode === 200) {
        try {
          const data = JSON.parse(result.data);
          console.log(`  ✓ Endpoint returns data: ${data.length} records`);
          
          if (data.length === 0) {
            console.log('  ✓ Database is empty - this is correct!');
          } else {
            console.log('  ! Database has data - frontend should show this');
          }
        } catch (parseError) {
          console.log('  ? Response is not JSON');
        }
      } else {
        console.log(`  ? Unexpected status: ${result.statusCode}`);
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('  ✗ Server not running - please start server first');
      } else {
        console.log(`  ✗ Error: ${error.message}`);
      }
    }
    
    console.log('');
  }
  
  console.log('=== SUMMARY ===');
  console.log('1. /api/risk-profile-real should return 404 (deleted)');
  console.log('2. /api/risk-profile should require auth or return empty data');
  console.log('3. Frontend should now show 0 in all cards when database is empty');
  console.log('\nTo test the frontend:');
  console.log('1. Start the server: node server.js');
  console.log('2. Open: http://localhost:3000/test-risk-profile-fixed.html');
  console.log('3. Login and check that cards show 0 values');
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          data: data
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(5000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

testRiskProfileEndpoints();