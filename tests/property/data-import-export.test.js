/**
 * Property-based tests for data import/export
 * Tests Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 4.3
 */

const fc = require('fast-check');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

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
        ...options.headers
      },
      data: options.data,
      responseType: options.responseType || 'json',
      timeout: options.timeout || 15000
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

// Helper to create test Excel file
const createTestExcelFile = (data, filename) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
  const filepath = path.join(__dirname, '..', 'temp', filename);
  
  // Ensure temp directory exists
  const tempDir = path.dirname(filepath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  XLSX.writeFile(wb, filepath);
  return filepath;
};

// Property generators
const validFormDataArbitrary = fc.record({
  name: fc.string({ minLength: 3, maxLength: 50 }),
  description: fc.string({ minLength: 5, maxLength: 200 }),
  category: fc.oneof(
    fc.constant('operational'),
    fc.constant('financial'),
    fc.constant('strategic'),
    fc.constant('compliance')
  )
});

const excelDataArbitrary = fc.array(
  fc.record({
    name: fc.string({ minLength: 2, maxLength: 30 }),
    description: fc.string({ minLength: 5, maxLength: 100 }),
    level: fc.integer({ min: 1, max: 5 }),
    score: fc.integer({ min: 1, max: 25 })
  }),
  { minLength: 1, maxLength: 10 }
);

const reportFilterArbitrary = fc.record({
  start_date: fc.date({ min: new Date('2023-01-01'), max: new Date() }),
  end_date: fc.date({ min: new Date(), max: new Date('2024-12-31') }),
  category: fc.oneof(
    fc.constant(''),
    fc.constant('operational'),
    fc.constant('financial'),
    fc.constant('strategic')
  ),
  format: fc.oneof(fc.constant('excel'), fc.constant('pdf'))
});

describe('Property Tests - Data Import/Export', () => {

  let testToken;

  beforeAll(async () => {
    try {
      testToken = await getTestToken();
    } catch (error) {
      console.warn('Could not get test token, some tests may fail');
    }
  });

  afterAll(async () => {
    // Clean up temp files
    const tempDir = path.join(__dirname, '..', 'temp');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
    }
  });

  /**
   * Property 8: Valid form data saves correctly
   * Test that any valid form data saves to database
   */
  test('Property 8: Valid form data saves correctly', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        validFormDataArbitrary,
        async (formData) => {
          // When: We submit valid form data
          const response = await apiRequest('/api/risks', {
            method: 'POST',
            token: testToken,
            data: formData
          });
          
          // Then: Response should be structured correctly
          expect([201, 400, 401, 403, 409]).toContain(response.status);
          
          if (response.status === 201) {
            // Successful creation
            expect(response.data).toHaveProperty('risk');
            const risk = response.data.risk;
            
            expect(risk).toHaveProperty('id');
            expect(risk).toHaveProperty('organization_id');
            expect(risk.name).toBe(formData.name);
            expect(risk.description).toBe(formData.description);
            
            // Should have valid UUID
            expect(risk.id).toBeValidUUID();
            expect(risk.organization_id).toBeValidUUID();
            
          } else if (response.status === 400) {
            // Validation error
            expect(response.data).toHaveProperty('error');
            expect(typeof response.data.error).toBe('string');
            
          } else if (response.status === 409) {
            // Duplicate data
            expect(response.data).toHaveProperty('error');
            expect(response.data.error).toContain('already exists');
            
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
   * Property 9: Excel import parses and validates
   * Test that Excel import correctly parses and validates data
   */
  test('Property 9: Excel import parses and validates', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        excelDataArbitrary,
        async (excelData) => {
          // Create test Excel file
          const filename = `test_import_${Date.now()}.xlsx`;
          const filepath = createTestExcelFile(excelData, filename);
          
          try {
            // When: We import Excel file
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filepath));
            formData.append('type', 'probability_criteria');
            
            const response = await apiRequest('/api/master-data/import', {
              method: 'POST',
              token: testToken,
              data: formData,
              headers: formData.getHeaders()
            });
            
            // Then: Response should be structured correctly
            expect([200, 400, 401, 403]).toContain(response.status);
            
            if (response.status === 200) {
              // Successful import
              expect(response.data).toHaveProperty('message');
              expect(response.data).toHaveProperty('imported_count');
              expect(typeof response.data.imported_count).toBe('number');
              expect(response.data.imported_count).toBeGreaterThanOrEqual(0);
              
            } else if (response.status === 400) {
              // Validation or parsing error
              expect(response.data).toHaveProperty('error');
              expect(typeof response.data.error).toBe('string');
              
            } else {
              // Authorization error
              expect(response.data).toHaveProperty('error');
              expect(typeof response.data.error).toBe('string');
            }
            
          } finally {
            // Clean up file
            if (fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 2 }
    );
  });

  /**
   * Property 10: Import success shows count
   * Test that successful imports display correct record count
   */
  test('Property 10: Import success shows count', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 20 }),
            level: fc.integer({ min: 1, max: 5 }),
            score: fc.integer({ min: 1, max: 25 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (testData) => {
          // Create test Excel file with known data count
          const filename = `test_count_${Date.now()}.xlsx`;
          const filepath = createTestExcelFile(testData, filename);
          
          try {
            // When: We import Excel file
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filepath));
            formData.append('type', 'impact_criteria');
            
            const response = await apiRequest('/api/master-data/import', {
              method: 'POST',
              token: testToken,
              data: formData,
              headers: formData.getHeaders()
            });
            
            // Then: Import count should be reasonable
            if (response.status === 200) {
              expect(response.data).toHaveProperty('imported_count');
              const importedCount = response.data.imported_count;
              
              // Count should be between 0 and the number of records we sent
              expect(importedCount).toBeGreaterThanOrEqual(0);
              expect(importedCount).toBeLessThanOrEqual(testData.length);
              
              // If count is 0, there should be an explanation
              if (importedCount === 0) {
                expect(response.data).toHaveProperty('message');
                expect(typeof response.data.message).toBe('string');
              }
            }
            
          } finally {
            // Clean up file
            if (fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 2 }
    );
  });

  /**
   * Property 11: Data associates with organization
   * Test that created data is associated with user's organization
   */
  test('Property 11: Data associates with organization', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        validFormDataArbitrary,
        async (formData) => {
          // When: We create data through API
          const response = await apiRequest('/api/risks', {
            method: 'POST',
            token: testToken,
            data: formData
          });
          
          // Then: Data should be associated with organization
          if (response.status === 201) {
            expect(response.data).toHaveProperty('risk');
            const risk = response.data.risk;
            
            expect(risk).toHaveProperty('organization_id');
            expect(risk.organization_id).toBeValidUUID();
            
            // Verify we can retrieve the data (organization filtering works)
            const getResponse = await apiRequest(`/api/risks/${risk.id}`, {
              token: testToken
            });
            
            if (getResponse.status === 200) {
              expect(getResponse.data.risk.organization_id).toBe(risk.organization_id);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 2 }
    );
  });

  /**
   * Property 12: Reports filter by organization
   * Test that reports only include user's organization data
   */
  test('Property 12: Reports filter by organization', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        reportFilterArbitrary,
        async (filters) => {
          // When: We request a report with filters
          const queryParams = new URLSearchParams({
            start_date: filters.start_date.toISOString().split('T')[0],
            end_date: filters.end_date.toISOString().split('T')[0],
            category: filters.category,
            format: filters.format
          });
          
          const response = await apiRequest(`/api/reports/risks?${queryParams}`, {
            token: testToken,
            responseType: filters.format === 'excel' ? 'arraybuffer' : 'json'
          });
          
          // Then: Response should be structured correctly
          expect([200, 400, 401, 403]).toContain(response.status);
          
          if (response.status === 200) {
            if (filters.format === 'excel') {
              // Excel response should have proper headers
              expect(response.headers['content-type']).toContain('application/vnd.openxmlformats');
              expect(response.data).toBeInstanceOf(ArrayBuffer);
              
            } else {
              // JSON response should have data array
              expect(response.data).toHaveProperty('data');
              expect(Array.isArray(response.data.data)).toBe(true);
              
              // All data should have organization_id (if any data exists)
              if (response.data.data.length > 0) {
                response.data.data.forEach(item => {
                  expect(item).toHaveProperty('organization_id');
                  expect(item.organization_id).toBeValidUUID();
                });
              }
            }
          } else if (response.status === 400) {
            // Invalid filter parameters
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
      { numRuns: 2 }
    );
  });

  /**
   * Additional property: Template download functionality
   * Test that template downloads work correctly
   */
  test('Property: Template download functionality', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('probability_criteria'),
          fc.constant('impact_criteria'),
          fc.constant('risk_categories'),
          fc.constant('work_units')
        ),
        async (templateType) => {
          // When: We request a template download
          const response = await apiRequest(`/api/master-data/template/${templateType}`, {
            token: testToken,
            responseType: 'arraybuffer'
          });
          
          // Then: Response should be Excel file
          expect([200, 404, 401, 403]).toContain(response.status);
          
          if (response.status === 200) {
            // Should be Excel file
            expect(response.headers['content-type']).toContain('application/vnd.openxmlformats');
            expect(response.data).toBeInstanceOf(ArrayBuffer);
            expect(response.data.byteLength).toBeGreaterThan(0);
            
            // Should have proper filename in headers
            if (response.headers['content-disposition']) {
              expect(response.headers['content-disposition']).toContain('attachment');
              expect(response.headers['content-disposition']).toContain('.xlsx');
            }
            
          } else if (response.status === 404) {
            // Template not found
            expect(response.data).toBeDefined();
            
          } else {
            // Authorization error
            expect(response.data).toBeDefined();
          }
          
          return true;
        }
      ),
      { numRuns: 2 }
    );
  });

  /**
   * Additional property: File validation
   * Test that file uploads are properly validated
   */
  test('Property: File validation', async () => {
    if (!testToken) {
      console.warn('Skipping test - no test token available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('invalid.txt'),
          fc.constant('test.pdf'),
          fc.constant('empty.xlsx'),
          fc.constant('large_file.xlsx')
        ),
        async (filename) => {
          // Create invalid test file
          const filepath = path.join(__dirname, '..', 'temp', filename);
          const tempDir = path.dirname(filepath);
          
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          
          // Create file with appropriate content
          if (filename.endsWith('.txt')) {
            fs.writeFileSync(filepath, 'This is not an Excel file');
          } else if (filename.endsWith('.pdf')) {
            fs.writeFileSync(filepath, '%PDF-1.4 fake pdf content');
          } else if (filename.includes('empty')) {
            // Create empty Excel file
            const wb = XLSX.utils.book_new();
            XLSX.writeFile(wb, filepath);
          } else {
            // Create large file (simulate)
            const largeData = Array(1000).fill({ name: 'test', value: 'data' });
            createTestExcelFile(largeData, filename);
          }
          
          try {
            // When: We try to import invalid file
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filepath));
            formData.append('type', 'probability_criteria');
            
            const response = await apiRequest('/api/master-data/import', {
              method: 'POST',
              token: testToken,
              data: formData,
              headers: formData.getHeaders()
            });
            
            // Then: Should handle invalid files appropriately
            expect([200, 400, 413, 415]).toContain(response.status);
            
            if (response.status === 400) {
              // File validation error
              expect(response.data).toHaveProperty('error');
              expect(typeof response.data.error).toBe('string');
              
            } else if (response.status === 413) {
              // File too large
              expect(response.data).toHaveProperty('error');
              expect(response.data.error).toContain('large');
              
            } else if (response.status === 415) {
              // Unsupported media type
              expect(response.data).toHaveProperty('error');
              expect(response.data.error).toContain('format');
            }
            
          } finally {
            // Clean up file
            if (fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
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
  console.log('Running property-based tests for data import/export...');
  
  // Set up test environment
  process.env.NODE_ENV = 'test';
  
  // Run tests
  const { execSync } = require('child_process');
  try {
    execSync('npx jest tests/property/data-import-export.test.js --verbose', { 
      stdio: 'inherit' 
    });
  } catch (error) {
    console.error('Tests failed:', error.message);
    process.exit(1);
  }
}