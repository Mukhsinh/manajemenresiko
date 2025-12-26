const http = require('http');

async function testServer() {
  console.log('🔍 Testing server status...');
  
  try {
    // Test if server is running
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      console.log(`✅ Server is running on port 3002`);
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (data.includes('<title>')) {
          console.log('✅ HTML page loaded successfully');
        }
        console.log('\n🎯 Server is ready for testing!');
        console.log('📋 Open browser and go to: http://localhost:3002');
        console.log('🔧 Test pages:');
        console.log('   - http://localhost:3002/strategic-map');
        console.log('   - http://localhost:3002/sasaran-strategi');
        console.log('   - http://localhost:3002/indikator-kinerja-utama');
        console.log('   - http://localhost:3002/manajemen-risiko/risk-profile');
        console.log('   - http://localhost:3002/manajemen-risiko/kri');
        process.exit(0);
      });
    });

    req.on('error', (err) => {
      console.log('❌ Server is not running or not accessible');
      console.log('Error:', err.message);
      console.log('\n🔧 To start the server:');
      console.log('   npm start');
      console.log('   or');
      console.log('   node server.js');
      process.exit(1);
    });

    req.on('timeout', () => {
      console.log('❌ Server request timed out');
      req.destroy();
      process.exit(1);
    });

    req.end();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testServer();