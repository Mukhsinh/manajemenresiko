/**
 * UI Integration System
 * Integrates all UI enhancement systems and ensures proper loading order
 */

(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    enableDebugLogging: true,
    loadTimeout: 10000, // 10 seconds
    retryAttempts: 3,
    dependencies: [
      'ui-enhancement-framework.css',
      'lucide-icon-system.js',
      'module-loader.js', 
      'responsive-container-system.js',
      'ui-enhancement-framework.js'
    ]
  };
  
  // State management
  let loadedDependencies = new Set();
  let initializationAttempts = 0;
  let isInitialized = false;
  
  /**
   * Log debug messages
   */
  function debugLog(message, data = null) {
    if (CONFIG.enableDebugLogging) {
      console.log(`[UI Integration] ${message}`, data || '');
    }
  }
  
  /**
   * Load CSS file
   */
  function loadCSS(href) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`link[href*="${href}"]`)) {
        debugLog(`CSS already loaded: ${href}`);
        resolve();
        return;
      }
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href.startsWith('/') ? href : `/css/${href}`;
      
      link.onload = () => {
        debugLog(`CSS loaded successfully: ${href}`);
        resolve();
      };
      
      link.onerror = () => {
        debugLog(`Failed to load CSS: ${href}`);
        reject(new Error(`Failed to load CSS: ${href}`));
      };
      
      document.head.appendChild(link);
    });
  }
  
  /**
   * Load JavaScript file
   */
  function loadJS(src) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`script[src*="${src}"]`)) {
        debugLog(`JS already loaded: ${src}`);
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src.startsWith('/') ? src : `/js/${src}`;
      script.async = false; // Maintain order
      
      script.onload = () => {
        debugLog(`JS loaded successfully: ${src}`);
        resolve();
      };
      
      script.onerror = () => {
        debugLog(`Failed to load JS: ${src}`);
        reject(new Error(`Failed to load JS: ${src}`));
      };
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Load all dependencies
   */
  async function loadDependencies() {
    debugLog('Loading UI enhancement dependencies...');
    
    try {
      // Load CSS first
      const cssFiles = CONFIG.dependencies.filter(dep => dep.endsWith('.css'));
      for (const cssFile of cssFiles) {
        await loadCSS(cssFile);
        loadedDependencies.add(cssFile);
      }
      
      // Load JS files in order
      const jsFiles = CONFIG.dependencies.filter(dep => dep.endsWith('.js'));
      for (const jsFile of jsFiles) {
        await loadJS(jsFile);
        loadedDependencies.add(jsFile);
        
        // Small delay to ensure proper initialization
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      debugLog('All dependencies loaded successfully');
      return true;
      
    } catch (error) {
      debugLog('Failed to load dependencies:', error);
      throw error;
    }
  }
  
  /**
   * Wait for systems to be available
   */
  function waitForSystems() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for UI systems to initialize'));
      }, CONFIG.loadTimeout);
      
      const checkSystems = () => {
        const systems = [
          'IconSystem',
          'ModuleLoader', 
          'ResponsiveContainerSystem',
          'UIEnhancementFramework'
        ];
        
        const availableSystems = systems.filter(system => window[system]);
        
        debugLog(`Available systems: ${availableSystems.join(', ')}`);
        
        if (availableSystems.length === systems.length) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkSystems, 100);
        }
      };
      
      checkSystems();
    });
  }
  
  /**
   * Initialize UI systems
   */
  async function initializeSystems() {
    debugLog('Initializing UI systems...');
    
    try {
      // Wait for all systems to be available
      await waitForSystems();
      
      // Initialize in proper order
      if (window.UIEnhancementFramework && !window.UIEnhancementFramework.initialized) {
        debugLog('Initializing UI Enhancement Framework...');
        await window.UIEnhancementFramework.init();
      }
      
      debugLog('All UI systems initialized successfully');
      return true;
      
    } catch (error) {
      debugLog('Failed to initialize UI systems:', error);
      throw error;
    }
  }
  
  /**
   * Apply immediate fixes for critical UI issues
   */
  function applyImmediateFixes() {
    debugLog('Applying immediate UI fixes...');
    
    // Fix common overflow issues immediately
    const style = document.createElement('style');
    style.textContent = `
      /* Immediate overflow fixes */
      body { 
        overflow-x: hidden; 
      }
      
      table {
        max-width: 100%;
        table-layout: auto;
      }
      
      .table-responsive {
        overflow-x: auto;
      }
      
      .card {
        overflow: hidden;
        word-wrap: break-word;
      }
      
      img {
        max-width: 100%;
        height: auto;
      }
      
      /* Loading indicator */
      .ui-loading {
        position: relative;
      }
      
      .ui-loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3498db;
        border-radius: 50%;
        animation: ui-spin 1s linear infinite;
      }
      
      @keyframes ui-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    
    document.head.appendChild(style);
    
    // Add loading class to body
    document.body.classList.add('ui-loading');
  }
  
  /**
   * Remove loading indicators
   */
  function removeLoadingIndicators() {
    document.body.classList.remove('ui-loading');
    debugLog('Loading indicators removed');
  }
  
  /**
   * Handle initialization errors
   */
  function handleInitializationError(error) {
    debugLog('Initialization error:', error);
    
    initializationAttempts++;
    
    if (initializationAttempts < CONFIG.retryAttempts) {
      debugLog(`Retrying initialization (attempt ${initializationAttempts + 1}/${CONFIG.retryAttempts})...`);
      
      setTimeout(() => {
        initializeUIIntegration();
      }, 1000 * initializationAttempts);
    } else {
      debugLog('Max retry attempts reached. UI integration failed.');
      
      // Show user-friendly error message
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #f8d7da;
        color: #721c24;
        padding: 10px;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        font-size: 14px;
      `;
      errorDiv.textContent = 'UI enhancements failed to load. Please refresh the page.';
      
      document.body.appendChild(errorDiv);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 10000);
    }
  }
  
  /**
   * Main initialization function
   */
  async function initializeUIIntegration() {
    if (isInitialized) {
      debugLog('UI Integration already initialized');
      return;
    }
    
    debugLog('Starting UI Integration initialization...');
    
    try {
      // Apply immediate fixes
      applyImmediateFixes();
      
      // Load all dependencies
      await loadDependencies();
      
      // Initialize systems
      await initializeSystems();
      
      // Remove loading indicators
      removeLoadingIndicators();
      
      // Mark as initialized
      isInitialized = true;
      
      debugLog('UI Integration initialization completed successfully');
      
      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('uiIntegrationReady', {
        detail: {
          loadedDependencies: Array.from(loadedDependencies),
          initializationTime: performance.now()
        }
      }));
      
    } catch (error) {
      handleInitializationError(error);
    }
  }
  
  /**
   * Public API
   */
  window.UIIntegration = {
    init: initializeUIIntegration,
    isInitialized: () => isInitialized,
    getLoadedDependencies: () => Array.from(loadedDependencies),
    getConfig: () => ({ ...CONFIG }),
    retry: () => {
      initializationAttempts = 0;
      isInitialized = false;
      loadedDependencies.clear();
      initializeUIIntegration();
    }
  };
  
  // Auto-initialize based on document state
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUIIntegration);
  } else {
    // Document already loaded, initialize immediately
    setTimeout(initializeUIIntegration, 0);
  }
  
  debugLog('UI Integration system loaded');
  
})();