/**
 * Enhanced SPA Router with Page Refresh Handling
 * Handles client-side routing with proper page refresh support for risk management pages
 */
class EnhancedSPARouter {
    constructor(routes = {}, options = {}) {
        this.routes = routes;
        this.currentRoute = null;
        this.authGuard = options.authGuard;
        this.fallbackRoute = options.fallbackRoute || '/dashboard';
        this.basePath = options.basePath || '';
        this.preserveStateOnRefresh = options.preserveStateOnRefresh !== false;
        
        // Bind methods to preserve context
        this.handlePopState = this.handlePopState.bind(this);
        this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
        
        // Initialize router
        this.init();
    }
    
    /**
     * Initialize the router
     */
    init() {
        console.log('🚀 Initializing Enhanced SPA Router...');
        
        // Listen for browser back/forward button events
        window.addEventListener('popstate', this.handlePopState);
        
        // Listen for page refresh/unload to preserve state
        if (this.preserveStateOnRefresh) {
            window.addEventListener('beforeunload', this.handleBeforeUnload);
        }
        
        // Handle initial page load
        this.handleInitialRoute();
        
        console.log('✅ Enhanced SPA Router initialized with', Object.keys(this.routes).length, 'routes');
    }
    
    /**
     * Handle initial route on page load
     */
    handleInitialRoute() {
        const currentPath = window.location.pathname;
        console.log('🔄 Handling initial route:', currentPath);
        
        // Check if this is a page refresh
        const isPageRefresh = this.isPageRefresh();
        console.log('📄 Page load type:', { isPageRefresh });
        
        if (isPageRefresh && this.preserveStateOnRefresh) {
            // Try to restore previous state
            const restoredState = this.restoreRouteState();
            if (restoredState && restoredState.currentPath === currentPath) {
                console.log('🔄 Restoring route state after refresh:', restoredState);
                this.navigate(currentPath, true, { skipStatePreservation: true });
                return;
            }
        }
        
        // Handle authentication state on page load
        this.handleAuthenticationOnPageLoad(currentPath);
        
        // Navigate to current path without adding to history
        this.navigate(currentPath, true);
    }
    
    /**
     * Check if this is a page refresh
     */
    isPageRefresh() {
        // Multiple methods to detect page refresh
        const performanceNavigation = window.performance && window.performance.navigation;
        const performanceEntries = window.performance && window.performance.getEntriesByType;
        
        // Method 1: Performance Navigation API (deprecated but still works)
        if (performanceNavigation) {
            return performanceNavigation.type === performanceNavigation.TYPE_RELOAD;
        }
        
        // Method 2: Performance Timeline API
        if (performanceEntries) {
            const navigationEntries = performanceEntries('navigation');
            if (navigationEntries.length > 0) {
                return navigationEntries[0].type === 'reload';
            }
        }
        
        // Method 3: Check referrer and session storage
        const hasReferrer = document.referrer && document.referrer.includes(window.location.hostname);
        const hasSessionFlag = sessionStorage.getItem('spa_router_active');
        
        // If no referrer and no session flag, likely a direct access or refresh
        return !hasReferrer && !hasSessionFlag;
    }
    
    /**
     * Handle authentication state on page load
     */
    handleAuthenticationOnPageLoad(currentPath) {
        console.log('🔐 Checking authentication state on page load for path:', currentPath);
        
        // Find route configuration
        const route = this.matchRoute(currentPath);
        
        if (route && route.auth) {
            // This is a protected route, check authentication with delay
            setTimeout(() => {
                if (this.authGuard && !this.authGuard.canActivate(route)) {
                    console.log('🔒 Protected route accessed without authentication, redirecting to login');
                    
                    // Store intended route for post-login redirect
                    if (currentPath !== '/login') {
                        sessionStorage.setItem('intendedRoute', currentPath);
                        console.log('💾 Stored intended route:', currentPath);
                    }
                    
                    // Redirect to login
                    this.navigate('/login', true);
                    return false;
                } else {
                    console.log('✅ Authentication check passed for protected route');
                }
            }, 100);
        }
        
        return true;
    }
    
    /**
     * Navigate to a specific path
     */
    navigate(path, replace = false, options = {}) {
        console.log(`🧭 Navigating to: ${path} (replace: ${replace})`);
        
        try {
            // Normalize path
            const normalizedPath = this.normalizePath(path);
            
            // Check if route exists
            const route = this.matchRoute(normalizedPath);
            if (!route) {
                console.warn(`⚠️ Route not found: ${normalizedPath}, redirecting to fallback`);
                return this.navigate(this.fallbackRoute, replace);
            }
            
            // Check authentication if required
            if (route.auth && this.authGuard) {
                const canActivate = this.authGuard.canActivate(route);
                console.log('🔐 Route authentication check:', { path: normalizedPath, canActivate });
                
                if (!canActivate) {
                    console.log('🔐 Authentication required, redirecting to login');
                    
                    if (normalizedPath === '/login') {
                        console.log('⚠️ Already navigating to login, skipping redirect');
                    } else {
                        const loginPath = this.authGuard.redirectToLogin(normalizedPath);
                        return this.navigate(loginPath, replace);
                    }
                }
            }
            
            // Update browser history
            this.updateHistory(normalizedPath, replace);
            
            // Update current route
            this.currentRoute = {
                path: normalizedPath,
                route: route,
                params: this.extractParams(route, normalizedPath),
                query: this.extractQuery()
            };
            
            // Execute route handler
            this.executeRoute(this.currentRoute);
            
            // Preserve state if enabled
            if (this.preserveStateOnRefresh && !options.skipStatePreservation) {
                this.preserveRouteState(normalizedPath);
            }
            
            // Mark router as active
            sessionStorage.setItem('spa_router_active', 'true');
            
            console.log('✅ Navigation completed to:', normalizedPath);
            
        } catch (error) {
            console.error('❌ Navigation error:', error);
            // Fallback to dashboard on error
            if (path !== this.fallbackRoute) {
                this.navigate(this.fallbackRoute, replace);
            }
        }
    }
    
    /**
     * Handle browser back/forward button events
     */
    handlePopState(event) {
        console.log('🔙 Browser navigation detected:', window.location.pathname);
        
        // Navigate to current path without adding to history
        this.navigate(window.location.pathname, true);
    }
    
    /**
     * Handle page unload to preserve state
     */
    handleBeforeUnload(event) {
        if (this.currentRoute) {
            this.preserveRouteState(this.currentRoute.path);
        }
    }
    
    /**
     * Update browser history
     */
    updateHistory(path, replace = false) {
        const url = this.basePath + path;
        const state = { 
            path: path,
            timestamp: Date.now(),
            routeData: this.currentRoute ? {
                path: this.currentRoute.path,
                params: this.currentRoute.params
            } : null
        };
        
        if (replace) {
            window.history.replaceState(state, '', url);
        } else {
            window.history.pushState(state, '', url);
        }
        
        console.log(`📝 History updated: ${replace ? 'replaced' : 'pushed'} ${url}`);
    }
    
    /**
     * Preserve route state for page refresh
     */
    preserveRouteState(path) {
        const routeState = {
            currentPath: path,
            timestamp: Date.now(),
            routeData: this.currentRoute,
            userAgent: navigator.userAgent,
            sessionId: this.getSessionId()
        };
        
        try {
            sessionStorage.setItem('enhanced_router_state', JSON.stringify(routeState));
            localStorage.setItem('enhanced_router_backup', JSON.stringify(routeState));
            console.log('💾 Route state preserved for:', path);
        } catch (error) {
            console.warn('Failed to preserve route state:', error);
        }
    }
    
    /**
     * Restore route state after page refresh
     */
    restoreRouteState() {
        try {
            // Try session storage first
            let stateJson = sessionStorage.getItem('enhanced_router_state');
            
            // Fallback to local storage
            if (!stateJson) {
                stateJson = localStorage.getItem('enhanced_router_backup');
            }
            
            if (stateJson) {
                const state = JSON.parse(stateJson);
                
                // Validate state freshness (within 1 hour)
                const oneHour = 60 * 60 * 1000;
                if (Date.now() - state.timestamp < oneHour) {
                    // Validate session consistency
                    if (state.sessionId === this.getSessionId()) {
                        console.log('✅ Route state restored successfully');
                        return state;
                    } else {
                        console.log('⚠️ Session mismatch, clearing old state');
                        this.clearRouteState();
                    }
                } else {
                    console.log('⚠️ Route state expired, clearing');
                    this.clearRouteState();
                }
            }
        } catch (error) {
            console.warn('Failed to restore route state:', error);
            this.clearRouteState();
        }
        
        return null;
    }
    
    /**
     * Clear stored route state
     */
    clearRouteState() {
        try {
            sessionStorage.removeItem('enhanced_router_state');
            localStorage.removeItem('enhanced_router_backup');
        } catch (error) {
            console.warn('Failed to clear route state:', error);
        }
    }
    
    /**
     * Get or generate session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('spa_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('spa_session_id', sessionId);
        }
        return sessionId;
    }
    
    /**
     * Match a path against registered routes
     */
    matchRoute(path) {
        // Try exact match first
        if (this.routes[path]) {
            return { ...this.routes[path], pattern: path };
        }
        
        // Try pattern matching for dynamic routes
        for (const [pattern, route] of Object.entries(this.routes)) {
            if (this.isPatternMatch(pattern, path)) {
                return { ...route, pattern };
            }
        }
        
        return null;
    }
    
    /**
     * Check if a path matches a route pattern
     */
    isPatternMatch(pattern, path) {
        // Convert pattern to regex
        const regexPattern = pattern
            .replace(/:[^/]+/g, '([^/]+)')  // Replace :param with capture group
            .replace(/\*/g, '.*');          // Replace * with wildcard
        
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(path);
    }
    
    /**
     * Extract parameters from a matched route
     */
    extractParams(route, path) {
        const params = {};
        const pattern = route.pattern;
        
        // Extract parameter names from pattern
        const paramNames = (pattern.match(/:[^/]+/g) || [])
            .map(param => param.substring(1));
        
        if (paramNames.length === 0) {
            return params;
        }
        
        // Create regex to extract values
        const regexPattern = pattern.replace(/:[^/]+/g, '([^/]+)');
        const regex = new RegExp(`^${regexPattern}$`);
        const matches = path.match(regex);
        
        if (matches) {
            paramNames.forEach((name, index) => {
                params[name] = matches[index + 1];
            });
        }
        
        return params;
    }
    
    /**
     * Extract query parameters from current URL
     */
    extractQuery() {
        const query = {};
        const searchParams = new URLSearchParams(window.location.search);
        
        for (const [key, value] of searchParams) {
            query[key] = value;
        }
        
        return query;
    }
    
    /**
     * Execute a route handler
     */
    executeRoute(currentRoute) {
        const { route, params, query } = currentRoute;
        
        try {
            // Call the route handler
            if (typeof route.handler === 'function') {
                route.handler(params, query);
            } else if (typeof route.handler === 'string') {
                // Handler is a page name - use existing navigation system
                if (window.navigateToPage) {
                    console.log(`🎯 Executing route handler: ${route.handler}`);
                    
                    // Ensure page is visible and fully loaded
                    this.ensurePageLoaded(route.handler);
                    
                } else {
                    console.error('❌ navigateToPage function not available');
                }
            }
            
            // Update page title if specified
            if (route.title) {
                document.title = route.title;
            }
            
        } catch (error) {
            console.error('❌ Route execution error:', error);
            throw error;
        }
    }
    
    /**
     * Ensure page is properly loaded and visible
     */
    ensurePageLoaded(pageName) {
        console.log(`🔄 Ensuring page ${pageName} is fully loaded...`);
        
        try {
            // SPECIAL HANDLING FOR LOGIN PAGE
            if (pageName === 'login') {
                console.log('🔐 Handling login page specially...');
                
                // Hide app screen, show login screen
                const loginScreen = document.getElementById('login-screen');
                const appScreen = document.getElementById('app-screen');
                
                if (loginScreen) {
                    loginScreen.style.display = 'flex';
                    loginScreen.classList.add('active');
                    console.log('✅ Login screen is now visible');
                }
                
                if (appScreen) {
                    appScreen.style.display = 'none';
                    appScreen.classList.remove('active');
                }
                
                return; // Exit early for login page
            }
            
            // For other pages, hide login screen and show app screen
            const loginScreen = document.getElementById('login-screen');
            const appScreen = document.getElementById('app-screen');
            
            if (loginScreen) {
                loginScreen.style.display = 'none';
                loginScreen.classList.remove('active');
            }
            
            if (appScreen) {
                appScreen.style.display = 'block';
                appScreen.classList.add('active');
            }
            
            // Hide all pages first
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.remove('active');
                page.style.display = 'none';
            });
            
            // Show the target page
            let targetPage = document.getElementById(pageName);
            
            // If page doesn't exist, try to create it for specific pages
            if (!targetPage) {
                targetPage = this.createPageIfNeeded(pageName);
            }
            
            if (targetPage) {
                targetPage.style.display = 'block';
                targetPage.classList.add('active');
                
                // Force reflow to ensure styles are applied
                targetPage.offsetHeight;
                
                console.log(`✅ Page ${pageName} is now visible`);
                
                // Update menu items
                this.updateActiveMenuItem(pageName);
                
                // Load page data
                if (typeof window.loadPageData === 'function') {
                    setTimeout(() => {
                        try {
                            window.loadPageData(pageName);
                            console.log(`✅ Page data loaded for ${pageName}`);
                        } catch (error) {
                            console.warn(`⚠️ Error loading page data for ${pageName}:`, error);
                        }
                    }, 10);
                }
                
            } else {
                console.error(`❌ Page element not found: ${pageName}`);
                // Fallback to dashboard
                const dashboardPage = document.getElementById('dashboard');
                if (dashboardPage && pageName !== 'dashboard') {
                    dashboardPage.style.display = 'block';
                    dashboardPage.classList.add('active');
                    this.updateActiveMenuItem('dashboard');
                    console.log('✅ Fallback to dashboard page');
                }
            }
            
        } catch (error) {
            console.error(`❌ Error ensuring page loaded for ${pageName}:`, error);
        }
    }
    
    /**
     * Create page element if needed for specific pages
     */
    createPageIfNeeded(pageName) {
        const riskPages = [
            'risk-identification', 'identifikasi-risiko',
            'risk-analysis', 'analisis-risiko', 
            'laporan', 'reports'
        ];
        
        if (riskPages.includes(pageName)) {
            console.log(`🏗️ Creating missing page: ${pageName}`);
            
            const pageElement = document.createElement('div');
            pageElement.id = pageName;
            pageElement.className = 'page-content';
            
            // Create basic page structure
            pageElement.innerHTML = `
                <div class="page-header">
                    <h1 class="page-title">
                        <i class="page-title-icon fas fa-${this.getPageIcon(pageName)}"></i> 
                        ${this.getPageTitle(pageName)}
                    </h1>
                    <p class="page-subtitle">${this.getPageSubtitle(pageName)}</p>
                </div>
                <div id="${pageName}-content">
                    <div class="loading-container">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <p>Memuat halaman ${this.getPageTitle(pageName)}...</p>
                    </div>
                </div>
            `;
            
            // Insert into main content area
            const mainContent = document.querySelector('.main-content .content-area') ||
                               document.querySelector('.main-content') ||
                               document.querySelector('main') ||
                               document.body;
            
            if (mainContent) {
                mainContent.appendChild(pageElement);
                console.log(`✅ Page ${pageName} created and added to DOM`);
                return pageElement;
            } else {
                console.error('❌ Could not find main content area to insert page');
            }
        }
        
        return null;
    }
    
    /**
     * Get page icon for created pages
     */
    getPageIcon(pageName) {
        const iconMap = {
            'risk-identification': 'search',
            'identifikasi-risiko': 'search',
            'risk-analysis': 'chart-bar',
            'analisis-risiko': 'chart-bar',
            'laporan': 'file-alt',
            'reports': 'file-alt'
        };
        return iconMap[pageName] || 'file';
    }
    
    /**
     * Get page title for created pages
     */
    getPageTitle(pageName) {
        const titleMap = {
            'risk-identification': 'Identifikasi Risiko',
            'identifikasi-risiko': 'Identifikasi Risiko',
            'risk-analysis': 'Analisis Risiko',
            'analisis-risiko': 'Analisis Risiko',
            'laporan': 'Laporan',
            'reports': 'Laporan'
        };
        return titleMap[pageName] || 'Halaman';
    }
    
    /**
     * Get page subtitle for created pages
     */
    getPageSubtitle(pageName) {
        const subtitleMap = {
            'risk-identification': 'Identifikasi dan Input Data Risiko',
            'identifikasi-risiko': 'Identifikasi dan Input Data Risiko',
            'risk-analysis': 'Analisis dan Evaluasi Risiko',
            'analisis-risiko': 'Analisis dan Evaluasi Risiko',
            'laporan': 'Laporan dan Dokumentasi',
            'reports': 'Laporan dan Dokumentasi'
        };
        return subtitleMap[pageName] || 'Halaman Aplikasi';
    }
    
    /**
     * Update active menu item
     */
    updateActiveMenuItem(pageName) {
        try {
            // Remove active class from all menu items
            document.querySelectorAll('.menu-item, .sidebar-link').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to current menu item
            const currentMenuItem = document.querySelector(`.menu-item[data-page="${pageName}"]`) ||
                                   document.querySelector(`.sidebar-link[href="/${pageName}"]`) ||
                                   document.querySelector(`.sidebar-link[href="${pageName}"]`);
            
            if (currentMenuItem) {
                currentMenuItem.classList.add('active');
                console.log(`✅ Menu item activated: ${pageName}`);
            } else {
                console.warn(`⚠️ Menu item not found for page: ${pageName}`);
            }
        } catch (error) {
            console.error(`❌ Error updating active menu item for ${pageName}:`, error);
        }
    }
    
    /**
     * Normalize a path
     */
    normalizePath(path) {
        if (!path || path === '/') {
            return '/';
        }
        
        // Ensure leading slash
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        // Remove trailing slash (except for root)
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        
        return path;
    }
    
    /**
     * Add a new route
     */
    addRoute(path, route) {
        this.routes[path] = route;
        console.log(`➕ Route added: ${path}`);
    }
    
    /**
     * Remove a route
     */
    removeRoute(path) {
        delete this.routes[path];
        console.log(`➖ Route removed: ${path}`);
    }
    
    /**
     * Get current route information
     */
    getCurrentRoute() {
        return this.currentRoute;
    }
    
    /**
     * Get current path
     */
    getCurrentPath() {
        return this.currentRoute ? this.currentRoute.path : window.location.pathname;
    }
    
    /**
     * Check if a path is the current active path
     */
    isActive(path) {
        return this.getCurrentPath() === this.normalizePath(path);
    }
    
    /**
     * Destroy the router and clean up event listeners
     */
    destroy() {
        window.removeEventListener('popstate', this.handlePopState);
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        this.clearRouteState();
        sessionStorage.removeItem('spa_router_active');
        sessionStorage.removeItem('spa_session_id');
        this.currentRoute = null;
        console.log('🗑️ Enhanced SPA Router destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedSPARouter };
} else {
    // Make available globally
    window.EnhancedSPARouter = EnhancedSPARouter;
}

console.log('✅ Enhanced SPA Router module loaded');