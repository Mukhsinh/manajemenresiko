/**
 * PAGE INITIALIZATION SYSTEM - RACE CONDITION FIX
 * Prevents infinite loops and ensures proper page loading
 * Created: December 28, 2025
 */

// Prevent duplicate class declaration
if (typeof window.PageInitializationSystemFixed === 'undefined') {

class PageInitializationSystemFixed {
  constructor() {
    this.initialized = false;
    this.initializingModules = new Set();
    this.loadedModules = new Map();
    this.sessionId = this.generateSessionId();
    this.initializationQueue = [];
    this.isProcessingQueue = false;
    
    // Prevent multiple instances
    if (window.PageInitializationSystem) {
      return window.PageInitializationSystem;
    }
    
    console.log('🚀 PageInitializationSystemFixed created with session:', this.sessionId);
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize the system with race condition prevention
   */
  async initialize() {
    if (this.initialized) {
      console.log('⚠️ PageInitializationSystem already initialized');
      return;
    }

    console.log('🔧 Initializing PageInitializationSystem...');
    
    try {
      // Set initialization flag immediately
      this.initialized = true;
      
      // Stop any existing UI fix loops
      this.stopExistingUILoops();
      
      // Initialize core systems
      await this.initializeCoreModules();
      
      // Setup proper event handling
      this.setupEventHandlers();
      
      // Setup page visibility management
      this.setupPageVisibilityManagement();
      
      console.log('✅ PageInitializationSystem initialized successfully');
      
      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('pageInitSystemReady', {
        detail: { sessionId: this.sessionId }
      }));
      
    } catch (error) {
      console.error('❌ Failed to initialize PageInitializationSystem:', error);
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Stop existing UI fix loops that cause infinite "all ui fixed applied"
   */
  stopExistingUILoops() {
    console.log('🛑 Stopping existing UI fix loops...');
    
    // Clear all intervals that might be running UI fixes
    const highestIntervalId = setInterval(() => {}, 0);
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }
    
    // Clear all timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    
    // Reset UI fix flags
    window.uiFixSystemInitialized = false;
    window.rencanaStrategisLoaded = false;
    
    // Remove mutation observers that might be causing loops
    if (window.uiMutationObserver) {
      window.uiMutationObserver.disconnect();
      window.uiMutationObserver = null;
    }
    
    console.log('✅ Existing UI loops stopped');
  }

  /**
   * Initialize core modules with proper sequencing
   */
  async initializeCoreModules() {
    console.log('📦 Initializing core modules...');
    
    // Initialize modules in proper order
    const moduleInitOrder = [
      'auth',
      'router',
      'ui-framework',
      'page-modules'
    ];
    
    for (const moduleName of moduleInitOrder) {
      await this.initializeModule(moduleName);
    }
  }

  /**
   * Initialize a specific module with race condition prevention
   */
  async initializeModule(moduleName) {
    // Prevent duplicate initialization
    if (this.initializingModules.has(moduleName) || this.loadedModules.has(moduleName)) {
      console.log(`⚠️ Module ${moduleName} already initializing or loaded`);
      return;
    }

    console.log(`🔧 Initializing module: ${moduleName}`);
    this.initializingModules.add(moduleName);

    try {
      switch (moduleName) {
        case 'auth':
          await this.initializeAuth();
          break;
        case 'router':
          await this.initializeRouter();
          break;
        case 'ui-framework':
          await this.initializeUIFramework();
          break;
        case 'page-modules':
          await this.initializePageModules();
          break;
      }
      
      this.loadedModules.set(moduleName, {
        loadedAt: Date.now(),
        status: 'loaded'
      });
      
      console.log(`✅ Module ${moduleName} initialized successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize module ${moduleName}:`, error);
    } finally {
      this.initializingModules.delete(moduleName);
    }
  }

  /**
   * Initialize authentication with timeout
   */
  async initializeAuth() {
    if (window.waitForAuthReady) {
      try {
        await Promise.race([
          window.waitForAuthReady(3000),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 3000))
        ]);
        console.log('✅ Auth ready');
      } catch (error) {
        console.warn('⚠️ Auth initialization timeout, continuing without auth');
      }
    }
  }

  /**
   * Initialize router without conflicts
   */
  async initializeRouter() {
    // Prevent router conflicts
    if (window.router && typeof window.router.init === 'function') {
      try {
        await window.router.init();
        console.log('✅ Router initialized');
      } catch (error) {
        console.warn('⚠️ Router initialization failed:', error);
      }
    }
  }

  /**
   * Initialize UI framework without infinite loops
   */
  async initializeUIFramework() {
    // Initialize UI framework only once
    if (window.UIEnhancementFramework && !window.UIEnhancementFramework.initialized) {
      try {
        // Disable periodic checks to prevent infinite loops
        window.UIEnhancementFramework.config.enablePeriodicChecks = false;
        await window.UIEnhancementFramework.init();
        console.log('✅ UI Framework initialized');
      } catch (error) {
        console.warn('⚠️ UI Framework initialization failed:', error);
      }
    }
  }

  /**
   * Initialize page-specific modules
   */
  async initializePageModules() {
    // Get current page
    const currentPage = this.getCurrentPage();
    
    if (currentPage) {
      await this.loadPageModule(currentPage);
    }
  }

  /**
   * Get current page from URL
   */
  getCurrentPage() {
    const path = window.location.pathname;
    
    if (path.includes('rencana-strategis')) return 'rencana-strategis';
    if (path.includes('analisis-swot')) return 'analisis-swot';
    if (path.includes('residual-risk')) return 'residual-risk';
    if (path.includes('dashboard')) return 'dashboard';
    
    return null;
  }

  /**
   * Load specific page module
   */
  async loadPageModule(pageName) {
    console.log(`📄 Loading page module: ${pageName}`);
    
    try {
      switch (pageName) {
        case 'rencana-strategis':
          await this.loadRencanaStrategisModule();
          break;
        case 'analisis-swot':
          await this.loadAnalisisSWOTModule();
          break;
        case 'residual-risk':
          await this.loadResidualRiskModule();
          break;
        case 'dashboard':
          await this.loadDashboardModule();
          break;
      }
    } catch (error) {
      console.error(`❌ Failed to load page module ${pageName}:`, error);
    }
  }

  /**
   * Load Rencana Strategis module with race condition prevention
   */
  async loadRencanaStrategisModule() {
    // Prevent duplicate loading
    if (window.rencanaStrategisLoaded) {
      console.log('⚠️ Rencana Strategis already loaded (flag)');
      return;
    }
    
    // Check if already has proper interface
    const container = document.getElementById('rencana-strategis-content');
    if (container) {
      const hasTable = container.querySelector('table');
      const hasCards = container.querySelector('.rencana-strategis-wrapper');
      
      if (hasTable && hasCards) {
        console.log('✅ Rencana Strategis already has proper interface, skipping');
        window.rencanaStrategisLoaded = true;
        return;
      }
    }

    // Set loading flag immediately
    window.rencanaStrategisLoaded = true;
    
    try {
      // Ensure page is visible
      const rencanaPage = document.getElementById('rencana-strategis');
      if (rencanaPage) {
        rencanaPage.classList.add('active');
        
        // Hide other pages
        document.querySelectorAll('.page-content').forEach(page => {
          if (page.id !== 'rencana-strategis') {
            page.classList.remove('active');
          }
        });
      }
      
      // Load the module
      if (window.RencanaStrategisModule && typeof window.RencanaStrategisModule.load === 'function') {
        await window.RencanaStrategisModule.load();
        console.log('✅ Rencana Strategis module loaded');
      }
      
    } catch (error) {
      console.error('❌ Failed to load Rencana Strategis module:', error);
      window.rencanaStrategisLoaded = false;
    }
  }

  /**
   * Load other modules (placeholder implementations)
   */
  async loadAnalisisSWOTModule() {
    if (window.AnalisisSWOTModule && typeof window.AnalisisSWOTModule.load === 'function') {
      await window.AnalisisSWOTModule.load();
    }
  }

  async loadResidualRiskModule() {
    if (window.ResidualRiskModule && typeof window.ResidualRiskModule.load === 'function') {
      await window.ResidualRiskModule.load();
    }
  }

  async loadDashboardModule() {
    if (window.DashboardModule && typeof window.DashboardModule.load === 'function') {
      await window.DashboardModule.load();
    }
  }

  /**
   * Setup event handlers without conflicts
   */
  setupEventHandlers() {
    // Handle page navigation
    window.addEventListener('popstate', (event) => {
      this.handlePageNavigation();
    });
    
    // Handle hash changes
    window.addEventListener('hashchange', (event) => {
      this.handlePageNavigation();
    });
    
    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
  }

  /**
   * Handle page navigation without infinite loops
   */
  handlePageNavigation() {
    // Debounce navigation handling
    if (this.navigationTimeout) {
      clearTimeout(this.navigationTimeout);
    }
    
    this.navigationTimeout = setTimeout(() => {
      const currentPage = this.getCurrentPage();
      if (currentPage && !this.loadedModules.has(currentPage)) {
        this.loadPageModule(currentPage);
      }
    }, 200);
  }

  /**
   * Handle visibility changes
   */
  handleVisibilityChange() {
    if (document.hidden) {
      console.log('📱 Page hidden, pausing initialization system');
    } else {
      console.log('📱 Page visible, resuming initialization system');
      // Only re-initialize if needed
      const currentPage = this.getCurrentPage();
      if (currentPage) {
        this.ensurePageVisibility(currentPage);
      }
    }
  }

  /**
   * Setup page visibility management
   */
  setupPageVisibilityManagement() {
    // Ensure proper page visibility on load
    const currentPage = this.getCurrentPage();
    if (currentPage) {
      this.ensurePageVisibility(currentPage);
    }
  }

  /**
   * Ensure page visibility without conflicts
   */
  ensurePageVisibility(pageName) {
    const pageElement = document.getElementById(pageName);
    if (pageElement) {
      // Show current page
      pageElement.classList.add('active');
      
      // Hide other pages
      document.querySelectorAll('.page-content').forEach(page => {
        if (page.id !== pageName) {
          page.classList.remove('active');
        }
      });
      
      console.log(`✅ Page visibility ensured for: ${pageName}`);
    }
  }

  /**
   * Apply UI fixes once without infinite loops
   */
  applyUIFixesOnce() {
    if (this.uiFixesApplied) {
      return;
    }
    
    this.uiFixesApplied = true;
    
    try {
      // Apply basic UI fixes
      this.fixHeaderStyling();
      this.fixTableStyling();
      
      console.log('✅ UI fixes applied once');
    } catch (error) {
      console.error('❌ Error applying UI fixes:', error);
    }
  }

  /**
   * Fix header styling
   */
  fixHeaderStyling() {
    const headers = document.querySelectorAll('.page-header, .card-header, .section-header');
    headers.forEach(header => {
      header.style.backgroundColor = '#ffffff';
      header.style.color = '#2c3e50';
      header.style.borderLeft = '4px solid #8B0000';
    });
  }

  /**
   * Fix table styling
   */
  fixTableStyling() {
    const tableHeaders = document.querySelectorAll('table thead, .table thead');
    tableHeaders.forEach(thead => {
      thead.style.backgroundColor = '#f8f9fa';
      thead.style.color = '#495057';
    });
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      sessionId: this.sessionId,
      loadedModules: Array.from(this.loadedModules.keys()),
      initializingModules: Array.from(this.initializingModules)
    };
  }

  /**
   * Cleanup and reset
   */
  cleanup() {
    console.log('🧹 Cleaning up PageInitializationSystem...');
    
    // Clear timeouts
    if (this.navigationTimeout) {
      clearTimeout(this.navigationTimeout);
    }
    
    // Reset flags
    this.initialized = false;
    this.initializingModules.clear();
    this.loadedModules.clear();
    
    // Reset global flags
    window.rencanaStrategisLoaded = false;
    window.uiFixSystemInitialized = false;
    
    console.log('✅ PageInitializationSystemFixed cleaned up');
  }
}

// Create and initialize the system only if PageInitializationSystem doesn't exist
if (!window.PageInitializationSystem) {
  window.PageInitializationSystem = new PageInitializationSystemFixed();

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.PageInitializationSystem.initialize();
    });
  } else {
    window.PageInitializationSystem.initialize();
  }

  // Export for debugging
  window.pageInitSystem = window.PageInitializationSystem;

  console.log('✅ Page Initialization System (Fixed) loaded');
} else {
  console.log('⚠️ PageInitializationSystem already exists, skipping Fixed version');
}

} // End of duplicate check if block