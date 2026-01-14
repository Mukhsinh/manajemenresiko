#!/usr/bin/env node

// Force Rencana Strategis Reload - Port 3033 Fix
const axios = require('axios');

const BASE_URL = 'http://localhost:3033';

async function forceReloadRencanaStrategis() {
    console.log('🔄 FORCING RENCANA STRATEGIS RELOAD ON PORT 3033');
    console.log('=' .repeat(60));
    
    try {
        // 1. Test current state
        console.log('\n1. 🔍 Testing Current State...');
        const pageResponse = await axios.get(`${BASE_URL}/rencana-strategis`);
        console.log(`✅ Page accessible: ${pageResponse.status}`);
        
        // Check if page has the empty content div
        const hasEmptyContent = pageResponse.data.includes('<div id="rencana-strategis-content"></div>');
        console.log(`   - Has empty content div: ${hasEmptyContent ? '✅' : '❌'}`);
        
        // 2. Test JavaScript module
        console.log('\n2. 📄 Testing JavaScript Module...');
        const jsResponse = await axios.get(`${BASE_URL}/js/rencana-strategis.js`);
        console.log(`✅ JavaScript accessible: ${jsResponse.status}`);
        
        const jsContent = jsResponse.data;
        const hasTableDefault = jsContent.includes('Table Default Version');
        const hasLoadFunction = jsContent.includes('window.loadRencanaStrategis');
        const hasModuleExport = jsContent.includes('window.RencanaStrategisModule');
        
        console.log(`   - Has Table Default Version: ${hasTableDefault ? '✅' : '❌'}`);
        console.log(`   - Has loadRencanaStrategis function: ${hasLoadFunction ? '✅' : '❌'}`);
        console.log(`   - Has Module Export: ${hasModuleExport ? '✅' : '❌'}`);
        
        // 3. Create a test HTML file to force load the module
        console.log('\n3. 🛠️ Creating Force Load Test File...');
        
        const testHTML = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Force Rencana Strategis Load - Port 3033</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/rencana-strategis-table.css">
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 20px; 
            background: #f5f5f5;
        }
        .test-container { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 1200px;
            margin: 0 auto;
        }
        .status { 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 4px; 
        }
        .success { 
            background: #d4edda; 
            color: #155724; 
            border: 1px solid #c3e6cb; 
        }
        .error { 
            background: #f8d7da; 
            color: #721c24; 
            border: 1px solid #f5c6cb; 
        }
        .info { 
            background: #d1ecf1; 
            color: #0c5460; 
            border: 1px solid #bee5eb; 
        }
        .btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        .btn:hover {
            background: #0056b3;
        }
        .btn-success {
            background: #28a745;
        }
        .btn-success:hover {
            background: #1e7e34;
        }
        #rencana-strategis-content {
            min-height: 400px;
            border: 2px dashed #ddd;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="test-container">
        <h1><i class="fas fa-chart-line"></i> Force Rencana Strategis Load Test - Port 3033</h1>
        
        <div id="status-container">
            <div class="status info">
                <strong>🔄 Initializing...</strong> Testing Rencana Strategis module load
            </div>
        </div>
        
        <div class="button-group">
            <button class="btn" onclick="forceLoadModule()">
                <i class="fas fa-sync"></i> Force Load Module
            </button>
            <button class="btn btn-success" onclick="testTableView()">
                <i class="fas fa-table"></i> Test Table View
            </button>
            <button class="btn" onclick="clearCache()">
                <i class="fas fa-trash"></i> Clear Cache
            </button>
            <button class="btn" onclick="location.reload()">
                <i class="fas fa-refresh"></i> Reload Page
            </button>
        </div>
        
        <!-- This is the target container -->
        <div id="rencana-strategis" class="page-content active">
            <div class="page-header">
                <h2><i class="fas fa-chart-line"></i> Rencana Strategis</h2>
                <p>Testing table default view implementation</p>
            </div>
            <div id="rencana-strategis-content">
                <div class="status info">
                    <strong>⏳ Waiting for module to load...</strong>
                    <p>The content should appear here once the JavaScript module loads successfully.</p>
                </div>
            </div>
        </div>
        
        <div id="debug-info">
            <h3>Debug Information</h3>
            <pre id="debug-output"></pre>
        </div>
    </div>

    <!-- Load required scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <script src="/js/config.js"></script>
    <script src="/js/services/apiService.js"></script>
    <script src="/js/rencana-strategis.js"></script>
    
    <script>
        let debugOutput = [];
        
        function log(message) {
            console.log(message);
            debugOutput.push(new Date().toLocaleTimeString() + ': ' + message);
            document.getElementById('debug-output').textContent = debugOutput.join('\\n');
        }
        
        function updateStatus(message, type = 'info') {
            const statusContainer = document.getElementById('status-container');
            statusContainer.innerHTML = \`<div class="status \${type}"><strong>\${message}</strong></div>\`;
        }
        
        async function forceLoadModule() {
            log('🔄 Force loading Rencana Strategis module...');
            updateStatus('🔄 Force loading module...', 'info');
            
            try {
                // Clear any existing flags that might interfere
                sessionStorage.removeItem('preventAutoRedirect');
                sessionStorage.removeItem('preserveRoute');
                sessionStorage.setItem('currentModule', 'rencana-strategis');
                sessionStorage.setItem('moduleLoadTime', Date.now().toString());
                
                log('✅ Session storage cleared and set');
                
                // Check if module is available
                if (typeof window.RencanaStrategisModule !== 'undefined') {
                    log('✅ RencanaStrategisModule found');
                    
                    // Force load the module
                    await window.RencanaStrategisModule.load();
                    log('✅ Module load() called successfully');
                    updateStatus('✅ Module loaded successfully!', 'success');
                    
                } else if (typeof window.loadRencanaStrategis === 'function') {
                    log('✅ loadRencanaStrategis function found');
                    
                    await window.loadRencanaStrategis();
                    log('✅ loadRencanaStrategis() called successfully');
                    updateStatus('✅ Function called successfully!', 'success');
                    
                } else {
                    log('❌ No Rencana Strategis module or function found');
                    updateStatus('❌ Module not found! Check if rencana-strategis.js loaded correctly.', 'error');
                }
                
            } catch (error) {
                log('❌ Error loading module: ' + error.message);
                updateStatus('❌ Error: ' + error.message, 'error');
            }
        }
        
        async function testTableView() {
            log('🔍 Testing table view...');
            updateStatus('🔍 Testing table view...', 'info');
            
            try {
                const tableSection = document.getElementById('table-section');
                const formSection = document.getElementById('form-section');
                
                if (tableSection) {
                    log('✅ Table section found');
                    log('Table section display: ' + tableSection.style.display);
                } else {
                    log('❌ Table section not found');
                }
                
                if (formSection) {
                    log('✅ Form section found');
                    log('Form section display: ' + formSection.style.display);
                } else {
                    log('❌ Form section not found');
                }
                
                // Check module state
                if (window.RencanaStrategisModule && window.RencanaStrategisModule.state) {
                    const state = window.RencanaStrategisModule.state;
                    log('Module state currentView: ' + state.currentView);
                    log('Module state data count: ' + (state.data ? state.data.length : 'undefined'));
                }
                
                updateStatus('✅ Table view test completed - check debug info', 'success');
                
            } catch (error) {
                log('❌ Error testing table view: ' + error.message);
                updateStatus('❌ Error: ' + error.message, 'error');
            }
        }
        
        function clearCache() {
            log('🗑️ Clearing cache...');
            updateStatus('🗑️ Clearing cache...', 'info');
            
            // Clear session storage
            sessionStorage.clear();
            
            // Clear local storage
            localStorage.clear();
            
            log('✅ Cache cleared');
            updateStatus('✅ Cache cleared! You may need to reload the page.', 'success');
        }
        
        // Auto-load on page ready
        document.addEventListener('DOMContentLoaded', async () => {
            log('📄 DOM loaded, checking module availability...');
            
            // Wait a bit for scripts to load
            setTimeout(async () => {
                if (typeof window.RencanaStrategisModule !== 'undefined') {
                    log('✅ RencanaStrategisModule available');
                    updateStatus('✅ Module available - ready to test', 'success');
                } else if (typeof window.loadRencanaStrategis === 'function') {
                    log('✅ loadRencanaStrategis function available');
                    updateStatus('✅ Function available - ready to test', 'success');
                } else {
                    log('❌ No module found - check script loading');
                    updateStatus('❌ Module not loaded - check console for errors', 'error');
                }
            }, 1000);
        });
    </script>
</body>
</html>`;
        
        // Write the test file
        const fs = require('fs');
        const path = require('path');
        
        const testFilePath = path.join(__dirname, 'public', 'test-force-rencana-strategis-port-3033.html');
        fs.writeFileSync(testFilePath, testHTML);
        
        console.log(`✅ Test file created: ${testFilePath}`);
        console.log(`🌐 Access it at: ${BASE_URL}/test-force-rencana-strategis-port-3033.html`);
        
        // 4. Test the created file
        console.log('\n4. 🧪 Testing Created File...');
        try {
            const testResponse = await axios.get(`${BASE_URL}/test-force-rencana-strategis-port-3033.html`);
            console.log(`✅ Test file accessible: ${testResponse.status}`);
        } catch (error) {
            console.log(`❌ Test file error: ${error.message}`);
        }
        
        // 5. Summary and next steps
        console.log('\n5. 📋 ANALYSIS SUMMARY');
        console.log('=' .repeat(40));
        
        console.log('\n🔍 IDENTIFIED ISSUES:');
        if (hasEmptyContent) {
            console.log('✅ HTML structure is correct (has rencana-strategis-content div)');
        } else {
            console.log('❌ HTML structure issue - missing content div');
        }
        
        if (hasTableDefault && hasLoadFunction && hasModuleExport) {
            console.log('✅ JavaScript module is properly configured');
        } else {
            console.log('❌ JavaScript module has issues:');
            if (!hasTableDefault) console.log('   - Missing Table Default Version');
            if (!hasLoadFunction) console.log('   - Missing loadRencanaStrategis function');
            if (!hasModuleExport) console.log('   - Missing module export');
        }
        
        console.log('\n🛠️ NEXT STEPS:');
        console.log('1. Open the test file in browser:');
        console.log(`   ${BASE_URL}/test-force-rencana-strategis-port-3033.html`);
        console.log('2. Click "Force Load Module" button');
        console.log('3. Check debug output for errors');
        console.log('4. If successful, try the main page:');
        console.log(`   ${BASE_URL}/rencana-strategis`);
        console.log('5. Clear browser cache (Ctrl+F5) if needed');
        
        console.log('\n🔧 POTENTIAL FIXES:');
        console.log('- Browser cache preventing JavaScript updates');
        console.log('- Router not calling the correct handler');
        console.log('- Authentication redirects interfering');
        console.log('- JavaScript loading order issues');
        console.log('- Module initialization timing problems');
        
    } catch (error) {
        console.error('❌ CRITICAL ERROR:', error.message);
        console.log('\n💡 TROUBLESHOOTING:');
        console.log('1. Ensure server is running on port 3033');
        console.log('2. Check server logs for errors');
        console.log('3. Verify all JavaScript files are accessible');
        console.log('4. Test with browser developer tools open');
    }
}

// Run the force reload
forceReloadRencanaStrategis().catch(console.error);