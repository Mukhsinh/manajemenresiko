/**
 * Route Preserve Fix - CRITICAL
 * Prevents automatic redirect to /dashboard on page refresh
 * Must be loaded EARLY in the page lifecycle (BEFORE app.js)
 * 
 * Version: 2.0
 * Date: 2026-01-14
 */

(function() {
  'use strict';

  var currentPath = window.location.pathname;
  
  if (currentPath === '/' || currentPath === '/login' || currentPath.includes('/auth')) {
    console.log('Route Preserve Fix: Skipping for auth/login path');
    return;
  }

  console.log('Route Preserve Fix v2.0: Locking route -', currentPath);

  var routeData = {
    path: currentPath,
    timestamp: Date.now(),
    pageName: currentPath.replace(/^\//, '') || 'dashboard'
  };

  sessionStorage.setItem('preserveRoute', currentPath);
  sessionStorage.setItem('preserveRouteTimestamp', routeData.timestamp.toString());
  sessionStorage.setItem('preventAutoRedirect', 'true');
  sessionStorage.setItem('currentPageLock', routeData.pageName);
  sessionStorage.setItem('routeLockData', JSON.stringify(routeData));
  sessionStorage.setItem('currentPage', routeData.pageName);
  sessionStorage.setItem('navigationTimestamp', routeData.timestamp.toString());
  
  localStorage.setItem('lastKnownRoute', currentPath);
  localStorage.setItem('lastKnownPage', routeData.pageName);

  var originalNavigateToPage = null;
  
  var interceptNavigateToPage = function(pageName) {
    var lockData = sessionStorage.getItem('routeLockData');
    var preventRedirect = sessionStorage.getItem('preventAutoRedirect');
    
    if (lockData && preventRedirect === 'true') {
      try {
        var data = JSON.parse(lockData);
        var timeSinceLock = Date.now() - data.timestamp;
        
        if (timeSinceLock < 10000) {
          if (pageName === 'dashboard' && data.pageName !== 'dashboard') {
            console.log('Route Preserve Fix: Blocking redirect to dashboard, staying on', data.pageName);
            
            if (originalNavigateToPage) {
              sessionStorage.removeItem('preventAutoRedirect');
              originalNavigateToPage(data.pageName);
              return;
            }
            return;
          }
        }
      } catch (e) {
        console.warn('Route lock parse error:', e);
      }
    }
    
    if (originalNavigateToPage) {
      originalNavigateToPage(pageName);
    }
  };

  var watchInterval = setInterval(function() {
    if (typeof window.navigateToPage === 'function' && !originalNavigateToPage) {
      originalNavigateToPage = window.navigateToPage;
      window.navigateToPage = interceptNavigateToPage;
      console.log('Route Preserve Fix: Interceptor installed');
      clearInterval(watchInterval);
    }
  }, 50);
  
  setTimeout(function() {
    clearInterval(watchInterval);
  }, 5000);

  document.addEventListener('DOMContentLoaded', function() {
    var lockData = sessionStorage.getItem('routeLockData');
    if (!lockData) return;

    try {
      var data = JSON.parse(lockData);
      var timeSinceLock = Date.now() - data.timestamp;
      
      if (timeSinceLock > 15000) {
        sessionStorage.removeItem('routeLockData');
        sessionStorage.removeItem('preventAutoRedirect');
        return;
      }

      console.log('Route Preserve Fix: Ensuring page', data.pageName, 'is shown');

      var forceIntervals = [100, 300, 500, 1000, 2000, 3000];
      forceIntervals.forEach(function(delay) {
        setTimeout(function() {
          forceShowPage(data.pageName);
        }, delay);
      });

      setTimeout(function() {
        sessionStorage.removeItem('routeLockData');
        sessionStorage.removeItem('preventAutoRedirect');
        console.log('Route Preserve Fix: Lock released');
      }, 5000);

    } catch (e) {
      console.warn('Route lock error:', e);
    }
  });

  function forceShowPage(pageName) {
    var activePage = document.querySelector('.page-content.active');
    if (activePage && activePage.id === pageName) {
      return;
    }

    console.log('Route Preserve Fix: Forcing page display:', pageName);

    document.querySelectorAll('.page-content').forEach(function(page) {
      page.classList.remove('active');
      page.style.display = 'none';
    });

    var targetPage = document.getElementById(pageName);
    if (targetPage) {
      targetPage.classList.add('active');
      targetPage.style.display = 'block';
      targetPage.style.visibility = 'visible';
      targetPage.style.opacity = '1';
      
      if (window.location.pathname !== '/' + pageName) {
        window.history.replaceState({ page: pageName }, '', '/' + pageName);
      }

      updateMenu(pageName);
      initPageModule(pageName);
    }
  }

  function updateMenu(pageName) {
    document.querySelectorAll('.menu-item').forEach(function(item) {
      item.classList.remove('active');
    });

    var menuItem = document.querySelector('.menu-item[data-page="' + pageName + '"]');
    if (menuItem) {
      menuItem.classList.add('active');
      
      var submenu = menuItem.closest('.sidebar-submenu');
      if (submenu) {
        submenu.classList.add('expanded');
        
        var section = submenu.dataset.submenu;
        var toggle = document.querySelector('.dropdown-toggle[data-section="' + section + '"]');
        if (toggle) {
          toggle.classList.add('active');
          var chevron = toggle.querySelector('.dropdown-icon');
          if (chevron) {
            chevron.classList.remove('fa-chevron-down');
            chevron.classList.add('fa-chevron-up');
          }
        }
      }
    }
  }

  function initPageModule(pageName) {
    var moduleMap = {
      'evaluasi-iku': ['EvaluasiIKUEnhancedV2', 'EvaluasiIKUEnhanced', 'EvaluasiIKUModule'],
      'indikator-kinerja-utama': ['indikatorKinerjaUtamaModule'],
      'analisis-swot': ['analisisSwotModule'],
      'diagram-kartesius': ['diagramKartesiusModule'],
      'sasaran-strategi': ['sasaranStrategiModule'],
      'strategic-map': ['strategicMapModule'],
      'monitoring-evaluasi': ['monitoringEvaluasiModule'],
      'peluang': ['peluangModule'],
      'risk-profile': ['riskProfileModule'],
      'risk-register': ['riskRegisterModule'],
      'residual-risk': ['residualRiskModule'],
      'kri': ['kriModule'],
      'laporan': ['laporanModule'],
      'dashboard': ['dashboardModule'],
      'visi-misi': ['visiMisiModule'],
      'rencana-strategis': ['rencanaStrategisModule'],
      'matriks-tows': ['matriksTowsModule'],
      'risk-input': ['riskInputModule'],
      'master-data': ['masterDataModule'],
      'buku-pedoman': ['bukuPedomanModule'],
      'pengaturan': ['pengaturanModule']
    };

    var modules = moduleMap[pageName];
    if (!modules) return;

    for (var i = 0; i < modules.length; i++) {
      var moduleName = modules[i];
      var module = window[moduleName];
      if (module) {
        if (typeof module.init === 'function') {
          try {
            module.init();
            return;
          } catch (e) {
            console.warn('Module init error:', moduleName, e);
          }
        } else if (typeof module.load === 'function') {
          try {
            module.load();
            return;
          } catch (e) {
            console.warn('Module load error:', moduleName, e);
          }
        }
      }
    }
  }

  window.addEventListener('popstate', function(event) {
    var path = window.location.pathname;
    if (path && path !== '/' && path !== '/login') {
      var pageName = path.replace(/^\//, '');
      forceShowPage(pageName);
    }
  });

})();
