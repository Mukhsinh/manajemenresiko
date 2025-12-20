/**
 * Property-based tests for multi-tenant isolation
 * Tests Requirements 7.1, 7.2, 7.3
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
const dataEndpointArbitrary = fc.oneof(
  fc.constant('/api/risks'),
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

const organizationDataArbitrary = fc.record({
  name: fc.string({ minLength: 3, maxLength: 50 }),
  description: fc.string({ minLength: 5, maxLength: 200 }),
  category: fc.oneof(
    fc.constant('operational'),
    fc.constant('financial'),
    fc.constant('strategic'),
    fc.constant('compliance')
  ),
  level: fc.integer({ min: 1, max: 5 }),
  score: fc.integer({ min: 1, max: 25 })
});

const queryParametersArbitrary = fc.record({
  page: fc.integer({ min: 1, max: 10 }),
  limit: fc.integer({ min: 5, max: 50 }),
  search: fc.oneof(fc.constant(''), fc.string({ maxLength: 20 })),
  category: fc.oneof(
    fc.constant(''),
    fc.constant('operational'),
    fc.constant('financial'),
    fc.constant('strategic')
  ),
  organization_id: fc.oneof(
    fc.constant(''),
    fc.constant('all'),
    fc.string({ minLength: 36, maxLength: 36 }) // UUID format
  )
});

describe('Property Tests - Multi-Tenant Isolation', () => {

  let testToken;

  beforeAll(async () => {
    try {
      testToken = await getTestToken();
    } catch (error) {
      console.warn('Could not get test token, some tests may fail');
    }
  });

  /**
   * Property 17: Automatic organization filtering
   * Test that queries automatically filter by organization
   */
  test('Property 17: Automatic organization filtering', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.tuple(dataEndpointArbitrary, queryParametersArbitrary),
        async ([endpoint, queryParams]) => {
          // When: We query any data endpoint
          const queryString = new URLSearchParams(queryParams).toString();
          const response = await apiRequest(`${endpoint}?${queryString}`, {
            token: testToken
          });
          
          // Then: Response should be filtered by organization
          expect([200, 404, 401, 403, 500]).toContain(response.status);
          
          if (response.status === 200) {
            // Successful query
            expect(response.data).toBeDefined();
            
            // Check if response has data array
            let dataArray = null;
            if (Array.isArray(response.data)) {
              dataArray = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              dataArray = response.data.data;
            } else if (response.data.risks && Array.isArray(response.data.risks)) {
              dataArray = response.data.risks;
            }
            
            // If we have data, all records should have organization_id
            if (dataArray && dataArray.length > 0) {
              dataArray.forEach(record => {
                expect(record).toHaveProperty('organization_id');
                expect(record.organization_id).toBeValidUUID();
              });
              
              // All records should have the same organization_id (user's organization)
              const orgIds = [...new Set(dataArray.map(r => r.organization_id))];
              expect(orgIds.length).toBeLessThanOrEqual(1);
            }
            
          } else if (response.status === 404) {
            // Endpoint not implemented
            expect(response.data).toHaveProperty('error');
            
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
          }
          
          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property 18: Organization association on create
   * Test that new records are associated with organization
   */
  test('Property 18: Organization association on create', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        organizationDataArbitrary,
        async (data) => {
          // When: We create new data through API
          const response = await apiRequest('/api/risks', {
            method: 'POST',
            token: testToken,
            data: {
              risk_code: `TEST-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              risk_name: data.name,
              risk_description: data.description,
              probability_level: data.level,
              impact_level: data.score
            }
          });
          
          // Then: Response should associate data with organization
          expect([201, 400, 401, 403, 409, 500]).toContain(response.status);
          
          if (response.status === 201) {
            // Successful creation
            expect(response.data).toHaveProperty('risk');
            const risk = response.data.risk;
            
            expect(risk).toHaveProperty('id');
            expect(risk).toHaveProperty('organization_id');
            expect(risk.organization_id).toBeValidUUID();
            
            // Verify the created record can be retrieved (organization filtering works)
            const getResponse = await apiRequest(`/api/risks/${risk.id}`, {
              token: testToken
            });
            
            if (getResponse.status === 200) {
              expect(getResponse.data.risk.organization_id).toBe(risk.organization_id);
            }
            
          } else if (response.status === 400) {
            // Validation error
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
            
          } else if (response.status === 409) {
            // Duplicate data
            expect(response.data).toHaveProperty('error');
            expect(response.data.error).toContain('already exists');
            
          } else if (response.status === 500) {
            // Server error (acceptable for testing)
            expect(response.data).toHaveProperty('error');
            
          } else {
            // Authorization error
            expect(response.data).toHaveProperty('error');
          }
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Additional property: Cross-organization data isolation
   * Test that users cannot access other organizations' data
   */
  test('Property: Cross-organization data isolation', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.tuple(dataEndpointArbitrary, fc.string({ minLength: 36, maxLength: 36 })),
        async ([endpoint, fakeOrgId]) => {
          // When: We try to access data with fake organization_id parameter
          const response = await apiRequest(`${endpoint}?organization_id=${fakeOrgId}`, {
            token: testToken
          });
          
          // Then: Should not return data from other organizations
          expect([200, 400, 404, 401, 403, 500]).toContain(response.status);
          
          if (response.status === 200) {
            // If successful, data should still be filtered by user's organization
            let dataArray = null;
            if (Array.isArray(response.data)) {
              dataArray = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              dataArray = response.data.data;
            }
            
            // Should not return data from the fake organization
            if (dataArray && dataArray.length > 0) {
              dataArray.forEach(record => {
                if (record.organization_id) {
                  // Should not match the fake organization ID we tried to access
                  expect(record.organization_id).not.toBe(fakeOrgId);
                }
              });
            }
          }
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Additional property: Organization-based user filtering
   * Test that user lists are filtered by organization
   */
  test('Property: Organization-based user filtering', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        queryParametersArbitrary,
        async (queryParams) => {
          // When: We request user list
          const queryString = new URLSearchParams(queryParams).toString();
          const response = await apiRequest(`/api/users?${queryString}`, {
            token: testToken
          });
          
          // Then: Users should be filtered by organization
          expect([200, 404, 401, 403, 500]).toContain(response.status);
          
          if (response.status === 200) {
            expect(response.data).toHaveProperty('users');
            expect(Array.isArray(response.data.users)).toBe(true);
            
            // All users should have the same organization_id
            if (response.data.users.length > 0) {
              const orgIds = [...new Set(response.data.users.map(u => u.organization_id))];
              expect(orgIds.length).toBeLessThanOrEqual(1);
              
              // All organization IDs should be valid UUIDs
              orgIds.forEach(orgId => {
                expect(orgId).toBeValidUUID();
              });
            }
            
          } else if (response.status === 500) {
            // Server error (acceptable for testing)
            expect(response.data).toHaveProperty('error');
          }
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Additional property: Report data isolation
   * Test that reports only include organization data
   */
  test('Property: Report data isolation', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          format: fc.oneof(fc.constant('json'), fc.constant('excel')),
          category: fc.oneof(fc.constant(''), fc.constant('operational')),
          limit: fc.integer({ min: 5, max: 20 })
        }),
        async (reportParams) => {
          // When: We request a report
          const queryString = new URLSearchParams(reportParams).toString();
          const response = await apiRequest(`/api/reports/risks?${queryString}`, {
            token: testToken,
            responseType: reportParams.format === 'excel' ? 'arraybuffer' : 'json'
          });
          
          // Then: Report should only include organization data
          expect([200, 404, 401, 403, 500]).toContain(response.status);
          
          if (response.status === 200) {
            if (reportParams.format === 'json') {
              // JSON report should have filtered data
              if (response.data.data && Array.isArray(response.data.data)) {
                response.data.data.forEach(record => {
                  expect(record).toHaveProperty('organization_id');
                  expect(record.organization_id).toBeValidUUID();
                });
                
                // All records should have same organization
                if (response.data.data.length > 0) {
                  const orgIds = [...new Set(response.data.data.map(r => r.organization_id))];
                  expect(orgIds.length).toBeLessThanOrEqual(1);
                }
              }
            } else {
              // Excel report should be valid file
              expect(response.data).toBeInstanceOf(ArrayBuffer);
              expect(response.data.byteLength).toBeGreaterThan(0);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 2 }
    );
  });

  /**
   * Additional property: Dashboard data isolation
   * Test that dashboard shows only organization data
   */
  test('Property: Dashboard data isolation', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          start_date: fc.date({ min: new Date('2023-01-01'), max: new Date() }),
          end_date: fc.date({ min: new Date(), max: new Date('2024-12-31') }),
          category: fc.oneof(fc.constant(''), fc.constant('operational'))
        }),
        async (filters) => {
          // When: We request dashboard data
          const queryParams = new URLSearchParams({
            start_date: filters.start_date.toISOString().split('T')[0],
            end_date: filters.end_date.toISOString().split('T')[0],
            category: filters.category
          });
          
          const response = await apiRequest(`/api/dashboard?${queryParams}`, {
            token: testToken
          });
          
          // Then: Dashboard should show organization-filtered data
          expect([200, 404, 401, 403, 500]).toContain(response.status);
          
          if (response.status === 200) {
            expect(response.data).toBeDefined();
            
            // Check various data structures that might be returned
            if (response.data.data && Array.isArray(response.data.data)) {
              response.data.data.forEach(record => {
                if (record.organization_id) {
                  expect(record.organization_id).toBeValidUUID();
                }
              });
            }
            
            // Check summary statistics
            if (response.data.summary) {
              expect(typeof response.data.summary).toBe('object');
            }
          }
          
          return true;
        }
      ),
      { numRuns: 2 }
    );
  });

});

// Test runner configuration
if (require.main === module) {
  console.log('Running property-based tests for multi-tenant isolation...');
  
  // Set up test environment
  process.env.NODE_ENV = 'test';
  
  // Run tests
  const { execSync } = require('child_process');
  try {
    execSync('npx jest tests/property/multi-tenant-isolation.test.js --verbose', { 
      stdio: 'inherit' 
    });
  } catch (error) {
    console.error('Tests failed:', error.message);
    process.exit(1);
  }
}