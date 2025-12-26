// Test Buku Pedoman API
async function testBukuPedomanAPI() {
    console.log('=== TESTING BUKU PEDOMAN API ===');
    
    const baseURL = 'http://localhost:3000';
    
    try {
        // Test 1: Basic API connection
        console.log('\n1. Testing basic API connection...');
        const configResponse = await fetch(`${baseURL}/api/config`);
        if (configResponse.ok) {
            console.log('✅ API connection successful');
        } else {
            console.log('❌ API connection failed:', configResponse.status);
            return;
        }
        
        // Test 2: Test Buku Pedoman endpoint (without auth)
        console.log('\n2. Testing Buku Pedoman endpoint (no auth)...');
        const noAuthResponse = await fetch(`${baseURL}/api/buku-pedoman`);
        console.log('Response status:', noAuthResponse.status);
        if (noAuthResponse.status === 401) {
            console.log('✅ Authentication required (expected)');
        } else {
            console.log('❌ Unexpected response:', noAuthResponse.status);
        }
        
        // Test 3: Test with mock auth token
        console.log('\n3. Testing with mock auth token...');
        const mockToken = 'mock-test-token';
        const authResponse = await fetch(`${baseURL}/api/buku-pedoman`, {
            headers: {
                'Authorization': `Bearer ${mockToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Auth response status:', authResponse.status);
        if (authResponse.status === 401) {
            console.log('✅ Invalid token rejected (expected)');
        } else if (authResponse.ok) {
            const data = await authResponse.json();
            console.log('✅ Handbook data received');
            console.log('- Title:', data.title);
            console.log('- Author:', data.author);
            console.log('- Chapters:', data.chapters?.length || 0);
            console.log('- Flowchart processes:', data.flowchart?.processes?.length || 0);
        } else {
            console.log('❌ Unexpected auth response:', authResponse.status);
        }
        
        // Test 4: Test PDF endpoint
        console.log('\n4. Testing PDF generation endpoint...');
        const pdfResponse = await fetch(`${baseURL}/api/buku-pedoman/pdf`, {
            headers: {
                'Authorization': `Bearer ${mockToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('PDF response status:', pdfResponse.status);
        if (pdfResponse.status === 401) {
            console.log('✅ PDF endpoint requires auth (expected)');
        } else if (pdfResponse.ok) {
            const pdfData = await pdfResponse.json();
            console.log('✅ PDF generation response received');
            console.log('- Success:', pdfData.success);
            console.log('- Message:', pdfData.message);
        }
        
        console.log('\n=== TEST COMPLETED ===');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    // Check if fetch is available (Node.js 18+)
    if (typeof fetch === 'undefined') {
        console.log('Installing node-fetch for testing...');
        try {
            global.fetch = require('node-fetch');
        } catch (e) {
            console.log('node-fetch not available, using basic HTTP test');
            const http = require('http');
            
            // Simple HTTP test
            const testBasicConnection = () => {
                const options = {
                    hostname: 'localhost',
                    port: 3000,
                    path: '/api/config',
                    method: 'GET'
                };
                
                const req = http.request(options, (res) => {
                    console.log(`Status: ${res.statusCode}`);
                    if (res.statusCode === 200) {
                        console.log('✅ Basic HTTP connection successful');
                    } else {
                        console.log('❌ HTTP connection failed');
                    }
                });
                
                req.on('error', (e) => {
                    console.error('❌ Connection error:', e.message);
                    console.log('Make sure the server is running on port 3000');
                });
                
                req.end();
            };
            
            testBasicConnection();
            return;
        }
    }
    
    testBukuPedomanAPI();
}

module.exports = { testBukuPedomanAPI };