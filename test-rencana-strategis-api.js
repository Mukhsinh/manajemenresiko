// Using built-in fetch (Node.js 18+)

async function testRencanaStrategisAPI() {
    const baseURL = 'http://localhost:3000';
    
    console.log('=== Testing Rencana Strategis API Endpoints ===');
    
    try {
        // Test public endpoint
        console.log('\n1. Testing public endpoint...');
        const publicResponse = await fetch(`${baseURL}/api/rencana-strategis/public`);
        const publicData = await publicResponse.json();
        console.log(`Status: ${publicResponse.status}`);
        console.log(`Data count: ${Array.isArray(publicData) ? publicData.length : 'not array'}`);
        if (Array.isArray(publicData) && publicData.length > 0) {
            console.log('Sample record:', JSON.stringify(publicData[0], null, 2));
        }
        
        // Test visi misi endpoint (public)
        console.log('\n2. Testing visi misi public endpoint...');
        const visiMisiResponse = await fetch(`${baseURL}/api/visi-misi/public`);
        const visiMisiData = await visiMisiResponse.json();
        console.log(`Status: ${visiMisiResponse.status}`);
        console.log(`Data count: ${Array.isArray(visiMisiData) ? visiMisiData.length : 'not array'}`);
        if (Array.isArray(visiMisiData) && visiMisiData.length > 0) {
            console.log('Sample visi misi:', JSON.stringify(visiMisiData[0], null, 2));
        }
        
        // Test generate kode endpoint (public)
        console.log('\n3. Testing generate kode public endpoint...');
        const kodeResponse = await fetch(`${baseURL}/api/rencana-strategis/generate/kode/public`);
        const kodeData = await kodeResponse.json();
        console.log(`Status: ${kodeResponse.status}`);
        console.log('Generated kode:', kodeData);
        
        // Test main page
        console.log('\n4. Testing main page...');
        const pageResponse = await fetch(`${baseURL}/`);
        console.log(`Main page status: ${pageResponse.status}`);
        
        // Test rencana strategis module file
        console.log('\n5. Testing rencana strategis JS module...');
        const jsResponse = await fetch(`${baseURL}/js/rencana-strategis.js`);
        console.log(`JS module status: ${jsResponse.status}`);
        console.log(`JS module size: ${jsResponse.headers.get('content-length')} bytes`);
        
        console.log('\n=== API Test Complete ===');
        
    } catch (error) {
        console.error('API Test Error:', error.message);
    }
}

testRencanaStrategisAPI();