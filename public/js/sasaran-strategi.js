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
      
      console.log('Sasaran Strategi Data:', sasaran);
      console.log('Rencana Strategis Data:', rencana);
      console.log('TOWS Data:', tows);
      
      state.data = sasaran || [];
      state.rencanaStrategis = rencana || [];
      state.towsStrategi = tows || [];
      
      // Debug: Check first item
      if (state.data.length > 0) {
        console.log('First sasaran item:', state.data[0]);
        console.log('Perspektif value:', state.data[0].perspektif);
        console.log('TOWS relation:', state.data[0].swot_tows_strategi);
      }
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
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-info" onclick="SasaranStrategiModule.autoCorrelate()" title="Korelasikan otomatis dengan TOWS Strategi menggunakan AI">
              <i class="fas fa-magic"></i> Auto Korelasi AI
            </button>
            <button class="btn btn-success" onclick="SasaranStrategiModule.downloadReport()">
              <i class="fas fa-download"></i> Unduh Laporan
            </button>
            <button class="btn btn-primary" onclick="SasaranStrategiModule.showModal()">
              <i class="fas fa-plus"></i> Tambah Sasaran
            </button>
          </div>
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
                ${state.towsStrategi.map(t => `
                  <option value="${t.id}" ${state.filters.tows_strategi_id === t.id ? 'selected' : ''} title="${t.strategi}">
                    ${t.tipe_strategi}: ${t.strategi.length > 40 ? t.strategi.substring(0, 40) + '...' : t.strategi}
                  </option>
                `).join('')}
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
          <div class="table-container" style="overflow-x: auto;">
            <table class="table" style="min-width: 800px;">
              <thead>
                <tr>
                  <th style="width: 20%; min-width: 150px;">Rencana Strategis</th>
                  <th style="width: 30%; min-width: 200px;">Sasaran</th>
                  <th style="width: 15%; min-width: 120px;">Perspektif</th>
                  <th style="width: 25%; min-width: 200px;">TOWS Strategi</th>
                  <th style="width: 10%; min-width: 80px;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.length === 0 ? '<tr><td colspan="5" class="text-center">Tidak ada data</td></tr>' : ''}
                ${state.data.map(item => `
                  <tr>
                    <td>${item.rencana_strategis?.nama_rencana || '-'}</td>
                    <td>${item.sasaran}</td>
                    <td>
                      ${item.perspektif ? `
                        <span class="badge badge-${getPerspektifColor(item.perspektif)}" style="
                          display: inline-block;
                          padding: 0.25rem 0.5rem;
                          font-size: 0.75rem;
                          font-weight: 600;
                          border-radius: 0.25rem;
                          text-align: center;
                          white-space: nowrap;
                          ${getBadgeStyle(getPerspektifColor(item.perspektif))}
                        ">
                          ${getPerspektifLabel(item.perspektif)}
                        </span>
                      ` : '<span style="color: #999; font-style: italic;">Tidak ada perspektif</span>'}
                    </td>
                    <td>
                      ${item.swot_tows_strategi ? 
                        `<div style="max-width: 300px;">
                          <span class="badge" style="
                            display: inline-block;
                            padding: 0.2rem 0.4rem;
                            font-size: 0.7rem;
                            font-weight: 600;
                            border-radius: 0.2rem;
                            margin-bottom: 0.25rem;
                            ${getTowsBadgeStyle(item.swot_tows_strategi.tipe_strategi)}
                          ">${item.swot_tows_strategi.tipe_strategi}</span><br>
                          <small style="color: #666; line-height: 1.3;">
                            ${item.swot_tows_strategi.strategi.length > 80 ? 
                              item.swot_tows_strategi.strategi.substring(0, 80) + '...' : 
                              item.swot_tows_strategi.strategi}
                          </small>
                        </div>` : 
                        '<span style="color: #999; font-style: italic;">Tidak terkait TOWS</span>'
                      }
                    </td>
                    <td>
                      <button class="btn btn-edit btn-sm" onclick="SasaranStrategiModule.edit('${item.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-delete btn-sm" onclick="SasaranStrategiModule.delete('${item.id}')" title="Hapus">
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
      'ES': 'info',      // Biru untuk Eksternal Stakeholder
      'IBP': 'success',  // Hijau untuk Internal Business Process
      'LG': 'warning',   // Kuning untuk Learning & Growth
      'Fin': 'danger'    // Merah untuk Financial
    };
    return colors[perspektif] || 'secondary';
  }

  function getBadgeStyle(colorType) {
    const styles = {
      'info': 'background-color: #17a2b8; color: white;',
      'success': 'background-color: #28a745; color: white;',
      'warning': 'background-color: #ffc107; color: #212529;',
      'danger': 'background-color: #dc3545; color: white;',
      'secondary': 'background-color: #6c757d; color: white;'
    };
    return styles[colorType] || styles.secondary;
  }

  function getTowsBadgeStyle(tipeStrategi) {
    const styles = {
      'SO': 'background-color: #28a745; color: white;',  // Hijau untuk Strengths-Opportunities
      'WO': 'background-color: #17a2b8; color: white;',  // Biru untuk Weaknesses-Opportunities
      'ST': 'background-color: #ffc107; color: #212529;', // Kuning untuk Strengths-Threats
      'WT': 'background-color: #dc3545; color: white;'   // Merah untuk Weaknesses-Threats
    };
    return styles[tipeStrategi] || 'background-color: #6c757d; color: white;';
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
              ${state.towsStrategi.map(t => `
                <option value="${t.id}" title="${t.strategi}">
                  ${t.tipe_strategi}: ${t.strategi.length > 60 ? t.strategi.substring(0, 60) + '...' : t.strategi}
                </option>
              `).join('')}
            </select>
            <small class="form-text text-muted">Pilih strategi TOWS yang relevan dengan sasaran ini (opsional)</small>
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

  async function downloadReport() {
    try {
      // Fetch report data from backend
      const reportData = await api()('/api/sasaran-strategi/report');
      
      if (!reportData || reportData.length === 0) {
        alert('Tidak ada data untuk diunduh');
        return;
      }

      // Prepare data for Excel
      const excelData = reportData.map(item => ({
        'No': item.no,
        'Rencana Strategis': item.rencana_strategis,
        'Sasaran': item.sasaran,
        'Perspektif': getPerspektifLabel(item.perspektif),
        'Tipe TOWS': item.tipe_tows,
        'Strategi TOWS': item.strategi_tows,
        'Tanggal Dibuat': new Date(item.created_at).toLocaleDateString('id-ID'),
        'Terakhir Diupdate': new Date(item.updated_at).toLocaleDateString('id-ID')
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 5 },   // No
        { wch: 25 },  // Rencana Strategis
        { wch: 40 },  // Sasaran
        { wch: 20 },  // Perspektif
        { wch: 10 },  // Tipe TOWS
        { wch: 50 },  // Strategi TOWS
        { wch: 15 },  // Tanggal Dibuat
        { wch: 15 }   // Terakhir Diupdate
      ];
      ws['!cols'] = colWidths;

      // Add title row
      XLSX.utils.sheet_add_aoa(ws, [['LAPORAN SASARAN STRATEGI']], { origin: 'A1' });
      XLSX.utils.sheet_add_aoa(ws, [['Tanggal Cetak: ' + new Date().toLocaleDateString('id-ID')]], { origin: 'A2' });
      XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A3' }); // Empty row

      // Merge title cells
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }  // Date
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Sasaran Strategi');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `Laporan_Sasaran_Strategi_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      alert('Laporan berhasil diunduh!');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Gagal mengunduh laporan: ' + error.message);
    }
  }

  async function autoCorrelate() {
    if (!confirm('Apakah Anda yakin ingin mengkorelasikan sasaran strategi dengan TOWS strategi secara otomatis menggunakan AI?\n\nProses ini akan menghubungkan sasaran yang belum memiliki korelasi TOWS dengan strategi TOWS yang paling relevan.')) {
      return;
    }

    try {
      // Show loading state
      const button = event.target;
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
      button.disabled = true;

      const result = await api()('/api/sasaran-strategi/auto-correlate', { method: 'POST' });
      
      // Restore button
      button.innerHTML = originalText;
      button.disabled = false;

      if (result.correlations && result.correlations.length > 0) {
        // Show correlation results
        showCorrelationResults(result.correlations);
        // Reload data to show updated correlations
        await load();
      } else {
        alert(result.message || 'Tidak ada korelasi baru yang dibuat');
      }
    } catch (error) {
      console.error('Auto-correlate error:', error);
      alert('Gagal melakukan auto korelasi: ' + error.message);
      
      // Restore button on error
      const button = event.target;
      button.innerHTML = '<i class="fas fa-magic"></i> Auto Korelasi AI';
      button.disabled = false;
    }
  }

  function showCorrelationResults(correlations) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
        <div class="modal-header">
          <h3 class="modal-title">Hasil Auto Korelasi AI</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div style="padding: 1rem;">
          <p><strong>Berhasil mengkorelasikan ${correlations.length} sasaran strategi:</strong></p>
          <div style="max-height: 400px; overflow-y: auto;">
            ${correlations.map((corr, index) => `
              <div style="border: 1px solid #ddd; border-radius: 4px; padding: 1rem; margin-bottom: 1rem; background: #f9f9f9;">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 0.5rem;">
                  <strong>${index + 1}. Sasaran (${corr.perspektif}):</strong>
                  <span class="badge" style="
                    padding: 0.2rem 0.4rem;
                    font-size: 0.7rem;
                    border-radius: 0.2rem;
                    ${getTowsBadgeStyle(corr.tows_type)}
                  ">${corr.tows_type}</span>
                </div>
                <p style="margin: 0.5rem 0; color: #333;">${corr.sasaran_text}</p>
                <div style="margin-top: 0.5rem;">
                  <strong>Dikorelasikan dengan TOWS:</strong>
                  <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">${corr.tows_strategy}</p>
                  <small style="color: #28a745;">Confidence: ${corr.confidence}%</small>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="text-align: center; margin-top: 1rem;">
            <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Tutup</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  return {
    load,
    showModal,
    applyFilter,
    save,
    edit,
    delete: deleteItem,
    downloadReport,
    autoCorrelate
  };
})();

async function loadSasaranStrategi() {
  await SasaranStrategiModule.load();
}

window.sasaranStrategiModule = SasaranStrategiModule;

