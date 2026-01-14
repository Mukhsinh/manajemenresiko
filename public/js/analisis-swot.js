// Analisis SWOT Enhanced Module
const AnalisisSwotModule = (() => {
  const state = {
    allData: [],
    filteredData: [],
    unitKerjaList: [],
    rencanaStrategisList: [],
    currentFilters: {
      unitKerja: '',
      kategori: '',
      rencanaStrategis: '',
      tahun: ''
    },
    isLoading: false,
    isInitialized: false
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);
  const getEl = (id) => document.getElementById(id);

  async function load() {
    console.log('=== ANALISIS SWOT MODULE LOAD START ===');
    
    // Prevent multiple simultaneous loads
    if (state.isLoading) {
      console.log('AnalisisSwotModule: Already loading, skipping...');
      return;
    }
    
    state.isLoading = true;
    
    // Get container - don't check if page is active, just load the data
    const container = document.getElementById('analisis-swot-content');
    if (container) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center;">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p style="margin-top: 15px; color: #666;">Memuat data Analisis SWOT...</p>
        </div>
      `;
    }
    
    try {
      console.log('Fetching initial data...');
      await fetchInitialData();
      
      console.log('Rendering enhanced interface...');
      render();
      
      state.isInitialized = true;
      console.log('=== ANALISIS SWOT MODULE LOAD COMPLETE ===');
    } catch (error) {
      console.error('=== ANALISIS SWOT MODULE LOAD ERROR ===', error);
      showError('Terjadi kesalahan saat memuat halaman: ' + error.message);
    } finally {
      state.isLoading = false;
    }
  }

  async function fetchInitialData() {
    try {
      // Load SWOT data with related data
      const swotData = await api()('/api/analisis-swot');
      console.log('SWOT data loaded:', swotData.length, 'items');
      
      // Load unit kerja data
      const unitKerjaData = await api()('/api/master-data/work-units');
      state.unitKerjaList = unitKerjaData || [];
      
      // Load rencana strategis
      const rencanaStrategisData = await api()('/api/rencana-strategis');
      state.rencanaStrategisList = rencanaStrategisData || [];
      
      // Process and enhance data
      state.allData = swotData.map(item => ({
        ...item,
        unit_kerja_name: getUnitKerjaName(item.unit_kerja_id),
        rencana_strategis_info: getRencanaStrategisInfo(item.rencana_strategis_id)
      }));
      
      state.filteredData = [...state.allData];
      
    } catch (error) {
      console.error('Error fetching SWOT data:', error);
      state.allData = [];
      state.filteredData = [];
    }
  }

  function getUnitKerjaName(unitKerjaId) {
    if (!unitKerjaId) return 'Unknown Unit';
    const unit = state.unitKerjaList.find(u => u.id === unitKerjaId);
    return unit ? unit.name : 'Unknown Unit';
  }

  function getRencanaStrategisInfo(rencanaStrategisId) {
    if (!rencanaStrategisId) {
      return { kode: '-', nama: 'Tidak terkait' };
    }
    
    const rencana = state.rencanaStrategisList.find(r => r.id === rencanaStrategisId);
    return rencana ? {
      kode: rencana.kode,
      nama: rencana.nama_rencana
    } : {
      kode: '-',
      nama: 'Tidak ditemukan'
    };
  }

  /**
   * Renders the Analisis SWOT page with enhanced HTML content
   * @returns {Promise<void>}
   */
  async function render() {
    /** @type {HTMLElement | null} */
    const container = getEl('analisis-swot-content');
    if (!container) {
      console.error('Container analisis-swot-content not found!');
      return;
    }
    
    try {
      // Load enhanced HTML content
      /** @type {Response} */
      const response = await fetch('/analisis-swot-enhanced-final.html');
      if (!response.ok) {
        throw new Error(`Failed to fetch enhanced HTML: ${response.status} ${response.statusText}`);
      }
      /** @type {string} */
      const htmlContent = await response.text();
      
      // Extract styles and body content from the enhanced HTML
      /** @type {DOMParser} */
      const parser = new DOMParser();
      /** @type {Document} */
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Extract styles from <style> tag in head
      /** @type {HTMLStyleElement | null} */
      const styleElement = doc.querySelector('head style');
      if (styleElement) {
        const styleId = 'analisis-swot-enhanced-styles';
        // Remove existing style if present
        /** @type {HTMLElement | null} */
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
          existingStyle.remove();
        }
        
        // Inject styles into document head
        /** @type {HTMLStyleElement} */
        const newStyle = document.createElement('style');
        newStyle.id = styleId;
        newStyle.textContent = styleElement.textContent;
        document.head.appendChild(newStyle);
        console.log('✓ Enhanced styles loaded for Analisis SWOT');
      }
      
      // Extract body content from .container-fluid
      /** @type {HTMLElement | null} */
      const containerFluid = doc.querySelector('.container-fluid');
      if (containerFluid) {
        container.innerHTML = containerFluid.innerHTML;
        console.log('✓ Enhanced HTML content loaded for Analisis SWOT');
      } else {
        throw new Error('Could not find .container-fluid in enhanced HTML');
      }
      
      // Initialize enhanced functionality
      initializeEnhancedFeatures();
      
    } catch (error) {
      /** @type {Error} */
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('❌ Error loading enhanced content:', err);
      console.warn('⚠️ Falling back to basic content with enhanced styles');
      // Fallback to basic content but keep enhanced styles
      renderBasicContent(container);
      initializeEnhancedFeatures(); // Still initialize enhanced features for styling
    }

    // Populate filters, summary cards, and table after content is loaded
    populateFilters();
    renderSummaryCards();
    renderTable();
  }

  function renderBasicContent(container) {
    container.innerHTML = `
      <div class="d-flex justify-content-end align-items-center mb-4">
        <div class="action-buttons">
          <button class="btn btn-success" onclick="AnalisisSwotModule.downloadTemplate()">
            <i class="fas fa-download"></i> Template
          </button>
          <button class="btn btn-info" onclick="AnalisisSwotModule.showImportModal()">
            <i class="fas fa-upload"></i> Import
          </button>
          <button class="btn btn-primary" onclick="AnalisisSwotModule.showAddModal()">
            <i class="fas fa-plus"></i> Tambah
          </button>
          <button class="btn btn-warning" onclick="AnalisisSwotModule.downloadReport()">
            <i class="fas fa-file-excel"></i> Laporan
          </button>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="filter-section">
        <div class="row">
          <div class="col-md-3">
            <label class="form-label">Unit Kerja</label>
            <select id="filterUnitKerja" class="form-select" onchange="AnalisisSwotModule.applyFilters()">
              <option value="">Semua Unit Kerja</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Kategori</label>
            <select id="filterKategori" class="form-select" onchange="AnalisisSwotModule.applyFilters()">
              <option value="">Semua Kategori</option>
              <option value="Strength">Strength</option>
              <option value="Weakness">Weakness</option>
              <option value="Opportunity">Opportunity</option>
              <option value="Threat">Threat</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Rencana Strategis</label>
            <select id="filterRencanaStrategis" class="form-select" onchange="AnalisisSwotModule.applyFilters()">
              <option value="">Semua Rencana Strategis</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Tahun</label>
            <select id="filterTahun" class="form-select" onchange="AnalisisSwotModule.applyFilters()">
              <option value="">Semua Tahun</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards" id="summaryCards">
        <!-- Summary cards will be populated here -->
      </div>

      <!-- Data Table -->
      <div class="card border-0 swot-table-container">
        <div class="card-header bg-transparent border-0">
          <h5 class="mb-0">Data Analisis SWOT</h5>
          <small class="text-muted">Kelola data analisis SWOT dengan fitur lengkap dan badge kategori yang tidak overflow</small>
        </div>
        <div class="card-body p-0">
          <div class="table-container">
            <table class="table table-striped swot-table" id="swotTable">
              <thead>
                <tr>
                  <th class="unit-kerja-column">Unit Kerja</th>
                  <th class="kategori-column">Kategori</th>
                  <th class="rencana-strategis-column">Rencana Strategis</th>
                  <th class="objek-analisis-column">Objek Analisis</th>
                  <th class="bobot-column">Bobot</th>
                  <th class="rank-column">Rank</th>
                  <th class="score-column">Score</th>
                  <th class="tahun-column">Tahun</th>
                  <th class="aksi-column">Aksi</th>
                </tr>
              </thead>
              <tbody id="swotTableBody">
                <tr>
                  <td colspan="9" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin"></i> Memuat data...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function initializeEnhancedFeatures() {
    // Load enhanced fix CSS (badge colors, table scroll, button fix)
    const enhancedCssId = 'analisis-swot-enhanced-fix-css';
    if (!document.getElementById(enhancedCssId)) {
      const enhancedLink = document.createElement('link');
      enhancedLink.id = enhancedCssId;
      enhancedLink.rel = 'stylesheet';
      enhancedLink.href = '/css/analisis-swot-enhanced-fix.css';
      document.head.appendChild(enhancedLink);
      console.log('✓ Enhanced fix CSS loaded for Analisis SWOT (badge, scroll, buttons)');
    }
    
    // Load white cards CSS if not already loaded
    const cssId = 'analisis-swot-white-cards-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = '/css/analisis-swot-white-cards.css';
      document.head.appendChild(link);
      console.log('✓ White cards CSS loaded for Analisis SWOT');
    }
    
    // Add enhanced CSS styles
    const style = document.createElement('style');
    style.id = 'analisis-swot-enhanced-inline';
    style.textContent = `
      /* Enhanced SWOT Analysis Styles - White Theme */
      .page-header {
          background: #ffffff !important;
          color: #1e293b !important;
          padding: 16px 20px !important;
          margin-bottom: 16px !important;
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
      }
      
      .action-buttons {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
      }
      
      .btn-action {
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
          font-size: 12px;
      }
      
      .btn-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
      }
      
      /* Badge Styles - Compact */
      .badge-kategori {
          display: inline-block;
          padding: 4px 8px;
          font-size: 10px;
          font-weight: 600;
          line-height: 1.2;
          text-align: center;
          white-space: nowrap;
          vertical-align: baseline;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
      }
      
      /* Table overflow fixes */
      .swot-table td, .swot-table th {
          overflow: hidden;
          text-overflow: ellipsis;
          word-wrap: break-word;
      }
      
      .swot-table .objek-analisis-column {
          max-width: 350px;
          min-width: 180px;
      }
      
      .swot-table .kategori-column {
          max-width: 100px;
          min-width: 80px;
      }
      
      /* Badge colors - Bright solid colors without outline */
      .badge-strength { 
        background: #22c55e !important; 
        color: #ffffff !important; 
        border: none !important;
        box-shadow: none !important;
      }
      .badge-weakness { 
        background: #ef4444 !important; 
        color: #ffffff !important; 
        border: none !important;
        box-shadow: none !important;
      }
      .badge-opportunity { 
        background: #3b82f6 !important; 
        color: #ffffff !important; 
        border: none !important;
        box-shadow: none !important;
      }
      .badge-threat { 
        background: #f59e0b !important; 
        color: #ffffff !important; 
        border: none !important;
        box-shadow: none !important;
      }
      
      /* Column Styles */
      .kategori-column {
          width: 100px;
          min-width: 80px;
          max-width: 100px;
          text-align: center;
          padding: 8px 4px !important;
      }
      
      /* Action Buttons - Compact */
      .btn-icon {
          padding: 4px 8px;
          margin: 0 2px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 11px;
          min-width: 28px;
      }
      
      .btn-edit { background-color: #17a2b8; color: white; }
      .btn-delete { background-color: #dc3545; color: white; }
      
      .btn-icon:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
      }
      
      /* Summary Cards - White & Compact */
      .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
      }
      
      .summary-card {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px !important;
          padding: 12px 14px !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
      }
      
      /* Table Container - White */
      .card.border-0,
      .table-container {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px !important;
      }
      
      .card-header {
          background: #ffffff !important;
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 12px 16px !important;
      }
      
      .card-header h5 {
          color: #1e293b !important;
          font-size: 14px !important;
          font-weight: 600 !important;
      }
      
      /* Table Header - Light gray */
      .table thead th {
          background: #f8fafc !important;
          color: #475569 !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          padding: 10px 12px !important;
      }
      
      /* No overflow */
      .container-fluid {
          padding: 16px !important;
          overflow-x: hidden !important;
      }
    `;
    
    // Remove existing inline style if present
    const existingStyle = document.getElementById('analisis-swot-enhanced-inline');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
  }

  function populateFilters() {
    // Populate Unit Kerja filter
    const unitKerjaSelect = getEl('filterUnitKerja');
    if (unitKerjaSelect) {
      unitKerjaSelect.innerHTML = '<option value="">Semua Unit Kerja</option>';
      
      const uniqueUnits = [...new Set(state.allData.map(item => item.unit_kerja_id).filter(Boolean))];
      uniqueUnits.forEach(unitId => {
        const unitName = getUnitKerjaName(unitId);
        unitKerjaSelect.innerHTML += `<option value="${unitId}">${unitName}</option>`;
      });
    }

    // Populate Rencana Strategis filter
    const rencanaSelect = getEl('filterRencanaStrategis');
    if (rencanaSelect) {
      rencanaSelect.innerHTML = '<option value="">Semua Rencana Strategis</option>';
      
      state.rencanaStrategisList.forEach(rencana => {
        rencanaSelect.innerHTML += `<option value="${rencana.id}">${rencana.kode} - ${rencana.nama_rencana}</option>`;
      });
    }
  }

  function applyFilters() {
    const unitKerjaFilter = getEl('filterUnitKerja')?.value || '';
    const kategoriFilter = getEl('filterKategori')?.value || '';
    const rencanaFilter = getEl('filterRencanaStrategis')?.value || '';
    const tahunFilter = getEl('filterTahun')?.value || '';

    state.currentFilters = {
      unitKerja: unitKerjaFilter,
      kategori: kategoriFilter,
      rencanaStrategis: rencanaFilter,
      tahun: tahunFilter
    };

    state.filteredData = state.allData.filter(item => {
      return (!unitKerjaFilter || item.unit_kerja_id === unitKerjaFilter) &&
             (!kategoriFilter || item.kategori === kategoriFilter) &&
             (!rencanaFilter || item.rencana_strategis_id === rencanaFilter) &&
             (!tahunFilter || item.tahun.toString() === tahunFilter);
    });

    renderSummaryCards();
    renderTable();
  }

  async function renderSummaryCards() {
    const summaryContainer = getEl('summaryCards');
    if (!summaryContainer) return;
    
    try {
      // Fetch summary data from API
      const params = new URLSearchParams();
      if (state.currentFilters.unitKerja) params.append('unit_kerja_id', state.currentFilters.unitKerja);
      if (state.currentFilters.rencanaStrategis) params.append('rencana_strategis_id', state.currentFilters.rencanaStrategis);
      if (state.currentFilters.tahun) params.append('tahun', state.currentFilters.tahun);
      
      const summaryData = await api()(`/api/analisis-swot/summary?${params.toString()}`);
      
      console.log('🔍 SWOT Summary Debug:', {
        endpoint: `/api/analisis-swot/summary?${params.toString()}`,
        filters: state.currentFilters,
        summaryData: summaryData
      });
      
      // Check for zero values and log warning
      Object.keys(summaryData).forEach(category => {
        if (summaryData[category] && summaryData[category].totalScore === 0) {
          console.warn(`⚠️ SWOT Warning: ${category} has totalScore = 0!`, summaryData[category]);
        }
      });
      
      const cardConfig = {
        Strength: { 
          icon: 'trending-up', 
          class: 'strength',
          title: 'Kekuatan'
        },
        Weakness: { 
          icon: 'trending-down', 
          class: 'weakness',
          title: 'Kelemahan'
        },
        Opportunity: { 
          icon: 'lightbulb', 
          class: 'opportunity',
          title: 'Peluang'
        },
        Threat: { 
          icon: 'alert-triangle', 
          class: 'threat',
          title: 'Ancaman'
        }
      };

      summaryContainer.innerHTML = Object.keys(cardConfig).map(category => {
        const config = cardConfig[category];
        const data = summaryData[category] || { totalScore: 0, totalBobot: 0, items: [] };
        
        // Use actual total score from API - ensure it's a valid number
        const totalScore = Math.max(parseInt(data.totalScore) || 0, 0);
        const itemCount = data.items ? data.items.length : 0;
        const totalBobot = Math.max(parseInt(data.totalBobot) || 0, 0);
        
        // Only show card if there's actual data (totalScore > 0 or items > 0)
        if (totalScore === 0 && itemCount === 0) {
          return ''; // Skip cards with zero values
        }
        
        return `
          <div class="summary-card ${config.class}">
            <div class="card-icon">
              <i data-lucide="${config.icon}"></i>
            </div>
            <div class="card-title">${config.title}</div>
            <div class="card-value">${totalScore.toLocaleString('id-ID')}</div>
            <div class="card-subtitle">Total Score</div>
            <div class="card-stats">
              <div class="card-stat">
                <div class="card-stat-label">Items</div>
                <div class="card-stat-value">${itemCount}</div>
              </div>
              <div class="card-stat">
                <div class="card-stat-label">Bobot</div>
                <div class="card-stat-value">${totalBobot.toLocaleString('id-ID')}</div>
              </div>
            </div>
          </div>
        `;
      }).filter(Boolean).join(''); // Filter out empty strings
      
    } catch (error) {
      console.error('Error fetching summary data:', error);
      
      // Fallback to local calculation
      const summary = {
        Strength: { count: 0, totalScore: 0, totalBobot: 0 },
        Weakness: { count: 0, totalScore: 0, totalBobot: 0 },
        Opportunity: { count: 0, totalScore: 0, totalBobot: 0 },
        Threat: { count: 0, totalScore: 0, totalBobot: 0 }
      };

      state.filteredData.forEach(item => {
        if (summary[item.kategori]) {
          summary[item.kategori].count++;
          summary[item.kategori].totalScore += item.score || 0;
          summary[item.kategori].totalBobot += item.bobot || 0;
        }
      });

      const cardConfig = {
        Strength: { 
          icon: 'trending-up', 
          class: 'strength',
          title: 'Kekuatan'
        },
        Weakness: { 
          icon: 'trending-down', 
          class: 'weakness',
          title: 'Kelemahan'
        },
        Opportunity: { 
          icon: 'lightbulb', 
          class: 'opportunity',
          title: 'Peluang'
        },
        Threat: { 
          icon: 'alert-triangle', 
          class: 'threat',
          title: 'Ancaman'
        }
      };

      summaryContainer.innerHTML = Object.keys(summary).map(category => {
        const config = cardConfig[category];
        const data = summary[category];
        
        // Use actual total score from database
        const totalScore = data.totalScore;
        
        return `
          <div class="summary-card ${config.class}">
            <div class="card-icon">
              <i data-lucide="${config.icon}"></i>
            </div>
            <div class="card-title">${config.title}</div>
            <div class="card-value">${totalScore}</div>
            <div class="card-subtitle">Total Score</div>
            <div class="card-stats">
              <div class="card-stat">
                <div class="card-stat-label">Items</div>
                <div class="card-stat-value">${data.count}</div>
              </div>
              <div class="card-stat">
                <div class="card-stat-label">Bobot</div>
                <div class="card-stat-value">${data.totalBobot}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  function renderTable() {
    const tbody = getEl('swotTableBody');
    if (!tbody) return;
    
    if (state.filteredData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="no-data" style="text-align: center; padding: 40px; color: #64748b;">
            <i class="fas fa-info-circle" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
            Tidak ada data yang sesuai dengan filter
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = state.filteredData.map(item => {
      const kategoriLower = (item.kategori || '').toLowerCase();
      const unitKerjaName = item.unit_kerja_name || 'Unknown';
      const rsInfo = item.rencana_strategis_info || { kode: '-', nama: 'Tidak terkait' };
      const objekAnalisis = item.objek_analisis || '-';
      const bobot = item.bobot || 0;
      const rank = item.rank || 0;
      const score = item.score || 0;
      const tahun = item.tahun || '-';
      const itemId = item.id;
      
      return `
        <tr data-id="${itemId}">
          <td class="unit-kerja-column">${unitKerjaName}</td>
          <td class="kategori-column">
            <span class="badge-kategori badge-${kategoriLower}">${item.kategori || '-'}</span>
          </td>
          <td class="rencana-strategis-column">
            <div class="kode" style="font-weight: 600; color: #495057; margin-bottom: 2px;">${rsInfo.kode}</div>
            <div class="nama" style="color: #6c757d; font-size: 0.85em; line-height: 1.2;">${rsInfo.nama}</div>
          </td>
          <td class="objek-analisis-column" title="${objekAnalisis}">${objekAnalisis}</td>
          <td class="bobot-column">${bobot}</td>
          <td class="rank-column">${rank}</td>
          <td class="score-column">${score}</td>
          <td class="tahun-column">${tahun}</td>
          <td class="aksi-column">
            <button type="button" class="btn-icon btn-edit" data-id="${itemId}" title="Edit Data">
              <i class="fas fa-edit"></i>
            </button>
            <button type="button" class="btn-icon btn-delete" data-id="${itemId}" title="Hapus Data">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    // Attach event listeners for edit and delete buttons
    attachButtonEventListeners();
  }
  
  function attachButtonEventListeners() {
    // Edit buttons
    document.querySelectorAll('.btn-edit[data-id]').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = this.getAttribute('data-id');
        if (id) {
          console.log('Edit button clicked for ID:', id);
          editData(id);
        }
      });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete[data-id]').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = this.getAttribute('data-id');
        if (id) {
          console.log('Delete button clicked for ID:', id);
          deleteData(id);
        }
      });
    });
    
    console.log('✓ Button event listeners attached');
  }

  function showError(message) {
    const container = getEl('analisis-swot-content');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger" role="alert">
          <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Analisis SWOT</h4>
          <p>${message}</p>
          <button onclick="AnalisisSwotModule.load()" class="btn btn-primary">
            <i class="fas fa-sync"></i> Coba Lagi
          </button>
        </div>
      `;
    }
  }

  async function refreshData() {
    const tbody = getEl('swotTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="loading">
            <i class="fas fa-spinner fa-spin"></i> Memuat ulang data...
          </td>
        </tr>
      `;
    }
    
    await fetchInitialData();
    populateFilters();
    renderSummaryCards();
    renderTable();
  }

  return {
    load,
    applyFilters,
    refreshData,
    downloadTemplate,
    showImportModal,
    showAddModal,
    downloadReport,
    editData,
    deleteData,
    updateData,
    closeModal,
    handleFileSelect,
    processImport,
    saveData
  };

  // Update data function (for edit form)
  async function updateData(event, id) {
    event.preventDefault();
    
    try {
      const formData = {
        unit_kerja_id: document.getElementById('editUnitKerja').value,
        kategori: document.getElementById('editKategori').value,
        rencana_strategis_id: document.getElementById('editRencanaStrategis')?.value || null,
        objek_analisis: document.getElementById('editObjekAnalisis').value,
        bobot: parseInt(document.getElementById('editBobot').value),
        rank: parseInt(document.getElementById('editRank').value),
        tahun: parseInt(document.getElementById('editTahun').value)
      };

      await api()(`/api/analisis-swot/${id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      // Close modal
      const modal = document.querySelector('.modal.active');
      if (modal) modal.remove();

      // Refresh data
      await fetchInitialData();
      populateFilters();
      renderSummaryCards();
      renderTable();
      
      alert('Data berhasil diupdate');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  // Close modal function
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      modal.remove();
    }
  }

  // Handle file select for import
  function handleFileSelect(event) {
    const file = event.target.files[0];
    const importBtn = document.getElementById('importBtn');
    
    if (file) {
      importBtn.disabled = false;
    } else {
      importBtn.disabled = true;
    }
  }

  // Process import data
  async function processImport() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
      alert('Pilih file terlebih dahulu');
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Process and validate data
      const processedData = jsonData.map(row => ({
        unit_kerja_id: findUnitKerjaId(row['Unit Kerja']),
        kategori: row['Kategori'],
        rencana_strategis_id: findRencanaStrategisId(row['Rencana Strategis']),
        objek_analisis: row['Objek Analisis'],
        bobot: parseInt(row['Bobot']),
        rank: parseInt(row['Rank']),
        tahun: parseInt(row['Tahun'])
      }));

      // Import data
      for (const item of processedData) {
        await api()('/api/analisis-swot', {
          method: 'POST',
          body: JSON.stringify(item)
        });
      }

      closeModal('importModal');
      await load();
      alert(`Berhasil mengimport ${processedData.length} data`);
    } catch (error) {
      alert('Error importing data: ' + error.message);
    }
  }

  // Save data function
  async function saveData(event) {
    event.preventDefault();
    
    try {
      const formData = {
        unit_kerja_id: document.getElementById('unitKerja').value,
        kategori: document.getElementById('kategori').value,
        rencana_strategis_id: document.getElementById('rencanaStrategis').value || null,
        objek_analisis: document.getElementById('objekAnalisis').value,
        bobot: parseInt(document.getElementById('bobot').value),
        rank: parseInt(document.getElementById('rank').value),
        tahun: parseInt(document.getElementById('tahun').value)
      };

      if (state.currentEditId) {
        await api()(`/api/analisis-swot/${state.currentEditId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await api()('/api/analisis-swot', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }

      closeModal('dataModal');
      await load();
      alert('Data berhasil disimpan');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  function findUnitKerjaId(unitName) {
    const unit = state.unitKerjaList.find(u => u.name === unitName);
    return unit ? unit.id : null;
  }

  function findRencanaStrategisId(rencanaCode) {
    const rencana = state.rencanaStrategisList.find(r => r.kode === rencanaCode);
    return rencana ? rencana.id : null;
  }

  // Template download
  function downloadTemplate() {
    const templateData = [
      {
        'Unit Kerja': 'Contoh Unit Kerja',
        'Kategori': 'Strength',
        'Rencana Strategis': 'RS-001',
        'Objek Analisis': 'Contoh objek analisis SWOT',
        'Bobot': 20,
        'Rank': 4,
        'Tahun': 2025
      }
    ];

    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Unit Kerja
        { wch: 15 }, // Kategori
        { wch: 20 }, // Rencana Strategis
        { wch: 40 }, // Objek Analisis
        { wch: 10 }, // Bobot
        { wch: 10 }, // Rank
        { wch: 10 }  // Tahun
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Template SWOT');
      XLSX.writeFile(wb, 'Template_Analisis_SWOT.xlsx');
    } else {
      alert('Library XLSX belum dimuat. Silakan refresh halaman.');
    }
  }

  // Show import modal
  function showImportModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">Import Data SWOT</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div style="padding: 1.5rem;">
          <div class="mb-3">
            <label class="form-label">Pilih File Excel</label>
            <input type="file" class="form-control" id="importFile" accept=".xlsx,.xls">
            <small class="text-muted">Format: .xlsx atau .xls. Gunakan template yang telah disediakan.</small>
          </div>
          <div class="d-flex gap-2 justify-content-end">
            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
            <button class="btn btn-primary" onclick="AnalisisSwotModule.processImport()" id="importBtn">
              <i class="fas fa-upload"></i> Import Data
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Show add modal
  function showAddModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
          <h3 class="modal-title">Tambah Data SWOT</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form onsubmit="AnalisisSwotModule.saveData(event)">
          <div style="padding: 1.5rem;">
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Unit Kerja *</label>
                  <select class="form-control" id="unitKerja" required>
                    <option value="">Pilih Unit Kerja</option>
                    ${state.unitKerjaList.map(unit => `<option value="${unit.id}">${unit.name}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Kategori *</label>
                  <select class="form-control" id="kategori" required>
                    <option value="">Pilih Kategori</option>
                    <option value="Strength">Strength</option>
                    <option value="Weakness">Weakness</option>
                    <option value="Opportunity">Opportunity</option>
                    <option value="Threat">Threat</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="mb-3" style="display: none;">
              <label class="form-label">Rencana Strategis (Opsional)</label>
              <select class="form-control" id="rencanaStrategis">
                <option value="">Pilih Rencana Strategis (Opsional)</option>
                ${state.rencanaStrategisList.map(rencana => `<option value="${rencana.id}">${rencana.kode} - ${rencana.nama_rencana}</option>`).join('')}
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Objek Analisis *</label>
              <textarea class="form-control" id="objekAnalisis" required rows="3"></textarea>
            </div>
            <div class="row">
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label">Bobot (0-100) *</label>
                  <input type="number" class="form-control" id="bobot" required min="0" max="100">
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label">Rank (1-5) *</label>
                  <input type="number" class="form-control" id="rank" required min="1" max="5">
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label">Tahun *</label>
                  <input type="number" class="form-control" id="tahun" required value="2025">
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0;">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> Simpan
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Download report
  function downloadReport() {
    if (state.filteredData.length === 0) {
      alert('Tidak ada data untuk diunduh');
      return;
    }

    if (typeof XLSX !== 'undefined') {
      const reportData = state.filteredData.map((item, index) => ({
        'No': index + 1,
        'Unit Kerja': item.unit_kerja_name,
        'Kategori': item.kategori,
        'Rencana Strategis': `${item.rencana_strategis_info.kode} - ${item.rencana_strategis_info.nama}`,
        'Objek Analisis': item.objek_analisis,
        'Bobot': item.bobot,
        'Rank': item.rank,
        'Score': item.score || 0,
        'Tahun': item.tahun,
        'Tanggal Dibuat': new Date(item.created_at).toLocaleDateString('id-ID')
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reportData);

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },  // No
        { wch: 20 }, // Unit Kerja
        { wch: 15 }, // Kategori
        { wch: 30 }, // Rencana Strategis
        { wch: 40 }, // Objek Analisis
        { wch: 10 }, // Bobot
        { wch: 10 }, // Rank
        { wch: 10 }, // Score
        { wch: 10 }, // Tahun
        { wch: 15 }  // Tanggal Dibuat
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Laporan SWOT');
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      XLSX.writeFile(wb, `Laporan_Analisis_SWOT_${timestamp}.xlsx`);
    } else {
      alert('Library XLSX belum dimuat. Silakan refresh halaman.');
    }
  }

  // Edit data
  async function editData(id) {
    try {
      const data = await api()(`/api/analisis-swot/${id}`);
      
      const modal = document.createElement('div');
      modal.className = 'modal active';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
          <div class="modal-header">
            <h3 class="modal-title">Edit Data SWOT</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
          </div>
          <form onsubmit="AnalisisSwotModule.updateData(event, '${id}')">
            <div style="padding: 1.5rem;">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Unit Kerja *</label>
                    <select class="form-control" id="editUnitKerja" required>
                      <option value="">Pilih Unit Kerja</option>
                      ${state.unitKerjaList.map(unit => `<option value="${unit.id}" ${data.unit_kerja_id === unit.id ? 'selected' : ''}>${unit.name}</option>`).join('')}
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Kategori *</label>
                    <select class="form-control" id="editKategori" required>
                      <option value="">Pilih Kategori</option>
                      <option value="Strength" ${data.kategori === 'Strength' ? 'selected' : ''}>Strength</option>
                      <option value="Weakness" ${data.kategori === 'Weakness' ? 'selected' : ''}>Weakness</option>
                      <option value="Opportunity" ${data.kategori === 'Opportunity' ? 'selected' : ''}>Opportunity</option>
                      <option value="Threat" ${data.kategori === 'Threat' ? 'selected' : ''}>Threat</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="mb-3" style="display: none;">
                <label class="form-label">Rencana Strategis (Opsional)</label>
                <select class="form-control" id="editRencanaStrategis">
                  <option value="">Pilih Rencana Strategis (Opsional)</option>
                  ${state.rencanaStrategisList.map(rencana => `<option value="${rencana.id}" ${data.rencana_strategis_id === rencana.id ? 'selected' : ''}>${rencana.kode} - ${rencana.nama_rencana}</option>`).join('')}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Objek Analisis *</label>
                <textarea class="form-control" id="editObjekAnalisis" required rows="3">${data.objek_analisis || ''}</textarea>
              </div>
              <div class="row">
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Bobot (0-100) *</label>
                    <input type="number" class="form-control" id="editBobot" required min="0" max="100" value="${data.bobot || ''}">
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Rank (1-5) *</label>
                    <input type="number" class="form-control" id="editRank" required min="1" max="5" value="${data.rank || ''}">
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Tahun *</label>
                    <input type="number" class="form-control" id="editTahun" required value="${data.tahun || ''}">
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0;">
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Update
              </button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);
    } catch (error) {
      alert('Error loading data: ' + error.message);
    }
  }

  // Delete data
  async function deleteData(id) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    
    try {
      await api()(`/api/analisis-swot/${id}`, { method: 'DELETE' });
      await fetchInitialData();
      populateFilters();
      renderSummaryCards();
      renderTable();
      alert('Data berhasil dihapus');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
})();

// Export functions for compatibility
async function loadAnalisisSwot() {
  await AnalisisSwotModule.load();
}

// Make available globally
window.analisisSwotModule = AnalisisSwotModule;
window.AnalisisSwotModule = AnalisisSwotModule;

console.log('📦 Analisis SWOT Enhanced module loaded and available');

