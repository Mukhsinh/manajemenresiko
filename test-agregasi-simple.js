// Test sederhana untuk agregasi RUMAH_SAKIT tanpa auth
const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

async function testAgregatsiSimple() {
  try {
    console.log('🏥 TESTING AGREGASI RUMAH SAKIT (Simple)');
    console.log('=========================================');

    // Test debug endpoint tanpa auth
    console.log('\n1. Testing debug endpoint...');
    const debugResponse = await axios.get(`${BASE_URL}/api/analisis-swot/debug`);
    
    console.log(`✅ Debug endpoint successful: ${debugResponse.data.count} records`);
    
    if (debugResponse.data.count > 0) {
      console.log('\n📊 Sample data:');
      debugResponse.data.data.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ${item.kategori}: Score=${item.score}, Bobot=${item.bobot}, Unit=${item.unit_kerja_id || 'N/A'}`);
      });
      
      // Group by kategori to show current distribution
      const byKategori = {};
      debugResponse.data.data.forEach(item => {
        if (!byKategori[item.kategori]) {
          byKategori[item.kategori] = { count: 0, totalScore: 0, totalBobot: 0 };
        }
        byKategori[item.kategori].count++;
        byKategori[item.kategori].totalScore += item.score || 0;
        byKategori[item.kategori].totalBobot += item.bobot || 0;
      });
      
      console.log('\n📈 Data by kategori (what RUMAH_SAKIT should aggregate):');
      Object.keys(byKategori).forEach(kategori => {
        const data = byKategori[kategori];
        console.log(`${kategori}: ${data.count} items, Total Score=${data.totalScore}, Total Bobot=${data.totalBobot}`);
      });
    }

    console.log('\n🎉 SIMPLE TEST COMPLETED!');
    console.log('\nNext steps:');
    console.log('1. ✅ Fixed RUMAH_SAKIT aggregation logic to use SUM instead of MAX');
    console.log('2. 🔄 Need to test with proper authentication');
    console.log('3. 📊 RUMAH_SAKIT should now sum all unit values per kategori');

  } catch (error) {
    console.error('❌ Test error:', error.response?.data || error.message);
  }
}

// Run test
testAgregatsiSimple();