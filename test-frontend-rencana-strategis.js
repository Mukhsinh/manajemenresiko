const fetch = require('node-fetch');

async function testFrontendRencanaStrategis() {
  console.log('=== TEST FRONTEND RENCANA STRATEGIS ===');
  
  try {
    // Test public endpoint
    console.log('Testing public endpoint...');
    const response = await fetch('http://localhost:3001/api/rencana-strategis/public');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Public endpoint working: ${data.length} records found`);
    
    // Test visi misi endpoint
    console.log('Testing visi misi endpoint...');
    const visiResponse = await fetch('http://localhost:3001/api/visi-misi/public');
    
    if (!visiResponse.ok) {
      throw new Error(`HTTP ${visiResponse.status}: ${visiResponse.statusText}`);
    }
    
    const visiData = await visiResponse.json();
    console.log(`✅ Visi misi endpoint working: ${visiData.length} records found`);
    
    // Validate data structure
    if (data.length > 0) {
      const sample = data[0];
      console.log('\n📋 Sample record structure:');
      console.log(`- Kode: ${sample.kode}`);
      console.log(`- Nama: ${sample.nama_rencana}`);
      console.log(`- Status: ${sample.status}`);
      console.log(`- Sasaran: ${sample.sasaran_strategis ? 'Available' : 'Missing'}`);
      console.log(`- Indikator: ${sample.indikator_kinerja_utama ? 'Available' : 'Missing'}`);
      console.log(`- Visi Misi ID: ${sample.visi_misi_id}`);
    }
    
    // Test frontend page
    console.log('\nTesting frontend page...');
    const pageResponse = await fetch('http://localhost:3001/test-rencana-strategis-professional.html');
    
    if (pageResponse.ok) {
      console.log('✅ Frontend test page accessible');
    } else {
      console.log('⚠️ Frontend test page not accessible');
    }
    
    console.log('\n🎉 FRONTEND TEST COMPLETED SUCCESSFULLY!');
    console.log('\n📱 Access URLs:');
    console.log('- Main App: http://localhost:3001/');
    console.log('- Test Page: http://localhost:3001/test-rencana-strategis-professional.html');
    console.log('- API Endpoint: http://localhost:3001/api/rencana-strategis/public');
    
  } catch (error) {
    console.error('❌ Frontend test failed:', error.message);
  }
}

testFrontendRencanaStrategis();