// Analisis SWOT Module (Updated)
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
          <p class="text-muted mb-0">Analisis SWOT dengan korelasi rencana strategis (kolom kuantitas disembunyikan)</p>
        </div>
        <button class="btn btn-primary" onclick="AnalisisSwotModule.refreshData()">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      <!-- Filter Section -->
      <div class="filter-section" style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e9ecef;">
        <div class="row">
          <div class="col-md-3">
            <label class="form-label" style="font-weight: 600; color: #495057;">Unit Kerja</label>
            <select id="filterUnitKerja" class="form-select" onchange="AnalisisSwotModule.applyFilters()">
              <option value="">Semua Unit Kerja</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label" style="font-weight: 600; color: #495057;">Kategori</label>
            <select id="filterKategori" class="form-select" onchange="AnalisisSwotModule.applyFilters()">
              <option value="">Semua Kategori</option>
              <option value="Strength">Strength</option>
              <option value="Weakness">Weakness</option>
              <option value="Opportunity">Opportunity</option>
              <option value="Threat">Threat</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label" style="font-weight: 600; color: #495057;">Rencana Strategis</label>
            <select id="filterRencanaStrategis" class="form-select" onchange="AnalisisSwotModule.applyFilters()">
              <option value="">Semua Rencana Strategis</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label" style="font-weight: 600; color: #495057;">Tahun</label>
            <select id="filterTahun" class="form-select" onchange="AnalisisSwotModule.applyFilters()">
              <option value="">Semua Tahun</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards" id="summaryCards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px;">
        <!-- Summary cards will be populated here -->
      </div>

      <!-- Data Table -->
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">Data SWOT Analisis</h5>
          <small class="text-muted">Setiap perspektif memiliki 5 data dengan total bobot 100, kolom kuantitas disembunyikan</small>
        </div>
        <div class="card-body">
          <div class="table-container" style="overflow-x: auto; margin-top: 20px;">
            <table class="table table-striped swot-table" id="swotTable" style="min-width: 1200px; font-size: 0.9em;">
              <thead>
                <tr>
                  <th style="background-color: #f8f9fa; font-weight: 600; text-align: center; max-width: 150px;">Unit Kerja</th>
                  <th style="background-color: #f8f9fa; font-weight: 600; text-align: center;">Kategori</th>
                  <th style="background-color: #f8f9fa; font-weight: 600; text-align: center; max-width: 200px;">Rencana Strategis</th>
                  <th style="background-color: #f8f9fa; font-weight: 600; text-align: center; max-width: 300px;">Objek Analisis</th>
                  <th style="background-color: #f8f9fa; font-weight: 600; text-align: center; min-width: 60px;">Bobot</th>
                  <th style="background-color: #f8f9fa; font-weight: 600; text-align: center; min-width: 60px;">Rank</th>
                  <th style="background-color: #f8f9fa; font-weight: 600; text-align: center; min-width: 60px;">Score</th>
                  <th style="background-color: #f8f9fa; font-weight: 600; text-align: center; min-width: 60px;">Tahun</th>
                </tr>
              </thead>
              <tbody id="swotTableBody">
                <tr>
                  <td colspan="8" style="text-align: center; padding: 40px; color: #6c757d;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 1.5em; margin-right: 10px;"></i> Memuat data...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <style>
        /* Hide kuantitas column completely */
        .kuantitas-column,
        .kuantitas-header {
            display: none !important;
        }
        
        /* Category badges */
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
        
        /* Rencana Strategis column styling */
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
        
        .summary-value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
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

    const cardColors = {
      Strength: 'success',
      Weakness: 'danger',
      Opportunity: 'info',
      Threat: 'warning'
    };

    summaryContainer.innerHTML = Object.keys(summary).map(category => `
      <div class="summary-card border-${cardColors[category]}">
        <h5 class="text-${cardColors[category]}">${category}</h5>
        <div class="summary-value text-${cardColors[category]}">${summary[category].count}</div>
        <div class="small text-muted">
          Total Score: ${summary[category].totalScore}<br>
          Total Bobot: ${summary[category].totalBobot}
        </div>
      </div>
    `).join('');
  }

  function renderTable() {
    const tbody = getEl('swotTableBody');
    if (!tbody) return;
    
    if (state.filteredData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: #6c757d;">
            <i class="fas fa-info-circle" style="font-size: 1.5em; margin-right: 10px;"></i> Tidak ada data yang sesuai dengan filter
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = state.filteredData.map(item => `
      <tr>
        <td style="max-width: 150px; word-wrap: break-word; font-weight: 500;">${item.unit_kerja_name}</td>
        <td>
          <span class="badge badge-${item.kategori.toLowerCase()}">${item.kategori}</span>
        </td>
        <td class="rencana-strategis-column" style="max-width: 200px; word-wrap: break-word; font-size: 0.85em;">
          <span class="kode">${item.rencana_strategis_info.kode}</span>
          <span class="nama">${item.rencana_strategis_info.nama}</span>
        </td>
        <td style="max-width: 300px; word-wrap: break-word; line-height: 1.3;">${item.objek_analisis}</td>
        <td style="text-align: center; font-weight: 600; color: #495057;">${item.bobot}</td>
        <td style="text-align: center;">${item.rank}</td>
        <td style="text-align: center; font-weight: 700; color: #495057;">${item.score}</td>
        <td style="text-align: center; font-weight: 500;">${item.tahun}</td>
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
          <td colspan="8" style="text-align: center; padding: 40px; color: #6c757d;">
            <i class="fas fa-spinner fa-spin" style="font-size: 1.5em; margin-right: 10px;"></i> Memuat ulang data...
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
  await AnalisisSwotModule.load();
}

// Make available globally
window.AnalisisSwotModule = AnalisisSwotModule;
window.analisisSwotModule = AnalisisSwotModule;
window.loadAnalisisSwot = loadAnalisisSwot;

console.log('📦 Analisis SWOT module loaded and available');