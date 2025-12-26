/**
 * Authentication State Manager - Best Practice Supabase Implementation
 * CRITICAL: SIGNED_IN event is the ONLY source of truth for AUTHENTICATED state
 * NOT_AUTHENTICATED is a normal state, NOT an error
 */

class AuthStateManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.currentSession = null;
        this.listeners = [];
        this.authReadyPromise = null;
        this.authReadyResolve = null;
        this.authReadyReject = null;
        this.authState = 'LOADING'; // LOADING, READY, NOT_AUTHENTICATED
        
        // Create initial auth ready promise
        this._createAuthReadyPromise();
        
        console.log('[AUTH] AuthStateManager initialized - State: LOADING');
    }
    
    /**
     * Create a new promise for auth ready
     */
    _createAuthReadyPromise() {
        console.log('[AUTH] AUTH READY - Creating new auth ready promise');
        this.authReadyPromise = new Promise((resolve, reject) => {
            this.authReadyResolve = resolve;
            this.authReadyReject = reject;
            console.log('[AUTH] AUTH READY - Promise created, resolve function set:', !!this.authReadyResolve);
        });
    }
    
    /**
     * Wait for auth to be ready (AUTHENTICATED state)
     * CRITICAL: Only resolves for AUTHENTICATED state
     * NOT_AUTHENTICATED timeout is NORMAL, not an error
     */
    async waitForReady(timeout = 10000) {
        // If already ready, return immediately
        if (this.authState === 'READY' && this.isAuthenticated) {
            console.log('[AUTH] AUTH READY - Already ready, returning immediately');
            return true;
        }
        
        // CRITICAL: NOT_AUTHENTICATED is a VALID state, NOT an error
        // We wait for potential login, but timeout is acceptable and normal
        
        // Check if promise is still pending
        const hasPendingPromise = this.authReadyResolve !== null;
        
        if (!hasPendingPromise) {
            // Promise already resolved/rejected, create new one for potential login
            console.log('[AUTH] AUTH WAITING - No pending promise, creating new one');
            this._createAuthReadyPromise();
        }
        
        // Wait for promise with timeout
        // This will resolve when SIGNED_IN event fires
        const currentState = this.authState;
        console.log(`[AUTH] AUTH WAITING - Waiting for auth to be ready (state: ${currentState}, timeout: ${timeout}ms)...`);
        
        try {
            const result = await Promise.race([
                this.authReadyPromise,
                new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error('Auth ready timeout'));
                    }, timeout);
                })
            ]);
            console.log('[AUTH] AUTH READY - Promise resolved:', result);
            return result === true;
        } catch (error) {
            // Timeout is NORMAL for NOT_AUTHENTICATED state
            // This is NOT an error - user simply hasn't logged in yet
            if (this.authState === 'NOT_AUTHENTICATED') {
                console.log(`[AUTH] AUTH NOT READY - Timeout (user not logged in, state: ${this.authState}) - This is NORMAL`);
            } else {
                console.warn(`[AUTH] AUTH NOT READY - ${error.message}`);
            }
            return false;
        }
    }
    
    /**
     * Update authentication state
     * CRITICAL: SIGNED_IN event should be the PRIMARY trigger for AUTHENTICATED
     * This method can be called manually, but SIGNED_IN event is authoritative
     */
    updateState(authenticated, user = null, session = null) {
        const wasAuthenticated = this.isAuthenticated;
        const previousState = this.authState;
        
        this.isAuthenticated = authenticated;
        this.currentUser = user;
        this.currentSession = session;
        
        // Update auth state
        if (authenticated && user && session && session.access_token) {
            // CRITICAL: Only set READY if we have valid session
            this.authState = 'READY';
            
            // Resolve auth ready promise if pending
            if (this.authReadyResolve) {
                console.log('[AUTH] AUTH READY - Resolving auth ready promise (SIGNED_IN event)');
                console.log('[AUTH] AUTH READY - Promise resolve function exists:', !!this.authReadyResolve);
                try {
                    this.authReadyResolve(true);
                    console.log('[AUTH] AUTH READY - ✅ Promise resolved successfully');
                } catch (error) {
                    console.error('[AUTH] AUTH READY - ❌ Error resolving promise:', error);
                }
                this.authReadyResolve = null;
                this.authReadyReject = null;
            } else {
                // Promise was already resolved, create new one for future use
                console.log('[AUTH] AUTH READY - Promise already resolved, creating new one for future use');
                this._createAuthReadyPromise();
            }
        } else {
            // NOT_AUTHENTICATED state - this is NORMAL, not an error
            this.authState = 'NOT_AUTHENTICATED';
            
            // CRITICAL: Don't reject promise when setting to NOT_AUTHENTICATED
            // The promise should only resolve when auth becomes READY
            // If user logs in later, SIGNED_IN event will trigger updateState(true)
            
            // Only create new promise if user was previously READY (explicit logout)
            // OR if promise was already resolved (to allow waiting for future login)
            if (previousState === 'READY') {
                // User was authenticated but now logged out, create new promise for future login
                console.log('[AUTH] STATE CHANGE - User logged out, creating new auth ready promise for future login');
                this._createAuthReadyPromise();
            } else if (!this.authReadyResolve) {
                // Promise was already resolved but we're setting to NOT_AUTHENTICATED
                // Create new promise so waitForReady() can wait for future login
                console.log('[AUTH] STATE CHANGE - Promise already resolved, creating new one for potential login');
                this._createAuthReadyPromise();
            }
            // If previousState was LOADING and we're setting to NOT_AUTHENTICATED,
            // keep the promise pending so it can resolve if user logs in
        }
        
        // Sync with global state
        window.isAuthenticated = authenticated;
        if (user) {
            window.currentUser = user;
        }
        if (session) {
            window.currentSession = session;
        }
        
        // Notify listeners if state changed
        if (wasAuthenticated !== authenticated || previousState !== this.authState) {
            console.log(`[AUTH] STATE CHANGE - ${authenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'} (${this.authState})`);
            this.notifyListeners({ 
                isAuthenticated: authenticated, 
                user, 
                session,
                state: this.authState
            });
        }
    }
    
    /**
     * Get current auth state
     */
    getAuthState() {
        return this.authState;
    }
    
    /**
     * Check if auth is ready
     */
    isReady() {
        return this.authState === 'READY' && this.isAuthenticated;
    }
    
    /**
     * Get current state
     */
    getState() {
        return {
            isAuthenticated: this.isAuthenticated,
            currentUser: this.currentUser,
            currentSession: this.currentSession,
            authState: this.authState
        };
    }
    
    /**
     * Check if currently authenticated
     * Verifies token validity, not just existence
     */
    async checkAuthentication() {
        // Check internal state first
        if (this.isAuthenticated && this.currentUser && this.currentSession) {
            // Verify token is not expired
            if (this.currentSession.expires_at) {
                const now = Math.floor(Date.now() / 1000);
                if (now >= this.currentSession.expires_at - 60) {
                    // Token expired, try to sync with Supabase
                    return await this.syncWithSupabase();
                }
            }
            return true;
        }
        
        // Check global state
        if (window.isAuthenticated && window.currentUser && window.currentSession) {
            this.updateState(true, window.currentUser, window.currentSession);
            return true;
        }
        
        // Try to sync with Supabase before returning false
        return await this.syncWithSupabase();
    }
    
    /**
     * Sync authentication state with Supabase session
     */
    async syncWithSupabase() {
        try {
            const client = window.supabaseClient || (window.SupabaseClientManager && window.SupabaseClientManager.getClient());
            if (!client) {
                console.log('[AUTH] STATE SYNC - Supabase client not available');
                return false;
            }
            
            console.log('[AUTH] STATE SYNC - Checking Supabase session...');
            const { data: { session }, error } = await client.auth.getSession();
            
            if (error) {
                console.warn('[AUTH] STATE SYNC - Error getting session:', error);
                return false;
            }
            
            if (!session || !session.access_token) {
                console.log('[AUTH] STATE SYNC - No session found in Supabase');
                // Only update state if still in LOADING to avoid overwriting SIGNED_IN event
                if (this.authState === 'LOADING') {
                    this.updateState(false, null, null);
                }
                return false;
            }
            
            // Update state with Supabase session
            console.log('[AUTH] STATE SYNC - Session found, updating state');
            this.updateState(true, session.user, session);
            return true;
        } catch (error) {
            console.warn('[AUTH] STATE SYNC - Error syncing with Supabase:', error);
            return false;
        }
    }
    
    /**
     * Initialize auth state by checking Supabase session
     * Should be called once when app starts
     * CRITICAL: Only sets NOT_AUTHENTICATED if still in LOADING state
     */
    async initialize() {
        // Only initialize if still in LOADING state (avoid re-initialization)
        if (this.authState !== 'LOADING' && (this.authState === 'READY' || this.isAuthenticated)) {
            console.log(`[AUTH] INIT - Already initialized (state: ${this.authState}), skipping`);
            return;
        }
        
        console.log('[AUTH] INIT - Initializing auth state...');
        this.authState = 'LOADING';
        
        // Wait for Supabase client
        if (window.SupabaseClientManager) {
            try {
                await window.SupabaseClientManager.waitForClient(5000);
            } catch (e) {
                console.warn('[AUTH] INIT - Supabase client not ready');
                this.updateState(false, null, null);
                return;
            }
        }
        
        // Sync with Supabase
        const synced = await this.syncWithSupabase();
        
        if (!synced) {
            // No session found, mark as NOT_AUTHENTICATED
            // But only if still in LOADING state (to avoid overwriting SIGNED_IN event)
            if (this.authState === 'LOADING') {
                this.updateState(false, null, null);
            }
        }
        
        console.log(`[AUTH] INIT - Auth state initialized: ${this.authState}`);
    }
    
    /**
     * Clear authentication state
     * Only clears if confirmed no session exists in Supabase
     */
    async clearState(force = false) {
        // If force is true, clear immediately (for explicit logout)
        if (force) {
            this.updateState(false, null, null);
            
            // Clear session cache
            if (window.clearSessionCache) {
                window.clearSessionCache();
            }
            
            console.log('[AUTH] STATE CLEARED - Force clear (explicit logout)');
            return;
        }
        
        // Otherwise, verify no session exists before clearing
        try {
            const client = window.supabaseClient || (window.SupabaseClientManager && window.SupabaseClientManager.getClient());
            if (client) {
                const { data: { session } } = await client.auth.getSession();
                if (session && session.access_token) {
                    console.warn('[AUTH] STATE CLEAR - Prevented: Session still exists in Supabase');
                    // Session exists, don't clear - might just be a temporary issue
                    return;
                }
            }
        } catch (error) {
            console.warn('[AUTH] STATE CLEAR - Error checking Supabase session:', error);
            // On error, assume no session and proceed with clear
        }
        
        // No session exists, safe to clear
        this.updateState(false, null, null);
        
        // Clear session cache
        if (window.clearSessionCache) {
            window.clearSessionCache();
        }
        
        console.log('[AUTH] STATE CLEARED - Confirmed no session exists');
    }
    
    /**
     * Add state change listener
     */
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    /**
     * Remove state change listener
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
    notifyListeners(state) {
        this.listeners.forEach(callback => {
            try {
                // Support both old format (authenticated, user, session) and new format (state object)
                if (typeof callback === 'function') {
                    if (callback.length === 3) {
                        // Old format
                        callback(state.isAuthenticated, state.user, state.session);
                    } else {
                        // New format
                        callback(state);
                    }
                }
            } catch (error) {
                console.error('[AUTH] LISTENER ERROR - Error in auth listener:', error);
            }
        });
    }
    
    // Legacy compatibility methods
    startAuthCheck() { return true; }
    endAuthCheck() {}
}

// Create global instance
window.authStateManager = new AuthStateManager();

// Initialize auth state when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.authStateManager.initialize();
    });
} else {
    // DOM already loaded, initialize immediately
    window.authStateManager.initialize();
}

// Backward compatibility
window.updateAuthState = (authenticated, user, session) => {
    window.authStateManager.updateState(authenticated, user, session);
};

window.clearAuthState = (force = false) => {
    window.authStateManager.clearState(force);
};

window.checkAuthState = () => {
    return window.authStateManager.checkAuthentication();
};

window.waitForAuthReady = async (timeout) => {
    if (window.authStateManager && typeof window.authStateManager.waitForReady === 'function') {
        return await window.authStateManager.waitForReady(timeout);
    }
    return false;
};

console.log('[AUTH] AuthStateManager loaded - Best Practice Implementation');
