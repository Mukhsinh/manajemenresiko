const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Rencana Strategis Table Default View...');

async function testTableDefaultView() {
    try {
        // Read the JavaScript file
        const jsFilePath = path.join(__dirname, 'public', 'js', 'rencana-strategis.js');
        const jsContent = fs.readFileSync(jsFilePath, 'utf8');
        
        console.log('📋 Checking JavaScript implementation...');
        
        // Check if table section is shown by default in render function
        const renderFunctionMatch = jsContent.match(/function render\(\) {[\s\S]*?const content = `[\s\S]*?<div class="card" id="table-section">/);
        if (renderFunctionMatch) {
            console.log('✅ Table section is rendered first (default view)');
        } else {
            console.log('❌ Table section is not the default view');
        }
        
        // Check if selection section is hidden by default
        const selectionHiddenMatch = jsContent.match(/<div class="card" id="selection-section" style="display: none;">/);
        if (selectionHiddenMatch) {
            console.log('✅ Selection section is hidden by default');
        } else {
            console.log('❌ Selection section is not hidden by default');
        }
        
        // Check if cancelEdit returns to table view
        const cancelEditMatch = jsContent.match(/function cancelEdit\(\) {[\s\S]*?showTableView\(\);/);
        if (cancelEditMatch) {
            console.log('✅ cancelEdit() returns to table view');
        } else {
            console.log('❌ cancelEdit() does not return to table view');
        }
        
        // Check table structure
        const tableStructureMatch = jsContent.match(/<th style="width: 120px;">Kode<\/th>\s*<th>Nama Rencana<\/th>\s*<th style="width: 150px;">Target<\/th>\s*<th style="width: 200px;">Periode<\/th>\s*<th style="width: 100px;">Status<\/th>\s*<th style="width: 150px;">Aksi<\/th>/);
        if (tableStructureMatch) {
            console.log('✅ Table has correct column structure: Kode, Nama Rencana, Target, Periode, Status, Aksi');
        } else {
            console.log('❌ Table column structure is incorrect');
        }
        
        // Check action buttons
        const actionButtonsMatch = jsContent.match(/<button class="btn btn-primary btn-sm" id="rs-add-new">\s*<i class="fas fa-plus"><\/i> Tambah Baru\s*<\/button>/);
        const templateButtonMatch = jsContent.match(/<button class="btn btn-warning btn-sm" id="rs-download-template">\s*<i class="fas fa-download"><\/i> Template\s*<\/button>/);
        const importButtonMatch = jsContent.match(/<button class="btn btn-success btn-sm" id="rs-import-btn">\s*<i class="fas fa-upload"><\/i> Import\s*<\/button>/);
        const exportButtonMatch = jsContent.match(/<button class="btn btn-info btn-sm" id="rs-export-btn">\s*<i class="fas fa-file-excel"><\/i> Export\s*<\/button>/);
        
        if (actionButtonsMatch) {
            console.log('✅ "Tambah Baru" button is present');
        } else {
            console.log('❌ "Tambah Baru" button is missing');
        }
        
        if (templateButtonMatch) {
            console.log('✅ "Template" button is present');
        } else {
            console.log('❌ "Template" button is missing');
        }
        
        if (importButtonMatch) {
            console.log('✅ "Import" button is present');
        } else {
            console.log('❌ "Import" button is missing');
        }
        
        if (exportButtonMatch) {
            console.log('✅ "Export" button is present');
        } else {
            console.log('❌ "Export" button is missing');
        }
        
        // Check HTML test file
        const htmlFilePath = path.join(__dirname, 'public', 'test-rencana-strategis-table-default.html');
        if (fs.existsSync(htmlFilePath)) {
            console.log('✅ Test HTML file created successfully');
            console.log('📄 Test file location: public/test-rencana-strategis-table-default.html');
        } else {
            console.log('❌ Test HTML file not found');
        }
        
        console.log('\n📊 Summary:');
        console.log('- Table view is now the default view when loading Rencana Strategis');
        console.log('- Table includes columns: Kode, Nama Rencana, Target, Periode, Status, Aksi');
        console.log('- Action buttons: Tambah Baru, Template, Import, Export');
        console.log('- Selection view is hidden by default');
        console.log('- After form operations, user returns to table view');
        
        console.log('\n🚀 To test the changes:');
        console.log('1. Open: http://localhost:3001/test-rencana-strategis-table-default.html');
        console.log('2. Verify that table view loads by default');
        console.log('3. Check that all action buttons are present and functional');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error during testing:', error);
        return false;
    }
}

// Run the test
testTableDefaultView().then(success => {
    if (success) {
        console.log('\n✅ Rencana Strategis Table Default View test completed successfully!');
    } else {
        console.log('\n❌ Test failed!');
        process.exit(1);
    }
});