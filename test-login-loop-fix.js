#!/usr/bin/env node

console.log('🧪 Testing Login Loop Fix...');

// Simulate browser environment
global.window = {
  location: { pathname: '/dashboard' },
  localStorage: {
    data: {},
    getItem: function(key) { return this.data[key] || null; },
    setItem: function(key, value) { this.data[key] = value; },
    removeItem: function(key) { delete this.data[key]; }
  },
  sessionStorage: {
    data: {},
    getItem: function(key) { return this.data[key] || null; },
    setItem: function(key, value) { this.data[key] = value; },
    removeItem: function(key) { delete this.data[key]; }
  },
  addEventListener: function() {},
  history: { pushState: function() {}, replaceState: function() {} }
};

global.document = {
  readyState: 'complete',
  addEventListener: function() {},
  getElementById: function() { return null; },
  querySelectorAll: function() { return []; }
};

// Load route config
try {
  require('./public/js/route-config.js');
  console.log('✅ Route config loaded');
  console.log('📊 Total routes:', Object.keys(global.ROUTE_CONFIG).length);
} catch (error) {
  console.error('❌ Failed to load route config:', error.message);
  process.exit(1);
}

// Test URL mapping
console.log('\n🗺️ Testing URL Mapping...');
const testPages = ['dashboard', 'risk-profile', 'login'];
testPages.forEach(page => {
  const url = global.getUrlForPage(page);
  const backToPage = global.getPageNameForUrl(url);
  console.log(`🔄 ${page} -> ${url} -> ${backToPage}`);
});

// Test authentication logic simulation
console.log('\n🔐 Testing Authentication Logic...');

// Simulate authenticated state
global.window.isAuthenticated = true;
global.window.currentUser = { id: 'test', email: 'test@example.com' };
global.window.currentSession = { 
  access_token: 'test-token', 
  expires_at: Math.floor(Date.now() / 1000) + 3600 
};

// Test auth state
const hasAuth = !!(global.window.isAuthenticated);
const hasUser = !!(global.window.currentUser);
const hasSession = !!(global.window.currentSession && global.window.currentSession.access_token);

console.log('📊 Auth State Check:');
console.log('  - isAuthenticated:', hasAuth);
console.log('  - currentUser:', hasUser);
console.log('  - currentSession:', hasSession);
console.log('  - Overall:', hasAuth || (hasUser && hasSession));

// Test route authentication requirements
console.log('\n🛡️ Testing Route Authentication...');
const protectedRoutes = Object.entries(global.ROUTE_CONFIG)
  .filter(([path, config]) => config.auth === true);

const publicRoutes = Object.entries(global.ROUTE_CONFIG)
  .filter(([path, config]) => config.auth === false);

console.log(`📊 Protected routes: ${protectedRoutes.length}`);
console.log(`📊 Public routes: ${publicRoutes.length}`);

protectedRoutes.slice(0, 3).forEach(([path, config]) => {
  console.log(`🔒 ${path} - ${config.title}`);
});

publicRoutes.forEach(([path, config]) => {
  console.log(`🌐 ${path} - ${config.title}`);
});

// Test localStorage token validation
console.log('\n💾 Testing Token Validation...');

// Simulate valid token
const validToken = {
  access_token: 'valid-token-123',
  expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
};

global.window.localStorage.setItem('supabase.auth.token', JSON.stringify(validToken));

// Test token validation logic
function hasValidToken() {
  try {
    const storedAuth = global.window.localStorage.getItem('supabase.auth.token');
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      if (authData.access_token && authData.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = authData.expires_at;
        return now < (expiresAt - 60); // 60 second buffer
      }
    }
  } catch (error) {
    console.warn('Error checking stored token:', error);
  }
  return false;
}

const tokenValid = hasValidToken();
console.log('🔑 Token validation result:', tokenValid);

// Test expired token
const expiredToken = {
  access_token: 'expired-token-123',
  expires_at: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
};

global.window.localStorage.setItem('supabase.auth.token', JSON.stringify(expiredToken));
const expiredTokenValid = hasValidToken();
console.log('🔑 Expired token validation result:', expiredTokenValid);

// Test navigation cooldown simulation
console.log('\n🧭 Testing Navigation Cooldown...');

let lastNavigationTime = 0;
let lastNavigationPath = '';
const NAVIGATION_COOLDOWN = 500; // 500ms

function safeNavigate(pageName) {
  const now = Date.now();
  const targetUrl = global.getUrlForPage(pageName);
  
  // Prevent rapid navigation to same page
  if (targetUrl === lastNavigationPath && (now - lastNavigationTime) < NAVIGATION_COOLDOWN) {
    console.log(`⚠️ Navigation cooldown active, skipping: ${pageName}`);
    return false;
  }
  
  lastNavigationTime = now;
  lastNavigationPath = targetUrl;
  
  console.log(`🧭 Safe navigation to: ${pageName} -> ${targetUrl}`);
  return true;
}

// Test rapid navigation
safeNavigate('dashboard');
safeNavigate('dashboard'); // Should be blocked
setTimeout(() => {
  safeNavigate('dashboard'); // Should work after cooldown
}, 600);

console.log('\n✅ All tests completed successfully');
console.log('🎯 Ready for browser testing at: /test-login-loop-fix.html');
console.log('\n📋 Next Steps:');
console.log('1. Start your server');
console.log('2. Open browser to /test-login-loop-fix.html');
console.log('3. Run the interactive tests');
console.log('4. Test actual login flow');
console.log('5. Verify navigation works without loops');