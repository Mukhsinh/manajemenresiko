// Debug script untuk memeriksa masalah autentikasi di halaman residual-risk
const http = require('http');

// Test dengan token yang valid (ambil dari browser)
const testWithToken = (token) => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/reports/residual-risk',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('API Response with token:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('Raw Response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });

  req.end();
};

// Test tanpa token
const testWithoutToken = () => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/reports/residual-risk',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status without token: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('Error response:', jsonData.error);
      } catch (e) {
        console.log('Raw Response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });

  req.end();
};

console.log('Testing API without token...');
testWithoutToken();

console.log('\nTo test with token, run:');
console.log('node debug-residual-auth.js YOUR_TOKEN_HERE');

// If token provided as argument
if (process.argv[2]) {
  console.log('\nTesting API with provided token...');
  testWithToken(process.argv[2]);
}