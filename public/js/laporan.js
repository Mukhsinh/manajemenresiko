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
          excel: '/api/reports/risk-register',
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
          excel: '/api/reports/risk-profile',
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
          excel: '/api/reports/residual-risk',
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
          excel: '/api/reports/risk-appetite',
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
          excel: '/api/reports/kri',
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
          excel: '/api/reports/monitoring',
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
          excel: '/api/reports/loss-event',
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
          excel: '/api/reports/strategic-map',
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
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-eye"></i> Preview: ${state.previewData.title}</h3>
          <button class="btn btn-secondary" onclick="LaporanModule.closePreview()">
            <i class="fas fa-times"></i> Tutup
          </button>
        </div>
        <div class="card-body">
          <div style="max-height: 500px; overflow: auto;">
            <pre style="background: #f8f9fa; padding: 1rem; border-radius: 4px; font-size: 0.875rem;">
${JSON.stringify(state.previewData.data, null, 2)}
            </pre>
          </div>
        </div>
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
    try {
      updateFilter();
      const queryParams = buildQueryParams();
      const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
      
      alert('Mengunduh laporan Excel...\nHarap tunggu sebentar.');
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Gagal mengunduh laporan');

      const blob = await response.blob();
      const fileName = `${reportId}-${new Date().toISOString().split('T')[0]}.xlsx`;
      triggerDownload(blob, fileName);
      
      alert('Laporan Excel berhasil diunduh!');
    } catch (error) {
      console.error('Download error:', error);
      alert('Error: ' + error.message);
    }
  }

  async function downloadPDF(reportId, endpoint) {
    try {
      updateFilter();
      const queryParams = buildQueryParams();
      const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
      
      alert('Mengunduh laporan PDF...\nHarap tunggu sebentar.');
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Gagal mengunduh laporan');

      const blob = await response.blob();
      const fileName = `${reportId}-${new Date().toISOString().split('T')[0]}.pdf`;
      triggerDownload(blob, fileName);
      
      alert('Laporan PDF berhasil diunduh!');
    } catch (error) {
      console.error('Download error:', error);
      alert('Error: ' + error.message);
    }
  }

  async function showPreview(reportId, endpoint) {
    try {
      updateFilter();
      const queryParams = buildQueryParams();
      const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
      
      const data = await api()(url);
      state.previewData = {
        title: reportId.replace(/-/g, ' ').toUpperCase(),
        data: Array.isArray(data) ? data.slice(0, 10) : data // Preview first 10 items
      };
      render();
    } catch (error) {
      console.error('Preview error:', error);
      alert('Error: ' + error.message);
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
