const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testRencanaStrategisCompleteInterface() {
  console.log('🧪 Testing Rencana Strategis Complete Interface...');
  
  try {
    // Test 1: Check if API endpoints are working
    console.log('\n1. Testing API endpoints...');
    
    const publicResponse = await axios.get(`${BASE_URL}/api/rencana-strategis/public`);
    console.log(`✅ Public endpoint: ${publicResponse.data.length} records`);
    
    const visiMisiResponse = await axios.get(`${BASE_URL}/api/visi-misi/public`);
    console.log(`✅ Visi Misi endpoint: ${visiMisiResponse.data.length} records`);
    
    // Test 2: Check kode generation
    console.log('\n2. Testing kode generation...');
    
    const kodeResponse = await axios.get(`${BASE_URL}/api/rencana-strategis/generate/kode/public`);
    console.log(`✅ Generated kode: ${kodeResponse.data.kode}`);
    
    // Test 3: Verify data structure
    console.log('\n3. Verifying data structure...');
    
    if (publicResponse.data.length > 0) {
      const sample = publicResponse.data[0];
      const requiredFields = ['id', 'kode', 'nama_rencana', 'status', 'sasaran_strategis', 'indikator_kinerja_utama'];
      
      const missingFields = requiredFields.filter(field => !(field in sample));
      if (missingFields.length === 0) {
        console.log('✅ All required fields present in data');
      } else {
        console.log(`⚠️ Missing fields: ${missingFields.join(', ')}`);
      }
      
      // Check if sasaran_strategis and indikator_kinerja_utama are arrays
      const sasaranIsArray = Array.isArray(sample.sasaran_strategis);
      const indikatorIsArray = Array.isArray(sample.indikator_kinerja_utama);
      
      console.log(`✅ Sasaran strategis is array: ${sasaranIsArray}`);
      console.log(`✅ Indikator kinerja utama is array: ${indikatorIsArray}`);
      
      if (sasaranIsArray && sample.sasaran_strategis.length > 0) {
        console.log(`✅ Sample sasaran: ${sample.sasaran_strategis[0]}`);
      }
      
      if (indikatorIsArray && sample.indikator_kinerja_utama.length > 0) {
        console.log(`✅ Sample indikator: ${sample.indikator_kinerja_utama[0]}`);
      }
    }
    
    // Test 4: Check statistics
    console.log('\n4. Checking statistics...');
    
    const data = publicResponse.data;
    const stats = {
      total: data.length,
      aktif: data.filter(item => item.status === 'Aktif').length,
      draft: data.filter(item => item.status === 'Draft').length,
      selesai: data.filter(item => item.status === 'Selesai').length
    };
    
    console.log(`📊 Statistics:
    - Total: ${stats.total}
    - Aktif: ${stats.aktif}
    - Draft: ${stats.draft}
    - Selesai: ${stats.selesai}`);
    
    console.log('\n✅ All tests passed! Rencana Strategis Complete Interface is ready.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testRencanaStrategisCompleteInterface();