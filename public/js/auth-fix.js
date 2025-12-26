/**
 * Auth State Fix - Comprehensive Solution for Login Issues
 * Fixes race conditions and ensures proper auth state management
 */

// Enhanced Auth State Manager with better session handling
class EnhancedAuthStateManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.currentSession = null;
        this.listeners = [];
        this.authReadyPromise = null;
        this.authReadyResolve = null;
        this.authState = 'LOADING';
        this.initializationComplete = false;
        
        console.log('[AUTH-FIX] Enhanced AuthStateManager initialized');
        this._createAuthReadyPromise();
    }
    
    _createAuthReadyPromise() {
        this.authReadyPromise = new Promise((resolve) => {
            this.authReadyResolve = resolve;
        });
    }
    
    async initialize() {
        if (this.initializationComplete) {
            console.log('[AUTH-FIX] Already initialized, skipping');
            return;
        }
        
        console.log('[AUTH-FIX] Starting initialization...');
        
        try {
            // Wait for Supabase client
            const client = await this._waitForSupabaseClient();
            if (!client) {
                throw new Error('Supabase client not available');
            }
            
            // Check for existing session
            const { data: { session }, error } = await client.auth.getSession();
            
            if (error) {
                console.warn('[AUTH-FIX] Session check error:', error);
                this._setNotAuthenticated();
                return;
            }
            
            if (session && session.user && session.access_token) {
                console.log('[AUTH-FIX] Existing session found, restoring auth state');
                this._setAuthenticated(session.user, session);
            } else {
                console.log('[AUTH-FIX] No existing session, setting not authenticated');
                this._setNotAuthenticated();
            }
            
            this.initializationComplete = true;
            console.log('[AUTH-FIX] Initialization complete');
            
        } catch (error) {
            console.error('[AUTH-FIX] Initialization failed:', error);
            this._setNotAuthenticated();
        }
    }
    
    async _waitForSupabaseClient(timeout = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (window.supabaseClient) {
                return window.supabaseClient;
            }
            
            if (window.SupabaseClientManager && window.SupabaseClientManager.getClient()) {
                return window.SupabaseClientManager.getClient();
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return null;
    }
    
    _setAuthenticated(user, session) {
        console.log('[AUTH-FIX] Setting authenticated state');
        
        this.isAuthenticated = true;
        this.currentUser = user;
        this.currentSession = session;
        this.authState = 'READY';
        
        // Update global state
        window.isAuthenticated = true;
        window.currentUser = user;
        window.currentSession = session;
        
        // Resolve auth ready promise
        if (this.authReadyResolve) {
            this.authReadyResolve(true);
            this.authReadyResolve = null;
        }
        
        // Notify listeners
        this._notifyListeners({
            isAuthenticated: true,
            user,
            session,
            state: 'READY'
        });
        
        console.log('[AUTH-FIX] ✅ Auth state set to AUTHENTICATED');
    }
    
    _setNotAuthenticated() {
        console.log('[AUTH-FIX] Setting not authenticated state');
        
        this.isAuthenticated = false;
        this.currentUser = null;
        this.currentSession = null;
        this.authState = 'NOT_AUTHENTICATED';
        
        // Update global state
        window.isAuthenticated = false;
        window.currentUser = null;
        window.currentSession = null;
        
        // Create new promise for future login
        this._createAuthReadyPromise();
        
        // Notify listeners
        this._notifyListeners({
            isAuthenticated: false,
            user: null,
            session: null,
            state: 'NOT_AUTHENTICATED'
        });
        
        console.log('[AUTH-FIX] Auth state set to NOT_AUTHENTICATED');
    }
    
    _notifyListeners(data) {
        this.listeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error('[AUTH-FIX] Listener error:', error);
            }
        });
    }
    
    onAuthStateChange(callback) {
        this.listeners.push(callback);
        
        // Immediately call with current state
        callback({
            isAuthenticated: this.isAuthenticated,
            user: this.currentUser,
            session: this.currentSession,
            state: this.authState
        });
        
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
    
    async waitForReady(timeout = 10000) {
        if (this.authState === 'READY' && this.isAuthenticated) {
            return true;
        }
        
        try {
            const result = await Promise.race([
                this.authReadyPromise,
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Timeout')), timeout);
                })
            ]);
            return result === true;
        } catch (error) {
            console.log('[AUTH-FIX] Wait for ready timeout - user not logged in');
            return false;
        }
    }
    
    getState() {
        return {
            isAuthenticated: this.isAuthenticated,
            currentUser: this.currentUser,
            currentSession: this.currentSession,
            authState: this.authState
        };
    }
    
    // Handle Supabase auth events
    handleSupabaseAuthEvent(event, session) {
        console.log(`[AUTH-FIX] Handling Supabase event: ${event}`);
        
        if (event === 'SIGNED_IN' && session && session.user && session.access_token) {
            this._setAuthenticated(session.user, session);
        } else if (event === 'SIGNED_OUT') {
            this._setNotAuthenticated();
        } else if (event === 'TOKEN_REFRESHED' && session && session.user && session.access_token) {
            // Update session but keep authenticated state
            this.currentSession = session;
            window.currentSession = session;
            console.log('[AUTH-FIX] Token refreshed');
        }
    }
}

// Enhanced Supabase Client Setup
async function setupEnhancedSupabaseAuth() {
    console.log('[AUTH-FIX] Setting up enhanced Supabase auth...');
    
    try {
        // Wait for Supabase client
        let client = null;
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!client && attempts < maxAttempts) {
            client = window.supabaseClient || 
                    (window.SupabaseClientManager && window.SupabaseClientManager.getClient());
            
            if (!client) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
        }
        
        if (!client) {
            throw new Error('Supabase client not available after waiting');
        }
        
        console.log('[AUTH-FIX] Supabase client found, setting up auth listener');
        
        // Create enhanced auth state manager
        const authManager = new EnhancedAuthStateManager();
        window.enhancedAuthStateManager = authManager;
        
        // Setup Supabase auth listener
        const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
            console.log(`[AUTH-FIX] Supabase auth event: ${event}`);
            authManager.handleSupabaseAuthEvent(event, session);
        });
        
        // Initialize auth state
        await authManager.initialize();
        
        // Store subscription for cleanup
        window.supabaseAuthSubscriptionEnhanced = subscription;
        
        console.log('[AUTH-FIX] ✅ Enhanced auth setup complete');
        
        return authManager;
        
    } catch (error) {
        console.error('[AUTH-FIX] ❌ Enhanced auth setup failed:', error);
        return null;
    }
}

// Auto-setup when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(setupEnhancedSupabaseAuth, 1000);
    });
} else {
    setTimeout(setupEnhancedSupabaseAuth, 1000);
}

// Export for manual setup
window.setupEnhancedSupabaseAuth = setupEnhancedSupabaseAuth;