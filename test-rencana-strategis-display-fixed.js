/**
 * TEST RENCANA STRATEGIS DISPLAY - FIXED VERSION
 * Verifikasi tampilan form, tabel, dan kartu statistik
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testRencanaStrategisDisplay() {
  console.log('🧪 Testing Rencana Strategis Display (Fixed)...\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Check if page loads
  try {
    console.log('📋 Test 1: Checking if page loads...');
    const response = await axios.get(`${BASE_URL}/`);
    
    if (response.status === 200) {
      console.log('✅ Page loads successfully');
      results.passed++;
      results.tests.push({ name: 'Page Load', status: 'PASS' });
    }
  } catch (error) {
    console.log('❌ Page load failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Page Load', status: 'FAIL', error: error.message });
  }

  // Test 2: Check if fixed JS module exists
  try {
    console.log('\n📋 Test 2: Checking if fixed JS module exists...');
    const response = await axios.get(`${BASE_URL}/js/rencana-strategis-fixed.js`);
    
    if (response.status === 200 && response.data.includes('RencanaStrategisFixed')) {
      console.log('✅ Fixed JS module exists and contains RencanaStrategisFixed');
      results.passed++;
      results.tests.push({ name: 'Fixed JS Module', status: 'PASS' });
    }
  } catch (error) {
    console.log('❌ Fixed JS module check failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Fixed JS Module', status: 'FAIL', error: error.message });
  }

  // Test 3: Check if fixed CSS exists
  try {
    console.log('\n📋 Test 3: Checking if fixed CSS exists...');
    const response = await axios.get(`${BASE_URL}/css/rencana-strategis-fixed.css`);
    
    if (response.status === 200 && response.data.includes('rencana-strategis')) {
      console.log('✅ Fixed CSS exists and contains rencana-strategis styles');
      results.passed++;
      results.tests.push({ name: 'Fixed CSS', status: 'PASS' });
    }
  } catch (error) {
    console.log('❌ Fixed CSS check failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Fixed CSS', status: 'FAIL', error: error.message });
  }

  // Test 4: Check if test page exists
  try {
    console.log('\n📋 Test 4: Checking if test page exists...');
    const response = await axios.get(`${BASE_URL}/test-rencana-strategis-fixed.html`);
    
    if (response.status === 200 && response.data.includes('Test Rencana Strategis')) {
      console.log('✅ Test page exists');
      results.passed++;
      results.tests.push({ name: 'Test Page', status: 'PASS' });
    }
  } catch (error) {
    console.log('❌ Test page check failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Test Page', status: 'FAIL', error: error.message });
  }

  // Test 5: Check API endpoint for data
  try {
    console.log('\n📋 Test 5: Checking API endpoint for rencana strategis data...');
    const response = await axios.get(`${BASE_URL}/api/rencana-strategis/public`);
    
    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ API endpoint works, returned ${response.data.length} records`);
      results.passed++;
      results.tests.push({ 
        name: 'API Endpoint', 
        status: 'PASS', 
        data: { recordCount: response.data.length } 
      });
    }
  } catch (error) {
    console.log('❌ API endpoint check failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'API Endpoint', status: 'FAIL', error: error.message });
  }

  // Test 6: Check API endpoint for visi misi
  try {
    console.log('\n📋 Test 6: Checking API endpoint for visi misi data...');
    const response = await axios.get(`${BASE_URL}/api/visi-misi/public`);
    
    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Visi Misi API works, returned ${response.data.length} records`);
      results.passed++;
      results.tests.push({ 
        name: 'Visi Misi API', 
        status: 'PASS', 
        data: { recordCount: response.data.length } 
      });
    }
  } catch (error) {
    console.log('❌ Visi Misi API check failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Visi Misi API', status: 'FAIL', error: error.message });
  }

  // Test 7: Check kode generation endpoint
  try {
    console.log('\n📋 Test 7: Checking kode generation endpoint...');
    const response = await axios.get(`${BASE_URL}/api/rencana-strategis/generate/kode/public`);
    
    if (response.status === 200 && response.data.kode) {
      console.log(`✅ Kode generation works: ${response.data.kode}`);
      results.passed++;
      results.tests.push({ 
        name: 'Kode Generation', 
        status: 'PASS', 
        data: { kode: response.data.kode } 
      });
    }
  } catch (error) {
    console.log('❌ Kode generation check failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Kode Generation', status: 'FAIL', error: error.message });
  }

  // Test 8: Check if index.html includes fixed module
  try {
    console.log('\n📋 Test 8: Checking if index.html includes fixed module...');
    const response = await axios.get(`${BASE_URL}/`);
    
    if (response.data.includes('rencana-strategis-fixed.js') && 
        response.data.includes('rencana-strategis-fixed.css')) {
      console.log('✅ Index.html includes fixed module and CSS');
      results.passed++;
      results.tests.push({ name: 'Index Integration', status: 'PASS' });
    } else {
      console.log('⚠️ Index.html may not include fixed module');
      results.failed++;
      results.tests.push({ 
        name: 'Index Integration', 
        status: 'FAIL', 
        error: 'Fixed module not found in index.html' 
      });
    }
  } catch (error) {
    console.log('❌ Index.html check failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Index Integration', status: 'FAIL', error: error.message });
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(2)}%`);
  console.log('='.repeat(60));

  // Print detailed results
  console.log('\n📋 DETAILED RESULTS:');
  results.tests.forEach((test, index) => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${test.name}: ${test.status}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
    if (test.data) {
      console.log(`   Data: ${JSON.stringify(test.data)}`);
    }
  });

  // Print recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (results.failed === 0) {
    console.log('✅ All tests passed! The display fix is working correctly.');
    console.log('✅ You can now access the page at: http://localhost:3002/rencana-strategis');
    console.log('✅ Or test standalone at: http://localhost:3002/test-rencana-strategis-fixed.html');
  } else {
    console.log('⚠️ Some tests failed. Please check the following:');
    results.tests.filter(t => t.status === 'FAIL').forEach(test => {
      console.log(`   - ${test.name}: ${test.error}`);
    });
  }

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Open browser and navigate to: http://localhost:3002/test-rencana-strategis-fixed.html');
  console.log('2. Check browser console for any JavaScript errors');
  console.log('3. Verify that you see:');
  console.log('   - 4 statistics cards (Aktif, Draft, Selesai, Total)');
  console.log('   - "Tambah Baru" button');
  console.log('   - Data table with columns: Kode, Nama, Target, Periode, Status, Aksi');
  console.log('4. Click "Tambah Baru" to verify form appears with all fields');
  console.log('5. Test CRUD operations (Create, Read, Update, Delete)');

  return results;
}

// Run tests
if (require.main === module) {
  testRencanaStrategisDisplay()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testRencanaStrategisDisplay };
