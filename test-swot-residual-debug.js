const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testServerConnection() {
    try {
        console.log('🔗 Testing server connection...');
        const response = await axios.get(`${BASE_URL}/`);
        console.log('✅ Server is running');
        return true;
    } catch (error) {
        console.log('❌ Server connection failed:', error.message);
        return false;
    }
}

async function testLoginEndpoint() {
    try {
        console.log('🔐 Testing login endpoint...');
        
        // Try different login credentials
        const credentials = [
            { email: 'mukhsin9@gmail.com', password: 'Jlamprang233!!' },
            { email: 'superadmin@example.com', password: 'superadmin123' },
            { email: 'admin@example.com', password: 'admin123' }
        ];
        
        for (const cred of credentials) {
            try {
                console.log(`   Trying: ${cred.email}`);
                const response = await axios.post(`${BASE_URL}/api/auth/login`, cred);
                
                if (response.data.success && response.data.token) {
                    console.log('✅ Login successful with:', cred.email);
                    return response.data.token;
                }
            } catch (error) {
                console.log(`   ❌ Failed: ${error.response?.data?.message || error.message}`);
            }
        }
        
        return null;
    } catch (error) {
        console.log('❌ Login endpoint error:', error.message);
        return null;
    }
}

async function testWithoutAuth() {
    console.log('\n📊 Testing endpoints without auth...');
    
    try {
        // Test analisis-swot without auth
        console.log('   Testing /api/analisis-swot...');
        const swotResponse = await axios.get(`${BASE_URL}/api/analisis-swot`);
        console.log('   ✅ Analisis SWOT accessible without auth');
        console.log('   📋 Data count:', swotResponse.data.data?.length || 0);
    } catch (error) {
        console.log('   ❌ Analisis SWOT error:', error.response?.status, error.response?.data?.message);
    }
    
    try {
        // Test residual-risk without auth
        console.log('   Testing /api/residual-risk...');
        const residualResponse = await axios.get(`${BASE_URL}/api/residual-risk`);
        console.log('   ✅ Risk Residual accessible without auth');
        console.log('   📋 Data count:', residualResponse.data.data?.length || 0);
    } catch (error) {
        console.log('   ❌ Risk Residual error:', error.response?.status, error.response?.data?.message);
    }
}

async function testFrontendPages() {
    console.log('\n🌐 Testing frontend pages...');
    
    try {
        const swotResponse = await axios.get(`${BASE_URL}/analisis-swot`);
        console.log('✅ /analisis-swot page accessible');
    } catch (error) {
        console.log('❌ /analisis-swot error:', error.response?.status);
    }
    
    try {
        const residualResponse = await axios.get(`${BASE_URL}/residual-risk`);
        console.log('✅ /residual-risk page accessible');
    } catch (error) {
        console.log('❌ /residual-risk error:', error.response?.status);
    }
}

async function runDebugTest() {
    console.log('🔍 Debug test for SWOT and Risk Residual...\n');
    
    const serverOk = await testServerConnection();
    if (!serverOk) return;
    
    const token = await testLoginEndpoint();
    await testWithoutAuth();
    await testFrontendPages();
    
    console.log('\n📊 Debug Summary:');
    console.log(`   Server: ✅`);
    console.log(`   Login: ${token ? '✅' : '❌'}`);
}

runDebugTest().catch(console.error);