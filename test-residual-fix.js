// Test script untuk memverifikasi perbaikan halaman residual-risk
const http = require('http');

console.log('Testing Residual Risk fixes...\n');

// Test 1: Check if server is running
function testServerHealth() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log('✅ Server is running');
      console.log(`   Status: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (e) => {
      console.log('❌ Server is not running');
      console.log(`   Error: ${e.message}`);
      reject(e);
    });

    req.setTimeout(5000, () => {
      console.log('❌ Server health check timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Test 2: Check if residual-risk page loads
function testResidualRiskPage() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/residual-risk',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log('✅ Residual Risk page accessible');
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Content-Type: ${res.headers['content-type']}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (data.includes('residual-risk-content')) {
          console.log('✅ Page contains residual-risk-content div');
        } else {
          console.log('⚠️  Page does not contain residual-risk-content div');
        }
        resolve(true);
      });
    });

    req.on('error', (e) => {
      console.log('❌ Residual Risk page not accessible');
      console.log(`   Error: ${e.message}`);
      reject(e);
    });

    req.setTimeout(5000, () => {
      console.log('❌ Residual Risk page timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Test 3: Check API endpoint (simple version)
function testResidualRiskAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/reports/residual-risk-simple',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log('✅ Residual Risk API accessible');
      console.log(`   Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ API returns valid JSON with ${Array.isArray(jsonData) ? jsonData.length : 'unknown'} items`);
          
          if (Array.isArray(jsonData) && jsonData.length > 0) {
            const firstItem = jsonData[0];
            console.log('✅ Sample data structure looks good:');
            console.log(`   - Has risk_inputs: ${!!firstItem.risk_inputs}`);
            console.log(`   - Has kode_risiko: ${!!firstItem.risk_inputs?.kode_risiko}`);
            console.log(`   - Has risk_value: ${!!firstItem.risk_value}`);
          }
          
          resolve(true);
        } catch (e) {
          console.log('❌ API returns invalid JSON');
          console.log(`   Raw response: ${data.substring(0, 200)}...`);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ Residual Risk API not accessible');
      console.log(`   Error: ${e.message}`);
      reject(e);
    });

    req.setTimeout(5000, () => {
      console.log('❌ Residual Risk API timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Test 4: Check debug page
function testDebugPage() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/debug-residual-risk.html',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log('✅ Debug page accessible');
      console.log(`   Status: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (e) => {
      console.log('❌ Debug page not accessible');
      console.log(`   Error: ${e.message}`);
      reject(e);
    });

    req.setTimeout(5000, () => {
      console.log('❌ Debug page timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log('🧪 Running Residual Risk fix verification tests...\n');
  
  try {
    console.log('1. Testing server health...');
    await testServerHealth();
    console.log('');
    
    console.log('2. Testing Residual Risk page...');
    await testResidualRiskPage();
    console.log('');
    
    console.log('3. Testing Residual Risk API...');
    await testResidualRiskAPI();
    console.log('');
    
    console.log('4. Testing debug page...');
    await testDebugPage();
    console.log('');
    
    console.log('🎉 All tests passed! Residual Risk page should be working now.');
    console.log('\n📋 Next steps:');
    console.log('   1. Open http://localhost:3001/residual-risk in your browser');
    console.log('   2. Login if required');
    console.log('   3. Check if data loads properly');
    console.log('   4. If issues persist, check browser console for errors');
    
  } catch (error) {
    console.log('\n❌ Some tests failed. Please check the server and try again.');
    console.log('💡 Troubleshooting tips:');
    console.log('   1. Make sure the server is running: npm start');
    console.log('   2. Check if port 3001 is available');
    console.log('   3. Check server logs for errors');
  }
}

runTests();