// Indikator Kinerja Utama Module - Updated with new columns from Excel template
const IndikatorKinerjaUtamaModule = (() => {
  const state = {
    data: [],
    rencanaStrategis: [],
    sasaranStrategi: [],
    filters: {
      rencana_strategis_id: '',
      sasaran_strategi_id: '',
      tahun: ''
    }
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);

  async function load() {
    await fetchInitialData();
    render();
  }

  async function fetchInitialData() {
    try {
      console.log('=== FETCHING INDIKATOR KINERJA UTAMA DATA ===');
      const apiUrl = '/api/indikator-kinerja-utama?' + new URLSearchParams(state.filters);
      
      let indikator, rencana, sasaran;
      
      try {
        [indikator, rencana, sasaran] = await Promise.all([
          api()(apiUrl),
          api()('/api/rencana-strategis'),
          api()('/api/sasaran-strategi')
        ]);
      } catch (authError) {
        console.warn('Authenticated API failed, trying public endpoints');
        try {
          [indikator, rencana, sasaran] = await Promise.all([
            api()('/api/indikator-kinerja-utama/public'),
            api()('/api/rencana-strategis/public').catch(() => []),
            api()('/api/sasaran-strategi/public').catch(() => [])
          ]);
        } catch (publicError) {
          [indikator, rencana, sasaran] = await Promise.all([
            api()('/api/indikator-kinerja-utama/debug').then(res => res.data || []),
            api()('/api/rencana-strategis/debug').then(res => res.data || []).catch(() => []),
            api()('/api/sasaran-strategi/debug').then(res => res.data || []).catch(() => [])
          ]);
        }
      }
      
      state.data = indikator || [];
      state.rencanaStrategis = rencana || [];
      state.sasaranStrategi = sasaran || [];
    } catch (error) {
      console.error('Error fetching data:', error);
      state.data = [];
    }
  }

  function render() {
    const container = document.getElementById('indikator-kinerja-utama-content');
    if (!container) return;

    // Add enhanced CSS
    const styleId = 'iku-enhanced-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .iku-table { table-layout: fixed; width: 100%; }
        .iku-table th, .iku-table td { 
          padding: 8px 6px; 
          vertical-align: middle; 
          font-size: 0.75rem;
          border: 1px solid #dee2e6;
        }
        .iku-table thead th {
          background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
          color: white;
          font-weight: 600;
          text-align: center;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .text-truncate-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          max-width: 100%;
        }
        .target-cell { text-align: center; font-size: 0.7rem; }
        .target-cell .value { font-weight: 600; }
      `;
      document.head.appendChild(style);
    }

    container.innerHTML = `
      <div class="card">
        <div class="card-header" style="background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: white;">
          <h3 class="card-title" style="margin: 0;">Indikator Kinerja Utama (IKU)</h3>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-success btn-sm" onclick="IndikatorKinerjaUtamaModule.downloadReport()">
              <i class="fas fa-download"></i> Unduh
            </button>
            <button class="btn btn-light btn-sm" onclick="IndikatorKinerjaUtamaModule.showModal()">
              <i class="fas fa-plus"></i> Tambah
            </button>
          </div>
        </div>
        <div class="card-body">
          ${renderFilters()}
          <div style="overflow-x: auto; max-height: 70vh;">
            <table class="table table-striped table-bordered iku-table" style="min-width: 2000px;">
              <thead>
                <tr>
                  <th style="width: 40px;">No</th>
                  <th style="width: 180px;">Indikator Kinerja Utama</th>
                  <th style="width: 180px;">Formulasi Perhitungan</th>
                  <th style="width: 70px;">Satuan</th>
                  <th style="width: 70px;">Baseline</th>
                  <th style="width: 65px;">2025</th>
                  <th style="width: 65px;">2026</th>
                  <th style="width: 65px;">2027</th>
                  <th style="width: 65px;">2028</th>
                  <th style="width: 65px;">2029</th>
                  <th style="width: 65px;">2030</th>
                  <th style="width: 200px;">Definisi Operasional</th>
                  <th style="width: 120px;">Sumber Data</th>
                  <th style="width: 100px;">PIC</th>
                  <th style="width: 80px;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${renderTableBody()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderFilters() {
    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
        <div class="form-group">
          <label style="font-size: 0.8rem; font-weight: 500;">Rencana Strategis</label>
          <select class="form-control form-control-sm" id="filter-rencana-strategis" onchange="IndikatorKinerjaUtamaModule.applyFilter()">
            <option value="">Semua</option>
            ${state.rencanaStrategis.map(r => `<option value="${r.id}" ${state.filters.rencana_strategis_id === r.id ? 'selected' : ''}>${r.nama_rencana}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label style="font-size: 0.8rem; font-weight: 500;">Sasaran Strategi</label>
          <select class="form-control form-control-sm" id="filter-sasaran-strategi" onchange="IndikatorKinerjaUtamaModule.applyFilter()">
            <option value="">Semua</option>
            ${state.sasaranStrategi.map(s => `<option value="${s.id}" ${state.filters.sasaran_strategi_id === s.id ? 'selected' : ''}>${(s.sasaran || '').substring(0, 50)}...</option>`).join('')}
          </select>
        </div>
      </div>
    `;
  }

  function renderTableBody() {
    if (state.data.length === 0) {
      return '<tr><td colspan="15" class="text-center text-muted">Tidak ada data</td></tr>';
    }

    return state.data.map((item, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td title="${item.indikator || ''}">
          <div class="text-truncate-2">${item.indikator || '-'}</div>
        </td>
        <td title="${item.formulas_perhitungan || ''}">
          <div class="text-truncate-2">${item.formulas_perhitungan || '-'}</div>
        </td>
        <td style="text-align: center;">${item.satuan || '-'}</td>
        <td class="target-cell">
          <div class="value">${item.baseline_nilai || '-'}</div>
        </td>
        <td class="target-cell">
          <div class="value">${item.target_2025 || '-'}</div>
        </td>
        <td class="target-cell">
          <div class="value">${item.target_2026 || '-'}</div>
        </td>
        <td class="target-cell">
          <div class="value">${item.target_2027 || '-'}</div>
        </td>
        <td class="target-cell">
          <div class="value">${item.target_2028 || '-'}</div>
        </td>
        <td class="target-cell">
          <div class="value">${item.target_2029 || '-'}</div>
        </td>
        <td class="target-cell">
          <div class="value">${item.target_2030 || '-'}</div>
        </td>
        <td title="${item.definisi_operasional || ''}">
          <div class="text-truncate-2">${item.definisi_operasional || '-'}</div>
        </td>
        <td title="${item.sumber_data || ''}">
          <div class="text-truncate-2">${item.sumber_data || '-'}</div>
        </td>
        <td style="text-align: center;">${item.pic || '-'}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 4px; justify-content: center;">
            <button class="btn btn-info btn-sm" onclick="IndikatorKinerjaUtamaModule.edit('${item.id}')" title="Edit" style="padding: 2px 6px;">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="IndikatorKinerjaUtamaModule.delete('${item.id}')" title="Hapus" style="padding: 2px 6px;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function applyFilter() {
    state.filters.rencana_strategis_id = document.getElementById('filter-rencana-strategis')?.value || '';
    state.filters.sasaran_strategi_id = document.getElementById('filter-sasaran-strategi')?.value || '';
    await fetchInitialData();
    render();
  }

  function showModal(id = null) {
    // Remove existing modals
    document.querySelectorAll('.modal, #dataModal, #iku-edit-modal').forEach(m => m.remove());
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'iku-edit-modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto; background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        <div class="modal-header" style="padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: white; border-radius: 12px 12px 0 0;">
          <h4 style="margin: 0;">${id ? 'Edit' : 'Tambah'} Indikator Kinerja Utama</h4>
          <button class="modal-close" type="button" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: white;">&times;</button>
        </div>
        <form id="iku-form" onsubmit="IndikatorKinerjaUtamaModule.save(event, '${id || ''}')" style="padding: 1.5rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
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
                <option value="">Pilih Sasaran (Opsional)</option>
                ${state.sasaranStrategi.map(s => `<option value="${s.id}">${(s.sasaran || '').substring(0, 60)}</option>`).join('')}
              </select>
            </div>
          </div>
          
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label">Indikator Kinerja Utama *</label>
            <textarea class="form-control" id="iku-indikator" required rows="2"></textarea>
          </div>
          
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label">Formulasi Perhitungan</label>
            <textarea class="form-control" id="iku-formulas-perhitungan" rows="2" placeholder="Contoh: (Tindakan benar / total observasi) x 100%"></textarea>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
            <div class="form-group">
              <label class="form-label">Satuan</label>
              <input type="text" class="form-control" id="iku-satuan" placeholder="%, Paripurna, dll">
            </div>
            <div class="form-group">
              <label class="form-label">Baseline</label>
              <input type="number" class="form-control" id="iku-baseline-nilai" step="0.01">
            </div>
          </div>
          
          <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px;">
            <label class="form-label" style="font-weight: 600; margin-bottom: 0.5rem;">Target per Tahun</label>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.5rem;">
              <div class="form-group">
                <label style="font-size: 0.75rem;">2025</label>
                <input type="number" class="form-control form-control-sm" id="iku-target-2025" step="0.01">
              </div>
              <div class="form-group">
                <label style="font-size: 0.75rem;">2026</label>
                <input type="number" class="form-control form-control-sm" id="iku-target-2026" step="0.01">
              </div>
              <div class="form-group">
                <label style="font-size: 0.75rem;">2027</label>
                <input type="number" class="form-control form-control-sm" id="iku-target-2027" step="0.01">
              </div>
              <div class="form-group">
                <label style="font-size: 0.75rem;">2028</label>
                <input type="number" class="form-control form-control-sm" id="iku-target-2028" step="0.01">
              </div>
              <div class="form-group">
                <label style="font-size: 0.75rem;">2029</label>
                <input type="number" class="form-control form-control-sm" id="iku-target-2029" step="0.01">
              </div>
              <div class="form-group">
                <label style="font-size: 0.75rem;">2030</label>
                <input type="number" class="form-control form-control-sm" id="iku-target-2030" step="0.01">
              </div>
            </div>
          </div>
          
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label">Definisi Operasional</label>
            <textarea class="form-control" id="iku-definisi-operasional" rows="2"></textarea>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
            <div class="form-group">
              <label class="form-label">Sumber Data</label>
              <input type="text" class="form-control" id="iku-sumber-data">
            </div>
            <div class="form-group">
              <label class="form-label">PIC</label>
              <input type="text" class="form-control" id="iku-pic">
            </div>
          </div>
          
          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
            <button type="button" class="btn btn-secondary btn-cancel">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Modal styles
    if (!document.getElementById('iku-modal-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'iku-modal-styles';
      styleEl.textContent = `
        #iku-edit-modal {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0,0,0,0.5); display: flex;
          align-items: center; justify-content: center; z-index: 9999;
        }
      `;
      document.head.appendChild(styleEl);
    }

    // Close handlers
    const closeHandler = (e) => { e.preventDefault(); modal.remove(); };
    modal.querySelector('.modal-close').addEventListener('click', closeHandler);
    modal.querySelector('.btn-cancel').addEventListener('click', closeHandler);

    if (id) {
      const data = state.data.find(item => item.id === id);
      if (data) populateForm(data);
      else fetchAndPopulateForm(id);
    }
  }

  function populateForm(data) {
    const fields = [
      { id: 'iku-rencana-strategis', value: data.rencana_strategis_id },
      { id: 'iku-sasaran-strategi', value: data.sasaran_strategi_id },
      { id: 'iku-indikator', value: data.indikator },
      { id: 'iku-formulas-perhitungan', value: data.formulas_perhitungan },
      { id: 'iku-satuan', value: data.satuan },
      { id: 'iku-baseline-nilai', value: data.baseline_nilai },
      { id: 'iku-target-2025', value: data.target_2025 },
      { id: 'iku-target-2026', value: data.target_2026 },
      { id: 'iku-target-2027', value: data.target_2027 },
      { id: 'iku-target-2028', value: data.target_2028 },
      { id: 'iku-target-2029', value: data.target_2029 },
      { id: 'iku-target-2030', value: data.target_2030 },
      { id: 'iku-definisi-operasional', value: data.definisi_operasional },
      { id: 'iku-sumber-data', value: data.sumber_data },
      { id: 'iku-pic', value: data.pic }
    ];

    fields.forEach(({ id, value }) => {
      const el = document.getElementById(id);
      if (el && value !== null && value !== undefined) el.value = value;
    });
  }

  async function fetchAndPopulateForm(id) {
    try {
      const data = await api()(`/api/indikator-kinerja-utama/${id}`);
      populateForm(data);
    } catch (error) {
      alert('Gagal memuat data: ' + error.message);
    }
  }

  async function save(e, id) {
    e.preventDefault();
    try {
      const data = {
        rencana_strategis_id: document.getElementById('iku-rencana-strategis').value,
        sasaran_strategi_id: document.getElementById('iku-sasaran-strategi').value || null,
        indikator: document.getElementById('iku-indikator').value,
        formulas_perhitungan: document.getElementById('iku-formulas-perhitungan').value || null,
        satuan: document.getElementById('iku-satuan').value || null,
        baseline_nilai: document.getElementById('iku-baseline-nilai').value ? parseFloat(document.getElementById('iku-baseline-nilai').value) : null,
        target_2025: document.getElementById('iku-target-2025').value ? parseFloat(document.getElementById('iku-target-2025').value) : null,
        target_2026: document.getElementById('iku-target-2026').value ? parseFloat(document.getElementById('iku-target-2026').value) : null,
        target_2027: document.getElementById('iku-target-2027').value ? parseFloat(document.getElementById('iku-target-2027').value) : null,
        target_2028: document.getElementById('iku-target-2028').value ? parseFloat(document.getElementById('iku-target-2028').value) : null,
        target_2029: document.getElementById('iku-target-2029').value ? parseFloat(document.getElementById('iku-target-2029').value) : null,
        target_2030: document.getElementById('iku-target-2030').value ? parseFloat(document.getElementById('iku-target-2030').value) : null,
        definisi_operasional: document.getElementById('iku-definisi-operasional').value || null,
        sumber_data: document.getElementById('iku-sumber-data').value || null,
        pic: document.getElementById('iku-pic').value || null
      };

      if (id) {
        await api()(`/api/indikator-kinerja-utama/${id}`, { method: 'PUT', body: data });
      } else {
        await api()('/api/indikator-kinerja-utama', { method: 'POST', body: data });
      }

      document.getElementById('iku-edit-modal')?.remove();
      await load();
      alert('Data berhasil disimpan');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  async function edit(id) { showModal(id); }

  async function deleteItem(id) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await api()(`/api/indikator-kinerja-utama/${id}`, { method: 'DELETE' });
      await load();
      alert('Data berhasil dihapus');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  async function downloadReport() {
    try {
      // Fetch ALL data from database (ignore current filters)
      let fullData;
      try {
        fullData = await api()('/api/indikator-kinerja-utama');
      } catch (e) {
        try {
          fullData = await api()('/api/indikator-kinerja-utama/public');
        } catch (e2) {
          const res = await api()('/api/indikator-kinerja-utama/debug');
          fullData = res.data || [];
        }
      }

      if (!fullData || fullData.length === 0) {
        alert('Tidak ada data untuk diunduh');
        return;
      }

      console.log(`Downloading ${fullData.length} records with all database fields`);

      // Prepare complete data with ALL fields from database
      const excelData = fullData.map((item, index) => ({
        'No': index + 1,
        'Rencana Strategis': item.rencana_strategis?.nama_rencana || '-',
        'Kode Renstra': item.rencana_strategis?.kode || '-',
        'Sasaran Strategi': item.sasaran_strategi?.sasaran || '-',
        'Perspektif': item.sasaran_strategi?.perspektif || '-',
        'Indikator Kinerja Utama': item.indikator || '-',
        'Formulasi Perhitungan': item.formulas_perhitungan || '-',
        'Satuan': item.satuan || '-',
        'Baseline Tahun': item.baseline_tahun || '-',
        'Baseline Nilai': item.baseline_nilai || '-',
        'Target 2025': item.target_2025 || '-',
        'Target 2026': item.target_2026 || '-',
        'Target 2027': item.target_2027 || '-',
        'Target 2028': item.target_2028 || '-',
        'Target 2029': item.target_2029 || '-',
        'Target 2030': item.target_2030 || '-',
        'Target Tahun (Legacy)': item.target_tahun || '-',
        'Target Nilai (Legacy)': item.target_nilai || '-',
        'Definisi Operasional': item.definisi_operasional || '-',
        'Sumber Data': item.sumber_data || '-',
        'Initiatif Strategi': item.initiatif_strategi || '-',
        'PIC': item.pic || '-',
        'Tanggal Dibuat': item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-',
        'Terakhir Diupdate': item.updated_at ? new Date(item.updated_at).toLocaleDateString('id-ID') : '-'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for all columns
      ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 30 },  // Rencana Strategis
        { wch: 12 },  // Kode Renstra
        { wch: 40 },  // Sasaran Strategi
        { wch: 15 },  // Perspektif
        { wch: 40 },  // Indikator Kinerja Utama
        { wch: 35 },  // Formulasi Perhitungan
        { wch: 12 },  // Satuan
        { wch: 12 },  // Baseline Tahun
        { wch: 12 },  // Baseline Nilai
        { wch: 10 },  // Target 2025
        { wch: 10 },  // Target 2026
        { wch: 10 },  // Target 2027
        { wch: 10 },  // Target 2028
        { wch: 10 },  // Target 2029
        { wch: 10 },  // Target 2030
        { wch: 12 },  // Target Tahun (Legacy)
        { wch: 12 },  // Target Nilai (Legacy)
        { wch: 40 },  // Definisi Operasional
        { wch: 25 },  // Sumber Data
        { wch: 35 },  // Initiatif Strategi
        { wch: 20 },  // PIC
        { wch: 15 },  // Tanggal Dibuat
        { wch: 15 }   // Terakhir Diupdate
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Indikator Kinerja Utama');
      
      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Laporan_IKU_Lengkap_${timestamp}.xlsx`);
      alert(`Laporan lengkap berhasil diunduh!\nTotal: ${fullData.length} data dengan semua kolom database.`);
    } catch (error) {
      console.error('Download error:', error);
      alert('Gagal mengunduh: ' + error.message);
    }
  }

  return { load, showModal, applyFilter, save, edit, delete: deleteItem, downloadReport };
})();

async function loadIndikatorKinerjaUtama() { await IndikatorKinerjaUtamaModule.load(); }
window.indikatorKinerjaUtamaModule = IndikatorKinerjaUtamaModule;
