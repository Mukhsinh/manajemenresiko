// Sasaran Strategi Module
const SasaranStrategiModule = (() => {
  const state = {
    data: [],
    rencanaStrategis: [],
    towsStrategi: [],
    filters: {
      rencana_strategis_id: '',
      tows_strategi_id: '',
      perspektif: ''
    }
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);

  async function load() {
    await fetchInitialData();
    render();
  }

  async function fetchInitialData() {
    try {
      const [sasaran, rencana, tows] = await Promise.all([
        api()('/api/sasaran-strategi?' + new URLSearchParams(state.filters)),
        api()('/api/rencana-strategis'),
        api()('/api/matriks-tows')
      ]);
      state.data = sasaran || [];
      state.rencanaStrategis = rencana || [];
      state.towsStrategi = tows || [];
    } catch (error) {
      console.error('Error fetching data:', error);
      state.data = [];
      state.rencanaStrategis = [];
      state.towsStrategi = [];
    }
  }

  function render() {
    const container = document.getElementById('sasaran-strategi-content');
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Sasaran Strategi</h3>
          <button class="btn btn-primary" onclick="SasaranStrategiModule.showModal()">
            <i class="fas fa-plus"></i> Tambah Sasaran
          </button>
        </div>
        <div class="card-body">
          <div class="filter-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div class="form-group">
              <label>Rencana Strategis</label>
              <select class="form-control" id="filter-rencana-strategis" onchange="SasaranStrategiModule.applyFilter()">
                <option value="">Semua</option>
                ${state.rencanaStrategis.map(r => `<option value="${r.id}" ${state.filters.rencana_strategis_id === r.id ? 'selected' : ''}>${r.nama_rencana}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>TOWS Strategi</label>
              <select class="form-control" id="filter-tows-strategi" onchange="SasaranStrategiModule.applyFilter()">
                <option value="">Semua</option>
                ${state.towsStrategi.map(t => `<option value="${t.id}" ${state.filters.tows_strategi_id === t.id ? 'selected' : ''}>${t.tipe_strategi}: ${t.strategi.substring(0, 50)}...</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Perspektif</label>
              <select class="form-control" id="filter-perspektif" onchange="SasaranStrategiModule.applyFilter()">
                <option value="">Semua</option>
                <option value="ES" ${state.filters.perspektif === 'ES' ? 'selected' : ''}>ES (Eksternal Stakeholder)</option>
                <option value="IBP" ${state.filters.perspektif === 'IBP' ? 'selected' : ''}>IBP (Internal Business Process)</option>
                <option value="LG" ${state.filters.perspektif === 'LG' ? 'selected' : ''}>LG (Learning & Growth)</option>
                <option value="Fin" ${state.filters.perspektif === 'Fin' ? 'selected' : ''}>Fin (Financial)</option>
              </select>
            </div>
          </div>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Rencana Strategis</th>
                  <th>Sasaran</th>
                  <th>Perspektif</th>
                  <th>TOWS Strategi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.length === 0 ? '<tr><td colspan="5" class="text-center">Tidak ada data</td></tr>' : ''}
                ${state.data.map(item => `
                  <tr>
                    <td>${item.rencana_strategis?.nama_rencana || '-'}</td>
                    <td>${item.sasaran}</td>
                    <td><span class="badge-status badge-${getPerspektifColor(item.perspektif)}">${getPerspektifLabel(item.perspektif)}</span></td>
                    <td>${item.swot_tows_strategi ? `${item.swot_tows_strategi.tipe_strategi}: ${item.swot_tows_strategi.strategi.substring(0, 50)}...` : '-'}</td>
                    <td>
                      <button class="btn btn-edit btn-sm" onclick="SasaranStrategiModule.edit('${item.id}')">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-delete btn-sm" onclick="SasaranStrategiModule.delete('${item.id}')">
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

  function getPerspektifLabel(perspektif) {
    const labels = {
      'ES': 'Eksternal Stakeholder',
      'IBP': 'Internal Business Process',
      'LG': 'Learning & Growth',
      'Fin': 'Financial'
    };
    return labels[perspektif] || perspektif;
  }

  function getPerspektifColor(perspektif) {
    const colors = {
      'ES': 'normal',
      'IBP': 'aman',
      'LG': 'hati-hati',
      'Fin': 'kritis'
    };
    return colors[perspektif] || 'secondary';
  }

  async function applyFilter() {
    state.filters.rencana_strategis_id = document.getElementById('filter-rencana-strategis')?.value || '';
    state.filters.tows_strategi_id = document.getElementById('filter-tows-strategi')?.value || '';
    state.filters.perspektif = document.getElementById('filter-perspektif')?.value || '';
    await fetchInitialData();
    render();
  }

  function showModal(id = null) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Sasaran Strategi</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form id="sasaran-strategi-form" onsubmit="SasaranStrategiModule.save(event, '${id || ''}')">
          <div class="form-group">
            <label class="form-label">Rencana Strategis *</label>
            <select class="form-control" id="ss-rencana-strategis" required>
              <option value="">Pilih Rencana Strategis</option>
              ${state.rencanaStrategis.map(r => `<option value="${r.id}">${r.nama_rencana}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">TOWS Strategi</label>
            <select class="form-control" id="ss-tows-strategi">
              <option value="">Pilih TOWS Strategi (Opsional)</option>
              ${state.towsStrategi.map(t => `<option value="${t.id}">${t.tipe_strategi}: ${t.strategi.substring(0, 80)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Perspektif *</label>
            <select class="form-control" id="ss-perspektif" required>
              <option value="">Pilih Perspektif</option>
              <option value="ES">ES (Eksternal Stakeholder)</option>
              <option value="IBP">IBP (Internal Business Process)</option>
              <option value="LG">LG (Learning & Growth)</option>
              <option value="Fin">Fin (Financial)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sasaran *</label>
            <textarea class="form-control" id="ss-sasaran" required rows="4"></textarea>
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
      const data = await api()(`/api/sasaran-strategi/${id}`);
      document.getElementById('ss-rencana-strategis').value = data.rencana_strategis_id || '';
      document.getElementById('ss-tows-strategi').value = data.tows_strategi_id || '';
      document.getElementById('ss-perspektif').value = data.perspektif || '';
      document.getElementById('ss-sasaran').value = data.sasaran || '';
    } catch (error) {
      alert('Error loading data: ' + error.message);
    }
  }

  async function save(e, id) {
    e.preventDefault();
    try {
      const data = {
        rencana_strategis_id: document.getElementById('ss-rencana-strategis').value,
        tows_strategi_id: document.getElementById('ss-tows-strategi').value || null,
        perspektif: document.getElementById('ss-perspektif').value,
        sasaran: document.getElementById('ss-sasaran').value
      };

      if (id) {
        await api()(`/api/sasaran-strategi/${id}`, { method: 'PUT', body: data });
      } else {
        await api()('/api/sasaran-strategi', { method: 'POST', body: data });
      }

      document.querySelector('.modal').remove();
      await load();
      alert('Sasaran strategi berhasil disimpan');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  async function edit(id) {
    showModal(id);
  }

  async function deleteItem(id) {
    if (!confirm('Yakin ingin menghapus sasaran strategi ini?')) return;
    try {
      await api()(`/api/sasaran-strategi/${id}`, { method: 'DELETE' });
      await load();
      alert('Sasaran strategi berhasil dihapus');
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

async function loadSasaranStrategi() {
  await SasaranStrategiModule.load();
}

window.sasaranStrategiModule = SasaranStrategiModule;

