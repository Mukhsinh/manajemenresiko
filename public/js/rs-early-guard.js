/**
 * RS EARLY GUARD v1.0
 * 
 * CRITICAL: This script MUST be loaded EARLY in the page
 * It prevents any wrong content from being displayed in the RS container
 * 
 * Created: 2026-01-11
 */

(function() {
  'use strict';
  
  // Only run on RS page
  function isOnRSPage() {
    const path = window.location.pathname;
    return path === '/rencana-strategis' || path.includes('/rencana-strategis');
  }
  
  if (!isOnRSPage()) return;
  
  console.log('🛡️ RS Early Guard active');
  
  // Function to check and fix wrong display
  function checkAndFix() {
    const container = document.getElementById('rencana-strategis-content');
    if (!container) return;
    
    const html = container.innerHTML;
    
    // Skip if loading or empty
    if (html.includes('spinner-border') || html.includes('Memuat') || html.trim() === '') {
      return;
    }
    
    // Check for wrong display
    const hasSelectionList = html.includes('Pilih Rencana Strategis') && !html.includes('rencana-strategis-wrapper');
    const hasListGroup = html.includes('list-group') && /RS-\d{4}-\d{3}/.test(html) && !container.querySelector('table');
    
    if (hasSelectionList || hasListGroup) {
      console.log('🚨 RS Early Guard: Wrong display detected! Clearing...');
      container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3 text-muted">Memuat...</p></div>';
      
      // Trigger module reload
      setTimeout(() => {
        if (window.RencanaStrategisUnified?.load) {
          window._rsUnifiedLoaded = false;
          window.RencanaStrategisUnified.load();
        } else if (window.RencanaStrategisModule?.load) {
          window.RencanaStrategisModule.load();
        }
      }, 100);
    }
  }
  
  // Check immediately
  if (document.readyState !== 'loading') {
    checkAndFix();
  }
  
  // Check when DOM is ready
  document.addEventListener('DOMContentLoaded', checkAndFix);
  
  // Check periodically for first 5 seconds
  let checkCount = 0;
  const checkInterval = setInterval(() => {
    checkAndFix();
    checkCount++;
    if (checkCount >= 10) {
      clearInterval(checkInterval);
    }
  }, 500);
  
  // MutationObserver for immediate detection
  const observer = new MutationObserver(() => {
    checkAndFix();
  });
  
  // Start observing when container is available
  function startObserving() {
    const container = document.getElementById('rencana-strategis-content');
    if (container) {
      observer.observe(container, { childList: true, subtree: true });
    } else {
      setTimeout(startObserving, 100);
    }
  }
  
  if (document.readyState !== 'loading') {
    startObserving();
  } else {
    document.addEventListener('DOMContentLoaded', startObserving);
  }
  
})();
