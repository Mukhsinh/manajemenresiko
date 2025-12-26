const http = require('http');

console.log('Testing residual risk endpoint...');

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
      console.log('Response data:');
      console.log('- Record count:', jsonData.length);
      if (jsonData.length > 0) {
        console.log('- Sample record:', JSON.stringify(jsonData[0], null, 2));
      }
    } catch (error) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end();