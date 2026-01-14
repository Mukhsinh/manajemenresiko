/**
 * PAGE MANAGER v1.0
 * 
 * Unified page navigation and lifecycle management
 * Replaces multiple conflicting isolation scripts
 * 
 * Created: 2026-01-10
 * 
 * Features:
 * - Centralized page navigation
 * - Proper cleanup on page change
 * - No MutationObserver abuse
 * - Debounced operations to prevent race conditions
 * - Module lifecycle management
 */

(function() {
  'use strict';
  
  console.log('📄 Page Manager v1.0 loading...');
  
  // Prevent multiple initializations
  if (window.PageManager) {
    console.log('⚠️ Page Manager already initialized');
    return;
  }
  
  // ============================================
  // STATE
  // ============================================
  
  const state = {
    currentPage: null,
    previousPage: null,
    isNavigating: false,
    lastNavigationTime: 0,
    pageLoadCallbacks: new Map(),
    pageUnloadCallbacks: new Map(),
    moduleStates: new Map()
  };
  
  // Navigation debounce time (ms)
  const NAVIGATION_DEBOUNCE = 100;
  
  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  /**
   * Debounce function to prevent rapid calls
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Get page element by name
   */
  function getPageElement(pageName) {
    return document.getElementById(pageName);
  }
  
  /**
   * Get all page content elements
   */
  function getAllPages() {
    return document.querySelectorAll('.page-content');
  }
  
  // ============================================
  // PAGE VISIBILITY
  // ============================================
  
  /**
   * Hide a specific page
   */
  function hidePage(pageName) {
    const page = getPageElement(pageName);
    if (!page) return;
    
    page.classList.remove('active');
    page.style.display = 'none';
    page.style.visibility = 'hidden';
    page.style.opacity = '0';
    page.setAttribute('aria-hidden', 'true');
  }
  
  /**
   * Show a specific page
   */
  function showPage(pageName) {
    const page = getPageElement(pageName);
    if (!page) {
      console.warn(`⚠️ Page element not found: ${pageName}`);
      return false;
    }
    
    page.classList.add('active');
    page.style.display = 'block';
    page.style.visibility = 'visible';
    page.style.opacity = '1';
    page.style.position = 'relative';
    page.style.left = 'auto';
    page.setAttribute('aria-hidden', 'false');
    
    return true;
  }
  
  /**
   * Hide all pages except the specified one
   */
  function hideAllPagesExcept(exceptPageName) {
    getAllPages().forEach(page => {
      if (page.id !== exceptPageName) {
        hidePage(page.id);
      }
    });
  }
  
  // ============================================
  // MODULE LIFECYCLE
  // ============================================
  
  /**
   * Call cleanup function for a page's module
   */
  function cleanupPageModule(pageName) {
    const moduleState = state.moduleStates.get(pageName);
    if (moduleState && moduleState.cleanup) {
      try {
        console.log(`🧹 Cleaning up module for: ${pageName}`);
        moduleState.cleanup();
      } catch (error) {
        console.error(`Error cleaning up module for ${pageName}:`, error);
      }
    }
    
    // Call registered unload callbacks
    const unloadCallbacks = state.pageUnloadCallbacks.get(pageName);
    if (unloadCallbacks) {
      unloadCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`Error in unload callback for ${pageName}:`, error);
        }
      });
    }
  }
  
  /**
   * Initialize module for a page
   */
  async function initializePageModule(pageName) {
    console.log(`📦 Initializing module for: ${pageName}`);
    
    // Map page names to module names
    const moduleMap = {
      'dashboard': 'DashboardModule',
      'rencana-strategis': 'RencanaStrategisModule',
      'analisis-swot': 'AnalisisSwotModule',
      'visi-misi': 'VisiMisiModule',
      'diagram-kartesius': 'DiagramKartesiusModule',
      'matriks-tows': 'MatriksTowsModule',
      'sasaran-strategi': 'SasaranStrategiModule',
      'strategic-map': 'StrategicMapModule',
      'indikator-kinerja-utama': 'IndikatorKinerjaUtamaModule',
      'risk-input': 'RiskInputModule',
      'monitoring-evaluasi': 'MonitoringEvaluasiModule',
      'peluang': 'PeluangModule',
      'risk-profile': 'RiskProfileModule',
      'residual-risk': 'ResidualRiskModule',
      'kri': 'KRIModule',
      'loss-event': 'LossEventModule',
      'ews': 'EWSModule',
      'risk-register': 'RiskRegisterModule',
      'laporan': 'LaporanModule',
      'master-data': 'MasterDataModule',
      'buku-pedoman': 'BukuPedomanModule',
      'pengaturan': 'PengaturanModule'
    };
    
    const moduleName = moduleMap[pageName];
    if (!moduleName) {
      console.log(`ℹ️ No module mapping for: ${pageName}`);
      return;
    }
    
    const module = window[moduleName];
    if (!module) {
      console.log(`ℹ️ Module not found: ${moduleName}`);
      return;
    }
    
    // Check if module has load function
    if (typeof module.load === 'function') {
      try {
        await module.load();
        state.moduleStates.set(pageName, {
          name: moduleName,
          isLoaded: true,
          cleanup: typeof module.cleanup === 'function' ? module.cleanup : null
        });
        console.log(`✅ Module loaded: ${moduleName}`);
      } catch (error) {
        console.error(`Error loading module ${moduleName}:`, error);
        state.moduleStates.set(pageName, {
          name: moduleName,
          isLoaded: false,
          error: error
        });
      }
    } else if (typeof module.init === 'function') {
      try {
        await module.init();
        state.moduleStates.set(pageName, {
          name: moduleName,
          isLoaded: true,
          cleanup: typeof module.cleanup === 'function' ? module.cleanup : null
        });
        console.log(`✅ Module initialized: ${moduleName}`);
      } catch (error) {
        console.error(`Error initializing module ${moduleName}:`, error);
      }
    }
    
    // Call registered load callbacks
    const loadCallbacks = state.pageLoadCallbacks.get(pageName);
    if (loadCallbacks) {
      loadCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`Error in load callback for ${pageName}:`, error);
        }
      });
    }
  }
  
  // ============================================
  // NAVIGATION
  // ============================================
  
  /**
   * Navigate to a specific page
   */
  async function navigateTo(pageName) {
    // Debounce rapid navigation
    const now = Date.now();
    if (now - state.lastNavigationTime < NAVIGATION_DEBOUNCE) {
      console.log(`⏳ Navigation debounced: ${pageName}`);
      return;
    }
    state.lastNavigationTime = now;
    
    // Prevent concurrent navigation
    if (state.isNavigating) {
      console.log(`⏳ Navigation in progress, queuing: ${pageName}`);
      setTimeout(() => navigateTo(pageName), NAVIGATION_DEBOUNCE);
      return;
    }
    
    // Skip if already on this page
    if (state.currentPage === pageName) {
      console.log(`ℹ️ Already on page: ${pageName}`);
      return;
    }
    
    console.log(`🧭 Navigating to: ${pageName}`);
    state.isNavigating = true;
    
    try {
      // Step 1: Cleanup previous page
      if (state.currentPage) {
        cleanupPageModule(state.currentPage);
      }
      
      // Step 2: Hide all pages
      hideAllPagesExcept(pageName);
      
      // Step 3: Show target page
      const shown = showPage(pageName);
      if (!shown) {
        console.error(`❌ Failed to show page: ${pageName}`);
        // Fallback to dashboard
        if (pageName !== 'dashboard') {
          showPage('dashboard');
          pageName = 'dashboard';
        }
      }
      
      // Step 4: Update state
      state.previousPage = state.currentPage;
      state.currentPage = pageName;
      
      // Step 5: Update URL (without triggering navigation)
      if (window.history && window.history.pushState) {
        const newUrl = pageName === 'dashboard' ? '/' : `/${pageName}`;
        window.history.pushState({ page: pageName }, '', newUrl);
      }
      
      // Step 6: Update active menu item
      updateActiveMenuItem(pageName);
      
      // Step 7: Update page title
      updatePageTitle(pageName);
      
      // Step 8: Initialize page module
      await initializePageModule(pageName);
      
      // Step 9: Dispatch navigation event
      document.dispatchEvent(new CustomEvent('pageNavigated', {
        detail: { page: pageName, previousPage: state.previousPage }
      }));
      
      console.log(`✅ Navigation complete: ${pageName}`);
      
    } catch (error) {
      console.error(`❌ Navigation error:`, error);
    } finally {
      state.isNavigating = false;
    }
  }
  
  /**
   * Update active menu item in sidebar
   */
  function updateActiveMenuItem(pageName) {
    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to current menu item
    const activeItem = document.querySelector(`.menu-item[data-page="${pageName}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
      
      // Expand parent submenu if needed
      const parentSubmenu = activeItem.closest('.sidebar-submenu');
      if (parentSubmenu) {
        parentSubmenu.classList.add('expanded');
        const section = parentSubmenu.dataset.submenu;
        const toggle = document.querySelector(`.dropdown-toggle[data-section="${section}"]`);
        if (toggle) {
          toggle.classList.add('active');
        }
      }
    }
  }
  
  /**
   * Update page title in header
   */
  function updatePageTitle(pageName) {
    const titleMap = {
      'dashboard': { text: 'Dashboard', icon: 'fa-home' },
      'rencana-strategis': { text: 'Rencana Strategis', icon: 'fa-chart-line' },
      'analisis-swot': { text: 'Analisis SWOT', icon: 'fa-chart-bar' },
      'visi-misi': { text: 'Visi dan Misi', icon: 'fa-bullseye' },
      'diagram-kartesius': { text: 'Diagram Kartesius', icon: 'fa-chart-scatter' },
      'matriks-tows': { text: 'Matriks TOWS', icon: 'fa-table-cells' },
      'sasaran-strategi': { text: 'Sasaran Strategi', icon: 'fa-bullseye' },
      'strategic-map': { text: 'Strategic Map', icon: 'fa-project-diagram' },
      'indikator-kinerja-utama': { text: 'Indikator Kinerja Utama', icon: 'fa-tachometer-alt' },
      'risk-input': { text: 'Input Data Risiko', icon: 'fa-pen-to-square' },
      'monitoring-evaluasi': { text: 'Monitoring & Evaluasi', icon: 'fa-clipboard-check' },
      'peluang': { text: 'Peluang', icon: 'fa-lightbulb' },
      'risk-profile': { text: 'Risk Profile', icon: 'fa-chart-bar' },
      'residual-risk': { text: 'Residual Risk', icon: 'fa-chart-pie' },
      'kri': { text: 'Key Risk Indicator', icon: 'fa-gauge-high' },
      'loss-event': { text: 'Loss Event', icon: 'fa-exclamation-triangle' },
      'ews': { text: 'Early Warning System', icon: 'fa-triangle-exclamation' },
      'risk-register': { text: 'Risk Register', icon: 'fa-table-list' },
      'laporan': { text: 'Laporan', icon: 'fa-file-pdf' },
      'master-data': { text: 'Master Data', icon: 'fa-database' },
      'buku-pedoman': { text: 'Buku Pedoman', icon: 'fa-book' },
      'pengaturan': { text: 'Pengaturan', icon: 'fa-cog' }
    };
    
    const titleInfo = titleMap[pageName] || { text: pageName, icon: 'fa-file' };
    
    const titleText = document.getElementById('page-title-text');
    const titleIcon = document.getElementById('page-title-icon');
    
    if (titleText) {
      titleText.textContent = titleInfo.text;
    }
    
    if (titleIcon) {
      titleIcon.className = `fas ${titleInfo.icon}`;
    }
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  const PageManager = {
    /**
     * Initialize the page manager
     */
    init() {
      console.log('🚀 Initializing Page Manager...');
      
      // Determine initial page from URL
      const path = window.location.pathname.replace(/^\//, '') || 'dashboard';
      const hash = window.location.hash.replace('#', '');
      const initialPage = hash || path || 'dashboard';
      
      // Set initial page
      state.currentPage = initialPage;
      
      // Show initial page
      hideAllPagesExcept(initialPage);
      showPage(initialPage);
      updateActiveMenuItem(initialPage);
      updatePageTitle(initialPage);
      
      // Initialize module for initial page
      initializePageModule(initialPage);
      
      // Listen for popstate (browser back/forward)
      window.addEventListener('popstate', (event) => {
        const page = event.state?.page || 'dashboard';
        navigateTo(page);
      });
      
      console.log(`✅ Page Manager initialized on: ${initialPage}`);
    },
    
    /**
     * Navigate to a specific page
     */
    navigateTo,
    
    /**
     * Get current active page
     */
    getCurrentPage() {
      return state.currentPage;
    },
    
    /**
     * Get previous page
     */
    getPreviousPage() {
      return state.previousPage;
    },
    
    /**
     * Register callback for page load
     */
    onPageLoad(pageName, callback) {
      if (!state.pageLoadCallbacks.has(pageName)) {
        state.pageLoadCallbacks.set(pageName, []);
      }
      state.pageLoadCallbacks.get(pageName).push(callback);
    },
    
    /**
     * Register callback for page unload
     */
    onPageUnload(pageName, callback) {
      if (!state.pageUnloadCallbacks.has(pageName)) {
        state.pageUnloadCallbacks.set(pageName, []);
      }
      state.pageUnloadCallbacks.get(pageName).push(callback);
    },
    
    /**
     * Force refresh current page
     */
    refresh() {
      const currentPage = state.currentPage;
      state.currentPage = null; // Reset to allow re-navigation
      navigateTo(currentPage);
    },
    
    /**
     * Check if navigation is in progress
     */
    isNavigating() {
      return state.isNavigating;
    }
  };
  
  // Export to window
  window.PageManager = PageManager;
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Delay initialization to allow other scripts to load
      setTimeout(() => PageManager.init(), 100);
    });
  } else {
    setTimeout(() => PageManager.init(), 100);
  }
  
  console.log('✅ Page Manager v1.0 loaded');
  
})();
