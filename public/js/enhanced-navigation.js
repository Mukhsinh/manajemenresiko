
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
