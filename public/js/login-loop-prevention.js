/**
 * Login Loop Prevention System
 * Prevents infinite redirect loops between login and dashboard pages
 */

class LoginLoopPrevention {
    constructor() {
        this.navigationHistory = [];
        this.maxHistorySize = 10;
        this.loopDetectionThreshold = 3;
        this.lastNavigationTime = 0;
        this.navigationCooldown = 1000; // 1 second cooldown
        this.isNavigating = false;
        
        console.log('🛡️ Login Loop Prevention initialized');
    }
    
    /**
     * Check if a navigation would create a loop
     */
    wouldCreateLoop(targetPath) {
        const currentPath = window.location.pathname;
        
        // Count recent navigations to the same path
        const recentNavigations = this.navigationHistory.filter(nav => 
            nav.path === targetPath && 
            Date.now() - nav.timestamp < 5000 // Within last 5 seconds
        );
        
        if (recentNavigations.length >= this.loopDetectionThreshold) {
            console.warn(`🚨 Loop detected: ${recentNavigations.length} navigations to ${targetPath} in 5 seconds`);
            return true;
        }
        
        // Check for immediate back-and-forth navigation
        if (this.navigationHistory.length >= 2) {
            const lastTwo = this.navigationHistory.slice(-2);
            if (lastTwo[0].path === targetPath && lastTwo[1].path === currentPath) {
                console.warn(`🚨 Back-and-forth loop detected between ${currentPath} and ${targetPath}`);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Record a navigation attempt
     */
    recordNavigation(path, source = 'unknown') {
        const navigation = {
            path: path,
            timestamp: Date.now(),
            source: source
        };
        
        this.navigationHistory.push(navigation);
        
        // Keep history size manageable
        if (this.navigationHistory.length > this.maxHistorySize) {
            this.navigationHistory.shift();
        }
        
        console.log(`📝 Navigation recorded: ${path} (source: ${source})`);
    }
    
    /**
     * Safe navigation with loop prevention
     */
    safeNavigate(targetPath, source = 'unknown', options = {}) {
        const currentPath = window.location.pathname;
        const now = Date.now();
        
        console.log(`🧭 Safe navigation requested: ${currentPath} -> ${targetPath} (source: ${source})`);
        
        // Prevent navigation if already navigating
        if (this.isNavigating && !options.force) {
            console.warn('⚠️ Navigation already in progress, skipping');
            return false;
        }
        
        // Prevent rapid navigation
        if (now - this.lastNavigationTime < this.navigationCooldown && !options.force) {
            console.warn('⚠️ Navigation too rapid, applying cooldown');
            return false;
        }
        
        // Skip if already on target path
        if (currentPath === targetPath && !options.force) {
            console.log('✅ Already on target path, skipping navigation');
            return true;
        }
        
        // Check for potential loops
        if (this.wouldCreateLoop(targetPath) && !options.force) {
            console.error(`❌ Navigation blocked to prevent loop: ${targetPath}`);
            this.handleLoopDetection(targetPath, source);
            return false;
        }
        
        // Record navigation attempt
        this.recordNavigation(targetPath, source);
        this.lastNavigationTime = now;
        this.isNavigating = true;
        
        try {
            // Perform navigation
            const success = this.performNavigation(targetPath, options);
            
            if (success) {
                console.log(`✅ Safe navigation completed: ${targetPath}`);
            } else {
                console.error(`❌ Safe navigation failed: ${targetPath}`);
            }
            
            return success;
            
        } catch (error) {
            console.error(`❌ Safe navigation error: ${error.message}`);
            return false;
        } finally {
            // Clear navigation flag after delay
            setTimeout(() => {
                this.isNavigating = false;
            }, 500);
        }
    }
    
    /**
     * Perform the actual navigation
     */
    performNavigation(targetPath, options = {}) {
        try {
            // Use router if available
            if (window.appRouter && !options.forceReload) {
                console.log(`🗺️ Using router navigation to: ${targetPath}`);
                window.appRouter.navigate(targetPath, options.replace);
                return true;
            }
            
            // Use navigateToPage if available
            if (typeof window.navigateToPage === 'function' && !options.forceReload) {
                const pageName = this.getPageNameFromPath(targetPath);
                if (pageName && pageName !== '404') {
                    console.log(`📄 Using navigateToPage: ${pageName}`);
                    window.navigateToPage(pageName);
                    return true;
                }
            }
            
            // Fallback to location change
            console.log(`🔄 Using location change to: ${targetPath}`);
            if (options.replace) {
                window.location.replace(targetPath);
            } else {
                window.location.href = targetPath;
            }
            return true;
            
        } catch (error) {
            console.error(`❌ Navigation method failed: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Handle loop detection with enhanced recovery
     */
    handleLoopDetection(targetPath, source) {
        console.error(`🚨 LOOP DETECTED: Attempted navigation to ${targetPath} from ${source}`);
        
        // Clear navigation history to break the loop
        this.navigationHistory = [];
        
        // Wait for any ongoing authentication checks to complete
        if (window.authStateManager && typeof window.authStateManager.waitForAuthCheck === 'function') {
            window.authStateManager.waitForAuthCheck().then(() => {
                this._resolveLoop(targetPath, source);
            });
        } else {
            // Fallback with delay
            setTimeout(() => {
                this._resolveLoop(targetPath, source);
            }, 1000);
        }
    }
    
    /**
     * Resolve the loop with proper authentication state check
     * @private
     */
    _resolveLoop(targetPath, source) {
        // Force refresh authentication state
        let isAuthenticated = false;
        
        if (window.authStateManager && typeof window.authStateManager.forceRefresh === 'function') {
            window.authStateManager.forceRefresh().then((authResult) => {
                this._performLoopResolution(authResult, targetPath, source);
            });
        } else {
            // Fallback authentication check
            isAuthenticated = this.checkAuthenticationState();
            this._performLoopResolution(isAuthenticated, targetPath, source);
        }
    }
    
    /**
     * Perform the actual loop resolution
     * @private
     */
    _performLoopResolution(isAuthenticated, targetPath, source) {
        const currentPath = window.location.pathname;
        
        console.log(`🔍 Loop resolution: authenticated=${isAuthenticated}, currentPath=${currentPath}, targetPath=${targetPath}`);
        
        // Determine safe target
        let safeTarget = null;
        
        if (isAuthenticated) {
            // User is authenticated
            if (currentPath === '/login' || currentPath === '/' || currentPath.includes('/auth/login')) {
                safeTarget = '/dashboard';
                console.log('🔄 Authenticated user on login page, redirecting to dashboard');
            } else if (targetPath === '/login') {
                // Trying to go to login while authenticated - go to dashboard instead
                safeTarget = '/dashboard';
                console.log('🔄 Authenticated user trying to access login, redirecting to dashboard');
            } else {
                // Stay on current page if it's a valid authenticated page
                console.log('✅ Authenticated user on valid page, staying put');
                return;
            }
        } else {
            // User is not authenticated
            if (currentPath !== '/login' && !currentPath.includes('/auth/login')) {
                safeTarget = '/login';
                console.log('🔄 Unauthenticated user on protected page, redirecting to login');
            } else if (targetPath !== '/login' && !targetPath.includes('/auth/login')) {
                // Trying to access protected page while not authenticated
                safeTarget = '/login';
                console.log('🔄 Unauthenticated user trying to access protected page, redirecting to login');
            } else {
                // Stay on login page
                console.log('✅ Unauthenticated user on login page, staying put');
                return;
            }
        }
        
        // Perform safe navigation with force flag
        if (safeTarget) {
            console.log(`🛡️ Loop resolution: navigating to ${safeTarget}`);
            this.safeNavigate(safeTarget, 'loop-resolution', { force: true, replace: true });
        }
    }
    
    /**
     * Check current authentication state with enhanced reliability
     */
    checkAuthenticationState() {
        try {
            // Method 1: Check AuthStateManager first (most reliable)
            if (window.authStateManager && typeof window.authStateManager.checkAuthentication === 'function') {
                const isAuth = window.authStateManager.checkAuthentication();
                if (isAuth) {
                    console.log('🔐 Loop prevention: Authenticated via AuthStateManager');
                    return true;
                }
            }
            
            // Method 2: Check authService
            if (window.authService && typeof window.authService.isAuthenticated === 'function') {
                const isAuth = window.authService.isAuthenticated();
                if (isAuth) {
                    console.log('🔐 Loop prevention: Authenticated via authService');
                    return true;
                }
            }
            
            // Method 3: Check global state
            const hasCurrentUser = !!(window.currentUser);
            const hasCurrentSession = !!(window.currentSession && window.currentSession.access_token);
            const isAuthenticatedFlag = !!(window.isAuthenticated);
            
            if (hasCurrentUser || hasCurrentSession || isAuthenticatedFlag) {
                console.log('🔐 Loop prevention: Authenticated via global state');
                return true;
            }
            
            // Method 4: Check localStorage backup
            try {
                const storedAuth = localStorage.getItem('supabase.auth.token');
                if (storedAuth) {
                    const authData = JSON.parse(storedAuth);
                    if (authData.access_token && authData.expires_at > (Date.now() / 1000) + 60) {
                        console.log('🔐 Loop prevention: Authenticated via localStorage');
                        return true;
                    }
                }
            } catch (error) {
                console.warn('🔐 Loop prevention: Error checking localStorage:', error);
            }
            
            console.log('🔐 Loop prevention: Not authenticated');
            return false;
            
        } catch (error) {
            console.error('🔐 Loop prevention: Error checking authentication state:', error);
            return false;
        }
    }
    
    /**
     * Get page name from path
     */
    getPageNameFromPath(path) {
        // Remove leading slash and query parameters
        const cleanPath = path.replace(/^\//, '').split('?')[0];
        
        // Map common paths to page names
        const pathMap = {
            '': 'dashboard',
            'dashboard': 'dashboard',
            'login': 'login',
            'risks': 'risks',
            'visi-misi': 'visi-misi',
            'rencana-strategis': 'rencana-strategis',
            'monitoring-evaluasi': 'monitoring-evaluasi',
            'peluang': 'peluang',
            'kri': 'kri',
            'loss-event': 'loss-event',
            'ews': 'ews',
            'pengaturan': 'pengaturan'
        };
        
        return pathMap[cleanPath] || cleanPath || 'dashboard';
    }
    
    /**
     * Clear navigation history
     */
    clearHistory() {
        this.navigationHistory = [];
        console.log('🗑️ Navigation history cleared');
    }
    
    /**
     * Get navigation statistics
     */
    getStats() {
        return {
            historySize: this.navigationHistory.length,
            recentNavigations: this.navigationHistory.filter(nav => 
                Date.now() - nav.timestamp < 10000
            ).length,
            isNavigating: this.isNavigating,
            lastNavigationTime: this.lastNavigationTime
        };
    }
}

// Create global instance
window.loginLoopPrevention = new LoginLoopPrevention();

// Override navigation functions to use loop prevention
(function() {
    // Store original functions
    const originalNavigateToPage = window.navigateToPage;
    
    // Override navigateToPage
    window.navigateToPage = function(pageName, options = {}) {
        const targetPath = window.getUrlForPage ? window.getUrlForPage(pageName) : `/${pageName}`;
        
        console.log(`🧭 navigateToPage called: ${pageName} -> ${targetPath}`);
        
        // Use loop prevention
        const success = window.loginLoopPrevention.safeNavigate(targetPath, 'navigateToPage', options);
        
        if (!success && originalNavigateToPage) {
            console.log('🔄 Falling back to original navigateToPage');
            originalNavigateToPage.call(this, pageName);
        }
    };
    
    // Store reference to original function
    window.originalNavigateToPage = originalNavigateToPage;
    
    console.log('🛡️ Navigation functions wrapped with loop prevention');
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginLoopPrevention;
} else {
    window.LoginLoopPrevention = LoginLoopPrevention;
}

console.log('🛡️ Login Loop Prevention system loaded');