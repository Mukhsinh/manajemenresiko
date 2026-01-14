/**
 * Route Configuration for Risk Management Application
 * Maps URLs to page handlers with authentication requirements
 */

// Route definitions with new URL structure
const routes = {
    // Root and dashboard
    '/': { 
        handler: 'dashboard', 
        auth: true, 
        title: 'Dashboard - PINTAR MR',
        icon: 'fa-home'
    },
    '/dashboard': { 
        handler: 'dashboard', 
        auth: true, 
        title: 'Dashboard - PINTAR MR',
        icon: 'fa-home'
    },
    
    // Analisis BSC (Balanced Scorecard) Module
    '/visi-misi': { 
        handler: 'visi-misi', 
        auth: true, 
        title: 'Visi dan Misi - PINTAR MR',
        icon: 'fa-bullseye',
        module: 'analisis-bsc'
    },
    '/rencana-strategis': { 
        handler: 'rencana-strategis', 
        auth: true, 
        title: 'Rencana Strategis - PINTAR MR',
        icon: 'fa-chart-line',
        module: 'analisis-bsc'
    },
    '/renstra': { 
        handler: 'renstra', 
        auth: true, 
        title: 'Renstra - PINTAR MR',
        icon: 'fa-clipboard-list',
        module: 'analisis-bsc'
    },
    '/renstra': { 
        handler: 'renstra', 
        auth: true, 
        title: 'Renstra - PINTAR MR',
        icon: 'fa-chart-line',
        module: 'analisis-bsc'
    },
    '/analisis-swot': { 
        handler: 'analisis-swot', 
        auth: true, 
        title: 'Analisis SWOT - PINTAR MR',
        icon: 'fa-chart-bar',
        module: 'analisis-bsc'
    },
    '/diagram-kartesius': { 
        handler: 'diagram-kartesius', 
        auth: true, 
        title: 'Diagram Kartesius - PINTAR MR',
        icon: 'fa-chart-scatter',
        module: 'analisis-bsc'
    },
    '/matriks-tows': { 
        handler: 'matriks-tows', 
        auth: true, 
        title: 'Matriks TOWS - PINTAR MR',
        icon: 'fa-table-cells',
        module: 'analisis-bsc'
    },
    '/sasaran-strategi': { 
        handler: 'sasaran-strategi', 
        auth: true, 
        title: 'Sasaran Strategi - PINTAR MR',
        icon: 'fa-bullseye',
        module: 'analisis-bsc'
    },
    '/strategic-map': { 
        handler: 'strategic-map', 
        auth: true, 
        title: 'Strategic Map - PINTAR MR',
        icon: 'fa-project-diagram',
        module: 'analisis-bsc'
    },
    '/indikator-kinerja-utama': { 
        handler: 'indikator-kinerja-utama', 
        auth: true, 
        title: 'Indikator Kinerja Utama - PINTAR MR',
        icon: 'fa-tachometer-alt',
        module: 'analisis-bsc'
    },
    '/evaluasi-iku': { 
        handler: 'evaluasi-iku', 
        auth: true, 
        title: 'Evaluasi IKU - PINTAR MR',
        icon: 'fa-chart-line',
        module: 'analisis-bsc'
    },
    
    // Manajemen Risiko Module
    '/manajemen-risiko/input-data': { 
        handler: 'risk-input', 
        auth: true, 
        title: 'Input Data Risiko - PINTAR MR',
        icon: 'fa-pen-to-square',
        module: 'manajemen-risiko'
    },
    
    // Legacy routes for backward compatibility
    '/residual-risk': { 
        handler: 'residual-risk', 
        auth: true, 
        title: 'Residual Risk - PINTAR MR',
        icon: 'fa-chart-pie',
        module: 'manajemen-risiko'
    },
    '/risk-profile': { 
        handler: 'risk-profile', 
        auth: true, 
        title: 'Risk Profile - PINTAR MR',
        icon: 'fa-chart-bar',
        module: 'manajemen-risiko'
    },
    '/manajemen-risiko/monitoring-evaluasi': { 
        handler: 'monitoring-evaluasi', 
        auth: true, 
        title: 'Monitoring & Evaluasi - PINTAR MR',
        icon: 'fa-clipboard-check',
        module: 'manajemen-risiko'
    },
    '/manajemen-risiko/peluang': { 
        handler: 'peluang', 
        auth: true, 
        title: 'Peluang - PINTAR MR',
        icon: 'fa-lightbulb',
        module: 'manajemen-risiko'
    },
    '/manajemen-risiko/risk-profile': { 
        handler: 'risk-profile', 
        auth: true, 
        title: 'Risk Profile - PINTAR MR',
        icon: 'fa-chart-bar',
        module: 'manajemen-risiko'
    },
    '/manajemen-risiko/residual-risk': { 
        handler: 'residual-risk', 
        auth: true, 
        title: 'Residual Risk - PINTAR MR',
        icon: 'fa-chart-pie',
        module: 'manajemen-risiko'
    },
    '/manajemen-risiko/kri': { 
        handler: 'kri', 
        auth: true, 
        title: 'Key Risk Indicator - PINTAR MR',
        icon: 'fa-gauge-high',
        module: 'manajemen-risiko'
    },
    '/manajemen-risiko/loss-event': { 
        handler: 'loss-event', 
        auth: true, 
        title: 'Loss Event - PINTAR MR',
        icon: 'fa-exclamation-triangle',
        module: 'manajemen-risiko'
    },
    '/manajemen-risiko/ews': { 
        handler: 'ews', 
        auth: true, 
        title: 'Early Warning System - PINTAR MR',
        icon: 'fa-triangle-exclamation',
        module: 'manajemen-risiko'
    },
    '/manajemen-risiko/risk-register': { 
        handler: 'risk-register', 
        auth: true, 
        title: 'Risk Register - PINTAR MR',
        icon: 'fa-table-list',
        module: 'manajemen-risiko'
    },
    
    // Standalone modules
    '/laporan': { 
        handler: 'laporan', 
        auth: true, 
        title: 'Laporan - PINTAR MR',
        icon: 'fa-file-pdf'
    },
    '/master-data': { 
        handler: 'master-data', 
        auth: true, 
        title: 'Master Data - PINTAR MR',
        icon: 'fa-database'
    },
    '/buku-pedoman': { 
        handler: 'buku-pedoman', 
        auth: true, 
        title: 'Buku Pedoman - PINTAR MR',
        icon: 'fa-book'
    },
    '/pengaturan': { 
        handler: 'pengaturan', 
        auth: true, 
        title: 'Pengaturan - PINTAR MR',
        icon: 'fa-cog'
    },
    
    // Authentication routes
    '/login': { 
        handler: 'login', 
        auth: false, 
        title: 'Login - PINTAR MR',
        icon: 'fa-sign-in-alt'
    },
    
    // Error pages
    '/404': { 
        handler: '404', 
        auth: false, 
        title: 'Halaman Tidak Ditemukan - PINTAR MR',
        icon: 'fa-exclamation-triangle'
    }
};

// Legacy page name to new URL mapping
const legacyPageMapping = {
    'dashboard': '/dashboard',
    'visi-misi': '/visi-misi',
    'rencana-strategis': '/rencana-strategis',
    'renstra': '/renstra',
    'renstra': '/renstra',
    'inventarisasi-swot': '/analisis-swot', // Note: inventarisasi-swot maps to analisis-swot
    'analisis-swot': '/analisis-swot',
    'diagram-kartesius': '/diagram-kartesius',
    'matriks-tows': '/matriks-tows',
    'sasaran-strategi': '/sasaran-strategi',
    'strategic-map': '/strategic-map',
    'indikator-kinerja-utama': '/indikator-kinerja-utama',
    'evaluasi-iku': '/evaluasi-iku',
    'risk-input': '/manajemen-risiko/input-data',
    'monitoring-evaluasi': '/manajemen-risiko/monitoring-evaluasi',
    'peluang': '/manajemen-risiko/peluang',
    'risk-profile': '/manajemen-risiko/risk-profile',
    'residual-risk': '/manajemen-risiko/residual-risk',
    'kri': '/manajemen-risiko/kri',
    'loss-event': '/manajemen-risiko/loss-event',
    'ews': '/manajemen-risiko/ews',
    'risk-register': '/manajemen-risiko/risk-register',
    'laporan': '/laporan',
    'master-data': '/master-data',
    'buku-pedoman': '/buku-pedoman',
    'pengaturan': '/pengaturan',
    'login': '/login',
    '404': '/404'
};

// URL to page name mapping (reverse of legacy mapping)
const urlToPageMapping = {};
Object.entries(legacyPageMapping).forEach(([pageName, url]) => {
    urlToPageMapping[url] = pageName;
});

/**
 * Get new URL for a legacy page name
 * @param {string} pageName - Legacy page name
 * @returns {string|null} - New URL or null if not found
 */
function getUrlForPage(pageName) {
    return legacyPageMapping[pageName] || null;
}

/**
 * Get page name for a URL
 * @param {string} url - URL path
 * @returns {string|null} - Page name or null if not found
 */
function getPageForUrl(url) {
    return urlToPageMapping[url] || null;
}

/**
 * Get route configuration for a URL
 * @param {string} url - URL path
 * @returns {Object|null} - Route configuration or null if not found
 */
function getRouteConfig(url) {
    return routes[url] || null;
}

/**
 * Get all routes for a specific module
 * @param {string} moduleName - Module name
 * @returns {Array} - Array of route configurations
 */
function getRoutesByModule(moduleName) {
    return Object.entries(routes)
        .filter(([url, config]) => config.module === moduleName)
        .map(([url, config]) => ({ url, ...config }));
}

/**
 * Check if a URL uses the old /auth/login pattern
 * @param {string} url - URL to check
 * @returns {boolean} - Whether URL uses legacy pattern
 */
function isLegacyUrl(url) {
    return url === '/auth/login' || url.includes('/auth/login');
}

/**
 * Get all protected routes (requiring authentication)
 * @returns {Array} - Array of protected route URLs
 */
function getProtectedRoutes() {
    return Object.entries(routes)
        .filter(([url, config]) => config.auth === true)
        .map(([url]) => url);
}

/**
 * Get all public routes (not requiring authentication)
 * @returns {Array} - Array of public route URLs
 */
function getPublicRoutes() {
    return Object.entries(routes)
        .filter(([url, config]) => config.auth === false)
        .map(([url]) => url);
}

/**
 * Validate URL structure follows naming conventions
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL follows conventions
 */
function validateUrlStructure(url) {
    // Should start with /
    if (!url.startsWith('/')) {
        return false;
    }
    
    // Should use kebab-case (lowercase with hyphens)
    const pathPart = url.substring(1); // Remove leading slash
    if (pathPart && !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(pathPart)) {
        return false;
    }
    
    // Should not end with / (except root)
    if (url.length > 1 && url.endsWith('/')) {
        return false;
    }
    
    // Should not contain double slashes
    if (url.includes('//')) {
        return false;
    }
    
    return true;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        routes,
        legacyPageMapping,
        urlToPageMapping,
        getUrlForPage,
        getPageForUrl,
        getRouteConfig,
        getRoutesByModule,
        isLegacyUrl,
        getProtectedRoutes,
        getPublicRoutes,
        validateUrlStructure
    };
} else {
    // Make available globally
    window.routeConfig = {
        routes,
        legacyPageMapping,
        urlToPageMapping,
        getUrlForPage,
        getPageForUrl,
        getRouteConfig,
        getRoutesByModule,
        isLegacyUrl,
        getProtectedRoutes,
        getPublicRoutes,
        validateUrlStructure
    };
}