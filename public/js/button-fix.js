/**
 * BUTTON FIX v2.0
 * Global button fix utility with proper debouncing and condition checks
 * 
 * FIXES:
 * - Added debounce to MutationObserver
 * - Check if buttons actually need fixing before processing
 * - Mark fixed elements to prevent re-processing
 * - Removed excessive logging
 * - Longer interval for periodic checks
 */

(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.ButtonFixInitialized) {
        return;
    }
    window.ButtonFixInitialized = true;
    
    // State to prevent recursive calls
    const state = {
        isFixing: false,
        lastFixTime: 0,
        fixDebounce: 2000, // Minimum 2 seconds between fixes
        observerTimeout: null
    };
    
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
     * Check if there are any unfixed buttons
     */
    function hasUnfixedButtons() {
        return document.querySelectorAll(
            'button:not([data-fixed]), ' +
            '.rs-edit-btn:not([data-fixed]), ' +
            '.rs-delete-btn:not([data-fixed]), ' +
            '[data-action="edit"]:not([data-fixed]), ' +
            '[data-action="delete"]:not([data-fixed])'
        ).length > 0;
    }
    
    /**
     * Main function to fix buttons - only runs if needed
     */
    function fixButtons(force = false) {
        // Prevent recursive calls
        if (state.isFixing) return;
        
        // Debounce check
        const now = Date.now();
        if (!force && now - state.lastFixTime < state.fixDebounce) {
            return;
        }
        
        // Check if there are actually unfixed buttons
        if (!force && !hasUnfixedButtons()) {
            return;
        }
        
        state.isFixing = true;
        state.lastFixTime = now;
        
        try {
            let fixedCount = 0;
            
            // Fix visi misi buttons
            fixedCount += fixVisiMisiButtons();
            
            // Fix rencana strategis buttons
            fixedCount += fixRencanaStrategisButtons();
            
            // Fix dashboard buttons
            fixedCount += fixDashboardButtons();
            
            // Fix general buttons
            fixedCount += fixGeneralButtons();
            
            if (fixedCount > 0) {
                console.log(`🔘 Fixed ${fixedCount} button(s)`);
            }
            
        } finally {
            state.isFixing = false;
        }
    }
    
    function fixVisiMisiButtons() {
        let count = 0;
        
        // Only fix visi misi buttons in visi misi context
        const visiMisiContent = document.getElementById('visi-misi-content');
        if (!visiMisiContent) return count;
        
        // Tambah button
        const btnTambah = document.getElementById('btn-tambah-visi-misi');
        if (btnTambah && !btnTambah.hasAttribute('data-fixed')) {
            btnTambah.addEventListener('click', function(e) {
                e.preventDefault();
                if (typeof showVisiMisiModal === 'function') {
                    showVisiMisiModal();
                }
            });
            btnTambah.setAttribute('data-fixed', 'true');
            count++;
        }
        
        // Edit buttons - only within visi misi content
        visiMisiContent.querySelectorAll('[data-action="edit"]:not([data-fixed])').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const id = this.getAttribute('data-id');
                if (typeof editVisiMisi === 'function') {
                    editVisiMisi(id);
                }
            });
            btn.setAttribute('data-fixed', 'true');
            count++;
        });
        
        // Delete buttons
        visiMisiContent.querySelectorAll('[data-action="delete"]:not([data-fixed])').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const id = this.getAttribute('data-id');
                if (typeof deleteVisiMisi === 'function') {
                    deleteVisiMisi(id);
                }
            });
            btn.setAttribute('data-fixed', 'true');
            count++;
        });
        
        return count;
    }
    
    function fixRencanaStrategisButtons() {
        let count = 0;
        
        // Edit buttons
        document.querySelectorAll('.rs-edit-btn:not([data-fixed])').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                if (window.rencanaStrategisModule && typeof window.rencanaStrategisModule.startEdit === 'function') {
                    window.rencanaStrategisModule.startEdit(id);
                }
            });
            btn.setAttribute('data-fixed', 'true');
            count++;
        });
        
        // Delete buttons
        document.querySelectorAll('.rs-delete-btn:not([data-fixed])').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                if (window.rencanaStrategisModule && typeof window.rencanaStrategisModule.deleteRencana === 'function') {
                    window.rencanaStrategisModule.deleteRencana(id);
                }
            });
            btn.setAttribute('data-fixed', 'true');
            count++;
        });
        
        return count;
    }
    
    function fixDashboardButtons() {
        let count = 0;
        
        // Dashboard retry buttons
        document.querySelectorAll('button[onclick*="loadDashboard"]:not([data-fixed])').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.dashboardModule && typeof window.dashboardModule.loadDashboard === 'function') {
                    window.dashboardModule.loadDashboard();
                }
            });
            btn.setAttribute('data-fixed', 'true');
            count++;
        });
        
        document.querySelectorAll('button[onclick*="loadTestData"]:not([data-fixed])').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.dashboardModule && typeof window.dashboardModule.loadTestData === 'function') {
                    window.dashboardModule.loadTestData();
                }
            });
            btn.setAttribute('data-fixed', 'true');
            count++;
        });
        
        return count;
    }
    
    function fixGeneralButtons() {
        let count = 0;
        
        // Fix buttons with onclick attributes that might not be working
        // Only fix buttons that don't already have event listeners
        document.querySelectorAll('button[onclick]:not([data-fixed])').forEach(btn => {
            const onclickAttr = btn.getAttribute('onclick');
            if (onclickAttr && !btn.hasAttribute('data-has-listener')) {
                btn.addEventListener('click', function(e) {
                    // Don't prevent default for all buttons, let native behavior work
                    try {
                        // Create a function from the onclick string
                        const fn = new Function(onclickAttr);
                        fn.call(this);
                    } catch (error) {
                        // Silent fail - onclick might work natively
                    }
                });
                btn.setAttribute('data-fixed', 'true');
                btn.setAttribute('data-has-listener', 'true');
                count++;
            }
        });
        
        return count;
    }
    
    // Debounced version for MutationObserver
    const debouncedFixButtons = debounce(() => {
        fixButtons(false);
    }, 500);
    
    // Run button fix on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => fixButtons(true));
    } else {
        fixButtons(true);
    }
    
    // MutationObserver with debounce
    const observer = new MutationObserver(function(mutations) {
        // Check if any buttons were actually added
        let hasNewButtons = false;
        
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        // Check if it's a button or contains buttons
                        if (node.tagName === 'BUTTON' || 
                            (node.querySelector && node.querySelector('button:not([data-fixed])'))) {
                            hasNewButtons = true;
                            break;
                        }
                    }
                }
            }
            if (hasNewButtons) break;
        }
        
        // Only trigger fix if new unfixed buttons were added
        if (hasNewButtons) {
            debouncedFixButtons();
        }
    });
    
    // Start observing with minimal scope
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false, // Don't watch attribute changes
        characterData: false // Don't watch text changes
    });
    
    // Expose globally
    window.fixButtons = () => fixButtons(true);
    
    // Periodic check with much longer interval (30 seconds)
    // This is just a safety net, not the primary mechanism
    setInterval(() => {
        if (hasUnfixedButtons()) {
            fixButtons(false);
        }
    }, 30000);
    
})();
