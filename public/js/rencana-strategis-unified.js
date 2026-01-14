/**
 * RENCANA STRATEGIS MODULE - UNIFIED v6.0
 * 
 * SINGLE SOURCE OF TRUTH untuk halaman /rencana-strategis
 * 
 * TAMPILAN YANG BENAR:
 * ✅ Statistics Cards (Aktif, Draft, Selesai, Total)
 * ✅ Form Input (collapsible)
 * ✅ Data Table dengan kolom: Kode, Nama, Target, Periode, Status, Aksi
 * 
 * TIDAK BOLEH MENAMPILKAN:
 * ❌ Selection List / "Pilih Rencana Strategis" view
 * ❌ List dengan RS-2025-xxx codes tanpa table
 * 
 * FIXES:
 * - CSP compliant (no external scripts that violate CSP)
 * - Race condition prevention with mutex
 * - Single initialization point
 * - Cleanup on page leave
 * 
 * Created: 2026-01-10
 */

(function() {
  'use strict';
  
  const MODULE_VERSION = '6.0-UNIFIED';
  const MODULE_ID = 'rs-unified-' + Date.now();
  
  // Prevent multiple initializations
  if (window._rsUnifiedLoaded) {
    console.log('⚠️ RS Unified already loaded, skipping');
    return;
  }
  window._rsUnifiedLoaded = true;
  
  // State management
  const state = {
    data: [],
    missions: [],
    currentId: null,
    isLoading: false,
    isInitialized: false,
    showForm: true,
    loadCount: 0,
    lastLoadTime: 0,
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
  
  // Mutex for preventing concurrent loads
  let loadMutex = false;
  
  // Utility functions
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);
  
  const truncate = (text, max) => {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  };
  
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('id-ID', { 
        day: '2-digit', month: 'short', year: 'numeric' 
      });
    } catch {
      return '-';
    }
  };
  
  const escapeHtml = (text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };
  
  // API helper with fallbacks
  async function api(endpoint, options = {}) {
    // Try global apiCall first
    if (window.apiCall && typeof window.apiCall === 'function') {
      return window.apiCall(endpoint, options);
    }
    if (window.app?.apiCall && typeof window.app.apiCall === 'function') {
      return window.app.apiCall(endpoint, options);
    }
    
    // Fallback to direct fetch
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
  
  // Check if currently on RS page
  function isOnRSPage() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const activePage = document.querySelector('.page-content.active');
    
    return path === '/rencana-strategis' || 
           path.includes('/rencana-strategis') ||
           hash === '#rencana-strategis' ||
           (activePage && activePage.id === 'rencana-strategis');
  }
  
  // CRITICAL: Remove any selection list that shouldn't be there
  function cleanupWrongDisplay() {
    const container = $('rencana-strategis-content');
    if (!container) return false;
    
    const html = container.innerHTML;
    
    // Check for wrong display patterns
    const hasSelectionList = (
      html.includes('Pilih Rencana Strategis') && 
      !html.includes('rencana-strategis-wrapper') &&
      !container.querySelector('table.table')
    );
    
    const hasListGroup = (
      html.includes('list-group') && 
      /RS-\d{4}-\d{3}/.test(html) &&
      !container.querySelector('table.table')
    );
    
    if (hasSelectionList || hasListGroup) {
      console.log('🧹 Cleaning up wrong display (selection list detected)');
      return true; // Signal that we need to re-render
    }
    
    return false;
  }
  
  // Main load function
  async function load() {
    // Check if on RS page
    if (!isOnRSPage()) {
      console.log('📍 Not on RS page, skipping load');
      return;
    }
    
    // Mutex check
    if (loadMutex) {
      console.log('🔒 Load mutex active, skipping');
      return;
    }
    
    // Rate limiting - prevent rapid reloads
    const now = Date.now();
    if (now - state.lastLoadTime < 1000) {
      console.log('⏱️ Rate limited, skipping load');
      return;
    }
    
    // Check if already properly initialized
    const container = $('rencana-strategis-content');
    if (container && state.isInitialized && !cleanupWrongDisplay()) {
      const hasCorrectDisplay = container.querySelector('.rencana-strategis-wrapper table.table');
      if (hasCorrectDisplay) {
        console.log('✅ Already initialized with correct display');
        return;
      }
    }
    
    // Set mutex and state
    loadMutex = true;
    state.isLoading = true;
    state.lastLoadTime = now;
    state.loadCount++;
    
    console.log(`🚀 Loading RS Unified v${MODULE_VERSION} (load #${state.loadCount})`);
    
    if (!container) {
      console.error('❌ Container rencana-strategis-content not found');
      loadMutex = false;
      state.isLoading = false;
      return;
    }
    
    // Show loading state
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Memuat data rencana strategis...</p>
      </div>
    `;
    
    try {
      // Fetch data
      await fetchData();
      
      // Generate new code if needed
      if (!state.formValues.kode || state.formValues.kode === '') {
        await generateKode();
      }
      
      // Render interface
      render();
      
      // Mark as initialized
      state.isInitialized = true;
      container.setAttribute('data-rs-module', MODULE_ID);
      container.setAttribute('data-rs-version', MODULE_VERSION);
      
      console.log(`✅ RS Unified v${MODULE_VERSION} loaded successfully`);
      
    } catch (error) {
      console.error('❌ Error loading RS:', error);
      container.innerHTML = `
        <div class="alert alert-danger m-3">
          <i class="fas fa-exclamation-triangle me-2"></i>
          <strong>Gagal memuat data:</strong> ${escapeHtml(error.message)}
          <button class="btn btn-sm btn-outline-danger ms-3" onclick="window.RencanaStrategisModule.load()">
            <i class="fas fa-redo me-1"></i>Coba Lagi
          </button>
        </div>
      `;
    } finally {
      state.isLoading = false;
      // Release mutex after short delay
      setTimeout(() => { loadMutex = false; }, 300);
    }
  }
  
  async function fetchData() {
    try {
      // Fetch both in parallel
      const [rencanaRes, visiRes] = await Promise.allSettled([
        api('/api/rencana-strategis').catch(() => 
          api('/api/rencana-strategis/public').catch(() => [])
        ),
        api('/api/visi-misi').catch(() => 
          api('/api/visi-misi/public').catch(() => [])
        )
      ]);
      
      // Process rencana data
      if (rencanaRes.status === 'fulfilled') {
        const val = rencanaRes.value;
        state.data = Array.isArray(val) ? val : (val?.data || []);
      } else {
        state.data = [];
      }
      
      // Process visi-misi data
      if (visiRes.status === 'fulfilled') {
        const val = visiRes.value;
        state.missions = Array.isArray(val) ? val : (val?.data || []);
      } else {
        state.missions = [];
      }
      
      console.log(`📊 Data: ${state.data.length} rencana, ${state.missions.length} misi`);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      state.data = [];
      state.missions = [];
    }
  }
  
  async function generateKode() {
    try {
      const response = await api('/api/rencana-strategis/generate/kode/public');
      state.formValues.kode = response.kode || response || '';
    } catch (error) {
      // Generate fallback code
      const year = new Date().getFullYear();
      const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      state.formValues.kode = `RS-${year}-${random}`;
    }
  }
  
  function render() {
    const container = $('rencana-strategis-content');
    if (!container) return;
    
    container.innerHTML = `
      <div class="rencana-strategis-wrapper p-3" style="background: #f8f9fa; min-height: 100%;">
        ${renderStatCards()}
        ${renderForm()}
        ${renderTable()}
      </div>
    `;
    
    bindEvents();
    console.log('✅ Rendered: Statistics + Form + Table');
  }
  
  function renderStatCards() {
    const counts = {
      aktif: state.data.filter(i => i.status === 'Aktif').length,
      draft: state.data.filter(i => i.status === 'Draft').length,
      selesai: state.data.filter(i => i.status === 'Selesai').length,
      total: state.data.length
    };
    
    const cards = [
      { label: 'Rencana Aktif', count: counts.aktif, icon: 'fa-check-circle', gradient: '#28a745, #20c997', color: 'success' },
      { label: 'Draft', count: counts.draft, icon: 'fa-edit', gradient: '#ffc107, #fd7e14', color: 'warning' },
      { label: 'Selesai', count: counts.selesai, icon: 'fa-flag-checkered', gradient: '#007bff, #6f42c1', color: 'primary' },
      { label: 'Total Rencana', count: counts.total, icon: 'fa-list-alt', gradient: '#6c757d, #495057', color: 'secondary' }
    ];
    
    return `
      <div class="row g-3 mb-4">
        ${cards.map(card => `
          <div class="col-xl-3 col-md-6 col-sm-6">
            <div class="card h-100 border-0 shadow-sm" style="border-radius: 12px; overflow: hidden;">
              <div class="card-body p-0">
                <div class="d-flex align-items-center">
                  <div class="flex-shrink-0 d-flex align-items-center justify-content-center" 
                       style="width: 80px; height: 100px; background: linear-gradient(135deg, ${card.gradient});">
                    <i class="fas ${card.icon} fa-2x text-white"></i>
                  </div>
                  <div class="flex-grow-1 p-3">
                    <h3 class="fw-bold text-${card.color} mb-0">${card.count}</h3>
                    <p class="text-muted mb-0 small">${card.label}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  function renderForm() {
    const f = state.formValues;
    const isEdit = !!state.currentId;
    const isCollapsed = !state.showForm;
    
    // Build mission options
    let missionOptions = '<option value="">-- Pilih Misi --</option>';
    state.missions.forEach(m => {
      if (!m.misi) return;
      m.misi.split('\n').filter(x => x.trim()).forEach((misi, idx) => {
        const clean = misi.replace(/^\d+\.\s*/, '').trim();
        const value = `${m.id}|${idx}|${encodeURIComponent(clean)}`;
        const selected = f.visi_misi_id === value ? 'selected' : '';
        missionOptions += `<option value="${value}" ${selected}>${truncate(clean, 80)}</option>`;
      });
    });
    
    return `
      <div class="card mb-4 shadow-sm border-0" id="rs-form-section" style="border-radius: 12px;">
        <div class="card-header text-white d-flex justify-content-between align-items-center" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
          <h5 class="mb-0">
            <i class="fas fa-${isEdit ? 'edit' : 'plus-circle'} me-2"></i>
            ${isEdit ? 'Edit Rencana Strategis' : 'Form Input Rencana Strategis'}
          </h5>
          <button type="button" class="btn btn-light btn-sm" id="rs-toggle-form" title="${isCollapsed ? 'Tampilkan' : 'Sembunyikan'} Form">
            <i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}"></i>
          </button>
        </div>
        <div class="card-body bg-white${isCollapsed ? ' d-none' : ''}" id="rs-form-body">
          <form id="rs-form" autocomplete="off">
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label fw-semibold"><i class="fas fa-barcode me-1 text-primary"></i> Kode</label>
                <input type="text" class="form-control bg-light" id="rs-kode" value="${escapeHtml(f.kode)}" readonly placeholder="Auto-generate">
                <small class="text-muted">Kode otomatis</small>
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
                <select class="form-select" id="rs-misi">${missionOptions}</select>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold"><i class="fas fa-file-alt me-1 text-info"></i> Nama Rencana Strategis <span class="text-danger">*</span></label>
                <input type="text" class="form-control form-control-lg" id="rs-nama" value="${escapeHtml(f.nama_rencana)}" placeholder="Masukkan nama rencana strategis..." required>
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
                <textarea class="form-control" id="rs-deskripsi" rows="3" placeholder="Masukkan deskripsi rencana strategis...">${escapeHtml(f.deskripsi)}</textarea>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold"><i class="fas fa-crosshairs me-1 text-danger"></i> Target</label>
                <textarea class="form-control" id="rs-target" rows="2" placeholder="Masukkan target yang ingin dicapai...">${escapeHtml(f.target)}</textarea>
              </div>
              <div class="col-12 pt-3 border-top">
                <div class="d-flex gap-2 flex-wrap">
                  <button type="submit" class="btn btn-primary btn-lg">
                    <i class="fas fa-save me-2"></i>${isEdit ? 'Update Data' : 'Simpan Data'}
                  </button>
                  <button type="button" class="btn btn-outline-secondary" id="rs-reset-btn">
                    <i class="fas fa-undo me-2"></i>Reset Form
                  </button>
                  ${isEdit ? `
                    <button type="button" class="btn btn-outline-danger" id="rs-cancel-edit">
                      <i class="fas fa-times me-2"></i>Batal Edit
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderTable() {
    let rows = '';
    
    if (state.data.length === 0) {
      rows = `
        <tr>
          <td colspan="6" class="text-center py-5 border-0">
            <div class="py-4">
              <div class="mb-3" style="width: 80px; height: 80px; margin: 0 auto; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-inbox fa-2x text-muted"></i>
              </div>
              <h5 class="text-muted mb-2">Belum Ada Data</h5>
              <p class="text-muted mb-3">Silakan isi form di atas untuk menambahkan rencana strategis baru</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      rows = state.data.map((item, idx) => {
        const statusBadges = {
          'Aktif': '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Aktif</span>',
          'Draft': '<span class="badge bg-warning text-dark"><i class="fas fa-edit me-1"></i>Draft</span>',
          'Selesai': '<span class="badge bg-secondary"><i class="fas fa-flag-checkered me-1"></i>Selesai</span>'
        };
        const statusBadge = statusBadges[item.status] || '<span class="badge bg-light text-dark">-</span>';
        const periode = `${formatDate(item.periode_mulai)} - ${formatDate(item.periode_selesai)}`;
        const rowBg = idx % 2 === 0 ? '' : 'style="background-color: #fafbfc;"';
        
        return `
          <tr ${rowBg}>
            <td class="align-middle">
              <span class="badge bg-light text-dark border fw-normal px-2 py-1">${escapeHtml(item.kode) || '-'}</span>
            </td>
            <td class="align-middle">
              <div class="fw-semibold text-dark">${escapeHtml(item.nama_rencana) || '-'}</div>
              ${item.deskripsi ? `<small class="text-muted d-block mt-1" style="line-height: 1.3;">${truncate(escapeHtml(item.deskripsi), 80)}</small>` : ''}
            </td>
            <td class="align-middle">
              <small class="text-muted">${truncate(escapeHtml(item.target) || '-', 50)}</small>
            </td>
            <td class="align-middle">
              <small class="text-muted"><i class="fas fa-calendar-alt me-1"></i>${periode}</small>
            </td>
            <td class="align-middle">${statusBadge}</td>
            <td class="align-middle text-center">
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-info border-0" onclick="window.RencanaStrategisModule.viewDetail('${item.id}')" title="Lihat Detail">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-outline-warning border-0" onclick="window.RencanaStrategisModule.edit('${item.id}')" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-outline-danger border-0" onclick="window.RencanaStrategisModule.delete('${item.id}')" title="Hapus">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
    
    return `
      <div class="card shadow-sm border-0" style="border-radius: 12px;">
        <div class="card-header bg-white d-flex justify-content-between align-items-center py-3 flex-wrap gap-2" style="border-radius: 12px 12px 0 0;">
          <div>
            <h5 class="mb-0"><i class="fas fa-table text-primary me-2"></i>Daftar Rencana Strategis</h5>
            <small class="text-muted">Total: ${state.data.length} data</small>
          </div>
          <div class="btn-group">
            <button class="btn btn-outline-primary" id="rs-refresh-btn" title="Refresh Data">
              <i class="fas fa-sync-alt me-1"></i>Refresh
            </button>
            <button class="btn btn-outline-success" id="rs-export-btn" title="Export ke Excel">
              <i class="fas fa-file-excel me-1"></i>Export
            </button>
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
                  <th class="border-0 py-3 text-center" style="width: 120px;"><i class="fas fa-cogs me-1 text-muted"></i>Aksi</th>
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
    // Form submit
    const form = $('rs-form');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
    
    // Toggle form
    const toggleBtn = $('rs-toggle-form');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleForm);
    }
    
    // Reset form
    const resetBtn = $('rs-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetForm);
    }
    
    // Cancel edit
    const cancelBtn = $('rs-cancel-edit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', cancelEdit);
    }
    
    // Refresh
    const refreshBtn = $('rs-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', refresh);
    }
    
    // Export
    const exportBtn = $('rs-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportData);
    }
  }
  
  function toggleForm() {
    state.showForm = !state.showForm;
    const body = $('rs-form-body');
    const btn = $('rs-toggle-form');
    
    if (body) {
      body.classList.toggle('d-none', !state.showForm);
    }
    if (btn) {
      btn.innerHTML = `<i class="fas fa-chevron-${state.showForm ? 'up' : 'down'}"></i>`;
      btn.title = `${state.showForm ? 'Sembunyikan' : 'Tampilkan'} Form`;
    }
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
      kode: $('rs-kode')?.value || '',
      visi_misi_id: ($('rs-misi')?.value || '').split('|')[0] || null,
      nama_rencana: $('rs-nama')?.value || '',
      deskripsi: $('rs-deskripsi')?.value || '',
      periode_mulai: $('rs-mulai')?.value || null,
      periode_selesai: $('rs-selesai')?.value || null,
      target: $('rs-target')?.value || '',
      status: $('rs-status')?.value || 'Draft'
    };
    
    // Validation
    if (!formData.nama_rencana.trim()) {
      alert('Nama rencana strategis wajib diisi!');
      $('rs-nama')?.focus();
      return;
    }
    
    try {
      if (state.currentId) {
        await api(`/api/rencana-strategis/${state.currentId}`, { 
          method: 'PUT', 
          body: formData 
        });
        alert('Data berhasil diupdate!');
      } else {
        await api('/api/rencana-strategis', { 
          method: 'POST', 
          body: formData 
        });
        alert('Data berhasil disimpan!');
      }
      
      // Reset and refresh
      state.currentId = null;
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
      
      await refresh();
      
    } catch (error) {
      console.error('Error saving:', error);
      alert('Gagal menyimpan data: ' + error.message);
    }
  }
  
  function resetForm() {
    state.currentId = null;
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
    generateKode().then(render);
  }
  
  function cancelEdit() {
    resetForm();
  }
  
  async function refresh() {
    console.log('🔄 Refreshing data...');
    state.isInitialized = false; // Force re-render
    await load();
  }
  
  function edit(id) {
    const record = state.data.find(i => i.id === id);
    if (!record) {
      alert('Data tidak ditemukan');
      return;
    }
    
    state.currentId = id;
    state.formValues = { ...record };
    state.showForm = true;
    
    render();
    
    // Scroll to form
    setTimeout(() => {
      const formSection = $('rs-form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      $('rs-nama')?.focus();
    }, 100);
  }
  
  async function deleteRecord(id) {
    const record = state.data.find(i => i.id === id);
    const name = record?.nama_rencana || 'data ini';
    
    if (!confirm(`Yakin ingin menghapus "${name}"?`)) {
      return;
    }
    
    try {
      await api(`/api/rencana-strategis/${id}`, { method: 'DELETE' });
      alert('Data berhasil dihapus!');
      await refresh();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Gagal menghapus data: ' + error.message);
    }
  }
  
  function viewDetail(id) {
    const record = state.data.find(i => i.id === id);
    if (!record) {
      alert('Data tidak ditemukan');
      return;
    }
    
    const statusBadges = {
      'Aktif': '<span class="badge bg-success">Aktif</span>',
      'Draft': '<span class="badge bg-warning text-dark">Draft</span>',
      'Selesai': '<span class="badge bg-secondary">Selesai</span>'
    };
    
    // Create modal
    const modalHtml = `
      <div class="modal fade" id="rs-detail-modal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <h5 class="modal-title text-white"><i class="fas fa-info-circle me-2"></i>Detail Rencana Strategis</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" onclick="document.getElementById('rs-detail-modal').remove()"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label text-muted small">Kode</label>
                  <p class="fw-semibold">${escapeHtml(record.kode) || '-'}</p>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted small">Status</label>
                  <p>${statusBadges[record.status] || '-'}</p>
                </div>
                <div class="col-12">
                  <label class="form-label text-muted small">Nama Rencana</label>
                  <p class="fw-semibold fs-5">${escapeHtml(record.nama_rencana) || '-'}</p>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted small">Periode Mulai</label>
                  <p>${formatDate(record.periode_mulai)}</p>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted small">Periode Selesai</label>
                  <p>${formatDate(record.periode_selesai)}</p>
                </div>
                <div class="col-12">
                  <label class="form-label text-muted small">Deskripsi</label>
                  <p class="bg-light p-3 rounded">${escapeHtml(record.deskripsi) || '-'}</p>
                </div>
                <div class="col-12">
                  <label class="form-label text-muted small">Target</label>
                  <p class="bg-light p-3 rounded">${escapeHtml(record.target) || '-'}</p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-warning" onclick="window.RencanaStrategisModule.edit('${id}'); document.getElementById('rs-detail-modal').remove();">
                <i class="fas fa-edit me-1"></i>Edit
              </button>
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('rs-detail-modal').remove()">Tutup</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('rs-detail-modal');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = document.getElementById('rs-detail-modal');
    modal.classList.add('show');
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    backdrop.id = 'rs-modal-backdrop';
    document.body.appendChild(backdrop);
    
    // Close on backdrop click
    backdrop.addEventListener('click', () => {
      modal.remove();
      backdrop.remove();
      document.body.classList.remove('modal-open');
    });
  }
  
  function exportData() {
    if (state.data.length === 0) {
      alert('Tidak ada data untuk di-export');
      return;
    }
    
    // Create CSV content
    const headers = ['Kode', 'Nama Rencana', 'Deskripsi', 'Target', 'Periode Mulai', 'Periode Selesai', 'Status'];
    const rows = state.data.map(item => [
      item.kode || '',
      item.nama_rencana || '',
      (item.deskripsi || '').replace(/"/g, '""'),
      (item.target || '').replace(/"/g, '""'),
      item.periode_mulai || '',
      item.periode_selesai || '',
      item.status || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rencana-strategis-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  
  // Cleanup function for when leaving the page
  function cleanup() {
    state.isInitialized = false;
    state.isLoading = false;
    loadMutex = false;
    console.log('🧹 RS Module cleaned up');
  }
  
  // Export module - CRITICAL: Export as multiple names for compatibility
  const moduleExport = {
    load,
    refresh,
    edit,
    delete: deleteRecord,
    viewDetail,
    cleanup,
    version: MODULE_VERSION,
    isLoaded: () => state.isInitialized
  };
  
  // Primary exports
  window.RencanaStrategisModule = moduleExport;
  window.RencanaStrategisClean = moduleExport;
  window.RencanaStrategisFast = moduleExport;
  window.RencanaStrategisUnified = moduleExport;
  
  console.log(`✅ RS Unified v${MODULE_VERSION} registered`);
  
})();
