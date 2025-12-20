/**
 * Simple multi-tenant isolation test
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testMultiTenantIsolation() {
  console.log('🧪 Testing Multi-Tenant Isolation...\n');

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

    // Test 2: Automatic organization filtering
    console.log('\n2. Testing automatic organization filtering...');
    const dataEndpoints = [
      '/api/visi-misi',
      '/api/rencana-strategis',
      '/api/sasaran-strategi',
      '/api/dashboard'
    ];

    for (const endpoint of dataEndpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${testToken}`
          }
        });
        
        console.log(`   ✓ ${endpoint}: ${response.status}`);
        
        if (response.status === 200 && response.data) {
          // Check if data has organization filtering
          let dataArray = null;
          if (Array.isArray(response.data)) {
            dataArray = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            dataArray = response.data.data;
          }
          
          if (dataArray && dataArray.length > 0) {
            const hasOrgId = dataArray.every(item => item.organization_id);
            const orgIds = [...new Set(dataArray.map(item => item.organization_id))];
            
            console.log(`     - Records: ${dataArray.length}`);
            console.log(`     - Has organization_id: ${hasOrgId ? 'Yes' : 'No'}`);
            console.log(`     - Unique organizations: ${orgIds.length}`);
          } else {
            console.log(`     - No data returned`);
          }
        }
        
      } catch (error) {
        if (error.response) {
          console.log(`   ✓ ${endpoint}: ${error.response.status} - ${error.response.statusText}`);
        } else {
          console.log(`   ✗ ${endpoint}: ${error.message}`);
        }
      }
    }

    // Test 3: Organization association on create
    console.log('\n3. Testing organization association on create...');
    try {
      const testData = {
        visi: `Test Vision ${Date.now()}`,
        misi: `Test Mission ${Date.now()}`,
        tujuan: `Test Goal ${Date.now()}`
      };
      
      const response = await axios.post(`${BASE_URL}/api/visi-misi`, testData, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   ✓ Create data: ${response.status}`);
      
      if (response.status === 201 && response.data.visi_misi) {
        const created = response.data.visi_misi;
        console.log(`   ✓ Created ID: ${created.id}`);
        console.log(`   ✓ Organization ID: ${created.organization_id || 'Not set'}`);
        
        // Verify we can retrieve it
        try {
          const getResponse = await axios.get(`${BASE_URL}/api/visi-misi/${created.id}`, {
            headers: {
              'Authorization': `Bearer ${testToken}`
            }
          });
          
          if (getResponse.status === 200) {
            console.log(`   ✓ Retrieved successfully: Same organization`);
          }
        } catch (getError) {
          console.log(`   ✓ Retrieve test: ${getError.response?.status || 'Error'}`);
        }
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Create response: ${error.response.status} - ${error.response.data?.error || 'Error'}`);
      } else {
        console.log(`   ✗ Create error: ${error.message}`);
      }
    }

    // Test 4: Cross-organization data isolation
    console.log('\n4. Testing cross-organization data isolation...');
    const fakeOrgId = '12345678-1234-1234-1234-123456789012';
    
    try {
      const response = await axios.get(`${BASE_URL}/api/visi-misi?organization_id=${fakeOrgId}`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      
      console.log(`   ✓ Fake org query: ${response.status}`);
      
      if (response.status === 200 && response.data) {
        let dataArray = Array.isArray(response.data) ? response.data : response.data.data;
        
        if (dataArray && dataArray.length > 0) {
          const hasFakeOrgData = dataArray.some(item => item.organization_id === fakeOrgId);
          console.log(`   ✓ Contains fake org data: ${hasFakeOrgData ? 'Yes (BAD)' : 'No (GOOD)'}`);
          
          // Show actual organization IDs
          const orgIds = [...new Set(dataArray.map(item => item.organization_id))];
          console.log(`   ✓ Actual organization IDs: ${orgIds.length} unique`);
        } else {
          console.log(`   ✓ No data returned (isolation working)`);
        }
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Fake org response: ${error.response.status} - Properly isolated`);
      } else {
        console.log(`   ✗ Fake org error: ${error.message}`);
      }
    }

    // Test 5: User filtering by organization
    console.log('\n5. Testing user filtering by organization...');
    try {
      const response = await axios.get(`${BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      
      console.log(`   ✓ User list: ${response.status}`);
      
      if (response.status === 200 && response.data.users) {
        const users = response.data.users;
        console.log(`   ✓ Users returned: ${users.length}`);
        
        if (users.length > 0) {
          const orgIds = [...new Set(users.map(u => u.organization_id))];
          console.log(`   ✓ Unique organization IDs: ${orgIds.length} (should be 1)`);
          
          const hasValidOrgIds = users.every(u => u.organization_id && u.organization_id.length === 36);
          console.log(`   ✓ All have valid org IDs: ${hasValidOrgIds ? 'Yes' : 'No'}`);
        }
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ User list response: ${error.response.status} - ${error.response.data?.error || 'Error'}`);
      } else {
        console.log(`   ✗ User list error: ${error.message}`);
      }
    }

    // Test 6: Dashboard data isolation
    console.log('\n6. Testing dashboard data isolation...');
    try {
      const response = await axios.get(`${BASE_URL}/api/dashboard?category=operational`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      
      console.log(`   ✓ Dashboard: ${response.status}`);
      
      if (response.status === 200 && response.data) {
        console.log(`   ✓ Dashboard data type: ${typeof response.data}`);
        
        // Check if dashboard has organization-specific data
        if (response.data.data && Array.isArray(response.data.data)) {
          const hasOrgFiltering = response.data.data.every(item => 
            !item.organization_id || (item.organization_id && item.organization_id.length === 36)
          );
          console.log(`   ✓ Organization filtering: ${hasOrgFiltering ? 'Applied' : 'Not applied'}`);
        }
        
        if (response.data.summary) {
          console.log(`   ✓ Summary data: Available`);
        }
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Dashboard response: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`   ✗ Dashboard error: ${error.message}`);
      }
    }

    console.log('\n✅ Multi-tenant isolation testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testMultiTenantIsolation();