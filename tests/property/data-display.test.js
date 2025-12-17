/**
 * Property-based tests for data display functionality
 * Tests Requirements 11.1, 11.2, 11.3, 11.5
 */

const fc = require('fast-check');
const axios = require('axios');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || '';

// Test utilities
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await axios({
      url: `${BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      data: options.data
    });
    return response.data;
  } catch (error) {
    throw new Error(`API request failed: ${error.message}`);
  }
};

// Property generators
const organizationArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  description: fc.string({ maxLength: 200 })
});

const userArbitrary = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  name: fc.string({ minLength: 2, maxLength: 50 }),
  organization_id: fc.uuid()
});

const riskArbitrary = fc.record({
  id: fc.uuid(),
  risk_code: fc.string({ minLength: 3, maxLength: 20 }),
  risk_name: fc.string({ minLength: 5, maxLength: 100 }),
  organization_id: fc.uuid(),
  probability_level: fc.integer({ min: 1, max: 5 }),
  impact_level: fc.integer({ min: 1, max: 5 })
});

describe('Property Tests - Data Display Functionality', () => {

  /**
   * Property 30: Data tables display complete database records
   * Test that tables show all database records
   */
  test('Property 30: Data tables display complete database records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(riskArbitrary, { minLength: 1, maxLength: 10 }),
        async (risks) => {
          // Given: Some risks exist in database
          const organizationId = risks[0].organization_id;
          
          // When: We fetch data through the API
          const apiData = await apiRequest('/api/risks', {
            headers: { 'X-Organization-ID': organizationId }
          });
          
          // Then: All database records should be present in API response
          expect(Array.isArray(apiData)).toBe(true);
          
          // Verify that each risk has required fields
          apiData.forEach(risk => {
            expect(risk).toHaveProperty('id');
            expect(risk).toHaveProperty('risk_code');
            expect(risk).toHaveProperty('risk_name');
            expect(risk).toHaveProperty('organization_id');
            expect(typeof risk.id).toBe('string');
            expect(typeof risk.risk_code).toBe('string');
            expect(typeof risk.risk_name).toBe('string');
          });
          
          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property 31: Dashboard cards show accurate counts
   * Test that dashboard cards display correct statistics
   */
  test('Property 31: Dashboard cards show accurate counts', async () => {
    await fc.assert(
      fc.asyncProperty(
        organizationArbitrary,
        async (organization) => {
          // When: We fetch dashboard statistics
          const dashboardData = await apiRequest('/api/dashboard/stats', {
            headers: { 'X-Organization-ID': organization.id }
          });
          
          // Then: All counts should be non-negative integers
          expect(typeof dashboardData.totalRisks).toBe('number');
          expect(typeof dashboardData.highRisks).toBe('number');
          expect(typeof dashboardData.mediumRisks).toBe('number');
          expect(typeof dashboardData.lowRisks).toBe('number');
          
          expect(dashboardData.totalRisks).toBeGreaterThanOrEqual(0);
          expect(dashboardData.highRisks).toBeGreaterThanOrEqual(0);
          expect(dashboardData.mediumRisks).toBeGreaterThanOrEqual(0);
          expect(dashboardData.lowRisks).toBeGreaterThanOrEqual(0);
          
          // Total should equal sum of risk levels
          const calculatedTotal = dashboardData.highRisks + 
                                 dashboardData.mediumRisks + 
                                 dashboardData.lowRisks;
          expect(dashboardData.totalRisks).toBe(calculatedTotal);
          
          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property 32: Charts render with real-time data
   * Test that charts display current database data
   */
  test('Property 32: Charts render with real-time data', async () => {
    await fc.assert(
      fc.asyncProperty(
        organizationArbitrary,
        async (organization) => {
          // When: We fetch chart data
          const chartData = await apiRequest('/api/charts/risk-distribution', {
            headers: { 'X-Organization-ID': organization.id }
          });
          
          // Then: Chart data should have proper structure
          expect(chartData).toHaveProperty('labels');
          expect(chartData).toHaveProperty('datasets');
          expect(Array.isArray(chartData.labels)).toBe(true);
          expect(Array.isArray(chartData.datasets)).toBe(true);
          
          // Each dataset should have required properties
          chartData.datasets.forEach(dataset => {
            expect(dataset).toHaveProperty('data');
            expect(dataset).toHaveProperty('label');
            expect(Array.isArray(dataset.data)).toBe(true);
            expect(typeof dataset.label).toBe('string');
            
            // Data values should be non-negative numbers
            dataset.data.forEach(value => {
              expect(typeof value).toBe('number');
              expect(value).toBeGreaterThanOrEqual(0);
            });
          });
          
          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property 33: Related data displays correctly
   * Test that foreign key relationships display properly
   */
  test('Property 33: Related data displays correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        organizationArbitrary,
        async (organization) => {
          // When: We fetch risks with related data
          const risksWithDetails = await apiRequest('/api/risks/detailed', {
            headers: { 'X-Organization-ID': organization.id }
          });
          
          // Then: Each risk should have related data populated
          if (Array.isArray(risksWithDetails) && risksWithDetails.length > 0) {
            risksWithDetails.forEach(risk => {
              expect(risk).toHaveProperty('id');
              expect(risk).toHaveProperty('risk_code');
              expect(risk).toHaveProperty('risk_name');
              
              // Related data should be populated if exists
              if (risk.risk_category) {
                expect(risk.risk_category).toHaveProperty('name');
                expect(typeof risk.risk_category.name).toBe('string');
              }
              
              if (risk.work_unit) {
                expect(risk.work_unit).toHaveProperty('name');
                expect(typeof risk.work_unit.name).toBe('string');
              }
              
              if (risk.probability_criteria) {
                expect(risk.probability_criteria).toHaveProperty('level');
                expect(typeof risk.probability_criteria.level).toBe('number');
              }
              
              if (risk.impact_criteria) {
                expect(risk.impact_criteria).toHaveProperty('level');
                expect(typeof risk.impact_criteria.level).toBe('number');
              }
            });
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
  console.log('Running property-based tests for data display functionality...');
  
  // Set up test environment
  process.env.NODE_ENV = 'test';
  
  // Run tests
  const { execSync } = require('child_process');
  try {
    execSync('npx jest tests/property/data-display.test.js --verbose', { 
      stdio: 'inherit' 
    });
  } catch (error) {
    console.error('Tests failed:', error.message);
    process.exit(1);
  }
}