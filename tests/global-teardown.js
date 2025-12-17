/**
 * Global teardown for Jest tests
 */

module.exports = async () => {
  console.log('🧹 Starting global test teardown...');
  
  // Cleanup any global resources
  // Close database connections, etc.
  
  console.log('✅ Global test teardown complete');
};