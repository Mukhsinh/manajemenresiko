/**
 * RENSTRA MODULE v1.0 - CLEAN IMPLEMENTATION
 * Halaman baru yang bersih tanpa masalah freeze/race condition
 */
var RenstraModule = (function() {
  'use strict';
  var VERSION = '1.0.0';
  var CONTAINER_ID = 'renstra-content';
  var state = { data: [], missions: [], currentId: null, formValues: {}, isLoading: false, isInitialized: false, showForm: true };

  function $(id) { return document.getElementById(id); }
  function escapeHtml(t) { if (!t) return ''; var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  function truncate(t, m) { if (!t) return ''; return t.length > m ? t.substring(0, m) + '...' : t; }
  function formatDate(d) { if (!d) return '-'; try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return d; } }
  function formatPeriode(a, b) { if (!a && !b) return '-'; return formatDate(a) + ' - ' + formatDate(b); }
  function getStatusBadge(s) {
    if (s === 'Aktif') return '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Aktif</span>';
    if (s === 'Draft') return '<span class="badge bg-warning text-dark"><i class="fas fa-edit me-1"></i>Draft</span>';
    if (s === 'Selesai') return '<span class="badge bg-secondary"><i class="fas fa-flag-checkered me-1"></i>Selesai</span>';
    return '<span class="badge bg-light text-dark">' + escapeHtml(s || 'Draft') + '</span>';
  }
  function getDefaultForm() { return { kode: '', visi_misi_id: '', nama_rencana: '', deskripsi: '', periode_mulai: '', periode_selesai: '', target: '', status: 'Draft' }; }

  async function api(endpoint, options) {
    options = options || {};
    var token = localStorage.getItem('token') || (window.currentSession && window.currentSession.access_token);
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (options.headers) Object.assign(headers, options.headers);
    var config = Object.assign({}, options, { headers: headers });
    if (options.body && typeof options.body === 'object') config.body = JSON.stringify(options.body);
    var response = await fetch(endpoint, config);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  }

  async function init() {
    console.log('🚀 Renstra Module v' + VERSION + ' loading...');
    if (state.isLoading) return;
    var container = $(CONTAINER_ID);
    if (!container) { console.error('Container not found'); return; }
    state.isLoading = true;
    try {
      container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3 text-muted">Memuat data...</p></div>';
      await fetchData();
      await generateKode();
      render();
      state.isInitialized = true;
      console.log('✅ Renstra Module ready');
    } catch (error) {
      console.error('Error:', error);
      container.innerHTML = '<div class="alert alert-danger m-3">Error: ' + escapeHtml(error.message) + ' <button class="btn btn-sm btn-outline-danger ms-2" onclick="RenstraModule.init()">Retry</button></div>';
    } finally { state.isLoading = false; }
  }

  async function fetchData() {
    try {
      var rencana = [];
      try { rencana = await api('/api/rencana-strategis'); } catch (e) { try { rencana = await api('/api/rencana-strategis/public'); } catch (e2) {} }
      state.data = Array.isArray(rencana) ? rencana : (rencana.data || []);
      var visi = [];
      try { visi = await api('/api/visi-misi'); } catch (e) { try { visi = await api('/api/visi-misi/public'); } catch (e2) {} }
      state.missions = Array.isArray(visi) ? visi : (visi.data || []);
    } catch (e) { state.data = []; state.missions = []; }
  }

  async function generateKode() {
    try {
      var res = await api('/api/rencana-strategis/generate/kode/public');
      state.formValues = Object.assign({}, getDefaultForm(), { kode: res.kode || res });
    } catch (e) {
      var year = new Date().getFullYear();
      state.formValues = Object.assign({}, getDefaultForm(), { kode: 'RS-' + year + '-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0') });
    }
  }

  function render() {
    var container = $(CONTAINER_ID);
    if (!container) return;
    container.innerHTML = '<div class="renstra-wrapper p-3">' + renderStatCards() + renderForm() + renderTable() + '</div>';
    bindEvents();
  }

  function renderStatCards() {
    var aktif = state.data.filter(function(i) { return i.status === 'Aktif'; }).length;
    var draft = state.data.filter(function(i) { return i.status === 'Draft'; }).length;
    var selesai = state.data.filter(function(i) { return i.status === 'Selesai'; }).length;
    var total = state.data.length;
    return '<div class="row g-3 mb-4">' +
      '<div class="col-xl-3 col-md-6"><div class="card h-100 border-0 shadow-sm" style="border-radius:12px;"><div class="card-body p-0"><div class="d-flex align-items-center"><div class="d-flex align-items-center justify-content-center" style="width:80px;height:100px;background:linear-gradient(135deg,#28a745 0%,#20c997 100%);"><i class="fas fa-check-circle fa-2x text-white"></i></div><div class="p-3"><h3 class="fw-bold mb-0 text-success">' + aktif + '</h3><p class="text-muted mb-0 small">Aktif</p></div></div></div></div></div>' +
      '<div class="col-xl-3 col-md-6"><div class="card h-100 border-0 shadow-sm" style="border-radius:12px;"><div class="card-body p-0"><div class="d-flex align-items-center"><div class="d-flex align-items-center justify-content-center" style="width:80px;height:100px;background:linear-gradient(135deg,#ffc107 0%,#fd7e14 100%);"><i class="fas fa-edit fa-2x text-white"></i></div><div class="p-3"><h3 class="fw-bold mb-0 text-warning">' + draft + '</h3><p class="text-muted mb-0 small">Draft</p></div></div></div></div></div>' +
      '<div class="col-xl-3 col-md-6"><div class="card h-100 border-0 shadow-sm" style="border-radius:12px;"><div class="card-body p-0"><div class="d-flex align-items-center"><div class="d-flex align-items-center justify-content-center" style="width:80px;height:100px;background:linear-gradient(135deg,#007bff 0%,#6f42c1 100%);"><i class="fas fa-flag-checkered fa-2x text-white"></i></div><div class="p-3"><h3 class="fw-bold mb-0 text-primary">' + selesai + '</h3><p class="text-muted mb-0 small">Selesai</p></div></div></div></div></div>' +
      '<div class="col-xl-3 col-md-6"><div class="card h-100 border-0 shadow-sm" style="border-radius:12px;"><div class="card-body p-0"><div class="d-flex align-items-center"><div class="d-flex align-items-center justify-content-center" style="width:80px;height:100px;background:linear-gradient(135deg,#6c757d 0%,#495057 100%);"><i class="fas fa-list-alt fa-2x text-white"></i></div><div class="p-3"><h3 class="fw-bold mb-0 text-secondary">' + total + '</h3><p class="text-muted mb-0 small">Total</p></div></div></div></div></div>' +
    '</div>';
  }

  function renderForm() {
    var f = state.formValues || getDefaultForm();
    var isEdit = !!state.currentId;
    var collapsed = !state.showForm;
    return '<div class="card mb-4 shadow-sm border-0" id="renstra-form-card" style="border-radius:12px;"><div class="card-header text-white d-flex justify-content-between align-items-center" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px 12px 0 0;"><h5 class="mb-0"><i class="fas fa-' + (isEdit ? 'edit' : 'plus-circle') + ' me-2"></i>' + (isEdit ? 'Edit' : 'Form Input') + ' Rencana Strategis</h5><button type="button" class="btn btn-light btn-sm" id="renstra-toggle-form"><i class="fas fa-chevron-' + (collapsed ? 'down' : 'up') + '"></i></button></div><div class="card-body' + (collapsed ? ' d-none' : '') + '" id="renstra-form-body"><form id="renstra-form"><div class="row g-3"><div class="col-md-3"><label class="form-label fw-semibold">Kode</label><input type="text" class="form-control bg-light" id="renstra-kode" value="' + escapeHtml(f.kode) + '" readonly></div><div class="col-md-3"><label class="form-label fw-semibold">Status</label><select class="form-select" id="renstra-status"><option value="Draft"' + (f.status === 'Draft' ? ' selected' : '') + '>Draft</option><option value="Aktif"' + (f.status === 'Aktif' ? ' selected' : '') + '>Aktif</option><option value="Selesai"' + (f.status === 'Selesai' ? ' selected' : '') + '>Selesai</option></select></div><div class="col-md-6"><label class="form-label fw-semibold">Misi Terkait</label><select class="form-select" id="renstra-misi"><option value="">-- Pilih Misi --</option>' + renderMissionOptions() + '</select></div><div class="col-12"><label class="form-label fw-semibold">Nama Rencana Strategis <span class="text-danger">*</span></label><input type="text" class="form-control form-control-lg" id="renstra-nama" value="' + escapeHtml(f.nama_rencana) + '" required></div><div class="col-md-6"><label class="form-label fw-semibold">Periode Mulai</label><input type="date" class="form-control" id="renstra-mulai" value="' + (f.periode_mulai || '') + '"></div><div class="col-md-6"><label class="form-label fw-semibold">Periode Selesai</label><input type="date" class="form-control" id="renstra-selesai" value="' + (f.periode_selesai || '') + '"></div><div class="col-12"><label class="form-label fw-semibold">Deskripsi</label><textarea class="form-control" id="renstra-deskripsi" rows="3">' + escapeHtml(f.deskripsi) + '</textarea></div><div class="col-12"><label class="form-label fw-semibold">Target</label><textarea class="form-control" id="renstra-target" rows="2">' + escapeHtml(f.target) + '</textarea></div><div class="col-12 pt-3 border-top"><div class="d-flex gap-2 flex-wrap"><button type="submit" class="btn btn-primary btn-lg"><i class="fas fa-save me-2"></i>' + (isEdit ? 'Update' : 'Simpan') + '</button><button type="button" class="btn btn-outline-secondary" id="renstra-reset"><i class="fas fa-undo me-2"></i>Reset</button>' + (isEdit ? '<button type="button" class="btn btn-outline-danger" id="renstra-cancel"><i class="fas fa-times me-2"></i>Batal</button>' : '') + '</div></div></div></form></div></div>';
  }

  function renderMissionOptions() {
    if (!state.missions || state.missions.length === 0) return '<option value="" disabled>Tidak ada misi</option>';
    var opts = '';
    state.missions.forEach(function(m) {
      if (!m.misi) return;
      m.misi.split('\n').filter(function(x) { return x.trim(); }).forEach(function(misi, idx) {
        var clean = misi.replace(/^\d+\.\s*/, '').trim();
        var val = m.id + '|' + idx + '|' + encodeURIComponent(clean);
        opts += '<option value="' + val + '"' + (state.formValues.visi_misi_id === val ? ' selected' : '') + '>' + truncate(clean, 80) + '</option>';
      });
    });
    return opts;
  }

  function renderTable() {
    return '<div class="card shadow-sm border-0" style="border-radius:12px;"><div class="card-header bg-white d-flex justify-content-between align-items-center py-3 flex-wrap gap-2" style="border-radius:12px 12px 0 0;"><div><h5 class="mb-0"><i class="fas fa-table text-primary me-2"></i>Daftar Rencana Strategis</h5><small class="text-muted">Kelola semua rencana strategis</small></div><div class="btn-group"><button class="btn btn-outline-primary" id="renstra-refresh"><i class="fas fa-sync-alt me-1"></i>Refresh</button><button class="btn btn-outline-success" id="renstra-export"><i class="fas fa-file-excel me-1"></i>Export</button></div></div><div class="card-body p-0"><div class="table-responsive"><table class="table table-hover mb-0"><thead class="table-light"><tr><th style="width:120px;">Kode</th><th>Nama Rencana</th><th style="width:150px;">Target</th><th style="width:180px;">Periode</th><th style="width:100px;">Status</th><th style="width:140px;" class="text-center">Aksi</th></tr></thead><tbody>' + renderTableRows() + '</tbody></table></div></div></div>';
  }

  function renderTableRows() {
    if (!state.data || state.data.length === 0) return '<tr><td colspan="6" class="text-center py-5"><div class="py-4"><i class="fas fa-inbox fa-3x text-muted mb-3"></i><h5 class="text-muted">Belum Ada Data</h5><p class="text-muted">Silakan isi form di atas</p></div></td></tr>';
    var rows = '';
    state.data.forEach(function(item, idx) {
      rows += '<tr' + (idx % 2 ? ' style="background:#fafbfc;"' : '') + '><td class="align-middle"><span class="badge bg-light text-dark border">' + escapeHtml(item.kode || '-') + '</span></td><td class="align-middle"><div class="fw-semibold">' + escapeHtml(item.nama_rencana || '-') + '</div>' + (item.deskripsi ? '<small class="text-muted">' + escapeHtml(truncate(item.deskripsi, 60)) + '</small>' : '') + '</td><td class="align-middle"><small class="text-muted">' + escapeHtml(truncate(item.target || '-', 40)) + '</small></td><td class="align-middle"><small class="text-muted">' + formatPeriode(item.periode_mulai, item.periode_selesai) + '</small></td><td class="align-middle">' + getStatusBadge(item.status) + '</td><td class="align-middle text-center"><div class="btn-group btn-group-sm"><button class="btn btn-outline-info border-0" onclick="RenstraModule.view(\'' + item.id + '\')" title="Lihat"><i class="fas fa-eye"></i></button><button class="btn btn-outline-warning border-0" onclick="RenstraModule.edit(\'' + item.id + '\')" title="Edit"><i class="fas fa-edit"></i></button><button class="btn btn-outline-danger border-0" onclick="RenstraModule.remove(\'' + item.id + '\')" title="Hapus"><i class="fas fa-trash"></i></button></div></td></tr>';
    });
    return rows;
  }

  function bindEvents() {
    var form = $('renstra-form'); if (form) form.addEventListener('submit', handleSubmit);
    var toggle = $('renstra-toggle-form'); if (toggle) toggle.addEventListener('click', toggleForm);
    var reset = $('renstra-reset'); if (reset) reset.addEventListener('click', resetForm);
    var cancel = $('renstra-cancel'); if (cancel) cancel.addEventListener('click', resetForm);
    var refresh = $('renstra-refresh'); if (refresh) refresh.addEventListener('click', refreshData);
    var exp = $('renstra-export'); if (exp) exp.addEventListener('click', exportData);
  }

  function toggleForm() { state.showForm = !state.showForm; var body = $('renstra-form-body'); var btn = $('renstra-toggle-form'); if (body) body.classList.toggle('d-none', !state.showForm); if (btn) btn.innerHTML = '<i class="fas fa-chevron-' + (state.showForm ? 'up' : 'down') + '"></i>'; }

  async function handleSubmit(e) {
    e.preventDefault();
    var data = { kode: $('renstra-kode') ? $('renstra-kode').value : '', visi_misi_id: $('renstra-misi') ? $('renstra-misi').value : '', nama_rencana: $('renstra-nama') ? $('renstra-nama').value : '', deskripsi: $('renstra-deskripsi') ? $('renstra-deskripsi').value : '', periode_mulai: $('renstra-mulai') ? $('renstra-mulai').value : '', periode_selesai: $('renstra-selesai') ? $('renstra-selesai').value : '', target: $('renstra-target') ? $('renstra-target').value : '', status: $('renstra-status') ? $('renstra-status').value : 'Draft' };
    if (data.visi_misi_id && data.visi_misi_id.indexOf('|') !== -1) data.visi_misi_id = data.visi_misi_id.split('|')[0];
    if (!data.nama_rencana.trim()) { alert('Nama rencana wajib diisi!'); return; }
    try {
      if (state.currentId) { await api('/api/rencana-strategis/' + state.currentId, { method: 'PUT', body: data }); alert('Data berhasil diupdate!'); }
      else { await api('/api/rencana-strategis', { method: 'POST', body: data }); alert('Data berhasil disimpan!'); }
      state.currentId = null; state.formValues = getDefaultForm(); await generateKode(); await fetchData(); render();
    } catch (err) { alert('Gagal menyimpan: ' + err.message); }
  }

  function resetForm() { state.currentId = null; state.formValues = getDefaultForm(); generateKode().then(render); }
  async function refreshData() { var btn = $('renstra-refresh'); if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Loading...'; } try { await fetchData(); render(); } catch (e) { alert('Gagal refresh: ' + e.message); } }

  function view(id) {
    var item = state.data.find(function(i) { return i.id === id; }); if (!item) return;
    var modal = document.createElement('div'); modal.className = 'modal fade'; modal.id = 'renstra-modal';
    modal.innerHTML = '<div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header bg-primary text-white"><h5 class="modal-title"><i class="fas fa-info-circle me-2"></i>Detail Rencana Strategis</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body"><div class="row g-3"><div class="col-md-6"><label class="text-muted small">Kode</label><p class="fw-semibold">' + escapeHtml(item.kode || '-') + '</p></div><div class="col-md-6"><label class="text-muted small">Status</label><p>' + getStatusBadge(item.status) + '</p></div><div class="col-12"><label class="text-muted small">Nama Rencana</label><p class="fw-semibold fs-5">' + escapeHtml(item.nama_rencana || '-') + '</p></div><div class="col-md-6"><label class="text-muted small">Periode Mulai</label><p>' + formatDate(item.periode_mulai) + '</p></div><div class="col-md-6"><label class="text-muted small">Periode Selesai</label><p>' + formatDate(item.periode_selesai) + '</p></div><div class="col-12"><label class="text-muted small">Deskripsi</label><p class="bg-light p-3 rounded">' + escapeHtml(item.deskripsi || '-') + '</p></div><div class="col-12"><label class="text-muted small">Target</label><p class="bg-light p-3 rounded">' + escapeHtml(item.target || '-') + '</p></div></div></div><div class="modal-footer"><button type="button" class="btn btn-warning" onclick="RenstraModule.edit(\'' + id + '\');bootstrap.Modal.getInstance(document.getElementById(\'renstra-modal\')).hide();"><i class="fas fa-edit me-2"></i>Edit</button><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button></div></div></div>';
    var old = document.getElementById('renstra-modal'); if (old) old.remove();
    document.body.appendChild(modal); new bootstrap.Modal(modal).show();
    modal.addEventListener('hidden.bs.modal', function() { modal.remove(); });
  }

  function edit(id) {
    var item = state.data.find(function(i) { return i.id === id; }); if (!item) { alert('Data tidak ditemukan'); return; }
    state.currentId = id; state.formValues = { kode: item.kode || '', visi_misi_id: item.visi_misi_id || '', nama_rencana: item.nama_rencana || '', deskripsi: item.deskripsi || '', periode_mulai: item.periode_mulai || '', periode_selesai: item.periode_selesai || '', target: item.target || '', status: item.status || 'Draft' }; state.showForm = true; render();
    setTimeout(function() { var card = $('renstra-form-card'); if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  }

  async function remove(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    try { await api('/api/rencana-strategis/' + id, { method: 'DELETE' }); alert('Data berhasil dihapus!'); await fetchData(); render(); }
    catch (e) { alert('Gagal menghapus: ' + e.message); }
  }

  async function exportData() {
    try {
      var token = localStorage.getItem('token') || (window.currentSession && window.currentSession.access_token);
      var headers = {}; if (token) headers['Authorization'] = 'Bearer ' + token;
      var res = await fetch('/api/rencana-strategis/actions/export', { headers: headers });
      if (!res.ok) throw new Error('Export failed');
      var blob = await res.blob(); var url = window.URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = 'rencana-strategis.xlsx';
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (e) { alert('Gagal export: ' + e.message); }
  }

  function cleanup() { state.isInitialized = false; state.isLoading = false; state.data = []; state.missions = []; state.currentId = null; state.formValues = {}; }

  return { init: init, refresh: refreshData, view: view, edit: edit, remove: remove, cleanup: cleanup, VERSION: VERSION };
})();

window.RenstraModule = RenstraModule;
