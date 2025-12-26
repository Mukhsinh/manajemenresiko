/**
 * Router Initialization - Enhanced SPA Router Setup
 * Initializes the enhanced router with all application routes
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing application router...');
    
    // Define all application routes
    const routes = {
        // Root and dashboard
        '/': {
            handler: 'dashboard',
            title: 'Dashboard - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/dashboard': {
            handler: 'dashboard',
            title: 'Dashboard - Aplikasi Manajemen Risiko',
            auth: true
        },
        
        // Authentication
        '/login': {
            handler: 'login',
            title: 'Login - Aplikasi Manajemen Risiko',
            auth: false
        },
        
        // Strategic Analysis
        '/analisis-swot': {
            handler: 'analisis-swot',
            title: 'Analisis SWOT - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/visi-misi': {
            handler: 'visi-misi',
            title: 'Visi dan Misi - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/rencana-strategis': {
            handler: 'rencana-strategis',
            title: 'Rencana Strategis - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/diagram-kartesius': {
            handler: 'diagram-kartesius',
            title: 'Diagram Kartesius - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/matriks-tows': {
            handler: 'matriks-tows',
            title: 'Matriks TOWS - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/sasaran-strategi': {
            handler: 'sasaran-strategi',
            title: 'Sasaran Strategi - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/strategic-map': {
            handler: 'strategic-map',
            title: 'Strategic Map - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/indikator-kinerja-utama': {
            handler: 'indikator-kinerja-utama',
            title: 'Indikator Kinerja Utama - Aplikasi Manajemen Risiko',
            auth: true
        },
        
        // Risk Management - Operational
        '/risk-register': {
            handler: 'risk-register',
            title: 'Risk Register - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/risk-identification': {
            handler: 'risk-identification',
            title: 'Identifikasi Risiko - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/identifikasi-risiko': {
            handler: 'risk-identification',
            title: 'Identifikasi Risiko - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/risk-analysis': {
            handler: 'risk-analysis',
            title: 'Analisis Risiko - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/analisis-risiko': {
            handler: 'risk-analysis',
            title: 'Analisis Risiko - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/risk-input': {
            handler: 'risk-input',
            title: 'Input Data Risiko - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/monitoring-evaluasi': {
            handler: 'monitoring-evaluasi',
            title: 'Monitoring & Evaluasi - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/peluang': {
            handler: 'peluang',
            title: 'Peluang - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/risk-profile': {
            handler: 'risk-profile',
            title: 'Risk Profile - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/residual-risk': {
            handler: 'residual-risk',
            title: 'Residual Risk - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/kri': {
            handler: 'kri',
            title: 'Key Risk Indicator - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/loss-event': {
            handler: 'loss-event',
            title: 'Loss Event - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/ews': {
            handler: 'ews',
            title: 'Early Warning System - Aplikasi Manajemen Risiko',
            auth: true
        },
        
        // Reports
        '/laporan': {
            handler: 'laporan',
            title: 'Laporan - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/reports': {
            handler: 'laporan',
            title: 'Laporan - Aplikasi Manajemen Risiko',
            auth: true
        },
        
        // Master Data & Settings
        '/master-data': {
            handler: 'master-data',
            title: 'Master Data - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/buku-pedoman': {
            handler: 'buku-pedoman',
            title: 'Buku Pedoman - Aplikasi Manajemen Risiko',
            auth: true
        },
        '/pengaturan': {
            handler: 'pengaturan',
            title: 'Pengaturan - Aplikasi Manajemen Risiko',
            auth: true
        },
        
        // Error pages
        '/404': {
            handler: 'not-found',
            title: '404 - Halaman Tidak Ditemukan',
            auth: false
        }
    };
    
    // Create enhanced auth guard
    const authGuard = new EnhancedAuthGuard();
    
    // Initialize the enhanced router
    window.appRouter = new EnhancedSPARouter(routes, {
        authGuard: authGuard,
        fallbackRoute: '/dashboard',
        preserveStateOnRefresh: true
    });
    
    // Make router globally available
    window.router = window.appRouter;
    
    // Override existing navigation functions to use the router
    const originalNavigateToPage = window.navigateToPage;
    window.navigateToPage = function(pageName, updateHistory = true) {
        console.log('🔄 Redirecting navigateToPage to router:', pageName);
        
        // Convert page name to path
        let path = pageName;
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        // Use router navigation
        window.appRouter.navigate(path, !updateHistory);
    };
    
    // Add click handlers for navigation links
    document.addEventListener('click', function(event) {
        const link = event.target.closest('a[href]');
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Only handle internal links
        if (href && href.startsWith('/') && !href.startsWith('//')) {
            event.preventDefault();
            console.log('🔗 Link clicked, navigating via router:', href);
            window.appRouter.navigate(href);
        }
    });
    
    console.log('✅ Application router initialized successfully');
});

/**
 * Enhanced Authentication Guard
 * Handles route protection and authentication redirects with improved detection
 */
class EnhancedAuthGuard {
    constructor() {
        this.authCheckMethods = [
            this.checkAuthStateManager.bind(this),
            this.checkSupabaseSession.bind(this),
            this.checkGlobalAuthState.bind(this),
            this.checkLocalStorage.bind(this),
            this.checkSessionStorage.bind(this)
        ];
    }
    
    /**
     * Check if a route can be activated
     */
    canActivate(route) {
        if (!route.auth) {
            return true;
        }
        
        console.log('🔐 Enhanced AuthGuard: Checking route activation for:', route.pattern);
        
        // Try multiple authentication check methods
        for (const checkMethod of this.authCheckMethods) {
            try {
                const result = checkMethod();
                if (result === true) {
                    console.log('✅ Authentication confirmed via:', checkMethod.name);
                    return true;
                } else if (result === false) {
                    console.log('❌ Authentication denied via:', checkMethod.name);
                    // Continue to next method
                }
                // If result is null/undefined, continue to next method
            } catch (error) {
                console.warn('⚠️ Auth check method failed:', checkMethod.name, error);
            }
        }
        
        console.log('❌ All authentication methods failed');
        return false;
    }
    
    /**
     * Check AuthStateManager
     */
    checkAuthStateManager() {
        if (window.authStateManager && typeof window.authStateManager.checkAuthentication === 'function') {
            return window.authStateManager.checkAuthentication();
        }
        return null;
    }
    
    /**
     * Check Supabase session
     */
    checkSupabaseSession() {
        if (window.supabaseClient) {
            try {
                const session = window.supabaseClient.auth.session;
                if (session && session.access_token) {
                    // Check if session is not expired
                    if (session.expires_at) {
                        const now = Math.floor(Date.now() / 1000);
                        return now < session.expires_at - 60; // 60 second buffer
                    }
                    return true;
                }
            } catch (error) {
                console.warn('Error checking Supabase session:', error);
            }
        }
        return null;
    }
    
    /**
     * Check global authentication state
     */
    checkGlobalAuthState() {
        const hasCurrentUser = !!(window.currentUser);
        const hasCurrentSession = !!(window.currentSession && window.currentSession.access_token);
        const isAuthenticatedFlag = !!(window.isAuthenticated);
        
        if (hasCurrentUser || hasCurrentSession || isAuthenticatedFlag) {
            return true;
        }
        
        return null;
    }
    
    /**
     * Check localStorage for auth tokens
     */
    checkLocalStorage() {
        try {
            const storedAuth = localStorage.getItem('supabase.auth.token');
            if (storedAuth) {
                const authData = JSON.parse(storedAuth);
                if (authData.access_token && authData.expires_at > (Date.now() / 1000) + 60) {
                    return true;
                }
            }
        } catch (error) {
            console.warn('Error checking localStorage:', error);
        }
        return null;
    }
    
    /**
     * Check sessionStorage for auth state
     */
    checkSessionStorage() {
        try {
            const authState = sessionStorage.getItem('auth_state');
            if (authState) {
                const state = JSON.parse(authState);
                if (state.authenticated && state.expires > Date.now()) {
                    return true;
                }
            }
        } catch (error) {
            console.warn('Error checking sessionStorage:', error);
        }
        return null;
    }
    
    /**
     * Redirect to login and preserve intended route
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

// Make EnhancedAuthGuard globally available
window.EnhancedAuthGuard = EnhancedAuthGuard;

console.log('✅ Router initialization module loaded');