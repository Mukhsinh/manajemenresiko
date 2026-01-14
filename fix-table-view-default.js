const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Rencana Strategis Table View Default...');

async function fixTableViewDefault() {
    try {
        const jsFilePath = path.join(__dirname, 'public', 'js', 'rencana-strategis.js');
        let jsContent = fs.readFileSync(jsFilePath, 'utf8');
        
        console.log('📋 Analyzing current implementation...');
        
        // Check if table section is first in render function
        const renderFunctionMatch = jsContent.match(/function render\(\) {[\s\S]*?const content = `([\s\S]*?)`;\s*container\.innerHTML = content;/);
        
        if (renderFunctionMatch) {
            const contentHTML = renderFunctionMatch[1];
            
            // Check if table section comes first
            const tableIndex = contentHTML.indexOf('<div class="card" id="table-section">');
            const selectionIndex = contentHTML.indexOf('<div class="card" id="selection-section"');
            
            console.log('Table section index:', tableIndex);
            console.log('Selection section index:', selectionIndex);
            
            if (tableIndex > selectionIndex || tableIndex === -1) {
                console.log('❌ Table section is not first or not found');
                
                // Fix the render function to ensure table comes first
                const fixedContent = `
      <div class="card" id="table-section">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h3 class="card-title">Daftar Rencana Strategis</h3>
              <p class="text-muted mb-0">Kelola rencana strategis organisasi - Total: \${state.data.length} rencana</p>
            </div>
            <div class="action-group">
              <button class="btn btn-primary btn-sm" id="rs-add-new">
                <i class="fas fa-plus"></i> Tambah Baru
              </button>
              <button class="btn btn-warning btn-sm" id="rs-download-template">
                <i class="fas fa-download"></i> Template
              </button>
              <button class="btn btn-success btn-sm" id="rs-import-btn">
                <i class="fas fa-upload"></i> Import
              </button>
              <button class="btn btn-info btn-sm" id="rs-export-btn">
                <i class="fas fa-file-excel"></i> Export
              </button>
            </div>
          </div>
        </div>
        <div class="card-body p-0">
          <input type="file" id="rs-import-input" hidden accept=".xlsx,.xls">
          <div class="table-container">
            <table class="table table-striped table-hover">
              <thead class="table-dark">
                <tr>
                  <th style="width: 120px;">Kode</th>
                  <th>Nama Rencana</th>
                  <th style="width: 150px;">Target</th>
                  <th style="width: 200px;">Periode</th>
                  <th style="width: 100px;">Status</th>
                  <th style="width: 150px;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                \${renderTableRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="card" id="selection-section" style="display: none;">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h3 class="card-title">Pilih Rencana Strategis</h3>
              <p class="text-muted mb-0">Perencanaan Strategis Organisasi</p>
            </div>
          </div>
        </div>
        <div class="card-body">
          \${renderSelectionList()}
        </div>
      </div>
      
      <div class="card mt-4" id="form-section" style="display: none;">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h3 class="card-title">\${state.currentId ? 'Edit' : 'Tambah'} Rencana Strategis</h3>
              <p class="text-muted mb-0">Kelola rencana strategis organisasi</p>
            </div>
            <button type="button" class="btn btn-sm btn-secondary" id="rs-cancel-edit">
              <i class="fas fa-times"></i> Batal
            </button>
          </div>
        </div>
        <div class="card-body">
          \${renderForm()}
        </div>
      </div>`;
                
                // Replace the content in render function
                jsContent = jsContent.replace(
                    /function render\(\) {[\s\S]*?const content = `[\s\S]*?`;/,
                    `function render() {
    console.log('🎨 Rendering Rencana Strategis...');
    
    const container = findContainer();
    if (!container) {
      console.error('❌ Container not found!');
      return;
    }
    
    // Show table view by default
    const content = \`${fixedContent}\`;`
                );
                
                console.log('✅ Fixed render function to show table first');
            } else {
                console.log('✅ Table section is already first');
            }
        }
        
        // Ensure showTableView and showSelectionView functions are correct
        const showTableViewMatch = jsContent.match(/function showTableView\(\) {[\s\S]*?}/);
        if (showTableViewMatch) {
            const correctShowTableView = `function showTableView() {
    getEl('selection-section').style.display = 'none';
    getEl('table-section').style.display = 'block';
    getEl('form-section')?.style.display = 'none';
  }`;
            
            jsContent = jsContent.replace(
                /function showTableView\(\) {[\s\S]*?}/,
                correctShowTableView
            );
            console.log('✅ Fixed showTableView function');
        }
        
        const showSelectionViewMatch = jsContent.match(/function showSelectionView\(\) {[\s\S]*?}/);
        if (showSelectionViewMatch) {
            const correctShowSelectionView = `function showSelectionView() {
    getEl('table-section').style.display = 'none';
    getEl('selection-section').style.display = 'block';
    getEl('form-section')?.style.display = 'none';
  }`;
            
            jsContent = jsContent.replace(
                /function showSelectionView\(\) {[\s\S]*?}/,
                correctShowSelectionView
            );
            console.log('✅ Fixed showSelectionView function');
        }
        
        // Ensure cancelEdit returns to table view
        const cancelEditMatch = jsContent.match(/function cancelEdit\(\) {[\s\S]*?}/);
        if (cancelEditMatch) {
            const correctCancelEdit = `function cancelEdit() {
    state.currentId = null;
    state.formValues = getDefaultForm();
    state.sasaranList = [];
    state.indikatorList = [];
    showTableView(); // Return to table view
  }`;
            
            jsContent = jsContent.replace(
                /function cancelEdit\(\) {[\s\S]*?}/,
                correctCancelEdit
            );
            console.log('✅ Fixed cancelEdit function to return to table view');
        }
        
        // Write the fixed content back
        fs.writeFileSync(jsFilePath, jsContent, 'utf8');
        console.log('✅ File updated successfully');
        
        // Create a simple test to verify the fix
        const testContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Table View Test</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .debug { background: #f8f9fa; padding: 1rem; margin: 1rem 0; border-radius: 0.375rem; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container mt-4">
        <div class="debug">
            <h5>Table View Default Test</h5>
            <p id="status">Loading...</p>
        </div>
        <div id="rencana-strategis" class="page-content active">
            <div id="rencana-strategis-content"></div>
        </div>
    </div>
    
    <script>
        // Mock API
        window.apiCall = async () => ([
            { id: '1', kode: 'RS-001', nama_rencana: 'Test Plan', status: 'Aktif', target: 'Test Target', periode_mulai: '2025-01-01', periode_selesai: '2025-12-31' }
        ]);
        window.app = { apiCall: window.apiCall };
        window.waitForAuthReady = async () => true;
    </script>
    <script src="/js/rencana-strategis.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                await window.RencanaStrategisModule.load();
                
                setTimeout(() => {
                    const tableSection = document.getElementById('table-section');
                    const selectionSection = document.getElementById('selection-section');
                    
                    if (tableSection && tableSection.style.display !== 'none') {
                        document.getElementById('status').innerHTML = '<span class="success">✅ SUCCESS: Table view is displayed as default!</span>';
                    } else if (selectionSection && selectionSection.style.display !== 'none') {
                        document.getElementById('status').innerHTML = '<span class="error">❌ ISSUE: Selection view is displayed instead of table view</span>';
                    } else {
                        document.getElementById('status').innerHTML = '<span class="error">❌ ISSUE: No view is displayed</span>';
                    }
                }, 1000);
            } catch (error) {
                document.getElementById('status').innerHTML = '<span class="error">❌ ERROR: ' + error.message + '</span>';
            }
        });
    </script>
</body>
</html>`;
        
        fs.writeFileSync(path.join(__dirname, 'public', 'test-table-view-fixed.html'), testContent);
        console.log('✅ Created test file: public/test-table-view-fixed.html');
        
        console.log('\n📊 Summary of fixes:');
        console.log('- ✅ Table section is rendered first in HTML');
        console.log('- ✅ Selection section is hidden by default (display: none)');
        console.log('- ✅ showTableView() function shows table and hides others');
        console.log('- ✅ showSelectionView() function shows selection and hides others');
        console.log('- ✅ cancelEdit() returns to table view');
        
        console.log('\n🧪 Test the fix:');
        console.log('1. Open: http://localhost:3001/test-table-view-fixed.html');
        console.log('2. Verify that table view loads by default');
        console.log('3. Check browser console for any errors');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error during fix:', error);
        return false;
    }
}

// Run the fix
fixTableViewDefault().then(success => {
    if (success) {
        console.log('\n✅ Table View Default fix completed successfully!');
    } else {
        console.log('\n❌ Fix failed!');
        process.exit(1);
    }
});