/**
 * FIX RENCANA STRATEGIS DISPLAY - COMPLETE
 * Memperbaiki tampilan halaman Rencana Strategis yang hanya menampilkan teks
 * Memastikan form, tabel, dan kartu ter-render dengan benar
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Rencana Strategis Display...\n');

// 1. Create fixed JavaScript module
const fixedJS = `/**
 * RENCANA STRATEGIS MODULE - FIXED DISPLAY
 * Memastikan tampilan form, tabel, dan kartu ter-render dengan benar
 */

const RencanaStrategisModule = (() => {
  const state = {
    data: [],
    missions: [],
    currentId: null,
    formValues: {},
    sasaranList: [],
    indikatorList: [],
    isLoading: false,
    isInitialized: false,
    showForm: false
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);
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
      indikator_kinerja: '',
      status: 'Draft'
    };
  }

  /**
   * Load module
   */
  async function load() {
    if (state.isLoading || state.isInitialized) {
      console.log('⚠️ Already loading or initialized');
      return;
    }

    console.log('🚀 Loading Rencana Strategis Module...');
    state.isLoading = true;

    try {
      // Ensure page visibility
      ensurePageVisibility();
      
      // Wait for auth
      await waitForAuth();
      
      // Fetch data
      await fetchData();
      
      // Initialize form
      state.formValues = getDefaultForm();
      await generateKode();
      
      // Render
      render();
      
      state.isInitialized = true;
      state.isLoading = false;
      
      console.log('✅ Module loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading:', error);
      state.isLoading = false;
      showError(error.message);
    }
  }

  function ensurePageVisibility() {
    const page = document.getElementById('rencana-strategis');
    if (page) {
      page.classList.add('active');
      document.querySelectorAll('.page-content').forEach(p => {
        if (p.id !== 'rencana-strategis') p.classList.remove('active');
      });
    }
  }

  async function waitForAuth() {
    if (window.waitForAuthReady) {
      try {
        await Promise.race([
          window.waitForAuthReady(2000),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
        ]);
      } catch (e) {
        console.warn('⚠️ Auth timeout');
      }
    }
  }

  async function fetchData() {
    try {
      const [rencanaRes, visiRes] = await Promise.allSettled([
        Promise.race([
          api()('/api/rencana-strategis/public'),
          api()('/api/rencana-strategis')
        ]).catch(() => []),
        Promise.race([
          api()('/api/visi-misi/public'),
          api()('/api/visi-misi')
        ]).catch(() => [])
      ]);
      
      state.data = rencanaRes.status === 'fulfilled' ? 
        (Array.isArray(rencanaRes.value) ? rencanaRes.value : (rencanaRes.value?.data || [])) : [];
      
      state.missions = visiRes.status === 'fulfilled' ? 
        (Array.isArray(visiRes.value) ? visiRes.value : (visiRes.value?.data || [])) : [];
      
      console.log('📊 Data loaded:', { rencana: state.data.length, visi: state.missions.length });
    } catch (error) {
      console.error('❌ Error fetching:', error);
      state.data = [];
      state.missions = [];
    }
  }

  function render() {
    console.log('🎨 Rendering interface...');
    
    const container = findContainer();
    if (!container) {
      console.error('❌ Container not found!');
      return;
    }
    
    container.innerHTML = '';
    
    const content = \`
      <!-- Statistics Cards -->
      <div class="row mb-4">
        \${renderStatCards()}
      </div>

      <!-- Form Section -->
      \${state.showForm ? \`
      <div class="card mb-4 border-0 shadow-sm" id="form-section">
        <div class="card-header bg-light border-0">
          <div class="d-flex justify-content-between align-items-center">
            <h4 class="card-title mb-0">
              <i class="fas fa-plus-circle text-primary me-2"></i>
              \${state.currentId ? 'Edit' : 'Tambah'} Rencana Strategis
            </h4>
            <button type="button" class="btn btn-outline-secondary btn-sm" id="rs-close-form">
              <i class="fas fa-times"></i> Tutup
            </button>
          </div>
        </div>
        <div class="card-body">
          \${renderForm()}
        </div>
      </div>
      \` : ''}
      
      <!-- Data Table -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white border-0">
          <div class="d-flex justify-content-between align-items-center">
            <h4 class="card-title mb-0">
              <i class="fas fa-table text-primary me-2"></i>
              Daftar Rencana Strategis
            </h4>
            <div class="d-flex gap-2">
              <button class="btn btn-success btn-sm" id="rs-add-new">
                <i class="fas fa-plus"></i> Tambah Baru
              </button>
              <button class="btn btn-outline-primary btn-sm" id="rs-export-btn">
                <i class="fas fa-file-excel"></i> Export
              </button>
            </div>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead style="background-color: #f8f9fa;">
                <tr>
                  <th class="border-0 fw-semibold">Kode</th>
                  <th class="border-0 fw-semibold">Nama Rencana</th>
                  <th class="border-0 fw-semibold">Target</th>
                  <th class="border-0 fw-semibold">Periode</th>
                  <th class="border-0 fw-semibold">Status</th>
                  <th class="border-0 fw-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                \${renderTableRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    \`;
    
    container.innerHTML = content;
    bindEvents();
    console.log('✅ Rendered successfully');
  }

  function renderStatCards() {
    const aktif = state.data.filter(i => i.status === 'Aktif').length;
    const draft = state.data.filter(i => i.status === 'Draft').length;
    const selesai = state.data.filter(i => i.status === 'Selesai').length;
    
    return \`
      <div class="col-md-3">
        <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);">
          <div class="card-body text-center py-4">
            <div class="d-flex align-items-center justify-content-center mb-3">
              <div class="rounded-circle p-3" style="background-color: rgba(76, 175, 80, 0.1);">
                <i class="fas fa-check-circle fa-2x" style="color: #4caf50;"></i>
              </div>
            </div>
            <h3 class="fw-bold mb-1" style="color: #2e7d32;">\${aktif}</h3>
            <p class="mb-0 text-muted">Rencana Aktif</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);">
          <div class="card-body text-center py-4">
            <div class="d-flex align-items-center justify-content-center mb-3">
              <div class="rounded-circle p-3" style="background-color: rgba(255, 152, 0, 0.1);">
                <i class="fas fa-edit fa-2x" style="color: #ff9800;"></i>
              </div>
            </div>
            <h3 class="fw-bold mb-1" style="color: #f57c00;">\${draft}</h3>
            <p class="mb-0 text-muted">Draft</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);">
          <div class="card-body text-center py-4">
            <div class="d-flex align-items-center justify-content-center mb-3">
              <div class="rounded-circle p-3" style="background-color: rgba(33, 150, 243, 0.1);">
                <i class="fas fa-flag-checkered fa-2x" style="color: #2196f3;"></i>
              </div>
            </div>
            <h3 class="fw-bold mb-1" style="color: #1976d2;">\${selesai}</h3>
            <p class="mb-0 text-muted">Selesai</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);">
          <div class="card-body text-center py-4">
            <div class="d-flex align-items-center justify-content-center mb-3">
              <div class="rounded-circle p-3" style="background-color: rgba(156, 39, 176, 0.1);">
                <i class="fas fa-list fa-2x" style="color: #9c27b0;"></i>
              </div>
            </div>
            <h3 class="fw-bold mb-1" style="color: #7b1fa2;">\${state.data.length}</h3>
            <p class="mb-0 text-muted">Total Rencana</p>
          </div>
        </div>
      </div>
    \`;
  }

  function renderForm() {
    return \`
      <form id="rs-form" class="row g-3">
        <div class="col-md-6">
          <label class="form-label fw-semibold">Kode Rencana</label>
          <input type="text" class="form-control" id="rs-kode" value="\${state.formValues.kode}" readonly>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Status</label>
          <select class="form-select" id="rs-status">
            <option value="Draft" \${state.formValues.status === 'Draft' ? 'selected' : ''}>Draft</option>
            <option value="Aktif" \${state.formValues.status === 'Aktif' ? 'selected' : ''}>Aktif</option>
            <option value="Selesai" \${state.formValues.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Misi Strategis</label>
          <select class="form-select" id="rs-misi">
            <option value="">Pilih Misi</option>
            \${renderMissionOptions()}
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Nama Rencana</label>
          <input type="text" class="form-control" id="rs-nama" value="\${state.formValues.nama_rencana}">
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Periode Mulai</label>
          <input type="date" class="form-control" id="rs-mulai" value="\${state.formValues.periode_mulai}">
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Periode Selesai</label>
          <input type="date" class="form-control" id="rs-selesai" value="\${state.formValues.periode_selesai}">
        </div>
        <div class="col-12">
          <label class="form-label fw-semibold">Deskripsi</label>
          <textarea class="form-control" id="rs-deskripsi" rows="3">\${state.formValues.deskripsi}</textarea>
        </div>
        <div class="col-12">
          <label class="form-label fw-semibold">Target</label>
          <textarea class="form-control" id="rs-target" rows="2">\${state.formValues.target}</textarea>
        </div>
        <div class="col-12 pt-3">
          <button type="submit" class="btn btn-primary me-2">
            <i class="fas fa-save"></i> \${state.currentId ? 'Update' : 'Simpan'}
          </button>
          <button type="button" class="btn btn-outline-secondary" id="rs-reset-btn">
            <i class="fas fa-undo"></i> Reset
          </button>
        </div>
      </form>
    \`;
  }

  function renderTableRows() {
    if (!state.data || state.data.length === 0) {
      return \`
        <tr>
          <td colspan="6" class="text-center py-5">
            <div class="empty-state">
              <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
              <h5 class="text-muted">Belum ada data</h5>
              <p class="text-muted">Klik "Tambah Baru" untuk menambahkan rencana</p>
            </div>
          </td>
        </tr>
      \`;
    }
    
    return state.data.map(item => {
      const statusColor = item.status === 'Aktif' ? '#4caf50' : 
                         item.status === 'Draft' ? '#ff9800' : '#6c757d';
      
      const periode = item.periode_mulai && item.periode_selesai ? 
        \`\${formatDate(item.periode_mulai)} - \${formatDate(item.periode_selesai)}\` : '-';
      
      return \`
        <tr>
          <td class="py-3">
            <span class="badge bg-light text-dark px-3 py-2">\${item.kode}</span>
          </td>
          <td class="py-3">
            <h6 class="mb-1 fw-semibold">\${item.nama_rencana || '-'}</h6>
            \${item.deskripsi ? \`<small class="text-muted">\${truncate(item.deskripsi, 80)}</small>\` : ''}
          </td>
          <td class="py-3">\${item.target || '-'}</td>
          <td class="py-3"><small class="text-muted">\${periode}</small></td>
          <td class="py-3">
            <span class="badge px-3 py-2" style="background-color: \${statusColor}; color: white;">
              \${item.status || 'Draft'}
            </span>
          </td>
          <td class="py-3">
            <div class="btn-group">
              <button class="btn btn-outline-info btn-sm" onclick="viewDetail('\${item.id}')" title="Lihat">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-outline-warning btn-sm" onclick="startEdit('\${item.id}')" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-outline-danger btn-sm" onclick="deleteRencana('\${item.id}')" title="Hapus">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      \`;
    }).join('');
  }

  function renderMissionOptions() {
    if (!state.missions || state.missions.length === 0) {
      return '<option value="">Tidak ada misi</option>';
    }
    
    return state.missions.map(mission => {
      if (!mission.misi) return '';
      
      const misiArray = mission.misi.split('\\n').filter(m => m.trim());
      return misiArray.map((misi, index) => {
        const cleanMisi = misi.replace(/^\\d+\\.\\s*/, '').trim();
        const value = \`\${mission.id}|\${index}|\${encodeURIComponent(cleanMisi)}\`;
        const selected = state.formValues.visi_misi_id === value ? 'selected' : '';
        return \`<option value="\${value}" \${selected}>\${cleanMisi}</option>\`;
      }).join('');
    }).join('');
  }

  function findContainer() {
    const ids = ['rencana-strategis-content', 'rencana-strategis'];
    
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    
    const page = document.getElementById('rencana-strategis');
    if (page) {
      let content = page.querySelector('#rencana-strategis-content');
      if (!content) {
        content = document.createElement('div');
        content.id = 'rencana-strategis-content';
        content.className = 'container-fluid p-4';
        page.appendChild(content);
      }
      return content;
    }
    
    return null;
  }

  function bindEvents() {
    getEl('rs-form')?.addEventListener('submit', handleSubmit);
    getEl('rs-reset-btn')?.addEventListener('click', resetForm);
    getEl('rs-close-form')?.addEventListener('click', closeForm);
    getEl('rs-add-new')?.addEventListener('click', showAddForm);
    getEl('rs-export-btn')?.addEventListener('click', exportData);
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
      status: getEl('rs-status')?.value || 'Draft',
      sasaran_strategis: state.sasaranList,
      indikator_kinerja_utama: state.indikatorList
    };
    
    if (formData.visi_misi_id && formData.visi_misi_id.includes('|')) {
      formData.visi_misi_id = formData.visi_misi_id.split('|')[0];
    }
    
    if (!formData.nama_rencana) {
      alert('Nama rencana wajib diisi');
      return;
    }
    
    try {
      if (state.currentId) {
        await api()(\`/api/rencana-strategis/\${state.currentId}\`, { 
          method: 'PUT', 
          body: formData 
        });
        alert('Berhasil diupdate');
      } else {
        await api()('/api/rencana-strategis', { 
          method: 'POST', 
          body: formData 
        });
        alert('Berhasil disimpan');
      }
      
      await refreshData();
      closeForm();
      
    } catch (error) {
      console.error('Error saving:', error);
      alert('Gagal menyimpan: ' + error.message);
    }
  }

  function showAddForm() {
    state.currentId = null;
    state.formValues = getDefaultForm();
    state.sasaranList = [];
    state.indikatorList = [];
    state.showForm = true;
    
    generateKode().then(() => {
      render();
      setTimeout(() => {
        getEl('form-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  }

  function closeForm() {
    state.showForm = false;
    state.currentId = null;
    state.formValues = getDefaultForm();
    state.sasaranList = [];
    state.indikatorList = [];
    render();
  }

  function resetForm() {
    state.formValues = getDefaultForm();
    state.sasaranList = [];
    state.indikatorList = [];
    generateKode().then(() => render());
  }

  async function refreshData() {
    try {
      await fetchData();
      render();
    } catch (error) {
      console.error('Error refreshing:', error);
    }
  }

  async function exportData() {
    try {
      const response = await fetch('/api/rencana-strategis/actions/export');
      if (!response.ok) throw new Error('Gagal export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'rencana-strategis.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Gagal export: ' + error.message);
    }
  }

  async function generateKode() {
    try {
      const response = await api()('/api/rencana-strategis/generate/kode/public');
      state.formValues.kode = response.kode;
    } catch (error) {
      const year = new Date().getFullYear();
      const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      state.formValues.kode = \`RS-\${year}-\${random}\`;
    }
  }

  function viewDetail(id) {
    const record = state.data.find(i => i.id === id);
    if (!record) return;
    
    alert(\`Detail:\\n\\nKode: \${record.kode}\\nNama: \${record.nama_rencana}\\nStatus: \${record.status}\`);
  }

  function startEdit(id) {
    const record = state.data.find(i => i.id === id);
    if (!record) return;
    
    state.currentId = id;
    state.formValues = {
      kode: record.kode,
      visi_misi_id: record.visi_misi_id || '',
      nama_rencana: record.nama_rencana,
      deskripsi: record.deskripsi || '',
      periode_mulai: record.periode_mulai ? record.periode_mulai.substring(0, 10) : '',
      periode_selesai: record.periode_selesai ? record.periode_selesai.substring(0, 10) : '',
      target: record.target || '',
      status: record.status || 'Draft'
    };
    
    state.sasaranList = safeArray(record.sasaran_strategis);
    state.indikatorList = safeArray(record.indikator_kinerja_utama);
    state.showForm = true;
    
    render();
    setTimeout(() => {
      getEl('form-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async function deleteRencana(id) {
    if (!confirm('Hapus rencana ini?')) return;
    
    try {
      await api()(\`/api/rencana-strategis/\${id}\`, { method: 'DELETE' });
      alert('Berhasil dihapus');
      await refreshData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Gagal menghapus: ' + error.message);
    }
  }

  function showError(message) {
    const container = findContainer();
    if (container) {
      container.innerHTML = \`
        <div class="alert alert-danger">
          <h4><i class="fas fa-exclamation-triangle"></i> Error</h4>
          <p>\${message}</p>
          <button onclick="location.reload()" class="btn btn-primary">
            <i class="fas fa-sync"></i> Refresh
          </button>
        </div>
      \`;
    }
  }

  function safeArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID');
    } catch {
      return dateString;
    }
  }

  function truncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  return {
    load,
    viewDetail,
    startEdit,
    deleteRencana,
    state
  };
})();

// Global functions
window.viewDetail = (id) => RencanaStrategisModule.viewDetail(id);
window.startEdit = (id) => RencanaStrategisModule.startEdit(id);
window.deleteRencana = (id) => RencanaStrategisModule.deleteRencana(id);

// Export
window.RencanaStrategisModule = RencanaStrategisModule;
window.RencanaStrategisModuleEnhanced = RencanaStrategisModule;

console.log('✅ Rencana Strategis Module loaded');
`;

console.log('1. Creating fixed JavaScript module...');
fs.writeFileSync(
  path.join(__dirname, 'public', 'js', 'rencana-strategis-fixed-display.js'),
  fixedJS
);
console.log('✅ Created: public/js/rencana-strategis-fixed-display.js\n');

console.log('✅ Fix complete!\n');
console.log('📋 Next steps:');
console.log('1. Backup file lama: public/js/rencana-strategis.js');
console.log('2. Replace dengan file baru: rencana-strategis-fixed-display.js');
console.log('3. Atau update index.html untuk load file baru');
console.log('4. Refresh browser dengan Ctrl+Shift+R (hard refresh)');
