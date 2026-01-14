/**
 * Risk Residual Page Fix
 * Applies all previously implemented fixes to the Risk Residual page
 * Ensures complete interface functionality and resolves display problems
 */

class RiskResidualPageFix {
  constructor() {
    this.pageSelector = '[data-page="risk-residual"], .risk-residual-page, #risk-residual, .residual-risk-page';
    this.isInitialized = false;
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.loadingTimeout = 15000; // 15 seconds
    
    // Data loading state
    this.dataLoaded = false;
    this.matrixInitialized = false;
    this.chartsInitialized = false;
    
    console.log('Risk Residual Page Fix initialized');
  }

  /**
   * Initialize the page fix
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing Risk Residual page fix...');
      
      // Wait for DOM to be ready
      await this.waitForDOM();
      
      // Check if we're on the right page
      if (!this.isRiskResidualPage()) {
        console.log('Not on Risk Residual page, skipping initialization');
        return;
      }
      
      // Apply all fixes
      await this.applyAllFixes();
      
      this.isInitialized = true;
      console.log('Risk Residual page fix completed successfully');
      
    } catch (error) {
      console.error('Risk Residual page fix failed:', error);
      await this.handleInitializationError(error);
    }
  }

  /**
   * Wait for DOM to be ready
   */
  async waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if current page is Risk Residual
   */
  isRiskResidualPage() {
    // Check URL
    const url = window.location.href;
    if (url.includes('risk-residual') || url.includes('residual-risk') || url.includes('#/risk-residual')) {
      return true;
    }
    
    // Check page elements
    const pageElement = document.querySelector(this.pageSelector);
    if (pageElement) {
      return true;
    }
    
    // Check page title or other indicators
    const title = document.title.toLowerCase();
    if (title.includes('risk residual') || title.includes('residual risk') || title.includes('risiko residual')) {
      return true;
    }
    
    // Check for risk matrix elements
    const matrixElements = document.querySelectorAll('.risk-matrix, .residual-matrix, [data-matrix]');
    if (matrixElements.length > 0) {
      return true;
    }
    
    return false;
  }

  /**
   * Apply all fixes to the page
   */
  async applyAllFixes() {
    const fixes = [
      { name: 'Page Structure', fn: () => this.fixPageStructure() },
      { name: 'Data Loading', fn: () => this.fixDataLoading() },
      { name: 'Risk Matrix', fn: () => this.fixRiskMatrix() },
      { name: 'UI Components', fn: () => this.fixUIComponents() },
      { name: 'Table Display', fn: () => this.fixTableDisplay() },
      { name: 'Charts and Visualizations', fn: () => this.fixChartsAndVisualizations() },
      { name: 'Form Functionality', fn: () => this.fixFormFunctionality() },
      { name: 'Navigation', fn: () => this.fixNavigation() },
      { name: 'Responsive Layout', fn: () => this.fixResponsiveLayout() },
      { name: 'Action Buttons', fn: () => this.fixActionButtons() },
      { name: 'Badge and Status Colors', fn: () => this.fixBadgeColors() },
      { name: 'Loading States', fn: () => this.fixLoadingStates() }
    ];
    
    for (const fix of fixes) {
      try {
        console.log(`Applying fix: ${fix.name}`);
        await fix.fn();
        console.log(`Fix completed: ${fix.name}`);
      } catch (error) {
        console.error(`Fix failed: ${fix.name}`, error);
        // Continue with other fixes
      }
    }
  }

  /**
   * Fix page structure issues
   */
  async fixPageStructure() {
    // Ensure main container exists
    let mainContainer = document.querySelector('.main-content, .page-content, .container');
    if (!mainContainer) {
      mainContainer = document.createElement('div');
      mainContainer.className = 'main-content container-fluid';
      
      // Move existing content into container
      const body = document.body;
      const existingContent = Array.from(body.children).filter(child => 
        !child.matches('script, link, style, meta, title')
      );
      
      existingContent.forEach(element => {
        mainContainer.appendChild(element);
      });
      
      body.appendChild(mainContainer);
    }
    
    // Ensure proper page identification
    if (!mainContainer.hasAttribute('data-page')) {
      mainContainer.setAttribute('data-page', 'risk-residual');
    }
    
    // Add page-specific classes
    mainContainer.classList.add('risk-residual-page');
    
    // Ensure header exists
    this.ensurePageHeader(mainContainer);
  }

  /**
   * Ensure page header exists
   */
  ensurePageHeader(container) {
    let header = container.querySelector('.page-header, .content-header, h1, h2');
    
    if (!header) {
      header = document.createElement('div');
      header.className = 'page-header';
      header.innerHTML = `
        <h1 class="page-title">Risk Residual</h1>
        <p class="page-description">Kelola dan monitor risiko residual organisasi</p>
      `;
      
      container.insertBefore(header, container.firstChild);
    }
    
    // Ensure header has proper styling
    if (!header.classList.contains('page-header')) {
      header.classList.add('page-header');
    }
  }

  /**
   * Fix data loading issues
   */
  async fixDataLoading() {
    // Show loading indicator
    this.showLoadingIndicator();
    
    try {
      // Wait for data to load with timeout
      await Promise.race([
        this.waitForDataLoad(),
        this.createTimeout(this.loadingTimeout, 'Data loading timeout')
      ]);
      
      this.dataLoaded = true;
      console.log('Risk data loaded successfully');
      
    } catch (error) {
      console.error('Risk data loading failed:', error);
      this.showDataLoadError();
    } finally {
      this.hideLoadingIndicator();
    }
  }

  /**
   * Wait for data to load
   */
  async waitForDataLoad() {
    return new Promise((resolve) => {
      // Check if data is already loaded
      if (this.checkDataLoaded()) {
        resolve();
        return;
      }
      
      // Poll for data
      const checkInterval = setInterval(() => {
        if (this.checkDataLoaded()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
      
      // Also listen for data events
      document.addEventListener('riskDataLoaded', () => {
        clearInterval(checkInterval);
        resolve();
      });
      
      // Trigger data load if needed
      this.triggerDataLoad();
    });
  }

  /**
   * Check if data is loaded
   */
  checkDataLoaded() {
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
    
    if (hasRiskContent) {
      return true;
    }
    
    // Check for specific data indicators
    const dataElements = document.querySelectorAll('[data-loaded="true"], .data-loaded');
    return dataElements.length > 0;
  }

  /**
   * Trigger data load
   */
  triggerDataLoad() {
    // Try to find and trigger existing load functions
    if (typeof window.loadRiskResidualData === 'function') {
      window.loadRiskResidualData();
    }
    
    if (typeof window.loadResidualRiskData === 'function') {
      window.loadResidualRiskData();
    }
    
    if (typeof window.loadRiskData === 'function') {
      window.loadRiskData();
    }
    
    // Trigger refresh if available
    const refreshButtons = document.querySelectorAll('[data-action="refresh"], .btn-refresh');
    if (refreshButtons.length > 0) {
      refreshButtons[0].click();
    }
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('requestRiskDataLoad', {
      detail: { page: 'risk-residual' }
    }));
  }

  /**
   * Fix risk matrix display and functionality
   */
  async fixRiskMatrix() {
    const matrices = document.querySelectorAll('.risk-matrix, .residual-matrix, [data-matrix]');
    
    matrices.forEach(matrix => {
      // Ensure proper matrix structure
      this.ensureMatrixStructure(matrix);
      
      // Fix matrix styling
      this.fixMatrixStyling(matrix);
      
      // Initialize matrix interactions
      this.initializeMatrixInteractions(matrix);
      
      // Fix matrix responsiveness
      this.fixMatrixResponsiveness(matrix);
    });
    
    this.matrixInitialized = true;
  }

  /**
   * Ensure proper matrix structure
   */
  ensureMatrixStructure(matrix) {
    // Ensure matrix has proper container
    if (!matrix.classList.contains('risk-matrix')) {
      matrix.classList.add('risk-matrix');
    }
    
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
    
    // Ensure matrix labels
    this.ensureMatrixLabels(matrix);
  }

  /**
   * Ensure matrix labels exist
   */
  ensureMatrixLabels(matrix) {
    // Add probability labels (Y-axis)
    let probabilityLabels = matrix.querySelector('.probability-labels');
    if (!probabilityLabels) {
      probabilityLabels = document.createElement('div');
      probabilityLabels.className = 'probability-labels';
      probabilityLabels.innerHTML = `
        <div class="label">Sangat Tinggi</div>
        <div class="label">Tinggi</div>
        <div class="label">Sedang</div>
        <div class="label">Rendah</div>
        <div class="label">Sangat Rendah</div>
      `;
      matrix.insertBefore(probabilityLabels, matrix.firstChild);
    }
    
    // Add impact labels (X-axis)
    let impactLabels = matrix.querySelector('.impact-labels');
    if (!impactLabels) {
      impactLabels = document.createElement('div');
      impactLabels.className = 'impact-labels';
      impactLabels.innerHTML = `
        <div class="label">Sangat Rendah</div>
        <div class="label">Rendah</div>
        <div class="label">Sedang</div>
        <div class="label">Tinggi</div>
        <div class="label">Sangat Tinggi</div>
      `;
      matrix.appendChild(impactLabels);
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
   * Fix matrix styling
   */
  fixMatrixStyling(matrix) {
    // Apply CSS Grid layout
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
   * Initialize matrix interactions
   */
  initializeMatrixInteractions(matrix) {
    const cells = matrix.querySelectorAll('.matrix-cell');
    
    cells.forEach(cell => {
      if (!cell.hasAttribute('data-interaction-initialized')) {
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
          
          // Dispatch custom event
          document.dispatchEvent(new CustomEvent('matrixCellSelected', {
            detail: { cell: this, riskLevel }
          }));
        });
        
        cell.setAttribute('data-interaction-initialized', 'true');
      }
    });
  }

  /**
   * Fix matrix responsiveness
   */
  fixMatrixResponsiveness(matrix) {
    // Make matrix responsive
    matrix.style.width = '100%';
    matrix.style.maxWidth = '600px';
    matrix.style.margin = '0 auto';
    
    // Responsive grid
    const grid = matrix.querySelector('.matrix-grid');
    if (grid) {
      // Add media query handling
      const updateGridSize = () => {
        const containerWidth = matrix.clientWidth;
        const cellSize = Math.min(containerWidth / 5 - 4, 80); // Max 80px per cell
        
        grid.style.gridTemplateColumns = `repeat(5, ${cellSize}px)`;
        grid.style.gridTemplateRows = `repeat(5, ${cellSize}px)`;
      };
      
      // Initial update
      updateGridSize();
      
      // Update on resize
      window.addEventListener('resize', updateGridSize);
    }
  }

  /**
   * Fix UI components
   */
  async fixUIComponents() {
    // Apply UI framework classes
    this.applyUIFrameworkClasses();
    
    // Initialize icons
    this.initializeIcons();
    
    // Fix card components
    this.fixCardComponents();
    
    // Fix button components
    this.fixButtonComponents();
    
    // Initialize responsive containers
    this.initializeResponsiveContainers();
  }

  /**
   * Apply UI framework classes
   */
  applyUIFrameworkClasses() {
    // Add framework classes to cards
    const cards = document.querySelectorAll('.card, .panel, .widget, .risk-card');
    cards.forEach(card => {
      if (!card.classList.contains('card')) {
        card.classList.add('card');
      }
      
      // Ensure card structure
      this.ensureCardStructure(card);
    });
    
    // Add framework classes to tables
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      if (!table.classList.contains('table')) {
        table.classList.add('table');
      }
      
      // Ensure table structure
      this.ensureTableStructure(table);
    });
  }

  /**
   * Ensure card structure
   */
  ensureCardStructure(card) {
    let header = card.querySelector('.card-header, .panel-heading');
    if (!header && card.querySelector('h1, h2, h3, h4, h5, h6')) {
      header = document.createElement('div');
      header.className = 'card-header';
      const title = card.querySelector('h1, h2, h3, h4, h5, h6');
      header.appendChild(title);
      card.insertBefore(header, card.firstChild);
    }
    
    let body = card.querySelector('.card-body, .panel-body');
    if (!body) {
      body = document.createElement('div');
      body.className = 'card-body';
      
      // Move content to body
      const children = Array.from(card.children).filter(child => 
        !child.classList.contains('card-header')
      );
      children.forEach(child => body.appendChild(child));
      
      card.appendChild(body);
    }
  }

  /**
   * Ensure table structure
   */
  ensureTableStructure(table) {
    // Ensure table header classes
    const thead = table.querySelector('thead');
    if (thead && !thead.classList.contains('table-header')) {
      thead.classList.add('table-header');
    }
    
    // Ensure table body classes
    const tbody = table.querySelector('tbody');
    if (tbody && !tbody.classList.contains('table-body')) {
      tbody.classList.add('table-body');
    }
  }

  /**
   * Initialize icons
   */
  initializeIcons() {
    if (window.IconSystem) {
      window.IconSystem.initializeAll();
    }
    
    // Add icons to cards if missing
    const cards = document.querySelectorAll('.card .card-header');
    cards.forEach(header => {
      if (!header.querySelector('.card-icon, i[data-lucide]')) {
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'alert-triangle');
        icon.className = 'card-icon';
        header.insertBefore(icon, header.firstChild);
      }
    });
  }

  /**
   * Fix card components
   */
  fixCardComponents() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      // Ensure proper overflow handling
      card.style.overflow = 'hidden';
      
      // Fix card body overflow
      const cardBody = card.querySelector('.card-body');
      if (cardBody) {
        cardBody.style.overflowWrap = 'break-word';
        cardBody.style.wordBreak = 'break-word';
      }
      
      // Add hover effects
      if (!card.classList.contains('card-interactive')) {
        card.classList.add('card-interactive');
      }
    });
  }

  /**
   * Fix button components
   */
  fixButtonComponents() {
    // Fix action buttons
    const actionButtons = document.querySelectorAll('.btn, button, [data-action]');
    actionButtons.forEach(button => {
      // Add proper classes
      if (!button.classList.contains('action-btn') && button.hasAttribute('data-action')) {
        button.classList.add('action-btn');
        
        const action = button.getAttribute('data-action');
        if (action === 'edit') {
          button.classList.add('action-btn-edit');
        } else if (action === 'delete') {
          button.classList.add('action-btn-delete');
        }
      }
      
      // Ensure proper button text/icons
      this.updateButtonContent(button);
    });
  }

  /**
   * Update button content with icons
   */
  updateButtonContent(button) {
    const text = button.textContent.trim().toLowerCase();
    
    if (text === 'edit' || text === 'ubah') {
      button.innerHTML = '<i data-lucide="edit-2"></i><span class="sr-only">Edit</span>';
      button.title = 'Edit';
    } else if (text === 'delete' || text === 'hapus') {
      button.innerHTML = '<i data-lucide="trash-2"></i><span class="sr-only">Delete</span>';
      button.title = 'Delete';
    } else if (text === 'view' || text === 'lihat') {
      button.innerHTML = '<i data-lucide="eye"></i><span class="sr-only">View</span>';
      button.title = 'View';
    }
  }

  /**
   * Initialize responsive containers
   */
  initializeResponsiveContainers() {
    if (window.ResponsiveContainerSystem) {
      window.ResponsiveContainerSystem.processExistingContainers();
    }
  }

  /**
   * Fix table display issues
   */
  async fixTableDisplay() {
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
      // Ensure table is wrapped in container
      if (!table.closest('.table-container')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-container';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
      
      // Fix table header styling
      this.fixTableHeader(table);
      
      // Fix table body
      this.fixTableBody(table);
      
      // Fix action buttons in table
      this.fixTableActionButtons(table);
    });
  }

  /**
   * Fix table header
   */
  fixTableHeader(table) {
    const thead = table.querySelector('thead');
    if (thead) {
      thead.classList.add('table-header');
      
      // Ensure blue header styling
      const ths = thead.querySelectorAll('th');
      ths.forEach(th => {
        th.style.backgroundColor = 'var(--primary-blue, #3b82f6)';
        th.style.color = 'white';
        th.style.fontWeight = '600';
        th.style.padding = '12px 16px';
      });
    }
  }

  /**
   * Fix table body
   */
  fixTableBody(table) {
    const tbody = table.querySelector('tbody');
    if (tbody) {
      tbody.classList.add('table-body');
      
      // Add hover effects to rows
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(row => {
        if (!row.hasAttribute('data-hover-initialized')) {
          row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'var(--bg-gray-50, #f9fafb)';
          });
          
          row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
          });
          
          row.setAttribute('data-hover-initialized', 'true');
        }
      });
    }
  }

  /**
   * Fix table action buttons
   */
  fixTableActionButtons(table) {
    const actionCells = table.querySelectorAll('td:last-child, .actions');
    actionCells.forEach(cell => {
      const buttons = cell.querySelectorAll('button, .btn');
      if (buttons.length > 0) {
        cell.classList.add('table-actions');
        
        buttons.forEach(button => {
          if (!button.classList.contains('action-btn')) {
            button.classList.add('action-btn');
            
            const text = button.textContent.toLowerCase();
            if (text.includes('edit') || text.includes('ubah')) {
              button.classList.add('action-btn-edit');
            } else if (text.includes('delete') || text.includes('hapus')) {
              button.classList.add('action-btn-delete');
            }
          }
        });
      }
    });
  }

  /**
   * Fix charts and visualizations
   */
  async fixChartsAndVisualizations() {
    // Fix chart containers
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
    
    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
      this.initializeCharts();
    }
    
    this.chartsInitialized = true;
  }

  /**
   * Initialize charts
   */
  initializeCharts() {
    const chartElements = document.querySelectorAll('canvas[data-chart]:not([data-chart-initialized])');
    
    chartElements.forEach(canvas => {
      try {
        const chartType = canvas.getAttribute('data-chart');
        const chartData = this.getChartData(canvas);
        
        new Chart(canvas, {
          type: chartType,
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
        
        canvas.setAttribute('data-chart-initialized', 'true');
      } catch (error) {
        console.error('Failed to initialize chart:', error);
      }
    });
  }

  /**
   * Get chart data from element
   */
  getChartData(canvas) {
    // Default chart data for risk visualization
    return {
      labels: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
      datasets: [{
        label: 'Risk Distribution',
        data: [5, 10, 15, 8, 3],
        backgroundColor: [
          '#059669', // Very Low - Green
          '#10b981', // Low - Light Green
          '#f59e0b', // Medium - Yellow
          '#ea580c', // High - Orange
          '#dc2626'  // Very High - Red
        ]
      }]
    };
  }

  /**
   * Fix form functionality
   */
  async fixFormFunctionality() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      // Add responsive classes
      form.classList.add('form-responsive');
      
      // Fix form inputs
      this.fixFormInputs(form);
      
      // Fix form buttons
      this.fixFormButtons(form);
      
      // Add form validation
      this.addFormValidation(form);
    });
  }

  /**
   * Fix form inputs
   */
  fixFormInputs(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!input.classList.contains('w-full')) {
        input.classList.add('w-full');
      }
      
      // Add proper styling
      input.style.width = '100%';
      input.style.boxSizing = 'border-box';
      input.style.padding = '8px 12px';
      input.style.border = '1px solid #d1d5db';
      input.style.borderRadius = '6px';
    });
  }

  /**
   * Fix form buttons
   */
  fixFormButtons(form) {
    const buttons = form.querySelectorAll('button, input[type="submit"]');
    buttons.forEach(button => {
      if (!button.classList.contains('btn')) {
        button.classList.add('btn');
      }
      
      if (button.type === 'submit' || button.textContent.includes('Simpan') || button.textContent.includes('Save')) {
        button.classList.add('btn-primary');
        button.style.backgroundColor = 'var(--primary-blue, #3b82f6)';
        button.style.color = 'white';
      }
    });
  }

  /**
   * Add form validation
   */
  addFormValidation(form) {
    if (!form.hasAttribute('data-validation-initialized')) {
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
          console.log('Form validation failed');
        }
      });
      
      form.setAttribute('data-validation-initialized', 'true');
    }
  }

  /**
   * Fix navigation issues
   */
  async fixNavigation() {
    // Fix navigation links
    const navLinks = document.querySelectorAll('nav a, .nav-link, a[href*="risk-residual"]');
    
    navLinks.forEach(link => {
      // Add active state for current page
      if (link.href.includes('risk-residual') || link.getAttribute('href') === '#/risk-residual') {
        link.classList.add('active');
      }
      
      // Ensure proper click handling
      this.initializeNavLink(link);
    });
  }

  /**
   * Initialize navigation link
   */
  initializeNavLink(link) {
    if (!link.hasAttribute('data-nav-initialized')) {
      link.addEventListener('click', function(e) {
        // Remove active from other links
        document.querySelectorAll('nav a, .nav-link').forEach(l => l.classList.remove('active'));
        // Add active to clicked link
        this.classList.add('active');
      });
      
      link.setAttribute('data-nav-initialized', 'true');
    }
  }

  /**
   * Fix responsive layout
   */
  async fixResponsiveLayout() {
    // Ensure proper container structure
    const mainContent = document.querySelector('.main-content, .page-content');
    if (mainContent) {
      if (!mainContent.classList.contains('container-fluid')) {
        mainContent.classList.add('container-fluid');
      }
    }
    
    // Fix grid layouts
    this.fixGridLayouts();
    
    // Fix column layouts
    this.fixColumnLayouts();
  }

  /**
   * Fix grid layouts
   */
  fixGridLayouts() {
    const gridContainers = document.querySelectorAll('.row, .grid, .flex');
    gridContainers.forEach(container => {
      container.style.display = 'flex';
      container.style.flexWrap = 'wrap';
      container.style.gap = 'var(--space-4, 1rem)';
    });
  }

  /**
   * Fix column layouts
   */
  fixColumnLayouts() {
    const columns = document.querySelectorAll('.col, .column, .grid-item');
    columns.forEach(column => {
      column.style.flex = '1';
      column.style.minWidth = '300px';
    });
  }

  /**
   * Fix action buttons
   */
  async fixActionButtons() {
    const actionButtons = document.querySelectorAll('.action-btn, [data-action]');
    
    actionButtons.forEach(button => {
      // Ensure proper styling
      this.styleActionButton(button);
      
      // Add hover effects
      this.addButtonHoverEffects(button);
    });
  }

  /**
   * Style action button
   */
  styleActionButton(button) {
    if (button.classList.contains('action-btn-edit')) {
      button.style.backgroundColor = 'var(--action-edit, #3b82f6)';
      button.style.color = 'white';
    } else if (button.classList.contains('action-btn-delete')) {
      button.style.backgroundColor = 'var(--action-delete, #ef4444)';
      button.style.color = 'white';
    }
    
    // Common button styles
    button.style.border = 'none';
    button.style.borderRadius = '6px';
    button.style.padding = '8px 12px';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.2s ease';
  }

  /**
   * Add button hover effects
   */
  addButtonHoverEffects(button) {
    if (!button.hasAttribute('data-hover-initialized')) {
      button.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      });
      
      button.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '';
      });
      
      button.setAttribute('data-hover-initialized', 'true');
    }
  }

  /**
   * Fix badge and status colors
   */
  async fixBadgeColors() {
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
   * Fix loading states
   */
  async fixLoadingStates() {
    // Remove any stuck loading indicators
    const loadingElements = document.querySelectorAll('.loading, .spinner, [data-loading="true"]');
    loadingElements.forEach(element => {
      if (this.dataLoaded) {
        element.remove();
      }
    });
    
    // Ensure content is visible
    const contentElements = document.querySelectorAll('.content, .main-content, .card-body');
    contentElements.forEach(element => {
      element.style.visibility = 'visible';
      element.style.opacity = '1';
    });
  }

  /**
   * Show loading indicator
   */
  showLoadingIndicator() {
    // Remove existing indicators
    this.hideLoadingIndicator();
    
    const indicator = document.createElement('div');
    indicator.className = 'page-loading-indicator';
    indicator.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>Memuat data Risk Residual...</p>
      </div>
    `;
    
    document.body.appendChild(indicator);
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator() {
    const indicators = document.querySelectorAll('.page-loading-indicator');
    indicators.forEach(indicator => indicator.remove());
  }

  /**
   * Show data load error
   */
  showDataLoadError() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'data-load-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h4>Gagal Memuat Data</h4>
        <p>Terjadi kesalahan saat memuat data Risk Residual.</p>
        <button onclick="window.location.reload()" class="retry-button">Muat Ulang Halaman</button>
      </div>
    `;
    
    const mainContent = document.querySelector('.main-content, .page-content, body');
    mainContent.appendChild(errorDiv);
  }

  /**
   * Handle initialization error
   */
  async handleInitializationError(error) {
    this.retryAttempts++;
    
    if (this.retryAttempts < this.maxRetries) {
      console.log(`Retrying initialization (${this.retryAttempts}/${this.maxRetries})...`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * this.retryAttempts));
      
      // Reset state
      this.isInitialized = false;
      
      // Retry
      return this.init();
    } else {
      console.error('Max retry attempts reached, showing error to user');
      this.showInitializationError(error);
    }
  }

  /**
   * Show initialization error
   */
  showInitializationError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'initialization-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h4>Gagal Menginisialisasi Halaman</h4>
        <p>Terjadi kesalahan saat menginisialisasi halaman Risk Residual.</p>
        <details>
          <summary>Detail Error</summary>
          <pre>${error.message}</pre>
        </details>
        <button onclick="window.location.reload()" class="retry-button">Muat Ulang Halaman</button>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
  }

  /**
   * Create timeout promise
   */
  createTimeout(ms, message) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.riskResidualPageFix = new RiskResidualPageFix();
    window.riskResidualPageFix.init();
  });
} else {
  window.riskResidualPageFix = new RiskResidualPageFix();
  window.riskResidualPageFix.init();
}

// Also initialize on hash change (for SPA navigation)
window.addEventListener('hashchange', () => {
  if (window.location.hash.includes('risk-residual') || window.location.hash.includes('residual-risk')) {
    if (window.riskResidualPageFix) {
      window.riskResidualPageFix.init();
    }
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RiskResidualPageFix;
}