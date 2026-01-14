/**
 * RENCANA STRATEGIS MODULE - CLEAN VERSION v1.0
 * 
 * TAMPILAN YANG BENAR:
 * - Statistics Cards (Aktif, Draft, Selesai, Total)
 * - Form Input (collapsible)
 * - Data Table dengan kolom: Kode, Nama, Target, Periode, Status, Aksi
 * 
 * TIDAK BOLEH MENAMPILKAN:
 * - Selection List / "Pilih Rencana Strategis" view
 * - List dengan RS-2025-xxx codes
 * 
 * Created: 2026-01-10
 */

(function() {
  'use strict';
  
  // Prevent multiple initializations
  if (window.RencanaStrategisCleanLoaded) {
    console.log('⚠️ RencanaStrategisClean already loaded');
    return;
  }
  window.RencanaStrategisCleanLoaded = true;
  
  const MODULE_VERSION = '1.0-CLEAN';
  
  // State
  const state = {
    data: [],
    missions: [],
    currentId: null,
    isLoading: false,
    isInitialized: false,
    showForm: true,
    formValues: {
      kode: '',
      visi_misi_id: '',
      nama_rencana: '',
      deskripsi: '',
      periode_mulai: '',
      periode_selesai: '',
      target: '',
      status: 'Draft'
    }
  };
  
  // Utility functions
  const getEl = (id) => document.getElementById(id);
  
  const api = async (endpoint, options = {}) => {
    if (window.apiCall) return window.apiCall(endpoint, options);
    if (window.app?.apiCall) return window.app.apiCall(endpoint, options);
    
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };
    
    const config = { ...options, headers };
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }
    
    const response = await fetch(endpoint, config);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  };
  
  const truncate = (text, max) => {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  };
  
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });
  };
  
  // Check if on RS page
  function isOnRSPage() {
    const path = window.location.pathname;
    const activePage = document.querySelector('.page-content.active');
    return path === '/rencana-strategis' || 
           path.includes('rencana-strategis') ||
           (activePage && activePage.id === 'rencana-strategis');
  }
  
  // CRITICAL: Remove any selection list elements that might exist
  function cleanupSelectionList() {
    const container = getEl('rencana-strategis-content');
    if (!container) return;
    
    // Check if selection list is present
    const html = container.innerHTML;
    const hasSelectionList = html.includes('Pilih Rencana Strategis') && 
                             !html.includes('rencana-strategis-wrapper') &&
                             (html.includes('RS-2025-') || html.includes('list-group'));
    
    if (hasSelectionList) {
      console.log('🧹 Cleaning up selection list...');
      // Clear the container - we'll render the correct interface
      container.innerHTML = '';
    }
    
    // Also remove any selection list elements that might be elsewhere
    const selectors = [
      '.rencana-strategis-selection',
      '.rs-selection-wrapper',
      '.rs-selection-list',
      '#rs-selection-container',
      '#selection-section',
      '[data-rs-selection-list]'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        console.log(`🗑️ Removing selection list element: ${selector}`);
        el.remove();
      });
    });
  }
  
  // Main load function
  async function load() {
    if (!isOnRSPage()) {
      console.log('⚠️ Not on RS page, skipping load');
      return;
    }
    
    if (state.isLoading) {
      console.log('⚠️ Already loading, skipping...');
      return;
    }
    
    console.log(`🚀 Loading RencanaStrategisClean v${MODULE_VERSION}...`);
    state.isLoading = true;
    
    const container = getEl('rencana-strategis-content');
    if (!container) {
      console.error('❌ Container not found!');
      state.isLoading = false;
      return;
    }
    
    // CRITICAL: Clean up any selection list first
    cleanupSelectionList();
    
    // Show loading
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3 text-muted">Memuat data rencana strategis...</p>
      </div>
    `;
    
    try {
      await fetchData();
      await generateKode();
      render();
      
      // Mark as properly rendered
      container.setAttribute('data-rs-clean-rendered', 'true');
      container.setAttribute('data-rs-version', MODULE_VERSION);
      
      state.isInitialized = true;
      console.log(`✅ RencanaStrategisClean v${MODULE_VERSION} loaded`);
    } catch (error) {
      console.error('❌ Error loading:', error);
      container.innerHTML = `
        <div class="alert alert-danger m-3">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Gagal memuat data: ${error.message}
          <button class="btn btn-sm btn-outline-danger ms-3" onclick="RencanaStrategisModule.load()">
            <i class="fas fa-redo me-1"></i>Coba Lagi
          </button>
        </div>
      `;
    } finally {
      state.isLoading = false;
    }
  }
  
  async function fetchData() {
    try {
      const [rencanaRes, visiRes] = await Promise.allSettled([
        api('/api/rencana-strategis').catch(() => api('/api/rencana-strategis/public').catch(() => [])),
        api('/api/visi-misi').catch(() => api('/api/visi-misi/public').catch(() => []))
      ]);
      
      state.data = rencanaRes.status === 'fulfilled' 
        ? (Array.isArray(rencanaRes.value) ? rencanaRes.value : rencanaRes.value?.data || [])
        : [];
      
      state.missions = visiRes.status === 'fulfilled'
        ? (Array.isArray(visiRes.value) ? visiRes.value : visiRes.value?.data || [])
        : [];
        
      console.log(`📊 Data loaded: ${state.data.length} rencana, ${state.missions.length} misi`);
    } catch (error) {
      console.error('Error fetching data:', error);
      state.data = [];
      state.missions = [];
    }
  }
  
  async function generateKode() {
    try {
      const response = await api('/api/rencana-strategis/generate/kode/public');
      state.formValues.kode = response.kode || response;
    } catch (error) {
      const year = new Date().getFullYear();
      const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      state.formValues.kode = `RS-${year}-${random}`;
    }
  }
  
  function render() {
    const container = getEl('rencana-strategis-content');
    if (!container) return;
    
    container.innerHTML = `
      <div class="rencana-strategis-wrapper p-3" style="background: #f8f9fa;">
        ${renderStatCards()}
        ${renderForm()}
        ${renderTable()}
      </div>
    `;
    
    bindEvents();
    console.log('✅ Interface rendered: Cards + Form + Table');
  }
  
  function renderStatCards() {
    const aktif = state.data.filter(i => i.status === 'Aktif').length;
    const draft = state.data.filter(i => i.status === 'Draft').length;
    const selesai = state.data.filter(i => i.status === 'Selesai').length;
    const total = state.data.length;
    
    return `
      <div class="row g-3 mb-4">
        <div class="col-xl-3 col-md-6 col-sm-6">
          <div class="card h-100 border-0 shadow-sm" style="border-radius: 12px;">
            <div class="card-body p-0">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 d-flex align-items-center justify-content-center" 
                     style="width: 80px; height: 100px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
                  <i class="fas fa-check-circle fa-2x text-white"></i>
                </div>
                <div class="flex-grow-1 p-3">
                  <h3 class="fw-bold text-success mb-0">${aktif}</h3>
                  <p class="text-muted mb-0 small">Rencana Aktif</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6 col-sm-6">
          <div class="card h-100 border-0 shadow-sm" style="border-radius: 12px;">
            <div class="card-body p-0">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 d-flex align-items-center justify-content-center" 
                     style="width: 80px; height: 100px; background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);">
                  <i class="fas fa-edit fa-2x text-white"></i>
                </div>
                <div class="flex-grow-1 p-3">
                  <h3 class="fw-bold text-warning mb-0">${draft}</h3>
                  <p class="text-muted mb-0 small">Draft</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6 col-sm-6">
          <div class="card h-100 border-0 shadow-sm" style="border-radius: 12px;">
            <div class="card-body p-0">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 d-flex align-items-center justify-content-center" 
                     style="width: 80px; height: 100px; background: linear-gradient(135deg, #007bff 0%, #6f42c1 100%);">
                  <i class="fas fa-flag-checkered fa-2x text-white"></i>
                </div>
                <div class="flex-grow-1 p-3">
                  <h3 class="fw-bold text-primary mb-0">${selesai}</h3>
                  <p class="text-muted mb-0 small">Selesai</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6 col-sm-6">
          <div class="card h-100 border-0 shadow-sm" style="border-radius: 12px;">
            <div class="card-body p-0">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0 d-flex align-items-center justify-content-center" 
                     style="width: 80px; height: 100px; background: linear-gradient(135deg, #6c757d 0%, #495057 100%);">
                  <i class="fas fa-list-alt fa-2x text-white"></i>
                </div>
                <div class="flex-grow-1 p-3">
                  <h3 class="fw-bold text-secondary mb-0">${total}</h3>
                  <p class="text-muted mb-0 small">Total Rencana</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  function renderForm() {
    const f = state.formValues;
    const isEdit = !!state.currentId;
    const isCollapsed = !state.showForm;
    
    const missionOptions = state.missions.map(m => {
      if (!m.misi) return '';
      return m.misi.split('\n').filter(x => x.trim()).map((misi, idx) => {
        const clean = misi.replace(/^\d+\.\s*/, '').trim();
        const value = `${m.id}|${idx}|${encodeURIComponent(clean)}`;
        return `<option value="${value}">${truncate(clean, 80)}</option>`;
      }).join('');
    }).join('');
    
    return `
      <div class="card mb-4 shadow-sm border-0" id="rs-form-section" style="border-radius: 12px;">
        <div class="card-header text-white d-flex justify-content-between align-items-center" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
          <h5 class="mb-0">
            <i class="fas fa-${isEdit ? 'edit' : 'plus-circle'} me-2"></i>
            ${isEdit ? 'Edit Rencana Strategis' : 'Form Input Rencana Strategis'}
          </h5>
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
                  ${missionOptions}
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
  
  function renderTable() {
    const rows = state.data.length === 0 ? `
      <tr>
        <td colspan="6" class="text-center py-5">
          <div class="py-4">
            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">Belum Ada Data</h5>
            <p class="text-muted mb-3">Silakan isi form di atas untuk menambahkan data</p>
          </div>
        </td>
      </tr>
    ` : state.data.map((item, idx) => {
      const statusBadge = {
        'Aktif': '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Aktif</span>',
        'Draft': '<span class="badge bg-warning text-dark"><i class="fas fa-edit me-1"></i>Draft</span>',
        'Selesai': '<span class="badge bg-secondary"><i class="fas fa-flag-checkered me-1"></i>Selesai</span>'
      }[item.status] || '<span class="badge bg-light text-dark">-</span>';
      
      return `
        <tr style="${idx % 2 ? 'background-color: #fafbfc;' : ''}">
          <td><span class="badge bg-light text-dark border">${item.kode || '-'}</span></td>
          <td>
            <div class="fw-semibold">${item.nama_rencana || '-'}</div>
            ${item.deskripsi ? `<small class="text-muted">${truncate(item.deskripsi, 80)}</small>` : ''}
          </td>
          <td><small class="text-muted">${truncate(item.target || '-', 50)}</small></td>
          <td><small class="text-muted"><i class="fas fa-calendar-alt me-1"></i>${formatDate(item.periode_mulai)} - ${formatDate(item.periode_selesai)}</small></td>
          <td>${statusBadge}</td>
          <td class="text-center">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-warning border-0" onclick="RencanaStrategisModule.edit('${item.id}')" title="Edit"><i class="fas fa-edit"></i></button>
              <button class="btn btn-outline-danger border-0" onclick="RencanaStrategisModule.delete('${item.id}')" title="Hapus"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    return `
      <div class="card shadow-sm border-0" style="border-radius: 12px;">
        <div class="card-header bg-white d-flex justify-content-between align-items-center py-3 flex-wrap gap-2" style="border-radius: 12px 12px 0 0;">
          <div>
            <h5 class="mb-0"><i class="fas fa-table text-primary me-2"></i>Daftar Rencana Strategis</h5>
            <small class="text-muted">Total: ${state.data.length} data</small>
          </div>
          <div class="btn-group">
            <button class="btn btn-outline-primary" id="rs-refresh-btn"><i class="fas fa-sync-alt me-1"></i>Refresh</button>
            <button class="btn btn-outline-success" id="rs-export-btn"><i class="fas fa-file-excel me-1"></i>Export</button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <tr>
                  <th class="border-0 py-3" style="width: 120px;">Kode</th>
                  <th class="border-0 py-3">Nama Rencana</th>
                  <th class="border-0 py-3" style="width: 150px;">Target</th>
                  <th class="border-0 py-3" style="width: 180px;">Periode</th>
                  <th class="border-0 py-3" style="width: 100px;">Status</th>
                  <th class="border-0 py-3 text-center" style="width: 100px;">Aksi</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
  
  function bindEvents() {
    const form = getEl('rs-form');
    if (form) form.addEventListener('submit', handleSubmit);
    
    const toggleBtn = getEl('rs-toggle-form');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleForm);
    
    const resetBtn = getEl('rs-reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetForm);
    
    const cancelBtn = getEl('rs-cancel-edit');
    if (cancelBtn) cancelBtn.addEventListener('click', cancelEdit);
    
    const refreshBtn = getEl('rs-refresh-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', refresh);
  }
  
  function toggleForm() {
    state.showForm = !state.showForm;
    const body = getEl('rs-form-body');
    const btn = getEl('rs-toggle-form');
    if (body && btn) {
      body.classList.toggle('d-none', !state.showForm);
      btn.innerHTML = `<i class="fas fa-chevron-${state.showForm ? 'up' : 'down'}"></i>`;
    }
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
      kode: getEl('rs-kode')?.value || '',
      visi_misi_id: getEl('rs-misi')?.value?.split('|')[0] || '',
      nama_rencana: getEl('rs-nama')?.value || '',
      deskripsi: getEl('rs-deskripsi')?.value || '',
      periode_mulai: getEl('rs-mulai')?.value || '',
      periode_selesai: getEl('rs-selesai')?.value || '',
      target: getEl('rs-target')?.value || '',
      status: getEl('rs-status')?.value || 'Draft'
    };
    
    if (!formData.nama_rencana.trim()) {
      alert('Nama rencana wajib diisi!');
      return;
    }
    
    try {
      if (state.currentId) {
        await api(`/api/rencana-strategis/${state.currentId}`, { method: 'PUT', body: formData });
        alert('Data berhasil diupdate!');
      } else {
        await api('/api/rencana-strategis', { method: 'POST', body: formData });
        alert('Data berhasil disimpan!');
      }
      
      state.currentId = null;
      await refresh();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Gagal menyimpan: ' + error.message);
    }
  }
  
  function resetForm() {
    state.formValues = {
      kode: '',
      visi_misi_id: '',
      nama_rencana: '',
      deskripsi: '',
      periode_mulai: '',
      periode_selesai: '',
      target: '',
      status: 'Draft'
    };
    state.currentId = null;
    generateKode().then(render);
  }
  
  function cancelEdit() {
    resetForm();
  }
  
  async function refresh() {
    console.log('🔄 Refreshing data...');
    await fetchData();
    await generateKode();
    render();
  }
  
  async function edit(id) {
    const record = state.data.find(i => i.id === id);
    if (!record) return;
    
    state.currentId = id;
    state.formValues = { ...record };
    state.showForm = true;
    render();
    
    setTimeout(() => {
      const formSection = getEl('rs-form-section');
      if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
  
  async function deleteRecord(id) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    
    try {
      await api(`/api/rencana-strategis/${id}`, { method: 'DELETE' });
      alert('Data berhasil dihapus!');
      await refresh();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Gagal menghapus: ' + error.message);
    }
  }
  
  // Export - CRITICAL: Export as RencanaStrategisClean FIRST (app.js checks this first)
  const moduleExport = {
    load,
    refresh,
    edit,
    delete: deleteRecord,
    version: MODULE_VERSION
  };
  
  // Primary export - app.js checks this first
  window.RencanaStrategisClean = moduleExport;
  
  // Secondary exports for compatibility
  window.RencanaStrategisModule = moduleExport;
  window.RencanaStrategisFast = moduleExport;
  
  console.log(`✅ RencanaStrategisClean v${MODULE_VERSION} registered as RencanaStrategisClean, RencanaStrategisModule, RencanaStrategisFast`);
  
})();
