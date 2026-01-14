/**
 * Navigation Fix v2.0 - Prevents redirect loops and ensures pages stay visible
 * 
 * FIXES v2.0:
 * - Removed aggressive setInterval (was causing performance issues)
 * - Added debounce to MutationObserver
 * - Event-driven instead of polling
 * - Mark processed elements to prevent re-processing
 */

(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.NavigationFixInitialized) {
        return;
    }
    window.NavigationFixInitialized = true;
    
    console.log('🔧 Loading navigation fix v2.0...');
    
    // State
    const state = {
        isProcessing: false,
        lastCheckTime: 0,
        checkDebounce: 2000
    };
    
    // Store original functions
    const originalNavigateToPage = window.navigateToPage;
    
    /**
     * Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Enhanced navigation function that prevents redirects
    window.navigateToPage = function(pageName, preventRedirect = false) {
        console.log(`🧭 Navigation: ${pageName}`);
        
        // Store navigation state to prevent router interference
        sessionStorage.setItem('currentPage', pageName);
        sessionStorage.setItem('navigationTimestamp', Date.now().toString());
        sessionStorage.setItem('preventRedirect', preventRedirect ? 'true' : 'false');
        
        // Call original function
        if (originalNavigateToPage) {
            return originalNavigateToPage(pageName);
        }
        
        // Fallback navigation
        try {
            // Hide all pages
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.remove('active');
            });

            // Show selected page
            const selectedPage = document.getElementById(pageName);
            if (selectedPage) {
                selectedPage.classList.add('active');
                selectedPage.setAttribute('data-navigation-stable', 'true');
                
                // Update menu items
                document.querySelectorAll('.menu-item').forEach(item => {
                    item.classList.remove('active');
                    if (item.dataset.page === pageName) {
                        item.classList.add('active');
                    }
                });
                
                // Load page data
                if (window.loadPageData) {
                    setTimeout(() => {
                        try {
                            window.loadPageData(pageName);
                        } catch (error) {
                            console.warn('Error loading page data:', error);
                        }
                    }, 100);
                }
                
                // Update URL without triggering navigation
                if (window.history && window.history.replaceState) {
                    const newUrl = `/${pageName}`;
                    if (window.location.pathname !== newUrl) {
                        window.history.replaceState({ page: pageName, stable: true }, '', newUrl);
                    }
                }
            }
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };
    
    // Prevent router from interfering with stable pages
    function preventRouterInterference() {
        // Prevent recursive calls
        if (state.isProcessing) return;
        
        // Debounce
        const now = Date.now();
        if (now - state.lastCheckTime < state.checkDebounce) {
            return;
        }
        state.lastCheckTime = now;
        
        // Check if we have a stable page
        const currentPage = sessionStorage.getItem('currentPage');
        const navigationTimestamp = sessionStorage.getItem('navigationTimestamp');
        
        if (!currentPage || !navigationTimestamp) return;
        
        const timeSinceNavigation = Date.now() - parseInt(navigationTimestamp);
        
        // If navigation happened recently (within 10 seconds), keep the page stable
        if (timeSinceNavigation < 10000) {
            const activePage = document.querySelector('.page-content.active');
            const expectedPage = document.getElementById(currentPage);
            
            // If the wrong page is active, fix it
            if (activePage && expectedPage && activePage !== expectedPage) {
                state.isProcessing = true;
                
                try {
                    console.log(`🔧 Fixing page mismatch: ${activePage.id} -> ${currentPage}`);
                    
                    // Hide all pages
                    document.querySelectorAll('.page-content').forEach(page => {
                        page.classList.remove('active');
                    });
                    
                    // Show correct page
                    expectedPage.classList.add('active');
                    
                    // Update URL if needed
                    const expectedUrl = `/${currentPage}`;
                    if (window.location.pathname !== expectedUrl) {
                        window.history.replaceState({ page: currentPage, stable: true }, '', expectedUrl);
                    }
                } finally {
                    state.isProcessing = false;
                }
            }
        }
    }
    
    // Debounced version for MutationObserver
    const debouncedPreventInterference = debounce(preventRouterInterference, 300);
    
    // Monitor for page changes with debounce
    const observer = new MutationObserver(function(mutations) {
        if (state.isProcessing) return;
        
        let needsCheck = false;
        
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('page-content') && target.classList.contains('active')) {
                    needsCheck = true;
                    break;
                }
            }
        }
        
        if (needsCheck) {
            debouncedPreventInterference();
        }
    });
    
    // Start observing with minimal scope
    observer.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ['class']
    });
    
    // Override router navigate function if it exists
    if (window.appRouter && window.appRouter.navigate) {
        const originalRouterNavigate = window.appRouter.navigate;
        
        window.appRouter.navigate = function(path, replace = false) {
            // Check if we should prevent this navigation
            const currentPage = sessionStorage.getItem('currentPage');
            const navigationTimestamp = sessionStorage.getItem('navigationTimestamp');
            const preventRedirect = sessionStorage.getItem('preventRedirect') === 'true';
            
            if (currentPage && navigationTimestamp && preventRedirect) {
                const timeSinceNavigation = Date.now() - parseInt(navigationTimestamp);
                
                // If navigation happened recently, ignore router navigation
                if (timeSinceNavigation < 5000) {
                    console.log(`🚫 Ignoring router navigation: Recent navigation to ${currentPage}`);
                    return;
                }
            }
            
            // Allow navigation
            return originalRouterNavigate.call(this, path, replace);
        };
    }
    
    // Clean up old navigation state on navigation events (not polling)
    function cleanupOldState() {
        const navigationTimestamp = sessionStorage.getItem('navigationTimestamp');
        if (navigationTimestamp) {
            const timeSinceNavigation = Date.now() - parseInt(navigationTimestamp);
            
            // Clean up after 30 seconds
            if (timeSinceNavigation > 30000) {
                sessionStorage.removeItem('currentPage');
                sessionStorage.removeItem('navigationTimestamp');
                sessionStorage.removeItem('preventRedirect');
            }
        }
    }
    
    // Event-driven cleanup instead of polling
    window.addEventListener('hashchange', cleanupOldState);
    window.addEventListener('popstate', cleanupOldState);
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-page]')) {
            cleanupOldState();
        }
    });
    
    // NO MORE setInterval - only event-driven
    
    console.log('✅ Navigation fix v2.0 loaded');
})();
