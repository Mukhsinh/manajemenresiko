/**
 * Modal Fix - Solusi untuk masalah tombol Batal yang memerlukan 2x klik
 * 
 * Masalah: Event bubbling dan inline onclick menyebabkan modal tidak langsung tertutup
 * Solusi: Gunakan event delegation dengan stopPropagation untuk mencegah event bubbling
 */

(function() {
  'use strict';

  console.log('🔧 Modal Fix: Initializing...');

  /**
   * Close modal dengan aman
   * @param {HTMLElement} modal - Modal element to close
   */
  function closeModal(modal) {
    if (!modal) return;
    
    // Remove modal dengan animasi fade out
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.2s ease';
    
    setTimeout(() => {
      if (modal && modal.parentNode) {
        modal.remove();
      }
    }, 200);
  }

  /**
   * Handle modal close button clicks
   * @param {Event} event - Click event
   */
  function handleModalClose(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    const button = event.currentTarget;
    const modal = button.closest('.modal');
    
    if (modal) {
      console.log('✓ Closing modal via close button');
      closeModal(modal);
    }
  }

  /**
   * Handle cancel button clicks
   * @param {Event} event - Click event
   */
  function handleCancelButton(event) {
    // Check if this is a cancel/batal button
    const button = event.target;
    if (!button.matches('button[type="button"]')) return;
    
    const buttonText = button.textContent.trim().toLowerCase();
    if (buttonText !== 'batal' && buttonText !== 'cancel' && buttonText !== 'tutup' && buttonText !== 'close') {
      return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    const modal = button.closest('.modal');
    if (modal) {
      console.log('✓ Closing modal via cancel button');
      closeModal(modal);
    }
  }

  /**
   * Handle modal overlay clicks (click outside modal)
   * @param {Event} event - Click event
   */
  function handleOverlayClick(event) {
    if (event.target.classList.contains('modal')) {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('✓ Closing modal via overlay click');
      closeModal(event.target);
    }
  }

  /**
   * Handle ESC key press
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleEscKey(event) {
    if (event.key === 'Escape' || event.keyCode === 27) {
      const modals = document.querySelectorAll('.modal.active, .modal');
      if (modals.length > 0) {
        const topModal = modals[modals.length - 1];
        console.log('✓ Closing modal via ESC key');
        closeModal(topModal);
      }
    }
  }

  /**
   * Setup event listeners for modal
   * @param {HTMLElement} modal - Modal element
   */
  function setupModalListeners(modal) {
    if (!modal || modal.dataset.fixedListeners) return;
    
    // Mark as fixed to prevent duplicate listeners
    modal.dataset.fixedListeners = 'true';
    
    // Close button (X)
    const closeButtons = modal.querySelectorAll('.modal-close, button.modal-close');
    closeButtons.forEach(btn => {
      // Remove inline onclick
      btn.removeAttribute('onclick');
      btn.addEventListener('click', handleModalClose, { capture: true });
    });
    
    // Cancel/Batal buttons
    const cancelButtons = modal.querySelectorAll('button[type="button"]');
    cancelButtons.forEach(btn => {
      const text = btn.textContent.trim().toLowerCase();
      if (text === 'batal' || text === 'cancel' || text === 'tutup' || text === 'close') {
        // Remove inline onclick
        btn.removeAttribute('onclick');
        btn.addEventListener('click', handleCancelButton, { capture: true });
      }
    });
    
    // Overlay click
    modal.addEventListener('click', handleOverlayClick, { capture: true });
    
    // Prevent clicks inside modal content from closing modal
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.addEventListener('click', (e) => {
        e.stopPropagation();
      }, { capture: true });
    }
    
    console.log('✓ Modal listeners setup complete');
  }

  /**
   * Observer untuk mendeteksi modal baru
   */
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          // Check if the added node is a modal
          if (node.classList && node.classList.contains('modal')) {
            console.log('🔍 New modal detected, setting up listeners...');
            setupModalListeners(node);
          }
          
          // Check if the added node contains modals
          const modals = node.querySelectorAll && node.querySelectorAll('.modal');
          if (modals && modals.length > 0) {
            modals.forEach(modal => {
              console.log('🔍 New modal detected (nested), setting up listeners...');
              setupModalListeners(modal);
            });
          }
        }
      });
    });
  });

  /**
   * Initialize modal fix
   */
  function init() {
    console.log('🚀 Modal Fix: Starting initialization...');
    
    // Setup existing modals
    const existingModals = document.querySelectorAll('.modal');
    existingModals.forEach(modal => {
      setupModalListeners(modal);
    });
    
    // Watch for new modals
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // ESC key listener
    document.addEventListener('keydown', handleEscKey);
    
    console.log('✅ Modal Fix: Initialization complete');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export untuk debugging
  window.ModalFix = {
    closeModal,
    setupModalListeners,
    version: '1.0.0'
  };

})();
