/**
 * PREVENT RENCANA STRATEGIS SELECTION LIST LEAK
 * Only hides "Pilih Rencana Strategis" dropdown/list from other pages
 * Does NOT affect other page content
 * Created: 2026-01-07 v2.0 - Minimal version
 */

(function() {
    'use strict';
    
    console.log('🛡️ RS Selection Leak Prevention v2.0 loaded (minimal mode)');
    
    /**
     * Check if current page is rencana-strategis
     */
    function isRencanaStrategisPage() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        
        return (path === '/rencana-strategis' || hash === '#rencana-strategis');
    }
    
    /**
     * Hide RS selection list only (not other content)
     */
    function hideRSSelectionList() {
        if (isRencanaStrategisPage()) {
            return;
        }
        
        // Only target specific RS selection elements
        const selectors = [
            '.rs-selection-wrapper',
            '.rencana-strategis-selection',
            '.rs-selection-list',
            '#rs-selection-container',
            '[data-rs-selection-list="true"]'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (!el.closest('#rencana-strategis')) {
                    el.style.display = 'none';
                }
            });
        });
    }
    
    /**
     * Initialize
     */
    function initialize() {
        hideRSSelectionList();
        
        // Monitor for dynamically added RS selection
        const observer = new MutationObserver(() => {
            if (!isRencanaStrategisPage()) {
                hideRSSelectionList();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ RS Selection Leak Prevention initialized (minimal mode)');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();
