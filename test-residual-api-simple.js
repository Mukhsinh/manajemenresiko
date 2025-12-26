const http = require('http');

function testResidualAPI() {
  console.log('Testing Residual Risk API...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/reports/residual-risk-simple',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('Response type:', typeof jsonData);
        console.log('Is array:', Array.isArray(jsonData));
        console.log('Data length:', Array.isArray(jsonData) ? jsonData.length : 'N/A');
        
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          console.log('Sample record keys:', Object.keys(jsonData[0]));
          console.log('Sample record:', JSON.stringify(jsonData[0], null, 2));
        } else {
          console.log('Full response:', JSON.stringify(jsonData, null, 2));
        }
      } catch (error) {
        console.error('JSON Parse Error:', error.message);
        console.log('Raw response:', data.substring(0, 500));
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request Error:', error.message);
  });

  req.end();
}

testResidualAPI();