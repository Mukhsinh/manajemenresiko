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
        if (!supabaseClient) {
            console.warn('Supabase client not available for token');
            return null;
        }
        
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) {
            console.error('Error getting session:', error);
            return null;
        }
        
        const token = session?.access_token;
        console.log('Auth token retrieved:', !!token);
        return token || null;
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
        console.log(`Making API call to: ${endpoint}`);
        
        // Get fresh token for each request
        const token = await getAuthToken();
        console.log(`Token available: ${!!token}`);
        
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

        console.log(`Request config:`, { url: `${API_BASE_URL}${endpoint}`, method: config.method || 'GET', hasAuth: !!token });

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        console.log(`Response status: ${response.status} ${response.statusText}`);

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
            
            console.error(`API Error (${response.status}):`, error);
            
            // Handle 401 - Unauthorized
            if (response.status === 401) {
                console.log('Unauthorized - clearing session');
                // Clear session and redirect to login
                const supabaseClient = window.supabaseClient;
                if (supabaseClient) {
                    await supabaseClient.auth.signOut();
                }
                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }
                throw new Error('Session expired. Please login again.');
            }
            
            // Handle 403 - Forbidden
            if (response.status === 403) {
                throw new Error('Access denied. You do not have permission to perform this action.');
            }
            
            // Handle 404 - Not Found
            if (response.status === 404) {
                throw new Error('Resource not found.');
            }
            
            // Handle 500 - Server Error
            if (response.status >= 500) {
                throw new Error('Server error. Please try again later.');
            }
            
            throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
        }

        // Handle empty responses
        if (isJson) {
            const text = await response.text();
            const result = text ? JSON.parse(text) : null;
            console.log(`API Response:`, result);
            return result;
        }
        
        const textResult = await response.text();
        console.log(`API Text Response:`, textResult);
        return textResult;
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

