/**
 * Unit tests for Router Error Handling
 * Tests error scenarios and recovery mechanisms
 */

describe('RouterErrorHandler Unit Tests', () => {
    let RouterErrorHandler;
    let errorHandler;
    
    beforeEach(() => {
        // Load RouterErrorHandler
        delete require.cache[require.resolve('../../public/js/RouterErrorHandler.js')];
        require('../../public/js/RouterErrorHandler.js');
        RouterErrorHandler = global.window.RouterErrorHandler;
        errorHandler = new RouterErrorHandler();
        
        // Mock console methods
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    describe('Dependency Missing Errors', () => {
        test('should handle single missing dependency', () => {
            const error = errorHandler.handleDependencyError(['SPARouter'], 1, 5);
            
            expect(error.category).toBe('dependency');
            expect(error.severity).toBe('warning');
            expect(error.message).toContain('SPARouter');
            expect(error.userMessage).toContain('still loading');
            expect(error.recovery.action).toBe('retry');
        });
        
        test('should handle multiple missing dependencies', () => {
            const error = errorHandler.handleDependencyError(['SPARouter', 'AuthGuard'], 2, 5);
            
            expect(error.message).toContain('SPARouter, AuthGuard');
            expect(error.details.missingDependencies).toEqual(['SPARouter', 'AuthGuard']);
        });
        
        test('should escalate to critical when max retries reached', () => {
            const error = errorHandler.handleDependencyError(['SPARouter'], 5, 5);
            
            expect(error.severity).toBe('critical');
        });
    });
    
    describe('Timeout Errors', () => {
        test('should handle timeout error', () => {
            const error = errorHandler.handleTimeoutError(3000, 2000);
            
            expect(error.category).toBe('timeout');
            expect(error.severity).toBe('error');
            expect(error.message).toContain('3000ms');
            expect(error.message).toContain('2000ms');
            expect(error.userMessage).toContain('longer than expected');
            expect(error.recovery.action).toBe('fallback');
        });
    });
    
    describe('Configuration Errors', () => {
        test('should handle configuration error', () => {
            const originalError = new Error('Invalid route config');
            const config = { invalid: true };
            
            const error = errorHandler.handleConfigurationError(originalError, config);
            
            expect(error.category).toBe('configuration');
            expect(error.severity).toBe('error');
            expect(error.message).toContain('Invalid route config');
            expect(error.details.config).toEqual(config);
            expect(error.userMessage).toContain('configuration issue');
        });
    });
    
    describe('Runtime Errors', () => {
        test('should handle runtime error', () => {
            const originalError = new Error('Router creation failed');
            const context = 'initialization';
            
            const error = errorHandler.handleRuntimeError(originalError, context);
            
            expect(error.category).toBe('runtime');
            expect(error.severity).toBe('critical');
            expect(error.message).toContain('initialization');
            expect(error.message).toContain('Router creation failed');
            expect(error.userMessage).toContain('unexpected error');
        });
    });
    
    describe('Performance Metrics', () => {
        test('should log performance metrics', () => {
            errorHandler.logPerformanceMetric('router_init', 150, true);
            errorHandler.logPerformanceMetric('router_init', 200, false);
            
            const stats = errorHandler.getErrorStatistics();
            
            expect(stats.performance.router_init).toBeDefined();
            expect(stats.performance.router_init.count).toBe(2);
            expect(stats.performance.router_init.successRate).toBe(50);
            expect(stats.performance.router_init.averageDuration).toBe(175);
        });
        
        test('should limit performance metrics to 100 entries', () => {
            // Add 150 metrics
            for (let i = 0; i < 150; i++) {
                errorHandler.logPerformanceMetric('test_op', i, true);
            }
            
            const stats = errorHandler.getErrorStatistics();
            expect(stats.performance.test_op.count).toBe(100);
        });
    });
    
    describe('Error Statistics', () => {
        test('should track error statistics', () => {
            errorHandler.handleDependencyError(['SPARouter'], 1, 5);
            errorHandler.handleTimeoutError(3000, 2000);
            errorHandler.handleRuntimeError(new Error('Test'), 'test');
            
            const stats = errorHandler.getErrorStatistics();
            
            expect(stats.totalErrors).toBe(2); // timeout and runtime are errors
            expect(stats.totalWarnings).toBe(1); // dependency is warning
            expect(stats.errorsByCategory.timeout).toBe(1);
            expect(stats.errorsByCategory.runtime).toBe(1);
        });
        
        test('should only count recent errors (within 1 hour)', () => {
            // Mock old timestamp
            const oldError = errorHandler.handleRuntimeError(new Error('Old'), 'test');
            oldError.details.timestamp = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
            
            // Add recent error
            errorHandler.handleTimeoutError(3000, 2000);
            
            const stats = errorHandler.getErrorStatistics();
            expect(stats.totalErrors).toBe(1); // Only recent error
        });
    });
    
    describe('Error Logging', () => {
        test('should log warnings correctly', () => {
            errorHandler.handleDependencyError(['SPARouter'], 1, 5);
            
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('[DEPENDENCY]'),
                expect.any(Object)
            );
        });
        
        test('should log errors correctly', () => {
            errorHandler.handleTimeoutError(3000, 2000);
            
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('[TIMEOUT]'),
                expect.any(Object)
            );
        });
        
        test('should log critical errors correctly', () => {
            errorHandler.handleRuntimeError(new Error('Critical'), 'test');
            
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('CRITICAL'),
                expect.any(Object)
            );
        });
    });
    
    describe('User-Friendly Messages', () => {
        test('should provide appropriate user messages for each error type', () => {
            const depError = errorHandler.handleDependencyError(['SPARouter'], 1, 5);
            const timeoutError = errorHandler.handleTimeoutError(3000, 2000);
            const configError = errorHandler.handleConfigurationError(new Error('Config'), {});
            const runtimeError = errorHandler.handleRuntimeError(new Error('Runtime'), 'test');
            
            expect(depError.userMessage).toContain('still loading');
            expect(timeoutError.userMessage).toContain('longer than expected');
            expect(configError.userMessage).toContain('configuration issue');
            expect(runtimeError.userMessage).toContain('unexpected error');
        });
    });
    
    describe('Recovery Strategies', () => {
        test('should provide appropriate recovery strategies', () => {
            const depError = errorHandler.handleDependencyError(['SPARouter'], 1, 5);
            const timeoutError = errorHandler.handleTimeoutError(3000, 2000);
            
            expect(depError.recovery.action).toBe('retry');
            expect(timeoutError.recovery.action).toBe('fallback');
        });
    });
    
    describe('Metrics Cleanup', () => {
        test('should clear all metrics', () => {
            errorHandler.handleRuntimeError(new Error('Test'), 'test');
            errorHandler.logPerformanceMetric('test', 100, true);
            
            errorHandler.clearMetrics();
            
            const stats = errorHandler.getErrorStatistics();
            expect(stats.totalErrors).toBe(0);
            expect(stats.totalWarnings).toBe(0);
            expect(Object.keys(stats.performance)).toHaveLength(0);
        });
    });
});

describe('RouterManager Error Integration Tests', () => {
    let RouterManager;
    let mockDependencies;
    
    beforeEach(() => {
        // Mock dependencies
        mockDependencies = {
            SPARouter: class MockSPARouter {
                constructor(routes, options) {
                    this.routes = routes;
                    this.options = options;
                }
                destroy() {}
            },
            AuthGuard: class MockAuthGuard {
                constructor(config) {
                    this.config = config;
                }
            },
            ROUTE_CONFIG: {
                '/': { handler: 'dashboard', auth: true }
            },
            RouterErrorHandler: require('../../public/js/RouterErrorHandler.js').RouterErrorHandler || global.window.RouterErrorHandler
        };
        
        global.window = {
            ...mockDependencies,
            currentUser: null,
            appRouter: null
        };
        
        // Load RouterManager
        delete require.cache[require.resolve('../../public/js/RouterManager.js')];
        require('../../public/js/RouterManager.js');
        RouterManager = global.window.RouterManager;
    });
    
    afterEach(() => {
        if (RouterManager.instance) {
            RouterManager.instance.destroy();
        }
    });
    
    test('should handle missing dependencies with error handler', async () => {
        delete global.window.SPARouter;
        
        const manager = RouterManager.getInstance();
        manager.config.maxRetries = 2;
        
        const result = await manager.initialize();
        
        expect(result).toBe(false);
        expect(manager.getState().status).toBe('failed');
        
        const lastError = manager.getLastError();
        expect(lastError).toBeDefined();
        expect(lastError.category).toBe('dependency');
    });
    
    test('should handle configuration errors', async () => {
        global.window.ROUTE_CONFIG = null; // Invalid config
        
        const manager = RouterManager.getInstance();
        const result = await manager.initialize();
        
        expect(result).toBe(false);
        const lastError = manager.getLastError();
        expect(lastError.category).toBe('configuration');
    });
    
    test('should track performance metrics', async () => {
        const manager = RouterManager.getInstance();
        await manager.initialize();
        
        const stats = manager.getErrorStatistics();
        expect(stats.performance.router_initialization).toBeDefined();
        expect(stats.performance.router_initialization.count).toBe(1);
        expect(stats.performance.router_initialization.successRate).toBe(100);
    });
});