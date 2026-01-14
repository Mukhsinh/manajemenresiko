/**
 * Route Preservation Fix - CRITICAL
 * Prevents unwanted redirects to /dashboard on page refresh
 * Must be loaded EARLY in the page lifecycle
 */

(function() {
  'use strict';

  // Run immediately on script load
  const currentPath = window.location.pathname;
  
  // Skip if on root, login, or dashboard
  if (currentPath === '/' || currentPath === '/login' || currentPath === '/dashboard') {
    return;
  }

  console.log('🔒 Route Preservation: Protecting route:', currentPath);

  // Store current path immediately - USE SAME KEYS AS app.js expects
  const now = Date.now();
  
  // Save to multiple storage locations for redundancy
  // These are the keys that app.js checkAuth() function checks
  sessionStorage.setItem('preserveRoute', currentPath);
  sessionStorage.setItem('preserveRouteTimestamp', now.toString());
  sessionStorage.setItem('preventAutoRedirect', 'true');
  sessionStorage.setItem('currentPage', currentPath.replace(/^\//, ''));
  
  // Also set the protected route keys for route-preservation-fix internal use
  sessionStorage.setItem('protectedRoute', currentPath);
  sessionStorage.setItem('protectedRouteTimestamp', now.toString());
  sessionStorage.setItem('preventDashboardRedirect', 'true');
  
  // Backup in localStorage
  localStorage.setItem('lastRoute', currentPath);
  localStorage.setItem('lastVisitedPage', currentPath.replace(/^\//, ''));
  localStorage.setItem('lastVisitedPath', currentPath);

  // Override navigateToPage BEFORE it's defined
  const originalNavigateToPage = window.navigateToPage;
  
  Object.defineProperty(window, 'navigateToPage', {
    get: function() {
      return function(pageName) {
        const protectedRoute = sessionStorage.getItem('protectedRoute') || sessionStorage.getItem('preserveRoute');
        const preventRedirect = sessionStorage.getItem('preventDashboardRedirect') === 'true' || 
                               sessionStorage.getItem('preventAutoRedirect') === 'true';
        const timestamp = parseInt(sessionStorage.getItem('protectedRouteTimestamp') || 
                                  sessionStorage.getItem('preserveRouteTimestamp') || '0');
        const isRecent = (Date.now() - timestamp) < 15000; // 15 second window

        // Block automatic dashboard redirects when we have a protected route
        if (pageName === 'dashboard' && protectedRoute && preventRedirect && isRecent) {
          const expectedPage = protectedRoute.replace(/^\//, '');
          console.log('🛑 Route Preservation: Blocking redirect to dashboard, navigating to:', expectedPage);
          
          // Clear the protection after use
          sessionStorage.removeItem('preventDashboardRedirect');
          sessionStorage.removeItem('preventAutoRedirect');
          
          // Navigate to the protected route instead
          if (typeof originalNavigateToPage === 'function') {
            return originalNavigateToPage(expectedPage);
          } else if (window._originalNavigateToPage) {
            return window._originalNavigateToPage(expectedPage);
          }
          return;
        }

        // Clear protection on user-initiated navigation
        if (pageName !== 'dashboard') {
          sessionStorage.removeItem('preventDashboardRedirect');
          sessionStorage.removeItem('preventAutoRedirect');
          sessionStorage.removeItem('protectedRoute');
          sessionStorage.removeItem('preserveRoute');
        }

        // Call original function
        if (typeof originalNavigateToPage === 'function') {
          return originalNavigateToPage(pageName);
        } else if (window._originalNavigateToPage) {
          return window._originalNavigateToPage(pageName);
        }
      };
    },
    set: function(fn) {
      window._originalNavigateToPage = fn;
    },
    configurable: true
  });

  // Also intercept history.pushState and replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(state, title, url) {
    const protectedRoute = sessionStorage.getItem('protectedRoute') || sessionStorage.getItem('preserveRoute');
    const preventRedirect = sessionStorage.getItem('preventDashboardRedirect') === 'true' || 
                           sessionStorage.getItem('preventAutoRedirect') === 'true';
    
    if (url === '/dashboard' && protectedRoute && preventRedirect) {
      console.log('🛑 Route Preservation: Blocking pushState to /dashboard');
      return originalPushState.call(this, state, title, protectedRoute);
    }
    return originalPushState.call(this, state, title, url);
  };

  history.replaceState = function(state, title, url) {
    const protectedRoute = sessionStorage.getItem('protectedRoute') || sessionStorage.getItem('preserveRoute');
    const preventRedirect = sessionStorage.getItem('preventDashboardRedirect') === 'true' || 
                           sessionStorage.getItem('preventAutoRedirect') === 'true';
    
    if (url === '/dashboard' && protectedRoute && preventRedirect) {
      console.log('🛑 Route Preservation: Blocking replaceState to /dashboard');
      return originalReplaceState.call(this, state, title, protectedRoute);
    }
    return originalReplaceState.call(this, state, title, url);
  };

  // Ensure correct page is shown after DOM loads
  function ensureCorrectPage() {
    const protectedRoute = sessionStorage.getItem('protectedRoute') || sessionStorage.getItem('preserveRoute');
    if (!protectedRoute) return;

    const pageName = protectedRoute.replace(/^\//, '');
    const pageElement = document.getElementById(pageName);
    
    if (pageElement) {
      console.log('✅ Route Preservation: Ensuring page is visible:', pageName);
      
      // Hide all pages
      document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
      });

      // Show correct page
      pageElement.classList.add('active');
      pageElement.style.display = 'block';

      // Update URL if needed
      if (window.location.pathname !== protectedRoute) {
        history.replaceState({ page: pageName }, '', protectedRoute);
      }

      // Update menu
      document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
      });
      const menuItem = document.querySelector(`.menu-item[data-page="${pageName}"]`);
      if (menuItem) {
        menuItem.classList.add('active');
        // Expand parent submenu
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
  }

  // Run on various events
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(ensureCorrectPage, 100);
      setTimeout(ensureCorrectPage, 500);
      setTimeout(ensureCorrectPage, 1000);
      setTimeout(ensureCorrectPage, 2000);
    });
  } else {
    setTimeout(ensureCorrectPage, 100);
    setTimeout(ensureCorrectPage, 500);
    setTimeout(ensureCorrectPage, 1000);
    setTimeout(ensureCorrectPage, 2000);
  }

  // Clear protection after 15 seconds
  setTimeout(() => {
    sessionStorage.removeItem('preventDashboardRedirect');
    sessionStorage.removeItem('preventAutoRedirect');
    console.log('🔓 Route Preservation: Protection expired');
  }, 15000);

  // Export for debugging
  window.RoutePreservation = {
    getProtectedRoute: () => sessionStorage.getItem('protectedRoute') || sessionStorage.getItem('preserveRoute'),
    isProtected: () => sessionStorage.getItem('preventDashboardRedirect') === 'true' || 
                      sessionStorage.getItem('preventAutoRedirect') === 'true',
    clearProtection: () => {
      sessionStorage.removeItem('protectedRoute');
      sessionStorage.removeItem('preserveRoute');
      sessionStorage.removeItem('preventDashboardRedirect');
      sessionStorage.removeItem('preventAutoRedirect');
    }
  };

  console.log('✅ Route Preservation: Initialized for', currentPath);
})();
