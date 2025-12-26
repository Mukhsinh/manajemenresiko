const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function debugSwotWeaknessIssue() {
  console.log('🔍 DEBUGGING SWOT WEAKNESS DISPLAY ISSUE');
  console.log('='.repeat(60));

  try {
    // 1. Test database direct query
    console.log('\n1. Testing database direct query for Weakness data...');
    const dbResponse = await axios.get(`${BASE_URL}/api/analisis-swot/debug`);
    
    if (dbResponse.data.success) {
      const weaknessData = dbResponse.data.data.filter(item => item.kategori === 'Weakness');
      console.log(`✅ Found ${weaknessData.length} Weakness items in database`);
      
      if (weaknessData.length > 0) {
        const totalScore = weaknessData.reduce((sum, item) => sum + (item.score || 0), 0);
        console.log(`📊 Total Weakness Score in DB: ${totalScore}`);
        console.log('Sample Weakness data:');
        weaknessData.slice(0, 3).forEach((item, index) => {
          console.log(`  ${index + 1}. Score: ${item.score}, Bobot: ${item.bobot}, Objek: ${item.objek_analisis?.substring(0, 50)}...`);
        });
      }
    } else {
      console.log('❌ Database query failed:', dbResponse.data.error);
    }

    // 2. Test API endpoint with authentication
    console.log('\n2. Testing API endpoint with authentication...');
    
    // First login to get token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'superadmin@example.com',
      password: 'superadmin123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful');

      // Test main API endpoint
      const apiResponse = await axios.get(`${BASE_URL}/api/analisis-swot`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const weaknessApiData = apiResponse.data.filter(item => item.kategori === 'Weakness');
      console.log(`📊 API returned ${weaknessApiData.length} Weakness items`);
      
      if (weaknessApiData.length > 0) {
        const totalScore = weaknessApiData.reduce((sum, item) => sum + (item.score || 0), 0);
        console.log(`📊 Total Weakness Score from API: ${totalScore}`);
      }

      // Test summary endpoint
      console.log('\n3. Testing summary endpoint...');
      const summaryResponse = await axios.get(`${BASE_URL}/api/analisis-swot/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Summary response:', JSON.stringify(summaryResponse.data, null, 2));

      if (summaryResponse.data.Weakness) {
        const weaknessSummary = summaryResponse.data.Weakness;
        console.log(`📊 Summary Weakness Score: ${weaknessSummary.totalScore}`);
        console.log(`📊 Summary Weakness Items: ${weaknessSummary.items?.length || 0}`);
        console.log(`📊 Summary Weakness Bobot: ${weaknessSummary.totalBobot}`);
        
        if (weaknessSummary.totalScore === 0) {
          console.log('🚨 PROBLEM FOUND: Summary shows Weakness score as 0!');
          console.log('🔍 Investigating summary calculation...');
          
          // Check if items exist but score is 0
          if (weaknessSummary.items && weaknessSummary.items.length > 0) {
            console.log('Items exist but total score is 0. Sample items:');
            weaknessSummary.items.slice(0, 3).forEach((item, index) => {
              console.log(`  ${index + 1}. Score: ${item.score}, Bobot: ${item.bobot}`);
            });
          }
        }
      }

    } else {
      console.log('❌ Login failed:', loginResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the debug
debugSwotWeaknessIssue();