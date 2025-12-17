// Debug script untuk menganalisis masalah download
async function debugDownloadIssues() {
  console.log('🔍 DEBUGGING DOWNLOAD ISSUES\n');
  
  const BASE_URL = 'http://localhost:3000';
  
  // Test 1: Check if test Excel endpoint works
  console.log('📊 Testing Excel Test Endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/reports/test-excel-download`);
    
    console.log('Response status:', response.status);
    console.log('Response headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    if (response.ok) {
      const blob = await response.blob();
      console.log('✅ Excel test endpoint works');
      console.log(`   Blob size: ${blob.size} bytes`);
      console.log(`   Blob type: ${blob.type}`);
      
      // Check if blob is actually Excel
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const signature = Array.from(uint8Array.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
      console.log(`   File signature: ${signature}`);
      
      if (signature === '504b0304') {
        console.log('   ✅ Valid Excel file signature');
      } else {
        console.log('   ❌ Invalid Excel file signature');
        // Show first 100 bytes as text to see what's actually returned
        const textDecoder = new TextDecoder();
        const firstBytes = textDecoder.decode(uint8Array.slice(0, 100));
        console.log(`   First 100 bytes as text: ${firstBytes}`);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Excel test endpoint failed');
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Excel test error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: Check authentication and real endpoints
  console.log('🔐 Testing Authentication...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/test-data/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.token || loginData.access_token;
      console.log('✅ Authentication successful');
      console.log(`   Token: ${token ? token.substring(0, 20) + '...' : 'Not found'}`);
      
      // Test real Excel endpoint with auth
      console.log('\n📊 Testing Real Excel Endpoint with Auth...');
      const excelResponse = await fetch(`${BASE_URL}/api/reports/risk-register/excel`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Response status:', excelResponse.status);
      console.log('Response headers:');
      for (const [key, value] of excelResponse.headers.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      if (excelResponse.ok) {
        const blob = await excelResponse.blob();
        console.log('✅ Real Excel endpoint works');
        console.log(`   Blob size: ${blob.size} bytes`);
        
        // Check content
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const signature = Array.from(uint8Array.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
        console.log(`   File signature: ${signature}`);
        
        if (signature === '504b0304') {
          console.log('   ✅ Valid Excel file');
        } else {
          console.log('   ❌ Invalid Excel file');
          const textDecoder = new TextDecoder();
          const firstBytes = textDecoder.decode(uint8Array.slice(0, 200));
          console.log(`   Content preview: ${firstBytes}`);
        }
      } else {
        const errorText = await excelResponse.text();
        console.log('❌ Real Excel endpoint failed');
        console.log(`   Error: ${errorText}`);
      }
      
      // Test PDF endpoint
      console.log('\n📄 Testing PDF Endpoint...');
      const pdfResponse = await fetch(`${BASE_URL}/api/reports/residual-risk/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('PDF Response status:', pdfResponse.status);
      console.log('PDF Response headers:');
      for (const [key, value] of pdfResponse.headers.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      if (pdfResponse.ok) {
        const blob = await pdfResponse.blob();
        console.log('✅ PDF endpoint works');
        console.log(`   Blob size: ${blob.size} bytes`);
        
        // Check PDF signature
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const signature = String.fromCharCode(...uint8Array.slice(0, 4));
        console.log(`   File signature: ${signature}`);
        
        if (signature === '%PDF') {
          console.log('   ✅ Valid PDF file');
        } else {
          console.log('   ❌ Invalid PDF file');
          const textDecoder = new TextDecoder();
          const firstBytes = textDecoder.decode(uint8Array.slice(0, 200));
          console.log(`   Content preview: ${firstBytes}`);
        }
      } else {
        const errorText = await pdfResponse.text();
        console.log('❌ PDF endpoint failed');
        console.log(`   Error: ${errorText.substring(0, 500)}`);
      }
      
    } else {
      console.log('❌ Authentication failed');
    }
  } catch (error) {
    console.log(`❌ Authentication error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 3: Check data endpoints
  console.log('📊 Testing Data Endpoints...');
  const dataEndpoints = [
    '/api/reports/risk-register-debug',
    '/api/reports/risk-profile-debug',
    '/api/reports/residual-risk-simple'
  ];
  
  for (const endpoint of dataEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      if (response.ok) {
        const data = await response.json();
        const count = Array.isArray(data) ? data.length : 
                     (data.fullData ? data.fullData.length : 'object');
        console.log(`✅ ${endpoint}: ${count} records`);
      } else {
        console.log(`❌ ${endpoint}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
  
  console.log('\n🔍 DIAGNOSIS SUMMARY:');
  console.log('====================');
  console.log('1. Check if Excel test endpoint returns valid Excel file');
  console.log('2. Check if authentication works for real endpoints');
  console.log('3. Check if data endpoints return actual data');
  console.log('4. Check if file signatures are correct');
  console.log('5. Look for any JSON responses instead of binary files');
}

// Run debug
debugDownloadIssues().catch(console.error);