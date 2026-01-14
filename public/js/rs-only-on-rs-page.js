/**
 * RS ONLY ON RS PAGE
 * Only hide Rencana Strategis selection list when it appears on OTHER pages
 * Does NOT hide any other content - only RS-specific elements
 * 
 * Created: 2026-01-07 v1.0
 */

(function() {
    'use strict';
    
    console.log('🎯 RS Page Isolation v1.0 loaded');
    
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
     * Hide RS selection list ONLY - not other content
     * This targets specific RS selection elements that leak to other pages
     */
    function hideRSSelectionOnOtherPages() {
        if (isRencanaStrategisPage()) {
            console.log('✅ On RS page, not hiding anything');
            return;
        }
        
        // Only target specific RS selection elements
        const rsSelectors = [
            '.rs-selection-wrapper',
            '.rencana-strategis-selection',
            '[data-rs-selection]',
            '.selection-list-rs'
        ];
        
        rsSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Only hide if NOT inside #rencana-strategis page
                if (!el.closest('#rencana-strategis')) {
                    el.style.display = 'none';
                    console.log('🎯 Hidden RS selection element:', selector);
                }
            });
        });
    }
    
    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideRSSelectionOnOtherPages);
    } else {
        hideRSSelectionOnOtherPages();
    }
    
    // Run on navigation changes
    window.addEventListener('hashchange', () => {
        setTimeout(hideRSSelectionOnOtherPages, 100);
    });
    
})();
