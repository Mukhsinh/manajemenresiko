/**
 * Table Overflow Manager
 * Handles table overflow issues with horizontal scrolling and responsive design
 */

class TableOverflowManager {
  constructor() {
    this.tables = new Map();
    this.resizeObserver = null;
    this.mutationObserver = null;
    this.isInitialized = false;
    
    console.log('Table Overflow Manager initialized');
  }

  /**
   * Initialize the table overflow manager
   */
  init() {
    if (this.isInitialized) return;
    
    // Process existing tables
    this.processExistingTables();
    
    // Setup observers
    this.setupResizeObserver();
    this.setupMutationObserver();
    
    // Setup responsive handlers
    this.setupResponsiveHandlers();
    
    this.isInitialized = true;
    console.log('Table Overflow Manager initialization complete');
  }

  /**
   * Process all existing tables on the page
   */
  processExistingTables() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => this.processTable(table));
  }

  /**
   * Process individual table for overflow handling
   * @param {HTMLElement} table - Table element
   */
  processTable(table) {
    if (table.hasAttribute('data-overflow-processed')) return;
    
    const tableId = this.generateTableId(table);
    
    // Wrap table in container if not already wrapped
    const container = this.ensureTableContainer(table);
    
    // Setup table configuration
    const config = {
      id: tableId,
      table: table,
      container: container,
      originalWidth: table.offsetWidth,
      isResponsive: table.classList.contains('table-responsive'),
      hasHorizontalScroll: false,
      breakpoint: this.determineBreakpoint(table)
    };
    
    // Apply overflow handling
    this.applyOverflowHandling(config);
    
    // Setup responsive behavior
    this.setupResponsiveBehavior(config);
    
    // Add to tracking
    this.tables.set(tableId, config);
    
    // Mark as processed
    table.setAttribute('data-overflow-processed', tableId);
    
    console.log(`Table processed: ${tableId}`);
  }

  /**
   * Generate unique ID for table
   * @param {HTMLElement} table - Table element
   * @returns {string} Unique table ID
   */
  generateTableId(table) {
    return `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure table is wrapped in proper container
   * @param {HTMLElement} table - Table element
   * @returns {HTMLElement} Table container
   */
  ensureTableContainer(table) {
    let container = table.closest('.table-container');
    
    if (!container) {
      container = document.createElement('div');
      container.className = 'table-container';
      
      // Insert container before table
      table.parentNode.insertBefore(container, table);
      
      // Move table into container
      container.appendChild(table);
    }
    
    // Ensure container has proper classes
    if (!container.classList.contains('table-container')) {
      container.classList.add('table-container');
    }
    
    return container;
  }

  /**
   * Apply overflow handling to table
   * @param {Object} config - Table configuration
   */
  applyOverflowHandling(config) {
    const { table, container } = config;
    
    // Set container overflow properties
    container.style.overflowX = 'auto';
    container.style.overflowY = 'visible';
    container.style.maxWidth = '100%';
    
    // Ensure table has proper classes
    if (!table.classList.contains('table')) {
      table.classList.add('table');
    }
    
    // Apply responsive class if needed
    if (this.shouldBeResponsive(table)) {
      table.classList.add('table-responsive');
      config.isResponsive = true;
    }
    
    // Setup table header
    this.setupTableHeader(table);
    
    // Setup table body
    this.setupTableBody(table);
    
    // Check for overflow
    this.checkTableOverflow(config);
  }

  /**
   * Determine if table should be responsive
   * @param {HTMLElement} table - Table element
   * @returns {boolean} True if table should be responsive
   */
  shouldBeResponsive(table) {
    const columnCount = table.querySelectorAll('thead th, tbody tr:first-child td').length;
    const hasLongContent = Array.from(table.querySelectorAll('td')).some(cell => 
      cell.textContent.length > 50
    );
    
    return columnCount > 4 || hasLongContent;
  }

  /**
   * Setup table header
   * @param {HTMLElement} table - Table element
   */
  setupTableHeader(table) {
    const thead = table.querySelector('thead');
    if (!thead) return;
    
    // Add header class
    if (!thead.classList.contains('table-header')) {
      thead.classList.add('table-header');
    }
    
    // Style header cells
    const headerCells = thead.querySelectorAll('th');
    headerCells.forEach((th, index) => {
      // Ensure proper styling
      th.style.backgroundColor = 'var(--primary-blue, #3b82f6)';
      th.style.color = 'white';
      th.style.fontWeight = '600';
      th.style.padding = '12px 16px';
      th.style.whiteSpace = 'nowrap';
      
      // Add data attribute for responsive behavior
      th.setAttribute('data-column', index);
    });
  }

  /**
   * Setup table body
   * @param {HTMLElement} table - Table element
   */
  setupTableBody(table) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    // Add body class
    if (!tbody.classList.contains('table-body')) {
      tbody.classList.add('table-body');
    }
    
    // Setup rows
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => this.setupTableRow(row, table));
  }

  /**
   * Setup individual table row
   * @param {HTMLElement} row - Table row element
   * @param {HTMLElement} table - Parent table element
   */
  setupTableRow(row, table) {
    const cells = row.querySelectorAll('td');
    const headers = table.querySelectorAll('thead th');
    
    cells.forEach((cell, index) => {
      // Add data label for responsive behavior
      if (headers[index]) {
        cell.setAttribute('data-label', headers[index].textContent.trim());
      }
      
      // Add column index
      cell.setAttribute('data-column', index);
      
      // Handle text overflow
      this.handleCellTextOverflow(cell);
      
      // Setup action buttons if this is an action column
      if (this.isActionColumn(cell, index, cells.length)) {
        this.setupActionColumn(cell);
      }
    });
    
    // Add hover effects
    this.addRowHoverEffects(row);
  }

  /**
   * Handle text overflow in table cells
   * @param {HTMLElement} cell - Table cell element
   */
  handleCellTextOverflow(cell) {
    const textLength = cell.textContent.trim().length;
    
    if (textLength > 50) {
      // Long text - enable word wrapping
      cell.style.maxWidth = '200px';
      cell.style.overflowWrap = 'break-word';
      cell.style.wordBreak = 'break-word';
    } else if (textLength > 30) {
      // Medium text - add ellipsis option
      cell.style.maxWidth = '150px';
      cell.title = cell.textContent.trim(); // Add tooltip
    }
  }

  /**
   * Check if column is an action column
   * @param {HTMLElement} cell - Table cell element
   * @param {number} index - Column index
   * @param {number} totalColumns - Total number of columns
   * @returns {boolean} True if this is an action column
   */
  isActionColumn(cell, index, totalColumns) {
    // Check if last column and contains buttons
    if (index === totalColumns - 1) {
      const buttons = cell.querySelectorAll('button, .btn, .action-btn');
      return buttons.length > 0;
    }
    
    // Check if cell has action-related classes
    return cell.classList.contains('actions') || 
           cell.classList.contains('table-actions') ||
           cell.querySelector('.action-btn, [data-action]');
  }

  /**
   * Setup action column
   * @param {HTMLElement} cell - Action cell element
   */
  setupActionColumn(cell) {
    // Add action class
    if (!cell.classList.contains('table-actions')) {
      cell.classList.add('table-actions');
    }
    
    // Style action buttons
    const buttons = cell.querySelectorAll('button, .btn');
    buttons.forEach(button => {
      if (!button.classList.contains('action-btn')) {
        button.classList.add('action-btn');
        
        // Determine button type
        const text = button.textContent.toLowerCase();
        if (text.includes('edit') || text.includes('ubah')) {
          button.classList.add('action-btn-edit');
        } else if (text.includes('delete') || text.includes('hapus')) {
          button.classList.add('action-btn-delete');
        } else if (text.includes('view') || text.includes('lihat')) {
          button.classList.add('action-btn-view');
        }
      }
    });
  }

  /**
   * Add hover effects to table row
   * @param {HTMLElement} row - Table row element
   */
  addRowHoverEffects(row) {
    if (row.hasAttribute('data-hover-initialized')) return;
    
    row.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'var(--bg-gray-50, #f9fafb)';
    });
    
    row.addEventListener('mouseleave', function() {
      this.style.backgroundColor = '';
    });
    
    row.setAttribute('data-hover-initialized', 'true');
  }

  /**
   * Check table overflow and apply indicators
   * @param {Object} config - Table configuration
   */
  checkTableOverflow(config) {
    const { table, container } = config;
    
    // Check horizontal overflow
    const hasHorizontalOverflow = table.scrollWidth > container.clientWidth;
    
    if (hasHorizontalOverflow) {
      container.classList.add('has-horizontal-overflow');
      config.hasHorizontalScroll = true;
      
      // Add scroll indicators
      this.addScrollIndicators(container);
    } else {
      container.classList.remove('has-horizontal-overflow');
      config.hasHorizontalScroll = false;
      
      // Remove scroll indicators
      this.removeScrollIndicators(container);
    }
  }

  /**
   * Add scroll indicators to container
   * @param {HTMLElement} container - Table container
   */
  addScrollIndicators(container) {
    // Remove existing indicators
    this.removeScrollIndicators(container);
    
    // Add right scroll indicator
    const rightIndicator = document.createElement('div');
    rightIndicator.className = 'scroll-indicator scroll-indicator-right';
    rightIndicator.innerHTML = '→';
    container.appendChild(rightIndicator);
    
    // Add scroll event listener
    container.addEventListener('scroll', () => {
      this.updateScrollIndicators(container);
    });
    
    // Initial update
    this.updateScrollIndicators(container);
  }

  /**
   * Remove scroll indicators from container
   * @param {HTMLElement} container - Table container
   */
  removeScrollIndicators(container) {
    const indicators = container.querySelectorAll('.scroll-indicator');
    indicators.forEach(indicator => indicator.remove());
  }

  /**
   * Update scroll indicators based on scroll position
   * @param {HTMLElement} container - Table container
   */
  updateScrollIndicators(container) {
    const rightIndicator = container.querySelector('.scroll-indicator-right');
    if (!rightIndicator) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1;
    
    // Show/hide right indicator
    rightIndicator.style.opacity = isAtEnd ? '0' : '1';
  }

  /**
   * Setup responsive behavior for table
   * @param {Object} config - Table configuration
   */
  setupResponsiveBehavior(config) {
    if (!config.isResponsive) return;
    
    const { table } = config;
    
    // Add responsive class
    table.classList.add('table-responsive');
    
    // Setup breakpoint handling
    this.handleResponsiveBreakpoint(config);
  }

  /**
   * Determine responsive breakpoint for table
   * @param {HTMLElement} table - Table element
   * @returns {number} Breakpoint in pixels
   */
  determineBreakpoint(table) {
    const columnCount = table.querySelectorAll('thead th, tbody tr:first-child td').length;
    
    // More columns = higher breakpoint
    if (columnCount > 6) return 1024;
    if (columnCount > 4) return 768;
    return 640;
  }

  /**
   * Handle responsive breakpoint behavior
   * @param {Object} config - Table configuration
   */
  handleResponsiveBreakpoint(config) {
    const { table, breakpoint } = config;
    
    const checkBreakpoint = () => {
      const windowWidth = window.innerWidth;
      
      if (windowWidth <= breakpoint) {
        // Mobile view - stack table
        this.enableMobileView(table);
      } else {
        // Desktop view - normal table
        this.enableDesktopView(table);
      }
    };
    
    // Initial check
    checkBreakpoint();
    
    // Add to resize handler
    window.addEventListener('resize', checkBreakpoint);
  }

  /**
   * Enable mobile view for table
   * @param {HTMLElement} table - Table element
   */
  enableMobileView(table) {
    table.classList.add('mobile-view');
    
    // Hide thead on mobile
    const thead = table.querySelector('thead');
    if (thead) {
      thead.style.display = 'none';
    }
    
    // Style tbody for mobile
    const tbody = table.querySelector('tbody');
    if (tbody) {
      tbody.style.display = 'block';
      
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(row => {
        row.style.display = 'block';
        row.style.border = '1px solid var(--border-gray, #e5e7eb)';
        row.style.marginBottom = 'var(--space-2, 0.5rem)';
        row.style.padding = 'var(--space-3, 0.75rem)';
        row.style.borderRadius = 'var(--radius-md, 0.375rem)';
        
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
          cell.style.display = 'block';
          cell.style.textAlign = 'left';
          cell.style.border = 'none';
          cell.style.padding = 'var(--space-1, 0.25rem) 0';
          
          // Show data label
          const label = cell.getAttribute('data-label');
          if (label && !cell.querySelector('.mobile-label')) {
            const labelSpan = document.createElement('span');
            labelSpan.className = 'mobile-label';
            labelSpan.textContent = label + ': ';
            labelSpan.style.fontWeight = '600';
            labelSpan.style.color = 'var(--text-secondary, #6b7280)';
            
            cell.insertBefore(labelSpan, cell.firstChild);
          }
        });
      });
    }
  }

  /**
   * Enable desktop view for table
   * @param {HTMLElement} table - Table element
   */
  enableDesktopView(table) {
    table.classList.remove('mobile-view');
    
    // Show thead
    const thead = table.querySelector('thead');
    if (thead) {
      thead.style.display = '';
    }
    
    // Reset tbody styles
    const tbody = table.querySelector('tbody');
    if (tbody) {
      tbody.style.display = '';
      
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(row => {
        row.style.display = '';
        row.style.border = '';
        row.style.marginBottom = '';
        row.style.padding = '';
        row.style.borderRadius = '';
        
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
          cell.style.display = '';
          cell.style.textAlign = '';
          cell.style.border = '';
          cell.style.padding = '';
          
          // Remove mobile labels
          const mobileLabel = cell.querySelector('.mobile-label');
          if (mobileLabel) {
            mobileLabel.remove();
          }
        });
      });
    }
  }

  /**
   * Setup resize observer
   */
  setupResizeObserver() {
    if (!window.ResizeObserver) return;
    
    this.resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const container = entry.target;
        const table = container.querySelector('table');
        if (table) {
          const tableId = table.getAttribute('data-overflow-processed');
          const config = this.tables.get(tableId);
          if (config) {
            this.checkTableOverflow(config);
          }
        }
      });
    });
    
    // Observe all table containers
    document.querySelectorAll('.table-container').forEach(container => {
      this.resizeObserver.observe(container);
    });
  }

  /**
   * Setup mutation observer
   */
  setupMutationObserver() {
    this.mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check for new tables
              const tables = node.matches('table') ? [node] : node.querySelectorAll('table');
              tables.forEach(table => {
                if (!table.hasAttribute('data-overflow-processed')) {
                  this.processTable(table);
                }
              });
            }
          });
        }
      });
    });
    
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Setup responsive handlers
   */
  setupResponsiveHandlers() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Re-check all tables
        this.tables.forEach(config => {
          this.checkTableOverflow(config);
        });
      }, 150);
    });
  }

  /**
   * Refresh table overflow handling
   * @param {string} tableId - Table ID (optional)
   */
  refresh(tableId = null) {
    if (tableId) {
      const config = this.tables.get(tableId);
      if (config) {
        this.checkTableOverflow(config);
      }
    } else {
      // Refresh all tables
      this.tables.forEach(config => {
        this.checkTableOverflow(config);
      });
    }
  }

  /**
   * Get table configuration
   * @param {string} tableId - Table ID
   * @returns {Object|null} Table configuration
   */
  getTableConfig(tableId) {
    return this.tables.get(tableId) || null;
  }

  /**
   * Get all table configurations
   * @returns {Array} Array of table configurations
   */
  getAllTableConfigs() {
    return Array.from(this.tables.values());
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    
    this.tables.clear();
    this.isInitialized = false;
    
    console.log('Table Overflow Manager cleaned up');
  }
}

// Create global instance
window.TableOverflowManager = new TableOverflowManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.TableOverflowManager.init();
  });
} else {
  window.TableOverflowManager.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TableOverflowManager;
}