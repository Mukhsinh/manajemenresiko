// Authentication service layer

/**
 * Check if user is authenticated
 */
async function checkAuth() {
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            throw new Error('Supabase client not available');
        }
        
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
            throw error;
        }
        
        return {
            authenticated: !!session,
            user: session?.user || null,
            session: session || null
        };
    } catch (error) {
        console.error('Auth check error:', error);
        return {
            authenticated: false,
            user: null,
            session: null,
            error: error.message
        };
    }
}

/**
 * Login with email and password
 */
async function login(email, password) {
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            throw new Error('Supabase client not available');
        }
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email.trim(),
            password
        });

        if (error) {
            throw error;
        }

        return {
            success: true,
            user: data.user,
            session: data.session
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: error.message || 'Login failed. Please try again.'
        };
    }
}

/**
 * Register new user
 */
async function register(email, password, fullName) {
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            throw new Error('Supabase client not available');
        }
        
        const { data, error } = await supabaseClient.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: {
                    full_name: fullName?.trim() || ''
                }
            }
        });

        if (error) {
            throw error;
        }

        return {
            success: true,
            user: data.user,
            message: 'Registration successful. Please check your email to verify your account.'
        };
    } catch (error) {
        console.error('Register error:', error);
        return {
            success: false,
            error: error.message || 'Registration failed. Please try again.'
        };
    }
}

/**
 * Logout current user
 */
async function logout() {
    try {
        const supabaseClient = window.supabaseClient;
        if (supabaseClient) {
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                throw error;
            }
        }
        
        return {
            success: true
        };
    } catch (error) {
        console.error('Logout error:', error);
        // Still return success even if logout fails on server
        return {
            success: true,
            error: error.message
        };
    }
}

/**
 * Get current user data from API
 */
async function getCurrentUser() {
    try {
        const userData = await window.apiCall('/api/auth/me');
        return {
            success: true,
            user: userData.user
        };
    } catch (error) {
        console.error('Get user error:', error);
        return {
            success: false,
            error: error.message || 'Failed to get user data'
        };
    }
}

/**
 * Setup auth state change listener
 */
function onAuthStateChange(callback) {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
        console.warn('Supabase client not available for auth state listener');
        return null;
    }
    
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
    
    return subscription;
}

// Export for use in other modules
window.authService = {
    checkAuth,
    login,
    register,
    logout,
    getCurrentUser,
    onAuthStateChange
};

