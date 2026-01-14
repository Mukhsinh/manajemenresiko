/**
 * SIMPLE ROUTING FIX
 * Memperbaiki masalah routing untuk halaman rencana-strategis dan residual-risk
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 SIMPLE ROUTING FIX - Starting...');

function fixServerRouting() {
    console.log('📝 Fixing server.js routing...');
    
    const serverPath = path.join(__dirname, 'server.js');
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    const residualRiskRoute = `
// Route for residual risk page
app.get('/residual-risk', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/risk-residual', (req, res) => {
    res.redirect('/residual-risk');
});`;
    
    const catchAllIndex = serverContent.indexOf("app.get('*', (req, res) => {");
    if (catchAllIndex !== -1) {
        serverContent = serverContent.slice(0, catchAllIndex) + 
                      residualRiskRoute + '\n\n' + 
                      serverContent.slice(catchAllIndex);
        
        fs.writeFileSync(serverPath, serverContent);
        console.log('✅ Server routing fixed');
    }
}

function createEnhancedNavigation() {
    console.log('📝 Creating enhanced navigation...');
    
    const navigationContent = `
// Enhanced Navigation System
window.navigateToPageEnhanced = function(pageName, options = {}) {
    console.log('🧭 Enhanced Navigation to:', pageName);
    
    try {
        // Hide all pages
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
            
            const newPath = pathMap[pageName] || '/' + pageName;
            if (window.location.pathname !== newPath && !options.skipUrlUpdate) {
                window.history.pushState({ page: pageName }, '', newPath);
            }
            
            // Update menu
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const currentMenuItem = document.querySelector('.menu-item[data-page="' + pageName + '"]');
            if (currentMenuItem) {
                currentMenuItem.classList.add('active');
            }
            
            // Update page title
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
            const pageTitleElement = document.getElementById('page-title-text');
            if (pageTitleElement) {
                pageTitleElement.textContent = title;
            }
            document.title = title + ' - Aplikasi Manajemen Risiko';
            
            // Load page data
            if (typeof window.loadPageData === 'function') {
                setTimeout(() => {
                    try {
                        window.loadPageData(pageName);
                    } catch (error) {
                        console.warn('Error loading page data:', error);
                    }
                }, 10);
            }
            
            console.log('✅ Successfully navigated to', pageName);
            return true;
            
        } else {
            console.error('❌ Page element not found:', pageName);
            if (pageName !== 'dashboard') {
                return window.navigateToPageEnhanced('dashboard', options);
            }
            return false;
        }
        
    } catch (error) {
        console.error('❌ Navigation error:', error);
        return false;
    }
};

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
    console.log('🔙 Browser navigation to:', pageName);
    
    window.navigateToPageEnhanced(pageName, { skipUrlUpdate: true });
});

// Override original navigation function
window.navigateToPage = window.navigateToPageEnhanced;

console.log('✅ Enhanced navigation system loaded');
`;
    
    fs.writeFileSync(path.join(__dirname, 'public', 'js', 'enhanced-navigation.js'), navigationContent);
    console.log('✅ Enhanced navigation created');
}

function fixIndexHtml() {
    console.log('📝 Fixing index.html...');
    
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    const scriptTag = '    <script src="/js/enhanced-navigation.js"></script>';
    
    if (!indexContent.includes('enhanced-navigation.js')) {
        const bodyCloseIndex = indexContent.lastIndexOf('</body>');
        if (bodyCloseIndex !== -1) {
            indexContent = indexContent.slice(0, bodyCloseIndex) + 
                          scriptTag + '\n' + 
                          indexContent.slice(bodyCloseIndex);
            
            fs.writeFileSync(indexPath, indexContent);
            console.log('✅ Index.html updated');
        }
    } else {
        console.log('✅ Script already exists in index.html');
    }
}

async function executeRoutingFix() {
    try {
        console.log('🚀 Executing routing fix...');
        
        fixServerRouting();
        createEnhancedNavigation();
        fixIndexHtml();
        
        console.log('\n✅ ROUTING FIX COMPLETED!');
        console.log('\n📋 CHANGES MADE:');
        console.log('1. ✅ Added /residual-risk route to server.js');
        console.log('2. ✅ Created enhanced navigation system');
        console.log('3. ✅ Updated index.html with navigation script');
        
        console.log('\n🔧 NEXT STEPS:');
        console.log('1. Restart your server');
        console.log('2. Clear browser cache');
        console.log('3. Test navigation to /rencana-strategis and /residual-risk');
        
    } catch (error) {
        console.error('❌ ROUTING FIX FAILED:', error);
        throw error;
    }
}

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

module.exports = { executeRoutingFix };