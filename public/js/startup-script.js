/**
 * STARTUP SCRIPT - RACE CONDITION PREVENTION v5.0
 * Ensures proper initialization order and prevents infinite loops
 * CRITICAL: Single entry point for page initialization
 * 
 * FIXES in v5.0:
 * - Simplified RS module loading
 * - Better mutex handling
 * - Removed redundant checks
 * - CSP compliant (no external script loading)
 * 
 * Updated: 2026-01-10
 */

(function() {
    'use strict';
    
    console.log('🚀 Application startup script v5.0 loaded');
    
    // STRICT: Prevent multiple initializations
    if (window.appStartupInitialized) {
        console.log('⚠️ Startup already initialized, skipping...');
        return;
    }
    window.appStartupInitialized = true;
    
    // Disable problematic scripts
    window.uiFixSystemInitialized = true;
    
    // CRITICAL: Global state for RS module
    window.rsModuleState = {
        loading: false,
        loaded: false,
        lastLoadTime: 0,
        loadCount: 0
    };
    
    /**
     * Check if we're on the RS page
     */
    function isOnRSPage() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        const activePage = document.querySelector('.page-content.active');
        
        return path === '/rencana-strategis' ||
               path.includes('/rencana-strategis') || 
               hash === '#rencana-strategis' ||
               (activePage && activePage.id === 'rencana-strategis');
    }
    
    /**
     * Safe RS module loader - SINGLE ENTRY POINT
     * All other scripts should call this instead of RencanaStrategisModule.load() directly
     */
    window.safeLoadRencanaStrategis = async function() {
        const state = window.rsModuleState;
        
        // Check mutex
        if (state.loading) {
            console.log('🔒 RS module loading in progress, skipping');
            return;
        }
        
        // Rate limiting - prevent rapid reloads
        const now = Date.now();
        if (now - state.lastLoadTime < 2000) {
            console.log('⏱️ RS module loaded recently, skipping');
            return;
        }
        
        // Check page
        if (!isOnRSPage()) {
            console.log('📍 Not on RS page, skipping RS module load');
            return;
        }
        
        // Set mutex
        state.loading = true;
        state.lastLoadTime = now;
        state.loadCount++;
        
        console.log(`🚀 Safe loading RS module (attempt #${state.loadCount})`);
        
        try {
            // Try unified module first (preferred)
            if (window.RencanaStrategisUnified?.load) {
                await window.RencanaStrategisUnified.load();
            } else if (window.RencanaStrategisModule?.load) {
                await window.RencanaStrategisModule.load();
            } else {
                console.warn('⚠️ No RS module found');
            }
            
            state.loaded = true;
            
        } catch (error) {
            console.error('❌ Error loading RS module:', error);
        } finally {
            // Release mutex after short delay
            setTimeout(() => {
                state.loading = false;
            }, 500);
        }
    };
    
    /**
     * Cleanup RS module when leaving RS page
     */
    window.cleanupRSModule = function() {
        if (window.RencanaStrategisModule?.cleanup) {
            window.RencanaStrategisModule.cleanup();
        }
        window.rsModuleState.loaded = false;
        console.log('🧹 RS module cleaned up');
    };
    
    /**
     * Ensure correct page is active based on URL
     */
    function ensureCorrectPageActive() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        
        let targetPage = 'dashboard';
        
        // Determine target page from URL
        if (path === '/rencana-strategis' || path.includes('/rencana-strategis') || hash === '#rencana-strategis') {
            targetPage = 'rencana-strategis';
        } else if (path.includes('analisis-swot') || hash === '#analisis-swot') {
            targetPage = 'analisis-swot';
        } else if (path === '/' || path.includes('dashboard') || hash === '#dashboard') {
            targetPage = 'dashboard';
        } else {
            // Extract page name from path or hash
            const pageName = path.replace(/^\//, '') || hash.replace('#', '');
            if (pageName && document.getElementById(pageName)) {
                targetPage = pageName;
            }
        }
        
        // Activate the correct page
        const targetEl = document.getElementById(targetPage);
        if (targetEl) {
            // Remove active from all pages
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.remove('active');
            });
            
            // Add active to target page
            targetEl.classList.add('active');
            
            // Ensure visibility
            targetEl.style.display = 'block';
            targetEl.style.visibility = 'visible';
            targetEl.style.opacity = '1';
            targetEl.style.pointerEvents = 'auto';
            
            console.log(`✅ Activated page: ${targetPage}`);
        }
        
        return targetPage;
    }
    
    // Initialize page system when DOM is ready
    function initializePageSystem() {
        // CRITICAL: Ensure correct page is active on refresh
        const activePage = ensureCorrectPageActive();
        
        // Load RS module if on RS page (with delay to allow DOM to settle)
        if (activePage === 'rencana-strategis') {
            // Use requestIdleCallback for better performance
            const loadRS = () => {
                setTimeout(() => window.safeLoadRencanaStrategis(), 300);
            };
            
            if ('requestIdleCallback' in window) {
                requestIdleCallback(loadRS, { timeout: 2000 });
            } else {
                loadRS();
            }
        }
    }
    
    // Wait for DOM and initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePageSystem);
    } else {
        // DOM already loaded
        initializePageSystem();
    }
    
    console.log('✅ Startup script v5.0 initialized');
})();
