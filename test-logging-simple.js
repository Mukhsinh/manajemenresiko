/**
 * Simple test for comprehensive logging behavior
 * **Feature: router-initialization-fix, Property 4: Comprehensive logging behavior**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
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

async function testLoggingBehavior() {
    console.log('Testing comprehensive logging behavior...');
    console.log('RouterManager available:', !!RouterManager);
    
    if (!RouterManager) {
        console.error('RouterManager not available');
        return false;
    }
    
    // Mock console to capture logs
    const logs = [];
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error
    };
    
    console.log = (...args) => {
        originalConsole.log(...args); // Still log to console
        logs.push({ level: 'log', args });
    };
    console.warn = (...args) => {
        originalConsole.warn(...args);
        logs.push({ level: 'warn', args });
    };
    console.error = (...args) => {
        originalConsole.error(...args);
        logs.push({ level: 'error', args });
    };
    
    try {
        // Test successful initialization logging
        console.log('=== Testing successful initialization ===');
        logs.length = 0; // Clear logs
        
        const manager1 = RouterManager.getInstance();
        console.log('Manager1 created:', !!manager1);
        
        const result1 = await manager1.initialize();
        console.log('Initialize result1:', result1);
        
        const logMessages1 = logs.map(log => log.args.join(' '));
        console.log('Success logs:', logMessages1);
        
        const hasStartMessage1 = logMessages1.some(msg => 
            msg.includes('Starting router initialization') || 
            msg.includes('RouterManager singleton created')
        );
        
        const hasSuccessMessage1 = logMessages1.some(msg => 
            msg.includes('Router initialized successfully')
        );
        
        console.log('Has start message:', hasStartMessage1);
        console.log('Has success message:', hasSuccessMessage1);
        
        // Clean up
        if (manager1.destroy) {
            manager1.destroy();
        }
        
        // Test failed initialization logging
        console.log('=== Testing failed initialization ===');
        logs.length = 0; // Clear logs
        
        // Remove dependency to cause failure
        const originalSPARouter = global.window.SPARouter;
        delete global.window.SPARouter;
        
        const manager2 = RouterManager.getInstance();
        manager2.config.maxRetries = 2; // Limit retries for faster test
        
        const result2 = await manager2.initialize();
        console.log('Initialize result2:', result2);
        
        // Restore dependency
        global.window.SPARouter = originalSPARouter;
        
        const logMessages2 = logs.map(log => log.args.join(' '));
        console.log('Failure logs:', logMessages2);
        
        const hasStartMessage2 = logMessages2.some(msg => 
            msg.includes('Starting router initialization') || 
            msg.includes('RouterManager singleton created')
        );
        
        const hasErrorMessage2 = logMessages2.some(msg => 
            msg.includes('Missing dependencies') || 
            msg.includes('Router initialization failed') ||
            msg.includes('Router initialization error') ||
            msg.includes('initialization attempt') ||
            msg.includes('failed: Dependency error')
        );
        
        const hasFallbackMessage2 = logMessages2.some(msg => 
            msg.includes('Activating fallback navigation')
        );
        
        console.log('Has start message:', hasStartMessage2);
        console.log('Has error message:', hasErrorMessage2);
        console.log('Has fallback message:', hasFallbackMessage2);
        
        // Verify results
        const successTest = hasStartMessage1 && hasSuccessMessage1;
        const failureTest = hasStartMessage2 && hasErrorMessage2 && hasFallbackMessage2;
        
        console.log('Success test passed:', successTest);
        console.log('Failure test passed:', failureTest);
        
        if (successTest && failureTest) {
            console.log('✅ Comprehensive logging behavior test PASSED');
            return true;
        } else {
            console.log('❌ Comprehensive logging behavior test FAILED');
            return false;
        }
        
    } catch (error) {
        console.error('Test error:', error);
        return false;
    } finally {
        // Restore console
        Object.assign(console, originalConsole);
    }
}

// Run the test
testLoggingBehavior().then(result => {
    process.exit(result ? 0 : 1);
}).catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
});