// Main Application Logic
let currentUser = null;
let currentRiskId = null;
let kopSettingsCache = null;

// Check authentication on load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded - Initializing app...');
    
    // Initialize router FIRST before anything else
    initializeRouter();
    
    // Wait for config and Supabase to be loaded
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase library not loaded. Please check script tags in HTML.');
        return;
    }
    
    console.log('Supabase library loaded, waiting for client initialization...');
    
    // Wait for config to load
    let retries = 0;
    const maxRetries = 10;
    while (!window.supabaseClient && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
        console.log(`Waiting for Supabase client... attempt ${retries}`);
    }
    
    if (!window.supabaseClient) {
        console.error('Failed to initialize Supabase client. Please check configuration.');
        return;
    }
    
    console.log('Supabase client initialized, checking auth...');
    
    // CRITICAL: Setup event listeners FIRST, before checkAuth
    // This ensures login form handler is attached even if checkAuth fails or returns early
    setupEventListeners();
    console.log('✅ Event listeners setup complete');
    
    try {
        await checkAuth();
        console.log('App initialization complete');
    } catch (error) {
        console.error('Error initializing app:', error);
        // Even if checkAuth fails, we still want event listeners attached
    }
});

// Initialize router
async function initializeRouter() {
    console.log('🗺️ Initializing router with RouterManager...');
    
    // Wait for RouterManager to be available
    if (typeof window.RouterManager === 'undefined') {
        console.log('⏳ RouterManager not available yet, retrying in 100ms...');
        setTimeout(initializeRouter, 100);
        return;
    }
    
    try {
        const startTime = Date.now();
        const routerManager = window.RouterManager.getInstance();
        
        // Initialize router with timing measurement
        const success = await routerManager.initialize();
        const initTime = Date.now() - startTime;
        
        if (success) {
            console.log(`✅ Router initialized successfully in ${initTime}ms`);
            
            // Fix legacy URL if currently on /auth/login
            const currentPath = window.location.pathname;
            if (currentPath === '/auth/login' || currentPath.includes('/auth/login')) {
                console.log('🔄 Detected legacy URL, will redirect after authentication check');
                // Don't redirect immediately, let authentication check handle it
            }
            
        } else {
            console.warn('⚠️ Router initialization failed, fallback navigation active');
        }
        
    } catch (error) {
        console.error('❌ Router initialization error:', error);
        // Don't retry here - RouterManager handles retries internally
    }
}

async function checkAuth() {
    try {
        console.log('🔍 Checking authentication...');
        
        // Wait for Supabase client
        let client = null;
        try {
            client = await window.SupabaseClientManager.waitForClient(5000);
        } catch (e) {
            console.warn('Supabase client not ready');
            showLogin();
            return;
        }
        
        // Get current session
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error) {
            console.error('Session error:', error);
            showLogin();
            return;
        }
        
        if (session && session.user) {
            console.log('✅ User authenticated:', session.user.email);
            
            // Update global state
            currentUser = session.user;
            window.currentUser = session.user;
            window.currentSession = session;
            window.isAuthenticated = true;
            
            // Update auth state manager
            if (window.authStateManager) {
                window.authStateManager.updateState(true, session.user, session);
            }
            
            // Show app
            showApp();
            
            // Navigate to appropriate page - respect preserved routes from refresh
            const currentPath = window.location.pathname;
            const preserveRoute = sessionStorage.getItem('preserveRoute');
            const preserveTimestamp = sessionStorage.getItem('preserveRouteTimestamp');
            const preventAutoRedirect = sessionStorage.getItem('preventAutoRedirect');
            const now = Date.now();
            
            // CRITICAL: Check if we should preserve the route (from refresh)
            // Extended list of pages that should be preserved on refresh
            const preservablePages = [
                '/evaluasi-iku', '/indikator-kinerja-utama', '/strategic-map',
                '/sasaran-strategi', '/analisis-swot', '/diagram-kartesius',
                '/matriks-tows', '/rencana-strategis', '/visi-misi',
                '/risk-input', '/risk-profile', '/risk-register', '/residual-risk',
                '/monitoring-evaluasi', '/peluang', '/kri', '/ews',
                '/laporan', '/buku-pedoman', '/master-data', '/pengaturan'
            ];
            
            const isPreservablePage = preservablePages.some(p => currentPath.startsWith(p));
            
            // Check if we should preserve the route
            const shouldPreserveRoute = (preserveRoute && 
                                       preserveTimestamp && 
                                       (now - parseInt(preserveTimestamp)) < 10000 && 
                                       preserveRoute === currentPath) ||
                                       preventAutoRedirect === 'true' ||
                                       isPreservablePage;
            
            if (shouldPreserveRoute && currentPath !== '/' && currentPath !== '/login') {
                console.log('🔄 Preserving route from refresh during auth:', currentPath);
                // Clear the preservation flags
                sessionStorage.removeItem('preserveRoute');
                sessionStorage.removeItem('preserveRouteTimestamp');
                sessionStorage.removeItem('preventAutoRedirect');
                
                // Navigate to the preserved route
                const pageName = currentPath.replace(/^\//, '') || 'dashboard';
                console.log('🧭 Navigating to preserved page:', pageName);
                navigateToPage(pageName);
            } else if (currentPath === '/' || currentPath === '/login' || currentPath.includes('/auth/login')) {
                // Only redirect to dashboard for root, login, or auth paths
                navigateToPage('dashboard');
            } else {
                // For all other paths, try to navigate to the current path
                const pageName = currentPath.replace(/^\//, '') || 'dashboard';
                console.log('🧭 Navigating to current path after auth:', pageName);
                navigateToPage(pageName);
            }
            
            // Load user data in background (non-blocking)
            loadUserData().catch(err => console.warn('User data error:', err));
            loadKopHeaderSafe();
            
        } else {
            console.log('❌ No active session');
            window.isAuthenticated = false;
            window.currentUser = null;
            window.currentSession = null;
            
            if (window.authStateManager) {
                window.authStateManager.clearState(false); // Don't force - let it validate
            }
            
            showLogin();
        }
    } catch (error) {
        console.error('❌ Auth check error:', error);
        showLogin();
    }
}

function showLogin() {
    console.log('🔐 Showing login screen...');
    
    // Set global authentication state
    window.isAuthenticated = false;
    window.currentUser = null;
    window.currentSession = null;
    
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    
    // Show login screen
    if (loginScreen) {
        loginScreen.style.display = 'flex';
        loginScreen.style.visibility = 'visible';
        loginScreen.style.opacity = '1';
        loginScreen.style.zIndex = '1000';
        loginScreen.setAttribute('aria-hidden', 'false');
        console.log('✅ Login screen shown');
    } else {
        console.error('❌ Login screen element not found!');
    }
    
    // Hide app screen
    if (appScreen) {
        appScreen.style.display = 'none';
        appScreen.style.visibility = 'hidden';
        appScreen.style.opacity = '0';
        appScreen.setAttribute('aria-hidden', 'true');
        console.log('✅ App screen hidden');
    }
    
    // Clear any cached data
    kopSettingsCache = null;
    const kopHeader = document.getElementById('kop-header');
    if (kopHeader) kopHeader.classList.add('hidden');

    // Destroy chat widget if exists
    if (window.chatWidget) {
        try {
            window.chatWidget.destroy();
        } catch (error) {
            console.warn('Error destroying chat widget:', error);
        }
    }
    
    // Update document body class
    document.body.classList.remove('app-mode');
    document.body.classList.add('login-mode');
    
    // Clear any error messages and reset form
    const messageEl = document.getElementById('auth-message');
    if (messageEl) {
        messageEl.textContent = '';
        messageEl.className = 'message';
        messageEl.style.display = 'none';
    }
    
    // Reset login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.reset();
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Masuk</span>';
        }
    }
    
    console.log('✅ Login screen setup completed');
}

function showApp() {
    console.log('🚀 Showing app screen...');
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    
    // Set global authentication state
    window.isAuthenticated = true;
    
    // Hide login screen with multiple methods
    if (loginScreen) {
        loginScreen.style.display = 'none';
        loginScreen.style.visibility = 'hidden';
        loginScreen.style.opacity = '0';
        loginScreen.style.zIndex = '-1';
        loginScreen.setAttribute('aria-hidden', 'true');
        console.log('✅ Login screen hidden with multiple methods');
        
        // Verify it's actually hidden
        const computedStyle = window.getComputedStyle(loginScreen);
        if (computedStyle.display !== 'none') {
            console.warn('⚠️ Login screen still visible, using !important styles...');
            loginScreen.style.setProperty('display', 'none', 'important');
            loginScreen.style.setProperty('visibility', 'hidden', 'important');
        }
    } else {
        console.error('❌ Login screen element not found!');
    }
    
    // Show app screen with multiple methods
    if (appScreen) {
        appScreen.style.display = 'block';
        appScreen.style.visibility = 'visible';
        appScreen.style.opacity = '1';
        appScreen.style.zIndex = '1';
        appScreen.setAttribute('aria-hidden', 'false');
        console.log('✅ App screen display set to block');
        
        // Force reflow to ensure styles are applied
        appScreen.offsetHeight;
        
        // Verify it's actually visible
        const computedStyle = window.getComputedStyle(appScreen);
        const isVisible = computedStyle.display !== 'none' && 
                         computedStyle.visibility !== 'hidden' &&
                         appScreen.offsetParent !== null;
        
        if (!isVisible) {
            console.warn('⚠️ App screen not visible, trying alternative methods...');
            // Try different display methods with !important
            appScreen.style.setProperty('display', 'flex', 'important');
            appScreen.style.setProperty('visibility', 'visible', 'important');
            appScreen.style.setProperty('opacity', '1', 'important');
            
            // Force reflow again
            appScreen.offsetHeight;
            
            // Check again
            const checkStyle = window.getComputedStyle(appScreen);
            if (checkStyle.display === 'none' || checkStyle.visibility === 'hidden') {
                console.error('❌ App screen still not visible after attempts');
                // Last resort: remove any conflicting classes
                appScreen.className = appScreen.className.replace(/hidden|d-none|invisible/g, '');
            } else {
                console.log('✅ App screen now visible');
            }
        } else {
            console.log('✅ App screen is visible and accessible');
        }
        
        // Ensure sidebar and main content are visible
        const sidebar = appScreen.querySelector('.sidebar');
        const mainContent = appScreen.querySelector('.main-content');
        
        if (sidebar) {
            sidebar.style.display = 'block';
            sidebar.style.visibility = 'visible';
        }
        
        if (mainContent) {
            mainContent.style.display = 'block';
            mainContent.style.visibility = 'visible';
        }
        
    } else {
        console.error('❌ App screen element not found!');
        // Try to find it with alternative selectors
        const altAppScreen = document.querySelector('.app-container')?.parentElement ||
                            document.querySelector('[id*="app"]') ||
                            document.querySelector('.screen:not(#login-screen)');
        
        if (altAppScreen) {
            console.log('✅ Found app screen with alternative selector');
            altAppScreen.style.display = 'block';
            altAppScreen.style.visibility = 'visible';
            altAppScreen.style.opacity = '1';
        }
    }
    
    // Initialize router integration after showing app
    // Router integration is now handled by RouterManager callbacks
    // No need to manually initialize here
    
    // Update document body class to indicate authenticated state
    document.body.classList.remove('login-mode');
    document.body.classList.add('app-mode');
    
    console.log('✅ App screen setup completed');
}

async function loadUserData() {
    try {
        console.log('📥 Loading user data...');
        
        // Use authService if available
        if (window.authService) {
            const result = await window.authService.getCurrentUser();
            if (result.success && result.user) {
                currentUser = result.user;
                window.currentUser = result.user; // Set for global access
                const userName = result.user.profile?.full_name || 
                                result.user.user_metadata?.full_name || 
                                result.user.email?.split('@')[0] || 
                                'User';
                const userNameEl = document.getElementById('user-name');
                if (userNameEl) {
                    userNameEl.textContent = userName;
                }
                
                // Update avatar
                const userAvatar = document.getElementById('user-avatar');
                if (userAvatar && userName) {
                    userAvatar.textContent = userName.charAt(0).toUpperCase();
                }
                
                // Update menu visibility based on role
                try {
                    updateMenuVisibility(result.user);
                } catch (menuError) {
                    console.warn('⚠️ Error updating menu visibility (non-critical):', menuError);
                }
                
                // Load notifications after user data is loaded (non-critical)
                try {
                    await loadNotifications();
                } catch (notifError) {
                    console.warn('⚠️ Error loading notifications (non-critical):', notifError);
                }
                
                console.log('✅ User data loaded successfully');
            } else {
                console.warn('⚠️ getCurrentUser did not return user data');
                // Use fallback
                setMinimalUserData();
            }
        } else {
            // Fallback to direct API call
            try {
                const userData = await window.apiCall('/api/auth/me');
                if (userData && userData.user) {
                    currentUser = userData.user;
                    window.currentUser = userData.user; // Set for global access
                    const userName = userData.user.profile?.full_name || 
                                    userData.user.user_metadata?.full_name || 
                                    userData.user.email?.split('@')[0] || 
                                    'User';
                    const userNameEl = document.getElementById('user-name');
                    if (userNameEl) {
                        userNameEl.textContent = userName;
                    }
                    
                    const userAvatar = document.getElementById('user-avatar');
                    if (userAvatar && userName) {
                        userAvatar.textContent = userName.charAt(0).toUpperCase();
                    }
                    
                    // Update menu visibility based on role
                    try {
                        updateMenuVisibility(userData.user);
                    } catch (menuError) {
                        console.warn('⚠️ Error updating menu visibility (non-critical):', menuError);
                    }
                    
                    // Load notifications after user data is loaded (non-critical)
                    try {
                        await loadNotifications();
                    } catch (notifError) {
                        console.warn('⚠️ Error loading notifications (non-critical):', notifError);
                    }
                    
                    console.log('✅ User data loaded via API call');
                } else {
                    console.warn('⚠️ API call did not return user data');
                    setMinimalUserData();
                }
            } catch (apiError) {
                console.warn('⚠️ API call failed, using fallback:', apiError);
                setMinimalUserData();
            }
        }
    } catch (error) {
        console.error('❌ Error loading user data:', error);
        // Always set minimal fallback data
        setMinimalUserData();
    }

    // Initialize chat widget if available (non-critical)
    try {
        if (window.chatWidget && currentUser) {
            window.chatWidget.init();
        }
    } catch (chatError) {
        console.warn('⚠️ Error initializing chat widget (non-critical):', chatError);
    }
}

// Helper function to set minimal user data as fallback
function setMinimalUserData() {
    console.log('🔄 Setting minimal user data as fallback...');
    const userNameEl = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    
    if (currentUser) {
        const userName = currentUser.email?.split('@')[0] || 
                        currentUser.user_metadata?.full_name || 
                        'User';
        
        if (userNameEl && !userNameEl.textContent) {
            userNameEl.textContent = userName;
        }
        
        if (userAvatar) {
            const initial = (userName.charAt(0) || 'U').toUpperCase();
            userAvatar.textContent = initial;
        }
    } else {
        if (userNameEl && !userNameEl.textContent) {
            userNameEl.textContent = 'User';
        }
        if (userAvatar && !userAvatar.textContent) {
            userAvatar.textContent = 'U';
        }
    }
    console.log('✅ Minimal user data set');
}

async function loadNotifications() {
    try {
        // Load notifications from API
        const notifications = await apiCall('/api/notifications');
        updateNotificationUI(notifications);
    } catch (error) {
        console.warn('Could not load notifications:', error);
        // Hide notification icons if no notifications available
        hideNotifications();
    }
}

function updateNotificationUI(notifications = {}) {
    const alertPill = document.getElementById('notif-alert-pill');
    const infoPill = document.getElementById('notif-info-pill');
    const alertCount = document.getElementById('notif-alert-count');
    const messageCount = document.getElementById('notif-message-count');
    
    const alerts = notifications.alerts || 0;
    const messages = notifications.messages || 0;
    
    if (alerts > 0) {
        alertPill.style.display = '';
        alertCount.textContent = alerts;
    } else {
        alertPill.style.display = 'none';
    }
    
    if (messages > 0) {
        infoPill.style.display = '';
        messageCount.textContent = messages;
    } else {
        infoPill.style.display = 'none';
    }
}

function hideNotifications() {
    const alertPill = document.getElementById('notif-alert-pill');
    const infoPill = document.getElementById('notif-info-pill');
    
    if (alertPill) alertPill.style.display = 'none';
    if (infoPill) infoPill.style.display = 'none';
}

function updateMenuVisibility(user) {
    // Get user role
    const role = user.profile?.role || user.role || 'manager';
    const isSuperAdmin = role === 'superadmin' || user.email === 'mukhsin9@gmail.com';
    
    // Hide "Pengaturan" menu for admin and manager
    const pengaturanMenu = document.querySelector('.menu-item[data-page="pengaturan"]');
    if (pengaturanMenu) {
        if (isSuperAdmin) {
            pengaturanMenu.style.display = '';
        } else {
            pengaturanMenu.style.display = 'none';
        }
    }
}

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Login/Register forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        // Check if handler already attached
        if (!loginForm.hasAttribute('data-handler-attached')) {
            loginForm.addEventListener('submit', handleLogin);
            loginForm.setAttribute('data-handler-attached', 'true');
            console.log('✅ Login form handler attached');
        } else {
            console.log('ℹ️ Login form handler already attached');
        }
    } else {
        console.warn('⚠️ Login form not found!');
    }
    
    if (registerForm) {
        if (!registerForm.hasAttribute('data-handler-attached')) {
            registerForm.addEventListener('submit', handleRegister);
            registerForm.setAttribute('data-handler-attached', 'true');
            console.log('✅ Register form handler attached');
        }
    }
    
    // Password toggle functionality
    setupPasswordToggle();
    
    // Forgot password link
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            // TODO: Implement forgot password functionality
            alert('Fitur lupa kata sandi akan segera tersedia. Silakan hubungi administrator.');
        });
    }
    
    // Register form toggle (if elements exist)
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    
    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
        });
    }
    
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (registerForm) registerForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
        });
    }

    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Tab navigation (legacy)
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });

    // Sidebar navigation (new) - Enhanced with proper event handling
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const page = e.currentTarget.dataset.page;
            console.log(`🖱️ Menu item clicked: ${page}`);
            
            // Prevent double-clicks and rapid navigation
            if (item.classList.contains('navigating')) {
                console.log('⚠️ Navigation already in progress, ignoring click');
                return;
            }
            
            // Mark as navigating
            item.classList.add('navigating');
            
            // Navigate with proper cleanup
            try {
                navigateToPage(page);
            } catch (error) {
                console.error('❌ Navigation error:', error);
            } finally {
                // Remove navigating class after a short delay
                setTimeout(() => {
                    item.classList.remove('navigating');
                }, 500);
            }
        });
    });

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }

    // Sidebar dropdown toggle
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const section = toggle.dataset.section;
            const submenu = document.querySelector(`.sidebar-submenu[data-submenu="${section}"]`);
            const chevronIcon = toggle.querySelector('.dropdown-icon');
            
            if (submenu) {
                // Check if this menu is currently active
                const isCurrentlyActive = toggle.classList.contains('active');
                
                // Close all other menus first
                document.querySelectorAll('.dropdown-toggle').forEach(otherToggle => {
                    if (otherToggle !== toggle) {
                        otherToggle.classList.remove('active');
                        const otherSection = otherToggle.dataset.section;
                        const otherSubmenu = document.querySelector(`.sidebar-submenu[data-submenu="${otherSection}"]`);
                        const otherChevronIcon = otherToggle.querySelector('.dropdown-icon');
                        
                        if (otherSubmenu) {
                            otherSubmenu.classList.remove('expanded');
                        }
                        
                        if (otherChevronIcon) {
                            otherChevronIcon.classList.remove('fa-chevron-up');
                            otherChevronIcon.classList.add('fa-chevron-down');
                        }
                    }
                });
                
                // Toggle active class on button
                const isActive = toggle.classList.toggle('active');
                // Toggle expanded class on submenu
                submenu.classList.toggle('expanded');
                
                // Change chevron icon
                if (chevronIcon) {
                    if (isActive) {
                        chevronIcon.classList.remove('fa-chevron-down');
                        chevronIcon.classList.add('fa-chevron-up');
                    } else {
                        chevronIcon.classList.remove('fa-chevron-up');
                        chevronIcon.classList.add('fa-chevron-down');
                    }
                }
            }
        });
    });

    // Auto-expand section if current page is in that section (skip menu-item-top)
    const currentPage = document.querySelector('.menu-item.active:not(.menu-item-top)');
    if (currentPage) {
        const currentSubmenu = currentPage.closest('.sidebar-submenu');
        if (currentSubmenu) {
            currentSubmenu.classList.add('expanded');
            const section = currentSubmenu.dataset.submenu;
            const toggle = document.querySelector(`.dropdown-toggle[data-section="${section}"]`);
            if (toggle) {
                toggle.classList.add('active');
                // Change chevron to up when expanded
                const chevronIcon = toggle.querySelector('.dropdown-icon');
                if (chevronIcon) {
                    chevronIcon.classList.remove('fa-chevron-down');
                    chevronIcon.classList.add('fa-chevron-up');
                }
            }
        }
    }

    // Listen for auth state changes
    let authStateSubscription = null; // Track subscription to prevent duplicates
    
    function setupAuthStateListener() {
        // Prevent multiple listeners
        if (authStateSubscription) {
            console.log('Auth state listener already exists, skipping setup');
            return;
        }
        
        // Wait for Supabase client to be ready
        if (window.configManager) {
            window.configManager.onConfigReady(() => {
                attachAuthStateListener();
            });
        } else {
            // Fallback: try to attach immediately
            setTimeout(() => {
                attachAuthStateListener();
            }, 1000);
        }
    }
    
    function attachAuthStateListener() {
        // Prevent multiple listeners
        if (authStateSubscription) {
            console.log('Auth state listener already attached, skipping');
            return;
        }
        
        // Prefer authService over direct Supabase to avoid conflicts
        if (window.authService && typeof window.authService.onAuthStateChange === 'function') {
            console.log('Setting up auth state listener via authService');
            authStateSubscription = window.authService.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event, session?.user?.email || 'no user');
                handleAuthStateChange(event, session);
            });
            
            if (authStateSubscription) {
                console.log('Auth state listener attached successfully via authService');
            } else {
                console.warn('Failed to attach auth state listener via authService');
            }
        } else {
            // Fallback to direct Supabase listener only if authService is not available
            const supabaseClient = window.supabaseClient;
            if (supabaseClient) {
                console.log('Setting up auth state listener via direct Supabase (fallback)');
                const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
                    console.log('Auth state changed (direct):', event, session?.user?.email || 'no user');
                    handleAuthStateChange(event, session);
                });
                
                authStateSubscription = subscription;
                
                if (subscription) {
                    console.log('Auth state listener attached successfully (direct)');
                } else {
                    console.warn('Failed to attach auth state listener (direct)');
                }
            } else {
                console.warn('Supabase client not available for auth state listener');
            }
        }
    }
    
    function handleAuthStateChange(event, session) {
        // Centralized auth state change handler to prevent duplicate logic
        if (event === 'SIGNED_IN') {
            currentUser = session?.user || null;
            window.currentUser = currentUser;
            if (currentUser) {
                console.log('User signed in via auth state change:', currentUser.email);
                showApp();
                loadUserData().catch(err => console.error('Error loading user data:', err));
                loadKopHeaderSafe();
            }
        } else if (event === 'SIGNED_OUT') {
            console.log('User signed out via auth state change');
            currentUser = null;
            window.currentUser = null;
            window.currentSession = null;
            showLogin();
        } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed');
            // Update session if available
            if (session) {
                window.currentSession = session;
            }
            // Refresh user data if needed
            if (currentUser) {
                loadUserData().catch(err => console.error('Error refreshing user data:', err));
            }
        } else if (event === 'INITIAL_SESSION') {
            // Handle initial session - don't trigger UI changes here as checkAuth handles it
            console.log('Initial session detected, handled by checkAuth');
        }
    }
    
    setupAuthStateListener();

    // Chat toggle from sidebar footer
    const chatToggleSidebar = document.getElementById('chat-toggle-sidebar');
    if (chatToggleSidebar) {
        chatToggleSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            const chatPanel = document.getElementById('chat-panel');
            if (chatPanel) {
                chatPanel.classList.toggle('open');
                chatPanel.setAttribute('aria-hidden', chatPanel.classList.contains('open') ? 'false' : 'true');
                chatToggleSidebar.setAttribute('aria-expanded', chatPanel.classList.contains('open') ? 'true' : 'false');
            }
        });
    }

    // Chat close button
    const chatClose = document.querySelector('.chat-close');
    if (chatClose) {
        chatClose.addEventListener('click', () => {
            const chatPanel = document.getElementById('chat-panel');
            const chatToggleSidebar = document.getElementById('chat-toggle-sidebar');
            if (chatPanel) {
                chatPanel.classList.remove('open');
                chatPanel.setAttribute('aria-hidden', 'true');
                if (chatToggleSidebar) {
                    chatToggleSidebar.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    initTooltips();
}

// Password toggle functionality
function setupPasswordToggle() {
    const passwordInput = document.getElementById('login-password');
    const passwordToggleIcon = document.getElementById('password-toggle-icon');
    
    if (passwordInput && passwordToggleIcon) {
        passwordToggleIcon.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle icon
            if (type === 'password') {
                passwordToggleIcon.classList.remove('fa-eye-slash');
                passwordToggleIcon.classList.add('fa-eye');
            } else {
                passwordToggleIcon.classList.remove('fa-eye');
                passwordToggleIcon.classList.add('fa-eye-slash');
            }
        });
    }
}

function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');

    tooltipElements.forEach((element) => {
        let hideTimeout;

        const showTooltip = () => {
            element.classList.add('show-tooltip');
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                element.classList.remove('show-tooltip');
            }, 2000);
        };

        const hideTooltip = () => {
            element.classList.remove('show-tooltip');
            clearTimeout(hideTimeout);
        };

        element.addEventListener(
            'touchstart',
            () => {
                showTooltip();
            },
            { passive: true }
        );
        element.addEventListener('focus', showTooltip);
        element.addEventListener('blur', hideTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                hideTooltip();
            }
        });
        element.addEventListener('click', () => {
            if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
                showTooltip();
            }
        });
    });
}

async function handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Login form submitted');
    
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const messageEl = document.getElementById('auth-message');
    const loginForm = document.getElementById('login-form');
    
    const email = emailInput?.value?.trim() || '';
    const password = passwordInput?.value || '';

    // Clear previous messages
    if (messageEl) {
        messageEl.textContent = '';
        messageEl.className = 'message';
        messageEl.style.display = 'none';
    }

    // Validation
    if (!email) {
        showErrorMessage('Nama pengguna harus diisi.', messageEl);
        emailInput?.focus();
        return;
    }
    
    if (!password) {
        showErrorMessage('Kata sandi harus diisi.', messageEl);
        passwordInput?.focus();
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showErrorMessage('Format email tidak valid.', messageEl);
        emailInput?.focus();
        return;
    }

    // Disable form
    const submitBtn = loginForm?.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn?.innerHTML || 'Masuk';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    }

    // Show loading
    if (messageEl) {
        messageEl.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px"></i>Sedang memproses login...';
        messageEl.className = 'message info show';
        messageEl.style.display = 'block';
    }

    try {
        // Ensure Supabase client is ready
        const client = await window.SupabaseClientManager.waitForClient(5000);
        if (!client) {
            throw new Error('Aplikasi belum siap. Silakan refresh halaman.');
        }
        
        // Perform login directly with Supabase
        console.log('[AUTH] LOGIN - Attempting signInWithPassword...');
        const { data, error } = await client.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password
        });
        
        if (error) {
            // Map common errors to user-friendly messages
            const msg = error.message.toLowerCase();
            if (msg.includes('invalid login') || msg.includes('invalid_credentials')) {
                throw new Error('Email atau password salah.');
            } else if (msg.includes('email not confirmed')) {
                throw new Error('Email belum dikonfirmasi. Cek inbox Anda.');
            } else if (msg.includes('network') || msg.includes('fetch')) {
                throw new Error('Koneksi internet bermasalah.');
            }
            throw new Error(error.message);
        }
        
        if (!data.session || !data.user) {
            throw new Error('Login gagal. Silakan coba lagi.');
        }
        
        console.log('[AUTH] LOGIN SUCCESS - User:', data.user.email);
        console.log('[AUTH] LOGIN - Session token available:', !!data.session.access_token);
        
        // CRITICAL: Wait for SIGNED_IN event or verify session is stored
        // Supabase should fire SIGNED_IN event automatically, but we verify session is stored
        console.log('[AUTH] LOGIN - Verifying session is stored in Supabase...');
        
        // Wait a moment for Supabase to persist session and fire SIGNED_IN event
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verify session is actually stored in Supabase
        const { data: { session: storedSession }, error: sessionError } = await client.auth.getSession();
        
        if (sessionError || !storedSession || !storedSession.access_token) {
            console.warn('[AUTH] LOGIN - Session not yet stored, but continuing...');
            // Session might still be persisting, continue anyway
        } else {
            console.log('[AUTH] LOGIN - Session verified in Supabase storage');
            // Use stored session (might be slightly different from response)
            data.session = storedSession;
        }
        
        // CRITICAL: Update global state immediately
        // This ensures the token is available for subsequent API requests
        currentUser = data.user;
        window.currentUser = data.user;
        window.currentSession = data.session;
        window.isAuthenticated = true;
        
        // Update auth state manager
        // NOTE: SIGNED_IN event should also trigger this, but we update immediately for responsiveness
        if (window.authStateManager) {
            console.log('[AUTH] LOGIN - Updating auth state manager with session');
            window.authStateManager.updateState(true, data.user, data.session);
            
            // Verify state was updated
            const authState = window.authStateManager.getAuthState();
            console.log('[AUTH] LOGIN - Auth state after update:', authState);
            console.log('[AUTH] LOGIN - Auth ready check:', window.authStateManager.isReady());
        }
        
        // IMPORTANT: Update the session cache in config.js immediately
        if (window.clearSessionCache) {
            window.clearSessionCache();
        }
        
        // Show success message briefly
        if (messageEl) {
            messageEl.innerHTML = '<i class="fas fa-check-circle" style="margin-right:8px;color:#28a745"></i>Login berhasil!';
            messageEl.className = 'message success show';
        }
        
        // CRITICAL: Verify token is accessible before proceeding
        const tokenCheck = await window.getAuthToken();
        if (!tokenCheck) {
            console.warn('⚠️ Token not immediately available, retrying...');
            // Wait a bit more and retry
            await new Promise(resolve => setTimeout(resolve, 300));
            const retryToken = await window.getAuthToken();
            if (!retryToken) {
                throw new Error('Session tidak tersimpan dengan benar. Silakan coba lagi.');
            }
        } else {
            console.log('✅ Token verified and ready');
        }
        
        // CRITICAL: Verify auth state manager is ready
        // Wait for SIGNED_IN event to be processed (max 2 seconds)
        if (window.authStateManager) {
            const authReady = await window.authStateManager.waitForReady(2000);
            if (authReady) {
                console.log('✅ Auth state manager confirmed ready after login');
            } else {
                console.warn('⚠️ Auth state manager not ready, but session is valid - continuing');
                // Session is valid, continue anyway
            }
        }
        
        // Trigger AI Assistant availability check after login
        if (window.AIAssistant && window.AIAssistant.checkAvailability) {
            window.AIAssistant.checkAvailability().catch(err => {
                console.warn('[AUTH] AI Assistant availability check after login:', err);
            });
        }
        
        // CRITICAL: Re-initialize app after successful login
        // This ensures router and all modules are properly initialized
        console.log('[AUTH] LOGIN - Re-initializing app after login...');
        
        // Step 1: Show app screen
        showApp();
        
        // Step 2: Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Step 3: Re-initialize router if needed
        if (window.RouterManager && typeof window.RouterManager.getInstance === 'function') {
            try {
                const routerManager = window.RouterManager.getInstance();
                if (routerManager && typeof routerManager.initialize === 'function') {
                    console.log('[AUTH] LOGIN - Re-initializing router...');
                    await routerManager.initialize();
                }
            } catch (routerError) {
                console.warn('[AUTH] LOGIN - Router re-init error:', routerError);
            }
        }
        
        // Step 4: Navigate to dashboard
        console.log('[AUTH] LOGIN - Navigating to dashboard...');
        navigateToPage('dashboard');
        
        // Step 5: Load user data in background (non-blocking)
        loadUserData().catch(err => console.warn('User data load error:', err));
        loadKopHeaderSafe();
        
        console.log('✅ Login flow completed - App re-initialized');
        
    } catch (error) {
        console.error('❌ Login error:', error);
        showErrorMessage(error.message || 'Login gagal. Silakan coba lagi.', messageEl);
    } finally {
        // Re-enable form
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText || '<span>Masuk</span>';
        }
    }
}

// Helper function to show error message
function showErrorMessage(message, messageEl) {
    if (!messageEl) {
        messageEl = document.getElementById('auth-message');
    }
    
    if (messageEl) {
        // Clear any existing content and icons
        messageEl.innerHTML = '';
        
        // Add error icon
        const errorIcon = document.createElement('i');
        errorIcon.className = 'fas fa-exclamation-circle';
        errorIcon.style.marginRight = '8px';
        errorIcon.style.color = '#dc3545';
        
        const messageText = document.createTextNode(message);
        
        messageEl.appendChild(errorIcon);
        messageEl.appendChild(messageText);
        messageEl.className = 'message error show';
        messageEl.style.display = 'block';
        
        // Ensure message is visible and accessible
        messageEl.setAttribute('role', 'alert');
        messageEl.setAttribute('aria-live', 'assertive');
        
        // Add shake animation for better visibility
        messageEl.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            if (messageEl) {
                messageEl.style.animation = '';
            }
        }, 500);
        
        // Scroll to message if needed
        setTimeout(() => {
            if (messageEl) {
                messageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
    } else {
        console.error('Message element not found:', message);
        // Fallback to alert with better formatting
        alert(`❌ ${message}`);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const messageEl = document.getElementById('auth-message');

    // Disable form during submission
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
    }

    try {
        // Use authService if available
        let result;
        if (window.authService) {
            result = await window.authService.register(email, password, name);
        } else {
            // Fallback to direct Supabase call
            const supabaseClient = window.supabaseClient;
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });
            if (error) throw error;
            result = { success: true, message: 'Registration successful' };
        }

        if (result.success) {
            messageEl.textContent = result.message || 'Registrasi berhasil! Silakan login.';
            messageEl.className = 'message success';
            
            // Switch to login form
            setTimeout(() => {
                document.getElementById('register-form').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
                messageEl.textContent = '';
                messageEl.className = '';
            }, 2000);
        } else {
            throw new Error(result.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Register error:', error);
        messageEl.textContent = error.message || 'Registrasi gagal. Silakan coba lagi.';
        messageEl.className = 'message error';
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register';
        }
    }
}

async function handleLogout() {
    try {
        console.log('🚪 Starting logout process...');
        
        // Use authService if available
        if (window.authService) {
            await window.authService.logout();
        } else {
            // Fallback to direct Supabase call
            const supabaseClient = window.supabaseClient;
            if (supabaseClient) {
                await supabaseClient.auth.signOut();
            }
        }
        
        // Clear user data using AuthStateManager (force clear for explicit logout)
        if (window.authStateManager) {
            window.authStateManager.clearState(true);
        }
        currentUser = null;
        
        // Use router integration for logout if available
        if (window.routerIntegration && window.routerIntegration.handleLogout) {
            console.log('🔐 Using router integration for logout');
            window.routerIntegration.handleLogout();
        } else {
            console.log('🔄 Using fallback logout navigation');
            showLogin();
        }
        
        console.log('✅ Logout completed successfully');
        
    } catch (error) {
        console.error('❌ Logout error:', error);
        // Still show login screen even if logout fails
        currentUser = null;
        
        if (window.routerIntegration && window.routerIntegration.handleLogout) {
            window.routerIntegration.handleLogout();
        } else {
            showLogin();
        }
    }
}

function navigateToPage(pageName) {
    console.log(`🧭 === NAVIGATE TO PAGE: ${pageName} ===`);
    console.log('Current user:', window.currentUser);
    console.log('Router available:', !!window.appRouter);
    
    // SPECIAL HANDLING FOR LOGIN PAGE
    if (pageName === 'login') {
        console.log('🔐 Navigating to login page - calling showLogin()');
        showLogin();
        // Update URL
        if (window.history && window.history.pushState) {
            window.history.pushState({ page: 'login' }, 'Login', '/login');
        }
        return;
    }
    
    // Handle URL mapping for residual risk
    let actualPageName = pageName;
    let urlPath = pageName;
    
    if (pageName === 'risk-residual' || pageName === 'residual-risk') {
        actualPageName = 'residual-risk'; // Use the actual page ID in HTML
        urlPath = 'risk-residual'; // Use the preferred URL path
    }
    
    // CRITICAL FIX: Disable router navigation for now to prevent redirect loops
    // The router is causing the page to redirect back to dashboard after showing
    // We'll use direct navigation to ensure pages stay visible
    console.log(`🔄 Using direct navigation for: ${actualPageName} (router disabled to prevent redirects)`);
    
    // Store the current page in session to prevent router from overriding
    sessionStorage.setItem('currentPage', actualPageName);
    sessionStorage.setItem('navigationTimestamp', Date.now().toString());
    
    // Fallback to original navigation logic
    console.log(`🔄 Using direct navigation for: ${actualPageName}`);
    
    try {
        // Check role-based access for pengaturan page
        if (actualPageName === 'pengaturan') {
            const user = window.currentUser || currentUser;
            if (!user) {
                alert('Anda harus login terlebih dahulu');
                return;
            }
            
            const role = user.profile?.role || user.role || 'manager';
            const isSuperAdmin = role === 'superadmin' || user.email === 'mukhsin9@gmail.com';
            
            if (!isSuperAdmin) {
                alert('Hanya superadmin yang dapat mengakses halaman Pengaturan');
                actualPageName = 'dashboard'; // Redirect to dashboard instead
                urlPath = 'dashboard';
            }
        }
        
        // CRITICAL: Prevent router from interfering with navigation
        // Temporarily disable router navigation events
        if (window.appRouter && typeof window.appRouter.pauseNavigation === 'function') {
            window.appRouter.pauseNavigation();
        }
        
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page (CRITICAL - must succeed)
        const selectedPage = document.getElementById(actualPageName);
        if (selectedPage) {
            selectedPage.classList.add('active');
            console.log(`✅ Page ${actualPageName} is now active`);
            
            // Verify it's actually active
            if (!selectedPage.classList.contains('active')) {
                console.warn(`⚠️ Page ${actualPageName} not active, forcing...`);
                selectedPage.classList.add('active');
            }
            
            // Force reflow to ensure styles are applied
            selectedPage.offsetHeight;
            
            // CRITICAL: Mark page as stable to prevent router interference
            selectedPage.setAttribute('data-navigation-stable', 'true');
            selectedPage.setAttribute('data-navigation-timestamp', Date.now().toString());
            
            // SPECIAL HANDLING FOR RENCANA STRATEGIS - Prevent any redirects
            if (actualPageName === 'rencana-strategis') {
                console.log('🔒 LOCKING Rencana Strategis page - preventing redirects');
                
                // Set multiple flags to prevent redirects
                sessionStorage.setItem('lockRencanaStrategis', 'true');
                sessionStorage.setItem('preventAutoRedirect', 'true');
                sessionStorage.setItem('preserveRoute', '/rencana-strategis');
                sessionStorage.setItem('preserveRouteTimestamp', Date.now().toString());
                
                // Force page to stay visible with inline styles
                selectedPage.style.display = 'block';
                selectedPage.style.visibility = 'visible';
                selectedPage.style.opacity = '1';
                selectedPage.style.position = 'relative';
                selectedPage.style.zIndex = '1';
                
                // Clear lock after 5 seconds (page should be stable by then)
                setTimeout(() => {
                    sessionStorage.removeItem('lockRencanaStrategis');
                    console.log('🔓 Rencana Strategis lock released');
                }, 5000);
            }
            
        } else {
            console.error(`❌ Page element not found: ${actualPageName}`);
            // Fallback: try to show dashboard
            if (actualPageName !== 'dashboard') {
                console.log('🔄 Falling back to dashboard...');
                const dashboardPage = document.getElementById('dashboard');
                if (dashboardPage) {
                    dashboardPage.classList.add('active');
                    actualPageName = 'dashboard';
                    urlPath = 'dashboard';
                }
            }
        }

        // Update menu items - use original pageName for menu matching
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            const itemPage = item.dataset.page;
            // Handle both residual-risk and risk-residual menu items
            if (itemPage === pageName || 
                (pageName === 'risk-residual' && itemPage === 'residual-risk') ||
                (pageName === 'residual-risk' && itemPage === 'residual-risk')) {
                item.classList.add('active');
                console.log(`✅ Menu item for ${itemPage} is now active`);
            }
        });
        
        // Close all dropdown menus when navigating to a new page
        document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.classList.remove('active');
            const section = toggle.dataset.section;
            const submenu = document.querySelector(`.sidebar-submenu[data-submenu="${section}"]`);
            const chevronIcon = toggle.querySelector('.dropdown-icon');
            
            if (submenu) {
                submenu.classList.remove('expanded');
            }
            
            if (chevronIcon) {
                chevronIcon.classList.remove('fa-chevron-up');
                chevronIcon.classList.add('fa-chevron-down');
            }
        });
        
        // Auto-expand the section containing the active menu item (if it's a submenu item)
        const activeMenuItem = document.querySelector('.menu-item.active:not(.menu-item-top)');
        if (activeMenuItem) {
            const currentSubmenu = activeMenuItem.closest('.sidebar-submenu');
            if (currentSubmenu) {
                currentSubmenu.classList.add('expanded');
                const section = currentSubmenu.dataset.submenu;
                const toggle = document.querySelector(`.dropdown-toggle[data-section="${section}"]`);
                if (toggle) {
                    toggle.classList.add('active');
                    const chevronIcon = toggle.querySelector('.dropdown-icon');
                    if (chevronIcon) {
                        chevronIcon.classList.remove('fa-chevron-down');
                        chevronIcon.classList.add('fa-chevron-up');
                    }
                }
            }
        }

        // Update page title
        updatePageTitle(actualPageName);

        // Load page-specific data (non-critical - page should be visible even if this fails)
        console.log(`📄 About to call loadPageData for: ${actualPageName}`);
        try {
            loadPageData(actualPageName);
        } catch (loadError) {
            console.error(`⚠️ Error loading page data for ${actualPageName} (non-critical):`, loadError);
            // Page is already visible, so continue
        }
        
        // CRITICAL: Re-enable router navigation after a delay to prevent interference
        setTimeout(() => {
            if (window.appRouter && typeof window.appRouter.resumeNavigation === 'function') {
                window.appRouter.resumeNavigation();
            }
            
            // Update URL without triggering navigation
            if (window.history && window.history.replaceState) {
                const newUrl = `/${urlPath}`;
                if (window.location.pathname !== newUrl) {
                    window.history.replaceState({ page: actualPageName }, '', newUrl);
                    console.log(`🔗 URL updated to: ${newUrl}`);
                }
            }
        }, 1000); // 1 second delay to ensure page is stable
        
        console.log(`✅ === NAVIGATE TO PAGE COMPLETE: ${actualPageName} ===`);
    } catch (error) {
        console.error(`❌ Error in navigateToPage for ${actualPageName}:`, error);
        // Even if there's an error, try to show the page
        const fallbackPage = document.getElementById(actualPageName) || document.getElementById('dashboard');
        if (fallbackPage) {
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.remove('active');
            });
            fallbackPage.classList.add('active');
            console.log(`✅ Fallback: Showing ${fallbackPage.id} page`);
        }
    }
}

// Helper function to update page title
function updatePageTitle(pageName) {
    const pageTitleText = document.getElementById('page-title-text');
    const pageTitleIcon = document.getElementById('page-title-icon');

    const pageMeta = {
        'dashboard': { title: 'Dashboard', icon: 'fa-home' },
        'visi-misi': { title: 'Visi dan Misi', icon: 'fa-bullseye' },
        'rencana-strategis': { title: 'Rencana Strategis', icon: 'fa-chart-line' },
        'inventarisasi-swot': { title: 'Inventarisasi SWOT', icon: 'fa-list-check' },
        'analisis-swot': { title: 'Analisis SWOT', icon: 'fa-chart-bar' },
        'diagram-kartesius': { title: 'Diagram Kartesius', icon: 'fa-chart-scatter' },
        'matriks-tows': { title: 'Matriks TOWS', icon: 'fa-table-cells' },
        'sasaran-strategi': { title: 'Sasaran Strategi', icon: 'fa-bullseye' },
        'strategic-map': { title: 'Strategic Map', icon: 'fa-project-diagram' },
        'indikator-kinerja-utama': { title: 'Indikator Kinerja Utama', icon: 'fa-tachometer-alt' },
        'evaluasi-iku': { title: 'Evaluasi IKU', icon: 'fa-chart-line' },
        'risk-input': { title: 'Input Data Risiko', icon: 'fa-pen-to-square' },
        'risk-profile': { title: 'Risk Profile', icon: 'fa-chart-bar' },
        'residual-risk': { title: 'Residual Risk', icon: 'fa-chart-pie' },
        'monitoring-evaluasi': { title: 'Monitoring & Evaluasi', icon: 'fa-clipboard-check' },
        'peluang': { title: 'Peluang', icon: 'fa-lightbulb' },
        'kri': { title: 'Key Risk Indicator', icon: 'fa-gauge-high' },
        'loss-event': { title: 'Loss Event', icon: 'fa-exclamation-triangle' },
        'ews': { title: 'Early Warning System', icon: 'fa-triangle-exclamation' },
        'risk-register': { title: 'Risk Register', icon: 'fa-table-list' },
        'laporan': { title: 'Laporan', icon: 'fa-file-pdf' },
        'master-data': { title: 'Master Data', icon: 'fa-database' },
        'buku-pedoman': { title: 'Buku Pedoman', icon: 'fa-book' },
        'pengaturan': { title: 'Pengaturan', icon: 'fa-cog' }
    };

    const fallbackTitle = pageName
        ? pageName.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
        : 'Halaman';
    const meta = pageMeta[pageName] || { title: fallbackTitle, icon: 'fa-layer-group' };

    if (pageTitleText) {
        pageTitleText.textContent = meta.title;
    }
    if (pageTitleIcon) {
        pageTitleIcon.className = `fas ${meta.icon}`;
    }
    
    // Update document title
    document.title = `${meta.title} - PINTAR MR`;
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Load tab data
    loadTabData(tabName);
}

// Helper function to show dashboard fallback content
function showDashboardFallback() {
    const content = document.getElementById('dashboard-content');
    if (content) {
        console.log('📄 Showing dashboard fallback content...');
        content.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5><i class="fas fa-home"></i> Dashboard</h5>
                    <p>Memuat dashboard...</p>
                    <p class="text-muted">Jika dashboard tidak muncul, silakan refresh halaman.</p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        <i class="fas fa-sync"></i> Refresh Halaman
                    </button>
                </div>
            </div>
        `;
    }
}

function loadPageData(pageName) {
    console.log(`📄 Loading page data for: ${pageName}`);
    
    try {
        switch(pageName) {
            case 'dashboard':
                if (window.dashboardModule?.loadDashboard) {
                    window.dashboardModule.loadDashboard();
                } else {
                    // Wait briefly for module to load
                    setTimeout(() => {
                        if (window.dashboardModule?.loadDashboard) {
                            window.dashboardModule.loadDashboard();
                        } else {
                            showDashboardFallback();
                        }
                    }, 100);
                }
                break;
        case 'visi-misi':
            window.visiMisiModule?.loadVisiMisi?.();
            break;
        case 'rencana-strategis':
            // Use v7.1 module - single source of truth
            console.log('🚀 Loading Rencana Strategis Module v7.1');
            
            // DON'T reset initialization flags - let the module handle it
            // This prevents race conditions and allows proper re-initialization
            
            // Try to load the module - check multiple aliases
            const loadRSModule = () => {
                if (window.RencanaStrategisModule?.load) {
                    console.log('✅ Using RencanaStrategisModule');
                    window.RencanaStrategisModule.load();
                    return true;
                } else if (window.RencanaStrategisUnified?.load) {
                    console.log('✅ Using RencanaStrategisUnified');
                    window.RencanaStrategisUnified.load();
                    return true;
                } else if (window.RSCore?.load) {
                    console.log('✅ Using RSCore');
                    window.RSCore.load();
                    return true;
                }
                return false;
            };
            
            if (!loadRSModule()) {
                console.warn('⚠️ RS module not ready, waiting...');
                // Wait for module to load with retry
                let retryCount = 0;
                const maxRetries = 10;
                const retryInterval = setInterval(() => {
                    retryCount++;
                    if (loadRSModule()) {
                        clearInterval(retryInterval);
                    } else if (retryCount >= maxRetries) {
                        clearInterval(retryInterval);
                        console.error('❌ RS module failed to load after retries');
                    }
                }, 200);
            }
            break;
        case 'renstra':
            // Clean implementation - no race conditions
            if (window.RenstraModule?.load) {
                console.log('🚀 Loading Renstra Module (clean implementation)');
                window.RenstraModule.load();
            }
            break;
        case 'inventarisasi-swot':
            window.inventarisasiSwotModule?.load?.();
            break;
        case 'analisis-swot':
            window.AnalisisSwotModule?.load?.();
            break;
        case 'diagram-kartesius':
            window.diagramKartesiusModule?.load?.();
            break;
        case 'matriks-tows':
            window.matriksTowsModule?.load?.();
            break;
        case 'sasaran-strategi':
            window.sasaranStrategiModule?.load?.();
            break;
        case 'strategic-map':
            window.strategicMapModule?.load?.();
            break;
        case 'indikator-kinerja-utama':
            window.indikatorKinerjaUtamaModule?.load?.();
            break;
        case 'evaluasi-iku':
            // Use enhanced module first, fallback to original
            if (window.EvaluasiIKUEnhanced) {
                window.EvaluasiIKUEnhanced.init();
            } else if (window.EvaluasiIKUModule) {
                window.EvaluasiIKUModule.init();
            }
            break;
        case 'monitoring-evaluasi':
            window.monitoringEvaluasiModule?.load?.();
            break;
        case 'peluang':
            window.peluangModule?.load?.();
            break;
        case 'kri':
            window.kriModule?.load?.();
            break;
        case 'loss-event':
            window.lossEventModule?.load?.();
            break;
        case 'ews':
            window.ewsModule?.load?.();
            break;
        case 'laporan':
            if (window.LaporanModule?.load) {
                window.LaporanModule.load();
            } else {
                console.warn('LaporanModule not found, retrying...');
                setTimeout(() => window.LaporanModule?.load?.(), 500);
            }
            break;
        case 'buku-pedoman':
            if (window.bukuPedomanManager?.renderHandbook) {
                window.bukuPedomanManager.renderHandbook();
            } else if (window.initializeBukuPedoman) {
                window.initializeBukuPedoman().catch(err => console.error('Buku Pedoman error:', err));
            }
            break;
        case 'pengaturan':
            window.pengaturanModule?.load?.();
            break;
        case 'risk-input':
            window.riskInputModule?.load?.();
            break;
        case 'risk-profile':
            window.RiskProfileModule?.load?.();
            break;
        case 'residual-risk':
        case 'risk-residual':
            // Handle both URL patterns for residual risk with robust retry
            const loadResidualRiskModule = (retryCount = 0) => {
                if (window.ResidualRiskModule?.load) {
                    console.log('🚀 Loading Residual Risk Module');
                    window.ResidualRiskModule.load();
                } else if (retryCount < 10) {
                    console.log(`⏳ Waiting for ResidualRiskModule... (attempt ${retryCount + 1}/10)`);
                    setTimeout(() => loadResidualRiskModule(retryCount + 1), 300);
                } else {
                    console.error('❌ ResidualRiskModule not found after 10 attempts');
                    // Show error message in the content area
                    const contentArea = document.getElementById('residual-risk-content');
                    if (contentArea) {
                        contentArea.innerHTML = `
                            <div class="card">
                                <div class="card-body" style="text-align: center; padding: 40px;">
                                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f39c12; margin-bottom: 20px;"></i>
                                    <h4>Module Loading Error</h4>
                                    <p>Residual Risk module gagal dimuat. Silakan refresh halaman.</p>
                                    <button onclick="location.reload()" class="btn btn-primary">
                                        <i class="fas fa-sync"></i> Refresh Halaman
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                }
            };
            loadResidualRiskModule();
            
            // Ensure page stays visible
            setTimeout(() => {
                const residualPage = document.getElementById('residual-risk');
                if (residualPage && !residualPage.classList.contains('active')) {
                    console.log('🔧 FIXING: Residual Risk page not active, forcing visibility');
                    document.querySelectorAll('.page-content').forEach(page => {
                        page.classList.remove('active');
                    });
                    residualPage.classList.add('active');
                }
            }, 100);
            break;
        case 'risk-register':
            // Use enhanced risk register module
            if (window.initRiskRegister) {
                window.initRiskRegister();
            } else if (window.loadRiskRegister) {
                window.loadRiskRegister();
            }
            break;
        case 'risk-appetite':
        case 'risk-register-graph':
        case 'master-data':
            loadTabData(pageName);
            break;
        default:
            break;
    }
    } catch (error) {
        console.error(`❌ Error loading page data for ${pageName}:`, error);
        // Show fallback content for the page
        const pageContent = document.getElementById(`${pageName}-content`);
        if (pageContent) {
            pageContent.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="text-warning"><i class="fas fa-exclamation-triangle"></i> Error Loading Page</h5>
                        <p>Terjadi kesalahan saat memuat halaman ${pageName}.</p>
                        <p>Error: ${error.message}</p>
                        <button onclick="location.reload()" class="btn btn-primary">Refresh Halaman</button>
                    </div>
                </div>
            `;
        }
    }
}

async function loadTabData(tabName) {
    switch(tabName) {
        case 'risk-input':
            await loadRiskInputData();
            break;
        case 'risk-profile':
            await loadRiskProfile();
            break;
        case 'residual-risk':
            await loadResidualRisk();
            break;
        case 'risk-register':
            // Use enhanced risk register module
            if (window.initRiskRegister) {
                await window.initRiskRegister();
            } else if (window.loadRiskRegister) {
                await loadRiskRegister();
            }
            break;
        case 'risk-appetite':
            await loadRiskAppetite();
            break;
        case 'risk-register-graph':
            await loadRiskRegisterGraph();
            break;
        case 'master-data':
            await loadMasterData();
            break;
    }
}

async function loadKopHeader(force = false) {
    try {
        // Check if user is authenticated first
        if (!window.isAuthenticated || !window.currentSession) {
            console.log('⚠️ [KOP] User not authenticated, skipping kop header load');
            return;
        }
        
        if (!force && kopSettingsCache) {
            renderKopHeader(kopSettingsCache);
            return;
        }
        
        console.log('📡 [KOP] Loading kop header settings...');
        const settings = await apiCall('/api/pengaturan');
        
        kopSettingsCache = settings.reduce((acc, item) => {
            const key = (item.kunci_pengaturan || '').trim();
            const value = item.nilai_pengaturan || '';
            if (!key) return acc;
            acc[key] = value;
            acc[key.toLowerCase()] = value;
            return acc;
        }, {});
        
        renderKopHeader(kopSettingsCache);
        console.log('✅ [KOP] Kop header loaded successfully');
        
    } catch (error) {
        console.error('❌ [KOP] Kop header error:', error);
        // Don't throw error, just log it to prevent blocking other functionality
    }
}

function renderKopHeader(settings = {}) {
    const header = document.getElementById('kop-header');
    if (!header) return;
    const nameEl = document.getElementById('kop-instansi');
    const alamatEl = document.getElementById('kop-alamat');
    const kontakEl = document.getElementById('kop-kontak');
    const logoEl = document.getElementById('kop-logo');
    const dateEl = document.getElementById('kop-date');
    const reporterNameEl = document.getElementById('kop-reporter-name');
    const reporterRoleEl = document.getElementById('kop-reporter-role');

    const namaInstansi = settings.nama_instansi || '';
    const alamat = settings.alamat_instansi || '';
    const kontakParts = [];
    if (settings.telepon_instansi) kontakParts.push(`Telp: ${settings.telepon_instansi}`);
    if (settings.email_instansi) kontakParts.push(`Email: ${settings.email_instansi}`);
    const kontak = kontakParts.join(' | ');

    if (nameEl) nameEl.textContent = namaInstansi || 'Nama Instansi';
    if (alamatEl) alamatEl.textContent = alamat || 'Alamat Instansi';
    if (kontakEl) kontakEl.textContent = kontak || 'Telp: -';

    if (logoEl) {
        if (settings.logo_instansi) {
            logoEl.src = settings.logo_instansi;
            logoEl.style.display = 'block';
        } else {
            logoEl.style.display = 'none';
        }
    }

    if (dateEl) {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(now);
        dateEl.textContent = formatted;
    }

    if (reporterNameEl) {
        reporterNameEl.textContent = settings.nama_pejabat_penandatangan || 'Administrator';
    }

    if (reporterRoleEl) {
        reporterRoleEl.textContent = settings.nama_jabatan_penandatangan || 'Pengelola Risiko';
    }

    header.classList.remove('hidden');
}

// Export for use in other modules
window.app = {
    currentUser,
    currentRiskId,
    switchTab,
    apiCall,
    navigateToPage,
    getSupabaseClient: () => window.supabaseClient,
    refreshKopHeader: () => loadKopHeader(true),
    setKopHeaderState: (state = {}) => {
        const normalized = Object.keys(state || {}).reduce((acc, key) => {
            const trimmed = (key || '').trim();
            if (!trimmed) return acc;
            acc[trimmed] = state[key];
            acc[trimmed.toLowerCase()] = state[key];
            return acc;
        }, {});
        kopSettingsCache = normalized;
        renderKopHeader(kopSettingsCache);
    }
};

// Make apiCall available globally
window.apiCall = apiCall;

// Safe kop header loading - only load after authentication
async function loadKopHeaderSafe() {
    try {
        // Wait for authentication to be ready
        const authReady = await waitForAuthReady(3000);
        if (!authReady) {
            console.log('⚠️ [KOP] Auth not ready, skipping kop header');
            return;
        }
        
        await loadKopHeader(true);
    } catch (error) {
        console.warn('⚠️ [KOP] Safe kop header loading failed:', error.message);
    }
}

window.loadKopHeaderSafe = loadKopHeaderSafe;

