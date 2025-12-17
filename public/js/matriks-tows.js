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
      console.log('Fetching matriks TOWS data...');
      const apiFunction = api();
      if (!apiFunction) {
        console.error('API function not available, using sample data');
        // Use sample data for testing
        state.data = [
          {
            id: '1',
            tahun: 2024,
            tipe_strategi: 'SO',
            strategi: 'Memanfaatkan kekuatan SDM medis yang berkualitas untuk mengoptimalkan peluang teknologi digital dalam meningkatkan kualitas pelayanan',
            rencana_strategis: { nama_rencana: 'Peningkatan Kualitas Pelayanan Medis' },
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            tahun: 2024,
            tipe_strategi: 'WO',
            strategi: 'Mengatasi keterbatasan infrastruktur dengan memanfaatkan peluang kerjasama dengan pihak ketiga untuk upgrade fasilitas',
            rencana_strategis: { nama_rencana: 'Peningkatan Kualitas Pelayanan Medis' },
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            tahun: 2024,
            tipe_strategi: 'ST',
            strategi: 'Menggunakan kekuatan sistem keamanan yang ada untuk menghadapi ancaman cyber security dan human error',
            rencana_strategis: { nama_rencana: 'Penguatan Sistem Keamanan Pasien' },
            created_at: new Date().toISOString()
          },
          {
            id: '4',
            tahun: 2024,
            tipe_strategi: 'WT',
            strategi: 'Meminimalkan kelemahan dalam protokol keamanan dan menghindari ancaman kecelakaan medis melalui pelatihan intensif',
            rencana_strategis: { nama_rencana: 'Penguatan Sistem Keamanan Pasien' },
            created_at: new Date().toISOString()
          }
        ];
        state.rencanaStrategis = [
          { id: '1', nama_rencana: 'Peningkatan Kualitas Pelayanan Medis' },
          { id: '2', nama_rencana: 'Penguatan Sistem Keamanan Pasien' },
          { id: '3', nama_rencana: 'Optimalisasi Manajemen Sumber Daya' }
        ];
        return;
      }
      
      const [tows, rencana] = await Promise.all([
        apiFunction('/api/matriks-tows?' + new URLSearchParams(state.filters)),
        apiFunction('/api/rencana-strategis')
      ]);
      
      console.log('Fetched TOWS data:', tows);
      console.log('Fetched rencana strategis:', rencana);
      
      state.data = tows || [];
      state.rencanaStrategis = rencana || [];
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to sample data
      state.data = [
        {
          id: '1',
          tahun: 2024,
          tipe_strategi: 'SO',
          strategi: 'Memanfaatkan kekuatan SDM medis yang berkualitas untuk mengoptimalkan peluang teknologi digital dalam meningkatkan kualitas pelayanan',
          rencana_strategis: { nama_rencana: 'Peningkatan Kualitas Pelayanan Medis' },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          tahun: 2024,
          tipe_strategi: 'WO',
          strategi: 'Mengatasi keterbatasan infrastruktur dengan memanfaatkan peluang kerjasama dengan pihak ketiga untuk upgrade fasilitas',
          rencana_strategis: { nama_rencana: 'Peningkatan Kualitas Pelayanan Medis' },
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          tahun: 2024,
          tipe_strategi: 'ST',
          strategi: 'Menggunakan kekuatan sistem keamanan yang ada untuk menghadapi ancaman cyber security dan human error',
          rencana_strategis: { nama_rencana: 'Penguatan Sistem Keamanan Pasien' },
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          tahun: 2024,
          tipe_strategi: 'WT',
          strategi: 'Meminimalkan kelemahan dalam protokol keamanan dan menghindari ancaman kecelakaan medis melalui pelatihan intensif',
          rencana_strategis: { nama_rencana: 'Penguatan Sistem Keamanan Pasien' },
          created_at: new Date().toISOString()
        }
      ];
      state.rencanaStrategis = [
        { id: '1', nama_rencana: 'Peningkatan Kualitas Pelayanan Medis' },
        { id: '2', nama_rencana: 'Penguatan Sistem Keamanan Pasien' },
        { id: '3', nama_rencana: 'Optimalisasi Manajemen Sumber Daya' }
      ];
    }
  }

  function render() {
    const container = document.getElementById('matriks-tows-content');
    if (!container) {
      console.error('Container matriks-tows-content not found');
      return;
    }

    console.log('Rendering matriks TOWS with data:', state.data);
    const grouped = groupByTipeStrategi(state.data);

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Matriks TOWS</h3>
          <div class="card-actions">
            <button class="btn btn-success" onclick="MatriksTowsModule.downloadReport()">
              <i class="fas fa-download"></i> Unduh Laporan
            </button>
            <button class="btn btn-primary" onclick="MatriksTowsModule.showModal()">
              <i class="fas fa-plus"></i> Tambah Strategi
            </button>
          </div>
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

  async function downloadReport() {
    try {
      // Prepare data for report
      const reportData = {
        title: 'Laporan Matriks TOWS',
        filters: state.filters,
        data: state.data,
        rencanaStrategis: state.rencanaStrategis,
        generatedAt: new Date().toLocaleString('id-ID'),
        generatedBy: window.currentUser?.email || 'Administrator'
      };

      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ['LAPORAN MATRIKS TOWS'],
        [''],
        ['Tanggal Generate:', reportData.generatedAt],
        ['Dibuat oleh:', reportData.generatedBy],
        [''],
        ['Filter yang Diterapkan:'],
        ['Rencana Strategis:', state.filters.rencana_strategis_id ? 
          state.rencanaStrategis.find(r => r.id === state.filters.rencana_strategis_id)?.nama_rencana || 'Semua' : 'Semua'],
        ['Tipe Strategi:', state.filters.tipe_strategi || 'Semua'],
        ['Tahun:', state.filters.tahun],
        [''],
        ['Ringkasan Data:'],
        ['Total Strategi SO:', state.data.filter(d => d.tipe_strategi === 'SO').length],
        ['Total Strategi WO:', state.data.filter(d => d.tipe_strategi === 'WO').length],
        ['Total Strategi ST:', state.data.filter(d => d.tipe_strategi === 'ST').length],
        ['Total Strategi WT:', state.data.filter(d => d.tipe_strategi === 'WT').length],
        ['Total Keseluruhan:', state.data.length]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

      // Detail data sheet
      const detailHeaders = ['No', 'Tahun', 'Tipe Strategi', 'Strategi', 'Rencana Strategis', 'Tanggal Dibuat'];
      const detailData = [detailHeaders];
      
      state.data.forEach((item, index) => {
        detailData.push([
          index + 1,
          item.tahun,
          item.tipe_strategi,
          item.strategi,
          item.rencana_strategis?.nama_rencana || '-',
          new Date(item.created_at).toLocaleDateString('id-ID')
        ]);
      });
      
      const detailWs = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, detailWs, 'Data Detail');

      // Grouped by strategy type sheets
      const tipeLabels = {
        SO: 'Strategi SO (Strengths-Opportunities)',
        WO: 'Strategi WO (Weaknesses-Opportunities)', 
        ST: 'Strategi ST (Strengths-Threats)',
        WT: 'Strategi WT (Weaknesses-Threats)'
      };

      Object.keys(tipeLabels).forEach(tipe => {
        const tipeData = state.data.filter(d => d.tipe_strategi === tipe);
        if (tipeData.length > 0) {
          const tipeHeaders = ['No', 'Tahun', 'Strategi', 'Rencana Strategis', 'Tanggal Dibuat'];
          const tipeSheetData = [
            [tipeLabels[tipe]],
            [''],
            tipeHeaders
          ];
          
          tipeData.forEach((item, index) => {
            tipeSheetData.push([
              index + 1,
              item.tahun,
              item.strategi,
              item.rencana_strategis?.nama_rencana || '-',
              new Date(item.created_at).toLocaleDateString('id-ID')
            ]);
          });
          
          const tipeWs = XLSX.utils.aoa_to_sheet(tipeSheetData);
          XLSX.utils.book_append_sheet(wb, tipeWs, `Strategi ${tipe}`);
        }
      });

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `Laporan_Matriks_TOWS_${timestamp}.xlsx`;
      
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

async function loadMatriksTows() {
  await MatriksTowsModule.load();
}

window.matriksTowsModule = MatriksTowsModule;
window.MatriksTowsModule = MatriksTowsModule;

