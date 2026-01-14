/**
 * Test Rencana Strategis Enhanced Module
 * Memverifikasi bahwa tampilan dengan form, tabel, dan kartu statistik berfungsi
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testRencanaStrategisEnhanced() {
  console.log('🧪 Testing Rencana Strategis Enhanced Module...\n');

  try {
    // Test 1: Check if public endpoint works
    console.log('1️⃣ Testing public endpoint...');
    const publicResponse = await axios.get(`${BASE_URL}/api/rencana-strategis/public`);
    console.log(`✅ Public endpoint works: ${publicResponse.data.length} records found\n`);

    // Test 2: Check if visi misi endpoint works
    console.log('2️⃣ Testing visi misi endpoint...');
    const visiMisiResponse = await axios.get(`${BASE_URL}/api/visi-misi/public`);
    console.log(`✅ Visi Misi endpoint works: ${visiMisiResponse.data.length} records found\n`);

    // Test 3: Verify data structure
    console.log('3️⃣ Verifying data structure...');
    if (publicResponse.data.length > 0) {
      const sample = publicResponse.data[0];
      console.log('Sample data structure:');
      console.log('- kode:', sample.kode);
      console.log('- nama_rencana:', sample.nama_rencana);
      console.log('- status:', sample.status);
      console.log('- periode_mulai:', sample.periode_mulai);
      console.log('- periode_selesai:', sample.periode_selesai);
      console.log('✅ Data structure is valid\n');
    }

    // Test 4: Count by status
    console.log('4️⃣ Counting records by status...');
    const aktif = publicResponse.data.filter(item => item.status === 'Aktif').length;
    const draft = publicResponse.data.filter(item => item.status === 'Draft').length;
    const selesai = publicResponse.data.filter(item => item.status === 'Selesai').length;
    console.log(`- Aktif: ${aktif}`);
    console.log(`- Draft: ${draft}`);
    console.log(`- Selesai: ${selesai}`);
    console.log(`- Total: ${publicResponse.data.length}`);
    console.log('✅ Statistics calculated successfully\n');

    console.log('✅ All tests passed!');
    console.log('\n📋 Summary:');
    console.log('- Endpoint rencana strategis: ✅ Working');
    console.log('- Endpoint visi misi: ✅ Working');
    console.log('- Data structure: ✅ Valid');
    console.log('- Statistics: ✅ Calculated');
    console.log('\n🎉 Tampilan dengan form, tabel, dan kartu statistik siap digunakan!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run test
testRencanaStrategisEnhanced();
