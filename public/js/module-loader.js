/**
 * Module Loader System
 * Ensures proper JavaScript module loading and initialization
 * Prevents page refresh requirements by managing dependencies
 */

class ModuleLoader {
  constructor() {
    this.modules = new Map();
    this.loadedModules = new Set();
    this.initializationQueue = [];
    this.isInitializing = false;
    this.dependencies = new Map();
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    
    // Bind methods
    this.loadModule = this.loadModule.bind(this);
    this.initializeModule = this.initializeModule.bind(this);
    
    console.log('ModuleLoader initialized');
  }

  /**
   * Register a module with its dependencies
   * @param {string} name - Module name
   * @param {Function} initFunction - Module initialization function
   * @param {Array} dependencies - Array of dependency module names
   * @param {Object} options - Module options
   */
  registerModule(name, initFunction, dependencies = [], options = {}) {
    const module = {
      name,
      initFunction,
      dependencies,
      options,
      initialized: false,
      loading: false,
      error: null
    };
    
    this.modules.set(name, module);
    this.dependencies.set(name, dependencies);
    
    console.log(`Module registered: ${name}`, { dependencies, options });
    
    return this;
  }

  /**
   * Load and initialize a module
   * @param {string} name - Module name
   * @returns {Promise} Promise that resolves when module is loaded
   */
  async loadModule(name) {
    const module = this.modules.get(name);
    
    if (!module) {
      throw new Error(`Module not found: ${name}`);
    }
    
    if (module.initialized) {
      return module;
    }
    
    if (module.loading) {
      // Wait for ongoing loading
      return new Promise((resolve, reject) => {
        const checkLoading = () => {
          if (module.initialized) {
            resolve(module);
          } else if (module.error) {
            reject(module.error);
          } else {
            setTimeout(checkLoading, 50);
          }
        };
        checkLoading();
      });
    }
    
    module.loading = true;
    
    try {
      // Load dependencies first
      await this.loadDependencies(name);
      
      // Initialize the module
      await this.initializeModule(module);
      
      module.initialized = true;
      module.loading = false;
      this.loadedModules.add(name);
      
      console.log(`Module loaded successfully: ${name}`);
      return module;
      
    } catch (error) {
      module.loading = false;
      module.error = error;
      
      const retries = this.retryAttempts.get(name) || 0;
      if (retries < this.maxRetries) {
        this.retryAttempts.set(name, retries + 1);
        console.warn(`Module load failed, retrying (${retries + 1}/${this.maxRetries}): ${name}`, error);
        
        // Retry after delay
        setTimeout(() => {
          module.loading = false;
          module.error = null;
          this.loadModule(name);
        }, 1000 * (retries + 1));
      } else {
        console.error(`Module load failed after ${this.maxRetries} attempts: ${name}`, error);
        throw error;
      }
    }
  }

  /**
   * Load module dependencies
   * @param {string} moduleName - Module name
   */
  async loadDependencies(moduleName) {
    const dependencies = this.dependencies.get(moduleName) || [];
    
    for (const depName of dependencies) {
      if (!this.loadedModules.has(depName)) {
        await this.loadModule(depName);
      }
    }
  }

  /**
   * Initialize a module
   * @param {Object} module - Module object
   */
  async initializeModule(module) {
    try {
      if (typeof module.initFunction === 'function') {
        const result = await module.initFunction(module.options);
        
        // Store result if returned
        if (result) {
          module.instance = result;
        }
      }
    } catch (error) {
      console.error(`Module initialization failed: ${module.name}`, error);
      throw error;
    }
  }

  /**
   * Load multiple modules
   * @param {Array} moduleNames - Array of module names
   */
  async loadModules(moduleNames) {
    const promises = moduleNames.map(name => this.loadModule(name));
    return Promise.all(promises);
  }

  /**
   * Get a loaded module instance
   * @param {string} name - Module name
   */
  getModule(name) {
    const module = this.modules.get(name);
    return module && module.initialized ? module.instance : null;
  }

  /**
   * Check if module is loaded
   * @param {string} name - Module name
   */
  isModuleLoaded(name) {
    return this.loadedModules.has(name);
  }

  /**
   * Unload a module
   * @param {string} name - Module name
   */
  unloadModule(name) {
    const module = this.modules.get(name);
    if (module) {
      // Call cleanup if available
      if (module.instance && typeof module.instance.cleanup === 'function') {
        module.instance.cleanup();
      }
      
      module.initialized = false;
      module.loading = false;
      module.error = null;
      module.instance = null;
      
      this.loadedModules.delete(name);
      this.retryAttempts.delete(name);
      
      console.log(`Module unloaded: ${name}`);
    }
  }

  /**
   * Reload a module
   * @param {string} name - Module name
   */
  async reloadModule(name) {
    this.unloadModule(name);
    return this.loadModule(name);
  }

  /**
   * Get module status
   */
  getModuleStatus() {
    const status = {
      total: this.modules.size,
      loaded: this.loadedModules.size,
      loading: 0,
      failed: 0,
      modules: {}
    };
    
    for (const [name, module] of this.modules) {
      if (module.loading) status.loading++;
      if (module.error) status.failed++;
      
      status.modules[name] = {
        initialized: module.initialized,
        loading: module.loading,
        error: module.error ? module.error.message : null,
        retries: this.retryAttempts.get(name) || 0
      };
    }
    
    return status;
  }

  /**
   * Initialize page-specific modules based on current page
   */
  async initializePageModules() {
    const currentPage = this.getCurrentPage();
    const pageModules = this.getPageModules(currentPage);
    
    console.log(`Initializing modules for page: ${currentPage}`, pageModules);
    
    try {
      await this.loadModules(pageModules);
      console.log(`Page modules loaded successfully for: ${currentPage}`);
    } catch (error) {
      console.error(`Failed to load page modules for: ${currentPage}`, error);
      throw error;
    }
  }

  /**
   * Get current page identifier
   */
  getCurrentPage() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    // Extract page from path or hash
    if (hash && hash.includes('/')) {
      return hash.split('/')[1] || 'dashboard';
    }
    
    if (path.includes('/')) {
      const segments = path.split('/').filter(s => s);
      return segments[segments.length - 1] || 'dashboard';
    }
    
    return 'dashboard';
  }

  /**
   * Get modules required for a specific page
   * @param {string} page - Page identifier
   */
  getPageModules(page) {
    const pageModuleMap = {
      'dashboard': ['auth-check', 'dashboard-charts', 'notification-system'],
      'rencana-strategis': ['auth-check', 'table-handler', 'form-handler', 'chart-renderer'],
      'risk-residual': ['auth-check', 'risk-matrix', 'chart-handler', 'export-handler'],
      'analisis-swot': ['auth-check', 'swot-analysis', 'chart-renderer'],
      'risk-register': ['auth-check', 'risk-register', 'table-handler'],
      'monitoring-evaluasi': ['auth-check', 'monitoring-system', 'chart-renderer'],
      'indikator-kinerja-utama': ['auth-check', 'kpi-system', 'chart-renderer'],
      'sasaran-strategi': ['auth-check', 'strategy-system', 'form-handler'],
      'visi-misi': ['auth-check', 'form-handler'],
      'master-data': ['auth-check', 'master-data-system', 'table-handler'],
      'user-management': ['auth-check', 'user-system', 'table-handler'],
      'laporan': ['auth-check', 'report-system', 'export-handler']
    };
    
    return pageModuleMap[page] || ['auth-check'];
  }

  /**
   * Handle navigation events
   */
  handleNavigation() {
    // Re-initialize modules for new page
    this.initializePageModules().catch(error => {
      console.error('Navigation module initialization failed:', error);
    });
  }

  /**
   * Setup navigation listeners
   */
  setupNavigationListeners() {
    // Listen for hash changes (SPA navigation)
    window.addEventListener('hashchange', () => {
      this.handleNavigation();
    });
    
    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', () => {
      this.handleNavigation();
    });
    
    // Intercept navigation links
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (link && link.href.includes('#/')) {
        // SPA navigation detected
        setTimeout(() => {
          this.handleNavigation();
        }, 100);
      }
    });
  }

  /**
   * Initialize the module loader system
   */
  async initialize() {
    if (this.isInitializing) return;
    
    this.isInitializing = true;
    
    try {
      // Setup navigation listeners
      this.setupNavigationListeners();
      
      // Load core modules first
      await this.loadModules(['auth-check', 'ui-framework']);
      
      // Load page-specific modules
      await this.initializePageModules();
      
      console.log('ModuleLoader initialization complete');
      
    } catch (error) {
      console.error('ModuleLoader initialization failed:', error);
    } finally {
      this.isInitializing = false;
    }
  }
}

// Create global instance
window.ModuleLoader = new ModuleLoader();

// Register core modules
window.ModuleLoader
  .registerModule('auth-check', async () => {
    // Auth check module
    return {
      checkAuth: () => {
        const token = localStorage.getItem('token');
        return token && token !== 'null';
      },
      redirectToLogin: () => {
        if (!window.location.hash.includes('login')) {
          window.location.hash = '#/login';
        }
      }
    };
  })
  .registerModule('ui-framework', async () => {
    // UI framework initialization
    if (window.IconSystem) {
      window.IconSystem.initializeAll();
    }
    return { initialized: true };
  }, ['auth-check'])
  .registerModule('table-handler', async () => {
    // Table handling functionality
    return {
      initializeTables: () => {
        // Initialize responsive tables
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
          if (!table.closest('.table-container')) {
            const container = document.createElement('div');
            container.className = 'table-container';
            table.parentNode.insertBefore(container, table);
            container.appendChild(table);
          }
        });
      }
    };
  })
  .registerModule('form-handler', async () => {
    // Form handling functionality
    return {
      initializeForms: () => {
        // Add form validation and styling
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
          form.addEventListener('submit', (e) => {
            // Add loading state
            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.innerHTML = '<i data-lucide="loader" class="loading-spinner"></i> Processing...';
            }
          });
        });
      }
    };
  })
  .registerModule('chart-renderer', async () => {
    // Chart rendering functionality
    return {
      renderCharts: () => {
        // Initialize charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
          const chartElements = document.querySelectorAll('canvas[data-chart]');
          chartElements.forEach(canvas => {
            // Chart initialization logic here
          });
        }
      }
    };
  });

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ModuleLoader.initialize();
  });
} else {
  window.ModuleLoader.initialize();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModuleLoader;
}