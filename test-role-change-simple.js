const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testRoleChangeAPI() {
  console.log('🔍 Testing Role Change API Directly');
  console.log('===================================');

  try {
    // Test the organizations endpoint directly
    console.log('\n1. Testing GET /api/organizations');
    const orgsResponse = await axios.get(`${BASE_URL}/api/organizations`);
    console.log('✓ Organizations endpoint accessible (no auth)');
    console.log('Organizations found:', orgsResponse.data.length);

    if (orgsResponse.data.length > 0) {
      const org = orgsResponse.data[0];
      console.log('First organization:', org.name, '- Users:', org.users?.length || 0);

      if (org.users && org.users.length > 0) {
        const user = org.users[0];
        console.log('First user:', user.user_profiles?.full_name || 'Unknown');
        console.log('User role:', user.role);
        console.log('User record ID:', user.id);

        // Test role update (this will fail without auth, but we can see the error)
        console.log('\n2. Testing PUT /api/organizations/users/:id (without auth)');
        try {
          await axios.put(`${BASE_URL}/api/organizations/users/${user.id}`, {
            role: 'admin'
          });
        } catch (error) {
          console.log('Expected auth error:', error.response?.status, error.response?.data?.error);
        }
      }
    }

    // Test user-management endpoint
    console.log('\n3. Testing GET /api/user-management (without auth)');
    try {
      await axios.get(`${BASE_URL}/api/user-management`);
    } catch (error) {
      console.log('Expected auth error:', error.response?.status, error.response?.data?.error);
    }

    console.log('\n✅ API structure test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testDatabaseConsistency() {
  console.log('\n🔍 Testing Database Consistency');
  console.log('===============================');

  // This would require direct database access
  // For now, we'll just log what we should check
  console.log('Things to check in database:');
  console.log('1. user_profiles.role vs organization_users.role consistency');
  console.log('2. Foreign key relationships');
  console.log('3. RLS policies');
  console.log('4. Trigger functions for role synchronization');
}

async function runSimpleTests() {
  await testRoleChangeAPI();
  await testDatabaseConsistency();
}

if (require.main === module) {
  runSimpleTests().catch(console.error);
}

module.exports = { runSimpleTests };