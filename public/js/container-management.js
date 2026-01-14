/**
 * Container Management System
 * Specialized container handling for specific UI components
 */

class ContainerManagement {
  constructor() {
    this.managedContainers = new Map();
    this.observers = new Map();
    this.config = {
      enableAutoResize: true,
      enableOverflowDetection: true,
      enableResponsiveBreakpoints: true,
      debounceDelay: 150
    };
    
    this.init();
  }

  /**
   * Initialize container management
   */
  init() {
    this.setupContainerObservers();
    this.processExistingContainers();
    this.setupEventListeners();
    
    console.log('ContainerManagement initialized');
  }

  /**
   * Setup container observers
   */
  setupContainerObservers() {
    // Mutation observer for new containers
    if (window.MutationObserver) {
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                this.processNewContainer(node);
              }
            });
          }
        });
      });
      
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      this.observers.set('mutation', mutationObserver);
    }
    
    // Resize observer for container size changes
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          this.handleContainerResize(entry.target, entry.contentRect);
        });
      });
      
      this.observers.set('resize', resizeObserver);
    }
  }

  /**
   * Process existing containers
   */
  processExistingContainers() {
    // Process tables
    const tables = document.querySelectorAll('table');
    tables.forEach(table => this.manageTableContainer(table));
    
    // Process cards
    const cards = document.querySelectorAll('.card, .panel, .widget');
    cards.forEach(card => this.manageCardContainer(card));
    
    // Process content areas
    const contentAreas = document.querySelectorAll('.content, .main-content, .page-content');
    contentAreas.forEach(area => this.manageContentContainer(area));
    
    // Process forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => this.manageFormContainer(form));
  }

  /**
   * Process new container
   */
  processNewContainer(element) {
    if (element.tagName === 'TABLE') {
      this.manageTableContainer(element);
    } else if (element.classList.contains('card') || element.classList.contains('panel')) {
      this.manageCardContainer(element);
    } else if (element.tagName === 'FORM') {
      this.manageFormContainer(element);
    } else if (element.classList.contains('content') || element.classList.contains('main-content')) {
      this.manageContentContainer(element);
    }
  }

  /**
   * Manage table container
   */
  manageTableContainer(table) {
    if (this.managedContainers.has(table)) return;
    
    const containerInfo = {
      element: table,
      type: 'table',
      wrapper: null,
      originalParent: table.parentElement,
      config: {
        enableHorizontalScroll: true,
        enableResponsiveColumns: true,
        enableCellTruncation: true
      }
    };
    
    // Create wrapper if not exists
    if (!table.closest('.table-container')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-container';
      
      // Insert wrapper
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
      
      containerInfo.wrapper = wrapper;
    } else {
      containerInfo.wrapper = table.closest('.table-container');
    }
    
    // Apply table-specific enhancements
    this.enhanceTable(table, containerInfo);
    
    // Register container
    this.managedContainers.set(table, containerInfo);
    
    // Start observing
    if (this.observers.get('resize')) {
      this.observers.get('resize').observe(table);
      this.observers.get('resize').observe(containerInfo.wrapper);
    }
  }

  /**
   * Enhance table functionality
   */
  enhanceTable(table, containerInfo) {
    // Add responsive classes
    table.classList.add('table', 'table-responsive', 'managed-table');
    
    // Handle header styling
    const thead = table.querySelector('thead');
    if (thead) {
      thead.classList.add('table-header');
      
      const headerCells = thead.querySelectorAll('th');
      headerCells.forEach(th => {
        th.style.backgroundColor = 'var(--primary-blue, #3b82f6)';
        th.style.color = 'var(--text-white, #ffffff)';
        th.style.fontWeight = 'var(--font-weight-semibold, 600)';
        th.style.padding = 'var(--space-3, 0.75rem) var(--space-4, 1rem)';
      });
    }
    
    // Handle body styling
    const tbody = table.querySelector('tbody');
    if (tbody) {
      tbody.classList.add('table-body');
    }
    
    // Handle cell overflow
    this.handleTableCellOverflow(table);
    
    // Add action button styling
    this.enhanceTableActionButtons(table);
  }

  /**
   * Handle table cell overflow
   */
  handleTableCellOverflow(table) {
    const cells = table.querySelectorAll('td, th');
    
    cells.forEach(cell => {
      // Skip cells with action buttons
      if (cell.querySelector('button, .btn, .action-btn')) {
        cell.classList.add('action-cell');
        return;
      }
      
      // Check for long content
      if (cell.scrollWidth > cell.offsetWidth) {
        cell.style.overflow = 'hidden';
        cell.style.textOverflow = 'ellipsis';
        cell.style.whiteSpace = 'nowrap';
        
        // Add tooltip
        if (!cell.title && cell.textContent.trim()) {
          cell.title = cell.textContent.trim();
        }
      }
    });
  }

  /**
   * Enhance table action buttons
   */
  enhanceTableActionButtons(table) {
    const actionCells = table.querySelectorAll('td:has(button), td .btn, td .action-btn');
    
    actionCells.forEach(cell => {
      if (!cell.classList.contains('action-cell')) {
        cell.classList.add('action-cell');
        
        // Center align action buttons
        cell.style.textAlign = 'center';
        cell.style.whiteSpace = 'nowrap';
        
        // Create action container if multiple buttons
        const buttons = cell.querySelectorAll('button, .btn');
        if (buttons.length > 1) {
          const actionContainer = document.createElement('div');
          actionContainer.className = 'table-actions';
          
          buttons.forEach(button => {
            actionContainer.appendChild(button);
          });
          
          cell.innerHTML = '';
          cell.appendChild(actionContainer);
        }
      }
    });
  }

  /**
   * Manage card container
   */
  manageCardContainer(card) {
    if (this.managedContainers.has(card)) return;
    
    const containerInfo = {
      element: card,
      type: 'card',
      config: {
        enableOverflowHandling: true,
        enableIconIntegration: true,
        enableResponsiveLayout: true
      }
    };
    
    // Enhance card
    this.enhanceCard(card, containerInfo);
    
    // Register container
    this.managedContainers.set(card, containerInfo);
    
    // Start observing
    if (this.observers.get('resize')) {
      this.observers.get('resize').observe(card);
    }
  }

  /**
   * Enhance card functionality
   */
  enhanceCard(card, containerInfo) {
    // Ensure card class
    if (!card.classList.contains('card')) {
      card.classList.add('card');
    }
    
    card.classList.add('managed-card');
    
    // Handle overflow
    card.style.overflow = 'hidden';
    
    // Ensure proper structure
    this.ensureCardStructure(card);
    
    // Add icon if IconSystem is available
    if (window.IconSystem) {
      window.IconSystem.initializeCardIcons();
    }
  }

  /**
   * Ensure proper card structure
   */
  ensureCardStructure(card) {
    // Find or create header
    let header = card.querySelector('.card-header');
    const title = card.querySelector('h1, h2, h3, h4, h5, h6, .card-title');
    
    if (title && !header) {
      header = document.createElement('div');
      header.className = 'card-header';
      
      // Move title to header
      title.classList.add('card-title');
      header.appendChild(title);
      
      // Insert at beginning
      card.insertBefore(header, card.firstChild);
    }
    
    // Find or create body
    let body = card.querySelector('.card-body');
    if (!body) {
      body = document.createElement('div');
      body.className = 'card-body';
      
      // Move content to body (except header)
      const children = Array.from(card.children);
      children.forEach(child => {
        if (!child.classList.contains('card-header')) {
          body.appendChild(child);
        }
      });
      
      card.appendChild(body);
    }
    
    // Handle body overflow
    body.style.overflowWrap = 'break-word';
    body.style.wordBreak = 'break-word';
  }

  /**
   * Manage content container
   */
  manageContentContainer(content) {
    if (this.managedContainers.has(content)) return;
    
    const containerInfo = {
      element: content,
      type: 'content',
      config: {
        enableScrollManagement: true,
        enableResponsiveLayout: true
      }
    };
    
    // Enhance content area
    this.enhanceContentArea(content, containerInfo);
    
    // Register container
    this.managedContainers.set(content, containerInfo);
  }

  /**
   * Enhance content area
   */
  enhanceContentArea(content, containerInfo) {
    content.classList.add('managed-content');
    
    // Add container class if not present
    if (!content.classList.contains('container') && 
        !content.classList.contains('container-fluid')) {
      content.classList.add('container-fluid');
    }
    
    // Handle overflow
    content.style.overflowX = 'hidden';
    content.style.overflowY = 'auto';
  }

  /**
   * Manage form container
   */
  manageFormContainer(form) {
    if (this.managedContainers.has(form)) return;
    
    const containerInfo = {
      element: form,
      type: 'form',
      config: {
        enableValidationStyling: true,
        enableResponsiveLayout: true
      }
    };
    
    // Enhance form
    this.enhanceForm(form, containerInfo);
    
    // Register container
    this.managedContainers.set(form, containerInfo);
  }

  /**
   * Enhance form functionality
   */
  enhanceForm(form, containerInfo) {
    form.classList.add('managed-form');
    
    // Enhance form controls
    const controls = form.querySelectorAll('input, select, textarea');
    controls.forEach(control => {
      control.classList.add('form-control');
      
      // Add focus handling
      control.addEventListener('focus', (e) => {
        e.target.classList.add('focus');
      });
      
      control.addEventListener('blur', (e) => {
        e.target.classList.remove('focus');
      });
    });
    
    // Enhance form groups
    const groups = form.querySelectorAll('.form-group, .input-group');
    groups.forEach(group => {
      group.classList.add('enhanced-form-group');
    });
  }

  /**
   * Handle container resize
   */
  handleContainerResize(element, contentRect) {
    const containerInfo = this.managedContainers.get(element);
    if (!containerInfo) return;
    
    switch (containerInfo.type) {
      case 'table':
        this.handleTableResize(element, contentRect, containerInfo);
        break;
      case 'card':
        this.handleCardResize(element, contentRect, containerInfo);
        break;
      case 'content':
        this.handleContentResize(element, contentRect, containerInfo);
        break;
    }
  }

  /**
   * Handle table resize
   */
  handleTableResize(table, contentRect, containerInfo) {
    // Re-check cell overflow
    this.handleTableCellOverflow(table);
    
    // Adjust wrapper if needed
    if (containerInfo.wrapper) {
      const wrapper = containerInfo.wrapper;
      if (table.scrollWidth > wrapper.offsetWidth) {
        wrapper.style.overflowX = 'auto';
      }
    }
  }

  /**
   * Handle card resize
   */
  handleCardResize(card, contentRect, containerInfo) {
    // Ensure content fits
    const cardBody = card.querySelector('.card-body');
    if (cardBody && cardBody.scrollHeight > cardBody.offsetHeight) {
      cardBody.style.overflowY = 'auto';
    }
  }

  /**
   * Handle content resize
   */
  handleContentResize(content, contentRect, containerInfo) {
    // Adjust scroll behavior if needed
    if (content.scrollWidth > content.offsetWidth) {
      content.style.overflowX = 'auto';
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleWindowResize();
      }, this.config.debounceDelay);
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleWindowResize();
      }, 100);
    });
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    this.managedContainers.forEach((containerInfo, element) => {
      this.handleContainerResize(element, element.getBoundingClientRect(), containerInfo);
    });
  }

  /**
   * Get container info
   */
  getContainerInfo(element) {
    return this.managedContainers.get(element);
  }

  /**
   * Update container config
   */
  updateContainerConfig(element, newConfig) {
    const containerInfo = this.managedContainers.get(element);
    if (containerInfo) {
      containerInfo.config = { ...containerInfo.config, ...newConfig };
    }
  }

  /**
   * Remove container management
   */
  removeContainer(element) {
    const containerInfo = this.managedContainers.get(element);
    if (containerInfo) {
      // Stop observing
      if (this.observers.get('resize')) {
        this.observers.get('resize').unobserve(element);
      }
      
      // Remove from managed containers
      this.managedContainers.delete(element);
    }
  }

  /**
   * Get managed containers
   */
  getManagedContainers() {
    return Array.from(this.managedContainers.keys());
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Disconnect observers
    this.observers.forEach((observer, name) => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    
    // Clear containers
    this.managedContainers.clear();
    this.observers.clear();
  }
}

// Create global instance
window.ContainerManagement = new ContainerManagement();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContainerManagement;
}