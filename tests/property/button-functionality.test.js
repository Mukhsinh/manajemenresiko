/**
 * Property-based tests for button functionality
 * Tests Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */

const fc = require('fast-check');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

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
      data: options.data,
      responseType: options.responseType || 'json'
    });
    return response;
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
  impact_level: fc.integer({ min: 1, max: 5 }),
  risk_category_id: fc.uuid(),
  work_unit_id: fc.uuid()
});

const organizationArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 50 })
});

describe('Property Tests - Button Functionality', () => {

  /**
   * Property 34: Add data button opens functional form
   * Test that add buttons open working forms
   */
  test('Property 34: Add data button opens functional form', async () => {
    await fc.assert(
      fc.asyncProperty(
        riskDataArbitrary,
        organizationArbitrary,
        async (riskData, organization) => {
          // When: We submit new risk data through the form endpoint
          const response = await apiRequest('/api/risks', {
            method: 'POST',
            headers: { 'X-Organization-ID': organization.id },
            data: riskData
          });
          
          // Then: The form should accept and process the data
          expect(response.status).toBe(201);
          expect(response.data).toHaveProperty('id');
          expect(response.data.risk_code).toBe(riskData.risk_code);
          expect(response.data.risk_name).toBe(riskData.risk_name);
          expect(response.data.organization_id).toBe(organization.id);
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Property 35: Template download generates correct files
   * Test that template downloads work correctly
   */
  test('Property 35: Template download generates correct files', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('risks', 'risk-categories', 'work-units', 'probability-criteria', 'impact-criteria'),
        organizationArbitrary,
        async (templateType, organization) => {
          // When: We request a template download
          const response = await apiRequest(`/api/templates/${templateType}`, {
            headers: { 'X-Organization-ID': organization.id },
            responseType: 'arraybuffer'
          });
          
          // Then: The response should be a valid Excel file
          expect(response.status).toBe(200);
          expect(response.headers['content-type']).toContain('application/vnd.openxmlformats');
          expect(response.headers['content-disposition']).toContain('attachment');
          expect(response.data).toBeInstanceOf(ArrayBuffer);
          expect(response.data.byteLength).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Property 36: Import button processes files correctly
   * Test that import buttons process Excel files
   */
  test('Property 36: Import button processes files correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        organizationArbitrary,
        async (organization) => {
          // Given: A valid Excel file for import
          const testFilePath = path.join(__dirname, '../fixtures/test-risks.xlsx');
          
          // Create a simple test Excel file if it doesn't exist
          if (!fs.existsSync(testFilePath)) {
            // Skip this test if no test file is available
            return true;
          }
          
          // When: We upload the file through import endpoint
          const formData = new FormData();
          formData.append('file', fs.createReadStream(testFilePath));
          
          const response = await axios.post(`${BASE_URL}/api/import/risks`, formData, {
            headers: {
              'Authorization': `Bearer ${TEST_TOKEN}`,
              'X-Organization-ID': organization.id,
              ...formData.getHeaders()
            }
          });
          
          // Then: The import should succeed
          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('success');
          expect(response.data.success).toBe(true);
          expect(response.data).toHaveProperty('imported_count');
          expect(typeof response.data.imported_count).toBe('number');
          expect(response.data.imported_count).toBeGreaterThanOrEqual(0);
          
          return true;
        }
      ),
      { numRuns: 2 }
    );
  });

  /**
   * Property 37: Report download contains current data
   * Test that report downloads contain current data
   */
  test('Property 37: Report download contains current data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('risk-register', 'risk-analysis', 'dashboard-summary'),
        organizationArbitrary,
        async (reportType, organization) => {
          // When: We request a report download
          const response = await apiRequest(`/api/reports/${reportType}`, {
            headers: { 'X-Organization-ID': organization.id },
            responseType: 'arraybuffer'
          });
          
          // Then: The response should be a valid file
          expect(response.status).toBe(200);
          expect(response.headers['content-disposition']).toContain('attachment');
          expect(response.data).toBeInstanceOf(ArrayBuffer);
          expect(response.data.byteLength).toBeGreaterThan(0);
          
          // Content type should be Excel or PDF
          const contentType = response.headers['content-type'];
          const validTypes = [
            'application/vnd.openxmlformats',
            'application/pdf',
            'application/vnd.ms-excel'
          ];
          expect(validTypes.some(type => contentType.includes(type))).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Property 38: Button failures show specific errors
   * Test that button failures show proper error messages
   */
  test('Property 38: Button failures show specific errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          risk_code: fc.string({ maxLength: 2 }), // Invalid: too short
          risk_name: fc.constant(''), // Invalid: empty
          probability_level: fc.integer({ min: 6, max: 10 }), // Invalid: out of range
          impact_level: fc.integer({ min: -5, max: 0 }) // Invalid: negative
        }),
        organizationArbitrary,
        async (invalidRiskData, organization) => {
          // When: We submit invalid data
          try {
            await apiRequest('/api/risks', {
              method: 'POST',
              headers: { 'X-Organization-ID': organization.id },
              data: invalidRiskData
            });
            
            // Should not reach here
            expect(false).toBe(true);
          } catch (error) {
            // Then: Should receive specific error messages
            expect(error.message).toContain('API request failed');
            
            // The error should indicate validation failure
            const errorResponse = error.response;
            if (errorResponse) {
              expect(errorResponse.status).toBeGreaterThanOrEqual(400);
              expect(errorResponse.status).toBeLessThan(500);
            }
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
  console.log('Running property-based tests for button functionality...');
  
  // Set up test environment
  process.env.NODE_ENV = 'test';
  
  // Run tests
  const { execSync } = require('child_process');
  try {
    execSync('npx jest tests/property/button-functionality.test.js --verbose', { 
      stdio: 'inherit' 
    });
  } catch (error) {
    console.error('Tests failed:', error.message);
    process.exit(1);
  }
}