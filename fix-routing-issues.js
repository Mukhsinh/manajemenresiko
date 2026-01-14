/**
 * ROUTING ISSUES FIX
 * Memperbaiki masalah routing untuk halaman /rencana-strategis dan /residual-risk
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 ROUTING ISSUES FIX - Starting...');

// 1. PERBAIKI SERVER.JS - TAMBAH ROUTE YANG HILANG
function fixServerRouting() {
    console.log('📝 Fixing server.js routing...');
    
    const serverPath = path.join(__dirname, 'server.js');
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Tambah route untuk residual-risk yang hilang
    const residualRiskRoute = `
// Route for residual risk page
app.get('/residual-risk', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for risk-residual (alternative naming)
app.get('/risk-residual', (req, res) => {
    res.redirect('/residual-risk');
});`;
    
    // Insert sebelum catch-all route
    const catchAllIndex = serverContent.indexOf("app.get('*', (req, res) => {");
    if (catchAllIndex !== -1) {
        serverContent = serverContent.slice(0, catchAllIndex) + 
                      residualRiskRoute + '\n\n' + 
                      serverContent.slice(catchAllIndex);
        
        fs.writeFileSync(serverPath, serverContent);
        console.log('✅ Server routing fixed');
    } else {
        console.log('⚠️ Catch-all route not found, skipping server fix');
    }
}

// 2. BUAT ENHANCED NAVIGATION FUNCTION
function createEnhancedNavigation() {
    console.log('📝 Creating enhanced navigation...');
    
    const navigationContent = `
/**
 * Enhanced Navigation System
 * Sistem navigasi yang lebih robust untuk SPA
 */

// Enhanced navigation function
window.navigateToPageEnhanced = function(pageName, options = {}) {
    console.log(\`🧭 Enhanced Navigation to: \${pageName}\`);
    
    try {
        // Hide all pages first
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show target page
        const targetPage = document.getElementById(pageName);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Update URL
            const pathMap = {
                'dashboard': '/',
                'rencana-strategis': '/rencana-strategis',
                'residual-risk': '/residual-risk',
                'risk-profile': '/risk-profile',
                'analisis-swot': '/analisis-swot',
                'visi-misi': '/visi-misi',
                'master-data': '/master-data',
                'laporan': '/laporan',
                'pengaturan': '/pengaturan'
            };
            
            const newPath = pathMap[pageName] || \`/\${pageName}\`;
            if (window.location.pathname !== newPath && !options.skipUrlUpdate) {
                window.history.pushState({ page: pageName }, '', newPath);
            }
            
            // Update menu
            updateActiveMenuItem(pageName);
            
            // Update page title
            updatePageTitle(pageName);
            
            // Load page data
            if (typeof window.loadPageData === 'function') {
                setTimeout(() => {
                    try {
                        window.loadPageData(pageName);
                    } catch (error) {
                        console.warn(\`⚠️ Error loading page data for \${pageName}:\`, error);
                    }
                }, 10);
            }
            
            console.log(\`✅ Successfully navigated to \${pageName}\`);
            return true;
            
        } else {
            console.error(\`❌ Page element not found: \${pageName}\`);
            
            // Fallback to dashboard
            if (pageName !== 'dashboard') {
                return window.navigateToPageEnhanced('dashboard', options);
            }
            return false;
        }
        
    } catch (error) {
        console.error(\`❌ Navigation error for \${pageName}:\`, error);
        return false;
    }
};

function updateActiveMenuItem(pageName) {
    try {
        // Remove active class from all menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current menu item
        const currentMenuItem = document.querySelector(\`.menu-item[data-page="\${pageName}"]\`);
        if (currentMenuItem) {
            currentMenuItem.classList.add('active');
            
            // Handle submenu expansion
            const parentSubmenu = currentMenuItem.closest('.sidebar-submenu');
            if (parentSubmenu) {
                parentSubmenu.classList.add('expanded');
                const section = parentSubmenu.dataset.submenu;
                const toggle = document.querySelector(\`.dropdown-toggle[data-section="\${section}"]\`);
                if (toggle) {
                    toggle.classList.add('active');
                }
            }
        }
    } catch (error) {
        console.error(\`❌ Error updating menu for \${pageName}:\`, error);
    }
}

function updatePageTitle(pageName) {
    const titleMap = {
        'dashboard': 'Dashboard',
        'rencana-strategis': 'Rencana Strategis',
        'residual-risk': 'Residual Risk',
        'risk-profile': 'Risk Profile',
        'analisis-swot': 'Analisis SWOT',
        'visi-misi': 'Visi Misi',
        'master-data': 'Master Data',
        'laporan': 'Laporan',
        'pengaturan': 'Pengaturan'
    };
    
    const title = titleMap[pageName] || pageName;
    
    // Update page title in header
    const pageTitleElement = document.getElementById('page-title-text');
    if (pageTitleElement) {
        pageTitleElement.textContent = title;
    }
    
    // Update document title
    document.title = \`\${title} - Aplikasi Manajemen Risiko\`;
}

// Handle browser navigation
window.addEventListener('popstate', function(event) {
    const path = window.location.pathname;
    const routeMapping = {
        '/': 'dashboard',
        '/rencana-strategis': 'rencana-strategis',
        '/residual-risk': 'residual-risk',
        '/risk-residual': 'residual-risk',
        '/risk-profile': 'risk-profile',
        '/analisis-swot': 'analisis-swot',
        '/visi-misi': 'visi-misi',
        '/master-data': 'master-data',
        '/laporan': 'laporan',
        '/pengaturan': 'pengaturan'
    };
    
    const pageName = routeMapping[path] || path.replace(/^\//, '') || 'dashboard';
    console.log(\`🔙 Browser navigation to: \${pageName}\`);
    
    window.navigateToPageEnhanced(pageName, { skipUrlUpdate: true });
});

// Override original navigation function
window.navigateToPage = window.navigateToPageEnhanced;

console.log('✅ Enhanced navigation system loaded');
`;
    
    fs.writeFileSync(path.join(__dirname, 'public', 'js', 'enhanced-navigation.js'), navigationContent);
    console.log('✅ Enhanced navigation created');
}// 
3. PERBAIKI INDEX.HTML - TAMBAH SCRIPT ENHANCED NAVIGATION
function fixIndexHtml() {
    console.log('📝 Fixing index.html...');
    
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Add enhanced navigation script before closing body tag
    const scriptTag = `    <script src="/js/enhanced-navigation.js"></script>`;
    
    // Check if script already exists
    if (!indexContent.includes('enhanced-navigation.js')) {
        const bodyCloseIndex = indexContent.lastIndexOf('</body>');
        if (bodyCloseIndex !== -1) {
            indexContent = indexContent.slice(0, bodyCloseIndex) + 
                          scriptTag + '\n' + 
                          indexContent.slice(bodyCloseIndex);
            
            fs.writeFileSync(indexPath, indexContent);
            console.log('✅ Index.html updated with enhanced navigation script');
        }
    } else {
        console.log('✅ Enhanced navigation script already exists in index.html');
    }
}

// 4. BUAT TEST UNTUK VERIFIKASI ROUTING
function createRoutingTest() {
    console.log('📝 Creating routing test...');
    
    const testContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Routing Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        button { margin: 5px; padding: 10px 15px; cursor: pointer; }
        #test-results { margin-top: 20px; }
    </style>
</head>
<body>
    <h1>🧪 Routing Test</h1>
    <p>Test untuk memverifikasi routing berfungsi dengan benar</p>
    
    <div>
        <button onclick="testNavigation('rencana-strategis')">Test Rencana Strategis</button>
        <button onclick="testNavigation('residual-risk')">Test Residual Risk</button>
        <button onclick="testNavigation('risk-profile')">Test Risk Profile</button>
        <button onclick="testNavigation('dashboard')">Test Dashboard</button>
        <button onclick="runAllTests()">Run All Tests</button>
        <button onclick="clearResults()">Clear Results</button>
    </div>
    
    <div id="test-results"></div>
    
    <script>
        let testResults = [];
        
        function addResult(test, success, message) {
            const result = { test, success, message, timestamp: new Date().toLocaleTimeString() };
            testResults.push(result);
            displayResults();
        }
        
        function displayResults() {
            const container = document.getElementById('test-results');
            container.innerHTML = '<h2>Test Results:</h2>';
            
            testResults.forEach(result => {
                const div = document.createElement('div');
                div.className = \`test-result \${result.success ? 'success' : 'error'}\`;
                div.innerHTML = \`
                    <strong>[\${result.timestamp}] \${result.test}:</strong> 
                    \${result.success ? '✅' : '❌'} \${result.message}
                \`;
                container.appendChild(div);
            });
        }
        
        function testNavigation(pageName) {
            addResult(\`Navigation Test (\${pageName})\`, false, 'Starting test...');
            
            try {
                // Test 1: Check if navigation function exists
                if (typeof window.navigateToPageEnhanced !== 'function') {
                    addResult(\`Navigation Function (\${pageName})\`, false, 'navigateToPageEnhanced function not found');
                    return;
                }
                
                // Test 2: Attempt navigation
                const success = window.navigateToPageEnhanced(pageName);
                addResult(\`Navigation Execution (\${pageName})\`, success, success ? 'Navigation executed successfully' : 'Navigation failed');
                
                // Test 3: Check URL update
                setTimeout(() => {
                    const expectedPaths = {
                        'dashboard': '/',
                        'rencana-strategis': '/rencana-strategis',
                        'residual-risk': '/residual-risk',
                        'risk-profile': '/risk-profile'
                    };
                    
                    const expectedPath = expectedPaths[pageName] || \`/\${pageName}\`;
                    const currentPath = window.location.pathname;
                    const urlCorrect = currentPath === expectedPath;
                    
                    addResult(\`URL Update (\${pageName})\`, urlCorrect, \`Expected: \${expectedPath}, Got: \${currentPath}\`);
                }, 100);
                
            } catch (error) {
                addResult(\`Navigation Error (\${pageName})\`, false, \`Error: \${error.message}\`);
            }
        }
        
        function runAllTests() {
            clearResults();
            addResult('Test Suite', true, 'Starting comprehensive routing tests...');
            
            const pages = ['dashboard', 'rencana-strategis', 'residual-risk', 'risk-profile'];
            
            pages.forEach((page, index) => {
                setTimeout(() => {
                    testNavigation(page);
                }, index * 500);
            });
            
            // Final summary
            setTimeout(() => {
                const passed = testResults.filter(r => r.success).length;
                const total = testResults.length;
                addResult('Test Summary', passed === total, \`\${passed}/\${total} tests passed\`);
            }, pages.length * 500 + 1000);
        }
        
        function clearResults() {
            testResults = [];
            document.getElementById('test-results').innerHTML = '';
        }
        
        // Auto-run basic test on load
        window.addEventListener('load', () => {
            setTimeout(() => {
                addResult('Page Load', true, 'Routing test page loaded successfully');
                
                // Test if we can access the main app
                if (window.parent !== window) {
                    addResult('Parent Access', true, 'Running in iframe - can access parent');
                } else {
                    addResult('Standalone Mode', true, 'Running in standalone mode');
                }
            }, 1000);
        });
    </script>
</body>
</html>
`;
    
    fs.writeFileSync(path.join(__dirname, 'public', 'test-routing.html'), testContent);
    console.log('✅ Routing test page created at /test-routing.html');
}

// 5. MAIN EXECUTION FUNCTION
async function executeRoutingFix() {
    try {
        console.log('🚀 ROUTING ISSUES FIX - Executing...');
        
        // Execute all fixes
        fixServerRouting();
        createEnhancedNavigation();
        fixIndexHtml();
        createRoutingTest();
        
        console.log('\n✅ ROUTING ISSUES FIX COMPLETED!');
        console.log('\n📋 SUMMARY OF CHANGES:');
        console.log('1. ✅ Added missing routes in server.js');
        console.log('2. ✅ Created enhanced navigation system');
        console.log('3. ✅ Updated index.html with new script');
        console.log('4. ✅ Created routing test page');
        
        console.log('\n🔧 NEXT STEPS:');
        console.log('1. Restart your server');
        console.log('2. Clear browser cache');
        console.log('3. Test navigation to /rencana-strategis and /residual-risk');
        console.log('4. Visit /test-routing.html to run automated tests');
        
        console.log('\n🎯 EXPECTED RESULTS:');
        console.log('- ✅ /rencana-strategis should load correctly');
        console.log('- ✅ /residual-risk should load correctly');
        console.log('- ✅ URL should sync with page content');
        console.log('- ✅ Browser back/forward should work');
        console.log('- ✅ Menu items should highlight correctly');
        
    } catch (error) {
        console.error('❌ ROUTING ISSUES FIX FAILED:', error);
        throw error;
    }
}

// Execute the fix
if (require.main === module) {
    executeRoutingFix()
        .then(() => {
            console.log('\n🎉 Routing fix completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Routing fix failed:', error);
            process.exit(1);
        });
}

module.exports = {
    executeRoutingFix,
    fixServerRouting,
    createEnhancedNavigation,
    fixIndexHtml,
    createRoutingTest
};