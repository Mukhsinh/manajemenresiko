/**
 * Remove Purple Colors - Dynamic Purple Color Removal
 * This JavaScript removes purple colors dynamically from the page
 */

(function() {
    'use strict';
    
    // Purple color patterns to detect
    const purplePatterns = [
        '#ffffff',
        '#ffffff',
        '#f093fb',
        '#f5576c',
        'rgb(118, 75, 162)',
        'rgb(102, 126, 234)',
        'rgb(240, 147, 251)',
        'rgb(245, 87, 108)',
        'linear-gradient(135deg, #ffffff 0%, #ffffff 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'purple'
    ];
    
    /**
     * Remove purple colors from an element
     */
    function removePurpleFromElement(element) {
        if (!element || !element.style) return;
        
        const computedStyle = window.getComputedStyle(element);
        const inlineStyle = element.getAttribute('style') || '';
        
        // Check inline styles
        purplePatterns.forEach(pattern => {
            if (inlineStyle.includes(pattern)) {
                console.log('Removing purple color from element:', element, 'Pattern:', pattern);
                element.style.background = '#ffffff';
                element.style.backgroundColor = '#ffffff';
                element.style.backgroundImage = 'none';
            }
        });
        
        // Check computed styles
        const bgColor = computedStyle.backgroundColor;
        const bgImage = computedStyle.backgroundImage;
        
        if (bgColor && (bgColor.includes('118, 75, 162') || bgColor.includes('102, 126, 234'))) {
            element.style.background = '#ffffff';
            element.style.backgroundColor = '#ffffff';
        }
        
        if (bgImage && bgImage.includes('gradient')) {
            purplePatterns.forEach(pattern => {
                if (bgImage.includes(pattern.replace('#', ''))) {
                    element.style.backgroundImage = 'none';
                    element.style.background = '#ffffff';
                }
            });
        }
    }
    
    /**
     * Scan and remove purple colors from all elements
     */
    function scanAndRemovePurple() {
        // Target specific elements that commonly have purple backgrounds
        const selectors = [
            '.card-header',
            '.page-header',
            '.section-header',
            '.modal-header',
            '.panel-heading',
            '[style*="purple"]',
            '[style*="#ffffff"]',
            '[style*="#ffffff"]',
            '[style*="linear-gradient"]'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(removePurpleFromElement);
        });
        
        // Also check all elements with inline styles
        const allElements = document.querySelectorAll('[style]');
        allElements.forEach(element => {
            const style = element.getAttribute('style');
            if (style) {
                purplePatterns.forEach(pattern => {
                    if (style.includes(pattern)) {
                        removePurpleFromElement(element);
                    }
                });
            }
        });
    }
    
    /**
     * Observer for dynamic content changes
     */
    function setupMutationObserver() {
        const observer = new MutationObserver(function(mutations) {
            let shouldScan = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            shouldScan = true;
                        }
                    });
                } else if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    removePurpleFromElement(mutation.target);
                }
            });
            
            if (shouldScan) {
                setTimeout(scanAndRemovePurple, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        return observer;
    }
    
    /**
     * Initialize purple color removal
     */
    function init() {
        console.log('Initializing purple color removal...');
        
        // Initial scan
        scanAndRemovePurple();
        
        // Setup observer for dynamic changes
        setupMutationObserver();
        
        // Periodic scan as backup
        setInterval(scanAndRemovePurple, 5000);
        
        console.log('Purple color removal initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Also run on window load as backup
    window.addEventListener('load', function() {
        setTimeout(scanAndRemovePurple, 500);
    });
    
    // Export for manual use
    window.removePurpleColors = {
        scan: scanAndRemovePurple,
        removeFromElement: removePurpleFromElement
    };
    
})();