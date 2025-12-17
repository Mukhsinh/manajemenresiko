// Test sederhana untuk endpoint laporan tanpa auth
async function testReportEndpoints() {
  const BASE_URL = 'http://localhost:3000';
  
  const endpoints = [
    '/api/reports/risk-register-debug',
    '/api/reports/risk-profile-debug',
    '/api/reports/residual-risk-simple'
  ];

  console.log('🚀 Testing Report Endpoints (No Auth)\n');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing: ${endpoint}`);
      
      const response = await fetch(`${BASE_URL}${endpoint}`);

      if (!response.ok) {
        console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 300)}...`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ ${endpoint}: Success`);
      
      if (Array.isArray(data)) {
        console.log(`   Records: ${data.length}`);
        if (data.length > 0) {
          console.log(`   Sample keys: ${Object.keys(data[0]).slice(0, 5).join(', ')}`);
        }
      } else if (data.fullData && Array.isArray(data.fullData)) {
        console.log(`   Records: ${data.fullData.length}`);
        console.log(`   Message: ${data.message}`);
      } else {
        console.log(`   Type: ${typeof data}`);
        console.log(`   Keys: ${Object.keys(data).slice(0, 5).join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
    console.log('');
  }
}

// Test frontend laporan.js
async function testFrontendLaporan() {
  console.log('📱 Testing Frontend Laporan Module\n');
  
  try {
    const BASE_URL = 'http://localhost:3000';
    
    // Test if laporan.js is accessible
    const response = await fetch(`${BASE_URL}/js/laporan.js`);
    
    if (response.ok) {
      const jsContent = await response.text();
      console.log('✅ laporan.js is accessible');
      console.log(`   Size: ${jsContent.length} characters`);
      
      // Check for key functions
      const functions = ['downloadExcel', 'downloadPDF', 'showPreview'];
      functions.forEach(func => {
        if (jsContent.includes(func)) {
          console.log(`   ✅ Function ${func} found`);
        } else {
          console.log(`   ❌ Function ${func} missing`);
        }
      });
    } else {
      console.log('❌ laporan.js not accessible');
    }
    
  } catch (error) {
    console.log(`❌ Frontend test error: ${error.message}`);
  }
}

// Test halaman laporan HTML
async function testLaporanPage() {
  console.log('\n🌐 Testing Laporan Page\n');
  
  try {
    const BASE_URL = 'http://localhost:3000';
    
    // Test main page
    const response = await fetch(`${BASE_URL}/`);
    
    if (response.ok) {
      const htmlContent = await response.text();
      console.log('✅ Main page accessible');
      
      // Check for laporan elements
      const checks = [
        { name: 'Laporan menu item', pattern: 'data-page="laporan"' },
        { name: 'Laporan page content', pattern: 'id="laporan"' },
        { name: 'Laporan content div', pattern: 'id="laporan-content"' },
        { name: 'Laporan script', pattern: 'src="/js/laporan.js"' }
      ];
      
      checks.forEach(check => {
        if (htmlContent.includes(check.pattern)) {
          console.log(`   ✅ ${check.name} found`);
        } else {
          console.log(`   ❌ ${check.name} missing`);
        }
      });
    } else {
      console.log('❌ Main page not accessible');
    }
    
  } catch (error) {
    console.log(`❌ Page test error: ${error.message}`);
  }
}

// Main test
async function runTests() {
  await testReportEndpoints();
  await testFrontendLaporan();
  await testLaporanPage();
  
  console.log('\n🏁 All tests completed!');
}

runTests().catch(console.error);