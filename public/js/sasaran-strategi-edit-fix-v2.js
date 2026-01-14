// Fix untuk form edit Sasaran Strategi v2
// Perbaikan: Tombol edit sekarang berfungsi dengan benar menggunakan event listener

(function() {
  'use strict';

  // Ensure SasaranStrategiModule is available globally
  if (typeof SasaranStrategiModule !== 'undefined') {
    window.SasaranStrategiModule = SasaranStrategiModule;
    window.sasaranStrategiModule = SasaranStrategiModule;
    console.log('✓ SasaranStrategiModule exposed globally');
  }

  // Re-attach event listeners after page load
  function attachEditListeners() {
    const editButtons = document.querySelectorAll('[data-edit-id]');
    const deleteButtons = document.querySelectorAll('[data-delete-id]');
    
    editButtons.forEach(btn => {
      // Remove existing listeners to prevent duplicates
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = newBtn.getAttribute('data-edit-id');
        console.log('Edit button clicked (v2 fix), ID:', id);
        
        if (window.SasaranStrategiModule && window.SasaranStrategiModule.edit) {
          window.SasaranStrategiModule.edit(id);
        } else if (window.sasaranStrategiModule && window.sasaranStrategiModule.edit) {
          window.sasaranStrategiModule.edit(id);
        } else {
          console.error('SasaranStrategiModule not found');
          alert('Error: Module tidak tersedia');
        }
      });
    });
    
    deleteButtons.forEach(btn => {
      // Remove existing listeners to prevent duplicates
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = newBtn.getAttribute('data-delete-id');
        console.log('Delete button clicked (v2 fix), ID:', id);
        
        if (window.SasaranStrategiModule && window.SasaranStrategiModule.delete) {
          window.SasaranStrategiModule.delete(id);
        } else if (window.sasaranStrategiModule && window.sasaranStrategiModule.delete) {
          window.sasaranStrategiModule.delete(id);
        } else {
          console.error('SasaranStrategiModule not found');
          alert('Error: Module tidak tersedia');
        }
      });
    });
    
    console.log(`✓ Attached listeners to ${editButtons.length} edit buttons and ${deleteButtons.length} delete buttons`);
  }

  // Observe DOM changes to re-attach listeners when table is re-rendered
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if sasaran-strategi content was updated
        const container = document.getElementById('sasaran-strategi-content');
        if (container && container.contains(mutation.target)) {
          setTimeout(attachEditListeners, 100);
          break;
        }
      }
    }
  });

  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const container = document.getElementById('sasaran-strategi-content');
      if (container) {
        observer.observe(container, { childList: true, subtree: true });
        attachEditListeners();
      }
    });
  } else {
    const container = document.getElementById('sasaran-strategi-content');
    if (container) {
      observer.observe(container, { childList: true, subtree: true });
      attachEditListeners();
    }
  }

  // Also attach on page navigation
  window.addEventListener('hashchange', () => {
    setTimeout(attachEditListeners, 500);
  });

  console.log('✓ Sasaran Strategi edit fix v2 loaded');
})();
