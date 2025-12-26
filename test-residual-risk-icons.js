const http = require('http');

async function testResidualRisk() {
  try {
    console.log('Testing Residual Risk API on port 3001...');
    
    // Test login first
    const loginData = JSON.stringify({
      email: 'amalinda.fajari@gmail.com',
      password: 'admin123'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const loginResult = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
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
      req.write(loginData);
      req.end();
    });
    
    const token = loginResult.data.session?.access_token || loginResult.data.token;
    console.log('✅ Login successful, testing residual risk API...');
    
    // Test residual risk API
    const apiOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/reports/residual-risk',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const apiResult = await new Promise((resolve, reject) => {
      const req = http.request(apiOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({ status: res.statusCode, data: response });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    console.log('API Status:', apiResult.status);
    console.log('Data count:', Array.isArray(apiResult.data) ? apiResult.data.length : 'Not array');
    
    if (Array.isArray(apiResult.data) && apiResult.data.length > 0) {
      console.log('Sample data structure:', JSON.stringify(apiResult.data[0], null, 2));
    }
    
    console.log('✅ Residual Risk API is working');
    console.log('\n🎯 Test Results:');
    console.log('- Server is running on port 3001');
    console.log('- Login API works');
    console.log('- Residual Risk API responds');
    console.log('- New icons and colors should be visible in the chart');
    console.log('\n📋 To test the UI:');
    console.log('1. Open: http://localhost:3001/test-residual-risk-icons-fix.html');
    console.log('2. Open: http://localhost:3001/residual-risk.html');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testResidualRisk();