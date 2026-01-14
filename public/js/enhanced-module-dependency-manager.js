/**
 * Enhanced Module Dependency Manager
 * Manages complex module dependencies and initialization order
 * Prevents page refresh requirements by ensuring proper loading sequence
 */

class EnhancedModuleDependencyManager {
  constructor() {
    this.modules = new Map();
    this.dependencies = new Map();
    this.loadedModules = new Set();
    this.loadingModules = new Set();
    this.failedModules = new Set();
    this.initializationQueue = [];
    this.eventListeners = new Map();
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.loadTimeout = 10000; // 10 seconds
    
    // Performance tracking
    this.performanceMetrics = {
      loadTimes: new Map(),
      initTimes: new Map(),
      totalLoadTime: 0
    };
    
    // Bind methods
    this.loadModule = this.loadModule.bind(this);
    this.initializeModule = this.initializeModule.bind(this);
    
    console.log('Enhanced Module Dependency Manager initialized');
  }

  /**
   * Register a module with enhanced configuration
   * @param {string} name - Module name
   * @param {Function|Object} moduleConfig - Module configuration or init function
   * @param {Array} dependencies - Array of dependency module names
   * @param {Object} options - Enhanced module options
   */
  registerModule(name, moduleConfig, dependencies = [], options = {}) {
    const module = {
      name,
      config: moduleConfig,
      dependencies,
      options: {
        priority: options.priority || 0,
        lazy: options.lazy || false,
        essential: options.essential !== false, // Default to essential
        timeout: options.timeout || this.loadTimeout,
        retryable: options.retryable !== false,
        preload: options.preload || false,
        ...options
      },
      state: 'registered',
      loadStartTime: null,
      loadEndTime: null,
      initStartTime: null,
      initEndTime: null,
      error: null,
      instance: null
    };
    
    this.modules.set(name, module);
    this.dependencies.set(name, dependencies);
    
    // Add to preload queue if specified
    if (module.options.preload) {
      this.initializationQueue.push(name);
    }
    
    console.log(`Module registered: ${name}`, { 
      dependencies, 
      options: module.options 
    });
    
    return this;
  }

  /**
   * Load module with enhanced error handling and performance tracking
   * @param {string} name - Module name
   * @returns {Promise} Promise that resolves when module is loaded
   */
  async loadModule(name) {
    const module = this.modules.get(name);
    
    if (!module) {
      throw new Error(`Module not found: ${name}`);
    }
    
    // Return if already loaded
    if (this.loadedModules.has(name)) {
      return module.instance;
    }
    
    // Return if currently loading (prevent duplicate loads)
    if (this.loadingModules.has(name)) {
      return this.waitForModuleLoad(name);
    }
    
    // Check if module failed and retry limit reached
    if (this.failedModules.has(name)) {
      const retries = this.retryAttempts.get(name) || 0;
      if (retries >= this.maxRetries) {
        throw new Error(`Module ${name} failed to load after ${this.maxRetries} attempts`);
      }
    }
    
    this.loadingModules.add(name);
    module.state = 'loading';
    module.loadStartTime = performance.now();
    
    try {
      // Load dependencies first
      await this.loadDependencies(name);
      
      // Initialize the module with timeout
      const initPromise = this.initializeModule(module);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Module ${name} load timeout`)), module.options.timeout);
      });
      
      await Promise.race([initPromise, timeoutPromise]);
      
      // Mark as loaded
      module.state = 'loaded';
      module.loadEndTime = performance.now();
      this.loadedModules.add(name);
      this.loadingModules.delete(name);
      this.failedModules.delete(name);
      this.retryAttempts.delete(name);
      
      // Track performance
      const loadTime = module.loadEndTime - module.loadStartTime;
      this.performanceMetrics.loadTimes.set(name, loadTime);
      
      console.log(`Module loaded successfully: ${name} (${loadTime.toFixed(2)}ms)`);
      
      // Emit load event
      this.emitEvent('moduleLoaded', { name, module, loadTime });
      
      return module.instance;
      
    } catch (error) {
      this.handleModuleLoadError(name, module, error);
      throw error;
    }
  }

  /**
   * Handle module load errors with retry logic
   * @param {string} name - Module name
   * @param {Object} module - Module object
   * @param {Error} error - Error that occurred
   */
  async handleModuleLoadError(name, module, error) {
    module.state = 'failed';
    module.error = error;
    this.loadingModules.delete(name);
    this.failedModules.add(name);
    
    const retries = this.retryAttempts.get(name) || 0;
    
    if (retries < this.maxRetries && module.options.retryable) {
      this.retryAttempts.set(name, retries + 1);
      
      console.warn(`Module load failed, retrying (${retries + 1}/${this.maxRetries}): ${name}`, error);
      
      // Exponential backoff retry
      const delay = Math.pow(2, retries) * 1000;
      setTimeout(() => {
        module.state = 'registered';
        module.error = null;
        this.failedModules.delete(name);
        this.loadModule(name).catch(retryError => {
          console.error(`Module retry failed: ${name}`, retryError);
        });
      }, delay);
    } else {
      console.error(`Module load failed permanently: ${name}`, error);
      
      // Emit error event
      this.emitEvent('moduleLoadError', { name, module, error, retries });
      
      // Handle essential module failure
      if (module.options.essential) {
        this.handleEssentialModuleFailure(name, error);
      }
    }
  }

  /**
   * Handle essential module failure
   * @param {string} name - Module name
   * @param {Error} error - Error that occurred
   */
  handleEssentialModuleFailure(name, error) {
    console.error(`Essential module failed: ${name}`, error);
    
    // Show user-friendly error message
    this.showModuleErrorMessage(name, error);
    
    // Emit critical error event
    this.emitEvent('criticalModuleError', { name, error });
  }

  /**
   * Show user-friendly error message
   * @param {string} name - Module name
   * @param {Error} error - Error that occurred
   */
  showModuleErrorMessage(name, error) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'module-error-notification';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h4>Module Load Error</h4>
        <p>Failed to load essential module: ${name}</p>
        <p>Please refresh the page to try again.</p>
        <button onclick="window.location.reload()" class="retry-button">Refresh Page</button>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 10000);
  }

  /**
   * Wait for module to finish loading
   * @param {string} name - Module name
   * @returns {Promise} Promise that resolves when module is loaded
   */
  async waitForModuleLoad(name) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.loadedModules.has(name)) {
          clearInterval(checkInterval);
          resolve(this.modules.get(name).instance);
        } else if (this.failedModules.has(name)) {
          clearInterval(checkInterval);
          reject(new Error(`Module ${name} failed to load`));
        }
      }, 100);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error(`Timeout waiting for module ${name}`));
      }, 30000);
    });
  }

  /**
   * Load module dependencies in correct order
   * @param {string} moduleName - Module name
   */
  async loadDependencies(moduleName) {
    const dependencies = this.dependencies.get(moduleName) || [];
    
    // Sort dependencies by priority
    const sortedDeps = dependencies.sort((a, b) => {
      const moduleA = this.modules.get(a);
      const moduleB = this.modules.get(b);
      return (moduleB?.options.priority || 0) - (moduleA?.options.priority || 0);
    });
    
    // Load dependencies in parallel where possible
    const depPromises = sortedDeps.map(depName => {
      if (!this.loadedModules.has(depName)) {
        return this.loadModule(depName);
      }
      return Promise.resolve();
    });
    
    await Promise.all(depPromises);
  }

  /**
   * Initialize a module with enhanced error handling
   * @param {Object} module - Module object
   */
  async initializeModule(module) {
    module.initStartTime = performance.now();
    
    try {
      let result;
      
      if (typeof module.config === 'function') {
        // Function-based module
        result = await module.config(module.options);
      } else if (typeof module.config === 'object' && module.config.init) {
        // Object-based module with init method
        result = await module.config.init(module.options);
      } else if (typeof module.config === 'object') {
        // Static object module
        result = module.config;
      } else {
        throw new Error(`Invalid module configuration for ${module.name}`);
      }
      
      // Store result
      module.instance = result || {};
      module.initEndTime = performance.now();
      
      // Track initialization time
      const initTime = module.initEndTime - module.initStartTime;
      this.performanceMetrics.initTimes.set(module.name, initTime);
      
      console.log(`Module initialized: ${module.name} (${initTime.toFixed(2)}ms)`);
      
    } catch (error) {
      module.initEndTime = performance.now();
      console.error(`Module initialization failed: ${module.name}`, error);
      throw error;
    }
  }

  /**
   * Load multiple modules with dependency resolution
   * @param {Array} moduleNames - Array of module names
   * @returns {Promise} Promise that resolves when all modules are loaded
   */
  async loadModules(moduleNames) {
    const startTime = performance.now();
    
    try {
      // Create dependency graph
      const dependencyGraph = this.createDependencyGraph(moduleNames);
      
      // Load modules in dependency order
      const loadPromises = dependencyGraph.map(batch => 
        Promise.all(batch.map(name => this.loadModule(name)))
      );
      
      // Execute batches sequentially
      for (const batchPromise of loadPromises) {
        await batchPromise;
      }
      
      const endTime = performance.now();
      this.performanceMetrics.totalLoadTime = endTime - startTime;
      
      console.log(`All modules loaded successfully (${this.performanceMetrics.totalLoadTime.toFixed(2)}ms)`);
      
      // Emit completion event
      this.emitEvent('allModulesLoaded', { 
        modules: moduleNames, 
        totalTime: this.performanceMetrics.totalLoadTime 
      });
      
    } catch (error) {
      console.error('Failed to load modules:', error);
      throw error;
    }
  }

  /**
   * Initialize page-specific modules based on current page
   * @param {string} pageName - Optional page name override
   * @returns {Promise} Promise that resolves when page modules are loaded
   */
  async initializePageModules(pageName = null) {
    const currentPage = pageName || this.getCurrentPage();
    const pageModules = this.getPageModules(currentPage);
    
    console.log(`Initializing modules for page: ${currentPage}`, pageModules);
    
    try {
      // Load core modules first
      const coreModules = ['dom-ready', 'ui-framework', 'auth-check'];
      await this.loadModules(coreModules);
      
      // Then load page-specific modules
      await this.loadModules(pageModules);
      
      // Apply page-specific fixes
      await this.applyPageSpecificFixes(currentPage);
      
      console.log(`Page modules loaded successfully for: ${currentPage}`);
      
      // Emit page ready event
      this.emitEvent('pageModulesReady', { page: currentPage, modules: pageModules });
      
    } catch (error) {
      console.error(`Failed to load page modules for: ${currentPage}`, error);
      throw error;
    }
  }

  /**
   * Get current page identifier
   * @returns {string} Current page identifier
   */
  getCurrentPage() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    // Extract page from hash (SPA routing)
    if (hash && hash.includes('/')) {
      const hashPage = hash.split('/')[1];
      if (hashPage) return hashPage;
    }
    
    // Extract page from path
    if (path.includes('/')) {
      const segments = path.split('/').filter(s => s);
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && lastSegment !== 'index.html') {
        return lastSegment.replace('.html', '');
      }
    }
    
    // Check for page indicators in DOM
    const pageElement = document.querySelector('[data-page]');
    if (pageElement) {
      return pageElement.getAttribute('data-page');
    }
    
    // Check body classes
    const bodyClasses = document.body.className.split(' ');
    const pageClass = bodyClasses.find(cls => cls.endsWith('-page'));
    if (pageClass) {
      return pageClass.replace('-page', '');
    }
    
    return 'dashboard';
  }

  /**
   * Get modules required for a specific page
   * @param {string} page - Page identifier
   * @returns {Array} Array of required module names
   */
  getPageModules(page) {
    const pageModuleMap = {
      'dashboard': ['dashboard-charts', 'notification-system', 'card-manager'],
      'rencana-strategis': ['table-handler', 'form-handler', 'chart-renderer', 'rencana-strategis-fix'],
      'risk-residual': ['risk-matrix', 'chart-handler', 'export-handler', 'risk-residual-fix'],
      'residual-risk': ['risk-matrix', 'chart-handler', 'export-handler', 'risk-residual-fix'],
      'analisis-swot': ['swot-analysis', 'chart-renderer', 'matrix-handler'],
      'risk-register': ['risk-register', 'table-handler', 'export-handler'],
      'monitoring-evaluasi': ['monitoring-system', 'chart-renderer', 'form-handler'],
      'indikator-kinerja-utama': ['kpi-system', 'chart-renderer', 'table-handler'],
      'sasaran-strategi': ['strategy-system', 'form-handler', 'chart-renderer'],
      'visi-misi': ['form-handler', 'text-editor'],
      'master-data': ['master-data-system', 'table-handler', 'import-export'],
      'user-management': ['user-system', 'table-handler', 'form-handler'],
      'laporan': ['report-system', 'export-handler', 'chart-renderer']
    };
    
    return pageModuleMap[page] || ['basic-ui'];
  }

  /**
   * Apply page-specific fixes after modules are loaded
   * @param {string} page - Page identifier
   */
  async applyPageSpecificFixes(page) {
    console.log(`Applying page-specific fixes for: ${page}`);
    
    try {
      // Apply fixes based on page type
      switch (page) {
        case 'rencana-strategis':
          await this.applyRencanaStrategisFixes();
          break;
        case 'risk-residual':
        case 'residual-risk':
          await this.applyRiskResidualFixes();
          break;
        case 'analisis-swot':
          await this.applyAnalisisSwotFixes();
          break;
        default:
          await this.applyGeneralFixes();
      }
      
      console.log(`Page-specific fixes applied for: ${page}`);
      
    } catch (error) {
      console.error(`Failed to apply page-specific fixes for: ${page}`, error);
    }
  }

  /**
   * Apply Rencana Strategis page fixes
   */
  async applyRencanaStrategisFixes() {
    // Initialize Rencana Strategis page fix if available
    if (window.rencanaStrategisPageFix) {
      await window.rencanaStrategisPageFix.init();
    } else if (window.RencanaStrategisPageFix) {
      window.rencanaStrategisPageFix = new window.RencanaStrategisPageFix();
      await window.rencanaStrategisPageFix.init();
    }
  }

  /**
   * Apply Risk Residual page fixes
   */
  async applyRiskResidualFixes() {
    // Initialize Risk Residual page fix if available
    if (window.riskResidualPageFix) {
      await window.riskResidualPageFix.init();
    } else if (window.RiskResidualPageFix) {
      window.riskResidualPageFix = new window.RiskResidualPageFix();
      await window.riskResidualPageFix.init();
    }
  }

  /**
   * Apply Analisis SWOT page fixes
   */
  async applyAnalisisSwotFixes() {
    // Apply SWOT-specific fixes
    const swotElements = document.querySelectorAll('.swot-matrix, .analisis-swot');
    swotElements.forEach(element => {
      if (!element.classList.contains('swot-enhanced')) {
        element.classList.add('swot-enhanced');
      }
    });
  }

  /**
   * Apply general page fixes
   */
  async applyGeneralFixes() {
    // Apply general UI enhancements
    if (window.UIEnhancementFramework) {
      window.UIEnhancementFramework.applyUIEnhancements();
    }
    
    // Initialize responsive containers
    if (window.ResponsiveContainerSystem) {
      window.ResponsiveContainerSystem.processExistingContainers();
    }
    
    // Initialize icon system
    if (window.IconSystem) {
      window.IconSystem.initializeAll();
    }
  }

  /**
   * Create dependency graph for parallel loading
   * @param {Array} moduleNames - Array of module names
   * @returns {Array} Array of batches for sequential loading
   */
  createDependencyGraph(moduleNames) {
    const graph = new Map();
    const visited = new Set();
    const batches = [];
    
    // Build dependency graph
    moduleNames.forEach(name => {
      if (!graph.has(name)) {
        this.buildDependencyNode(name, graph);
      }
    });
    
    // Create loading batches
    while (visited.size < moduleNames.length) {
      const batch = [];
      
      moduleNames.forEach(name => {
        if (!visited.has(name)) {
          const deps = graph.get(name) || [];
          const allDepsLoaded = deps.every(dep => visited.has(dep));
          
          if (allDepsLoaded) {
            batch.push(name);
          }
        }
      });
      
      if (batch.length === 0) {
        throw new Error('Circular dependency detected in modules');
      }
      
      batch.forEach(name => visited.add(name));
      batches.push(batch);
    }
    
    return batches;
  }

  /**
   * Build dependency node recursively
   * @param {string} name - Module name
   * @param {Map} graph - Dependency graph
   */
  buildDependencyNode(name, graph) {
    if (graph.has(name)) return;
    
    const dependencies = this.dependencies.get(name) || [];
    graph.set(name, dependencies);
    
    dependencies.forEach(dep => {
      this.buildDependencyNode(dep, graph);
    });
  }

  /**
   * Get module instance
   * @param {string} name - Module name
   * @returns {Object|null} Module instance or null
   */
  getModule(name) {
    const module = this.modules.get(name);
    return module && this.loadedModules.has(name) ? module.instance : null;
  }

  /**
   * Check if module is loaded
   * @param {string} name - Module name
   * @returns {boolean} True if module is loaded
   */
  isModuleLoaded(name) {
    return this.loadedModules.has(name);
  }

  /**
   * Get module status
   * @param {string} name - Module name (optional)
   * @returns {Object} Module status information
   */
  getModuleStatus(name = null) {
    if (name) {
      const module = this.modules.get(name);
      if (!module) return null;
      
      return {
        name,
        state: module.state,
        loaded: this.loadedModules.has(name),
        loading: this.loadingModules.has(name),
        failed: this.failedModules.has(name),
        error: module.error,
        retries: this.retryAttempts.get(name) || 0,
        loadTime: this.performanceMetrics.loadTimes.get(name),
        initTime: this.performanceMetrics.initTimes.get(name)
      };
    }
    
    // Return overall status
    return {
      total: this.modules.size,
      loaded: this.loadedModules.size,
      loading: this.loadingModules.size,
      failed: this.failedModules.size,
      totalLoadTime: this.performanceMetrics.totalLoadTime,
      modules: Array.from(this.modules.keys()).map(name => this.getModuleStatus(name))
    };
  }

  /**
   * Event system for module lifecycle
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitEvent(event, data) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Event listener error for ${event}:`, error);
      }
    });
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
        try {
          module.instance.cleanup();
        } catch (error) {
          console.error(`Module cleanup error for ${name}:`, error);
        }
      }
      
      // Reset module state
      module.state = 'registered';
      module.instance = null;
      module.error = null;
      
      // Remove from loaded sets
      this.loadedModules.delete(name);
      this.loadingModules.delete(name);
      this.failedModules.delete(name);
      this.retryAttempts.delete(name);
      
      console.log(`Module unloaded: ${name}`);
      
      // Emit unload event
      this.emitEvent('moduleUnloaded', { name });
    }
  }

  /**
   * Reload a module
   * @param {string} name - Module name
   * @returns {Promise} Promise that resolves when module is reloaded
   */
  async reloadModule(name) {
    this.unloadModule(name);
    return this.loadModule(name);
  }

  /**
   * Clean up all resources
   */
  cleanup() {
    // Unload all modules
    Array.from(this.loadedModules).forEach(name => {
      this.unloadModule(name);
    });
    
    // Clear all data structures
    this.modules.clear();
    this.dependencies.clear();
    this.loadedModules.clear();
    this.loadingModules.clear();
    this.failedModules.clear();
    this.retryAttempts.clear();
    this.eventListeners.clear();
    this.initializationQueue.length = 0;
    
    console.log('Enhanced Module Dependency Manager cleaned up');
  }
}

// Create global instance
window.EnhancedModuleDependencyManager = new EnhancedModuleDependencyManager();

// Register essential modules
window.EnhancedModuleDependencyManager
  .registerModule('dom-ready', async () => {
    // DOM ready module - ensures DOM is fully loaded
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }, [], { priority: 100, essential: true })
  
  .registerModule('ui-framework', async () => {
    // UI framework initialization
    if (window.UIEnhancementFramework) {
      await window.UIEnhancementFramework.init();
    }
    return { initialized: true };
  }, ['dom-ready'], { priority: 90, essential: true })
  
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
  }, ['dom-ready'], { priority: 95, essential: true })
  
  .registerModule('table-handler', async () => {
    // Table handling functionality
    return {
      initializeTables: () => {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
          if (!table.closest('.table-container')) {
            const container = document.createElement('div');
            container.className = 'table-container';
            table.parentNode.insertBefore(container, table);
            container.appendChild(table);
          }
          
          // Add blue headers
          const thead = table.querySelector('thead');
          if (thead) {
            thead.classList.add('table-header');
            const ths = thead.querySelectorAll('th');
            ths.forEach(th => {
              th.style.backgroundColor = 'var(--primary-blue, #3b82f6)';
              th.style.color = 'white';
            });
          }
        });
      }
    };
  }, ['ui-framework'], { priority: 70 })
  
  .registerModule('form-handler', async () => {
    // Form handling functionality
    return {
      initializeForms: () => {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
          if (!form.hasAttribute('data-form-initialized')) {
            form.addEventListener('submit', (e) => {
              const submitBtn = form.querySelector('[type="submit"]');
              if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i data-lucide="loader" class="loading-spinner"></i> Processing...';
              }
            });
            form.setAttribute('data-form-initialized', 'true');
          }
        });
      }
    };
  }, ['ui-framework'], { priority: 70 })
  
  .registerModule('chart-renderer', async () => {
    // Chart rendering functionality
    return {
      renderCharts: () => {
        if (typeof Chart !== 'undefined') {
          const chartElements = document.querySelectorAll('canvas[data-chart]:not([data-chart-initialized])');
          chartElements.forEach(canvas => {
            try {
              const chartType = canvas.getAttribute('data-chart') || 'bar';
              new Chart(canvas, {
                type: chartType,
                data: {
                  labels: ['Sample'],
                  datasets: [{
                    label: 'Data',
                    data: [1],
                    backgroundColor: '#3b82f6'
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false
                }
              });
              canvas.setAttribute('data-chart-initialized', 'true');
            } catch (error) {
              console.error('Chart initialization failed:', error);
            }
          });
        }
      }
    };
  }, ['ui-framework'], { priority: 60 })
  
  .registerModule('rencana-strategis-fix', async () => {
    // Rencana Strategis page-specific fixes
    if (window.RencanaStrategisPageFix) {
      const fix = new window.RencanaStrategisPageFix();
      await fix.init();
      return fix;
    }
    return { initialized: false };
  }, ['ui-framework', 'table-handler', 'form-handler'], { priority: 50 })
  
  .registerModule('risk-residual-fix', async () => {
    // Risk Residual page-specific fixes
    if (window.RiskResidualPageFix) {
      const fix = new window.RiskResidualPageFix();
      await fix.init();
      return fix;
    }
    return { initialized: false };
  }, ['ui-framework', 'table-handler', 'chart-renderer'], { priority: 50 })
  
  .registerModule('risk-matrix', async () => {
    // Risk matrix functionality
    return {
      initializeMatrix: () => {
        const matrices = document.querySelectorAll('.risk-matrix, .residual-matrix');
        matrices.forEach(matrix => {
          if (!matrix.hasAttribute('data-matrix-initialized')) {
            // Initialize matrix functionality
            matrix.setAttribute('data-matrix-initialized', 'true');
          }
        });
      }
    };
  }, ['ui-framework'], { priority: 60 })
  
  .registerModule('dashboard-charts', async () => {
    // Dashboard-specific chart functionality
    return {
      initializeDashboard: () => {
        // Initialize dashboard charts and widgets
        const widgets = document.querySelectorAll('.widget, .dashboard-card');
        widgets.forEach(widget => {
          if (!widget.classList.contains('widget-enhanced')) {
            widget.classList.add('widget-enhanced');
          }
        });
      }
    };
  }, ['ui-framework', 'chart-renderer'], { priority: 50 })
  
  .registerModule('notification-system', async () => {
    // Notification system
    return {
      showNotification: (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 5000);
      }
    };
  }, ['dom-ready'], { priority: 80 })
  
  .registerModule('card-manager', async () => {
    // Card management functionality
    return {
      enhanceCards: () => {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
          if (!card.classList.contains('card-enhanced')) {
            card.classList.add('card-enhanced');
            
            // Add icon if missing
            const header = card.querySelector('.card-header');
            if (header && !header.querySelector('i[data-lucide]')) {
              const icon = document.createElement('i');
              icon.setAttribute('data-lucide', 'file-text');
              icon.className = 'card-icon';
              header.insertBefore(icon, header.firstChild);
            }
          }
        });
      }
    };
  }, ['ui-framework'], { priority: 60 })
  
  .registerModule('basic-ui', async () => {
    // Basic UI enhancements for unknown pages
    return {
      enhance: () => {
        // Apply basic enhancements
        if (window.UIEnhancementFramework) {
          window.UIEnhancementFramework.applyUIEnhancements();
        }
      }
    };
  }, ['ui-framework'], { priority: 40 });

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.EnhancedModuleDependencyManager.initializePageModules();
  });
} else {
  window.EnhancedModuleDependencyManager.initializePageModules();
}

// Handle navigation changes
window.addEventListener('hashchange', () => {
  setTimeout(() => {
    window.EnhancedModuleDependencyManager.initializePageModules();
  }, 100);
});

window.addEventListener('popstate', () => {
  setTimeout(() => {
    window.EnhancedModuleDependencyManager.initializePageModules();
  }, 100);
});

// Intercept navigation links for SPA
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#/"]');
  if (link) {
    setTimeout(() => {
      window.EnhancedModuleDependencyManager.initializePageModules();
    }, 100);
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedModuleDependencyManager;
}