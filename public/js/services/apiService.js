// Centralized API service for making HTTP requests

let API_BASE_URL = window.location.origin;
let authToken = null;

/**
 * Set authentication token
 */
function setAuthToken(token) {
    authToken = token;
}

/**
 * Get authentication token from Supabase session
 */
async function getAuthToken() {
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) return null;
        
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session?.access_token || null;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
}

/**
 * Make API call with automatic authentication
 */
async function apiCall(endpoint, options = {}) {
    try {
        // Get fresh token for each request
        const token = await getAuthToken();
        
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

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        if (!response.ok) {
            let error;
            if (isJson) {
                try {
                    error = await response.json();
                } catch (e) {
                    error = { error: response.statusText };
                }
            } else {
                error = { error: response.statusText };
            }
            
            // Handle 401 - Unauthorized
            if (response.status === 401) {
                // Clear session and redirect to login
                const supabaseClient = window.supabaseClient;
                if (supabaseClient) {
                    await supabaseClient.auth.signOut();
                }
                if (window.app && window.app.showLogin) {
                    window.app.showLogin();
                }
            }
            
            throw new Error(error.error || error.message || 'Request failed');
        }

        // Handle empty responses
        if (isJson) {
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        }
        
        return await response.text();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

/**
 * GET request
 */
async function get(endpoint, options = {}) {
    return apiCall(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
async function post(endpoint, data, options = {}) {
    return apiCall(endpoint, {
        ...options,
        method: 'POST',
        body: data
    });
}

/**
 * PUT request
 */
async function put(endpoint, data, options = {}) {
    return apiCall(endpoint, {
        ...options,
        method: 'PUT',
        body: data
    });
}

/**
 * DELETE request
 */
async function del(endpoint, options = {}) {
    return apiCall(endpoint, { ...options, method: 'DELETE' });
}

// Export for use in other modules
window.apiService = {
    apiCall,
    get,
    post,
    put,
    delete: del,
    setAuthToken,
    getAuthToken
};

// Make apiCall available globally for backward compatibility
window.apiCall = apiCall;

