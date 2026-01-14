// Laporan Module - Complete Modern Design with Filters and Preview
const LaporanModule = (() => {
  const state = {
    rencanaStrategis: [],
    unitKerja: [],
    filters: { rencana_strategis_id: '', unit_kerja_id: '', date_from: '', date_to: '' },
    previewData: null,
    isLoading: false
  };

  const api = () => {
    if (window.app && window.app.apiCall) return window.app.apiCall;
    if (window.apiCall) return window.apiCall;
    return null;
  };

  async function load() {
    console.log('📊 LaporanModule.load() called');
    const content = document.getElementById('laporan-content');
    if (!content) {
      console.error('❌ laporan-content element not found!');
      return;
    }
    
    state.isLoading = true;
    renderLoading();
    
    try {
      // Wait a bit for API to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchMasterData();
      render();
      console.log('✅ LaporanModule loaded successfully');
    } catch (error) {
      console.error('Error loading laporan:', error);
      renderError(error.message);
    } finally {
      state.isLoading = false;
    }
  }

  async function fetchMasterData() {
    try {
      const apiCall = api();
      if (!apiCall) {
        console.warn('⚠️ API not available yet, will render with empty data');
        return;
      }
      
      console.log('📡 Fetching master data for laporan...');
      const [rencana, units] = await Promise.all([
        apiCall('/api/rencana-strategis').catch(e => { console.warn('Rencana strategis fetch failed:', e); return []; }),
        apiCall('/api/master-data/work-units').catch(e => { console.warn('Work units fetch failed:', e); return []; })
      ]);
      
      state.rencanaStrategis = Array.isArray(rencana) ? rencana : [];
      state.unitKerja = Array.isArray(units) ? units : [];
      console.log(`📊 Loaded ${state.rencanaStrategis.length} rencana strategis, ${state.unitKerja.length} unit kerja`);
    } catch (error) {
      console.error('Error fetching master data:', error);
      // Don't throw - we'll render with empty data
    }
  }

  function renderLoading() {
    const content = document.getElementById('laporan-content');
    if (!content) return;
    content.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:center;min-height:300px;">
        <div style="text-align:center;">
          <i class="fas fa-spinner fa-spin" style="font-size:3rem;color:#3498db;"></i>
          <p style="margin-top:1rem;color:#666;">Memuat laporan...</p>
        </div>
      </div>`;
  }

  function renderError(message) {
    const content = document.getElementById('laporan-content');
    if (!content) return;
    content.innerHTML = `
      <div class="card">
        <div class="card-body" style="text-align:center;padding:3rem;">
          <i class="fas fa-exclamation-triangle" style="font-size:3rem;color:#e74c3c;"></i>
          <h4 style="margin-top:1rem;">Terjadi Kesalahan</h4>
          <p style="color:#666;">${message}</p>
          <button class="btn btn-primary" onclick="LaporanModule.load()">
            <i class="fas fa-redo"></i> Coba Lagi
          </button>
        </div>
      </div>`;
  }

  function render() {
    const content = document.getElementById('laporan-content');
    if (!content) {
      console.error('❌ laporan-content element not found');
      return;
    }
    
    console.log('🎨 Rendering laporan content...');
    console.log('   - Rencana Strategis:', state.rencanaStrategis.length);
    console.log('   - Unit Kerja:', state.unitKerja.length);
    
    content.innerHTML = `
      <div class="card" style="margin-bottom:1.5rem;border:none;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);overflow:hidden;">
        <div class="card-header" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:1.25rem 1.5rem;border:none;">
          <h3 class="card-title" style="margin:0;display:flex;align-items:center;gap:0.75rem;font-size:1.25rem;">
            <i class="fas fa-file-alt"></i> Laporan Manajemen Risiko
          </h3>
        </div>
        <div class="card-body" style="padding:1.5rem;">
          ${renderFilters()}
          ${renderReportCards()}
        </div>
      </div>
      ${state.previewData ? renderPreview() : ''}
    `;
    console.log('✅ Laporan content rendered successfully');
  }

  function renderFilters() {
    return `
      <div style="background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);padding:1.5rem;border-radius:12px;margin-bottom:2rem;border:1px solid #dee2e6;">
        <h4 style="margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;color:#495057;">
          <i class="fas fa-filter"></i> Filter Laporan
        </h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;">
          <div class="form-group" style="margin:0;">
            <label style="font-weight:600;color:#495057;margin-bottom:0.5rem;display:block;">Rencana Strategis</label>
            <select class="form-control" id="filter-laporan-rencana" onchange="LaporanModule.updateFilter()" style="border-radius:8px;">
              <option value="">-- Semua Rencana --</option>
              ${state.rencanaStrategis.map(r => `<option value="${r.id}">${r.nama_rencana || r.name || 'Unnamed'}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin:0;">
            <label style="font-weight:600;color:#495057;margin-bottom:0.5rem;display:block;">Unit Kerja</label>
            <select class="form-control" id="filter-laporan-unit" onchange="LaporanModule.updateFilter()" style="border-radius:8px;">
              <option value="">-- Semua Unit --</option>
              ${state.unitKerja.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>`;
  }

  function renderReportCards() {
    const reports = [
      { id: 'risk-register', title: 'Risk Register', icon: 'fa-book', desc: 'Laporan lengkap register risiko organisasi', color: '#3498db', gradient: 'linear-gradient(135deg,#3498db 0%,#2980b9 100%)', ep: { excel: '/api/reports/risk-register/excel', pdf: '/api/reports/risk-register/pdf' } },
      { id: 'risk-profile', title: 'Risk Profile', icon: 'fa-chart-bar', desc: 'Profil risiko inherent dengan matrix 5×5', color: '#9b59b6', gradient: 'linear-gradient(135deg,#9b59b6 0%,#8e44ad 100%)', ep: { excel: '/api/reports/risk-profile/excel', pdf: '/api/reports/risk-profile/pdf' } },
      { id: 'residual-risk', title: 'Residual Risk', icon: 'fa-chart-pie', desc: 'Analisis residual risk setelah mitigasi', color: '#1abc9c', gradient: 'linear-gradient(135deg,#1abc9c 0%,#16a085 100%)', ep: { excel: '/api/reports/residual-risk/excel', pdf: '/api/reports/residual-risk/pdf' } },
      { id: 'risk-appetite', title: 'Risk Appetite', icon: 'fa-tachometer-alt', desc: 'Dashboard risk appetite dan threshold', color: '#e74c3c', gradient: 'linear-gradient(135deg,#e74c3c 0%,#c0392b 100%)', ep: { excel: '/api/reports/risk-appetite/excel', pdf: '/api/reports/risk-appetite/pdf' } },
      { id: 'kri-dashboard', title: 'KRI Dashboard', icon: 'fa-gauge-high', desc: 'Key Risk Indicator dengan trend analysis', color: '#27ae60', gradient: 'linear-gradient(135deg,#27ae60 0%,#229954 100%)', ep: { excel: '/api/reports/kri/excel', pdf: '/api/reports/kri/pdf' } },
      { id: 'monitoring-evaluasi', title: 'Monitoring & Evaluasi', icon: 'fa-tasks', desc: 'Progress monitoring mitigasi risiko', color: '#f39c12', gradient: 'linear-gradient(135deg,#f39c12 0%,#d68910 100%)', ep: { excel: '/api/reports/monitoring/excel', pdf: '/api/reports/monitoring/pdf' } },
      { id: 'loss-event', title: 'Loss Event', icon: 'fa-exclamation-triangle', desc: 'Laporan kejadian loss event', color: '#c0392b', gradient: 'linear-gradient(135deg,#c0392b 0%,#a93226 100%)', ep: { excel: '/api/reports/loss-event/excel', pdf: '/api/reports/loss-event/pdf' } },
      { id: 'strategic-map', title: 'Strategic Map', icon: 'fa-project-diagram', desc: 'Peta strategi organisasi', color: '#34495e', gradient: 'linear-gradient(135deg,#34495e 0%,#2c3e50 100%)', ep: { excel: '/api/reports/strategic-map/excel', pdf: '/api/reports/strategic-map/pdf' } }
    ];

    console.log('🃏 Rendering', reports.length, 'report cards');

    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem;">
        ${reports.map((r, idx) => `
          <div class="report-card" style="background:#ffffff;border-radius:16px;box-shadow:0 4px 15px rgba(0,0,0,0.1);overflow:hidden;transition:all 0.3s ease;border:1px solid #e9ecef;animation:fadeInUp 0.4s ease forwards;animation-delay:${idx * 0.05}s;">
            <div style="background:${r.gradient};padding:1.25rem;color:#ffffff;">
              <div style="display:flex;align-items:center;gap:1rem;">
                <div style="width:50px;height:50px;background:rgba(255,255,255,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                  <i class="fas ${r.icon}" style="font-size:1.5rem;color:#ffffff;"></i>
                </div>
                <h4 style="margin:0;font-size:1.1rem;font-weight:600;color:#ffffff;">${r.title}</h4>
              </div>
            </div>
            <div style="padding:1.25rem;background:#ffffff;">
              <p style="color:#666666;font-size:0.875rem;min-height:45px;line-height:1.5;margin-bottom:1rem;">${r.desc}</p>
              <div style="display:flex;gap:0.5rem;">
                <button class="btn btn-success btn-sm" style="flex:1;border-radius:8px;padding:0.5rem;background:linear-gradient(135deg,#27ae60 0%,#229954 100%);border:none;color:#ffffff;cursor:pointer;" onclick="LaporanModule.downloadExcel('${r.id}','${r.ep.excel}')">
                  <i class="fas fa-file-excel"></i> Excel
                </button>
                <button class="btn btn-danger btn-sm" style="flex:1;border-radius:8px;padding:0.5rem;background:linear-gradient(135deg,#e74c3c 0%,#c0392b 100%);border:none;color:#ffffff;cursor:pointer;" onclick="LaporanModule.downloadPDF('${r.id}','${r.ep.pdf}')">
                  <i class="fas fa-file-pdf"></i> PDF
                </button>
                <button class="btn btn-info btn-sm" style="border-radius:8px;padding:0.5rem 0.75rem;background:linear-gradient(135deg,#3498db 0%,#2980b9 100%);border:none;color:#ffffff;cursor:pointer;" onclick="LaporanModule.showPreview('${r.id}')" title="Preview Data">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <style>
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .report-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
      </style>`;
  }

  function renderPreview() {
    if (!state.previewData) return '';
    const data = Array.isArray(state.previewData.data) ? state.previewData.data : [state.previewData.data];
    const keys = data.length > 0 ? Object.keys(data[0]).filter(k => 
      !['id', 'user_id', 'organization_id', 'created_at', 'updated_at'].includes(k)
    ) : [];
    
    // Show more columns in preview
    const displayKeys = keys.slice(0, 10);
    const totalRecords = state.previewData.totalRecords || data.length;
    const displayLimit = 50; // Show more rows in preview
    
    return `
      <div class="card" style="margin-top:1.5rem;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
        <div class="card-header d-flex justify-content-between align-items-center" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border-bottom:none;">
          <div>
            <h5 class="mb-0" style="display:flex;align-items:center;gap:0.5rem;color:white;">
              <i class="fas fa-eye"></i> Preview: ${state.previewData.title}
            </h5>
            <small style="opacity:0.9;">Menampilkan ${Math.min(displayLimit, data.length)} dari ${totalRecords} records</small>
          </div>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-light btn-sm" onclick="LaporanModule.downloadExcel('${state.previewData.reportId || 'preview'}', '/api/reports/${state.previewData.reportId || 'risk-register'}/excel')" style="border-radius:8px;">
              <i class="fas fa-file-excel text-success"></i> Excel
            </button>
            <button class="btn btn-light btn-sm" onclick="LaporanModule.downloadPDF('${state.previewData.reportId || 'preview'}', '/api/reports/${state.previewData.reportId || 'risk-register'}/pdf')" style="border-radius:8px;">
              <i class="fas fa-file-pdf text-danger"></i> PDF
            </button>
            <button class="btn btn-light btn-sm" onclick="LaporanModule.closePreview()" style="border-radius:8px;">
              <i class="fas fa-times"></i> Tutup
            </button>
          </div>
        </div>
        <div class="card-body" style="padding:0;">
          <div class="table-responsive" style="max-height:500px;overflow:auto;">
            <table class="table table-striped table-hover mb-0" style="font-size:0.85rem;">
              <thead style="background:#343a40;color:white;position:sticky;top:0;z-index:10;">
                <tr>
                  <th style="padding:0.75rem;white-space:nowrap;position:sticky;top:0;background:#343a40;">No</th>
                  ${displayKeys.map(k => `<th style="padding:0.75rem;white-space:nowrap;position:sticky;top:0;background:#343a40;">${formatColumnName(k)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.slice(0, displayLimit).map((item, idx) => `
                  <tr>
                    <td style="padding:0.75rem;text-align:center;font-weight:bold;">${idx + 1}</td>
                    ${displayKeys.map(k => {
                      let v = item[k];
                      if (typeof v === 'object' && v) v = v.name || JSON.stringify(v);
                      const displayVal = String(v || '-');
                      const truncated = displayVal.length > 60 ? displayVal.substring(0, 60) + '...' : displayVal;
                      return `<td style="padding:0.75rem;max-width:250px;overflow:hidden;text-overflow:ellipsis;" title="${displayVal.replace(/"/g, '&quot;')}">${truncated}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ${data.length > displayLimit ? `
            <div style="padding:1rem;text-align:center;background:#f8f9fa;border-top:1px solid #dee2e6;">
              <small class="text-muted">
                <i class="fas fa-info-circle"></i> 
                Menampilkan ${displayLimit} dari ${totalRecords} records. Unduh Excel/PDF untuk data lengkap.
              </small>
            </div>
          ` : ''}
        </div>
      </div>`;
  }

  function formatColumnName(name) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  function updateFilter() {
    state.filters.rencana_strategis_id = document.getElementById('filter-laporan-rencana')?.value || '';
    state.filters.unit_kerja_id = document.getElementById('filter-laporan-unit')?.value || '';
    console.log('Filters updated:', state.filters);
  }

  function buildQueryParams() {
    const params = new URLSearchParams();
    Object.entries(state.filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    return params.toString();
  }

  async function getAuthToken() {
    try {
      if (window.SupabaseClientManager) {
        const client = await window.SupabaseClientManager.waitForClient(3000);
        const { data } = await client.auth.getSession();
        return data?.session?.access_token || null;
      }
      if (window.supabaseClient) {
        const { data } = await window.supabaseClient.auth.getSession();
        return data?.session?.access_token || null;
      }
      return localStorage.getItem('supabase_token') || null;
    } catch (e) {
      console.warn('Error getting auth token:', e);
      return null;
    }
  }

  function showProgressModal(title, message) {
    const modalId = 'laporan-progress-modal';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.innerHTML = `
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;">
        <div style="background:white;border-radius:16px;padding:2rem;min-width:350px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.2);">
          <h4 style="margin-bottom:1rem;color:#333;">${title}</h4>
          <div style="margin-bottom:1rem;">
            <div style="background:#e9ecef;border-radius:10px;height:10px;overflow:hidden;">
              <div id="progress-bar" style="background:linear-gradient(90deg,#667eea,#764ba2);height:100%;width:0%;transition:width 0.3s ease;"></div>
            </div>
          </div>
          <p id="progress-message" style="color:#666;margin:0;">${message}</p>
        </div>
      </div>`;
    document.body.appendChild(modal);
    return modal;
  }

  function updateProgress(modal, percent, message) {
    if (!modal) return;
    const bar = modal.querySelector('#progress-bar');
    const msg = modal.querySelector('#progress-message');
    if (bar) bar.style.width = `${percent}%`;
    if (msg) msg.textContent = message;
  }

  function hideModal(modal) {
    if (modal && modal.parentNode) {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 200);
    }
  }

  // Track active downloads to prevent duplicates
  const activeDownloads = new Set();
  let downloadDebounceTimer = null;

  function triggerDownload(blob, fileName) {
    // Prevent duplicate downloads
    if (activeDownloads.has(fileName)) {
      console.warn(`Download already in progress for: ${fileName}`);
      return;
    }
    
    activeDownloads.add(fileName);
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    
    // Single click only
    a.click();
    
    // Cleanup with delay
    setTimeout(() => {
      if (a.parentNode) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
      activeDownloads.delete(fileName);
    }, 200);
  }

  function showNotification(title, message, type = 'info') {
    const colors = { success: '#27ae60', error: '#e74c3c', info: '#3498db', warning: '#f39c12' };
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-circle' };
    
    const notif = document.createElement('div');
    notif.style.cssText = `position:fixed;top:20px;right:20px;background:white;border-radius:12px;padding:1rem 1.5rem;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:10001;display:flex;align-items:center;gap:1rem;border-left:4px solid ${colors[type]};animation:slideIn 0.3s ease;max-width:400px;`;
    notif.innerHTML = `
      <i class="fas ${icons[type]}" style="font-size:1.5rem;color:${colors[type]};"></i>
      <div>
        <strong style="display:block;color:#333;">${title}</strong>
        ${message ? `<small style="color:#666;">${message}</small>` : ''}
      </div>`;
    document.body.appendChild(notif);
    setTimeout(() => { notif.style.opacity = '0'; setTimeout(() => notif.remove(), 300); }, 4000);
  }

  async function downloadExcel(reportId, endpoint) {
    // Prevent duplicate downloads with debounce
    const downloadKey = `excel-${reportId}`;
    if (activeDownloads.has(downloadKey)) {
      console.warn(`Excel download already in progress for: ${reportId}`);
      showNotification('Download Sedang Berjalan', 'Mohon tunggu download selesai', 'warning');
      return;
    }
    
    // Clear any pending debounce
    if (downloadDebounceTimer) {
      clearTimeout(downloadDebounceTimer);
    }
    
    // Debounce rapid clicks
    return new Promise((resolve) => {
      downloadDebounceTimer = setTimeout(async () => {
        let modal = null;
        try {
          activeDownloads.add(downloadKey);
          
          const queryParams = buildQueryParams();
          const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
          modal = showProgressModal('Mengunduh Excel', 'Mempersiapkan...');
          updateProgress(modal, 20, 'Mengautentikasi...');

          const token = await getAuthToken();
          const headers = { 
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          updateProgress(modal, 50, 'Mengunduh data...');
          const response = await fetch(url, { 
            method: 'GET',
            headers,
            credentials: 'include'
          });
          
          if (!response.ok) {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const errorData = await response.json();
              throw new Error(errorData.error || `HTTP ${response.status}`);
            }
            throw new Error(`HTTP ${response.status}: Gagal mengunduh file`);
          }

          // Verify content type is Excel
          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('spreadsheet') && !contentType.includes('excel')) {
            console.warn('Unexpected content type:', contentType);
          }

          updateProgress(modal, 80, 'Memproses file...');
          const blob = await response.blob();
          
          // Validate blob size
          if (blob.size === 0) {
            throw new Error('File Excel kosong. Tidak ada data untuk diunduh.');
          }

          const fileName = `${reportId}-${new Date().toISOString().split('T')[0]}.xlsx`;
          console.log(`Excel downloaded: ${blob.size} bytes`);

          updateProgress(modal, 100, 'Selesai!');
          setTimeout(() => {
            triggerDownload(blob, fileName);
            hideModal(modal);
            showNotification('Excel berhasil diunduh!', `${fileName} (${formatFileSize(blob.size)})`, 'success');
            activeDownloads.delete(downloadKey);
            resolve(true);
          }, 500);
        } catch (error) {
          console.error('Download Excel error:', error);
          if (modal) hideModal(modal);
          showNotification('Error Download Excel', error.message, 'error');
          activeDownloads.delete(downloadKey);
          resolve(false);
        }
      }, 300); // 300ms debounce
    });
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async function downloadPDF(reportId, endpoint) {
    // Prevent duplicate downloads with debounce
    const downloadKey = `pdf-${reportId}`;
    if (activeDownloads.has(downloadKey)) {
      console.warn(`PDF download already in progress for: ${reportId}`);
      showNotification('Download Sedang Berjalan', 'Mohon tunggu download selesai', 'warning');
      return;
    }
    
    // Clear any pending debounce
    if (downloadDebounceTimer) {
      clearTimeout(downloadDebounceTimer);
    }
    
    // Debounce rapid clicks
    return new Promise((resolve) => {
      downloadDebounceTimer = setTimeout(async () => {
        let modal = null;
        try {
          activeDownloads.add(downloadKey);
          const queryParams = buildQueryParams();
          const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
          modal = showProgressModal('Mengunduh PDF', 'Mempersiapkan...');
          updateProgress(modal, 20, 'Mengautentikasi...');

          const token = await getAuthToken();
          const headers = { 'Accept': 'application/pdf' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          updateProgress(modal, 40, 'Mengunduh dari server...');
          
          try {
            const response = await fetch(url, { 
              method: 'GET',
              headers,
              credentials: 'include'
                });
            
            const contentType = response.headers.get('content-type') || '';

            // Check if server returned PDF
            if (response.ok && contentType.includes('pdf')) {
              updateProgress(modal, 80, 'Memproses file...');
              const blob = await response.blob();
              
              if (blob.size > 0) {
                const fileName = `${reportId}-${new Date().toISOString().split('T')[0]}.pdf`;
                console.log(`PDF downloaded from server: ${blob.size} bytes`);

                updateProgress(modal, 100, 'Selesai!');
                setTimeout(() => {
                  triggerDownload(blob, fileName);
                  hideModal(modal);
                  showNotification('PDF berhasil diunduh!', `${fileName} (${formatFileSize(blob.size)})`, 'success');
                  activeDownloads.delete(downloadKey);
                  resolve(true);
                }, 500);
                return;
              }
            }
            
            // Server PDF not available, generate client-side
            console.log('Server PDF not available, generating client-side PDF...');
          } catch (serverError) {
            console.warn('Server PDF fetch failed:', serverError.message);
          }

          // Fallback to client-side PDF generation
          updateProgress(modal, 50, 'Membuat PDF lokal...');
          const success = await generateClientPDF(reportId, modal);
          if (success) {
            activeDownloads.delete(downloadKey);
            resolve(true);
          } else {
            throw new Error('Gagal membuat PDF. Silakan coba unduh Excel.');
          }
        } catch (error) {
          console.error('Download PDF error:', error);
          if (modal) hideModal(modal);
          showNotification('Error PDF', error.message, 'error');
          activeDownloads.delete(downloadKey);
          resolve(false);
        }
      }, 300); // 300ms debounce
    });
  }

  async function generateClientPDF(reportId, modal) {
    try {
      // Load jsPDF if not available
      if (!window.jspdf && !window.jsPDF) {
        updateProgress(modal, 55, 'Memuat library PDF...');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.1/jspdf.plugin.autotable.min.js');
      }

      const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
      if (!jsPDF) {
        console.error('jsPDF not available');
        return false;
      }

      updateProgress(modal, 65, 'Mengambil data lengkap...');
      const data = await fetchReportData(reportId);
      if (!data || data.length === 0) {
        showNotification('Tidak ada data', 'Data kosong untuk laporan ini', 'warning');
        return false;
      }

      updateProgress(modal, 80, 'Membuat PDF...');
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Header
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text(getReportTitle(reportId), pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 22, { align: 'center' });
      doc.text(`Total Data: ${data.length} records`, pageWidth / 2, 28, { align: 'center' });

      // Prepare table data - get ALL columns
      const allColumns = Object.keys(data[0]);
      const columns = allColumns.map(col => ({
        header: formatColumnName(col),
        dataKey: col
      }));

      // Format data for table - include ALL data, not just first 30
      const tableData = data.map((row, index) => {
        const formattedRow = { 'No': index + 1 };
        allColumns.forEach(col => {
          let value = row[col];
          if (typeof value === 'object' && value !== null) {
            value = value.name || JSON.stringify(value);
          }
          // Don't truncate data - show full content
          formattedRow[col] = value !== null && value !== undefined ? String(value) : '-';
        });
        return formattedRow;
      });

      // Add No column to columns array
      columns.unshift({ header: 'No', dataKey: 'No' });

      // Use autoTable for better formatting with ALL data
      if (doc.autoTable) {
        doc.autoTable({
          startY: 35,
          head: [columns.map(c => c.header)],
          body: tableData.map(row => columns.map(c => row[c.dataKey])),
          theme: 'grid',
          headStyles: {
            fillColor: [52, 73, 94],
            textColor: 255,
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 3
          },
          bodyStyles: {
            fontSize: 7,
            cellPadding: 2,
            overflow: 'linebreak', // Allow text wrapping for complete content
            cellWidth: 'wrap'
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' } // No column
          },
          margin: { top: 35, left: 10, right: 10, bottom: 20 },
          tableWidth: 'auto',
          showHead: 'everyPage', // Show header on every page
          didDrawPage: function(data) {
            // Footer on each page with total pages
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(128);
            doc.text(
              `Halaman ${data.pageNumber} dari ${pageCount}`,
              pageWidth / 2,
              pageHeight - 10,
              { align: 'center' }
            );
            
            // Header on subsequent pages
            if (data.pageNumber > 1) {
              doc.setFontSize(10);
              doc.setTextColor(100);
              doc.text(getReportTitle(reportId), 10, 10);
            }
          }
        });
      } else {
        // Fallback manual table rendering for ALL data
        let y = 40;
        const colWidth = Math.min(40, (pageWidth - 20) / Math.min(columns.length, 7));
        const maxCols = Math.min(columns.length, 7);
        
        // Header row
        doc.setFillColor(52, 73, 94);
        doc.rect(10, y - 5, maxCols * colWidth, 8, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        columns.slice(0, maxCols).forEach((c, i) => {
          doc.text(c.header.substring(0, 12), 12 + i * colWidth, y);
        });
        
        y += 10;
        doc.setTextColor(51, 51, 51);
        
        // Render ALL rows with pagination
        tableData.forEach((row, idx) => {
          if (idx % 2 === 0) {
            doc.setFillColor(248, 249, 250);
            doc.rect(10, y - 4, maxCols * colWidth, 7, 'F');
          }
          columns.slice(0, maxCols).forEach((c, i) => {
            const val = String(row[c.dataKey] || '-').substring(0, 15);
            doc.text(val, 12 + i * colWidth, y);
          });
          y += 7;
          
          // Add new page if needed
          if (y > pageHeight - 25) {
            doc.addPage();
            y = 20;
            // Re-draw header on new page
            doc.setFillColor(52, 73, 94);
            doc.rect(10, y - 5, maxCols * colWidth, 8, 'F');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            columns.slice(0, maxCols).forEach((c, i) => {
              doc.text(c.header.substring(0, 12), 12 + i * colWidth, y);
            });
            y += 10;
            doc.setTextColor(51, 51, 51);
          }
        });
      }

      updateProgress(modal, 95, 'Menyimpan...');
      const fileName = `${reportId}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      updateProgress(modal, 100, 'Selesai!');
      setTimeout(() => { 
        hideModal(modal); 
        showNotification('PDF berhasil dibuat!', `${fileName} - ${data.length} records`, 'success'); 
      }, 300);
      return true;
    } catch (e) {
      console.error('Client PDF generation error:', e);
      return false;
    }
  }

  async function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function fetchReportData(reportId) {
    const endpoints = {
      'risk-register': '/api/reports/risk-register',
      'risk-profile': '/api/reports/risk-profile',
      'residual-risk': '/api/reports/residual-risk',
      'risk-appetite': '/api/reports/risk-appetite-dashboard',
      'kri-dashboard': '/api/kri',
      'monitoring-evaluasi': '/api/monitoring-evaluasi',
      'loss-event': '/api/loss-events',
      'strategic-map': '/api/strategic-map'
    };

    const endpoint = endpoints[reportId];
    if (!endpoint) return [];

    try {
      const token = await getAuthToken();
      const headers = { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(endpoint, { 
        method: 'GET',
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch ${reportId}:`, response.status);
        return [];
      }
      
      const data = await response.json();
      
      // Handle different response formats
      let result = [];
      if (Array.isArray(data)) {
        result = data;
      } else if (data.data && Array.isArray(data.data)) {
        result = data.data;
      } else if (data.fullData && Array.isArray(data.fullData)) {
        result = data.fullData;
      } else if (typeof data === 'object' && data !== null) {
        result = [data];
      }
      
      // Flatten nested objects for better display
      result = result.map(item => flattenObject(item));
      
      console.log(`Fetched ${result.length} records for ${reportId}`);
      return result;
    } catch (e) {
      console.error('Error fetching report data:', e);
      return [];
    }
  }

  function flattenObject(obj, prefix = '') {
    const result = {};
    
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;
      
      // Skip certain keys
      if (['id', 'user_id', 'organization_id', 'created_at', 'updated_at'].includes(key) && prefix) {
        continue;
      }
      
      if (value === null || value === undefined) {
        result[newKey] = '-';
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Flatten nested object but only one level deep
        if (value.name) {
          result[newKey] = value.name;
        } else {
          const nested = flattenObject(value, newKey);
          Object.assign(result, nested);
        }
      } else if (Array.isArray(value)) {
        // For arrays, take first item's relevant data
        if (value.length > 0 && typeof value[0] === 'object') {
          const firstItem = value[0];
          if (firstItem.risk_value !== undefined) {
            result[`${newKey}_value`] = firstItem.risk_value;
            result[`${newKey}_level`] = firstItem.risk_level || '-';
          }
        } else {
          result[newKey] = value.join(', ');
        }
      } else {
        result[newKey] = value;
      }
    }
    
    return result;
  }

  function getReportTitle(reportId) {
    const titles = {
      'risk-register': 'Laporan Risk Register',
      'risk-profile': 'Laporan Risk Profile (Inherent)',
      'residual-risk': 'Laporan Residual Risk',
      'risk-appetite': 'Laporan Risk Appetite',
      'kri-dashboard': 'Laporan KRI Dashboard',
      'monitoring-evaluasi': 'Laporan Monitoring & Evaluasi',
      'loss-event': 'Laporan Loss Event',
      'strategic-map': 'Laporan Strategic Map'
    };
    return titles[reportId] || 'Laporan';
  }

  async function showPreview(reportId) {
    const modal = showProgressModal('Memuat Preview', 'Mengambil data lengkap...');
    try {
      updateProgress(modal, 50, 'Memproses...');
      const data = await fetchReportData(reportId);
      hideModal(modal);

      if (!data || data.length === 0) {
        showNotification('Data Kosong', 'Tidak ada data untuk ditampilkan', 'warning');
        return;
      }

      state.previewData = {
        title: getReportTitle(reportId),
        data: data,
        totalRecords: data.length,
        reportId: reportId
      };
      render();
      
      // Scroll to preview
      setTimeout(() => {
        const previewCard = document.querySelector('.card:last-child');
        if (previewCard) previewCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      hideModal(modal);
      showNotification('Error', error.message, 'error');
    }
  }

  function closePreview() {
    state.previewData = null;
    render();
  }

  // Public API
  return {
    load,
    render,
    updateFilter,
    downloadExcel,
    downloadPDF,
    showPreview,
    closePreview
  };
})();

// Register module globally for both naming conventions
window.LaporanModule = LaporanModule;
window.laporanModule = LaporanModule;

// Auto-initialize if on laporan page
document.addEventListener('DOMContentLoaded', () => {
  const laporanContent = document.getElementById('laporan-content');
  const laporanPage = document.getElementById('laporan');
  if (laporanContent && laporanPage && laporanPage.style.display !== 'none') {
    console.log('Auto-initializing LaporanModule');
    LaporanModule.load();
  }
});

console.log('✅ LaporanModule loaded and registered');
