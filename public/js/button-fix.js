// Global button fix utility
(function() {
    'use strict';
    
    // Function to ensure all buttons have proper event listeners
    function fixButtons() {
        console.log('Fixing button event listeners...');
        
        // Fix visi misi buttons
        fixVisiMisiButtons();
        
        // Fix rencana strategis buttons
        fixRencanaStrategisButtons();
        
        // Fix dashboard buttons
        fixDashboardButtons();
        
        // Fix general buttons
        fixGeneralButtons();
    }
    
    function fixVisiMisiButtons() {
        // Tambah button
        const btnTambah = document.getElementById('btn-tambah-visi-misi');
        if (btnTambah && !btnTambah.hasAttribute('data-fixed')) {
            btnTambah.addEventListener('click', function(e) {
                e.preventDefault();
                if (typeof showVisiMisiModal === 'function') {
                    showVisiMisiModal();
                } else {
                    console.error('showVisiMisiModal function not found');
                }
            });
            btnTambah.setAttribute('data-fixed', 'true');
        }
        
        // Edit and delete buttons
        document.querySelectorAll('[data-action="edit"]:not([data-fixed])').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const id = this.getAttribute('data-id');
                if (typeof editVisiMisi === 'function') {
                    editVisiMisi(id);
                } else {
                    console.error('editVisiMisi function not found');
                }
            });
            btn.setAttribute('data-fixed', 'true');
        });
        
        document.querySelectorAll('[data-action="delete"]:not([data-fixed])').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const id = this.getAttribute('data-id');
                if (typeof deleteVisiMisi === 'function') {
                    deleteVisiMisi(id);
                } else {
                    console.error('deleteVisiMisi function not found');
                }
            });
            btn.setAttribute('data-fixed', 'true');
        });
    }
    
    function fixRencanaStrategisButtons() {
        // Rencana strategis buttons
        document.querySelectorAll('.rs-edit-btn:not([data-fixed])').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const id = this.getAttribute('data-id');
                if (window.rencanaStrategisModule && typeof window.rencanaStrategisModule.startEdit === 'function') {
                    window.rencanaStrategisModule.startEdit(id);
                } else {
                    console.error('Rencana strategis edit function not found');
                }
            });
            btn.setAttribute('data-fixed', 'true');
        });
        
        document.querySelectorAll('.rs-delete-btn:not([data-fixed])').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const id = this.getAttribute('data-id');
                if (window.rencanaStrategisModule && typeof window.rencanaStrategisModule.deleteRencana === 'function') {
                    window.rencanaStrategisModule.deleteRencana(id);
                } else {
                    console.error('Rencana strategis delete function not found');
                }
            });
            btn.setAttribute('data-fixed', 'true');
        });
    }
    
    function fixDashboardButtons() {
        // Dashboard retry buttons
        document.querySelectorAll('button[onclick*="loadDashboard"]:not([data-fixed])').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.dashboardModule && typeof window.dashboardModule.loadDashboard === 'function') {
                    window.dashboardModule.loadDashboard();
                } else {
                    console.error('Dashboard load function not found');
                }
            });
            btn.setAttribute('data-fixed', 'true');
        });
        
        document.querySelectorAll('button[onclick*="loadTestData"]:not([data-fixed])').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.dashboardModule && typeof window.dashboardModule.loadTestData === 'function') {
                    window.dashboardModule.loadTestData();
                } else {
                    console.error('Dashboard test data function not found');
                }
            });
            btn.setAttribute('data-fixed', 'true');
        });
    }
    
    function fixGeneralButtons() {
        // Fix any buttons with onclick attributes that might not be working
        document.querySelectorAll('button[onclick]:not([data-fixed])').forEach(btn => {
            const onclickAttr = btn.getAttribute('onclick');
            if (onclickAttr) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    try {
                        // Try to execute the onclick function
                        eval(onclickAttr);
                    } catch (error) {
                        console.error('Error executing onclick:', error, onclickAttr);
                    }
                });
                btn.setAttribute('data-fixed', 'true');
            }
        });
    }
    
    // Run button fix on DOM ready and periodically
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixButtons);
    } else {
        fixButtons();
    }
    
    // Also run when new content is added
    const observer = new MutationObserver(function(mutations) {
        let shouldFix = false;
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && (node.tagName === 'BUTTON' || node.querySelector('button'))) {
                        shouldFix = true;
                    }
                });
            }
        });
        if (shouldFix) {
            setTimeout(fixButtons, 100);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Expose globally
    window.fixButtons = fixButtons;
    
    // Run periodically to catch any missed buttons
    setInterval(fixButtons, 5000);
    
})();