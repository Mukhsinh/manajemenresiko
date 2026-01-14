/**
 * REMOVE RS SELECTION LIST FROM ALL PAGES (EXCEPT RS PAGE)
 * ONLY removes "Pilih Rencana Strategis" dropdown/list
 * Does NOT hide any other content
 * 
 * Created: 2026-01-07 v2.0 - Fixed to be less aggressive
 */

(function() {
    'use strict';
    
    console.log('🧹 RS Selection Remover v2.0 loaded (minimal mode)');
    
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
     * Check if element is specifically the RS selection dropdown/list
     * Very specific check - only targets the RS selection list
     */
    function isRSSelectionList(element) {
        if (!element) return false;
        
        // Check for specific RS selection classes
        if (element.classList.contains('rs-selection-wrapper') ||
            element.classList.contains('rencana-strategis-selection') ||
            element.classList.contains('rs-selection-list') ||
            element.classList.contains('rencana-strategis-selection-list')) {
            return true;
        }
        
        // Check for specific RS selection IDs
        if (element.id === 'rs-selection-container' ||
            element.id === 'rencana-strategis-selection') {
            return true;
        }
        
        // Check for data attribute
        if (element.hasAttribute('data-rs-selection-list')) {
            return true;
        }
        
        // Check if it's a card with "Pilih Rencana Strategis" header
        // AND contains RS codes (RS-XXXX-XXX pattern)
        const text = element.textContent || '';
        if (text.includes('Pilih Rencana Strategis')) {
            // Must also contain RS codes to be considered RS selection list
            const hasRSCodes = /RS-\d{4}-\d{3}/.test(text);
            // Must have multiple RS codes (indicating it's a list)
            const rsCodeMatches = text.match(/RS-\d{4}-\d{3}/g);
            if (hasRSCodes && rsCodeMatches && rsCodeMatches.length >= 2) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Remove ONLY RS selection list from pages
     */
    function removeRSSelectionOnly() {
        if (isRencanaStrategisPage()) {
            console.log('✅ On RS page, skipping removal');
            return;
        }
        
        let removed = 0;
        
        // Target specific RS selection elements only
        const rsSelectors = [
            '.rs-selection-wrapper',
            '.rencana-strategis-selection',
            '.rs-selection-list',
            '.rencana-strategis-selection-list',
            '#rs-selection-container',
            '#rencana-strategis-selection',
            '[data-rs-selection-list="true"]'
        ];
        
        rsSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Don't remove if inside RS page
                if (el.closest('#rencana-strategis')) return;
                
                console.log('🗑️ Removing RS selection element:', selector);
                el.style.display = 'none';
                removed++;
            });
        });
        
        // Check for cards that are specifically RS selection lists
        // (cards right after kop-header that contain RS selection)
        const kopHeader = document.getElementById('kop-header');
        if (kopHeader) {
            let nextEl = kopHeader.nextElementSibling;
            while (nextEl && !nextEl.classList.contains('page-content')) {
                if (nextEl.classList.contains('card') && isRSSelectionList(nextEl)) {
                    console.log('🗑️ Removing RS selection card after kop-header');
                    nextEl.style.display = 'none';
                    removed++;
                }
                nextEl = nextEl.nextElementSibling;
            }
        }
        
        if (removed > 0) {
            console.log(`✅ Removed ${removed} RS selection element(s)`);
        }
    }
    
    /**
     * Initialize
     */
    function initialize() {
        console.log('🚀 Initializing RS Selection Remover (minimal mode)...');
        
        // Initial removal
        removeRSSelectionOnly();
        
        // Setup observer for dynamically added RS selection
        const observer = new MutationObserver((mutations) => {
            if (isRencanaStrategisPage()) return;
            
            let needsCheck = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && isRSSelectionList(node)) {
                            needsCheck = true;
                        }
                    });
                }
            });
            
            if (needsCheck) {
                setTimeout(removeRSSelectionOnly, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ RS Selection Remover initialized (minimal mode)');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Expose for manual use
    window.removeRSSelectionOnly = removeRSSelectionOnly;
    
})();
