/**
 * Login Loop Fix
 * Comprehensive solution for infinite login redirect loops
 */

// Global flag to prevent multiple authentication checks
let authCheckInProgress = false;
let lastAuthCheckTime = 0;
const AUTH_CHECK_COOLDOWN = 1000; // 1 second cooldown

/**
 * Enhanced authentication state manager
 */
class AuthStateManager {
    constructor() {
        this.state = {
            isAuthenticated: false,
            user: null,
            session: null,
            lastUpdate: 0
        };
        
        this.listeners = [];
        this.initialized = false;
    }
    
    /**
     * Initialize the auth state manager
     */
    init() {
        if (this.initialized) return;
        
        console.log('🔐 Initializing AuthStateManager...');
        
        // Listen for storage changes (for cross-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === 'authState') {
                this.syncFromStorage();
            }
        });
        
        // Sync initial state
        this.syncFromGlobals();
        this.initialized = true;
        
        console.log('✅ AuthStateManager initialized');
    }
    
    /**
     * Update authentication state
     */
    updateState(isAuthenticated, user = null, session = null) {
        const changed = this.state.isAuthenticated !== isAuthenticated ||
                       this.state.user?.id !== user?.id;
        
        this.state = {
            isAuthenticated,
            user,
            session,
            lastUpdate: Date.now()
        };
        
        // Update global variables
        window.isAuthenticated = isAuthenticated;
        window.currentUser = user;
        window.currentSession = session;
        
        // Store in localStorage for persistence
        try {
            localStorage.setItem('authState', JSON.stringify({
                isAuthenticated,
                userId: user?.id,
                email: user?.email,
                lastUpdate: this.state.lastUpdate
            }));
        } catch (error) {
            console.warn('Failed to store auth state:', error);
        }
        
        if (changed) {
            console.log('🔐 Auth state updated:', {
                isAuthenticated,
                userEmail: user?.email,
                hasSession: !!session
            });
            
            // Notify listeners
            this.notifyListeners();
        }
    }
    
    /**
     * Sync state from global variables
     */
    syncFromGlobals() {
        const isAuthenticated = !!(window.isAuthenticated || 
                                  (window.currentUser && window.currentSession));
        
        this.updateState(
            isAuthenticated,
            window.currentUser,
            window.currentSession
        );
    }
    
    /**
     * Sync state from localStorage
     */
    syncFromStorage() {
        try {
            const stored = localStorage.getItem('authState');
            if (stored) {
                const authState = JSON.parse(stored);
                
                // Only sync if it's recent (within 5 minutes)
                const fiveMinutes = 5 * 60 * 1000;
                if (Date.now() - authState.lastUpdate < fiveMinutes) {
                    this.state.isAuthenticated = authState.isAuthenticated;
                    this.state.lastUpdate = authState.lastUpdate;
                    
                    // Update globals
                    window.isAuthenticated = authState.isAuthenticated;
                    
                    console.log('🔄 Auth state synced from storage');
                }
            }
        } catch (error) {
            console.warn('Failed to sync auth state from storage:', error);
        }
    }
    
    /**
     * Check if user is authenticated
     */
    isUserAuthenticated() {
        // Check multiple sources
        const hasGlobalAuth = !!(window.isAuthenticated);
        const hasCurrentUser = !!(window.currentUser);
        const hasCurrentSession = !!(window.currentSession && window.currentSession.access_token);
        const hasValidToken = this.hasValidToken();
        
        const isAuth = hasGlobalAuth || (hasCurrentUser && hasCurrentSession) || hasValidToken;
        
        console.log('🔐 Authentication check:', {
            hasGlobalAuth,
            hasCurrentUser,
            hasCurrentSession,
            hasValidToken,
            result: isAuth
        });
        
        return isAuth;
    }
    
    /**
     * Check if there's a valid token in localStorage
     */
    hasValidToken() {
        try {
            const storedAuth = localStorage.getItem('supabase.auth.token');
            if (storedAuth) {
                const authData = JSON.parse(storedAuth);
                if (authData.access_token && authData.expires_at) {
                    const now = Math.floor(Date.now() / 1000);
                    const expiresAt = authData.expires_at;
                    
                    // Check if token is not expired (with 60 second buffer)
                    return now < (expiresAt - 60);
                }
            }
        } catch (error) {
            console.warn('Error checking stored token:', error);
        }
        return false;
    }
    
    /**
     * Add listener for auth state changes
     */
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    /**
     * Remove listener
     */
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    
    /**
     * Notify all listeners
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.state);
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }
    
    /**
     * Clear authentication state
     */
    clearState() {
        this.updateState(false, null, null);
        
        // Clear localStorage
        try {
            localStorage.removeItem('authState');
            localStorage.removeItem('supabase.auth.token');
        } catch (error) {
            console.warn('Failed to clear stored auth state:', error);
        }
    }
}

// Create global instance
window.authStateManager = new AuthStateManager();

/**
 * Enhanced router authentication guard
 */
function createEnhancedAuthGuard() {
    return {
        canActivate: function(route) {
            if (!route.auth) {
                return true;
            }
            
            // Prevent rapid authentication checks
            const now = Date.now();
            if (authCheckInProgress || (now - lastAuthCheckTime) < AUTH_CHECK_COOLDOWN) {
                console.log('🔐 Auth check skipped (cooldown or in progress)');
                return window.isAuthenticated || false;
            }
            
            authCheckInProgress = true;
            lastAuthCheckTime = now;
            
            try {
                const isAuth = window.authStateManager.isUserAuthenticated();
                console.log('🔐 Enhanced auth guard result:', isAuth);
                return isAuth;
            } finally {
                authCheckInProgress = false;
            }
        },
        
        redirectToLogin: function(intendedRoute) {
            // Prevent login loops
            if (window.location.pathname === '/login') {
                console.log('⚠️ Already on login page, skipping redirect');
                return '/login';
            }
            
            // Store intended route
            if (intendedRoute && intendedRoute !== '/login') {
                sessionStorage.setItem('intendedRoute', intendedRoute);
                console.log('💾 Stored intended route:', intendedRoute);
            }
            
            return '/login';
        },
        
        getIntendedRoute: function() {
            const intendedRoute = sessionStorage.getItem('intendedRoute');
            if (intendedRoute) {
                sessionStorage.removeItem('intendedRoute');
                console.log('📤 Retrieved intended route:', intendedRoute);
                return intendedRoute;
            }
            return '/dashboard';
        }
    };
}

/**
 * Enhanced navigation function that prevents loops
 */
function createLoopSafeNavigation() {
    let lastNavigationTime = 0;
    let lastNavigationPath = '';
    const NAVIGATION_COOLDOWN = 500; // 500ms cooldown
    
    return function safeNavigateToPage(pageName) {
        const now = Date.now();
        const targetUrl = window.getUrlForPage ? window.getUrlForPage(pageName) : `/${pageName}`;
        
        // Prevent rapid navigation to same page
        if (targetUrl === lastNavigationPath && (now - lastNavigationTime) < NAVIGATION_COOLDOWN) {
            console.log('⚠️ Navigation cooldown active, skipping:', pageName);
            return;
        }
        
        lastNavigationTime = now;
        lastNavigationPath = targetUrl;
        
        console.log('🧭 Safe navigation to:', pageName, '->', targetUrl);
        
        // Check if we're already on the target page
        const currentPath = window.location.pathname;
        if (currentPath === targetUrl) {
            console.log('⚠️ Already on target page, updating UI only');
            
            // Just update the UI without navigation
            const targetPage = document.getElementById(pageName);
            if (targetPage) {
                document.querySelectorAll('.page-content').forEach(page => {
                    page.classList.remove('active');
                });
                targetPage.classList.add('active');
                
                // Update menu
                document.querySelectorAll('.menu-item').forEach(item => {
                    item.classList.remove('active');
                    if (item.dataset.page === pageName) {
                        item.classList.add('active');
                    }
                });
            }
            return;
        }
        
        // Use router if available
        if (window.appRouter) {
            window.appRouter.navigate(targetUrl);
        } else if (window.originalNavigateToPage) {
            window.originalNavigateToPage(pageName);
        } else {
            console.warn('No navigation method available');
        }
    };
}

/**
 * Initialize login loop prevention
 */
function initLoginLoopPrevention() {
    console.log('🔧 Initializing login loop prevention...');
    
    // Initialize auth state manager
    window.authStateManager.init();
    
    // Replace AuthGuard if router is available
    if (window.SPARouter && window.AuthGuard) {
        const enhancedGuard = createEnhancedAuthGuard();
        
        // Override AuthGuard constructor to use enhanced guard
        const OriginalAuthGuard = window.AuthGuard;
        window.AuthGuard = function(authService) {
            return enhancedGuard;
        };
        
        console.log('✅ Enhanced AuthGuard installed');
    }
    
    // Create safe navigation function
    const safeNavigate = createLoopSafeNavigation();
    
    // Override navigateToPage with safe version
    if (typeof window.navigateToPage === 'function') {
        window.originalNavigateToPage = window.navigateToPage;
        window.navigateToPage = safeNavigate;
        console.log('✅ Safe navigation installed');
    }
    
    // Add auth state listener to handle login success
    window.authStateManager.addListener((state) => {
        if (state.isAuthenticated && state.user) {
            console.log('🔐 Auth state changed to authenticated');
            
            // Check if we need to redirect from login page
            const currentPath = window.location.pathname;
            if (currentPath === '/login' || currentPath === '/') {
                const intendedRoute = sessionStorage.getItem('intendedRoute') || '/dashboard';
                sessionStorage.removeItem('intendedRoute');
                
                console.log('🧭 Redirecting from login to:', intendedRoute);
                
                setTimeout(() => {
                    if (window.appRouter) {
                        window.appRouter.navigate(intendedRoute);
                    } else {
                        const pageName = window.getPageNameForUrl ? 
                                        window.getPageNameForUrl(intendedRoute) : 'dashboard';
                        safeNavigate(pageName);
                    }
                }, 100);
            }
        }
    });
    
    console.log('✅ Login loop prevention initialized');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginLoopPrevention);
} else {
    initLoginLoopPrevention();
}

// Export for manual initialization
window.initLoginLoopPrevention = initLoginLoopPrevention;
window.authStateManager = window.authStateManager;

console.log('📦 Login loop fix module loaded');