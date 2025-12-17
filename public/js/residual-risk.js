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

  // Fallback API call with manual token handling
  async function fallbackApiCall(endpoint, options = {}) {
    try {
      // Try to get token from localStorage first
      let token = localStorage.getItem('authToken');
      
      // If no token in localStorage, try Supabase session
      if (!token && window.supabaseClient) {
        try {
          const { data: { session } } = await window.supabaseClient.auth.getSession();
          token = session?.access_token;
          if (token) {
            localStorage.setItem('authToken', token);
          }
        } catch (e) {
          console.warn('Failed to get Supabase session:', e);
        }
      }

      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const config = {
        ...options,
        headers
      };

      if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(endpoint, config);

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch (e) {
          error = { error: response.statusText };
        }
        throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('Fallback API call error:', error);
      throw error;
    }
  }

  async function load() {
    console.log('ResidualRiskModule: Starting load...');
    try {
      // Check if API function is available
      const apiFunction = api();
      if (!apiFunction) {
        console.error('ResidualRiskModule: API function not available');
        showError('API function not available. Please refresh the page.');
        return;
      }

      console.log('ResidualRiskModule: API function available, fetching data...');
      await Promise.all([fetchMasterData(), fetchResidualRisk()]);
      render();
      console.log('ResidualRiskModule: Load completed successfully');
    } catch (error) {
      console.error('ResidualRiskModule: Load failed:', error);
      showError('Failed to load residual risk data: ' + error.message);
    }
  }

  function showError(message) {
    const container = document.getElementById('residual-risk-content');
    if (container) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #e74c3c;">
          <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
          <h3>Error Loading Data</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="ResidualRiskModule.load()" style="margin-top: 15px;">
            <i class="fas fa-sync"></i> Retry
          </button>
        </div>
      `;
    }
  }

  async function fetchMasterData() {
    try {
      console.log('ResidualRiskModule: Fetching master data...');
      
      const [rencana, units, categories] = await Promise.all([
        api()('/api/rencana-strategis'),
        api()('/api/master-data/work-units'),
        api()('/api/master-data/risk-categories')
      ]);
      
      state.rencanaStrategis = Array.isArray(rencana) ? rencana : [];
      state.unitKerja = Array.isArray(units) ? units : [];
      state.categories = Array.isArray(categories) ? categories : [];
      
      console.log('ResidualRiskModule: Master data loaded:', {
        rencanaStrategis: state.rencanaStrategis.length,
        unitKerja: state.unitKerja.length,
        categories: state.categories.length
      });
      
    } catch (error) {
      console.error('ResidualRiskModule: Error fetching master data:', error);
      // Don't throw error for master data, just use empty arrays
      state.rencanaStrategis = [];
      state.unitKerja = [];
      state.categories = [];
    }
  }

  async function fetchResidualRisk() {
    try {
      console.log('ResidualRiskModule: Fetching residual risk data...');
      
      const params = new URLSearchParams();
      if (state.filters.rencana_strategis_id) params.append('rencana_strategis_id', state.filters.rencana_strategis_id);
      if (state.filters.unit_kerja_id) params.append('unit_kerja_id', state.filters.unit_kerja_id);
      if (state.filters.kategori_risiko_id) params.append('kategori_risiko_id', state.filters.kategori_risiko_id);

      const endpoint = '/api/reports/residual-risk' + (params.toString() ? '?' + params.toString() : '');
      console.log('ResidualRiskModule: Calling endpoint:', endpoint);
      
      let data;
      try {
        // Try main API function first
        const apiFunction = api();
        if (apiFunction) {
          data = await apiFunction(endpoint);
        } else {
          throw new Error('Main API function not available');
        }
      } catch (mainError) {
        console.warn('ResidualRiskModule: Main API failed, trying fallback:', mainError.message);
        // Try fallback API call
        data = await fallbackApiCall(endpoint);
      }
      
      state.data = Array.isArray(data) ? data : [];
      
      console.log('ResidualRiskModule: Residual risk loaded:', state.data.length, 'items');
      
      if (state.data.length > 0) {
        console.log('ResidualRiskModule: Sample data structure:', {
          firstItem: state.data[0],
          hasRiskInputs: !!state.data[0]?.risk_inputs,
          hasInherentAnalysis: !!state.data[0]?.risk_inputs?.risk_inherent_analysis
        });
      }
      
    } catch (error) {
      console.error('ResidualRiskModule: Error fetching residual risk:', error);
      state.data = [];
      throw error; // Re-throw to be handled by load()
    }
  }

  function render() {
    const container = document.getElementById('residual-risk-content');
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-chart-pie"></i> Residual Risk Analysis</h3>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-success" onclick="ResidualRiskModule.refresh()">
              <i class="fas fa-sync"></i> Refresh Data
            </button>
            <div class="dropdown" style="position: relative;">
              <button class="btn btn-primary dropdown-toggle" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'block' ? 'none' : 'block'">
                <i class="fas fa-download"></i> Download
              </button>
              <div class="dropdown-menu" style="display: none; position: absolute; top: 100%; right: 0; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; min-width: 150px;">
                <a href="#" onclick="ResidualRiskModule.downloadExcel(); this.closest('.dropdown-menu').style.display='none'" style="display: block; padding: 8px 12px; text-decoration: none; color: #333; border-bottom: 1px solid #eee;">
                  <i class="fas fa-file-excel" style="color: #27ae60;"></i> Excel Report
                </a>
                <a href="#" onclick="ResidualRiskModule.downloadPDF(); this.closest('.dropdown-menu').style.display='none'" style="display: block; padding: 8px 12px; text-decoration: none; color: #333; border-bottom: 1px solid #eee;">
                  <i class="fas fa-file-pdf" style="color: #e74c3c;"></i> PDF Report
                </a>
                <a href="#" onclick="ResidualRiskModule.downloadChartImage('residual-risk-matrix', 'residual-matrix'); this.closest('.dropdown-menu').style.display='none'" style="display: block; padding: 8px 12px; text-decoration: none; color: #333; border-bottom: 1px solid #eee;">
                  <i class="fas fa-image" style="color: #3498db;"></i> Matrix Chart
                </a>
                <a href="#" onclick="ResidualRiskModule.downloadChartImage('comparison-chart', 'comparison-chart'); this.closest('.dropdown-menu').style.display='none'" style="display: block; padding: 8px 12px; text-decoration: none; color: #333; border-bottom: 1px solid #eee;">
                  <i class="fas fa-chart-bar" style="color: #9b59b6;"></i> Comparison Chart
                </a>
                <a href="#" onclick="ResidualRiskModule.printReport(); this.closest('.dropdown-menu').style.display='none'" style="display: block; padding: 8px 12px; text-decoration: none; color: #333;">
                  <i class="fas fa-print" style="color: #34495e;"></i> Print Report
                </a>
              </div>
            </div>
          </div>
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

    // Wait for Chart.js and DOM to be ready
    if (typeof Chart !== 'undefined') {
      setTimeout(() => renderCharts(), 100);
    } else {
      // Wait for Chart.js to load
      const checkChart = setInterval(() => {
        if (typeof Chart !== 'undefined') {
          clearInterval(checkChart);
          setTimeout(() => renderCharts(), 100);
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
    if (state.data.length === 0) {
      return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 8px; color: white;">
            <div style="font-size: 2rem; font-weight: bold;">0</div>
            <div style="font-size: 0.875rem; opacity: 0.9;">Total Residual Risk</div>
          </div>
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 1.5rem; border-radius: 8px; color: white;">
            <div style="font-size: 2rem; font-weight: bold;">0.00</div>
            <div style="font-size: 0.875rem; opacity: 0.9;">Avg Inherent Value</div>
          </div>
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 1.5rem; border-radius: 8px; color: white;">
            <div style="font-size: 2rem; font-weight: bold;">0.00</div>
            <div style="font-size: 0.875rem; opacity: 0.9;">Avg Residual Value</div>
          </div>
          <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 1.5rem; border-radius: 8px; color: white;">
            <div style="font-size: 2rem; font-weight: bold;">0%</div>
            <div style="font-size: 0.875rem; opacity: 0.9;">Risk Reduction</div>
          </div>
        </div>
      `;
    }

    // Calculate statistics with improved inherent data extraction
    let totalInherent = 0;
    let totalResidual = 0;
    let validInherentCount = 0;
    
    state.data.forEach(item => {
      const risk = item.risk_inputs || {};
      let inherent = {};
      
      // Try multiple ways to get inherent data
      if (risk.risk_inherent_analysis && Array.isArray(risk.risk_inherent_analysis) && risk.risk_inherent_analysis.length > 0) {
        inherent = risk.risk_inherent_analysis[0];
      } else if (risk.risk_inherent_analysis && !Array.isArray(risk.risk_inherent_analysis)) {
        inherent = risk.risk_inherent_analysis;
      }
      
      const inherentValue = parseFloat(inherent.risk_value) || 0;
      const residualValue = parseFloat(item.risk_value) || 0;
      
      if (inherentValue > 0) {
        totalInherent += inherentValue;
        validInherentCount++;
      }
      totalResidual += residualValue;
    });

    const stats = {
      total: state.data.length,
      avgInherent: validInherentCount > 0 ? totalInherent / validInherentCount : 0,
      avgResidual: state.data.length > 0 ? totalResidual / state.data.length : 0,
      reduction: 0
    };
    
    // Calculate reduction safely
    if (stats.avgInherent > 0) {
      stats.reduction = ((stats.avgInherent - stats.avgResidual) / stats.avgInherent * 100).toFixed(1);
    } else {
      stats.reduction = '0.0';
    }

    console.log('ResidualRiskModule: Calculated statistics:', stats);
    console.log('ResidualRiskModule: Valid inherent count:', validInherentCount);

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
          <table class="table residual-risk-table">
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
                console.log('Processing item:', item); // Debug log
                
                const risk = item.risk_inputs || {};
                console.log('Risk inputs:', risk); // Debug log
                
                // Try multiple ways to get inherent data
                let inherent = {};
                if (risk.risk_inherent_analysis && Array.isArray(risk.risk_inherent_analysis) && risk.risk_inherent_analysis.length > 0) {
                  inherent = risk.risk_inherent_analysis[0];
                } else if (risk.risk_inherent_analysis && !Array.isArray(risk.risk_inherent_analysis)) {
                  inherent = risk.risk_inherent_analysis;
                }
                
                console.log('Inherent data:', inherent); // Debug log
                
                // Get inherent risk value and level
                const inherentValue = inherent.risk_value || 0;
                const inherentLevel = inherent.risk_level || 'UNKNOWN';
                const residualValue = item.risk_value || 0;
                
                // Calculate reduction percentage
                let reduction = '-';
                if (inherentValue > 0 && residualValue >= 0) {
                  const reductionPercent = ((inherentValue - residualValue) / inherentValue * 100);
                  reduction = reductionPercent.toFixed(1) + '%';
                }
                
                console.log('Values:', { inherentValue, residualValue, reduction }); // Debug log
                
                return `
                  <tr>
                    <td><strong>${risk.kode_risiko || '-'}</strong></td>
                    <td>${risk.master_work_units?.name || '-'}</td>
                    <td><span class="badge-status ${getBadgeClassForRiskLevel(inherentLevel)}">${inherentValue || '-'}</span></td>
                    <td><span class="badge-status ${getBadgeClassForRiskLevel(item.risk_level)}">${residualValue || '-'}</span></td>
                    <td><strong style="color: #0d4f1c; font-weight: 700;">${reduction}</strong></td>
                    <td><span class="badge-status ${getBadgeClassForRiskLevel(item.risk_level)}">${item.risk_level || '-'}</span></td>
                    <td><span class="badge-status badge-secondary">${item.review_status || '-'}</span></td>
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
    if (!ctx || typeof Chart === 'undefined') {
      console.warn('Chart context not available or Chart.js not loaded');
      return;
    }

    if (state.data.length === 0) {
      const canvas = ctx.getContext('2d');
      if (canvas) {
        canvas.clearRect(0, 0, ctx.width, ctx.height);
      }
      return;
    }

    if (state.chart) {
      state.chart.destroy();
      state.chart = null;
    }

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
      console.warn('No valid data points for residual matrix chart');
      return;
    }

    try {
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
    } catch (error) {
      console.error('Error creating residual matrix chart:', error);
    }
  }

  function renderComparisonChart() {
    const ctx = document.getElementById('comparison-chart');
    if (!ctx || typeof Chart === 'undefined') {
      console.warn('Chart context not available or Chart.js not loaded');
      return;
    }

    if (state.data.length === 0) {
      const canvas = ctx.getContext('2d');
      if (canvas) {
        canvas.clearRect(0, 0, ctx.width, ctx.height);
      }
      return;
    }

    if (state.comparisonChart) {
      state.comparisonChart.destroy();
      state.comparisonChart = null;
    }

    const labels = [];
    const inherentValues = [];
    const residualValues = [];

    state.data.forEach(item => {
      const risk = item.risk_inputs || {};
      let inherent = {};
      
      // Try multiple ways to get inherent data
      if (risk.risk_inherent_analysis && Array.isArray(risk.risk_inherent_analysis) && risk.risk_inherent_analysis.length > 0) {
        inherent = risk.risk_inherent_analysis[0];
      } else if (risk.risk_inherent_analysis && !Array.isArray(risk.risk_inherent_analysis)) {
        inherent = risk.risk_inherent_analysis;
      }
      
      const inherentValue = parseFloat(inherent.risk_value) || 0;
      const residualValue = parseFloat(item.risk_value) || 0;
      
      labels.push(risk.kode_risiko || 'N/A');
      inherentValues.push(inherentValue);
      residualValues.push(residualValue);
    });

    if (labels.length === 0 || (inherentValues.every(v => v === 0) && residualValues.every(v => v === 0))) {
      console.warn('No valid data for comparison chart');
      return;
    }

    console.log('Chart data:', { labels, inherentValues, residualValues });

    try {
      state.comparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Inherent Risk',
            data: inherentValues,
            backgroundColor: 'rgba(244, 67, 54, 0.8)', // Red for inherent (higher risk)
            borderColor: 'rgba(244, 67, 54, 1)',
            borderWidth: 2
          },
          {
            label: 'Residual Risk',
            data: residualValues,
            backgroundColor: 'rgba(76, 175, 80, 0.8)', // Green for residual (lower risk)
            borderColor: 'rgba(76, 175, 80, 1)',
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
    } catch (error) {
      console.error('Error creating comparison chart:', error);
    }
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

  // New function for solid badge colors based on Excel reference
  function getBadgeClassForRiskLevel(level) {
    const levelUpper = (level || '').toUpperCase();
    
    if (levelUpper.includes('LOW') || levelUpper.includes('RENDAH')) {
      return 'badge-low-risk';
    } else if (levelUpper.includes('MEDIUM') || levelUpper.includes('SEDANG')) {
      return 'badge-medium-risk';
    } else if (levelUpper.includes('HIGH') && !levelUpper.includes('EXTREME')) {
      return 'badge-high-risk';
    } else if (levelUpper.includes('EXTREME') || levelUpper.includes('SANGAT')) {
      return 'badge-extreme-high';
    } else {
      return 'badge-secondary';
    }
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

  // Download functions
  async function downloadExcel() {
    try {
      const token = localStorage.getItem('authToken') || window.authService?.getToken?.();
      if (!token) {
        alert('Anda harus login terlebih dahulu');
        return;
      }

      const response = await fetch('/api/reports/residual-risk/excel', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `residual-risk-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert('File Excel berhasil diunduh');
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Error downloading Excel: ' + error.message);
    }
  }

  async function downloadPDF() {
    try {
      const token = localStorage.getItem('authToken') || window.authService?.getToken?.();
      if (!token) {
        alert('Anda harus login terlebih dahulu');
        return;
      }

      const response = await fetch('/api/reports/residual-risk/pdf', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `residual-risk-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert('File PDF berhasil diunduh');
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF: ' + error.message);
    }
  }

  function downloadChartImage(chartId, filename) {
    try {
      const canvas = document.getElementById(chartId);
      if (!canvas) {
        alert('Chart tidak ditemukan');
        return;
      }

      const link = document.createElement('a');
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
      alert('Gambar chart berhasil diunduh');
    } catch (error) {
      console.error('Error downloading chart:', error);
      alert('Error downloading chart: ' + error.message);
    }
  }

  function printReport() {
    const printContent = `
      <html>
        <head>
          <title>Residual Risk Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .stats { display: flex; justify-content: space-around; margin: 30px 0; }
            .stat-box { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
            .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .badge-aman { background-color: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; }
            .badge-normal { background-color: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; }
            .badge-hati-hati { background-color: #f8d7da; color: #721c24; padding: 4px 8px; border-radius: 4px; }
            .badge-kritis { background-color: #f5c6cb; color: #721c24; padding: 4px 8px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Residual Risk Analysis Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString('id-ID', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          ${document.getElementById('residual-risk-content')?.innerHTML || ''}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }

  return {
    load,
    applyFilter,
    refresh,
    downloadExcel,
    downloadPDF,
    downloadChartImage,
    printReport
  };
})();

async function loadResidualRisk() {
  await ResidualRiskModule.load();
}

window.ResidualRiskModule = ResidualRiskModule;
window.loadResidualRisk = loadResidualRisk;
