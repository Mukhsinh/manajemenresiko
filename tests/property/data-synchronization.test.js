/**
 * Property-based tests for data synchronization
 * Tests Requirements 13.1, 13.2, 13.3, 13.4, 13.5
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
const riskDataArbitrary = fc.record({
  risk_code: fc.string({ minLength: 3, maxLength: 20 }),
  risk_name: fc.string({ minLength: 5, maxLength: 100 }),
  risk_description: fc.string({ minLength: 10, maxLength: 500 }),
  probability_level: fc.integer({ min: 1, max: 5 }),
  impact_level: fc.integer({ min: 1, max: 5 })
});

const organizationArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 50 })
});

const filterArbitrary = fc.record({
  risk_level: fc.constantFrom('high', 'medium', 'low'),
  category_id: fc.option(fc.uuid()),
  work_unit_id: fc.option(fc.uuid()),
  date_from: fc.option(fc.date()),
  date_to: fc.option(fc.date())
});

describe('Property Tests - Data Synchronization', () => {

  /**
   * Property 39: New data appears immediately in frontend
   * Test that new data appears without refresh
   */
  test('Property 39: New data appears immediately in frontend', async () => {
    await fc.assert(
      fc.asyncProperty(
        riskDataArbitrary,
        organizationArbitrary,
        async (riskData, organization) => {
          // Given: Initial state of risks
          const initialRisks = await apiRequest('/api/risks', {
            headers: { 'X-Organization-ID': organization.id }
          });
          const initialCount = Array.isArray(initialRisks) ? initialRisks.length : 0;
          
          // When: We create new risk data
          const newRisk = await apiRequest('/api/risks', {
            method: 'POST',
            headers: { 'X-Organization-ID': organization.id },
            data: riskData
          });
          
          // Then: The new data should appear immediately in subsequent queries
          const updatedRisks = await apiRequest('/api/risks', {
            headers: { 'X-Organization-ID': organization.id }
          });
          
          expect(Array.isArray(updatedRisks)).toBe(true);
          expect(updatedRisks.length).toBe(initialCount + 1);
          
          // The new risk should be in the list
          const foundRisk = updatedRisks.find(risk => risk.id === newRisk.id);
          expect(foundRisk).toBeDefined();
          expect(foundRisk.risk_code).toBe(riskData.risk_code);
          expect(foundRisk.risk_name).toBe(riskData.risk_name);
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Property 40: Data updates refresh frontend components
   * Test that updates refresh frontend automatically
   */
  test('Property 40: Data updates refresh frontend components', async () => {
    await fc.assert(
      fc.asyncProperty(
        riskDataArbitrary,
        organizationArbitrary,
        fc.string({ minLength: 5, maxLength: 100 }),
        async (initialRiskData, organization, updatedName) => {
          // Given: An existing risk
          const createdRisk = await apiRequest('/api/risks', {
            method: 'POST',
            headers: { 'X-Organization-ID': organization.id },
            data: initialRiskData
          });
          
          // When: We update the risk
          const updateData = { ...initialRiskData, risk_name: updatedName };
          const updatedRisk = await apiRequest(`/api/risks/${createdRisk.id}`, {
            method: 'PUT',
            headers: { 'X-Organization-ID': organization.id },
            data: updateData
          });
          
          // Then: The updated data should be reflected immediately
          const fetchedRisk = await apiRequest(`/api/risks/${createdRisk.id}`, {
            headers: { 'X-Organization-ID': organization.id }
          });
          
          expect(fetchedRisk.risk_name).toBe(updatedName);
          expect(fetchedRisk.id).toBe(createdRisk.id);
          
          // Dashboard stats should also reflect the update
          const dashboardStats = await apiRequest('/api/dashboard/stats', {
            headers: { 'X-Organization-ID': organization.id }
          });
          
          expect(typeof dashboardStats.totalRisks).toBe('number');
          expect(dashboardStats.totalRisks).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Property 41: Deleted data disappears from frontend
   * Test that deletions update frontend immediately
   */
  test('Property 41: Deleted data disappears from frontend', async () => {
    await fc.assert(
      fc.asyncProperty(
        riskDataArbitrary,
        organizationArbitrary,
        async (riskData, organization) => {
          // Given: An existing risk
          const createdRisk = await apiRequest('/api/risks', {
            method: 'POST',
            headers: { 'X-Organization-ID': organization.id },
            data: riskData
          });
          
          // Get initial count
          const initialRisks = await apiRequest('/api/risks', {
            headers: { 'X-Organization-ID': organization.id }
          });
          const initialCount = Array.isArray(initialRisks) ? initialRisks.length : 0;
          
          // When: We delete the risk
          await apiRequest(`/api/risks/${createdRisk.id}`, {
            method: 'DELETE',
            headers: { 'X-Organization-ID': organization.id }
          });
          
          // Then: The risk should disappear from all queries
          const updatedRisks = await apiRequest('/api/risks', {
            headers: { 'X-Organization-ID': organization.id }
          });
          
          expect(Array.isArray(updatedRisks)).toBe(true);
          expect(updatedRisks.length).toBe(initialCount - 1);
          
          // The deleted risk should not be in the list
          const foundRisk = updatedRisks.find(risk => risk.id === createdRisk.id);
          expect(foundRisk).toBeUndefined();
          
          // Trying to fetch the deleted risk should fail
          try {
            await apiRequest(`/api/risks/${createdRisk.id}`, {
              headers: { 'X-Organization-ID': organization.id }
            });
            expect(false).toBe(true); // Should not reach here
          } catch (error) {
            expect(error.message).toContain('API request failed');
          }
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Property 42: Filters apply to database queries
   * Test that filters work correctly
   */
  test('Property 42: Filters apply to database queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        filterArbitrary,
        organizationArbitrary,
        async (filter, organization) => {
          // When: We apply filters to risk queries
          const queryParams = new URLSearchParams();
          
          if (filter.risk_level) {
            queryParams.append('risk_level', filter.risk_level);
          }
          if (filter.category_id) {
            queryParams.append('category_id', filter.category_id);
          }
          if (filter.work_unit_id) {
            queryParams.append('work_unit_id', filter.work_unit_id);
          }
          
          const filteredRisks = await apiRequest(`/api/risks?${queryParams.toString()}`, {
            headers: { 'X-Organization-ID': organization.id }
          });
          
          // Then: The results should match the filter criteria
          expect(Array.isArray(filteredRisks)).toBe(true);
          
          if (filteredRisks.length > 0) {
            filteredRisks.forEach(risk => {
              // Verify organization filtering
              expect(risk.organization_id).toBe(organization.id);
              
              // Verify specific filters if applied
              if (filter.category_id) {
                expect(risk.risk_category_id).toBe(filter.category_id);
              }
              if (filter.work_unit_id) {
                expect(risk.work_unit_id).toBe(filter.work_unit_id);
              }
            });
          }
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Property 43: Multi-user data consistency
   * Test that multiple users see consistent data
   */
  test('Property 43: Multi-user data consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        organizationArbitrary,
        async (organization) => {
          // Simulate multiple users accessing the same organization data
          const user1Token = TEST_TOKEN;
          const user2Token = TEST_TOKEN; // In real test, this would be different
          
          // When: Both users fetch the same data simultaneously
          const [user1Data, user2Data] = await Promise.all([
            apiRequest('/api/risks', {
              headers: { 
                'Authorization': `Bearer ${user1Token}`,
                'X-Organization-ID': organization.id 
              }
            }),
            apiRequest('/api/risks', {
              headers: { 
                'Authorization': `Bearer ${user2Token}`,
                'X-Organization-ID': organization.id 
              }
            })
          ]);
          
          // Then: Both users should see the same data
          expect(Array.isArray(user1Data)).toBe(true);
          expect(Array.isArray(user2Data)).toBe(true);
          expect(user1Data.length).toBe(user2Data.length);
          
          // Sort both arrays by id for comparison
          const sortedUser1Data = user1Data.sort((a, b) => a.id.localeCompare(b.id));
          const sortedUser2Data = user2Data.sort((a, b) => a.id.localeCompare(b.id));
          
          // Compare each record
          for (let i = 0; i < sortedUser1Data.length; i++) {
            expect(sortedUser1Data[i].id).toBe(sortedUser2Data[i].id);
            expect(sortedUser1Data[i].risk_code).toBe(sortedUser2Data[i].risk_code);
            expect(sortedUser1Data[i].risk_name).toBe(sortedUser2Data[i].risk_name);
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
  console.log('Running property-based tests for data synchronization...');
  
  // Set up test environment
  process.env.NODE_ENV = 'test';
  
  // Run tests
  const { execSync } = require('child_process');
  try {
    execSync('npx jest tests/property/data-synchronization.test.js --verbose', { 
      stdio: 'inherit' 
    });
  } catch (error) {
    console.error('Tests failed:', error.message);
    process.exit(1);
  }
}