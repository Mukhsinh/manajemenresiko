const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const testConfig = {
  superAdminEmail: 'mukhsin9@gmail.com',
  superAdminPassword: 'password123',
  testOrgId: null,
  testUserId: null,
  testUserEmail: null,
  authToken: null
};

async function makeRequest(endpoint, options = {}) {
  try {
    const config = {
      url: `${BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    // Add auth token if available
    if (testConfig.authToken) {
      config.headers['Authorization'] = `Bearer ${testConfig.authToken}`;
    }

    if (options.data) {
      config.data = options.data;
    }

    console.log(`Making request to ${endpoint} with method ${config.method}`);

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

async function loginAsSuperAdmin() {
  console.log('\n=== LOGIN AS SUPERADMIN ===');
  try {
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      data: {
        email: testConfig.superAdminEmail,
        password: testConfig.superAdminPassword
      }
    });

    // Token is in session.access_token
    testConfig.authToken = response.session?.access_token || response.access_token || response.token;
    
    console.log('✓ Login successful');
    console.log('User:', response.user?.email);
    console.log('Role:', response.profile?.role);
    console.log('Token found:', !!testConfig.authToken);
    
    return response;
  } catch (error) {
    console.error('✗ Login failed:', error.message);
    throw error;
  }
}

async function setupTestUser() {
  console.log('\n=== SETUP TEST USER ===');
  try {
    // Get organizations first
    const organizations = await makeRequest('/api/organizations');
    if (organizations.length === 0) {
      throw new Error('No organizations found');
    }
    testConfig.testOrgId = organizations[0].id;
    console.log('Using organization:', organizations[0].name);

    // Create test user
    const testUser = {
      email: `roletest${Date.now()}@example.com`,
      password: 'testpassword123',
      full_name: 'Role Test User',
      role: 'manager'
    };

    const response = await makeRequest('/api/auth/register-admin', {
      method: 'POST',
      data: testUser
    });

    testConfig.testUserId = response.user?.id;
    testConfig.testUserEmail = testUser.email;
    console.log('✓ Test user created:', testConfig.testUserEmail);

    // Add user to organization
    await makeRequest(`/api/organizations/${testConfig.testOrgId}/users`, {
      method: 'POST',
      data: {
        email: testConfig.testUserEmail,
        role: 'manager'
      }
    });

    console.log('✓ User added to organization');
    return response;
  } catch (error) {
    console.error('✗ Failed to setup test user:', error.message);
    throw error;
  }
}

async function testRoleChange() {
  console.log('\n=== TEST ROLE CHANGE ===');
  try {
    // Get organization users to find the record ID
    const orgUsers = await makeRequest(`/api/organizations/${testConfig.testOrgId}/users`);
    console.log('Organization users:', orgUsers.length);

    const testUserRecord = orgUsers.find(u => u.user_id === testConfig.testUserId);
    if (!testUserRecord) {
      throw new Error('Test user not found in organization');
    }

    console.log('Found test user record:', testUserRecord.id);
    console.log('Current role:', testUserRecord.role);

    // Test role change from manager to admin
    console.log('Changing role from manager to admin...');
    const updateResponse = await makeRequest(`/api/organizations/users/${testUserRecord.id}`, {
      method: 'PUT',
      data: { role: 'admin' }
    });

    console.log('✓ Role update response:', updateResponse);

    // Wait a bit for database to update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify the change in organization_users
    const updatedOrgUsers = await makeRequest(`/api/organizations/${testConfig.testOrgId}/users`);
    const updatedUserRecord = updatedOrgUsers.find(u => u.user_id === testConfig.testUserId);
    
    console.log('Updated user record role:', updatedUserRecord?.role);

    // Verify the change in user_profiles
    const allUsers = await makeRequest('/api/user-management');
    const updatedUserProfile = allUsers.find(u => u.id === testConfig.testUserId);
    
    console.log('Updated user profile role:', updatedUserProfile?.role);

    // Test login with the updated user to see if there are any issues
    console.log('Testing login with updated user...');
    try {
      const loginResponse = await makeRequest('/api/auth/login', {
        method: 'POST',
        data: {
          email: testConfig.testUserEmail,
          password: 'testpassword123'
        }
      });

      console.log('✓ User can still login after role change');
      console.log('Login profile role:', loginResponse.profile?.role);
    } catch (loginError) {
      console.error('✗ User cannot login after role change:', loginError.message);
    }

    return updateResponse;
  } catch (error) {
    console.error('✗ Failed to test role change:', error.message);
    throw error;
  }
}

async function testMultipleRoleChanges() {
  console.log('\n=== TEST MULTIPLE ROLE CHANGES ===');
  try {
    const orgUsers = await makeRequest(`/api/organizations/${testConfig.testOrgId}/users`);
    const testUserRecord = orgUsers.find(u => u.user_id === testConfig.testUserId);

    const roles = ['manager', 'admin', 'user', 'manager'];
    
    for (let i = 0; i < roles.length; i++) {
      const newRole = roles[i];
      console.log(`\nChanging role to: ${newRole}`);
      
      await makeRequest(`/api/organizations/users/${testUserRecord.id}`, {
        method: 'PUT',
        data: { role: newRole }
      });

      // Wait for update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify change
      const updatedOrgUsers = await makeRequest(`/api/organizations/${testConfig.testOrgId}/users`);
      const updatedRecord = updatedOrgUsers.find(u => u.user_id === testConfig.testUserId);
      
      console.log(`✓ Role changed to: ${updatedRecord?.role}`);

      // Test auth after each change
      try {
        const loginResponse = await makeRequest('/api/auth/login', {
          method: 'POST',
          data: {
            email: testConfig.testUserEmail,
            password: 'testpassword123'
          }
        });
        console.log(`✓ Login successful with role: ${loginResponse.profile?.role}`);
      } catch (loginError) {
        console.error(`✗ Login failed with role ${newRole}:`, loginError.message);
      }
    }

  } catch (error) {
    console.error('✗ Failed multiple role changes test:', error.message);
    throw error;
  }
}

async function cleanup() {
  console.log('\n=== CLEANUP ===');
  try {
    if (testConfig.testUserId) {
      await makeRequest(`/api/user-management/${testConfig.testUserId}`, {
        method: 'DELETE'
      });
      console.log('✓ Test user deleted');
    }
  } catch (error) {
    console.error('✗ Cleanup failed:', error.message);
  }
}

async function runRoleChangeTests() {
  console.log('🚀 Starting Role Change Issue Tests');
  console.log('====================================');

  try {
    // Login first
    await loginAsSuperAdmin();
    
    // Setup test user
    await setupTestUser();
    
    // Test single role change
    await testRoleChange();
    
    // Test multiple role changes
    await testMultipleRoleChanges();
    
    // Cleanup
    await cleanup();
    
    console.log('\n✅ All role change tests completed!');
  } catch (error) {
    console.error('\n❌ Role change test suite failed:', error.message);
    
    // Try cleanup even if tests failed
    try {
      await cleanup();
    } catch (cleanupError) {
      console.error('Cleanup also failed:', cleanupError.message);
    }
    
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runRoleChangeTests().catch(console.error);
}

module.exports = {
  runRoleChangeTests,
  testConfig,
  makeRequest
};