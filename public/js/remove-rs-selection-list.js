/**
 * REMOVE RS SELECTION LIST - MINIMAL VERSION
 * Only hides "Pilih Rencana Strategis" dropdown/list from other pages
 * Does NOT affect other page content
 * Created: 2026-01-07 v2.0 - Minimal version
 */

(function() {
    'use strict';
    
    console.log('🛡️ RS Selection List Remover v2.0 loaded (minimal mode)');
    
    function isRSPageActive() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        return path.includes('rencana-strategis') || hash.includes('rencana-strategis');
    }
    
    function hideRSSelectionOnly() {
        if (isRSPageActive()) {
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
    
    function init() {
        hideRSSelectionOnly();
        
        const observer = new MutationObserver(() => {
            if (!isRSPageActive()) {
                hideRSSelectionOnly();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ RS Selection List Remover initialized (minimal mode)');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    window.addEventListener('popstate', () => setTimeout(hideRSSelectionOnly, 100));
    window.addEventListener('hashchange', () => setTimeout(hideRSSelectionOnly, 100));
    
    window.hideRSSelectionOnly = hideRSSelectionOnly;
    
})();
