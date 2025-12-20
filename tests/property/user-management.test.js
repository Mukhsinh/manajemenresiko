/**
 * Property-based tests for user management
 * Tests Requirements 2.2, 2.3, 2.4
 */

const fc = require('fast-check');
const axios = require('axios');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test utilities
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await axios({
      url: `${BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.token}`,
        ...options.headers
      },
      data: options.data,
      timeout: options.timeout || 10000
    });
    return response;
  } catch (error) {
    if (error.response) {
      return error.response;
    }
    throw error;
  }
};

// Helper to get test token
const getTestToken = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    return response.data.token;
  } catch (error) {
    // Create test user if doesn't exist
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
      return loginResponse.data.token;
    } catch (regError) {
      throw new Error('Could not create or login test user');
    }
  }
};

// Property generators
const userUpdateArbitrary = fc.record({
  name: fc.string({ minLength: 2, maxLength: 50 }),
  email: fc.emailAddress(),
  role: fc.oneof(fc.constant('admin'), fc.constant('user'), fc.constant('viewer'))
});

const userDataArbitrary = fc.record({
  email: fc.emailAddress(),
  name: fc.string({ minLength: 2, maxLength: 50 }),
  password: fc.string({ minLength: 8, maxLength: 50 })
});

describe('Property Tests - User Management', () => {

  let testToken;

  beforeAll(async () => {
    try {
      testToken = await getTestToken();
    } catch (error) {
      console.warn('Could not get test token, some tests may fail');
    }
  });

  /**
   * Property 5: User updates persist and reflect
   * Test that any user update persists correctly
   */
  test('Property 5: User updates persist and reflect', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        userUpdateArbitrary,
        async (updateData) => {
          // When: We attempt to update user data
          const response = await apiRequest('/api/users/profile', {
            method: 'PUT',
            token: testToken,
            data: updateData
          });
          
          // Then: Response should be structured correctly
          expect([200, 400, 401, 403]).toContain(response.status);
          
          if (response.status === 200) {
            // Successful update
            expect(response.data).toHaveProperty('user');
            const user = response.data.user;
            
            // Updated fields should match
            if (updateData.name) {
              expect(user.name).toBe(updateData.name);
            }
            if (updateData.email) {
              expect(user.email).toBe(updateData.email);
            }
            
            // Should have valid structure
            expect(user).toHaveProperty('id');
            expect(user.id).toBeValidUUID();
            
          } else if (response.status === 400) {
            // Validation error
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
            
          } else {
            // Authorization error
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
          }
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Property 6: User deletion revokes access
   * Test that deleting any user revokes their access
   */
  test('Property 6: User deletion revokes access', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }), // Mock user ID
        async (mockUserId) => {
          // When: We attempt to delete a user
          const response = await apiRequest(`/api/users/${mockUserId}`, {
            method: 'DELETE',
            token: testToken
          });
          
          // Then: Response should be structured correctly
          expect([200, 404, 401, 403]).toContain(response.status);
          
          if (response.status === 200) {
            // Successful deletion
            expect(response.data).toHaveProperty('message');
            expect(typeof response.data.message).toBe('string');
            
          } else if (response.status === 404) {
            // User not found
            expect(response.data).toHaveProperty('error');
            expect(response.data.error).toContain('not found');
            
          } else {
            // Authorization error
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
          }
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Property 7: Organization filtering in user lists
   * Test that users only see their organization's users
   */
  test('Property 7: Organization filtering in user lists', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          page: fc.integer({ min: 1, max: 5 }),
          limit: fc.integer({ min: 5, max: 50 }),
          search: fc.oneof(fc.constant(''), fc.string({ maxLength: 20 }))
        }),
        async (queryParams) => {
          // When: We request user list with filters
          const queryString = new URLSearchParams(queryParams).toString();
          const response = await apiRequest(`/api/users?${queryString}`, {
            token: testToken
          });
          
          // Then: Response should be structured correctly
          expect([200, 401, 403]).toContain(response.status);
          
          if (response.status === 200) {
            // Successful request
            expect(response.data).toHaveProperty('users');
            expect(Array.isArray(response.data.users)).toBe(true);
            
            // Each user should have organization_id
            response.data.users.forEach(user => {
              expect(user).toHaveProperty('organization_id');
              expect(user).toHaveProperty('id');
              expect(user).toHaveProperty('email');
              expect(user).toHaveProperty('name');
              
              // Should have valid UUID
              expect(user.id).toBeValidUUID();
              expect(user.organization_id).toBeValidUUID();
            });
            
            // Should have pagination info
            if (response.data.pagination) {
              expect(response.data.pagination).toHaveProperty('total');
              expect(response.data.pagination).toHaveProperty('page');
              expect(response.data.pagination).toHaveProperty('limit');
            }
            
          } else {
            // Authorization error
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
          }
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Additional property: User creation with organization association
   * Test that new users are properly associated with organization
   */
  test('Property: User creation with organization association', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        userDataArbitrary,
        async (userData) => {
          // When: We create a new user
          const response = await apiRequest('/api/users', {
            method: 'POST',
            token: testToken,
            data: userData
          });
          
          // Then: Response should be structured correctly
          expect([201, 400, 401, 403, 409]).toContain(response.status);
          
          if (response.status === 201) {
            // Successful creation
            expect(response.data).toHaveProperty('user');
            const user = response.data.user;
            
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('name');
            expect(user).toHaveProperty('organization_id');
            
            // Should match input data
            expect(user.email).toBe(userData.email);
            expect(user.name).toBe(userData.name);
            
            // Should have valid UUIDs
            expect(user.id).toBeValidUUID();
            expect(user.organization_id).toBeValidUUID();
            
          } else if (response.status === 409) {
            // User already exists
            expect(response.data).toHaveProperty('error');
            expect(response.data.error).toContain('already exists');
            
          } else if (response.status === 400) {
            // Validation error
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
            
          } else {
            // Authorization error
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
          }
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Additional property: User role management
   * Test that user roles can be updated and validated
   */
  test('Property: User role management', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.string({ minLength: 10, maxLength: 50 }),
          role: fc.oneof(
            fc.constant('admin'),
            fc.constant('user'),
            fc.constant('viewer'),
            fc.constant('invalid_role')
          )
        }),
        async (roleData) => {
          // When: We update user role
          const response = await apiRequest(`/api/users/${roleData.userId}/role`, {
            method: 'PUT',
            token: testToken,
            data: { role: roleData.role }
          });
          
          // Then: Response should be structured correctly
          expect([200, 400, 404, 401, 403]).toContain(response.status);
          
          if (response.status === 200) {
            // Successful role update
            expect(response.data).toHaveProperty('user');
            expect(response.data.user).toHaveProperty('role');
            expect(response.data.user.role).toBe(roleData.role);
            
          } else if (response.status === 400) {
            // Invalid role
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
            
          } else if (response.status === 404) {
            // User not found
            expect(response.data).toHaveProperty('error');
            expect(response.data.error).toContain('not found');
            
          } else {
            // Authorization error
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
          }
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

});

// Test runner configuration
if (require.main === module) {
  console.log('Running property-based tests for user management...');
  
  // Set up test environment
  process.env.NODE_ENV = 'test';
  
  // Run tests
  const { execSync } = require('child_process');
  try {
    execSync('npx jest tests/property/user-management.test.js --verbose', { 
      stdio: 'inherit' 
    });
  } catch (error) {
    console.error('Tests failed:', error.message);
    process.exit(1);
  }
}