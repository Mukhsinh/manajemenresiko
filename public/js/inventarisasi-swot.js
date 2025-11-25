// Inventarisasi SWOT Module
const InventarisasiSwotModule = (() => {
  const state = {
    data: [],
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
    render();
  }

  async function fetchInitialData() {
    try {
      const [inventarisasi, rencana, unit] = await Promise.all([
        api()('/api/inventarisasi-swot?' + new URLSearchParams(state.filters)),
        api()('/api/rencana-strategis'),
        api()('/api/master-data/work-units')
      ]);
      state.data = inventarisasi || [];
      state.rencanaStrategis = rencana || [];
      state.unitKerja = unit || [];
      
      console.log('Rencana Strategis loaded:', state.rencanaStrategis.length, 'items');
      console.log('Unit Kerja loaded:', state.unitKerja.length, 'items');
    } catch (error) {
      console.error('Error fetching data:', error);
      state.data = [];
      state.rencanaStrategis = [];
      state.unitKerja = [];
    }
  }

  function render() {
    const container = document.getElementById('inventarisasi-swot-content');
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Inventarisasi SWOT</h3>
          <button class="btn btn-primary" onclick="InventarisasiSwotModule.showModal()">
            <i class="fas fa-plus"></i> Tambah Data
          </button>
        </div>
        <div class="card-body">
          <div class="filter-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div class="form-group">
              <label>Rencana Strategis</label>
              <select class="form-control" id="filter-rencana-strategis" onchange="InventarisasiSwotModule.applyFilter()">
                <option value="">Semua</option>
                ${state.rencanaStrategis.map(r => `<option value="${r.id}" ${state.filters.rencana_strategis_id === r.id ? 'selected' : ''}>${r.kode || ''} - ${r.nama_rencana}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Unit Kerja</label>
              <select class="form-control" id="filter-unit-kerja" onchange="InventarisasiSwotModule.applyFilter()">
                <option value="">Semua</option>
                ${state.unitKerja.map(u => `<option value="${u.id}" ${state.filters.unit_kerja_id === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Kategori</label>
              <select class="form-control" id="filter-kategori" onchange="InventarisasiSwotModule.applyFilter()">
                <option value="">Semua</option>
                <option value="Kekuatan" ${state.filters.kategori === 'Kekuatan' ? 'selected' : ''}>Kekuatan</option>
                <option value="Kelemahan" ${state.filters.kategori === 'Kelemahan' ? 'selected' : ''}>Kelemahan</option>
                <option value="Peluang" ${state.filters.kategori === 'Peluang' ? 'selected' : ''}>Peluang</option>
                <option value="Tantangan" ${state.filters.kategori === 'Tantangan' ? 'selected' : ''}>Tantangan</option>
              </select>
            </div>
            <div class="form-group">
              <label>Tahun</label>
              <input type="number" class="form-control" id="filter-tahun" value="${state.filters.tahun}" onchange="InventarisasiSwotModule.applyFilter()">
            </div>
          </div>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Tahun</th>
                  <th>Unit Kerja</th>
                  <th>Kategori</th>
                  <th>Deskripsi</th>
                  <th>Rencana Strategis</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.length === 0 ? '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>' : ''}
                ${state.data.map(item => `
                  <tr>
                    <td>${item.tahun}</td>
                    <td>${item.master_work_units?.name || '-'}</td>
                    <td><span class="badge-status badge-${getKategoriColor(item.kategori)}">${item.kategori}</span></td>
                    <td>${item.deskripsi}</td>
                    <td>${item.rencana_strategis?.nama_rencana || '-'}</td>
                    <td>
                      <button class="btn btn-edit btn-sm" onclick="InventarisasiSwotModule.edit('${item.id}')">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-delete btn-sm" onclick="InventarisasiSwotModule.delete('${item.id}')">
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

  function getKategoriColor(kategori) {
    const colors = {
      'Kekuatan': 'aman',
      'Kelemahan': 'hati-hati',
      'Peluang': 'normal',
      'Tantangan': 'kritis'
    };
    return colors[kategori] || 'secondary';
  }

  async function applyFilter() {
    state.filters.rencana_strategis_id = document.getElementById('filter-rencana-strategis')?.value || '';
    state.filters.unit_kerja_id = document.getElementById('filter-unit-kerja')?.value || '';
    state.filters.kategori = document.getElementById('filter-kategori')?.value || '';
    state.filters.tahun = parseInt(document.getElementById('filter-tahun')?.value || new Date().getFullYear());
    await fetchInitialData();
    render();
  }

  function showModal(id = null) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    
    const rencanaOptions = state.rencanaStrategis.length > 0 
      ? state.rencanaStrategis.map(r => `<option value="${r.id}">${r.kode || ''} - ${r.nama_rencana}</option>`).join('')
      : '<option value="" disabled>Tidak ada data rencana strategis</option>';
    
    const unitOptions = state.unitKerja.length > 0
      ? state.unitKerja.map(u => `<option value="${u.id}">${u.name}</option>`).join('')
      : '<option value="" disabled>Tidak ada data unit kerja</option>';
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
          <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Inventarisasi SWOT</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form id="inventarisasi-swot-form" onsubmit="InventarisasiSwotModule.save(event, '${id || ''}')">
          <div class="form-group">
            <label class="form-label">Rencana Strategis</label>
            <select class="form-control" id="is-rencana-strategis" onchange="InventarisasiSwotModule.updatePreview()">
              <option value="">Pilih Rencana Strategis (Opsional)</option>
              ${rencanaOptions}
            </select>
            ${state.rencanaStrategis.length === 0 ? '<small style="color: var(--danger);">Silakan tambahkan Rencana Strategis terlebih dahulu di menu Rencana Strategis</small>' : ''}
          </div>
          <div class="form-group">
            <label class="form-label">Unit Kerja *</label>
            <select class="form-control" id="is-unit-kerja" required onchange="InventarisasiSwotModule.updatePreview()">
              <option value="">Pilih Unit Kerja</option>
              ${unitOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Kategori *</label>
            <select class="form-control" id="is-kategori" required onchange="InventarisasiSwotModule.updatePreview()">
              <option value="">Pilih Kategori</option>
              <option value="Kekuatan">Kekuatan</option>
              <option value="Kelemahan">Kelemahan</option>
              <option value="Peluang">Peluang</option>
              <option value="Tantangan">Tantangan</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tahun *</label>
            <input type="number" class="form-control" id="is-tahun" required value="${new Date().getFullYear()}" onchange="InventarisasiSwotModule.updatePreview()">
          </div>
          <div class="form-group">
            <label class="form-label">Deskripsi *</label>
            <textarea class="form-control" id="is-deskripsi" required rows="4" oninput="InventarisasiSwotModule.updatePreview()"></textarea>
          </div>
          
          <!-- Collapsible Preview Section -->
          <div class="preview-section" style="margin: 1.5rem 0; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
            <div class="preview-header" onclick="InventarisasiSwotModule.togglePreview()" style="background: #f8f9fa; padding: 1rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
              <h4 style="margin: 0; font-size: 1rem; font-weight: 600;">📋 Preview Data</h4>
              <i class="fas fa-chevron-down" id="preview-toggle-icon" style="transition: transform 0.3s;"></i>
            </div>
            <div id="preview-content" class="preview-content" style="padding: 1rem; background: #fff; display: none;">
              <div class="preview-item" style="margin-bottom: 0.75rem;">
                <strong style="color: #6c757d; font-size: 0.875rem;">Rencana Strategis:</strong>
                <div id="preview-rencana" style="margin-top: 0.25rem; color: #495057;">-</div>
              </div>
              <div class="preview-item" style="margin-bottom: 0.75rem;">
                <strong style="color: #6c757d; font-size: 0.875rem;">Unit Kerja:</strong>
                <div id="preview-unit" style="margin-top: 0.25rem; color: #495057;">-</div>
              </div>
              <div class="preview-item" style="margin-bottom: 0.75rem;">
                <strong style="color: #6c757d; font-size: 0.875rem;">Kategori:</strong>
                <div id="preview-kategori" style="margin-top: 0.25rem;">-</div>
              </div>
              <div class="preview-item" style="margin-bottom: 0.75rem;">
                <strong style="color: #6c757d; font-size: 0.875rem;">Tahun:</strong>
                <div id="preview-tahun" style="margin-top: 0.25rem; color: #495057;">-</div>
              </div>
              <div class="preview-item">
                <strong style="color: #6c757d; font-size: 0.875rem;">Deskripsi:</strong>
                <div id="preview-deskripsi" style="margin-top: 0.25rem; color: #495057; white-space: pre-wrap;">-</div>
              </div>
            </div>
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
    } else {
      // Initialize preview for new entry
      updatePreview();
    }
  }

  async function loadForEdit(id) {
    try {
      const data = await api()(`/api/inventarisasi-swot/${id}`);
      document.getElementById('is-rencana-strategis').value = data.rencana_strategis_id || '';
      document.getElementById('is-unit-kerja').value = data.unit_kerja_id || '';
      document.getElementById('is-kategori').value = data.kategori || '';
      document.getElementById('is-tahun').value = data.tahun || '';
      document.getElementById('is-deskripsi').value = data.deskripsi || '';
      updatePreview();
    } catch (error) {
      alert('Error loading data: ' + error.message);
    }
  }

  function togglePreview() {
    const content = document.getElementById('preview-content');
    const icon = document.getElementById('preview-toggle-icon');
    
    if (content && icon) {
      const isVisible = content.style.display !== 'none';
      content.style.display = isVisible ? 'none' : 'block';
      icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  }

  function updatePreview() {
    // Get form values
    const rencanaId = document.getElementById('is-rencana-strategis')?.value;
    const unitId = document.getElementById('is-unit-kerja')?.value;
    const kategori = document.getElementById('is-kategori')?.value;
    const tahun = document.getElementById('is-tahun')?.value;
    const deskripsi = document.getElementById('is-deskripsi')?.value;

    // Find selected options
    const rencana = state.rencanaStrategis.find(r => r.id === rencanaId);
    const unit = state.unitKerja.find(u => u.id === unitId);

    // Update preview elements
    const previewRencana = document.getElementById('preview-rencana');
    const previewUnit = document.getElementById('preview-unit');
    const previewKategori = document.getElementById('preview-kategori');
    const previewTahun = document.getElementById('preview-tahun');
    const previewDeskripsi = document.getElementById('preview-deskripsi');

    if (previewRencana) {
      previewRencana.textContent = rencana ? `${rencana.kode || ''} - ${rencana.nama_rencana}` : '-';
    }
    
    if (previewUnit) {
      previewUnit.textContent = unit ? unit.name : '-';
    }
    
    if (previewKategori) {
      const badgeColor = {
        'Kekuatan': 'aman',
        'Kelemahan': 'hati-hati',
        'Peluang': 'normal',
        'Tantangan': 'kritis'
      }[kategori] || 'secondary';
      
      previewKategori.innerHTML = kategori 
        ? `<span class="badge-status badge-${badgeColor}">${kategori}</span>` 
        : '-';
    }
    
    if (previewTahun) {
      previewTahun.textContent = tahun || '-';
    }
    
    if (previewDeskripsi) {
      previewDeskripsi.textContent = deskripsi || '-';
    }
  }

  async function save(e, id) {
    e.preventDefault();
    try {
      const rencanaStrategisValue = document.getElementById('is-rencana-strategis').value;
      const unitKerjaValue = document.getElementById('is-unit-kerja').value;
      
      const data = {
        rencana_strategis_id: rencanaStrategisValue && rencanaStrategisValue.trim() !== '' ? rencanaStrategisValue : null,
        unit_kerja_id: unitKerjaValue && unitKerjaValue.trim() !== '' ? unitKerjaValue : null,
        kategori: document.getElementById('is-kategori').value,
        tahun: parseInt(document.getElementById('is-tahun').value),
        deskripsi: document.getElementById('is-deskripsi').value
      };

      console.log('Saving SWOT inventarisasi:', data);

      if (id) {
        await api()(`/api/inventarisasi-swot/${id}`, { method: 'PUT', body: data });
        alert('Data berhasil diupdate');
      } else {
        await api()('/api/inventarisasi-swot', { method: 'POST', body: data });
        alert('Data berhasil disimpan');
      }

      document.querySelector('.modal').remove();
      await load();
    } catch (error) {
      console.error('Error saving SWOT:', error);
      alert('Error: ' + error.message);
    }
  }

  async function edit(id) {
    showModal(id);
  }

  async function deleteItem(id) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await api()(`/api/inventarisasi-swot/${id}`, { method: 'DELETE' });
      await load();
      alert('Data berhasil dihapus');
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
    delete: deleteItem,
    togglePreview,
    updatePreview
  };
})();

async function loadInventarisasiSwot() {
  await InventarisasiSwotModule.load();
}

window.inventarisasiSwotModule = InventarisasiSwotModule;

