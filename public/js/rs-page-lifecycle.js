/**
 * RS PAGE LIFECYCLE MANAGER
 * Manages Rencana Strategis module lifecycle to prevent content leaking to other pages
 * 
 * ROOT CAUSE ANALYSIS:
 * 1. MutationObserver in RencanaStrategisModule continues running after navigation
 * 2. No proper cleanup when leaving RS page
 * 3. Global state not reset on navigation
 * 
 * SOLUTION:
 * - Proper cleanup on page leave
 * - Disconnect observers when navigating away
 * - Clear RS content from non-RS pages
 * 
 * Created: 2026-01-07 v1.0
 */

(function() {
    'use strict';
    
    console.log('🔄 RS Page Lifecycle Manager v1.0 loaded');
    
    // Track current page
    let currentPage = null;
    let rsObserverDisconnected = false;
    
    /**
     * Check if current page is rencana-strategis
     */
    function isRencanaStrategisPage() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        
        if (path === '/rencana-strategis' || path.includes('rencana-strategis')) {
            return true;
        }
        
        if (hash === '#rencana-strategis' || hash.includes('rencana-strategis')) {
            return true;
        }
        
        const activePage = document.querySelector('.page-content.active');
        if (activePage && activePage.id === 'rencana-strategis') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get current active page name
     */
    function getCurrentPageName() {
        const activePage = document.querySelector('.page-content.active');
        if (activePage) {
            return activePage.id;
        }
        
        const path = window.location.pathname;
        if (path === '/' || path === '') {
            return 'dashboard';
        }
        
        return path.replace(/^\//, '').split('/')[0] || 'dashboard';
    }
    
    /**
     * Cleanup RS module when leaving RS page
     */
    function cleanupRSModule() {
        console.log('🧹 Cleaning up RS module...');
        
        // 1. Disconnect MutationObserver if exists
        if (window.RencanaStrategisModule && window.RencanaStrategisModule.state) {
            const state = window.RencanaStrategisModule.state;
            if (state.observer) {
                try {
                    state.observer.disconnect();
                    console.log('✅ RS MutationObserver disconnected');
                } catch (e) {
                    console.warn('⚠️ Error disconnecting observer:', e);
                }
            }
        }
        
        // 2. Reset global flags
        window.rencanaStrategisModuleLoaded = false;
        window.rencanaStrategisLoadTime = 0;
        window.RENCANA_STRATEGIS_VIEW_LOCKED = false;
        window.RENCANA_STRATEGIS_DISPLAY_MODE = null;
        
        // 3. Mark observer as disconnected
        rsObserverDisconnected = true;
        
        console.log('✅ RS module cleanup complete');
    }
    
    /**
     * Remove RS content from non-RS pages
     */
    function removeRSContentFromOtherPages() {
        if (isRencanaStrategisPage()) {
            return; // Don't remove on RS page
        }
        
        // Find and remove RS-specific elements that leaked to other pages
        const rsElements = document.querySelectorAll(`
            .rencana-strategis-wrapper:not(#rencana-strategis .rencana-strategis-wrapper),
            #rencana-strategis-content:not(#rencana-strategis #rencana-strategis-content)
        `);
        
        rsElements.forEach(el => {
            // Only remove if not inside the RS page container
            if (!el.closest('#rencana-strategis')) {
                console.log('🗑️ Removing leaked RS element');
                el.remove();
            }
        });
        
        // Also check for RS content rendered in wrong containers
        document.querySelectorAll('.page-content.active').forEach(page => {
            if (page.id !== 'rencana-strategis') {
                const rsWrapper = page.querySelector('.rencana-strategis-wrapper');
                if (rsWrapper) {
                    console.log('🗑️ Removing RS wrapper from page:', page.id);
                    rsWrapper.remove();
                }
            }
        });
    }
    
    /**
     * Handle page change
     */
    function handlePageChange(newPage) {
        const wasOnRSPage = currentPage === 'rencana-strategis';
        const isNowOnRSPage = newPage === 'rencana-strategis';
        
        console.log(`📄 Page change: ${currentPage} → ${newPage}`);
        
        // If leaving RS page, cleanup
        if (wasOnRSPage && !isNowOnRSPage) {
            console.log('🚪 Leaving RS page, performing cleanup...');
            cleanupRSModule();
        }
        
        // If entering RS page, reset flags
        if (!wasOnRSPage && isNowOnRSPage) {
            console.log('🚪 Entering RS page, resetting flags...');
            rsObserverDisconnected = false;
        }
        
        // Always remove RS content from non-RS pages
        if (!isNowOnRSPage) {
            setTimeout(removeRSContentFromOtherPages, 100);
            setTimeout(removeRSContentFromOtherPages, 500);
        }
        
        currentPage = newPage;
    }
    
    /**
     * Monitor for page changes
     */
    function setupPageChangeMonitor() {
        // Initial page
        currentPage = getCurrentPageName();
        console.log('📄 Initial page:', currentPage);
        
        // Monitor hash changes
        window.addEventListener('hashchange', () => {
            const newPage = getCurrentPageName();
            if (newPage !== currentPage) {
                handlePageChange(newPage);
            }
        });
        
        // Monitor popstate (browser back/forward)
        window.addEventListener('popstate', () => {
            setTimeout(() => {
                const newPage = getCurrentPageName();
                if (newPage !== currentPage) {
                    handlePageChange(newPage);
                }
            }, 50);
        });
        
        // Monitor DOM changes for SPA navigation - OPTIMIZED to prevent performance issues
        let domCheckTimeout = null;
        const bodyObserver = new MutationObserver((mutations) => {
            // Debounce DOM checks to prevent excessive processing
            if (domCheckTimeout) clearTimeout(domCheckTimeout);
            
            domCheckTimeout = setTimeout(() => {
                const newPage = getCurrentPageName();
                if (newPage !== currentPage) {
                    handlePageChange(newPage);
                }
            }, 300); // Wait 300ms before checking
        });
        
        // Only observe class changes on page-content elements, not entire body
        const pageContents = document.querySelectorAll('.page-content');
        pageContents.forEach(page => {
            bodyObserver.observe(page, {
                attributes: true,
                attributeFilter: ['class']
            });
        });
        
        // Intercept navigateToPage function
        const originalNavigateToPage = window.navigateToPage;
        if (typeof originalNavigateToPage === 'function') {
            window.navigateToPage = function(pageName, ...args) {
                // Pre-navigation cleanup
                if (currentPage === 'rencana-strategis' && pageName !== 'rencana-strategis') {
                    cleanupRSModule();
                }
                
                // Call original
                const result = originalNavigateToPage.call(this, pageName, ...args);
                
                // Post-navigation cleanup
                setTimeout(() => {
                    handlePageChange(pageName);
                }, 100);
                
                return result;
            };
            console.log('✅ navigateToPage intercepted for RS lifecycle management');
        }
    }
    
    /**
     * Periodic cleanup check - REDUCED frequency to prevent performance issues
     */
    function setupPeriodicCleanup() {
        // Only run cleanup check every 5 seconds instead of 2
        setInterval(() => {
            if (!isRencanaStrategisPage()) {
                removeRSContentFromOtherPages();
            }
        }, 5000); // Check every 5 seconds
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupPageChangeMonitor();
            setupPeriodicCleanup();
        });
    } else {
        setupPageChangeMonitor();
        setupPeriodicCleanup();
    }
    
    // Export for debugging
    window.RSPageLifecycle = {
        isRencanaStrategisPage,
        getCurrentPageName,
        cleanupRSModule,
        removeRSContentFromOtherPages,
        handlePageChange
    };
    
    console.log('✅ RS Page Lifecycle Manager initialized');
})();
