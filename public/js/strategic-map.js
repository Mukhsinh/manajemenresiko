// Strategic Map Module
const StrategicMapModule = (() => {
  const state = {
    data: [],
    rencanaStrategis: [],
    filters: {
      rencana_strategis_id: ''
    }
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);

  async function load() {
    await fetchInitialData();
    render();
  }

  async function fetchInitialData() {
    try {
      const [map, rencana] = await Promise.all([
        api()('/api/strategic-map?' + new URLSearchParams(state.filters)),
        api()('/api/rencana-strategis')
      ]);
      state.data = map || [];
      state.rencanaStrategis = rencana || [];
    } catch (error) {
      console.error('Error fetching data:', error);
      state.data = [];
      state.rencanaStrategis = [];
    }
  }

  function render() {
    const container = document.getElementById('strategic-map-content');
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Strategic Map</h3>
          <div style="display: flex; gap: 0.5rem;">
            <select class="form-control" id="filter-rencana-strategis" style="width: auto;" onchange="StrategicMapModule.applyFilter()">
              <option value="">Pilih Rencana Strategis</option>
              ${state.rencanaStrategis.map(r => `<option value="${r.id}" ${state.filters.rencana_strategis_id === r.id ? 'selected' : ''}>${r.nama_rencana}</option>`).join('')}
            </select>
            <button class="btn btn-success" onclick="StrategicMapModule.generate()" ${!state.filters.rencana_strategis_id ? 'disabled' : ''}>
              <i class="fas fa-sync"></i> Generate Map
            </button>
          </div>
        </div>
        <div class="card-body">
          <div id="strategic-map-visualization" style="position: relative; min-height: 600px; border: 1px solid #dee2e6; border-radius: 8px; padding: 2rem; background: #f8f9fa;">
            ${renderVisualization()}
          </div>
          <div class="table-container" style="margin-top: 2rem;">
            <table class="table">
              <thead>
                <tr>
                  <th>Perspektif</th>
                  <th>Sasaran Strategi</th>
                  <th>Posisi X</th>
                  <th>Posisi Y</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.length === 0 ? '<tr><td colspan="5" class="text-center">Tidak ada data. Pilih rencana strategis dan klik "Generate Map" untuk membuat strategic map.</td></tr>' : ''}
                ${state.data.map(item => `
                  <tr>
                    <td><span class="badge-status badge-${getPerspektifColor(item.perspektif)}">${item.perspektif}</span></td>
                    <td>${item.sasaran_strategi?.sasaran || '-'}</td>
                    <td>${item.posisi_x}</td>
                    <td>${item.posisi_y}</td>
                    <td>
                      <button class="btn btn-edit btn-sm" onclick="StrategicMapModule.edit('${item.id}')">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-delete btn-sm" onclick="StrategicMapModule.delete('${item.id}')">
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
  }

  function renderVisualization() {
    if (state.data.length === 0) {
      return '<div style="text-align: center; padding: 3rem; color: #6c757d;"><i class="fas fa-project-diagram" style="font-size: 3rem; margin-bottom: 1rem;"></i><p>Pilih rencana strategis dan generate strategic map</p></div>';
    }

    const grouped = groupByPerspektif(state.data);
    const perspektifLabels = {
      'ES': 'Eksternal Stakeholder',
      'IBP': 'Internal Business Process',
      'LG': 'Learning & Growth',
      'Fin': 'Financial'
    };
    const perspektifOrder = ['ES', 'IBP', 'LG', 'Fin'];
    
    return perspektifOrder.map((perspektif, idx) => {
      const items = grouped[perspektif] || [];
      if (items.length === 0) return '';
      
      const label = perspektifLabels[perspektif] || perspektif;
      
      return `
        <div class="perspektif-group" style="margin-bottom: 2rem; padding: 1.5rem; background: white; border-radius: 8px; border-left: 4px solid ${getPerspektifColorHex(perspektif)}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h4 style="margin-bottom: 1rem; color: ${getPerspektifColorHex(perspektif)}; font-weight: 600;">
            <i class="fas fa-layer-group"></i> ${label}
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
            ${items.map(item => `
              <div class="sasaran-node" 
                   style="padding: 1rem; background: ${item.warna || getPerspektifColorHex(perspektif)}; color: white; border-radius: 8px; cursor: move; transition: transform 0.2s, box-shadow 0.2s;"
                   onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'"
                   onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'"
                   draggable="true"
                   data-id="${item.id}"
                   ondragstart="StrategicMapModule.handleDragStart(event)"
                   ondrop="StrategicMapModule.handleDrop(event)"
                   ondragover="event.preventDefault()">
                <div style="font-size: 0.9rem; line-height: 1.4;">
                  ${item.sasaran_strategi?.sasaran || 'Sasaran Strategi'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  function groupByPerspektif(data) {
    const groups = {};
    data.forEach(item => {
      if (!groups[item.perspektif]) {
        groups[item.perspektif] = [];
      }
      groups[item.perspektif].push(item);
    });
    return groups;
  }

  function getPerspektifColor(perspektif) {
    const colorMap = {
      'ES': 'normal',
      'IBP': 'aman',
      'LG': 'hati-hati',
      'Fin': 'kritis'
    };
    return colorMap[perspektif] || 'secondary';
  }

  function getPerspektifColorHex(perspektif) {
    const colorMap = {
      'ES': '#3498db',
      'IBP': '#27ae60',
      'LG': '#f39c12',
      'Fin': '#e74c3c'
    };
    return colorMap[perspektif] || '#95a5a6';
  }

  async function applyFilter() {
    state.filters.rencana_strategis_id = document.getElementById('filter-rencana-strategis')?.value || '';
    await fetchInitialData();
    render();
  }

  async function generate() {
    const rencana_strategis_id = document.getElementById('filter-rencana-strategis')?.value;
    
    if (!rencana_strategis_id) {
      alert('Pilih rencana strategis terlebih dahulu');
      return;
    }

    if (!confirm('Generate strategic map dari sasaran strategi?\nData yang sudah ada akan diganti dengan data terbaru.')) return;

    try {
      const result = await api()('/api/strategic-map/generate', {
        method: 'POST',
        body: { rencana_strategis_id }
      });
      
      await load();
      
      if (result.generated > 0) {
        alert(`Strategic map berhasil digenerate!\nTotal: ${result.generated} sasaran strategi`);
      } else {
        alert('Tidak ada sasaran strategi untuk digenerate.\nSilakan tambahkan sasaran strategi terlebih dahulu.');
      }
    } catch (error) {
      console.error('Generate error:', error);
      alert('Error: ' + error.message);
    }
  }

  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
  }

  function handleDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    // Update position logic can be added here
  }

  function edit(id) {
    const item = state.data.find(d => d.id === id);
    if (!item) return;

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">Edit Posisi Strategic Map</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form onsubmit="StrategicMapModule.savePosition(event, '${id}')">
          <div class="form-group">
            <label class="form-label">Posisi X</label>
            <input type="number" class="form-control" id="sm-x" value="${item.posisi_x}" step="1">
          </div>
          <div class="form-group">
            <label class="form-label">Posisi Y</label>
            <input type="number" class="form-control" id="sm-y" value="${item.posisi_y}" step="1">
          </div>
          <div class="form-group">
            <label class="form-label">Warna</label>
            <input type="color" class="form-control" id="sm-warna" value="${item.warna || '#3498db'}">
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

  async function savePosition(e, id) {
    e.preventDefault();
    try {
      const data = {
        posisi_x: parseFloat(document.getElementById('sm-x').value),
        posisi_y: parseFloat(document.getElementById('sm-y').value),
        warna: document.getElementById('sm-warna').value
      };

      await api()(`/api/strategic-map/${id}`, { method: 'PUT', body: data });
      document.querySelector('.modal').remove();
      await load();
      alert('Posisi berhasil diupdate');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  async function deleteItem(id) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await api()(`/api/strategic-map/${id}`, { method: 'DELETE' });
      await load();
      alert('Data berhasil dihapus');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  return {
    load,
    applyFilter,
    generate,
    handleDragStart,
    handleDrop,
    edit,
    savePosition,
    delete: deleteItem
  };
})();

async function loadStrategicMap() {
  await StrategicMapModule.load();
}

window.strategicMapModule = StrategicMapModule;

