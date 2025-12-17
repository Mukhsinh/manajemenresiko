const http = require('http');

async function testRiskRegisterEndpoint() {
    console.log('🔍 Testing Risk Register Endpoint...\n');
    
    // Test endpoint tanpa auth dulu untuk melihat struktur response
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/reports/risk-register',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📡 Response Status: ${res.statusCode}`);
                console.log(`📋 Response Headers:`, res.headers);
                
                try {
                    if (res.statusCode === 401) {
                        console.log('🔐 Expected 401 - Authentication required');
                        console.log('📄 Response:', data);
                        resolve({ status: 401, message: 'Auth required' });
                    } else if (res.statusCode === 200) {
                        const jsonData = JSON.parse(data);
                        console.log(`✅ Success! Got ${jsonData.length} records`);
                        
                        if (jsonData.length > 0) {
                            console.log('\n🔍 Sample Record Analysis:');
                            const sample = jsonData[0];
                            console.log(`📝 Risk Code: ${sample.kode_risiko || 'N/A'}`);
                            console.log(`🏢 Work Unit: ${sample.master_work_units?.name || 'N/A'}`);
                            console.log(`📂 Category: ${sample.master_risk_categories?.name || 'N/A'}`);
                            console.log(`🎯 Target: ${sample.sasaran ? sample.sasaran.substring(0, 50) + '...' : 'N/A'}`);
                            console.log(`📈 Has Inherent Analysis: ${sample.risk_inherent_analysis?.length > 0 ? 'Yes' : 'No'}`);
                            console.log(`📉 Has Residual Analysis: ${sample.risk_residual_analysis?.length > 0 ? 'Yes' : 'No'}`);
                        }
                        
                        resolve({ status: 200, data: jsonData });
                    } else {
                        console.log(`❌ Unexpected status: ${res.statusCode}`);
                        console.log('📄 Response:', data);
                        resolve({ status: res.statusCode, data: data });
                    }
                } catch (error) {
                    console.error('❌ Error parsing response:', error);
                    console.log('📄 Raw response:', data);
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Request error:', error);
            reject(error);
        });
        
        req.end();
    });
}

// Test dengan mock token
async function testWithMockToken() {
    console.log('\n🔐 Testing with Mock Token...\n');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/reports/risk-register',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token-for-testing'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📡 Response Status: ${res.statusCode}`);
                
                try {
                    if (res.statusCode === 200) {
                        const jsonData = JSON.parse(data);
                        console.log(`✅ Success with mock token! Got ${jsonData.length} records`);
                        resolve({ status: 200, data: jsonData });
                    } else {
                        console.log(`❌ Status: ${res.statusCode}`);
                        console.log('📄 Response:', data);
                        resolve({ status: res.statusCode, data: data });
                    }
                } catch (error) {
                    console.error('❌ Error parsing response:', error);
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Request error:', error);
            reject(error);
        });
        
        req.end();
    });
}

async function runTests() {
    try {
        console.log('🚀 Starting Risk Register Endpoint Tests\n');
        
        // Test 1: Without auth
        await testRiskRegisterEndpoint();
        
        // Test 2: With mock token
        await testWithMockToken();
        
        console.log('\n✅ All tests completed!');
        
    } catch (error) {
        console.error('❌ Test suite failed:', error);
    }
}

// Run tests
runTests();