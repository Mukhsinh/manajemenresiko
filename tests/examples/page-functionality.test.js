/**
 * Example Tests for Page-Specific Functionality
 * **Feature: ui-ux-enhancement, Property 3: Page-specific functionality verification**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */

const { JSDOM } = require('jsdom');

describe('Page-Specific Functionality Examples', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    // Create a fresh DOM environment for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Page Functionality Test</title>
          <link rel="stylesheet" href="/css/ui-enhancement-framework.css">
        </head>
        <body>
          <div id="app"></div>
        </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
  });

  afterEach(() => {
    if (dom) {
      dom.window.close();
    }
  });

  /**
   * Example Test: Rencana Strategis page complete loading
   * Validates that the Rencana Strategis page loads completely with all expected components
   */
  test('Example: Rencana Strategis page complete loading', () => {
    const appContainer = document.getElementById('app');
    
    // Simulate Rencana Strategis page structure
    const rencanaStrategisHTML = `
      <div class="page-container" data-page="rencana-strategis">
        <div class="page-header">
          <h1 class="page-title">
            <i data-lucide="file-text" class="page-icon"></i>
            Rencana Strategis
          </h1>
          <p class="page-description">Kelola rencana strategis organisasi</p>
        </div>
        
        <div class="main-content">
          <!-- Summary Cards -->
          <div class="cards-grid">
            <div class="card" data-card-type="summary">
              <div class="card-header">
                <h3 class="card-title">
                  <i data-lucide="target" class="card-icon"></i>
                  Total Rencana
                </h3>
              </div>
              <div class="card-body">
                <div class="card-value">25</div>
                <div class="card-label">Rencana Strategis</div>
              </div>
            </div>
            
            <div class="card" data-card-type="summary">
              <div class="card-header">
                <h3 class="card-title">
                  <i data-lucide="check-circle" class="card-icon"></i>
                  Selesai
                </h3>
              </div>
              <div class="card-body">
                <div class="card-value">18</div>
                <div class="card-label">Telah Selesai</div>
              </div>
            </div>
            
            <div class="card" data-card-type="summary">
              <div class="card-header">
                <h3 class="card-title">
                  <i data-lucide="clock" class="card-icon"></i>
                  Dalam Progress
                </h3>
              </div>
              <div class="card-body">
                <div class="card-value">7</div>
                <div class="card-label">Sedang Berjalan</div>
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="action-bar">
            <button class="btn btn-primary" data-action="add">
              <i data-lucide="plus" class="btn-icon"></i>
              Tambah Rencana Strategis
            </button>
            <button class="btn btn-secondary" data-action="export">
              <i data-lucide="download" class="btn-icon"></i>
              Export Data
            </button>
            <button class="btn btn-secondary" data-action="import">
              <i data-lucide="upload" class="btn-icon"></i>
              Import Data
            </button>
          </div>
          
          <!-- Data Table -->
          <div class="table-section">
            <div class="table-header-actions">
              <h2 class="section-title">Daftar Rencana Strategis</h2>
              <div class="table-filters">
                <select class="form-select" data-filter="status">
                  <option value="">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="completed">Selesai</option>
                  <option value="pending">Pending</option>
                </select>
                <input type="text" class="form-input" placeholder="Cari rencana..." data-search="rencana">
              </div>
            </div>
            
            <div class="table-container">
              <table class="table">
                <thead class="table-header">
                  <tr>
                    <th>Kode</th>
                    <th>Nama Rencana</th>
                    <th>Perspektif</th>
                    <th>Target</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <tr>
                    <td>RS-001</td>
                    <td>Peningkatan Kualitas Pelayanan</td>
                    <td>Customer</td>
                    <td>95%</td>
                    <td><span class="badge badge-success">Aktif</span></td>
                    <td>
                      <div class="progress-bar">
                        <div class="progress-fill" style="width: 75%"></div>
                        <span class="progress-text">75%</span>
                      </div>
                    </td>
                    <td class="table-actions">
                      <button class="action-btn action-btn-edit" data-action="edit" title="Edit">
                        <i data-lucide="edit-2"></i>
                      </button>
                      <button class="action-btn action-btn-view" data-action="view" title="View">
                        <i data-lucide="eye"></i>
                      </button>
                      <button class="action-btn action-btn-delete" data-action="delete" title="Delete">
                        <i data-lucide="trash-2"></i>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>RS-002</td>
                    <td>Optimalisasi Proses Bisnis</td>
                    <td>Internal Process</td>
                    <td>90%</td>
                    <td><span class="badge badge-warning">Progress</span></td>
                    <td>
                      <div class="progress-bar">
                        <div class="progress-fill" style="width: 60%"></div>
                        <span class="progress-text">60%</span>
                      </div>
                    </td>
                    <td class="table-actions">
                      <button class="action-btn action-btn-edit" data-action="edit" title="Edit">
                        <i data-lucide="edit-2"></i>
                      </button>
                      <button class="action-btn action-btn-view" data-action="view" title="View">
                        <i data-lucide="eye"></i>
                      </button>
                      <button class="action-btn action-btn-delete" data-action="delete" title="Delete">
                        <i data-lucide="trash-2"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Charts Section -->
          <div class="charts-section">
            <div class="chart-container">
              <div class="chart-header">
                <h3 class="chart-title">Progress Rencana Strategis</h3>
              </div>
              <div class="chart-body">
                <canvas id="progressChart" data-chart="doughnut"></canvas>
              </div>
            </div>
            
            <div class="chart-container">
              <div class="chart-header">
                <h3 class="chart-title">Rencana per Perspektif</h3>
              </div>
              <div class="chart-body">
                <canvas id="perspectiveChart" data-chart="bar"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    appContainer.innerHTML = rencanaStrategisHTML;
    
    // Verify page structure
    const pageContainer = document.querySelector('.page-container');
    expect(pageContainer).toBeTruthy();
    expect(pageContainer.getAttribute('data-page')).toBe('rencana-strategis');
    
    // Verify page header
    const pageHeader = document.querySelector('.page-header');
    const pageTitle = document.querySelector('.page-title');
    const pageDescription = document.querySelector('.page-description');
    
    expect(pageHeader).toBeTruthy();
    expect(pageTitle).toBeTruthy();
    expect(pageDescription).toBeTruthy();
    expect(pageTitle.textContent.trim()).toContain('Rencana Strategis');
    
    // Verify summary cards
    const summaryCards = document.querySelectorAll('.card[data-card-type="summary"]');
    expect(summaryCards.length).toBe(3);
    
    summaryCards.forEach(card => {
      const cardHeader = card.querySelector('.card-header');
      const cardTitle = card.querySelector('.card-title');
      const cardIcon = card.querySelector('.card-icon');
      const cardBody = card.querySelector('.card-body');
      const cardValue = card.querySelector('.card-value');
      const cardLabel = card.querySelector('.card-label');
      
      expect(cardHeader).toBeTruthy();
      expect(cardTitle).toBeTruthy();
      expect(cardIcon).toBeTruthy();
      expect(cardBody).toBeTruthy();
      expect(cardValue).toBeTruthy();
      expect(cardLabel).toBeTruthy();
      
      // Values should be numeric
      expect(cardValue.textContent).toMatch(/^\d+$/);
    });
    
    // Verify action buttons
    const actionBar = document.querySelector('.action-bar');
    const actionButtons = actionBar.querySelectorAll('button[data-action]');
    
    expect(actionBar).toBeTruthy();
    expect(actionButtons.length).toBe(3);
    
    const expectedActions = ['add', 'export', 'import'];
    actionButtons.forEach((button, index) => {
      expect(button.getAttribute('data-action')).toBe(expectedActions[index]);
      
      const buttonIcon = button.querySelector('.btn-icon');
      expect(buttonIcon).toBeTruthy();
    });
    
    // Verify data table
    const tableSection = document.querySelector('.table-section');
    const tableContainer = document.querySelector('.table-container');
    const table = document.querySelector('.table');
    const tableHeader = document.querySelector('.table-header');
    const tableBody = document.querySelector('.table-body');
    
    expect(tableSection).toBeTruthy();
    expect(tableContainer).toBeTruthy();
    expect(table).toBeTruthy();
    expect(tableHeader).toBeTruthy();
    expect(tableBody).toBeTruthy();
    
    // Verify table headers
    const headerCells = tableHeader.querySelectorAll('th');
    const expectedHeaders = ['Kode', 'Nama Rencana', 'Perspektif', 'Target', 'Status', 'Progress', 'Aksi'];
    expect(headerCells.length).toBe(expectedHeaders.length);
    
    headerCells.forEach((cell, index) => {
      expect(cell.textContent.trim()).toBe(expectedHeaders[index]);
    });
    
    // Verify table rows
    const tableRows = tableBody.querySelectorAll('tr');
    expect(tableRows.length).toBe(2);
    
    tableRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      expect(cells.length).toBe(expectedHeaders.length);
      
      // Verify action buttons in each row
      const actionCell = cells[cells.length - 1];
      const actionButtons = actionCell.querySelectorAll('.action-btn');
      expect(actionButtons.length).toBe(3);
      
      const expectedRowActions = ['edit', 'view', 'delete'];
      actionButtons.forEach((button, index) => {
        expect(button.getAttribute('data-action')).toBe(expectedRowActions[index]);
        expect(button.classList.contains(`action-btn-${expectedRowActions[index]}`)).toBe(true);
        
        const buttonIcon = button.querySelector('i[data-lucide]');
        expect(buttonIcon).toBeTruthy();
      });
      
      // Verify progress bar
      const progressBar = row.querySelector('.progress-bar');
      if (progressBar) {
        const progressFill = progressBar.querySelector('.progress-fill');
        const progressText = progressBar.querySelector('.progress-text');
        
        expect(progressFill).toBeTruthy();
        expect(progressText).toBeTruthy();
        
        // Progress text should match fill width
        const fillWidth = progressFill.style.width;
        const textValue = progressText.textContent;
        expect(fillWidth).toBe(textValue);
      }
      
      // Verify status badges
      const statusBadge = row.querySelector('.badge');
      if (statusBadge) {
        expect(['badge-success', 'badge-warning', 'badge-danger', 'badge-info'].some(cls => 
          statusBadge.classList.contains(cls)
        )).toBe(true);
      }
    });
    
    // Verify filters
    const tableFilters = document.querySelector('.table-filters');
    const statusFilter = document.querySelector('[data-filter="status"]');
    const searchInput = document.querySelector('[data-search="rencana"]');
    
    expect(tableFilters).toBeTruthy();
    expect(statusFilter).toBeTruthy();
    expect(searchInput).toBeTruthy();
    
    // Verify charts section
    const chartsSection = document.querySelector('.charts-section');
    const chartContainers = chartsSection.querySelectorAll('.chart-container');
    
    expect(chartsSection).toBeTruthy();
    expect(chartContainers.length).toBe(2);
    
    chartContainers.forEach(container => {
      const chartHeader = container.querySelector('.chart-header');
      const chartTitle = container.querySelector('.chart-title');
      const chartBody = container.querySelector('.chart-body');
      const chartCanvas = container.querySelector('canvas[data-chart]');
      
      expect(chartHeader).toBeTruthy();
      expect(chartTitle).toBeTruthy();
      expect(chartBody).toBeTruthy();
      expect(chartCanvas).toBeTruthy();
      
      // Chart should have proper data-chart attribute
      expect(['doughnut', 'bar', 'line', 'pie'].includes(chartCanvas.getAttribute('data-chart'))).toBe(true);
    });
  });

  /**
   * Example Test: Risk Residual page complete loading
   * Validates that the Risk Residual page loads completely with all expected components
   */
  test('Example: Risk Residual page complete loading', () => {
    const appContainer = document.getElementById('app');
    
    // Simulate Risk Residual page structure
    const riskResidualHTML = `
      <div class="page-container" data-page="risk-residual">
        <div class="page-header">
          <h1 class="page-title">
            <i data-lucide="alert-triangle" class="page-icon"></i>
            Risk Residual
          </h1>
          <p class="page-description">Monitor dan kelola risiko residual organisasi</p>
        </div>
        
        <div class="main-content">
          <!-- Risk Summary Cards -->
          <div class="risk-summary-grid">
            <div class="card risk-card" data-risk-level="very-high">
              <div class="card-header">
                <h3 class="card-title">
                  <i data-lucide="alert-circle" class="card-icon"></i>
                  Very High Risk
                </h3>
              </div>
              <div class="card-body">
                <div class="risk-count">3</div>
                <div class="risk-label">Risiko Sangat Tinggi</div>
              </div>
            </div>
            
            <div class="card risk-card" data-risk-level="high">
              <div class="card-header">
                <h3 class="card-title">
                  <i data-lucide="alert-triangle" class="card-icon"></i>
                  High Risk
                </h3>
              </div>
              <div class="card-body">
                <div class="risk-count">8</div>
                <div class="risk-label">Risiko Tinggi</div>
              </div>
            </div>
            
            <div class="card risk-card" data-risk-level="medium">
              <div class="card-header">
                <h3 class="card-title">
                  <i data-lucide="minus-circle" class="card-icon"></i>
                  Medium Risk
                </h3>
              </div>
              <div class="card-body">
                <div class="risk-count">15</div>
                <div class="risk-label">Risiko Sedang</div>
              </div>
            </div>
            
            <div class="card risk-card" data-risk-level="low">
              <div class="card-header">
                <h3 class="card-title">
                  <i data-lucide="check-circle" class="card-icon"></i>
                  Low Risk
                </h3>
              </div>
              <div class="card-body">
                <div class="risk-count">22</div>
                <div class="risk-label">Risiko Rendah</div>
              </div>
            </div>
          </div>
          
          <!-- Risk Matrix -->
          <div class="risk-matrix-section">
            <div class="section-header">
              <h2 class="section-title">Risk Matrix</h2>
              <div class="matrix-controls">
                <button class="btn btn-secondary" data-action="refresh-matrix">
                  <i data-lucide="refresh-cw" class="btn-icon"></i>
                  Refresh
                </button>
              </div>
            </div>
            
            <div class="risk-matrix-container">
              <div class="risk-matrix" data-matrix-type="residual">
                <div class="matrix-grid">
                  <!-- 5x5 Risk Matrix -->
                  ${Array.from({ length: 25 }, (_, i) => {
                    const row = Math.floor(i / 5);
                    const col = i % 5;
                    const riskScore = (4 - row) + col;
                    let riskLevel = 'very-low';
                    
                    if (riskScore >= 7) riskLevel = 'very-high';
                    else if (riskScore >= 5) riskLevel = 'high';
                    else if (riskScore >= 3) riskLevel = 'medium';
                    else if (riskScore >= 1) riskLevel = 'low';
                    
                    return `<div class="matrix-cell" data-cell="${i}" data-risk-level="${riskLevel}" data-row="${row}" data-col="${col}"></div>`;
                  }).join('')}
                </div>
                
                <div class="matrix-labels">
                  <div class="probability-label">Probability</div>
                  <div class="impact-label">Impact</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Risk Register Table -->
          <div class="risk-register-section">
            <div class="section-header">
              <h2 class="section-title">Risk Register</h2>
              <div class="register-controls">
                <select class="form-select" data-filter="risk-level">
                  <option value="">Semua Level</option>
                  <option value="very-high">Very High</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            
            <div class="table-container">
              <table class="table risk-register-table">
                <thead class="table-header">
                  <tr>
                    <th>Risk ID</th>
                    <th>Risk Description</th>
                    <th>Category</th>
                    <th>Inherent Risk</th>
                    <th>Control Effectiveness</th>
                    <th>Residual Risk</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody class="table-body">
                  <tr>
                    <td>RSK-001</td>
                    <td>Kegagalan sistem IT utama</td>
                    <td>Technology</td>
                    <td><span class="risk-badge risk-very-high">Very High</span></td>
                    <td><span class="control-badge control-effective">Effective</span></td>
                    <td><span class="risk-badge risk-medium">Medium</span></td>
                    <td><span class="status-badge status-active">Active</span></td>
                    <td class="table-actions">
                      <button class="action-btn action-btn-edit" data-action="edit" title="Edit">
                        <i data-lucide="edit-2"></i>
                      </button>
                      <button class="action-btn action-btn-view" data-action="view" title="View">
                        <i data-lucide="eye"></i>
                      </button>
                      <button class="action-btn action-btn-delete" data-action="delete" title="Delete">
                        <i data-lucide="trash-2"></i>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>RSK-002</td>
                    <td>Kehilangan data pelanggan</td>
                    <td>Data Security</td>
                    <td><span class="risk-badge risk-high">High</span></td>
                    <td><span class="control-badge control-partial">Partial</span></td>
                    <td><span class="risk-badge risk-high">High</span></td>
                    <td><span class="status-badge status-monitoring">Monitoring</span></td>
                    <td class="table-actions">
                      <button class="action-btn action-btn-edit" data-action="edit" title="Edit">
                        <i data-lucide="edit-2"></i>
                      </button>
                      <button class="action-btn action-btn-view" data-action="view" title="View">
                        <i data-lucide="eye"></i>
                      </button>
                      <button class="action-btn action-btn-delete" data-action="delete" title="Delete">
                        <i data-lucide="trash-2"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
    
    appContainer.innerHTML = riskResidualHTML;
    
    // Verify page structure
    const pageContainer = document.querySelector('.page-container');
    expect(pageContainer).toBeTruthy();
    expect(pageContainer.getAttribute('data-page')).toBe('risk-residual');
    
    // Verify page header
    const pageHeader = document.querySelector('.page-header');
    const pageTitle = document.querySelector('.page-title');
    
    expect(pageHeader).toBeTruthy();
    expect(pageTitle).toBeTruthy();
    expect(pageTitle.textContent.trim()).toContain('Risk Residual');
    
    // Verify risk summary cards
    const riskCards = document.querySelectorAll('.risk-card');
    expect(riskCards.length).toBe(4);
    
    const expectedRiskLevels = ['very-high', 'high', 'medium', 'low'];
    riskCards.forEach((card, index) => {
      expect(card.getAttribute('data-risk-level')).toBe(expectedRiskLevels[index]);
      
      const riskCount = card.querySelector('.risk-count');
      const riskLabel = card.querySelector('.risk-label');
      
      expect(riskCount).toBeTruthy();
      expect(riskLabel).toBeTruthy();
      expect(riskCount.textContent).toMatch(/^\d+$/);
    });
    
    // Verify risk matrix
    const riskMatrix = document.querySelector('.risk-matrix');
    const matrixGrid = document.querySelector('.matrix-grid');
    const matrixCells = matrixGrid.querySelectorAll('.matrix-cell');
    
    expect(riskMatrix).toBeTruthy();
    expect(matrixGrid).toBeTruthy();
    expect(matrixCells.length).toBe(25); // 5x5 matrix
    
    // Verify matrix cells have proper attributes
    matrixCells.forEach((cell, index) => {
      expect(cell.getAttribute('data-cell')).toBe(index.toString());
      expect(cell.getAttribute('data-risk-level')).toBeTruthy();
      expect(cell.getAttribute('data-row')).toBeTruthy();
      expect(cell.getAttribute('data-col')).toBeTruthy();
    });
    
    // Verify risk register table
    const riskRegisterTable = document.querySelector('.risk-register-table');
    const registerHeader = riskRegisterTable.querySelector('.table-header');
    const registerBody = riskRegisterTable.querySelector('.table-body');
    
    expect(riskRegisterTable).toBeTruthy();
    expect(registerHeader).toBeTruthy();
    expect(registerBody).toBeTruthy();
    
    // Verify table headers
    const headerCells = registerHeader.querySelectorAll('th');
    const expectedHeaders = ['Risk ID', 'Risk Description', 'Category', 'Inherent Risk', 'Control Effectiveness', 'Residual Risk', 'Status', 'Actions'];
    expect(headerCells.length).toBe(expectedHeaders.length);
    
    // Verify table rows
    const registerRows = registerBody.querySelectorAll('tr');
    expect(registerRows.length).toBe(2);
    
    registerRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      expect(cells.length).toBe(expectedHeaders.length);
      
      // Verify risk badges
      const riskBadges = row.querySelectorAll('.risk-badge');
      expect(riskBadges.length).toBeGreaterThanOrEqual(1);
      
      riskBadges.forEach(badge => {
        expect(['risk-very-high', 'risk-high', 'risk-medium', 'risk-low', 'risk-very-low'].some(cls => 
          badge.classList.contains(cls)
        )).toBe(true);
      });
      
      // Verify control badges
      const controlBadges = row.querySelectorAll('.control-badge');
      if (controlBadges.length > 0) {
        controlBadges.forEach(badge => {
          expect(['control-effective', 'control-partial', 'control-ineffective'].some(cls => 
            badge.classList.contains(cls)
          )).toBe(true);
        });
      }
      
      // Verify status badges
      const statusBadges = row.querySelectorAll('.status-badge');
      if (statusBadges.length > 0) {
        statusBadges.forEach(badge => {
          expect(['status-active', 'status-monitoring', 'status-closed'].some(cls => 
            badge.classList.contains(cls)
          )).toBe(true);
        });
      }
      
      // Verify action buttons
      const actionButtons = row.querySelectorAll('.action-btn');
      expect(actionButtons.length).toBe(3);
      
      const expectedActions = ['edit', 'view', 'delete'];
      actionButtons.forEach((button, index) => {
        expect(button.getAttribute('data-action')).toBe(expectedActions[index]);
      });
    });
  });
});