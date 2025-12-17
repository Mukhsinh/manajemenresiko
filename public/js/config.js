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
    try {
        const supabaseClient = supabase || window.supabaseClient;
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
        console.log('Auth token retrieved:', !!token, token ? `${token.substring(0, 20)}...` : 'null');
        return token || null;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
}

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    try {
        console.log(`Making API call to: ${endpoint}`);
        
        const token = await getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log(`Request with auth token: ${token.substring(0, 20)}...`);
        } else {
            console.log('Request without auth token');
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

        if (!response.ok) {
            let errorMessage = `Request failed with status ${response.status}`;
            let errorDetails = null;
            
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    errorDetails = await response.json();
                    errorMessage = errorDetails.error || errorDetails.message || errorMessage;
                } else {
                    const textError = await response.text();
                    errorMessage = textError || errorMessage;
                }
            } catch (parseError) {
                console.warn('Could not parse error response:', parseError);
                errorMessage = response.statusText || errorMessage;
            }
            
            console.error(`API Error (${response.status}):`, errorDetails || errorMessage);
            throw new Error(errorMessage);
        }

        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
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

