/**
 * RENCANA STRATEGIS SAFE LOADER v2.0
 * 
 * Loader yang aman untuk mencegah:
 * 1. Race condition
 * 2. Multiple loading
 * 3. UI freeze
 * 4. Content leak ke halaman lain
 * 
 * FIXES v2.0:
 * - Removed setInterval (was causing infinite loops)
 * - Event-driven cleanup only
 * - Added debounce
 * 
 * Created: 2026-01-10
 * Updated: 2026-01-11
 */

(function() {
  'use strict';
  
  // Prevent multiple initializations
  if (window.RSSafeLoaderInitialized) {
    return;
  }
  window.RSSafeLoaderInitialized = true;
  
  // Mutex untuk mencegah multiple loading
  let isLoading = false;
  let loadPromise = null;
  let lastLoadTime = 0;
  const MIN_LOAD_INTERVAL = 3000; // 3 detik minimum antar load
  
  /**
   * Check apakah sedang di halaman rencana-strategis
   */
  function isRSPage() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const activePage = document.querySelector('.page-content.active');
    
    return path.includes('rencana-strategis') || 
           hash === '#rencana-strategis' ||
           (activePage && activePage.id === 'rencana-strategis');
  }
  
  /**
   * Safe loader dengan mutex dan timeout
   */
  async function safeLoadRencanaStrategis() {
    // Check apakah di halaman yang benar
    if (!isRSPage()) {
      console.log('⚠️ Not on RS page, skipping load');
      return Promise.resolve();
    }
    
    // Check mutex
    if (isLoading) {
      console.log('🔒 RS already loading, returning existing promise');
      return loadPromise || Promise.resolve();
    }
    
    // Check time-based lock
    const now = Date.now();
    if (now - lastLoadTime < MIN_LOAD_INTERVAL) {
      console.log('⏱️ RS loaded recently, skipping');
      return Promise.resolve();
    }

    // Set mutex
    isLoading = true;
    lastLoadTime = now;
    
    console.log('🚀 Safe loading Rencana Strategis...');
    
    loadPromise = new Promise(async (resolve, reject) => {
      // Timeout untuk mencegah hang
      const timeout = setTimeout(() => {
        console.error('⏰ RS load timeout');
        isLoading = false;
        loadPromise = null;
        reject(new Error('Load timeout'));
      }, 15000); // 15 detik timeout
      
      try {
        // Pastikan container ada
        const container = document.getElementById('rencana-strategis-content');
        if (!container) {
          throw new Error('Container not found');
        }
        
        // Show loading
        container.innerHTML = `
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3 text-muted">Memuat data rencana strategis...</p>
          </div>
        `;
        
        // Yield to main thread
        await new Promise(r => setTimeout(r, 50));
        
        // Load module
        if (window.RencanaStrategisModule?.load) {
          await window.RencanaStrategisModule.load();
        } else {
          throw new Error('RencanaStrategisModule not available');
        }
        
        clearTimeout(timeout);
        isLoading = false;
        loadPromise = null;
        
        console.log('✅ RS loaded successfully');
        resolve();
        
      } catch (error) {
        clearTimeout(timeout);
        isLoading = false;
        loadPromise = null;
        
        console.error('❌ RS load error:', error);
        
        // Show error
        const container = document.getElementById('rencana-strategis-content');
        if (container) {
          container.innerHTML = `
            <div class="alert alert-danger m-4">
              <h5><i class="fas fa-exclamation-triangle me-2"></i>Error</h5>
              <p>${error.message}</p>
              <button onclick="window.safeLoadRencanaStrategis()" class="btn btn-primary">
                <i class="fas fa-sync me-1"></i>Coba Lagi
              </button>
            </div>
          `;
        }
        
        reject(error);
      }
    });
    
    return loadPromise;
  }
  
  /**
   * Cleanup RS dari halaman lain
   */
  function cleanupRSFromOtherPages() {
    if (isRSPage()) return;
    
    let cleanedCount = 0;
    
    // Remove RS wrapper dari halaman lain
    document.querySelectorAll('.page-content').forEach(page => {
      if (page.id === 'rencana-strategis') return;
      
      const rsWrapper = page.querySelector('.rencana-strategis-wrapper');
      if (rsWrapper) {
        rsWrapper.remove();
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} RS wrapper(s) from other pages`);
    }
  }
  
  // Export ke global scope
  window.safeLoadRencanaStrategis = safeLoadRencanaStrategis;
  window.cleanupRSFromOtherPages = cleanupRSFromOtherPages;
  
  // Auto cleanup saat navigasi (event-driven, NOT interval)
  window.addEventListener('hashchange', cleanupRSFromOtherPages);
  window.addEventListener('popstate', cleanupRSFromOtherPages);
  
  // NO MORE setInterval - only event-driven cleanup
  
  console.log('✅ RS Safe Loader v2.0 initialized');
  
})();
