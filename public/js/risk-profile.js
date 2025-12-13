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
      const params = new URLSearchParams();
      if (state.filters.rencana_strategis_id) params.append('rencana_strategis_id', state.filters.rencana_strategis_id);
      if (state.filters.unit_kerja_id) params.append('unit_kerja_id', state.filters.unit_kerja_id);
      if (state.filters.kategori_risiko_id) params.append('kategori_risiko_id', state.filters.kategori_risiko_id);
      if (state.filters.risk_level) params.append('risk_level', state.filters.risk_level);

      const data = await api()('/api/reports/risk-profile?' + params.toString());
      state.data = data || [];
      console.log('Risk profile loaded:', state.data.length, 'items');
    } catch (error) {
      console.error('Error fetching risk profile:', error);
      state.data = [];
    }
  }

  function render() {
    const container = document.getElementById('risk-profile-content');
    if (!container) return;

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
            <div class="col-md-8">
              <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h4 style="margin-bottom: 1rem;">Inherent Risk Matrix (5×5)</h4>
                <div style="position: relative; height: 500px;">
                  <canvas id="inherent-risk-matrix"></canvas>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              ${renderLegend()}
            </div>
          </div>
          <div style="margin-top: 2rem;">
            ${renderTable()}
          </div>
        </div>
      </div>
    `;

    renderChart();
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
    const stats = {
      total: state.data.length,
      extreme: state.data.filter(d => d.risk_level === 'EXTREME HIGH').length,
      high: state.data.filter(d => d.risk_level === 'HIGH RISK').length,
      medium: state.data.filter(d => d.risk_level === 'MEDIUM RISK').length,
      low: state.data.filter(d => d.risk_level === 'LOW RISK').length
    };

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
      <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); height: 500px; overflow-y: auto;">
        <h4 style="margin-bottom: 1rem;"><i class="fas fa-info-circle"></i> Legend</h4>
        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; margin-bottom: 0.75rem;">
            <div style="width: 20px; height: 20px; background: #F44336; border-radius: 4px; margin-right: 0.75rem;"></div>
            <div>
              <strong>Extreme High</strong><br>
              <small style="color: #666;">Value ≥ 16</small>
            </div>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 0.75rem;">
            <div style="width: 20px; height: 20px; background: #FF9800; border-radius: 4px; margin-right: 0.75rem;"></div>
            <div>
              <strong>High Risk</strong><br>
              <small style="color: #666;">10 ≤ Value < 16</small>
            </div>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 0.75rem;">
            <div style="width: 20px; height: 20px; background: #FFC107; border-radius: 4px; margin-right: 0.75rem;"></div>
            <div>
              <strong>Medium Risk</strong><br>
              <small style="color: #666;">5 ≤ Value < 10</small>
            </div>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 0.75rem;">
            <div style="width: 20px; height: 20px; background: #4CAF50; border-radius: 4px; margin-right: 0.75rem;"></div>
            <div>
              <strong>Low Risk</strong><br>
              <small style="color: #666;">Value < 5</small>
            </div>
          </div>
        </div>
        <hr>
        <h5 style="margin-top: 1rem;">Matrix Guide</h5>
        <p style="font-size: 0.875rem; color: #666; line-height: 1.6;">
          Matrix menampilkan posisi risiko berdasarkan probabilitas (vertikal) dan dampak (horizontal). 
          Semakin ke kanan atas, semakin tinggi risikonya.
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
                return `
                  <tr>
                    <td><strong>${risk.kode_risiko || '-'}</strong></td>
                    <td>${risk.master_work_units?.name || '-'}</td>
                    <td>${risk.master_risk_categories?.name || '-'}</td>
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
    if (!ctx) return;

    if (state.chart) {
      state.chart.destroy();
    }

    if (state.data.length === 0) {
      ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
      return;
    }

    // Create points for scatter chart
    const points = state.data.map(item => ({
      x: item.impact || 0,
      y: item.probability || 0,
      riskId: item.risk_inputs?.kode_risiko || 'N/A',
      value: item.risk_value || 0,
      level: item.risk_level || 'LOW RISK',
      color: getRiskColor(item.risk_level)
    }));

    state.chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Inherent Risk',
          data: points,
          backgroundColor: points.map(p => p.color),
          borderColor: '#333',
          borderWidth: 2,
          pointRadius: 12,
          pointHoverRadius: 15
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
            { xMin: 4, xMax: 5, yMin: 4, yMax: 5, color: 'rgba(244, 67, 54, 0.2)' },
            { xMin: 3, xMax: 4, yMin: 5, yMax: 5, color: 'rgba(244, 67, 54, 0.2)' },
            { xMin: 5, xMax: 5, yMin: 3, yMax: 4, color: 'rgba(244, 67, 54, 0.2)' },
            { xMin: 4, xMax: 5, yMin: 3, yMax: 4, color: 'rgba(244, 67, 54, 0.2)' },
            
            // High Risk (orange)
            { xMin: 3, xMax: 4, yMin: 3, yMax: 4, color: 'rgba(255, 152, 0, 0.2)' },
            { xMin: 2, xMax: 3, yMin: 4, yMax: 5, color: 'rgba(255, 152, 0, 0.2)' },
            { xMin: 4, xMax: 5, yMin: 2, yMax: 3, color: 'rgba(255, 152, 0, 0.2)' },
            
            // Medium Risk (yellow)
            { xMin: 2, xMax: 3, yMin: 2, yMax: 3, color: 'rgba(255, 193, 7, 0.2)' },
            { xMin: 1, xMax: 2, yMin: 3, yMax: 5, color: 'rgba(255, 193, 7, 0.2)' },
            { xMin: 3, xMax: 5, yMin: 1, yMax: 2, color: 'rgba(255, 193, 7, 0.2)' },
            
            // Low Risk (green) - bottom left
            { xMin: 1, xMax: 2, yMin: 1, yMax: 3, color: 'rgba(76, 175, 80, 0.2)' },
            { xMin: 2, xMax: 3, yMin: 1, yMax: 2, color: 'rgba(76, 175, 80, 0.2)' }
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
  }

  function getRiskColor(level) {
    const colorMap = {
      'EXTREME HIGH': '#F44336',
      'HIGH RISK': '#FF9800',
      'MEDIUM RISK': '#FFC107',
      'LOW RISK': '#4CAF50'
    };
    return colorMap[level] || '#999';
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

  return {
    load,
    applyFilter,
    refresh
  };
})();

async function loadRiskProfile() {
  await RiskProfileModule.load();
}

window.RiskProfileModule = RiskProfileModule;
window.loadRiskProfile = loadRiskProfile;
