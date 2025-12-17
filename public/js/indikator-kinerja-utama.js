// Indikator Kinerja Utama Module
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
      console.log('Current filters:', state.filters);
      
      const apiUrl = '/api/indikator-kinerja-utama?' + new URLSearchParams(state.filters);
      console.log('API URL:', apiUrl);
      
      let indikator, rencana, sasaran;
      
      try {
        // Try authenticated endpoints first
        [indikator, rencana, sasaran] = await Promise.all([
          api()(apiUrl),
          api()('/api/rencana-strategis'),
          api()('/api/sasaran-strategi')
        ]);
        console.log('Authenticated API success');
      } catch (authError) {
        console.warn('Authenticated API failed, trying public endpoints:', authError.message);
        
        // Fallback to public endpoints
        try {
          [indikator, rencana, sasaran] = await Promise.all([
            api()('/api/indikator-kinerja-utama/public'),
            api()('/api/rencana-strategis/public').catch(() => []),
            api()('/api/sasaran-strategi/public').catch(() => [])
          ]);
          console.log('Public API success');
        } catch (publicError) {
          console.warn('Public API failed, trying debug endpoints:', publicError.message);
          
          // Final fallback to debug endpoints
          try {
            [indikator, rencana, sasaran] = await Promise.all([
              api()('/api/indikator-kinerja-utama/debug').then(res => res.data || []),
              api()('/api/rencana-strategis/debug').then(res => res.data || []).catch(() => []),
              api()('/api/sasaran-strategi/debug').then(res => res.data || []).catch(() => [])
            ]);
            console.log('Debug API success');
          } catch (debugError) {
            console.error('All APIs failed:', debugError.message);
            throw new Error('Tidak dapat memuat data. Silakan refresh halaman atau hubungi administrator.');
          }
        }
      }
      
      console.log('API responses:', {
        indikator: { count: indikator?.length || 0, isArray: Array.isArray(indikator) },
        rencana: { count: rencana?.length || 0, isArray: Array.isArray(rencana) },
        sasaran: { count: sasaran?.length || 0, isArray: Array.isArray(sasaran) }
      });
      
      state.data = indikator || [];
      state.rencanaStrategis = rencana || [];
      state.sasaranStrategi = sasaran || [];
      
      console.log('State updated:', {
        dataCount: state.data.length,
        rencanaCount: state.rencanaStrategis.length,
        sasaranCount: state.sasaranStrategi.length
      });
      console.log('=== END FETCH ===');
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      state.data = [];
      state.rencanaStrategis = [];
      state.sasaranStrategi = [];
      
      // Show error message in UI
      const container = document.getElementById('indikator-kinerja-utama-content');
      if (container) {
        container.innerHTML = `
          <div class="card">
            <div class="card-body">
              <h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error memuat data</h5>
              <p>${error.message}</p>
              <button onclick="IndikatorKinerjaUtamaModule.load()" class="btn btn-primary">Coba Lagi</button>
            </div>
          </div>
        `;
      }
    }
  }

  function render() {
    console.log('=== RENDERING INDIKATOR KINERJA UTAMA ===');
    console.log('Render data:', {
      dataCount: state.data.length,
      rencanaCount: state.rencanaStrategis.length,
      sasaranCount: state.sasaranStrategi.length,
      sampleData: state.data.length > 0 ? state.data[0] : null
    });
    
    const container = document.getElementById('indikator-kinerja-utama-content');
    if (!container) {
      console.error('Container not found: indikator-kinerja-utama-content');
      return;
    }

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Indikator Kinerja Utama (KPI)</h3>
          <div class="card-header-actions" style="display: flex; gap: 0.5rem;">
            <button class="btn btn-success" onclick="IndikatorKinerjaUtamaModule.downloadReport()">
              <i class="fas fa-download"></i> Unduh Laporan
            </button>
            <button class="btn btn-primary" onclick="IndikatorKinerjaUtamaModule.showModal()">
              <i class="fas fa-plus"></i> Tambah Indikator
            </button>
          </div>
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
            <div class="form-group">
              <label>Filter Tahun</label>
              <select class="form-control" id="filter-tahun" onchange="IndikatorKinerjaUtamaModule.applyFilter()">
                <option value="">Semua Tahun</option>
                ${generateYearOptions()}
              </select>
            </div>
          </div>
          <div class="table-container" style="overflow-x: auto; max-width: 100%;">
            <div class="table-responsive">
              <table class="table table-striped" style="min-width: 1200px; table-layout: fixed;">
                <thead>
                  <tr>
                    <th style="width: 40px;">No</th>
                    <th style="width: 180px;">Rencana Strategis</th>
                    <th style="width: 180px;">Sasaran Strategi</th>
                    <th style="width: 200px;">Indikator</th>
                    <th style="width: 120px;">Baseline</th>
                    <th style="width: 120px;">Target</th>
                    <th style="width: 100px;">Progress</th>
                    <th style="width: 100px;">PIC</th>
                    <th style="width: 120px;">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.data.length === 0 ? '<tr><td colspan="9" class="text-center">Tidak ada data</td></tr>' : ''}
                  ${state.data.map((item, index) => {
                    const progress = calculateProgress(item);
                    const progressClass = progress > 0 ? 'text-success' : progress < 0 ? 'text-danger' : 'text-muted';
                    return `
                    <tr>
                      <td style="text-align: center;">${index + 1}</td>
                      <td style="word-wrap: break-word; overflow: hidden;" title="${item.rencana_strategis?.nama_rencana || '-'}">
                        <div style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${item.rencana_strategis?.nama_rencana || '-'}
                        </div>
                      </td>
                      <td style="word-wrap: break-word; overflow: hidden;" title="${item.sasaran_strategi?.sasaran || '-'}">
                        <div style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${item.sasaran_strategi?.sasaran || '-'}
                        </div>
                      </td>
                      <td style="word-wrap: break-word; overflow: hidden;" title="${item.indikator}">
                        <div style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${item.indikator}
                        </div>
                      </td>
                      <td style="text-align: center;">
                        <div style="font-size: 0.85em;">
                          <div><strong>${item.baseline_nilai || '-'}</strong></div>
                          <div style="color: #666; font-size: 0.8em;">(${item.baseline_tahun || '-'})</div>
                        </div>
                      </td>
                      <td style="text-align: center;">
                        <div style="font-size: 0.85em;">
                          <div><strong>${item.target_nilai || '-'}</strong></div>
                          <div style="color: #666; font-size: 0.8em;">(${item.target_tahun || '-'})</div>
                        </div>
                      </td>
                      <td style="text-align: center;">
                        <span class="badge ${progress !== null && progress > 0 ? 'badge-success' : progress !== null && progress < 0 ? 'badge-danger' : 'badge-secondary'}" style="font-size: 0.8em; padding: 4px 8px;">
                          ${progress !== null ? progress.toFixed(1) + '%' : '-'}
                        </span>
                      </td>
                      <td style="word-wrap: break-word; overflow: hidden;" title="${item.pic || '-'}">
                        <div style="max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${item.pic || '-'}
                        </div>
                      </td>
                      <td style="text-align: center;">
                        <div style="display: flex; gap: 4px; justify-content: center;">
                          <button class="btn btn-edit btn-sm" onclick="IndikatorKinerjaUtamaModule.edit('${item.id}')" title="Edit" style="padding: 4px 8px; font-size: 0.8em;">
                            <i class="fas fa-edit"></i>
                          </button>
                          <button class="btn btn-delete btn-sm" onclick="IndikatorKinerjaUtamaModule.delete('${item.id}')" title="Hapus" style="padding: 4px 8px; font-size: 0.8em;">
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function calculateProgress(item) {
    console.log('Calculating progress for:', {
      baseline_nilai: item.baseline_nilai,
      target_nilai: item.target_nilai,
      baseline_type: typeof item.baseline_nilai,
      target_type: typeof item.target_nilai
    });
    
    if (!item.baseline_nilai || !item.target_nilai) {
      console.log('Missing baseline or target values');
      return null;
    }
    
    const baseline = parseFloat(item.baseline_nilai);
    const target = parseFloat(item.target_nilai);
    
    console.log('Parsed values:', { baseline, target });
    
    if (isNaN(baseline) || isNaN(target)) {
      console.log('Invalid numeric values');
      return null;
    }
    
    if (baseline === 0) {
      return target > 0 ? 100 : 0;
    }
    
    const progress = ((target - baseline) / baseline) * 100;
    console.log('Calculated progress:', progress);
    return progress;
  }

  function generateYearOptions() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      years.push(`<option value="${year}" ${state.filters.tahun == year ? 'selected' : ''}>${year}</option>`);
    }
    return years.join('');
  }

  async function applyFilter() {
    state.filters.rencana_strategis_id = document.getElementById('filter-rencana-strategis')?.value || '';
    state.filters.sasaran_strategi_id = document.getElementById('filter-sasaran-strategi')?.value || '';
    state.filters.tahun = document.getElementById('filter-tahun')?.value || '';
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

  async function downloadReport() {
    try {
      if (state.data.length === 0) {
        alert('Tidak ada data untuk diunduh');
        return;
      }

      // Prepare data for Excel
      const excelData = state.data.map((item, index) => ({
        'No': index + 1,
        'Rencana Strategis': item.rencana_strategis?.nama_rencana || '-',
        'Sasaran Strategi': item.sasaran_strategi?.sasaran || '-',
        'Perspektif': item.sasaran_strategi?.perspektif || '-',
        'Indikator': item.indikator,
        'Baseline Tahun': item.baseline_tahun || '-',
        'Baseline Nilai': item.baseline_nilai || '-',
        'Target Tahun': item.target_tahun || '-',
        'Target Nilai': item.target_nilai || '-',
        'Initiatif Strategi': item.initiatif_strategi || '-',
        'PIC': item.pic || '-',
        'Tanggal Dibuat': new Date(item.created_at).toLocaleDateString('id-ID'),
        'Terakhir Diupdate': new Date(item.updated_at).toLocaleDateString('id-ID')
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Auto-width columns
      const colWidths = [
        { wch: 5 },   // No
        { wch: 25 },  // Rencana Strategis
        { wch: 30 },  // Sasaran Strategi
        { wch: 15 },  // Perspektif
        { wch: 35 },  // Indikator
        { wch: 15 },  // Baseline Tahun
        { wch: 15 },  // Baseline Nilai
        { wch: 15 },  // Target Tahun
        { wch: 15 },  // Target Nilai
        { wch: 35 },  // Initiatif Strategi
        { wch: 20 },  // PIC
        { wch: 15 },  // Tanggal Dibuat
        { wch: 15 }   // Terakhir Diupdate
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Indikator Kinerja Utama');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `Laporan_Indikator_Kinerja_Utama_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      alert('Laporan berhasil diunduh!');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Gagal mengunduh laporan: ' + error.message);
    }
  }

  return {
    load,
    showModal,
    applyFilter,
    save,
    edit,
    delete: deleteItem,
    downloadReport
  };
})();

async function loadIndikatorKinerjaUtama() {
  await IndikatorKinerjaUtamaModule.load();
}

window.indikatorKinerjaUtamaModule = IndikatorKinerjaUtamaModule;

