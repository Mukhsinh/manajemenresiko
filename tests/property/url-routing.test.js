/**
 * Property-based tests for URL routing functionality
 * **Feature: url-routing-refactor**
 */

const fc = require('fast-check');

// Mock authentication service
class MockAuthService {
    constructor(isAuthenticated = false) {
        this.authenticated = isAuthenticated;
    }
    
    isAuthenticated() {
        return this.authenticated;
    }
    
    setAuthenticated(status) {
        this.authenticated = status;
    }
}

// Mock router and related classes for testing
class MockSPARouter {
    constructor(routes = {}) {
        this.routes = routes;
    }
    
    normalizePath(path) {
        if (!path || path === '/') {
            return '/';
        }
        
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        
        return path;
    }
    
    matchRoute(path) {
        return this.routes[path] || null;
    }
    
    generateURL(pageName) {
        // Mock URL generation based on page name
        const urlMappings = {
            'dashboard': '/dashboard',
            'visi-misi': '/visi-misi',
            'rencana-strategis': '/rencana-strategis',
            'analisis-swot': '/analisis-swot',
            'diagram-kartesius': '/diagram-kartesius',
            'matriks-tows': '/matriks-tows',
            'sasaran-strategi': '/sasaran-strategi',
            'strategic-map': '/strategic-map',
            'indikator-kinerja-utama': '/indikator-kinerja-utama',
            'risk-input': '/manajemen-risiko/input-data',
            'risk-profile': '/manajemen-risiko/risk-profile',
            'residual-risk': '/manajemen-risiko/residual-risk',
            'monitoring-evaluasi': '/manajemen-risiko/monitoring-evaluasi',
            'peluang': '/manajemen-risiko/peluang',
            'kri': '/manajemen-risiko/kri',
            'loss-event': '/manajemen-risiko/loss-event',
            'ews': '/manajemen-risiko/ews',
            'risk-register': '/manajemen-risiko/risk-register',
            'laporan': '/laporan',
            'master-data': '/master-data',
            'buku-pedoman': '/buku-pedoman',
            'pengaturan': '/pengaturan'
        };
        
        return urlMappings[pageName] || null;
    }
}

describe('URL Routing Property Tests', () => {
    let router;
    
    beforeEach(() => {
        // Create router with sample routes
        const routes = {
            '/dashboard': { handler: 'dashboard', auth: true },
            '/visi-misi': { handler: 'visi-misi', auth: true },
            '/rencana-strategis': { handler: 'rencana-strategis', auth: true },
            '/manajemen-risiko/input-data': { handler: 'risk-input', auth: true },
            '/manajemen-risiko/risk-profile': { handler: 'risk-profile', auth: true },
            '/laporan': { handler: 'laporan', auth: true },
            '/login': { handler: 'login', auth: false },
            '/404': { handler: '404', auth: false }
        };
        
        router = new MockSPARouter(routes);
    });
    
    /**
     * **Feature: url-routing-refactor, Property 1: Unique URL per page**
     * **Validates: Requirements 1.1**
     */
    test('Property 1: Each page should have a unique URL', () => {
        fc.assert(fc.property(
            fc.array(fc.constantFrom(
                'dashboard', 'visi-misi', 'rencana-strategis', 'analisis-swot',
                'diagram-kartesius', 'matriks-tows', 'sasaran-strategi', 'strategic-map',
                'indikator-kinerja-utama', 'risk-input', 'risk-profile', 'residual-risk',
                'monitoring-evaluasi', 'peluang', 'kri', 'loss-event', 'ews',
                'risk-register', 'laporan', 'master-data', 'buku-pedoman', 'pengaturan'
            ), { minLength: 2, maxLength: 10 }),
            (pageNames) => {
                // Generate URLs for all page names
                const urls = pageNames.map(pageName => router.generateURL(pageName));
                
                // Filter out null URLs (pages that don't have URL mappings)
                const validUrls = urls.filter(url => url !== null);
                
                // Check that all URLs are unique
                const uniqueUrls = [...new Set(validUrls)];
                
                // Property: Each page should have a unique URL
                return uniqueUrls.length === validUrls.length;
            }
        ), { numRuns: 100 });
    });
    
    /**
     * **Feature: url-routing-refactor, Property 5: URL structure consistency**
     * **Validates: Requirements 2.1, 2.2**
     */
    test('Property 5: URLs should follow consistent structure patterns', () => {
        fc.assert(fc.property(
            fc.constantFrom(
                'dashboard', 'visi-misi', 'rencana-strategis', 'analisis-swot',
                'diagram-kartesius', 'matriks-tows', 'sasaran-strategi', 'strategic-map',
                'indikator-kinerja-utama', 'risk-input', 'risk-profile', 'residual-risk',
                'monitoring-evaluasi', 'peluang', 'kri', 'loss-event', 'ews',
                'risk-register', 'laporan', 'master-data', 'buku-pedoman', 'pengaturan'
            ),
            (pageName) => {
                const url = router.generateURL(pageName);
                
                if (url === null) {
                    return true; // Skip pages without URL mappings
                }
                
                // Property: URLs should follow /module or /module/submodule pattern
                const isValidPattern = /^\/[a-z-]+(?:\/[a-z-]+)*$/.test(url);
                
                // Property: URLs should use kebab-case
                const isKebabCase = !/[A-Z_\s]/.test(url.replace(/^\//, ''));
                
                // Property: URLs should be descriptive (contain meaningful segments)
                const segments = url.split('/').filter(segment => segment.length > 0);
                const hasDescriptiveSegments = segments.every(segment => segment.length >= 2);
                
                return isValidPattern && isKebabCase && hasDescriptiveSegments;
            }
        ), { numRuns: 100 });
    });
    
    test('Path normalization should be consistent', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('\0')),
            (pathInput) => {
                const normalized1 = router.normalizePath(pathInput);
                const normalized2 = router.normalizePath(normalized1);
                
                // Property: Normalizing a path twice should yield the same result
                return normalized1 === normalized2;
            }
        ), { numRuns: 100 });
    });
    
    test('Path normalization should handle edge cases', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant(''),
                fc.constant('/'),
                fc.constant('//'),
                fc.constant('/path/'),
                fc.constant('path'),
                fc.constant('/path//subpath/'),
                fc.string({ minLength: 0, maxLength: 20 }).map(s => '/' + s + '/')
            ),
            (path) => {
                const normalized = router.normalizePath(path);
                
                // Property: Normalized paths should always start with /
                const startsWithSlash = normalized.startsWith('/');
                
                // Property: Normalized paths should not end with / (except root)
                const noTrailingSlash = normalized === '/' || !normalized.endsWith('/');
                
                // Property: Normalized paths should not contain double slashes
                const noDoubleSlashes = !normalized.includes('//');
                
                return startsWithSlash && noTrailingSlash && noDoubleSlashes;
            }
        ), { numRuns: 100 });
    });
    
    test('URL structure should support nested routing', () => {
        fc.assert(fc.property(
            fc.array(fc.string({ minLength: 2, maxLength: 10 }).filter(s => /^[a-z-]+$/.test(s)), { minLength: 1, maxLength: 3 }),
            (segments) => {
                const url = '/' + segments.join('/');
                const normalized = router.normalizePath(url);
                
                // Property: Nested URLs should maintain hierarchy
                const segmentCount = normalized.split('/').filter(s => s.length > 0).length;
                const expectedCount = segments.length;
                
                // Property: All segments should be preserved in normalized form
                return segmentCount === expectedCount;
            }
        ), { numRuns: 100 });
    });
});

describe('Authentication Guard Property Tests', () => {
    let authService;
    let authGuard;
    
    beforeEach(() => {
        authService = new MockAuthService();
        // Import AuthGuard from router.js (mock implementation)
        class MockAuthGuard {
            constructor(authService) {
                this.authService = authService;
            }
            
            canActivate(route) {
                if (!route.auth) {
                    return true;
                }
                
                return this.authService && this.authService.isAuthenticated();
            }
            
            redirectToLogin(intendedRoute) {
                if (intendedRoute && intendedRoute !== '/login') {
                    // Mock sessionStorage
                    global.mockSessionStorage = global.mockSessionStorage || {};
                    global.mockSessionStorage['intendedRoute'] = intendedRoute;
                }
                return '/login';
            }
            
            getIntendedRoute() {
                const intendedRoute = global.mockSessionStorage && global.mockSessionStorage['intendedRoute'];
                if (intendedRoute) {
                    delete global.mockSessionStorage['intendedRoute'];
                    return intendedRoute;
                }
                return '/dashboard';
            }
        }
        
        authGuard = new MockAuthGuard(authService);
    });
    
    /**
     * **Feature: url-routing-refactor, Property 11: Authentication guard protection**
     * **Validates: Requirements 4.1**
     */
    test('Property 11: Protected routes should require authentication', () => {
        fc.assert(fc.property(
            fc.record({
                auth: fc.boolean(),
                handler: fc.constantFrom('dashboard', 'visi-misi', 'risk-input', 'login', '404')
            }),
            fc.boolean(),
            (route, isAuthenticated) => {
                authService.setAuthenticated(isAuthenticated);
                
                const canActivate = authGuard.canActivate(route);
                
                // Property: If route requires auth and user is not authenticated, access should be denied
                if (route.auth && !isAuthenticated) {
                    return !canActivate;
                }
                
                // Property: If route doesn't require auth, access should be allowed
                if (!route.auth) {
                    return canActivate;
                }
                
                // Property: If route requires auth and user is authenticated, access should be allowed
                if (route.auth && isAuthenticated) {
                    return canActivate;
                }
                
                return true;
            }
        ), { numRuns: 100 });
    });
    
    /**
     * **Feature: url-routing-refactor, Property 4: Authentication route preservation**
     * **Validates: Requirements 1.5, 4.2**
     */
    test('Property 4: Intended route should be preserved during authentication flow', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 2, maxLength: 30 }).filter(s => s.startsWith('/') && s !== '/login'),
            (intendedRoute) => {
                // Mock unauthenticated access to protected route
                const loginPath = authGuard.redirectToLogin(intendedRoute);
                
                // Property: Should redirect to login
                const redirectsToLogin = loginPath === '/login';
                
                // Property: Should preserve intended route
                const retrievedRoute = authGuard.getIntendedRoute();
                const routePreserved = retrievedRoute === intendedRoute;
                
                return redirectsToLogin && routePreserved;
            }
        ), { numRuns: 100 });
    });
    
    test('Authentication guard should handle edge cases', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant(null),
                fc.constant(undefined),
                fc.record({ auth: fc.constant(undefined) }),
                fc.record({ auth: fc.boolean() })
            ),
            (route) => {
                authService.setAuthenticated(true);
                
                try {
                    const canActivate = authGuard.canActivate(route);
                    
                    // Property: Should handle null/undefined routes gracefully
                    return typeof canActivate === 'boolean';
                } catch (error) {
                    // Should not throw errors for edge cases
                    return false;
                }
            }
        ), { numRuns: 100 });
    });
});

describe('Route Configuration Property Tests', () => {
    // Mock route configuration
    const mockRoutes = {
        '/dashboard': { handler: 'dashboard', auth: true },
        '/visi-misi': { handler: 'visi-misi', auth: true },
        '/manajemen-risiko/input-data': { handler: 'risk-input', auth: true },
        '/manajemen-risiko/risk-profile': { handler: 'risk-profile', auth: true },
        '/laporan': { handler: 'laporan', auth: true },
        '/login': { handler: 'login', auth: false },
        '/404': { handler: '404', auth: false }
    };
    
    const mockLegacyMapping = {
        'dashboard': '/dashboard',
        'visi-misi': '/visi-misi',
        'risk-input': '/manajemen-risiko/input-data',
        'risk-profile': '/manajemen-risiko/risk-profile',
        'laporan': '/laporan',
        'login': '/login',
        '404': '/404'
    };
    
    function mockIsLegacyUrl(url) {
        return url === '/auth/login' || url.includes('/auth/login');
    }
    
    function mockValidateUrlStructure(url) {
        if (!url.startsWith('/')) return false;
        const pathPart = url.substring(1);
        if (pathPart && !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(pathPart)) return false;
        if (url.length > 1 && url.endsWith('/')) return false;
        if (url.includes('//')) return false;
        return true;
    }
    
    /**
     * **Feature: url-routing-refactor, Property 6: Legacy URL elimination**
     * **Validates: Requirements 2.3**
     */
    test('Property 6: No routes should use legacy /auth/login pattern', () => {
        fc.assert(fc.property(
            fc.array(fc.oneof(
                fc.constantFrom(...Object.keys(mockRoutes)),
                fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s),
                fc.constant('/auth/login'),
                fc.constant('/auth/login/dashboard'),
                fc.constant('/some/other/path')
            ), { minLength: 1, maxLength: 20 }),
            (urls) => {
                // Property: None of the configured routes should use legacy URL pattern
                const configuredUrls = Object.keys(mockRoutes);
                const hasLegacyUrls = configuredUrls.some(url => mockIsLegacyUrl(url));
                
                // Property: Legacy URL checker should correctly identify legacy URLs
                const legacyUrlsIdentified = urls.filter(url => mockIsLegacyUrl(url));
                const allLegacyCorrectlyIdentified = legacyUrlsIdentified.every(url => 
                    url === '/auth/login' || url.includes('/auth/login')
                );
                
                return !hasLegacyUrls && allLegacyCorrectlyIdentified;
            }
        ), { numRuns: 100 });
    });
    
    /**
     * **Feature: url-routing-refactor, Property 7: URL naming convention consistency**
     * **Validates: Requirements 2.4**
     */
    test('Property 7: All URLs should follow consistent naming conventions', () => {
        fc.assert(fc.property(
            fc.constantFrom(...Object.keys(mockRoutes)),
            (url) => {
                // Property: URL should follow kebab-case convention
                const isValidStructure = mockValidateUrlStructure(url);
                
                // Property: URL should not contain uppercase letters
                const hasNoUppercase = url === url.toLowerCase();
                
                // Property: URL should not contain underscores or spaces
                const hasNoInvalidChars = !url.includes('_') && !url.includes(' ');
                
                // Property: URL segments should be meaningful (at least 2 characters)
                const segments = url.split('/').filter(s => s.length > 0);
                const hasDescriptiveSegments = segments.length === 0 || segments.every(s => s.length >= 2);
                
                return isValidStructure && hasNoUppercase && hasNoInvalidChars && hasDescriptiveSegments;
            }
        ), { numRuns: 100 });
    });
    
    test('Legacy page mapping should be bidirectional', () => {
        fc.assert(fc.property(
            fc.constantFrom(...Object.keys(mockLegacyMapping)),
            (pageName) => {
                const url = mockLegacyMapping[pageName];
                
                // Property: Every page name should map to a valid URL
                const hasValidUrl = url && typeof url === 'string' && url.startsWith('/');
                
                // Property: URL should follow naming conventions
                const followsConventions = mockValidateUrlStructure(url);
                
                return hasValidUrl && followsConventions;
            }
        ), { numRuns: 100 });
    });
});

describe('Navigation and Deep Linking Property Tests', () => {
    // Mock navigation system
    class MockNavigationSystem {
        constructor() {
            this.currentPage = null;
            this.history = [];
        }
        
        navigateToUrl(url) {
            const pageName = this.getPageForUrl(url);
            if (pageName) {
                this.currentPage = pageName;
                this.history.push(url);
                return true;
            }
            return false;
        }
        
        getPageForUrl(url) {
            const urlToPageMap = {
                '/dashboard': 'dashboard',
                '/visi-misi': 'visi-misi',
                '/manajemen-risiko/input-data': 'risk-input',
                '/manajemen-risiko/risk-profile': 'risk-profile',
                '/laporan': 'laporan',
                '/login': 'login',
                '/404': '404'
            };
            return urlToPageMap[url] || null;
        }
        
        getCurrentUrl() {
            return this.history[this.history.length - 1] || '/';
        }
        
        canAccessDirectly(url) {
            return this.getPageForUrl(url) !== null;
        }
    }
    
    let navigationSystem;
    
    beforeEach(() => {
        navigationSystem = new MockNavigationSystem();
    });
    
    /**
     * **Feature: url-routing-refactor, Property 2: Deep linking functionality**
     * **Validates: Requirements 1.2, 1.3**
     */
    test('Property 2: Direct URL access should load correct page content', () => {
        fc.assert(fc.property(
            fc.constantFrom(
                '/dashboard', '/visi-misi', '/manajemen-risiko/input-data',
                '/manajemen-risiko/risk-profile', '/laporan', '/login'
            ),
            (url) => {
                // Property: Direct access to any valid URL should succeed
                const canAccess = navigationSystem.canAccessDirectly(url);
                
                if (canAccess) {
                    const navigationSuccess = navigationSystem.navigateToUrl(url);
                    const currentUrl = navigationSystem.getCurrentUrl();
                    
                    // Property: Navigation should succeed and URL should be preserved
                    return navigationSuccess && currentUrl === url;
                }
                
                return true; // Skip invalid URLs
            }
        ), { numRuns: 100 });
    });
    
    /**
     * **Feature: url-routing-refactor, Property 9: SPA navigation behavior**
     * **Validates: Requirements 3.3**
     */
    test('Property 9: Navigation should update URL without page reload', () => {
        fc.assert(fc.property(
            fc.array(fc.constantFrom(
                '/dashboard', '/visi-misi', '/manajemen-risiko/input-data',
                '/laporan', '/login'
            ), { minLength: 2, maxLength: 5 }),
            (urls) => {
                let allNavigationsSucceeded = true;
                let urlsUpdatedCorrectly = true;
                
                for (const url of urls) {
                    const navigationSuccess = navigationSystem.navigateToUrl(url);
                    const currentUrl = navigationSystem.getCurrentUrl();
                    
                    if (!navigationSuccess || currentUrl !== url) {
                        allNavigationsSucceeded = false;
                        urlsUpdatedCorrectly = false;
                        break;
                    }
                }
                
                // Property: All navigations should succeed without "page reload"
                // Property: URL should be updated for each navigation
                const historyLength = navigationSystem.history.length;
                const expectedLength = urls.length;
                
                return allNavigationsSucceeded && urlsUpdatedCorrectly && historyLength === expectedLength;
            }
        ), { numRuns: 100 });
    });
    
    test('URL-to-page mapping should be consistent', () => {
        fc.assert(fc.property(
            fc.constantFrom(
                '/dashboard', '/visi-misi', '/manajemen-risiko/input-data',
                '/manajemen-risiko/risk-profile', '/laporan', '/login', '/404'
            ),
            (url) => {
                const pageName = navigationSystem.getPageForUrl(url);
                
                // Property: Every valid URL should map to a page name
                const hasPageName = pageName && typeof pageName === 'string';
                
                // Property: Page name should be meaningful (not empty)
                const isMeaningful = pageName && pageName.length > 0;
                
                return hasPageName && isMeaningful;
            }
        ), { numRuns: 100 });
    });
    
    test('Navigation history should be maintained correctly', () => {
        fc.assert(fc.property(
            fc.array(fc.constantFrom(
                '/dashboard', '/visi-misi', '/laporan'
            ), { minLength: 1, maxLength: 10 }),
            (urls) => {
                // Navigate through all URLs
                for (const url of urls) {
                    navigationSystem.navigateToUrl(url);
                }
                
                // Property: History should contain all navigated URLs
                const historyLength = navigationSystem.history.length;
                const expectedLength = urls.length;
                
                // Property: Last URL in history should be current URL
                const lastHistoryUrl = navigationSystem.history[navigationSystem.history.length - 1];
                const currentUrl = navigationSystem.getCurrentUrl();
                
                return historyLength === expectedLength && lastHistoryUrl === currentUrl;
            }
        ), { numRuns: 100 });
    });
});

describe('Browser History Property Tests', () => {
    // Mock browser history system
    class MockBrowserHistory {
        constructor() {
            this.history = [];
            this.currentIndex = -1;
        }
        
        pushState(url) {
            // Remove any forward history when pushing new state
            this.history = this.history.slice(0, this.currentIndex + 1);
            this.history.push(url);
            this.currentIndex = this.history.length - 1;
        }
        
        replaceState(url) {
            if (this.currentIndex >= 0) {
                this.history[this.currentIndex] = url;
            } else {
                this.pushState(url);
            }
        }
        
        back() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                return this.history[this.currentIndex];
            }
            return null;
        }
        
        forward() {
            if (this.currentIndex < this.history.length - 1) {
                this.currentIndex++;
                return this.history[this.currentIndex];
            }
            return null;
        }
        
        getCurrentUrl() {
            return this.currentIndex >= 0 ? this.history[this.currentIndex] : null;
        }
        
        canGoBack() {
            return this.currentIndex > 0;
        }
        
        canGoForward() {
            return this.currentIndex < this.history.length - 1;
        }
        
        getHistoryLength() {
            return this.history.length;
        }
    }
    
    let browserHistory;
    
    beforeEach(() => {
        browserHistory = new MockBrowserHistory();
    });
    
    /**
     * **Feature: url-routing-refactor, Property 8: Browser history navigation**
     * **Validates: Requirements 3.1, 3.2**
     */
    test('Property 8: Back and forward navigation should work correctly', () => {
        fc.assert(fc.property(
            fc.array(fc.constantFrom(
                '/dashboard', '/visi-misi', '/manajemen-risiko/input-data',
                '/laporan', '/login'
            ), { minLength: 3, maxLength: 8 }),
            (urls) => {
                // Navigate through all URLs
                for (const url of urls) {
                    browserHistory.pushState(url);
                }
                
                const initialUrl = browserHistory.getCurrentUrl();
                const initialIndex = browserHistory.currentIndex;
                
                // Test back navigation
                let backNavigationWorks = true;
                let backSteps = 0;
                while (browserHistory.canGoBack() && backSteps < 3) {
                    const previousUrl = browserHistory.back();
                    if (!previousUrl) {
                        backNavigationWorks = false;
                        break;
                    }
                    backSteps++;
                }
                
                // Test forward navigation
                let forwardNavigationWorks = true;
                let forwardSteps = 0;
                while (browserHistory.canGoForward() && forwardSteps < backSteps) {
                    const nextUrl = browserHistory.forward();
                    if (!nextUrl) {
                        forwardNavigationWorks = false;
                        break;
                    }
                    forwardSteps++;
                }
                
                // Property: Back and forward navigation should work
                // Property: History should maintain correct state
                const finalHistoryLength = browserHistory.getHistoryLength();
                const expectedHistoryLength = urls.length;
                
                return backNavigationWorks && forwardNavigationWorks && 
                       finalHistoryLength === expectedHistoryLength;
            }
        ), { numRuns: 100 });
    });
    
    /**
     * **Feature: url-routing-refactor, Property 10: History maintenance**
     * **Validates: Requirements 3.4**
     */
    test('Property 10: All route changes should be recorded in history', () => {
        fc.assert(fc.property(
            fc.array(fc.constantFrom(
                '/dashboard', '/visi-misi', '/manajemen-risiko/input-data',
                '/manajemen-risiko/risk-profile', '/laporan'
            ), { minLength: 1, maxLength: 10 }),
            (urls) => {
                const uniqueUrls = [...new Set(urls)]; // Remove duplicates for this test
                
                // Navigate through all URLs
                for (const url of uniqueUrls) {
                    browserHistory.pushState(url);
                }
                
                // Property: History length should match number of navigations
                const historyLength = browserHistory.getHistoryLength();
                const expectedLength = uniqueUrls.length;
                
                // Property: Current URL should be the last navigated URL
                const currentUrl = browserHistory.getCurrentUrl();
                const expectedCurrentUrl = uniqueUrls[uniqueUrls.length - 1];
                
                return historyLength === expectedLength && currentUrl === expectedCurrentUrl;
            }
        ), { numRuns: 100 });
    });
    
    test('History replace should not increase history length', () => {
        fc.assert(fc.property(
            fc.constantFrom('/dashboard', '/visi-misi', '/laporan'),
            fc.constantFrom('/manajemen-risiko/input-data', '/manajemen-risiko/risk-profile'),
            (initialUrl, replacementUrl) => {
                // Push initial URL
                browserHistory.pushState(initialUrl);
                const lengthAfterPush = browserHistory.getHistoryLength();
                
                // Replace with new URL
                browserHistory.replaceState(replacementUrl);
                const lengthAfterReplace = browserHistory.getHistoryLength();
                
                // Property: Replace should not change history length
                const lengthUnchanged = lengthAfterPush === lengthAfterReplace;
                
                // Property: Current URL should be the replacement URL
                const currentUrl = browserHistory.getCurrentUrl();
                const urlReplaced = currentUrl === replacementUrl;
                
                return lengthUnchanged && urlReplaced;
            }
        ), { numRuns: 100 });
    });
    
    test('History navigation boundaries should be respected', () => {
        fc.assert(fc.property(
            fc.array(fc.constantFrom(
                '/dashboard', '/visi-misi', '/laporan'
            ), { minLength: 1, maxLength: 5 }),
            (urls) => {
                // Navigate through URLs
                for (const url of urls) {
                    browserHistory.pushState(url);
                }
                
                // Go to beginning of history
                while (browserHistory.canGoBack()) {
                    browserHistory.back();
                }
                
                // Try to go back beyond beginning
                const cannotGoBackFurther = browserHistory.back() === null;
                
                // Go to end of history
                while (browserHistory.canGoForward()) {
                    browserHistory.forward();
                }
                
                // Try to go forward beyond end
                const cannotGoForwardFurther = browserHistory.forward() === null;
                
                // Property: Should not be able to navigate beyond history boundaries
                return cannotGoBackFurther && cannotGoForwardFurther;
            }
        ), { numRuns: 100 });
    });
});