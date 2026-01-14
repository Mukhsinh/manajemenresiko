/**
 * Fix Cancel Button - Single Click Solution
 * Memastikan tombol Batal, icon X, dan Simpan hanya perlu 1x klik
 */

(function() {
  'use strict';
  
  console.log('🔧 Loading Cancel Button Single Click Fix...');
  
  // Fungsi untuk menutup modal dengan aman
  function closeModalSafely(modal) {
    if (!modal) return;
    
    // Hapus event listeners untuk mencegah multiple triggers
    modal.onclick = null;
    
    // Hapus modal dengan animasi
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.2s ease';
    
    setTimeout(() => {
      if (modal && modal.parentNode) {
        modal.remove();
      }
    }, 200);
  }
  
  // Override fungsi global untuk menutup modal
  window.closeModal = function(modalElement) {
    const modal = modalElement || document.querySelector('.modal.active');
    closeModalSafely(modal);
  };
  
  // Fungsi untuk memperbaiki tombol dalam modal
  function fixModalButtons(modal) {
    if (!modal) return;
    
    // Fix tombol close (X)
    const closeButtons = modal.querySelectorAll('.modal-close, [class*="close"]');
    closeButtons.forEach(btn => {
      // Hapus onclick attribute yang lama
      btn.removeAttribute('onclick');
      
      // Tambah event listener baru dengan once: true
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeModalSafely(modal);
      }, { once: true });
    });
    
    // Fix tombol Batal
    const cancelButtons = modal.querySelectorAll('button[type="button"].btn-secondary, button:not([type="submit"]):not([type="button"][class*="primary"])');
    cancelButtons.forEach(btn => {
      const btnText = btn.textContent.trim().toLowerCase();
      if (btnText.includes('batal') || btnText.includes('tutup') || btnText.includes('cancel')) {
        // Hapus onclick attribute yang lama
        btn.removeAttribute('onclick');
        
        // Tambah event listener baru dengan once: true
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          closeModalSafely(modal);
        }, { once: true });
      }
    });
    
    // Fix form submit - pastikan modal tertutup setelah submit berhasil
    const forms = modal.querySelectorAll('form');
    forms.forEach(form => {
      const originalSubmit = form.onsubmit;
      
      form.onsubmit = async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        try {
          // Jalankan fungsi submit original jika ada
          if (originalSubmit) {
            const result = await originalSubmit.call(this, e);
            
            // Jika submit berhasil (tidak throw error), tutup modal
            if (result !== false) {
              closeModalSafely(modal);
            }
          }
        } catch (error) {
          console.error('Form submit error:', error);
          // Jangan tutup modal jika ada error
        }
      };
    });
    
    // Fix click di luar modal untuk menutup
    modal.onclick = function(e) {
      if (e.target === modal) {
        e.preventDefault();
        e.stopPropagation();
        closeModalSafely(modal);
      }
    };
  }
  
  // Observer untuk mendeteksi modal baru
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          // Cek apakah node adalah modal
          if (node.classList && node.classList.contains('modal')) {
            console.log('🔧 Fixing modal buttons:', node);
            fixModalButtons(node);
          }
          
          // Cek apakah ada modal di dalam node
          const modals = node.querySelectorAll && node.querySelectorAll('.modal');
          if (modals && modals.length > 0) {
            modals.forEach(modal => {
              console.log('🔧 Fixing modal buttons:', modal);
              fixModalButtons(modal);
            });
          }
        }
      });
    });
  });
  
  // Mulai observe
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Fix modal yang sudah ada saat script diload
  document.addEventListener('DOMContentLoaded', function() {
    const existingModals = document.querySelectorAll('.modal');
    existingModals.forEach(modal => {
      console.log('🔧 Fixing existing modal buttons:', modal);
      fixModalButtons(modal);
    });
  });
  
  // Jika DOM sudah ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      const existingModals = document.querySelectorAll('.modal');
      existingModals.forEach(modal => {
        fixModalButtons(modal);
      });
    });
  } else {
    // DOM sudah ready
    const existingModals = document.querySelectorAll('.modal');
    existingModals.forEach(modal => {
      fixModalButtons(modal);
    });
  }
  
  console.log('✅ Cancel Button Single Click Fix loaded successfully');
})();
