// Test Port Configuration
const { findAvailablePort, getPort, checkPortAvailable } = require('./config/port');

async function testPortConfig() {
    console.log('=== TESTING PORT CONFIGURATION ===');
    
    try {
        // Test 1: Check default port
        console.log('\n1. Testing default port configuration...');
        const defaultPort = getPort();
        console.log(`✅ Default port: ${defaultPort}`);
        
        // Test 2: Check if port 3000 is available
        console.log('\n2. Checking port availability...');
        const port3000Available = await checkPortAvailable(3000);
        console.log(`Port 3000 available: ${port3000Available ? '✅ Yes' : '❌ No (in use)'}`);
        
        const port3001Available = await checkPortAvailable(3001);
        console.log(`Port 3001 available: ${port3001Available ? '✅ Yes' : '❌ No (in use)'}`);
        
        // Test 3: Find available port
        console.log('\n3. Finding available port...');
        const availablePort = await findAvailablePort(3001);
        console.log(`✅ Found available port: ${availablePort}`);
        
        // Test 4: Test with environment variable
        console.log('\n4. Testing with environment variable...');
        process.env.PORT = '3005';
        const envPort = getPort();
        console.log(`✅ Port from environment: ${envPort}`);
        delete process.env.PORT; // Clean up
        
        console.log('\n=== PORT CONFIGURATION TEST COMPLETE ===');
        
        console.log('\n🚀 USAGE INSTRUCTIONS:');
        console.log('1. Use automatic port detection:');
        console.log('   npm run dev:auto');
        console.log('');
        console.log('2. Set specific port:');
        console.log('   PORT=3005 npm run dev');
        console.log('');
        console.log('3. Use batch file (Windows):');
        console.log('   start-dev-auto-port.bat');
        console.log('');
        console.log('4. Manual start with auto port:');
        console.log('   node start-auto-port.js');
        
        console.log('\n📋 MODERN UI ACCESS:');
        console.log(`- Dashboard: http://localhost:${availablePort}/dashboard-modern.html`);
        console.log(`- Risk Profile: http://localhost:${availablePort}/risk-profile-modern.html`);
        
    } catch (error) {
        console.error('❌ Port configuration test failed:', error);
    }
}

// Run the test
if (require.main === module) {
    testPortConfig();
}

module.exports = { testPortConfig };