// Residual Risk Module - Auto-calculate and compare with Inherent Risk
const ResidualRiskModule = (() => {
  const state = {
    data: [],
    rencanaStrategis: [],
    unitKerja: [],
    categories: [],
    filters: {
      rencana_strategis_id: '',
      unit_kerja_id: '',
      kategori_risiko_id: ''
    },
    chart: null,
    comparisonChart: null
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);

  async function load() {
    await Promise.all([fetchMasterData(), fetchResidualRisk()]);
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

  async function fetchResidualRisk() {
    try {
      const params = new URLSearchParams();
      if (state.filters.rencana_strategis_id) params.append('rencana_strategis_id', state.filters.rencana_strategis_id);
      if (state.filters.unit_kerja_id) params.append('unit_kerja_id', state.filters.unit_kerja_id);
      if (state.filters.kategori_risiko_id) params.append('kategori_risiko_id', state.filters.kategori_risiko_id);

      const data = await api()('/api/reports/residual-risk?' + params.toString());
      state.data = data || [];
      console.log('Residual risk loaded:', state.data.length, 'items');
    } catch (error) {
      console.error('Error fetching residual risk:', error);
      state.data = [];
    }
  }

  function render() {
    const container = document.getElementById('residual-risk-content');
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-chart-pie"></i> Residual Risk Analysis</h3>
          <button class="btn btn-success" onclick="ResidualRiskModule.refresh()">
            <i class="fas fa-sync"></i> Refresh Data
          </button>
        </div>
        <div class="card-body">
          ${renderFilters()}
          ${renderStatistics()}
          
          <div class="row" style="margin-top: 2rem;">
            <div class="col-md-6">
              <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h4 style="margin-bottom: 1rem;">Residual Risk Matrix</h4>
                <div style="position: relative; height: 400px;">
                  <canvas id="residual-risk-matrix"></canvas>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h4 style="margin-bottom: 1rem;">Inherent vs Residual Comparison</h4>
                <div style="position: relative; height: 400px;">
                  <canvas id="comparison-chart"></canvas>
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

    renderCharts();
  }

  function renderFilters() {
    return `
      <div class="filter-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 0.875rem; font-weight: 600;">Rencana Strategis</label>
          <select class="form-control" id="filter-residual-rencana" onchange="ResidualRiskModule.applyFilter()">
            <option value="">Semua</option>
            ${state.rencanaStrategis.map(r => `<option value="${r.id}">${r.nama_rencana}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 0.875rem; font-weight: 600;">Unit Kerja</label>
          <select class="form-control" id="filter-residual-unit" onchange="ResidualRiskModule.applyFilter()">
            <option value="">Semua</option>
            ${state.unitKerja.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 0.875rem; font-weight: 600;">Kategori Risiko</label>
          <select class="form-control" id="filter-residual-kategori" onchange="ResidualRiskModule.applyFilter()">
            <option value="">Semua</option>
            ${state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
      </div>
    `;
  }

  function renderStatistics() {
    const stats = {
      total: state.data.length,
      avgInherent: state.data.reduce((sum, d) => sum + (d.risk_inputs?.risk_inherent_analysis?.[0]?.risk_value || 0), 0) / (state.data.length || 1),
      avgResidual: state.data.reduce((sum, d) => sum + (d.risk_value || 0), 0) / (state.data.length || 1),
      reduction: 0
    };
    stats.reduction = ((stats.avgInherent - stats.avgResidual) / stats.avgInherent * 100).toFixed(1);

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 8px; color: white;">
          <div style="font-size: 2rem; font-weight: bold;">${stats.total}</div>
          <div style="font-size: 0.875rem; opacity: 0.9;">Total Residual Risk</div>
        </div>
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 1.5rem; border-radius: 8px; color: white;">
          <div style="font-size: 2rem; font-weight: bold;">${stats.avgInherent.toFixed(2)}</div>
          <div style="font-size: 0.875rem; opacity: 0.9;">Avg Inherent Value</div>
        </div>
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 1.5rem; border-radius: 8px; color: white;">
          <div style="font-size: 2rem; font-weight: bold;">${stats.avgResidual.toFixed(2)}</div>
          <div style="font-size: 0.875rem; opacity: 0.9;">Avg Residual Value</div>
        </div>
        <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 1.5rem; border-radius: 8px; color: white;">
          <div style="font-size: 2rem; font-weight: bold;">${stats.reduction}%</div>
          <div style="font-size: 0.875rem; opacity: 0.9;">Risk Reduction</div>
        </div>
      </div>
    `;
  }

  function renderTable() {
    if (state.data.length === 0) {
      return '<div style="text-align: center; padding: 2rem; color: #999;">Tidak ada data residual risk. Silakan lakukan analisis residual risk terlebih dahulu.</div>';
    }

    return `
      <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h4 style="margin-bottom: 1rem;"><i class="fas fa-table"></i> Detail Residual Risk Analysis</h4>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Kode Risiko</th>
                <th>Unit Kerja</th>
                <th>Inherent</th>
                <th>Residual</th>
                <th>Reduction</th>
                <th>Level</th>
                <th>Review Status</th>
                <th>Next Review</th>
              </tr>
            </thead>
            <tbody>
              ${state.data.map(item => {
                const risk = item.risk_inputs || {};
                const inherent = risk.risk_inherent_analysis?.[0] || {};
                const reduction = inherent.risk_value && item.risk_value 
                  ? ((inherent.risk_value - item.risk_value) / inherent.risk_value * 100).toFixed(1) + '%'
                  : '-';
                
                return `
                  <tr>
                    <td><strong>${risk.kode_risiko || '-'}</strong></td>
                    <td>${risk.master_work_units?.name || '-'}</td>
                    <td><span class="badge-status badge-hati-hati">${inherent.risk_value || '-'}</span></td>
                    <td><span class="badge-status badge-${getRiskLevelColor(item.risk_level)}">${item.risk_value || '-'}</span></td>
                    <td><strong style="color: #27ae60;">${reduction}</strong></td>
                    <td><span class="badge-status badge-${getRiskLevelColor(item.risk_level)}">${item.risk_level || '-'}</span></td>
                    <td>${item.review_status || '-'}</td>
                    <td>${item.next_review_date || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderCharts() {
    renderResidualMatrix();
    renderComparisonChart();
  }

  function renderResidualMatrix() {
    const ctx = document.getElementById('residual-risk-matrix');
    if (!ctx || state.data.length === 0) return;

    if (state.chart) {
      state.chart.destroy();
    }

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
          label: 'Residual Risk',
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
            min: 0.5,
            max: 5.5,
            ticks: { stepSize: 1 },
            title: { display: true, text: 'Dampak', font: { weight: 'bold' } }
          },
          y: {
            min: 0.5,
            max: 5.5,
            ticks: { stepSize: 1 },
            title: { display: true, text: 'Probabilitas', font: { weight: 'bold' } }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const point = context.raw;
                return [
                  `Kode: ${point.riskId}`,
                  `Risk Value: ${point.value}`,
                  `Level: ${point.level}`
                ];
              }
            }
          }
        }
      }
    });
  }

  function renderComparisonChart() {
    const ctx = document.getElementById('comparison-chart');
    if (!ctx || state.data.length === 0) return;

    if (state.comparisonChart) {
      state.comparisonChart.destroy();
    }

    const labels = state.data.map(item => item.risk_inputs?.kode_risiko || 'N/A');
    const inherentValues = state.data.map(item => item.risk_inputs?.risk_inherent_analysis?.[0]?.risk_value || 0);
    const residualValues = state.data.map(item => item.risk_value || 0);

    state.comparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Inherent Risk',
            data: inherentValues,
            backgroundColor: 'rgba(231, 76, 60, 0.7)',
            borderColor: 'rgba(231, 76, 60, 1)',
            borderWidth: 2
          },
          {
            label: 'Residual Risk',
            data: residualValues,
            backgroundColor: 'rgba(52, 152, 219, 0.7)',
            borderColor: 'rgba(52, 152, 219, 1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Risk Value',
              font: { weight: 'bold' }
            }
          },
          x: {
            title: {
              display: true,
              text: 'Kode Risiko',
              font: { weight: 'bold' }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const index = context.dataIndex;
                const inherent = inherentValues[index];
                const residual = residualValues[index];
                const reduction = inherent > 0 ? ((inherent - residual) / inherent * 100).toFixed(1) : 0;
                return `Reduction: ${reduction}%`;
              }
            }
          }
        }
      }
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

  async function applyFilter() {
    state.filters.rencana_strategis_id = document.getElementById('filter-residual-rencana')?.value || '';
    state.filters.unit_kerja_id = document.getElementById('filter-residual-unit')?.value || '';
    state.filters.kategori_risiko_id = document.getElementById('filter-residual-kategori')?.value || '';
    await fetchResidualRisk();
    render();
  }

  async function refresh() {
    await load();
    alert('Data residual risk berhasil di-refresh');
  }

  return {
    load,
    applyFilter,
    refresh
  };
})();

async function loadResidualRisk() {
  await ResidualRiskModule.load();
}

window.ResidualRiskModule = ResidualRiskModule;
window.loadResidualRisk = loadResidualRisk;
