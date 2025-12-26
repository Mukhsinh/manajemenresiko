/**
 * 404 Error Handler
 * Handles page not found errors and provides navigation options
 */

/**
 * Show 404 error page
 * @param {string} requestedUrl - The URL that was not found
 */
function show404Error(requestedUrl = window.location.pathname) {
    console.log(`📄 Showing 404 error for: ${requestedUrl}`);
    
    // Hide all existing pages
    hideAllPages();
    
    // Hide main app content
    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.style.display = 'none';
    }
    
    // Create and show 404 page
    create404ErrorPage(requestedUrl);
    
    // Log 404 error for debugging
    log404Error(requestedUrl);
}

/**
 * Create inline 404 error page
 * @param {string} requestedUrl - The URL that was not found
 */
function create404ErrorPage(requestedUrl) {
    // Remove existing 404 page if any
    const existingErrorPage = document.getElementById('error-404-page');
    if (existingErrorPage) {
        existingErrorPage.remove();
    }
    
    const errorHTML = `
        <div id="error-404-page" class="error-page">
            <div class="error-container">
                <div class="error-code">
                    <i class="fas fa-exclamation-triangle"></i>
                    404
                </div>
                
                <div class="error-message">
                    Halaman Tidak Ditemukan
                </div>
                
                <div class="error-description">
                    Maaf, halaman yang Anda cari tidak dapat ditemukan. URL mungkin salah atau halaman telah dipindahkan.
                </div>
                
                <div class="current-url">
                    <strong>URL yang diminta:</strong> ${requestedUrl}
                </div>
                
                <div class="navigation-buttons">
                    <button class="btn btn-primary" onclick="navigateTo('/dashboard')">
                        <i class="fas fa-tachometer-alt"></i> Dashboard
                    </button>
                    
                    <button class="btn btn-secondary" onclick="navigateTo('/visi-misi')">
                        <i class="fas fa-eye"></i> Visi & Misi
                    </button>
                    
                    <button class="btn btn-secondary" onclick="navigateTo('/manajemen-risiko/input-data')">
                        <i class="fas fa-shield-alt"></i> Manajemen Risiko
                    </button>
                    
                    <button class="btn btn-secondary" onclick="navigateTo('/laporan')">
                        <i class="fas fa-file-alt"></i> Laporan
                    </button>
                    
                    <button class="btn btn-outline-light" onclick="goBack()">
                        <i class="fas fa-arrow-left"></i> Kembali
                    </button>
                </div>
                
                <div class="error-suggestions">
                    <h5>Saran:</h5>
                    <ul>
                        <li>Periksa ejaan URL</li>
                        <li>Gunakan menu navigasi di atas</li>
                        <li>Kembali ke halaman sebelumnya</li>
                        <li>Hubungi administrator jika masalah berlanjut</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', errorHTML);
}

/**
 * Navigate to a specific URL
 * @param {string} url - URL to navigate to
 */
function navigateTo(url) {
    console.log(`🧭 Navigating from 404 page to: ${url}`);
    
    // Hide 404 page
    const errorPage = document.getElementById('error-404-page');
    if (errorPage) {
        errorPage.remove();
    }
    
    // Show main app content
    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.style.display = 'block';
    }
    
    // Use router if available
    if (window.appRouter) {
        window.appRouter.navigate(url);
    } else {
        // Fallback to page reload
        window.location.href = url;
    }
}

/**
 * Go back to previous page
 */
function goBack() {
    console.log('🔙 Going back from 404 page');
    
    // Hide 404 page
    const errorPage = document.getElementById('error-404-page');
    if (errorPage) {
        errorPage.remove();
    }
    
    // Show main app content
    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.style.display = 'block';
    }
    
    // Try to go back in history
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // Fallback to dashboard
        navigateTo('/dashboard');
    }
}

/**
 * Log 404 error for debugging
 * @param {string} requestedUrl - The URL that was not found
 */
function log404Error(requestedUrl) {
    const errorData = {
        url: requestedUrl,
        fullUrl: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
    };
    
    console.error('404 Error - Page not found:', errorData);
    
    // Send to server for logging (optional)
    if (window.fetch) {
        fetch('/api/log-404', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(errorData)
        }).catch(err => {
            console.debug('404 logging to server failed:', err);
        });
    }
}

/**
 * Check if a URL is valid/exists in our route configuration
 * @param {string} url - URL to check
 * @returns {boolean} - Whether URL is valid
 */
function isValidRoute(url) {
    if (!window.ROUTE_CONFIG) {
        return false;
    }
    
    // Normalize URL
    const normalizedUrl = url.startsWith('/') ? url : '/' + url;
    
    // Check exact match
    if (window.ROUTE_CONFIG[normalizedUrl]) {
        return true;
    }
    
    // Check pattern match (for parameterized routes)
    for (const pattern in window.ROUTE_CONFIG) {
        if (isPatternMatch(pattern, normalizedUrl)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Check if a pattern matches a path (simple implementation)
 * @param {string} pattern - Route pattern
 * @param {string} path - Actual path
 * @returns {boolean} - Whether pattern matches
 */
function isPatternMatch(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    if (patternParts.length !== pathParts.length) {
        return false;
    }
    
    return patternParts.every((part, index) => {
        return part.startsWith(':') || part === pathParts[index];
    });
}

/**
 * Get suggested routes based on the requested URL
 * @param {string} requestedUrl - The URL that was not found
 * @returns {Array} - Array of suggested routes
 */
function getSuggestedRoutes(requestedUrl) {
    if (!window.ROUTE_CONFIG) {
        return [];
    }
    
    const suggestions = [];
    const requestedParts = requestedUrl.toLowerCase().split('/');
    
    // Find routes with similar path segments
    for (const [url, config] of Object.entries(window.ROUTE_CONFIG)) {
        const urlParts = url.toLowerCase().split('/');
        
        // Calculate similarity score
        let score = 0;
        requestedParts.forEach(part => {
            if (part && urlParts.some(urlPart => urlPart.includes(part) || part.includes(urlPart))) {
                score++;
            }
        });
        
        if (score > 0) {
            suggestions.push({
                url: url,
                title: config.title,
                score: score
            });
        }
    }
    
    // Sort by score and return top 5
    return suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        show404Error,
        isValidRoute,
        getSuggestedRoutes
    };
} else {
    // Browser environment
    window.show404Error = show404Error;
    window.isValidRoute = isValidRoute;
    window.getSuggestedRoutes = getSuggestedRoutes;
    window.navigateTo = navigateTo;
    window.goBack = goBack;
}

console.log('📦 404 handler module loaded');