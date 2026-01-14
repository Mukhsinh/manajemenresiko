
/**
 * NAVIGATION OVERRIDE - ENHANCED
 * Ensures proper page display without refresh
 * Created: December 28, 2025
 */

(function() {
  'use strict';
  
  console.log('🧭 Loading Enhanced Navigation Override...');
  
  // Store original navigation function
  const originalNavigateToPage = window.navigateToPage;
  
  // Enhanced navigation function
  window.navigateToPage = async function(pageName, options = {}) {
    console.log(`🚀 Enhanced Navigation to: ${pageName}`);
    
    const {
      skipHistory = false,
      forceReload = false,
      preventRouterConflict = true
    } = options;
    
    try {
      // Prevent router conflicts
      if (preventRouterConflict && window.appRouter) {
        console.log('⏸️ Temporarily disabling router to prevent conflicts');
        if (typeof window.appRouter.pauseNavigation === 'function') {
          window.appRouter.pauseNavigation();
        }
      }
      
      // Store navigation state
      sessionStorage.setItem('currentPage', pageName);
      sessionStorage.setItem('navigationTimestamp', Date.now().toString());
      
      // Hide all pages first
      document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
      });
      
      // Show target page immediately
      const targetPage = document.getElementById(pageName);
      if (targetPage) {
        targetPage.classList.add('active');
        
        // Force reflow to ensure visibility
        targetPage.offsetHeight;
        
        // Mark as stable
        targetPage.setAttribute('data-navigation-stable', 'true');
        targetPage.setAttribute('data-navigation-timestamp', Date.now().toString());
        
        console.log(`✅ Page ${pageName} is now visible`);
      } else {
        console.error(`❌ Page element not found: ${pageName}`);
        throw new Error(`Page element not found: ${pageName}`);
      }
      
      // Update menu items
      document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
          item.classList.add('active');
        }
      });
      
      // Initialize page with enhanced system
      if (window.PageInitializationSystem) {
        console.log(`📄 Initializing page with enhanced system: ${pageName}`);
        await window.PageInitializationSystem.initializePage(pageName, forceReload);
      } else {
        // Fallback to original page loading
        console.log(`🔄 Fallback to original page loading: ${pageName}`);
        if (originalNavigateToPage) {
          originalNavigateToPage.call(this, pageName);
        } else {
          // Basic page loading
          loadPageDataBasic(pageName);
        }
      }
      
      // Update page title
      updatePageTitle(pageName);
      
      // Re-enable router after delay
      if (preventRouterConflict && window.appRouter) {
        setTimeout(() => {
          if (typeof window.appRouter.resumeNavigation === 'function') {
            window.appRouter.resumeNavigation();
          }
          console.log('▶️ Router navigation re-enabled');
        }, 500);
      }
      
      console.log(`✅ Enhanced navigation to ${pageName} completed`);
      
    } catch (error) {
      console.error(`❌ Enhanced navigation error for ${pageName}:`, error);
      
      // Fallback to original navigation
      if (originalNavigateToPage) {
        console.log('🔄 Falling back to original navigation');
        originalNavigateToPage.call(this, pageName);
      } else {
        // Show error
        showNavigationError(pageName, error);
      }
    }
  };
  
  /**
   * Basic page data loading (fallback)
   */
  function loadPageDataBasic(pageName) {
    console.log(`📄 Basic page loading for: ${pageName}`);
    
    switch(pageName) {
      case 'rencana-strategis':
        // Try multiple module aliases
        if (window.RencanaStrategisModule?.load) {
          window.RencanaStrategisModule.load();
        } else if (window.RencanaStrategisUnified?.load) {
          window.RencanaStrategisUnified.load();
        } else if (window.RSCore?.load) {
          window.RSCore.load();
        } else {
          console.warn('No RS module available for basic loading');
        }
        break;
        
      case 'dashboard':
        if (window.dashboardModule?.loadDashboard) {
          window.dashboardModule.loadDashboard();
        }
        break;
        
      default:
        console.log(`ℹ️ No specific loading for: ${pageName}`);
        break;
    }
  }
  
  /**
   * Show navigation error
   */
  function showNavigationError(pageName, error) {
    const pageElement = document.getElementById(pageName);
    if (pageElement) {
      pageElement.innerHTML = `
        <div class="container-fluid p-4">
          <div class="alert alert-danger" role="alert">
            <h4><i class="fas fa-exclamation-triangle"></i> Navigation Error</h4>
            <p>Terjadi kesalahan saat navigasi ke halaman ${pageName}.</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <button onclick="location.reload()" class="btn btn-primary">
              <i class="fas fa-sync"></i> Refresh Halaman
            </button>
          </div>
        </div>
      `;
    }
  }
  
  /**
   * Update page title
   */
  function updatePageTitle(pageName) {
    const titles = {
      'dashboard': 'Dashboard',
      'rencana-strategis': 'Rencana Strategis',
      'analisis-swot': 'Analisis SWOT',
      'visi-misi': 'Visi & Misi'
    };
    
    const title = titles[pageName] || pageName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    document.title = `${title} - Aplikasi Manajemen Risiko`;
  }
  
  console.log('✅ Enhanced Navigation Override loaded');
  
})();
