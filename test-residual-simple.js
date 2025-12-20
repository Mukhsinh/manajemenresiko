const http = require('http');

async function testResidualDebug() {
  try {
    console.log('=== Testing Residual Risk Debug API ===');
    
    // Test 1: Login dengan email yang ada
    console.log('\n1. Testing Login...');
    const loginData = JSON.stringify({
      email: 'amalinda.fajari@gmail.com',
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
    
    const loginResult = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('Login Status:', res.statusCode);
            console.log('Login Response:', response);
            resolve({ status: res.statusCode, data: response });
          } catch (e) {
            console.log('Login Raw Response:', data);
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });
    
    const token = loginResult.data.session?.access_token || loginResult.data.token;
    
    if (!token) {
      throw new Error('No token received from login');
    }
    console.log('✅ Login successful, token received');
    
    // Test 2: Debug Residual Risk API (tanpa filter organisasi)
    console.log('\n2. Testing Debug Residual Risk API...');
    const debugOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/reports/residual-risk-debug',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const debugResult = await new Promise((resolve, reject) => {
      const req = http.request(debugOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('Debug API Status:', res.statusCode);
            console.log('Debug API Response:', JSON.stringify(response, null, 2));
            resolve({ status: res.statusCode, data: response });
          } catch (e) {
            console.log('Debug API Raw Response:', data);
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    console.log('✅ Debug API Response Status:', debugResult.status);
    
    // Test 3: Regular Residual Risk API
    console.log('\n3. Testing Regular Residual Risk API...');
    const apiOptions = {
      hostname: 'localhost',
      port: 3000,
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
            console.log('Regular API Status:', res.statusCode);
            console.log('Regular API Response Length:', Array.isArray(response) ? response.length : 'Not array');
            if (Array.isArray(response) && response.length > 0) {
              console.log('Sample data:', JSON.stringify(response[0], null, 2));
            }
            resolve({ status: res.statusCode, data: response });
          } catch (e) {
            console.log('Regular API Raw Response:', data);
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    console.log('✅ Regular API Response Status:', apiResult.status);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testResidualDebug();