const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/reports/residual-risk-simple',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Testing residual risk API on port 3003...');

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('\nResponse received:', Array.isArray(jsonData) ? `${jsonData.length} records` : 'Non-array response');
      
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        console.log('\nFirst record structure:');
        console.log(JSON.stringify(jsonData[0], null, 2));
        console.log('\n✅ API is working correctly');
      } else if (jsonData.error) {
        console.log('\n❌ API Error:', jsonData.error);
      } else {
        console.log('\n⚠️ Empty or unexpected response');
      }
    } catch (error) {
      console.log('\n❌ Failed to parse JSON response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request failed:', error.message);
});

req.end();