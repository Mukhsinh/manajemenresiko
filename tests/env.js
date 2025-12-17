/**
 * Environment configuration for tests
 */

require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Ensure required environment variables are set
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
  console.warn('Some tests may fail without proper configuration.');
}

// Test-specific configuration
process.env.TEST_TOKEN = process.env.TEST_TOKEN || process.env.SUPABASE_ANON_KEY;