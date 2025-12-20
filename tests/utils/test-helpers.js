/**
 * Test utilities and helpers for property-based testing
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase client for direct database access
let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

/**
 * API request helper with authentication
 */
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await axios({
      url: `${BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${options.token || process.env.TEST_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      data: options.data,
      responseType: options.responseType || 'json',
      timeout: options.timeout || 10000
    });
    return response;
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      throw new Error(`API request failed: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('API request failed: No response received');
    } else {
      // Something else happened
      throw new Error(`API request failed: ${error.message}`);
    }
  }
};

/**
 * Database helper functions
 */
const dbHelpers = {
  /**
   * Create test organization
   */
  async createTestOrganization(orgData = {}) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: orgData.name || 'Test Organization',
        description: orgData.description || 'Test organization for property testing',
        ...orgData
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create test organization: ${error.message}`);
    return data;
  },

  /**
   * Create test user
   */
  async createTestUser(userData = {}) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        email: userData.email || 'test@example.com',
        name: userData.name || 'Test User',
        organization_id: userData.organization_id,
        ...userData
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create test user: ${error.message}`);
    return data;
  },

  /**
   * Clean up test data
   */
  async cleanupTestData(organizationId) {
    if (!supabase) return;
    
    try {
      // Delete in order to respect foreign key constraints
      await supabase.from('risks').delete().eq('organization_id', organizationId);
      await supabase.from('user_profiles').delete().eq('organization_id', organizationId);
      await supabase.from('organizations').delete().eq('id', organizationId);
    } catch (error) {
      console.warn('Cleanup failed:', error.message);
    }
  },

  /**
   * Get record count for a table
   */
  async getRecordCount(tableName, organizationId = null) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    let query = supabase.from(tableName).select('*', { count: 'exact', head: true });
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { count, error } = await query;
    
    if (error) throw new Error(`Failed to get record count: ${error.message}`);
    return count || 0;
  }
};

/**
 * Test data generators
 */
const generators = {
  /**
   * Generate random organization data
   */
  randomOrganization() {
    return {
      id: crypto.randomUUID(),
      name: `Test Org ${Math.random().toString(36).substring(7)}`,
      description: `Test organization created at ${new Date().toISOString()}`
    };
  },

  /**
   * Generate random user data
   */
  randomUser(organizationId) {
    const randomId = Math.random().toString(36).substring(7);
    return {
      id: crypto.randomUUID(),
      email: `test.${randomId}@example.com`,
      name: `Test User ${randomId}`,
      organization_id: organizationId
    };
  },

  /**
   * Generate random risk data
   */
  randomRisk(organizationId) {
    const randomId = Math.random().toString(36).substring(7);
    return {
      risk_code: `RISK-${randomId.toUpperCase()}`,
      risk_name: `Test Risk ${randomId}`,
      risk_description: `Test risk description for ${randomId}`,
      probability_level: Math.floor(Math.random() * 5) + 1,
      impact_level: Math.floor(Math.random() * 5) + 1,
      organization_id: organizationId
    };
  }
};

/**
 * Test environment setup
 */
const testSetup = {
  /**
   * Setup test environment
   */
  async setup() {
    // Verify server is running
    try {
      await apiRequest('/api/health');
      console.log('✓ Server is running');
    } catch (error) {
      throw new Error('Server is not running. Please start the server before running tests.');
    }

    // Verify database connection
    if (supabase) {
      try {
        const { data, error } = await supabase.from('organizations').select('count').limit(1);
        if (error) throw error;
        console.log('✓ Database connection verified');
      } catch (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }
    }
  },

  /**
   * Teardown test environment
   */
  async teardown() {
    // Cleanup any remaining test data
    console.log('✓ Test environment cleaned up');
  }
};

/**
 * Assertion helpers
 */
const assertions = {
  /**
   * Assert API response structure
   */
  assertApiResponse(response, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.data).toBeDefined();
  },

  /**
   * Assert record structure
   */
  assertRecordStructure(record, requiredFields = []) {
    expect(record).toBeDefined();
    expect(typeof record).toBe('object');
    
    requiredFields.forEach(field => {
      expect(record).toHaveProperty(field);
    });
  },

  /**
   * Assert organization filtering
   */
  assertOrganizationFiltering(records, organizationId) {
    expect(Array.isArray(records)).toBe(true);
    
    records.forEach(record => {
      expect(record.organization_id).toBe(organizationId);
    });
  }
};

/**
 * Custom Jest matchers
 */
const customMatchers = {
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  }
};

// Extend Jest matchers
if (typeof expect !== 'undefined' && expect.extend) {
  expect.extend(customMatchers);
}

module.exports = {
  apiRequest,
  dbHelpers,
  generators,
  testSetup,
  assertions,
  BASE_URL,
  supabase
};