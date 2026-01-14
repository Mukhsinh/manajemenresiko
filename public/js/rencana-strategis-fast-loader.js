/**
 * RENCANA STRATEGIS FAST LOADER v1.0
 * Mempercepat loading halaman dan mencegah freeze
 * Created: 2026-01-10
 */

(function() {
    'use strict';
    
    console.log('⚡ Rencana Strategis Fast Loader v1.0 loading...');
    
    // Prevent multiple initializations
    if (window.RSFastLoaderInitialized) {
        console.log('⚠️ RS Fast Loader already initialized');
        return;
    }
    window.RSFastLoaderInitialized = true;
    
    // ============================================
    // CONFIGURATION
    // ============================================
    
    const CONFIG = {
        maxLoadTime: 3000,      // Max loading time before showing content
        debounceTime: 100,      // Debounce time for cleanup
        cleanupInterval: 5000   // Cleanup interval
    };
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * Check if we're on the RS page
     */
    function isOnRSPage() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        const activePage = document.querySelector('.page-content.active');
        
        return path === '/rencana-strategis' || 
               path.includes('rencana-strategis') ||
               hash === '#rencana-strategis' ||
               (activePage && activePage.id === 'rencana-strategis');
    }
    
    /**
     * Remove global background/selection list
     */
    function removeGlobalBackground() {
        if (isOnRSPage()) return;
        
        // Remove RS elements from non-RS pages
        const selectors = [
            '.rencana-strategis-selection',
            '.rs-selection-wrapper',
            '.rs-selection-list',
            '#rs-selection-container',
            '[data-rs-selection-list]'
        ];
        
        document.querySelectorAll('.page-content:not(#rencana-strategis)').forEach(page => {
            selectors.forEach(selector => {
                page.querySelectorAll(selector).forEach(el => {
                    el.style.display = 'none';
                    el.style.visibility = 'hidden';
                });
            });
        });
        
        // Hide RS page when not active
        const rsPage = document.getElementById('rencana-strategis');
        if (rsPage && !rsPage.classList.contains('active')) {
            rsPage.style.display = 'none';
            rsPage.style.visibility = 'hidden';
            rsPage.style.position = 'absolute';
            rsPage.style.left = '-99999px';
        }
    }
    
    /**
     * Ensure RS page shows properly when active
     */
    function ensureRSPageVisible() {
        if (!isOnRSPage()) return;
        
        const rsPage = document.getElementById('rencana-strategis');
        const rsContent = document.getElementById('rencana-strategis-content');
        
        if (rsPage) {
            rsPage.style.display = 'block';
            rsPage.style.visibility = 'visible';
            rsPage.style.opacity = '1';
            rsPage.style.position = 'relative';
            rsPage.style.left = 'auto';
            rsPage.classList.add('active');
        }
        
        if (rsContent) {
            rsContent.style.display = 'block';
            rsContent.style.visibility = 'visible';
            rsContent.style.opacity = '1';
            rsContent.style.minHeight = '400px';
            rsContent.style.backgroundColor = '#f8f9fa';
        }
    }
    
    /**
     * Fast load RS module
     */
    async function fastLoadRSModule() {
        if (!isOnRSPage()) return;
        
        console.log('⚡ Fast loading RS module...');
        
        // Ensure page is visible first
        ensureRSPageVisible();
        
        // Check if module exists
        if (window.RencanaStrategisModule && typeof window.RencanaStrategisModule.load === 'function') {
            // Set timeout to prevent infinite loading
            const loadPromise = window.RencanaStrategisModule.load();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Load timeout')), CONFIG.maxLoadTime);
            });
            
            try {
                await Promise.race([loadPromise, timeoutPromise]);
                console.log('✅ RS module loaded successfully');
            } catch (error) {
                console.warn('⚠️ RS module load timeout, showing fallback...');
                showFallbackContent();
            }
        } else {
            console.warn('⚠️ RS module not found, showing fallback...');
            showFallbackContent();
        }
    }
    
    /**
     * Show fallback content if module fails to load
     */
    function showFallbackContent() {
        const container = document.getElementById('rencana-strategis-content');
        if (!container) return;
        
        // Only show fallback if container is empty or has loading spinner
        if (container.innerHTML.includes('spinner') || container.innerHTML.trim() === '') {
            container.innerHTML = `
                <div class="rencana-strategis-wrapper p-3">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Memuat data...</strong>
                        <p class="mb-0 mt-2">Halaman sedang dimuat. Jika tidak muncul dalam beberapa detik, silakan refresh halaman.</p>
                        <button class="btn btn-primary btn-sm mt-3" onclick="location.reload()">
                            <i class="fas fa-sync-alt me-1"></i> Refresh
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Cleanup function
     */
    function cleanup() {
        removeGlobalBackground();
        
        if (isOnRSPage()) {
            ensureRSPageVisible();
        }
    }
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    // Listen for navigation events
    document.addEventListener('pageNavigated', cleanup);
    window.addEventListener('hashchange', cleanup);
    window.addEventListener('popstate', cleanup);
    
    // Listen for RS page activation
    document.addEventListener('click', (e) => {
        const menuItem = e.target.closest('[data-page="rencana-strategis"]');
        if (menuItem) {
            setTimeout(fastLoadRSModule, 100);
        }
    });
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    function initialize() {
        console.log('🚀 Initializing RS Fast Loader...');
        
        // Initial cleanup
        cleanup();
        
        // If on RS page, fast load
        if (isOnRSPage()) {
            fastLoadRSModule();
        }
        
        // Periodic cleanup (less aggressive)
        setInterval(cleanup, CONFIG.cleanupInterval);
        
        console.log('✅ RS Fast Loader initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Export for debugging
    window.RSFastLoader = {
        cleanup,
        fastLoadRSModule,
        isOnRSPage,
        ensureRSPageVisible
    };
    
    console.log('✅ Rencana Strategis Fast Loader v1.0 loaded');
    
})();
