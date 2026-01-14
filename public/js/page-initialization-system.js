/**
 * Page Initialization System
 * Comprehensive system to handle page loading and module initialization
 * Prevents refresh requirements and ensures proper component loading
 */

// Prevent duplicate class declaration
if (typeof window.PageInitializationSystemOriginal === 'undefined') {

class PageInitializationSystemOriginal {
  constructor() {
    this.isInitialized = false;
    this.currentPage = null;
    this.initializationPromise = null;
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.initializationTimeout = 30000; // 30 seconds
    
    // Track initialization state
    this.moduleManager = null;
    this.domHandler = null;
    this.pageFixers = new Map();
    
    // Performance tracking
    this.performanceMetrics = {
      startTime: null,
      endTime: null,
      moduleLoadTime: 0,
      domReadyTime: 0,
      pageFixTime: 0
    };
    
    console.log('Page Initialization System created');
  }

  /**
   * Initialize the entire page system
   * @param {Object} options - Initialization options
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  async initialize(options = {}) {
    if (this.isInitialized && !options.force) {
      return this.initializationPromise;
    }
    
    this.performanceMetrics.startTime = performance.now();
    
    // Create initialization promise
    this.initializationPromise = this.performInitialization(options);
    
    try {
      await this.initializationPromise;
      this.isInitialized = true;
      
      this.performanceMetrics.endTime = performance.now();
      const totalTime = this.performanceMetrics.endTime - this.performanceMetrics.startTime;
      
      console.log(`Page initialization completed successfully (${totalTime.toFixed(2)}ms)`);
      
      // Emit initialization complete event
      this.emitEvent('pageInitializationComplete', {
        page: this.currentPage,
        metrics: this.performanceMetrics
      });
      
      return true;
      
    } catch (error) {
      console.error('Page initialization failed:', error);
      await this.handleInitializationError(error);
      throw error;
    }
  }

  /**
   * Perform the actual initialization
   * @param {Object} options - Initialization options
   */
  async performInitialization(options) {
    console.log('Starting page initialization...');
    
    // Step 1: Initialize core systems
    await this.initializeCoreSystems();
    
    // Step 2: Detect current page
    this.currentPage = this.detectCurrentPage();
    console.log(`Current page detected: ${this.currentPage}`);
    
    // Step 3: Wait for DOM to be ready
    await this.waitForDOMReady();
    
    // Step 4: Initialize module dependency manager
    await this.initializeModuleManager();
    
    // Step 5: Initialize DOM ready handler
    await this.initializeDOMHandler();
    
    // Step 6: Load page-specific modules
    await this.loadPageModules();
    
    // Step 7: Apply page-specific fixes
    await this.applyPageFixes();
    
    // Step 8: Finalize initialization
    await this.finalizeInitialization();
    
    console.log('Page initialization sequence completed');
  }

  /**
   * Initialize core systems
   */
  async initializeCoreSystems() {
    console.log('Initializing core systems...');
    
    // Ensure global objects exist
    if (!window.EnhancedModuleDependencyManager) {
      console.warn('EnhancedModuleDependencyManager not found, creating fallback');
      window.EnhancedModuleDependencyManager = {
        initializePageModules: () => Promise.resolve(),
        loadModules: () => Promise.resolve(),
        getModuleStatus: () => ({ loaded: 0, total: 0 })
      };
    }
    
    if (!window.DOMReadyHandler) {
      console.warn('DOMReadyHandler not found, creating fallback');
      window.DOMReadyHandler = {
        waitForReady: () => Promise.resolve(),
        ready: (callback) => callback(),
        initializeInteractiveComponents: () => Promise.resolve()
      };
    }
    
    // Initialize UI framework if available
    if (window.UIEnhancementFramework && !window.UIEnhancementFramework.isInitialized) {
      try {
        await window.UIEnhancementFramework.init();
      } catch (error) {
        console.warn('UI Enhancement Framework initialization failed:', error);
      }
    }
  }

  /**
   * Detect current page
   * @returns {string} Current page identifier
   */
  detectCurrentPage() {
    // Check URL hash first (SPA routing)
    const hash = window.location.hash;
    if (hash && hash.includes('/')) {
      const hashPage = hash.split('/')[1];
      if (hashPage) return hashPage;
    }
    
    // Check URL path
    const path = window.location.pathname;
    if (path.includes('/')) {
      const segments = path.split('/').filter(s => s);
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && lastSegment !== 'index.html') {
        return lastSegment.replace('.html', '');
      }
    }
    
    // Check data attributes
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
    
    // Check page title
    const title = document.title.toLowerCase();
    if (title.includes('rencana strategis')) return 'rencana-strategis';
    if (title.includes('risk residual') || title.includes('residual risk')) return 'risk-residual';
    if (title.includes('analisis swot')) return 'analisis-swot';
    if (title.includes('dashboard')) return 'dashboard';
    
    return 'dashboard'; // Default fallback
  }

  /**
   * Wait for DOM to be ready
   */
  async waitForDOMReady() {
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.performanceMetrics.domReadyTime = performance.now() - startTime;
          resolve();
        });
      } else {
        this.performanceMetrics.domReadyTime = performance.now() - startTime;
        resolve();
      }
    });
  }

  /**
   * Initialize module dependency manager
   */
  async initializeModuleManager() {
    const startTime = performance.now();
    
    try {
      this.moduleManager = window.EnhancedModuleDependencyManager;
      
      if (this.moduleManager && typeof this.moduleManager.initializePageModules === 'function') {
        await this.moduleManager.initializePageModules(this.currentPage);
      }
      
      this.performanceMetrics.moduleLoadTime = performance.now() - startTime;
      console.log(`Module manager initialized (${this.performanceMetrics.moduleLoadTime.toFixed(2)}ms)`);
      
    } catch (error) {
      console.error('Module manager initialization failed:', error);
      // Continue with fallback initialization
      await this.fallbackModuleInitialization();
    }
  }

  /**
   * Fallback module initialization
   */
  async fallbackModuleInitialization() {
    console.log('Running fallback module initialization...');
    
    // Basic UI enhancements
    if (window.UIEnhancementFramework) {
      try {
        window.UIEnhancementFramework.applyUIEnhancements();
      } catch (error) {
        console.warn('UI Enhancement Framework fallback failed:', error);
      }
    }
    
    // Basic icon initialization
    if (window.IconSystem) {
      try {
        window.IconSystem.initializeAll();
      } catch (error) {
        console.warn('Icon system fallback failed:', error);
      }
    }
    
    // Basic responsive container initialization
    if (window.ResponsiveContainerSystem) {
      try {
        window.ResponsiveContainerSystem.processExistingContainers();
      } catch (error) {
        console.warn('Responsive container system fallback failed:', error);
      }
    }
  }

  /**
   * Initialize DOM ready handler
   */
  async initializeDOMHandler() {
    try {
      this.domHandler = window.DOMReadyHandler;
      
      if (this.domHandler && typeof this.domHandler.initializeInteractiveComponents === 'function') {
        await this.domHandler.initializeInteractiveComponents();
      }
      
      console.log('DOM handler initialized');
      
    } catch (error) {
      console.error('DOM handler initialization failed:', error);
      // Continue with basic DOM initialization
      this.basicDOMInitialization();
    }
  }

  /**
   * Basic DOM initialization fallback
   */
  basicDOMInitialization() {
    console.log('Running basic DOM initialization...');
    
    // Initialize tables
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      if (!table.closest('.table-container')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-container';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });
    
    // Initialize forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (!form.hasAttribute('data-basic-init')) {
        form.addEventListener('submit', function(e) {
          const requiredFields = this.querySelectorAll('[required]');
          let isValid = true;
          
          requiredFields.forEach(field => {
            if (!field.value.trim()) {
              field.style.borderColor = '#ef4444';
              isValid = false;
            } else {
              field.style.borderColor = '';
            }
          });
          
          if (!isValid) {
            e.preventDefault();
          }
        });
        
        form.setAttribute('data-basic-init', 'true');
      }
    });
  }

  /**
   * Load page-specific modules
   */
  async loadPageModules() {
    console.log(`Loading modules for page: ${this.currentPage}`);
    
    const pageModules = this.getPageModules(this.currentPage);
    
    if (this.moduleManager && typeof this.moduleManager.loadModules === 'function') {
      try {
        await this.moduleManager.loadModules(pageModules);
        console.log(`Page modules loaded: ${pageModules.join(', ')}`);
      } catch (error) {
        console.error('Page module loading failed:', error);
      }
    }
  }

  /**
   * Get modules for specific page
   * @param {string} page - Page identifier
   * @returns {Array} Array of module names
   */
  getPageModules(page) {
    const moduleMap = {
      'dashboard': ['dashboard-charts', 'notification-system', 'card-manager'],
      'rencana-strategis': ['table-handler', 'form-handler', 'chart-renderer'],
      'risk-residual': ['risk-matrix', 'chart-handler', 'export-handler'],
      'analisis-swot': ['swot-analysis', 'chart-renderer'],
      'risk-register': ['risk-register', 'table-handler'],
      'monitoring-evaluasi': ['monitoring-system', 'chart-renderer'],
      'indikator-kinerja-utama': ['kpi-system', 'chart-renderer'],
      'sasaran-strategi': ['strategy-system', 'form-handler'],
      'visi-misi': ['form-handler'],
      'master-data': ['master-data-system', 'table-handler'],
      'user-management': ['user-system', 'table-handler'],
      'laporan': ['report-system', 'export-handler']
    };
    
    return moduleMap[page] || ['basic-ui'];
  }

  /**
   * Apply page-specific fixes
   */
  async applyPageFixes() {
    const startTime = performance.now();
    
    console.log(`Applying page fixes for: ${this.currentPage}`);
    
    try {
      switch (this.currentPage) {
        case 'rencana-strategis':
          await this.applyRencanaStrategisFixes();
          break;
        case 'risk-residual':
          await this.applyRiskResidualFixes();
          break;
        case 'analisis-swot':
          await this.applyAnalisisSwotFixes();
          break;
        default:
          await this.applyGeneralFixes();
      }
      
      this.performanceMetrics.pageFixTime = performance.now() - startTime;
      console.log(`Page fixes applied (${this.performanceMetrics.pageFixTime.toFixed(2)}ms)`);
      
    } catch (error) {
      console.error('Page fixes failed:', error);
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
    } else {
      // Apply basic Rencana Strategis fixes
      await this.applyBasicRencanaStrategisFixes();
    }
  }

  /**
   * Apply basic Rencana Strategis fixes when page fix class is not available
   */
  async applyBasicRencanaStrategisFixes() {
    console.log('Applying basic Rencana Strategis fixes...');
    
    // Ensure page structure
    this.ensureRencanaStrategisStructure();
    
    // Fix data loading issues
    await this.fixRencanaStrategisDataLoading();
    
    // Fix UI components
    this.fixRencanaStrategisUI();
    
    // Fix table display
    this.fixRencanaStrategisTable();
    
    // Fix form functionality
    this.fixRencanaStrategisForm();
  }

  /**
   * Ensure Rencana Strategis page structure
   */
  ensureRencanaStrategisStructure() {
    // Ensure main container has proper identification
    const mainContainer = document.querySelector('.main-content, .page-content, .container');
    if (mainContainer) {
      mainContainer.setAttribute('data-page', 'rencana-strategis');
      mainContainer.classList.add('rencana-strategis-page');
    }
    
    // Ensure page header exists
    let header = document.querySelector('.page-header, .content-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'page-header';
      header.innerHTML = `
        <h1 class="page-title">
          <i data-lucide="file-text"></i>
          Rencana Strategis
        </h1>
        <p class="page-description">Kelola rencana strategis organisasi</p>
      `;
      
      if (mainContainer) {
        mainContainer.insertBefore(header, mainContainer.firstChild);
      } else {
        document.body.insertBefore(header, document.body.firstChild);
      }
    }
  }

  /**
   * Fix Rencana Strategis data loading
   */
  async fixRencanaStrategisDataLoading() {
    // Check if data is already loaded
    const hasData = this.checkRencanaStrategisData();
    
    if (!hasData) {
      // Show loading indicator
      this.showRencanaStrategisLoading();
      
      // Try to trigger data load
      this.triggerRencanaStrategisDataLoad();
      
      // Wait for data with timeout
      try {
        await this.waitForRencanaStrategisData();
        console.log('Rencana Strategis data loaded successfully');
      } catch (error) {
        console.error('Rencana Strategis data loading failed:', error);
        this.showRencanaStrategisDataError();
      } finally {
        this.hideRencanaStrategisLoading();
      }
    }
  }

  /**
   * Check if Rencana Strategis data is loaded
   */
  checkRencanaStrategisData() {
    // Check for table data
    const tableRows = document.querySelectorAll('table tbody tr');
    if (tableRows.length > 0) {
      return true;
    }
    
    // Check for card content
    const cards = document.querySelectorAll('.card .card-body');
    const hasContent = Array.from(cards).some(card => 
      card.textContent.trim().length > 0 && 
      !card.textContent.includes('Loading') &&
      !card.textContent.includes('Memuat')
    );
    
    return hasContent;
  }

  /**
   * Trigger Rencana Strategis data load
   */
  triggerRencanaStrategisDataLoad() {
    // Try various data loading methods
    if (typeof window.loadRencanaStrategisData === 'function') {
      window.loadRencanaStrategisData();
    }
    
    if (typeof window.loadData === 'function') {
      window.loadData();
    }
    
    // Trigger refresh buttons
    const refreshButtons = document.querySelectorAll('[data-action="refresh"], .btn-refresh, .refresh-btn');
    if (refreshButtons.length > 0) {
      refreshButtons[0].click();
    }
    
    // Dispatch custom events
    document.dispatchEvent(new CustomEvent('requestDataLoad', {
      detail: { page: 'rencana-strategis' }
    }));
    
    document.dispatchEvent(new CustomEvent('loadRencanaStrategisData'));
  }

  /**
   * Wait for Rencana Strategis data to load
   */
  async waitForRencanaStrategisData() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30; // 15 seconds with 500ms intervals
      
      const checkData = () => {
        attempts++;
        
        if (this.checkRencanaStrategisData()) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Data loading timeout'));
        } else {
          setTimeout(checkData, 500);
        }
      };
      
      // Start checking
      checkData();
      
      // Also listen for data events
      const handleDataLoaded = () => {
        document.removeEventListener('dataLoaded', handleDataLoaded);
        document.removeEventListener('rencanaStrategisDataLoaded', handleDataLoaded);
        resolve();
      };
      
      document.addEventListener('dataLoaded', handleDataLoaded);
      document.addEventListener('rencanaStrategisDataLoaded', handleDataLoaded);
    });
  }

  /**
   * Show Rencana Strategis loading indicator
   */
  showRencanaStrategisLoading() {
    // Remove existing indicators
    this.hideRencanaStrategisLoading();
    
    const indicator = document.createElement('div');
    indicator.className = 'rencana-strategis-loading';
    indicator.innerHTML = `
      <div class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p>Memuat data Rencana Strategis...</p>
        </div>
      </div>
    `;
    
    // Add styles
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;
    
    document.body.appendChild(indicator);
  }

  /**
   * Hide Rencana Strategis loading indicator
   */
  hideRencanaStrategisLoading() {
    const indicators = document.querySelectorAll('.rencana-strategis-loading');
    indicators.forEach(indicator => indicator.remove());
  }

  /**
   * Show Rencana Strategis data error
   */
  showRencanaStrategisDataError() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'rencana-strategis-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h4>Gagal Memuat Data</h4>
        <p>Terjadi kesalahan saat memuat data Rencana Strategis.</p>
        <button onclick="window.location.reload()" class="retry-button">Muat Ulang Halaman</button>
      </div>
    `;
    
    // Add styles
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      text-align: center;
    `;
    
    document.body.appendChild(errorDiv);
  }

  /**
   * Fix Rencana Strategis UI components
   */
  fixRencanaStrategisUI() {
    // Fix cards
    const cards = document.querySelectorAll('.card, .panel, .widget');
    cards.forEach(card => {
      if (!card.classList.contains('rencana-strategis-enhanced')) {
        card.classList.add('card', 'rencana-strategis-enhanced');
        
        // Add icon to header if missing
        const header = card.querySelector('.card-header, .panel-heading');
        if (header && !header.querySelector('i[data-lucide]')) {
          const icon = document.createElement('i');
          icon.setAttribute('data-lucide', 'file-text');
          icon.className = 'card-icon';
          header.insertBefore(icon, header.firstChild);
        }
      }
    });
    
    // Fix buttons
    const buttons = document.querySelectorAll('button, .btn, [data-action]');
    buttons.forEach(button => {
      if (!button.classList.contains('rencana-strategis-enhanced')) {
        button.classList.add('rencana-strategis-enhanced');
        
        const action = button.getAttribute('data-action');
        const text = button.textContent.toLowerCase();
        
        if (action === 'edit' || text.includes('edit') || text.includes('ubah')) {
          button.classList.add('action-btn-edit');
          if (!button.querySelector('i[data-lucide]')) {
            button.innerHTML = '<i data-lucide="edit-2"></i><span class="sr-only">Edit</span>';
          }
        } else if (action === 'delete' || text.includes('delete') || text.includes('hapus')) {
          button.classList.add('action-btn-delete');
          if (!button.querySelector('i[data-lucide]')) {
            button.innerHTML = '<i data-lucide="trash-2"></i><span class="sr-only">Delete</span>';
          }
        }
      }
    });
  }

  /**
   * Fix Rencana Strategis table display
   */
  fixRencanaStrategisTable() {
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
      if (!table.classList.contains('rencana-strategis-enhanced')) {
        table.classList.add('table', 'rencana-strategis-enhanced');
        
        // Ensure table container
        if (!table.closest('.table-container')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'table-container';
          wrapper.style.overflowX = 'auto';
          table.parentNode.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
        
        // Fix table header
        const thead = table.querySelector('thead');
        if (thead) {
          thead.classList.add('table-header');
          const ths = thead.querySelectorAll('th');
          ths.forEach(th => {
            th.style.backgroundColor = 'var(--primary-blue, #3b82f6)';
            th.style.color = 'white';
            th.style.fontWeight = '600';
            th.style.padding = '12px 16px';
          });
        }
        
        // Add hover effects to rows
        const tbody = table.querySelector('tbody');
        if (tbody) {
          const rows = tbody.querySelectorAll('tr');
          rows.forEach(row => {
            if (!row.hasAttribute('data-hover-init')) {
              row.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f9fafb';
              });
              row.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
              });
              row.setAttribute('data-hover-init', 'true');
            }
          });
        }
      }
    });
  }

  /**
   * Fix Rencana Strategis form functionality
   */
  fixRencanaStrategisForm() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      if (!form.classList.contains('rencana-strategis-enhanced')) {
        form.classList.add('form-responsive', 'rencana-strategis-enhanced');
        
        // Fix form inputs
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          input.style.width = '100%';
          input.style.boxSizing = 'border-box';
          input.style.padding = '8px 12px';
          input.style.border = '1px solid #d1d5db';
          input.style.borderRadius = '6px';
        });
        
        // Fix form buttons
        const buttons = form.querySelectorAll('button, input[type="submit"]');
        buttons.forEach(button => {
          if (button.type === 'submit' || button.textContent.includes('Simpan')) {
            button.style.backgroundColor = '#3b82f6';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.padding = '10px 20px';
            button.style.borderRadius = '6px';
            button.style.cursor = 'pointer';
          }
        });
        
        // Add form validation
        if (!form.hasAttribute('data-validation-init')) {
          form.addEventListener('submit', function(e) {
            const requiredFields = this.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
              if (!field.value.trim()) {
                field.style.borderColor = '#ef4444';
                isValid = false;
              } else {
                field.style.borderColor = '#d1d5db';
              }
            });
            
            if (!isValid) {
              e.preventDefault();
              alert('Mohon lengkapi semua field yang wajib diisi.');
            }
          });
          
          form.setAttribute('data-validation-init', 'true');
        }
      }
    });
  }

  /**
   * Apply Risk Residual fixes
   */
  async applyRiskResidualFixes() {
    if (window.riskResidualPageFix) {
      await window.riskResidualPageFix.init();
    } else if (window.RiskResidualPageFix) {
      window.riskResidualPageFix = new window.RiskResidualPageFix();
      await window.riskResidualPageFix.init();
    } else {
      // Apply basic Risk Residual fixes
      await this.applyBasicRiskResidualFixes();
    }
  }

  /**
   * Apply basic Risk Residual fixes when page fix class is not available
   */
  async applyBasicRiskResidualFixes() {
    console.log('Applying basic Risk Residual fixes...');
    
    // Ensure page structure
    this.ensureRiskResidualStructure();
    
    // Fix data loading issues
    await this.fixRiskResidualDataLoading();
    
    // Fix risk matrix
    this.fixRiskMatrix();
    
    // Fix UI components
    this.fixRiskResidualUI();
    
    // Fix table display
    this.fixRiskResidualTable();
    
    // Fix charts and visualizations
    this.fixRiskResidualCharts();
    
    // Fix badge colors
    this.fixRiskBadgeColors();
  }

  /**
   * Ensure Risk Residual page structure
   */
  ensureRiskResidualStructure() {
    // Ensure main container has proper identification
    const mainContainer = document.querySelector('.main-content, .page-content, .container');
    if (mainContainer) {
      mainContainer.setAttribute('data-page', 'risk-residual');
      mainContainer.classList.add('risk-residual-page');
    }
    
    // Ensure page header exists
    let header = document.querySelector('.page-header, .content-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'page-header';
      header.innerHTML = `
        <h1 class="page-title">
          <i data-lucide="alert-triangle"></i>
          Risk Residual
        </h1>
        <p class="page-description">Kelola dan monitor risiko residual organisasi</p>
      `;
      
      if (mainContainer) {
        mainContainer.insertBefore(header, mainContainer.firstChild);
      } else {
        document.body.insertBefore(header, document.body.firstChild);
      }
    }
  }

  /**
   * Fix Risk Residual data loading
   */
  async fixRiskResidualDataLoading() {
    // Check if data is already loaded
    const hasData = this.checkRiskResidualData();
    
    if (!hasData) {
      // Show loading indicator
      this.showRiskResidualLoading();
      
      // Try to trigger data load
      this.triggerRiskResidualDataLoad();
      
      // Wait for data with timeout
      try {
        await this.waitForRiskResidualData();
        console.log('Risk Residual data loaded successfully');
      } catch (error) {
        console.error('Risk Residual data loading failed:', error);
        this.showRiskResidualDataError();
      } finally {
        this.hideRiskResidualLoading();
      }
    }
  }

  /**
   * Check if Risk Residual data is loaded
   */
  checkRiskResidualData() {
    // Check for risk matrix data
    const matrixCells = document.querySelectorAll('.risk-matrix .matrix-cell, .matrix-item');
    if (matrixCells.length > 0) {
      return true;
    }
    
    // Check for table data
    const tableRows = document.querySelectorAll('table tbody tr');
    if (tableRows.length > 0) {
      return true;
    }
    
    // Check for risk cards
    const riskCards = document.querySelectorAll('.risk-card, .card[data-risk]');
    const hasRiskContent = Array.from(riskCards).some(card => 
      card.textContent.trim().length > 0 && 
      !card.textContent.includes('Loading') &&
      !card.textContent.includes('Memuat')
    );
    
    return hasRiskContent;
  }

  /**
   * Trigger Risk Residual data load
   */
  triggerRiskResidualDataLoad() {
    // Try various data loading methods
    if (typeof window.loadRiskResidualData === 'function') {
      window.loadRiskResidualData();
    }
    
    if (typeof window.loadResidualRiskData === 'function') {
      window.loadResidualRiskData();
    }
    
    if (typeof window.loadRiskData === 'function') {
      window.loadRiskData();
    }
    
    // Trigger refresh buttons
    const refreshButtons = document.querySelectorAll('[data-action="refresh"], .btn-refresh, .refresh-btn');
    if (refreshButtons.length > 0) {
      refreshButtons[0].click();
    }
    
    // Dispatch custom events
    document.dispatchEvent(new CustomEvent('requestRiskDataLoad', {
      detail: { page: 'risk-residual' }
    }));
    
    document.dispatchEvent(new CustomEvent('loadRiskResidualData'));
  }

  /**
   * Wait for Risk Residual data to load
   */
  async waitForRiskResidualData() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30; // 15 seconds with 500ms intervals
      
      const checkData = () => {
        attempts++;
        
        if (this.checkRiskResidualData()) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Risk data loading timeout'));
        } else {
          setTimeout(checkData, 500);
        }
      };
      
      // Start checking
      checkData();
      
      // Also listen for data events
      const handleDataLoaded = () => {
        document.removeEventListener('riskDataLoaded', handleDataLoaded);
        document.removeEventListener('residualRiskDataLoaded', handleDataLoaded);
        resolve();
      };
      
      document.addEventListener('riskDataLoaded', handleDataLoaded);
      document.addEventListener('residualRiskDataLoaded', handleDataLoaded);
    });
  }

  /**
   * Show Risk Residual loading indicator
   */
  showRiskResidualLoading() {
    // Remove existing indicators
    this.hideRiskResidualLoading();
    
    const indicator = document.createElement('div');
    indicator.className = 'risk-residual-loading';
    indicator.innerHTML = `
      <div class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p>Memuat data Risk Residual...</p>
        </div>
      </div>
    `;
    
    // Add styles
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;
    
    document.body.appendChild(indicator);
  }

  /**
   * Hide Risk Residual loading indicator
   */
  hideRiskResidualLoading() {
    const indicators = document.querySelectorAll('.risk-residual-loading');
    indicators.forEach(indicator => indicator.remove());
  }

  /**
   * Show Risk Residual data error
   */
  showRiskResidualDataError() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'risk-residual-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h4>Gagal Memuat Data</h4>
        <p>Terjadi kesalahan saat memuat data Risk Residual.</p>
        <button onclick="window.location.reload()" class="retry-button">Muat Ulang Halaman</button>
      </div>
    `;
    
    // Add styles
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      text-align: center;
    `;
    
    document.body.appendChild(errorDiv);
  }

  /**
   * Fix risk matrix display
   */
  fixRiskMatrix() {
    const matrices = document.querySelectorAll('.risk-matrix, .residual-matrix, [data-matrix]');
    
    matrices.forEach(matrix => {
      if (!matrix.classList.contains('risk-matrix-enhanced')) {
        matrix.classList.add('risk-matrix', 'risk-matrix-enhanced');
        
        // Ensure matrix structure
        this.ensureMatrixStructure(matrix);
        
        // Apply matrix styling
        this.applyMatrixStyling(matrix);
        
        // Add matrix interactions
        this.addMatrixInteractions(matrix);
      }
    });
  }

  /**
   * Ensure matrix structure
   */
  ensureMatrixStructure(matrix) {
    // Create matrix grid if not exists
    let grid = matrix.querySelector('.matrix-grid');
    if (!grid) {
      grid = document.createElement('div');
      grid.className = 'matrix-grid';
      
      // Create 5x5 grid for risk matrix
      for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.setAttribute('data-cell', i);
        
        // Calculate risk level based on position
        const row = Math.floor(i / 5);
        const col = i % 5;
        const riskLevel = this.calculateRiskLevel(row, col);
        
        cell.setAttribute('data-risk-level', riskLevel);
        cell.classList.add(`risk-${riskLevel}`);
        
        grid.appendChild(cell);
      }
      
      matrix.appendChild(grid);
    }
  }

  /**
   * Calculate risk level based on matrix position
   */
  calculateRiskLevel(row, col) {
    const score = (4 - row) + col; // Inverted row for probability
    
    if (score >= 7) return 'very-high';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    if (score >= 1) return 'low';
    return 'very-low';
  }

  /**
   * Apply matrix styling
   */
  applyMatrixStyling(matrix) {
    const grid = matrix.querySelector('.matrix-grid');
    if (grid) {
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(5, 1fr)';
      grid.style.gridTemplateRows = 'repeat(5, 1fr)';
      grid.style.gap = '2px';
      grid.style.aspectRatio = '1';
      grid.style.maxWidth = '500px';
      grid.style.margin = '0 auto';
    }
    
    // Style matrix cells
    const cells = matrix.querySelectorAll('.matrix-cell');
    cells.forEach(cell => {
      cell.style.display = 'flex';
      cell.style.alignItems = 'center';
      cell.style.justifyContent = 'center';
      cell.style.minHeight = '60px';
      cell.style.border = '1px solid #ddd';
      cell.style.cursor = 'pointer';
      cell.style.transition = 'all 0.2s ease';
      
      // Apply risk level colors
      const riskLevel = cell.getAttribute('data-risk-level');
      this.applyRiskLevelColor(cell, riskLevel);
    });
  }

  /**
   * Apply risk level colors
   */
  applyRiskLevelColor(cell, riskLevel) {
    const colors = {
      'very-high': '#dc2626', // Red
      'high': '#ea580c',      // Orange-red
      'medium': '#f59e0b',    // Yellow
      'low': '#10b981',       // Green
      'very-low': '#059669'   // Dark green
    };
    
    const color = colors[riskLevel] || '#6b7280';
    cell.style.backgroundColor = color;
    cell.style.color = 'white';
  }

  /**
   * Add matrix interactions
   */
  addMatrixInteractions(matrix) {
    const cells = matrix.querySelectorAll('.matrix-cell');
    
    cells.forEach(cell => {
      if (!cell.hasAttribute('data-interaction-init')) {
        // Add hover effects
        cell.addEventListener('mouseenter', function() {
          this.style.transform = 'scale(1.05)';
          this.style.zIndex = '10';
        });
        
        cell.addEventListener('mouseleave', function() {
          this.style.transform = 'scale(1)';
          this.style.zIndex = '1';
        });
        
        // Add click handler
        cell.addEventListener('click', function() {
          const riskLevel = this.getAttribute('data-risk-level');
          console.log(`Matrix cell clicked: ${riskLevel}`);
          
          // Highlight selected cell
          cells.forEach(c => c.classList.remove('selected'));
          this.classList.add('selected');
        });
        
        cell.setAttribute('data-interaction-init', 'true');
      }
    });
  }

  /**
   * Fix Risk Residual UI components
   */
  fixRiskResidualUI() {
    // Fix cards
    const cards = document.querySelectorAll('.card, .panel, .widget, .risk-card');
    cards.forEach(card => {
      if (!card.classList.contains('risk-residual-enhanced')) {
        card.classList.add('card', 'risk-residual-enhanced');
        
        // Add icon to header if missing
        const header = card.querySelector('.card-header, .panel-heading');
        if (header && !header.querySelector('i[data-lucide]')) {
          const icon = document.createElement('i');
          icon.setAttribute('data-lucide', 'alert-triangle');
          icon.className = 'card-icon';
          header.insertBefore(icon, header.firstChild);
        }
      }
    });
    
    // Fix buttons
    const buttons = document.querySelectorAll('button, .btn, [data-action]');
    buttons.forEach(button => {
      if (!button.classList.contains('risk-residual-enhanced')) {
        button.classList.add('risk-residual-enhanced');
        
        const action = button.getAttribute('data-action');
        const text = button.textContent.toLowerCase();
        
        if (action === 'edit' || text.includes('edit') || text.includes('ubah')) {
          button.classList.add('action-btn-edit');
          if (!button.querySelector('i[data-lucide]')) {
            button.innerHTML = '<i data-lucide="edit-2"></i><span class="sr-only">Edit</span>';
          }
        } else if (action === 'delete' || text.includes('delete') || text.includes('hapus')) {
          button.classList.add('action-btn-delete');
          if (!button.querySelector('i[data-lucide]')) {
            button.innerHTML = '<i data-lucide="trash-2"></i><span class="sr-only">Delete</span>';
          }
        } else if (action === 'view' || text.includes('view') || text.includes('lihat')) {
          button.classList.add('action-btn-view');
          if (!button.querySelector('i[data-lucide]')) {
            button.innerHTML = '<i data-lucide="eye"></i><span class="sr-only">View</span>';
          }
        }
      }
    });
  }

  /**
   * Fix Risk Residual table display
   */
  fixRiskResidualTable() {
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
      if (!table.classList.contains('risk-residual-enhanced')) {
        table.classList.add('table', 'risk-residual-enhanced');
        
        // Ensure table container
        if (!table.closest('.table-container')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'table-container';
          wrapper.style.overflowX = 'auto';
          table.parentNode.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
        
        // Fix table header
        const thead = table.querySelector('thead');
        if (thead) {
          thead.classList.add('table-header');
          const ths = thead.querySelectorAll('th');
          ths.forEach(th => {
            th.style.backgroundColor = 'var(--primary-blue, #3b82f6)';
            th.style.color = 'white';
            th.style.fontWeight = '600';
            th.style.padding = '12px 16px';
          });
        }
        
        // Add hover effects to rows
        const tbody = table.querySelector('tbody');
        if (tbody) {
          const rows = tbody.querySelectorAll('tr');
          rows.forEach(row => {
            if (!row.hasAttribute('data-hover-init')) {
              row.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f9fafb';
              });
              row.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
              });
              row.setAttribute('data-hover-init', 'true');
            }
          });
        }
      }
    });
  }

  /**
   * Fix Risk Residual charts
   */
  fixRiskResidualCharts() {
    const chartContainers = document.querySelectorAll('.chart, .chart-container, canvas[data-chart]');
    
    chartContainers.forEach(container => {
      // Ensure proper sizing
      container.style.width = '100%';
      container.style.height = 'auto';
      container.style.maxHeight = '400px';
      
      // Add responsive wrapper if needed
      if (!container.closest('.chart-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-wrapper';
        container.parentNode.insertBefore(wrapper, container);
        wrapper.appendChild(container);
      }
    });
  }

  /**
   * Fix risk badge colors
   */
  fixRiskBadgeColors() {
    const badges = document.querySelectorAll('.badge, .status, .risk-level');
    
    badges.forEach(badge => {
      const text = badge.textContent.toLowerCase();
      
      // Apply risk level colors
      if (text.includes('very high') || text.includes('sangat tinggi')) {
        badge.style.backgroundColor = '#dc2626';
        badge.style.color = 'white';
      } else if (text.includes('high') || text.includes('tinggi')) {
        badge.style.backgroundColor = '#ea580c';
        badge.style.color = 'white';
      } else if (text.includes('medium') || text.includes('sedang')) {
        badge.style.backgroundColor = '#f59e0b';
        badge.style.color = 'white';
      } else if (text.includes('low') || text.includes('rendah')) {
        badge.style.backgroundColor = '#10b981';
        badge.style.color = 'white';
      } else if (text.includes('very low') || text.includes('sangat rendah')) {
        badge.style.backgroundColor = '#059669';
        badge.style.color = 'white';
      }
      
      // Common badge styles
      badge.style.padding = '4px 8px';
      badge.style.borderRadius = '12px';
      badge.style.fontSize = '12px';
      badge.style.fontWeight = '500';
    });
  }

  /**
   * Apply Analisis SWOT fixes
   */
  async applyAnalisisSwotFixes() {
    // Apply SWOT-specific enhancements
    const swotElements = document.querySelectorAll('.swot-matrix, .analisis-swot');
    swotElements.forEach(element => {
      if (!element.classList.contains('swot-enhanced')) {
        element.classList.add('swot-enhanced');
      }
    });
    
    this.applyBasicPageFixes();
  }

  /**
   * Apply general fixes
   */
  async applyGeneralFixes() {
    this.applyBasicPageFixes();
  }

  /**
   * Apply basic page fixes
   */
  applyBasicPageFixes() {
    // Ensure proper page structure
    this.ensurePageStructure();
    
    // Apply basic UI enhancements
    this.applyBasicUIEnhancements();
    
    // Fix common issues
    this.fixCommonIssues();
  }

  /**
   * Ensure proper page structure
   */
  ensurePageStructure() {
    // Ensure main container exists
    let mainContainer = document.querySelector('.main-content, .page-content, .container');
    if (!mainContainer) {
      mainContainer = document.createElement('div');
      mainContainer.className = 'main-content container-fluid';
      
      // Move existing content
      const body = document.body;
      const existingContent = Array.from(body.children).filter(child => 
        !child.matches('script, link, style, meta, title')
      );
      
      existingContent.forEach(element => {
        mainContainer.appendChild(element);
      });
      
      body.appendChild(mainContainer);
    }
    
    // Add page identifier
    if (!mainContainer.hasAttribute('data-page')) {
      mainContainer.setAttribute('data-page', this.currentPage);
    }
  }

  /**
   * Apply basic UI enhancements
   */
  applyBasicUIEnhancements() {
    // Enhance cards
    const cards = document.querySelectorAll('.card, .panel, .widget');
    cards.forEach(card => {
      if (!card.classList.contains('card-enhanced')) {
        card.classList.add('card', 'card-enhanced');
      }
    });
    
    // Enhance tables
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      if (!table.classList.contains('table-enhanced')) {
        table.classList.add('table', 'table-enhanced');
        
        // Add blue headers
        const thead = table.querySelector('thead');
        if (thead) {
          const ths = thead.querySelectorAll('th');
          ths.forEach(th => {
            th.style.backgroundColor = 'var(--primary-blue, #3b82f6)';
            th.style.color = 'white';
          });
        }
      }
    });
    
    // Enhance buttons
    const buttons = document.querySelectorAll('button, .btn, [data-action]');
    buttons.forEach(button => {
      if (!button.classList.contains('btn-enhanced')) {
        button.classList.add('btn-enhanced');
        
        const action = button.getAttribute('data-action');
        if (action === 'edit') {
          button.classList.add('action-btn-edit');
        } else if (action === 'delete') {
          button.classList.add('action-btn-delete');
        }
      }
    });
  }

  /**
   * Fix common issues
   */
  fixCommonIssues() {
    // Remove stuck loading indicators
    const loadingElements = document.querySelectorAll('.loading, .spinner, [data-loading="true"]');
    loadingElements.forEach(element => {
      setTimeout(() => {
        if (element.parentNode) {
          element.style.opacity = '0';
          setTimeout(() => {
            if (element.parentNode) {
              element.remove();
            }
          }, 300);
        }
      }, 5000);
    });
    
    // Ensure content visibility
    const contentElements = document.querySelectorAll('.content, .main-content, .card-body');
    contentElements.forEach(element => {
      element.style.visibility = 'visible';
      element.style.opacity = '1';
    });
  }

  /**
   * Finalize initialization
   */
  async finalizeInitialization() {
    // Initialize icons if available
    if (window.IconSystem) {
      try {
        window.IconSystem.initializeAll();
      } catch (error) {
        console.warn('Icon system finalization failed:', error);
      }
    }
    
    // Apply responsive containers if available
    if (window.ResponsiveContainerSystem) {
      try {
        window.ResponsiveContainerSystem.processExistingContainers();
      } catch (error) {
        console.warn('Responsive container finalization failed:', error);
      }
    }
    
    // Mark page as initialized
    document.body.setAttribute('data-page-initialized', 'true');
    document.body.setAttribute('data-current-page', this.currentPage);
    
    console.log('Page initialization finalized');
  }

  /**
   * Handle initialization error
   */
  async handleInitializationError(error) {
    this.retryAttempts++;
    
    if (this.retryAttempts < this.maxRetries) {
      console.log(`Retrying initialization (${this.retryAttempts}/${this.maxRetries})...`);
      
      // Wait before retry with exponential backoff
      const delay = Math.pow(2, this.retryAttempts - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Reset state
      this.isInitialized = false;
      this.initializationPromise = null;
      
      // Retry
      return this.initialize({ force: true });
    } else {
      console.error('Max retry attempts reached');
      this.showInitializationError(error);
    }
  }

  /**
   * Show initialization error to user
   */
  showInitializationError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'page-initialization-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h4>Page Initialization Failed</h4>
        <p>There was an error initializing the page. Some features may not work correctly.</p>
        <details>
          <summary>Error Details</summary>
          <pre>${error.message}</pre>
        </details>
        <button onclick="window.location.reload()" class="retry-button">Reload Page</button>
      </div>
    `;
    
    // Add styles
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      max-width: 400px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 30000);
  }

  /**
   * Emit custom event
   */
  emitEvent(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
  }

  /**
   * Reinitialize for navigation
   */
  async reinitialize() {
    console.log('Reinitializing for navigation...');
    
    // Reset state
    this.isInitialized = false;
    this.initializationPromise = null;
    this.retryAttempts = 0;
    
    // Reinitialize
    return this.initialize();
  }

  /**
   * Get initialization status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      currentPage: this.currentPage,
      retryAttempts: this.retryAttempts,
      metrics: this.performanceMetrics,
      moduleManager: !!this.moduleManager,
      domHandler: !!this.domHandler
    };
  }
}

// Create global instance only if PageInitializationSystem doesn't exist
if (!window.PageInitializationSystem) {
  window.PageInitializationSystem = new PageInitializationSystemOriginal();

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.PageInitializationSystem.initialize();
    });
  } else {
    window.PageInitializationSystem.initialize();
  }

  // Handle navigation events
  window.addEventListener('hashchange', () => {
    setTimeout(() => {
      window.PageInitializationSystem.reinitialize();
    }, 100);
  });

  window.addEventListener('popstate', () => {
    setTimeout(() => {
      window.PageInitializationSystem.reinitialize();
    }, 100);
  });

  // Intercept navigation links
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#/"]');
    if (link) {
      setTimeout(() => {
        window.PageInitializationSystem.reinitialize();
      }, 100);
    }
  });

  console.log('✅ Page Initialization System (Original) loaded');
} else {
  console.log('⚠️ PageInitializationSystem already exists, skipping Original version');
}

} // End of duplicate check if block

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.PageInitializationSystem;
}