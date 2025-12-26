const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const testConfig = {
  superAdminEmail: 'mukhsin9@gmail.com',
  superAdminPassword: 'password123',
  testOrgId: null,
  testUserId: null,
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
    if (config.headers['Authorization']) {
      console.log('Auth token:', config.headers['Authorization'].substring(0, 20) + '...');
    }

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
    
    if (testConfig.authToken) {
      console.log('Token length:', testConfig.authToken.length);
      console.log('Token preview:', testConfig.authToken.substring(0, 50) + '...');
    }
    
    return response;
  } catch (error) {
    console.error('✗ Login failed:', error.message);
    throw error;
  }
}

async function testGetAllUsers() {
  console.log('\n=== TEST GET ALL USERS (SUPERADMIN) ===');
  try {
    const users = await makeRequest('/api/user-management');
    console.log('✓ Successfully fetched all users');
    console.log(`Found ${users.length} users`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (${user.email}) - Role: ${user.role} - Org: ${user.organization_name || 'None'}`);
    });
    
    return users;
  } catch (error) {
    console.error('✗ Failed to fetch all users:', error.message);
    throw error;
  }
}

async function testGetOrganizations() {
  console.log('\n=== TEST GET ORGANIZATIONS ===');
  try {
    const organizations = await makeRequest('/api/organizations');
    console.log('✓ Successfully fetched organizations');
    console.log(`Found ${organizations.length} organizations`);
    
    organizations.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name} (${org.code}) - Users: ${org.users?.length || 0}`);
      if (org.users && org.users.length > 0) {
        org.users.forEach(user => {
          const fullName = user.user_profiles?.full_name || 'Unknown';
          const email = user.user_profiles?.email || 'Unknown';
          console.log(`   - ${fullName} (${email}) - Role: ${user.role}`);
        });
      }
    });
    
    if (organizations.length > 0) {
      testConfig.testOrgId = organizations[0].id;
      console.log(`Using organization ${organizations[0].name} for tests`);
    }
    
    return organizations;
  } catch (error) {
    console.error('✗ Failed to fetch organizations:', error.message);
    throw error;
  }
}

async function testCreateUser() {
  console.log('\n=== TEST CREATE USER ===');
  try {
    const testUser = {
      email: `testuser${Date.now()}@example.com`,
      password: 'testpassword123',
      full_name: 'Test User',
      role: 'manager'
    };

    const response = await makeRequest('/api/auth/register-admin', {
      method: 'POST',
      data: testUser
    });

    console.log('✓ Successfully created user');
    console.log('User ID:', response.user?.id);
    console.log('Email:', response.user?.email);
    
    testConfig.testUserId = response.user?.id;
    return response;
  } catch (error) {
    console.error('✗ Failed to create user:', error.message);
    throw error;
  }
}

async function testAddUserToOrganization() {
  console.log('\n=== TEST ADD USER TO ORGANIZATION ===');
  if (!testConfig.testOrgId || !testConfig.testUserId) {
    console.log('Skipping - no test org or user available');
    return;
  }

  try {
    // First get the user email
    const users = await makeRequest('/api/user-management');
    const testUser = users.find(u => u.id === testConfig.testUserId);
    
    if (!testUser) {
      console.log('Test user not found in user list');
      return;
    }

    const response = await makeRequest(`/api/organizations/${testConfig.testOrgId}/users`, {
      method: 'POST',
      data: {
        email: testUser.email,
        role: 'manager'
      }
    });

    console.log('✓ Successfully added user to organization');
    console.log('Response:', response);
    return response;
  } catch (error) {
    console.error('✗ Failed to add user to organization:', error.message);
    throw error;
  }
}

async function testResetUserPassword() {
  console.log('\n=== TEST RESET USER PASSWORD ===');
  if (!testConfig.testUserId) {
    console.log('Skipping - no test user available');
    return;
  }

  try {
    const response = await makeRequest(`/api/user-management/${testConfig.testUserId}/reset-password`, {
      method: 'POST',
      data: {
        new_password: 'newpassword123'
      }
    });

    console.log('✓ Successfully reset user password');
    console.log('Response:', response);
    return response;
  } catch (error) {
    console.error('✗ Failed to reset user password:', error.message);
    throw error;
  }
}

async function testGetOrganizationUsers() {
  console.log('\n=== TEST GET ORGANIZATION USERS ===');
  if (!testConfig.testOrgId) {
    console.log('Skipping - no test org available');
    return;
  }

  try {
    const users = await makeRequest(`/api/organizations/${testConfig.testOrgId}/users`);
    console.log('✓ Successfully fetched organization users');
    console.log(`Found ${users.length} users in organization`);
    
    users.forEach((user, index) => {
      const fullName = user.user_profiles?.full_name || 'Unknown';
      const email = user.user_profiles?.email || 'Unknown';
      console.log(`${index + 1}. ${fullName} (${email}) - Role: ${user.role}`);
    });
    
    return users;
  } catch (error) {
    console.error('✗ Failed to fetch organization users:', error.message);
    throw error;
  }
}

async function testDeleteUser() {
  console.log('\n=== TEST DELETE USER ===');
  if (!testConfig.testUserId) {
    console.log('Skipping - no test user available');
    return;
  }

  try {
    const response = await makeRequest(`/api/user-management/${testConfig.testUserId}`, {
      method: 'DELETE'
    });

    console.log('✓ Successfully deleted user');
    console.log('Response:', response);
    return response;
  } catch (error) {
    console.error('✗ Failed to delete user:', error.message);
    throw error;
  }
}

async function runAllTests() {
  console.log('🚀 Starting User Management Tests');
  console.log('=====================================');

  try {
    // Login first
    await loginAsSuperAdmin();
    
    // Test basic functionality
    await testGetAllUsers();
    await testGetOrganizations();
    
    // Test user creation and management
    await testCreateUser();
    await testAddUserToOrganization();
    await testGetOrganizationUsers();
    await testResetUserPassword();
    
    // Cleanup
    await testDeleteUser();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testConfig,
  makeRequest
};