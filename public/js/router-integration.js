/**
 * Router Integration
 * Updates existing navigation system to use the new router
 */

// Initialize router integration after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Use RouterManager for proper initialization
    initializeRouterIntegration();
});

function initializeRouterIntegration() {
    console.log('🔗 Initializing router integration...');
    
    // Check if already initialized to prevent multiple initializations
    if (window.routerIntegrationInitialized) {
        console.log('✅ Router integration already initialized');
        return;
    }
    
    // Wait for RouterManager to be available
    if (typeof window.RouterManager === 'undefined') {
        console.log('⏳ RouterManager not available, retrying in 100ms...');
        setTimeout(initializeRouterIntegration, 100);
        return;
    }
    
    const routerManager = window.RouterManager.getInstance();
    
    // Register callbacks for router events
    routerManager.onReady((state) => {
        console.log('🎉 Router ready, integrating with navigation...');
        try {
            // Update all menu items to use router navigation
            updateMenuItemsForRouter();
            
            // Update dashboard links to use router
            updateDashboardLinksForRouter();
            
            // Override navigateToPage function to use router
            overrideNavigateToPageFunction();
            
            // Mark as initialized
            window.routerIntegrationInitialized = true;
            
            console.log('✅ Router integration completed successfully');
            
        } catch (error) {
            console.error('❌ Router integration failed:', error);
        }
    });
    
    routerManager.onError((state) => {
        console.warn('⚠️ Router initialization failed, using fallback navigation');
        activateFallbackNavigation();
    });
    
    routerManager.onFallback((state) => {
        console.log('🔄 Router fallback activated, ensuring legacy navigation works');
        activateFallbackNavigation();
    });
    
    // Check if router is already ready
    if (routerManager.isInitialized()) {
        console.log('✅ Router already initialized, proceeding with integration');
        routerManager.onReady(() => {}); // Trigger callback immediately
    }
}

/**
 * Activate fallback navigation when router is not available
 */
function activateFallbackNavigation() {
    console.log('🔄 Activating fallback navigation system...');
    
    // Ensure legacy navigation functions work
    if (typeof window.originalNavigateToPage === 'function') {
        window.navigateToPage = window.originalNavigateToPage;
        console.log('✅ Legacy navigateToPage function restored');
    } else {
        // Create basic fallback navigation
        window.navigateToPage = function(pageName) {
            console.log(`📄 Fallback navigation to: ${pageName}`);
            
            // Basic page switching logic
            const pages = document.querySelectorAll('.page-content');
            pages.forEach(page => {
                page.classList.remove('active');
            });
            
            const targetPage = document.getElementById(pageName);
            if (targetPage) {
                targetPage.classList.add('active');
                updateActiveMenuItem(pageName);
            } else {
                console.warn(`⚠️ Page not found: ${pageName}`);
            }
        };
        console.log('✅ Basic fallback navigation created');
    }
    
    // Update menu items for fallback navigation
    updateMenuItemsForFallback();
    
    // Mark integration as initialized even in fallback mode
    window.routerIntegrationInitialized = true;
    
    console.log('✅ Fallback navigation system activated');
}

/**
 * Update menu items for fallback navigation
 */
function updateMenuItemsForFallback() {
    console.log('🔄 Updating menu items for fallback navigation...');
    
    const menuItems = document.querySelectorAll('.menu-item[data-page]');
    
    menuItems.forEach(item => {
        const pageName = item.getAttribute('data-page');
        
        // Remove any existing click handlers
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // Add fallback click handler
        newItem.addEventListener('click', function(e) {
            e.preventDefault();
            
            console.log(`🧭 Fallback navigation to: ${pageName}`);
            
            if (typeof window.navigateToPage === 'function') {
                window.navigateToPage(pageName);
            } else {
                console.error('❌ No navigation function available');
            }
        });
        
        console.log(`✅ Updated menu item for fallback: ${pageName}`);
    });
    
    console.log(`🔄 Updated ${menuItems.length} menu items for fallback`);
}
/**
 * Update all menu items to use router navigation
 */
function updateMenuItemsForRouter() {
    console.log('🔄 Updating menu items for router navigation...');
    
    const menuItems = document.querySelectorAll('.menu-item[data-page]');
    
    menuItems.forEach(item => {
        const pageName = item.getAttribute('data-page');
        const url = getUrlForPage(pageName);
        
        if (url && url !== '/404') {
            // Update href attribute
            item.setAttribute('href', url);
            
            // Remove old onclick handler
            item.removeAttribute('onclick');
            
            // Clone node to remove all existing event listeners
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            // Add new click event listener with proper handling
            newItem.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log(`🧭 Router navigation to ${url} (${pageName})`);
                
                // Prevent double-clicks
                if (newItem.classList.contains('navigating')) {
                    console.log('⚠️ Navigation already in progress, ignoring click');
                    return;
                }
                
                // Mark as navigating
                newItem.classList.add('navigating');
                
                try {
                    if (window.appRouter) {
                        window.appRouter.navigate(url);
                    } else {
                        console.error('Router not available, falling back to legacy navigation');
                        if (typeof window.navigateToPage === 'function') {
                            window.navigateToPage(pageName);
                        }
                    }
                } catch (error) {
                    console.error('❌ Navigation error:', error);
                } finally {
                    // Remove navigating class after delay
                    setTimeout(() => {
                        newItem.classList.remove('navigating');
                    }, 500);
                }
            });
            
            console.log(`✅ Updated menu item: ${pageName} -> ${url}`);
        } else {
            console.warn(`⚠️ No URL mapping found for page: ${pageName}`);
        }
    });
    
    console.log(`🔄 Updated ${menuItems.length} menu items`);
}

/**
 * Update dashboard links to use router navigation
 */
function updateDashboardLinksForRouter() {
    console.log('🔄 Updating dashboard links for router navigation...');
    
    // Update links in dashboard that use navigateToPage
    const dashboardLinks = document.querySelectorAll('a[onclick*="navigateToPage"]');
    
    dashboardLinks.forEach(link => {
        const onclickAttr = link.getAttribute('onclick');
        const pageNameMatch = onclickAttr.match(/navigateToPage\\('([^']+)'\\)/);
        
        if (pageNameMatch) {
            const pageName = pageNameMatch[1];
            const url = getUrlForPage(pageName);
            
            if (url && url !== '/404') {
                // Update href and onclick
                link.setAttribute('href', url);
                link.removeAttribute('onclick');
                
                // Add click event listener
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    if (window.appRouter) {
                        window.appRouter.navigate(url);
                    } else {
                        navigateToPage(pageName);
                    }
                });
                
                console.log(`✅ Updated dashboard link: ${pageName} -> ${url}`);
            }
        }
    });
}

/**
 * Override navigateToPage function to use router when available
 */
function overrideNavigateToPageFunction() {
    console.log('🔄 Overriding navigateToPage function...');
    
    // Store original function if not already stored
    if (!window.originalNavigateToPage && typeof window.navigateToPage === 'function') {
        window.originalNavigateToPage = window.navigateToPage;
    }
    
    // Override with router-aware version
    window.navigateToPage = function(pageName) {
        console.log(`📄 navigateToPage called with: ${pageName}`);
        
        // Prevent navigation loops - if we're already on the target page, skip
        const currentPath = window.location.pathname;
        const targetUrl = getUrlForPage(pageName);
        
        if (currentPath === targetUrl) {
            console.log(`⚠️ Already on target page ${pageName} (${targetUrl}), skipping navigation`);
            return;
        }
        
        // If router is available, use it
        if (window.appRouter && typeof window.getUrlForPage === 'function') {
            const url = getUrlForPage(pageName);
            
            if (url && url !== '/404') {
                console.log(`🧭 Using router navigation: ${pageName} -> ${url}`);
                
                // Prevent login loops
                if (url === '/login' && currentPath === '/login') {
                    console.log('⚠️ Already on login page, skipping navigation');
                    return;
                }
                
                window.appRouter.navigate(url);
                return;
            }
        }
        
        // Fallback to original function
        console.log(`🔄 Falling back to original navigation for: ${pageName}`);
        if (window.originalNavigateToPage) {
            window.originalNavigateToPage(pageName);
        } else {
            console.warn(`⚠️ No fallback navigation available for: ${pageName}`);
        }
    };
    
    console.log('✅ navigateToPage function overridden');
}

/**
 * Handle successful login and navigate to intended route
 */
function handleLoginSuccess() {
    console.log('🔐 Handling login success with router...');
    
    // Check if there's an intended route stored
    const intendedRoute = sessionStorage.getItem('intendedRoute');
    
    if (intendedRoute && intendedRoute !== '/login') {
        console.log(`🧭 Navigating to intended route: ${intendedRoute}`);
        sessionStorage.removeItem('intendedRoute');
        
        if (window.appRouter) {
            window.appRouter.navigate(intendedRoute);
        } else {
            // Fallback to page name navigation
            const pageName = getPageNameForUrl(intendedRoute);
            if (pageName && pageName !== '404') {
                navigateToPage(pageName);
            } else {
                navigateToPage('dashboard');
            }
        }
    } else {
        console.log('🧭 Navigating to default dashboard');
        
        if (window.appRouter) {
            window.appRouter.navigate('/dashboard');
        } else {
            navigateToPage('dashboard');
        }
    }
}

/**
 * Handle logout and clear router state
 */
function handleLogout() {
    console.log('🚪 Handling logout with router...');
    
    // Clear router state
    try {
        sessionStorage.removeItem('routerState');
        sessionStorage.removeItem('intendedRoute');
        console.log('✅ Router state cleared');
    } catch (error) {
        console.warn('⚠️ Failed to clear router state:', error);
    }
    
    // Navigate to login page
    if (window.appRouter) {
        window.appRouter.navigate('/login', true);
    } else {
        // Fallback to page reload
        window.location.href = '/login';
    }
}

/**
 * Update active menu item based on current route
 */
function updateActiveMenuItem(pageName) {
    console.log(`🎯 Updating active menu item: ${pageName}`);
    
    // Remove active class from all menu items
    const allMenuItems = document.querySelectorAll('.menu-item');
    allMenuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current menu item
    const currentMenuItem = document.querySelector(`.menu-item[data-page="${pageName}"]`);
    if (currentMenuItem) {
        currentMenuItem.classList.add('active');
        
        // If it's in a submenu, also activate the parent section
        const parentSubmenu = currentMenuItem.closest('.sidebar-submenu');
        if (parentSubmenu) {
            const parentButton = parentSubmenu.previousElementSibling;
            if (parentButton && parentButton.classList.contains('sidebar-section-toggle')) {
                parentButton.classList.add('active');
                parentSubmenu.classList.add('show');
            }
        }
        
        console.log(`✅ Activated menu item: ${pageName}`);
    } else {
        console.warn(`⚠️ Menu item not found: ${pageName}`);
    }
}

/**
 * Handle route changes to update UI
 */
function handleRouteChange(route) {
    if (route && route.route && route.route.handler) {
        const pageName = route.route.handler;
        updateActiveMenuItem(pageName);
    }
}

// Export functions for use by router
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateActiveMenuItem,
        handleRouteChange,
        handleLoginSuccess,
        handleLogout
    };
} else {
    // Browser environment
    window.updateActiveMenuItem = updateActiveMenuItem;
    window.handleRouteChange = handleRouteChange;
    window.handleLoginSuccess = handleLoginSuccess;
    window.handleLogout = handleLogout;
    
    // Make router integration available globally
    window.routerIntegration = {
        initializeRouterIntegration,
        updateActiveMenuItem,
        handleRouteChange,
        handleLoginSuccess,
        handleLogout
    };
}

console.log('📦 Router integration module loaded');