/**
 * Global setup for Jest tests
 */

module.exports = async () => {
  console.log('🚀 Starting global test setup...');
  
  // Verify environment
  if (!process.env.SUPABASE_URL) {
    console.warn('⚠️  SUPABASE_URL not set - some tests may fail');
  }
  
  if (!process.env.SUPABASE_ANON_KEY) {
    console.warn('⚠️  SUPABASE_ANON_KEY not set - some tests may fail');
  }
  
  console.log('✅ Global test setup complete');
};