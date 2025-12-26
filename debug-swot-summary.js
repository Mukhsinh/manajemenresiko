const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function debugSummaryEndpoint() {
  console.log('🔍 DEBUGGING SWOT SUMMARY ENDPOINT');
  console.log('='.repeat(50));

  try {
    // Login first
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'mukhsin9@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.error);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Test summary endpoint
    console.log('\n2. Testing summary endpoint...');
    const summaryResponse = await axios.get(`${BASE_URL}/api/analisis-swot/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n📊 SUMMARY RESPONSE:');
    console.log(JSON.stringify(summaryResponse.data, null, 2));

    // Analyze each category
    const categories = ['Strength', 'Weakness', 'Opportunity', 'Threat'];
    categories.forEach(category => {
      const data = summaryResponse.data[category];
      if (data) {
        console.log(`\n${category}:`);
        console.log(`  Total Score: ${data.totalScore}`);
        console.log(`  Total Bobot: ${data.totalBobot}`);
        console.log(`  Items Count: ${data.items?.length || 0}`);
        
        if (data.totalScore === 0 && data.items?.length > 0) {
          console.log(`  🚨 ISSUE: ${category} has items but total score is 0!`);
          console.log('  Sample items:');
          data.items.slice(0, 3).forEach((item, index) => {
            console.log(`    ${index + 1}. Score: ${item.score}, Bobot: ${item.bobot}`);
          });
        }
      }
    });

    // Test with specific filters
    console.log('\n3. Testing with unit_kerja filter...');
    const filteredResponse = await axios.get(`${BASE_URL}/api/analisis-swot/summary?unit_kerja_id=RUMAH_SAKIT`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n📊 FILTERED SUMMARY (RUMAH_SAKIT):');
    console.log(JSON.stringify(filteredResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

debugSummaryEndpoint();