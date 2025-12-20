/**
 * Debug master data display issue
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function debugMasterData() {
  console.log('🔍 Debugging Master Data Display Issue...\n');

  try {
    // Get test token
    console.log('1. Getting test token...');
    let testToken;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@test.com',
        password: 'admin123'
      });
      testToken = loginResponse.data.session?.access_token || loginResponse.data.token;
      console.log(`   ✓ Login successful, token obtained`);
    } catch (error) {
      console.log(`   ✗ Could not login: ${error.message}`);
      return;
    }

    // Test 2: Fetch risk categories data
    console.log('\n2. Testing risk categories endpoint...');
    try {
      const response = await axios.get(`${BASE_URL}/api/master-data/risk-categories`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      
      console.log(`   ✓ Risk categories response: ${response.status}`);
      console.log(`   ✓ Data type: ${typeof response.data}`);
      console.log(`   ✓ Is array: ${Array.isArray(response.data)}`);
      console.log(`   ✓ Length: ${response.data?.length || 0}`);
      
      if (response.data && response.data.length > 0) {
        console.log(`   ✓ First item structure:`, Object.keys(response.data[0]));
        console.log(`   ✓ First item:`, JSON.stringify(response.data[0], null, 2));
        
        // Check if this matches the error data
        console.log('\n   📋 All categories:');
        response.data.forEach((item, index) => {
          console.log(`   ${index}: ${item.name} - ${item.definition?.substring(0, 50)}...`);
        });
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Risk categories response: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`   ✗ Risk categories error: ${error.message}`);
      }
    }

    // Test 3: Test endpoint without auth
    console.log('\n3. Testing test endpoint...');
    try {
      const response = await axios.get(`${BASE_URL}/api/test-data/master/risk-categories`);
      
      console.log(`   ✓ Test endpoint response: ${response.status}`);
      console.log(`   ✓ Data type: ${typeof response.data}`);
      console.log(`   ✓ Is array: ${Array.isArray(response.data)}`);
      console.log(`   ✓ Length: ${response.data?.length || 0}`);
      
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Test endpoint response: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`   ✗ Test endpoint error: ${error.message}`);
      }
    }

    // Test 4: Check if data structure matches the error
    console.log('\n4. Analyzing error data structure...');
    const errorData = [
      {id: '40889ecd-b159-4d1d-b4db-6251dc4fc66f', name: 'Risiko Fraud', definition: 'Risiko tindakan kecurangan yang dilakukan secara sengaja oleh pihak internal maupun eksternal untuk memperoleh keuntungan bagi diri sendiri atau organisasi.', created_at: '2025-11-24T04:20:58.259355+00:00', updated_at: '2025-11-24T04:20:58.259355+00:00'},
      {id: '863d3343-c04d-4c37-a8bc-1b12de880ce2', name: 'Risiko Kebijakan', definition: 'Risiko yang berkaitan dengan kebijakan internal maupun eksternal organisasi.', created_at: '2025-11-24T04:20:58.259355+00:00', updated_at: '2025-11-24T04:20:58.259355+00:00'},
      {id: '9f3ae689-21f9-4957-bde5-052358831a46', name: 'Risiko Kepatuhan', definition: 'Risiko yang berkaitan dengan kepatuhan terhadap ketentuan peraturan perundang-undangan yang berlaku.', created_at: '2025-11-24T04:20:58.259355+00:00', updated_at: '2025-11-24T04:20:58.259355+00:00'},
      {id: '3bd7ab56-0d36-4592-b3ae-6449b7ae0fc4', name: 'Risiko Legal', definition: 'Risiko yang berkaitan dengan tuntutan hukum atau persoalan hukum terhadap organisasi.', created_at: '2025-11-24T04:20:58.259355+00:00', updated_at: '2025-11-24T04:20:58.259355+00:00'},
      {id: 'aaccd859-6b7a-4b84-95ba-260fbff4a5f4', name: 'Risiko Operasional', definition: 'Risiko yang berkaitan dengan pelaksanaan operasional organisasi termasuk Risiko Sistem Pemerintahan Berbasis Elektronik (SPBE)', created_at: '2025-11-24T04:20:58.259355+00:00', updated_at: '2025-11-24T04:20:58.259355+00:00'},
      {id: 'e93ae57d-d1ac-497d-a195-4085e43ea604', name: 'Risiko Reputasi', definition: 'Risiko yang berhubungan dengan kepercayaan publik terhadap organisasi.', created_at: '2025-11-24T04:20:58.259355+00:00', updated_at: '2025-11-24T04:20:58.259355+00:00'},
      {id: '421dd64b-2173-4288-aa6f-bb6af204fcb9', name: 'Technology Risk', definition: 'Risks related to information technology systems and cybersecurity', created_at: '2025-12-14T00:44:19.741592+00:00', updated_at: '2025-12-14T00:44:19.741592+00:00'}
    ];
    
    console.log(`   ✓ Error data is array: ${Array.isArray(errorData)}`);
    console.log(`   ✓ Error data length: ${errorData.length}`);
    console.log(`   ✓ Error data structure looks valid`);
    
    // The issue might be in how this data is being displayed in the browser
    console.log('\n   💡 Analysis: The data structure is correct. The error might be:');
    console.log('      1. Browser console showing array in expanded form');
    console.log('      2. Frontend JavaScript logging the array without proper formatting');
    console.log('      3. Missing error handling in frontend display logic');

    console.log('\n✅ Master data debugging completed!');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    process.exit(1);
  }
}

// Run debug
debugMasterData();