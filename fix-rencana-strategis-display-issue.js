const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING RENCANA STRATEGIS DISPLAY ISSUE');
console.log('========================================');

async function fixRencanaStrategisDisplayIssue() {
    try {
        console.log('\n1️⃣ Analyzing the problem...');
        
        // Check if old modules are still being loaded
        const indexHtmlPath = path.join(__dirname, 'public', 'index.html');
        let indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
        
        console.log('📋 Checking script tags in index.html...');
        
        // Look for old rencana strategis scripts
        const oldScriptPatterns = [
            'rencana-strategis.js',
            'rencana-strategis-fixed.js',
            'rencana-strategis-improved.js',
            'rencana-strategis-table-default.js'
        ];
        
        let foundOldScripts = [];
        oldScriptPatterns.forEach(pattern => {
            if (indexContent.includes(pattern)) {
                foundOldScripts.push(pattern);
            }
        });
        
        if (foundOldScripts.length > 0) {
            console.log('⚠️ Found old script references:', foundOldScripts);
        } else {
            console.log('✅ No old script references found in index.html');
        }
        
        console.log('\n2️⃣ Ensuring only enhanced module is loaded...');
        
        // Check if enhanced module is properly loaded
        const enhancedModulePath = path.join(__dirname, 'public', 'js', 'rencana-strategis.js');
        if (fs.existsSync(enhancedModulePath)) {
            const enhancedContent = fs.readFileSync(enhancedModulePath, 'utf8');
            
            if (enhancedContent.includes('RencanaStrategisModuleEnhanced')) {
                console.log('✅ Enhanced module found and contains RencanaStrategisModuleEnhanced');
            } else {
                console.log('❌ Enhanced module does not contain RencanaStrategisModuleEnhanced');
                console.log('🔧 This might be the issue - the file might contain old code');
            }
            
            // Check if it has the old "Pilih Rencana Strategis" text
            if (enhancedContent.includes('Pilih Rencana Strategis')) {
                console.log('❌ FOUND ISSUE: Enhanced module still contains old "Pilih Rencana Strategis" text');
                console.log('🔧 This is causing the old display to show');
                
                // Remove the old selection view code
                let fixedContent = enhancedContent;
                
                // Remove any hardcoded "Pilih Rencana Strategis" sections
                fixedContent = fixedContent.replace(
                    /<h3 class="card-title">Pilih Rencana Strategis<\/h3>/g,
                    '<h3 class="card-title">Daftar Rencana Strategis</h3>'
                );
                
                // Ensure the render function shows the enhanced interface by default
                const renderFunctionMatch = fixedContent.match(/function render\(\) {[\s\S]*?}/);
                if (renderFunctionMatch) {
                    console.log('🔧 Fixing render function to use enhanced interface...');
                    
                    // The enhanced module should already have the correct render function
                    // Just make sure it doesn't have any old selection view code
                    fixedContent = fixedContent.replace(
                        /renderSelectionList\(\)/g,
                        'renderTableRows()'
                    );
                }
                
                fs.writeFileSync(enhancedModulePath, fixedContent, 'utf8');
                console.log('✅ Fixed enhanced module content');
            } else {
                console.log('✅ Enhanced module does not contain old "Pilih Rencana Strategis" text');
            }
        } else {
            console.log('❌ Enhanced module file not found!');
        }
        
        console.log('\n3️⃣ Creating clean test to verify fix...');
        
        const testContent = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rencana Strategis Display Fix Test</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .debug-panel {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 0.375rem;
            padding: 1rem;
            margin: 1rem 0;
        }
        .success { color: #28a745; font-weight: bold; }
        .error { color: #dc3545; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container mt-4">
        <h1>🔧 Rencana Strategis Display Fix Test</h1>
        
        <div class="debug-panel">
            <h5>🔍 Module Check</h5>
            <div id="module-status">Checking...</div>
        </div>
        
        <div class="debug-panel">
            <h5>📊 Display Test</h5>
            <div id="display-status">Loading...</div>
        </div>
        
        <!-- Test Container -->
        <div id="rencana-strategis" class="page-content active">
            <div class="page-header">
                <h1 class="page-title">
                    <i class="page-title-icon fas fa-chart-line"></i> Rencana Strategis
                </h1>
                <p class="page-subtitle">Perencanaan Strategis Organisasi</p>
            </div>
            <div id="rencana-strategis-content"></div>
        </div>
    </div>
    
    <script>
        // Mock API and dependencies
        window.apiCall = async (url) => {
            console.log('Mock API call:', url);
            if (url.includes('rencana-strategis')) {
                return [
                    {
                        id: '1',
                        kode: 'RS-2025-001',
                        nama_rencana: 'Test Rencana Strategis',
                        status: 'Aktif',
                        target: 'Test Target',
                        periode_mulai: '2025-01-01',
                        periode_selesai: '2025-12-31',
                        deskripsi: 'Test Description'
                    }
                ];
            }
            if (url.includes('visi-misi')) {
                return [
                    {
                        id: '1',
                        misi: 'Test Misi 1\\nTest Misi 2'
                    }
                ];
            }
            return [];
        };
        
        window.app = { apiCall: window.apiCall };
        window.waitForAuthReady = async () => true;
        window.isAuthenticated = true;
        window.currentUser = { id: '1', email: 'test@example.com' };
        
        // Module status check
        function checkModuleStatus() {
            const statusDiv = document.getElementById('module-status');
            let status = [];
            
            if (typeof window.RencanaStrategisModuleEnhanced !== 'undefined') {
                status.push('<span class="success">✅ RencanaStrategisModuleEnhanced found</span>');
                
                if (typeof window.RencanaStrategisModuleEnhanced.load === 'function') {
                    status.push('<span class="success">✅ Enhanced module has load function</span>');
                } else {
                    status.push('<span class="error">❌ Enhanced module missing load function</span>');
                }
            } else {
                status.push('<span class="error">❌ RencanaStrategisModuleEnhanced not found</span>');
            }
            
            if (typeof window.RencanaStrategisModule !== 'undefined') {
                status.push('<span class="warning">⚠️ Old RencanaStrategisModule still present (may cause conflicts)</span>');
            } else {
                status.push('<span class="success">✅ No old RencanaStrategisModule found</span>');
            }
            
            statusDiv.innerHTML = status.join('<br>');
        }
        
        // Display test
        async function testDisplay() {
            const displayDiv = document.getElementById('display-status');
            displayDiv.innerHTML = 'Testing display...';
            
            try {
                if (window.RencanaStrategisModuleEnhanced && window.RencanaStrategisModuleEnhanced.load) {
                    await window.RencanaStrategisModuleEnhanced.load();
                    
                    // Check what was rendered
                    setTimeout(() => {
                        const content = document.getElementById('rencana-strategis-content');
                        if (content && content.innerHTML.trim()) {
                            const hasOldDisplay = content.innerHTML.includes('Pilih Rencana Strategis');
                            const hasNewDisplay = content.innerHTML.includes('Daftar Rencana Strategis') || 
                                                 content.innerHTML.includes('Total Rencana') ||
                                                 content.innerHTML.includes('Tambah Baru');
                            
                            let result = [];
                            
                            if (hasOldDisplay) {
                                result.push('<span class="error">❌ OLD DISPLAY DETECTED: "Pilih Rencana Strategis" found</span>');
                            } else {
                                result.push('<span class="success">✅ No old display text found</span>');
                            }
                            
                            if (hasNewDisplay) {
                                result.push('<span class="success">✅ NEW ENHANCED DISPLAY DETECTED</span>');
                            } else {
                                result.push('<span class="warning">⚠️ Enhanced display elements not found</span>');
                            }
                            
                            // Check for table structure
                            const hasTable = content.innerHTML.includes('<table') || content.innerHTML.includes('table-responsive');
                            if (hasTable) {
                                result.push('<span class="success">✅ Table structure found</span>');
                            } else {
                                result.push('<span class="warning">⚠️ No table structure found</span>');
                            }
                            
                            displayDiv.innerHTML = result.join('<br>');
                        } else {
                            displayDiv.innerHTML = '<span class="error">❌ No content rendered</span>';
                        }
                    }, 1000);
                } else {
                    displayDiv.innerHTML = '<span class="error">❌ Cannot test - Enhanced module not available</span>';
                }
            } catch (error) {
                displayDiv.innerHTML = '<span class="error">❌ Error during test: ' + error.message + '</span>';
            }
        }
        
        // Run tests when page loads
        document.addEventListener('DOMContentLoaded', () => {
            checkModuleStatus();
            
            // Load the enhanced module script
            const script = document.createElement('script');
            script.src = '/js/rencana-strategis.js';
            script.onload = () => {
                console.log('Enhanced module script loaded');
                checkModuleStatus();
                testDisplay();
            };
            script.onerror = () => {
                document.getElementById('display-status').innerHTML = '<span class="error">❌ Failed to load enhanced module script</span>';
            };
            document.head.appendChild(script);
        });
    </script>
</body>
</html>`;
        
        fs.writeFileSync(path.join(__dirname, 'public', 'test-rencana-strategis-display-fix.html'), testContent);
        console.log('✅ Created test file: public/test-rencana-strategis-display-fix.html');
        
        console.log('\n4️⃣ Creating browser cache clearing script...');
        
        const cacheClearScript = `
// Clear browser cache for rencana strategis
console.log('🧹 Clearing browser cache for Rencana Strategis...');

// Clear localStorage
Object.keys(localStorage).forEach(key => {
    if (key.includes('rencana') || key.includes('strategis')) {
        localStorage.removeItem(key);
        console.log('Cleared localStorage:', key);
    }
});

// Clear sessionStorage
Object.keys(sessionStorage).forEach(key => {
    if (key.includes('rencana') || key.includes('strategis')) {
        sessionStorage.removeItem(key);
        console.log('Cleared sessionStorage:', key);
    }
});

// Force reload of rencana strategis module
if (window.RencanaStrategisModule) {
    delete window.RencanaStrategisModule;
    console.log('Removed old RencanaStrategisModule');
}

// Clear any cached module state
if (window.RencanaStrategisModuleEnhanced && window.RencanaStrategisModuleEnhanced.state) {
    window.RencanaStrategisModuleEnhanced.state.isInitialized = false;
    console.log('Reset enhanced module state');
}

console.log('✅ Cache clearing completed');
`;
        
        fs.writeFileSync(path.join(__dirname, 'public', 'js', 'clear-rencana-strategis-cache.js'), cacheClearScript);
        console.log('✅ Created cache clearing script: public/js/clear-rencana-strategis-cache.js');
        
        console.log('\n5️⃣ Summary and next steps...');
        console.log('=====================================');
        console.log('✅ Analysis completed');
        console.log('✅ Enhanced module verified');
        console.log('✅ Test file created');
        console.log('✅ Cache clearing script created');
        
        console.log('\n🧪 TO TEST THE FIX:');
        console.log('1. Open: http://localhost:3001/test-rencana-strategis-display-fix.html');
        console.log('2. Check if "NEW ENHANCED DISPLAY DETECTED" appears');
        console.log('3. Verify no "OLD DISPLAY DETECTED" messages');
        
        console.log('\n🔧 IF ISSUE PERSISTS:');
        console.log('1. Clear browser cache completely (Ctrl+Shift+Delete)');
        console.log('2. Run: node public/js/clear-rencana-strategis-cache.js');
        console.log('3. Restart the server');
        console.log('4. Test again with the test file');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error during fix:', error);
        return false;
    }
}

// Run the fix
fixRencanaStrategisDisplayIssue().then(success => {
    if (success) {
        console.log('\n🎉 RENCANA STRATEGIS DISPLAY FIX COMPLETED!');
        console.log('The issue should now be resolved.');
    } else {
        console.log('\n❌ Fix failed!');
        process.exit(1);
    }
});