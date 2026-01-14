/**
 * PREVENT RS SELECTION DROPDOWN
 * Only hides "Pilih Rencana Strategis" dropdown/list from other pages
 * Does NOT affect other page content
 * Updated: 2026-01-07 v2.0 - Minimal version
 */

(function() {
    'use strict';
    
    console.log('🛡️ RS Selection Dropdown Prevention v2.0 loaded');
    
    function isRencanaStrategisPage() {
        const currentPage = document.querySelector('.page-content.active');
        return currentPage && currentPage.id === 'rencana-strategis';
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
    
    function init() {
        hideRSSelectionOnly();
        
        const observer = new MutationObserver(() => {
            if (!isRencanaStrategisPage()) {
                hideRSSelectionOnly();
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        console.log('✅ RS Selection Dropdown Prevention active');
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
