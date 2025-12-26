const http = require('http');

async function testResidualRiskFinal() {
  console.log('🎯 Final Residual Risk Test - Complete Verification');
  console.log('=' .repeat(60));
  
  const baseUrl = 'localhost';
  const port = 3002;
  
  let allTestsPassed = true;
  
  // Test 1: Server Status
  console.log('\n📋 Test 1: Server Status');
  try {
    const serverTest = await new Promise((resolve, reject) => {
      const options = {
        hostname: baseUrl,
        port: port,
        path: '/',
        method: 'GET',
        timeout: 5000
      };
      
      const req = http.request(options, (res) => {
        resolve({ status: res.statusCode });
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Server timeout')));
      req.end();
    });
    
    if (serverTest.status === 200) {
      console.log('✅ Server is running and responsive');
    } else {
      console.log(`❌ Server returned status: ${serverTest.status}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ Server test failed: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 2: Residual Risk Page
  console.log('\n📋 Test 2: Residual Risk Page');
  try {
    const pageTest = await new Promise((resolve, reject) => {
      const options = {
        hostname: baseUrl,
        port: port,
        path: '/residual-risk',
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, data: data });
        });
      });
      
      req.on('error', reject);
      req.end();
    });
    
    if (pageTest.status === 200) {
      const content = pageTest.data;
      const requiredElements = [
        { name: 'residual-risk-content container', test: content.includes('id="residual-risk-content"') },
        { name: 'residual-risk.js script', test: content.includes('src="/js/residual-risk.js"') },
        { name: 'Chart.js library', test: content.includes('chart.js') || content.includes('Chart') },
        { name: 'Bootstrap CSS', test: content.includes('bootstrap') || content.includes('btn') },
        { name: 'Lucide icons', test: content.includes('lucide') }
      ];
      
      let pageTestsPassed = true;
      requiredElements.forEach(element => {
        if (element.test) {
          console.log(`✅ ${element.name}`);
        } else {
          console.log(`❌ ${element.name}`);
          pageTestsPassed = false;
        }
      });
      
      if (pageTestsPassed) {
        console.log('✅ Page structure is correct');
      } else {
        console.log('❌ Page structure has issues');
        allTestsPassed = false;
      }
    } else {
      console.log(`❌ Page returned status: ${pageTest.status}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ Page test failed: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 3: API Endpoint
  console.log('\n📋 Test 3: API Endpoint');
  try {
    const apiTest = await new Promise((resolve, reject) => {
      const options = {
        hostname: baseUrl,
        port: port,
        path: '/api/reports/residual-risk-simple',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, data: data });
        });
      });
      
      req.on('error', reject);
      req.end();
    });
    
    if (apiTest.status === 200) {
      try {
        const jsonData = JSON.parse(apiTest.data);
        if (Array.isArray(jsonData)) {
          console.log(`✅ API returns valid data - ${jsonData.length} items`);
          
          if (jsonData.length > 0) {
            const sampleItem = jsonData[0];
            const requiredFields = ['id', 'risk_value', 'risk_level', 'risk_inputs'];
            const hasRequiredFields = requiredFields.every(field => sampleItem.hasOwnProperty(field));
            
            if (hasRequiredFields) {
              console.log('✅ Data structure is correct');
            } else {
              console.log('❌ Data structure is missing required fields');
              allTestsPassed = false;
            }
          }
        } else {
          console.log('❌ API does not return array data');
          allTestsPassed = false;
        }
      } catch (parseError) {
        console.log(`❌ API returned invalid JSON: ${parseError.message}`);
        allTestsPassed = false;
      }
    } else {
      console.log(`❌ API returned status: ${apiTest.status}`);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`❌ API test failed: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 4: JavaScript Files
  console.log('\n📋 Test 4: JavaScript Files');
  const jsFiles = [
    '/js/residual-risk.js',
    '/js/navigation.js',
    '/js/app.js'
  ];
  
  for (const jsFile of jsFiles) {
    try {
      const jsTest = await new Promise((resolve, reject) => {
        const options = {
          hostname: baseUrl,
          port: port,
          path: jsFile,
          method: 'GET'
        };
        
        const req = http.request(options, (res) => {
          resolve({ status: res.statusCode, size: res.headers['content-length'] });
        });
        
        req.on('error', reject);
        req.end();
      });
      
      if (jsTest.status === 200) {
        console.log(`✅ ${jsFile} - ${jsTest.size || 'unknown'} bytes`);
      } else {
        console.log(`❌ ${jsFile} - Status: ${jsTest.status}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${jsFile} - Error: ${error.message}`);
      allTestsPassed = false;
    }
  }
  
  // Final Results
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 FINAL TEST RESULTS');
  console.log('=' .repeat(60));
  
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! ');
    console.log('✅ Server is running correctly');
    console.log('✅ Residual Risk page is properly configured');
    console.log('✅ API endpoint is working');
    console.log('✅ JavaScript files are loading');
    console.log('');
    console.log('🌐 Ready to test in browser:');
    console.log(`   http://localhost:${port}/residual-risk`);
    console.log('');
    console.log('📋 If the page appears blank in browser:');
    console.log('   1. Open Developer Tools (F12)');
    console.log('   2. Check Console tab for JavaScript errors');
    console.log('   3. Check Network tab for failed requests');
    console.log('   4. Verify authentication if required');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('');
    console.log('🔧 Please check the failed tests above and fix the issues');
  }
  
  console.log('=' .repeat(60));
}

testResidualRiskFinal().catch(console.error);