/**
 * Simple test for initialization timing performance
 * **Feature: router-initialization-fix, Property 5: Initialization timing performance**
 * **Validates: Requirements 3.1**
 */

// Mock dependencies
const mockDependencies = {
    SPARouter: class MockSPARouter {
        constructor(routes, options) {
            this.routes = routes;
            this.options = options;
            this.destroyed = false;
        }
        destroy() {
            this.destroyed = true;
        }
        navigate(url) {
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
        '/login': { handler: 'login', auth: false }
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

async function testTimingPerformance() {
    console.log('Testing initialization timing performance...');
    console.log('RouterManager available:', !!RouterManager);
    
    if (!RouterManager) {
        console.error('RouterManager not available');
        return false;
    }
    
    try {
        const testRuns = 5;
        const timings = [];
        
        for (let i = 0; i < testRuns; i++) {
            console.log(`\n=== Test run ${i + 1}/${testRuns} ===`);
            
            // Reset for each test
            if (RouterManager.instance) {
                RouterManager.instance.destroy();
            }
            
            const manager = RouterManager.getInstance();
            const startTime = Date.now();
            
            const result = await manager.initialize();
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            timings.push(duration);
            
            console.log(`Initialization result: ${result}`);
            console.log(`Duration: ${duration}ms`);
            
            // Verify initialization completed
            const isReady = manager.isInitialized();
            if (!isReady) {
                console.error(`Test run ${i + 1} failed: initialization not completed`);
                return false;
            }
        }
        
        console.log('\n=== Performance Analysis ===');
        console.log('All timings:', timings);
        
        // All timings should be under 2000ms (2 seconds)
        const allWithinTimeout = timings.every(timing => timing < 2000);
        console.log('All within 2000ms timeout:', allWithinTimeout);
        
        // Average timing should be reasonable (under 1 second for normal cases)
        const averageTiming = timings.reduce((sum, timing) => sum + timing, 0) / timings.length;
        const averageReasonable = averageTiming < 1000;
        console.log(`Average timing: ${averageTiming.toFixed(2)}ms`);
        console.log('Average under 1000ms:', averageReasonable);
        
        // Check for consistency (no timing should be more than 3x the average, but allow for very fast timings)
        const maxTiming = Math.max(...timings);
        const minTiming = Math.min(...timings);
        const consistencyCheck = averageTiming === 0 ? true : (maxTiming < (averageTiming * 3) || maxTiming < 10); // Allow very fast timings
        console.log(`Max timing: ${maxTiming}ms`);
        console.log(`Min timing: ${minTiming}ms`);
        console.log('Consistency check (max < 3x average or very fast):', consistencyCheck);
        
        const allTestsPassed = allWithinTimeout && averageReasonable && consistencyCheck;
        
        if (allTestsPassed) {
            console.log('\n✅ Initialization timing performance test PASSED');
            return true;
        } else {
            console.log('\n❌ Initialization timing performance test FAILED');
            return false;
        }
        
    } catch (error) {
        console.error('Test error:', error);
        return false;
    }
}

// Run the test
testTimingPerformance().then(result => {
    process.exit(result ? 0 : 1);
}).catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
});