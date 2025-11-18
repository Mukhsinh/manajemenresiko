// Diagram Kartesius Module
const DiagramKartesiusModule = (() => {
  const state = {
    data: [],
    rencanaStrategis: [],
    filters: {
      rencana_strategis_id: '',
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
      const [diagram, rencana] = await Promise.all([
        api()('/api/diagram-kartesius?' + new URLSearchParams(state.filters)),
        api()('/api/rencana-strategis')
      ]);
      state.data = diagram || [];
      state.rencanaStrategis = rencana || [];
    } catch (error) {
      console.error('Error fetching data:', error);
      state.data = [];
      state.rencanaStrategis = [];
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
              <label>Tahun</label>
              <input type="number" class="form-control" id="filter-tahun" value="${state.filters.tahun}" onchange="DiagramKartesiusModule.applyFilter()">
            </div>
          </div>
          <div id="diagram-chart-container" style="position: relative; height: 500px; margin-bottom: 2rem;">
            <canvas id="diagram-chart"></canvas>
          </div>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Tahun</th>
                  <th>X-Axis (Strength - Weakness)</th>
                  <th>Y-Axis (Opportunity - Threat)</th>
                  <th>Kuadran</th>
                  <th>Strategi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.length === 0 ? '<tr><td colspan="6" class="text-center">Tidak ada data. Klik "Hitung Diagram" untuk generate dari analisis SWOT.</td></tr>' : ''}
                ${state.data.map(item => `
                  <tr>
                    <td>${item.tahun}</td>
                    <td>${item.x_axis}</td>
                    <td>${item.y_axis}</td>
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

    const datasets = state.data.map((item, index) => ({
      label: `${item.tahun} - ${item.strategi}`,
      data: [{ x: item.x_axis, y: item.y_axis }],
      backgroundColor: getKuadranColorHex(item.kuadran),
      borderColor: getKuadranColorHex(item.kuadran),
      pointRadius: 8,
      pointHoverRadius: 10
    }));

    state.chart = new Chart(ctx, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Strength - Weakness'
            },
            min: -100,
            max: 100
          },
          y: {
            title: {
              display: true,
              text: 'Opportunity - Threat'
            },
            min: -100,
            max: 100
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const item = state.data[context.datasetIndex];
                return `${item.tahun}: (${item.x_axis}, ${item.y_axis}) - ${item.strategi}`;
              }
            }
          }
        }
      }
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
      'I': '#27ae60',
      'II': '#3498db',
      'III': '#e74c3c',
      'IV': '#f39c12'
    };
    return colors[kuadran] || '#95a5a6';
  }

  async function applyFilter() {
    state.filters.rencana_strategis_id = document.getElementById('filter-rencana-strategis')?.value || '';
    state.filters.tahun = parseInt(document.getElementById('filter-tahun')?.value || new Date().getFullYear());
    await fetchInitialData();
    render();
  }

  async function calculate() {
    const rencana_strategis_id = document.getElementById('filter-rencana-strategis')?.value || '';
    const tahun = parseInt(document.getElementById('filter-tahun')?.value || new Date().getFullYear());

    if (!confirm(`Hitung diagram kartesius untuk tahun ${tahun}?`)) return;

    try {
      await api()('/api/diagram-kartesius/calculate', {
        method: 'POST',
        body: {
          rencana_strategis_id: rencana_strategis_id || null,
          tahun
        }
      });
      await load();
      alert('Diagram berhasil dihitung');
    } catch (error) {
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

  return {
    load,
    applyFilter,
    calculate,
    edit,
    saveManual,
    delete: deleteItem
  };
})();

async function loadDiagramKartesius() {
  await DiagramKartesiusModule.load();
}

window.diagramKartesiusModule = DiagramKartesiusModule;

