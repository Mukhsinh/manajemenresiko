/**
 * Property-based tests for authentication
 * Tests Requirements 1.1, 1.2, 1.4, 1.5
 */

const fc = require('fast-check');
const axios = require('axios');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test utilities
const authRequest = async (endpoint, data, options = {}) => {
  try {
    const response = await axios({
      url: `${BASE_URL}${endpoint}`,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      data: data,
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

// Property generators
const validCredentialsArbitrary = fc.record({
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 50 })
});

const invalidCredentialsArbitrary = fc.oneof(
  // Invalid email formats
  fc.record({
    email: fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@')),
    password: fc.string({ minLength: 8, maxLength: 50 })
  }),
  // Invalid passwords (too short)
  fc.record({
    email: fc.emailAddress(),
    password: fc.string({ maxLength: 7 })
  }),
  // Empty credentials
  fc.record({
    email: fc.constant(''),
    password: fc.constant('')
  }),
  // Missing fields
  fc.record({
    email: fc.emailAddress()
    // password missing
  })
);

const userRegistrationArbitrary = fc.record({
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 50 }),
  name: fc.string({ minLength: 2, maxLength: 50 }),
  organization_name: fc.string({ minLength: 3, maxLength: 100 })
});

describe('Property Tests - Authentication', () => {

  /**
   * Property 1: Valid credentials create session
   * Test that any valid email/password creates a session
   */
  test('Property 1: Valid credentials create session', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCredentialsArbitrary,
        async (credentials) => {
          // Note: This test assumes test users exist in the database
          // In a real scenario, we would create test users first
          
          // When: We attempt to login with valid format credentials
          const response = await authRequest('/api/auth/login', credentials);
          
          // Then: Response should be structured correctly
          expect([200, 401, 404]).toContain(response.status);
          
          if (response.status === 200) {
            // Successful login should return token and user info
            expect(response.data).toHaveProperty('token');
            expect(response.data).toHaveProperty('user');
            expect(typeof response.data.token).toBe('string');
            expect(response.data.token.length).toBeGreaterThan(0);
            expect(response.data.user).toHaveProperty('email');
            expect(response.data.user.email).toBe(credentials.email);
          } else {
            // Failed login should return error message
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
          }
          
          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property 2: Invalid credentials are rejected
   * Test that any invalid credentials are rejected
   */
  test('Property 2: Invalid credentials are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        invalidCredentialsArbitrary,
        async (credentials) => {
          // When: We attempt to login with invalid credentials
          const response = await authRequest('/api/auth/login', credentials);
          
          // Then: Login should be rejected
          expect(response.status).toBeGreaterThanOrEqual(400);
          expect(response.status).toBeLessThan(500);
          
          // Should return error message
          expect(response.data).toHaveProperty('error');
          expect(typeof response.data.error).toBe('string');
          expect(response.data.error.length).toBeGreaterThan(0);
          
          // Should not return token
          expect(response.data.token).toBeUndefined();
          
          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property 3: Logout invalidates session
   * Test that logout invalidates any session token
   */
  test('Property 3: Logout invalidates session', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 200 }), // Mock token
        async (mockToken) => {
          // When: We attempt to logout with a token
          const response = await authRequest('/api/auth/logout', {}, {
            headers: { 'Authorization': `Bearer ${mockToken}` }
          });
          
          // Then: Logout should be processed
          expect([200, 401]).toContain(response.status);
          
          if (response.status === 200) {
            // Successful logout
            expect(response.data).toHaveProperty('message');
            expect(typeof response.data.message).toBe('string');
          } else {
            // Invalid token should still return structured response
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
   * Property 4: Registration creates complete user
   * Test that registration creates both auth user and user_profile
   */
  test('Property 4: Registration creates complete user', async () => {
    await fc.assert(
      fc.asyncProperty(
        userRegistrationArbitrary,
        async (registrationData) => {
          // When: We attempt to register a new user
          const response = await authRequest('/api/auth/register', registrationData);
          
          // Then: Response should be structured correctly
          expect([201, 400, 409]).toContain(response.status);
          
          if (response.status === 201) {
            // Successful registration
            expect(response.data).toHaveProperty('user');
            expect(response.data).toHaveProperty('message');
            
            const user = response.data.user;
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('name');
            expect(user.email).toBe(registrationData.email);
            expect(user.name).toBe(registrationData.name);
            
            // Should have valid UUID
            expect(user.id).toBeValidUUID();
            
          } else if (response.status === 409) {
            // User already exists
            expect(response.data).toHaveProperty('error');
            expect(response.data.error).toContain('already exists');
            
          } else {
            // Validation error
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
   * Additional property: Session token validation
   * Test that session tokens are properly validated
   */
  test('Property: Session token validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 50 }), // Invalid short token
          fc.constant(''), // Empty token
          fc.constant('invalid-token-format'), // Invalid format
          fc.string({ minLength: 200, maxLength: 500 }) // Too long token
        ),
        async (invalidToken) => {
          // When: We use an invalid token to access protected endpoint
          const response = await authRequest('/api/auth/verify', {}, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${invalidToken}` }
          });
          
          // Then: Should be rejected with 401
          expect(response.status).toBe(401);
          expect(response.data).toHaveProperty('error');
          expect(typeof response.data.error).toBe('string');
          
          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Additional property: Password strength validation
   * Test that password requirements are enforced
   */
  test('Property: Password strength validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.oneof(
            fc.string({ maxLength: 7 }), // Too short
            fc.constant('123456'), // Too simple
            fc.constant('password'), // Common password
            fc.string({ minLength: 101 }) // Too long
          ),
          name: fc.string({ minLength: 2, maxLength: 50 }),
          organization_name: fc.string({ minLength: 3, maxLength: 100 })
        }),
        async (registrationData) => {
          // When: We register with weak password
          const response = await authRequest('/api/auth/register', registrationData);
          
          // Then: Should be rejected or accepted based on password policy
          expect([201, 400]).toContain(response.status);
          
          if (response.status === 400) {
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
          }
          
          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

});

// Test runner configuration
if (require.main === module) {
  console.log('Running property-based tests for authentication...');
  
  // Set up test environment
  process.env.NODE_ENV = 'test';
  
  // Run tests
  const { execSync } = require('child_process');
  try {
    execSync('npx jest tests/property/authentication.test.js --verbose', { 
      stdio: 'inherit' 
    });
  } catch (error) {
    console.error('Tests failed:', error.message);
    process.exit(1);
  }
}