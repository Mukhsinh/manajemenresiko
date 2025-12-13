// Analisis SWOT Module
const AnalisisSwotModule = (() => {
  const state = {
    data: [],
    summary: null,
    rencanaStrategis: [],
    unitKerja: [],
    filters: {
      rencana_strategis_id: '',
      unit_kerja_id: '',
      kategori: '',
      tahun: new Date().getFullYear()
    }
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);

  async function load() {
    await fetchInitialData();
    await fetchSummary();
    render();
  }

  async function fetchInitialData() {
    try {
      // Fetch data separately to better handle errors
      let analisis = [];
      let rencana = [];
      let unitKerja = [];
      
      try {
        analisis = await api()('/api/analisis-swot?' + new URLSearchParams(state.filters));
      } catch (error) {
        console.error('Error fetching analisis data:', error);
        alert('Error loading analisis data: ' + error.message);
      }
      
      try {
        rencana = await api()('/api/rencana-strategis');
      } catch (error) {
        console.error('Error fetching rencana strategis data:', error);
        alert('Error loading rencana strategis data: ' + error.message);
      }
      
      try {
        unitKerja = await api()('/api/master-data/work-units');
      } catch (error) {
        console.error('Error fetching unit kerja data:', error);
      }
      
      state.data = analisis || [];
      state.rencanaStrategis = rencana || [];
      state.unitKerja = unitKerja || [];
      
      // Log for debugging
      console.log('SWOT Analysis data loaded:', { 
        analisis: state.data.length, 
        rencana: state.rencanaStrategis.length,
        unitKerja: state.unitKerja.length 
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      // Show error to user
      alert('Error loading data: ' + error.message);
      state.data = [];
      state.rencanaStrategis = [];
      state.unitKerja = [];
    }
  }

  async function fetchSummary() {
    try {
      const summary = await api()('/api/analisis-swot/summary?' + new URLSearchParams(state.filters));
      state.summary = summary;
    } catch (error) {
      console.error('Error fetching summary:', error);
      // Show error to user
      alert('Error loading summary: ' + error.message);
      state.summary = null;
    }
  }

  function render() {
    const container = document.getElementById('analisis-swot-content');
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Analisis SWOT</h3>
          <button class="btn btn-primary" onclick="AnalisisSwotModule.showModal()">
            <i class="fas fa-plus"></i> Tambah Data
          </button>
        </div>
        <div class="card-body">
          <div class="filter-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div class="form-group">
              <label>Rencana Strategis</label>
              <select class="form-control" id="filter-rencana-strategis" onchange="AnalisisSwotModule.applyFilter()">
                <option value="">Semua</option>
                ${state.rencanaStrategis.map(r => `<option value="${r.id}" ${state.filters.rencana_strategis_id === r.id ? 'selected' : ''}>${r.nama_rencana}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Unit Kerja</label>
              <select class="form-control" id="filter-unit-kerja" onchange="AnalisisSwotModule.applyFilter()">
                <option value="">Semua</option>
                <option value="RUMAH_SAKIT">Rumah Sakit (Agregasi)</option>
                ${state.unitKerja.map(u => `<option value="${u.id}" ${state.filters.unit_kerja_id === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Kategori</label>
              <select class="form-control" id="filter-kategori" onchange="AnalisisSwotModule.applyFilter()">
                <option value="">Semua</option>
                <option value="Strength" ${state.filters.kategori === 'Strength' ? 'selected' : ''}>Strength</option>
                <option value="Weakness" ${state.filters.kategori === 'Weakness' ? 'selected' : ''}>Weakness</option>
                <option value="Opportunity" ${state.filters.kategori === 'Opportunity' ? 'selected' : ''}>Opportunity</option>
                <option value="Threat" ${state.filters.kategori === 'Threat' ? 'selected' : ''}>Threat</option>
              </select>
            </div>
            <div class="form-group">
              <label>Tahun</label>
              <input type="number" class="form-control" id="filter-tahun" value="${state.filters.tahun}" onchange="AnalisisSwotModule.applyFilter()">
            </div>
          </div>
          ${renderSummary()}
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Tahun</th>
                  <th>Unit Kerja</th>
                  <th>Kategori</th>
                  <th>Objek Analisis</th>
                  <th>Bobot</th>
                  <th>Kuantitas</th>
                  <th>Rank</th>
                  <th>Score</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.length === 0 ? '<tr><td colspan="9" class="text-center">Tidak ada data</td></tr>' : ''}
                ${state.data.map(item => `
                  <tr>
                    <td>${item.tahun}</td>
                    <td>${item.master_work_units?.name || item.unit_kerja_name || '-'}</td>
                    <td><span class="badge-status badge-${getKategoriColor(item.kategori)}">${item.kategori}</span></td>
                    <td>${item.objek_analisis}</td>
                    <td>${item.bobot}</td>
                    <td>${item.kuantitas || 1}</td>
                    <td>${item.rank}</td>
                    <td><strong>${item.score}</strong></td>
                    <td>
                      <button class="btn btn-edit btn-sm" onclick="AnalisisSwotModule.edit('${item.id}')">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-delete btn-sm" onclick="AnalisisSwotModule.delete('${item.id}')">
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

  function renderSummary() {
    if (!state.summary) return '';
    
    const s = state.summary;
    return `
      <div class="summary-card" style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 1rem;">Ringkasan Analisis</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div>
            <strong>Strength:</strong> Total Score: ${s.Strength?.totalScore || 0}, Total Bobot: ${s.Strength?.totalBobot || 0}
          </div>
          <div>
            <strong>Weakness:</strong> Total Score: ${s.Weakness?.totalScore || 0}, Total Bobot: ${s.Weakness?.totalBobot || 0}
          </div>
          <div>
            <strong>Opportunity:</strong> Total Score: ${s.Opportunity?.totalScore || 0}, Total Bobot: ${s.Opportunity?.totalBobot || 0}
          </div>
          <div>
            <strong>Threat:</strong> Total Score: ${s.Threat?.totalScore || 0}, Total Bobot: ${s.Threat?.totalBobot || 0}
          </div>
        </div>
        ${s.differences ? `
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #dee2e6;">
            <strong>Selisih:</strong><br>
            Eksternal (Opportunity - Threat): <strong>${s.differences.external}</strong><br>
            Internal (Strength - Weakness): <strong>${s.differences.internal}</strong>
          </div>
        ` : ''}
      </div>
    `;
  }

  function getKategoriColor(kategori) {
    const colors = {
      'Strength': 'aman',
      'Weakness': 'hati-hati',
      'Opportunity': 'normal',
      'Threat': 'kritis'
    };
    return colors[kategori] || 'secondary';
  }

  async function applyFilter() {
    state.filters.rencana_strategis_id = document.getElementById('filter-rencana-strategis')?.value || '';
    state.filters.unit_kerja_id = document.getElementById('filter-unit-kerja')?.value || '';
    state.filters.kategori = document.getElementById('filter-kategori')?.value || '';
    state.filters.tahun = parseInt(document.getElementById('filter-tahun')?.value || new Date().getFullYear());
    await fetchInitialData();
    await fetchSummary();
    render();
  }

  function showModal(id = null) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Analisis SWOT</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form id="analisis-swot-form" onsubmit="AnalisisSwotModule.save(event, '${id || ''}')">
          <div class="form-group">
            <label class="form-label">Rencana Strategis</label>
            <select class="form-control" id="as-rencana-strategis">
              <option value="">Pilih Rencana Strategis</option>
              ${state.rencanaStrategis.map(r => `<option value="${r.id}">${r.nama_rencana}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Unit Kerja *</label>
            <select class="form-control" id="as-unit-kerja" required>
              <option value="">Pilih Unit Kerja</option>
              ${state.unitKerja.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tahun *</label>
            <input type="number" class="form-control" id="as-tahun" required value="${new Date().getFullYear()}">
          </div>
          <div class="form-group">
            <label class="form-label">Kategori *</label>
            <select class="form-control" id="as-kategori" required>
              <option value="">Pilih Kategori</option>
              <option value="Strength">Strength</option>
              <option value="Weakness">Weakness</option>
              <option value="Opportunity">Opportunity</option>
              <option value="Threat">Threat</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Objek Analisis *</label>
            <textarea class="form-control" id="as-objek-analisis" required rows="3"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Bobot (0-100) *</label>
            <input type="number" class="form-control" id="as-bobot" required min="0" max="100" onchange="AnalisisSwotModule.calculateScore()">
          </div>
          <div class="form-group">
            <label class="form-label">Kuantitas *</label>
            <input type="number" class="form-control" id="as-kuantitas" required min="1" value="1" onchange="AnalisisSwotModule.calculateScore()">
            <small class="form-text text-muted">Jumlah item untuk kategori ini</small>
          </div>
          <div class="form-group">
            <label class="form-label">Rank (1-5) *</label>
            <input type="number" class="form-control" id="as-rank" required min="1" max="5" onchange="AnalisisSwotModule.calculateScore()">
          </div>
          <div class="form-group">
            <label class="form-label">Score (Otomatis)</label>
            <input type="number" class="form-control" id="as-score" readonly>
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

  function calculateScore() {
    const bobot = parseInt(document.getElementById('as-bobot')?.value || 0);
    const rank = parseInt(document.getElementById('as-rank')?.value || 0);
    const score = bobot * rank;
    const scoreInput = document.getElementById('as-score');
    if (scoreInput) {
      scoreInput.value = score;
    }
  }

  async function loadForEdit(id) {
    try {
      const data = await api()(`/api/analisis-swot/${id}`);
      document.getElementById('as-rencana-strategis').value = data.rencana_strategis_id || '';
      document.getElementById('as-unit-kerja').value = data.unit_kerja_id || '';
      document.getElementById('as-tahun').value = data.tahun || '';
      document.getElementById('as-kategori').value = data.kategori || '';
      document.getElementById('as-objek-analisis').value = data.objek_analisis || '';
      document.getElementById('as-bobot').value = data.bobot || '';
      document.getElementById('as-kuantitas').value = data.kuantitas || 1;
      document.getElementById('as-rank').value = data.rank || '';
      calculateScore();
    } catch (error) {
      console.error('Load for edit error:', error);
      alert('Error loading data: ' + error.message);
    }
  }

  async function save(e, id) {
    e.preventDefault();
    try {
      const data = {
        rencana_strategis_id: document.getElementById('as-rencana-strategis').value || null,
        unit_kerja_id: document.getElementById('as-unit-kerja').value || null,
        tahun: parseInt(document.getElementById('as-tahun').value),
        kategori: document.getElementById('as-kategori').value,
        objek_analisis: document.getElementById('as-objek-analisis').value,
        bobot: parseInt(document.getElementById('as-bobot').value),
        kuantitas: parseInt(document.getElementById('as-kuantitas').value),
        rank: parseInt(document.getElementById('as-rank').value)
      };

      if (id) {
        await api()(`/api/analisis-swot/${id}`, { method: 'PUT', body: data });
      } else {
        await api()('/api/analisis-swot', { method: 'POST', body: data });
      }

      document.querySelector('.modal').remove();
      await load();
      alert('Data berhasil disimpan');
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving data: ' + error.message);
    }
  }

  async function edit(id) {
    showModal(id);
  }

  async function deleteItem(id) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await api()(`/api/analisis-swot/${id}`, { method: 'DELETE' });
      await load();
      alert('Data berhasil dihapus');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting data: ' + error.message);
    }
  }

  return {
    load,
    showModal,
    applyFilter,
    calculateScore,
    save,
    edit,
    delete: deleteItem
  };
})();

async function loadAnalisisSwot() {
  await AnalisisSwotModule.load();
}

window.analisisSwotModule = AnalisisSwotModule;

