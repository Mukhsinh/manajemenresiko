/**
 * RENCANA STRATEGIS MODULE v6.0-ENHANCED
 * 
 * FEATURES:
 * 1. Statistics Cards + Data Table + Form
 * 2. WORKING FILTER: Status, Tahun, Search
 * 3. Instant load without refresh
 * 4. Page isolation - content only on RS page
 * 
 * Updated: 2026-01-09
 */

const RencanaStrategisModule = (() => {
  const MODULE_VERSION = '6.0-ENHANCED';
  const state = {
    data: [],
    filteredData: [],
    missions: [],
    currentId: null,
    formValues: {},
    isLoading: false,
    isInitialized: false,
    showForm: true,
    filters: {
      status: '',
      tahun: '',
      search: ''
    }
  };

  const getEl = (id) => document.getElementById(id);
  
  // API helper
  const api = () => {
    if (window.apiCall) return window.apiCall;
    if (window.app?.apiCall) return window.app.apiCall;
    return async (endpoint, options = {}) => {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      };
      const response = await fetch(endpoint, { ...options, headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    };
  };

  function getDefaultForm() {
    return { kode: '', visi_misi_id: '', nama_rencana: '', deskripsi: '', periode_mulai: '', periode_selesai: '', target: '', status: 'Draft' };
  }

  // Check if on RS page
  function isOnRSPage() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const rsPage = getEl('rencana-strategis');
    return path === '/rencana-strategis' || 
           path.includes('/rencana-strategis') ||
           hash === '#rencana-strategis' ||
           (rsPage && rsPage.classList.contains('active'));
  }

  // Main load function - instant without refresh
  async function load() {
    if (!isOnRSPage()) {
      console.log('⚠️ Not on RS page, skipping load');
      return;
    }
    
    if (state.isLoading) return;
    
    console.log(`🚀 Loading Rencana Strategis Module v${MODULE_VERSION}...`);
    state.isLoading = true;

    const container = getEl('rencana-strategis-content');
    if (!container) {
      console.error('❌ Container not found');
      state.isLoading = false;
      return;
    }

    // Show loading
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3 text-muted">Memuat data...</p></div>';

    try {
      await fetchData();
      state.formValues = getDefaultForm();
      await generateKode();
      applyFilters();
      renderInterface();
      state.isInitialized = true;
      console.log(`✅ Module v${MODULE_VERSION} loaded`);
    } catch (error) {
      console.error('❌ Error:', error);
      showError(error.message);
    } finally {
      state.isLoading = false;
    }
  }

  async function fetchData() {
    try {
      const apiFunc = api();
      const [rencanaRes, visiRes] = await Promise.allSettled([
        apiFunc('/api/rencana-strategis').catch(() => []),
        apiFunc('/api/visi-misi').catch(() => [])
      ]);
      
      state.data = rencanaRes.status === 'fulfilled' ? 
        (Array.isArray(rencanaRes.value) ? rencanaRes.value : (rencanaRes.value?.data || [])) : [];
      state.missions = visiRes.status === 'fulfilled' ? 
        (Array.isArray(visiRes.value) ? visiRes.value : (visiRes.value?.data || [])) : [];
      state.filteredData = [...state.data];
      
      console.log('📊 Data loaded:', { rencana: state.data.length, visi: state.missions.length });
    } catch (error) {
      console.error('Error fetching:', error);
      state.data = [];
      state.filteredData = [];
      state.missions = [];
    }
  }

  // FILTER FUNCTIONS
  function applyFilters() {
    const { status, tahun, search } = state.filters;
    
    state.filteredData = state.data.filter(item => {
      // Status filter
      if (status && item.status !== status) return false;
      
      // Tahun filter (from periode_mulai or periode_selesai)
      if (tahun) {
        const itemYear = item.periode_mulai ? new Date(item.periode_mulai).getFullYear().toString() : '';
        if (itemYear !== tahun) return false;
      }
      
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchKode = (item.kode || '').toLowerCase().includes(searchLower);
        const matchNama = (item.nama_rencana || '').toLowerCase().includes(searchLower);
        const matchDeskripsi = (item.deskripsi || '').toLowerCase().includes(searchLower);
        if (!matchKode && !matchNama && !matchDeskripsi) return false;
      }
      
      return true;
    });
    
    console.log(`🔍 Filtered: ${state.filteredData.length}/${state.data.length} items`);
  }

  function handleFilterChange(filterType, value) {
    state.filters[filterType] = value;
    applyFilters();
    renderTableOnly();
  }

  function clearFilters() {
    state.filters = { status: '', tahun: '', search: '' };
    applyFilters();
    renderInterface();
  }

  // Get unique years from data
  function getAvailableYears() {
    const years = new Set();
    state.data.forEach(item => {
      if (item.periode_mulai) {
        years.add(new Date(item.periode_mulai).getFullYear());
      }
      if (item.periode_selesai) {
        years.add(new Date(item.periode_selesai).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }

  function renderInterface() {
    const container = getEl('rencana-strategis-content');
    if (!container) return;

    const html = `
      <div class="rencana-strategis-wrapper p-3">
        ${renderStatCards()}
        ${renderFilterSection()}
        ${renderFormCard()}
        ${renderTableCard()}
      </div>
    `;

    container.innerHTML = html;
    bindEvents();
    console.log('✅ Interface rendered with filters');
  }

  function renderTableOnly() {
    const tableBody = getEl('rs-table-body');
    if (tableBody) {
      tableBody.innerHTML = renderTableRows();
      updateResultCount();
    }
  }

  function updateResultCount() {
    const countEl = getEl('rs-result-count');
    if (countEl) {
      countEl.textContent = `Menampilkan ${state.filteredData.length} dari ${state.data.length} data`;
    }
  }

  function renderStatCards() {
    const aktif = state.data.filter(i => i.status === 'Aktif').length;
    const draft = state.data.filter(i => i.status === 'Draft').length;
    const selesai = state.data.filter(i => i.status === 'Selesai').length;
    const total = state.data.length;

    return `
      <div class="row g-3 mb-4">
        <div class="col-xl-3 col-md-6 col-sm-6">
          <div class="card h-100 border-0 shadow-sm" style="border-radius: 12px; cursor: pointer;" onclick="RencanaStrategisModule.filterByStatus('Aktif')">
            <div class="card-body p-0">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 80px; height: 100px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
                  <i class="fas fa-check-circle fa-2x text-white"></i>
                </div>
                <div class="flex-grow-1 p-3">
                  <h3 class="fw-bold text-success mb-0">${aktif}</h3>
                  <p class="text-muted mb-0 small">Rencana Aktif</p>
                  <small class="text-success"><i class="fas fa-arrow-up me-1"></i>Sedang berjalan</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6 col-sm-6">
          <div class="card h-100 border-0 shadow-sm" style="border-radius: 12px; cursor: pointer;" onclick="RencanaStrategisModule.filterByStatus('Draft')">
            <div class="card-body p-0">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 80px; height: 100px; background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);">
                  <i class="fas fa-edit fa-2x text-white"></i>
                </div>
                <div class="flex-grow-1 p-3">
                  <h3 class="fw-bold text-warning mb-0">${draft}</h3>
                  <p class="text-muted mb-0 small">Draft</p>
                  <small class="text-warning"><i class="fas fa-clock me-1"></i>Menunggu review</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6 col-sm-6">
          <div class="card h-100 border-0 shadow-sm" style="border-radius: 12px; cursor: pointer;" onclick="RencanaStrategisModule.filterByStatus('Selesai')">
            <div class="card-body p-0">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 80px; height: 100px; background: linear-gradient(135deg, #007bff 0%, #6f42c1 100%);">
                  <i class="fas fa-flag-checkered fa-2x text-white"></i>
                </div>
                <div class="flex-grow-1 p-3">
                  <h3 class="fw-bold text-primary mb-0">${selesai}</h3>
                  <p class="text-muted mb-0 small">Selesai</p>
                  <small class="text-primary"><i class="fas fa-trophy me-1"></i>Tercapai</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6 col-sm-6">
          <div class="card h-100 border-0 shadow-sm" style="border-radius: 12px; cursor: pointer;" onclick="RencanaStrategisModule.clearFilters()">
            <div class="card-body p-0">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 80px; height: 100px; background: linear-gradient(135deg, #6c757d 0%, #495057 100%);">
                  <i class="fas fa-list-alt fa-2x text-white"></i>
                </div>
                <div class="flex-grow-1 p-3">
                  <h3 class="fw-bold text-secondary mb-0">${total}</h3>
                  <p class="text-muted mb-0 small">Total Rencana</p>
                  <small class="text-secondary"><i class="fas fa-database me-1"></i>Semua data</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // NEW: Filter Section
  function renderFilterSection() {
    const years = getAvailableYears();
    const yearOptions = years.map(y => `<option value="${y}" ${state.filters.tahun === y.toString() ? 'selected' : ''}>${y}</option>`).join('');
    
    return `
      <div class="card mb-4 shadow-sm border-0" style="border-radius: 12px;">
        <div class="card-body py-3">
          <div class="row g-3 align-items-end">
            <div class="col-md-3 col-sm-6">
              <label class="form-label small fw-semibold text-muted mb-1">
                <i class="fas fa-search me-1"></i>Pencarian
              </label>
              <input type="text" class="form-control" id="rs-filter-search" 
                     placeholder="Cari kode, nama, deskripsi..." 
                     value="${state.filters.search}"
                     onkeyup="RencanaStrategisModule.handleFilterChange('search', this.value)">
            </div>
            <div class="col-md-2 col-sm-6">
              <label class="form-label small fw-semibold text-muted mb-1">
                <i class="fas fa-flag me-1"></i>Status
              </label>
              <select class="form-select" id="rs-filter-status" onchange="RencanaStrategisModule.handleFilterChange('status', this.value)">
                <option value="">Semua Status</option>
                <option value="Aktif" ${state.filters.status === 'Aktif' ? 'selected' : ''}>✅ Aktif</option>
                <option value="Draft" ${state.filters.status === 'Draft' ? 'selected' : ''}>📝 Draft</option>
                <option value="Selesai" ${state.filters.status === 'Selesai' ? 'selected' : ''}>🏁 Selesai</option>
              </select>
            </div>
            <div class="col-md-2 col-sm-6">
              <label class="form-label small fw-semibold text-muted mb-1">
                <i class="fas fa-calendar me-1"></i>Tahun
              </label>
              <select class="form-select" id="rs-filter-tahun" onchange="RencanaStrategisModule.handleFilterChange('tahun', this.value)">
                <option value="">Semua Tahun</option>
                ${yearOptions}
              </select>
            </div>
            <div class="col-md-3 col-sm-6">
              <div class="d-flex gap-2">
                <button class="btn btn-outline-secondary btn-sm" onclick="RencanaStrategisModule.clearFilters()" title="Reset Filter">
                  <i class="fas fa-times me-1"></i>Reset
                </button>
                <button class="btn btn-primary btn-sm" onclick="RencanaStrategisModule.refreshData()" title="Refresh Data">
                  <i class="fas fa-sync-alt me-1"></i>Refresh
                </button>
              </div>
            </div>
            <div class="col-md-2 col-sm-12 text-end">
              <small class="text-muted" id="rs-result-count">Menampilkan ${state.filteredData.length} dari ${state.data.length} data</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderFormCard() {
    const f = state.formValues;
    const isEdit = !!state.currentId;
    const isCollapsed = !state.showForm;
    
    return `
      <div class="card mb-4 shadow-sm border-0" id="rs-form-section" style="border-radius: 12px;">
        <div class="card-header text-white d-flex justify-content-between align-items-center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
          <h5 class="mb-0"><i class="fas fa-${isEdit ? 'edit' : 'plus-circle'} me-2"></i>${isEdit ? 'Edit Rencana Strategis' : 'Form Input Rencana Strategis'}</h5>
          <button type="button" class="btn btn-light btn-sm" id="rs-toggle-form">
            <i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}"></i>
          </button>
        </div>
        <div class="card-body${isCollapsed ? ' d-none' : ''}" id="rs-form-body">
          <form id="rs-form">
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label fw-semibold"><i class="fas fa-barcode me-1 text-primary"></i> Kode</label>
                <input type="text" class="form-control bg-light" id="rs-kode" value="${f.kode || ''}" readonly>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-semibold"><i class="fas fa-flag me-1 text-warning"></i> Status</label>
                <select class="form-select" id="rs-status">
                  <option value="Draft" ${f.status === 'Draft' ? 'selected' : ''}>📝 Draft</option>
                  <option value="Aktif" ${f.status === 'Aktif' ? 'selected' : ''}>✅ Aktif</option>
                  <option value="Selesai" ${f.status === 'Selesai' ? 'selected' : ''}>🏁 Selesai</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold"><i class="fas fa-bullseye me-1 text-success"></i> Misi Terkait</label>
                <select class="form-select" id="rs-misi">
                  <option value="">-- Pilih Misi --</option>
                  ${renderMissionOptions()}
                </select>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold"><i class="fas fa-file-alt me-1 text-info"></i> Nama Rencana Strategis <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-lg" id="rs-nama" value="${f.nama_rencana || ''}" placeholder="Masukkan nama rencana strategis..." required>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold"><i class="fas fa-calendar-alt me-1 text-primary"></i> Periode Mulai</label>
                <input type="date" class="form-control" id="rs-mulai" value="${f.periode_mulai || ''}">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold"><i class="fas fa-calendar-check me-1 text-success"></i> Periode Selesai</label>
                <input type="date" class="form-control" id="rs-selesai" value="${f.periode_selesai || ''}">
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold"><i class="fas fa-align-left me-1 text-secondary"></i> Deskripsi</label>
                <textarea class="form-control" id="rs-deskripsi" rows="3" placeholder="Masukkan deskripsi...">${f.deskripsi || ''}</textarea>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold"><i class="fas fa-crosshairs me-1 text-danger"></i> Target</label>
                <textarea class="form-control" id="rs-target" rows="2" placeholder="Masukkan target...">${f.target || ''}</textarea>
              </div>
              <div class="col-12 pt-3 border-top">
                <div class="d-flex gap-2 flex-wrap">
                  <button type="submit" class="btn btn-primary btn-lg"><i class="fas fa-save me-2"></i>${isEdit ? 'Update' : 'Simpan'}</button>
                  <button type="button" class="btn btn-outline-secondary" id="rs-reset-btn"><i class="fas fa-undo me-2"></i>Reset</button>
                  ${isEdit ? '<button type="button" class="btn btn-outline-danger" id="rs-cancel-edit"><i class="fas fa-times me-2"></i>Batal</button>' : ''}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderTableCard() {
    return `
      <div class="card shadow-sm border-0" style="border-radius: 12px;">
        <div class="card-header bg-white d-flex justify-content-between align-items-center py-3 flex-wrap gap-2" style="border-radius: 12px 12px 0 0;">
          <div>
            <h5 class="mb-0"><i class="fas fa-table text-primary me-2"></i>Daftar Rencana Strategis</h5>
            <small class="text-muted">Kelola semua rencana strategis organisasi</small>
          </div>
          <div class="btn-group">
            <button class="btn btn-outline-success" id="rs-export-btn" title="Export ke Excel"><i class="fas fa-file-excel me-1"></i>Export</button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <tr>
                  <th class="border-0 py-3" style="width: 120px;"><i class="fas fa-barcode me-1 text-muted"></i>Kode</th>
                  <th class="border-0 py-3"><i class="fas fa-file-alt me-1 text-muted"></i>Nama Rencana</th>
                  <th class="border-0 py-3" style="width: 150px;"><i class="fas fa-crosshairs me-1 text-muted"></i>Target</th>
                  <th class="border-0 py-3" style="width: 180px;"><i class="fas fa-calendar me-1 text-muted"></i>Periode</th>
                  <th class="border-0 py-3" style="width: 100px;"><i class="fas fa-flag me-1 text-muted"></i>Status</th>
                  <th class="border-0 py-3 text-center" style="width: 140px;"><i class="fas fa-cogs me-1 text-muted"></i>Aksi</th>
                </tr>
              </thead>
              <tbody id="rs-table-body">${renderTableRows()}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderTableRows() {
    if (!state.filteredData || state.filteredData.length === 0) {
      return `
        <tr>
          <td colspan="6" class="text-center py-5 border-0">
            <div class="py-4">
              <div class="mb-3" style="width: 80px; height: 80px; margin: 0 auto; background: #f8f9fa; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-inbox fa-2x text-muted"></i>
              </div>
              <h5 class="text-muted mb-2">${state.data.length === 0 ? 'Belum Ada Data' : 'Tidak Ada Data yang Cocok'}</h5>
              <p class="text-muted mb-3">${state.data.length === 0 ? 'Silakan isi form untuk menambahkan data baru' : 'Coba ubah filter pencarian Anda'}</p>
              ${state.data.length === 0 ? '<button class="btn btn-primary" onclick="RencanaStrategisModule.showAddForm()"><i class="fas fa-plus me-2"></i>Tambah Data</button>' : '<button class="btn btn-outline-secondary" onclick="RencanaStrategisModule.clearFilters()"><i class="fas fa-times me-2"></i>Reset Filter</button>'}
            </div>
          </td>
        </tr>
      `;
    }

    return state.filteredData.map((item, index) => {
      const statusBadge = getStatusBadge(item.status);
      const periode = formatPeriode(item.periode_mulai, item.periode_selesai);
      const rowBg = index % 2 === 0 ? '' : 'style="background-color: #fafbfc;"';
      
      return `
        <tr ${rowBg}>
          <td class="align-middle"><span class="badge bg-light text-dark border fw-normal px-2 py-1">${item.kode || '-'}</span></td>
          <td class="align-middle">
            <div class="fw-semibold text-dark">${item.nama_rencana || '-'}</div>
            ${item.deskripsi ? `<small class="text-muted d-block mt-1">${truncateText(item.deskripsi, 80)}</small>` : ''}
          </td>
          <td class="align-middle"><small class="text-muted">${truncateText(item.target || '-', 50)}</small></td>
          <td class="align-middle"><small class="text-muted"><i class="fas fa-calendar-alt me-1"></i>${periode}</small></td>
          <td class="align-middle">${statusBadge}</td>
          <td class="align-middle text-center">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-info border-0" onclick="RencanaStrategisModule.viewDetail('${item.id}')" title="Lihat"><i class="fas fa-eye"></i></button>
              <button class="btn btn-outline-warning border-0" onclick="RencanaStrategisModule.startEdit('${item.id}')" title="Edit"><i class="fas fa-edit"></i></button>
              <button class="btn btn-outline-danger border-0" onclick="RencanaStrategisModule.deleteRencana('${item.id}')" title="Hapus"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderMissionOptions() {
    if (!state.missions || state.missions.length === 0) return '<option value="" disabled>Tidak ada misi</option>';
    let options = '';
    state.missions.forEach(mission => {
      if (!mission.misi) return;
      const misiArray = mission.misi.split('\n').filter(m => m.trim());
      misiArray.forEach((misi, index) => {
        const cleanMisi = misi.replace(/^\d+\.\s*/, '').trim();
        const value = `${mission.id}|${index}|${encodeURIComponent(cleanMisi)}`;
        const selected = state.formValues.visi_misi_id === value ? ' selected' : '';
        options += `<option value="${value}"${selected}>${truncateText(cleanMisi, 80)}</option>`;
      });
    });
    return options;
  }

  function getStatusBadge(status) {
    if (status === 'Aktif') return '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Aktif</span>';
    if (status === 'Draft') return '<span class="badge bg-warning text-dark"><i class="fas fa-edit me-1"></i>Draft</span>';
    if (status === 'Selesai') return '<span class="badge bg-secondary"><i class="fas fa-flag-checkered me-1"></i>Selesai</span>';
    return `<span class="badge bg-light text-dark">${status || 'Draft'}</span>`;
  }

  function formatPeriode(mulai, selesai) {
    if (!mulai && !selesai) return '-';
    const formatDate = d => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    return `${formatDate(mulai)} - ${formatDate(selesai)}`;
  }

  function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  function bindEvents() {
    const form = getEl('rs-form');
    if (form) form.addEventListener('submit', handleSubmit);
    
    const toggleBtn = getEl('rs-toggle-form');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleForm);
    
    const resetBtn = getEl('rs-reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetForm);
    
    const cancelEditBtn = getEl('rs-cancel-edit');
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', cancelEdit);
    
    const exportBtn = getEl('rs-export-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportData);
  }

  function toggleForm() {
    state.showForm = !state.showForm;
    const formBody = getEl('rs-form-body');
    const toggleBtn = getEl('rs-toggle-form');
    if (formBody) {
      formBody.classList.toggle('d-none', !state.showForm);
      if (toggleBtn) toggleBtn.innerHTML = `<i class="fas fa-chevron-${state.showForm ? 'up' : 'down'}"></i>`;
    }
  }

  function cancelEdit() {
    state.currentId = null;
    state.formValues = getDefaultForm();
    generateKode().then(() => renderInterface());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
      kode: getEl('rs-kode')?.value || '',
      visi_misi_id: getEl('rs-misi')?.value || '',
      nama_rencana: getEl('rs-nama')?.value || '',
      deskripsi: getEl('rs-deskripsi')?.value || '',
      periode_mulai: getEl('rs-mulai')?.value || '',
      periode_selesai: getEl('rs-selesai')?.value || '',
      target: getEl('rs-target')?.value || '',
      status: getEl('rs-status')?.value || 'Draft'
    };

    if (formData.visi_misi_id?.includes('|')) {
      formData.visi_misi_id = formData.visi_misi_id.split('|')[0];
    }

    if (!formData.nama_rencana.trim()) {
      alert('Nama rencana wajib diisi!');
      return;
    }

    try {
      const apiFunc = api();
      if (state.currentId) {
        await apiFunc(`/api/rencana-strategis/${state.currentId}`, { method: 'PUT', body: formData });
        alert('Data berhasil diupdate!');
      } else {
        await apiFunc('/api/rencana-strategis', { method: 'POST', body: formData });
        alert('Data berhasil disimpan!');
      }
      
      state.currentId = null;
      state.formValues = getDefaultForm();
      await refreshData();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Gagal menyimpan: ' + error.message);
    }
  }

  function showAddForm() {
    state.currentId = null;
    state.formValues = getDefaultForm();
    state.showForm = true;
    generateKode().then(() => {
      renderInterface();
      setTimeout(() => {
        const formSection = getEl('rs-form-section');
        if (formSection) formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        getEl('rs-nama')?.focus();
      }, 100);
    });
  }

  function resetForm() {
    state.formValues = getDefaultForm();
    generateKode().then(() => renderInterface());
  }

  async function refreshData() {
    console.log('🔄 Refreshing data...');
    await fetchData();
    applyFilters();
    renderInterface();
  }

  async function generateKode() {
    try {
      const apiFunc = api();
      const response = await apiFunc('/api/rencana-strategis/generate/kode/public');
      state.formValues.kode = response.kode || response;
    } catch (error) {
      const year = new Date().getFullYear();
      const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      state.formValues.kode = `RS-${year}-${random}`;
    }
  }

  function filterByStatus(status) {
    state.filters.status = status;
    applyFilters();
    renderInterface();
    // Scroll to table
    setTimeout(() => {
      const tableCard = document.querySelector('.rencana-strategis-wrapper > .card:last-child');
      if (tableCard) tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function viewDetail(id) {
    const record = state.data.find(i => i.id === id);
    if (!record) return;
    
    const existingModal = document.getElementById('rs-detail-modal');
    if (existingModal) existingModal.remove();
    
    const modalHtml = `
      <div class="modal fade" id="rs-detail-modal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title"><i class="fas fa-info-circle me-2"></i>Detail Rencana Strategis</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6"><label class="form-label text-muted small">Kode</label><p class="fw-semibold">${record.kode || '-'}</p></div>
                <div class="col-md-6"><label class="form-label text-muted small">Status</label><p>${getStatusBadge(record.status)}</p></div>
                <div class="col-12"><label class="form-label text-muted small">Nama Rencana</label><p class="fw-semibold fs-5">${record.nama_rencana || '-'}</p></div>
                <div class="col-md-6"><label class="form-label text-muted small">Periode Mulai</label><p>${record.periode_mulai ? new Date(record.periode_mulai).toLocaleDateString('id-ID') : '-'}</p></div>
                <div class="col-md-6"><label class="form-label text-muted small">Periode Selesai</label><p>${record.periode_selesai ? new Date(record.periode_selesai).toLocaleDateString('id-ID') : '-'}</p></div>
                <div class="col-12"><label class="form-label text-muted small">Deskripsi</label><p class="bg-light p-3 rounded">${record.deskripsi || '-'}</p></div>
                <div class="col-12"><label class="form-label text-muted small">Target</label><p class="bg-light p-3 rounded">${record.target || '-'}</p></div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-warning" onclick="RencanaStrategisModule.startEdit('${id}'); bootstrap.Modal.getInstance(document.getElementById('rs-detail-modal')).hide();"><i class="fas fa-edit me-1"></i>Edit</button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('rs-detail-modal'));
    modal.show();
    document.getElementById('rs-detail-modal').addEventListener('hidden.bs.modal', function() { this.remove(); });
  }

  function startEdit(id) {
    const record = state.data.find(i => i.id === id);
    if (!record) return;
    
    state.currentId = id;
    state.formValues = {
      kode: record.kode || '',
      visi_misi_id: record.visi_misi_id || '',
      nama_rencana: record.nama_rencana || '',
      deskripsi: record.deskripsi || '',
      periode_mulai: record.periode_mulai ? record.periode_mulai.substring(0, 10) : '',
      periode_selesai: record.periode_selesai ? record.periode_selesai.substring(0, 10) : '',
      target: record.target || '',
      status: record.status || 'Draft'
    };
    state.showForm = true;
    
    renderInterface();
    setTimeout(() => {
      const formSection = getEl('rs-form-section');
      if (formSection) formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      getEl('rs-nama')?.focus();
    }, 100);
  }

  async function deleteRencana(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus rencana strategis ini?')) return;
    
    try {
      const apiFunc = api();
      await apiFunc(`/api/rencana-strategis/${id}`, { method: 'DELETE' });
      alert('Data berhasil dihapus!');
      await refreshData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Gagal menghapus: ' + error.message);
    }
  }

  async function exportData() {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch('/api/rencana-strategis/actions/export', { headers });
      
      if (!response.ok) throw new Error('Gagal export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rencana-strategis-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Gagal export: ' + error.message);
    }
  }

  function showError(message) {
    const container = getEl('rencana-strategis-content');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger m-4">
          <h5><i class="fas fa-exclamation-triangle me-2"></i>Error</h5>
          <p class="mb-3">${message}</p>
          <button onclick="RencanaStrategisModule.load()" class="btn btn-primary"><i class="fas fa-sync me-1"></i> Coba Lagi</button>
        </div>
      `;
    }
  }

  function cleanup() {
    console.log('🧹 RencanaStrategisModule cleanup');
    state.isInitialized = false;
    state.isLoading = false;
  }

  // Public API
  return {
    load,
    viewDetail,
    startEdit,
    deleteRencana,
    showAddForm,
    refreshData,
    cleanup,
    clearFilters,
    filterByStatus,
    handleFilterChange,
    state,
    version: MODULE_VERSION
  };
})();

// Global exports
window.RencanaStrategisModule = RencanaStrategisModule;

// Only set loadRencanaStrategis if not already defined
if (!window.loadRencanaStrategis) {
    window.loadRencanaStrategis = () => RencanaStrategisModule.load();
}

// Block selection list functions
window.loadRencanaStrategisSelection = function() {
    console.log('⛔ loadRencanaStrategisSelection blocked');
    return Promise.resolve();
};

console.log('✅ Rencana Strategis Module v6.0-ENHANCED loaded');
