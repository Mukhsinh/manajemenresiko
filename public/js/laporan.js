// Laporan Module - Modern Design with Filters and Preview
const LaporanModule = (() => {
  const state = {
    rencanaStrategis: [],
    unitKerja: [],
    filters: {
      rencana_strategis_id: '',
      unit_kerja_id: '',
      date_from: '',
      date_to: ''
    },
    previewData: null
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);

  async function load() {
    await fetchMasterData();
    render();
  }

  async function fetchMasterData() {
    try {
      const [rencana, units] = await Promise.all([
        api()('/api/rencana-strategis'),
        api()('/api/master-data/work-units')
      ]);
      state.rencanaStrategis = rencana || [];
      state.unitKerja = units || [];
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  }

  function render() {
    const content = document.getElementById('laporan-content');
    if (!content) return;

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-file-alt"></i> Laporan Manajemen Risiko</h3>
        </div>
        <div class="card-body">
          ${renderFilters()}
          ${renderReportCards()}
        </div>
      </div>
      
      ${state.previewData ? renderPreview() : ''}
    `;
  }

  function renderFilters() {
    return `
      <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
        <h4 style="margin-bottom: 1rem;"><i class="fas fa-filter"></i> Filter Laporan</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div class="form-group" style="margin: 0;">
            <label style="font-size: 0.875rem; font-weight: 600;">Rencana Strategis</label>
            <select class="form-control" id="filter-laporan-rencana" onchange="LaporanModule.updateFilter()">
              <option value="">Semua</option>
              ${state.rencanaStrategis.map(r => `<option value="${r.id}">${r.nama_rencana}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="font-size: 0.875rem; font-weight: 600;">Unit Kerja</label>
            <select class="form-control" id="filter-laporan-unit" onchange="LaporanModule.updateFilter()">
              <option value="">Semua</option>
              ${state.unitKerja.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="font-size: 0.875rem; font-weight: 600;">Dari Tanggal</label>
            <input type="date" class="form-control" id="filter-laporan-from" onchange="LaporanModule.updateFilter()">
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="font-size: 0.875rem; font-weight: 600;">Sampai Tanggal</label>
            <input type="date" class="form-control" id="filter-laporan-to" onchange="LaporanModule.updateFilter()">
          </div>
        </div>
      </div>
    `;
  }

  function renderReportCards() {
    const reports = [
      {
        id: 'risk-register',
        title: 'Risk Register',
        icon: 'fa-book',
        description: 'Laporan lengkap register risiko mencakup inherent risk, residual risk, dan treatment plan',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        endpoints: {
          excel: '/api/reports/risk-register/excel',
          pdf: '/api/reports/risk-register/pdf'
        }
      },
      {
        id: 'risk-profile',
        title: 'Risk Profile',
        icon: 'fa-chart-bar',
        description: 'Profil risiko inherent dengan matrix 5×5 dan analisis detail per kategori risiko',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        endpoints: {
          excel: '/api/reports/risk-profile/excel',
          pdf: '/api/reports/risk-profile/pdf'
        }
      },
      {
        id: 'residual-risk',
        title: 'Residual Risk',
        icon: 'fa-chart-pie',
        description: 'Analisis residual risk setelah mitigasi, perbandingan dengan inherent risk',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        endpoints: {
          excel: '/api/reports/residual-risk/excel',
          pdf: '/api/reports/residual-risk/pdf'
        }
      },
      {
        id: 'risk-appetite',
        title: 'Risk Appetite',
        icon: 'fa-tachometer-alt',
        description: 'Dashboard risk appetite, threshold monitoring, dan compliance terhadap batas risiko',
        color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        endpoints: {
          excel: '/api/reports/risk-appetite/excel',
          pdf: '/api/reports/risk-appetite/pdf'
        }
      },
      {
        id: 'kri-dashboard',
        title: 'KRI Dashboard',
        icon: 'fa-gauge-high',
        description: 'Laporan Key Risk Indicator dengan trend analysis dan threshold monitoring',
        color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        endpoints: {
          excel: '/api/reports/kri/excel',
          pdf: '/api/reports/kri/pdf'
        }
      },
      {
        id: 'monitoring-evaluasi',
        title: 'Monitoring & Evaluasi',
        icon: 'fa-tasks',
        description: 'Progress monitoring mitigasi risiko dengan timeline dan achievement tracking',
        color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        endpoints: {
          excel: '/api/reports/monitoring/excel',
          pdf: '/api/reports/monitoring/pdf'
        }
      },
      {
        id: 'loss-event',
        title: 'Loss Event',
        icon: 'fa-exclamation-triangle',
        description: 'Laporan kejadian loss event dengan analisis root cause dan lessons learned',
        color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        endpoints: {
          excel: '/api/reports/loss-event/excel',
          pdf: '/api/reports/loss-event/pdf'
        }
      },
      {
        id: 'strategic-map',
        title: 'Strategic Map',
        icon: 'fa-project-diagram',
        description: 'Peta strategi organisasi dengan balanced scorecard perspectives',
        color: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
        endpoints: {
          excel: '/api/reports/strategic-map/excel',
          pdf: '/api/reports/strategic-map/pdf'
        }
      }
    ];

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">
        ${reports.map(report => `
          <div style="background: white; border-radius: 12px; padding: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;"
               onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.15)'"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)'">
            <div style="background: ${report.color}; padding: 1.5rem; color: white;">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                <i class="fas ${report.icon}" style="font-size: 2rem;"></i>
                <h4 style="margin: 0; font-size: 1.25rem;">${report.title}</h4>
              </div>
            </div>
            <div style="padding: 1.5rem;">
              <p style="color: #666; font-size: 0.875rem; line-height: 1.6; min-height: 60px;">
                ${report.description}
              </p>
              <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="btn btn-success" style="flex: 1; font-size: 0.875rem;" 
                        onclick="LaporanModule.downloadExcel('${report.id}', '${report.endpoints.excel}')">
                  <i class="fas fa-file-excel"></i> Excel
                </button>
                <button class="btn btn-danger" style="flex: 1; font-size: 0.875rem;" 
                        onclick="LaporanModule.downloadPDF('${report.id}', '${report.endpoints.pdf}')">
                  <i class="fas fa-file-pdf"></i> PDF
                </button>
                <button class="btn btn-info" style="font-size: 0.875rem;" 
                        onclick="LaporanModule.showPreview('${report.id}', '${report.endpoints.excel}')">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderPreview() {
    if (!state.previewData) return '';

    return `
      <div class="card" style="margin-top: 2rem;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 class="card-title"><i class="fas fa-eye"></i> Preview: ${state.previewData.title}</h3>
            <small class="text-muted">
              Total Records: ${state.previewData.totalRecords || 0} | 
              Endpoint: ${state.previewData.endpoint || ''}
            </small>
          </div>
          <button class="btn btn-secondary" onclick="LaporanModule.closePreview()">
            <i class="fas fa-times"></i> Tutup
          </button>
        </div>
        <div class="card-body">
          ${renderPreviewTable()}
        </div>
      </div>
    `;
  }

  function renderPreviewTable() {
    if (!state.previewData.data) return '<p>No data available</p>';
    
    const data = Array.isArray(state.previewData.data) ? state.previewData.data : [state.previewData.data];
    
    if (data.length === 0) return '<p>No data available</p>';
    
    // Get all unique keys from the data
    const allKeys = new Set();
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });
    
    const keys = Array.from(allKeys).slice(0, 10); // Limit to 10 columns for preview
    
    return `
      <div class="table-responsive" style="max-height: 400px; overflow: auto;">
        <table class="table table-striped table-sm">
          <thead class="thead-dark">
            <tr>
              ${keys.map(key => `<th style="min-width: 120px;">${key.replace(/_/g, ' ').toUpperCase()}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                ${keys.map(key => {
                  let value = item[key];
                  if (typeof value === 'object' && value !== null) {
                    value = JSON.stringify(value);
                  }
                  if (typeof value === 'string' && value.length > 50) {
                    value = value.substring(0, 50) + '...';
                  }
                  return `<td title="${value || ''}">${value || '-'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
        <h6>Raw Data (First Record):</h6>
        <pre style="font-size: 0.75rem; max-height: 200px; overflow: auto;">
${JSON.stringify(data[0], null, 2)}
        </pre>
      </div>
    `;
  }

  function updateFilter() {
    state.filters.rencana_strategis_id = document.getElementById('filter-laporan-rencana')?.value || '';
    state.filters.unit_kerja_id = document.getElementById('filter-laporan-unit')?.value || '';
    state.filters.date_from = document.getElementById('filter-laporan-from')?.value || '';
    state.filters.date_to = document.getElementById('filter-laporan-to')?.value || '';
  }

  function buildQueryParams() {
    const params = new URLSearchParams();
    if (state.filters.rencana_strategis_id) params.append('rencana_strategis_id', state.filters.rencana_strategis_id);
    if (state.filters.unit_kerja_id) params.append('unit_kerja_id', state.filters.unit_kerja_id);
    if (state.filters.date_from) params.append('date_from', state.filters.date_from);
    if (state.filters.date_to) params.append('date_to', state.filters.date_to);
    return params.toString();
  }

  async function downloadExcel(reportId, endpoint) {
    let progressModal = null;
    
    try {
      updateFilter();
      const queryParams = buildQueryParams();
      const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
      
      // Show progress modal
      progressModal = showProgressModal('Mengunduh Laporan Excel', 'Mempersiapkan download...');
      
      // Get auth token for the request
      let token = null;
      
      updateProgress(progressModal, 20, 'Mengautentikasi...');
      
      // Try multiple ways to get token
      if (window.apiService && typeof window.apiService.getAuthToken === 'function') {
        try {
          token = await window.apiService.getAuthToken();
        } catch (e) {
          console.warn('apiService.getAuthToken failed:', e);
        }
      }
      
      if (!token && window.supabaseClient) {
        try {
          const session = await window.supabaseClient.auth.getSession();
          token = session.data.session?.access_token;
        } catch (e) {
          console.warn('supabaseClient.auth.getSession failed:', e);
        }
      }
      
      // Try localStorage as fallback
      if (!token) {
        token = localStorage.getItem('supabase.auth.token') || 
                localStorage.getItem('authToken') ||
                sessionStorage.getItem('authToken');
      }
      
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('Downloading Excel:', url, 'with token:', token ? 'Yes' : 'No');
      
      updateProgress(progressModal, 40, 'Menghubungi server...');
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', response.status, errorText);
        
        // If auth failed, try test endpoint
        if (response.status === 401 && reportId === 'risk-register') {
          console.log('Auth failed, trying test endpoint...');
          updateProgress(progressModal, 50, 'Mencoba endpoint alternatif...');
          
          const testResponse = await fetch('/api/reports/test-excel-download');
          if (testResponse.ok) {
            updateProgress(progressModal, 80, 'Memproses file...');
            const blob = await testResponse.blob();
            const fileName = `test-${reportId}-${new Date().toISOString().split('T')[0]}.xlsx`;
            
            updateProgress(progressModal, 100, 'Download selesai!');
            setTimeout(() => {
              triggerDownload(blob, fileName);
              hideProgressModal(progressModal);
              showSuccessNotification('Laporan Excel berhasil diunduh!', fileName);
            }, 500);
            return;
          }
        }
        
        throw new Error(`Gagal mengunduh laporan: ${response.status} ${errorText.substring(0, 200)}`);
      }

      updateProgress(progressModal, 70, 'Memproses data...');
      
      // Check if response is actually Excel
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('spreadsheet')) {
        console.warn('Unexpected content type:', contentType);
        // Try to parse as JSON to see if it's an error
        try {
          const text = await response.text();
          if (text.includes('error') || text.includes('Error')) {
            throw new Error('Server returned error instead of Excel file');
          }
        } catch (e) {
          // If it's not JSON, continue with blob processing
        }
      }

      updateProgress(progressModal, 90, 'Menyiapkan file...');
      
      const blob = await response.blob();
      
      // Validate blob size
      if (blob.size < 100) {
        throw new Error('File terlalu kecil, kemungkinan terjadi error pada server');
      }
      
      const fileName = `${reportId}-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      updateProgress(progressModal, 100, 'Download selesai!');
      
      setTimeout(() => {
        triggerDownload(blob, fileName);
        hideProgressModal(progressModal);
        showSuccessNotification('Laporan Excel berhasil diunduh!', fileName);
      }, 500);
      
    } catch (error) {
      console.error('Download error:', error);
      if (progressModal) {
        hideProgressModal(progressModal);
      }
      showErrorNotification('Error Download', error.message);
    }
  }

  async function downloadPDF(reportId, endpoint) {
    let progressModal = null;
    
    try {
      updateFilter();
      const queryParams = buildQueryParams();
      const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
      
      // Show progress modal
      progressModal = showProgressModal('Mengunduh Laporan PDF', 'Mempersiapkan download...');
      
      // Get auth token for the request
      let token = null;
      
      updateProgress(progressModal, 20, 'Mengautentikasi...');
      
      // Try multiple ways to get token
      if (window.apiService && typeof window.apiService.getAuthToken === 'function') {
        try {
          token = await window.apiService.getAuthToken();
        } catch (e) {
          console.warn('apiService.getAuthToken failed:', e);
        }
      }
      
      if (!token && window.supabaseClient) {
        try {
          const session = await window.supabaseClient.auth.getSession();
          token = session.data.session?.access_token;
        } catch (e) {
          console.warn('supabaseClient.auth.getSession failed:', e);
        }
      }
      
      // Try localStorage as fallback
      if (!token) {
        token = localStorage.getItem('supabase.auth.token') || 
                localStorage.getItem('authToken') ||
                sessionStorage.getItem('authToken');
      }
      
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('Downloading PDF:', url, 'with token:', token ? 'Yes' : 'No');
      
      updateProgress(progressModal, 40, 'Menghubungi server...');
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF Download failed:', response.status, errorText);
        
        // Show more helpful error message
        if (response.status === 401) {
          throw new Error('Autentikasi gagal. Silakan login ulang.');
        } else if (errorText.includes('PDF export not yet implemented')) {
          throw new Error('Export PDF belum diimplementasikan untuk laporan ini.');
        }
        
        throw new Error(`Gagal mengunduh laporan: ${response.status} ${errorText.substring(0, 200)}`);
      }

      updateProgress(progressModal, 70, 'Memproses PDF...');
      
      // Check if response is actually PDF
      const contentType = response.headers.get('content-type') || '';
      console.log('PDF Response Content-Type:', contentType);
      
      if (!contentType.includes('pdf')) {
        console.warn('Unexpected content type for PDF:', contentType);
        
        // Handle different content types appropriately
        if (contentType.includes('json')) {
          // It's a JSON response - likely an error or "not implemented" message
          try {
            const errorData = await response.json();
            const errorMessage = errorData.error || errorData.message || 'Server returned JSON instead of PDF';
            
            // Check if it's a "not implemented" message
            if (errorMessage.includes('not yet implemented') || errorMessage.includes('belum diimplementasikan')) {
              throw new Error('Export PDF belum diimplementasikan untuk laporan ini. Silakan gunakan Excel export.');
            } else {
              throw new Error(errorMessage);
            }
          } catch (jsonError) {
            if (jsonError.message.includes('belum diimplementasikan')) {
              throw jsonError; // Re-throw the specific message
            }
            throw new Error('Server mengembalikan response JSON alih-alih file PDF. Kemungkinan endpoint belum diimplementasi.');
          }
        } else {
          // For other content types, provide a generic error
          throw new Error(`Format response tidak sesuai. Diharapkan PDF tapi mendapat: ${contentType}. Kemungkinan endpoint PDF belum diimplementasi.`);
        }
      }

      updateProgress(progressModal, 90, 'Menyiapkan file...');
      
      const blob = await response.blob();
      
      // Validate blob size
      if (blob.size < 100) {
        throw new Error('File PDF terlalu kecil, kemungkinan terjadi error pada server');
      }
      
      const fileName = `${reportId}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      updateProgress(progressModal, 100, 'Download selesai!');
      
      setTimeout(() => {
        triggerDownload(blob, fileName);
        hideProgressModal(progressModal);
        showSuccessNotification('Laporan PDF berhasil diunduh!', fileName);
      }, 500);
      
    } catch (error) {
      console.error('PDF Download error:', error);
      if (progressModal) {
        hideProgressModal(progressModal);
      }
      showErrorNotification('Error Download PDF', error.message);
    }
  }

  async function showPreview(reportId, endpoint) {
    try {
      updateFilter();
      
      // Convert Excel endpoint to data endpoint for preview
      let previewEndpoint = endpoint.replace('/excel', '').replace('/pdf', '');
      
      // Special handling for different report types
      const endpointMap = {
        'risk-register': '/api/reports/risk-register',
        'risk-profile': '/api/reports/risk-profile',
        'residual-risk': '/api/reports/residual-risk',
        'risk-appetite': '/api/reports/risk-appetite-dashboard',
        'kri-dashboard': '/api/kri',
        'monitoring-evaluasi': '/api/monitoring-evaluasi',
        'loss-event': '/api/loss-event',
        'strategic-map': '/api/strategic-map'
      };
      
      previewEndpoint = endpointMap[reportId] || previewEndpoint;
      
      const queryParams = buildQueryParams();
      const url = queryParams ? `${previewEndpoint}?${queryParams}` : previewEndpoint;
      
      console.log('Preview URL:', url);
      
      const data = await api()(url);
      
      // Format data for better preview
      let previewData = data;
      if (Array.isArray(data)) {
        previewData = data.slice(0, 5); // Show first 5 items
      }
      
      state.previewData = {
        title: reportId.replace(/-/g, ' ').toUpperCase(),
        data: previewData,
        totalRecords: Array.isArray(data) ? data.length : 1,
        endpoint: url
      };
      render();
    } catch (error) {
      console.error('Preview error:', error);
      alert('Error loading preview: ' + error.message);
    }
  }

  function closePreview() {
    state.previewData = null;
    render();
  }

  function triggerDownload(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Progress Modal Functions
  function showProgressModal(title, message) {
    // Remove existing modal if any
    const existingModal = document.getElementById('download-progress-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'download-progress-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        min-width: 400px;
        max-width: 500px;
        text-align: center;
      ">
        <div style="margin-bottom: 1.5rem;">
          <i class="fas fa-download" style="font-size: 3rem; color: #007bff; margin-bottom: 1rem;"></i>
          <h3 style="margin: 0; color: #333; font-size: 1.5rem;">${title}</h3>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <div style="
            background: #f0f0f0;
            border-radius: 10px;
            height: 20px;
            overflow: hidden;
            position: relative;
          ">
            <div id="progress-bar" style="
              background: linear-gradient(90deg, #007bff, #0056b3);
              height: 100%;
              width: 0%;
              transition: width 0.3s ease;
              border-radius: 10px;
            "></div>
          </div>
          <div id="progress-text" style="
            margin-top: 0.5rem;
            color: #666;
            font-size: 0.9rem;
          ">${message}</div>
          <div id="progress-percentage" style="
            margin-top: 0.25rem;
            color: #007bff;
            font-weight: bold;
            font-size: 1.1rem;
          ">0%</div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  function updateProgress(modal, percentage, message) {
    if (!modal) return;
    
    const progressBar = modal.querySelector('#progress-bar');
    const progressText = modal.querySelector('#progress-text');
    const progressPercentage = modal.querySelector('#progress-percentage');
    
    if (progressBar) {
      progressBar.style.width = percentage + '%';
    }
    if (progressText) {
      progressText.textContent = message;
    }
    if (progressPercentage) {
      progressPercentage.textContent = percentage + '%';
    }
  }

  function hideProgressModal(modal) {
    if (modal && modal.parentNode) {
      modal.style.opacity = '0';
      modal.style.transform = 'scale(0.9)';
      modal.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 300);
    }
  }

  // Notification Functions
  function showSuccessNotification(title, subtitle) {
    showNotification(title, subtitle, 'success');
  }

  function showErrorNotification(title, subtitle) {
    showNotification(title, subtitle, 'error');
  }

  function showNotification(title, subtitle, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.download-notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'download-notification';
    
    const bgColor = type === 'success' ? '#28a745' : '#dc3545';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10001;
      min-width: 300px;
      max-width: 400px;
      font-family: Arial, sans-serif;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <i class="fas ${icon}" style="font-size: 1.5rem;"></i>
        <div>
          <div style="font-weight: bold; font-size: 1rem; margin-bottom: 0.25rem;">
            ${title}
          </div>
          ${subtitle ? `<div style="font-size: 0.85rem; opacity: 0.9;">${subtitle}</div>` : ''}
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none;
          border: none;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          margin-left: auto;
        ">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  }

  return {
    load,
    updateFilter,
    downloadExcel,
    downloadPDF,
    showPreview,
    closePreview
  };
})();

window.laporanModule = LaporanModule;
window.LaporanModule = LaporanModule;
