/**
 * RS DISPLAY ENFORCER v3.0
 * 
 * TUJUAN: Memastikan halaman /rencana-strategis SELALU menampilkan:
 * ✅ Statistics Cards
 * ✅ Form Input
 * ✅ Data Table
 * 
 * DAN TIDAK PERNAH menampilkan:
 * ❌ Selection List / "Pilih Rencana Strategis" dropdown
 * ❌ List dengan RS-2025-xxx tanpa table
 * ❌ Background ungu rgb(248, 240, 250)
 * 
 * FIXES v3.0:
 * - Added debounce to prevent infinite loops
 * - Check conditions before applying fixes
 * - Mark fixed elements to prevent re-processing
 * - Longer intervals to reduce CPU usage
 * - Prevent recursive MutationObserver triggers
 */

(function() {
  'use strict';
  
  // Prevent multiple initializations
  if (window.RSDisplayEnforcerInitialized) {
    return;
  }
  window.RSDisplayEnforcerInitialized = true;
  
  const ENFORCER_VERSION = '3.0';
  
  const state = {
    active: false,
    checkInterval: null,
    observer: null,
    forceReloadCount: 0,
    maxForceReload: 3,
    lastCheckTime: 0,
    checkDebounce: 2000, // Minimum 2 seconds between checks
    isProcessing: false, // Prevent recursive calls
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
  
  function isOnRSPage() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const activePage = document.querySelector('.page-content.active');
    return path === '/rencana-strategis' || 
           path.includes('/rencana-strategis') ||
           hash === '#rencana-strategis' ||
           (activePage && activePage.id === 'rencana-strategis');
  }
  
  function isDisplayWrong() {
    const container = document.getElementById('rencana-strategis-content');
    if (!container) return false;
    
    // Check if already marked as correct
    if (container.hasAttribute('data-display-verified')) {
      return false;
    }
    
    const html = container.innerHTML;
    
    // Skip if loading or empty
    if (html.includes('spinner-border') || html.includes('Memuat data') || html.trim() === '') {
      return false;
    }
    
    // Check for selection list without table
    if (html.includes('Pilih Rencana Strategis')) {
      const hasTable = container.querySelector('table.table') !== null;
      const hasWrapper = container.querySelector('.rencana-strategis-wrapper') !== null;
      
      // Check if it's in a form select (which is OK)
      const selectElements = container.querySelectorAll('select');
      let isInFormSelect = false;
      selectElements.forEach(sel => {
        if (sel.id && (sel.id.includes('rs-') || sel.id.includes('misi'))) {
          isInFormSelect = true;
        }
      });
      
      if (!hasTable && !hasWrapper && !isInFormSelect) {
        return true;
      }
    }
    
    // Check for list-group with RS codes but no table
    if (html.includes('list-group') && /RS-\d{4}-\d{3}/.test(html)) {
      const hasTable = container.querySelector('table.table') !== null;
      if (!hasTable) return true;
    }
    
    return false;
  }
  
  function removePurpleBackground() {
    const container = document.getElementById('rencana-strategis-content');
    if (container && container.style.backgroundColor !== '#f8f9fa') {
      container.style.backgroundColor = '#f8f9fa';
    }
    
    const parent = document.getElementById('rencana-strategis');
    if (parent && parent.style.backgroundColor !== '#f8f9fa') {
      parent.style.backgroundColor = '#f8f9fa';
    }
  }
  
  function forceCorrectDisplay() {
    // Prevent recursive calls
    if (state.isProcessing) return;
    
    // Debounce check
    const now = Date.now();
    if (now - state.lastCheckTime < state.checkDebounce) {
      return;
    }
    
    if (!isOnRSPage()) return;
    
    const container = document.getElementById('rencana-strategis-content');
    if (!container) return;
    
    state.isProcessing = true;
    state.lastCheckTime = now;
    
    try {
      removePurpleBackground();
      
      if (isDisplayWrong()) {
        state.forceReloadCount++;
        
        if (state.forceReloadCount > state.maxForceReload) {
          console.log('⚠️ RS Enforcer: Max reload attempts reached, stopping');
          // Mark as verified to stop further checks
          container.setAttribute('data-display-verified', 'true');
          return;
        }
        
        console.log(`🚨 RS Enforcer: Wrong display detected (attempt ${state.forceReloadCount}/${state.maxForceReload})`);
        
        // Show loading
        container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3 text-muted">Memuat ulang...</p></div>';
        
        setTimeout(() => {
          // Reset module flags
          window._rsUnifiedLoaded = false;
          window.RencanaStrategisCleanLoaded = false;
          
          // Try to reload the module
          if (window.RencanaStrategisUnified?.load) {
            window.RencanaStrategisUnified.load();
          } else if (window.RencanaStrategisModule?.load) {
            window.RencanaStrategisModule.load();
          }
        }, 300);
        
      } else {
        // Display is correct, mark as verified
        if (container.querySelector('.rencana-strategis-wrapper') && container.querySelector('table')) {
          container.setAttribute('data-display-verified', 'true');
          state.forceReloadCount = 0;
        }
      }
      
    } finally {
      state.isProcessing = false;
    }
  }
  
  function removeSelectionElements() {
    if (state.isProcessing) return;
    if (!isOnRSPage()) return;
    
    const container = document.getElementById('rencana-strategis-content');
    if (!container) return;
    
    // Skip if already verified
    if (container.hasAttribute('data-display-verified')) return;
    
    let removedCount = 0;
    
    Array.from(container.children).forEach(child => {
      // Skip if already checked
      if (child.hasAttribute('data-rs-checked')) return;
      
      const text = child.textContent || '';
      const isWrapper = child.classList.contains('rencana-strategis-wrapper');
      const isLoading = text.includes('Memuat') || child.querySelector('.spinner-border');
      const isAlert = child.classList.contains('alert');
      
      if (!isWrapper && !isLoading && !isAlert) {
        if (text.includes('Pilih Rencana Strategis') && !child.querySelector('table')) {
          child.remove();
          removedCount++;
        } else if (/RS-\d{4}-\d{3}/.test(text) && !child.querySelector('table') && !child.querySelector('form')) {
          child.remove();
          removedCount++;
        } else {
          // Mark as checked
          child.setAttribute('data-rs-checked', 'true');
        }
      }
    });
    
    if (removedCount > 0) {
      console.log(`🧹 RS Enforcer: Removed ${removedCount} selection element(s)`);
    }
  }
  
  // Debounced check function for MutationObserver
  const debouncedCheck = debounce(() => {
    if (!state.isProcessing && isOnRSPage()) {
      removePurpleBackground();
      removeSelectionElements();
      forceCorrectDisplay();
    }
  }, 500);
  
  function start() {
    if (state.active) return;
    state.active = true;
    state.forceReloadCount = 0;
    
    console.log(`✅ RS Display Enforcer v${ENFORCER_VERSION} started`);
    
    // Initial check after a delay
    setTimeout(() => {
      if (isOnRSPage()) {
        removePurpleBackground();
        removeSelectionElements();
        forceCorrectDisplay();
      }
    }, 500);
    
    // Periodic check with longer interval (10 seconds instead of 1.5)
    state.checkInterval = setInterval(() => {
      if (isOnRSPage() && !state.isProcessing) {
        const container = document.getElementById('rencana-strategis-content');
        // Only check if not already verified
        if (container && !container.hasAttribute('data-display-verified')) {
          removePurpleBackground();
          if (isDisplayWrong()) {
            forceCorrectDisplay();
          }
        }
      } else {
        // Reset when leaving RS page
        state.forceReloadCount = 0;
      }
    }, 10000);
    
    // MutationObserver with debounce
    state.observer = new MutationObserver((mutations) => {
      if (!isOnRSPage() || state.isProcessing) return;
      
      const container = document.getElementById('rencana-strategis-content');
      if (container?.hasAttribute('data-display-verified')) return;
      
      // Check if any problematic content was added
      let needsCheck = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              const text = node.textContent || '';
              // Only check for actual selection list content
              if ((text.includes('Pilih Rencana Strategis') && !node.querySelector('table')) ||
                  (/RS-\d{4}-\d{3}/.test(text) && !node.querySelector('table') && !node.querySelector('form'))) {
                needsCheck = true;
                break;
              }
            }
          }
        }
        if (needsCheck) break;
      }
      
      if (needsCheck) {
        debouncedCheck();
      }
    });
    
    // Observe with minimal scope
    const container = document.getElementById('rencana-strategis-content');
    if (container) {
      state.observer.observe(container, { 
        childList: true, 
        subtree: false, // Only direct children, not deep subtree
        attributes: false,
        characterData: false
      });
    }
  }
  
  function stop() {
    if (!state.active) return;
    state.active = false;
    
    if (state.checkInterval) {
      clearInterval(state.checkInterval);
      state.checkInterval = null;
    }
    
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    
    console.log('⏹️ RS Display Enforcer stopped');
  }
  
  // Navigation event handlers
  window.addEventListener('hashchange', () => {
    state.forceReloadCount = 0;
    // Remove verified flag when navigating
    const container = document.getElementById('rencana-strategis-content');
    if (container) {
      container.removeAttribute('data-display-verified');
    }
    
    if (isOnRSPage()) {
      setTimeout(debouncedCheck, 500);
    }
  });
  
  window.addEventListener('popstate', () => {
    state.forceReloadCount = 0;
    const container = document.getElementById('rencana-strategis-content');
    if (container) {
      container.removeAttribute('data-display-verified');
    }
    
    if (isOnRSPage()) {
      setTimeout(debouncedCheck, 500);
    }
  });
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  
  // Export for debugging
  window.RSDisplayEnforcer = {
    start,
    stop,
    check: () => forceCorrectDisplay(),
    isWrong: isDisplayWrong,
    version: ENFORCER_VERSION,
    resetVerification: () => {
      const container = document.getElementById('rencana-strategis-content');
      if (container) {
        container.removeAttribute('data-display-verified');
        state.forceReloadCount = 0;
      }
    }
  };
  
})();
