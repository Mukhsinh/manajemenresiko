const http = require('http');

async function testResidualRiskPage() {
  console.log('🔍 Testing Residual Risk HTML page...');
  
  const baseUrl = 'localhost';
  const port = 3002;
  const path = '/residual-risk';
  
  try {
    console.log(`\n📡 Testing: http://${baseUrl}:${port}${path}`);
    
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: baseUrl,
        port: port,
        path: path,
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
    console.log(`Content-Length: ${result.headers['content-length']}`);
    
    if (result.status === 200) {
      console.log(`✅ Page loaded successfully!`);
      
      // Check if it contains expected content
      const content = result.data;
      const checks = [
        { name: 'Title', test: content.includes('Residual Risk') },
        { name: 'Bootstrap CSS', test: content.includes('bootstrap') },
        { name: 'Lucide Icons', test: content.includes('lucide') },
        { name: 'API Call', test: content.includes('/api/reports/residual-risk-simple') },
        { name: 'Debug Function', test: content.includes('debugLog') },
        { name: 'Load Data Function', test: content.includes('loadData') },
        { name: 'Render Content', test: content.includes('renderContent') }
      ];
      
      console.log('\n📋 Content checks:');
      checks.forEach(check => {
        console.log(`${check.test ? '✅' : '❌'} ${check.name}`);
      });
      
      // Check for potential JavaScript errors in the HTML
      const jsErrors = [];
      if (content.includes('undefined') && content.includes('function')) {
        jsErrors.push('Potential undefined function references');
      }
      if (content.includes('null.') || content.includes('undefined.')) {
        jsErrors.push('Potential null/undefined property access');
      }
      
      if (jsErrors.length > 0) {
        console.log('\n⚠️ Potential issues found:');
        jsErrors.forEach(error => console.log(`   - ${error}`));
      } else {
        console.log('\n✅ No obvious JavaScript issues detected');
      }
      
    } else {
      console.log(`❌ Error loading page: ${result.data}`);
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
  
  console.log('\n🎯 Page test complete!');
  console.log(`\n🌐 Open in browser: http://localhost:3002/residual-risk`);
}

testResidualRiskPage().catch(console.error);