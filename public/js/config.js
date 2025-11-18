// Supabase Configuration - Loaded from API
let SUPABASE_URL = null;
let SUPABASE_ANON_KEY = null;
let supabase = null;
let configLoaded = false;

// Load configuration from API
async function loadConfig() {
    if (configLoaded) return;
    
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error(`Failed to load config: ${response.statusText}`);
        }
        
        const config = await response.json();
        SUPABASE_URL = config.supabaseUrl;
        SUPABASE_ANON_KEY = config.supabaseAnonKey;
        
        // Initialize Supabase client
        if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.supabaseClient = supabase;
            configLoaded = true;
            console.log('Configuration loaded and Supabase client initialized');
        } else {
            console.error('Supabase JS library not loaded or config incomplete!');
        }
    } catch (error) {
        console.error('Error loading configuration:', error);
        // Retry after 1 second
        setTimeout(loadConfig, 1000);
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadConfig);
} else {
    loadConfig();
}

// API Base URL
const API_BASE_URL = window.location.origin;

// Helper function to get auth token
async function getAuthToken() {
    const supabaseClient = supabase || window.supabaseClient;
    if (!supabaseClient) return null;
    
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token || null;
}

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
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

    if (!response.ok) {
        let error;
        try {
            error = await response.json();
        } catch (e) {
            error = { error: response.statusText };
        }
        throw new Error(error.error || 'Request failed');
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return response.text();
}

