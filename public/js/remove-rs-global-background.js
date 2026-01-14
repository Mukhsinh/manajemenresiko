/**
 * REMOVE RS GLOBAL BACKGROUND v2.0
 * Menghapus tampilan "Pilih Rencana Strategis" dari semua halaman
 * Updated: 2026-01-10
 * 
 * OPTIMIZED: Reduced cleanup frequency to prevent performance issues
 */

(function() {
    'use strict';
    
    console.log('🧹 Remove RS Global Background v2.0 loading...');
    
    // Prevent multiple initializations
    if (window.RemoveRSGlobalBackgroundInitialized) {
        console.log('⚠️ Remove RS Global Background already initialized');
        return;
    }
    window.RemoveRSGlobalBackgroundInitialized = true;
    
    // ============================================
    // CONFIGURATION
    // ============================================
    
    const CONFIG = {
        cleanupInterval: 5000,  // Cleanup every 5 seconds (reduced from 2s)
        debounceTime: 200       // Debounce time for cleanup
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
     * Hide element completely
     */
    function hideElement(element) {
        if (!element) return;
        
        element.style.display = 'none';
        element.style.visibility = 'hidden';
        element.style.opacity = '0';
        element.style.position = 'absolute';
        element.style.left = '-99999px';
        element.style.pointerEvents = 'none';
    }
    
    /**
     * Remove RS elements from non-RS pages
     */
    function removeRSFromOtherPages() {
        if (isOnRSPage()) return;
        
        // Selectors for RS elements
        const selectors = [
            '.rencana-strategis-selection',
            '.rs-selection-wrapper',
            '.rs-selection-list',
            '#rs-selection-container',
            '[data-rs-selection-list]'
        ];
        
        // Remove from non-RS pages
        document.querySelectorAll('.page-content:not(#rencana-strategis)').forEach(page => {
            selectors.forEach(selector => {
                page.querySelectorAll(selector).forEach(hideElement);
            });
        });
        
        // Hide RS page when not active
        const rsPage = document.getElementById('rencana-strategis');
        if (rsPage && !rsPage.classList.contains('active')) {
            hideElement(rsPage);
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
        }
    }
    
    /**
     * Main cleanup function
     */
    function cleanup() {
        removeRSFromOtherPages();
        
        if (isOnRSPage()) {
            ensureRSPageVisible();
        }
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    function initialize() {
        console.log('🚀 Initializing RS Global Background Removal...');
        
        // Initial cleanup
        cleanup();
        
        // Periodic cleanup (less aggressive)
        setInterval(cleanup, CONFIG.cleanupInterval);
        
        // Listen for navigation events
        document.addEventListener('pageNavigated', cleanup);
        window.addEventListener('hashchange', cleanup);
        window.addEventListener('popstate', cleanup);
        
        console.log('✅ RS Global Background Removal initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Export for debugging
    window.RemoveRSGlobalBackground = {
        cleanup,
        isOnRSPage,
        ensureRSPageVisible
    };
    
    console.log('✅ Remove RS Global Background v2.0 loaded');
    
})();
