/**
 * PREVENT RENCANA STRATEGIS SELECTION LEAK
 * Only hides "Pilih Rencana Strategis" dropdown/list from other pages
 * Does NOT affect other page content
 * Created: 2026-01-07 v2.0 - Minimal version
 */

(function() {
    'use strict';
    
    console.log('🛡️ RS Selection Leak Prevention v2.0 loaded');
    
    /**
     * Get current active page
     */
    function getCurrentPage() {
        const activePage = document.querySelector('.page-content.active');
        if (activePage) {
            return activePage.id;
        }
        
        const path = window.location.pathname;
        if (path.includes('rencana-strategis')) {
            return 'rencana-strategis';
        }
        
        const hash = window.location.hash.replace('#', '');
        return hash || 'dashboard';
    }
    
    /**
     * Hide RS selection list only
     */
    function hideRSSelectionList() {
        const currentPage = getCurrentPage();
        
        if (currentPage === 'rencana-strategis') {
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
    
    /**
     * Initialize
     */
    function init() {
        hideRSSelectionList();
        
        // Monitor for dynamically added elements
        const observer = new MutationObserver(() => {
            const currentPage = getCurrentPage();
            if (currentPage !== 'rencana-strategis') {
                hideRSSelectionList();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ RS Selection Leak Prevention active');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    window.hideRSSelectionList = hideRSSelectionList;
    
})();
