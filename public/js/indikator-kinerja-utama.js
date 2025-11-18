// Indikator Kinerja Utama Module
const IndikatorKinerjaUtamaModule = (() => {
  const state = {
    data: [],
    rencanaStrategis: [],
    sasaranStrategi: [],
    filters: {
      rencana_strategis_id: '',
      sasaran_strategi_id: ''
    }
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);

  async function load() {
    await fetchInitialData();
    render();
  }

  async function fetchInitialData() {
    try {
      const [indikator, rencana, sasaran] = await Promise.all([
        api()('/api/indikator-kinerja-utama?' + new URLSearchParams(state.filters)),
        api()('/api/rencana-strategis'),
        api()('/api/sasaran-strategi')
      ]);
      state.data = indikator || [];
      state.rencanaStrategis = rencana || [];
      state.sasaranStrategi = sasaran || [];
    } catch (error) {
      console.error('Error fetching data:', error);
      state.data = [];
      state.rencanaStrategis = [];
      state.sasaranStrategi = [];
    }
  }

  function render() {
    const container = document.getElementById('indikator-kinerja-utama-content');
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Indikator Kinerja Utama (KPI)</h3>
          <button class="btn btn-primary" onclick="IndikatorKinerjaUtamaModule.showModal()">
            <i class="fas fa-plus"></i> Tambah Indikator
          </button>
        </div>
        <div class="card-body">
          <div class="filter-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div class="form-group">
              <label>Rencana Strategis</label>
              <select class="form-control" id="filter-rencana-strategis" onchange="IndikatorKinerjaUtamaModule.applyFilter()">
                <option value="">Semua</option>
                ${state.rencanaStrategis.map(r => `<option value="${r.id}" ${state.filters.rencana_strategis_id === r.id ? 'selected' : ''}>${r.nama_rencana}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Sasaran Strategi</label>
              <select class="form-control" id="filter-sasaran-strategi" onchange="IndikatorKinerjaUtamaModule.applyFilter()">
                <option value="">Semua</option>
                ${state.sasaranStrategi.map(s => `<option value="${s.id}" ${state.filters.sasaran_strategi_id === s.id ? 'selected' : ''}>${s.sasaran.substring(0, 50)}...</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Rencana Strategis</th>
                  <th>Sasaran Strategi</th>
                  <th>Indikator</th>
                  <th>Baseline</th>
                  <th>Target</th>
                  <th>Initiatif</th>
                  <th>PIC</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.length === 0 ? '<tr><td colspan="8" class="text-center">Tidak ada data</td></tr>' : ''}
                ${state.data.map(item => {
                  const progress = calculateProgress(item);
                  return `
                  <tr>
                    <td>${item.rencana_strategis?.nama_rencana || '-'}</td>
                    <td>${item.sasaran_strategi?.sasaran?.substring(0, 40) || '-'}...</td>
                    <td>${item.indikator}</td>
                    <td>${item.baseline_nilai || '-'} (${item.baseline_tahun || '-'})</td>
                    <td>${item.target_nilai || '-'} (${item.target_tahun || '-'})</td>
                    <td>${item.initiatif_strategi?.substring(0, 30) || '-'}...</td>
                    <td>${item.pic || '-'}</td>
                    <td>
                      <button class="btn btn-edit btn-sm" onclick="IndikatorKinerjaUtamaModule.edit('${item.id}')">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-delete btn-sm" onclick="IndikatorKinerjaUtamaModule.delete('${item.id}')">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function calculateProgress(item) {
    if (!item.baseline_nilai || !item.target_nilai) return 0;
    return ((item.target_nilai - item.baseline_nilai) / item.baseline_nilai) * 100;
  }

  async function applyFilter() {
    state.filters.rencana_strategis_id = document.getElementById('filter-rencana-strategis')?.value || '';
    state.filters.sasaran_strategi_id = document.getElementById('filter-sasaran-strategi')?.value || '';
    await fetchInitialData();
    render();
  }

  function showModal(id = null) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
          <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Indikator Kinerja Utama</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form id="indikator-kinerja-form" onsubmit="IndikatorKinerjaUtamaModule.save(event, '${id || ''}')">
          <div class="form-group">
            <label class="form-label">Rencana Strategis *</label>
            <select class="form-control" id="iku-rencana-strategis" required>
              <option value="">Pilih Rencana Strategis</option>
              ${state.rencanaStrategis.map(r => `<option value="${r.id}">${r.nama_rencana}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sasaran Strategi</label>
            <select class="form-control" id="iku-sasaran-strategi">
              <option value="">Pilih Sasaran Strategi (Opsional)</option>
              ${state.sasaranStrategi.map(s => `<option value="${s.id}">${s.sasaran.substring(0, 80)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Indikator *</label>
            <textarea class="form-control" id="iku-indikator" required rows="3"></textarea>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Baseline Tahun</label>
              <input type="number" class="form-control" id="iku-baseline-tahun" value="${new Date().getFullYear() - 1}">
            </div>
            <div class="form-group">
              <label class="form-label">Baseline Nilai</label>
              <input type="number" class="form-control" id="iku-baseline-nilai" step="0.01">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Target Tahun</label>
              <input type="number" class="form-control" id="iku-target-tahun" value="${new Date().getFullYear() + 1}">
            </div>
            <div class="form-group">
              <label class="form-label">Target Nilai</label>
              <input type="number" class="form-control" id="iku-target-nilai" step="0.01">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Initiatif Strategi</label>
            <textarea class="form-control" id="iku-initiatif" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">PIC</label>
            <input type="text" class="form-control" id="iku-pic">
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
      const data = await api()(`/api/indikator-kinerja-utama/${id}`);
      document.getElementById('iku-rencana-strategis').value = data.rencana_strategis_id || '';
      document.getElementById('iku-sasaran-strategi').value = data.sasaran_strategi_id || '';
      document.getElementById('iku-indikator').value = data.indikator || '';
      document.getElementById('iku-baseline-tahun').value = data.baseline_tahun || '';
      document.getElementById('iku-baseline-nilai').value = data.baseline_nilai || '';
      document.getElementById('iku-target-tahun').value = data.target_tahun || '';
      document.getElementById('iku-target-nilai').value = data.target_nilai || '';
      document.getElementById('iku-initiatif').value = data.initiatif_strategi || '';
      document.getElementById('iku-pic').value = data.pic || '';
    } catch (error) {
      alert('Error loading data: ' + error.message);
    }
  }

  async function save(e, id) {
    e.preventDefault();
    try {
      const data = {
        rencana_strategis_id: document.getElementById('iku-rencana-strategis').value,
        sasaran_strategi_id: document.getElementById('iku-sasaran-strategi').value || null,
        indikator: document.getElementById('iku-indikator').value,
        baseline_tahun: document.getElementById('iku-baseline-tahun').value ? parseInt(document.getElementById('iku-baseline-tahun').value) : null,
        baseline_nilai: document.getElementById('iku-baseline-nilai').value ? parseFloat(document.getElementById('iku-baseline-nilai').value) : null,
        target_tahun: document.getElementById('iku-target-tahun').value ? parseInt(document.getElementById('iku-target-tahun').value) : null,
        target_nilai: document.getElementById('iku-target-nilai').value ? parseFloat(document.getElementById('iku-target-nilai').value) : null,
        initiatif_strategi: document.getElementById('iku-initiatif').value || null,
        pic: document.getElementById('iku-pic').value || null
      };

      if (id) {
        await api()(`/api/indikator-kinerja-utama/${id}`, { method: 'PUT', body: data });
      } else {
        await api()('/api/indikator-kinerja-utama', { method: 'POST', body: data });
      }

      document.querySelector('.modal').remove();
      await load();
      alert('Indikator kinerja utama berhasil disimpan');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  async function edit(id) {
    showModal(id);
  }

  async function deleteItem(id) {
    if (!confirm('Yakin ingin menghapus indikator kinerja utama ini?')) return;
    try {
      await api()(`/api/indikator-kinerja-utama/${id}`, { method: 'DELETE' });
      await load();
      alert('Indikator kinerja utama berhasil dihapus');
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

async function loadIndikatorKinerjaUtama() {
  await IndikatorKinerjaUtamaModule.load();
}

window.indikatorKinerjaUtamaModule = IndikatorKinerjaUtamaModule;

