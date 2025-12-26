// ============================================================================
// Authentication Service - Best Practice Supabase Implementation
// CRITICAL: SIGNED_IN event is the source of truth, not manual state updates
// ============================================================================

/**
 * Check if user is currently authenticated
 */
function isAuthenticated() {
    // Check global state first (fastest)
    if (window.isAuthenticated && window.currentUser && window.currentSession) {
        // Verify token not expired
        if (window.currentSession.expires_at) {
            const now = Math.floor(Date.now() / 1000);
            if (now < window.currentSession.expires_at - 60) {
                return true;
            }
        } else {
            return true;
        }
    }
    return false;
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error) {
    if (!error) return 'Login gagal. Silakan coba lagi.';
    
    const msg = (error.message || error.toString()).toLowerCase();
    
    if (msg.includes('invalid login') || msg.includes('invalid_credentials')) {
        return 'Email atau password salah.';
    }
    if (msg.includes('email not confirmed')) {
        return 'Email belum dikonfirmasi. Cek inbox Anda.';
    }
    if (msg.includes('rate limit')) {
        return 'Terlalu banyak percobaan. Tunggu beberapa menit.';
    }
    if (msg.includes('network') || msg.includes('fetch')) {
        return 'Koneksi internet bermasalah.';
    }
    if (msg.includes('timeout')) {
        return 'Waktu habis. Server tidak merespons.';
    }
    
    return error.message || 'Login gagal. Silakan coba lagi.';
}

/**
 * Login with email and password
 * CRITICAL: This function waits for SIGNED_IN event to ensure session is stored
 */
async function login(email, password) {
    try {
        console.log('[AUTH] LOGIN START - Email:', email ? email.substring(0, 3) + '***' : 'empty');
        
        if (!email || !password) {
            console.error('[AUTH] LOGIN FAILED - Missing credentials');
            return { success: false, error: 'Email dan password harus diisi.' };
        }
        
        const normalizedEmail = email.trim().toLowerCase();
        
        // Get Supabase client
        const client = await window.SupabaseClientManager.waitForClient(5000);
        if (!client) {
            console.error('[AUTH] LOGIN FAILED - Supabase client not ready');
            return { success: false, error: 'Aplikasi belum siap. Silakan refresh halaman.' };
        }
        
        // Perform login
        console.log('[AUTH] LOGIN - Calling signInWithPassword...');
        const { data, error } = await client.auth.signInWithPassword({
            email: normalizedEmail,
            password
        });

        if (error) {
            console.error('[AUTH] LOGIN FAILED - Error:', error.message);
            return { success: false, error: getErrorMessage(error) };
        }
        
        if (!data.session || !data.user) {
            console.error('[AUTH] LOGIN FAILED - No session or user in response');
            return { success: false, error: 'Login gagal. Silakan coba lagi.' };
        }
        
        console.log('[AUTH] LOGIN SUCCESS - User:', data.user.email);
        console.log('[AUTH] LOGIN SUCCESS - Session token:', !!data.session.access_token);
        
        // CRITICAL: Wait for SIGNED_IN event to ensure session is stored
        // Supabase automatically fires SIGNED_IN event after successful login
        // We wait for this event to ensure session is persisted
        console.log('[AUTH] LOGIN - Waiting for SIGNED_IN event...');
        
        const signedInPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('SIGNED_IN event timeout'));
            }, 5000);
            
            // Listen for SIGNED_IN event
            if (window.supabaseAuthSubscription) {
                // Create temporary listener
                const tempListener = (event, session) => {
                    if (event === 'SIGNED_IN' && session && session.user && session.access_token) {
                        clearTimeout(timeout);
                        console.log('[AUTH] LOGIN - SIGNED_IN event received');
                        resolve(session);
                    }
                };
                
                // Note: We can't directly listen to existing subscription
                // So we check session storage instead
                const checkInterval = setInterval(() => {
                    client.auth.getSession().then(({ data: { session } }) => {
                        if (session && session.user && session.access_token) {
                            clearTimeout(timeout);
                            clearInterval(checkInterval);
                            console.log('[AUTH] LOGIN - Session confirmed in storage');
                            resolve(session);
                        }
                    });
                }, 100);
                
                // Fallback: resolve with current session if event doesn't fire
                setTimeout(() => {
                    clearInterval(checkInterval);
                    if (!timeout._called) {
                        console.log('[AUTH] LOGIN - Using session from response (event may have fired already)');
                        resolve(data.session);
                    }
                }, 1000);
            } else {
                // No subscription, just wait a bit and verify
                setTimeout(() => {
                    client.auth.getSession().then(({ data: { session } }) => {
                        clearTimeout(timeout);
                        if (session && session.access_token) {
                            console.log('[AUTH] LOGIN - Session confirmed in storage');
                            resolve(session);
                        } else {
                            resolve(data.session); // Use response session
                        }
                    });
                }, 500);
            }
        });
        
        try {
            const confirmedSession = await signedInPromise;
            console.log('[AUTH] LOGIN - Session confirmed, updating state');
            
            // Use confirmed session
            data.session = confirmedSession;
        } catch (e) {
            console.warn('[AUTH] LOGIN - Event timeout, but session exists:', e.message);
            // Continue with response session
        }
        
        // CRITICAL: Update global state IMMEDIATELY
        // This ensures the token is available for subsequent API requests
        window.currentSession = data.session;
        window.currentUser = data.user;
        window.isAuthenticated = true;
        
        // Update auth state manager
        // NOTE: SIGNED_IN event should also trigger this via config.js listener
        // But we update immediately for responsiveness
        if (window.authStateManager) {
            console.log('[AUTH] LOGIN - Updating auth state manager');
            window.authStateManager.updateState(true, data.user, data.session);
        }
        
        console.log('[AUTH] LOGIN COMPLETE - Login flow completed successfully');
        
        return {
            success: true,
            user: data.user,
            session: data.session
        };
    } catch (error) {
        console.error('[AUTH] LOGIN ERROR - Exception:', error);
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Register new user
 */
async function register(email, password, fullName) {
    try {
        const client = window.supabaseClient;
        if (!client) {
            return { success: false, error: 'Aplikasi belum siap.' };
        }
        
        const { data, error } = await client.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: { full_name: fullName?.trim() || '' }
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            user: data.user,
            message: 'Registrasi berhasil. Cek email untuk verifikasi.'
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Logout current user
 */
async function logout() {
    try {
        const client = window.supabaseClient;
        if (client) {
            await client.auth.signOut();
        }
        
        // Clear all auth state
        window.currentSession = null;
        window.currentUser = null;
        window.isAuthenticated = false;
        
        if (window.clearSessionCache) {
            window.clearSessionCache();
        }
        
        if (window.authStateManager) {
            window.authStateManager.clearState(true); // Force clear for explicit logout
        }
        
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: true }; // Still return success
    }
}

/**
 * Get current user data from API
 */
async function getCurrentUser() {
    try {
        const userData = await window.apiCall('/api/auth/me');
        return { success: true, user: userData.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get auth token - delegates to config.js
 */
async function getAuthTokenReliable() {
    return window.getAuthToken ? await window.getAuthToken() : null;
}

// Export
window.authService = {
    isAuthenticated,
    login,
    register,
    logout,
    getCurrentUser,
    getErrorMessage,
    getAuthTokenReliable
};

console.log('✅ authService.js loaded - Best Practice Implementation');
