/**
 * Global UI Standardization JavaScript
 * Menerapkan standarisasi tampilan secara dinamis untuk elemen yang dibuat runtime
 */

(function() {
    'use strict';
    
    const COLORS = {
        editBg: '#E3F2FD',
        editBorder: '#2196F3',
        editText: '#1976D2',
        deleteBg: '#FFEBEE',
        deleteBorder: '#F44336',
        deleteText: '#D32F2F',
        toolbarBg: '#1a237e',
        toolbarText: '#ffffff',
        tableHeaderBg: '#1a237e',
        tableHeaderText: '#ffffff'
    };
    
    function styleTableHeaders() {
        document.querySelectorAll('table thead th, table thead td').forEach(cell => {
            if (cell.dataset.uiStyled) return;
            
            cell.style.backgroundColor = COLORS.tableHeaderBg;
            cell.style.color = COLORS.tableHeaderText;
            cell.style.fontWeight = '600';
            cell.style.borderColor = '#283593';
            
            // Style semua child elements
            cell.querySelectorAll('*').forEach(child => {
                child.style.color = COLORS.tableHeaderText;
            });
            
            // Style icons
            cell.querySelectorAll('i, svg, .fa, .fas, .far, .fab').forEach(icon => {
                icon.style.color = COLORS.tableHeaderText;
            });
            
            cell.dataset.uiStyled = 'true';
        });
    }
    
    function styleEditButtons() {
        const editSelectors = '.btn-edit, .ss-btn-edit, .action-btn-edit, td .btn-primary, td .btn-info';
        document.querySelectorAll(editSelectors).forEach(btn => {
            if (btn.dataset.uiStyled || btn.closest('.modal-footer')) return;
            
            btn.style.backgroundColor = COLORS.editBg;
            btn.style.border = `1px solid ${COLORS.editBorder}`;
            btn.style.color = COLORS.editText;
            btn.style.borderRadius = '4px';
            btn.style.padding = '6px 10px';
            
            btn.querySelectorAll('i, svg').forEach(icon => {
                icon.style.color = COLORS.editText;
            });
            
            btn.dataset.uiStyled = 'true';
        });
    }
    
    function styleDeleteButtons() {
        const deleteSelectors = '.btn-delete, .btn-hapus, .ss-btn-delete, .action-btn-delete, td .btn-danger';
        document.querySelectorAll(deleteSelectors).forEach(btn => {
            if (btn.dataset.uiStyled || btn.closest('.modal-footer')) return;
            
            btn.style.backgroundColor = COLORS.deleteBg;
            btn.style.border = `1px solid ${COLORS.deleteBorder}`;
            btn.style.color = COLORS.deleteText;
            btn.style.borderRadius = '4px';
            btn.style.padding = '6px 10px';
            
            btn.querySelectorAll('i, svg').forEach(icon => {
                icon.style.color = COLORS.deleteText;
            });
            
            btn.dataset.uiStyled = 'true';
        });
    }
    
    function styleToolbarButtons() {
        const toolbarSelectors = '.btn-toolbar .btn, .card-header .btn, .btn-tambah, .btn-add, .btn-download, .btn-export';
        document.querySelectorAll(toolbarSelectors).forEach(btn => {
            if (btn.dataset.uiStyled) return;
            if (btn.closest('td')) return;
            if (btn.classList.contains('btn-edit') || btn.classList.contains('btn-delete') || btn.classList.contains('btn-hapus')) return;
            if (btn.classList.contains('btn-close')) return;
            
            btn.style.backgroundColor = COLORS.toolbarBg;
            btn.style.border = `1px solid ${COLORS.toolbarBg}`;
            btn.style.color = COLORS.toolbarText;
            btn.style.borderRadius = '4px';
            btn.style.padding = '8px 16px';
            btn.style.fontWeight = '500';
            
            btn.querySelectorAll('i, svg').forEach(icon => {
                icon.style.color = COLORS.toolbarText;
            });
            
            btn.dataset.uiStyled = 'true';
        });
    }
    
    function applyAllStyles() {
        styleTableHeaders();
        styleEditButtons();
        styleDeleteButtons();
        styleToolbarButtons();
    }
    
    // Observer untuk elemen baru
    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.tagName === 'TABLE' || node.tagName === 'BUTTON' || 
                            node.querySelector && (node.querySelector('table') || node.querySelector('button'))) {
                            shouldUpdate = true;
                        }
                    }
                });
            }
        });
        
        if (shouldUpdate) {
            clearTimeout(window.uiStyleTimeout);
            window.uiStyleTimeout = setTimeout(applyAllStyles, 100);
        }
    });
    
    function init() {
        applyAllStyles();
        observer.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('load', () => setTimeout(applyAllStyles, 500));
        console.log('[UI Standardization] Initialized');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    window.UIStandardization = { applyAllStyles, COLORS };
})();
