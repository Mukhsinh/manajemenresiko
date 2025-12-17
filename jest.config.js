/**
 * Jest configuration for property-based testing
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Test timeout (increased for property-based tests)
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Environment variables
  setupFiles: ['<rootDir>/tests/env.js'],
  
  // Module paths
  moduleDirectories: ['node_modules', 'tests'],
  
  // Transform configuration
  transform: {},
  
  // Test results processor
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }]
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/global-setup.js',
  globalTeardown: '<rootDir>/tests/global-teardown.js'
};