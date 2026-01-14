// Matriks TOWS Module
const MatriksTowsModule = (() => {
  const state = {
    data: [],
    rencanaStrategis: [],
    filters: {
      rencana_strategis_id: '',
      tipe_strategi: '',
      tahun: ''
    }
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);

  // Generate year options for dropdown (5 years back, current year, 5 years forward)
  function generateYearOptions(selectedYear) {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    const endYear = currentYear + 5;
    let options = '';
    const selectedYearInt = selectedYear ? parseInt(selectedYear) : null;
    
    for (let year = endYear; year >= startYear; year--) {
      const selected = year === selectedYearInt ? 'selected' : '';
      options += `<option value="${year}" ${selected}>${year}</option>`;
    }
    return options;
  }

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
              <select class="form-control" id="filter-tahun" onchange="MatriksTowsModule.applyFilter()">
                <option value="">Semua Tahun</option>
                ${generateYearOptions(state.filters.tahun)}
              </select>
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
    const tahunValue = document.getElementById('filter-tahun')?.value;
    state.filters.tahun = tahunValue ? parseInt(tahunValue) : '';
    await fetchInitialData();
    render();
  }

  function showModal(id = null) {
    // Remove any existing modal first to prevent duplicates
    const existingModal = document.querySelector('.modal.matriks-tows-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Remove existing style
    const existingStyle = document.getElementById('matriks-tows-modal-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'modal active matriks-tows-modal';
    modal.id = 'matriks-tows-modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Strategi TOWS</h3>
            <button type="button" class="modal-close-btn" aria-label="Close">&times;</button>
          </div>
          <form id="matriks-tows-form" class="modal-form">
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
            <div class="form-actions">
              <button type="button" class="btn btn-secondary btn-cancel">Batal</button>
              <button type="submit" class="btn btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Add modal styles
    const style = document.createElement('style');
    style.id = 'matriks-tows-modal-style';
    style.textContent = `
      .matriks-tows-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 1rem;
        box-sizing: border-box;
      }
      .matriks-tows-modal .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
      }
      .matriks-tows-modal .modal-dialog {
        position: relative;
        z-index: 10000;
        width: 100%;
        max-width: 550px;
        max-height: calc(100vh - 2rem);
        display: flex;
        flex-direction: column;
      }
      .matriks-tows-modal .modal-content {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - 2rem);
        overflow: hidden;
      }
      .matriks-tows-modal .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        flex-shrink: 0;
      }
      .matriks-tows-modal .modal-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
      }
      .matriks-tows-modal .modal-close-btn {
        background: none;
        border: none;
        font-size: 1.75rem;
        cursor: pointer;
        color: #6b7280;
        line-height: 1;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
      }
      .matriks-tows-modal .modal-close-btn:hover {
        background: #f3f4f6;
        color: #1f2937;
      }
      .matriks-tows-modal .modal-form {
        padding: 1.5rem;
        overflow-y: auto;
        flex: 1;
      }
      .matriks-tows-modal .form-group {
        margin-bottom: 1rem;
      }
      .matriks-tows-modal .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #374151;
      }
      .matriks-tows-modal .form-control {
        width: 100%;
        padding: 0.625rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.875rem;
        box-sizing: border-box;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .matriks-tows-modal .form-control:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      .matriks-tows-modal textarea.form-control {
        resize: vertical;
        min-height: 100px;
      }
      .matriks-tows-modal .form-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
      }
      .matriks-tows-modal .btn {
        padding: 0.625rem 1.25rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      .matriks-tows-modal .btn-secondary {
        background: #f9fafb;
        border: 1px solid #d1d5db;
        color: #374151;
      }
      .matriks-tows-modal .btn-secondary:hover {
        background: #e5e7eb;
      }
      .matriks-tows-modal .btn-primary {
        background: #3b82f6;
        border: none;
        color: white;
      }
      .matriks-tows-modal .btn-primary:hover {
        background: #2563eb;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Add event listeners using event delegation
    const overlay = modal.querySelector('.modal-overlay');
    const closeBtn = modal.querySelector('.modal-close-btn');
    const cancelBtn = modal.querySelector('.btn-cancel');
    const form = modal.querySelector('#matriks-tows-form');
    
    // Close modal handlers
    const handleClose = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    };
    
    overlay.addEventListener('click', handleClose);
    closeBtn.addEventListener('click', handleClose);
    cancelBtn.addEventListener('click', handleClose);
    
    // Form submit handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      save(e, id || '');
    });

    // Add escape key listener
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Store escape handler reference for cleanup
    modal._escapeHandler = escapeHandler;

    if (id) {
      loadForEdit(id);
    }
  }

  function closeModal() {
    const modal = document.querySelector('.matriks-tows-modal');
    if (modal) {
      // Remove escape key listener
      if (modal._escapeHandler) {
        document.removeEventListener('keydown', modal._escapeHandler);
      }
      modal.remove();
    }
    
    // Remove style
    const style = document.getElementById('matriks-tows-modal-style');
    if (style) {
      style.remove();
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
  }

  async function loadForEdit(id) {
    try {
      const apiFunction = api();
      if (!apiFunction) {
        console.error('API function not available');
        alert('Error: API tidak tersedia');
        return;
      }
      
      const data = await apiFunction(`/api/matriks-tows/${id}`);
      
      if (!data) {
        alert('Data tidak ditemukan');
        closeModal();
        return;
      }
      
      // Set form values
      const rsSelect = document.getElementById('mt-rencana-strategis');
      const tahunInput = document.getElementById('mt-tahun');
      const tipeSelect = document.getElementById('mt-tipe-strategi');
      const strategiTextarea = document.getElementById('mt-strategi');
      
      if (rsSelect) rsSelect.value = data.rencana_strategis_id || '';
      if (tahunInput) tahunInput.value = data.tahun || new Date().getFullYear();
      if (tipeSelect) tipeSelect.value = data.tipe_strategi || '';
      if (strategiTextarea) strategiTextarea.value = data.strategi || '';
      
    } catch (error) {
      console.error('Error loading data for edit:', error);
      alert('Error loading data: ' + (error.message || 'Terjadi kesalahan'));
      closeModal();
    }
  }

  async function save(e, id) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      const apiFunction = api();
      if (!apiFunction) {
        alert('Error: API tidak tersedia');
        return;
      }
      
      const rencanaStrategisId = document.getElementById('mt-rencana-strategis')?.value;
      const tahun = document.getElementById('mt-tahun')?.value;
      const tipeStrategi = document.getElementById('mt-tipe-strategi')?.value;
      const strategi = document.getElementById('mt-strategi')?.value;
      
      // Validation
      if (!tahun || !tipeStrategi || !strategi) {
        alert('Mohon lengkapi semua field yang wajib diisi');
        return;
      }
      
      const data = {
        rencana_strategis_id: rencanaStrategisId || null,
        tahun: parseInt(tahun),
        tipe_strategi: tipeStrategi,
        strategi: strategi
      };

      if (id) {
        await apiFunction(`/api/matriks-tows/${id}`, { method: 'PUT', body: data });
      } else {
        await apiFunction('/api/matriks-tows', { method: 'POST', body: data });
      }

      closeModal();
      await load();
      alert('Strategi berhasil disimpan');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error: ' + (error.message || 'Terjadi kesalahan saat menyimpan'));
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
    closeModal,
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

