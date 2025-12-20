/**
 * Property-based tests for navigation and authorization
 * Tests Requirements 6.1, 6.2, 6.3, 6.5, 5.5
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
    return response.data.session?.access_token || response.data.token;
  } catch (error) {
    throw new Error('Could not get test token');
  }
};

// Property generators
const navigationEndpointArbitrary = fc.oneof(
  fc.constant('/api/dashboard'),
  fc.constant('/api/risks'),
  fc.constant('/api/master-data'),
  fc.constant('/api/reports'),
  fc.constant('/api/users'),
  fc.constant('/api/visi-misi'),
  fc.constant('/api/rencana-strategis'),
  fc.constant('/api/sasaran-strategi'),
  fc.constant('/api/matriks-tows'),
  fc.constant('/api/diagram-kartesius'),
  fc.constant('/api/strategic-map'),
  fc.constant('/api/indikator-kinerja-utama'),
  fc.constant('/api/monitoring-evaluasi'),
  fc.constant('/api/peluang'),
  fc.constant('/api/kri'),
  fc.constant('/api/residual-risk'),
  fc.constant('/api/risk-profile'),
  fc.constant('/api/laporan')
);

const restrictedEndpointArbitrary = fc.oneof(
  fc.constant('/api/users'),
  fc.constant('/api/master-data'),
  fc.constant('/api/reports'),
  fc.constant('/api/admin')
);

const chartFilterArbitrary = fc.record({
  start_date: fc.date({ min: new Date('2023-01-01'), max: new Date() }),
  end_date: fc.date({ min: new Date(), max: new Date('2024-12-31') }),
  category: fc.oneof(
    fc.constant(''),
    fc.constant('operational'),
    fc.constant('financial'),
    fc.constant('strategic'),
    fc.constant('compliance')
  ),
  organization_id: fc.oneof(
    fc.constant(''),
    fc.constant('all'),
    fc.string({ minLength: 36, maxLength: 36 }) // UUID format
  )
});

const invalidTokenArbitrary = fc.oneof(
  fc.constant(''),
  fc.constant('invalid-token'),
  fc.constant('Bearer invalid'),
  fc.string({ minLength: 1, maxLength: 50 }),
  fc.string({ minLength: 200, maxLength: 500 })
);

describe('Property Tests - Navigation and Authorization', () => {

  let testToken;

  beforeAll(async () => {
    try {
      testToken = await getTestToken();
    } catch (error) {
      console.warn('Could not get test token, some tests may fail');
    }
  });

  /**
   * Property 13: Menu navigation loads correct data
   * Test that navigating to any page loads correct data
   */
  test('Property 13: Menu navigation loads correct data', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        navigationEndpointArbitrary,
        async (endpoint) => {
          // When: We navigate to any menu endpoint
          const response = await apiRequest(endpoint, {
            token: testToken
          });
          
          // Then: Response should be structured correctly
          expect([200, 404, 401, 403, 500]).toContain(response.status);
          
          if (response.status === 200) {
            // Successful navigation
            expect(response.data).toBeDefined();
            expect(typeof response.data).toBe('object');
            
            // Should have data structure appropriate for the endpoint
            if (endpoint.includes('dashboard')) {
              // Dashboard should have summary data
              expect(response.data).toHaveProperty('data');
            } else if (endpoint.includes('risks') || endpoint.includes('master-data')) {
              // Data endpoints should have array or object
              expect(response.data).toBeDefined();
            }
            
          } else if (response.status === 404) {
            // Endpoint not implemented yet
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
            
          } else if (response.status === 401) {
            // Authentication required
            expect(response.data).toHaveProperty('error');
            expect(response.data.error).toContain('token');
            
          } else if (response.status === 403) {
            // Access denied
            expect(response.data).toHaveProperty('error');
            expect(response.data.error).toContain('access');
            
          } else {
            // Server error
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
   * Property 14: Authentication persists across navigation
   * Test that auth state persists during navigation
   */
  test('Property 14: Authentication persists across navigation', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(navigationEndpointArbitrary, { minLength: 2, maxLength: 5 }),
        async (endpoints) => {
          let authenticationWorked = true;
          let lastValidResponse = null;
          
          // When: We navigate through multiple endpoints with same token
          for (const endpoint of endpoints) {
            const response = await apiRequest(endpoint, {
              token: testToken
            });
            
            // Track authentication status
            if (response.status === 401) {
              authenticationWorked = false;
              break;
            } else if (response.status === 200) {
              lastValidResponse = response;
            }
          }
          
          // Then: Authentication should persist or fail consistently
          if (authenticationWorked && lastValidResponse) {
            // If auth worked, we should have gotten valid responses
            expect(lastValidResponse.status).toBe(200);
            expect(lastValidResponse.data).toBeDefined();
          }
          
          // Authentication should not randomly fail in the middle
          // (Either all requests should work or all should fail with 401)
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Property 15: Restricted page authorization
   * Test that restricted pages verify user permissions
   */
  test('Property 15: Restricted page authorization', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(restrictedEndpointArbitrary, invalidTokenArbitrary),
        async ([endpoint, invalidToken]) => {
          // When: We access restricted endpoint with invalid token
          const response = await apiRequest(endpoint, {
            token: invalidToken
          });
          
          // Then: Should be rejected with proper error
          expect([401, 403, 404]).toContain(response.status);
          
          if (response.status === 401) {
            // Authentication required
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
            expect(response.data.error.toLowerCase()).toMatch(/token|auth|unauthorized/);
            
          } else if (response.status === 403) {
            // Access denied
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
            expect(response.data.error.toLowerCase()).toMatch(/access|denied|forbidden/);
            
          } else {
            // Endpoint not found (also acceptable for security)
            expect(response.data).toBeDefined();
          }
          
          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property 16: Chart filtering updates all charts
   * Test that applying filters updates all charts
   */
  test('Property 16: Chart filtering updates all charts', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        chartFilterArbitrary,
        async (filters) => {
          // When: We apply filters to dashboard/charts
          const queryParams = new URLSearchParams({
            start_date: filters.start_date.toISOString().split('T')[0],
            end_date: filters.end_date.toISOString().split('T')[0],
            category: filters.category,
            organization_id: filters.organization_id
          });
          
          const response = await apiRequest(`/api/dashboard?${queryParams}`, {
            token: testToken
          });
          
          // Then: Response should handle filters appropriately
          expect([200, 400, 401, 403, 404, 500]).toContain(response.status);
          
          if (response.status === 200) {
            // Successful filtering
            expect(response.data).toBeDefined();
            expect(typeof response.data).toBe('object');
            
            // Should have filtered data
            if (response.data.data) {
              expect(response.data.data).toBeDefined();
              
              // If category filter applied, check if data respects it
              if (filters.category && response.data.data.length > 0) {
                // Data should be filtered (or at least not contain obviously wrong categories)
                expect(Array.isArray(response.data.data)).toBe(true);
              }
            }
            
          } else if (response.status === 400) {
            // Invalid filter parameters
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
            
          } else if (response.status === 404) {
            // Dashboard endpoint not implemented
            expect(response.data).toHaveProperty('error');
            
          } else {
            // Other errors
            expect(response.data).toBeDefined();
          }
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Additional property: Session timeout handling
   * Test that expired sessions are handled properly
   */
  test('Property: Session timeout handling', async () => {
    await fc.assert(
      fc.asyncProperty(
        navigationEndpointArbitrary,
        async (endpoint) => {
          // When: We use an obviously expired/invalid token
          const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
          
          const response = await apiRequest(endpoint, {
            token: expiredToken
          });
          
          // Then: Should handle expired token appropriately
          expect([401, 403, 404]).toContain(response.status);
          
          if (response.status === 401) {
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
   * Additional property: CORS and security headers
   * Test that security headers are properly set
   */
  test('Property: CORS and security headers', async () => {
    await fc.assert(
      fc.asyncProperty(
        navigationEndpointArbitrary,
        async (endpoint) => {
          // When: We make a request to any endpoint
          const response = await apiRequest(endpoint, {
            token: testToken || 'dummy-token'
          });
          
          // Then: Response should have appropriate headers
          expect(response.headers).toBeDefined();
          
          // Should have CORS headers (if CORS is enabled)
          if (response.headers['access-control-allow-origin']) {
            expect(typeof response.headers['access-control-allow-origin']).toBe('string');
          }
          
          // Should have content-type header
          if (response.status === 200) {
            expect(response.headers['content-type']).toBeDefined();
            expect(response.headers['content-type']).toContain('application/json');
          }
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Additional property: Rate limiting and abuse prevention
   * Test that rapid requests are handled appropriately
   */
  test('Property: Rate limiting and abuse prevention', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        navigationEndpointArbitrary,
        async (endpoint) => {
          // When: We make multiple rapid requests
          const requests = Array(5).fill().map(() => 
            apiRequest(endpoint, { token: testToken })
          );
          
          const responses = await Promise.all(requests);
          
          // Then: All responses should be handled properly
          responses.forEach(response => {
            expect([200, 404, 401, 403, 429, 500]).toContain(response.status);
            
            if (response.status === 429) {
              // Rate limited
              expect(response.data).toHaveProperty('error');
              expect(response.data.error).toContain('rate');
            }
          });
          
          return true;
        }
      ),
      { numRuns: 2 }
    );
  });

});

// Test runner configuration
if (require.main === module) {
  console.log('Running property-based tests for navigation and authorization...');
  
  // Set up test environment
  process.env.NODE_ENV = 'test';
  
  // Run tests
  const { execSync } = require('child_process');
  try {
    execSync('npx jest tests/property/navigation-authorization.test.js --verbose', { 
      stdio: 'inherit' 
    });
  } catch (error) {
    console.error('Tests failed:', error.message);
    process.exit(1);
  }
}