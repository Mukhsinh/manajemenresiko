/**
 * Test KRI Endpoints
 * Run: node test-kri-endpoints.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

async function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('Testing KRI Endpoints');
    console.log('='.repeat(60));
    
    // Test 1: GET /api/kri/public (no auth)
    console.log('\n1. Testing GET /api/kri/public (no auth)...');
    try {
        const result = await makeRequest('/api/kri/public');
        console.log(`   Status: ${result.status}`);
        console.log(`   Data count: ${Array.isArray(result.data) ? result.data.length : 'N/A'}`);
        if (result.status === 200) {
            console.log('   ✅ PASS');
        } else {
            console.log('   ❌ FAIL');
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    // Test 2: GET /api/kri/simple (no auth)
    console.log('\n2. Testing GET /api/kri/simple (no auth)...');
    try {
        const result = await makeRequest('/api/kri/simple');
        console.log(`   Status: ${result.status}`);
        console.log(`   Data count: ${Array.isArray(result.data) ? result.data.length : 'N/A'}`);
        if (result.status === 200) {
            console.log('   ✅ PASS');
        } else {
            console.log('   ❌ FAIL');
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    // Test 3: GET /api/kri/test-no-auth (no auth)
    console.log('\n3. Testing GET /api/kri/test-no-auth (no auth)...');
    try {
        const result = await makeRequest('/api/kri/test-no-auth');
        console.log(`   Status: ${result.status}`);
        console.log(`   Data count: ${Array.isArray(result.data) ? result.data.length : 'N/A'}`);
        if (result.status === 200) {
            console.log('   ✅ PASS');
            
            // If we have data, test GET by ID
            if (Array.isArray(result.data) && result.data.length > 0) {
                const testId = result.data[0].id;
                console.log(`\n4. Testing GET /api/kri/${testId} (requires auth)...`);
                try {
                    const idResult = await makeRequest(`/api/kri/${testId}`);
                    console.log(`   Status: ${idResult.status}`);
                    if (idResult.status === 401) {
                        console.log('   ✅ PASS (401 expected without auth)');
                    } else if (idResult.status === 200) {
                        console.log('   ✅ PASS (data returned)');
                    } else {
                        console.log(`   ⚠️ Unexpected status: ${idResult.status}`);
                        console.log(`   Response: ${JSON.stringify(idResult.data)}`);
                    }
                } catch (error) {
                    console.log(`   ❌ ERROR: ${error.message}`);
                }
            }
        } else {
            console.log('   ❌ FAIL');
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    // Test 5: GET /api/kri/debug (no auth)
    console.log('\n5. Testing GET /api/kri/debug (no auth)...');
    try {
        const result = await makeRequest('/api/kri/debug');
        console.log(`   Status: ${result.status}`);
        if (result.status === 200) {
            console.log(`   Success: ${result.data.success}`);
            console.log(`   Count: ${result.data.count}`);
            console.log('   ✅ PASS');
        } else {
            console.log('   ❌ FAIL');
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    // Test 6: GET /api/kri/generate/kode (requires auth)
    console.log('\n6. Testing GET /api/kri/generate/kode (requires auth)...');
    try {
        const result = await makeRequest('/api/kri/generate/kode');
        console.log(`   Status: ${result.status}`);
        if (result.status === 401) {
            console.log('   ✅ PASS (401 expected without auth)');
        } else if (result.status === 200) {
            console.log(`   Kode: ${result.data.kode}`);
            console.log('   ✅ PASS');
        } else {
            console.log(`   ⚠️ Unexpected status: ${result.status}`);
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Test Complete');
    console.log('='.repeat(60));
}

runTests().catch(console.error);
