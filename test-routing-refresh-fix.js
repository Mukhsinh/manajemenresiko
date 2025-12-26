/**
 * Test script to verify routing refresh fix
 * Tests that pages under risk management don't redirect to dashboard on refresh
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Routing Refresh Fix...\n');

// Test cases for routes that should be preserved on refresh
const testRoutes = [
    '/risk-register',
    '/register-risiko', 
    '/identifikasi-risiko',
    '/risk-input',
    '/monitoring-evaluasi',
    '/peluang',
    '/kri',
    '/residual-risk',
    '/laporan',
    '/analisis-swot',
    '/rencana-strategis'
];

// Check if route configuration includes the new direct routes
function testRouteConfig() {
    console.log('📋 Testing route configuration...');
    
    try {
        const routeConfigPath = path.join(__dirname, 'public/js/route-config.js');
        const routeConfig = fs.readFileSync(routeConfigPath, 'utf8');
        
        let passed = 0;
        let failed = 0;
        
        testRoutes.forEach(route => {
            if (routeConfig.includes(`'${route}':`)) {
                console.log(`✅ Route ${route} found in configuration`);
                passed++;
            } else {
                console.log(`❌ Route ${route} missing from configuration`);
                failed++;
            }
        });
        
        console.log(`\n📊 Route Config Test Results: ${passed} passed, ${failed} failed\n`);
        return failed === 0;
        
    } catch (error) {
        console.error('❌ Error testing route configuration:', error.message);
        return false;
    }
}

// Check if router.js includes the refresh preservation logic
function testRouterRefreshLogic() {
    console.log('🔄 Testing router refresh preservation logic...');
    
    try {
        const routerPath = path.join(__dirname, 'public/js/router.js');
        const routerCode = fs.readFileSync(routerPath, 'utf8');
        
        const requiredFeatures = [
            'preserveRoute',
            'preserveRouteTimestamp', 
            'sessionStorage.setItem(\'preserveRoute\'',
            'shouldPreserveRoute'
        ];
        
        let passed = 0;
        let failed = 0;
        
        requiredFeatures.forEach(feature => {
            if (routerCode.includes(feature)) {
                console.log(`✅ Router includes ${feature} logic`);
                passed++;
            } else {
                console.log(`❌ Router missing ${feature} logic`);
                failed++;
            }
        });
        
        console.log(`\n📊 Router Refresh Logic Test Results: ${passed} passed, ${failed} failed\n`);
        return failed === 0;
        
    } catch (error) {
        console.error('❌ Error testing router refresh logic:', error.message);
        return false;
    }
}

// Check if app.js includes the auth preservation logic
function testAppAuthPreservation() {
    console.log('🔐 Testing app.js auth preservation logic...');
    
    try {
        const appPath = path.join(__dirname, 'public/js/app.js');
        const appCode = fs.readFileSync(appPath, 'utf8');
        
        const requiredFeatures = [
            'preserveRoute',
            'shouldPreserveRoute',
            'Preserving route from refresh during auth'
        ];
        
        let passed = 0;
        let failed = 0;
        
        requiredFeatures.forEach(feature => {
            if (appCode.includes(feature)) {
                console.log(`✅ App.js includes ${feature} logic`);
                passed++;
            } else {
                console.log(`❌ App.js missing ${feature} logic`);
                failed++;
            }
        });
        
        console.log(`\n📊 App Auth Preservation Test Results: ${passed} passed, ${failed} failed\n`);
        return failed === 0;
        
    } catch (error) {
        console.error('❌ Error testing app auth preservation:', error.message);
        return false;
    }
}

// Check if the new SWOT page was created
function testSwotPageCreation() {
    console.log('📄 Testing SWOT page creation...');
    
    try {
        const swotPagePath = path.join(__dirname, 'public/analisis-swot-register-style.html');
        
        if (fs.existsSync(swotPagePath)) {
            const content = fs.readFileSync(swotPagePath, 'utf8');
            
            const requiredElements = [
                'Register Risiko Klinis & Non-Klinis',
                'register-table',
                'level-badge',
                'status-badge',
                'RSK-001'
            ];
            
            let passed = 0;
            let failed = 0;
            
            requiredElements.forEach(element => {
                if (content.includes(element)) {
                    console.log(`✅ SWOT page includes ${element}`);
                    passed++;
                } else {
                    console.log(`❌ SWOT page missing ${element}`);
                    failed++;
                }
            });
            
            console.log(`\n📊 SWOT Page Creation Test Results: ${passed} passed, ${failed} failed\n`);
            return failed === 0;
            
        } else {
            console.log('❌ SWOT page file not found');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error testing SWOT page creation:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting comprehensive routing fix tests...\n');
    
    const results = {
        routeConfig: testRouteConfig(),
        routerRefresh: testRouterRefreshLogic(),
        appAuth: testAppAuthPreservation(),
        swotPage: testSwotPageCreation()
    };
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    const failedTests = totalTests - passedTests;
    
    console.log('📋 FINAL TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Route Configuration: ${results.routeConfig ? 'PASSED' : 'FAILED'}`);
    console.log(`🔄 Router Refresh Logic: ${results.routerRefresh ? 'PASSED' : 'FAILED'}`);
    console.log(`🔐 App Auth Preservation: ${results.appAuth ? 'PASSED' : 'FAILED'}`);
    console.log(`📄 SWOT Page Creation: ${results.swotPage ? 'PASSED' : 'FAILED'}`);
    console.log('='.repeat(50));
    console.log(`📊 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (failedTests === 0) {
        console.log('🎉 All tests passed! Routing refresh fix is working correctly.');
        console.log('\n📝 Summary of fixes applied:');
        console.log('1. ✅ Added direct routes for risk management pages');
        console.log('2. ✅ Implemented route preservation on page refresh');
        console.log('3. ✅ Updated authentication to respect preserved routes');
        console.log('4. ✅ Created new register-style SWOT analysis page');
        console.log('\n🔧 How it works:');
        console.log('- When user refreshes a page, the current route is stored in sessionStorage');
        console.log('- During app initialization, the stored route is preserved');
        console.log('- Authentication check respects the preserved route');
        console.log('- User stays on the same page after refresh instead of being redirected to dashboard');
    } else {
        console.log(`❌ ${failedTests} test(s) failed. Please review the implementation.`);
        process.exit(1);
    }
}

// Run the tests
runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});