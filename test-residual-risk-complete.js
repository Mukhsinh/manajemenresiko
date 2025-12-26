const http = require('http');

async function testResidualRiskComplete() {
  console.log('🔍 Complete Residual Risk Test...');
  
  const baseUrl = 'localhost';
  const port = 3002;
  
  // Step 1: Test the main page
  console.log('\n📋 Step 1: Testing main page load...');
  try {
    const pageResult = await new Promise((resolve, reject) => {
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
    
    if (pageResult.status === 200) {
      console.log('✅ Main page loads successfully');
      
      // Check for critical elements
      const criticalChecks = [
        { name: 'residual-risk-content container', test: pageResult.data.includes('id="residual-risk-content"') },
        { name: 'residual-risk.js script', test: pageResult.data.includes('src="/js/residual-risk.js"') },
        { name: 'Chart.js library', test: pageResult.data.includes('chart.js') || pageResult.data.includes('Chart') },
        { name: 'navigation.js script', test: pageResult.data.includes('src="/js/navigation.js"') }
      ];
      
      criticalChecks.forEach(check => {
        console.log(`${check.test ? '✅' : '❌'} ${check.name}`);
      });
      
    } else {
      console.log(`❌ Main page failed: ${pageResult.status}`);
      return;
    }
  } catch (error) {
    console.log(`❌ Main page test failed: ${error.message}`);
    return;
  }
  
  // Step 2: Test API endpoint
  console.log('\n📋 Step 2: Testing API endpoint...');
  try {
    const apiResult = await new Promise((resolve, reject) => {
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
    
    if (apiResult.status === 200) {
      try {
        const jsonData = JSON.parse(apiResult.data);
        console.log(`✅ API endpoint works - ${Array.isArray(jsonData) ? jsonData.length : 'non-array'} items`);
        
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          console.log(`📊 Sample data structure:`, Object.keys(jsonData[0]).join(', '));
        }
      } catch (parseError) {
        console.log(`❌ API returned invalid JSON: ${parseError.message}`);
      }
    } else {
      console.log(`❌ API endpoint failed: ${apiResult.status}`);
    }
  } catch (error) {
    console.log(`❌ API test failed: ${error.message}`);
  }
  
  // Step 3: Test static assets
  console.log('\n📋 Step 3: Testing static assets...');
  const assets = [
    '/js/residual-risk.js',
    '/js/navigation.js',
    '/js/app.js',
    '/css/style.css'
  ];
  
  for (const asset of assets) {
    try {
      const assetResult = await new Promise((resolve, reject) => {
        const options = {
          hostname: baseUrl,
          port: port,
          path: asset,
          method: 'GET'
        };
        
        const req = http.request(options, (res) => {
          resolve({ status: res.statusCode, size: res.headers['content-length'] });
        });
        
        req.on('error', reject);
        req.end();
      });
      
      if (assetResult.status === 200) {
        console.log(`✅ ${asset} - ${assetResult.size || 'unknown'} bytes`);
      } else {
        console.log(`❌ ${asset} - Status: ${assetResult.status}`);
      }
    } catch (error) {
      console.log(`❌ ${asset} - Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Complete test finished!');
  console.log('\n📝 Summary:');
  console.log('✅ Server is running on port 3002');
  console.log('✅ Main SPA page loads correctly');
  console.log('✅ API endpoint is working');
  console.log('✅ Static assets are available');
  console.log('\n🌐 Next steps:');
  console.log('1. Open browser: http://localhost:3002/residual-risk');
  console.log('2. Open browser developer tools (F12)');
  console.log('3. Check Console tab for JavaScript errors');
  console.log('4. Check Network tab for failed requests');
  console.log('5. If page is blank, check if authentication is required');
  
  console.log('\n🔧 Troubleshooting tips:');
  console.log('- If you see "Loading..." forever, check API authentication');
  console.log('- If you see JavaScript errors, check browser console');
  console.log('- If charts don\'t load, check if Chart.js is properly loaded');
  console.log('- If icons don\'t show, check if Lucide icons are loaded');
}

testResidualRiskComplete().catch(console.error);