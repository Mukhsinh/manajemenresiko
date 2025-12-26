/**
 * Router-specific test setup without server dependency
 */

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Setup test environment without server check
beforeAll(async () => {
  console.log('Router test setup complete');
});

afterAll(async () => {
  console.log('Router test teardown complete');
});