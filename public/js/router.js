/**
 * SPA Router - Single Page Application Router
 * Handles client-side routing with browser history support
 */
class SPARouter {
    constructor(routes = {}, options = {}) {
        this.routes = routes;
        this.currentRoute = null;
        this.authGuard = options.authGuard;
        this.fallbackRoute = options.fallbackRoute || '/404';
        this.basePath = options.basePath || '';
        
        // Bind methods to preserve context
        this.handlePopState = this.handlePopState.bind(this);
        
        // Initialize router
        this.init();
    }
    
    /**
     * Initialize the router
     */
    init() {
        // Listen for browser back/forward button events
        window.addEventListener('popstate', this.handlePopState);
        
        // Handle initial page load
        this.handleInitialRoute();
        
        console.log('✅ SPARouter initialized with', Object.keys(this.routes).length, 'routes');
    }
    
    /**
     * Handle initial route on page load
     */
    handleInitialRoute() {
        const currentPath = window.location.pathname;
        console.log('🔄 Handling initial route:', currentPath);
        
        // Check if this is a page refresh or direct URL access
        const isPageRefresh = window.performance && 
            window.performance.navigation && 
            window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD;
            
        const isDirectAccess = !document.referrer || 
            !document.referrer.includes(window.location.hostname);
            
        console.log('📄 Page load type:', {
            isPageRefresh,
            isDirectAccess,
            referrer: document.referrer
        });
        
        // CRITICAL: For page refreshes or direct access, preserve the current route
        if (isPageRefresh || isDirectAccess) {
            console.log('🔄 Page refresh/direct access detected, preserving route:', currentPath);
            
            // Store the current path to prevent redirect to dashboard
            sessionStorage.setItem('preserveRoute', currentPath);
            sessionStorage.setItem('preserveRouteTimestamp', Date.now().toString());
            
            // Set a flag to prevent automatic redirects
            sessionStorage.setItem('preventAutoRedirect', 'true');
        }
        
        // Handle authentication state on page load
        this.handleAuthenticationOnPageLoad(currentPath);
        
        // Navigate to current path without adding to history
        this.navigate(currentPath, true);
    }
    
    /**
     * Handle authentication state on page load
     * @param {string} currentPath - Current URL path
     */
    handleAuthenticationOnPageLoad(currentPath) {
        console.log('🔐 Checking authentication state on page load for path:', currentPath);
        
        // Check if we should prevent auto redirect
        const preventAutoRedirect = sessionStorage.getItem('preventAutoRedirect');
        if (preventAutoRedirect === 'true') {
            console.log('🔄 Auto redirect prevented, preserving current route:', currentPath);
            // Clear the flag after a short delay
            setTimeout(() => {
                sessionStorage.removeItem('preventAutoRedirect');
            }, 2000);
            return true;
        }
        
        // Check if we should preserve the route (from refresh)
        const preserveRoute = sessionStorage.getItem('preserveRoute');
        const preserveTimestamp = sessionStorage.getItem('preserveRouteTimestamp');
        const now = Date.now();
        
        // Only preserve route if it's recent (within 10 seconds) and matches current path
        const shouldPreserveRoute = preserveRoute && 
                                   preserveTimestamp && 
                                   (now - parseInt(preserveTimestamp)) < 10000 &&
                                   preserveRoute === currentPath;
        
        if (shouldPreserveRoute) {
            console.log('🔄 Preserving route from refresh:', currentPath);
            // Clear the preservation flags after a delay
            setTimeout(() => {
                sessionStorage.removeItem('preserveRoute');
                sessionStorage.removeItem('preserveRouteTimestamp');
            }, 1000);
            
            // Skip authentication redirect for preserved routes
            // The authentication will be checked later in the flow
            return true;
        }
        
        // Find route configuration
        const route = this.matchRoute(currentPath);
        
        if (route && route.auth) {
            // This is a protected route, check authentication with delay to allow app initialization
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
            }, 100); // Small delay to allow authentication state to be set
        }
        
        return true;
    }
    
    /**
     * Navigate to a specific path
     * @param {string} path - The path to navigate to
     * @param {boolean} replace - Whether to replace current history entry
     */
    navigate(path, replace = false) {
        console.log(`🧭 Navigating to: ${path} (replace: ${replace})`);
        
        // CRITICAL: Check if rencana-strategis is locked
        const isLocked = sessionStorage.getItem('lockRencanaStrategis') === 'true';
        const currentPath = window.location.pathname;
        
        if (isLocked && currentPath === '/rencana-strategis' && path !== '/rencana-strategis') {
            console.log('🔒 Rencana Strategis is locked, preventing navigation away');
            return;
        }
        
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
                console.log('🔐 Route authentication check:', { path: normalizedPath, canActivate, hasAuthGuard: !!this.authGuard });
                
                if (!canActivate) {
                    console.log('🔐 Authentication required, redirecting to login');
                    
                    // Prevent infinite loops by checking if we're already going to login
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
            
            console.log('✅ Navigation completed to:', normalizedPath);
            
        } catch (error) {
            console.error('❌ Navigation error:', error);
            // Fallback to 404 on error
            if (path !== this.fallbackRoute) {
                this.navigate(this.fallbackRoute, replace);
            }
        }
    }
    
    /**
     * Handle browser back/forward button events
     * @param {PopStateEvent} event - The popstate event
     */
    handlePopState(event) {
        console.log('🔙 Browser navigation detected:', window.location.pathname);
        
        // Navigate to current path without adding to history
        this.navigate(window.location.pathname, true);
    }
    
    /**
     * Update browser history
     * @param {string} path - The path to add to history
     * @param {boolean} replace - Whether to replace current entry
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
        
        // Store current route in sessionStorage for page refresh preservation
        this.preserveRouteState(path);
    }
    
    /**
     * Preserve route state for page refresh
     * @param {string} path - Current path
     */
    preserveRouteState(path) {
        const routeState = {
            currentPath: path,
            timestamp: Date.now(),
            routeData: this.currentRoute
        };
        
        try {
            sessionStorage.setItem('routerState', JSON.stringify(routeState));
        } catch (error) {
            console.warn('Failed to preserve route state:', error);
        }
    }
    
    /**
     * Restore route state after page refresh
     * @returns {Object|null} - Restored route state
     */
    restoreRouteState() {
        try {
            const stateJson = sessionStorage.getItem('routerState');
            if (stateJson) {
                const state = JSON.parse(stateJson);
                
                // Check if state is recent (within 5 minutes)
                const fiveMinutes = 5 * 60 * 1000;
                if (Date.now() - state.timestamp < fiveMinutes) {
                    return state;
                }
            }
        } catch (error) {
            console.warn('Failed to restore route state:', error);
        }
        
        return null;
    }
    
    /**
     * Match a path against registered routes
     * @param {string} path - The path to match
     * @returns {Object|null} - The matched route or null
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
     * @param {string} pattern - The route pattern
     * @param {string} path - The path to check
     * @returns {boolean} - Whether the path matches the pattern
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
     * @param {Object} route - The matched route
     * @param {string} path - The actual path
     * @returns {Object} - Extracted parameters
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
     * @returns {Object} - Query parameters
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
     * @param {Object} currentRoute - The current route object
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
     * @param {string} pageName - The page name to load
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
            });
            
            // Show the target page
            const targetPage = document.getElementById(pageName);
            if (targetPage) {
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
     * Update active menu item
     * @param {string} pageName - The page name
     */
    updateActiveMenuItem(pageName) {
        try {
            // Remove active class from all menu items
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to current menu item
            const currentMenuItem = document.querySelector(`.menu-item[data-page="${pageName}"]`);
            if (currentMenuItem) {
                currentMenuItem.classList.add('active');
                
                // Handle submenu expansion
                const parentSubmenu = currentMenuItem.closest('.sidebar-submenu');
                if (parentSubmenu) {
                    parentSubmenu.classList.add('expanded');
                    const section = parentSubmenu.dataset.submenu;
                    const toggle = document.querySelector(`.dropdown-toggle[data-section="${section}"]`);
                    if (toggle) {
                        toggle.classList.add('active');
                        const chevronIcon = toggle.querySelector('.dropdown-icon');
                        if (chevronIcon) {
                            chevronIcon.classList.remove('fa-chevron-down');
                            chevronIcon.classList.add('fa-chevron-up');
                        }
                    }
                }
                
                console.log(`✅ Menu item activated: ${pageName}`);
            } else {
                console.warn(`⚠️ Menu item not found for page: ${pageName}`);
            }
        } catch (error) {
            console.error(`❌ Error updating active menu item for ${pageName}:`, error);
        }
    }
    
    /**
     * Normalize a path by removing trailing slashes and ensuring leading slash
     * @param {string} path - The path to normalize
     * @returns {string} - The normalized path
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
     * @param {string} path - The route path
     * @param {Object} route - The route configuration
     */
    addRoute(path, route) {
        this.routes[path] = route;
        console.log(`➕ Route added: ${path}`);
    }
    
    /**
     * Remove a route
     * @param {string} path - The route path to remove
     */
    removeRoute(path) {
        delete this.routes[path];
        console.log(`➖ Route removed: ${path}`);
    }
    
    /**
     * Get current route information
     * @returns {Object|null} - Current route object
     */
    getCurrentRoute() {
        return this.currentRoute;
    }
    
    /**
     * Get current path
     * @returns {string} - Current path
     */
    getCurrentPath() {
        return this.currentRoute ? this.currentRoute.path : window.location.pathname;
    }
    
    /**
     * Check if a path is the current active path
     * @param {string} path - The path to check
     * @returns {boolean} - Whether the path is active
     */
    isActive(path) {
        return this.getCurrentPath() === this.normalizePath(path);
    }
    
    /**
     * Destroy the router and clean up event listeners
     */
    destroy() {
        window.removeEventListener('popstate', this.handlePopState);
        this.currentRoute = null;
        console.log('🗑️ SPARouter destroyed');
    }
}

/**
 * Authentication Guard Class
 * Handles route protection and authentication redirects
 */
class AuthGuard {
    constructor(authService) {
        this.authService = authService;
    }
    
    /**
     * Check if a route can be activated
     * @param {Object} route - The route to check
     * @returns {boolean} - Whether the route can be activated
     */
    canActivate(route) {
        if (!route.auth) {
            return true;
        }
        
        // Enhanced authentication check with multiple methods
        console.log('🔐 AuthGuard: Checking route activation for:', route.pattern);
        
        // Method 1: Check AuthStateManager first (most reliable)
        if (window.authStateManager && typeof window.authStateManager.checkAuthentication === 'function') {
            const isAuth = window.authStateManager.checkAuthentication();
            console.log('🔐 AuthGuard: AuthStateManager result:', isAuth);
            if (isAuth) return true;
        }
        
        // Method 2: Check authService
        if (this.authService && typeof this.authService.isAuthenticated === 'function') {
            const isAuth = this.authService.isAuthenticated();
            console.log('🔐 AuthGuard: authService.isAuthenticated():', isAuth);
            if (isAuth) return true;
        }
        
        // Method 3: Check global authentication state
        const hasCurrentUser = !!(window.currentUser);
        const hasCurrentSession = !!(window.currentSession && window.currentSession.access_token);
        const isAuthenticatedFlag = !!(window.isAuthenticated);
        
        console.log('🔐 AuthGuard: Authentication state check:', {
            hasCurrentUser,
            hasCurrentSession,
            isAuthenticatedFlag,
            currentUserEmail: window.currentUser?.email
        });
        
        // Method 4: Check Supabase session directly
        if (window.supabaseClient) {
            try {
                // Synchronous check of cached session
                const cachedSession = window.supabaseClient.auth.session;
                if (cachedSession && cachedSession.access_token) {
                    // Check if session is not expired
                    if (cachedSession.expires_at) {
                        const now = Math.floor(Date.now() / 1000);
                        if (now < cachedSession.expires_at - 60) { // 60 second buffer
                            console.log('🔐 AuthGuard: Found valid cached Supabase session');
                            return true;
                        } else {
                            console.log('🔐 AuthGuard: Cached session expired');
                        }
                    } else {
                        console.log('🔐 AuthGuard: Found cached Supabase session (no expiration)');
                        return true;
                    }
                }
            } catch (error) {
                console.warn('🔐 AuthGuard: Error checking cached session:', error);
            }
        }
        
        // Method 5: Check localStorage backup
        try {
            const storedAuth = localStorage.getItem('supabase.auth.token');
            if (storedAuth) {
                const authData = JSON.parse(storedAuth);
                if (authData.access_token && authData.expires_at > (Date.now() / 1000) + 60) {
                    console.log('🔐 AuthGuard: Found valid token in localStorage');
                    return true;
                }
            }
        } catch (error) {
            console.warn('🔐 AuthGuard: Error checking localStorage:', error);
        }
        
        const isAuthenticated = hasCurrentUser || hasCurrentSession || isAuthenticatedFlag;
        console.log('🔐 AuthGuard: Final authentication result:', isAuthenticated);
        
        return isAuthenticated;
    }
    
    /**
     * Redirect to login and preserve intended route
     * @param {string} intendedRoute - The route user was trying to access
     * @returns {string} - The login route path
     */
    redirectToLogin(intendedRoute) {
        // Store intended route for post-login redirect
        if (intendedRoute && intendedRoute !== '/login') {
            sessionStorage.setItem('intendedRoute', intendedRoute);
            console.log('💾 Intended route stored:', intendedRoute);
        }
        
        return '/login';
    }
    
    /**
     * Get the intended route after successful login
     * @returns {string} - The intended route or default dashboard
     */
    getIntendedRoute() {
        const intendedRoute = sessionStorage.getItem('intendedRoute');
        if (intendedRoute) {
            sessionStorage.removeItem('intendedRoute');
            console.log('📤 Retrieved intended route:', intendedRoute);
            return intendedRoute;
        }
        return '/dashboard';
    }
    
    /**
     * Clear stored intended route
     */
    clearIntendedRoute() {
        sessionStorage.removeItem('intendedRoute');
    }
}

// Export classes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SPARouter, AuthGuard };
} else {
    // Make available globally
    window.SPARouter = SPARouter;
    window.AuthGuard = AuthGuard;
}