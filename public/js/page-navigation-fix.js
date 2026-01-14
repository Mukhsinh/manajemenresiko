/**
 * PAGE NAVIGATION FIX v2.0
 * Comprehensive fix for page navigation, visibility, and interaction issues
 * Prevents UI freeze on page refresh
 * 
 * FIXES:
 * - Added debounce to prevent infinite loops
 * - Check conditions before applying fixes
 * - Mark fixed elements to prevent re-processing
 * - Stop recursive calls from MutationObserver
 */

(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.PageNavigationFixInitialized) {
        return;
    }
    window.PageNavigationFixInitialized = true;
    
    console.log('🔧 Page Navigation Fix v2.0 loading...');
    
    // ============================================
    // STATE
    // ============================================
    
    const state = {
        currentPage: null,
        isNavigating: false,
        lastNavigationTime: 0,
        navigationDebounce: 100,
        lastPointerFixTime: 0,
        pointerFixDebounce: 3000, // Only fix pointer events every 3 seconds max
        isApplyingFix: false // Prevent recursive calls
    };
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
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
    
    /**
     * Get all page content elements
     */
    function getAllPages() {
        return document.querySelectorAll('.page-content');
    }
    
    /**
     * Get page element by ID
     */
    function getPageElement(pageId) {
        return document.getElementById(pageId);
    }
    
    /**
     * Determine current page from URL
     */
    function getCurrentPageFromURL() {
        const path = window.location.pathname.replace(/^\//, '') || 'dashboard';
        const hash = window.location.hash.replace('#', '');
        return hash || path || 'dashboard';
    }
    
    // ============================================
    // PAGE VISIBILITY MANAGEMENT
    // ============================================
    
    /**
     * Check if page needs to be hidden
     */
    function pageNeedsHiding(pageElement) {
        if (!pageElement) return false;
        return pageElement.style.display !== 'none' || 
               pageElement.classList.contains('active') ||
               pageElement.style.visibility !== 'hidden';
    }
    
    /**
     * Check if page needs to be shown
     */
    function pageNeedsShowing(pageElement) {
        if (!pageElement) return false;
        return pageElement.style.display === 'none' || 
               !pageElement.classList.contains('active') ||
               pageElement.style.visibility === 'hidden';
    }
    
    /**
     * Hide a specific page completely
     */
    function hidePage(pageElement) {
        if (!pageElement || !pageNeedsHiding(pageElement)) return;
        
        pageElement.classList.remove('active');
        pageElement.style.display = 'none';
        pageElement.style.visibility = 'hidden';
        pageElement.style.opacity = '0';
        pageElement.style.position = 'absolute';
        pageElement.style.left = '-99999px';
        pageElement.style.top = '-99999px';
        pageElement.style.zIndex = '-1';
        pageElement.style.pointerEvents = 'none';
        pageElement.setAttribute('aria-hidden', 'true');
        pageElement.setAttribute('data-page-hidden', 'true');
    }
    
    /**
     * Show a specific page
     */
    function showPage(pageElement) {
        if (!pageElement || !pageNeedsShowing(pageElement)) return false;
        
        pageElement.classList.add('active');
        pageElement.style.display = 'block';
        pageElement.style.visibility = 'visible';
        pageElement.style.opacity = '1';
        pageElement.style.position = 'relative';
        pageElement.style.left = 'auto';
        pageElement.style.top = 'auto';
        pageElement.style.zIndex = '1';
        pageElement.style.pointerEvents = 'auto';
        pageElement.setAttribute('aria-hidden', 'false');
        pageElement.removeAttribute('data-page-hidden');
        
        return true;
    }
    
    /**
     * Hide all pages except the specified one
     */
    function hideAllPagesExcept(exceptPageId) {
        getAllPages().forEach(page => {
            if (page.id !== exceptPageId) {
                hidePage(page);
            }
        });
    }
    
    /**
     * Ensure only one page is visible
     */
    function ensureSinglePageVisible(pageId) {
        // Hide all other pages
        hideAllPagesExcept(pageId);
        
        // Show target page
        const targetPage = getPageElement(pageId);
        if (targetPage) {
            showPage(targetPage);
            return true;
        }
        
        return false;
    }
    
    // ============================================
    // RS CONTENT CLEANUP
    // ============================================
    
    /**
     * Remove RS content from non-RS pages
     */
    function cleanupRSContent() {
        const currentPage = state.currentPage || getCurrentPageFromURL();
        
        if (currentPage === 'rencana-strategis') {
            return; // Don't cleanup on RS page
        }
        
        // Remove RS elements from all non-RS pages
        const otherPages = document.querySelectorAll('.page-content:not(#rencana-strategis)');
        let removedCount = 0;
        
        otherPages.forEach(page => {
            const rsElements = page.querySelectorAll(
                '.rencana-strategis-wrapper, ' +
                '.rencana-strategis-container, ' +
                '.rs-selection-wrapper, ' +
                '.rs-selection-list, ' +
                '#rs-selection-container, ' +
                '[data-module="RencanaStrategisModule"]'
            );
            
            rsElements.forEach(el => {
                el.remove();
                removedCount++;
            });
        });
        
        if (removedCount > 0) {
            console.log(`🧹 Cleaned up ${removedCount} RS elements from non-RS pages`);
        }
        
        // Hide RS page element
        const rsPage = getPageElement('rencana-strategis');
        if (rsPage && currentPage !== 'rencana-strategis') {
            hidePage(rsPage);
        }
    }
    
    // ============================================
    // POINTER EVENTS FIX
    // ============================================
    
    /**
     * Check if element needs pointer events fix
     */
    function elementNeedsPointerFix(el) {
        if (!el || el.disabled) return false;
        const style = window.getComputedStyle(el);
        return style.pointerEvents === 'none';
    }
    
    /**
     * Fix pointer events for all interactive elements
     * Only runs if actually needed and respects debounce
     */
    function fixPointerEvents(force = false) {
        // Prevent recursive calls
        if (state.isApplyingFix) return;
        
        // Debounce check
        const now = Date.now();
        if (!force && now - state.lastPointerFixTime < state.pointerFixDebounce) {
            return;
        }
        
        // Get active page
        const activePage = document.querySelector('.page-content.active');
        if (!activePage) return;
        
        state.isApplyingFix = true;
        
        try {
            let fixedCount = 0;
            
            // Check and fix interactive elements only if needed
            const interactiveElements = activePage.querySelectorAll(
                'button:not([data-pointer-fixed]), a:not([data-pointer-fixed]), ' +
                'input:not([data-pointer-fixed]), select:not([data-pointer-fixed]), ' +
                'textarea:not([data-pointer-fixed]), [role="button"]:not([data-pointer-fixed]), ' +
                '.btn:not([data-pointer-fixed]), .form-control:not([data-pointer-fixed]), ' +
                '.form-select:not([data-pointer-fixed])'
            );
            
            interactiveElements.forEach(el => {
                if (elementNeedsPointerFix(el)) {
                    el.style.pointerEvents = 'auto';
                    fixedCount++;
                }
                el.setAttribute('data-pointer-fixed', 'true');
            });
            
            // Fix containers only if needed
            const containers = [activePage, document.querySelector('.main-content'), document.querySelector('.content-area')];
            containers.forEach(container => {
                if (container && elementNeedsPointerFix(container)) {
                    container.style.pointerEvents = 'auto';
                    fixedCount++;
                }
            });
            
            if (fixedCount > 0) {
                console.log(`🖱️ Fixed pointer events for ${fixedCount} elements`);
            }
            
            state.lastPointerFixTime = now;
            
        } finally {
            state.isApplyingFix = false;
        }
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    /**
     * Initialize page visibility on load
     */
    function initializePageVisibility() {
        const currentPage = getCurrentPageFromURL();
        
        // Skip if already initialized for this page
        if (state.currentPage === currentPage) {
            return;
        }
        
        state.currentPage = currentPage;
        console.log(`📄 Initializing page: ${currentPage}`);
        
        // Ensure only current page is visible
        ensureSinglePageVisible(currentPage);
        
        // Cleanup RS content if not on RS page
        cleanupRSContent();
        
        // Fix pointer events (force on init)
        fixPointerEvents(true);
        
        console.log('✅ Page visibility initialized');
    }
    
    /**
     * Handle page navigation
     */
    function handleNavigation(pageId) {
        // Debounce
        const now = Date.now();
        if (now - state.lastNavigationTime < state.navigationDebounce) {
            return;
        }
        state.lastNavigationTime = now;
        
        // Prevent concurrent navigation
        if (state.isNavigating) {
            return;
        }
        
        // Skip if already on this page
        if (state.currentPage === pageId) {
            return;
        }
        
        console.log(`🧭 Navigating to: ${pageId}`);
        state.isNavigating = true;
        
        try {
            // Update state
            state.currentPage = pageId;
            
            // Ensure only target page is visible
            ensureSinglePageVisible(pageId);
            
            // Cleanup RS content if leaving RS page
            if (pageId !== 'rencana-strategis') {
                cleanupRSContent();
            }
            
            // Fix pointer events (force on navigation)
            fixPointerEvents(true);
            
        } finally {
            state.isNavigating = false;
        }
    }
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    // Debounced periodic check
    const debouncedPeriodicCheck = debounce(() => {
        const currentPage = getCurrentPageFromURL();
        if (state.currentPage !== currentPage) {
            handleNavigation(currentPage);
        }
        // Only fix pointer events if not recently fixed
        fixPointerEvents(false);
    }, 500);
    
    /**
     * Listen for navigation events
     */
    function setupEventListeners() {
        // Listen for custom navigation events
        document.addEventListener('pageNavigated', (e) => {
            const pageId = e.detail?.page;
            if (pageId) {
                handleNavigation(pageId);
            }
        });
        
        // Listen for popstate (browser back/forward)
        window.addEventListener('popstate', () => {
            const pageId = getCurrentPageFromURL();
            handleNavigation(pageId);
        });
        
        // Listen for hashchange
        window.addEventListener('hashchange', () => {
            const pageId = getCurrentPageFromURL();
            handleNavigation(pageId);
        });
        
        // Periodic check with longer interval (10 seconds instead of 2)
        // Only checks if page changed, doesn't spam logs
        setInterval(debouncedPeriodicCheck, 10000);
    }
    
    // ============================================
    // MAIN
    // ============================================
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                initializePageVisibility();
                setupEventListeners();
            }, 100);
        });
    } else {
        setTimeout(() => {
            initializePageVisibility();
            setupEventListeners();
        }, 100);
    }
    
    // Also run on window load
    window.addEventListener('load', () => {
        setTimeout(() => {
            initializePageVisibility();
        }, 500);
    });
    
    // Export for debugging
    window.PageNavigationFix = {
        ensureSinglePageVisible,
        cleanupRSContent,
        fixPointerEvents: () => fixPointerEvents(true),
        getCurrentPage: () => state.currentPage
    };
    
    console.log('✅ Page Navigation Fix v2.0 loaded');
    
})();
