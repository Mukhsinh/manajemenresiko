/**
 * FORCE RENCANA STRATEGIS DASHBOARD VIEW
 * Memastikan halaman Rencana Strategis SELALU menampilkan dashboard (cards + table + form)
 * TIDAK PERNAH menampilkan selection list
 * 
 * Created: 2026-01-07
 * Updated: 2026-01-07 v2.0
 */

(function() {
    'use strict';
    
    console.log('🔒 Force Rencana Strategis Dashboard View v2.0 loaded');
    
    // CRITICAL: Block any function that tries to render selection list
    const blockSelectionListFunctions = () => {
        // Block common selection list functions
        window.loadRencanaStrategisSelection = function() {
            console.warn('⛔ loadRencanaStrategisSelection BLOCKED - using dashboard view');
            if (window.RencanaStrategisModule?.load) {
                window.RencanaStrategisModule.load();
            }
            return Promise.resolve();
        };
        
        window.renderRencanaStrategisList = function() {
            console.warn('⛔ renderRencanaStrategisList BLOCKED - using dashboard view');
            if (window.RencanaStrategisModule?.load) {
                window.RencanaStrategisModule.load();
            }
        };
        
        window.showRencanaStrategisSelection = function() {
            console.warn('⛔ showRencanaStrategisSelection BLOCKED - using dashboard view');
            if (window.RencanaStrategisModule?.load) {
                window.RencanaStrategisModule.load();
            }
        };
        
        // Block RencanaStrategisModuleEnhanced if it tries to show selection list
        if (window.RencanaStrategisModuleEnhanced) {
            console.warn('⚠️ RencanaStrategisModuleEnhanced detected - redirecting to standard module');
            window.RencanaStrategisModuleEnhanced = window.RencanaStrategisModule;
        }
        
        console.log('✅ Selection list functions blocked');
    };
    
    // Check if selection list is being rendered and fix it (ONLY on RS page)
    const checkAndFixSelectionList = (container) => {
        if (!container) return;
        
        // Only check if we're on RS page
        const currentPage = document.querySelector('.page-content.active');
        if (!currentPage || currentPage.id !== 'rencana-strategis') {
            return;
        }
        
        const html = container.innerHTML;
        
        // Check for selection list indicators
        const hasSelectionList = 
            (html.includes('Pilih Rencana Strategis') && !html.includes('table')) ||
            (html.includes('RS-2025-') && html.includes('list-group')) ||
            (html.includes('selection-list'));
        
        if (hasSelectionList) {
            console.warn('⚠️ SELECTION LIST DETECTED! Forcing dashboard view...');
            
            // Clear the container
            container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3">Loading dashboard...</p></div>';
            
            // Force load dashboard view
            setTimeout(() => {
                if (window.RencanaStrategisModule?.load) {
                    window.RencanaStrategisModule.load();
                }
            }, 100);
        }
    };
    
    // Monitor for selection list being rendered on RS page - OPTIMIZED
    const monitorForSelectionList = () => {
        const container = document.getElementById('rencana-strategis-content');
        if (!container) return;
        
        // Check immediately
        checkAndFixSelectionList(container);
        
        // Set up observer with debounce to prevent excessive checks
        let debounceTimeout = null;
        let checkCount = 0;
        const MAX_CHECKS = 5; // Limit checks to prevent infinite loop
        
        const observer = new MutationObserver((mutations) => {
            if (checkCount >= MAX_CHECKS) {
                observer.disconnect();
                console.log('⚠️ Max checks reached, stopping observer');
                return;
            }
            
            if (debounceTimeout) clearTimeout(debounceTimeout);
            
            debounceTimeout = setTimeout(() => {
                checkCount++;
                checkAndFixSelectionList(container);
            }, 300);
        });
        
        observer.observe(container, {
            childList: true,
            subtree: false
        });
        
        // Auto-disconnect after 30 seconds
        setTimeout(() => {
            observer.disconnect();
            console.log('✅ Selection list monitor auto-disconnected after 30s');
        }, 30000);
        
        console.log('✅ Selection list monitor active (with limits)');
    };
    
    // Initialize when DOM is ready
    const initialize = () => {
        blockSelectionListFunctions();
        
        // Wait for container to exist (only on RS page)
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;
        const isRSPage = currentPath.includes('rencana-strategis') || 
                        currentHash === '#rencana-strategis';
        
        if (isRSPage) {
            const waitForContainer = setInterval(() => {
                const container = document.getElementById('rencana-strategis-content');
                if (container) {
                    clearInterval(waitForContainer);
                    monitorForSelectionList();
                }
            }, 100);
            
            // Stop waiting after 10 seconds
            setTimeout(() => clearInterval(waitForContainer), 10000);
        }
    };
    
    // Run immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Also run when navigating to RS page
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        if (hash === '#rencana-strategis' || window.location.pathname === '/rencana-strategis') {
            setTimeout(() => {
                const container = document.getElementById('rencana-strategis-content');
                if (container) {
                    checkAndFixSelectionList(container);
                }
            }, 500);
        }
    });
    
    window.addEventListener('popstate', () => {
        const path = window.location.pathname;
        if (path.includes('rencana-strategis')) {
            setTimeout(() => {
                const container = document.getElementById('rencana-strategis-content');
                if (container) {
                    checkAndFixSelectionList(container);
                }
            }, 500);
        }
    });
    
    console.log('✅ Force Rencana Strategis Dashboard View v2.0 initialized');
})();
