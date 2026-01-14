/**
 * RENCANA STRATEGIS DISPLAY GUARD v2.0
 * Memastikan tampilan yang benar (cards + form + table) SELALU muncul
 * dan TIDAK digantikan oleh tampilan selection list
 * 
 * FIXES v2.0:
 * - Reduced check interval (was causing performance issues)
 * - Added max checks limit
 * - Stop checking once correct display is confirmed
 * - Event-driven instead of continuous polling
 * 
 * Created: 2026-01-10
 * Updated: 2026-01-11
 */

(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.RSDisplayGuardInitialized) {
        return;
    }
    window.RSDisplayGuardInitialized = true;
    
    console.log('🛡️ Rencana Strategis Display Guard v2.0 loading...');
    
    // ============================================
    // CONFIGURATION
    // ============================================
    
    const CONFIG = {
        checkInterval: 2000,    // Check every 2 seconds (was 1 second)
        maxChecks: 15,          // Max 15 checks (30 seconds total)
        debounceTime: 500       // Debounce time
    };
    
    let checkCount = 0;
    let guardInterval = null;
    let isGuarding = false;
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * Check if we're on the RS page
     */
    function isOnRSPage() {
        const path = window.location.pathname;
        const hash = window.location.hash;
        const activePage = document.querySelector('.page-content.active');
        
        return path === '/rencana-strategis' || 
               path.includes('rencana-strategis') ||
               hash === '#rencana-strategis' ||
               (activePage && activePage.id === 'rencana-strategis');
    }
    
    /**
     * Check if the correct display is showing
     */
    function hasCorrectDisplay() {
        const container = document.getElementById('rencana-strategis-content');
        if (!container) return false;
        
        // Check if already verified
        if (container.hasAttribute('data-display-verified')) {
            return true;
        }
        
        const html = container.innerHTML;
        
        // Correct display indicators
        const hasWrapper = html.includes('rencana-strategis-wrapper');
        const hasStatCards = html.includes('Rencana Aktif') || html.includes('Total Rencana');
        const hasTable = container.querySelector('table') !== null;
        const hasForm = html.includes('rs-form') || html.includes('Form Input');
        
        // Wrong display indicators
        const hasSelectionList = html.includes('Pilih Rencana Strategis') && 
                                 !hasTable && 
                                 html.includes('RS-2025-');
        
        // Correct if has wrapper + (cards or table or form) and no selection list
        const isCorrect = hasWrapper && (hasStatCards || hasTable || hasForm) && !hasSelectionList;
        
        // Mark as verified if correct
        if (isCorrect) {
            container.setAttribute('data-display-verified', 'true');
        }
        
        return isCorrect;
    }
    
    /**
     * Check if selection list is showing (wrong display)
     */
    function hasSelectionList() {
        const container = document.getElementById('rencana-strategis-content');
        if (!container) return false;
        
        const html = container.innerHTML;
        const hasTable = container.querySelector('table') !== null;
        
        // Selection list indicators
        return (html.includes('Pilih Rencana Strategis') && !hasTable) ||
               (html.includes('RS-2025-') && html.includes('list-group') && !hasTable);
    }
    
    /**
     * Force correct display
     */
    function forceCorrectDisplay() {
        console.log('🔧 Forcing correct display...');
        
        // Try to load the module
        if (window.RencanaStrategisModule && typeof window.RencanaStrategisModule.load === 'function') {
            window.RencanaStrategisModule.load();
        } else if (window.RencanaStrategisFast && typeof window.RencanaStrategisFast.load === 'function') {
            window.RencanaStrategisFast.load();
        }
    }
    
    /**
     * Guard function - checks and fixes display
     */
    function guardDisplay() {
        if (!isOnRSPage()) {
            // Not on RS page, stop checking
            stopGuard();
            return;
        }
        
        checkCount++;
        
        // Stop after max checks
        if (checkCount >= CONFIG.maxChecks) {
            console.log('⏱️ Max checks reached, stopping guard');
            stopGuard();
            return;
        }
        
        // Check if display is correct
        if (hasCorrectDisplay()) {
            console.log('✅ Correct display confirmed, stopping guard');
            stopGuard();
            return;
        }
        
        // Check if selection list is showing (wrong)
        if (hasSelectionList()) {
            console.warn('⚠️ Selection list detected! Fixing...');
            forceCorrectDisplay();
            return;
        }
        
        // Check if container is empty or has loading spinner
        const container = document.getElementById('rencana-strategis-content');
        if (container) {
            const html = container.innerHTML.trim();
            if (html === '' || html.includes('spinner')) {
                // Still loading, continue checking
                return;
            }
        }
    }
    
    /**
     * Start guarding
     */
    function startGuard() {
        if (isGuarding) return;
        
        if (guardInterval) {
            clearInterval(guardInterval);
        }
        
        isGuarding = true;
        checkCount = 0;
        
        // Remove verified flag when starting new guard
        const container = document.getElementById('rencana-strategis-content');
        if (container) {
            container.removeAttribute('data-display-verified');
        }
        
        // Initial check after a delay
        setTimeout(guardDisplay, 500);
        
        // Periodic check (limited by maxChecks)
        guardInterval = setInterval(guardDisplay, CONFIG.checkInterval);
        
        console.log('🛡️ Display guard started');
    }
    
    /**
     * Stop guarding
     */
    function stopGuard() {
        if (guardInterval) {
            clearInterval(guardInterval);
            guardInterval = null;
        }
        isGuarding = false;
        checkCount = 0;
    }
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    // Listen for navigation to RS page
    document.addEventListener('click', (e) => {
        const menuItem = e.target.closest('[data-page="rencana-strategis"]');
        if (menuItem) {
            setTimeout(startGuard, 300);
        }
    });
    
    // Listen for hash change
    window.addEventListener('hashchange', () => {
        if (isOnRSPage()) {
            startGuard();
        } else {
            stopGuard();
        }
    });
    
    // Listen for popstate
    window.addEventListener('popstate', () => {
        if (isOnRSPage()) {
            startGuard();
        } else {
            stopGuard();
        }
    });
    
    // Listen for custom navigation event
    document.addEventListener('pageNavigated', (e) => {
        if (e.detail?.page === 'rencana-strategis') {
            startGuard();
        } else {
            stopGuard();
        }
    });
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    function initialize() {
        // If already on RS page, start guarding
        if (isOnRSPage()) {
            startGuard();
        }
        
        console.log('✅ RS Display Guard v2.0 initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Export for debugging
    window.RSDisplayGuard = {
        startGuard,
        stopGuard,
        guardDisplay,
        hasCorrectDisplay,
        hasSelectionList,
        forceCorrectDisplay,
        isOnRSPage
    };
    
})();
