/**
 * Responsive Container System
 * Manages container overflow and responsive behavior
 */

class ResponsiveContainerSystem {
  constructor() {
    this.breakpoints = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    };
    
    this.currentBreakpoint = this.getCurrentBreakpoint();
    this.resizeObserver = null;
    this.mutationObserver = null;
    
    this.init();
  }

  /**
   * Initialize the responsive container system
   */
  init() {
    this.setupResizeListener();
    this.setupMutationObserver();
    this.processExistingContainers();
    this.preventOverflow();
    
    console.log('ResponsiveContainerSystem initialized');
  }

  /**
   * Get current breakpoint
   */
  getCurrentBreakpoint() {
    const width = window.innerWidth;
    
    if (width >= this.breakpoints['2xl']) return '2xl';
    if (width >= this.breakpoints.xl) return 'xl';
    if (width >= this.breakpoints.lg) return 'lg';
    if (width >= this.breakpoints.md) return 'md';
    if (width >= this.breakpoints.sm) return 'sm';
    return 'xs';
  }

  /**
   * Setup resize listener
   */
  setupResizeListener() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newBreakpoint = this.getCurrentBreakpoint();
        if (newBreakpoint !== this.currentBreakpoint) {
          this.currentBreakpoint = newBreakpoint;
          this.handleBreakpointChange();
        }
        this.preventOverflow();
      }, 150);
    });
  }

  /**
   * Setup mutation observer to watch for new elements
   */
  setupMutationObserver() {
    this.mutationObserver = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              shouldProcess = true;
            }
          });
        }
      });
      
      if (shouldProcess) {
        setTimeout(() => {
          this.processNewElements();
          this.preventOverflow();
        }, 100);
      }
    });
    
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Handle breakpoint changes
   */
  handleBreakpointChange() {
    console.log(`Breakpoint changed to: ${this.currentBreakpoint}`);
    
    // Update responsive classes
    document.body.setAttribute('data-breakpoint', this.currentBreakpoint);
    
    // Trigger custom event
    window.dispatchEvent(new CustomEvent('breakpointChange', {
      detail: { breakpoint: this.currentBreakpoint }
    }));
    
    // Re-process containers
    this.processExistingContainers();
  }

  /**
   * Process existing containers
   */
  processExistingContainers() {
    // Process tables
    this.processTableContainers();
    
    // Process cards
    this.processCardContainers();
    
    // Process content containers
    this.processContentContainers();
    
    // Process form containers
    this.processFormContainers();
  }

  /**
   * Process new elements added to DOM
   */
  processNewElements() {
    // Find new tables
    const newTables = document.querySelectorAll('table:not([data-container-processed])');
    newTables.forEach(table => this.wrapTableInContainer(table));
    
    // Find new cards
    const newCards = document.querySelectorAll('.card:not([data-container-processed])');
    newCards.forEach(card => this.processCard(card));
    
    // Find new content areas
    const newContent = document.querySelectorAll('.content:not([data-container-processed])');
    newContent.forEach(content => this.processContentArea(content));
  }

  /**
   * Process table containers
   */
  processTableContainers() {
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
      this.wrapTableInContainer(table);
    });
  }

  /**
   * Wrap table in responsive container
   */
  wrapTableInContainer(table) {
    if (table.hasAttribute('data-container-processed')) return;

    // Check if already wrapped
    if (table.closest('.table-container')) {
      table.setAttribute('data-container-processed', true);
      return;
    }

    // Create wrapper container
    const container = document.createElement('div');
    container.className = 'table-container';
    
    // Insert container before table
    table.parentNode.insertBefore(container, table);
    
    // Move table into container
    container.appendChild(table);
    
    // Add responsive classes to table
    table.classList.add('table', 'table-responsive');
    
    // Mark as processed
    table.setAttribute('data-container-processed', true);
    
    console.log('Table wrapped in responsive container');
  }

  /**
   * Process card containers
   */
  processCardContainers() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
      this.processCard(card);
    });
  }

  /**
   * Process individual card
   */
  processCard(card) {
    if (card.hasAttribute('data-container-processed')) return;
    
    // Ensure card has proper overflow handling
    if (!card.style.overflow) {
      card.style.overflow = 'hidden';
    }
    
    // Add responsive classes
    card.classList.add('card-responsive');
    
    // Process card content for overflow
    const cardBody = card.querySelector('.card-body');
    if (cardBody) {
      cardBody.style.overflowWrap = 'break-word';
      cardBody.style.wordBreak = 'break-word';
    }
    
    // Mark as processed
    card.setAttribute('data-container-processed', true);
  }

  /**
   * Process content containers
   */
  processContentContainers() {
    const contentAreas = document.querySelectorAll('.content, .main-content, .page-content');
    
    contentAreas.forEach(content => {
      this.processContentArea(content);
    });
  }

  /**
   * Process individual content area
   */
  processContentArea(content) {
    if (content.hasAttribute('data-container-processed')) return;
    
    // Ensure proper container classes
    if (!content.classList.contains('container') && 
        !content.classList.contains('container-fluid')) {
      content.classList.add('container-fluid');
    }
    
    // Add overflow handling
    content.style.overflowX = 'auto';
    content.style.overflowY = 'visible';
    
    // Mark as processed
    content.setAttribute('data-container-processed', true);
  }

  /**
   * Process form containers
   */
  processFormContainers() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      this.processForm(form);
    });
  }

  /**
   * Process individual form
   */
  processForm(form) {
    if (form.hasAttribute('data-container-processed')) return;
    
    // Add responsive form classes
    form.classList.add('form-responsive');
    
    // Process form inputs for responsive behavior
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!input.classList.contains('w-full')) {
        input.classList.add('w-full');
      }
    });
    
    // Mark as processed
    form.setAttribute('data-container-processed', true);
  }

  /**
   * Prevent overflow on all containers
   */
  preventOverflow() {
    // Check for horizontal overflow
    this.checkHorizontalOverflow();
    
    // Check for vertical overflow in fixed height containers
    this.checkVerticalOverflow();
    
    // Update responsive text
    this.updateResponsiveText();
  }

  /**
   * Check and fix horizontal overflow
   */
  checkHorizontalOverflow() {
    const containers = document.querySelectorAll('.container, .container-fluid, .card, .table-container');
    
    containers.forEach(container => {
      if (container.scrollWidth > container.clientWidth) {
        // Add horizontal scroll if needed
        if (!container.style.overflowX || container.style.overflowX === 'visible') {
          container.style.overflowX = 'auto';
        }
        
        // Add overflow indicator class
        container.classList.add('has-horizontal-overflow');
      } else {
        container.classList.remove('has-horizontal-overflow');
      }
    });
  }

  /**
   * Check and fix vertical overflow
   */
  checkVerticalOverflow() {
    const fixedHeightContainers = document.querySelectorAll('[style*="height"], .fixed-height');
    
    fixedHeightContainers.forEach(container => {
      if (container.scrollHeight > container.clientHeight) {
        // Add vertical scroll if needed
        if (!container.style.overflowY || container.style.overflowY === 'visible') {
          container.style.overflowY = 'auto';
        }
        
        // Add overflow indicator class
        container.classList.add('has-vertical-overflow');
      } else {
        container.classList.remove('has-vertical-overflow');
      }
    });
  }

  /**
   * Update responsive text sizing
   */
  updateResponsiveText() {
    const textElements = document.querySelectorAll('p, span, div, td, th');
    
    textElements.forEach(element => {
      const parent = element.parentElement;
      if (parent && parent.clientWidth < 300) {
        element.classList.add('text-sm');
      } else {
        element.classList.remove('text-sm');
      }
    });
  }

  /**
   * Wrap table in responsive container
   */
  wrapTableInContainer(table) {
    if (table.hasAttribute('data-container-processed')) return;
    
    // Check if already wrapped
    if (table.closest('.table-container')) {
      table.setAttribute('data-container-processed', true);
      return;
    }
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'table-container';
    
    // Insert wrapper before table
    table.parentNode.insertBefore(wrapper, table);
    
    // Move table into wrapper
    wrapper.appendChild(table);
    
    // Add responsive classes to table
    table.classList.add('table-responsive');
    
    // Mark as processed
    table.setAttribute('data-container-processed', true);
  }

  /**
   * Handle responsive images
   */
  processResponsiveImages() {
    const images = document.querySelectorAll('img:not([data-responsive-processed])');
    
    images.forEach(img => {
      // Add responsive classes
      img.classList.add('responsive-image');
      
      // Set max-width if not already set
      if (!img.style.maxWidth) {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      }
      
      // Mark as processed
      img.setAttribute('data-responsive-processed', true);
    });
  }

  /**
   * Handle responsive videos
   */
  processResponsiveVideos() {
    const videos = document.querySelectorAll('video, iframe:not([data-responsive-processed])');
    
    videos.forEach(video => {
      // Create responsive wrapper if needed
      if (!video.closest('.video-responsive')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'video-responsive';
        
        video.parentNode.insertBefore(wrapper, video);
        wrapper.appendChild(video);
      }
      
      // Mark as processed
      video.setAttribute('data-responsive-processed', true);
    });
  }

  /**
   * Clean up observers
   */
  cleanup() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }
}

// Create global instance
window.ResponsiveContainerSystem = new ResponsiveContainerSystem();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiveContainerSystem;
}
    
    // Add overflow handling
    content.style.overflowX = 'hidden';
    content.style.overflowY = 'auto';
    
    // Mark as processed
    content.setAttribute('data-container-processed', true);
  }

  /**
   * Process form containers
   */
  processFormContainers() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      this.processForm(form);
    });
  }

  /**
   * Process individual form
   */
  processForm(form) {
    if (form.hasAttribute('data-container-processed')) return;
    
    // Add responsive form classes
    form.classList.add('form-responsive');
    
    // Process form groups
    const formGroups = form.querySelectorAll('.form-group, .input-group');
    formGroups.forEach(group => {
      group.style.marginBottom = 'var(--space-4)';
    });
    
    // Process form controls
    const formControls = form.querySelectorAll('input, select, textarea');
    formControls.forEach(control => {
      control.classList.add('form-control-responsive');
    });
    
    // Mark as processed
    form.setAttribute('data-container-processed', true);
  }

  /**
   * Prevent overflow on all elements
   */
  preventOverflow() {
    // Find elements that might overflow
    const potentialOverflowElements = document.querySelectorAll(
      'table, .table, .card, .content, .main-content, .page-content, ' +
      '.data-table, .list-group, .nav-tabs, .breadcrumb, .pagination'
    );
    
    potentialOverflowElements.forEach(element => {
      this.handleElementOverflow(element);
    });
    
    // Handle text overflow
    this.handleTextOverflow();
    
    // Handle image overflow
    this.handleImageOverflow();
  }

  /**
   * Handle overflow for specific element
   */
  handleElementOverflow(element) {
    const computedStyle = window.getComputedStyle(element);
    const parentWidth = element.parentElement ? element.parentElement.offsetWidth : window.innerWidth;
    
    // Check if element is wider than its container
    if (element.scrollWidth > parentWidth) {
      // Apply overflow handling based on element type
      if (element.tagName === 'TABLE' || element.classList.contains('table')) {
        this.handleTableOverflow(element);
      } else if (element.classList.contains('card')) {
        this.handleCardOverflow(element);
      } else {
        this.handleGenericOverflow(element);
      }
    }
  }

  /**
   * Handle table overflow
   */
  handleTableOverflow(table) {
    if (!table.closest('.table-container')) {
      this.wrapTableInContainer(table);
    }
    
    // Ensure table has responsive behavior
    table.style.width = '100%';
    table.style.tableLayout = 'auto';
    
    // Handle long cell content
    const cells = table.querySelectorAll('td, th');
    cells.forEach(cell => {
      if (cell.scrollWidth > cell.offsetWidth) {
        cell.style.overflow = 'hidden';
        cell.style.textOverflow = 'ellipsis';
        cell.style.whiteSpace = 'nowrap';
        
        // Add tooltip for truncated content
        if (!cell.title && cell.textContent.trim()) {
          cell.title = cell.textContent.trim();
        }
      }
    });
  }

  /**
   * Handle card overflow
   */
  handleCardOverflow(card) {
    card.style.overflow = 'hidden';
    
    // Handle card content
    const cardBody = card.querySelector('.card-body');
    if (cardBody) {
      cardBody.style.overflowWrap = 'break-word';
      cardBody.style.wordBreak = 'break-word';
    }
    
    // Handle card header
    const cardHeader = card.querySelector('.card-header');
    if (cardHeader) {
      cardHeader.style.overflow = 'hidden';
      cardHeader.style.textOverflow = 'ellipsis';
      cardHeader.style.whiteSpace = 'nowrap';
    }
  }

  /**
   * Handle generic overflow
   */
  handleGenericOverflow(element) {
    element.style.overflowX = 'auto';
    element.style.overflowY = 'visible';
    element.style.maxWidth = '100%';
  }

  /**
   * Handle text overflow
   */
  handleTextOverflow() {
    // Find elements with potentially long text
    const textElements = document.querySelectorAll(
      'p, span, div, h1, h2, h3, h4, h5, h6, td, th, .text-content'
    );
    
    textElements.forEach(element => {
      if (element.scrollWidth > element.offsetWidth) {
        const parentWidth = element.parentElement ? element.parentElement.offsetWidth : window.innerWidth;
        
        if (element.offsetWidth > parentWidth * 0.9) {
          element.style.overflowWrap = 'break-word';
          element.style.wordBreak = 'break-word';
          element.style.hyphens = 'auto';
        }
      }
    });
  }

  /**
   * Handle image overflow
   */
  handleImageOverflow() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      if (!img.style.maxWidth) {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      }
    });
  }

  /**
   * Add resize observer for dynamic content
   */
  setupResizeObserver() {
    if (!window.ResizeObserver) return;
    
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        
        // Check if element needs overflow handling
        if (element.scrollWidth > element.offsetWidth) {
          this.handleElementOverflow(element);
        }
      });
    });
    
    // Observe key elements
    const elementsToObserve = document.querySelectorAll(
      'table, .card, .content, .main-content'
    );
    
    elementsToObserve.forEach(element => {
      this.resizeObserver.observe(element);
    });
  }

  /**
   * Cleanup observers
   */
  cleanup() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }

  /**
   * Get responsive utilities
   */
  getResponsiveUtilities() {
    return {
      getCurrentBreakpoint: () => this.currentBreakpoint,
      isBreakpoint: (bp) => this.currentBreakpoint === bp,
      isBreakpointUp: (bp) => {
        const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
        const currentIndex = breakpoints.indexOf(this.currentBreakpoint);
        const targetIndex = breakpoints.indexOf(bp);
        return currentIndex >= targetIndex;
      },
      isBreakpointDown: (bp) => {
        const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
        const currentIndex = breakpoints.indexOf(this.currentBreakpoint);
        const targetIndex = breakpoints.indexOf(bp);
        return currentIndex <= targetIndex;
      }
    };
  }
}

// Create global instance
window.ResponsiveContainerSystem = new ResponsiveContainerSystem();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiveContainerSystem;
}