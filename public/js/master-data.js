const getMasterApi = () => window.app?.apiCall || window.apiCall;
const getMasterToken = () => (typeof getAuthToken === 'function' ? getAuthToken() : null);

const masterConfigs = {
  probability: {
    title: 'Kriteria Probabilitas',
    endpoint: 'probability-criteria',
    fields: [
      { key: 'index', label: 'Indeks', type: 'number' },
      { key: 'probability', label: 'Probabilitas', type: 'text' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
      { key: 'percentage', label: 'Persentase', type: 'text' }
    ]
  },
  impact: {
    title: 'Kriteria Dampak',
    endpoint: 'impact-criteria',
    fields: [
      { key: 'index', label: 'Indeks', type: 'number' },
      { key: 'impact', label: 'Dampak', type: 'text' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' }
    ]
  },
  categories: {
    title: 'Kategori Risiko',
    endpoint: 'risk-categories',
    fields: [
      { key: 'name', label: 'Nama Kategori', type: 'text' },
      { key: 'definition', label: 'Definisi', type: 'textarea' }
    ]
  },
  'work-units': {
    title: 'Unit Kerja',
    endpoint: 'work-units',
    fields: [
      { key: 'code', label: 'Kode Unit Kerja', type: 'text', readonly: true },
      { key: 'name', label: 'Nama Unit Kerja', type: 'text' },
      { key: 'jenis', label: 'Jenis', type: 'select', options: [
        { value: 'rawat inap', label: 'Rawat Inap' },
        { value: 'rawat jalan', label: 'Rawat Jalan' },
        { value: 'penunjang medis', label: 'Penunjang Medis' },
        { value: 'administrasi', label: 'Administrasi' },
        { value: 'manajemen', label: 'Manajemen' }
      ]},
      { key: 'kategori', label: 'Kategori', type: 'select', options: [
        { value: 'klinis', label: 'Klinis' },
        { value: 'non klinis', label: 'Non Klinis' }
      ]},
      { key: 'organization_id', label: 'Organisasi', type: 'select', source: 'organizations' },
      { key: 'manager_name', label: 'Nama Manajer', type: 'text' },
      { key: 'manager_email', label: 'Email Manajer', type: 'email' }
    ]
  }
};

const masterState = {
  currentType: 'probability',
  data: {},
  organizations: [],
  initialized: false
};

async function loadMasterData() {
  try {
    await ensureMasterSupportingData();
    if (!masterState.initialized) {
      document.querySelectorAll('.master-tab-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          switchMasterTab(e.currentTarget.dataset.master);
        });
      });
      masterState.initialized = true;
    }
    switchMasterTab(masterState.currentType || 'probability');
  } catch (error) {
    console.error('Load master data error:', error);
  }
}

async function ensureMasterSupportingData() {
  if (!masterState.organizations.length) {
    try {
      masterState.organizations = await getMasterApi()('/api/organizations');
    } catch (error) {
      console.warn('Gagal memuat data organisasi:', error.message);
      masterState.organizations = [];
    }
  }
}

function switchMasterTab(type) {
  masterState.currentType = type;
  document.querySelectorAll('.master-tab-btn').forEach((btn) => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`[data-master="${type}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  loadMasterDataContent(type);
}

async function loadMasterDataContent(type) {
  const config = masterConfigs[type];
  const container = document.getElementById('master-data-content');
  if (!config || !container) return;
  
  try {
    // Try authenticated endpoint first, fallback to test endpoint
    let data;
    try {
      data = await getMasterApi()(`/api/master-data/${config.endpoint}`);
      // console.log(`Master data loaded from authenticated endpoint (${type}):`, data?.length || 0, 'records');
    } catch (authError) {
      console.warn(`Authenticated endpoint failed for ${type}, trying test endpoint:`, authError.message);
      try {
        data = await getMasterApi()(`/api/test-data/master/${config.endpoint}`);
        // console.log(`Master data loaded from test endpoint (${type}):`, data?.length || 0, 'records');
      } catch (testError) {
        console.error(`Both endpoints failed for ${type}:`, testError.message);
        throw new Error('Tidak dapat memuat data. Silakan login terlebih dahulu.');
      }
    }
    
    masterState.data[type] = data || [];
    container.innerHTML = renderMasterSection(config, masterState.data[type]);
  } catch (error) {
    console.error('Error loading master data:', error);
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error memuat data</h5>
          <p>${error.message}</p>
          <button onclick="loadMasterDataContent('${type}')" class="btn btn-primary">Coba Lagi</button>
        </div>
      </div>
    `;
  }
}

function renderMasterSection(config, data) {
  const rows = (data || [])
    .map(
      (item) => `
        <tr>
          ${config.fields.map((field) => `<td>${formatFieldValue(field, item)}</td>`).join('')}
          <td>
            <div class="table-actions">
              <button class="btn btn-edit btn-sm" data-action="edit" data-endpoint="${config.endpoint}" data-id="${item.id}"><i class="fas fa-edit"></i></button>
              <button class="btn btn-delete btn-sm" data-action="delete" data-endpoint="${config.endpoint}" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>`
    )
    .join('');

  const html = `
    <div class="master-actions-bar">
      <div class="action-group">
        <button class="btn btn-warning btn-sm" data-action="download-template" data-endpoint="${config.endpoint}"><i class="fas fa-download"></i> Unduh Template</button>
        <button class="btn btn-success btn-sm" data-action="import" data-endpoint="${config.endpoint}"><i class="fas fa-upload"></i> Import Data</button>
        <button class="btn btn-primary btn-sm" data-action="add" data-endpoint="${config.endpoint}"><i class="fas fa-plus"></i> Tambah Data</button>
        <button class="btn btn-info btn-sm" data-action="download-report" data-endpoint="${config.endpoint}"><i class="fas fa-file-alt"></i> Unduh Laporan</button>
      </div>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          ${config.fields.map((field) => `<th>${field.label}</th>`).join('')}
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="100%" class="text-center">Belum ada data</td></tr>'}</tbody>
    </table>
    ${renderMasterForm(config)}
  `;

  // Add event listeners after rendering
  setTimeout(() => {
    bindMasterActionEvents();
  }, 100);

  return html;
}

function bindMasterActionEvents() {
  // Remove existing listeners to prevent duplicates
  document.querySelectorAll('[data-action]').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });

  // Add new listeners specifically for master data actions
  document.querySelectorAll('[data-action]').forEach(btn => {
    // Only bind if this is within master data context
    const masterDataContent = document.getElementById('master-data-content');
    if (masterDataContent && masterDataContent.contains(btn)) {
      btn.addEventListener('click', handleMasterAction);
      btn.setAttribute('data-master-bound', 'true');
    }
  });
}

function handleMasterAction(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const action = button.dataset.action;
  const endpoint = button.dataset.endpoint;
  const id = button.dataset.id;

  console.log('Master action:', action, 'endpoint:', endpoint, 'id:', id);

  switch (action) {
    case 'add':
      showMasterDataForm(endpoint);
      break;
    case 'edit':
      editMasterData(endpoint, id);
      break;
    case 'delete':
      deleteMasterData(endpoint, id);
      break;
    case 'download-template':
      downloadMasterTemplate(endpoint);
      break;
    case 'download-report':
      downloadMasterReport(endpoint);
      break;
    case 'import':
      importMasterData(endpoint);
      break;
    default:
      console.warn('Unknown action:', action);
  }
}

function formatFieldValue(field, item) {
  const value = item[field.key];
  if (field.source === 'organizations') {
    return getOrganizationName(value) || '-';
  }
  if (field.type === 'select' && field.options) {
    const option = field.options.find(opt => opt.value === value);
    return option ? option.label : (value || '-');
  }
  return value ?? '-';
}

function getOrganizationName(id) {
  if (!id) return '';
  const org = masterState.organizations.find((item) => item.id === id);
  return org ? org.name : '';
}

function renderMasterForm(config) {
  const fields = config.fields
    .map((field) => {
      if (field.type === 'textarea') {
        return `
          <div class="form-group">
            <label class="form-label">${field.label}</label>
            <textarea id="form-${field.key}" class="form-control" ${field.readonly ? 'readonly' : ''}></textarea>
          </div>`;
      }
      if (field.type === 'select' && field.source === 'organizations') {
        const options = ['<option value="">Pilih Organisasi</option>']
          .concat(masterState.organizations.map((org) => `<option value="${org.id}">${org.name}</option>`))
          .join('');
        return `
          <div class="form-group">
            <label class="form-label">${field.label}</label>
            <select id="form-${field.key}" class="form-control">
              ${options}
            </select>
          </div>`;
      }
      if (field.type === 'select' && field.options) {
        const options = ['<option value="">Pilih ' + field.label + '</option>']
          .concat(field.options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`))
          .join('');
        return `
          <div class="form-group">
            <label class="form-label">${field.label}</label>
            <select id="form-${field.key}" class="form-control">
              ${options}
            </select>
          </div>`;
      }
      const type = field.type === 'email' ? 'email' : field.type;
      return `
        <div class="form-group">
          <label class="form-label">${field.label}</label>
          <input type="${type}" id="form-${field.key}" class="form-control" ${field.readonly ? 'readonly' : ''}>
        </div>`;
    })
    .join('');

  return `
    <div id="master-data-form-modal" class="modal" style="display:none;">
      <div class="modal-content" style="max-width:520px;">
        <div class="modal-header">
          <h3 class="modal-title">Kelola ${config.title}</h3>
          <button class="modal-close" onclick="closeMasterDataForm()">&times;</button>
        </div>
        <form id="master-data-form">
          ${fields}
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Simpan</button>
            <button type="button" class="btn btn-secondary" onclick="closeMasterDataForm()">Batal</button>
          </div>
        </form>
      </div>
    </div>`;
}

async function showMasterDataForm(endpoint) {
  const modal = document.getElementById('master-data-form-modal');
  const form = document.getElementById('master-data-form');
  if (!modal || !form) return;
  form.reset();
  modal.dataset.endpoint = endpoint;
  modal.dataset.id = '';
  if (endpoint === 'work-units') {
    try {
      const response = await getMasterApi()('/api/master-data/work-units/generate-code');
      if (response?.code) {
        const codeInput = document.getElementById('form-code');
        if (codeInput) codeInput.value = response.code;
      }
    } catch (error) {
      console.warn('Gagal mengambil kode unit kerja:', error.message);
    }
  }
  modal.style.display = 'flex';
  form.onsubmit = (event) => saveMasterData(event, endpoint);
}

function closeMasterDataForm() {
  const modal = document.getElementById('master-data-form-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.dataset.id = '';
  }
}

async function editMasterData(endpoint, id) {
  const modal = document.getElementById('master-data-form-modal');
  const form = document.getElementById('master-data-form');
  const records = masterState.data[masterState.currentType] || [];
  const record = records.find((item) => item.id === id);
  if (!modal || !form || !record) return;
  Object.entries(record).forEach(([key, value]) => {
    const input = document.getElementById(`form-${key}`);
    if (input) input.value = value ?? '';
  });
  modal.dataset.endpoint = endpoint;
  modal.dataset.id = id;
  modal.style.display = 'flex';
  form.onsubmit = (event) => saveMasterData(event, endpoint);
}

async function saveMasterData(event, endpoint) {
  event.preventDefault();
  const modal = document.getElementById('master-data-form-modal');
  const id = modal?.dataset.id;
  const payload = {};
  document.querySelectorAll('#master-data-form input, #master-data-form textarea, #master-data-form select').forEach((input) => {
    const key = input.id.replace('form-', '');
    payload[key] = input.value;
  });
  // Cast numeric fields
  ['index'].forEach((field) => {
    if (payload[field] !== undefined && payload[field] !== '') {
      payload[field] = Number(payload[field]);
    }
  });
  try {
    await getMasterApi()(`/api/master-data/${endpoint}${id ? `/${id}` : ''}`, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    alert('Data berhasil disimpan');
    closeMasterDataForm();
    loadMasterDataContent(masterState.currentType);
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function deleteMasterData(endpoint, id) {
  if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
  try {
    await getMasterApi()(`/api/master-data/${endpoint}/${id}`, { method: 'DELETE' });
    alert('Data berhasil dihapus');
    loadMasterDataContent(masterState.currentType);
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function downloadMasterTemplate(endpoint) {
  await downloadFileWithAuth(`/api/master-data/${endpoint}/template`, `template-${endpoint}.xlsx`);
}

async function downloadMasterReport(endpoint) {
  await downloadFileWithAuth(`/api/master-data/${endpoint}/export`, `laporan-${endpoint}.xlsx`);
}

async function downloadFileWithAuth(url, filename) {
  try {
    console.log('Downloading file:', url);
    
    // Get auth token
    const token = await getMasterToken();
    console.log('Token available:', !!token);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${window.location.origin}${url}`, {
      method: 'GET',
      headers: headers
    });
    
    console.log('Download response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Download error response:', errorText);
      throw new Error(`Gagal mengunduh berkas: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('Blob size:', blob.size);
    
    if (blob.size === 0) {
      throw new Error('File kosong atau tidak ditemukan');
    }
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    
    console.log('File downloaded successfully:', filename);
  } catch (error) {
    console.error('Download error:', error);
    alert('Error mengunduh file: ' + error.message);
  }
}

function importMasterData(endpoint) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls';
  input.onchange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      console.log('Importing file:', file.name, 'Size:', file.size);
      
      // Show loading state
      const container = document.getElementById('master-data-content');
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading-overlay';
      loadingDiv.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Mengimpor data...</div>';
      container.appendChild(loadingDiv);
      
      // Check if XLSX is available
      if (typeof XLSX === 'undefined') {
        throw new Error('XLSX library tidak tersedia. Silakan refresh halaman.');
      }
      
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('File Excel tidak memiliki sheet yang valid');
      }
      
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      
      console.log('Parsed data:', json.length, 'rows');
      
      if (json.length === 0) {
        throw new Error('File Excel kosong atau tidak memiliki data yang valid');
      }
      
      const response = await getMasterApi()(`/api/master-data/${endpoint}/import`, {
        method: 'POST',
        body: JSON.stringify({ items: json })
      });
      
      console.log('Import response:', response);
      
      // Remove loading state
      if (loadingDiv.parentNode) {
        loadingDiv.parentNode.removeChild(loadingDiv);
      }
      
      alert(`Import berhasil! ${json.length} data telah diimpor.`);
      loadMasterDataContent(masterState.currentType);
      
    } catch (error) {
      console.error('Import error:', error);
      
      // Remove loading state
      const loadingDiv = document.querySelector('.loading-overlay');
      if (loadingDiv && loadingDiv.parentNode) {
        loadingDiv.parentNode.removeChild(loadingDiv);
      }
      
      alert('Error import: ' + error.message);
    }
  };
  input.click();
}

window.loadMasterData = loadMasterData;
window.showMasterDataForm = showMasterDataForm;
window.closeMasterDataForm = closeMasterDataForm;
window.editMasterData = editMasterData;
window.deleteMasterData = deleteMasterData;
window.saveMasterData = saveMasterData;
window.downloadMasterTemplate = downloadMasterTemplate;
window.downloadMasterReport = downloadMasterReport;
window.importMasterData = importMasterData;

