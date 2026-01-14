/**
 * Header Color Fix - Prevents Purple Gradient Issue
 * This script ensures headers remain white/gray and don't turn purple when navigating
 */

(function() {
    'use strict';
    
    console.log('🎨 Header Color Fix loaded');
    
    // Override any dynamic style changes that might cause purple headers
    function enforceHeaderColors() {
        // Fix navbar colors
        const navbars = document.querySelectorAll('.navbar.bg-primary');
        navbars.forEach(navbar => {
            navbar.style.background = '#007bff';
            navbar.style.backgroundImage = 'none';
            navbar.style.backgroundColor = '#007bff';
        });
        
        // Fix page headers
        const pageHeaders = document.querySelectorAll('.page-header');
        pageHeaders.forEach(header => {
            header.style.background = '#ffffff';
            header.style.backgroundImage = 'none';
            header.style.color = '#2c3e50';
            header.style.borderLeft = '4px solid #8B0000';
        });
        
        // Fix card headers
        const cardHeaders = document.querySelectorAll('.card-header');
        cardHeaders.forEach(header => {
            if (!header.style.background || header.style.background.includes('purple') || header.style.background.includes('#ffffff')) {
                header.style.background = '#f8f9fa';
                header.style.backgroundImage = 'none';
                header.style.color = '#495057';
            }
        });
        
        // Fix section headers
        const sectionHeaders = document.querySelectorAll('.section-header');
        sectionHeaders.forEach(header => {
            if (!header.style.background || header.style.background.includes('purple') || header.style.background.includes('#ffffff')) {
                header.style.background = '#f8f9fa';
                header.style.backgroundImage = 'none';
                header.style.color = '#495057';
            }
        });
    }
    
    // Create a MutationObserver to watch for DOM changes
    const observer = new MutationObserver(function(mutations) {
        let shouldFix = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if new nodes contain headers
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList && (
                            node.classList.contains('page-header') ||
                            node.classList.contains('card-header') ||
                            node.classList.contains('section-header') ||
                            node.classList.contains('navbar')
                        )) {
                            shouldFix = true;
                        }
                        
                        // Check child elements
                        const headers = node.querySelectorAll && node.querySelectorAll('.page-header, .card-header, .section-header, .navbar.bg-primary');
                        if (headers && headers.length > 0) {
                            shouldFix = true;
                        }
                    }
                });
            } else if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                // Check if style changes affect headers
                const target = mutation.target;
                if (target.classList && (
                    target.classList.contains('page-header') ||
                    target.classList.contains('card-header') ||
                    target.classList.contains('section-header') ||
                    target.classList.contains('navbar')
                )) {
                    shouldFix = true;
                }
            }
        });
        
        if (shouldFix) {
            setTimeout(enforceHeaderColors, 10);
        }
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });
    
    // Initial fix
    document.addEventListener('DOMContentLoaded', function() {
        enforceHeaderColors();
        
        // Fix again after a short delay to catch any late-loading content
        setTimeout(enforceHeaderColors, 500);
        setTimeout(enforceHeaderColors, 1000);
    });
    
    // Fix on page navigation
    window.addEventListener('popstate', function() {
        setTimeout(enforceHeaderColors, 100);
    });
    
    // Fix on hash change
    window.addEventListener('hashchange', function() {
        setTimeout(enforceHeaderColors, 100);
    });
    
    // Override common navigation functions
    const originalNavigateToPage = window.navigateToPage;
    if (originalNavigateToPage) {
        window.navigateToPage = function() {
            const result = originalNavigateToPage.apply(this, arguments);
            setTimeout(enforceHeaderColors, 100);
            return result;
        };
    }
    
    // Periodic check to ensure headers stay correct
    setInterval(enforceHeaderColors, 5000);
    
    console.log('✅ Header Color Fix initialized');
})();