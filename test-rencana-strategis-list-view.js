const http = require('http');

async function testRencanaStrategisList() {
  try {
    console.log('=== TESTING RENCANA STRATEGIS LIST VIEW ===');
    
    // Test the public endpoint
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/rencana-strategis/public',
      method: 'GET'
    };
    
    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, data });
        });
      });
      
      req.on('error', reject);
      req.end();
    });
    
    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = JSON.parse(response.data);
    
    console.log('✅ API Response received');
    console.log('📊 Data count:', data.length);
    
    if (data.length > 0) {
      console.log('📋 Sample data:');
      data.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ${item.kode} - ${item.nama_rencana}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Periode: ${item.periode_mulai} s/d ${item.periode_selesai}`);
        console.log('');
      });
    }
    
    console.log('✅ Test completed successfully');
    console.log('🌐 You can now visit: http://localhost:3001/rencana-strategis');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRencanaStrategisList();