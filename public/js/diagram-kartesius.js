// Diagram Kartesius Module
const DiagramKartesiusModule = (() => {
  const state = {
    data: [],
    rencanaStrategis: [],
    unitKerja: [],
    filters: {
      rencana_strategis_id: '',
      unit_kerja_id: '',
      tahun: new Date().getFullYear()
    },
    chart: null
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);

  async function load() {
    await fetchInitialData();
    render();
  }

  async function fetchInitialData() {
    try {
      const [diagram, rencana, unitKerja] = await Promise.all([
        api()('/api/diagram-kartesius?' + new URLSearchParams(state.filters)),
        api()('/api/rencana-strategis'),
        api()('/api/master-data/work-units')
      ]);
      state.data = diagram || [];
      state.rencanaStrategis = rencana || [];
      state.unitKerja = unitKerja || [];
    } catch (error) {
      console.error('Error fetching data:', error);
      state.data = [];
      state.rencanaStrategis = [];
      state.unitKerja = [];
    }
  }

  function render() {
    const container = document.getElementById('diagram-kartesius-content');
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Diagram Kartesius SWOT</h3>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-success" onclick="DiagramKartesiusModule.calculate()">
              <i class="fas fa-calculator"></i> Hitung Diagram
            </button>
            ${state.data.length > 0 ? `
              <button class="btn btn-primary" onclick="DiagramKartesiusModule.downloadChart()">
                <i class="fas fa-download"></i> Unduh Diagram
              </button>
            ` : ''}
          </div>
        </div>
        <div class="card-body">
          <div class="filter-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div class="form-group">
              <label>Rencana Strategis</label>
              <select class="form-control" id="filter-rencana-strategis" onchange="DiagramKartesiusModule.applyFilter()">
                <option value="">Semua</option>
                ${state.rencanaStrategis.map(r => `<option value="${r.id}" ${state.filters.rencana_strategis_id === r.id ? 'selected' : ''}>${r.nama_rencana}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Unit Kerja / Level <span class="text-danger">*</span></label>
              <select class="form-control" id="filter-unit-kerja" onchange="DiagramKartesiusModule.applyFilter()">
                <option value="">-- Pilih Unit Kerja atau Level --</option>
                <option value="RUMAH_SAKIT" ${state.filters.unit_kerja_id === 'RUMAH_SAKIT' ? 'selected' : ''}>🏥 Rumah Sakit (Agregasi Auto)</option>
                ${state.unitKerja.map(u => `<option value="${u.id}" ${state.filters.unit_kerja_id === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
              </select>
              <small class="form-text text-muted">
                <strong>Wajib pilih:</strong> "Rumah Sakit" untuk agregasi otomatis nilai tertinggi dari semua unit, atau pilih unit kerja spesifik
              </small>
            </div>
            <div class="form-group">
              <label>Tahun</label>
              <input type="number" class="form-control" id="filter-tahun" value="${state.filters.tahun}" onchange="DiagramKartesiusModule.applyFilter()">
            </div>
          </div>
          ${state.data.length > 0 ? `
            <div class="alert alert-info" style="margin-bottom: 1rem;">
              <h5><i class="fas fa-info-circle"></i> Interpretasi Kuadran SWOT</h5>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
                <div><span class="badge-status badge-aman">KUADRAN I</span> <strong>Growth:</strong> Kekuatan + Peluang</div>
                <div><span class="badge-status badge-normal">KUADRAN II</span> <strong>Stability:</strong> Kelemahan + Peluang</div>
                <div><span class="badge-status badge-kritis">KUADRAN III</span> <strong>Survival:</strong> Kelemahan + Ancaman</div>
                <div><span class="badge-status badge-hati-hati">KUADRAN IV</span> <strong>Diversification:</strong> Kekuatan + Ancaman</div>
              </div>
            </div>
          ` : ''}
          <div id="diagram-chart-container" style="position: relative; height: 500px; margin-bottom: 2rem;">
            <canvas id="diagram-chart"></canvas>
          </div>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Tahun</th>
                  <th>Unit Kerja</th>
                  <th>X-Axis (Strength - Weakness)</th>
                  <th>Y-Axis (Opportunity - Threat)</th>
                  <th>Kuadran</th>
                  <th>Strategi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.length === 0 ? '<tr><td colspan="7" class="text-center">Tidak ada data. Klik "Hitung Diagram" untuk generate dari analisis SWOT.</td></tr>' : ''}
                ${state.data.map(item => `
                  <tr>
                    <td>${item.tahun}</td>
                    <td>${item.unit_kerja_name || 'Rumah Sakit (Agregasi)'}</td>
                    <td>${parseFloat(item.x_axis).toFixed(2)}</td>
                    <td>${parseFloat(item.y_axis).toFixed(2)}</td>
                    <td><span class="badge-status badge-${getKuadranColor(item.kuadran)}">KUADRAN ${item.kuadran}</span></td>
                    <td><strong>${item.strategi}</strong></td>
                    <td>
                      <button class="btn btn-edit btn-sm" onclick="DiagramKartesiusModule.edit('${item.id}')">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-delete btn-sm" onclick="DiagramKartesiusModule.delete('${item.id}')">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    if (state.data.length > 0) {
      renderChart();
    }
  }

  function renderChart() {
    const ctx = document.getElementById('diagram-chart');
    if (!ctx) return;

    if (state.chart) {
      state.chart.destroy();
    }

    // Calculate axis range based on data
    const xValues = state.data.map(d => parseFloat(d.x_axis));
    const yValues = state.data.map(d => parseFloat(d.y_axis));
    const maxX = Math.max(Math.abs(Math.max(...xValues)), Math.abs(Math.min(...xValues)), 10);
    const maxY = Math.max(Math.abs(Math.max(...yValues)), Math.abs(Math.min(...yValues)), 10);
    const range = Math.max(maxX, maxY) * 1.2;

    // Prepare datasets with quadrant backgrounds and lines
    const datasets = [
      // Quadrant I Background (top-right) - Growth
      {
        label: 'Kuadran I - Growth',
        data: [
          { x: 0, y: 0 },
          { x: range, y: 0 },
          { x: range, y: range },
          { x: 0, y: range }
        ],
        backgroundColor: 'rgba(39, 174, 96, 0.1)', // Green transparent
        borderColor: 'rgba(39, 174, 96, 0.3)',
        borderWidth: 1,
        fill: true,
        pointRadius: 0,
        showLine: true,
        tension: 0
      },
      // Quadrant II Background (top-left) - Stability  
      {
        label: 'Kuadran II - Stability',
        data: [
          { x: -range, y: 0 },
          { x: 0, y: 0 },
          { x: 0, y: range },
          { x: -range, y: range }
        ],
        backgroundColor: 'rgba(52, 152, 219, 0.1)', // Blue transparent
        borderColor: 'rgba(52, 152, 219, 0.3)',
        borderWidth: 1,
        fill: true,
        pointRadius: 0,
        showLine: true,
        tension: 0
      },
      // Quadrant III Background (bottom-left) - Survival
      {
        label: 'Kuadran III - Survival',
        data: [
          { x: -range, y: -range },
          { x: 0, y: -range },
          { x: 0, y: 0 },
          { x: -range, y: 0 }
        ],
        backgroundColor: 'rgba(231, 76, 60, 0.1)', // Red transparent
        borderColor: 'rgba(231, 76, 60, 0.3)',
        borderWidth: 1,
        fill: true,
        pointRadius: 0,
        showLine: true,
        tension: 0
      },
      // Quadrant IV Background (bottom-right) - Diversification
      {
        label: 'Kuadran IV - Diversification',
        data: [
          { x: 0, y: -range },
          { x: range, y: -range },
          { x: range, y: 0 },
          { x: 0, y: 0 }
        ],
        backgroundColor: 'rgba(243, 156, 18, 0.1)', // Orange transparent
        borderColor: 'rgba(243, 156, 18, 0.3)',
        borderWidth: 1,
        fill: true,
        pointRadius: 0,
        showLine: true,
        tension: 0
      },
      // Vertical line (x=0)
      {
        label: 'Garis Tengah',
        data: [{ x: 0, y: -range }, { x: 0, y: range }],
        type: 'line',
        borderColor: '#333',
        borderWidth: 3,
        pointRadius: 0,
        showLine: true,
        fill: false
      },
      // Horizontal line (y=0)
      {
        label: 'Garis Tengah',
        data: [{ x: -range, y: 0 }, { x: range, y: 0 }],
        type: 'line',
        borderColor: '#333',
        borderWidth: 3,
        pointRadius: 0,
        showLine: true,
        fill: false
      },
      // Data points
      ...state.data.map((item, index) => ({
        label: `${item.tahun} - ${item.unit_kerja_name || 'Agregasi'} (Kuadran ${item.kuadran})`,
        data: [{ x: parseFloat(item.x_axis), y: parseFloat(item.y_axis) }],
        backgroundColor: getKuadranColorHex(item.kuadran),
        borderColor: getKuadranColorHex(item.kuadran),
        pointRadius: 12,
        pointHoverRadius: 15,
        pointBorderWidth: 3,
        pointBorderColor: '#fff'
      }))
    ];

    state.chart = new Chart(ctx, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'point'
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Strength - Weakness →',
              font: { size: 16, weight: 'bold' },
              color: '#333'
            },
            min: -range,
            max: range,
            grid: {
              color: function(context) {
                return context.tick.value === 0 ? '#333' : '#e0e0e0';
              },
              lineWidth: function(context) {
                return context.tick.value === 0 ? 3 : 1;
              }
            },
            ticks: {
              font: { size: 12 },
              color: '#666'
            }
          },
          y: {
            title: {
              display: true,
              text: '↑ Opportunity - Threat',
              font: { size: 16, weight: 'bold' },
              color: '#333'
            },
            min: -range,
            max: range,
            grid: {
              color: function(context) {
                return context.tick.value === 0 ? '#333' : '#e0e0e0';
              },
              lineWidth: function(context) {
                return context.tick.value === 0 ? 3 : 1;
              }
            },
            ticks: {
              font: { size: 12 },
              color: '#666'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { size: 11 },
              filter: function(legendItem) {
                return !legendItem.text.includes('Garis Tengah');
              },
              generateLabels: function(chart) {
                const original = Chart.defaults.plugins.legend.labels.generateLabels;
                const labels = original.call(this, chart);
                
                // Group quadrant backgrounds and data points separately
                const quadrantLabels = labels.filter(label => label.text.includes('Kuadran') && !label.text.includes(' - '));
                const dataLabels = labels.filter(label => !label.text.includes('Kuadran') || label.text.includes(' - '));
                
                return [...quadrantLabels, ...dataLabels];
              }
            }
          },
          tooltip: {
            filter: function(tooltipItem) {
              // Only show tooltip for data points (not quadrant backgrounds or lines)
              return tooltipItem.datasetIndex >= 6;
            },
            callbacks: {
              label: function(context) {
                const item = state.data[context.datasetIndex - 6];
                return [
                  `Tahun: ${item.tahun}`,
                  `Unit: ${item.unit_kerja_name || 'Agregasi'}`,
                  `Posisi: (${parseFloat(item.x_axis).toFixed(1)}, ${parseFloat(item.y_axis).toFixed(1)})`,
                  `Kuadran: ${item.kuadran} - ${item.strategi}`
                ];
              }
            }
          }
        },
        // Add quadrant labels as annotations
        onHover: function(event, elements) {
          event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
      },
      plugins: [{
        id: 'quadrantLabels',
        afterDraw: function(chart) {
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;
          const xScale = chart.scales.x;
          const yScale = chart.scales.y;
          
          ctx.save();
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Quadrant I (top-right) - Growth
          ctx.fillStyle = 'rgba(39, 174, 96, 0.8)';
          const q1X = xScale.getPixelForValue(range * 0.5);
          const q1Y = yScale.getPixelForValue(range * 0.5);
          ctx.fillText('KUADRAN I', q1X, q1Y - 10);
          ctx.font = '12px Arial';
          ctx.fillText('GROWTH', q1X, q1Y + 10);
          
          // Quadrant II (top-left) - Stability
          ctx.fillStyle = 'rgba(52, 152, 219, 0.8)';
          const q2X = xScale.getPixelForValue(-range * 0.5);
          const q2Y = yScale.getPixelForValue(range * 0.5);
          ctx.font = 'bold 14px Arial';
          ctx.fillText('KUADRAN II', q2X, q2Y - 10);
          ctx.font = '12px Arial';
          ctx.fillText('STABILITY', q2X, q2Y + 10);
          
          // Quadrant III (bottom-left) - Survival
          ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
          const q3X = xScale.getPixelForValue(-range * 0.5);
          const q3Y = yScale.getPixelForValue(-range * 0.5);
          ctx.font = 'bold 14px Arial';
          ctx.fillText('KUADRAN III', q3X, q3Y - 10);
          ctx.font = '12px Arial';
          ctx.fillText('SURVIVAL', q3X, q3Y + 10);
          
          // Quadrant IV (bottom-right) - Diversification
          ctx.fillStyle = 'rgba(243, 156, 18, 0.8)';
          const q4X = xScale.getPixelForValue(range * 0.5);
          const q4Y = yScale.getPixelForValue(-range * 0.5);
          ctx.font = 'bold 14px Arial';
          ctx.fillText('KUADRAN IV', q4X, q4Y - 10);
          ctx.font = '12px Arial';
          ctx.fillText('DIVERSIFICATION', q4X, q4Y + 10);
          
          ctx.restore();
        }
      }]
    });
  }

  function getKuadranColor(kuadran) {
    const colors = {
      'I': 'aman',
      'II': 'normal',
      'III': 'kritis',
      'IV': 'hati-hati'
    };
    return colors[kuadran] || 'secondary';
  }

  function getKuadranColorHex(kuadran) {
    const colors = {
      'I': '#27ae60',   // Green - Growth
      'II': '#3498db',  // Blue - Stability  
      'III': '#e74c3c', // Red - Survival
      'IV': '#f39c12'   // Orange - Diversification
    };
    return colors[kuadran] || '#95a5a6';
  }

  function getKuadranInfo(kuadran) {
    const info = {
      'I': { name: 'Growth', color: '#27ae60', description: 'Kekuatan + Peluang' },
      'II': { name: 'Stability', color: '#3498db', description: 'Kelemahan + Peluang' },
      'III': { name: 'Survival', color: '#e74c3c', description: 'Kelemahan + Ancaman' },
      'IV': { name: 'Diversification', color: '#f39c12', description: 'Kekuatan + Ancaman' }
    };
    return info[kuadran] || { name: 'Unknown', color: '#95a5a6', description: 'Tidak diketahui' };
  }

  async function applyFilter() {
    state.filters.rencana_strategis_id = document.getElementById('filter-rencana-strategis')?.value || '';
    state.filters.unit_kerja_id = document.getElementById('filter-unit-kerja')?.value || '';
    state.filters.tahun = parseInt(document.getElementById('filter-tahun')?.value || new Date().getFullYear());
    await fetchInitialData();
    render();
  }

  async function calculate() {
    const rencana_strategis_id = document.getElementById('filter-rencana-strategis')?.value || '';
    const unit_kerja_id = document.getElementById('filter-unit-kerja')?.value || '';
    const tahun = parseInt(document.getElementById('filter-tahun')?.value || new Date().getFullYear());

    // Validasi input
    if (!unit_kerja_id) {
      alert('Silakan pilih Unit Kerja atau Level terlebih dahulu');
      return;
    }

    const levelText = unit_kerja_id === 'RUMAH_SAKIT' ? 'level Rumah Sakit (agregasi otomatis)' : 
                     unit_kerja_id ? 'unit kerja terpilih' : 'semua unit kerja';
    
    // Check if data already exists
    const existingData = state.data.find(d => 
      d.tahun === tahun && 
      (d.unit_kerja_id === unit_kerja_id || (unit_kerja_id === 'RUMAH_SAKIT' && d.unit_kerja_name === 'Rumah Sakit (Agregasi)'))
    );

    const action = existingData ? 'update' : 'hitung';
    const message = existingData ? 
      `Data diagram untuk ${levelText} tahun ${tahun} sudah ada. Apakah Anda ingin menghitung ulang (update)?` :
      `Hitung diagram kartesius untuk tahun ${tahun} pada ${levelText}?`;
    
    if (!confirm(message)) return;

    try {
      // Show loading
      const button = event.target;
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghitung...';
      button.disabled = true;

      await api()('/api/diagram-kartesius/calculate', {
        method: 'POST',
        body: {
          rencana_strategis_id: rencana_strategis_id || null,
          unit_kerja_id: unit_kerja_id || null,
          tahun
        }
      });
      
      await load();
      
      const successMessage = existingData ? 'Diagram berhasil diperbarui' : 'Diagram berhasil dihitung';
      alert(successMessage);
      
      // Restore button
      button.innerHTML = originalText;
      button.disabled = false;
    } catch (error) {
      // Restore button on error
      const button = event.target;
      button.innerHTML = '<i class="fas fa-calculator"></i> Hitung Diagram';
      button.disabled = false;
      
      console.error('Calculate error:', error);
      alert('Error: ' + error.message);
    }
  }

  function edit(id) {
    const item = state.data.find(d => d.id === id);
    if (!item) return;

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">Edit Diagram Kartesius</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form onsubmit="DiagramKartesiusModule.saveManual(event, '${id}')">
          <div class="form-group">
            <label class="form-label">X-Axis</label>
            <input type="number" class="form-control" id="dk-x-axis" value="${item.x_axis}" step="0.1">
          </div>
          <div class="form-group">
            <label class="form-label">Y-Axis</label>
            <input type="number" class="form-control" id="dk-y-axis" value="${item.y_axis}" step="0.1">
          </div>
          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async function saveManual(e, id) {
    e.preventDefault();
    try {
      const data = {
        x_axis: parseFloat(document.getElementById('dk-x-axis').value),
        y_axis: parseFloat(document.getElementById('dk-y-axis').value)
      };

      await api()(`/api/diagram-kartesius/${id}`, { method: 'PUT', body: data });
      document.querySelector('.modal').remove();
      await load();
      alert('Data berhasil diupdate');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  async function deleteItem(id) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await api()(`/api/diagram-kartesius/${id}`, { method: 'DELETE' });
      await load();
      alert('Data berhasil dihapus');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  function downloadChart() {
    if (!state.chart) {
      alert('Tidak ada diagram untuk diunduh');
      return;
    }

    try {
      // Create download modal
      const modal = document.createElement('div');
      modal.className = 'modal active';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
          <div class="modal-header">
            <h3 class="modal-title">Unduh Diagram Kartesius</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Format File</label>
              <select class="form-control" id="download-format">
                <option value="png">PNG (Gambar)</option>
                <option value="jpg">JPG (Gambar)</option>
                <option value="pdf">PDF (Dokumen)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Nama File</label>
              <input type="text" class="form-control" id="download-filename" 
                     value="diagram-kartesius-${state.filters.tahun}" 
                     placeholder="Nama file tanpa ekstensi">
            </div>
            <div class="form-group">
              <label class="form-label">Kualitas</label>
              <select class="form-control" id="download-quality">
                <option value="1">Tinggi (1x)</option>
                <option value="2" selected>Sangat Tinggi (2x)</option>
                <option value="3">Ultra Tinggi (3x)</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
            <button type="button" class="btn btn-primary" onclick="DiagramKartesiusModule.executeDownload()">
              <i class="fas fa-download"></i> Unduh
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } catch (error) {
      console.error('Download error:', error);
      alert('Error: ' + error.message);
    }
  }

  function executeDownload() {
    try {
      const format = document.getElementById('download-format').value;
      const filename = document.getElementById('download-filename').value || 'diagram-kartesius';
      const quality = parseFloat(document.getElementById('download-quality').value);

      if (format === 'pdf') {
        downloadAsPDF(filename, quality);
      } else {
        downloadAsImage(format, filename, quality);
      }

      document.querySelector('.modal').remove();
    } catch (error) {
      console.error('Execute download error:', error);
      alert('Error saat mengunduh: ' + error.message);
    }
  }

  function downloadAsImage(format, filename, quality) {
    const canvas = document.getElementById('diagram-chart');
    if (!canvas) return;

    // Create high-resolution canvas
    const originalCanvas = canvas;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Set high resolution
    const width = originalCanvas.width * quality;
    const height = originalCanvas.height * quality;
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    // Scale context for high resolution
    tempCtx.scale(quality, quality);
    tempCtx.drawImage(originalCanvas, 0, 0);

    // Convert to blob and download
    tempCanvas.toBlob(function(blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, `image/${format}`, 0.95);
  }

  function downloadAsPDF(filename, quality) {
    // Check if jsPDF is available
    if (typeof window.jsPDF === 'undefined') {
      // Load jsPDF dynamically
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = function() {
        generatePDF(filename, quality);
      };
      document.head.appendChild(script);
    } else {
      generatePDF(filename, quality);
    }
  }

  function generatePDF(filename, quality) {
    const canvas = document.getElementById('diagram-chart');
    if (!canvas) return;

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(16);
      pdf.text('Diagram Kartesius SWOT Analysis', 20, 20);
      
      // Add metadata
      pdf.setFontSize(10);
      const currentDate = new Date().toLocaleDateString('id-ID');
      pdf.text(`Tanggal: ${currentDate}`, 20, 30);
      pdf.text(`Tahun Data: ${state.filters.tahun}`, 20, 35);
      
      if (state.filters.unit_kerja_id) {
        const unitName = state.filters.unit_kerja_id === 'RUMAH_SAKIT' ? 
          'Rumah Sakit (Agregasi)' : 
          state.unitKerja.find(u => u.id === state.filters.unit_kerja_id)?.name || 'Unit Kerja';
        pdf.text(`Unit Kerja: ${unitName}`, 20, 40);
      }

      // Convert canvas to image and add to PDF
      const imgData = canvas.toDataURL('image/png', 0.95);
      const imgWidth = 250;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 20, 50, imgWidth, imgHeight);
      
      // Add data table
      let yPos = 50 + imgHeight + 20;
      pdf.setFontSize(12);
      pdf.text('Data Diagram:', 20, yPos);
      
      yPos += 10;
      pdf.setFontSize(8);
      
      // Table headers
      pdf.text('Tahun', 20, yPos);
      pdf.text('Unit Kerja', 50, yPos);
      pdf.text('X-Axis', 120, yPos);
      pdf.text('Y-Axis', 150, yPos);
      pdf.text('Kuadran', 180, yPos);
      pdf.text('Strategi', 210, yPos);
      
      yPos += 5;
      
      // Table data
      state.data.forEach(item => {
        if (yPos > 180) { // New page if needed
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.text(item.tahun.toString(), 20, yPos);
        pdf.text((item.unit_kerja_name || 'Agregasi').substring(0, 15), 50, yPos);
        pdf.text(parseFloat(item.x_axis).toFixed(2), 120, yPos);
        pdf.text(parseFloat(item.y_axis).toFixed(2), 150, yPos);
        pdf.text(item.kuadran, 180, yPos);
        pdf.text(item.strategi, 210, yPos);
        
        yPos += 5;
      });

      // Save PDF
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error saat membuat PDF: ' + error.message);
    }
  }

  return {
    load,
    applyFilter,
    calculate,
    edit,
    saveManual,
    delete: deleteItem,
    downloadChart,
    executeDownload
  };
})();

async function loadDiagramKartesius() {
  await DiagramKartesiusModule.load();
}

window.diagramKartesiusModule = DiagramKartesiusModule;

