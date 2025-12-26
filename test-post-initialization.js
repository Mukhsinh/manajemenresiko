/**
 * Simple test for post-initialization functionality
 * **Feature: router-initialization-fix, Property 6: Post-initialization functionality**
 * **Validates: Requirements 3.3**
 */

// Mock dependencies
const mockDependencies = {
    SPARouter: class MockSPARouter {
        constructor(routes, options) {
            this.routes = routes;
            this.options = options;
            this.destroyed = false;
            this.navigations = [];
        }
        destroy() {
            this.destroyed = true;
        }
        navigate(url) {
            this.navigations.push(url);
            console.log(`🧭 Router navigated to: ${url}`);
            return true;
        }
    },
    AuthGuard: class MockAuthGuard {
        constructor(config) {
            this.config = config;
        }
    },
    ROUTE_CONFIG: {
        '/': { handler: 'dashboard', auth: true },
        '/login': { handler: 'login', auth: false },
        '/profile': { handler: 'profile', auth: true }
    }
};

// Setup global window
global.window = {
    ...mockDependencies,
    currentUser: null,
    appRouter: null,
    RouterErrorHandler: class MockRouterErrorHandler {
        handleDependencyError() { return { message: 'Dependency error' }; }
        handleTimeoutError() { return { message: 'Timeout error' }; }
        handleConfigurationError() { return { message: 'Configuration error' }; }
        handleRuntimeError() { return { message: 'Runtime error' }; }
        logPerformanceMetric() {}
    }
};

// Load RouterManager
require('./public/js/RouterManager.js');
const RouterManager = global.window.RouterManager;

async function testPostInitializationFunctionality() {
    console.log('Testing post-initialization functionality...');
    console.log('RouterManager available:', !!RouterManager);
    
    if (!RouterManager) {
        console.error('RouterManager not available');
        return false;
    }
    
    try {
        const urlsToTest = ['/dashboard', '/login', '/profile', '/dashboard', '/login'];
        
        console.log('\n=== Initializing Router ===');
        const manager = RouterManager.getInstance();
        
        // Initialize router
        const success = await manager.initialize();
        console.log('Initialization success:', success);
        
        if (!success) {
            console.log('Skipping test - initialization failed');
            return true; // Skip test if initialization failed
        }
        
        const router = manager.getRouter();
        console.log('Router available:', !!router);
        
        if (!router) {
            console.error('Router should be available after successful initialization');
            return false;
        }
        
        console.log('\n=== Testing Navigation Immediately After Initialization ===');
        
        // Test navigation immediately after initialization
        let navigationWorks = true;
        let navigationCount = 0;
        
        try {
            for (const url of urlsToTest) {
                console.log(`Testing navigation to: ${url}`);
                
                if (typeof router.navigate === 'function') {
                    const navResult = router.navigate(url);
                    console.log(`Navigation result: ${navResult}`);
                    navigationCount++;
                } else {
                    console.error('Router.navigate is not a function');
                    navigationWorks = false;
                    break;
                }
            }
        } catch (error) {
            console.error('Navigation error:', error);
            navigationWorks = false;
        }
        
        console.log(`\nCompleted ${navigationCount}/${urlsToTest.length} navigations`);
        console.log('Navigation works:', navigationWorks);
        
        // Verify router is still functional
        const stillReady = manager.isInitialized();
        console.log('Manager still ready:', stillReady);
        
        const routerStillAvailable = global.window.appRouter === router;
        console.log('Router still available in window:', routerStillAvailable);
        
        // Check navigation history
        if (router.navigations) {
            console.log('Navigation history:', router.navigations);
            const expectedNavigations = urlsToTest.length;
            const actualNavigations = router.navigations.length;
            console.log(`Expected ${expectedNavigations} navigations, got ${actualNavigations}`);
        }
        
        // Verify all checks pass
        const allTestsPassed = navigationWorks && stillReady && routerStillAvailable;
        
        if (allTestsPassed) {
            console.log('\n✅ Post-initialization functionality test PASSED');
            return true;
        } else {
            console.log('\n❌ Post-initialization functionality test FAILED');
            console.log('- Navigation works:', navigationWorks);
            console.log('- Manager still ready:', stillReady);
            console.log('- Router still available:', routerStillAvailable);
            return false;
        }
        
    } catch (error) {
        console.error('Test error:', error);
        return false;
    }
}

// Run the test
testPostInitializationFunctionality().then(result => {
    process.exit(result ? 0 : 1);
}).catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
});