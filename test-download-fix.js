// Test script untuk menguji perbaikan download laporan
async function testDownloadFix() {
  console.log('🚀 Testing Download Fix\n');
  
  const BASE_URL = 'http://localhost:3000';
  
  // Test 1: Excel Download
  console.log('📊 Testing Excel Download...');
  try {
    const response = await fetch(`${BASE_URL}/api/reports/test-excel-download`);
    
    if (response.ok) {
      const blob = await response.blob();
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      console.log('✅ Excel Download Success:');
      console.log(`   Size: ${blob.size} bytes`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Length: ${contentLength}`);
      
      // Validate Excel format
      if (contentType && contentType.includes('spreadsheet')) {
        console.log('   ✅ Correct Excel MIME type');
      } else {
        console.log('   ❌ Incorrect MIME type');
      }
      
      // Validate file size
      if (blob.size > 1000) {
        console.log('   ✅ File size looks good');
      } else {
        console.log('   ⚠️  File size might be too small');
      }
      
      // Check if it starts with Excel signature
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const signature = Array.from(uint8Array.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (signature === '504b0304') {
        console.log('   ✅ Valid Excel file signature (ZIP format)');
      } else {
        console.log(`   ⚠️  Unexpected file signature: ${signature}`);
      }
      
    } else {
      console.log(`❌ Excel Download Failed: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`❌ Excel Download Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: PDF Download (with auth)
  console.log('📄 Testing PDF Download...');
  try {
    // First try to get a token
    const loginResponse = await fetch(`${BASE_URL}/api/test-data/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.token || loginData.access_token;
      
      if (token) {
        console.log('✅ Authentication successful');
        
        const pdfResponse = await fetch(`${BASE_URL}/api/reports/residual-risk/pdf`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (pdfResponse.ok) {
          const blob = await pdfResponse.blob();
          const contentType = pdfResponse.headers.get('content-type');
          const contentLength = pdfResponse.headers.get('content-length');
          
          console.log('✅ PDF Download Success:');
          console.log(`   Size: ${blob.size} bytes`);
          console.log(`   Content-Type: ${contentType}`);
          console.log(`   Content-Length: ${contentLength}`);
          
          // Validate PDF format
          if (contentType && contentType.includes('pdf')) {
            console.log('   ✅ Correct PDF MIME type');
          } else {
            console.log('   ❌ Incorrect MIME type');
          }
          
          // Check if it starts with PDF signature
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const signature = String.fromCharCode(...uint8Array.slice(0, 4));
          
          if (signature === '%PDF') {
            console.log('   ✅ Valid PDF file signature');
          } else {
            console.log(`   ⚠️  Unexpected file signature: ${signature}`);
          }
          
        } else {
          console.log(`❌ PDF Download Failed: ${pdfResponse.status}`);
          const errorText = await pdfResponse.text();
          console.log(`   Error: ${errorText.substring(0, 200)}`);
        }
      } else {
        console.log('❌ No token received from login');
      }
    } else {
      console.log(`❌ Login Failed: ${loginResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ PDF Download Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 3: File Format Validation
  console.log('🔍 Testing File Format Validation...');
  
  // Test Excel endpoint that might return JSON error
  try {
    const response = await fetch(`${BASE_URL}/api/reports/risk-register/excel`);
    
    if (!response.ok) {
      console.log(`✅ Excel endpoint properly returns error: ${response.status}`);
    } else {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('spreadsheet')) {
        console.log('✅ Excel endpoint returns proper Excel file');
      } else {
        console.log('⚠️  Excel endpoint returns unexpected content type');
      }
    }
  } catch (error) {
    console.log(`⚠️  Excel endpoint test error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 4: Dependencies Check
  console.log('📦 Testing Dependencies...');
  
  try {
    // Test if XLSX is working
    const xlsxTest = await fetch(`${BASE_URL}/api/reports/test-excel-download`);
    if (xlsxTest.ok) {
      console.log('✅ XLSX library working');
    } else {
      console.log('❌ XLSX library issue');
    }
    
    // Test if Puppeteer is available (indirectly)
    const puppeteerTest = await fetch(`${BASE_URL}/api/reports/residual-risk/pdf`, {
      method: 'HEAD'
    });
    
    if (puppeteerTest.status !== 404) {
      console.log('✅ Puppeteer endpoint available');
    } else {
      console.log('❌ Puppeteer endpoint not found');
    }
    
  } catch (error) {
    console.log(`⚠️  Dependencies test error: ${error.message}`);
  }
  
  console.log('\n🏁 Download Fix Test Completed!');
}

// Run the test
testDownloadFix().catch(console.error);