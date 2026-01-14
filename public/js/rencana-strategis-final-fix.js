/**
 * RENCANA STRATEGIS FINAL FIX v2.0
 * 
 * Solusi komprehensif untuk:
 * 1. Halaman freeze saat refresh
 * 2. Konten RS bocor ke halaman lain
 * 3. Pointer-events blocking
 * 4. Z-index dan layering issues
 * 
 * FIXES v2.0:
 * - Removed aggressive setInterval (was causing infinite loops)
 * - Added debounce to prevent excessive calls
 * - Check conditions before applying fixes
 * - Mark fixed elements to prevent re-processing
 * 
 * Created: 2026-01-10
 * Updated: 2026-01-11
 */

(function() {
  'use strict';
  
  // Prevent multiple initializations
  if (window.RSFinalFixInitialized) {
    return;
  }
  window.RSFinalFixInitialized = true;
  
  const RS_FINAL_FIX = {
    version: '2.0.0',
    initialized: false,
    lastFixTime: 0,
    fixDebounce: 3000, // Minimum 3 seconds between fixes
    isProcessing: false
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

  // ============================================
  // CRITICAL: Page Detection
  // ============================================
  
  function isRencanaStrategisPage() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const activePage = document.querySelector('.page-content.active');
    
    return path.includes('rencana-strategis') || 
           hash === '#rencana-strategis' ||
           (activePage && activePage.id === 'rencana-strategis');
  }

  // ============================================
  // CRITICAL: Remove RS Content from Other Pages
  // ============================================
  
  function cleanupRSFromOtherPages() {
    if (isRencanaStrategisPage()) return;
    
    let cleanedCount = 0;
    
    // Remove RS wrapper from non-RS pages
    const rsWrappers = document.querySelectorAll('.rencana-strategis-wrapper');
    rsWrappers.forEach(wrapper => {
      const parent = wrapper.closest('.page-content');
      if (parent && parent.id !== 'rencana-strategis') {
        wrapper.remove();
        cleanedCount++;
      }
    });

    // Remove RS content containers from non-RS pages
    document.querySelectorAll('.page-content').forEach(page => {
      if (page.id === 'rencana-strategis') return;
      
      const rsContent = page.querySelector('#rencana-strategis-content');
      if (rsContent && rsContent.innerHTML.trim()) {
        rsContent.innerHTML = '';
        cleanedCount++;
      }
      
      // Remove any RS-specific elements (only if not already checked)
      page.querySelectorAll('[class*="rencana-strategis"]:not([data-rs-checked])').forEach(el => {
        if (!el.classList.contains('page-content')) {
          el.remove();
          cleanedCount++;
        }
      });
    });
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} RS element(s) from other pages`);
    }
  }

  // ============================================
  // CRITICAL: Fix Pointer Events Blocking
  // ============================================
  
  function fixPointerEventsBlocking() {
    let fixedCount = 0;
    
    // Remove any overlay that might be blocking clicks
    const overlays = document.querySelectorAll('[style*="pointer-events: none"]:not([data-pointer-checked])');
    overlays.forEach(el => {
      if (!el.classList.contains('spinner') && !el.classList.contains('loading')) {
        el.style.pointerEvents = '';
        fixedCount++;
      }
      el.setAttribute('data-pointer-checked', 'true');
    });
    
    // Ensure main content is clickable
    const mainContent = document.querySelector('.main-content');
    if (mainContent && mainContent.style.pointerEvents === 'none') {
      mainContent.style.pointerEvents = 'auto';
      fixedCount++;
    }
    
    // Ensure all page contents are clickable
    document.querySelectorAll('.page-content').forEach(page => {
      if (page.style.pointerEvents === 'none') {
        page.style.pointerEvents = 'auto';
        fixedCount++;
      }
    });
    
    if (fixedCount > 0) {
      console.log(`🖱️ Fixed pointer events for ${fixedCount} element(s)`);
    }
  }

  // ============================================
  // CRITICAL: Fix Z-Index Issues (run once)
  // ============================================
  
  function fixZIndexIssues() {
    // Ensure proper z-index hierarchy
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.top-header');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar && !sidebar.hasAttribute('data-zindex-fixed')) {
      sidebar.style.zIndex = '1000';
      sidebar.setAttribute('data-zindex-fixed', 'true');
    }
    if (header && !header.hasAttribute('data-zindex-fixed')) {
      header.style.zIndex = '999';
      header.setAttribute('data-zindex-fixed', 'true');
    }
    if (mainContent && !mainContent.hasAttribute('data-zindex-fixed')) {
      mainContent.style.zIndex = '1';
      mainContent.setAttribute('data-zindex-fixed', 'true');
    }
  }

  // ============================================
  // CRITICAL: Ensure Page is Responsive
  // ============================================
  
  function ensurePageResponsive() {
    // Remove any loading overlays that might be stuck
    document.querySelectorAll('.loading-overlay, .page-loading, .spinner-overlay').forEach(el => {
      if (el.style.display !== 'none' && !el.hasAttribute('data-loading-checked')) {
        el.style.display = 'none';
        el.setAttribute('data-loading-checked', 'true');
      }
    });
    
    // Ensure body is scrollable
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
    }
    if (document.body.style.pointerEvents === 'none') {
      document.body.style.pointerEvents = 'auto';
    }
  }

  // ============================================
  // CRITICAL: Fix RS Page Specifically
  // ============================================
  
  function fixRSPage() {
    if (!isRencanaStrategisPage()) return;
    
    const rsPage = document.getElementById('rencana-strategis');
    const rsContent = document.getElementById('rencana-strategis-content');
    
    if (rsPage && !rsPage.hasAttribute('data-rs-page-fixed')) {
      rsPage.style.display = 'block';
      rsPage.style.visibility = 'visible';
      rsPage.style.opacity = '1';
      rsPage.style.pointerEvents = 'auto';
      rsPage.setAttribute('data-rs-page-fixed', 'true');
    }
    
    if (rsContent && !rsContent.hasAttribute('data-rs-content-fixed')) {
      rsContent.style.display = 'block';
      rsContent.style.visibility = 'visible';
      rsContent.style.opacity = '1';
      rsContent.style.pointerEvents = 'auto';
      rsContent.style.minHeight = '400px';
      rsContent.setAttribute('data-rs-content-fixed', 'true');
    }
  }

  // ============================================
  // MAIN FIX FUNCTION (with debounce)
  // ============================================
  
  function applyAllFixes(force = false) {
    // Prevent recursive calls
    if (RS_FINAL_FIX.isProcessing) return;
    
    // Debounce check
    const now = Date.now();
    if (!force && now - RS_FINAL_FIX.lastFixTime < RS_FINAL_FIX.fixDebounce) {
      return;
    }
    
    RS_FINAL_FIX.isProcessing = true;
    RS_FINAL_FIX.lastFixTime = now;
    
    try {
      cleanupRSFromOtherPages();
      fixPointerEventsBlocking();
      fixZIndexIssues();
      ensurePageResponsive();
      fixRSPage();
    } finally {
      RS_FINAL_FIX.isProcessing = false;
    }
  }
  
  // Debounced version for event handlers
  const debouncedApplyFixes = debounce(() => applyAllFixes(false), 500);

  // ============================================
  // INITIALIZATION
  // ============================================
  
  function init() {
    if (RS_FINAL_FIX.initialized) return;
    
    console.log(`🚀 Initializing RS Final Fix v${RS_FINAL_FIX.version}`);
    
    // Apply fixes immediately (force)
    applyAllFixes(true);
    
    // Apply fixes on page change (debounced)
    window.addEventListener('hashchange', debouncedApplyFixes);
    window.addEventListener('popstate', debouncedApplyFixes);
    
    // Apply fixes when clicking menu items (debounced)
    document.querySelectorAll('[data-page]').forEach(item => {
      if (!item.hasAttribute('data-rs-fix-listener')) {
        item.addEventListener('click', debouncedApplyFixes);
        item.setAttribute('data-rs-fix-listener', 'true');
      }
    });
    
    RS_FINAL_FIX.initialized = true;
    console.log('✅ RS Final Fix initialized');
  }

  // ============================================
  // EXPOSE TO GLOBAL SCOPE
  // ============================================
  
  window.RSFinalFix = {
    init,
    applyAllFixes: () => applyAllFixes(true),
    cleanupRSFromOtherPages,
    fixPointerEventsBlocking,
    version: RS_FINAL_FIX.version
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();


// ============================================
// ADDITIONAL FIX: Ensure RS Page Gets Active Class on Refresh
// ============================================

(function() {
  'use strict';
  
  // Prevent multiple initializations
  if (window.RSPageActiveFixInitialized) {
    return;
  }
  window.RSPageActiveFixInitialized = true;
  
  let lastCheckTime = 0;
  const checkDebounce = 2000;
  
  function ensureRSPageActive() {
    // Debounce
    const now = Date.now();
    if (now - lastCheckTime < checkDebounce) {
      return;
    }
    lastCheckTime = now;
    
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    // Check if we're on RS page
    if (path.includes('rencana-strategis') || hash === '#rencana-strategis') {
      const rsPage = document.getElementById('rencana-strategis');
      
      if (rsPage && !rsPage.classList.contains('active')) {
        console.log('🔧 Adding active class to RS page');
        
        // Remove active from all pages
        document.querySelectorAll('.page-content').forEach(page => {
          page.classList.remove('active');
        });
        
        // Add active to RS page
        rsPage.classList.add('active');
        
        // Ensure visibility
        rsPage.style.display = 'block';
        rsPage.style.visibility = 'visible';
        rsPage.style.opacity = '1';
        rsPage.style.pointerEvents = 'auto';
      }
    }
  }
  
  // Run on load
  window.addEventListener('load', ensureRSPageActive);
  
  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureRSPageActive);
  } else {
    ensureRSPageActive();
  }
  
  // Run on navigation events
  window.addEventListener('hashchange', ensureRSPageActive);
  window.addEventListener('popstate', ensureRSPageActive);
  
  // NO MORE setInterval - only event-driven
  
})();
