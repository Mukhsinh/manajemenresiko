// ============================================================================
// Supabase Client Manager & API Service - Single Source of Truth
// ============================================================================

// API Base URL - Prevent duplicate declaration
// Use var to allow redeclaration if script is loaded multiple times
var API_BASE_URL;
if (typeof window.API_BASE_URL !== 'undefined') {
    // Use existing value if already set (from previous script load)
    API_BASE_URL = window.API_BASE_URL;
} else {
    // Initialize if not set
    API_BASE_URL = window.location.origin;
    window.API_BASE_URL = API_BASE_URL;
}

// Session cache to avoid redundant calls
let cachedSession = null;
let sessionCacheTime = 0;
const SESSION_CACHE_TTL = 5000; // 5 seconds cache

// ============================================================================
// Supabase Client Manager - Singleton Pattern
// ============================================================================
const SupabaseClientManager = (() => {
    let instance = null;
    let initPromise = null;
    let isReady = false;
    let readyCallbacks = [];
    
    async function initialize() {
        if (isReady && instance) {
            return instance;
        }
        
        if (initPromise) {
            return initPromise;
        }
        
        initPromise = (async () => {
            try {
                console.log('🔄 Initializing Supabase client...');
                
                // 1. Fetch config
                const response = await fetch('/api/config');
                if (!response.ok) {
                    throw new Error(`Config fetch failed: ${response.status}`);
                }
                
                const config = await response.json();
                if (!config.supabaseUrl || !config.supabaseAnonKey) {
                    throw new Error('Invalid config: missing Supabase credentials');
                }
                
                // 2. Wait for Supabase library (max 5 seconds)
                let libWaitCount = 0;
                while (!window.supabase && libWaitCount < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    libWaitCount++;
                }
                
                if (!window.supabase) {
                    throw new Error('Supabase library not loaded');
                }
                
                // 3. Create client with persistence
                instance = window.supabase.createClient(
                    config.supabaseUrl,
                    config.supabaseAnonKey,
                    {
                        auth: {
                            persistSession: true,
                            autoRefreshToken: true,
                            detectSessionInUrl: true
                        }
                    }
                );
                
                // 4. Set global references
                window.supabaseClient = instance;
                window.supabaseClientReady = true;
                isReady = true;
                
                console.log('[AUTH] Supabase client initialized successfully');
                
                // 5. Setup Supabase auth state change listener FIRST
                // This ensures we catch SIGNED_IN events immediately
                setupSupabaseAuthListener(instance);
                
                // 6. Initial session check - restore session if exists
                // This is called AFTER listener setup so INITIAL_SESSION event is handled correctly
                await initializeAuthState(instance);
                
                // 7. Notify all waiting callbacks
                readyCallbacks.forEach(callback => {
                    try {
                        callback(null, instance);
                    } catch (err) {
                        console.error('Callback error:', err);
                    }
                });
                readyCallbacks = [];
                
                return instance;
                
            } catch (error) {
                console.error('❌ Supabase initialization failed:', error);
                initPromise = null;
                
                // Notify callbacks of failure
                readyCallbacks.forEach(callback => {
                    try {
                        callback(error, null);
                    } catch (err) {
                        console.error('Callback error:', err);
                    }
                });
                readyCallbacks = [];
                
                throw error;
            }
        })();
        
        return initPromise;
    }
    
    function getClient() {
        return isReady && instance ? instance : null;
    }
    
    async function waitForClient(timeout = 10000) {
        if (isReady && instance) {
            return instance;
        }
        
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Timeout waiting for Supabase client'));
            }, timeout);
            
            readyCallbacks.push((error, client) => {
                clearTimeout(timeoutId);
                if (error) {
                    reject(error);
                } else {
                    resolve(client);
                }
            });
            
            // Start initialization if not already started
            if (!initPromise) {
                initialize().catch(() => {});
            }
        });
    }
    
    function isClientReady() {
        return isReady && !!instance;
    }
    
    return {
        initialize,
        getClient,
        waitForClient,
        isClientReady
    };
})();

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SupabaseClientManager.initialize();
    });
} else {
    SupabaseClientManager.initialize();
}

// ============================================================================
// Setup Supabase Auth State Change Listener
// CRITICAL: This is the SOURCE OF TRUTH for auth state changes
// ============================================================================
function setupSupabaseAuthListener(client) {
    if (!client || !client.auth) {
        console.warn('[AUTH] Cannot setup auth listener - client not available');
        return;
    }
    
    console.log('[AUTH] Setting up Supabase auth state change listener...');
    
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
        console.log(`[AUTH] SUPABASE EVENT - ${event}`, session ? `User: ${session.user?.email}` : 'No session');
        
        // CRITICAL: SIGNED_IN event is the source of truth for authentication
        // Always trust this event over manual state updates
        if (window.authStateManager) {
            if (event === 'SIGNED_IN' && session && session.user && session.access_token) {
                // User successfully signed in - this is the authoritative event
                console.log('[AUTH] SUPABASE EVENT - SIGNED_IN detected, updating auth state');
                console.log('[AUTH] SUPABASE EVENT - Session user:', session.user.email);
                console.log('[AUTH] SUPABASE EVENT - Session token available:', !!session.access_token);
                
                // Update global state immediately
                window.currentSession = session;
                window.currentUser = session.user;
                window.isAuthenticated = true;
                
                // CRITICAL: Update AuthStateManager - this will resolve waitForReady() promise
                // This MUST be called to resolve any pending waitForReady() calls
                console.log('[AUTH] SUPABASE EVENT - Calling updateState() to resolve waitForReady() promise...');
                window.authStateManager.updateState(true, session.user, session);
                
                const authState = window.authStateManager.getAuthState();
                const isReady = window.authStateManager.isReady();
                console.log(`[AUTH] SUPABASE EVENT - Auth state updated to: ${authState}`);
                console.log(`[AUTH] SUPABASE EVENT - Auth is ready: ${isReady}`);
                console.log(`[AUTH] SUPABASE EVENT - Auth authenticated: ${window.authStateManager.isAuthenticated}`);
                
                // CRITICAL: Verify promise was resolved
                if (window.authStateManager.authReadyResolve === null && authState === 'READY') {
                    console.log('[AUTH] SUPABASE EVENT - ✅ waitForReady() promise resolved successfully');
                } else if (window.authStateManager.authReadyResolve !== null) {
                    console.warn('[AUTH] SUPABASE EVENT - ⚠️ waitForReady() promise still pending after updateState()');
                }
                
                // PATCH: Force page refresh for login pages to ensure proper state
                if (window.location.pathname === '/login' || window.location.pathname.includes('login')) {
                    console.log('[AUTH] SUPABASE EVENT - Login detected, redirecting to dashboard...');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                }
                
            } else if (event === 'TOKEN_REFRESHED' && session && session.user && session.access_token) {
                // Token refreshed - update session but don't change auth state
                console.log('[AUTH] SUPABASE EVENT - TOKEN_REFRESHED, updating session');
                window.currentSession = session;
                window.currentUser = session.user;
                
                // Update AuthStateManager to refresh session data
                if (window.authStateManager.isAuthenticated) {
                    window.authStateManager.updateState(true, session.user, session);
                }
                
            } else if (event === 'SIGNED_OUT') {
                // Explicit sign out - clear all state
                console.log('[AUTH] SUPABASE EVENT - SIGNED_OUT, clearing auth state');
                window.currentSession = null;
                window.currentUser = null;
                window.isAuthenticated = false;
                window.authStateManager.updateState(false, null, null);
                
            } else if (event === 'INITIAL_SESSION') {
                // Initial session check - handled separately by initializeAuthState()
                // CRITICAL: Don't update AuthStateManager here to avoid race conditions
                // Only update global state for immediate use
                if (session && session.user && session.access_token) {
                    console.log('[AUTH] SUPABASE EVENT - INITIAL_SESSION with session found');
                    // Update global state but let initializeAuthState handle AuthStateManager
                    window.currentSession = session;
                    window.currentUser = session.user;
                    window.isAuthenticated = true;
                    // Don't call updateState here - let initializeAuthState do it
                } else {
                    console.log('[AUTH] SUPABASE EVENT - INITIAL_SESSION with no session');
                    // CRITICAL: Don't set NOT_AUTHENTICATED here
                    // Let initializeAuthState handle it AFTER checking session
                    // This prevents premature state change before auth is fully initialized
                }
            }
        } else {
            // Fallback: Update global state directly if AuthStateManager not available
            if (session && session.user && session.access_token) {
                window.currentSession = session;
                window.currentUser = session.user;
                window.isAuthenticated = true;
            } else if (event === 'SIGNED_OUT') {
                window.currentSession = null;
                window.currentUser = null;
                window.isAuthenticated = false;
            }
        }
    });
    
    // Store subscription for cleanup if needed
    window.supabaseAuthSubscription = subscription;
    
    console.log('[AUTH] Supabase auth state change listener setup complete');
}

// ============================================================================
// Initialize Auth State from Supabase Session
// CRITICAL: Called AFTER listener setup to avoid race conditions
// ============================================================================
async function initializeAuthState(client) {
    if (!client || !client.auth) {
        return;
    }
    
    try {
        console.log('[AUTH] INIT - Checking initial session from Supabase...');
        
        // Wait a small delay to ensure listener is fully set up
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error) {
            console.warn('[AUTH] INIT - Error getting initial session:', error);
            // Only update state if still in LOADING state
            if (window.authStateManager && window.authStateManager.authState === 'LOADING') {
                window.authStateManager.updateState(false, null, null);
            }
            return;
        }
        
        if (session && session.user && session.access_token) {
            console.log('[AUTH] INIT - Initial session found, restoring auth state');
            
            // Update global state
            window.currentSession = session;
            window.currentUser = session.user;
            window.isAuthenticated = true;
            
            // Update AuthStateManager
            // CRITICAL: Only update if still in LOADING state
            // This prevents overwriting if SIGNED_IN event already fired
            if (window.authStateManager) {
                if (window.authStateManager.authState === 'LOADING') {
                    window.authStateManager.updateState(true, session.user, session);
                } else {
                    console.log('[AUTH] INIT - Auth state already set (not LOADING), skipping update');
                }
            }
        } else {
            console.log('[AUTH] INIT - No initial session found');
            
            // CRITICAL: Only set NOT_AUTHENTICATED if still in LOADING state
            // This prevents overwriting state if SIGNED_IN event already fired
            // NOT_AUTHENTICATED is NORMAL, not an error
            if (window.authStateManager) {
                if (window.authStateManager.authState === 'LOADING') {
                    console.log('[AUTH] INIT - Setting NOT_AUTHENTICATED (this is NORMAL, not an error)');
                    window.authStateManager.updateState(false, null, null);
                } else {
                    console.log('[AUTH] INIT - Auth state already set, skipping update');
                }
            }
        }
    } catch (error) {
        console.error('[AUTH] INIT - Error initializing auth state:', error);
        // Only update state if still in LOADING state
        if (window.authStateManager && window.authStateManager.authState === 'LOADING') {
            window.authStateManager.updateState(false, null, null);
        }
    }
}

// Export global manager
window.SupabaseClientManager = SupabaseClientManager;

// Backward compatibility
window.configManager = {
    loadConfig: () => SupabaseClientManager.initialize(),
    isReady: () => SupabaseClientManager.isClientReady(),
    waitForSupabaseClient: (timeout) => SupabaseClientManager.waitForClient(timeout),
    onConfigReady: (callback) => {
        if (SupabaseClientManager.isClientReady()) {
            callback();
        } else {
            SupabaseClientManager.waitForClient().then(() => callback()).catch(callback);
        }
    }
};

// ============================================================================
// Authentication Token Helper - Single Source
// ============================================================================
async function getAuthToken() {
    try {
        const now = Date.now();
        const nowSeconds = Math.floor(now / 1000);
        
        // PRIORITY 1: Use global session if available (set immediately after login)
        if (window.currentSession && window.currentSession.access_token) {
            // Check if token is not expired
            if (window.currentSession.expires_at) {
                const expiresAt = window.currentSession.expires_at;
                if (nowSeconds < expiresAt - 60) {
                    cachedSession = window.currentSession;
                    sessionCacheTime = now;
                    console.log('[AUTH] TOKEN SET - Using window.currentSession (valid)');
                    return window.currentSession.access_token;
                }
                // Token expiring soon, but still return it
                console.log('[AUTH] TOKEN EXPIRED - Token expiring soon, but still returning');
                cachedSession = window.currentSession;
                sessionCacheTime = now;
                return window.currentSession.access_token;
            } else {
                cachedSession = window.currentSession;
                sessionCacheTime = now;
                console.log('[AUTH] TOKEN SET - Using window.currentSession (no expiry info)');
                return window.currentSession.access_token;
            }
        }
        
        // PRIORITY 2: Use cached session if still valid (within TTL)
        if (cachedSession && cachedSession.access_token && (now - sessionCacheTime) < SESSION_CACHE_TTL) {
            if (cachedSession.expires_at) {
                const expiresAt = cachedSession.expires_at;
                if (nowSeconds < expiresAt - 60) {
                    console.log('[AUTH] TOKEN SET - Using cached session');
                    return cachedSession.access_token;
                }
            } else {
                console.log('[AUTH] TOKEN SET - Using cached session (no expiry info)');
                return cachedSession.access_token;
            }
        }
        
        // PRIORITY 3: Get from Supabase client (fallback)
        const client = window.supabaseClient || SupabaseClientManager.getClient();
        if (!client) {
            console.warn('[AUTH] TOKEN ERROR - Supabase client not available');
            return null;
        }
        
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error) {
            console.error('[AUTH] TOKEN ERROR - Error getting session:', error);
            return null;
        }
        
        if (session && session.access_token) {
            // Update global and cache
            window.currentSession = session;
            cachedSession = session;
            sessionCacheTime = now;
            console.log('[AUTH] TOKEN SET - Retrieved from Supabase client');
            return session.access_token;
        }
        
        console.warn('[AUTH] TOKEN ERROR - No session available');
        return null;
    } catch (error) {
        console.error('[AUTH] TOKEN ERROR - Error getting auth token:', error);
        return null;
    }
}

// ============================================================================
// Wait for Auth Ready - Centralized Auth Guard (Event-based)
// ============================================================================
async function waitForAuthReady(timeout = 10000) {
    // Use AuthStateManager's waitForReady if available (preferred)
    if (window.authStateManager && typeof window.authStateManager.waitForReady === 'function') {
        try {
            const ready = await window.authStateManager.waitForReady(timeout);
            if (ready) {
                console.log('[AUTH] AUTH READY - Auth state manager confirms ready');
                return true;
            }
        } catch (error) {
            console.warn('[AUTH] AUTH NOT READY - Auth state manager timeout:', error.message);
        }
    }
    
    // Fallback: Check if already ready
    if (window.isAuthenticated && window.currentSession && window.currentSession.access_token) {
        const token = await getAuthToken();
        if (token) {
            console.log('[AUTH] AUTH READY - Token available (fallback check)');
            return true;
        }
    }
    
    console.warn('[AUTH] AUTH NOT READY - Timeout waiting for authentication');
    return false;
}

// ============================================================================
// API Call Helper - Single Source
// ============================================================================
async function apiCall(endpoint, options = {}, retryCount = 0) {
    const MAX_RETRIES = 1; // Only retry once for token refresh
    
    try {
        // Check if this is a public endpoint
        const publicEndpoints = ['/api/config', '/api/health', '/api/test'];
        const isPublicEndpoint = publicEndpoints.some(ep => endpoint.startsWith(ep));
        
        // Get auth token (skip for public endpoints)
        let token = null;
        if (!isPublicEndpoint) {
            // Wait for auth to be ready before making API call
            const authReady = await waitForAuthReady(5000);
            if (!authReady && !window.isAuthenticated) {
                throw new Error('Anda harus login terlebih dahulu untuk mengakses data ini.');
            }
            
            token = await getAuthToken();
            
            if (token) {
                console.log(`[AUTH] API CALL - Token attached to ${endpoint}`);
            } else {
                console.warn(`[AUTH] API CALL - No token for ${endpoint} (public endpoint or not authenticated)`);
            }
        } else {
            console.log(`[AUTH] API CALL - Public endpoint ${endpoint}, no token required`);
        }
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        // Handle body for POST/PUT requests
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Handle 401 - try to refresh token once before giving up
        if (response.status === 401) {
            console.warn(`[AUTH] API CALL - 401 Unauthorized for ${endpoint}`);
            
            // Only attempt refresh if this is the first retry and we're authenticated
            if (retryCount < MAX_RETRIES && window.isAuthenticated) {
                console.log('[AUTH] TOKEN EXPIRED - Attempting token refresh...');
                
                const client = window.supabaseClient || SupabaseClientManager.getClient();
                if (client) {
                    try {
                        // Use refreshSession() to actually refresh the token
                        const { data: { session }, error } = await client.auth.refreshSession();
                        
                        if (!error && session && session.access_token) {
                            // Update session and retry
                            window.currentSession = session;
                            cachedSession = session;
                            sessionCacheTime = Date.now();
                            
                            // Update auth state manager
                            if (window.authStateManager) {
                                window.authStateManager.updateState(true, session.user, session);
                            }
                            
                            console.log('[AUTH] REFRESH SUCCESS - Token refreshed, retrying request...');
                            return apiCall(endpoint, options, retryCount + 1);
                        } else {
                            console.warn('[AUTH] REFRESH FAILED - refreshSession returned error or no session');
                            // Check if session still exists (might just be expired but refreshable via getSession)
                            const { data: { session: existingSession } } = await client.auth.getSession();
                            if (existingSession && existingSession.access_token) {
                                // Session exists, update and retry
                                window.currentSession = existingSession;
                                cachedSession = existingSession;
                                sessionCacheTime = Date.now();
                                console.log('[AUTH] REFRESH SUCCESS - Using existing session, retrying request...');
                                return apiCall(endpoint, options, retryCount + 1);
                            }
                        }
                    } catch (e) {
                        console.warn('[AUTH] REFRESH FAILED - Exception during refresh:', e);
                    }
                }
            }
            
            // Only clear state if refresh truly failed (no session exists)
            // Check one more time if session exists in Supabase
            const client = window.supabaseClient || SupabaseClientManager.getClient();
            let hasSession = false;
            if (client) {
                try {
                    const { data: { session } } = await client.auth.getSession();
                    hasSession = !!(session && session.access_token);
                } catch (e) {
                    // Ignore error, assume no session
                }
            }
            
            // Only clear state if no session exists at all
            if (!hasSession) {
                console.log('[AUTH] REFRESH FAILED - No session exists, clearing auth state');
                
                // Clear session and notify
                cachedSession = null;
                sessionCacheTime = 0;
                window.currentSession = null;
                window.currentUser = null;
                window.isAuthenticated = false;
                
                // Clear auth state manager if available
                if (window.authStateManager) {
                    window.authStateManager.clearState();
                }
            } else {
                console.warn('[AUTH] REFRESH FAILED - Session exists but refresh failed, keeping state');
            }
            
            throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
        }

        if (!response.ok) {
            let errorMessage = `Request failed with status ${response.status}`;
            
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                }
            } catch (e) {
                // Ignore parse error
            }
            
            throw new Error(errorMessage);
        }

        // Handle response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    } catch (error) {
        // Don't log if it's our own error message (already logged above)
        if (!error.message || (!error.message.includes('Sesi Anda') && !error.message.includes('login'))) {
            console.error('[AUTH] API CALL ERROR:', error);
        }
        throw error;
    }
}

// ============================================================================
// Clear Session Cache (called on logout or to force token refresh)
// ============================================================================
function clearSessionCache() {
    // Clear the cache but preserve window.currentSession if it exists
    cachedSession = null;
    sessionCacheTime = 0;
    
    // If window.currentSession exists and is valid, immediately re-cache it
    if (window.currentSession && window.currentSession.access_token) {
        const now = Date.now();
        const nowSeconds = Math.floor(now / 1000);
        
        // Check if session is still valid (not expired)
        if (!window.currentSession.expires_at || nowSeconds < window.currentSession.expires_at - 60) {
            cachedSession = window.currentSession;
            sessionCacheTime = now;
            console.log('🔄 Session cache cleared and re-cached from window.currentSession');
        }
    }
}

// ============================================================================
// Export globally
// ============================================================================
window.getAuthToken = getAuthToken;
window.apiCall = apiCall;
window.clearSessionCache = clearSessionCache;
window.waitForAuthReady = waitForAuthReady;

console.log('[AUTH] Config.js loaded - Single source for auth & API');
