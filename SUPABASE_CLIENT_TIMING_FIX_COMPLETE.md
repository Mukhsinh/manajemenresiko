# 🔧 Supabase Client Initialization - Root Cause Analysis & Complete Fix

## 📋 Executive Summary

**Problem**: Aplikasi frontend mengalami error berantai karena Supabase client belum siap saat dipanggil oleh `getAuthToken()` dan `apiCall()`.

**Root Cause**: Race condition antara inisialisasi Supabase client dan lifecycle aplikasi yang memanggil API.

**Solution**: Implementasi singleton pattern dengan lazy initialization dan wait mechanism yang robust.

---

## 🔍 Root Cause Analysis

### 1. **Timing Issue - Race Condition**

```
Timeline Masalah:
┌─────────────────────────────────────────────────────────────┐
│ 1. DOM Ready Event                                          │
│ 2. config.js mulai loadConfig() (async)                    │
│ 3. Module lain (ai-assistant.js, rencana-strategis.js)     │
│    langsung memanggil checkAvailability() / load()         │
│ 4. getAuthToken() dipanggil SEBELUM Supabase ready         │
│ 5. ERROR: "Supabase client tidak tersedia"                 │
└─────────────────────────────────────────────────────────────┘
```

**Masalah Utama**:
- `config.js` melakukan inisialisasi async dengan retry mechanism
- Module lain tidak menunggu inisialisasi selesai
- `getAuthToken()` langsung dipanggil tanpa verifikasi client ready
- Tidak ada mekanisme queue untuk menunda API calls

### 2. **Inconsistent Wait Mechanisms**

**File: apiService.js**
```javascript
// ❌ MASALAH: Wait mechanism tidak konsisten
if (window.configManager && typeof window.configManager.waitForSupabaseClient === 'function') {
    // Menggunakan configManager
} else {
    // Fallback manual wait - TIDAK RELIABLE
    let waitCount = 0;
    while (!supabaseClient && waitCount < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 200));
        supabaseClient = window.supabaseClient;
        waitCount++;
    }
}
```

**Masalah**:
- Fallback mechanism hanya check `window.supabaseClient` exists
- Tidak verify apakah client functional (bisa memanggil `.auth.getSession()`)
- Timeout terlalu lama (15 detik) menyebabkan UX buruk

### 3. **Multiple Initialization Points**

**Konflik Inisialisasi**:
```
config.js:
- loadConfig() dipanggil saat DOMContentLoaded
- Retry mechanism dengan exponential backoff
- Set window.supabaseClient setelah berhasil

ai-assistant.js:
- init() dipanggil saat DOMContentLoaded
- Langsung call checkAvailability() tanpa wait

rencana-strategis.js:
- load() dipanggil saat DOMContentLoaded
- Langsung fetch data tanpa wait
```

**Hasil**: Race condition yang tidak predictable

### 4. **Error Propagation Chain**

```
Error Chain:
┌──────────────────────────────────────────────────────────┐
│ 1. getAuthToken() → "Supabase client tidak tersedia"    │
│ 2. apiCall() → catch error → throw new Error()          │
│ 3. checkAvailability() → catch error → setStatus()      │
│ 4. User sees: "Aplikasi sedang memuat..."               │
│ 5. Infinite loop jika retry terus menerus               │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ Complete Solution

### **Strategy**: Singleton + Lazy Init + Wait Queue

### 1. **Enhanced config.js - Singleton with Ready State**

```javascript
// ✅ SOLUSI: Robust singleton pattern dengan state management
const SupabaseClientManager = (() => {
    let instance = null;
    let initPromise = null;
    let isReady = false;
    let readyCallbacks = [];
    
    const MAX_RETRIES = 5;
    const RETRY_DELAYS = [500, 1000, 2000, 3000, 5000]; // Exponential backoff
    
    async function initialize() {
        if (isReady && instance) {
            return instance;
        }
        
        if (initPromise) {
            return initPromise;
        }
        
        initPromise = (async () => {
            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                try {
                    console.log(`🔄 Initializing Supabase client (attempt ${attempt + 1}/${MAX_RETRIES})...`);
                    
                    // 1. Fetch config
                    const response = await fetch('/api/config');
                    if (!response.ok) {
                        throw new Error(`Config fetch failed: ${response.status}`);
                    }
                    
                    const config = await response.json();
                    if (!config.supabaseUrl || !config.supabaseAnonKey) {
                        throw new Error('Invalid config: missing Supabase credentials');
                    }
                    
                    // 2. Wait for Supabase library
                    let libWaitCount = 0;
                    while (!window.supabase && libWaitCount < 50) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        libWaitCount++;
                    }
                    
                    if (!window.supabase) {
                        throw new Error('Supabase library not loaded');
                    }
                    
                    // 3. Create client
                    instance = window.supabase.createClient(
                        config.supabaseUrl,
                        config.supabaseAnonKey
                    );
                    
                    // 4. Verify client is functional
                    const { error } = await instance.auth.getSession();
                    if (error && error.message !== 'No session') {
                        throw new Error(`Client verification failed: ${error.message}`);
                    }
                    
                    // 5. Set global references
                    window.supabaseClient = instance;
                    window.supabaseClientReady = true;
                    isReady = true;
                    
                    console.log('✅ Supabase client initialized successfully');
                    
                    // 6. Notify all waiting callbacks
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
                    console.error(`❌ Initialization attempt ${attempt + 1} failed:`, error);
                    
                    if (attempt < MAX_RETRIES - 1) {
                        const delay = RETRY_DELAYS[attempt];
                        console.log(`⏳ Retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        // Final failure
                        const finalError = new Error('Supabase client initialization failed after all retries');
                        readyCallbacks.forEach(callback => {
                            try {
                                callback(finalError, null);
                            } catch (err) {
                                console.error('Callback error:', err);
                            }
                        });
                        readyCallbacks = [];
                        initPromise = null;
                        throw finalError;
                    }
                }
            }
        })();
        
        return initPromise;
    }
    
    function getClient() {
        if (isReady && instance) {
            return instance;
        }
        return null;
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
                initialize().catch(err => {
                    // Error already handled in initialize()
                });
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

// Export global manager
window.SupabaseClientManager = SupabaseClientManager;
```

### 2. **Fixed apiService.js - Reliable Token Getter**

```javascript
// ✅ SOLUSI: Reliable getAuthToken dengan proper wait
async function getAuthToken() {
    try {
        console.log('🔑 Getting auth token...');
        
        // 1. Wait for Supabase client to be ready
        let client = null;
        
        if (window.SupabaseClientManager) {
            try {
                client = await window.SupabaseClientManager.waitForClient(5000);
            } catch (error) {
                throw new Error('Aplikasi sedang memuat. Silakan tunggu sebentar dan coba lagi.');
            }
        } else {
            // Fallback for backward compatibility
            client = window.supabaseClient;
            if (!client) {
                throw new Error('Supabase client tidak tersedia. Silakan refresh halaman.');
            }
        }
        
        // 2. Verify client has auth methods
        if (!client.auth || typeof client.auth.getSession !== 'function') {
            throw new Error('Supabase client tidak valid. Silakan refresh halaman.');
        }
        
        // 3. Get session
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error) {
            console.error('❌ Error getting session:', error);
            throw new Error(`Gagal mendapatkan session: ${error.message}`);
        }
        
        if (!session) {
            console.warn('⚠️ No active session');
            return null;
        }
        
        const token = session.access_token;
        if (!token) {
            throw new Error('Session ada tetapi token tidak tersedia');
        }
        
        console.log('✅ Auth token retrieved successfully');
        return token;
        
    } catch (error) {
        console.error('❌ Error in getAuthToken:', error);
        throw error;
    }
}

// ✅ SOLUSI: Enhanced apiCall dengan better error handling
async function apiCall(endpoint, options = {}) {
    try {
        console.log(`🌐 API call: ${endpoint}`);
        
        // Check if public endpoint
        const publicEndpoints = [
            '/api/config',
            '/api/health',
            '/api/rencana-strategis/public',
            '/api/visi-misi/public'
        ];
        
        const isPublic = publicEndpoints.some(ep => endpoint.includes(ep));
        
        // Get token for non-public endpoints
        let token = null;
        if (!isPublic) {
            try {
                token = await getAuthToken();
            } catch (error) {
                // Handle specific errors
                if (error.message.includes('sedang memuat')) {
                    throw new Error('Aplikasi sedang memuat. Silakan tunggu sebentar.');
                } else if (error.message.includes('tidak tersedia')) {
                    throw new Error('Aplikasi belum siap. Silakan refresh halaman.');
                }
                throw error;
            }
            
            if (!token) {
                throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
            }
        }
        
        // Build request
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
        
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }
        
        // Make request
        const response = await fetch(`${window.location.origin}${endpoint}`, config);
        
        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            let errorMessage = response.statusText;
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    // Use statusText
                }
            }
            
            // Handle specific status codes
            if (response.status === 401) {
                throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
            } else if (response.status === 403) {
                throw new Error('Akses ditolak. Anda tidak memiliki izin.');
            } else if (response.status === 404) {
                throw new Error('Data tidak ditemukan.');
            } else if (response.status >= 500) {
                throw new Error('Terjadi kesalahan pada server. Silakan coba lagi.');
            }
            
            throw new Error(errorMessage);
        }
        
        // Parse response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
        
    } catch (error) {
        console.error('❌ API call error:', error);
        throw error;
    }
}
```

### 3. **Fixed Module Initialization - Wait Before Load**

**ai-assistant.js**:
```javascript
// ✅ SOLUSI: Wait for client before checking availability
const AIAssistant = {
    // ... existing code ...
    
    async init() {
        this.cacheDom();
        
        if (!this.elements.widget) {
            return;
        }
        
        if (!this.initialized) {
            this.bindEvents();
            this.initialized = true;
        }
        
        this.elements.widget.classList.add('ready');
        
        // ✅ Wait for Supabase client before checking availability
        if (window.SupabaseClientManager) {
            try {
                await window.SupabaseClientManager.waitForClient(5000);
                await this.checkAvailability();
            } catch (error) {
                console.warn('Supabase client not ready, skipping availability check');
                this.setStatus('Layanan AI belum tersedia', 'warning');
            }
        } else {
            // Fallback
            await this.checkAvailability();
        }
    },
    
    async checkAvailability() {
        try {
            // ✅ Use apiService instead of direct apiCall
            const api = window.apiService?.apiCall || window.apiCall;
            if (typeof api !== 'function') {
                throw new Error('API service tidak tersedia');
            }
            
            const response = await api('/api/ai-assistant/status');
            this.state.isAvailable = response?.available || false;
            
            if (!this.state.isAvailable) {
                this.setStatus('Layanan AI belum tersedia', 'warning');
            } else {
                this.setStatus('');
            }
        } catch (error) {
            console.error('AI availability check error:', error);
            this.state.isAvailable = false;
            
            if (error.message.includes('sedang memuat')) {
                this.setStatus('Aplikasi sedang memuat...', 'warning');
            } else if (error.message.includes('login')) {
                this.setStatus('Silakan login untuk menggunakan AI', 'warning');
            } else {
                this.setStatus('Tidak dapat memeriksa ketersediaan AI', 'error');
            }
        }
    }
};
```

**rencana-strategis.js**:
```javascript
// ✅ SOLUSI: Wait for client before loading data
async function load() {
    console.log('=== RENCANA STRATEGIS MODULE LOAD START ===');
    try {
        // ✅ Wait for Supabase client to be ready
        if (window.SupabaseClientManager) {
            try {
                console.log('⏳ Waiting for Supabase client...');
                await window.SupabaseClientManager.waitForClient(10000);
                console.log('✅ Supabase client ready');
            } catch (error) {
                console.warn('⚠️ Supabase client not ready:', error);
                // Continue with fallback - use local generation
            }
        }
        
        // Fetch data
        await fetchInitialData();
        
        // Generate kode if needed
        if (!state.currentId) {
            await generateKode();
        }
        
        // Render
        render();
        
        console.log('=== RENCANA STRATEGIS MODULE LOAD COMPLETE ===');
    } catch (error) {
        console.error('=== RENCANA STRATEGIS MODULE LOAD ERROR ===', error);
        
        // Fallback rendering
        if (!state.formValues.kode && !state.currentId) {
            const year = new Date().getFullYear();
            const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
            state.formValues.kode = `RS-${year}-${random}`;
        }
        render();
    }
}
```

---

## 🎯 Implementation Steps

### Step 1: Update config.js
```bash
# Backup existing file
cp public/js/config.js public/js/config.js.backup

# Apply new SupabaseClientManager implementation
```

### Step 2: Update apiService.js
```bash
# Update getAuthToken() and apiCall() functions
```

### Step 3: Update Module Files
```bash
# Update ai-assistant.js
# Update rencana-strategis.js
# Update other modules that call API on init
```

### Step 4: Test
```bash
# 1. Clear browser cache
# 2. Hard refresh (Ctrl+Shift+R)
# 3. Open DevTools Console
# 4. Watch for initialization logs
# 5. Test login flow
# 6. Test API calls
```

---

## 📊 Before vs After

### Before (❌ Broken)
```
Timeline:
0ms   → DOM Ready
10ms  → config.js starts loadConfig()
15ms  → ai-assistant.js calls checkAvailability()
20ms  → getAuthToken() called
25ms  → ERROR: "Supabase client tidak tersedia"
```

### After (✅ Fixed)
```
Timeline:
0ms   → DOM Ready
10ms  → SupabaseClientManager.initialize() starts
15ms  → ai-assistant.js calls init()
20ms  → init() calls waitForClient()
500ms → Supabase client ready
505ms → checkAvailability() proceeds
510ms → getAuthToken() succeeds
515ms → API call succeeds
```

---

## 🔒 Best Practices Implemented

### 1. **Singleton Pattern**
- Single source of truth untuk Supabase client
- Prevent multiple initialization
- Centralized state management

### 2. **Lazy Initialization**
- Client hanya diinit saat dibutuhkan
- Automatic retry dengan exponential backoff
- Graceful degradation jika gagal

### 3. **Wait Queue Pattern**
- Callbacks untuk notify saat ready
- Promise-based waiting
- Timeout protection

### 4. **Error Handling**
- User-friendly error messages
- Specific error types
- Fallback mechanisms

### 5. **Logging & Debugging**
- Clear console logs dengan emoji
- Step-by-step tracking
- Error context

---

## 🧪 Testing Checklist

- [ ] Fresh page load (no cache)
- [ ] Login flow
- [ ] API calls after login
- [ ] Module initialization (AI Assistant, Rencana Strategis)
- [ ] Network error simulation
- [ ] Slow connection simulation
- [ ] Multiple tabs
- [ ] Session expiry
- [ ] Refresh during loading

---

## 📝 Key Takeaways

1. **Never assume client is ready** - Always wait/verify
2. **Use singleton pattern** - One client, one initialization
3. **Implement wait queues** - Don't poll, use callbacks
4. **Provide fallbacks** - Graceful degradation
5. **User-friendly errors** - Clear, actionable messages

---

## 🚀 Next Steps

1. Apply fixes to all files
2. Test thoroughly
3. Monitor production logs
4. Document for team
5. Consider adding health check endpoint

---

**Status**: ✅ Solution Ready for Implementation
**Priority**: 🔴 Critical
**Impact**: 🎯 Fixes core initialization issue
