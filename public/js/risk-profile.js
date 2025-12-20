// Risk Profile Module - Auto-generate from Risk Inputs
const RiskProfileModule = (() => {
  const state = {
    data: [],
    rencanaStrategis: [],
    unitKerja: [],
    categories: [],
    filters: {
      rencana_strategis_id: '',
      unit_kerja_id: '',
      kategori_risiko_id: '',
      risk_level: ''
    },
    chart: null
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);

  async function load() {
    await Promise.all([fetchMasterData(), fetchRiskProfile()]);
    render();
  }

  async function fetchMasterData() {
    try {
      const [rencana, units, categories] = await Promise.all([
        api()('/api/rencana-strategis'),
        api()('/api/master-data/work-units'),
        api()('/api/master-data/risk-categories')
      ]);
      state.rencanaStrategis = rencana || [];
      state.unitKerja = units || [];
      state.categories = categories || [];
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  }

  async function fetchRiskProfile() {
    try {
      console.log('=== FETCHING RISK PROFILE ===');
      console.log('API function available:', typeof api());
      
      const params = new URLSearchParams();
      if (state.filters.rencana_strategis_id) params.append('rencana_strategis_id', state.filters.rencana_strategis_id);
      if (state.filters.unit_kerja_id) params.append('unit_kerja_id', state.filters.unit_kerja_id);
      if (state.filters.kategori_risiko_id) params.append('kategori_risiko_id', state.filters.kategori_risiko_id);
      if (state.filters.risk_level) params.append('risk_level', state.filters.risk_level);

      console.log('Calling API endpoint: /api/risk-profile-real');
      const data = await api()('/api/risk-profile-real');
      // console.log('Raw API response:', data);
      
      state.data = data || [];
      console.log('Risk profile loaded:', state.data.length, 'items');
      // console.log('Sample data:', state.data[0]);
      console.log('=== END FETCH ===');
    } catch (error) {
      console.error('Error fetching risk profile:', error);
      state.data = [];
    }
  }

  function render() {
    console.log('=== RENDERING RISK PROFILE ===');
    console.log('Data to render:', state.data.length, 'items');
    
    const container = document.getElementById('risk-profile-content');
    if (!container) {
      console.error('Container #risk-profile-content not found!');
      return;
    }
    console.log('Container found:', container);

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-chart-bar"></i> Risk Profile (Inherent Risk)</h3>
          <button class="btn btn-success" onclick="RiskProfileModule.refresh()">
            <i class="fas fa-sync"></i> Refresh Data
          </button>
        </div>
        <div class="card-body">
          ${renderFilters()}
          ${renderStatistics()}
          <div class="row" style="margin-top: 2rem;">
            <div class="col-md-12">
              <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 1.5rem;">
                  <h4 style="color: #2c3e50; font-weight: 600; margin: 0;">
                    <i class="fas fa-chart-scatter"></i> Inherent Risk Matrix (5×5) - ${state.data.length} Risiko
                  </h4>
                  <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-success" onclick="RiskProfileModule.downloadChart()" style="padding: 0.5rem 1rem;">
                      <i class="fas fa-download"></i> Unduh Grafik
                    </button>
                    <button class="btn btn-primary" onclick="RiskProfileModule.downloadReport()" style="padding: 0.5rem 1rem;">
                      <i class="fas fa-file-excel"></i> Unduh Laporan
                    </button>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-9">
                    <div style="position: relative; height: 700px; background: #f8f9fa; border-radius: 8px; padding: 1rem;">
                      <canvas id="inherent-risk-matrix"></canvas>
                    </div>
                  </div>
                  <div class="col-md-3">
                    ${renderLegend()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style="margin-top: 2rem;">
            ${renderTable()}
          </div>
        </div>
      </div>
    `;

    // Wait for Chart.js and DOM to be ready
    if (typeof Chart !== 'undefined') {
      setTimeout(() => renderChart(), 100);
    } else {
      // Wait for Chart.js to load
      const checkChart = setInterval(() => {
        if (typeof Chart !== 'undefined') {
          clearInterval(checkChart);
          setTimeout(() => renderChart(), 100);
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => clearInterval(checkChart), 5000);
    }
  }

  function renderFilters() {
    return `
      <div class="filter-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 0.875rem; font-weight: 600;">Rencana Strategis</label>
          <select class="form-control" id="filter-rencana" onchange="RiskProfileModule.applyFilter()">
            <option value="">Semua</option>
            ${state.rencanaStrategis.map(r => `<option value="${r.id}">${r.nama_rencana}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 0.875rem; font-weight: 600;">Unit Kerja</label>
          <select class="form-control" id="filter-unit" onchange="RiskProfileModule.applyFilter()">
            <option value="">Semua</option>
            ${state.unitKerja.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 0.875rem; font-weight: 600;">Kategori Risiko</label>
          <select class="form-control" id="filter-kategori" onchange="RiskProfileModule.applyFilter()">
            <option value="">Semua</option>
            ${state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 0.875rem; font-weight: 600;">Risk Level</label>
          <select class="form-control" id="filter-level" onchange="RiskProfileModule.applyFilter()">
            <option value="">Semua</option>
            <option value="EXTREME HIGH">Extreme High</option>
            <option value="HIGH RISK">High Risk</option>
            <option value="MEDIUM RISK">Medium Risk</option>
            <option value="LOW RISK">Low Risk</option>
          </select>
        </div>
      </div>
    `;
  }

  function renderStatistics() {
    console.log('=== RENDERING STATISTICS ===');
    // console.log('State data for stats:', state.data);
    
    const stats = {
      total: state.data.length,
      extreme: state.data.filter(d => d.risk_level === 'EXTREME HIGH').length,
      high: state.data.filter(d => d.risk_level === 'HIGH RISK').length,
      medium: state.data.filter(d => d.risk_level === 'MEDIUM RISK').length,
      low: state.data.filter(d => d.risk_level === 'LOW RISK').length
    };
    
    // console.log('Calculated stats:', stats);

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 8px; color: white;">
          <div style="font-size: 2rem; font-weight: bold;">${stats.total}</div>
          <div style="font-size: 0.875rem; opacity: 0.9;">Total Risiko</div>
        </div>
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 1.5rem; border-radius: 8px; color: white;">
          <div style="font-size: 2rem; font-weight: bold;">${stats.extreme}</div>
          <div style="font-size: 0.875rem; opacity: 0.9;">Extreme High</div>
        </div>
        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 1.5rem; border-radius: 8px; color: white;">
          <div style="font-size: 2rem; font-weight: bold;">${stats.high}</div>
          <div style="font-size: 0.875rem; opacity: 0.9;">High Risk</div>
        </div>
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 1.5rem; border-radius: 8px; color: white;">
          <div style="font-size: 2rem; font-weight: bold;">${stats.medium}</div>
          <div style="font-size: 0.875rem; opacity: 0.9;">Medium Risk</div>
        </div>
        <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 1.5rem; border-radius: 8px; color: white;">
          <div style="font-size: 2rem; font-weight: bold;">${stats.low}</div>
          <div style="font-size: 0.875rem; opacity: 0.9;">Low Risk</div>
        </div>
      </div>
    `;
  }

  function renderLegend() {
    return `
      <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); height: 700px; overflow-y: auto;">
        <h4 style="margin-bottom: 1.5rem; color: #2c3e50; font-weight: 600;"><i class="fas fa-info-circle"></i> Legend</h4>
        <div style="margin-bottom: 2rem;">
          <div style="display: flex; align-items: center; margin-bottom: 1rem; padding: 0.75rem; border-radius: 8px; background: rgba(231, 76, 60, 0.1);">
            <div style="width: 24px; height: 24px; background: #e74c3c; border-radius: 6px; margin-right: 1rem; box-shadow: 0 2px 4px rgba(231, 76, 60, 0.3);"></div>
            <div>
              <strong style="color: #e74c3c;">Extreme High</strong><br>
              <small style="color: #666;">Value ≥ 16</small>
            </div>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 1rem; padding: 0.75rem; border-radius: 8px; background: rgba(243, 156, 18, 0.1);">
            <div style="width: 24px; height: 24px; background: #f39c12; border-radius: 6px; margin-right: 1rem; box-shadow: 0 2px 4px rgba(243, 156, 18, 0.3);"></div>
            <div>
              <strong style="color: #f39c12;">High Risk</strong><br>
              <small style="color: #666;">10 ≤ Value < 16</small>
            </div>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 1rem; padding: 0.75rem; border-radius: 8px; background: rgba(52, 152, 219, 0.1);">
            <div style="width: 24px; height: 24px; background: #3498db; border-radius: 6px; margin-right: 1rem; box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);"></div>
            <div>
              <strong style="color: #3498db;">Medium Risk</strong><br>
              <small style="color: #666;">5 ≤ Value < 10</small>
            </div>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 1rem; padding: 0.75rem; border-radius: 8px; background: rgba(39, 174, 96, 0.1);">
            <div style="width: 24px; height: 24px; background: #27ae60; border-radius: 6px; margin-right: 1rem; box-shadow: 0 2px 4px rgba(39, 174, 96, 0.3);"></div>
            <div>
              <strong style="color: #27ae60;">Low Risk</strong><br>
              <small style="color: #666;">Value < 5</small>
            </div>
          </div>
        </div>
        <hr>
        <h5 style="margin-top: 1rem;">Statistik Data</h5>
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.875rem;">
            <div><strong>Total Risiko:</strong> ${state.data.length}</div>
            <div><strong>Extreme High:</strong> ${state.data.filter(d => d.risk_level === 'EXTREME HIGH').length}</div>
            <div><strong>High Risk:</strong> ${state.data.filter(d => d.risk_level === 'HIGH RISK').length}</div>
            <div><strong>Medium Risk:</strong> ${state.data.filter(d => d.risk_level === 'MEDIUM RISK').length}</div>
            <div><strong>Low Risk:</strong> ${state.data.filter(d => d.risk_level === 'LOW RISK').length}</div>
            <div><strong>Unit Kerja:</strong> ${[...new Set(state.data.map(d => d.risk_inputs?.master_work_units?.name).filter(Boolean))].length}</div>
          </div>
        </div>
        <h5>Matrix Guide</h5>
        <p style="font-size: 0.875rem; color: #666; line-height: 1.6;">
          Matrix menampilkan posisi risiko berdasarkan probabilitas (vertikal) dan dampak (horizontal). 
          Setiap titik mewakili satu risiko. Klik titik untuk melihat detail.
        </p>
      </div>
    `;
  }

  function renderTable() {
    if (state.data.length === 0) {
      return '<div style="text-align: center; padding: 2rem; color: #999;">Tidak ada data inherent risk. Silakan lakukan analisis risiko terlebih dahulu.</div>';
    }

    return `
      <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h4 style="margin-bottom: 1rem;"><i class="fas fa-table"></i> Detail Inherent Risk Analysis</h4>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Kode Risiko</th>
                <th>Unit Kerja</th>
                <th>Kategori</th>
                <th>Probabilitas</th>
                <th>Dampak</th>
                <th>Risk Value</th>
                <th>Risk Level</th>
                <th>Prob %</th>
                <th>Dampak Finansial</th>
              </tr>
            </thead>
            <tbody>
              ${state.data.map(item => {
                const risk = item.risk_inputs || {};
                const riskName = risk?.kode_risiko || '-';
                const unitName = risk?.master_work_units?.name || '-';
                const categoryName = risk?.master_risk_categories?.name || '-';
                return `
                  <tr>
                    <td><strong>${riskName}</strong></td>
                    <td>${unitName}</td>
                    <td>${categoryName}</td>
                    <td>${item.probability || '-'}</td>
                    <td>${item.impact || '-'}</td>
                    <td><strong>${item.risk_value || '-'}</strong></td>
                    <td><span class="badge-status badge-${getRiskLevelColor(item.risk_level)}">${item.risk_level || '-'}</span></td>
                    <td>${item.probability_percentage || '-'}</td>
                    <td>Rp ${formatNumber(item.financial_impact || 0)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderChart() {
    const ctx = document.getElementById('inherent-risk-matrix');
    if (!ctx || typeof Chart === 'undefined') {
      console.warn('Chart context not available or Chart.js not loaded');
      return;
    }

    if (state.chart) {
      state.chart.destroy();
      state.chart = null;
    }

    if (state.data.length === 0) {
      const canvas = ctx.getContext('2d');
      if (canvas) {
        canvas.clearRect(0, 0, ctx.width, ctx.height);
      }
      return;
    }

    // Create points for scatter chart
    const points = state.data
      .filter(item => item.risk_inputs) // Filter out items without risk_inputs
      .map(item => {
        const risk = item.risk_inputs || {};
        return {
          x: parseFloat(item.impact) || 0,
          y: parseFloat(item.probability) || 0,
          riskId: risk.kode_risiko || 'N/A',
          value: parseFloat(item.risk_value) || 0,
          level: item.risk_level || 'LOW RISK',
          color: getRiskColor(item.risk_level)
        };
      })
      .filter(p => p.x > 0 && p.y > 0); // Filter out invalid points

    if (points.length === 0) {
      console.warn('No valid data points for chart');
      return;
    }

    try {
      state.chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Inherent Risk',
          data: points,
          backgroundColor: points.map(p => p.color),
          borderColor: '#333',
          borderWidth: 2,
          pointRadius: 8,
          pointHoverRadius: 12
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            min: 0.5,
            max: 5.5,
            ticks: {
              stepSize: 1,
              callback: function(value) {
                const labels = ['', '1-Ringan Sekali', '2-Ringan', '3-Sedang', '4-Berat', '5-Sangat Berat'];
                return labels[value] || value;
              }
            },
            title: {
              display: true,
              text: 'Dampak (Impact)',
              font: { size: 14, weight: 'bold' }
            },
            grid: {
              color: '#ddd',
              lineWidth: 1
            }
          },
          y: {
            min: 0.5,
            max: 5.5,
            ticks: {
              stepSize: 1,
              callback: function(value) {
                const labels = ['', '1-Sangat Kecil', '2-Kecil', '3-Sedang', '4-Besar', '5-Sangat Besar'];
                return labels[value] || value;
              }
            },
            title: {
              display: true,
              text: 'Probabilitas (Probability)',
              font: { size: 14, weight: 'bold' }
            },
            grid: {
              color: '#ddd',
              lineWidth: 1
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const point = context.raw;
                return [
                  `Kode: ${point.riskId}`,
                  `Probability: ${point.y}`,
                  `Impact: ${point.x}`,
                  `Risk Value: ${point.value}`,
                  `Level: ${point.level}`
                ];
              }
            },
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#333',
            borderWidth: 1,
            padding: 10
          }
        }
      },
      plugins: [{
        id: 'matrixBackground',
        beforeDraw: (chart) => {
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;
          const xAxis = chart.scales.x;
          const yAxis = chart.scales.y;

          // Draw colored zones
          const zones = [
            // Extreme High (red) - top right
            { xMin: 4, xMax: 5, yMin: 4, yMax: 5, color: 'rgba(231, 76, 60, 0.25)' },
            { xMin: 3, xMax: 4, yMin: 5, yMax: 5, color: 'rgba(231, 76, 60, 0.25)' },
            { xMin: 5, xMax: 5, yMin: 3, yMax: 4, color: 'rgba(231, 76, 60, 0.25)' },
            { xMin: 4, xMax: 5, yMin: 3, yMax: 4, color: 'rgba(231, 76, 60, 0.25)' },
            
            // High Risk (orange)
            { xMin: 3, xMax: 4, yMin: 3, yMax: 4, color: 'rgba(243, 156, 18, 0.25)' },
            { xMin: 2, xMax: 3, yMin: 4, yMax: 5, color: 'rgba(243, 156, 18, 0.25)' },
            { xMin: 4, xMax: 5, yMin: 2, yMax: 3, color: 'rgba(243, 156, 18, 0.25)' },
            
            // Medium Risk (blue)
            { xMin: 2, xMax: 3, yMin: 2, yMax: 3, color: 'rgba(52, 152, 219, 0.25)' },
            { xMin: 1, xMax: 2, yMin: 3, yMax: 5, color: 'rgba(52, 152, 219, 0.25)' },
            { xMin: 3, xMax: 5, yMin: 1, yMax: 2, color: 'rgba(52, 152, 219, 0.25)' },
            
            // Low Risk (green) - bottom left
            { xMin: 1, xMax: 2, yMin: 1, yMax: 3, color: 'rgba(39, 174, 96, 0.25)' },
            { xMin: 2, xMax: 3, yMin: 1, yMax: 2, color: 'rgba(39, 174, 96, 0.25)' }
          ];

          zones.forEach(zone => {
            ctx.fillStyle = zone.color;
            const x1 = xAxis.getPixelForValue(zone.xMin);
            const x2 = xAxis.getPixelForValue(zone.xMax);
            const y1 = yAxis.getPixelForValue(zone.yMax);
            const y2 = yAxis.getPixelForValue(zone.yMin);
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
          });
        }
      }]
    });
    } catch (error) {
      console.error('Error creating risk profile chart:', error);
    }
  }

  function getRiskColor(level) {
    const colorMap = {
      'EXTREME HIGH': '#e74c3c',  // Solid red
      'HIGH RISK': '#f39c12',     // Solid orange
      'MEDIUM RISK': '#3498db',   // Solid blue
      'LOW RISK': '#27ae60'       // Solid green
    };
    return colorMap[level] || '#95a5a6';
  }

  function getRiskLevelColor(level) {
    const colorMap = {
      'EXTREME HIGH': 'kritis',
      'HIGH RISK': 'hati-hati',
      'MEDIUM RISK': 'normal',
      'LOW RISK': 'aman'
    };
    return colorMap[level] || 'secondary';
  }

  function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
  }

  async function applyFilter() {
    state.filters.rencana_strategis_id = document.getElementById('filter-rencana')?.value || '';
    state.filters.unit_kerja_id = document.getElementById('filter-unit')?.value || '';
    state.filters.kategori_risiko_id = document.getElementById('filter-kategori')?.value || '';
    state.filters.risk_level = document.getElementById('filter-level')?.value || '';
    await fetchRiskProfile();
    render();
  }

  async function refresh() {
    await load();
    alert('Data risk profile berhasil di-refresh');
  }

  function downloadChart() {
    try {
      const canvas = document.getElementById('inherent-risk-matrix');
      if (!canvas) {
        alert('Grafik tidak ditemukan');
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.download = `risk-profile-matrix-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Chart downloaded successfully');
    } catch (error) {
      console.error('Error downloading chart:', error);
      alert('Gagal mengunduh grafik: ' + error.message);
    }
  }

  async function downloadReport() {
    try {
      if (state.data.length === 0) {
        alert('Tidak ada data untuk diunduh');
        return;
      }

      // Show loading
      const originalText = event.target.innerHTML;
      event.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunduh...';
      event.target.disabled = true;

      // Download from server endpoint
      const link = document.createElement('a');
      link.href = '/api/risk-profile-excel';
      link.download = `risk-profile-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Reset button
      setTimeout(() => {
        event.target.innerHTML = originalText;
        event.target.disabled = false;
      }, 2000);
      
      console.log('Report download initiated');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Gagal mengunduh laporan: ' + error.message);
      
      // Reset button on error
      event.target.innerHTML = '<i class="fas fa-file-excel"></i> Unduh Laporan';
      event.target.disabled = false;
    }
  }

  return {
    load,
    applyFilter,
    refresh,
    downloadChart,
    downloadReport
  };
})();

async function loadRiskProfile() {
  await RiskProfileModule.load();
}

window.RiskProfileModule = RiskProfileModule;
window.loadRiskProfile = loadRiskProfile;
