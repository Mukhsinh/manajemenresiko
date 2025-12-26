const http = require('http');

const PORT = process.env.PORT || 3001;
const HOST = 'localhost';

console.log(`Testing connection to http://${HOST}:${PORT}`);

const options = {
  hostname: HOST,
  port: PORT,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`✅ Response received (${data.length} bytes)`);
    console.log(`🎉 Application is accessible at http://${HOST}:${PORT}`);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error(`❌ Connection failed:`, err.message);
  console.log(`💡 Make sure the server is running with: npm run dev`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error(`❌ Connection timeout`);
  req.destroy();
  process.exit(1);
});

req.end();