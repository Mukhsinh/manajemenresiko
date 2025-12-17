// Test untuk memastikan perbaikan UUID error
async function testUUIDFix() {
  console.log('🔧 Testing UUID Fix for Download Laporan\n');
  
  const BASE_URL = 'http://localhost:3000';
  
  // Test 1: Login untuk mendapatkan token
  console.log('🔐 Testing Login...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/test-data/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.token || loginData.access_token;
      console.log('✅ Login successful');
      console.log(`   Token: ${token ? token.substring(0, 20) + '...' : 'Not found'}`);
      
      // Test 2: Test Excel endpoint yang sebelumnya error
      console.log('\n📊 Testing Risk Register Excel (Previously Failed)...');
      const excelResponse = await fetch(`${BASE_URL}/api/reports/risk-register/excel`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Status:', excelResponse.status);
      console.log('Content-Type:', excelResponse.headers.get('content-type'));
      
      if (excelResponse.ok) {
        const blob = await excelResponse.blob();
        console.log('✅ Excel endpoint now works!');
        console.log(`   Size: ${blob.size} bytes`);
        
        // Check if it's valid Excel
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const signature = Array.from(uint8Array.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
        
        if (signature === '504b0304') {
          console.log('   ✅ Valid Excel file format');
        } else {
          console.log('   ❌ Invalid Excel format');
        }
      } else {
        const errorText = await excelResponse.text();
        console.log('❌ Excel endpoint still failing:');
        console.log(`   Error: ${errorText}`);
        
        // Check if it's still UUID error
        if (errorText.includes('invalid input syntax for type uuid')) {
          console.log('   ⚠️  Still has UUID error - need more fixes');
        } else {
          console.log('   ✅ UUID error fixed, but other issue present');
        }
      }
      
      // Test 3: Test Risk Profile endpoint
      console.log('\n📈 Testing Risk Profile (Previously Failed)...');
      const profileResponse = await fetch(`${BASE_URL}/api/reports/risk-profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Status:', profileResponse.status);
      
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        console.log('✅ Risk Profile endpoint now works!');
        console.log(`   Records: ${Array.isArray(data) ? data.length : 'object'}`);
      } else {
        const errorText = await profileResponse.text();
        console.log('❌ Risk Profile endpoint still failing:');
        console.log(`   Error: ${errorText.substring(0, 200)}`);
        
        if (errorText.includes('invalid input syntax for type uuid')) {
          console.log('   ⚠️  Still has UUID error');
        } else {
          console.log('   ✅ UUID error fixed');
        }
      }
      
    } else {
      console.log('❌ Login failed');
      const errorText = await loginResponse.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Test error: ${error.message}`);
  }
  
  // Test 4: Test debug endpoints (should still work)
  console.log('\n🔍 Testing Debug Endpoints (Should Still Work)...');
  
  const debugEndpoints = [
    '/api/reports/test-excel-download',
    '/api/reports/risk-register-excel-debug'
  ];
  
  for (const endpoint of debugEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      if (response.ok) {
        const blob = await response.blob();
        console.log(`✅ ${endpoint}: ${blob.size} bytes`);
      } else {
        console.log(`❌ ${endpoint}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
  
  console.log('\n📋 DIAGNOSIS:');
  console.log('=============');
  console.log('The UUID error was caused by:');
  console.log('1. req.user.organizations being an array of UUIDs (strings)');
  console.log('2. Code trying to access org.id as if they were objects');
  console.log('3. This resulted in undefined values being passed to SQL queries');
  console.log('');
  console.log('Fix applied:');
  console.log('1. Changed org.id to direct UUID string access');
  console.log('2. Added validation to filter out undefined values');
  console.log('3. Added fallback for empty organization arrays');
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Test the main laporan page now');
  console.log('2. Try downloading Excel from the UI');
  console.log('3. Check browser console for any remaining errors');
  console.log('4. Verify files can be opened properly');
}

// Run the test
testUUIDFix().catch(console.error);