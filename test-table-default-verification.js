const fs = require('fs');
const path = require('path');

console.log('🧪 Verifying Table Default Implementation...');

async function verifyTableDefault() {
    try {
        // Read the main JavaScript file
        const jsFilePath = path.join(__dirname, 'public', 'js', 'rencana-strategis.js');
        const jsContent = fs.readFileSync(jsFilePath, 'utf8');
        
        console.log('📋 Checking main rencana-strategis.js file...');
        
        // Check for table default indicators
        const checks = [
            {
                name: 'Table Default Version Comment',
                pattern: /Table Default Version/,
                required: true
            },
            {
                name: 'Current View State',
                pattern: /currentView: 'table'/,
                required: true
            },
            {
                name: 'Table Section First in Render',
                pattern: /<div class="card" id="table-section">/,
                required: true
            },
            {
                name: 'Force Table View in Render',
                pattern: /showTableView\(\);/,
                required: true
            },
            {
                name: 'Cancel Edit Returns to Table',
                pattern: /showTableView\(\); \/\/ Always return to table view/,
                required: true
            },
            {
                name: 'Table Columns Structure',
                pattern: /<th style="width: 120px;">Kode<\/th>/,
                required: true
            },
            {
                name: 'Action Buttons Present',
                pattern: /Tambah Baru.*Template.*Import.*Export/s,
                required: true
            }
        ];
        
        let passedChecks = 0;
        let totalChecks = checks.length;
        
        checks.forEach(check => {
            if (check.pattern.test(jsContent)) {
                console.log(`✅ ${check.name}: PASSED`);
                passedChecks++;
            } else {
                console.log(`❌ ${check.name}: FAILED`);
                if (check.required) {
                    console.log(`   Required check failed!`);
                }
            }
        });
        
        console.log(`\n📊 Results: ${passedChecks}/${totalChecks} checks passed`);
        
        // Check test files
        const testFiles = [
            'public/test-rencana-strategis-table-view-default.html',
            'public/js/rencana-strategis-table-default.js'
        ];
        
        console.log('\n📄 Checking test files...');
        testFiles.forEach(file => {
            if (fs.existsSync(path.join(__dirname, file))) {
                console.log(`✅ ${file}: EXISTS`);
            } else {
                console.log(`❌ ${file}: MISSING`);
            }
        });
        
        // Provide testing instructions
        console.log('\n🚀 Testing Instructions:');
        console.log('1. Open: http://localhost:3001/test-rencana-strategis-table-view-default.html');
        console.log('2. Verify that table view loads immediately (no selection view)');
        console.log('3. Check that table shows columns: Kode, Nama Rencana, Target, Periode, Status, Aksi');
        console.log('4. Verify action buttons: Tambah Baru, Template, Import, Export');
        console.log('5. Test form operations return to table view');
        
        // Summary
        console.log('\n📋 Summary of Changes:');
        console.log('- Table view is now the default view (no more selection view first)');
        console.log('- All form operations return to table view');
        console.log('- Table includes all required columns and action buttons');
        console.log('- File has been updated with table-default version');
        
        if (passedChecks === totalChecks) {
            console.log('\n✅ All checks passed! Table default implementation is correct.');
            return true;
        } else {
            console.log('\n❌ Some checks failed. Please review the implementation.');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error during verification:', error);
        return false;
    }
}

// Run the verification
verifyTableDefault().then(success => {
    if (success) {
        console.log('\n🎉 Table Default Verification completed successfully!');
        console.log('The Rencana Strategis module now uses table view as default.');
    } else {
        console.log('\n💥 Verification failed!');
        process.exit(1);
    }
});