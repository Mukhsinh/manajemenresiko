/**
 * Edit Form Fix Module v3.0
 * Fixes:
 * 1. Cancel button requiring double-click - FIXED with multiple strategies
 * 2. Modal not closing properly
 * 3. Form overflow issues
 * 4. Error notifications on edit
 * 5. API error handling for edit operations
 */

(function() {
    'use strict';
    
    console.log('[EditFormFix] Initializing edit form fixes v3.0...');
    
    // Track modals being closed to prevent double execution
    const closingModals = new WeakSet();
    
    // ============================================
    // GLOBAL MODAL CLOSE FUNCTION
    // ============================================
    
    /**
     * Close modal properly - single click
     * @param {HTMLElement} modal - Modal element to close
     */
    function closeModalElement(modal) {
        if (!modal) return false;
        
        // Check if already closing using WeakSet (more reliable than property)
        if (closingModals.has(modal)) {
            console.log('[EditFormFix] Modal already closing, skipping...');
            return false;
        }
        
        // Mark as closing
        closingModals.add(modal);
        
        console.log('[EditFormFix] Closing modal...');
        
        // Immediately disable interactions and hide
        modal.style.pointerEvents = 'none';
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.15s ease';
        
        // Remove modal immediately (no delay to prevent double-click issues)
        requestAnimationFrame(() => {
            if (modal && modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            document.body.classList.remove('modal-open');
            console.log('[EditFormFix] Modal closed successfully');
        });
        
        return true;
    }
    
    // Expose globally
    window.closeModal = function(modalOrEvent) {
        let modal;
        
        if (modalOrEvent instanceof Event) {
            modalOrEvent.preventDefault();
            modalOrEvent.stopPropagation();
            modalOrEvent.stopImmediatePropagation();
            modal = modalOrEvent.target.closest('.modal');
        } else if (modalOrEvent instanceof HTMLElement) {
            modal = modalOrEvent.closest('.modal') || modalOrEvent;
        } else {
            modal = document.querySelector('.modal.active') || document.querySelector('.modal');
        }
        
        return closeModalElement(modal);
    };
    
    // ============================================
    // OVERRIDE INLINE ONCLICK HANDLERS
    // ============================================
    
    /**
     * Override the onclick attribute to use our close function
     * This runs BEFORE the inline handler can execute
     */
    function overrideInlineHandlers(modal) {
        if (!modal || modal._handlersOverridden) return;
        modal._handlersOverridden = true;
        
        // Find all buttons with onclick that closes modal
        const buttons = modal.querySelectorAll('button[onclick*="closest"][onclick*="modal"][onclick*="remove"]');
        buttons.forEach(btn => {
            // Remove the inline onclick
            btn.removeAttribute('onclick');
            // Add our handler
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeModalElement(modal);
            });
            console.log('[EditFormFix] Overrode inline handler for button:', btn.textContent.trim());
        });
        
        // Also handle modal-close buttons
        const closeButtons = modal.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            if (btn.getAttribute('onclick')) {
                btn.removeAttribute('onclick');
            }
            // Remove existing listeners and add new one
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeModalElement(modal);
            });
        });
        
        // Handle buttons with text "Batal", "Cancel", "Tutup", "Close"
        const allButtons = modal.querySelectorAll('button');
        allButtons.forEach(btn => {
            const text = (btn.textContent || '').toLowerCase().trim();
            const type = btn.getAttribute('type');
            
            // Skip submit buttons
            if (type === 'submit') return;
            if (text.includes('simpan') || text.includes('save') || text.includes('import')) return;
            
            // Check if it's a cancel button
            if (text === 'batal' || text === 'cancel' || text === 'tutup' || text === 'close' ||
                text.startsWith('batal') || text.startsWith('cancel')) {
                
                // Remove inline onclick if exists
                if (btn.getAttribute('onclick')) {
                    btn.removeAttribute('onclick');
                }
                
                // Clone to remove all existing listeners
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                // Add our handler
                newBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    closeModalElement(modal);
                });
                
                console.log('[EditFormFix] Set up cancel handler for button:', text);
            }
        });
    }
    
    // ============================================
    // EVENT CAPTURING - INTERCEPT BEFORE INLINE HANDLERS
    // ============================================
    
    /**
     * Use event capturing to intercept clicks BEFORE inline onclick handlers execute
     * This is the key fix for the double-click issue
     */
    document.addEventListener('click', function(e) {
        const target = e.target;
        
        // Check if clicked element or its parent is a cancel/close button in a modal
        const button = target.closest('button');
        if (!button) return;
        
        const modal = button.closest('.modal');
        if (!modal) return;
        
        // Check if modal is already closing
        if (closingModals.has(modal)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return;
        }
        
        // Check if this is a cancel/close button
        const buttonText = (button.textContent || '').toLowerCase().trim();
        const onclick = button.getAttribute('onclick') || '';
        const buttonType = button.getAttribute('type');
        const buttonClass = button.className || '';
        
        // Skip submit buttons
        if (buttonType === 'submit') return;
        if (buttonText.includes('simpan') || buttonText.includes('save') || buttonText.includes('import')) return;
        
        // Identify cancel/close buttons
        const isCancelButton = 
            buttonText === 'batal' || 
            buttonText === 'cancel' || 
            buttonText === 'tutup' || 
            buttonText === 'close' ||
            buttonText.startsWith('batal') ||
            buttonText.startsWith('cancel') ||
            buttonClass.includes('modal-close') ||
            buttonClass.includes('btn-cancel') ||
            (onclick.includes('closest') && onclick.includes('modal') && onclick.includes('remove'));
        
        if (isCancelButton) {
            // CRITICAL: Stop the event immediately to prevent inline onclick from executing
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Close the modal
            closeModalElement(modal);
            
            console.log('[EditFormFix] Cancel button intercepted and modal closed');
        }
    }, true); // TRUE = capture phase (runs BEFORE inline handlers)
    
    // ============================================
    // BACKDROP CLICK HANDLER
    // ============================================
    
    document.addEventListener('click', function(e) {
        // Check if clicked directly on modal backdrop (not modal content)
        if (e.target.classList.contains('modal') && 
            (e.target.classList.contains('active') || e.target.querySelector('.modal-content'))) {
            // Make sure we didn't click on modal content
            const modalContent = e.target.querySelector('.modal-content');
            if (modalContent && !modalContent.contains(e.target)) {
                e.preventDefault();
                e.stopPropagation();
                closeModalElement(e.target);
            } else if (!modalContent) {
                e.preventDefault();
                e.stopPropagation();
                closeModalElement(e.target);
            }
        }
    }, true);
    
    // ============================================
    // KEYBOARD SUPPORT (ESC to close)
    // ============================================
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active') || document.querySelector('.modal');
            if (activeModal && !closingModals.has(activeModal)) {
                e.preventDefault();
                closeModalElement(activeModal);
            }
        }
    });
    
    // ============================================
    // MUTATION OBSERVER - FIX NEW MODALS
    // ============================================
    
    const modalObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList && node.classList.contains('modal')) {
                        // Override inline handlers immediately when modal is added
                        overrideInlineHandlers(node);
                        fixModalStyles(node);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('.modal').forEach(modal => {
                            overrideInlineHandlers(modal);
                            fixModalStyles(modal);
                        });
                    }
                }
            });
        });
    });
    
    /**
     * Fix modal styles for overflow prevention
     * @param {HTMLElement} modal - Modal element
     */
    function fixModalStyles(modal) {
        if (modal.hasAttribute('data-style-fixed')) return;
        modal.setAttribute('data-style-fixed', 'true');
        
        console.log('[EditFormFix] Applying style fixes to modal...');
        
        // Add body class
        document.body.classList.add('modal-open');
        
        // Fix modal content overflow
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            Object.assign(modalContent.style, {
                maxHeight: 'calc(100vh - 2rem)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            });
            
            // Make form/body scrollable
            const formOrBody = modalContent.querySelector('form') || modalContent.querySelector('.modal-body');
            if (formOrBody) {
                Object.assign(formOrBody.style, {
                    flex: '1',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    maxHeight: 'calc(100vh - 200px)'
                });
            }
            
            // Fix footer positioning
            const footer = modalContent.querySelector('.modal-footer') || 
                          modalContent.querySelector('[style*="justify-content: flex-end"]') ||
                          modalContent.querySelector('[style*="justify-content:flex-end"]');
            if (footer) {
                Object.assign(footer.style, {
                    flexShrink: '0',
                    borderTop: '1px solid #e5e7eb',
                    background: '#f8fafc',
                    padding: '1rem 1.5rem',
                    marginTop: 'auto'
                });
            }
        }
    }
    
    // ============================================
    // API ERROR HANDLING WRAPPER
    // ============================================
    
    function wrapApiCall() {
        const originalApiCall = window.apiCall;
        if (originalApiCall && !originalApiCall._wrapped) {
            window.apiCall = async function(url, options = {}) {
                try {
                    const result = await originalApiCall(url, options);
                    return result;
                } catch (error) {
                    // Don't log expected errors or fallback scenarios
                    const errorMsg = error.message || '';
                    const isExpectedError = 
                        errorMsg.includes('not available') ||
                        errorMsg.includes('endpoint not found') ||
                        errorMsg.includes('401') ||
                        errorMsg.includes('Unauthorized') ||
                        errorMsg.includes('login');
                    
                    if (!isExpectedError) {
                        console.warn('[EditFormFix] API Error:', errorMsg);
                    }
                    
                    // Check if it's a network error
                    if (errorMsg.includes('Failed to fetch')) {
                        throw new Error('Koneksi ke server gagal. Periksa koneksi internet Anda.');
                    }
                    
                    throw error;
                }
            };
            window.apiCall._wrapped = true;
            console.log('[EditFormFix] API call wrapper applied');
        }
    }
    
    // Try to wrap API call - but don't error if not available
    function tryWrapApiCall() {
        if (window.apiCall && !window.apiCall._wrapped) {
            wrapApiCall();
        }
    }
    
    // Try immediately
    tryWrapApiCall();
    
    // Also try after a delay (in case apiCall is loaded later)
    setTimeout(tryWrapApiCall, 500);
    setTimeout(tryWrapApiCall, 1000);
    setTimeout(tryWrapApiCall, 2000);
    
    // ============================================
    // ENHANCED ERROR NOTIFICATION
    // ============================================
    
    /**
     * Show user-friendly error notification
     * @param {string} message - Error message
     * @param {string} type - Error type (error, warning, info, success)
     */
    window.showEditNotification = function(message, type = 'error') {
        // Remove existing notifications
        const existing = document.querySelector('.edit-notification');
        if (existing) existing.remove();
        
        const icons = {
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            success: 'check-circle'
        };
        
        const notification = document.createElement('div');
        notification.className = `edit-notification edit-notification-${type}`;
        notification.innerHTML = `
            <div class="edit-notification-content">
                <i class="fas fa-${icons[type] || icons.info}"></i>
                <span>${message}</span>
                <button class="edit-notification-close">&times;</button>
            </div>
        `;
        
        // Add close handler
        notification.querySelector('.edit-notification-close').onclick = () => notification.remove();
        
        // Add styles if not exists
        if (!document.getElementById('edit-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'edit-notification-styles';
            style.textContent = `
                .edit-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 100000;
                    max-width: 400px;
                    animation: editNotifSlideIn 0.3s ease;
                }
                @keyframes editNotifSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .edit-notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    font-size: 14px;
                }
                .edit-notification-error .edit-notification-content {
                    background: #fef2f2;
                    border: 1px solid #fca5a5;
                    color: #991b1b;
                }
                .edit-notification-warning .edit-notification-content {
                    background: #fffbeb;
                    border: 1px solid #fcd34d;
                    color: #92400e;
                }
                .edit-notification-info .edit-notification-content {
                    background: #eff6ff;
                    border: 1px solid #93c5fd;
                    color: #1e40af;
                }
                .edit-notification-success .edit-notification-content {
                    background: #f0fdf4;
                    border: 1px solid #86efac;
                    color: #166534;
                }
                .edit-notification-close {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    opacity: 0.7;
                    margin-left: auto;
                    padding: 0 4px;
                }
                .edit-notification-close:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'editNotifSlideIn 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    };
    
    /**
     * Intercept alert calls to show better notifications
     */
    const originalAlert = window.alert;
    window.alert = function(message) {
        if (typeof message === 'string') {
            const lowerMsg = message.toLowerCase();
            
            // Check if it's an error message
            if (lowerMsg.includes('error') || lowerMsg.includes('gagal') || lowerMsg.includes('tidak dapat') || lowerMsg.includes('cannot')) {
                showEditNotification(message, 'error');
                return;
            }
            // Check if it's a success message
            if (lowerMsg.includes('berhasil') || lowerMsg.includes('sukses') || lowerMsg.includes('success')) {
                showEditNotification(message, 'success');
                return;
            }
        }
        // Fall back to original alert for other messages
        originalAlert.call(window, message);
    };
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    function init() {
        // Start observing for new modals
        modalObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Fix any existing modals
        document.querySelectorAll('.modal').forEach(modal => {
            overrideInlineHandlers(modal);
            fixModalStyles(modal);
        });
        
        console.log('[EditFormFix] Edit form fixes v3.0 initialized successfully');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
