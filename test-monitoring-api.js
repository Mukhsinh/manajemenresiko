const fetch = require('node-fetch');

async function testMonitoringAPI() {
    const baseURL = 'http://localhost:3000';
    
    console.log('=== TESTING MONITORING EVALUASI API ===');
    
    // Test 1: Debug endpoint (no auth)
    try {
        console.log('\n1. Testing debug endpoint...');
        const debugResponse = await fetch(`${baseURL}/api/debug-monitoring`);
        const debugData = await debugResponse.json();
        console.log('Debug endpoint success:', {
            status: debugResponse.status,
            count: debugData.count,
            hasData: debugData.data && debugData.data.length > 0
        });
    } catch (error) {
        console.error('Debug endpoint error:', error.message);
    }
    
    // Test 2: Main endpoint (with auth)
    try {
        console.log('\n2. Testing main endpoint with auth...');
        
        // First login to get token
        const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'admin123'
            })
        });
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            const token = loginData.token;
            console.log('Login successful, got token');
            
            // Now test monitoring endpoint with token
            const monitoringResponse = await fetch(`${baseURL}/api/monitoring-evaluasi`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (monitoringResponse.ok) {
                const monitoringData = await monitoringResponse.json();
                console.log('Main endpoint success:', {
                    status: monitoringResponse.status,
                    count: monitoringData.length,
                    hasData: monitoringData && monitoringData.length > 0
                });
            } else {
                const errorData = await monitoringResponse.json();
                console.error('Main endpoint error:', errorData);
            }
        } else {
            console.error('Login failed:', await loginResponse.text());
        }
    } catch (error) {
        console.error('Main endpoint test error:', error.message);
    }
    
    console.log('\n=== TEST COMPLETED ===');
}

testMonitoringAPI();