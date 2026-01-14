/**
 * RS SELECTION ISOLATION - SAFE VERSION
 * Only hides "Pilih Rencana Strategis" dropdown/list from other pages
 * Does NOT affect other page content
 * Created: 2026-01-07 v2.0 - Minimal version
 */

(function() {
    'use strict';
    
    console.log('🛡️ RS Selection Isolation (Safe) v2.0 loaded');
    
    /**
     * Check if current page is rencana-strategis
     */
    function isRencanaStrategisPage() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        
        if (path === '/rencana-strategis' || hash === '#rencana-strategis') {
            return true;
        }
        
        const activePage = document.querySelector('.page-content.active');
        if (activePage && activePage.id === 'rencana-strategis') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Hide RS selection list only
     */
    function hideRSSelectionOnly() {
        if (isRencanaStrategisPage()) {
            return;
        }
        
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
    function initialize() {
        console.log('🚀 Initializing RS Selection Isolation (Safe)...');
        
        hideRSSelectionOnly();
        
        // Monitor for dynamically added elements - OPTIMIZED with debounce
        let debounceTimeout = null;
        const observer = new MutationObserver(() => {
            if (debounceTimeout) clearTimeout(debounceTimeout);
            
            debounceTimeout = setTimeout(() => {
                if (!isRencanaStrategisPage()) {
                    hideRSSelectionOnly();
                }
            }, 500); // Wait 500ms before checking
        });
        
        // Only observe page-content elements, not entire body
        const pageContents = document.querySelectorAll('.page-content');
        if (pageContents.length > 0) {
            pageContents.forEach(page => {
                observer.observe(page, {
                    childList: true,
                    subtree: false
                });
            });
        } else {
            // Fallback: observe body but with limited scope
            observer.observe(document.body, {
                childList: true,
                subtree: false
            });
        }
        
        console.log('✅ RS Selection Isolation (Safe) initialized');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    window.hideRSSelectionOnly = hideRSSelectionOnly;
    
})();
