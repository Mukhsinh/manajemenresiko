const http = require('http');

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.end();
    });
}

async function testSwotFixes() {
    console.log('🔍 Testing SWOT Analysis Fixes...');
    console.log('=====================================');

    try {
        // Test SWOT debug endpoint
        console.log('\n📊 Testing SWOT Debug Endpoint...');
        const debugResult = await makeRequest('/api/analisis-swot/debug');
        if (debugResult.status === 200) {
            console.log('✅ SWOT Debug endpoint working');
            console.log(`   Data count: ${debugResult.data.count || 0}`);
            console.log(`   Success: ${debugResult.data.success}`);
        } else {
            console.log('❌ SWOT Debug endpoint failed');
            console.log(`   Status: ${debugResult.status}`);
        }

        // Test Dashboard public endpoint
        console.log('\n📈 Testing Dashboard Public Endpoint...');
        const dashboardResult = await makeRequest('/api/dashboard/public');
        if (dashboardResult.status === 200) {
            console.log('✅ Dashboard public endpoint working');
            console.log(`   Total risks: ${dashboardResult.data.total_risks || 0}`);
            console.log(`   Inherent risks: ${JSON.stringify(dashboardResult.data.inherent_risks || {})}`);
            console.log(`   Residual risks: ${JSON.stringify(dashboardResult.data.residual_risks || {})}`);
        } else {
            console.log('❌ Dashboard public endpoint failed');
            console.log(`   Status: ${dashboardResult.status}`);
        }

        // Test Risk Profile public endpoint
        console.log('\n🛡️  Testing Risk Profile Public Endpoint...');
        const riskProfileResult = await makeRequest('/api/risk-profile/public');
        if (riskProfileResult.status === 200) {
            console.log('✅ Risk Profile public endpoint working');
            console.log(`   Data count: ${Array.isArray(riskProfileResult.data) ? riskProfileResult.data.length : 0}`);
        } else {
            console.log('❌ Risk Profile public endpoint failed');
            console.log(`   Status: ${riskProfileResult.status}`);
        }

        console.log('\n🎯 SWOT FIXES TEST COMPLETE');
        console.log('============================');

    } catch (error) {
        console.error('❌ Error during testing:', error.message);
    }
}

testSwotFixes();