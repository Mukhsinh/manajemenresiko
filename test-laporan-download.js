// Test script untuk menguji fungsi download laporan
// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000';

// Test login untuk mendapatkan token
async function testLogin() {
  try {
    console.log('🔐 Testing login...');
    
    const response = await fetch(`${BASE_URL}/api/test-data/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Login successful');
    return data.token || data.access_token;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

// Test endpoint laporan
async function testReportEndpoints(token) {
  const endpoints = [
    '/api/reports/risk-register',
    '/api/reports/risk-profile',
    '/api/reports/residual-risk',
    '/api/reports/risk-appetite-dashboard'
  ];

  console.log('\n📊 Testing report data endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint}`);
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 200)}...`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ ${endpoint}: ${Array.isArray(data) ? data.length : 'object'} records`);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`   Sample keys: ${Object.keys(data[0]).slice(0, 5).join(', ')}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

// Test download Excel endpoints
async function testExcelDownloads(token) {
  const excelEndpoints = [
    '/api/reports/risk-register/excel',
    '/api/reports/risk-profile/excel',
    '/api/reports/residual-risk/excel',
    '/api/reports/risk-appetite/excel'
  ];

  console.log('\n📥 Testing Excel download endpoints...');
  
  for (const endpoint of excelEndpoints) {
    try {
      console.log(`\n📊 Testing Excel: ${endpoint}`);
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 200)}...`);
        continue;
      }

      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      console.log(`✅ ${endpoint}:`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Length: ${contentLength} bytes`);
      
      if (contentType && contentType.includes('spreadsheet')) {
        console.log(`   ✅ Correct Excel MIME type`);
      } else {
        console.log(`   ⚠️  Unexpected content type: ${contentType}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

// Test PDF endpoints
async function testPDFDownloads(token) {
  const pdfEndpoints = [
    '/api/reports/residual-risk/pdf'  // Only this one is implemented
  ];

  console.log('\n📄 Testing PDF download endpoints...');
  
  for (const endpoint of pdfEndpoints) {
    try {
      console.log(`\n📄 Testing PDF: ${endpoint}`);
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 200)}...`);
        continue;
      }

      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      console.log(`✅ ${endpoint}:`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Length: ${contentLength} bytes`);
      
      if (contentType && contentType.includes('pdf')) {
        console.log(`   ✅ Correct PDF MIME type`);
      } else {
        console.log(`   ⚠️  Unexpected content type: ${contentType}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Laporan Download Tests\n');
  
  // Step 1: Login
  const token = await testLogin();
  if (!token) {
    console.log('❌ Cannot proceed without valid token');
    return;
  }
  
  // Step 2: Test data endpoints
  await testReportEndpoints(token);
  
  // Step 3: Test Excel downloads
  await testExcelDownloads(token);
  
  // Step 4: Test PDF downloads
  await testPDFDownloads(token);
  
  console.log('\n🏁 Test completed!');
}

// Run tests
runTests().catch(console.error);