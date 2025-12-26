const http = require('http');

async function testResidualRiskRouter() {
  console.log('🔍 Testing Residual Risk Router...');
  
  const baseUrl = 'localhost';
  const port = 3002;
  
  // Test different URL patterns
  const urls = [
    '/residual-risk',
    '/manajemen-risiko/residual-risk',
    '/#/residual-risk',
    '/#/manajemen-risiko/residual-risk'
  ];
  
  for (const url of urls) {
    try {
      console.log(`\n📡 Testing: http://${baseUrl}:${port}${url}`);
      
      const result = await new Promise((resolve, reject) => {
        const options = {
          hostname: baseUrl,
          port: port,
          path: url,
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        };
        
        const req = http.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data
            });
          });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        req.end();
      });
      
      console.log(`Status: ${result.status}`);
      console.log(`Content-Type: ${result.headers['content-type']}`);
      
      if (result.status === 200) {
        const content = result.data;
        
        // Check for key elements
        const checks = [
          { name: 'Has residual-risk-content div', test: content.includes('residual-risk-content') },
          { name: 'Has residual-risk.js script', test: content.includes('residual-risk.js') },
          { name: 'Has navigation.js script', test: content.includes('navigation.js') },
          { name: 'Has app.js script', test: content.includes('app.js') },
          { name: 'Has Chart.js', test: content.includes('chart.js') || content.includes('Chart') },
          { name: 'Has Bootstrap', test: content.includes('bootstrap') },
          { name: 'Has Lucide Icons', test: content.includes('lucide') }
        ];
        
        console.log('📋 Content checks:');
        checks.forEach(check => {
          console.log(`${check.test ? '✅' : '❌'} ${check.name}`);
        });
        
        // Check if it's the main SPA page
        if (content.includes('residual-risk-content') && content.includes('residual-risk.js')) {
          console.log('✅ This appears to be the correct SPA page with residual risk support');
        } else {
          console.log('❌ This does not appear to be the correct page');
        }
        
      } else {
        console.log(`❌ Error: ${result.status} - ${result.data.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Router test complete!');
  console.log('\n💡 Recommendations:');
  console.log('1. Open browser to: http://localhost:3002/residual-risk');
  console.log('2. Check browser console for JavaScript errors');
  console.log('3. Check if authentication is required');
  console.log('4. Verify that the router initializes properly');
}

testResidualRiskRouter().catch(console.error);