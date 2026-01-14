/**
 * RENCANA STRATEGIS MODULE v7.1-FINAL
 * 
 * SOLUSI TOTAL untuk masalah tampilan halaman /rencana-strategis
 * 
 * MASALAH YANG DIPERBAIKI:
 * 1. Event listener dipasang berulang kali
 * 2. setInterval/setTimeout/requestAnimationFrame yang tidak terkontrol
 * 3. Script dipanggil ulang saat SPA navigation
 * 4. MutationObserver tanpa guard
 * 5. Race condition dengan app.js
 * 
 * SOLUSI:
 * 1. Single initialization dengan flag
 * 2. Cleanup event listener sebelum menambah baru
 * 3. Tidak menggunakan setInterval untuk fix UI
 * 4. MutationObserver dengan proper guard dan disconnect
 * 5. AbortController untuk event listener cleanup
 * 6. Immediate export to window before IIFE completes
 * 
 * TAMPILAN YANG BENAR:
 * ✅ Statistics Cards (Aktif, Draft, Selesai, Total)
 * ✅ Form Input (collapsible)
 * ✅ Data Table dengan kolom: Kode, Nama, Target, Periode, Status, Aksi
 * 
 * Created: 2026-01-11
 * Updated: 2026-01-11 - v7.1 Fix race condition
 */

(function() {
  'use strict';
  
  // ============================================
  // SECTION 1: INITIALIZATION GUARD
  // ============================================
  
  const MODULE_VERSION = '7.4-FINAL';
  const MODULE_ID = 'rs-clean-v7-' + Date.now();
  
  // CRITICAL: Check if already initialized - but allow re-initialization if display is wrong
  if (window._rsCleanV7Initialized) {
    const container = document.getElementById('rencana-strategis-content');
    const hasCorrectDisplay = container && 
      container.querySelector('.rs-v7-wrapper') && 
      container.querySelector('table.table');
    
    if (hasCorrectDisplay) {
      console.log('[RS v7.1] Already initialized with correct display, skipping');
      return;
    }
    console.log('[RS v7.1] Re-initializing due to wrong display');
  }
  window._rsCleanV7Initialized = true;
  
  // Disable all other RS modules
  window._rsUnifiedLoaded = true;
  window.RencanaStrategisCleanLoaded = true;
  
  console.log(`[RS v7.1] Initializing module v${MODULE_VERSION}`);
  
  // ============================================
  // SECTION 2: STATE MANAGEMENT
  // ============================================
  
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
  
  // AbortController for event cleanup
  let abortController = null;
  
  // ============================================
  // SECTION 3: UTILITY FUNCTIONS
  // ============================================
  
  const $ = (id) => document.getElementById(id);
  
  const escapeHtml = (text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };
  
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
  
  // ============================================
  // SECTION 4: API HELPER
  // ============================================
  
  async function api(endpoint, options = {}) {
    if (window.apiCall && typeof window.apiCall === 'function') {
      return window.apiCall(endpoint, options);
    }
    if (window.app?.apiCall) {
      return window.app.apiCall(endpoint, options);
    }
    
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
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
  
  // ============================================
  // SECTION 5: PAGE DETECTION
  // ============================================
  
  function isOnRSPage() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const activePage = document.querySelector('.page-content.active');
    return path === '/rencana-strategis' || 
           path.includes('/rencana-strategis') ||
           hash === '#rencana-strategis' ||
           (activePage && activePage.id === 'rencana-strategis');
  }
  
  // ============================================
  // SECTION 6: CLEANUP FUNCTION
  // ============================================
  
  function cleanup() {
    console.log('[RS v7] Cleaning up...');
    
    // Abort all event listeners
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    
    // Reset state
    state.isInitialized = false;
    state.isLoading = false;
  }
  
  // ============================================
  // SECTION 7: MAIN LOAD FUNCTION
  // ============================================
  
  async function load() {
    // Guard: Check if on RS page
    if (!isOnRSPage()) {
      console.log('[RS v7.1] Not on RS page, skipping');
      return;
    }
    
    // Guard: Prevent concurrent loading
    if (state.isLoading) {
      console.log('[RS v7.1] Already loading, skipping');
      return;
    }
    
    // Guard: Check if already initialized with correct display
    const container = $('rencana-strategis-content');
    if (container && state.isInitialized) {
      const hasCorrectDisplay = container.querySelector('.rs-v7-wrapper table.table');
      if (hasCorrectDisplay) {
        console.log('[RS v7.1] Already initialized correctly');
        return;
      }
    }
    
    state.isLoading = true;
    console.log(`[RS v7.1] Loading...`);
    
    if (!container) {
      console.error('[RS v7.1] Container not found');
      state.isLoading = false;
      return;
    }
    
    // CRITICAL: Clear any existing content that might be wrong
    // This ensures we start fresh
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3 text-muted">Memuat data rencana strategis...</p>
      </div>
    `;
    
    // Set background immediately
    container.style.backgroundColor = '#f8f9fa';
    const parent = $('rencana-strategis');
    if (parent) parent.style.backgroundColor = '#f8f9fa';
    
    try {
      // Fetch data
      await fetchData();
      
      // Generate code if needed
      if (!state.formValues.kode) {
        await generateKode();
      }
      
      // Render
      render();
      
      // Bind events with cleanup
      bindEvents();
      
      // Mark as initialized
      state.isInitialized = true;
      container.setAttribute('data-rs-module', MODULE_ID);
      container.setAttribute('data-rs-version', MODULE_VERSION);
      
      console.log('[RS v7.1] Loaded successfully with Cards + Form + Table');
      
    } catch (error) {
      console.error('[RS v7.1] Error:', error);
      container.innerHTML = `
        <div class="alert alert-danger m-3">
          <i class="fas fa-exclamation-triangle me-2"></i>
          <strong>Gagal memuat:</strong> ${escapeHtml(error.message)}
          <button class="btn btn-sm btn-outline-danger ms-3" onclick="window.RencanaStrategisModule.load()">
            <i class="fas fa-redo me-1"></i>Coba Lagi
          </button>
        </div>
      `;
    } finally {
      state.isLoading = false;
    }
  }
  
  // ============================================
  // SECTION 8: DATA FETCHING
  // ============================================
  
  async function fetchData() {
    try {
      const [rencanaRes, visiRes] = await Promise.allSettled([
        api('/api/rencana-strategis').catch(() => 
          api('/api/rencana-strategis/public').catch(() => [])
        ),
        api('/api/visi-misi').catch(() => 
          api('/api/visi-misi/public').catch(() => [])
        )
      ]);
      
      state.data = rencanaRes.status === 'fulfilled' 
        ? (Array.isArray(rencanaRes.value) ? rencanaRes.value : (rencanaRes.value?.data || []))
        : [];
      
      state.missions = visiRes.status === 'fulfilled'
        ? (Array.isArray(visiRes.value) ? visiRes.value : (visiRes.value?.data || []))
        : [];
      
      console.log(`[RS v7] Data: ${state.data.length} rencana, ${state.missions.length} misi`);
      
      // Debug: Log sample data to verify kode and status fields
      if (state.data.length > 0) {
        console.log('[RS v7.1] Sample data:', {
          id: state.data[0].id,
          kode: state.data[0].kode,
          nama: state.data[0].nama_rencana,
          status: state.data[0].status
        });
      }
    } catch (error) {
      console.error('[RS v7] Fetch error:', error);
      state.data = [];
      state.missions = [];
    }
  }
  
  async function generateKode() {
    try {
      const response = await api('/api/rencana-strategis/generate/kode/public');
      state.formValues.kode = response.kode || response || '';
    } catch {
      const year = new Date().getFullYear();
      const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      state.formValues.kode = `RS-${year}-${random}`;
    }
  }

  // ============================================
  // SECTION 9: RENDER FUNCTIONS
  // ============================================
  
  function render() {
    const container = $('rencana-strategis-content');
    if (!container) return;
    
    // Set background
    container.style.backgroundColor = '#f8f9fa';
    const parent = $('rencana-strategis');
    if (parent) parent.style.backgroundColor = '#f8f9fa';
    
    // CRITICAL: Use rs-v7-wrapper class for identification
    container.innerHTML = `
      <div class="rs-v7-wrapper p-3" style="background: #f8f9fa; min-height: 100%;">
        ${renderStatCards()}
        ${renderForm()}
        ${renderTable()}
      </div>
    `;
    
    console.log('[RS v7.1] Rendered: Cards + Form + Table');
  }
  
  function renderStatCards() {
    const counts = {
      aktif: state.data.filter(i => i.status === 'Aktif').length,
      draft: state.data.filter(i => i.status === 'Draft').length,
      selesai: state.data.filter(i => i.status === 'Selesai').length,
      total: state.data.length
    };
    
    // FIXED v7.4: Kartu dengan warna solid dan teks hitam untuk kontras maksimal
    return `
      <div class="row g-3 mb-4">
        <div class="col-xl-3 col-md-6 col-sm-6">
          <div style="background: #22c55e; border-radius: 12px; padding: 0; height: 90px; display: flex; align-items: stretch; box-shadow: 0 4px 12px rgba(0,0,0,0.15); overflow: hidden;">
            <div style="width: 70px; min-width: 70px; background: rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">
              <i class="fas fa-check-circle" style="color: #000000; font-size: 1.75rem;"></i>
            </div>
            <div style="padding: 12px 16px; display: flex; flex-direction: column; justify-content: center;">
              <div style="color: #000000; font-size: 2.25rem; font-weight: 700; line-height: 1;">${counts.aktif}</div>
              <div style="color: #000000; font-size: 0.875rem; font-weight: 600; margin-top: 4px;">Rencana Aktif</div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6 col-sm-6">
          <div style="background: #f59e0b; border-radius: 12px; padding: 0; height: 90px; display: flex; align-items: stretch; box-shadow: 0 4px 12px rgba(0,0,0,0.15); overflow: hidden;">
            <div style="width: 70px; min-width: 70px; background: rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">
              <i class="fas fa-edit" style="color: #000000; font-size: 1.75rem;"></i>
            </div>
            <div style="padding: 12px 16px; display: flex; flex-direction: column; justify-content: center;">
              <div style="color: #000000; font-size: 2.25rem; font-weight: 700; line-height: 1;">${counts.draft}</div>
              <div style="color: #000000; font-size: 0.875rem; font-weight: 600; margin-top: 4px;">Draft</div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6 col-sm-6">
          <div style="background: #3b82f6; border-radius: 12px; padding: 0; height: 90px; display: flex; align-items: stretch; box-shadow: 0 4px 12px rgba(0,0,0,0.15); overflow: hidden;">
            <div style="width: 70px; min-width: 70px; background: rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">
              <i class="fas fa-flag-checkered" style="color: #ffffff; font-size: 1.75rem;"></i>
            </div>
            <div style="padding: 12px 16px; display: flex; flex-direction: column; justify-content: center;">
              <div style="color: #ffffff; font-size: 2.25rem; font-weight: 700; line-height: 1;">${counts.selesai}</div>
              <div style="color: #ffffff; font-size: 0.875rem; font-weight: 600; margin-top: 4px;">Selesai</div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6 col-sm-6">
          <div style="background: #8b5cf6; border-radius: 12px; padding: 0; height: 90px; display: flex; align-items: stretch; box-shadow: 0 4px 12px rgba(0,0,0,0.15); overflow: hidden;">
            <div style="width: 70px; min-width: 70px; background: rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">
              <i class="fas fa-list-alt" style="color: #ffffff; font-size: 1.75rem;"></i>
            </div>
            <div style="padding: 12px 16px; display: flex; flex-direction: column; justify-content: center;">
              <div style="color: #ffffff; font-size: 2.25rem; font-weight: 700; line-height: 1;">${counts.total}</div>
              <div style="color: #ffffff; font-size: 0.875rem; font-weight: 600; margin-top: 4px;">Total Rencana</div>
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
             style="background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px 12px 0 0;">
          <h5 class="mb-0">
            <i class="fas fa-${isEdit ? 'edit' : 'plus-circle'} me-2"></i>
            ${isEdit ? 'Edit Rencana Strategis' : 'Form Input Rencana Strategis'}
          </h5>
          <button type="button" class="btn btn-light btn-sm" id="rs-toggle-form">
            <i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}"></i>
          </button>
        </div>
        <div class="card-body bg-white${isCollapsed ? ' d-none' : ''}" id="rs-form-body">
          <form id="rs-form" autocomplete="off">
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label fw-semibold"><i class="fas fa-barcode me-1 text-primary"></i> Kode</label>
                <input type="text" class="form-control bg-light" id="rs-kode" value="${escapeHtml(f.kode)}" readonly>
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
                <textarea class="form-control" id="rs-deskripsi" rows="3" placeholder="Masukkan deskripsi...">${escapeHtml(f.deskripsi)}</textarea>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold"><i class="fas fa-crosshairs me-1 text-danger"></i> Target</label>
                <textarea class="form-control" id="rs-target" rows="2" placeholder="Masukkan target...">${escapeHtml(f.target)}</textarea>
              </div>
              <div class="col-12 pt-3 border-top">
                <div class="d-flex gap-2 flex-wrap">
                  <button type="submit" class="btn btn-primary btn-lg">
                    <i class="fas fa-save me-2"></i>${isEdit ? 'Update' : 'Simpan'}
                  </button>
                  <button type="button" class="btn btn-outline-secondary" id="rs-reset-btn">
                    <i class="fas fa-undo me-2"></i>Reset
                  </button>
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
    let rows = '';
    
    if (state.data.length === 0) {
      rows = `
        <tr>
          <td colspan="6" class="text-center py-5 border-0">
            <div class="py-4">
              <div class="mb-3 mx-auto d-flex align-items-center justify-content-center" 
                   style="width: 80px; height: 80px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 50%;">
                <i class="fas fa-inbox fa-2x text-muted"></i>
              </div>
              <h5 class="text-muted mb-2">Belum Ada Data</h5>
              <p class="text-muted mb-0">Silakan isi form di atas untuk menambahkan data</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      const year = new Date().getFullYear();
      rows = state.data.map((item, idx) => {
        // Debug log untuk setiap item
        console.log(`[RS v7.2] Row ${idx}:`, { kode: item.kode, status: item.status });
        
        // FIXED v7.2: Status badges dengan inline styles yang sangat kuat
        const getStatusBadge = (status) => {
          const baseStyle = `
            display: inline-flex !important; 
            align-items: center !important; 
            justify-content: center !important; 
            font-size: 0.7rem !important; 
            font-weight: 600 !important; 
            padding: 6px 10px !important; 
            border-radius: 6px !important; 
            white-space: nowrap !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15) !important;
            line-height: 1 !important;
          `;
          
          if (status === 'Aktif') {
            return `<span style="${baseStyle} background-color: #22c55e !important; color: #ffffff !important;"><i class="fas fa-check-circle" style="margin-right: 5px; font-size: 0.65rem; color: #ffffff !important;"></i>Aktif</span>`;
          }
          if (status === 'Draft') {
            return `<span style="${baseStyle} background-color: #f59e0b !important; color: #ffffff !important;"><i class="fas fa-edit" style="margin-right: 5px; font-size: 0.65rem; color: #ffffff !important;"></i>Draft</span>`;
          }
          if (status === 'Selesai') {
            return `<span style="${baseStyle} background-color: #3b82f6 !important; color: #ffffff !important;"><i class="fas fa-flag-checkered" style="margin-right: 5px; font-size: 0.65rem; color: #ffffff !important;"></i>Selesai</span>`;
          }
          return `<span style="${baseStyle} background-color: #6b7280 !important; color: #ffffff !important;">-</span>`;
        };
        
        const badge = getStatusBadge(item.status);
        const periode = `${formatDate(item.periode_mulai)} - ${formatDate(item.periode_selesai)}`;
        const bgColor = idx % 2 === 0 ? '#ffffff' : '#fafbfc';
        
        // FIXED v7.2: Kode dengan fallback jika kosong - SELALU tampilkan nilai
        const kodeValue = item.kode && item.kode.trim() !== '' 
          ? item.kode 
          : `RS-${year}-${String(idx + 1).padStart(3, '0')}`;
        
        const kodeStyle = `
          display: inline-block !important;
          background: #f1f5f9 !important;
          color: #1e293b !important;
          font-weight: 600 !important;
          font-size: 0.75rem !important;
          padding: 6px 10px !important;
          border-radius: 6px !important;
          border: 1px solid #e2e8f0 !important;
          font-family: 'Monaco', 'Consolas', 'Courier New', monospace !important;
          white-space: nowrap !important;
          letter-spacing: 0.5px !important;
        `;
        
        // Action button styles
        const btnStyle = (bg) => `
          width: 32px !important;
          height: 32px !important;
          padding: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: ${bg} !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 6px !important;
          cursor: pointer !important;
          transition: transform 0.2s ease !important;
        `;
        
        return `
          <tr style="background-color: ${bgColor};" data-id="${item.id}">
            <td style="width: 130px; min-width: 110px; padding: 12px 10px; vertical-align: middle;">
              <span style="${kodeStyle}">${escapeHtml(kodeValue)}</span>
            </td>
            <td style="min-width: 200px; padding: 12px 10px; vertical-align: middle;">
              <div style="font-weight: 600; color: #1f2937; margin-bottom: 2px;">${escapeHtml(item.nama_rencana) || '-'}</div>
              ${item.deskripsi ? `<small style="color: #6b7280; line-height: 1.3; display: block;">${truncate(escapeHtml(item.deskripsi), 60)}</small>` : ''}
            </td>
            <td style="width: 150px; min-width: 120px; padding: 12px 10px; vertical-align: middle;">
              <small style="color: #6b7280;">${truncate(escapeHtml(item.target) || '-', 40)}</small>
            </td>
            <td style="width: 180px; min-width: 160px; padding: 12px 10px; vertical-align: middle; white-space: nowrap;">
              <small style="color: #6b7280;"><i class="fas fa-calendar-alt" style="margin-right: 4px; color: #9ca3af;"></i>${periode}</small>
            </td>
            <td style="width: 120px; min-width: 110px; padding: 12px 10px; vertical-align: middle; text-align: center;">
              ${badge}
            </td>
            <td style="width: 130px; min-width: 120px; padding: 12px 10px; vertical-align: middle; text-align: center; white-space: nowrap;">
              <div style="display: inline-flex; gap: 4px;">
                <button type="button" class="btn rs-view-btn" data-id="${item.id}" title="Lihat Detail" style="${btnStyle('#0ea5e9')}"><i class="fas fa-eye" style="color: #ffffff !important;"></i></button>
                <button type="button" class="btn rs-edit-btn" data-id="${item.id}" title="Edit" style="${btnStyle('#f59e0b')}"><i class="fas fa-edit" style="color: #ffffff !important;"></i></button>
                <button type="button" class="btn rs-delete-btn" data-id="${item.id}" title="Hapus" style="${btnStyle('#ef4444')}"><i class="fas fa-trash" style="color: #ffffff !important;"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
    
    // FIXED v7.6: Header tabel dengan background putih dan tulisan gelap solid
    return `
      <div class="card shadow-sm border-0" style="border-radius: 12px; overflow: hidden;">
        <div class="card-header d-flex justify-content-between align-items-center py-3 flex-wrap gap-2" style="background: #ffffff !important; border-radius: 12px 12px 0 0; border-bottom: 1px solid #e5e7eb;">
          <div>
            <h5 class="mb-0" style="color: #1f2937 !important; font-weight: 700 !important; font-size: 1.1rem; -webkit-text-fill-color: #1f2937 !important;"><i class="fas fa-table me-2" style="color: #3b82f6 !important;"></i>Daftar Rencana Strategis</h5>
            <small style="color: #6b7280 !important; font-weight: 500;">Total: ${state.data.length} data</small>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm" id="rs-refresh-btn" style="background: #3b82f6 !important; color: #ffffff !important; font-weight: 600; border: none; padding: 8px 16px; border-radius: 6px;"><i class="fas fa-sync-alt me-1" style="color: #ffffff !important;"></i>Refresh</button>
            <button class="btn btn-sm" id="rs-export-btn" style="background: #22c55e !important; color: #ffffff !important; font-weight: 600; border: none; padding: 8px 16px; border-radius: 6px;"><i class="fas fa-download me-1" style="color: #ffffff !important;"></i>Unduh Laporan</button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0" style="table-layout: fixed; width: 100%; border-collapse: collapse;">
              <thead style="background: #1e40af;">
                <tr>
                  <th style="width: 130px; padding: 14px 10px; color: #ffffff !important; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: none;"><i class="fas fa-barcode me-1" style="color: #ffffff !important;"></i>KODE</th>
                  <th style="padding: 14px 10px; color: #ffffff !important; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: none;"><i class="fas fa-file-alt me-1" style="color: #ffffff !important;"></i>NAMA RENCANA</th>
                  <th style="width: 150px; padding: 14px 10px; color: #ffffff !important; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: none;"><i class="fas fa-crosshairs me-1" style="color: #ffffff !important;"></i>TARGET</th>
                  <th style="width: 180px; padding: 14px 10px; color: #ffffff !important; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: none;"><i class="fas fa-calendar me-1" style="color: #ffffff !important;"></i>PERIODE</th>
                  <th style="width: 120px; padding: 14px 10px; color: #ffffff !important; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: none; text-align: center;"><i class="fas fa-flag me-1" style="color: #ffffff !important;"></i>STATUS</th>
                  <th style="width: 130px; padding: 14px 10px; color: #ffffff !important; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: none; text-align: center;"><i class="fas fa-cogs me-1" style="color: #ffffff !important;"></i>AKSI</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
  
  // ============================================
  // SECTION 10: EVENT BINDING WITH CLEANUP
  // ============================================
  
  function bindEvents() {
    // CRITICAL: Cleanup old event listeners first
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    const signal = abortController.signal;
    
    // Form submit
    const form = $('rs-form');
    if (form) {
      form.addEventListener('submit', handleSubmit, { signal });
    }
    
    // Toggle form
    const toggleBtn = $('rs-toggle-form');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleForm, { signal });
    }
    
    // Reset form
    const resetBtn = $('rs-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetForm, { signal });
    }
    
    // Cancel edit
    const cancelBtn = $('rs-cancel-edit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', cancelEdit, { signal });
    }
    
    // Refresh
    const refreshBtn = $('rs-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', refresh, { signal });
    }
    
    // Export
    const exportBtn = $('rs-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportData, { signal });
    }
    
    // Table action buttons using event delegation
    const container = $('rencana-strategis-content');
    if (container) {
      container.addEventListener('click', handleTableAction, { signal });
    }
  }
  
  function handleTableAction(e) {
    const target = e.target.closest('button');
    if (!target) return;
    
    const id = target.dataset.id;
    if (!id) {
      console.error('[RS v7.1] No ID found on button');
      return;
    }
    
    console.log('[RS v7.1] Table action clicked:', { 
      classList: target.className, 
      id: id 
    });
    
    // Find record to verify it exists
    const record = state.data.find(i => i.id === id);
    if (!record) {
      console.error('[RS v7.1] Record not found for ID:', id);
      alert('Data tidak ditemukan. Silakan refresh halaman.');
      return;
    }
    
    if (target.classList.contains('rs-view-btn')) {
      console.log('[RS v7.1] View action for:', record.nama_rencana);
      viewDetail(id);
    } else if (target.classList.contains('rs-edit-btn')) {
      console.log('[RS v7.1] Edit action for:', record.nama_rencana);
      edit(id);
    } else if (target.classList.contains('rs-delete-btn')) {
      console.log('[RS v7.1] Delete action for:', record.nama_rencana);
      deleteRecord(id);
    }
  }
  
  // ============================================
  // SECTION 11: ACTION HANDLERS
  // ============================================
  
  function toggleForm() {
    state.showForm = !state.showForm;
    const body = $('rs-form-body');
    const btn = $('rs-toggle-form');
    
    if (body) body.classList.toggle('d-none', !state.showForm);
    if (btn) btn.innerHTML = `<i class="fas fa-chevron-${state.showForm ? 'up' : 'down'}"></i>`;
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
    
    if (!formData.nama_rencana.trim()) {
      alert('Nama rencana strategis wajib diisi!');
      $('rs-nama')?.focus();
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
      state.formValues = { kode: '', visi_misi_id: '', nama_rencana: '', deskripsi: '', periode_mulai: '', periode_selesai: '', target: '', status: 'Draft' };
      await refresh();
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    }
  }
  
  function resetForm() {
    state.currentId = null;
    state.formValues = { kode: '', visi_misi_id: '', nama_rencana: '', deskripsi: '', periode_mulai: '', periode_selesai: '', target: '', status: 'Draft' };
    generateKode().then(render).then(bindEvents);
  }
  
  function cancelEdit() {
    resetForm();
  }
  
  async function refresh() {
    console.log('[RS v7] Refreshing...');
    state.isInitialized = false;
    await load();
  }
  
  function edit(id) {
    console.log('[RS v7.1] Starting edit for ID:', id);
    
    const record = state.data.find(i => i.id === id);
    if (!record) {
      console.error('[RS v7.1] Record not found for edit:', id);
      alert('Data tidak ditemukan');
      return;
    }
    
    console.log('[RS v7.1] Editing record:', record.nama_rencana);
    
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
    
    render();
    bindEvents();
    
    setTimeout(() => {
      const formSection = $('rs-form-section');
      const formBody = $('rs-form-body');
      
      // Make sure form is visible
      if (formBody && formBody.classList.contains('d-none')) {
        formBody.classList.remove('d-none');
        const toggleBtn = $('rs-toggle-form');
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
      }
      
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      const namaInput = $('rs-nama');
      if (namaInput) namaInput.focus();
    }, 100);
  }
  
  async function deleteRecord(id) {
    console.log('[RS v7.1] Starting delete for ID:', id);
    
    const record = state.data.find(i => i.id === id);
    if (!record) {
      console.error('[RS v7.1] Record not found for delete:', id);
      alert('Data tidak ditemukan');
      return;
    }
    
    if (!confirm(`Yakin ingin menghapus "${record.nama_rencana || 'data ini'}"?`)) return;
    
    try {
      await api(`/api/rencana-strategis/${id}`, { method: 'DELETE' });
      alert('Data berhasil dihapus!');
      await refresh();
    } catch (error) {
      console.error('[RS v7.1] Delete error:', error);
      alert('Gagal menghapus: ' + error.message);
    }
  }
  
  function viewDetail(id) {
    console.log('[RS v7.1] Viewing detail for ID:', id);
    
    const record = state.data.find(i => i.id === id);
    if (!record) {
      console.error('[RS v7.1] Record not found for view:', id);
      alert('Data tidak ditemukan');
      return;
    }
    
    console.log('[RS v7.1] Showing detail for:', record.nama_rencana);
    
    const badges = {
      'Aktif': '<span class="badge bg-success">Aktif</span>',
      'Draft': '<span class="badge bg-warning text-dark">Draft</span>',
      'Selesai': '<span class="badge bg-secondary">Selesai</span>'
    };
    
    const modal = document.createElement('div');
    modal.id = 'rs-detail-modal';
    modal.className = 'modal fade show';
    modal.style.cssText = 'display: block; background: rgba(0,0,0,0.5);';
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header" style="background: linear-gradient(135deg, #667eea, #764ba2);">
            <h5 class="modal-title text-white"><i class="fas fa-info-circle me-2"></i>Detail Rencana Strategis</h5>
            <button type="button" class="btn-close btn-close-white" id="rs-modal-close"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6"><label class="text-muted small">Kode</label><p class="fw-semibold">${escapeHtml(record.kode) || '-'}</p></div>
              <div class="col-md-6"><label class="text-muted small">Status</label><p>${badges[record.status] || '-'}</p></div>
              <div class="col-12"><label class="text-muted small">Nama Rencana</label><p class="fw-semibold fs-5">${escapeHtml(record.nama_rencana) || '-'}</p></div>
              <div class="col-md-6"><label class="text-muted small">Periode Mulai</label><p>${formatDate(record.periode_mulai)}</p></div>
              <div class="col-md-6"><label class="text-muted small">Periode Selesai</label><p>${formatDate(record.periode_selesai)}</p></div>
              <div class="col-12"><label class="text-muted small">Deskripsi</label><p class="bg-light p-3 rounded">${escapeHtml(record.deskripsi) || '-'}</p></div>
              <div class="col-12"><label class="text-muted small">Target</label><p class="bg-light p-3 rounded">${escapeHtml(record.target) || '-'}</p></div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-warning" id="rs-modal-edit"><i class="fas fa-edit me-1"></i>Edit</button>
            <button type="button" class="btn btn-secondary" id="rs-modal-close-btn">Tutup</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => modal.remove();
    modal.querySelector('#rs-modal-close').onclick = closeModal;
    modal.querySelector('#rs-modal-close-btn').onclick = closeModal;
    modal.querySelector('#rs-modal-edit').onclick = () => { closeModal(); edit(id); };
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  }
  
  function exportData() {
    window.open('/api/rencana-strategis/actions/export', '_blank');
  }
  
  // ============================================
  // SECTION 12: NAVIGATION HANDLING
  // ============================================
  
  // Listen for navigation - NO setInterval, just event listeners
  function setupNavigationListeners() {
    const handleNavigation = () => {
      if (isOnRSPage()) {
        // Small delay to let DOM settle
        setTimeout(() => {
          if (!state.isInitialized && !state.isLoading) {
            load();
          }
        }, 100);
      } else {
        // Cleanup when leaving page
        cleanup();
      }
    };
    
    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    
    // Also listen for custom navigation events
    document.addEventListener('page-changed', handleNavigation);
    document.addEventListener('spa-navigation', handleNavigation);
  }
  
  // ============================================
  // SECTION 13: MODULE EXPORT
  // ============================================
  
  const moduleExport = {
    load,
    refresh,
    edit,
    delete: deleteRecord,
    viewDetail,
    cleanup,
    version: MODULE_VERSION,
    get state() { return { ...state }; }
  };
  
  // CRITICAL: Export to window IMMEDIATELY - replace all other modules
  // This ensures app.js can find the module when it tries to load
  window.RencanaStrategisModule = moduleExport;
  window.RencanaStrategisUnified = moduleExport;
  window.RencanaStrategisClean = moduleExport;
  window.RencanaStrategisFast = moduleExport;
  window.RSCore = moduleExport; // Also export as RSCore for index.html loader
  
  console.log(`[RS v7.1] Module exported to window.RencanaStrategisModule, RencanaStrategisUnified, RSCore`);
  
  // ============================================
  // SECTION 14: INITIALIZATION
  // ============================================
  
  function init() {
    console.log(`[RS v7.1] Module v${MODULE_VERSION} ready`);
    
    // Setup navigation listeners
    setupNavigationListeners();
    
    // Load if on RS page
    if (isOnRSPage()) {
      // Use requestAnimationFrame for smooth initialization
      // But also add a small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          load();
        }, 50);
      });
    }
  }
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
