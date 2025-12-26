/**
 * Test Router Implementation
 * Verifies that URL routing is working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Router Implementation...');

// Test 1: Check if all router files exist
console.log('\n📁 Checking router files...');
const requiredFiles = [
    'public/js/router.js',
    'public/js/route-config.js',
    'public/js/router-integration.js',
    'public/js/404-handler.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} - EXISTS`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('❌ Some router files are missing!');
    process.exit(1);
}

// Test 2: Check route configuration
console.log('\n🗺️ Testing route configuration...');
try {
    // Simulate browser environment
    global.window = {
        location: { pathname: '/dashboard' },
        history: { pushState: () => {}, replaceState: () => {} },
        addEventListener: () => {},
        console: console
    };
    global.console = console;
    
    // Load route config
    const routeConfigContent = fs.readFileSync('public/js/route-config.js', 'utf8');
    
    // Execute the route config (remove console.log to avoid noise)
    eval(routeConfigContent.replace(/console\.log\([^)]*\);?/g, ''));
    
    // Check if variables are defined
    if (typeof ROUTE_CONFIG === 'undefined') {
        throw new Error('ROUTE_CONFIG not defined after loading route-config.js');
    }
    
    if (typeof getUrlForPage === 'undefined') {
        throw new Error('getUrlForPage function not defined after loading route-config.js');
    }
    
    // Test route configuration
    const testRoutes = [
        { page: 'dashboard', expectedUrl: '/dashboard' },
        { page: 'visi-misi', expectedUrl: '/visi-misi' },
        { page: 'risk-input', expectedUrl: '/manajemen-risiko/input-data' },
        { page: 'risk-profile', expectedUrl: '/manajemen-risiko/risk-profile' },
        { page: 'laporan', expectedUrl: '/laporan' }
    ];
    
    console.log(`📊 Total routes configured: ${Object.keys(ROUTE_CONFIG).length}`);
    
    let routeTestsPassed = 0;
    testRoutes.forEach(test => {
        const actualUrl = getUrlForPage(test.page);
        if (actualUrl === test.expectedUrl) {
            console.log(`✅ ${test.page} -> ${actualUrl}`);
            routeTestsPassed++;
        } else {
            console.log(`❌ ${test.page} -> Expected: ${test.expectedUrl}, Got: ${actualUrl}`);
        }
    });
    
    console.log(`📈 Route tests passed: ${routeTestsPassed}/${testRoutes.length}`);
    
    if (routeTestsPassed !== testRoutes.length) {
        console.log('❌ Route configuration has issues!');
        process.exit(1);
    }
    
} catch (error) {
    console.log('❌ Error testing route configuration:', error.message);
    process.exit(1);
}

// Test 3: Check index.html script loading
console.log('\n📜 Checking script loading in index.html...');
try {
    const indexContent = fs.readFileSync('public/index.html', 'utf8');
    
    const requiredScripts = [
        'js/router.js',
        'js/route-config.js',
        'js/router-integration.js',
        'js/404-handler.js'
    ];
    
    let scriptsLoaded = 0;
    requiredScripts.forEach(script => {
        if (indexContent.includes(script)) {
            console.log(`✅ ${script} - LOADED`);
            scriptsLoaded++;
        } else {
            console.log(`❌ ${script} - NOT LOADED`);
        }
    });
    
    console.log(`📈 Scripts loaded: ${scriptsLoaded}/${requiredScripts.length}`);
    
    if (scriptsLoaded !== requiredScripts.length) {
        console.log('❌ Some router scripts are not loaded in index.html!');
        process.exit(1);
    }
    
} catch (error) {
    console.log('❌ Error checking index.html:', error.message);
    process.exit(1);
}

// Test 4: Check server.js SPA routing
console.log('\n🖥️ Checking server.js SPA routing...');
try {
    const serverContent = fs.readFileSync('server.js', 'utf8');
    
    if (serverContent.includes("app.get('*'") && serverContent.includes('index.html')) {
        console.log('✅ SPA routing configured in server.js');
    } else {
        console.log('❌ SPA routing not found in server.js');
        process.exit(1);
    }
    
} catch (error) {
    console.log('❌ Error checking server.js:', error.message);
    process.exit(1);
}

console.log('\n🎉 All router tests passed!');
console.log('✅ Router implementation is ready');
console.log('\n📋 Next steps:');
console.log('1. Start the server: npm start');
console.log('2. Open browser to http://localhost:3000');
console.log('3. Login and check if URLs change when navigating');
console.log('4. Test browser back/forward buttons');
console.log('5. Test direct URL access (e.g., http://localhost:3000/visi-misi)');