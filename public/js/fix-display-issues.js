/**
 * COMPREHENSIVE DISPLAY FIX
 * Memperbaiki masalah tampilan halaman yang tidak muncul sempurna
 * 
 * Masalah yang diperbaiki:
 * 1. Container not found - Rencana Strategis
 * 2. Enhanced content loading error - Analisis SWOT
 * 3. Page initialization issues
 * 
 * Created: 2026-01-10
 */

(function() {
  'use strict';
  
  console.log('🔧 Display Fix Module Loading...');
  
  // ============================================
  // 1. FIX CONTAINER NOT FOUND ISSUES
  // ============================================
  
  function ensureContainersExist() {
    console.log('📦 Ensuring all page containers exist...');
    
    const requiredContainers = [
      { id: 'rencana-strategis-content', parent: 'rencana-strategis' },
      { id: 'analisis-swot-content', parent: 'analisis-swot' },
      { id: 'monitoring-evaluasi-content', parent: 'monitoring-evaluasi' },
      { id: 'peluang-content', parent: 'peluang' }
    ];
    
    requiredContainers.forEach(({ id, parent }) => {
      let container = document.getElementById(id);
      
      if (!container) {
        console.warn(`⚠️ Container ${id} not found, creating...`);
        
        // Find or create parent page
        let parentPage = document.getElementById(parent);
        if (!parentPage) {
          parentPage = document.createElement('div');
          parentPage.id = parent;
          parentPage.className = 'page-content';
          parentPage.style.display = 'none';
          document.body.appendChild(parentPage);
        }
        
        // Create content container
        container = document.createElement('div');
        container.id = id;
        container.className = 'container-fluid p-4';
        parentPage.appendChild(container);
        
        console.log(`✅ Created container: ${id}`);
      }
    });
  }
  
  // ============================================
  // 2. FIX ANALISIS SWOT ENHANCED CONTENT
  // ============================================
  
  function fixAnalisisSwotDisplay() {
    console.log('🎨 Fixing Analisis SWOT display...');
    
    const container = document.getElementById('analisis-swot-content');
    if (!container) {
      console.error('❌ Analisis SWOT container not found');
      return;
    }
    
    // Check if content is already loaded
    if (container.querySelector('.summary-cards') || container.querySelector('.swot-table')) {
      console.log('✅ Analisis SWOT content already loaded');
      return;
    }
    
    // Inject basic structure if enhanced content fails
    container.innerHTML = `
      <div class="container-fluid p-4">
        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="mb-1"><i class="fas fa-chart-line me-2"></i>Analisis SWOT</h2>
            <p class="text-muted mb-0">Analisis Strengths, Weaknesses, Opportunities, dan Threats</p>
          </div>
          <div class="action-buttons">
            <button class="btn btn-success btn-sm" onclick="AnalisisSwotModule.downloadTemplate()">
              <i class="fas fa-download"></i> Template
            </button>
            <button class="btn btn-info btn-sm" onclick="AnalisisSwotModule.showImportModal()">
              <i class="fas fa-upload"></i> Import
            </button>
            <button class="btn btn-primary btn-sm" onclick="AnalisisSwotModule.showAddModal()">
              <i class="fas fa-plus"></i> Tambah
            </button>
            <button class="btn btn-warning btn-sm" onclick="AnalisisSwotModule.downloadReport()">
              <i class="fas fa-file-excel"></i> Laporan
            </button>
          </div>
        </div>

        <!-- Filter Section -->
        <div class="card mb-4 border-0 shadow-sm">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label fw-semibold">Unit Kerja</label>
                <select id="filterUnitKerja" class="form-select" onchange="AnalisisSwotModule.applyFilters()">
                  <option value="">Semua Unit Kerja</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-semibold">Kategori</label>
                <select id="filterKategori" class="form-select" onchange="AnalisisSwotModule.applyFilters()">
                  <option value="">Semua Kategori</option>
                  <option value="Strength">Strength</option>
                  <option value="Weakness">Weakness</option>
                  <option value="Opportunity">Opportunity</option>
                  <option value="Threat">Threat</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-semibold">Rencana Strategis</label>
                <select id="filterRencanaStrategis" class="form-select" onchange="AnalisisSwotModule.applyFilters()">
                  <option value="">Semua Rencana Strategis</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-semibold">Tahun</label>
                <select id="filterTahun" class="form-select" onchange="AnalisisSwotModule.applyFilters()">
                  <option value="">Semua Tahun</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="summary-cards row g-3 mb-4" id="summaryCards">
          <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body text-center">
                <i class="fas fa-trending-up fa-2x text-success mb-2"></i>
                <h3 class="mb-0">0</h3>
                <p class="text-muted mb-0 small">Kekuatan</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body text-center">
                <i class="fas fa-trending-down fa-2x text-danger mb-2"></i>
                <h3 class="mb-0">0</h3>
                <p class="text-muted mb-0 small">Kelemahan</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body text-center">
                <i class="fas fa-lightbulb fa-2x text-info mb-2"></i>
                <h3 class="mb-0">0</h3>
                <p class="text-muted mb-0 small">Peluang</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body text-center">
                <i class="fas fa-alert-triangle fa-2x text-warning mb-2"></i>
                <h3 class="mb-0">0</h3>
                <p class="text-muted mb-0 small">Ancaman</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Table -->
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-0 py-3">
            <h5 class="mb-0"><i class="fas fa-table me-2"></i>Data Analisis SWOT</h5>
            <small class="text-muted">Kelola data analisis SWOT dengan fitur lengkap</small>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover swot-table mb-0" id="swotTable">
                <thead class="bg-light">
                  <tr>
                    <th style="width: 150px;">Unit Kerja</th>
                    <th style="width: 100px;">Kategori</th>
                    <th style="width: 200px;">Rencana Strategis</th>
                    <th>Objek Analisis</th>
                    <th style="width: 80px;">Bobot</th>
                    <th style="width: 80px;">Rank</th>
                    <th style="width: 80px;">Score</th>
                    <th style="width: 80px;">Tahun</th>
                    <th style="width: 120px;">Aksi</th>
                  </tr>
                </thead>
                <tbody id="swotTableBody">
                  <tr>
                    <td colspan="9" class="text-center py-4">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                      <p class="mt-2 text-muted">Memuat data...</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
    
    console.log('✅ Analisis SWOT basic structure injected');
  }
  
  // ============================================
  // 3. FIX RENCANA STRATEGIS DISPLAY
  // ============================================
  
  function fixRencanaStrategisDisplay() {
    console.log('📋 Fixing Rencana Strategis display...');
    
    const container = document.getElementById('rencana-strategis-content');
    if (!container) {
      console.error('❌ Rencana Strategis container not found');
      return;
    }
    
    // Check if content is already loaded
    if (container.querySelector('.rencana-strategis-wrapper')) {
      console.log('✅ Rencana Strategis content already loaded');
      return;
    }
    
    // Show loading state
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Memuat data rencana strategis...</p>
      </div>
    `;
    
    console.log('✅ Rencana Strategis loading state set');
  }
  
  // ============================================
  // 4. FIX MONITORING & EVALUASI DISPLAY
  // ============================================
  
  function fixMonitoringEvaluasiDisplay() {
    console.log('📊 Fixing Monitoring & Evaluasi display...');
    
    const container = document.getElementById('monitoring-evaluasi-content');
    if (!container) {
      console.error('❌ Monitoring & Evaluasi container not found');
      return;
    }
    
    // Check if content is already loaded
    if (container.querySelector('.monitoring-wrapper')) {
      console.log('✅ Monitoring & Evaluasi content already loaded');
      return;
    }
    
    // Show loading state
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Memuat data monitoring & evaluasi...</p>
      </div>
    `;
    
    console.log('✅ Monitoring & Evaluasi loading state set');
  }
  
  // ============================================
  // 5. GLOBAL PAGE VISIBILITY FIX
  // ============================================
  
  function ensurePageVisibility() {
    console.log('👁️ Ensuring page visibility...');
    
    // Get current hash or pathname
    const hash = window.location.hash.replace('#', '');
    const pathname = window.location.pathname.replace('/', '');
    const currentPage = hash || pathname || 'dashboard';
    
    console.log(`Current page: ${currentPage}`);
    
    // Hide all pages first
    document.querySelectorAll('.page-content').forEach(page => {
      page.style.display = 'none';
      page.classList.remove('active');
    });
    
    // Show current page
    const activePage = document.getElementById(currentPage);
    if (activePage) {
      activePage.style.display = 'block';
      activePage.classList.add('active');
      console.log(`✅ Page ${currentPage} is now visible`);
    } else {
      console.warn(`⚠️ Page ${currentPage} not found`);
    }
  }
  
  // ============================================
  // 6. INITIALIZATION
  // ============================================
  
  function initialize() {
    console.log('🚀 Initializing Display Fix Module...');
    
    // Step 1: Ensure containers exist
    ensureContainersExist();
    
    // Step 2: Fix page visibility
    ensurePageVisibility();
    
    // Step 3: Fix specific pages
    setTimeout(() => {
      fixAnalisisSwotDisplay();
      fixRencanaStrategisDisplay();
      fixMonitoringEvaluasiDisplay();
    }, 100);
    
    // Step 4: Listen for navigation changes
    window.addEventListener('hashchange', () => {
      console.log('🔄 Hash changed, ensuring visibility...');
      ensurePageVisibility();
    });
    
    // Step 5: Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      console.log('🔄 Popstate event, ensuring visibility...');
      ensurePageVisibility();
    });
    
    console.log('✅ Display Fix Module Initialized');
  }
  
  // ============================================
  // 7. AUTO-INITIALIZE
  // ============================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // Export for manual use
  window.DisplayFixModule = {
    ensureContainersExist,
    fixAnalisisSwotDisplay,
    fixRencanaStrategisDisplay,
    fixMonitoringEvaluasiDisplay,
    ensurePageVisibility,
    initialize
  };
  
})();
