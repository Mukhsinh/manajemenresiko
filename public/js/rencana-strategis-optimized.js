/**
 * RENCANA STRATEGIS MODULE v7.0-OPTIMIZED
 * 
 * OPTIMIZATIONS:
 * 1. Lazy loading - load data only when needed
 * 2. Debounced rendering - prevent excessive re-renders
 * 3. Cached API responses - reduce network calls
 * 4. Virtual DOM diffing - minimal DOM updates
 * 5. Non-blocking initialization
 * 
 * Updated: 2026-01-09
 */

const RencanaStrategisModule = (() => {
  const VERSION = '7.0-OPTIMIZED';
  
  // State with caching
  const state = {
    data: [],
    filteredData: [],
    missions: [],
    currentId: null,
    formValues: {},
    isLoading: false,
    isInitialized: false,
    showForm: false, // Start collapsed for faster initial render
    filters: { status: '', tahun: '', search: '' },
    cache: { data: null, missions: null, timestamp: 0 },
    renderQueue: null
  };

  // Cache duration: 30 seconds
  const CACHE_DURATION = 30000;
  
  const getEl = id => document.getElementById(id);

  // Optimized API helper with caching
  const api = (() => {
    const cache = new Map();
    
    return async (endpoint, options = {}) => {
      const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
      const cached = cache.get(cacheKey);
      
      // Return cached response if valid (GET requests only)
      if (!options.method && cached && Date.now() - cached.time < CACHE_DURATION) {
        return cached.data;
      }
      
      const token = localStorage.getItem('token') || window.currentSession?.access_token;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      };
      
      const config = { ...options, headers };
      if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
      }
      
      const response = await fetch(endpoint, config);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      // Cache GET responses
      if (!options.method) {
        cache.set(cacheKey, { data, time: Date.now() });
      }
      
      return data;
    };
  })();

  // Debounce helper
  const debounce = (fn, delay = 100) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  // Check if on RS page
  const isOnRSPage = () => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    return path === '/rencana-strategis' || 
           path.includes('/rencana-strategis') ||
           hash === '#rencana-strategis';
  };

  // OPTIMIZED: Non-blocking load with immediate UI feedback
  async function load() {
    if (!isOnRSPage()) return;
    if (state.isLoading) return;
    if (state.isInitialized && state.data.length > 0) {
      console.log('✅ Using cached data');
      return;
    }
    
    console.log(`🚀 Loading RS Module v${VERSION}...`);
    state.isLoading = true;

    const container = getEl('rencana-strategis-content');
    if (!container) {
      state.isLoading = false;
      return;
    }

    // OPTIMIZATION 1: Show skeleton UI immediately
    container.innerHTML = renderSkeleton();

    try {
      // OPTIMIZATION 2: Parallel data fetching with timeout
      const fetchPromise = fetchDataOptimized();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      await Promise.race([fetchPromise, timeoutPromise]).catch(() => {
        console.warn('⚠️ Data fetch timeout, using cached/empty data');
      });

      state.formValues = getDefaultForm();
      
      // OPTIMIZATION 3: Generate kode in background
      generateKode().catch(() => {});
      
      applyFilters();
      
      // OPTIMIZATION 4: Render with requestAnimationFrame
      requestAnimationFrame(() => {
        renderInterface();
        state.isInitialized = true;
        state.isLoading = false;
        console.log(`✅ RS Module v${VERSION} loaded`);
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
      container.innerHTML = renderError(error.message);
      state.isLoading = false;
    }
  }

  // Skeleton UI for instant feedback
  function renderSkeleton() {
    return `
      <div class="rencana-strategis-wrapper p-3">
        <div class="row g-3 mb-4">
          ${[1,2,3,4].map(() => `
            <div class="col-xl-3 col-md-6">
              <div class="card h-100 border-0 shadow-sm" style="border-radius:12px">
                <div class="card-body">
                  <div class="skeleton-box" style="height:60px;background:#e9ecef;border-radius:8px"></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="card shadow-sm border-0 mb-4" style="border-radius:12px">
          <div class="card-body">
            <div class="skeleton-box" style="height:200px;background:#e9ecef;border-radius:8px"></div>
          </div>
        </div>
      </div>
      <style>
        .skeleton-box { animation: skeleton-pulse 1.5s ease-in-out infinite; }
        @keyframes skeleton-pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
      </style>
    `;
  }
