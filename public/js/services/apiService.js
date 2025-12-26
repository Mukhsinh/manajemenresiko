// ============================================================================
// API Service - Uses config.js as the single source of truth
// ============================================================================

// Ensure config.js is loaded first - it provides getAuthToken and apiCall
if (typeof window.apiCall !== 'function') {
    console.warn('⚠️ apiService.js loaded before config.js - waiting for initialization');
}

// ============================================================================
// Convenience wrappers that delegate to config.js
// ============================================================================

/**
 * GET request
 */
async function get(endpoint, options = {}) {
    return window.apiCall(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
async function post(endpoint, data, options = {}) {
    return window.apiCall(endpoint, {
        ...options,
        method: 'POST',
        body: data
    });
}

/**
 * PUT request
 */
async function put(endpoint, data, options = {}) {
    return window.apiCall(endpoint, {
        ...options,
        method: 'PUT',
        body: data
    });
}

/**
 * DELETE request
 */
async function del(endpoint, options = {}) {
    return window.apiCall(endpoint, { ...options, method: 'DELETE' });
}

/**
 * PATCH request
 */
async function patch(endpoint, data, options = {}) {
    return window.apiCall(endpoint, {
        ...options,
        method: 'PATCH',
        body: data
    });
}

// ============================================================================
// Export for use in other modules
// ============================================================================
window.apiService = {
    // Core functions from config.js
    apiCall: (...args) => window.apiCall(...args),
    getAuthToken: () => window.getAuthToken(),
    
    // Convenience methods
    get,
    post,
    put,
    delete: del,
    patch
};

console.log('✅ apiService.js loaded - delegates to config.js');
