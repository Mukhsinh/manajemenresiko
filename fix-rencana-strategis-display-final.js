/**
 * FIX RENCANA STRATEGIS DISPLAY - FINAL
 * Memastikan halaman menampilkan tampilan yang benar dengan kartu profesional
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Rencana Strategis Display...\n');

// 1. Update index.html untuk menambahkan CSS profesional
const indexPath = path.join(__dirname, 'public', 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Tambahkan CSS profesional jika belum ada
if (!indexContent.includes('rencana-strategis-professional.css')) {
    indexContent = indexContent.replace(
        '<link rel="stylesheet" href="/css/rencana-strategis-display-fix.css">',
        `<link rel="stylesheet" href="/css/rencana-strategis-display-fix.css">
    <link rel="stylesheet" href="/css/rencana-strategis-professional.css">`
    );
    
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ Added professional CSS to index.html');
}

// 2. Update rencana-strategis.js untuk menggunakan style profesional
const jsPath = path.join(__dirname, 'public', 'js', 'rencana-strategis.js');
let jsContent = fs.readFileSync(jsPath, 'utf8');

// Perbaiki fungsi renderStatCards untuk menggunakan class profesional
const newRenderStatCards = `
  function renderStatCards() {
    const aktif = state.data.filter(i => i.status === 'Aktif').length;
    const draft = state.data.filter(i => i.status === 'Draft').length;
    const selesai = state.data.filter(i => i.status === 'Selesai').length;
    
    return \`
      <div class="stat-cards-container fade-in">
        <div class="stat-card aktif">
          <div class="stat-card-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-card-value">\${aktif}</div>
          <div class="stat-card-label">Rencana Aktif</div>
        </div>
        <div class="stat-card draft">
          <div class="stat-card-icon">
            <i class="fas fa-edit"></i>
          </div>
          <div class="stat-card-value">\${draft}</div>
          <div class="stat-card-label">Draft</div>
        </div>
        <div class="stat-card selesai">
          <div class="stat-card-icon">
            <i class="fas fa-flag-checkered"></i>
          </div>
          <div class="stat-card-value">\${selesai}</div>
          <div class="stat-card-label">Selesai</div>
        </div>
        <div class="stat-card total">
          <div class="stat-card-icon">
            <i class="fas fa-list"></i>
          </div>
          <div class="stat-card-value">\${state.data.length}</div>
          <div class="stat-card-label">Total Rencana</div>
        </div>
      </div>
    \`;
  }
`;

// Perbaiki fungsi render untuk menggunakan class profesional
const newRender = `
  function render() {
    const container = getEl('rencana-strategis-content');
    if (!container) {
      console.error('❌ Container not found');
      return;
    }

    const content = \`
      <div class="fade-in">
        \${renderStatCards()}
        
        <div class="form-card mb-4" id="rs-form-container" style="display: \${state.showForm ? 'block' : 'none'};">
          <div class="form-card-header">
            <h3 class="form-card-title">
              <i class="fas fa-edit"></i>
              \${state.currentId ? 'Edit Rencana Strategis' : 'Tambah Rencana Strategis Baru'}
            </h3>
          </div>
          \${renderForm()}
        </div>
        
        <div class="table-card">
          <div class="table-card-header">
            <h3 class="table-card-title">
              <i class="fas fa-table"></i>
              Daftar Rencana Strategis
            </h3>
            <div class="table-card-actions">
              <button class="btn-success-enhanced" id="rs-add-new">
                <i class="fas fa-plus"></i> Tambah Baru
              </button>
              <button class="btn-outline-enhanced" id="rs-export-btn">
                <i class="fas fa-file-excel"></i> Export
              </button>
            </div>
          </div>
          <div class="table-card-body">
            <div class="table-responsive">
              <table class="table-enhanced">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama Rencana</th>
                    <th>Target</th>
                    <th>Periode</th>
                    <th>Status</th>
                    <th style="text-align: center;">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  \${renderTableRows()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    \`;
    
    container.innerHTML = content;
    bindEvents();
    console.log('✅ Rendered successfully');
  }
`;

// Perbaiki fungsi renderForm untuk menggunakan class profesional
const newRenderForm = `
  function renderForm() {
    return \`
      <form id="rs-form" class="row g-4">
        <div class="col-md-6">
          <div class="form-group-enhanced">
            <label class="form-label-enhanced">
              <i class="fas fa-barcode"></i>
              Kode Rencana
            </label>
            <input type="text" class="form-control-enhanced" id="rs-kode" value="\${state.formValues.kode}" readonly>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group-enhanced">
            <label class="form-label-enhanced">
              <i class="fas fa-flag"></i>
              Status
            </label>
            <select class="form-control-enhanced" id="rs-status">
              <option value="Draft" \${state.formValues.status === 'Draft' ? 'selected' : ''}>📝 Draft</option>
              <option value="Aktif" \${state.formValues.status === 'Aktif' ? 'selected' : ''}>✅ Aktif</option>
              <option value="Selesai" \${state.formValues.status === 'Selesai' ? 'selected' : ''}>🏁 Selesai</option>
            </select>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group-enhanced">
            <label class="form-label-enhanced">
              <i class="fas fa-bullseye"></i>
              Misi Strategis
            </label>
            <select class="form-control-enhanced" id="rs-misi">
              <option value="">Pilih Misi</option>
              \${renderMissionOptions()}
            </select>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group-enhanced">
            <label class="form-label-enhanced">
              <i class="fas fa-file-alt"></i>
              Nama Rencana <span class="text-danger">*</span>
            </label>
            <input type="text" class="form-control-enhanced" id="rs-nama" value="\${state.formValues.nama_rencana}" placeholder="Masukkan nama rencana strategis" required>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group-enhanced">
            <label class="form-label-enhanced">
              <i class="fas fa-calendar-alt"></i>
              Periode Mulai
            </label>
            <input type="date" class="form-control-enhanced" id="rs-mulai" value="\${state.formValues.periode_mulai}">
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group-enhanced">
            <label class="form-label-enhanced">
              <i class="fas fa-calendar-check"></i>
              Periode Selesai
            </label>
            <input type="date" class="form-control-enhanced" id="rs-selesai" value="\${state.formValues.periode_selesai}">
          </div>
        </div>
        <div class="col-12">
          <div class="form-group-enhanced">
            <label class="form-label-enhanced">
              <i class="fas fa-align-left"></i>
              Deskripsi
            </label>
            <textarea class="form-control-enhanced" id="rs-deskripsi" rows="4" placeholder="Masukkan deskripsi rencana strategis">\${state.formValues.deskripsi}</textarea>
          </div>
        </div>
        <div class="col-12">
          <div class="form-group-enhanced">
            <label class="form-label-enhanced">
              <i class="fas fa-crosshairs"></i>
              Target
            </label>
            <textarea class="form-control-enhanced" id="rs-target" rows="3" placeholder="Masukkan target yang ingin dicapai">\${state.formValues.target}</textarea>
          </div>
        </div>
        <div class="col-12 pt-3 border-top">
          <button type="submit" class="btn-primary-enhanced">
            <i class="fas fa-save"></i>
            \${state.currentId ? 'Update Data' : 'Simpan Data'}
          </button>
          <button type="button" class="btn-secondary-enhanced" id="rs-reset-btn">
            <i class="fas fa-undo"></i>
            Reset Form
          </button>
        </div>
      </form>
    \`;
  }
`;

// Perbaiki fungsi renderTableRows untuk menggunakan class profesional
const newRenderTableRows = `
  function renderTableRows() {
    if (!state.data || state.data.length === 0) {
      return \`
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <i class="fas fa-inbox"></i>
              <h5>Belum ada data</h5>
              <p>Klik "Tambah Baru" untuk menambahkan rencana strategis</p>
            </div>
          </td>
        </tr>
      \`;
    }
    
    return state.data.map(item => {
      const periode = item.periode_mulai && item.periode_selesai ? 
        \`\${formatDate(item.periode_mulai)} - \${formatDate(item.periode_selesai)}\` : '-';
      
      const statusClass = item.status === 'Aktif' ? 'aktif' : 
                         item.status === 'Draft' ? 'draft' : 'selesai';
      
      const statusIcon = item.status === 'Aktif' ? 'check-circle' : 
                        item.status === 'Draft' ? 'edit' : 'flag-checkered';
      
      return \`
        <tr>
          <td><strong>\${item.kode}</strong></td>
          <td>\${item.nama_rencana}</td>
          <td>\${item.target || '-'}</td>
          <td>\${periode}</td>
          <td>
            <span class="status-badge \${statusClass}">
              <i class="fas fa-\${statusIcon}"></i>
              \${item.status}
            </span>
          </td>
          <td>
            <div class="action-buttons-group">
              <button class="btn-action edit" onclick="RencanaStrategisModule.edit('\${item.id}')">
                <i class="fas fa-edit"></i>
                Edit
              </button>
              <button class="btn-action delete" onclick="RencanaStrategisModule.remove('\${item.id}')">
                <i class="fas fa-trash"></i>
                Hapus
              </button>
            </div>
          </td>
        </tr>
      \`;
    }).join('');
  }
`;

// Replace functions in JS file
if (jsContent.includes('function renderStatCards()')) {
    jsContent = jsContent.replace(
        /function renderStatCards\(\) \{[\s\S]*?\n  \}/,
        newRenderStatCards.trim()
    );
    console.log('✅ Updated renderStatCards function');
}

if (jsContent.includes('function render()')) {
    jsContent = jsContent.replace(
        /function render\(\) \{[\s\S]*?\n  \}/,
        newRender.trim()
    );
    console.log('✅ Updated render function');
}

if (jsContent.includes('function renderForm()')) {
    jsContent = jsContent.replace(
        /function renderForm\(\) \{[\s\S]*?\n  \}/,
        newRenderForm.trim()
    );
    console.log('✅ Updated renderForm function');
}

if (jsContent.includes('function renderTableRows()')) {
    jsContent = jsContent.replace(
        /function renderTableRows\(\) \{[\s\S]*?\n  \}/,
        newRenderTableRows.trim()
    );
    console.log('✅ Updated renderTableRows function');
}

fs.writeFileSync(jsPath, jsContent);
console.log('✅ Updated rencana-strategis.js\n');

console.log('🎉 Rencana Strategis display fixed successfully!');
console.log('\n📋 Changes made:');
console.log('  ✅ Added professional CSS styling');
console.log('  ✅ Updated stat cards with modern design');
console.log('  ✅ Enhanced form styling');
console.log('  ✅ Improved table appearance');
console.log('  ✅ Added professional action buttons');
console.log('  ✅ Added animations and transitions');
console.log('\n🚀 Please refresh your browser to see the changes!');
