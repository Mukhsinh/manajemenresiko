const http = require('http');

async function testResidualRiskAPI() {
  try {
    console.log('Testing Residual Risk API...');
    
    // First login to get token
    const loginData = JSON.stringify({
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const token = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.token) {
              resolve(response.token);
            } else {
              reject(new Error('No token received'));
            }
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });
    
    console.log('Login successful, token received');
    
    // Test residual risk endpoint
    const apiOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/reports/residual-risk',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const apiResponse = await new Promise((resolve, reject) => {
      const req = http.request(apiOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({ status: res.statusCode, data: response });
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    console.log('Residual Risk API Response:');
    console.log('Status:', apiResponse.status);
    console.log('Data count:', apiResponse.data.length);
    
    if (apiResponse.data.length > 0) {
      console.log('Sample data:');
      console.log(JSON.stringify(apiResponse.data[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testResidualRiskAPI();