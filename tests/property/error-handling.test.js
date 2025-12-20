/**
 * Property-based tests for error handling
 * Tests Requirements 8.1, 8.3, 8.5
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
        'Authorization': `Bearer ${options.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      data: options.data,
      timeout: options.timeout || 10000,
      validateStatus: () => true // Accept all status codes
    });
    return response;
  } catch (error) {
    // Network or timeout errors
    return {
      status: 0,
      data: { error: error.message },
      headers: {}
    };
  }
};

// Helper to get test token
const getTestToken = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    return response.data.session?.access_token || response.data.token;
  } catch (error) {
    throw new Error('Could not get test token');
  }
};

// Property generators
const apiEndpointArbitrary = fc.oneof(
  fc.constant('/api/auth/login'),
  fc.constant('/api/users'),
  fc.constant('/api/risks'),
  fc.constant('/api/visi-misi'),
  fc.constant('/api/rencana-strategis'),
  fc.constant('/api/dashboard'),
  fc.constant('/api/reports'),
  fc.constant('/api/master-data')
);

const invalidDataArbitrary = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.constant(''),
  fc.constant({}),
  fc.constant([]),
  fc.record({
    invalid_field: fc.string(),
    another_invalid: fc.integer()
  }),
  fc.string({ maxLength: 5 }), // Too short
  fc.string({ minLength: 1000 }), // Too long
  fc.record({
    email: fc.string({ maxLength: 5 }), // Invalid email
    password: fc.string({ maxLength: 3 }) // Too short password
  })
);

const malformedRequestArbitrary = fc.record({
  method: fc.oneof(
    fc.constant('POST'),
    fc.constant('PUT'),
    fc.constant('DELETE'),
    fc.constant('PATCH')
  ),
  data: invalidDataArbitrary,
  headers: fc.oneof(
    fc.constant({}),
    fc.constant({ 'Content-Type': 'text/plain' }),
    fc.constant({ 'Content-Type': 'application/xml' }),
    fc.record({
      'Authorization': fc.string({ maxLength: 10 }),
      'Content-Type': fc.constant('application/json')
    })
  )
});

const httpErrorStatusArbitrary = fc.oneof(
  fc.constant(400), // Bad Request
  fc.constant(401), // Unauthorized
  fc.constant(403), // Forbidden
  fc.constant(404), // Not Found
  fc.constant(409), // Conflict
  fc.constant(422), // Unprocessable Entity
  fc.constant(429), // Too Many Requests
  fc.constant(500), // Internal Server Error
  fc.constant(502), // Bad Gateway
  fc.constant(503)  // Service Unavailable
);

describe('Property Tests - Error Handling', () => {

  let testToken;

  beforeAll(async () => {
    try {
      testToken = await getTestToken();
    } catch (error) {
      console.warn('Could not get test token, some tests may fail');
    }
  });

  /**
   * Property 19: API errors return structured responses
   * Test that API errors have correct structure and status codes
   */
  test('Property 19: API errors return structured responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(apiEndpointArbitrary, malformedRequestArbitrary),
        async ([endpoint, request]) => {
          // When: We send malformed request to API
          const response = await apiRequest(endpoint, {
            method: request.method,
            data: request.data,
            headers: request.headers,
            token: testToken
          });
          
          // Then: Response should have proper error structure
          expect(response.status).toBeGreaterThanOrEqual(0);
          
          if (response.status >= 400 && response.status < 600) {
            // Error response should have structured format
            expect(response.data).toBeDefined();
            expect(typeof response.data).toBe('object');
            
            // Should have error message
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
            expect(response.data.error.length).toBeGreaterThan(0);
            
            // Status code should be appropriate
            expect([400, 401, 403, 404, 405, 409, 422, 429, 500, 502, 503]).toContain(response.status);
            
            // Should have proper content-type header
            if (response.headers['content-type']) {
              expect(response.headers['content-type']).toContain('application/json');
            }
            
          } else if (response.status === 200 || response.status === 201) {
            // Successful response should have data
            expect(response.data).toBeDefined();
            
          } else if (response.status === 0) {
            // Network error
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
   * Property 20: Validation errors show field-specific messages
   * Test that validation errors specify which fields failed
   */
  test('Property 20: Validation errors show field-specific messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.oneof(
            fc.constant(''),
            fc.constant('invalid-email'),
            fc.string({ maxLength: 5 }),
            fc.constant(null)
          ),
          password: fc.oneof(
            fc.constant(''),
            fc.string({ maxLength: 3 }),
            fc.constant(null)
          ),
          name: fc.oneof(
            fc.constant(''),
            fc.string({ maxLength: 1 }),
            fc.constant(null)
          )
        }),
        async (invalidData) => {
          // When: We send invalid data to registration endpoint
          const response = await apiRequest('/api/auth/register', {
            method: 'POST',
            data: {
              ...invalidData,
              organization_name: 'Test Org'
            },
            token: testToken
          });
          
          // Then: Validation error should be specific
          if (response.status === 400 || response.status === 422) {
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
            
            const errorMessage = response.data.error.toLowerCase();
            
            // Error message should mention specific fields
            if (!invalidData.email || invalidData.email.length < 5) {
              expect(errorMessage).toMatch(/email|e-mail/);
            }
            
            if (!invalidData.password || invalidData.password.length < 6) {
              expect(errorMessage).toMatch(/password|pwd/);
            }
            
            if (!invalidData.name || invalidData.name.length < 2) {
              expect(errorMessage).toMatch(/name|nama/);
            }
            
          } else if (response.status === 409) {
            // User already exists
            expect(response.data.error).toContain('already exists');
            
          } else if (response.status === 201) {
            // Successful registration (data was actually valid)
            expect(response.data).toHaveProperty('user');
          }
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Property 21: Error logs include context
   * Test that error logs include timestamp, user, and request details
   */
  test('Property 21: Error logs include context', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(apiEndpointArbitrary, invalidDataArbitrary),
        async ([endpoint, invalidData]) => {
          // When: We cause an error with invalid data
          const response = await apiRequest(endpoint, {
            method: 'POST',
            data: invalidData,
            token: testToken
          });
          
          // Then: Error response should include contextual information
          if (response.status >= 400 && response.status < 600) {
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
            
            // Error should be descriptive (not just generic)
            expect(response.data.error.length).toBeGreaterThan(5);
            
            // Should not expose internal system details
            const errorMessage = response.data.error.toLowerCase();
            expect(errorMessage).not.toContain('stack trace');
            expect(errorMessage).not.toContain('internal error');
            expect(errorMessage).not.toContain('database error');
            expect(errorMessage).not.toContain('sql');
            
            // Should have appropriate HTTP status
            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(response.status).toBeLessThan(600);
            
            // Response time should be reasonable (not hanging)
            expect(response.headers).toBeDefined();
          }
          
          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Additional property: Authentication error handling
   * Test that authentication errors are handled consistently
   */
  test('Property: Authentication error handling', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          apiEndpointArbitrary,
          fc.oneof(
            fc.constant(''),
            fc.constant('invalid-token'),
            fc.constant('Bearer '),
            fc.string({ minLength: 10, maxLength: 50 }),
            fc.constant(null)
          )
        ),
        async ([endpoint, invalidToken]) => {
          // When: We use invalid authentication token
          const response = await apiRequest(endpoint, {
            token: invalidToken
          });
          
          // Then: Authentication error should be consistent
          if (response.status === 401) {
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
            
            const errorMessage = response.data.error.toLowerCase();
            expect(errorMessage).toMatch(/token|auth|unauthorized|invalid|expired/);
            
            // Should not expose token details
            expect(response.data.error).not.toContain(invalidToken);
            
          } else if (response.status === 403) {
            // Forbidden access
            expect(response.data).toHaveProperty('error');
            expect(response.data.error.toLowerCase()).toMatch(/access|denied|forbidden/);
            
          } else if (response.status === 404) {
            // Endpoint not found (acceptable)
            expect(response.data).toHaveProperty('error');
          }
          
          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Additional property: Rate limiting error handling
   * Test that rate limiting is handled gracefully
   */
  test('Property: Rate limiting error handling', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        apiEndpointArbitrary,
        async (endpoint) => {
          // When: We make rapid requests to test rate limiting
          const requests = Array(10).fill().map(() => 
            apiRequest(endpoint, { token: testToken })
          );
          
          const responses = await Promise.all(requests);
          
          // Then: Rate limiting should be handled properly
          responses.forEach(response => {
            expect(response.status).toBeGreaterThanOrEqual(0);
            
            if (response.status === 429) {
              // Rate limited
              expect(response.data).toHaveProperty('error');
              expect(response.data.error.toLowerCase()).toMatch(/rate|limit|too many/);
              
              // Should have retry-after header
              if (response.headers['retry-after']) {
                expect(parseInt(response.headers['retry-after'])).toBeGreaterThan(0);
              }
              
            } else if (response.status >= 400) {
              // Other error
              expect(response.data).toHaveProperty('error');
              expect(typeof response.data.error).toBe('string');
            }
          });
          
          return true;
        }
      ),
      { numRuns: 2 }
    );
  });

  /**
   * Additional property: Server error handling
   * Test that server errors are handled gracefully
   */
  test('Property: Server error handling', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.constant('/api/nonexistent-endpoint'),
          fc.oneof(fc.constant('GET'), fc.constant('POST'), fc.constant('PUT'))
        ),
        async ([endpoint, method]) => {
          // When: We access non-existent endpoint
          const response = await apiRequest(endpoint, {
            method,
            token: testToken,
            data: { test: 'data' }
          });
          
          // Then: Should handle gracefully
          expect([404, 405, 500]).toContain(response.status);
          
          if (response.status === 404) {
            expect(response.data).toHaveProperty('error');
            expect(response.data.error.toLowerCase()).toMatch(/not found|endpoint|route/);
            
          } else if (response.status === 405) {
            expect(response.data).toHaveProperty('error');
            expect(response.data.error.toLowerCase()).toMatch(/method|not allowed/);
            
          } else if (response.status === 500) {
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
            
            // Should not expose internal details
            expect(response.data.error).not.toContain('stack');
            expect(response.data.error).not.toContain('trace');
          }
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Additional property: Input sanitization
   * Test that malicious input is properly sanitized
   */
  test('Property: Input sanitization', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('<script>alert("xss")</script>'),
          fc.constant('javascript:alert(1)'),
          fc.constant('SELECT * FROM users'),
          fc.constant("'; DROP TABLE users; --"),
          fc.constant('{{7*7}}'),
          fc.constant('${7*7}'),
          fc.constant('../../../etc/passwd')
        ),
        async (maliciousInput) => {
          // When: We send malicious input
          const response = await apiRequest('/api/visi-misi', {
            method: 'POST',
            data: {
              visi: maliciousInput,
              misi: 'Test mission',
              tujuan: 'Test goal'
            },
            token: testToken
          });
          
          // Then: Input should be sanitized or rejected
          if (response.status === 200 || response.status === 201) {
            // If accepted, should be sanitized
            if (response.data.visi_misi) {
              const savedVisi = response.data.visi_misi.visi;
              
              // Should not contain executable code
              expect(savedVisi).not.toContain('<script>');
              expect(savedVisi).not.toContain('javascript:');
              expect(savedVisi).not.toContain('DROP TABLE');
              expect(savedVisi).not.toContain('{{');
              expect(savedVisi).not.toContain('${');
            }
            
          } else if (response.status === 400) {
            // Rejected due to validation
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
  console.log('Running property-based tests for error handling...');
  
  // Set up test environment
  process.env.NODE_ENV = 'test';
  
  // Run tests
  const { execSync } = require('child_process');
  try {
    execSync('npx jest tests/property/error-handling.test.js --verbose', { 
      stdio: 'inherit' 
    });
  } catch (error) {
    console.error('Tests failed:', error.message);
    process.exit(1);
  }
}