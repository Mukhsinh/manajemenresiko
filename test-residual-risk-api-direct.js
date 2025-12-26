const http = require('http');

async function testResidualRiskAPI() {
  console.log('🔍 Testing Residual Risk API endpoints...');
  
  const baseUrl = 'localhost';
  const port = 3002;
  
  // Test endpoints to try
  const endpoints = [
    '/api/reports/residual-risk-simple',
    '/api/reports/residual-risk-debug',
    '/api/reports/residual-risk'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${endpoint}`);
      
      const result = await new Promise((resolve, reject) => {
        const options = {
          hostname: baseUrl,
          port: port,
          path: endpoint,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        };
        
        const req = http.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data
            });
          });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        req.end();
      });
      
      console.log(`Status: ${result.status}`);
      console.log(`Content-Type: ${result.headers['content-type']}`);
      
      if (result.status === 200) {
        try {
          const jsonData = JSON.parse(result.data);
          console.log(`✅ Success! Data type: ${typeof jsonData}`);
          
          if (Array.isArray(jsonData)) {
            console.log(`📊 Array with ${jsonData.length} items`);
            if (jsonData.length > 0) {
              console.log(`📋 Sample item keys: ${Object.keys(jsonData[0]).join(', ')}`);
              console.log(`📋 Sample item:`, JSON.stringify(jsonData[0], null, 2).substring(0, 500) + '...');
            }
          } else if (jsonData && typeof jsonData === 'object') {
            console.log(`📊 Object with keys: ${Object.keys(jsonData).join(', ')}`);
            if (jsonData.fullData && Array.isArray(jsonData.fullData)) {
              console.log(`📊 Contains fullData array with ${jsonData.fullData.length} items`);
            }
          }
        } catch (parseError) {
          console.log(`❌ JSON Parse Error: ${parseError.message}`);
          console.log(`Raw response: ${result.data.substring(0, 200)}...`);
        }
      } else {
        console.log(`❌ Error: ${result.data}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Testing complete!');
}

testResidualRiskAPI().catch(console.error);