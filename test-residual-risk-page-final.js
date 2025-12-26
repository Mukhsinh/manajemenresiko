const http = require('http');

console.log('🔍 Testing Residual Risk Page Functionality');
console.log('='.repeat(50));

// Test 1: Check if API endpoint is working
async function testAPI() {
    return new Promise((resolve, reject) => {
        console.log('\n1. Testing API Endpoint...');
        
        const options = {
            hostname: 'localhost',
            port: 3003,
            path: '/api/reports/residual-risk-simple',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    if (res.statusCode === 200 && Array.isArray(jsonData)) {
                        console.log(`   ✅ API Status: ${res.statusCode}`);
                        console.log(`   ✅ Data Type: Array with ${jsonData.length} records`);
                        
                        if (jsonData.length > 0) {
                            const sample = jsonData[0];
                            console.log(`   ✅ Sample Record Keys: ${Object.keys(sample).join(', ')}`);
                            
                            if (sample.risk_inputs) {
                                console.log(`   ✅ Risk Inputs Keys: ${Object.keys(sample.risk_inputs).join(', ')}`);
                            }
                            
                            if (sample.risk_inputs && sample.risk_inputs.kode_risiko) {
                                console.log(`   ✅ Sample Kode Risiko: ${sample.risk_inputs.kode_risiko}`);
                            }
                        }
                        
                        resolve({ success: true, data: jsonData });
                    } else {
                        resolve({ success: false, error: `Unexpected response: ${res.statusCode}` });
                    }
                } catch (error) {
                    resolve({ success: false, error: `JSON Parse Error: ${error.message}` });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ success: false, error: `Request Error: ${error.message}` });
        });

        req.end();
    });
}

// Test 2: Check if HTML page is accessible
async function testHTMLPage() {
    return new Promise((resolve, reject) => {
        console.log('\n2. Testing HTML Page Access...');
        
        const options = {
            hostname: 'localhost',
            port: 3003,
            path: '/residual-risk.html',
            method: 'GET',
            headers: {
                'Accept': 'text/html'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`   ✅ HTML Status: ${res.statusCode}`);
                    console.log(`   ✅ Content Length: ${data.length} characters`);
                    
                    // Check for key elements
                    const hasTitle = data.includes('Residual Risk Analysis');
                    const hasAPI = data.includes('/api/reports/residual-risk-simple');
                    const hasDebug = data.includes('toggleDebug');
                    const hasBootstrap = data.includes('bootstrap');
                    
                    console.log(`   ${hasTitle ? '✅' : '❌'} Title Present: ${hasTitle}`);
                    console.log(`   ${hasAPI ? '✅' : '❌'} API Call Present: ${hasAPI}`);
                    console.log(`   ${hasDebug ? '✅' : '❌'} Debug Function Present: ${hasDebug}`);
                    console.log(`   ${hasBootstrap ? '✅' : '❌'} Bootstrap CSS Present: ${hasBootstrap}`);
                    
                    resolve({ 
                        success: true, 
                        checks: { hasTitle, hasAPI, hasDebug, hasBootstrap }
                    });
                } else {
                    resolve({ success: false, error: `HTML page returned ${res.statusCode}` });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ success: false, error: `HTML Request Error: ${error.message}` });
        });

        req.end();
    });
}

// Test 3: Check server status
async function testServerStatus() {
    return new Promise((resolve, reject) => {
        console.log('\n3. Testing Server Status...');
        
        const options = {
            hostname: 'localhost',
            port: 3003,
            path: '/',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            console.log(`   ✅ Server Status: ${res.statusCode}`);
            console.log(`   ✅ Server Headers: ${JSON.stringify(res.headers, null, 2)}`);
            resolve({ success: true, status: res.statusCode });
        });

        req.on('error', (error) => {
            resolve({ success: false, error: `Server Error: ${error.message}` });
        });

        req.end();
    });
}

// Run all tests
async function runAllTests() {
    console.log('Starting comprehensive tests...\n');
    
    const results = {
        api: await testAPI(),
        html: await testHTMLPage(),
        server: await testServerStatus()
    };
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    console.log(`\n🔗 API Test: ${results.api.success ? '✅ PASSED' : '❌ FAILED'}`);
    if (!results.api.success) {
        console.log(`   Error: ${results.api.error}`);
    } else {
        console.log(`   Records: ${results.api.data.length}`);
    }
    
    console.log(`\n📄 HTML Test: ${results.html.success ? '✅ PASSED' : '❌ FAILED'}`);
    if (!results.html.success) {
        console.log(`   Error: ${results.html.error}`);
    } else {
        const checks = results.html.checks;
        console.log(`   All Components: ${Object.values(checks).every(v => v) ? '✅ OK' : '⚠️ Some Missing'}`);
    }
    
    console.log(`\n🖥️  Server Test: ${results.server.success ? '✅ PASSED' : '❌ FAILED'}`);
    if (!results.server.success) {
        console.log(`   Error: ${results.server.error}`);
    }
    
    const allPassed = results.api.success && results.html.success && results.server.success;
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 OVERALL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('='.repeat(50));
    
    if (allPassed) {
        console.log('\n🚀 Residual Risk page should now work correctly!');
        console.log('📍 Access it at: http://localhost:3003/residual-risk.html');
        console.log('🐛 Use the Debug button on the page for troubleshooting');
    } else {
        console.log('\n🔧 Please check the failed tests above and fix the issues');
    }
    
    return allPassed;
}

// Execute tests
runAllTests().catch(console.error);