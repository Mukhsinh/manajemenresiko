const axios = require('axios');

const BASE_URL = 'http://localhost:3003';

async function testLoginDetailed() {
    console.log('🔐 Testing login with detailed debugging...\n');
    
    const credentials = { 
        email: 'mukhsin9@gmail.com', 
        password: 'Jlamprang233!!' 
    };
    
    try {
        console.log('📤 Sending login request...');
        console.log('   URL:', `${BASE_URL}/api/auth/login`);
        console.log('   Email:', credentials.email);
        console.log('   Password length:', credentials.password.length);
        
        const response = await axios.post(`${BASE_URL}/api/auth/login`, credentials, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('✅ Login successful!');
        console.log('📋 Response data:', {
            success: response.data.success,
            message: response.data.message,
            hasToken: !!response.data.token,
            hasUser: !!response.data.user,
            hasSession: !!response.data.session,
            hasAccessToken: !!response.data.session?.access_token
        });
        
        if (response.data.session?.access_token) {
            console.log('🎫 Access token received (first 20 chars):', response.data.session.access_token.substring(0, 20) + '...');
            return response.data.session.access_token;
        } else if (response.data.token) {
            console.log('🎫 Token received (first 20 chars):', response.data.token.substring(0, 20) + '...');
            return response.data.token;
        }
        
    } catch (error) {
        console.log('❌ Login failed!');
        console.log('   Status:', error.response?.status);
        console.log('   Status Text:', error.response?.statusText);
        console.log('   Error Data:', error.response?.data);
        console.log('   Error Message:', error.message);
        
        if (error.response?.data?.message) {
            console.log('   Server Message:', error.response.data.message);
        }
    }
    
    return null;
}

async function testEndpointsWithToken(token) {
    console.log('\n📊 Testing endpoints with token...\n');
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    // Test analisis-swot
    try {
        console.log('🔍 Testing /api/analisis-swot...');
        const response = await axios.get(`${BASE_URL}/api/analisis-swot`, { headers });
        console.log('✅ Success! Data count:', response.data.data?.length || 0);
        
        if (response.data.data && response.data.data.length > 0) {
            const sample = response.data.data[0];
            console.log('📝 Sample data:', {
                id: sample.id,
                faktor: sample.faktor?.substring(0, 30) + '...',
                bobot: sample.bobot,
                rating: sample.rating,
                skor: sample.skor
            });
        }
    } catch (error) {
        console.log('❌ Failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test residual-risk via risks endpoint
    try {
        console.log('\n🎯 Testing /api/risks (for residual data)...');
        const response = await axios.get(`${BASE_URL}/api/risks`, { headers });
        console.log('✅ Success! Data count:', response.data.data?.length || 0);
        
        if (response.data.data && response.data.data.length > 0) {
            const sample = response.data.data[0];
            console.log('📝 Sample data:', {
                id: sample.id,
                risk_event: sample.risk_event?.substring(0, 30) + '...',
                hasResidualAnalysis: !!sample.risk_residual_analysis,
                residualData: sample.risk_residual_analysis ? {
                    probability: sample.risk_residual_analysis.probability,
                    impact: sample.risk_residual_analysis.impact,
                    risk_level: sample.risk_residual_analysis.risk_level
                } : null
            });
        }
    } catch (error) {
        console.log('❌ Failed:', error.response?.status, error.response?.data?.message || error.message);
    }
}

async function runDetailedTest() {
    console.log('🚀 Starting detailed test for SWOT and Risk Residual...\n');
    
    const token = await testLoginDetailed();
    
    if (token) {
        await testEndpointsWithToken(token);
    } else {
        console.log('\n❌ Cannot test endpoints without valid token');
    }
}

runDetailedTest().catch(console.error);