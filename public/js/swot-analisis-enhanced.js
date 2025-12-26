// SWOT Analisis Enhanced Module
const SwotAnalisisEnhancedModule = (() => {
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
    console.log('=== SWOT ANALISIS ENHANCED MODULE LOAD START ===');
    
    // Check if page is active before loading
    const swotPage = document.getElementById('analisis-swot');
    if (!swotPage || !swotPage.classList.contains('active')) {
      console.warn('⚠️ SWOT Analisis page not active, aborting load');
      return;
    }
    
    try {
      console.log('Fetching initial data...');
      await fetchInitialData();
      
      console.log('Rendering enhanced interface...');
      render();
      
      console.log('=== SWOT ANALISIS ENHANCED MODULE LOAD COMPLETE ===');
    } catch (error) {
      console.error('=== SWOT ANALISIS ENHANCED MODULE LOAD ERROR ===', error);
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
          <h3 class="card-title mb-1"><i data-lucide="bar-chart-3"></i> SWOT Analisis Enhanced</h3>
          <p class="text-muted mb-0">Analisis SWOT dengan korelasi rencana strategis dan total score per kategori</p>
        </div>
        <button class="btn btn-primary" onclick="SwotAnalisisEnhancedModule.refreshData()">
          <i data-lucide="refresh-cw"></i> Refresh
        </button>
      </div>

      <!-- Filter Section -->
      <div class="filter-section">
        <div class="row">
          <div class="col-md-3">
            <label class="form-label">Unit Kerja</label>
            <select id="filterUnitKerja" class="form-select" onchange="SwotAnalisisEnhancedModule.applyFilters()">
              <option value="">Semua Unit Kerja</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Kategori</label>
            <select id="filterKategori" class="form-select" onchange="SwotAnalisisEnhancedModule.applyFilters()">
              <option value="">Semua Kategori</option>
              <option value="Strength">Strength</option>
              <option value="Weakness">Weakness</option>
              <option value="Opportunity">Opportunity</option>
              <option value="Threat">Threat</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Rencana Strategis</label>
            <select id="filterRencanaStrategis" class="form-select" onchange="SwotAnalisisEnhancedModule.applyFilters()">
              <option value="">Semua Rencana Strategis</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Tahun</label>
            <select id="filterTahun" class="form-select" onchange="SwotAnalisisEnhancedModule.applyFilters()">
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
          <h5 class="mb-0">Data SWOT Analisis</h5>
          <small class="text-muted">Setiap perspektif memiliki 5 data dengan total bobot 100 (kelipatan 5)</small>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table class="table table-striped swot-table" id="swotTable">
              <thead>
                <tr>
                  <th class="unit-kerja-column">Unit Kerja</th>
                  <th class="kategori-column">Kategori (Perspektif)</th>
                  <th class="rencana-strategis-column">Rencana Strategis</th>
                  <th class="objek-analisis-column">Objek Analisis</th>
                  <th class="bobot-column">Bobot</th>
                  <th class="rank-column">Rank</th>
                  <th class="score-column">Score</th>
                  <th class="tahun-column">Tahun</th>
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
    `;

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    populateFilters();
    renderSummaryCards();
    renderTable();
  }

  function populateFilters() {
    // Populate Unit Kerja filter
    const unitKerjaSelect = getEl('filterUnitKerja');
    if (unitKerjaSelect) {
      unitKerjaSelect.innerHTML = '<option value="">Semua Unit Kerja</option>';
      
      const uniqueUnits = [...new Set(state.allData.map(item => item.unit_kerja_id))];
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

  function renderSummaryCards() {
    const summaryContainer = getEl('summaryCards');
    if (!summaryContainer) return;
    
    // Calculate summary by category
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
      
      return `
        <div class="summary-card ${config.class}">
          <div class="card-icon">
            <i data-lucide="${config.icon}"></i>
          </div>
          <div class="card-title">${config.title}</div>
          <div class="card-value">${data.totalScore}</div>
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
      </tr>
    `).join('');
  }

  function showError(message) {
    const container = getEl('analisis-swot-content');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger" role="alert">
          <h4><i class="fas fa-exclamation-triangle"></i> Error Loading SWOT Analisis</h4>
          <p>${message}</p>
          <button onclick="SwotAnalisisEnhancedModule.load()" class="btn btn-primary">
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
  await SwotAnalisisEnhancedModule.load();
}

// Make available globally
window.SwotAnalisisEnhancedModule = SwotAnalisisEnhancedModule;
window.swotAnalisisEnhancedModule = SwotAnalisisEnhancedModule;
window.loadAnalisisSwot = loadAnalisisSwot;

console.log('📦 SWOT Analisis Enhanced module loaded and available');