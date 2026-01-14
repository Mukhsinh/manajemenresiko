
/**
 * PAGE INITIALIZATION SYSTEM - ENHANCED
 * Ensures pages display properly without refresh
 * Created: December 28, 2025
 */

// Prevent duplicate declaration
if (typeof window.PageInitializationSystem !== 'undefined') {
  console.log('⚠️ PageInitializationSystem already defined, skipping...');
} else {

const PageInitializationSystem = (() => {
  const state = {
    initializedPages: new Set(),
    loadingPages: new Set(),
    pageModules: new Map(),
    initializationPromises: new Map()
  };

  /**
   * Initialize a page with proper error handling and race condition prevention
   */
  async function initializePage(pageName, forceReload = false) {
    console.log(`🚀 Initializing page: ${pageName}`);
    
    // Prevent duplicate initialization
    if (state.loadingPages.has(pageName)) {
      console.log(`⏳ Page ${pageName} already loading, waiting...`);
      return await state.initializationPromises.get(pageName);
    }
    
    if (state.initializedPages.has(pageName) && !forceReload) {
      console.log(`✅ Page ${pageName} already initialized`);
      return true;
    }
    
    // Mark as loading
    state.loadingPages.add(pageName);
    
    // Create initialization promise
    const initPromise = performPageInitialization(pageName);
    state.initializationPromises.set(pageName, initPromise);
    
    try {
      const result = await initPromise;
      
      // Mark as initialized
      state.initializedPages.add(pageName);
      state.loadingPages.delete(pageName);
      state.initializationPromises.delete(pageName);
      
      console.log(`✅ Page ${pageName} initialized successfully`);
      return result;
      
    } catch (error) {
      console.error(`❌ Error initializing page ${pageName}:`, error);
      
      // Clean up
      state.loadingPages.delete(pageName);
      state.initializationPromises.delete(pageName);
      
      // Show error fallback
      showPageError(pageName, error);
      return false;
    }
  }

  /**
   * Perform actual page initialization
   */
  async function performPageInitialization(pageName) {
    console.log(`📄 Performing initialization for: ${pageName}`);
    
    // Ensure page element exists and is visible
    const pageElement = document.getElementById(pageName);
    if (!pageElement) {
      throw new Error(`Page element not found: ${pageName}`);
    }
    
    // Make sure page is active
    if (!pageElement.classList.contains('active')) {
      console.log(`🔧 Making page ${pageName} active`);
      document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
      });
      pageElement.classList.add('active');
    }
    
    // Force reflow to ensure visibility
    pageElement.offsetHeight;
    
    // CRITICAL: Clean up RS content from non-RS pages
    if (pageName !== 'rencana-strategis') {
      cleanupRSContentFromPage(pageElement);
    }
    
    // Load page-specific module
    switch (pageName) {
      case 'rencana-strategis':
        return await initializeRencanaStrategis();
      
      case 'dashboard':
        return await initializeDashboard();
      
      case 'analisis-swot':
        return await initializeAnalisisSwot();
      
      default:
        console.log(`ℹ️ No specific initialization for: ${pageName}`);
        return true;
    }
  }

  /**
   * Clean up Rencana Strategis content from non-RS pages
   */
  function cleanupRSContentFromPage(pageElement) {
    if (!pageElement) return;
    
    // Remove any RS-specific elements
    const rsElements = pageElement.querySelectorAll(
      '[id*="rencana-strategis"]:not(#rencana-strategis), ' +
      '[class*="rencana-strategis"]:not(.page-content), ' +
      '.rencana-strategis-wrapper, ' +
      '.rencana-strategis-container'
    );
    
    rsElements.forEach(el => {
      console.log('🗑️ Removing RS element from non-RS page:', el.className || el.id);
      el.remove();
    });
    
    // Check for RS selection list pattern
    pageElement.querySelectorAll('*').forEach(el => {
      const text = el.textContent || '';
      if (text.includes('Pilih Rencana Strategis') && /RS-\d{4}-\d{3}/.test(text)) {
        console.log('🗑️ Removing RS selection list from non-RS page');
        el.remove();
      }
    });
  }

  /**
   * Initialize Rencana Strategis with enhanced error handling
   * CRITICAL: Only call this when explicitly on rencana-strategis page
   */
  async function initializeRencanaStrategis() {
    console.log('🎯 Initializing Rencana Strategis...');
    
    // CRITICAL: Double-check we're on the right page
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const isRSPage = currentPath.includes('rencana-strategis') || 
                     currentHash === '#rencana-strategis' ||
                     currentPath === '/rencana-strategis';
    
    if (!isRSPage) {
      console.log('⚠️ Not on rencana-strategis page, skipping initialization');
      return false;
    }
    
    try {
      // Wait for module to be available - check multiple aliases
      const moduleNames = ['RencanaStrategisModule', 'RencanaStrategisUnified', 'RSCore'];
      let module = null;
      
      for (const name of moduleNames) {
        try {
          module = await waitForModule(name, 2000);
          if (module?.load) {
            console.log(`✅ Found RS module: ${name}`);
            break;
          }
        } catch (e) {
          // Try next module name
        }
      }
      
      if (module?.load) {
        await module.load();
        console.log('✅ Rencana Strategis module loaded successfully');
        return true;
      } else {
        throw new Error('No RS module available');
      }
      
    } catch (error) {
      console.error('❌ Error loading Rencana Strategis:', error);
      
      // Show error message instead of fallback
      showPageError('rencana-strategis', error);
      return false;
    }
  }

  /**
   * Wait for module to be available
   */
  function waitForModule(moduleName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      function checkModule() {
        if (window[moduleName]) {
          resolve(window[moduleName]);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Module ${moduleName} not available after ${timeout}ms`));
          return;
        }
        
        setTimeout(checkModule, 100);
      }
      
      checkModule();
    });
  }

  /**
   * Show page error
   */
  function showPageError(pageName, error) {
    const pageElement = document.getElementById(pageName);
    const container = pageElement?.querySelector(`#${pageName}-content`) || pageElement;
    
    if (container) {
      container.innerHTML = `
        <div class="container-fluid p-4">
          <div class="alert alert-danger" role="alert">
            <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Page</h4>
            <p>Terjadi kesalahan saat memuat halaman ${pageName}.</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <button onclick="location.reload()" class="btn btn-primary">
              <i class="fas fa-sync"></i> Refresh Halaman
            </button>
          </div>
        </div>
      `;
    }
  }

  // Utility functions
  function formatDate(dateString) {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID');
    } catch {
      return dateString;
    }
  }

  function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Initialize dashboard (placeholder)
  async function initializeDashboard() {
    console.log('📊 Initializing Dashboard...');
    if (window.dashboardModule?.loadDashboard) {
      await window.dashboardModule.loadDashboard();
    }
    return true;
  }

  // Initialize analisis SWOT (placeholder)
  async function initializeAnalisisSwot() {
    console.log('📈 Initializing Analisis SWOT...');
    if (window.analisisSwotModule?.load) {
      await window.analisisSwotModule.load();
    }
    return true;
  }

  return {
    initializePage,
    state
  };
})();

// Export to global scope
window.PageInitializationSystem = PageInitializationSystem;

console.log('✅ Page Initialization System loaded');

} // End of duplicate check if block