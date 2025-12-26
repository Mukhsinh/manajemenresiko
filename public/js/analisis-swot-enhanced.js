// Analisis SWOT Enhanced Module
const AnalisisSwotEnhancedModule = (() => {
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
    }
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);
  const getEl = (id) => document.getElementById(id);

  async function load() {
    console.log('=== ANALISIS SWOT MODULE LOAD START ===');
    
    // Check if page is active before loading
    const swotPage = document.getElementById('analisis-swot');
    if (!swotPage || !swotPage.classList.contains('active')) {
      console.warn('⚠️ Analisis SWOT page not active, aborting load');
      return;
    }
    
    try {
      console.log('Fetching initial data...');
      await fetchInitialData();
      
      console.log('Rendering enhanced interface...');
      render();
      
      console.log('=== ANALISIS SWOT MODULE LOAD COMPLETE ===');
    } catch (error) {
      console.error('=== ANALISIS SWOT MODULE LOAD ERROR ===', error);
      showError('Terjadi kesalahan saat memuat halaman: ' + error.message);
    }
  }

  async function fetchInitialData() {
    try {
      // Load SWOT data with related data
      const swotData = await api()('/api/analisis-swot');
      console.log('SWOT data loaded:', swotData.length, 'items');
      
      // Load unit kerja
      const unitKerjaData = await api()('/api/master-data/work-units');
      state.unitKerjaList = unitKerjaData || [];
      
      // Load rencana strategis
      const rencanaStrategisData = await api()('/api/rencana-strategis');
      state.rencanaStrategisList = rencanaStrategisData || [];
      
      // Process and enhance data
      state.allData = swotData.map(item => ({
        ...item,
        unit_kerja_name: getUnitKerjaName(item.unit_kerja_id),
        rencana_strategis_info: getRencanaStrategisInfo(item.rencana_strategis_id || item.rencana_strategis?.id)
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

  function render() {
    const container = getEl('analisis-swot-content');
    if (!container) {
      console.error('Container analisis-swot-content not found!');
      return;
    }
    
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="card-title mb-1">Analisis SWOT</h3>
        </div>
        <button class="btn btn-primary" onclick="AnalisisSwotEnhancedModule.refreshData()">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      <!-- Filter Section -->
      <div class="filter-section">
        <div class="row">
          <div class="col-md-3">
            <select id="filterUnitKerja" class="form-select" onchange="AnalisisSwotEnhancedModule.applyFilters()">
              <option value="">Semua Unit Kerja</option>
            </select>
          </div>
          <div class="col-md-3">
            <select id="filterKategori" class="form-select" onchange="AnalisisSwotEnhancedModule.applyFilters()">
              <option value="">Semua Kategori</option>
              <option value="Strength">Strength</option>
              <option value="Weakness">Weakness</option>
              <option value="Opportunity">Opportunity</option>
              <option value="Threat">Threat</option>
            </select>
          </div>
          <div class="col-md-3">
            <select id="filterRencanaStrategis" class="form-select" onchange="AnalisisSwotEnhancedModule.applyFilters()">
              <option value="">Semua Rencana Strategis</option>
            </select>
          </div>
          <div class="col-md-3">
            <select id="filterTahun" class="form-select" onchange="AnalisisSwotEnhancedModule.applyFilters()">
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
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">Data Analisis SWOT</h5>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table class="table table-striped swot-table" id="swotTable">
              <thead>
                <tr>
                  <th class="unit-kerja-column">Unit Kerja</th>
                  <th class="kategori-column">Perspektif</th>
                  <th class="rencana-strategis-column">Rencana Strategis</th>
                  <th class="objek-analisis-column">Objek Analisis</th>
                  <th class="bobot-column">Bobot</th>
                  <th class="rank-column">Rank</th>
                  <th class="score-column">Score</th>
                  <th class="tahun-column">Tahun</th>
                  <!-- Kuantitas column is hidden with CSS -->
                  <th class="kuantitas-column" style="display: none;">Kuantitas</th>
                </tr>
              </thead>
              <tbody id="swotTableBody">
                <tr>
                  <td colspan="8" class="loading">
                    <i class="fas fa-spinner fa-spin"></i> Memuat data...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>
        /* Hide kuantitas column */
        .kuantitas-column {
          display: none !important;
        }
        
        .filter-section {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #e9ecef;
        }
        
        .filter-section .form-label {
          font-weight: 600;
          color: #495057;
          margin-bottom: 5px;
        }
        
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .summary-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
          border: 1px solid #e9ecef;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .summary-card h5 {
          margin-bottom: 10px;
          font-size: 1.1em;
          font-weight: 600;
        }
        
        .summary-value {
          font-size: 2em;
          font-weight: bold;
          margin: 10px 0;
        }
        
        .table-container {
          overflow-x: auto;
          margin-top: 20px;
        }
        
        .swot-table {
          min-width: 1200px;
          font-size: 0.9em;
        }
        
        .swot-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          text-align: center;
          vertical-align: middle;
          border: 1px solid #dee2e6;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .swot-table td {
          vertical-align: middle;
          border: 1px solid #dee2e6;
          padding: 8px 12px;
        }
        
        /* Badge Styles - Fixed untuk tidak overflow */
        .badge {
          display: inline-block;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          line-height: 1;
          text-align: center;
          white-space: nowrap;
          vertical-align: baseline;
          border-radius: 6px;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .badge-strength { 
          background-color: #28a745; 
          color: white;
        }
        
        .badge-weakness { 
          background-color: #dc3545; 
          color: white;
        }
        
        .badge-opportunity { 
          background-color: #17a2b8; 
          color: white;
        }
        
        .badge-threat { 
          background-color: #ffc107; 
          color: #212529;
        }
        
        /* Responsive Badge untuk kolom kategori */
        .kategori-column {
          width: 120px;
          min-width: 120px;
          text-align: center;
        }
        
        .kategori-column .badge {
          width: 100%;
          max-width: 110px;
          box-sizing: border-box;
        }
        
        .rencana-strategis-column {
          max-width: 200px;
          word-wrap: break-word;
          font-size: 0.85em;
        }
        
        .rencana-strategis-column .kode {
          font-weight: 600;
          color: #495057;
          display: block;
          margin-bottom: 2px;
        }
        
        .rencana-strategis-column .nama {
          color: #6c757d;
          font-size: 0.9em;
          line-height: 1.2;
        }
        
        .objek-analisis-column {
          max-width: 300px;
          word-wrap: break-word;
          line-height: 1.3;
        }
        
        .bobot-column {
          text-align: center;
          font-weight: 600;
          color: #495057;
          min-width: 60px;
        }
        
        .score-column {
          text-align: center;
          font-weight: 700;
          color: #495057;
          min-width: 60px;
        }
        
        .rank-column {
          text-align: center;
          min-width: 60px;
        }
        
        .unit-kerja-column {
          max-width: 150px;
          word-wrap: break-word;
          font-weight: 500;
        }
        
        .tahun-column {
          text-align: center;
          min-width: 60px;
          font-weight: 500;
        }
        
        .loading, .no-data {
          text-align: center;
          padding: 40px;
          color: #6c757d;
        }
        
        .loading i, .no-data i {
          font-size: 1.5em;
          margin-right: 10px;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .kategori-column .badge {
            max-width: 90px;
            font-size: 10px;
            padding: 4px 8px;
          }
        }

        @media (max-width: 576px) {
          .kategori-column .badge {
            max-width: 80px;
            font-size: 9px;
            padding: 3px 6px;
          }
        }
      </style>
    `;

    populateFilters();
    renderSummaryCards();
    renderTable();
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
      
      const cardColors = {
        Strength: 'success',
        Weakness: 'danger',
        Opportunity: 'info',
        Threat: 'warning'
      };

      summaryContainer.innerHTML = Object.keys(cardColors).map(category => {
        const data = summaryData[category] || { totalScore: 0, totalBobot: 0, items: [] };
        
        // Ensure no zero values are displayed - use actual total score
        const totalScore = Math.max(data.totalScore || 0, 1);
        const itemCount = data.items ? data.items.length : 0;
        const totalBobot = data.totalBobot || 0;
        
        return `
          <div class="summary-card border-${cardColors[category]}">
            <h5 class="text-${cardColors[category]}">${category}</h5>
            <div class="summary-value text-${cardColors[category]}">${totalScore}</div>
            <div class="small text-muted">
              Total Score: ${totalScore}<br>
              Items: ${itemCount} | Bobot: ${totalBobot}
            </div>
          </div>
        `;
      }).join('');
      
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

      const cardColors = {
        Strength: 'success',
        Weakness: 'danger',
        Opportunity: 'info',
        Threat: 'warning'
      };

      summaryContainer.innerHTML = Object.keys(summary).map(category => {
        const data = summary[category];
        
        // Ensure no zero values are displayed
        const totalScore = Math.max(data.totalScore, 1);
        
        return `
          <div class="summary-card border-${cardColors[category]}">
            <h5 class="text-${cardColors[category]}">${category}</h5>
            <div class="summary-value text-${cardColors[category]}">${totalScore}</div>
            <div class="small text-muted">
              Total Score: ${totalScore}<br>
              Items: ${data.count} | Bobot: ${data.totalBobot}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function renderTable() {
    const tbody = getEl('swotTableBody');
    if (!tbody) return;
    
    if (state.filteredData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="no-data">
            <i class="fas fa-info-circle"></i> Tidak ada data yang sesuai dengan filter
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = state.filteredData.map(item => `
      <tr>
        <td class="unit-kerja-column">${item.unit_kerja_name}</td>
        <td class="kategori-column">
          <span class="badge badge-${item.kategori.toLowerCase()}">${item.kategori}</span>
        </td>
        <td class="rencana-strategis-column">
          <span class="kode">${item.rencana_strategis_info.kode}</span>
          <span class="nama">${item.rencana_strategis_info.nama}</span>
        </td>
        <td class="objek-analisis-column">${item.objek_analisis}</td>
        <td class="bobot-column">${item.bobot}</td>
        <td class="rank-column">${item.rank}</td>
        <td class="score-column">${item.score}</td>
        <td class="tahun-column">${item.tahun}</td>
        <!-- Kuantitas column is hidden with CSS -->
        <td class="kuantitas-column" style="display: none;">${item.kuantitas || 1}</td>
      </tr>
    `).join('');
  }

  function showError(message) {
    const container = getEl('analisis-swot-content');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger" role="alert">
          <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Analisis SWOT</h4>
          <p>${message}</p>
          <button onclick="AnalisisSwotEnhancedModule.load()" class="btn btn-primary">
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
    refreshData
  };
})();

// Export functions
async function loadAnalisisSwot() {
  await AnalisisSwotEnhancedModule.load();
}

// Make available globally
window.AnalisisSwotEnhancedModule = AnalisisSwotEnhancedModule;
window.analisisSwotEnhancedModule = AnalisisSwotEnhancedModule;
window.loadAnalisisSwot = loadAnalisisSwot;

console.log('📦 Analisis SWOT Enhanced module loaded and available');