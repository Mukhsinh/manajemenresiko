// Test individual route loading
console.log('🔍 Testing Route Loading...\n');

// Test loading each route file individually
const routes = [
  'auth',
  'pengaturan', 
  'master-data',
  'rencana-strategis',
  'dashboard'
];

for (const routeName of routes) {
  try {
    console.log(`Loading route: ${routeName}...`);
    const route = require(`./routes/${routeName}`);
    console.log(`✅ ${routeName} loaded successfully`);
  } catch (error) {
    console.log(`❌ ${routeName} failed to load:`, error.message);
    console.log('   Stack:', error.stack.split('\n')[1]);
  }
}

// Test if the issue is with the middleware
console.log('\n🔍 Testing middleware loading...');
try {
  const auth = require('./middleware/auth');
  console.log('✅ Auth middleware loaded');
} catch (error) {
  console.log('❌ Auth middleware failed:', error.message);
}

// Test if the issue is with Supabase config
console.log('\n🔍 Testing Supabase config...');
try {
  const { supabase, supabaseAdmin } = require('./config/supabase');
  console.log('✅ Supabase config loaded');
  console.log('📊 Supabase client:', !!supabase);
  console.log('📊 Supabase admin:', !!supabaseAdmin);
} catch (error) {
  console.log('❌ Supabase config failed:', error.message);
}

// Test creating a simple express router like pengaturan
console.log('\n🔍 Testing simple router creation...');
try {
  const express = require('express');
  const router = express.Router();
  
  router.get('/', (req, res) => {
    res.json({ message: 'Test route working' });
  });
  
  console.log('✅ Simple router created successfully');
  console.log('📊 Router type:', typeof router);
} catch (error) {
  console.log('❌ Simple router creation failed:', error.message);
}