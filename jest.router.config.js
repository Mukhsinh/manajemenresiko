module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup-router.js'],
  testMatch: ['**/tests/property/router-initialization.test.js'],
  collectCoverage: false,
  verbose: true,
  testTimeout: 30000,
  globalSetup: undefined,
  globalTeardown: undefined
};