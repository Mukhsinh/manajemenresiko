/**
 * PREVENT RENCANA STRATEGIS SELECTION ON OTHER PAGES
 * Only hides "Pilih Rencana Strategis" dropdown/list from other pages
 * Does NOT affect other page content
 * Created: 2026-01-07 v2.0 - Minimal version
 */

(function() {
    'use strict';
    
    console.log('🛡️ Prevent RS Selection on Other Pages v2.0 loaded');
    
    function isRencanaStrategisPage() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        return path.includes('rencana-strategis') || 
               hash === '#rencana-strategis' ||
               path === '/rencana-strategis';
    }
    
    function hideRSSelectionOnly() {
        if (isRencanaStrategisPage()) {
            return;
        }
        
        // Only target specific RS selection elements
        const selectors = [
            '.rs-selection-wrapper',
            '.rencana-strategis-selection',
            '.rs-selection-list',
            '.rencana-strategis-selection-list',
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
    
    function initialize() {
        hideRSSelectionOnly();
        
        const observer = new MutationObserver(() => {
            if (!isRencanaStrategisPage()) {
                hideRSSelectionOnly();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ RS Selection protection active');
    }
    
    window.addEventListener('popstate', () => setTimeout(hideRSSelectionOnly, 100));
    window.addEventListener('hashchange', () => setTimeout(hideRSSelectionOnly, 100));
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();
