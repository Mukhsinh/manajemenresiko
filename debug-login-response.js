// Debug login response untuk melihat struktur token
const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

async function debugLoginResponse() {
  try {
    console.log('🔍 DEBUG LOGIN RESPONSE');
    console.log('========================');

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'mukhsin9@gmail.com',
      password: 'Jlamprang233!!'
    });

    console.log('✅ Login successful');
    console.log('\n📋 FULL LOGIN RESPONSE:');
    console.log(JSON.stringify(loginResponse.data, null, 2));

    console.log('\n🔑 AVAILABLE TOKEN FIELDS:');
    Object.keys(loginResponse.data).forEach(key => {
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('access')) {
        console.log(`- ${key}: ${typeof loginResponse.data[key]} (${loginResponse.data[key]?.substring(0, 50)}...)`);
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
  }
}

// Run debug
debugLoginResponse();