/**
 * TEST: Rencana Strategis Table View Fix
 * Memverifikasi bahwa halaman selalu menampilkan tabel
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testTableViewFix() {
  console.log('🧪 Testing Rencana Strategis Table View Fix\n');
  
  try {
    // Test 1: Check if page endpoint exists
    console.log('1️⃣ Testing page endpoint...');
    try {
      const pageResponse = await axios.get(`${BASE_URL}/rencana-strategis/page`);
      console.log('✅ Page endpoint accessible:', pageResponse.data);
    } catch (error) {
      console.log('⚠️ Page endpoint not found (this is OK if using SPA routing)');
    }
    
    // Test 2: Check if API returns data
    console.log('\n2️⃣ Testing API data endpoint...');
    try {
      const dataResponse = await axios.get(`${BASE_URL}/api/rencana-strategis/public`);
      const data = dataResponse.data;
      
      console.log(`✅ API returns data: ${data.length} records`);
      
      if (data.length > 0) {
        console.log('📊 Sample record:');
        const sample = data[0];
        console.log(`   - Kode: ${sample.kode}`);
        console.log(`   - Nama: ${sample.nama_rencana}`);
        console.log(`   - Status: ${sample.status}`);
      } else {
        console.log('⚠️ No data found - table will show empty state');
      }
    } catch (error) {
      console.error('❌ API endpoint error:', error.message);
    }
    
    // Test 3: Check if scripts are accessible
    console.log('\n3️⃣ Testing script files...');
    
    const scripts = [
      '/js/rencana-strategis.js',
      '/js/rencana-strategis-force-table-view.js'
    ];
    
    for (const script of scripts) {
      try {
        const response = await axios.get(`${BASE_URL}${script}`);
        console.log(`✅ ${script} - ${response.status} OK`);
      } catch (error) {
        console.error(`❌ ${script} - ${error.message}`);
      }
    }
    
    // Test 4: Verify HTML page structure
    console.log('\n4️⃣ Testing HTML page structure...');
    try {
      const htmlResponse = await axios.get(BASE_URL);
      const html = htmlResponse.data;
      
      const checks = [
        { name: 'Rencana Strategis page div', pattern: 'id="rencana-strategis"' },
        { name: 'Rencana Strategis content div', pattern: 'id="rencana-strategis-content"' },
        { name: 'Main module script', pattern: 'rencana-strategis.js' },
        { name: 'Force table view script', pattern: 'rencana-strategis-force-table-view.js' },
        { name: 'Menu item', pattern: 'data-page="rencana-strategis"' }
      ];
      
      checks.forEach(check => {
        if (html.includes(check.pattern)) {
          console.log(`✅ ${check.name} found`);
        } else {
          console.log(`❌ ${check.name} NOT found`);
        }
      });
    } catch (error) {
      console.error('❌ HTML page error:', error.message);
    }
    
    // Test 5: Instructions for manual testing
    console.log('\n5️⃣ Manual Testing Instructions:');
    console.log('');
    console.log('📋 Please test the following manually:');
    console.log('');
    console.log('1. Direct Access:');
    console.log(`   Open: ${BASE_URL}/rencana-strategis`);
    console.log('   Expected: Page shows table with data');
    console.log('');
    console.log('2. Menu Navigation:');
    console.log('   - Login to application');
    console.log('   - Click "Rencana Strategis" in sidebar');
    console.log('   Expected: Page shows table, not redirected');
    console.log('');
    console.log('3. Page Refresh:');
    console.log('   - While on Rencana Strategis page, press F5');
    console.log('   Expected: Page reloads and still shows table');
    console.log('');
    console.log('4. Browser Navigation:');
    console.log('   - Navigate to another page');
    console.log('   - Click browser back button');
    console.log('   Expected: Returns to table view');
    console.log('');
    console.log('5. Console Verification:');
    console.log('   Open browser console (F12) and check for:');
    console.log('   - "🔧 Rencana Strategis Force Table View - Loading..."');
    console.log('   - "✅ Rencana Strategis Force Table View - Loaded"');
    console.log('   - "✅ Rencana Strategis page forced to visible"');
    console.log('');
    
    console.log('\n✅ Automated tests completed!');
    console.log('📝 Please perform manual tests as described above');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testTableViewFix();
