/**
 * RS FINAL FIX v1.0
 * 
 * COMPREHENSIVE FIX for /rencana-strategis page display issue
 * 
 * PROBLEM: Page shows "Pilih Rencana Strategis" selection list with purple background
 *          instead of the correct Cards + Form + Table view
 * 
 * SOLUTION: 
 * 1. Aggressively remove any selection list elements
 * 2. Force correct background color
 * 3. Ensure only the unified module renders the page
 * 4. Prevent race conditions
 * 
 * Created: 2026-01-11
 */

(function() {
  'use strict';
  
  const VERSION = '1.0';
  let isActive = false;
  let observer = null;
  let checkInterval = null;
  
  // Check if on RS page
  function isOnRSPage() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const activePage = document.querySelector('.page-content.active');
    return path === '/rencana-strategis' || 
           path.includes('/rencana-strategis') ||
           hash === '#rencana-strategis' ||
           (activePage && activePage.id === 'rencana-strategis');
  }
  
  // Force correct background color
  function forceCorrectBackground() {
    const rsPage = document.getElementById('rencana-strategis');
    const rsContent = document.getElementById('rencana-strategis-content');
    
    if (rsPage) {
      rsPage.style.setProperty('background-color', '#f8f9fa', 'important');
      rsPage.style.setProperty('background', '#f8f9fa', 'important');
    }
    
    if (rsContent) {
      rsContent.style.setProperty('background-color', '#f8f9fa', 'important');
      rsContent.style.setProperty('background', '#f8f9fa', 'important');
    }
  }
  
  // Check if display is wrong
  function isDisplayWrong() {
    const container = document.getElementById('rencana-strategis-content');
    if (!container) return false;
    
    const html = container.innerHTML;
    
    // Skip if loading or empty
    if (html.includes('spinner-border') || html.includes('Memuat') || html.trim() === '') {
      return false;
    }
    
    // Check for correct display
    const hasWrapper = container.querySelector('.rencana-strategis-wrapper') !== null;
    const hasTable = container.querySelector('table.table') !== null;
    const hasForm = container.querySelector('form#rs-form') !== null;
    
    if (hasWrapper && hasTable) {
      return false; // Correct display
    }
    
    // Check for wrong display patterns
    const hasSelectionList = html.includes('Pilih Rencana Strategis') && !hasTable;
    const hasListGroup = html.includes('list-group') && /RS-\d{4}-\d{3}/.test(html) && !hasTable;
    const hasRSCodesWithoutTable = /RS-\d{4}-\d{3}/.test(html) && !hasTable && !hasForm;
    
    return hasSelectionList || hasListGroup || hasRSCodesWithoutTable;
  }
  
  // Remove selection list elements
  function removeSelectionElements() {
    if (!isOnRSPage()) return;
    
    const container = document.getElementById('rencana-strategis-content');
    if (!container) return;
    
    // Remove any child that is NOT the wrapper, loading spinner, or alert
    Array.from(container.children).forEach(child => {
      const isWrapper = child.classList.contains('rencana-strategis-wrapper');
      const isLoading = child.classList.contains('text-center') && 
                       (child.querySelector('.spinner-border') || child.textContent.includes('Memuat'));
      const isAlert = child.classList.contains('alert');
      
      if (!isWrapper && !isLoading && !isAlert) {
        const text = child.textContent || '';
        const hasRSCode = /RS-\d{4}-\d{3}/.test(text);
        const hasPilih = text.includes('Pilih Rencana Strategis');
        const hasTable = child.querySelector('table') !== null;
        
        // Remove if it looks like a selection list
        if ((hasRSCode || hasPilih) && !hasTable) {
          console.log('🗑️ RS Final Fix: Removing selection list element');
          child.remove();
        }
      }
    });
    
    // Also remove any global selection list elements
    const selectors = [
      '.rencana-strategis-selection',
      '.rs-selection-wrapper',
      '.rs-selection-list',
      '#rs-selection-container',
      '#selection-section',
      '[data-rs-selection-list]'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        console.log(`🗑️ RS Final Fix: Removing ${selector}`);
        el.remove();
      });
    });
  }
  
  // Force correct display
  function forceCorrectDisplay() {
    if (!isOnRSPage()) return;
    
    forceCorrectBackground();
    removeSelectionElements();
    
    if (isDisplayWrong()) {
      console.log('🚨 RS Final Fix: Wrong display detected! Triggering reload...');
      
      const container = document.getElementById('rencana-strategis-content');
      if (container) {
        // Show loading state
        container.innerHTML = `
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3 text-muted">Memuat ulang...</p>
          </div>
        `;
        
        // Reset module state and reload
        setTimeout(() => {
          window._rsUnifiedLoaded = false;
          
          if (window.RencanaStrategisUnified?.load) {
            window.RencanaStrategisUnified.load();
          } else if (window.RencanaStrategisModule?.load) {
            window.RencanaStrategisModule.load();
          }
        }, 100);
      }
    }
  }
  
  // Start monitoring
  function start() {
    if (isActive) return;
    isActive = true;
    
    console.log(`✅ RS Final Fix v${VERSION} started`);
    
    // Initial check
    setTimeout(() => {
      forceCorrectBackground();
      removeSelectionElements();
      forceCorrectDisplay();
    }, 100);
    
    // Periodic check for first 10 seconds
    let checkCount = 0;
    checkInterval = setInterval(() => {
      if (isOnRSPage()) {
        forceCorrectBackground();
        removeSelectionElements();
        if (isDisplayWrong()) {
          forceCorrectDisplay();
        }
      }
      checkCount++;
      if (checkCount >= 20) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
    }, 500);
    
    // MutationObserver for immediate detection
    observer = new MutationObserver((mutations) => {
      if (!isOnRSPage()) return;
      
      let needsCheck = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              const text = node.textContent || '';
              if (text.includes('Pilih Rencana Strategis') || 
                  (/RS-\d{4}-\d{3}/.test(text) && !node.querySelector('table'))) {
                needsCheck = true;
                break;
              }
            }
          }
        }
        if (needsCheck) break;
      }
      
      if (needsCheck) {
        setTimeout(() => {
          forceCorrectBackground();
          removeSelectionElements();
          forceCorrectDisplay();
        }, 50);
      }
    });
    
    // Start observing
    const container = document.getElementById('rencana-strategis-content');
    if (container) {
      observer.observe(container, { childList: true, subtree: true });
    }
    
    const rsPage = document.getElementById('rencana-strategis');
    if (rsPage && rsPage !== container) {
      observer.observe(rsPage, { childList: true, subtree: true });
    }
  }
  
  // Stop monitoring
  function stop() {
    if (!isActive) return;
    isActive = false;
    
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    
    console.log(`🛑 RS Final Fix v${VERSION} stopped`);
  }
  
  // Listen for navigation events
  window.addEventListener('hashchange', () => {
    if (isOnRSPage()) {
      setTimeout(forceCorrectDisplay, 100);
    }
  });
  
  window.addEventListener('popstate', () => {
    if (isOnRSPage()) {
      setTimeout(forceCorrectDisplay, 100);
    }
  });
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  
  // Export for debugging
  window.RSFinalFix = {
    start,
    stop,
    check: forceCorrectDisplay,
    isWrong: isDisplayWrong,
    version: VERSION
  };
  
})();
