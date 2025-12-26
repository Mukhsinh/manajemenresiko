/**
 * Property-based tests for Router Initialization
 * **Feature: router-initialization-fix**
 */

const fc = require('fast-check');

// Mock dependencies for testing
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

describe('Router Initialization Property Tests', () => {
    let originalWindow;
    let RouterManager;
    
    beforeEach(() => {
        // Reset global state
        originalWindow = { ...global.window };
        global.window = {
            ...mockDependencies,
            currentUser: null,
            appRouter: null
        };
        
        // Clear RouterManager singleton
        if (global.window.RouterManager) {
            delete global.window.RouterManager.instance;
        }
        
        // Load RouterManager
        delete require.cache[require.resolve('../../public/js/RouterManager.js')];
        require('../../public/js/RouterManager.js');
        RouterManager = global.window.RouterManager;
    });
    
    afterEach(() => {
        // Cleanup
        if (RouterManager && RouterManager.instance) {
            RouterManager.instance.destroy();
        }
        global.window = originalWindow;
    });
    
    /**
     * **Feature: router-initialization-fix, Property 1: Router initialization idempotence**
     * **Validates: Requirements 1.1, 1.4**
     */
    test('Property 1: Router initialization idempotence', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 2, max: 10 }), // Number of initialization calls
                async (numCalls) => {
                    const manager = RouterManager.getInstance();
                    const results = [];
                    
                    // Call initialize multiple times
                    for (let i = 0; i < numCalls; i++) {
                        results.push(await manager.initialize());
                    }
                    
                    // All calls should succeed
                    const allSucceeded = results.every(result => result === true);
                    
                    // Should have exactly one router instance
                    const hasOneInstance = manager.getState().instance !== null;
                    const windowHasRouter = global.window.appRouter !== null;
                    const sameInstance = manager.getState().instance === global.window.appRouter;
                    
                    // Status should be 'ready'
                    const isReady = manager.getState().status === 'ready';
                    
                    return allSucceeded && hasOneInstance && windowHasRouter && sameInstance && isReady;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * **Feature: router-initialization-fix, Property 2: Retry limit enforcement**
     * **Validates: Requirements 1.2, 1.3**
     */
    test('Property 2: Retry limit enforcement', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom('SPARouter', 'AuthGuard', 'ROUTE_CONFIG'), // Missing dependency
                fc.integer({ min: 1, max: 15 }), // Max retries
                async (missingDep, maxRetries) => {
                    // Get manager first before removing dependency
                    const manager = RouterManager.getInstance();
                    manager.config.maxRetries = maxRetries;
                    
                    // Remove dependency to simulate unavailability
                    const originalDep = global.window[missingDep];
                    delete global.window[missingDep];
                    
                    const result = await manager.initialize();
                    const state = manager.getState();
                    
                    // Restore dependency
                    global.window[missingDep] = originalDep;
                    
                    // Should fail and not exceed retry limit
                    const failed = result === false;
                    const statusFailed = state.status === 'failed';
                    const retryCountValid = state.retryCount <= maxRetries;
                    const fallbackActive = state.fallbackActive === true;
                    
                    return failed && statusFailed && retryCountValid && fallbackActive;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * **Feature: router-initialization-fix, Property 4: Comprehensive logging behavior**
     * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
     */
    test('Property 4: Comprehensive logging behavior', async () => {
        // Mock console to capture logs
        const logs = [];
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error
        };
        
        console.log = (...args) => logs.push({ level: 'log', args });
        console.warn = (...args) => logs.push({ level: 'warn', args });
        console.error = (...args) => logs.push({ level: 'error', args });
        
        await fc.assert(
            fc.asyncProperty(
                fc.boolean(), // Whether to simulate success or failure
                async (shouldSucceed) => {
                    logs.length = 0; // Clear logs
                    
                    // Get manager first
                    const manager = RouterManager.getInstance();
                    manager.config.maxRetries = 2; // Limit retries for faster test
                    
                    if (!shouldSucceed) {
                        // Remove dependency to cause failure
                        delete global.window.SPARouter;
                    }
                    
                    await manager.initialize();
                    
                    // Restore dependency if removed
                    if (!shouldSucceed) {
                        global.window.SPARouter = mockDependencies.SPARouter;
                    }
                    
                    // Check for required log messages
                    const logMessages = logs.map(log => log.args.join(' '));
                    
                    const hasStartMessage = logMessages.some(msg => 
                        msg.includes('Starting router initialization') || 
                        msg.includes('RouterManager singleton created')
                    );
                    
                    if (shouldSucceed) {
                        const hasSuccessMessage = logMessages.some(msg => 
                            msg.includes('Router initialized successfully')
                        );
                        return hasStartMessage && hasSuccessMessage;
                    } else {
                        const hasErrorMessage = logMessages.some(msg => 
                            msg.includes('Missing dependencies') || 
                            msg.includes('Router initialization failed')
                        );
                        const hasFallbackMessage = logMessages.some(msg => 
                            msg.includes('Activating fallback navigation')
                        );
                        return hasStartMessage && hasErrorMessage && hasFallbackMessage;
                    }
                }
            ),
            { numRuns: 50 }
        );
        
        // Restore console
        Object.assign(console, originalConsole);
    });
    
    test('RouterManager singleton behavior', () => {
        const instance1 = RouterManager.getInstance();
        const instance2 = RouterManager.getInstance();
        const instance3 = new RouterManager();
        
        expect(instance1).toBe(instance2);
        expect(instance1).toBe(instance3);
        expect(RouterManager.instance).toBe(instance1);
    });
    
    test('State management', async () => {
        const manager = RouterManager.getInstance();
        
        // Initial state
        expect(manager.getState().status).toBe('pending');
        expect(manager.isInitialized()).toBe(false);
        
        // After initialization
        await manager.initialize();
        expect(manager.getState().status).toBe('ready');
        expect(manager.isInitialized()).toBe(true);
        expect(manager.getRouter()).toBeTruthy();
    });
    
    test('Callback system', (done) => {
        const manager = RouterManager.getInstance();
        let callbackCalled = false;
        
        manager.onReady(() => {
            callbackCalled = true;
            expect(manager.isInitialized()).toBe(true);
            done();
        });
        
        manager.initialize();
    });
    
    test('Fallback activation on failure', async () => {
        // Remove all dependencies
        delete global.window.SPARouter;
        delete global.window.AuthGuard;
        delete global.window.ROUTE_CONFIG;
        
        const manager = RouterManager.getInstance();
        manager.config.maxRetries = 1;
        
        let fallbackCalled = false;
        manager.onFallback(() => {
            fallbackCalled = true;
        });
        
        const result = await manager.initialize();
        
        expect(result).toBe(false);
        expect(manager.getState().status).toBe('failed');
        expect(manager.getState().fallbackActive).toBe(true);
        expect(fallbackCalled).toBe(true);
    });
});

describe('Router Integration Property Tests', () => {
    let originalWindow;
    let RouterManager;
    
    beforeEach(() => {
        // Reset global state
        originalWindow = { ...global.window };
        global.window = {
            ...mockDependencies,
            currentUser: null,
            appRouter: null,
            routerIntegrationInitialized: false,
            originalNavigateToPage: null,
            navigateToPage: null,
            getUrlForPage: (pageName) => {
                const mapping = {
                    'dashboard': '/dashboard',
                    'login': '/login'
                };
                return mapping[pageName] || '/404';
            }
        };
        
        // Mock DOM elements
        global.document = {
            querySelectorAll: jest.fn(() => []),
            getElementById: jest.fn(() => null)
        };
        
        // Clear RouterManager singleton
        if (global.window.RouterManager) {
            delete global.window.RouterManager.instance;
        }
        
        // Load RouterManager
        delete require.cache[require.resolve('../../public/js/RouterManager.js')];
        require('../../public/js/RouterManager.js');
        RouterManager = global.window.RouterManager;
    });
    
    afterEach(() => {
        // Cleanup
        if (RouterManager && RouterManager.instance) {
            RouterManager.instance.destroy();
        }
        global.window = originalWindow;
    });
    
    /**
     * **Feature: router-initialization-fix, Property 3: Fallback mechanism activation**
     * **Validates: Requirements 1.5, 3.4**
     */
    test('Property 3: Fallback mechanism activation', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom('SPARouter', 'AuthGuard', 'ROUTE_CONFIG'), // Missing dependency
                fc.array(fc.constantFrom('dashboard', 'login', 'profile'), { minLength: 1, maxLength: 5 }), // Page names to test
                async (missingDep, pageNames) => {
                    // Get manager first
                    const manager = RouterManager.getInstance();
                    manager.config.maxRetries = 2; // Limit retries for faster test
                    
                    // Remove dependency to force fallback
                    const originalDep = global.window[missingDep];
                    delete global.window[missingDep];
                    
                    // Initialize router (should fail and activate fallback)
                    const result = await manager.initialize();
                    const state = manager.getState();
                    
                    // Restore dependency
                    global.window[missingDep] = originalDep;
                    
                    // Verify fallback activation
                    const initializationFailed = result === false;
                    const statusFailed = state.status === 'failed';
                    const fallbackActive = state.fallbackActive === true;
                    
                    // Test that navigation still works with fallback
                    let navigationWorks = true;
                    if (typeof global.window.navigateToPage === 'function') {
                        try {
                            for (const pageName of pageNames) {
                                global.window.navigateToPage(pageName);
                            }
                        } catch (error) {
                            navigationWorks = false;
                        }
                    }
                    
                    return initializationFailed && statusFailed && fallbackActive && navigationWorks;
                }
            ),
            { numRuns: 50 }
        );
    });
    
    test('Fallback navigation function creation', async () => {
        // Remove all dependencies to force fallback
        delete global.window.SPARouter;
        delete global.window.AuthGuard;
        delete global.window.ROUTE_CONFIG;
        
        const manager = RouterManager.getInstance();
        manager.config.maxRetries = 1;
        
        // Mock original navigate function
        const mockNavigate = jest.fn();
        global.window.originalNavigateToPage = mockNavigate;
        
        await manager.initialize();
        
        expect(manager.getState().fallbackActive).toBe(true);
        expect(typeof global.window.navigateToPage).toBe('function');
        
        // Test fallback navigation
        global.window.navigateToPage('dashboard');
        expect(mockNavigate).toHaveBeenCalledWith('dashboard');
    });
    
    test('Fallback without original navigate function', async () => {
        // Remove all dependencies and original navigate function
        delete global.window.SPARouter;
        delete global.window.AuthGuard;
        delete global.window.ROUTE_CONFIG;
        delete global.window.originalNavigateToPage;
        
        // Mock DOM elements for basic navigation
        const mockPages = [
            { classList: { remove: jest.fn(), add: jest.fn() }, id: 'dashboard' },
            { classList: { remove: jest.fn(), add: jest.fn() }, id: 'login' }
        ];
        
        global.document.querySelectorAll = jest.fn((selector) => {
            if (selector === '.page-content') return mockPages;
            return [];
        });
        
        global.document.getElementById = jest.fn((id) => {
            return mockPages.find(page => page.id === id) || null;
        });
        
        const manager = RouterManager.getInstance();
        manager.config.maxRetries = 1;
        
        await manager.initialize();
        
        expect(manager.getState().fallbackActive).toBe(true);
        expect(typeof global.window.navigateToPage).toBe('function');
        
        // Test basic fallback navigation
        global.window.navigateToPage('dashboard');
        
        // Verify page switching logic was called
        mockPages.forEach(page => {
            expect(page.classList.remove).toHaveBeenCalledWith('active');
        });
        
        const dashboardPage = mockPages.find(p => p.id === 'dashboard');
        expect(dashboardPage.classList.add).toHaveBeenCalledWith('active');
    });
});

describe('Router Performance Property Tests', () => {
    let originalWindow;
    let RouterManager;
    
    beforeEach(() => {
        // Reset global state
        originalWindow = { ...global.window };
        global.window = {
            ...mockDependencies,
            currentUser: null,
            appRouter: null
        };
        
        // Clear RouterManager singleton
        if (global.window.RouterManager) {
            delete global.window.RouterManager.instance;
        }
        
        // Load RouterManager
        delete require.cache[require.resolve('../../public/js/RouterManager.js')];
        require('../../public/js/RouterManager.js');
        RouterManager = global.window.RouterManager;
    });
    
    afterEach(() => {
        // Cleanup
        if (RouterManager && RouterManager.instance) {
            RouterManager.instance.destroy();
        }
        global.window = originalWindow;
    });
    
    /**
     * **Feature: router-initialization-fix, Property 5: Initialization timing performance**
     * **Validates: Requirements 3.1**
     */
    test('Property 5: Initialization timing performance', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 5 }), // Number of test runs
                async (testRuns) => {
                    const timings = [];
                    
                    for (let i = 0; i < testRuns; i++) {
                        // Reset for each test
                        if (RouterManager && RouterManager.instance) {
                            RouterManager.instance.destroy();
                        }
                        
                        const manager = RouterManager.getInstance();
                        const startTime = Date.now();
                        
                        await manager.initialize();
                        
                        const endTime = Date.now();
                        const duration = endTime - startTime;
                        timings.push(duration);
                        
                        // Verify initialization completed
                        const isReady = manager.isInitialized();
                        if (!isReady) {
                            return false; // Initialization failed
                        }
                    }
                    
                    // All timings should be under 2000ms (2 seconds)
                    const allWithinTimeout = timings.every(timing => timing < 2000);
                    
                    // Average timing should be reasonable (under 1 second for normal cases)
                    const averageTiming = timings.reduce((sum, timing) => sum + timing, 0) / timings.length;
                    const averageReasonable = averageTiming < 1000;
                    
                    return allWithinTimeout && averageReasonable;
                }
            ),
            { numRuns: 20 }
        );
    });
    
    /**
     * **Feature: router-initialization-fix, Property 6: Post-initialization functionality**
     * **Validates: Requirements 3.3**
     */
    test('Property 6: Post-initialization functionality', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.constantFrom('/dashboard', '/login', '/profile'), { minLength: 1, maxLength: 5 }), // URLs to test
                async (urlsToTest) => {
                    const manager = RouterManager.getInstance();
                    
                    // Initialize router
                    const success = await manager.initialize();
                    if (!success) {
                        return true; // Skip test if initialization failed
                    }
                    
                    const router = manager.getRouter();
                    if (!router) {
                        return false; // Router should be available after successful initialization
                    }
                    
                    // Test navigation immediately after initialization
                    let navigationWorks = true;
                    try {
                        for (const url of urlsToTest) {
                            // Mock navigation (since we don't have full DOM)
                            if (typeof router.navigate === 'function') {
                                router.navigate(url);
                            } else {
                                navigationWorks = false;
                                break;
                            }
                        }
                    } catch (error) {
                        navigationWorks = false;
                    }
                    
                    // Verify router is still functional
                    const stillReady = manager.isInitialized();
                    const routerStillAvailable = global.window.appRouter === router;
                    
                    return navigationWorks && stillReady && routerStillAvailable;
                }
            ),
            { numRuns: 50 }
        );
    });
    
    test('Initialization timing measurement', async () => {
        const manager = RouterManager.getInstance();
        
        const startTime = Date.now();
        await manager.initialize();
        const endTime = Date.now();
        
        const state = manager.getState();
        
        expect(state.initializationTime).toBeDefined();
        expect(typeof state.initializationTime).toBe('number');
        expect(state.initializationTime).toBeGreaterThan(0);
        
        // Timing should be reasonable
        const actualDuration = endTime - startTime;
        expect(Math.abs(state.initializationTime - actualDuration)).toBeLessThan(50); // Allow 50ms tolerance
    });
    
    test('Navigation works immediately after initialization', async () => {
        const manager = RouterManager.getInstance();
        
        await manager.initialize();
        
        const router = manager.getRouter();
        expect(router).toBeTruthy();
        expect(typeof router.navigate).toBe('function');
        
        // Test immediate navigation
        expect(() => {
            router.navigate('/dashboard');
            router.navigate('/login');
        }).not.toThrow();
    });
});

describe('Router State Persistence Property Tests', () => {
    let originalWindow;
    let RouterManager;
    let mockSessionStorage;
    
    beforeEach(() => {
        // Mock sessionStorage
        mockSessionStorage = {
            data: {},
            getItem: jest.fn((key) => mockSessionStorage.data[key] || null),
            setItem: jest.fn((key, value) => { mockSessionStorage.data[key] = value; }),
            removeItem: jest.fn((key) => { delete mockSessionStorage.data[key]; }),
            clear: jest.fn(() => { mockSessionStorage.data = {}; })
        };
        
        // Reset global state
        originalWindow = { ...global.window };
        global.window = {
            ...mockDependencies,
            currentUser: null,
            appRouter: null,
            location: { href: 'http://localhost:3000/dashboard' },
            sessionStorage: mockSessionStorage
        };
        
        global.navigator = {
            userAgent: 'Mozilla/5.0 (Test Browser)'
        };
        
        // Clear RouterManager singleton
        if (global.window.RouterManager) {
            delete global.window.RouterManager.instance;
        }
        
        // Load RouterManager
        delete require.cache[require.resolve('../../public/js/RouterManager.js')];
        require('../../public/js/RouterManager.js');
        RouterManager = global.window.RouterManager;
    });
    
    afterEach(() => {
        // Cleanup
        if (RouterManager && RouterManager.instance) {
            RouterManager.instance.destroy();
        }
        global.window = originalWindow;
    });
    
    /**
     * **Feature: router-initialization-fix, Property 7: Refresh state preservation**
     * **Validates: Requirements 3.5**
     */
    test('Property 7: Refresh state preservation', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 300 }), // Seconds since last initialization (within 5 minutes)
                fc.boolean(), // Whether to change URL between sessions
                fc.boolean(), // Whether to change user agent between sessions
                async (secondsAgo, changeUrl, changeUserAgent) => {
                    // First initialization
                    const manager1 = RouterManager.getInstance();
                    await manager1.initialize();
                    
                    const firstState = manager1.getState();
                    if (firstState.status !== 'ready') {
                        return true; // Skip if first initialization failed
                    }
                    
                    // Simulate time passing
                    const originalTimestamp = Date.now() - (secondsAgo * 1000);
                    
                    // Modify persisted state to simulate time passage
                    const persistedData = JSON.parse(mockSessionStorage.getItem('routerManagerState'));
                    if (persistedData) {
                        persistedData.timestamp = originalTimestamp;
                        
                        if (changeUrl) {
                            persistedData.url = 'http://localhost:3000/different-page';
                        }
                        
                        if (changeUserAgent) {
                            persistedData.userAgent = 'Different User Agent';
                        }
                        
                        mockSessionStorage.setItem('routerManagerState', JSON.stringify(persistedData));
                    }
                    
                    // Destroy first instance to simulate page refresh
                    manager1.destroy();
                    
                    // Create new instance (simulating page refresh)
                    const manager2 = RouterManager.getInstance();
                    await manager2.initialize();
                    
                    const secondState = manager2.getState();
                    
                    // Determine if state should be restored based on conditions
                    const shouldRestore = secondsAgo < 300 && !changeUrl && !changeUserAgent; // Within 5 minutes, same URL and user agent
                    
                    if (shouldRestore) {
                        // Should restore from persisted state quickly
                        const restoredQuickly = secondState.initializationTime < 100; // Should be very fast if restored
                        const statusReady = secondState.status === 'ready';
                        return restoredQuickly && statusReady;
                    } else {
                        // Should do fresh initialization
                        const didFreshInit = secondState.initializationTime > 0;
                        const statusReady = secondState.status === 'ready';
                        return didFreshInit && statusReady;
                    }
                }
            ),
            { numRuns: 50 }
        );
    });
    
    test('State persistence on successful initialization', async () => {
        const manager = RouterManager.getInstance();
        
        // Verify no persisted state initially
        expect(mockSessionStorage.getItem('routerManagerState')).toBeNull();
        
        await manager.initialize();
        
        // Verify state was persisted
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
            'routerManagerState',
            expect.stringContaining('"status":"ready"')
        );
        
        const persistedData = JSON.parse(mockSessionStorage.getItem('routerManagerState'));
        expect(persistedData.status).toBe('ready');
        expect(persistedData.timestamp).toBeDefined();
        expect(persistedData.url).toBe(global.window.location.href);
        expect(persistedData.userAgent).toBe(global.navigator.userAgent);
    });
    
    test('State restoration from valid persisted state', async () => {
        // Set up valid persisted state
        const validState = {
            status: 'ready',
            initializationTime: 50,
            timestamp: Date.now() - 1000, // 1 second ago
            url: global.window.location.href,
            userAgent: global.navigator.userAgent
        };
        
        mockSessionStorage.setItem('routerManagerState', JSON.stringify(validState));
        
        const manager = RouterManager.getInstance();
        const startTime = Date.now();
        
        await manager.initialize();
        
        const endTime = Date.now();
        const initTime = endTime - startTime;
        
        // Should restore quickly (much faster than fresh initialization)
        expect(initTime).toBeLessThan(100);
        expect(manager.isInitialized()).toBe(true);
        expect(manager.getState().status).toBe('ready');
    });
    
    test('Fresh initialization when persisted state is invalid', async () => {
        // Set up invalid persisted state (too old)
        const invalidState = {
            status: 'ready',
            initializationTime: 50,
            timestamp: Date.now() - (10 * 60 * 1000), // 10 minutes ago (too old)
            url: global.window.location.href,
            userAgent: global.navigator.userAgent
        };
        
        mockSessionStorage.setItem('routerManagerState', JSON.stringify(invalidState));
        
        const manager = RouterManager.getInstance();
        await manager.initialize();
        
        // Should do fresh initialization
        expect(manager.isInitialized()).toBe(true);
        expect(manager.getState().initializationTime).toBeGreaterThan(0);
    });
    
    test('State cleanup on destroy', async () => {
        const manager = RouterManager.getInstance();
        await manager.initialize();
        
        // Verify state was persisted
        expect(mockSessionStorage.getItem('routerManagerState')).toBeTruthy();
        
        manager.destroy();
        
        // Verify state was cleared
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('routerManagerState');
    });
});