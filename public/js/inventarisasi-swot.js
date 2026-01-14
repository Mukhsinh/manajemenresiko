// Inventarisasi SWOT Module
const InventarisasiSwotModule = (() => {
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
    isLoading: false
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);
  const getEl = (id) => document.getElementById(id);

  async function load() {
    console.log('=== INVENTARISASI SWOT MODULE LOAD START ===');
    
    if (state.isLoading) {
      console.log('InventarisasiSwotModule: Already loading, skipping...');
      return;
    }
    
    state.isLoading = true;
    
    const container = document.getElementById('inventarisasi-swot-content');
    if (container) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center;">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p style="margin-top: 15px; color: #666;">Memuat data Inventarisasi SWOT...</p>
        </div>
      `;
    }
    
    try {
      console.log('Fetching initial data...');
      await fetchInitialData();
      
      console.log('Rendering interface...');
      render();
      
      console.log('=== INVENTARISASI SWOT MODULE LOAD COMPLETE ===');
    } catch (error) {
      console.error('=== INVENTARISASI SWOT MODULE LOAD ERROR ===', error);
      showError('Terjadi kesalahan saat memuat halaman: ' + error.message);
    } finally {
      state.isLoading = false;
    }
  }

  async function fetchInitialData() {
    try {
      // Load inventarisasi SWOT data
      const swotData = await api()('/api/swot-inventarisasi');
      state.allData = swotData || [];
      state.filteredData = [...state.allData];
      console.log('Inventarisasi SWOT data loaded:', state.allData.length, 'items');
      
      // Load unit kerja data
      const unitKerjaData = await api()('/api/master-data/work-units');
      state.unitKerjaList = unitKerjaData || [];
      
      // Load rencana strategis
      const rencanaStrategisData = await api()('/api/rencana-strategis');
      state.rencanaStrategisList = rencanaStrategisData || [];
      
    } catch (error) {
      console.error('Error fetching initial data:', error);
      throw error;
    }
  }

  function render() {
    const container = document.getElementById('inventarisasi-swot-content');
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-list-check"></i> Inventarisasi SWOT</h3>
          <div class="card-actions">
            <button class="btn btn-primary" onclick="InventarisasiSwotModule.showAddModal()">
              <i class="fas fa-plus"></i> Tambah Data
            </button>
          </div>
        </div>
        <div class="card-body">
          ${renderFilters()}
          ${renderSummaryCards()}
          ${renderTable()}
        </div>
      </div>
    `;
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  function renderFilters() {
    return `
      <div class="filter-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 0.875rem; font-weight: 600;">Unit Kerja</label>
          <select class="form-control" id="filter-inv-unit" onchange="InventarisasiSwotModule.applyFilters()">
            <option value="">Semua Unit Kerja</option>
            ${state.unitKerjaList.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 0.875rem; font-weight: 600;">Kategori</label>
          <select class="form-control" id="filter-inv-kategori" onchange="InventarisasiSwotModule.applyFilters()">
            <option value="">Semua Kategori</option>
            <option value="Kekuatan">Kekuatan (Strength)</option>
            <option value="Kelemahan">Kelemahan (Weakness)</option>
            <option value="Peluang">Peluang (Opportunity)</option>
            <option value="Tantangan">Tantangan (Threat)</option>
          </select>
        </div>
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 0.875rem; font-weight: 600;">Tahun</label>
          <select class="form-control" id="filter-inv-tahun" onchange="InventarisasiSwotModule.applyFilters()">
            <option value="">Semua Tahun</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>
      </div>
    `;
  }

  function renderSummaryCards() {
    const kekuatan = state.filteredData.filter(d => d.kategori === 'Kekuatan').length;
    const kelemahan = state.filteredData.filter(d => d.kategori === 'Kelemahan').length;
    const peluang = state.filteredData.filter(d => d.kategori === 'Peluang').length;
    const tantangan = state.filteredData.filter(d => d.kategori === 'Tantangan').length;

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 1.5rem; border-radius: 8px; color: white;">
          <div style="font-size: 2rem; font-weight: bold;">${kekuatan}</div>
          <div style="font-size: 0.875rem; opacity: 0.9;">Kekuatan (S)</div>
        </div>
        <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 1.5rem; border-radius: 8px; color: white;">
          <div style="font-size: 2rem; font-weight: bold;">${kelemahan}</div>
          <div style="font-size: 0.875rem; opacity: 0.9;">Kelemahan (W)</div>
        </div>
        <div style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); padding: 1.5rem; border-radius: 8px; color: white;">
          <div style="font-size: 2rem; font-weight: bold;">${peluang}</div>
          <div style="font-size: 0.875rem; opacity: 0.9;">Peluang (O)</div>
        </div>
        <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); padding: 1.5rem; border-radius: 8px; color: white;">
          <div style="font-size: 2rem; font-weight: bold;">${tantangan}</div>
          <div style="font-size: 0.875rem; opacity: 0.9;">Tantangan (T)</div>
        </div>
      </div>
    `;
  }

  function renderTable() {
    if (state.filteredData.length === 0) {
      return `
        <div style="text-align: center; padding: 2rem; color: #999;">
          <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem;"></i>
          <p>Tidak ada data inventarisasi SWOT.</p>
          <button class="btn btn-primary" onclick="InventarisasiSwotModule.showAddModal()">
            <i class="fas fa-plus"></i> Tambah Data Pertama
          </button>
        </div>
      `;
    }

    return `
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>No</th>
              <th>Unit Kerja</th>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Tahun</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${state.filteredData.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.master_work_units?.name || '-'}</td>
                <td><span class="badge ${getBadgeClass(item.kategori)}">${item.kategori}</span></td>
                <td>${item.deskripsi || '-'}</td>
                <td>${item.tahun || '-'}</td>
                <td>
                  <button class="btn btn-sm btn-info" onclick="InventarisasiSwotModule.editData('${item.id}')">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="InventarisasiSwotModule.deleteData('${item.id}')">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function getBadgeClass(kategori) {
    const classes = {
      'Kekuatan': 'badge-success',
      'Kelemahan': 'badge-danger',
      'Peluang': 'badge-info',
      'Tantangan': 'badge-warning'
    };
    return classes[kategori] || 'badge-secondary';
  }

  function applyFilters() {
    const unitKerja = getEl('filter-inv-unit')?.value || '';
    const kategori = getEl('filter-inv-kategori')?.value || '';
    const tahun = getEl('filter-inv-tahun')?.value || '';

    state.filteredData = state.allData.filter(item => {
      if (unitKerja && item.unit_kerja_id !== unitKerja) return false;
      if (kategori && item.kategori !== kategori) return false;
      if (tahun && item.tahun !== parseInt(tahun)) return false;
      return true;
    });

    render();
  }

  function showAddModal() {
    alert('Fitur tambah data akan segera tersedia');
  }

  function editData(id) {
    alert('Fitur edit data akan segera tersedia');
  }

  async function deleteData(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    
    try {
      await api()(`/api/swot-inventarisasi/${id}`, { method: 'DELETE' });
      await fetchInitialData();
      render();
      alert('Data berhasil dihapus');
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message);
    }
  }

  function showError(message) {
    const container = document.getElementById('inventarisasi-swot-content');
    if (container) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #e74c3c;">
          <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
          <h3>Error Loading Data</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="InventarisasiSwotModule.load()" style="margin-top: 15px;">
            <i class="fas fa-sync"></i> Coba Lagi
          </button>
        </div>
      `;
    }
  }

  return {
    load,
    applyFilters,
    showAddModal,
    editData,
    deleteData
  };
})();

// Export globally
window.InventarisasiSwotModule = InventarisasiSwotModule;
window.inventarisasiSwotModule = InventarisasiSwotModule;

console.log('📦 Inventarisasi SWOT module loaded and available');
