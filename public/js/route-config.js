/**
 * Route Configuration
 * Defines all application routes with their handlers and authentication requirements
 */

// Route definitions mapping URLs to page handlers
const ROUTE_CONFIG = {
    // Authentication routes
    '/': { handler: 'dashboard', auth: true, title: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    '/login': { handler: 'login', auth: false, title: 'Login', icon: 'fas fa-sign-in-alt' },
    '/404': { handler: '404', auth: false, title: 'Page Not Found', icon: 'fas fa-exclamation-triangle' },
    
    // Main dashboard
    '/dashboard': { handler: 'dashboard', auth: true, title: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    
    // Strategic Planning Module
    '/visi-misi': { handler: 'visi-misi', auth: true, title: 'Visi dan Misi', icon: 'fas fa-eye' },
    '/rencana-strategis': { handler: 'rencana-strategis', auth: true, title: 'Rencana Strategis', icon: 'fas fa-chess' },
    '/analisis-swot': { handler: 'analisis-swot', auth: true, title: 'Analisis SWOT', icon: 'fas fa-chart-line' },
    '/diagram-kartesius': { handler: 'diagram-kartesius', auth: true, title: 'Diagram Kartesius', icon: 'fas fa-chart-area' },
    '/matriks-tows': { handler: 'matriks-tows', auth: true, title: 'Matriks TOWS', icon: 'fas fa-table' },
    '/sasaran-strategi': { handler: 'sasaran-strategi', auth: true, title: 'Sasaran Strategi', icon: 'fas fa-bullseye' },
    '/strategic-map': { handler: 'strategic-map', auth: true, title: 'Strategic Map', icon: 'fas fa-map' },
    '/indikator-kinerja-utama': { handler: 'indikator-kinerja-utama', auth: true, title: 'Indikator Kinerja Utama', icon: 'fas fa-chart-bar' },
    '/evaluasi-iku': { handler: 'evaluasi-iku', auth: true, title: 'Evaluasi IKU', icon: 'fas fa-chart-line' },
    
    // Risk Management Module - Direct routes (no nested paths)
    '/risk-input': { handler: 'risk-input', auth: true, title: 'Input Data Risiko', icon: 'fas fa-plus-circle' },
    '/identifikasi-risiko': { handler: 'risk-input', auth: true, title: 'Identifikasi Risiko', icon: 'fas fa-search' },
    '/risk-profile': { handler: 'risk-profile', auth: true, title: 'Risk Profile', icon: 'fas fa-user-shield' },
    '/residual-risk': { handler: 'residual-risk', auth: true, title: 'Residual Risk', icon: 'fas fa-exclamation-triangle' },
    '/monitoring-evaluasi': { handler: 'monitoring-evaluasi', auth: true, title: 'Monitoring & Evaluasi', icon: 'fas fa-search' },
    '/peluang': { handler: 'peluang', auth: true, title: 'Peluang', icon: 'fas fa-lightbulb' },
    '/kri': { handler: 'kri', auth: true, title: 'Key Risk Indicator', icon: 'fas fa-key' },
    '/loss-event': { handler: 'loss-event', auth: true, title: 'Loss Event', icon: 'fas fa-exclamation' },
    '/ews': { handler: 'ews', auth: true, title: 'Early Warning System', icon: 'fas fa-bell' },
    '/risk-register': { handler: 'risk-register', auth: true, title: 'Risk Register', icon: 'fas fa-list-alt' },
    '/register-risiko': { handler: 'risk-register', auth: true, title: 'Register Risiko', icon: 'fas fa-folder-managed' },
    
    // Legacy nested routes for backward compatibility
    '/manajemen-risiko': { handler: 'risk-input', auth: true, title: 'Manajemen Risiko', icon: 'fas fa-shield-alt' },
    '/manajemen-risiko/input-data': { handler: 'risk-input', auth: true, title: 'Input Data Risiko', icon: 'fas fa-plus-circle' },
    '/manajemen-risiko/risk-profile': { handler: 'risk-profile', auth: true, title: 'Risk Profile', icon: 'fas fa-user-shield' },
    '/manajemen-risiko/residual-risk': { handler: 'residual-risk', auth: true, title: 'Residual Risk', icon: 'fas fa-exclamation-triangle' },
    '/manajemen-risiko/monitoring-evaluasi': { handler: 'monitoring-evaluasi', auth: true, title: 'Monitoring & Evaluasi', icon: 'fas fa-search' },
    '/manajemen-risiko/peluang': { handler: 'peluang', auth: true, title: 'Peluang', icon: 'fas fa-lightbulb' },
    '/manajemen-risiko/kri': { handler: 'kri', auth: true, title: 'Key Risk Indicator', icon: 'fas fa-key' },
    '/manajemen-risiko/loss-event': { handler: 'loss-event', auth: true, title: 'Loss Event', icon: 'fas fa-exclamation' },
    '/manajemen-risiko/ews': { handler: 'ews', auth: true, title: 'Early Warning System', icon: 'fas fa-bell' },
    '/manajemen-risiko/risk-register': { handler: 'risk-register', auth: true, title: 'Risk Register', icon: 'fas fa-list-alt' },
    
    // Reports and Data
    '/laporan': { handler: 'laporan', auth: true, title: 'Laporan', icon: 'fas fa-file-alt' },
    '/master-data': { handler: 'master-data', auth: true, title: 'Master Data', icon: 'fas fa-database' },
    '/buku-pedoman': { handler: 'buku-pedoman', auth: true, title: 'Buku Pedoman', icon: 'fas fa-book' },
    
    // Settings
    '/pengaturan': { handler: 'pengaturan', auth: true, title: 'Pengaturan', icon: 'fas fa-cog' }
};

// Legacy page name to new URL mapping
const LEGACY_PAGE_TO_URL = {
    'dashboard': '/dashboard',
    'visi-misi': '/visi-misi',
    'rencana-strategis': '/rencana-strategis',
    'analisis-swot': '/analisis-swot',
    'diagram-kartesius': '/diagram-kartesius',
    'matriks-tows': '/matriks-tows',
    'sasaran-strategi': '/sasaran-strategi',
    'strategic-map': '/strategic-map',
    'indikator-kinerja-utama': '/indikator-kinerja-utama',
    'evaluasi-iku': '/evaluasi-iku',
    'risk-input': '/risk-input',
    'identifikasi-risiko': '/identifikasi-risiko',
    'risk-profile': '/risk-profile',
    'residual-risk': '/residual-risk',
    'monitoring-evaluasi': '/monitoring-evaluasi',
    'peluang': '/peluang',
    'kri': '/kri',
    'loss-event': '/loss-event',
    'ews': '/ews',
    'risk-register': '/risk-register',
    'register-risiko': '/register-risiko',
    'laporan': '/laporan',
    'master-data': '/master-data',
    'buku-pedoman': '/buku-pedoman',
    'pengaturan': '/pengaturan',
    'login': '/login',
    '404': '/404'
};

// URL to page name mapping (reverse of above)
const URL_TO_PAGE_NAME = {};
Object.entries(LEGACY_PAGE_TO_URL).forEach(([pageName, url]) => {
    URL_TO_PAGE_NAME[url] = pageName;
});

/**
 * Get URL for a page name
 * @param {string} pageName - Legacy page name
 * @returns {string} - Corresponding URL
 */
function getUrlForPage(pageName) {
    return LEGACY_PAGE_TO_URL[pageName] || '/404';
}

/**
 * Get page name for a URL
 * @param {string} url - URL path
 * @returns {string} - Corresponding page name
 */
function getPageNameForUrl(url) {
    return URL_TO_PAGE_NAME[url] || '404';
}

/**
 * Get route configuration for a URL
 * @param {string} url - URL path
 * @returns {Object|null} - Route configuration
 */
function getRouteConfig(url) {
    return ROUTE_CONFIG[url] || null;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ROUTE_CONFIG,
        LEGACY_PAGE_TO_URL,
        URL_TO_PAGE_NAME,
        getUrlForPage,
        getPageNameForUrl,
        getRouteConfig
    };
} else {
    // Browser environment
    window.ROUTE_CONFIG = ROUTE_CONFIG;
    window.LEGACY_PAGE_TO_URL = LEGACY_PAGE_TO_URL;
    window.URL_TO_PAGE_NAME = URL_TO_PAGE_NAME;
    window.getUrlForPage = getUrlForPage;
    window.getPageNameForUrl = getPageNameForUrl;
    window.getRouteConfig = getRouteConfig;
}

// Also make available globally for Node.js testing
if (typeof global !== 'undefined') {
    global.ROUTE_CONFIG = ROUTE_CONFIG;
    global.LEGACY_PAGE_TO_URL = LEGACY_PAGE_TO_URL;
    global.URL_TO_PAGE_NAME = URL_TO_PAGE_NAME;
    global.getUrlForPage = getUrlForPage;
    global.getPageNameForUrl = getPageNameForUrl;
    global.getRouteConfig = getRouteConfig;
}

console.log('🗺️ Route configuration loaded');