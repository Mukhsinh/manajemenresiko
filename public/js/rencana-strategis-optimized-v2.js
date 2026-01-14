/**
 * RENCANA STRATEGIS MODULE v6.0-OPTIMIZED
 * 
 * CRITICAL FIXES FOR UI FREEZE:
 * 1. Single entry point with mutex lock
 * 2. Async/chunked DOM rendering
 * 3. RequestAnimationFrame for DOM updates
 * 4. Debounced operations
 * 5. Web Worker ready for heavy processing
 * 
 * Updated: 2026-01-10
 */

const RencanaStrategisModule = (() => {
  const MODULE_VERSION = '6.0-OPTIMIZED';
  
  // MUTEX LOCK - Prevents concurrent execution
  let isExecuting = false;
  let executionPromise = null;
  
  const state = {
    data: [],
    missions: [],
    currentId: null,
    formValues: {},
    isLoading: false,
    isInitialized: false,
    showForm: true,
    lastLoadTime: 0
  };

  // Debounce utility
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Yield to main thread - CRITICAL for preventing UI freeze
  function yieldToMain() {
    return new Promise(resolve => {
      if ('scheduler' in window && 'yield' in window.scheduler) {
        window.scheduler.yield().then(resolve);
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  // RequestAnimationFrame wrapper for DOM updates
  function scheduleRender(callback) {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        callback();
        resolve();
      });
    });
  }

  // API helper with timeout
  const api = () => {
    if (window.apiCall) return window.apiCall;
    if (window.app?.apiCall) return window.app.apiCall;
    
    return async (endpoint, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(endpoint, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
          },
          body: options.body ? JSON.stringify(options.body) : undefined
        });
        
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };
  };

  const getEl = (id) => document.getElementById(id);

  function getDefaultForm() {
    return {
      kode: '', visi_misi_id: '', nama_rencana: '', deskripsi: '',
      periode_mulai: '', periode_selesai: '', target: '', status: 'Draft'
    };
  }

  /**
   * MAIN LOAD FUNCTION - Single entry point with mutex
   */
  async function load() {
    // MUTEX CHECK - Prevent concurrent execution
    if (isExecuting) {
      console.log('🔒 Module already executing, returning existing promise');
      return executionPromise;
    }
    
    // TIME-BASED LOCK - Prevent rapid re-calls
    const now = Date.now();
    if (state.isInitialized && (now - state.lastLoadTime) < 5000) {
      console.log('⏱️ Module loaded recently, skipping');
      return Promise.resolve();
    }
    
    // PAGE CHECK - Only run on correct page
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (!path.includes('rencana-strategis') && hash !== '#rencana-strategis') {
      console.log('📍 Not on rencana-strategis page, skipping');
      return Promise.resolve();
    }
    
    // Set mutex
    isExecuting = true;
    executionPromise = executeLoad();
    
    try {
      await executionPromise;
    } finally {
      isExecuting = false;
      executionPromise = null;
    }
    
    return Promise.resolve();
  }

  async function executeLoad() {
    console.log(`🚀 Loading Rencana Strategis v${MODULE_VERSION}...`);
    state.isLoading = true;
    
    // Try multiple container selectors
    let container = getEl('rencana-strategis-content');
    if (!container) {
      container = getEl('rencana-strategis');
    }
    if (!container) {
      container = document.querySelector('[data-page="rencana-strategis"]');
    }
    if (!container) {
      console.error('❌ Container not found - tried: rencana-strategis-content, rencana-strategis, [data-page]');
      state.isLoading = false;
      return;
    }
    
    console.log('✅ Container found:', container.id || container.className);

    try {
      // Show loading - non-blocking
      await scheduleRender(() => {
        container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3">Memuat data...</p></div>';
      });
      
      // Yield to main thread
      await yieldToMain();
      
      // Fetch data in parallel
      await fetchData();
      
      // Yield again before heavy DOM work
      await yieldToMain();
      
      // Generate kode
      state.formValues = getDefaultForm();
      await generateKode();
      
      // Render in chunks
      await renderInterfaceChunked(container);
      
      // Bind events after render
      await scheduleRender(() => bindEvents());
      
      state.isInitialized = true;
      state.isLoading = false;
      state.lastLoadTime = Date.now();
      
      // Set global flags
      window.rencanaStrategisModuleLoaded = true;
      window.rencanaStrategisLoadTime = Date.now();
      
      console.log(`✅ Module v${MODULE_VERSION} loaded successfully`);
      
    } catch (error) {
      console.error('❌ Error:', error);
      state.isLoading = false;
      showError(error.message);
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
      
      console.log('📊 Data:', { rencana: state.data.length, visi: state.missions.length });
    } catch (error) {
      console.error('Fetch error:', error);
      state.data = [];
      state.missions = [];
    }
  }

  async function generateKode() {
    try {
      const year = new Date().getFullYear();
      const count = state.data.length + 1;
      state.formValues.kode = `RS-${year}-${String(count).padStart(3, '0')}`;
    } catch (e) {
      state.formValues.kode = `RS-${Date.now()}`;
    }
  }

  /**
   * CHUNKED RENDERING - Prevents UI freeze
   */
  async function renderInterfaceChunked(container) {
    console.log('🎨 Rendering interface in chunks...');
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'rencana-strategis-wrapper p-3';
    
    // Chunk 1: Stats cards
    await scheduleRender(() => {
      wrapper.innerHTML = renderStatCards();
    });
    await yieldToMain();
    
    // Chunk 2: Form
    await scheduleRender(() => {
      wrapper.innerHTML += renderFormCard();
    });
    await yieldToMain();
    
    // Chunk 3: Table
    await scheduleRender(() => {
      wrapper.innerHTML += renderTableCard();
    });
    await yieldToMain();
    
    // Final: Replace container content
    await scheduleRender(() => {
      container.innerHTML = '';
      container.appendChild(wrapper);
    });
    
    console.log('✅ Chunked render complete');
  }

  function renderStatCards() {
    const aktif = state.data.filter(i => i.status === 'Aktif').length;
    const draft = state.data.filter(i => i.status === 'Draft').length;
    const selesai = state.data.filter(i => i.status === 'Selesai').length;
    const total = state.data.length;

    return `<div class="row g-3 mb-4">
      <div class="col-xl-3 col-md-6"><div class="card h-100 border-0 shadow-sm" style="border-radius:12px">
        <div class="card-body p-0"><div class="d-flex align-items-center">
          <div class="flex-shrink-0 d-flex align-items-center justify-content-center" style="width:80px;height:100px;background:linear-gradient(135deg,#28a745,#20c997)">
            <i class="fas fa-check-circle fa-2x text-white"></i></div>
          <div class="flex-grow-1 p-3"><h3 class="fw-bold text-success mb-0">${aktif}</h3>
            <p class="text-muted mb-0 small">Rencana Aktif</p></div>
        </div></div></div></div>
      <div class="col-xl-3 col-md-6"><div class="card h-100 border-0 shadow-sm" style="border-radius:12px">
        <div class="card-body p-0"><div class="d-flex align-items-center">
          <div class="flex-shrink-0 d-flex align-items-center justify-content-center" style="width:80px;height:100px;background:linear-gradient(135deg,#ffc107,#fd7e14)">
            <i class="fas fa-edit fa-2x text-white"></i></div>
          <div class="flex-grow-1 p-3"><h3 class="fw-bold text-warning mb-0">${draft}</h3>
            <p class="text-muted mb-0 small">Draft</p></div>
        </div></div></div></div>
      <div class="col-xl-3 col-md-6"><div class="card h-100 border-0 shadow-sm" style="border-radius:12px">
        <div class="card-body p-0"><div class="d-flex align-items-center">
          <div class="flex-shrink-0 d-flex align-items-center justify-content-center" style="width:80px;height:100px;background:linear-gradient(135deg,#007bff,#6f42c1)">
            <i class="fas fa-flag-checkered fa-2x text-white"></i></div>
          <div class="flex-grow-1 p-3"><h3 class="fw-bold text-primary mb-0">${selesai}</h3>
            <p class="text-muted mb-0 small">Selesai</p></div>
        </div></div></div></div>
      <div class="col-xl-3 col-md-6"><div class="card h-100 border-0 shadow-sm" style="border-radius:12px">
        <div class="card-body p-0"><div class="d-flex align-items-center">
          <div class="flex-shrink-0 d-flex align-items-center justify-content-center" style="width:80px;height:100px;background:linear-gradient(135deg,#6c757d,#495057)">
            <i class="fas fa-list-alt fa-2x text-white"></i></div>
          <div class="flex-grow-1 p-3"><h3 class="fw-bold text-secondary mb-0">${total}</h3>
            <p class="text-muted mb-0 small">Total</p></div>
        </div></div></div></div>
    </div>`;
  }

  function renderFormCard() {
    const f = state.formValues;
    const isEdit = !!state.currentId;
    
    return `<div class="card mb-4 shadow-sm border-0" id="rs-form-section">
      <div class="card-header bg-gradient text-white d-flex justify-content-between align-items-center" style="background:linear-gradient(135deg,#667eea,#764ba2)">
        <h5 class="mb-0"><i class="fas fa-${isEdit ? 'edit' : 'plus-circle'} me-2"></i>${isEdit ? 'Edit' : 'Form Input'} Rencana Strategis</h5>
        <button type="button" class="btn btn-light btn-sm" id="rs-toggle-form"><i class="fas fa-chevron-${state.showForm ? 'up' : 'down'}"></i></button>
      </div>
      <div class="card-body${state.showForm ? '' : ' d-none'}" id="rs-form-body">
        <form id="rs-form">
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label fw-semibold"><i class="fas fa-barcode me-1 text-primary"></i> Kode</label>
              <input type="text" class="form-control bg-light" id="rs-kode" value="${f.kode || ''}" readonly>
            </div>
            <div class="col-md-3">
              <label class="form-label fw-semibold"><i class="fas fa-flag me-1 text-warning"></i> Status</label>
              <select class="form-select" id="rs-status">
                <option value="Draft"${f.status === 'Draft' ? ' selected' : ''}>📝 Draft</option>
                <option value="Aktif"${f.status === 'Aktif' ? ' selected' : ''}>✅ Aktif</option>
                <option value="Selesai"${f.status === 'Selesai' ? ' selected' : ''}>🏁 Selesai</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold"><i class="fas fa-bullseye me-1 text-success"></i> Misi</label>
              <select class="form-select" id="rs-misi"><option value="">-- Pilih Misi --</option>${renderMissionOptions()}</select>
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold"><i class="fas fa-file-alt me-1 text-info"></i> Nama <span class="text-danger">*</span></label>
              <input type="text" class="form-control form-control-lg" id="rs-nama" value="${f.nama_rencana || ''}" placeholder="Nama rencana strategis..." required>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold"><i class="fas fa-calendar-alt me-1"></i> Mulai</label>
              <input type="date" class="form-control" id="rs-mulai" value="${f.periode_mulai || ''}">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold"><i class="fas fa-calendar-check me-1"></i> Selesai</label>
              <input type="date" class="form-control" id="rs-selesai" value="${f.periode_selesai || ''}">
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold"><i class="fas fa-align-left me-1"></i> Deskripsi</label>
              <textarea class="form-control" id="rs-deskripsi" rows="2">${f.deskripsi || ''}</textarea>
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold"><i class="fas fa-crosshairs me-1"></i> Target</label>
              <textarea class="form-control" id="rs-target" rows="2">${f.target || ''}</textarea>
            </div>
            <div class="col-12 pt-3 border-top">
              <button type="submit" class="btn btn-primary btn-lg"><i class="fas fa-save me-2"></i>${isEdit ? 'Update' : 'Simpan'}</button>
              <button type="button" class="btn btn-outline-secondary" id="rs-reset-btn"><i class="fas fa-undo me-2"></i>Reset</button>
              ${isEdit ? '<button type="button" class="btn btn-outline-danger" id="rs-cancel-edit"><i class="fas fa-times me-2"></i>Batal</button>' : ''}
            </div>
          </div>
        </form>
      </div>
    </div>`;
  }

  function renderTableCard() {
    return `<div class="card shadow-sm border-0" style="border-radius:12px">
      <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
        <div><h5 class="mb-0"><i class="fas fa-table text-primary me-2"></i>Daftar Rencana Strategis</h5></div>
        <div class="btn-group">
          <button class="btn btn-outline-primary" id="rs-refresh-btn"><i class="fas fa-sync-alt me-1"></i>Refresh</button>
          <button class="btn btn-outline-success" id="rs-export-btn"><i class="fas fa-file-excel me-1"></i>Export</button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead style="background:linear-gradient(135deg,#f8f9fa,#e9ecef)">
              <tr>
                <th class="border-0 py-3" style="width:120px">Kode</th>
                <th class="border-0 py-3">Nama Rencana</th>
                <th class="border-0 py-3" style="width:150px">Target</th>
                <th class="border-0 py-3" style="width:180px">Periode</th>
                <th class="border-0 py-3" style="width:100px">Status</th>
                <th class="border-0 py-3 text-center" style="width:140px">Aksi</th>
              </tr>
            </thead>
            <tbody>${renderTableRows()}</tbody>
          </table>
        </div>
      </div>
    </div>`;
  }

  function renderTableRows() {
    if (!state.data?.length) {
      return `<tr><td colspan="6" class="text-center py-5">
        <div class="py-4"><i class="fas fa-inbox fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">Belum Ada Data</h5>
          <button class="btn btn-primary" onclick="RencanaStrategisModule.showAddForm()"><i class="fas fa-plus me-2"></i>Tambah</button>
        </div></td></tr>`;
    }

    return state.data.map((item, i) => {
      const badge = item.status === 'Aktif' ? '<span class="badge bg-success">Aktif</span>' :
                    item.status === 'Selesai' ? '<span class="badge bg-secondary">Selesai</span>' :
                    '<span class="badge bg-warning text-dark">Draft</span>';
      const periode = formatPeriode(item.periode_mulai, item.periode_selesai);
      
      return `<tr data-id="${item.id}"${i % 2 ? ' style="background:#fafbfc"' : ''}>
        <td class="align-middle"><span class="badge bg-light text-dark border">${item.kode || '-'}</span></td>
        <td class="align-middle"><div class="fw-semibold">${item.nama_rencana || '-'}</div>
          ${item.deskripsi ? `<small class="text-muted">${truncate(item.deskripsi, 60)}</small>` : ''}</td>
        <td class="align-middle"><small class="text-muted">${truncate(item.target || '-', 40)}</small></td>
        <td class="align-middle"><small><i class="fas fa-calendar-alt me-1"></i>${periode}</small></td>
        <td class="align-middle">${badge}</td>
        <td class="align-middle text-center">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-info border-0" onclick="RencanaStrategisModule.viewDetail('${item.id}')" title="Lihat Detail"><i class="fas fa-eye"></i></button>
            <button class="btn btn-outline-warning border-0" onclick="RencanaStrategisModule.startEdit('${item.id}')" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn btn-outline-danger border-0" onclick="RencanaStrategisModule.deleteRencana('${item.id}')" title="Hapus"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  function renderMissionOptions() {
    if (!state.missions?.length) return '';
    let options = '';
    state.missions.forEach(m => {
      if (!m.misi) return;
      m.misi.split('\n').filter(x => x.trim()).forEach((misi, idx) => {
        const clean = misi.replace(/^\d+\.\s*/, '').trim();
        const val = `${m.id}|${idx}|${encodeURIComponent(clean)}`;
        options += `<option value="${val}">${truncate(clean, 60)}</option>`;
      });
    });
    return options;
  }

  function formatPeriode(mulai, selesai) {
    if (!mulai && !selesai) return '-';
    const fmt = d => d ? new Date(d).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'}) : '';
    return `${fmt(mulai)} - ${fmt(selesai)}`;
  }

  function truncate(text, max) {
    return text?.length > max ? text.substring(0, max) + '...' : (text || '');
  }

  function bindEvents() {
    const form = getEl('rs-form');
    if (form) form.addEventListener('submit', handleSubmit);
    
    const toggle = getEl('rs-toggle-form');
    if (toggle) toggle.addEventListener('click', toggleForm);
    
    const reset = getEl('rs-reset-btn');
    if (reset) reset.addEventListener('click', resetForm);
    
    const cancel = getEl('rs-cancel-edit');
    if (cancel) cancel.addEventListener('click', cancelEdit);
    
    const refresh = getEl('rs-refresh-btn');
    if (refresh) refresh.addEventListener('click', debounce(refreshData, 500));
    
    const exp = getEl('rs-export-btn');
    if (exp) exp.addEventListener('click', exportData);
  }

  function toggleForm() {
    state.showForm = !state.showForm;
    const body = getEl('rs-form-body');
    const btn = getEl('rs-toggle-form');
    if (body) body.classList.toggle('d-none', !state.showForm);
    if (btn) btn.innerHTML = `<i class="fas fa-chevron-${state.showForm ? 'up' : 'down'}"></i>`;
  }

  function resetForm() {
    state.formValues = getDefaultForm();
    generateKode();
    ['rs-nama','rs-deskripsi','rs-target','rs-mulai','rs-selesai'].forEach(id => {
      const el = getEl(id);
      if (el) el.value = '';
    });
    const kode = getEl('rs-kode');
    if (kode) kode.value = state.formValues.kode;
    const status = getEl('rs-status');
    if (status) status.value = 'Draft';
  }

  function cancelEdit() {
    state.currentId = null;
    resetForm();
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
      const apiFunc = api();
      if (state.currentId) {
        await apiFunc(`/api/rencana-strategis/${state.currentId}`, { method: 'PUT', body: formData });
        alert('Data berhasil diupdate!');
      } else {
        await apiFunc('/api/rencana-strategis', { method: 'POST', body: formData });
        alert('Data berhasil disimpan!');
      }
      
      state.currentId = null;
      state.showForm = false;
      await refreshData();
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    }
  }

  function showAddForm() {
    state.currentId = null;
    state.formValues = getDefaultForm();
    state.showForm = true;
    generateKode();
    
    const container = getEl('rencana-strategis-content');
    if (container) {
      renderInterfaceChunked(container).then(() => {
        const form = getEl('rs-form-section');
        if (form) form.scrollIntoView({ behavior: 'smooth' });
        getEl('rs-nama')?.focus();
      });
    }
  }

  async function viewDetail(id) {
    const item = state.data.find(d => d.id === id);
    if (!item) return;
    
    alert(`Detail:\n\nKode: ${item.kode}\nNama: ${item.nama_rencana}\nStatus: ${item.status}\nTarget: ${item.target || '-'}\nDeskripsi: ${item.deskripsi || '-'}`);
  }

  async function startEdit(id) {
    const item = state.data.find(d => d.id === id);
    if (!item) return;
    
    state.currentId = id;
    state.formValues = { ...item };
    state.showForm = true;
    
    const container = getEl('rencana-strategis-content');
    if (container) {
      await renderInterfaceChunked(container);
      getEl('rs-form-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function deleteRencana(id) {
    if (!confirm('Hapus rencana strategis ini?')) return;
    
    try {
      await api()(`/api/rencana-strategis/${id}`, { method: 'DELETE' });
      alert('Data berhasil dihapus!');
      await refreshData();
    } catch (error) {
      alert('Gagal menghapus: ' + error.message);
    }
  }

  // Debounced refresh to prevent rapid calls
  const refreshData = debounce(async function() {
    console.log('🔄 Refreshing data...');
    await fetchData();
    const container = getEl('rencana-strategis-content');
    if (container) await renderInterfaceChunked(container);
  }, 300);

  async function exportData() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/rencana-strategis/actions/export', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!response.ok) throw new Error('Export gagal');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rencana-strategis-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Export gagal: ' + error.message);
    }
  }

  function showError(message) {
    const container = getEl('rencana-strategis-content');
    if (container) {
      container.innerHTML = `<div class="alert alert-danger m-4">
        <h5><i class="fas fa-exclamation-triangle me-2"></i>Error</h5>
        <p>${message}</p>
        <button onclick="RencanaStrategisModule.load()" class="btn btn-primary"><i class="fas fa-sync me-1"></i>Coba Lagi</button>
      </div>`;
    }
  }

  function cleanup() {
    state.isInitialized = false;
    state.isLoading = false;
    isExecuting = false;
    executionPromise = null;
    window.rencanaStrategisModuleLoaded = false;
    console.log('🧹 Module cleanup complete');
  }

  return {
    load,
    viewDetail,
    startEdit,
    deleteRencana,
    showAddForm,
    refreshData,
    cleanup,
    state,
    version: MODULE_VERSION
  };
})();

// Global exports
window.RencanaStrategisModule = RencanaStrategisModule;
window.RencanaStrategisModuleEnhanced = RencanaStrategisModule;
window.loadRencanaStrategis = () => RencanaStrategisModule.load();

// Block legacy functions
window.loadRencanaStrategisSelection = () => Promise.resolve();
window.renderRencanaStrategisList = () => {};
window.showRencanaStrategisSelection = () => {};

console.log('✅ Rencana Strategis Module v6.0-OPTIMIZED loaded');
