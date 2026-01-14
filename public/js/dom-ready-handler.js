/**
 * DOM Ready Handler
 * Ensures proper initialization of all interactive components
 * Prevents page refresh requirements by managing DOM state
 */

class DOMReadyHandler {
  constructor() {
    this.readyCallbacks = [];
    this.isReady = false;
    this.readyPromise = null;
    this.interactiveComponents = new Map();
    this.initializationOrder = [];
    
    // Bind methods
    this.onReady = this.onReady.bind(this);
    this.checkReady = this.checkReady.bind(this);
    
    // Initialize
    this.init();
    
    console.log('DOM Ready Handler initialized');
  }

  /**
   * Initialize the DOM ready handler
   */
  init() {
    // Create ready promise
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve;
    });
    
    // Check if DOM is already ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.onReady);
    } else {
      // DOM is already ready
      setTimeout(this.onReady, 0);
    }
    
    // Also listen for window load as fallback
    if (document.readyState !== 'complete') {
      window.addEventListener('load', this.onReady);
    }
  }

  /**
   * Handle DOM ready event
   */
  onReady() {
    if (this.isReady) return;
    
    this.isReady = true;
    console.log('DOM is ready');
    
    // Execute all ready callbacks
    this.executeReadyCallbacks();
    
    // Initialize interactive components
    this.initializeInteractiveComponents();
    
    // Resolve ready promise
    if (this.readyResolve) {
      this.readyResolve();
    }
    
    // Clean up event listeners
    document.removeEventListener('DOMContentLoaded', this.onReady);
    window.removeEventListener('load', this.onReady);
  }

  /**
   * Add callback to execute when DOM is ready
   * @param {Function} callback - Callback function
   * @param {Object} options - Options for callback execution
   */
  ready(callback, options = {}) {
    const callbackConfig = {
      callback,
      priority: options.priority || 0,
      name: options.name || `callback_${this.readyCallbacks.length}`,
      essential: options.essential !== false,
      timeout: options.timeout || 5000
    };
    
    if (this.isReady) {
      // DOM is already ready, execute immediately
      this.executeCallback(callbackConfig);
    } else {
      // Add to queue
      this.readyCallbacks.push(callbackConfig);
      
      // Sort by priority (higher priority first)
      this.readyCallbacks.sort((a, b) => b.priority - a.priority);
    }
  }

  /**
   * Execute all ready callbacks
   */
  async executeReadyCallbacks() {
    console.log(`Executing ${this.readyCallbacks.length} DOM ready callbacks`);
    
    for (const callbackConfig of this.readyCallbacks) {
      await this.executeCallback(callbackConfig);
    }
    
    console.log('All DOM ready callbacks executed');
  }

  /**
   * Execute individual callback with error handling
   * @param {Object} callbackConfig - Callback configuration
   */
  async executeCallback(callbackConfig) {
    const { callback, name, essential, timeout } = callbackConfig;
    
    try {
      console.log(`Executing DOM ready callback: ${name}`);
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Callback timeout: ${name}`)), timeout);
      });
      
      // Execute callback with timeout
      const callbackPromise = Promise.resolve(callback());
      await Promise.race([callbackPromise, timeoutPromise]);
      
      console.log(`DOM ready callback completed: ${name}`);
      
    } catch (error) {
      console.error(`DOM ready callback failed: ${name}`, error);
      
      if (essential) {
        // Show error for essential callbacks
        this.showCallbackError(name, error);
      }
    }
  }

  /**
   * Show callback error to user
   * @param {string} name - Callback name
   * @param {Error} error - Error that occurred
   */
  showCallbackError(name, error) {
    console.error(`Essential DOM callback failed: ${name}`, error);
    
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'dom-callback-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h4>Initialization Error</h4>
        <p>Failed to initialize: ${name}</p>
        <p>Some features may not work correctly.</p>
        <button onclick="this.parentElement.parentElement.remove()" class="close-button">×</button>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 8000);
  }

  /**
   * Register interactive component
   * @param {string} name - Component name
   * @param {Object} config - Component configuration
   */
  registerInteractiveComponent(name, config) {
    this.interactiveComponents.set(name, {
      name,
      selector: config.selector,
      initFunction: config.init,
      dependencies: config.dependencies || [],
      priority: config.priority || 0,
      essential: config.essential !== false,
      initialized: false,
      ...config
    });
    
    // Update initialization order
    this.updateInitializationOrder();
    
    console.log(`Interactive component registered: ${name}`);
  }

  /**
   * Update initialization order based on dependencies and priority
   */
  updateInitializationOrder() {
    const components = Array.from(this.interactiveComponents.values());
    
    // Sort by priority first
    components.sort((a, b) => b.priority - a.priority);
    
    // Then resolve dependencies
    const ordered = [];
    const visited = new Set();
    const visiting = new Set();
    
    const visit = (component) => {
      if (visiting.has(component.name)) {
        throw new Error(`Circular dependency detected: ${component.name}`);
      }
      
      if (visited.has(component.name)) {
        return;
      }
      
      visiting.add(component.name);
      
      // Visit dependencies first
      component.dependencies.forEach(depName => {
        const dep = this.interactiveComponents.get(depName);
        if (dep) {
          visit(dep);
        }
      });
      
      visiting.delete(component.name);
      visited.add(component.name);
      ordered.push(component);
    };
    
    components.forEach(component => {
      if (!visited.has(component.name)) {
        visit(component);
      }
    });
    
    this.initializationOrder = ordered;
  }

  /**
   * Initialize all interactive components
   */
  async initializeInteractiveComponents() {
    console.log(`Initializing ${this.initializationOrder.length} interactive components`);
    
    for (const component of this.initializationOrder) {
      await this.initializeComponent(component);
    }
    
    console.log('All interactive components initialized');
  }

  /**
   * Initialize individual component
   * @param {Object} component - Component configuration
   */
  async initializeComponent(component) {
    if (component.initialized) return;
    
    try {
      console.log(`Initializing component: ${component.name}`);
      
      // Find elements
      const elements = document.querySelectorAll(component.selector);
      
      if (elements.length === 0 && component.essential) {
        console.warn(`No elements found for essential component: ${component.name} (${component.selector})`);
      }
      
      // Initialize component
      if (typeof component.initFunction === 'function') {
        await component.initFunction(elements, component);
      }
      
      component.initialized = true;
      console.log(`Component initialized: ${component.name} (${elements.length} elements)`);
      
    } catch (error) {
      console.error(`Component initialization failed: ${component.name}`, error);
      
      if (component.essential) {
        this.showCallbackError(component.name, error);
      }
    }
  }

  /**
   * Reinitialize component (useful for dynamic content)
   * @param {string} name - Component name
   */
  async reinitializeComponent(name) {
    const component = this.interactiveComponents.get(name);
    if (component) {
      component.initialized = false;
      await this.initializeComponent(component);
    }
  }

  /**
   * Wait for DOM to be ready
   * @returns {Promise} Promise that resolves when DOM is ready
   */
  waitForReady() {
    return this.readyPromise;
  }

  /**
   * Check if DOM is ready
   * @returns {boolean} True if DOM is ready
   */
  checkReady() {
    return this.isReady;
  }

  /**
   * Get component status
   * @param {string} name - Component name (optional)
   * @returns {Object} Component status
   */
  getComponentStatus(name = null) {
    if (name) {
      const component = this.interactiveComponents.get(name);
      return component ? {
        name: component.name,
        initialized: component.initialized,
        essential: component.essential,
        selector: component.selector
      } : null;
    }
    
    return {
      total: this.interactiveComponents.size,
      initialized: Array.from(this.interactiveComponents.values()).filter(c => c.initialized).length,
      components: Array.from(this.interactiveComponents.keys()).map(name => this.getComponentStatus(name))
    };
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.readyCallbacks.length = 0;
    this.interactiveComponents.clear();
    this.initializationOrder.length = 0;
    this.isReady = false;
    
    console.log('DOM Ready Handler cleaned up');
  }
}

// Create global instance
window.DOMReadyHandler = new DOMReadyHandler();

// Convenience methods
window.domReady = (callback, options) => {
  window.DOMReadyHandler.ready(callback, options);
};

window.registerComponent = (name, config) => {
  window.DOMReadyHandler.registerInteractiveComponent(name, config);
};

// Register common interactive components with improved initialization
window.domReady(() => {
  // Register button components with enhanced functionality
  window.registerComponent('action-buttons', {
    selector: '.action-btn, [data-action], .btn',
    priority: 10,
    essential: true,
    init: (elements) => {
      elements.forEach(button => {
        if (!button.hasAttribute('data-initialized')) {
          // Add click handler with loading state
          button.addEventListener('click', function(e) {
            const action = this.getAttribute('data-action') || 'click';
            console.log(`Button action: ${action}`);
            
            // Add visual feedback
            this.classList.add('clicked');
            
            // Add loading state for submit buttons
            if (this.type === 'submit' || action === 'submit') {
              this.disabled = true;
              const originalText = this.innerHTML;
              this.innerHTML = '<i data-lucide="loader" class="loading-spinner"></i> Processing...';
              
              // Reset after 3 seconds if not handled by form
              setTimeout(() => {
                if (this.disabled) {
                  this.disabled = false;
                  this.innerHTML = originalText;
                }
              }, 3000);
            }
            
            setTimeout(() => {
              this.classList.remove('clicked');
            }, 150);
          });
          
          // Add proper styling based on button type
          const action = button.getAttribute('data-action');
          if (action === 'edit') {
            button.classList.add('action-btn-edit');
            if (!button.querySelector('i[data-lucide]')) {
              button.innerHTML = '<i data-lucide="edit-2"></i><span class="sr-only">Edit</span>';
            }
          } else if (action === 'delete') {
            button.classList.add('action-btn-delete');
            if (!button.querySelector('i[data-lucide]')) {
              button.innerHTML = '<i data-lucide="trash-2"></i><span class="sr-only">Delete</span>';
            }
          }
          
          button.setAttribute('data-initialized', 'true');
        }
      });
    }
  });
  
  // Register form components with enhanced validation
  window.registerComponent('forms', {
    selector: 'form',
    priority: 8,
    essential: true,
    init: (elements) => {
      elements.forEach(form => {
        if (!form.hasAttribute('data-initialized')) {
          // Add comprehensive form validation
          form.addEventListener('submit', function(e) {
            const requiredFields = this.querySelectorAll('[required]');
            let isValid = true;
            
            // Clear previous errors
            this.querySelectorAll('.error').forEach(field => {
              field.classList.remove('error');
            });
            
            // Validate required fields
            requiredFields.forEach(field => {
              if (!field.value.trim()) {
                field.classList.add('error');
                field.style.borderColor = '#ef4444';
                isValid = false;
              } else {
                field.classList.remove('error');
                field.style.borderColor = '';
              }
            });
            
            // Validate email fields
            const emailFields = this.querySelectorAll('input[type="email"]');
            emailFields.forEach(field => {
              if (field.value && !field.value.includes('@')) {
                field.classList.add('error');
                field.style.borderColor = '#ef4444';
                isValid = false;
              }
            });
            
            if (!isValid) {
              e.preventDefault();
              console.log('Form validation failed');
              
              // Show error message
              let errorMsg = this.querySelector('.form-error');
              if (!errorMsg) {
                errorMsg = document.createElement('div');
                errorMsg.className = 'form-error';
                errorMsg.style.color = '#ef4444';
                errorMsg.style.marginTop = '10px';
                this.appendChild(errorMsg);
              }
              errorMsg.textContent = 'Please fill in all required fields correctly.';
              
              // Focus first error field
              const firstError = this.querySelector('.error');
              if (firstError) {
                firstError.focus();
              }
            } else {
              // Remove error message if validation passes
              const errorMsg = this.querySelector('.form-error');
              if (errorMsg) {
                errorMsg.remove();
              }
            }
          });
          
          // Add input event listeners for real-time validation
          const inputs = form.querySelectorAll('input, select, textarea');
          inputs.forEach(input => {
            input.addEventListener('input', function() {
              if (this.classList.contains('error')) {
                if (this.value.trim()) {
                  this.classList.remove('error');
                  this.style.borderColor = '';
                }
              }
            });
          });
          
          form.setAttribute('data-initialized', 'true');
        }
      });
    }
  });
  
  // Register table components with enhanced functionality
  window.registerComponent('tables', {
    selector: 'table',
    priority: 6,
    essential: false,
    init: (elements) => {
      elements.forEach(table => {
        if (!table.hasAttribute('data-initialized')) {
          // Ensure table is wrapped in container
          if (!table.closest('.table-container')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-container';
            wrapper.style.overflowX = 'auto';
            wrapper.style.width = '100%';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
          }
          
          // Add table classes
          table.classList.add('table');
          
          // Style table header
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
            tbody.classList.add('table-body');
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
              row.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'var(--bg-gray-50, #f9fafb)';
              });
              row.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
              });
            });
          }
          
          table.setAttribute('data-initialized', 'true');
        }
      });
    }
  });
  
  // Register navigation components with SPA support
  window.registerComponent('navigation', {
    selector: 'nav a[href^="#/"], .nav-link, a[href*="dashboard"], a[href*="rencana-strategis"], a[href*="risk-residual"]',
    priority: 9,
    essential: false,
    init: (elements) => {
      elements.forEach(link => {
        if (!link.hasAttribute('data-initialized')) {
          link.addEventListener('click', function(e) {
            // Add active state management
            const navLinks = document.querySelectorAll('nav a, .nav-link');
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Trigger page module reinitialization for SPA navigation
            if (this.href.includes('#/') || this.getAttribute('href')?.includes('#/')) {
              setTimeout(() => {
                if (window.EnhancedModuleDependencyManager) {
                  window.EnhancedModuleDependencyManager.initializePageModules();
                }
              }, 100);
            }
          });
          
          // Set active state for current page
          const currentPage = window.location.hash || window.location.pathname;
          if (link.href.includes(currentPage) || link.getAttribute('href') === currentPage) {
            link.classList.add('active');
          }
          
          link.setAttribute('data-initialized', 'true');
        }
      });
    }
  });
  
  // Register card components with icon enhancement
  window.registerComponent('cards', {
    selector: '.card, .panel, .widget',
    priority: 7,
    essential: false,
    init: (elements) => {
      elements.forEach(card => {
        if (!card.hasAttribute('data-initialized')) {
          // Ensure card structure
          if (!card.classList.contains('card')) {
            card.classList.add('card');
          }
          
          // Ensure card header
          let header = card.querySelector('.card-header, .panel-heading');
          if (!header && card.querySelector('h1, h2, h3, h4, h5, h6')) {
            header = document.createElement('div');
            header.className = 'card-header';
            const title = card.querySelector('h1, h2, h3, h4, h5, h6');
            header.appendChild(title);
            card.insertBefore(header, card.firstChild);
          }
          
          // Add icon to header if missing
          if (header && !header.querySelector('i[data-lucide], .card-icon')) {
            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', 'file-text');
            icon.className = 'card-icon';
            header.insertBefore(icon, header.firstChild);
          }
          
          // Ensure card body
          let body = card.querySelector('.card-body, .panel-body');
          if (!body) {
            body = document.createElement('div');
            body.className = 'card-body';
            
            // Move content to body (except header)
            const children = Array.from(card.children).filter(child => 
              !child.classList.contains('card-header') && 
              !child.classList.contains('panel-heading')
            );
            children.forEach(child => body.appendChild(child));
            
            card.appendChild(body);
          }
          
          // Add hover effects
          card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          });
          
          card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
          });
          
          card.setAttribute('data-initialized', 'true');
        }
      });
    }
  });
  
  // Register loading indicators
  window.registerComponent('loading-indicators', {
    selector: '.loading, .spinner, [data-loading]',
    priority: 5,
    essential: false,
    init: (elements) => {
      elements.forEach(indicator => {
        // Auto-hide loading indicators after 10 seconds
        setTimeout(() => {
          if (indicator.parentNode) {
            indicator.style.opacity = '0';
            setTimeout(() => {
              if (indicator.parentNode) {
                indicator.remove();
              }
            }, 300);
          }
        }, 10000);
      });
    }
  });
  
}, { name: 'register-components', priority: 100, essential: true });

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMReadyHandler;
}