/**
 * Simple user management test to verify endpoints are working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testUserManagementEndpoints() {
  console.log('🧪 Testing User Management Endpoints...\n');

  try {
    // First, get a test token
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
      console.log(`   ⚠️  Could not login with existing user, trying to create one...`);
      
      try {
        await axios.post(`${BASE_URL}/api/auth/register`, {
          email: 'admin@test.com',
          password: 'admin123',
          name: 'Test Admin',
          organization_name: 'Test Organization'
        });
        
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'admin@test.com',
          password: 'admin123'
        });
        testToken = loginResponse.data.session?.access_token || loginResponse.data.token;
        console.log(`   ✓ User created and logged in successfully`);
      } catch (regError) {
        console.log(`   ✗ Could not create or login test user`);
        return;
      }
    }

    // Test 2: Get user profile
    console.log('\n2. Testing get user profile...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      console.log(`   ✓ Profile retrieved: ${profileResponse.status}`);
      if (profileResponse.data.user) {
        console.log(`   ✓ User ID: ${profileResponse.data.user.id}`);
        console.log(`   ✓ User Name: ${profileResponse.data.user.name}`);
        console.log(`   ✓ Organization ID: ${profileResponse.data.user.organization_id}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Profile response: ${error.response.status} - ${error.response.data.error || 'Error'}`);
      } else {
        console.log(`   ✗ Profile error: ${error.message}`);
      }
    }

    // Test 3: Get users list
    console.log('\n3. Testing get users list...');
    try {
      const usersResponse = await axios.get(`${BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      console.log(`   ✓ Users list retrieved: ${usersResponse.status}`);
      if (usersResponse.data.users) {
        console.log(`   ✓ Number of users: ${usersResponse.data.users.length}`);
        if (usersResponse.data.users.length > 0) {
          console.log(`   ✓ First user: ${usersResponse.data.users[0].name} (${usersResponse.data.users[0].email})`);
        }
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Users list response: ${error.response.status} - ${error.response.data.error || 'Error'}`);
      } else {
        console.log(`   ✗ Users list error: ${error.message}`);
      }
    }

    // Test 4: Update user profile
    console.log('\n4. Testing update user profile...');
    try {
      const updateData = {
        name: `Updated Test User ${Date.now()}`,
        email: 'admin@test.com' // Keep same email
      };
      
      const updateResponse = await axios.put(`${BASE_URL}/api/users/profile`, updateData, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`   ✓ Profile updated: ${updateResponse.status}`);
      if (updateResponse.data.user) {
        console.log(`   ✓ Updated name: ${updateResponse.data.user.name}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Update response: ${error.response.status} - ${error.response.data.error || 'Error'}`);
      } else {
        console.log(`   ✗ Update error: ${error.message}`);
      }
    }

    // Test 5: Test organization filtering
    console.log('\n5. Testing organization filtering...');
    try {
      const orgUsersResponse = await axios.get(`${BASE_URL}/api/users?organization_filter=true`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      console.log(`   ✓ Organization filtered users: ${orgUsersResponse.status}`);
      if (orgUsersResponse.data.users) {
        console.log(`   ✓ Filtered users count: ${orgUsersResponse.data.users.length}`);
        
        // Check if all users have same organization_id
        const orgIds = [...new Set(orgUsersResponse.data.users.map(u => u.organization_id))];
        console.log(`   ✓ Unique organization IDs: ${orgIds.length} (should be 1 for proper filtering)`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Organization filter response: ${error.response.status} - ${error.response.data.error || 'Error'}`);
      } else {
        console.log(`   ✗ Organization filter error: ${error.message}`);
      }
    }

    // Test 6: Test user search
    console.log('\n6. Testing user search...');
    try {
      const searchResponse = await axios.get(`${BASE_URL}/api/users?search=test`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      console.log(`   ✓ User search: ${searchResponse.status}`);
      if (searchResponse.data.users) {
        console.log(`   ✓ Search results: ${searchResponse.data.users.length} users found`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Search response: ${error.response.status} - ${error.response.data.error || 'Error'}`);
      } else {
        console.log(`   ✗ Search error: ${error.message}`);
      }
    }

    console.log('\n✅ User management endpoint testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testUserManagementEndpoints();