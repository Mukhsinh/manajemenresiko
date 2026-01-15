/**
 * Test script for Evaluasi IKU dropdown issue
 * Tests if IKU data can be loaded for dropdown
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

async function makeRequest(path, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          resolve({ error: data });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('=== Testing Evaluasi IKU Dropdown ===\n');
  
  // Test 1: Public endpoint
  console.log('1. Testing /api/indikator-kinerja-utama/public...');
  try {
    const publicResult = await makeRequest('/api/indikator-kinerja-utama/public');
    console.log(`   Status: ${publicResult.status}`);
    console.log(`   Data count: ${Array.isArray(publicResult.data) ? publicResult.data.length : 'N/A'}`);
    if (Array.isArray(publicResult.data) && publicResult.data.length > 0) {
      console.log(`   Sample: ${publicResult.data[0].indikator?.substring(0, 50)}...`);
    }
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }
  
  // Test 2: Debug endpoint
  console.log('\n2. Testing /api/indikator-kinerja-utama/debug...');
  try {
    const debugResult = await makeRequest('/api/indikator-kinerja-utama/debug');
    console.log(`   Status: ${debugResult.status}`);
    console.log(`   Success: ${debugResult.data?.success}`);
    console.log(`   Count: ${debugResult.data?.count}`);
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }
  
  // Test 3: Login and test authenticated endpoint
  console.log('\n3. Testing login...');
  try {
    const loginResult = await login();
    if (loginResult.token) {
      console.log('   Login successful');
      
      console.log('\n4. Testing /api/indikator-kinerja-utama (authenticated)...');
      const authResult = await makeRequest('/api/indikator-kinerja-utama', loginResult.token);
      console.log(`   Status: ${authResult.status}`);
      console.log(`   Data count: ${Array.isArray(authResult.data) ? authResult.data.length : 'N/A'}`);
      
      console.log('\n5. Testing /api/evaluasi-iku-bulanan/summary?tahun=2025 (authenticated)...');
      const summaryResult = await makeRequest('/api/evaluasi-iku-bulanan/summary?tahun=2025', loginResult.token);
      console.log(`   Status: ${summaryResult.status}`);
      console.log(`   Summary: ${JSON.stringify(summaryResult.data?.summary || {})}`);
      console.log(`   Data count: ${summaryResult.data?.data?.length || 0}`);
    } else {
      console.log(`   Login failed: ${JSON.stringify(loginResult)}`);
    }
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }
  
  console.log('\n=== Test Complete ===');
}

runTests().catch(console.error);
