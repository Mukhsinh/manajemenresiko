const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function testFrontend() {
  console.log('=== SIMPLE FRONTEND TEST ===');
  
  try {
    // Test rencana strategis endpoint
    console.log('Testing /api/rencana-strategis/public...');
    const rencanaResult = await makeRequest('/api/rencana-strategis/public');
    
    if (rencanaResult.status === 200 && Array.isArray(rencanaResult.data)) {
      console.log(`✅ Rencana Strategis API: ${rencanaResult.data.length} records`);
      
      if (rencanaResult.data.length > 0) {
        const sample = rencanaResult.data[0];
        console.log(`   Sample: ${sample.kode} - ${sample.nama_rencana}`);
      }
    } else {
      console.log(`❌ Rencana Strategis API failed: ${rencanaResult.status}`);
    }
    
    // Test visi misi endpoint
    console.log('Testing /api/visi-misi/public...');
    const visiResult = await makeRequest('/api/visi-misi/public');
    
    if (visiResult.status === 200 && Array.isArray(visiResult.data)) {
      console.log(`✅ Visi Misi API: ${visiResult.data.length} records`);
    } else {
      console.log(`❌ Visi Misi API failed: ${visiResult.status}`);
    }
    
    console.log('\n🎉 FRONTEND READY!');
    console.log('\n📱 Access the application:');
    console.log('1. Main App: http://localhost:3001/');
    console.log('2. Navigate to "Rencana Strategis" menu');
    console.log('3. Test Page: http://localhost:3001/test-rencana-strategis-professional.html');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontend();