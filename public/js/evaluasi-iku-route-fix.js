/**
 * Evaluasi IKU Route Fix
 * Ensures /evaluasi-iku page stays on the same page after refresh
 * and doesn't redirect to /dashboard
 */

(function() {
  'use strict';

  const EVALUASI_IKU_PATH = '/evaluasi-iku';
  
  // Check if we're on evaluasi-iku page
  function isEvaluasiIKUPage() {
    const path = window.location.pathname;
    return path === EVALUASI_IKU_PATH || path === '/evaluasi-iku/';
  }

  // Preserve route on page load
  function preserveEvaluasiIKURoute() {
    if (!isEvaluasiIKUPage()) return;

    console.log('🔄 Evaluasi IKU Route Fix: Preserving route on refresh');
    
    // Set flags to prevent redirect
    sessionStorage.setItem('preserveRoute', EVALUASI_IKU_PATH);
    sessionStorage.setItem('preserveRouteTimestamp', Date.now().toString());
    sessionStorage.setItem('preventAutoRedirect', 'true');
    sessionStorage.setItem('currentPage', 'evaluasi-iku');
    
    // Store in localStorage as backup
    localStorage.setItem('lastVisitedPage', 'evaluasi-iku');
    localStorage.setItem('lastVisitedPath', EVALUASI_IKU_PATH);
  }

  // Override navigation to prevent unwanted redirects
  function preventUnwantedRedirect() {
    if (!isEvaluasiIKUPage()) return;

    // Store original navigateToPage
    const originalNavigateToPage = window.navigateToPage;
    
    // Override navigateToPage temporarily
    window.navigateToPage = function(pageName) {
      const currentPath = window.location.pathname;
      
      // If we're on evaluasi-iku and trying to go to dashboard, block it
      if (currentPath === EVALUASI_IKU_PATH && pageName === 'dashboard') {
        const isUserInitiated = sessionStorage.getItem('userInitiatedNavigation') === 'true';
        
        if (!isUserInitiated) {
          console.log('🛑 Evaluasi IKU Route Fix: Blocking automatic redirect to dashboard');
          // Navigate to evaluasi-iku instead
          if (originalNavigateToPage) {
            originalNavigateToPage('evaluasi-iku');
          }
          return;
        }
      }
      
      // Clear the flag
      sessionStorage.removeItem('userInitiatedNavigation');
      
      // Call original function
      if (originalNavigateToPage) {
        originalNavigateToPage(pageName);
      }
    };
  }

  // Ensure page is shown correctly after auth check
  function ensurePageShown() {
    if (!isEvaluasiIKUPage()) return;

    // Wait for DOM and auth to be ready
    const checkAndShow = () => {
      const evaluasiPage = document.getElementById('evaluasi-iku');
      const appScreen = document.getElementById('app-screen');
      
      if (evaluasiPage && appScreen) {
        // Make sure app screen is visible
        appScreen.style.display = 'block';
        appScreen.classList.add('active');
        
        // Hide all pages first
        document.querySelectorAll('.page-content').forEach(page => {
          page.classList.remove('active');
        });
        
        // Show evaluasi-iku page
        evaluasiPage.classList.add('active');
        evaluasiPage.style.display = 'block';
        
        // Update URL if needed
        if (window.location.pathname !== EVALUASI_IKU_PATH) {
          window.history.replaceState({ page: 'evaluasi-iku' }, '', EVALUASI_IKU_PATH);
        }
        
        // Update menu
        updateActiveMenu();
        
        // Initialize module
        initializeEvaluasiIKUModule();
        
        console.log('✅ Evaluasi IKU Route Fix: Page shown successfully');
      }
    };

    // Run immediately and after delays
    checkAndShow();
    setTimeout(checkAndShow, 100);
    setTimeout(checkAndShow, 500);
    setTimeout(checkAndShow, 1000);
  }

  // Update active menu item
  function updateActiveMenu() {
    // Remove active from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active to evaluasi-iku menu item
    const menuItem = document.querySelector('.menu-item[data-page="evaluasi-iku"]');
    if (menuItem) {
      menuItem.classList.add('active');
      
      // Expand parent submenu if exists
      const parentSubmenu = menuItem.closest('.sidebar-submenu');
      if (parentSubmenu) {
        parentSubmenu.classList.add('expanded');
        const section = parentSubmenu.dataset.submenu;
        const toggle = document.querySelector(`.dropdown-toggle[data-section="${section}"]`);
        if (toggle) {
          toggle.classList.add('active');
        }
      }
    }
  }

  // Initialize Evaluasi IKU module
  function initializeEvaluasiIKUModule() {
    // Try different module versions
    if (window.EvaluasiIKUEnhancedV2 && typeof window.EvaluasiIKUEnhancedV2.init === 'function') {
      console.log('🚀 Initializing EvaluasiIKUEnhancedV2');
      window.EvaluasiIKUEnhancedV2.init();
    } else if (window.EvaluasiIKUEnhanced && typeof window.EvaluasiIKUEnhanced.init === 'function') {
      console.log('🚀 Initializing EvaluasiIKUEnhanced');
      window.EvaluasiIKUEnhanced.init();
    } else if (window.EvaluasiIKUModule && typeof window.EvaluasiIKUModule.init === 'function') {
      console.log('🚀 Initializing EvaluasiIKUModule');
      window.EvaluasiIKUModule.init();
    }
  }

  // Listen for auth state changes
  function listenForAuthChanges() {
    if (!isEvaluasiIKUPage()) return;

    // Listen for custom auth events
    document.addEventListener('authStateChanged', (e) => {
      if (e.detail && e.detail.isAuthenticated) {
        console.log('🔐 Auth state changed, ensuring evaluasi-iku page is shown');
        ensurePageShown();
      }
    });

    // Listen for page navigation events
    document.addEventListener('pageChanged', (e) => {
      if (e.detail && e.detail.page === 'evaluasi-iku') {
        initializeEvaluasiIKUModule();
      }
    });
  }

  // Mark user-initiated navigation
  function markUserNavigation() {
    // Add click listeners to menu items
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', () => {
        sessionStorage.setItem('userInitiatedNavigation', 'true');
      });
    });
  }

  // Initialize on DOM ready
  function init() {
    console.log('🔧 Evaluasi IKU Route Fix: Initializing...');
    
    preserveEvaluasiIKURoute();
    preventUnwantedRedirect();
    listenForAuthChanges();
    
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        ensurePageShown();
        markUserNavigation();
      });
    } else {
      ensurePageShown();
      markUserNavigation();
    }
  }

  // Run immediately
  init();

  // Export for debugging
  window.EvaluasiIKURouteFix = {
    isEvaluasiIKUPage,
    ensurePageShown,
    initializeEvaluasiIKUModule
  };

})();
