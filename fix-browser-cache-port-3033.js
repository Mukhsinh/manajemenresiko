#!/usr/bin/env node

// Fix Browser Cache for Port 3033 - Force Cache Busting
const fs = require('fs');
const path = require('path');

async function fixBrowserCache() {
    console.log('🗄️ FIXING BROWSER CACHE FOR PORT 3033');
    console.log('=' .repeat(50));
    
    try {
        // 1. Create cache-busting version of rencana-strategis.js
        console.log('\n1. 📄 Creating Cache-Busting JavaScript...');
        
        const jsFilePath = path.join(__dirname, 'public', 'js', 'rencana-strategis.js');
        const jsContent = fs.readFileSync(jsFilePath, 'utf8');
        
        // Add cache-busting timestamp
        const timestamp = Date.now();
        const cacheBustingComment = `// Cache-Busting Version: ${timestamp}\n// Force reload for port 3033 fix\n\n`;
        
        const newJsContent = cacheBustingComment + jsContent;
        
        // Write the updated file
        fs.writeFileSync(jsFilePath, newJsContent);
        console.log(`✅ Added cache-busting comment with timestamp: ${timestamp}`);
        
        // 2. Create a direct test page that bypasses router
        console.log('\n2. 🎯 Creating Direct Test Page...');
        
        const directTestHTML = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Direct Rencana Strategis Test - Port 3033</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: #f8f9fa;
            padding: 20px;
        }
        .test-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }
        .status-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .cache-info {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 5px;
            padding: 15px;
            margin: 10px 0;
        }
        .success-msg {
            background: #d4edda;
            border: 1px solid #28a745;
            color: #155724;
            border-radius: 5px;
            padding: 15px;
            margin: 10px 0;
        }
        .error-msg {
            background: #f8d7da;
            border: 1px solid #dc3545;
            color: #721c24;
            border-radius: 5px;
            padding: 15px;
            margin: 10px 0;
        }
        #rencana-strategis-content {
            min-height: 500px;
            border: 2px solid #dee2e6;
            border-radius: 10px;
            padding: 20px;
            background: white;
        }
        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="test-header">
            <h1><i class="fas fa-chart-line"></i> Direct Rencana Strategis Test</h1>
            <p>Port 3033 - Cache-Busting Version: ${timestamp}</p>
        </div>
        
        <div class="status-card">
            <h3><i class="fas fa-info-circle"></i> Test Status</h3>
            <div id="status-display">
                <div class="cache-info">
                    <strong><i class="fas fa-clock"></i> Initializing...</strong>
                    <p>Loading and testing Rencana Strategis module with cache-busting.</p>
                </div>
            </div>
        </div>
        
        <div class="status-card">
            <h3><i class="fas fa-tools"></i> Actions</h3>
            <div class="btn-group" role="group">
                <button class="btn btn-primary" onclick="forceClearCache()">
                    <i class="fas fa-trash"></i> Clear All Cache
                </button>
                <button class="btn btn-success" onclick="forceLoadModule()">
                    <i class="fas fa-sync"></i> Force Load Module
                </button>
                <button class="btn btn-info" onclick="testTableView()">
                    <i class="fas fa-table"></i> Test Table View
                </button>
                <button class="btn btn-warning" onclick="location.reload(true)">
                    <i class="fas fa-refresh"></i> Hard Reload
                </button>
            </div>
        </div>
        
        <!-- Direct container for Rencana Strategis -->
        <div class="status-card">
            <h3><i class="fas fa-chart-line"></i> Rencana Strategis Content</h3>
            <div id="rencana-strategis" class="page-content active">
                <div id="rencana-strategis-content">
                    <div class="cache-info">
                        <div class="loading-spinner"></div>
                        <strong> Loading Rencana Strategis...</strong>
                        <p>If this message persists, there may be a JavaScript loading issue.</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="status-card">
            <h3><i class="fas fa-bug"></i> Debug Information</h3>
            <pre id="debug-output" style="background: #f8f9fa; padding: 15px; border-radius: 5px; max-height: 300px; overflow-y: auto;"></pre>
        </div>
    </div>

    <!-- Load scripts with cache-busting -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <script src="/js/config.js?v=${timestamp}"></script>
    <script src="/js/services/apiService.js?v=${timestamp}"></script>
    <script src="/js/rencana-strategis.js?v=${timestamp}"></script>
    
    <script>
        const debugLog = [];
        
        function log(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = \`[\${timestamp}] \${message}\`;
            console.log(logEntry);
            debugLog.push(logEntry);
            
            const debugOutput = document.getElementById('debug-output');
            debugOutput.textContent = debugLog.join('\\n');
            debugOutput.scrollTop = debugOutput.scrollHeight;
        }
        
        function updateStatus(message, type = 'info') {
            const statusDisplay = document.getElementById('status-display');
            let className = 'cache-info';
            let icon = 'fas fa-info-circle';
            
            if (type === 'success') {
                className = 'success-msg';
                icon = 'fas fa-check-circle';
            } else if (type === 'error') {
                className = 'error-msg';
                icon = 'fas fa-exclamation-triangle';
            }
            
            statusDisplay.innerHTML = \`
                <div class="\${className}">
                    <strong><i class="\${icon}"></i> \${message}</strong>
                </div>
            \`;
        }
        
        function forceClearCache() {
            log('🗑️ Clearing all cache...');
            updateStatus('Clearing all cache...', 'info');
            
            try {
                // Clear all storage
                sessionStorage.clear();
                localStorage.clear();
                
                // Clear any module-specific flags
                sessionStorage.removeItem('preventAutoRedirect');
                sessionStorage.removeItem('preserveRoute');
                sessionStorage.removeItem('currentModule');
                sessionStorage.removeItem('moduleLoadTime');
                
                log('✅ All cache cleared successfully');
                updateStatus('Cache cleared! Ready for fresh load.', 'success');
                
            } catch (error) {
                log('❌ Error clearing cache: ' + error.message);
                updateStatus('Error clearing cache: ' + error.message, 'error');
            }
        }
        
        async function forceLoadModule() {
            log('🔄 Force loading Rencana Strategis module...');
            updateStatus('Force loading module...', 'info');
            
            try {
                // Set required session flags
                sessionStorage.setItem('currentModule', 'rencana-strategis');
                sessionStorage.setItem('moduleLoadTime', Date.now().toString());
                sessionStorage.setItem('preventAutoRedirect', 'true');
                
                log('✅ Session flags set');
                
                // Check module availability
                if (typeof window.RencanaStrategisModule !== 'undefined') {
                    log('✅ RencanaStrategisModule found');
                    
                    // Force the module to load
                    await window.RencanaStrategisModule.load();
                    log('✅ Module.load() completed');
                    updateStatus('Module loaded successfully!', 'success');
                    
                } else if (typeof window.loadRencanaStrategis === 'function') {
                    log('✅ loadRencanaStrategis function found');
                    
                    await window.loadRencanaStrategis();
                    log('✅ loadRencanaStrategis() completed');
                    updateStatus('Function executed successfully!', 'success');
                    
                } else {
                    throw new Error('No Rencana Strategis module or function found');
                }
                
                // Check if content was loaded
                setTimeout(() => {
                    const content = document.getElementById('rencana-strategis-content');
                    if (content && content.innerHTML.includes('table-section')) {
                        log('✅ Table content detected in DOM');
                        updateStatus('Table view loaded successfully!', 'success');
                    } else {
                        log('⚠️ Table content not detected, but module loaded');
                        updateStatus('Module loaded but table not visible - check console', 'error');
                    }
                }, 1000);
                
            } catch (error) {
                log('❌ Error loading module: ' + error.message);
                updateStatus('Error: ' + error.message, 'error');
            }
        }
        
        function testTableView() {
            log('🔍 Testing table view elements...');
            updateStatus('Testing table view...', 'info');
            
            try {
                const tableSection = document.getElementById('table-section');
                const formSection = document.getElementById('form-section');
                const content = document.getElementById('rencana-strategis-content');
                
                log('Content innerHTML length: ' + (content ? content.innerHTML.length : 'N/A'));
                log('Table section exists: ' + (tableSection ? 'YES' : 'NO'));
                log('Form section exists: ' + (formSection ? 'YES' : 'NO'));
                
                if (tableSection) {
                    log('Table section display: ' + tableSection.style.display);
                    log('Table section visible: ' + (tableSection.offsetHeight > 0));
                }
                
                if (formSection) {
                    log('Form section display: ' + formSection.style.display);
                    log('Form section visible: ' + (formSection.offsetHeight > 0));
                }
                
                // Check module state
                if (window.RencanaStrategisModule && window.RencanaStrategisModule.state) {
                    const state = window.RencanaStrategisModule.state;
                    log('Module currentView: ' + state.currentView);
                    log('Module data count: ' + (state.data ? state.data.length : 'undefined'));
                }
                
                updateStatus('Table view test completed - check debug info', 'success');
                
            } catch (error) {
                log('❌ Error testing table view: ' + error.message);
                updateStatus('Error: ' + error.message, 'error');
            }
        }
        
        // Auto-initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            log('📄 DOM loaded - Cache-busting version: ${timestamp}');
            
            // Wait for scripts to load
            setTimeout(() => {
                log('🔍 Checking module availability...');
                
                if (typeof window.RencanaStrategisModule !== 'undefined') {
                    log('✅ RencanaStrategisModule available');
                    updateStatus('Module available - click "Force Load Module" to test', 'success');
                } else if (typeof window.loadRencanaStrategis === 'function') {
                    log('✅ loadRencanaStrategis function available');
                    updateStatus('Function available - click "Force Load Module" to test', 'success');
                } else {
                    log('❌ No module found');
                    updateStatus('Module not loaded - check console for script errors', 'error');
                }
            }, 1500);
        });
        
        // Auto-load after a delay
        setTimeout(() => {
            log('🚀 Auto-loading module...');
            forceLoadModule();
        }, 3000);
    </script>
</body>
</html>`;
        
        const directTestPath = path.join(__dirname, 'public', 'test-direct-rencana-strategis-port-3033.html');
        fs.writeFileSync(directTestPath, directTestHTML);
        
        console.log(`✅ Direct test file created: ${directTestPath}`);
        
        // 3. Create a simple redirect page for the main route
        console.log('\n3. 🔄 Creating Redirect Fix...');
        
        const redirectHTML = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rencana Strategis - Redirect Fix</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .redirect-container {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .spinner {
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="redirect-container">
        <h2>🔄 Redirecting to Rencana Strategis</h2>
        <div class="spinner"></div>
        <p>Cache-busting version: ${timestamp}</p>
        <p>If this page doesn't redirect automatically, <a href="/test-direct-rencana-strategis-port-3033.html" style="color: #ffeb3b;">click here</a></p>
    </div>
    
    <script>
        // Force redirect to direct test page
        setTimeout(() => {
            window.location.href = '/test-direct-rencana-strategis-port-3033.html';
        }, 2000);
    </script>
</body>
</html>`;
        
        const redirectPath = path.join(__dirname, 'public', 'rencana-strategis-redirect.html');
        fs.writeFileSync(redirectPath, redirectHTML);
        
        console.log(`✅ Redirect page created: ${redirectPath}`);
        
        // 4. Summary
        console.log('\n4. 📋 CACHE-BUSTING SUMMARY');
        console.log('=' .repeat(40));
        
        console.log('\n✅ COMPLETED ACTIONS:');
        console.log('1. Added cache-busting timestamp to rencana-strategis.js');
        console.log('2. Created direct test page with cache-busting URLs');
        console.log('3. Created redirect page for troubleshooting');
        
        console.log('\n🌐 TEST URLS (Port 3033):');
        console.log('1. Direct test (recommended):');
        console.log('   http://localhost:3033/test-direct-rencana-strategis-port-3033.html');
        console.log('2. Force reload test:');
        console.log('   http://localhost:3033/test-force-rencana-strategis-port-3033.html');
        console.log('3. Redirect test:');
        console.log('   http://localhost:3033/rencana-strategis-redirect.html');
        console.log('4. Original page (may still have cache issues):');
        console.log('   http://localhost:3033/rencana-strategis');
        
        console.log('\n🔧 INSTRUCTIONS:');
        console.log('1. Open the direct test URL in your browser');
        console.log('2. The page will auto-load the module after 3 seconds');
        console.log('3. If it works, the table view should appear');
        console.log('4. If not, click "Force Load Module" button');
        console.log('5. Check debug output for any errors');
        console.log('6. Try hard refresh (Ctrl+F5) if needed');
        
        console.log('\n⚠️ BROWSER CACHE CLEARING:');
        console.log('- Chrome: Ctrl+Shift+R or F12 > Network > Disable cache');
        console.log('- Firefox: Ctrl+F5 or F12 > Network > Disable cache');
        console.log('- Edge: Ctrl+F5 or F12 > Network > Disable cache');
        console.log('- Or use incognito/private browsing mode');
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.log('\n💡 TROUBLESHOOTING:');
        console.log('1. Check file permissions');
        console.log('2. Ensure server is running');
        console.log('3. Verify file paths are correct');
    }
}

// Run the cache fix
fixBrowserCache().catch(console.error);