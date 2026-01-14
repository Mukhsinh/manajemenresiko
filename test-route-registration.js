const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testRouteRegistration() {
  console.log('🔍 Testing Route Registration...\n');

  // Test various endpoints to see which ones work
  const endpoints = [
    '/api/test/data',
    '/api/auth/login',
    '/api/pengaturan',
    '/api/master-data',
    '/api/rencana-strategis',
    '/api/dashboard'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        console.log(`✅ ${endpoint} - Requires auth (401)`);
      } else if (status === 404) {
        console.log(`❌ ${endpoint} - Not found (404)`);
      } else {
        console.log(`⚠️  ${endpoint} - Status: ${status} - ${error.response?.data?.error || error.message}`);
      }
    }
  }

  // Test if the pengaturan route file can be loaded
  console.log('\n🔍 Testing route file loading...');
  try {
    const pengaturanRoute = require('./routes/pengaturan');
    console.log('✅ Pengaturan route file loads successfully');
    console.log('📊 Route type:', typeof pengaturanRoute);
  } catch (error) {
    console.log('❌ Pengaturan route file failed to load:', error.message);
  }

  // Test if we can make a direct request to see the exact error
  console.log('\n🔍 Testing direct pengaturan request...');
  try {
    const response = await axios.get(`${BASE_URL}/api/pengaturan`, {
      validateStatus: () => true // Don't throw on any status
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', response.headers['content-type']);
    console.log('📊 Response data:', response.data);
    
  } catch (error) {
    console.log('❌ Request failed completely:', error.message);
  }
}

async function main() {
  await testRouteRegistration();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRouteRegistration };