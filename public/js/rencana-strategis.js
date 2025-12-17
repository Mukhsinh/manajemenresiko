// Rencana Strategis Module (Advanced)
const RencanaStrategisModule = (() => {
  const state = {
    data: [],
    missions: [],
    currentId: null,
    formValues: getDefaultForm(),
    sasaranList: [],
    indikatorList: []
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);
  const getEl = (id) => document.getElementById(id);

  function getDefaultForm() {
    return {
      kode: '',
      visi_misi_id: '',
      nama_rencana: '',
      deskripsi: '',
      periode_mulai: '',
      periode_selesai: '',
      target: '',
      indikator_kinerja: '',
      status: 'Draft'
    };
  }

  async function load() {
    console.log('=== RENCANA STRATEGIS MODULE LOAD START ===');
    try {
      console.log('Fetching initial data...');
      await fetchInitialData();
      
      console.log('Checking if need to generate kode...');
      if (!state.currentId) {
        console.log('Generating kode...');
        await generateKode();
      }
      
      console.log('Rendering form...');
      render();
      
      console.log('=== RENCANA STRATEGIS MODULE LOAD COMPLETE ===');
    } catch (error) {
      console.error('=== RENCANA STRATEGIS MODULE LOAD ERROR ===', error);
    }
  }

  async function fetchInitialData() {
    try {
      console.log('Fetching rencana strategis initial data...');
      
      // Try multiple endpoints in order of preference
      let rencana, visiMisi;
      
      const rencanaEndpoints = [
        '/api/rencana-strategis/public',
        '/api/rencana-strategis',
        '/api/simple/rencana-strategis', 
        '/api/debug-data/rencana-strategis',
        '/api/test-data/rencana-strategis'
      ];
      
      const visiMisiEndpoints = [
        '/api/visi-misi/public',
        '/api/visi-misi',
        '/api/simple/visi-misi', 
        '/api/debug-data/visi-misi',
        '/api/test-data/visi-misi'
      ];
      
      // Fetch rencana strategis
      for (const endpoint of rencanaEndpoints) {
        try {
          console.log(`Trying rencana strategis endpoint: ${endpoint}`);
          const response = await api()(endpoint);
          console.log(`Rencana strategis response from ${endpoint}:`, response);
          
          // Handle different response formats
          if (response && response.success && response.data) {
            rencana = response.data;
          } else if (Array.isArray(response)) {
            rencana = response;
          } else if (response && typeof response === 'object') {
            rencana = response;
          }
          
          console.log(`Rencana strategis processed from ${endpoint}:`, rencana?.length || 0);
          break;
        } catch (error) {
          console.warn(`Rencana strategis endpoint ${endpoint} failed:`, error.message);
          continue;
        }
      }
      
      // Fetch visi misi
      for (const endpoint of visiMisiEndpoints) {
        try {
          console.log(`Trying visi misi endpoint: ${endpoint}`);
          const response = await api()(endpoint);
          console.log(`Visi misi response from ${endpoint}:`, response);
          
          // Handle different response formats
          if (response && response.success && response.data) {
            visiMisi = response.data;
          } else if (Array.isArray(response)) {
            visiMisi = response;
          } else if (response && typeof response === 'object') {
            visiMisi = response;
          }
          
          console.log(`Visi misi processed from ${endpoint}:`, visiMisi?.length || 0);
          break;
        } catch (error) {
          console.warn(`Visi misi endpoint ${endpoint} failed:`, error.message);
          continue;
        }
      }
      
      state.data = Array.isArray(rencana) ? rencana : [];
      state.missions = Array.isArray(visiMisi) ? visiMisi : [];
      
      console.log('Fetched data:', {
        rencanaCount: state.data.length,
        visiMisiCount: state.missions.length
      });
    } catch (error) {
      console.error('Error in fetchInitialData:', error);
      state.data = [];
      state.missions = [];
    }
  }

  async function generateKode(force = false) {
    if (state.currentId && !force) return;
    
    try {
      console.log('Generating kode via API...');
      
      // Try public endpoint first, then authenticated endpoint
      const endpoints = [
        '/api/rencana-strategis/generate/kode/public',
        '/api/rencana-strategis/generate/kode'
      ];
      
      let kode = null;
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying kode generation endpoint: ${endpoint}`);
          const response = await api()(endpoint);
          kode = response.kode;
          console.log(`Generated kode from ${endpoint}:`, kode);
          break;
        } catch (endpointError) {
          console.warn(`Kode generation endpoint ${endpoint} failed:`, endpointError.message);
          continue;
        }
      }
      
      if (kode) {
        state.formValues.kode = kode;
      } else {
        throw new Error('All kode generation endpoints failed');
      }
    } catch (error) {
      console.warn('Failed to generate kode via API, using fallback:', error.message);
      // Fallback: generate kode locally
      const year = new Date().getFullYear();
      const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      const fallbackKode = `RS-${year}-${random}`;
      state.formValues.kode = fallbackKode;
      console.log('Generated fallback kode:', fallbackKode);
    }
  }

  function render() {
    const container = getEl('rencana-strategis-content');
    if (!container) {
      console.error('Container rencana-strategis-content not found!');
      return;
    }
    
    console.log('Rendering rencana strategis form...');
    console.log('State:', {
      currentId: state.currentId,
      formValues: state.formValues,
      sasaranList: state.sasaranList,
      indikatorList: state.indikatorList,
      dataCount: state.data.length,
      missionsCount: state.missions.length
    });
    
    container.innerHTML = `
      <div class="section-card">
        <div class="section-header">
          <div>
            <h3>${state.currentId ? 'Edit Rencana Strategis' : 'Tambah Rencana Strategis'}</h3>
            <p class="text-muted">Hubungkan sasaran strategis dengan indikator kinerja utama</p>
          </div>
          <span class="badge-status ${state.currentId ? 'badge-hati-hati' : 'badge-normal'}">
            ${state.currentId ? 'Mode Edit' : 'Mode Input'}
          </span>
        </div>
        <form id="rs-form" class="form-grid two-column">
          ${renderInput('Kode Rencana', 'rs-kode', 'text', state.formValues.kode, true)}
          ${renderSelect('Misi Strategis', 'rs-misi', state.missions, state.formValues.visi_misi_id)}
          ${renderInput('Nama Rencana Strategis', 'rs-nama', 'text', state.formValues.nama_rencana)}
          ${renderInput('Periode Mulai', 'rs-mulai', 'date', state.formValues.periode_mulai)}
          ${renderInput('Periode Selesai', 'rs-selesai', 'date', state.formValues.periode_selesai)}
          ${renderTextarea('Deskripsi Rencana', 'rs-deskripsi', state.formValues.deskripsi)}
          ${renderTextarea('Target', 'rs-target', state.formValues.target)}
          ${renderInput('Status', 'rs-status', 'text', state.formValues.status || 'Draft')}
          <div class="form-group full-width">
            <label>Indikator Kinerja</label>
            <input type="text" id="rs-indikator" value="${state.formValues.indikator_kinerja || ''}">
          </div>
          <div class="form-group full-width">
            <label>Tambah Sasaran Strategis</label>
            <div class="input-with-button">
              <input type="text" id="rs-sasaran-input" placeholder="Masukkan sasaran">
              <button type="button" class="btn btn-primary btn-sm" id="rs-sasaran-add"><i class="fas fa-plus"></i></button>
            </div>
            <div class="chip-group" id="rs-sasaran-list">${renderChipList(state.sasaranList, 'sasaran')}</div>
          </div>
          <div class="form-group full-width">
            <label>Tambah Indikator Kinerja Utama</label>
            <div class="input-with-button">
              <input type="text" id="rs-indikator-input" placeholder="Masukkan indikator">
              <button type="button" class="btn btn-primary btn-sm" id="rs-indikator-add"><i class="fas fa-plus"></i></button>
            </div>
            <div class="chip-group" id="rs-indikator-list">${renderChipList(state.indikatorList, 'indikator')}</div>
          </div>
          <div class="form-actions full-width">
            <button type="submit" class="btn btn-primary">${state.currentId ? 'Update' : 'Simpan'} Rencana</button>
            <button type="button" id="rs-reset-btn" class="btn btn-secondary">Reset</button>
          </div>
        </form>
      </div>

      <div class="section-card">
        <div class="section-header">
          <div>
            <h3>Daftar Rencana Strategis</h3>
            <p class="text-muted">Kelola sasaran strategis dan indikator kinerja utama</p>
          </div>
          <div class="action-group">
            <button class="btn btn-warning btn-sm" id="rs-download-template"><i class="fas fa-download"></i> Template</button>
            <button class="btn btn-success btn-sm" id="rs-import-btn"><i class="fas fa-upload"></i> Import</button>
            <button class="btn btn-info btn-sm" id="rs-export-btn"><i class="fas fa-file-excel"></i> Export</button>
          </div>
        </div>
        <input type="file" id="rs-import-input" hidden accept=".xlsx,.xls">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Rencana</th>
                <th>Misi</th>
                <th>Sasaran</th>
                <th>Indikator</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    `;

    console.log('Form HTML rendered, binding events...');
    bindRenderedEvents();
    console.log('Events bound successfully');
  }

  function renderInput(label, id, type, value = '', readonly = false) {
    return `
      <div class="form-group">
        <label>${label}</label>
        <input type="${type}" class="form-control" id="${id}" value="${value || ''}" ${readonly ? 'readonly' : ''}>
      </div>
    `;
  }

  function renderTextarea(label, id, value = '') {
    return `
      <div class="form-group full-width">
        <label>${label}</label>
        <textarea id="${id}" class="form-control" rows="2">${value || ''}</textarea>
      </div>
    `;
  }

  function renderSelect(label, id, options = [], selected = '') {
    const opts = ['<option value="">Pilih salah satu</option>'];
    
    // For each visi_misi, split misi into separate options
    options.forEach((opt) => {
      if (opt.misi) {
        // Split misi by newline to get individual misi items
        const misiArray = opt.misi.split('\n').filter(m => m.trim());
        misiArray.forEach((misi, index) => {
          // Clean up misi text (remove numbering if exists)
          let cleanMisi = misi.trim();
          // Remove leading numbers like "1.", "2.", etc.
          cleanMisi = cleanMisi.replace(/^\d+\.\s*/, '');
          
          // Create unique value: visi_misi_id|misi_index|misi_text
          const value = `${opt.id}|${index}|${encodeURIComponent(cleanMisi)}`;
          
          // Check if this option is selected
          let isSelected = false;
          if (selected) {
            if (selected.includes('|')) {
              const [selId, selIndex] = selected.split('|');
              isSelected = (selId === opt.id && parseInt(selIndex) === index);
            } else {
              isSelected = (opt.id === selected && index === 0);
            }
          }
          
          opts.push(`<option value="${value}" ${isSelected ? 'selected' : ''}>${cleanMisi}</option>`);
        });
      }
    });
    
    return `
      <div class="form-group">
        <label>${label}</label>
        <select id="${id}" class="form-control">
          ${opts.join('')}
        </select>
      </div>
    `;
  }

  function renderChipList(list = [], type) {
    if (!list.length) {
      return '<p class="text-muted">Belum ada data</p>';
    }
    return list
      .map(
        (item, index) => `
      <span class="chip chip-removable" data-type="${type}" data-index="${index}">
        ${item}
        <button type="button" class="chip-remove" data-type="${type}" data-index="${index}">
          <i class="fas fa-times"></i>
        </button>
      </span>`
      )
      .join('');
  }

  function renderTableRows() {
    if (!state.data.length) {
      return '<tr><td colspan="7" class="text-center">Belum ada rencana strategis</td></tr>';
    }
    return state.data
      .map((item) => {
        const sasaran = safeArray(item.sasaran_strategis).slice(0, 3).join(', ');
        const indikator = safeArray(item.indikator_kinerja_utama).slice(0, 3).join(', ');
        
        // Display the nama_rencana as the selected misi
        const displayMisi = item.nama_rencana || '-';
        
        return `
        <tr>
          <td>${item.kode}</td>
          <td>${item.nama_rencana || '-'}</td>
          <td>${displayMisi}</td>
          <td>${sasaran || '-'}</td>
          <td>${indikator || '-'}</td>
          <td><span class="badge badge-${item.status === 'Aktif' ? 'success' : 'warning'}">${item.status || 'Draft'}</span></td>
          <td class="table-actions">
            <button class="btn btn-edit btn-sm rs-edit-btn" data-id="${item.id}" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn btn-delete btn-sm rs-delete-btn" data-id="${item.id}" title="Hapus"><i class="fas fa-trash"></i></button>
          </td>
        </tr>`;
      })
      .join('');
  }

  function safeArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  function bindRenderedEvents() {
    getEl('rs-form')?.addEventListener('submit', handleSubmit);
    getEl('rs-reset-btn')?.addEventListener('click', resetForm);
    getEl('rs-sasaran-add')?.addEventListener('click', () => addListItem('sasaran'));
    getEl('rs-indikator-add')?.addEventListener('click', () => addListItem('indikator'));
    document.querySelectorAll('.chip-remove').forEach((btn) =>
      btn.addEventListener('click', () => removeListItem(btn.dataset.type, Number(btn.dataset.index)))
    );
    document.querySelectorAll('.rs-edit-btn').forEach((btn) => btn.addEventListener('click', () => startEdit(btn.dataset.id)));
    document.querySelectorAll('.rs-delete-btn').forEach((btn) =>
      btn.addEventListener('click', () => deleteRencana(btn.dataset.id))
    );
    getEl('rs-download-template')?.addEventListener('click', () => downloadFile('/api/rencana-strategis/actions/template', 'template-rencana-strategis.xlsx'));
    getEl('rs-export-btn')?.addEventListener('click', () => downloadFile('/api/rencana-strategis/actions/export', 'rencana-strategis.xlsx'));
    getEl('rs-import-btn')?.addEventListener('click', () => getEl('rs-import-input')?.click());
    getEl('rs-import-input')?.addEventListener('change', handleImport);
  }

  function captureFormValues() {
    const getValue = (id) => getEl(id)?.value || '';
    state.formValues = {
      kode: getValue('rs-kode'),
      visi_misi_id: getValue('rs-misi'),
      nama_rencana: getValue('rs-nama'),
      deskripsi: getValue('rs-deskripsi'),
      periode_mulai: getValue('rs-mulai'),
      periode_selesai: getValue('rs-selesai'),
      target: getValue('rs-target'),
      indikator_kinerja: getValue('rs-indikator'),
      status: getValue('rs-status') || 'Draft'
    };
  }

  function addListItem(type) {
    captureFormValues();
    const inputId = type === 'sasaran' ? 'rs-sasaran-input' : 'rs-indikator-input';
    const value = getEl(inputId)?.value.trim();
    if (!value) return;
    if (type === 'sasaran') {
      state.sasaranList.push(value);
    } else {
      state.indikatorList.push(value);
    }
    render();
  }

  function removeListItem(type, index) {
    captureFormValues();
    if (type === 'sasaran') {
      state.sasaranList.splice(index, 1);
    } else {
      state.indikatorList.splice(index, 1);
    }
    render();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    captureFormValues();
    
    // Extract visi_misi_id and misi text from format "visi_misi_id|misi_index|misi_text"
    let visiMisiId = state.formValues.visi_misi_id;
    let selectedMisiText = '';
    
    if (visiMisiId && visiMisiId.includes('|')) {
      const parts = visiMisiId.split('|');
      visiMisiId = parts[0];
      
      // Get the misi text from the encoded value
      if (parts.length >= 3) {
        selectedMisiText = decodeURIComponent(parts[2]);
      } else {
        // Fallback: get from visi_misi data
        const visiMisi = state.missions.find(m => m.id === visiMisiId);
        if (visiMisi && visiMisi.misi) {
          const misiArray = visiMisi.misi.split('\n').filter(m => m.trim());
          const index = parseInt(parts[1]) || 0;
          let misiText = misiArray[index] || '';
          // Remove numbering
          selectedMisiText = misiText.replace(/^\d+\.\s*/, '').trim();
        }
      }
    }
    
    const payload = {
      visi_misi_id: visiMisiId || null,
      nama_rencana: state.formValues.nama_rencana || selectedMisiText,
      deskripsi: state.formValues.deskripsi,
      periode_mulai: state.formValues.periode_mulai || null,
      periode_selesai: state.formValues.periode_selesai || null,
      target: state.formValues.target,
      indikator_kinerja: state.formValues.indikator_kinerja,
      status: state.formValues.status || 'Draft',
      sasaran_strategis: state.sasaranList,
      indikator_kinerja_utama: state.indikatorList
    };

    // Only include kode for new records (not updates)
    if (!state.currentId) {
      payload.kode = state.formValues.kode;
    }

    if (!payload.nama_rencana) {
      alert('Nama rencana wajib diisi atau pilih misi strategis');
      return;
    }

    try {
      if (state.currentId) {
        await api()(`/api/rencana-strategis/${state.currentId}`, { method: 'PUT', body: payload });
        alert('Rencana strategis berhasil diupdate');
      } else {
        await api()('/api/rencana-strategis', { method: 'POST', body: payload });
        alert('Rencana strategis berhasil disimpan');
      }

      await fetchInitialData();
      await resetForm();
    } catch (error) {
      console.error('Error saving rencana strategis:', error);
      alert('Gagal menyimpan rencana strategis: ' + (error.message || 'Unknown error'));
    }
  }

  async function resetForm() {
    state.currentId = null;
    state.formValues = getDefaultForm();
    state.sasaranList = [];
    state.indikatorList = [];
    await generateKode(true);
    render();
  }

  function startEdit(id) {
    const record = state.data.find((item) => item.id === id);
    if (!record) return;
    state.currentId = id;
    
    // Find the matching misi option value
    let misiValue = record.visi_misi_id || '';
    if (record.visi_misi_id && record.nama_rencana) {
      const visiMisi = state.missions.find(m => m.id === record.visi_misi_id);
      if (visiMisi && visiMisi.misi) {
        const misiArray = visiMisi.misi.split('\n').filter(m => m.trim());
        // Try to find matching misi by comparing nama_rencana
        const matchIndex = misiArray.findIndex(m => {
          const cleanMisi = m.replace(/^\d+\.\s*/, '').trim();
          return cleanMisi === record.nama_rencana || m.trim() === record.nama_rencana;
        });
        
        if (matchIndex >= 0) {
          const cleanMisi = misiArray[matchIndex].replace(/^\d+\.\s*/, '').trim();
          misiValue = `${record.visi_misi_id}|${matchIndex}|${encodeURIComponent(cleanMisi)}`;
        }
      }
    }
    
    state.formValues = {
      kode: record.kode,
      visi_misi_id: misiValue,
      nama_rencana: record.nama_rencana,
      deskripsi: record.deskripsi || '',
      periode_mulai: record.periode_mulai ? record.periode_mulai.substring(0, 10) : '',
      periode_selesai: record.periode_selesai ? record.periode_selesai.substring(0, 10) : '',
      target: record.target || '',
      indikator_kinerja: record.indikator_kinerja || '',
      status: record.status || 'Draft'
    };
    state.sasaranList = safeArray(record.sasaran_strategis);
    state.indikatorList = safeArray(record.indikator_kinerja_utama);
    render();
    
    // Scroll to form
    document.getElementById('rs-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function deleteRencana(id) {
    if (!confirm('Hapus rencana strategis ini?')) return;
    await api()(`/api/rencana-strategis/${id}`, { method: 'DELETE' });
    alert('Rencana strategis berhasil dihapus');
    await fetchInitialData();
    if (state.currentId === id) {
      resetForm();
    } else {
      render();
    }
  }

  async function downloadFile(endpoint, filename) {
    try {
      let token = null;
      try {
        if (typeof getAuthToken === 'function') {
          token = await getAuthToken();
        }
      } catch (tokenError) {
        console.warn('Failed to get auth token:', tokenError.message);
      }
      
      const response = await fetch(`${window.location.origin}${endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('Gagal mengunduh berkas');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = await readExcel(file);
      await api()('/api/rencana-strategis/actions/import', { method: 'POST', body: { items: data } });
      alert('Import rencana strategis berhasil');
      await fetchInitialData();
      render();
    } catch (error) {
      console.error(error);
      alert('Gagal mengimpor data');
    } finally {
      event.target.value = '';
    }
  }

  function readExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  }

  return {
    load
  };
})();

async function loadRencanaStrategis() {
  await RencanaStrategisModule.load();
}

window.rencanaStrategisModule = RencanaStrategisModule;

