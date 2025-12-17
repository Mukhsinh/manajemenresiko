const http = require('http');

// Test AI Assistant API directly
async function testAIDirect() {
    console.log('Testing AI Assistant API directly...');
    
    // Test data
    const testMessage = {
        message: 'Halo, apa itu manajemen risiko?',
        conversationHistory: []
    };
    
    const postData = JSON.stringify(testMessage);
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/ai-assistant/chat',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            // Add a mock authorization header for testing
            'Authorization': 'Bearer mock-token-for-testing'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            console.log(`Headers:`, res.headers);
            
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('Response body:', data);
                
                try {
                    const jsonData = JSON.parse(data);
                    console.log('Parsed response:', jsonData);
                    resolve(jsonData);
                } catch (error) {
                    console.log('Response is not JSON:', data);
                    resolve({ rawResponse: data, status: res.statusCode });
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });
        
        // Write data to request body
        req.write(postData);
        req.end();
    });
}

// Test status endpoint
async function testStatusDirect() {
    console.log('\nTesting AI status endpoint...');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/ai-assistant/status',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer mock-token-for-testing'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('Response body:', data);
                
                try {
                    const jsonData = JSON.parse(data);
                    console.log('Parsed response:', jsonData);
                    resolve(jsonData);
                } catch (error) {
                    console.log('Response is not JSON:', data);
                    resolve({ rawResponse: data, status: res.statusCode });
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });
        
        req.end();
    });
}

// Run tests
async function runTests() {
    try {
        await testStatusDirect();
        await testAIDirect();
    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTests();