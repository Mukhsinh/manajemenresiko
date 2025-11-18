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
    await fetchInitialData();
    if (!state.currentId) {
      await generateKode();
    }
    render();
  }

  async function fetchInitialData() {
    const [rencana, visiMisi] = await Promise.all([
      api()('/api/rencana-strategis'),
      api()('/api/visi-misi')
    ]);
    state.data = rencana || [];
    state.missions = visiMisi || [];
  }

  async function generateKode(force = false) {
    if (state.currentId && !force) return;
    const { kode } = await api()('/api/rencana-strategis/generate/kode');
    state.formValues.kode = kode;
  }

  function render() {
    const container = getEl('rencana-strategis-content');
    if (!container) return;
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

    bindRenderedEvents();
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
    const opts = [
      '<option value="">Pilih salah satu</option>',
      ...options.map((opt) => `<option value="${opt.id}" ${opt.id === selected ? 'selected' : ''}>${opt.misi || opt.nama_misi || 'Tanpa Judul'}</option>`)
    ].join('');
    return `
      <div class="form-group">
        <label>${label}</label>
        <select id="${id}" class="form-control">
          ${opts}
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
        return `
        <tr>
          <td>${item.kode}</td>
          <td>${item.nama_rencana}</td>
          <td>${item.visi_misi?.misi || '-'}</td>
          <td>${sasaran || '-'}</td>
          <td>${indikator || '-'}</td>
          <td>${item.status || 'Draft'}</td>
          <td class="table-actions">
            <button class="btn btn-edit btn-sm rs-edit-btn" data-id="${item.id}"><i class="fas fa-edit"></i></button>
            <button class="btn btn-delete btn-sm rs-delete-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>
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
    const payload = {
      kode: state.formValues.kode,
      visi_misi_id: state.formValues.visi_misi_id || null,
      nama_rencana: state.formValues.nama_rencana,
      deskripsi: state.formValues.deskripsi,
      periode_mulai: state.formValues.periode_mulai || null,
      periode_selesai: state.formValues.periode_selesai || null,
      target: state.formValues.target,
      indikator_kinerja: state.formValues.indikator_kinerja,
      status: state.formValues.status || 'Draft',
      sasaran_strategis: state.sasaranList,
      indikator_kinerja_utama: state.indikatorList
    };

    if (!payload.nama_rencana) {
      alert('Nama rencana wajib diisi');
      return;
    }

    if (state.currentId) {
      await api()(`/api/rencana-strategis/${state.currentId}`, { method: 'PUT', body: payload });
    } else {
      await api()('/api/rencana-strategis', { method: 'POST', body: payload });
    }

    alert('Rencana strategis berhasil disimpan');
    await fetchInitialData();
    resetForm();
  }

  function resetForm() {
    state.currentId = null;
    state.formValues = getDefaultForm();
    state.sasaranList = [];
    state.indikatorList = [];
    generateKode(true).then(render);
  }

  function startEdit(id) {
    const record = state.data.find((item) => item.id === id);
    if (!record) return;
    state.currentId = id;
    state.formValues = {
      kode: record.kode,
      visi_misi_id: record.visi_misi_id || '',
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
      const token = await getAuthToken?.();
      const response = await fetch(`${window.location.origin}${endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
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

