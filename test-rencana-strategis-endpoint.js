const fetch = require('node-fetch');

async function testRencanaStrategisEndpoints() {
    console.log('=== TESTING RENCANA STRATEGIS ENDPOINTS ===');
    
    const baseUrl = 'http://localhost:3000';
    
    const endpoints = [
        '/api/rencana-strategis/public',
        '/api/rencana-strategis/generate/kode/public',
        '/api/visi-misi/public'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\nTesting: ${endpoint}`);
            const response = await fetch(`${baseUrl}${endpoint}`);
            const data = await response.json();
            
            console.log(`Status: ${response.status}`);
            console.log(`Data:`, JSON.stringify(data, null, 2));
            
        } catch (error) {
            console.error(`Error testing ${endpoint}:`, error.message);
        }
    }
}

testRencanaStrategisEndpoints().catch(console.error);