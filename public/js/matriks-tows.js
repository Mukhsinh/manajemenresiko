// Matriks TOWS Module
const MatriksTowsModule = (() => {
  const state = {
    data: [],
    rencanaStrategis: [],
    filters: {
      rencana_strategis_id: '',
      tipe_strategi: '',
      tahun: new Date().getFullYear()
    }
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);

  async function load() {
    await fetchInitialData();
    render();
  }

  async function fetchInitialData() {
    try {
      const [tows, rencana] = await Promise.all([
        api()('/api/matriks-tows?' + new URLSearchParams(state.filters)),
        api()('/api/rencana-strategis')
      ]);
      state.data = tows || [];
      state.rencanaStrategis = rencana || [];
    } catch (error) {
      console.error('Error fetching data:', error);
      state.data = [];
      state.rencanaStrategis = [];
    }
  }

  function render() {
    const container = document.getElementById('matriks-tows-content');
    if (!container) return;

    const grouped = groupByTipeStrategi(state.data);

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Matriks TOWS</h3>
          <button class="btn btn-primary" onclick="MatriksTowsModule.showModal()">
            <i class="fas fa-plus"></i> Tambah Strategi
          </button>
        </div>
        <div class="card-body">
          <div class="filter-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div class="form-group">
              <label>Rencana Strategis</label>
              <select class="form-control" id="filter-rencana-strategis" onchange="MatriksTowsModule.applyFilter()">
                <option value="">Semua</option>
                ${state.rencanaStrategis.map(r => `<option value="${r.id}" ${state.filters.rencana_strategis_id === r.id ? 'selected' : ''}>${r.nama_rencana}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Tipe Strategi</label>
              <select class="form-control" id="filter-tipe-strategi" onchange="MatriksTowsModule.applyFilter()">
                <option value="">Semua</option>
                <option value="SO" ${state.filters.tipe_strategi === 'SO' ? 'selected' : ''}>SO (Strengths-Opportunities)</option>
                <option value="WO" ${state.filters.tipe_strategi === 'WO' ? 'selected' : ''}>WO (Weaknesses-Opportunities)</option>
                <option value="ST" ${state.filters.tipe_strategi === 'ST' ? 'selected' : ''}>ST (Strengths-Threats)</option>
                <option value="WT" ${state.filters.tipe_strategi === 'WT' ? 'selected' : ''}>WT (Weaknesses-Threats)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Tahun</label>
              <input type="number" class="form-control" id="filter-tahun" value="${state.filters.tahun}" onchange="MatriksTowsModule.applyFilter()">
            </div>
          </div>
          ${renderGroupedTable(grouped)}
        </div>
      </div>
    `;
  }

  function groupByTipeStrategi(data) {
    const groups = { SO: [], WO: [], ST: [], WT: [] };
    data.forEach(item => {
      if (groups[item.tipe_strategi]) {
        groups[item.tipe_strategi].push(item);
      }
    });
    return groups;
  }

  function renderGroupedTable(grouped) {
    const tipeLabels = {
      SO: 'Strategi SO (Strengths-Opportunities)',
      WO: 'Strategi WO (Weaknesses-Opportunities)',
      ST: 'Strategi ST (Strengths-Threats)',
      WT: 'Strategi WT (Weaknesses-Threats)'
    };

    return Object.keys(grouped).map(tipe => `
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <h4>${tipeLabels[tipe]}</h4>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Tahun</th>
                <th>Strategi</th>
                <th>Rencana Strategis</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${grouped[tipe].length === 0 ? `<tr><td colspan="4" class="text-center">Tidak ada data</td></tr>` : ''}
              ${grouped[tipe].map(item => `
                <tr>
                  <td>${item.tahun}</td>
                  <td>${item.strategi}</td>
                  <td>${item.rencana_strategis?.nama_rencana || '-'}</td>
                  <td>
                    <button class="btn btn-edit btn-sm" onclick="MatriksTowsModule.edit('${item.id}')">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-delete btn-sm" onclick="MatriksTowsModule.delete('${item.id}')">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `).join('');
  }

  async function applyFilter() {
    state.filters.rencana_strategis_id = document.getElementById('filter-rencana-strategis')?.value || '';
    state.filters.tipe_strategi = document.getElementById('filter-tipe-strategi')?.value || '';
    state.filters.tahun = parseInt(document.getElementById('filter-tahun')?.value || new Date().getFullYear());
    await fetchInitialData();
    render();
  }

  function showModal(id = null) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Strategi TOWS</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form id="matriks-tows-form" onsubmit="MatriksTowsModule.save(event, '${id || ''}')">
          <div class="form-group">
            <label class="form-label">Rencana Strategis</label>
            <select class="form-control" id="mt-rencana-strategis">
              <option value="">Pilih Rencana Strategis</option>
              ${state.rencanaStrategis.map(r => `<option value="${r.id}">${r.nama_rencana}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tahun *</label>
            <input type="number" class="form-control" id="mt-tahun" required value="${new Date().getFullYear()}">
          </div>
          <div class="form-group">
            <label class="form-label">Tipe Strategi *</label>
            <select class="form-control" id="mt-tipe-strategi" required>
              <option value="">Pilih Tipe Strategi</option>
              <option value="SO">SO (Strengths-Opportunities)</option>
              <option value="WO">WO (Weaknesses-Opportunities)</option>
              <option value="ST">ST (Strengths-Threats)</option>
              <option value="WT">WT (Weaknesses-Threats)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Strategi *</label>
            <textarea class="form-control" id="mt-strategi" required rows="4"></textarea>
          </div>
          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    if (id) {
      loadForEdit(id);
    }
  }

  async function loadForEdit(id) {
    try {
      const data = await api()(`/api/matriks-tows/${id}`);
      document.getElementById('mt-rencana-strategis').value = data.rencana_strategis_id || '';
      document.getElementById('mt-tahun').value = data.tahun || '';
      document.getElementById('mt-tipe-strategi').value = data.tipe_strategi || '';
      document.getElementById('mt-strategi').value = data.strategi || '';
    } catch (error) {
      alert('Error loading data: ' + error.message);
    }
  }

  async function save(e, id) {
    e.preventDefault();
    try {
      const data = {
        rencana_strategis_id: document.getElementById('mt-rencana-strategis').value || null,
        tahun: parseInt(document.getElementById('mt-tahun').value),
        tipe_strategi: document.getElementById('mt-tipe-strategi').value,
        strategi: document.getElementById('mt-strategi').value
      };

      if (id) {
        await api()(`/api/matriks-tows/${id}`, { method: 'PUT', body: data });
      } else {
        await api()('/api/matriks-tows', { method: 'POST', body: data });
      }

      document.querySelector('.modal').remove();
      await load();
      alert('Strategi berhasil disimpan');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  async function edit(id) {
    showModal(id);
  }

  async function deleteItem(id) {
    if (!confirm('Yakin ingin menghapus strategi ini?')) return;
    try {
      await api()(`/api/matriks-tows/${id}`, { method: 'DELETE' });
      await load();
      alert('Strategi berhasil dihapus');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  return {
    load,
    showModal,
    applyFilter,
    save,
    edit,
    delete: deleteItem
  };
})();

async function loadMatriksTows() {
  await MatriksTowsModule.load();
}

window.matriksTowsModule = MatriksTowsModule;

