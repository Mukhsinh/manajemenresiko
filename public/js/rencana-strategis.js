/**
 * RENCANA STRATEGIS MODULE v5.3-STABLE
 * 
 * CRITICAL RULES:
 * 1. ALWAYS display: Statistics Cards + Data Table + Form
 * 2. NEVER display: Selection List / "Pilih Rencana Strategis" view
 * 3. This is the ONLY correct interface for /rencana-strategis page
 * 
 * FIXED: Removed aggressive MutationObserver to prevent page stuck
 * Updated: 2026-01-09
 */

const RencanaStrategisModule = (() => {
  const MODULE_VERSION = '5.3-STABLE';
  const state = {
    data: [],
    missions: [],
    currentId: null,
    formValues: {},
    isLoading: false,
    isInitialized: false,
    showForm: true, // ALWAYS show form by default
    renderCount: 0,
    renderLocked: false,
    lastRenderTime: 0,
    maxRenderCount: 3 // Limit re-renders to prevent infinite loop
  };

  // API call helper with multiple fallbacks
  const api = () => {
    if (window.apiCall && typeof window.apiCall === 'function') {
      return window.apiCall;
    }
    if (window.app && window.app.apiCall && typeof window.app.apiCall === 'function') {
      return window.app.apiCall;
    }
    if (window.apiService && window.apiService.apiCall && typeof window.apiService.apiCall === 'function') {
      return window.apiService.apiCall;
    }
    // Ultimate fallback - direct fetch with token
    return async (endpoint, options = {}) => {
      const token = localStorage.getItem('token') || (window.currentSession?.access_token);
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
  };
  const getEl = (id) => document.getElementById(id);

  function getDefaultForm() {
    return {
      kode: '',
      visi_misi_id: '',
      nama_rencana: '',
      deskripsi: '',
      periode_mulai: '',
      periode_selesai: '',
      target: '',
      status: 'Draft'
    };
  }

  
  // GUARD: Prevent selection list from being rendered
  function preventSelectionList() {
    const container = getEl('rencana-strategis-content');
    if (!container) return;
    
    // Check if selection list is being rendered
    if (container.innerHTML.includes('Pilih Rencana Strategis') && 
        !container.querySelector('table')) {
      console.warn('⚠️ Selection list detected! Forcing proper interface...');
      renderInterface();
    }
  }
  
  async function load() {
    console.log(`🚀 Loading Rencana Strategis Module v${MODULE_VERSION}...`);
    console.log('📋 This module displays: Cards + Table + Form (NOT selection list)');
    
    // Prevent concurrent loading
    if (state.isLoading) {
      console.log('⚠️ Module is already loading, skipping...');
      return;
    }
    
    // Check if already initialized with proper interface
    const container = getEl('rencana-strategis-content');
    if (container && state.isInitialized && !state.isLoading) {
      const hasTable = container.querySelector('table');
      const hasCards = container.querySelector('.rencana-strategis-wrapper');
      
      if (hasTable && hasCards) {
        console.log('✅ Module already initialized with proper interface, skipping reload');
        return;
      }
    }
    
    state.isLoading = true;
    state.isInitialized = false;
    state.renderCount = 0;

    try {
      if (!container) {
        console.error('❌ Container rencana-strategis-content not found!');
        state.isLoading = false;
        return;
      }

      // Show loading spinner
      container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3 text-muted">Memuat data rencana strategis...</p></div>';

      await waitForAuth();
      await fetchData();

      state.formValues = getDefaultForm();
      await generateKode();

      // Render interface
      renderInterface();

      state.isInitialized = true;
      state.isLoading = false;
      
      // Mark container as managed by this module
      container.setAttribute('data-module', 'RencanaStrategisModule');
      container.setAttribute('data-version', MODULE_VERSION);
      
      console.log(`✅ Rencana Strategis Module v${MODULE_VERSION} loaded successfully`);

    } catch (error) {
      console.error('❌ Error loading Rencana Strategis:', error);
      state.isLoading = false;
      showError(error.message);
    }
  }

  async function waitForAuth() {
    if (window.waitForAuthReady) {
      try {
        await Promise.race([
          window.waitForAuthReady(1500),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 1500))
        ]);
      } catch (e) {
        console.warn('Auth timeout, continuing...');
      }
    }
  }

  async function fetchData() {
    try {
      const apiFunc = api();
      
      // Try authenticated endpoints first, fallback to public endpoints
      const [rencanaRes, visiRes] = await Promise.allSettled([
        apiFunc('/api/rencana-strategis').catch(async () => {
          // Fallback to public endpoint
          console.log('📋 Falling back to public rencana-strategis endpoint...');
          return apiFunc('/api/rencana-strategis/public').catch(() => []);
        }),
        apiFunc('/api/visi-misi').catch(async () => {
          // Fallback to public endpoint
          console.log('📋 Falling back to public visi-misi endpoint...');
          return apiFunc('/api/visi-misi/public').catch(() => []);
        })
      ]);
      
      state.data = rencanaRes.status === 'fulfilled' ? 
        (Array.isArray(rencanaRes.value) ? rencanaRes.value : (rencanaRes.value?.data || [])) : [];
      
      state.missions = visiRes.status === 'fulfilled' ? 
        (Array.isArray(visiRes.value) ? visiRes.value : (visiRes.value?.data || [])) : [];
      
      console.log('📊 Data loaded:', { rencana: state.data.length, visi: state.missions.length });
      
      // Debug: Log first item to verify kode and status fields
      if (state.data.length > 0) {
        console.log('📋 Sample data item:', {
          id: state.data[0].id,
          kode: state.data[0].kode,
          nama: state.data[0].nama_rencana,
          status: state.data[0].status
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      state.data = [];
      state.missions = [];
    }
  }

  function renderInterface() {
    const container = getEl('rencana-strategis-content');
    if (!container) return;

    console.log('🎨 Rendering complete interface with cards + form + table...');

    let html = '<div class="rencana-strategis-wrapper p-3">';
    
    // Always render stat cards first
    html += renderStatCards();
    
    // Always render form (collapsible)
    html += renderFormCard();
    
    // Then render table
    html += renderTableCard();
    html += '</div>';

    container.innerHTML = html;
    bindEvents();
    
    console.log('✅ Interface rendered: Cards + Form + Table displayed');
  }

  function renderStatCards() {
    const aktif = state.data.filter(i => i.status === 'Aktif').length;
    const draft = state.data.filter(i => i.status === 'Draft').length;
    const selesai = state.data.filter(i => i.status === 'Selesai').length;
    const total = state.data.length;

    return '<div class="row g-3 mb-4">' +
      // Card 1: Aktif - Hijau Cerah Solid
      '<div class="col-xl-3 col-md-6 col-sm-6">' +
        '<div class="card h-100 border-0 shadow-sm overflow-hidden" style="border-radius: 10px; background: #22c55e !important; max-height: 85px;">' +
          '<div class="card-body p-0">' +
            '<div class="d-flex align-items-center" style="height: 85px;">' +
              '<div class="flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 60px; height: 85px; background: rgba(255,255,255,0.15);">' +
                '<i class="fas fa-check-circle fa-lg text-white"></i>' +
              '</div>' +
              '<div class="flex-grow-1 p-2">' +
                '<h3 class="fw-bold text-white mb-0" style="font-size: 1.75rem;">' + aktif + '</h3>' +
                '<p class="text-white mb-0" style="font-size: 0.85rem; font-weight: 600;">Rencana Aktif</p>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // Card 2: Draft - Orange Cerah Solid
      '<div class="col-xl-3 col-md-6 col-sm-6">' +
        '<div class="card h-100 border-0 shadow-sm overflow-hidden" style="border-radius: 10px; background: #f59e0b !important; max-height: 85px;">' +
          '<div class="card-body p-0">' +
            '<div class="d-flex align-items-center" style="height: 85px;">' +
              '<div class="flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 60px; height: 85px; background: rgba(255,255,255,0.15);">' +
                '<i class="fas fa-edit fa-lg text-white"></i>' +
              '</div>' +
              '<div class="flex-grow-1 p-2">' +
                '<h3 class="fw-bold text-white mb-0" style="font-size: 1.75rem;">' + draft + '</h3>' +
                '<p class="text-white mb-0" style="font-size: 0.85rem; font-weight: 600;">Draft</p>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // Card 3: Selesai - Biru Cerah Solid
      '<div class="col-xl-3 col-md-6 col-sm-6">' +
        '<div class="card h-100 border-0 shadow-sm overflow-hidden" style="border-radius: 10px; background: #3b82f6 !important; max-height: 85px;">' +
          '<div class="card-body p-0">' +
            '<div class="d-flex align-items-center" style="height: 85px;">' +
              '<div class="flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 60px; height: 85px; background: rgba(255,255,255,0.15);">' +
                '<i class="fas fa-flag-checkered fa-lg text-white"></i>' +
              '</div>' +
              '<div class="flex-grow-1 p-2">' +
                '<h3 class="fw-bold text-white mb-0" style="font-size: 1.75rem;">' + selesai + '</h3>' +
                '<p class="text-white mb-0" style="font-size: 0.85rem; font-weight: 600;">Selesai</p>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // Card 4: Total - Ungu Cerah Solid
      '<div class="col-xl-3 col-md-6 col-sm-6">' +
        '<div class="card h-100 border-0 shadow-sm overflow-hidden" style="border-radius: 10px; background: #8b5cf6 !important; max-height: 85px;">' +
          '<div class="card-body p-0">' +
            '<div class="d-flex align-items-center" style="height: 85px;">' +
              '<div class="flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 60px; height: 85px; background: rgba(255,255,255,0.15);">' +
                '<i class="fas fa-list-alt fa-lg text-white"></i>' +
              '</div>' +
              '<div class="flex-grow-1 p-2">' +
                '<h3 class="fw-bold text-white mb-0" style="font-size: 1.75rem;">' + total + '</h3>' +
                '<p class="text-white mb-0" style="font-size: 0.85rem; font-weight: 600;">Total Rencana</p>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderFormCard() {
    const f = state.formValues;
    const isEdit = !!state.currentId;
    const isCollapsed = !state.showForm;
    
    return '<div class="card mb-4 shadow-sm border-0" id="rs-form-section">' +
      '<div class="card-header bg-white d-flex justify-content-between align-items-center" style="border-left: 4px solid #3b82f6; border-bottom: 1px solid #e5e7eb;">' +
        '<h5 class="mb-0" style="color: #1a1a1a !important;"><i class="fas fa-' + (isEdit ? 'edit' : 'plus-circle') + ' me-2" style="color: #3b82f6;"></i>' + (isEdit ? 'Edit Rencana Strategis' : 'Form Input Rencana Strategis') + '</h5>' +
        '<button type="button" class="btn btn-outline-secondary btn-sm" id="rs-toggle-form" title="' + (isCollapsed ? 'Tampilkan Form' : 'Sembunyikan Form') + '">' +
          '<i class="fas fa-chevron-' + (isCollapsed ? 'down' : 'up') + '"></i>' +
        '</button>' +
      '</div>' +
      '<div class="card-body' + (isCollapsed ? ' d-none' : '') + '" id="rs-form-body">' +
        '<form id="rs-form">' +
          '<div class="row g-3">' +
            // Row 1: Kode, Status, Misi
            '<div class="col-md-3">' +
              '<label class="form-label fw-semibold"><i class="fas fa-barcode me-1 text-primary"></i> Kode</label>' +
              '<input type="text" class="form-control bg-light" id="rs-kode" value="' + (f.kode || '') + '" readonly placeholder="Auto-generate">' +
              '<small class="text-muted">Kode otomatis</small>' +
            '</div>' +
            '<div class="col-md-3">' +
              '<label class="form-label fw-semibold"><i class="fas fa-flag me-1 text-warning"></i> Status</label>' +
              '<select class="form-select" id="rs-status">' +
                '<option value="Draft"' + (f.status === 'Draft' ? ' selected' : '') + '>📝 Draft</option>' +
                '<option value="Aktif"' + (f.status === 'Aktif' ? ' selected' : '') + '>✅ Aktif</option>' +
                '<option value="Selesai"' + (f.status === 'Selesai' ? ' selected' : '') + '>🏁 Selesai</option>' +
              '</select>' +
            '</div>' +
            '<div class="col-md-6">' +
              '<label class="form-label fw-semibold"><i class="fas fa-bullseye me-1 text-success"></i> Misi Terkait</label>' +
              '<select class="form-select" id="rs-misi">' +
                '<option value="">-- Pilih Misi --</option>' +
                renderMissionOptions() +
              '</select>' +
            '</div>' +
            // Row 2: Nama Rencana
            '<div class="col-12">' +
              '<label class="form-label fw-semibold"><i class="fas fa-file-alt me-1 text-info"></i> Nama Rencana Strategis <span class="text-danger">*</span></label>' +
              '<input type="text" class="form-control form-control-lg" id="rs-nama" value="' + (f.nama_rencana || '') + '" placeholder="Masukkan nama rencana strategis..." required>' +
            '</div>' +
            // Row 3: Periode
            '<div class="col-md-6">' +
              '<label class="form-label fw-semibold"><i class="fas fa-calendar-alt me-1 text-primary"></i> Periode Mulai</label>' +
              '<input type="date" class="form-control" id="rs-mulai" value="' + (f.periode_mulai || '') + '">' +
            '</div>' +
            '<div class="col-md-6">' +
              '<label class="form-label fw-semibold"><i class="fas fa-calendar-check me-1 text-success"></i> Periode Selesai</label>' +
              '<input type="date" class="form-control" id="rs-selesai" value="' + (f.periode_selesai || '') + '">' +
            '</div>' +
            // Row 4: Deskripsi
            '<div class="col-12">' +
              '<label class="form-label fw-semibold"><i class="fas fa-align-left me-1 text-secondary"></i> Deskripsi</label>' +
              '<textarea class="form-control" id="rs-deskripsi" rows="3" placeholder="Masukkan deskripsi rencana strategis...">' + (f.deskripsi || '') + '</textarea>' +
            '</div>' +
            // Row 5: Target
            '<div class="col-12">' +
              '<label class="form-label fw-semibold"><i class="fas fa-crosshairs me-1 text-danger"></i> Target</label>' +
              '<textarea class="form-control" id="rs-target" rows="2" placeholder="Masukkan target yang ingin dicapai...">' + (f.target || '') + '</textarea>' +
            '</div>' +
            // Row 6: Buttons
            '<div class="col-12 pt-3 border-top">' +
              '<div class="d-flex gap-2 flex-wrap">' +
                '<button type="submit" class="btn btn-primary btn-lg"><i class="fas fa-save me-2"></i>' + (isEdit ? 'Update Data' : 'Simpan Data') + '</button>' +
                '<button type="button" class="btn btn-outline-secondary" id="rs-reset-btn"><i class="fas fa-undo me-2"></i>Reset Form</button>' +
                (isEdit ? '<button type="button" class="btn btn-outline-danger" id="rs-cancel-edit"><i class="fas fa-times me-2"></i>Batal Edit</button>' : '') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</form>' +
      '</div>' +
    '</div>';
  }

  function renderTableCard() {
    return '<div class="card shadow-sm border-0" style="border-radius: 12px;">' +
      '<div class="card-header bg-white d-flex justify-content-between align-items-center py-3 flex-wrap gap-2" style="border-radius: 12px 12px 0 0; border-bottom: 1px solid #e5e7eb;">' +
        '<div>' +
          '<h5 class="mb-0" style="color: #1f2937 !important; font-weight: 700 !important; -webkit-text-fill-color: #1f2937 !important;"><i class="fas fa-table me-2" style="color: #3b82f6;"></i>Daftar Rencana Strategis</h5>' +
          '<small style="color: #6b7280 !important;">Total: ' + state.data.length + ' data</small>' +
        '</div>' +
        '<div class="btn-group">' +
          '<button class="btn btn-outline-primary" id="rs-refresh-btn" title="Refresh Data"><i class="fas fa-sync-alt me-1"></i>Refresh</button>' +
          '<button class="btn btn-outline-success" id="rs-export-btn" title="Export ke Excel"><i class="fas fa-file-excel me-1"></i>Export</button>' +
        '</div>' +
      '</div>' +
      '<div class="card-body p-0">' +
        '<div class="table-responsive">' +
          '<table class="table table-hover mb-0">' +
            '<thead style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">' +
              '<tr>' +
                '<th class="border-0 py-3" style="width: 120px;"><i class="fas fa-barcode me-1 text-muted"></i>Kode</th>' +
                '<th class="border-0 py-3"><i class="fas fa-file-alt me-1 text-muted"></i>Nama Rencana</th>' +
                '<th class="border-0 py-3" style="width: 150px;"><i class="fas fa-crosshairs me-1 text-muted"></i>Target</th>' +
                '<th class="border-0 py-3" style="width: 180px;"><i class="fas fa-calendar me-1 text-muted"></i>Periode</th>' +
                '<th class="border-0 py-3" style="width: 100px;"><i class="fas fa-flag me-1 text-muted"></i>Status</th>' +
                '<th class="border-0 py-3 text-center" style="width: 140px;"><i class="fas fa-cogs me-1 text-muted"></i>Aksi</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + renderTableRows() + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderTableRows() {
    if (!state.data || state.data.length === 0) {
      return '<tr><td colspan="6" class="text-center py-5 border-0">' +
        '<div class="py-4">' +
          '<div class="mb-3" style="width: 80px; height: 80px; margin: 0 auto; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
            '<i class="fas fa-inbox fa-2x text-muted"></i>' +
          '</div>' +
          '<h5 class="text-muted mb-2">Belum Ada Data</h5>' +
          '<p class="text-muted mb-3">Silakan isi form di atas untuk menambahkan rencana strategis baru</p>' +
          '<button class="btn btn-primary" onclick="RencanaStrategisModule.showAddForm()"><i class="fas fa-plus me-2"></i>Tambah Rencana Strategis</button>' +
        '</div>' +
      '</td></tr>';
    }

    console.log('📊 Rendering table rows, data count:', state.data.length);
    
    return state.data.map(function(item, index) {
      // Debug: Log each item's kode and status
      console.log('Row ' + index + ':', { 
        id: item.id, 
        kode: item.kode || 'MISSING', 
        status: item.status || 'MISSING' 
      });
      
      var statusBadge = getStatusBadgeFixed(item.status);
      var periode = formatPeriode(item.periode_mulai, item.periode_selesai);
      var rowBg = index % 2 === 0 ? '' : 'style="background-color: #fafbfc;"';
      var kodeDisplay = item.kode || generateFallbackKode(index);
      var itemId = item.id || '';
      
      return '<tr ' + rowBg + ' data-id="' + itemId + '">' +
        '<td class="align-middle" style="min-width: 100px; max-width: 130px;">' +
          '<span class="badge bg-light text-dark border fw-normal" style="font-size: 0.75rem; padding: 0.35rem 0.5rem; white-space: nowrap; display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis;">' + escapeHtml(kodeDisplay) + '</span>' +
        '</td>' +
        '<td class="align-middle" style="min-width: 200px;">' +
          '<div class="fw-semibold text-dark" style="word-wrap: break-word;">' + escapeHtml(item.nama_rencana || '-') + '</div>' +
          (item.deskripsi ? '<small class="text-muted d-block mt-1" style="line-height: 1.3; word-wrap: break-word;">' + escapeHtml(truncateText(item.deskripsi, 80)) + '</small>' : '') +
        '</td>' +
        '<td class="align-middle" style="min-width: 120px; max-width: 180px;"><small class="text-muted" style="word-wrap: break-word; display: block;">' + escapeHtml(truncateText(item.target || '-', 50)) + '</small></td>' +
        '<td class="align-middle" style="min-width: 140px; white-space: nowrap;"><small class="text-muted"><i class="fas fa-calendar-alt me-1"></i>' + periode + '</small></td>' +
        '<td class="align-middle" style="min-width: 90px; max-width: 110px;">' + statusBadge + '</td>' +
        '<td class="align-middle text-center" style="min-width: 130px; white-space: nowrap;">' +
          '<div class="btn-group btn-group-sm" role="group" style="gap: 4px;">' +
            '<button type="button" class="btn rs-action-btn" data-action="view" data-id="' + itemId + '" title="Lihat Detail" style="background: #0ea5e9; color: white; border: none; border-radius: 6px; padding: 0.35rem 0.5rem;"><i class="fas fa-eye"></i></button>' +
            '<button type="button" class="btn rs-action-btn" data-action="edit" data-id="' + itemId + '" title="Edit" style="background: #f59e0b; color: white; border: none; border-radius: 6px; padding: 0.35rem 0.5rem;"><i class="fas fa-edit"></i></button>' +
            '<button type="button" class="btn rs-action-btn" data-action="delete" data-id="' + itemId + '" title="Hapus" style="background: #ef4444; color: white; border: none; border-radius: 6px; padding: 0.35rem 0.5rem;"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  }
  
  // Helper function to escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Generate fallback kode if missing
  function generateFallbackKode(index) {
    var year = new Date().getFullYear();
    return 'RS-' + year + '-' + String(index + 1).padStart(3, '0');
  }
  
  // Fixed status badge with solid bright colors
  function getStatusBadgeFixed(status) {
    var statusText = status || 'Draft';
    var badgeStyle = 'display: inline-block; font-size: 0.75rem; padding: 0.4rem 0.75rem; border-radius: 6px; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.15);';
    
    if (statusText === 'Aktif') {
      return '<span class="badge" style="' + badgeStyle + ' background: #22c55e; color: white;"><i class="fas fa-check-circle me-1"></i>Aktif</span>';
    }
    if (statusText === 'Draft') {
      return '<span class="badge" style="' + badgeStyle + ' background: #f59e0b; color: white;"><i class="fas fa-edit me-1"></i>Draft</span>';
    }
    if (statusText === 'Selesai') {
      return '<span class="badge" style="' + badgeStyle + ' background: #3b82f6; color: white;"><i class="fas fa-flag-checkered me-1"></i>Selesai</span>';
    }
    return '<span class="badge" style="' + badgeStyle + ' background: #6b7280; color: white;">' + escapeHtml(statusText) + '</span>';
  }

  function renderMissionOptions() {
    if (!state.missions || state.missions.length === 0) {
      return '<option value="" disabled>Tidak ada misi tersedia</option>';
    }

    var options = '';
    state.missions.forEach(function(mission) {
      if (!mission.misi) return;
      var misiArray = mission.misi.split('\n').filter(function(m) { return m.trim(); });
      misiArray.forEach(function(misi, index) {
        var cleanMisi = misi.replace(/^\d+\.\s*/, '').trim();
        var value = mission.id + '|' + index + '|' + encodeURIComponent(cleanMisi);
        var selected = state.formValues.visi_misi_id === value ? ' selected' : '';
        options += '<option value="' + value + '"' + selected + '>' + truncateText(cleanMisi, 80) + '</option>';
      });
    });
    return options;
  }

  function formatPeriode(mulai, selesai) {
    if (!mulai && !selesai) return '-';
    var formatDate = function(d) {
      if (!d) return '';
      return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    return formatDate(mulai) + ' - ' + formatDate(selesai);
  }

  function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  function bindEvents() {
    var form = getEl('rs-form');
    if (form) form.addEventListener('submit', handleSubmit);
    
    var addBtn = getEl('rs-add-new');
    if (addBtn) addBtn.addEventListener('click', showAddForm);
    
    var toggleBtn = getEl('rs-toggle-form');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleForm);
    
    var closeBtn = getEl('rs-close-form');
    if (closeBtn) closeBtn.addEventListener('click', closeForm);
    
    var resetBtn = getEl('rs-reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetForm);
    
    var cancelEditBtn = getEl('rs-cancel-edit');
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', cancelEdit);
    
    var refreshBtn = getEl('rs-refresh-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', refreshData);
    
    var exportBtn = getEl('rs-export-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportData);
    
    // Bind action buttons using event delegation for better reliability
    bindActionButtons();
  }
  
  function bindActionButtons() {
    var container = getEl('rencana-strategis-content');
    if (!container) return;
    
    // Remove existing listener to prevent duplicates
    container.removeEventListener('click', handleActionClick);
    
    // Add event delegation for action buttons
    container.addEventListener('click', handleActionClick);
    
    console.log('✅ Action buttons bound with event delegation');
  }
  
  function handleActionClick(e) {
    var btn = e.target.closest('.rs-action-btn');
    if (!btn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    var action = btn.getAttribute('data-action');
    var id = btn.getAttribute('data-id');
    
    if (!id) {
      console.error('❌ No ID found for action button');
      return;
    }
    
    console.log('🔘 Action clicked:', action, 'ID:', id);
    
    // Find record to verify it exists
    var record = state.data.find(function(i) { return i.id === id; });
    if (!record) {
      console.error('❌ Record not found for ID:', id);
      alert('Data tidak ditemukan. Silakan refresh halaman.');
      return;
    }
    
    switch(action) {
      case 'view':
        viewDetail(id);
        break;
      case 'edit':
        startEdit(id);
        break;
      case 'delete':
        deleteRencana(id);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }
  
  function toggleForm() {
    state.showForm = !state.showForm;
    var formBody = getEl('rs-form-body');
    var toggleBtn = getEl('rs-toggle-form');
    
    if (formBody) {
      if (state.showForm) {
        formBody.classList.remove('d-none');
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
      } else {
        formBody.classList.add('d-none');
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
      }
    }
  }
  
  function cancelEdit() {
    state.currentId = null;
    state.formValues = getDefaultForm();
    generateKode().then(function() { renderInterface(); });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    var formData = {
      kode: getEl('rs-kode') ? getEl('rs-kode').value : '',
      visi_misi_id: getEl('rs-misi') ? getEl('rs-misi').value : '',
      nama_rencana: getEl('rs-nama') ? getEl('rs-nama').value : '',
      deskripsi: getEl('rs-deskripsi') ? getEl('rs-deskripsi').value : '',
      periode_mulai: getEl('rs-mulai') ? getEl('rs-mulai').value : '',
      periode_selesai: getEl('rs-selesai') ? getEl('rs-selesai').value : '',
      target: getEl('rs-target') ? getEl('rs-target').value : '',
      status: getEl('rs-status') ? getEl('rs-status').value : 'Draft'
    };

    if (formData.visi_misi_id && formData.visi_misi_id.indexOf('|') !== -1) {
      formData.visi_misi_id = formData.visi_misi_id.split('|')[0];
    }

    if (!formData.nama_rencana.trim()) {
      alert('Nama rencana wajib diisi!');
      return;
    }

    try {
      var apiFunc = api();
      if (state.currentId) {
        await apiFunc('/api/rencana-strategis/' + state.currentId, { method: 'PUT', body: formData });
        alert('Data berhasil diupdate!');
      } else {
        await apiFunc('/api/rencana-strategis', { method: 'POST', body: formData });
        alert('Data berhasil disimpan!');
      }
      
      closeForm();
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
    
    generateKode().then(function() {
      renderInterface();
      setTimeout(function() {
        var formSection = getEl('rs-form-section');
        var formBody = getEl('rs-form-body');
        
        // Make sure form is visible
        if (formBody && formBody.classList.contains('d-none')) {
          formBody.classList.remove('d-none');
          var toggleBtn = getEl('rs-toggle-form');
          if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        }
        
        if (formSection) {
          formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        var namaInput = getEl('rs-nama');
        if (namaInput) namaInput.focus();
      }, 100);
    });
  }

  function closeForm() {
    state.showForm = false;
    state.currentId = null;
    state.formValues = getDefaultForm();
    renderInterface();
  }

  function resetForm() {
    state.formValues = getDefaultForm();
    generateKode().then(function() { renderInterface(); });
  }

  async function refreshData() {
    console.log('🔄 Refreshing data...');
    await fetchData();
    renderInterface();
  }

  async function generateKode() {
    try {
      var apiFunc = api();
      var response = await apiFunc('/api/rencana-strategis/generate/kode/public');
      state.formValues.kode = response.kode || response;
    } catch (error) {
      var year = new Date().getFullYear();
      var random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      state.formValues.kode = 'RS-' + year + '-' + random;
    }
  }

  function viewDetail(id) {
    var record = state.data.find(function(i) { return i.id === id; });
    if (!record) {
      console.error('Record not found for ID:', id);
      alert('Data tidak ditemukan');
      return;
    }
    
    console.log('📋 Viewing detail for:', record.nama_rencana);
    
    // Create modal for detail view
    var modalHtml = '<div class="modal fade" id="rs-detail-modal" tabindex="-1">' +
      '<div class="modal-dialog modal-lg">' +
        '<div class="modal-content">' +
          '<div class="modal-header bg-primary text-white">' +
            '<h5 class="modal-title"><i class="fas fa-info-circle me-2"></i>Detail Rencana Strategis</h5>' +
            '<button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<div class="row g-3">' +
              '<div class="col-md-6">' +
                '<label class="form-label text-muted small">Kode</label>' +
                '<p class="fw-semibold">' + escapeHtml(record.kode || '-') + '</p>' +
              '</div>' +
              '<div class="col-md-6">' +
                '<label class="form-label text-muted small">Status</label>' +
                '<p>' + getStatusBadgeFixed(record.status) + '</p>' +
              '</div>' +
              '<div class="col-12">' +
                '<label class="form-label text-muted small">Nama Rencana</label>' +
                '<p class="fw-semibold fs-5">' + escapeHtml(record.nama_rencana || '-') + '</p>' +
              '</div>' +
              '<div class="col-md-6">' +
                '<label class="form-label text-muted small">Periode Mulai</label>' +
                '<p>' + (record.periode_mulai ? new Date(record.periode_mulai).toLocaleDateString('id-ID') : '-') + '</p>' +
              '</div>' +
              '<div class="col-md-6">' +
                '<label class="form-label text-muted small">Periode Selesai</label>' +
                '<p>' + (record.periode_selesai ? new Date(record.periode_selesai).toLocaleDateString('id-ID') : '-') + '</p>' +
              '</div>' +
              '<div class="col-12">' +
                '<label class="form-label text-muted small">Deskripsi</label>' +
                '<p class="bg-light p-3 rounded">' + escapeHtml(record.deskripsi || '-') + '</p>' +
              '</div>' +
              '<div class="col-12">' +
                '<label class="form-label text-muted small">Target</label>' +
                '<p class="bg-light p-3 rounded">' + escapeHtml(record.target || '-') + '</p>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-warning rs-modal-edit-btn" data-id="' + id + '"><i class="fas fa-edit me-1"></i>Edit</button>' +
            '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
    
    // Remove existing modal if any
    var existingModal = document.getElementById('rs-detail-modal');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Bind edit button in modal
    var editBtn = document.querySelector('.rs-modal-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', function() {
        var editId = this.getAttribute('data-id');
        var modalEl = document.getElementById('rs-detail-modal');
        if (modalEl) {
          var bsModal = bootstrap.Modal.getInstance(modalEl);
          if (bsModal) bsModal.hide();
        }
        startEdit(editId);
      });
    }
    
    // Show modal
    var modal = new bootstrap.Modal(document.getElementById('rs-detail-modal'));
    modal.show();
    
    // Clean up modal after hidden
    document.getElementById('rs-detail-modal').addEventListener('hidden.bs.modal', function() {
      this.remove();
    });
    
    // Add event listener for edit button in modal
    var editBtn = document.querySelector('.rs-modal-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', function() {
        var editId = this.getAttribute('data-id');
        modal.hide();
        setTimeout(function() {
          startEdit(editId);
        }, 300);
      });
    }
  }

  function startEdit(id) {
    var record = state.data.find(function(i) { return i.id === id; });
    if (!record) {
      console.error('Record not found for edit, ID:', id);
      alert('Data tidak ditemukan');
      return;
    }
    
    console.log('✏️ Starting edit for:', record.nama_rencana);
    
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
    setTimeout(function() {
      var formSection = getEl('rs-form-section');
      var formBody = getEl('rs-form-body');
      
      // Make sure form is visible
      if (formBody && formBody.classList.contains('d-none')) {
        formBody.classList.remove('d-none');
        var toggleBtn = getEl('rs-toggle-form');
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
      }
      
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      // Focus on nama input
      var namaInput = getEl('rs-nama');
      if (namaInput) namaInput.focus();
    }, 100);
  }

  async function deleteRencana(id) {
    console.log('🗑️ Delete requested for ID:', id);
    
    if (!confirm('Apakah Anda yakin ingin menghapus rencana strategis ini?')) {
      console.log('Delete cancelled by user');
      return;
    }
    
    try {
      var apiFunc = api();
      await apiFunc('/api/rencana-strategis/' + id, { method: 'DELETE' });
      alert('Data berhasil dihapus!');
      await refreshData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Gagal menghapus: ' + error.message);
    }
  }

  async function exportData() {
    try {
      var token = localStorage.getItem('token');
      var headers = token ? { 'Authorization': 'Bearer ' + token } : {};
      var response = await fetch('/api/rencana-strategis/actions/export', { headers: headers });
      
      if (!response.ok) throw new Error('Gagal export data');
      
      var blob = await response.blob();
      var url = window.URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'rencana-strategis-' + new Date().toISOString().split('T')[0] + '.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Gagal export: ' + error.message);
    }
  }

  function showError(message) {
    var container = getEl('rencana-strategis-content');
    if (container) {
      container.innerHTML = '<div class="alert alert-danger m-4">' +
        '<h5><i class="fas fa-exclamation-triangle me-2"></i>Error</h5>' +
        '<p class="mb-3">' + message + '</p>' +
        '<button onclick="RencanaStrategisModule.load()" class="btn btn-primary"><i class="fas fa-sync me-1"></i> Coba Lagi</button>' +
      '</div>';
    }
  }

  /**
   * Cleanup function - Called when navigating away from rencana-strategis page
   */
  function cleanup() {
    console.log('🧹 RencanaStrategisModule cleanup called');
    
    // Reset state
    state.isInitialized = false;
    state.isLoading = false;
    state.renderCount = 0;
    
    console.log('✅ RencanaStrategisModule cleanup complete');
  }

  return {
    load: load,
    viewDetail: viewDetail,
    startEdit: startEdit,
    deleteRencana: deleteRencana,
    showAddForm: showAddForm,
    refreshData: refreshData,
    cleanup: cleanup,
    state: state,
    version: MODULE_VERSION
  };
})();

// Global exports
window.RencanaStrategisModule = RencanaStrategisModule;

// Legacy function aliases for backward compatibility
window.viewDetail = function(id) { RencanaStrategisModule.viewDetail(id); };
window.startEdit = function(id) { RencanaStrategisModule.startEdit(id); };
window.deleteRencana = function(id) { RencanaStrategisModule.deleteRencana(id); };
window.editRencanaStrategis = function(id) { RencanaStrategisModule.startEdit(id); };
window.deleteRencanaStrategis = function(id) { RencanaStrategisModule.deleteRencana(id); };

// Simple load function for external calls
window.loadRencanaStrategis = function() {
  console.log('🔄 loadRencanaStrategis called');
  return RencanaStrategisModule.load();
};

console.log('✅ RencanaStrategisModule loaded and ready');
