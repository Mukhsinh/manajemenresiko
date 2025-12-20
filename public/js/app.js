// Main Application Logic
let currentUser = null;
let currentRiskId = null;
let kopSettingsCache = null;

// Check authentication on load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded - Initializing app...');
    
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
    
    try {
        await checkAuth();
        setupEventListeners();
        console.log('App initialization complete');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

async function checkAuth() {
    try {
        console.log('Checking authentication...');
        
        // Use authService if available, otherwise fallback to direct check
        if (window.authService) {
            console.log('Using authService for authentication check');
            const authResult = await window.authService.checkAuth();
            
            if (authResult.authenticated && authResult.user) {
                console.log('User authenticated via authService:', authResult.user.email);
                currentUser = authResult.user;
                showApp();
                await loadUserData();
                await loadKopHeader();
                navigateToPage('dashboard');
            } else {
                console.log('User not authenticated via authService');
                showLogin();
            }
        } else {
            console.log('Using direct Supabase check for authentication');
            // Fallback to direct Supabase check
            const supabaseClient = window.supabaseClient;
            if (!supabaseClient) {
                console.error('Supabase client not available');
                showLogin();
                return;
            }
            
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            
            if (error) {
                console.error('Auth session error:', error);
                showLogin();
                return;
            }
            
            if (session) {
                console.log('User authenticated via Supabase:', session.user.email);
                currentUser = session.user;
                showApp();
                await loadUserData();
                await loadKopHeader();
                navigateToPage('dashboard');
            } else {
                console.log('No active session found');
                showLogin();
            }
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        showLogin();
    }
}

function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
    kopSettingsCache = null;
    const kopHeader = document.getElementById('kop-header');
    if (kopHeader) kopHeader.classList.add('hidden');

    if (window.chatWidget) {
        window.chatWidget.destroy();
    }
}

function showApp() {
    console.log('🚀 Showing app screen...');
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    
    if (loginScreen) {
        loginScreen.style.display = 'none';
        console.log('✅ Login screen hidden');
    } else {
        console.warn('⚠️ Login screen element not found');
    }
    
    if (appScreen) {
        appScreen.style.display = 'block';
        console.log('✅ App screen shown');
    } else {
        console.warn('⚠️ App screen element not found');
    }
}

async function loadUserData() {
    try {
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
                updateMenuVisibility(result.user);
                
                // Load notifications after user data is loaded
                await loadNotifications();
            }
        } else {
            // Fallback to direct API call
            const userData = await window.apiCall('/api/auth/me');
            if (userData.user) {
                currentUser = userData.user;
                window.currentUser = userData.user; // Set for global access
                const userName = userData.user.profile?.full_name || 
                                userData.user.user_metadata?.full_name || 
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
                updateMenuVisibility(userData.user);
                
                // Load notifications after user data is loaded
                await loadNotifications();
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback jika error
        const userNameEl = document.getElementById('user-name');
        if (userNameEl && !userNameEl.textContent) {
            userNameEl.textContent = 'User';
        }
    }

    if (window.chatWidget && currentUser) {
        window.chatWidget.init();
    }
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
    // Login/Register forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
    });
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Tab navigation (legacy)
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });

    // Sidebar navigation (new)
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            navigateToPage(page);
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
    if (window.authService) {
        window.authService.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                currentUser = session?.user || null;
                if (currentUser) {
                    showApp();
                    loadUserData();
                    loadKopHeader();
                }
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                showLogin();
            }
        });
    } else {
        // Fallback to direct Supabase listener
        const supabaseClient = window.supabaseClient;
        if (supabaseClient) {
            supabaseClient.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN') {
                    currentUser = session?.user || null;
                    if (currentUser) {
                        showApp();
                        loadUserData();
                        loadKopHeader();
                    }
                } else if (event === 'SIGNED_OUT') {
                    currentUser = null;
                    showLogin();
                }
            });
        }
    }

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
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageEl = document.getElementById('auth-message');

    console.log('Login attempt:', { email, passwordLength: password.length });

    // Clear previous messages
    messageEl.textContent = '';
    messageEl.className = 'message';

    // Disable form during submission
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
    }

    try {
        console.log('Checking authService availability...');
        
        // Use authService if available
        let result;
        if (window.authService) {
            console.log('Using authService for login');
            result = await window.authService.login(email, password);
            console.log('AuthService login result:', result);
        } else {
            console.log('AuthService not available, using direct Supabase call');
            // Fallback to direct Supabase call
            const supabaseClient = window.supabaseClient;
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            result = { success: true, user: data.user };
            console.log('Direct Supabase login result:', result);
        }

        if (result.success) {
            console.log('✅ Login successful, showing success message');
            messageEl.textContent = 'Login berhasil! Mengalihkan ke dashboard...';
            messageEl.className = 'message success';
            
            currentUser = result.user;
            console.log('Current user set:', currentUser.email);
            
            // Add small delay to show success message
            setTimeout(async () => {
                console.log('Showing app and loading data...');
                showApp();
                await loadUserData();
                await loadKopHeader();
                navigateToPage('dashboard');
                console.log('✅ Login flow completed');
            }, 1000);
            
        } else {
            throw new Error(result.error || 'Login failed');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        messageEl.textContent = error.message || 'Login gagal. Silakan coba lagi.';
        messageEl.className = 'message error';
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
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
        currentUser = null;
        showLogin();
    } catch (error) {
        console.error('Logout error:', error);
        // Still show login screen even if logout fails
        currentUser = null;
        showLogin();
    }
}

function navigateToPage(pageName) {
    console.log(`=== NAVIGATE TO PAGE: ${pageName} ===`);
    console.log('Current user:', window.currentUser);
    console.log('Dashboard module available:', !!window.dashboardModule);
    
    // Check role-based access for pengaturan page
    if (pageName === 'pengaturan') {
        const user = window.currentUser || currentUser;
        if (!user) {
            alert('Anda harus login terlebih dahulu');
            return;
        }
        
        const role = user.profile?.role || user.role || 'manager';
        const isSuperAdmin = role === 'superadmin' || user.email === 'mukhsin9@gmail.com';
        
        if (!isSuperAdmin) {
            alert('Hanya superadmin yang dapat mengakses halaman Pengaturan');
            pageName = 'dashboard'; // Redirect to dashboard instead
        }
    }
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const selectedPage = document.getElementById(pageName);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }

    // Update menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
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

    // Update page title & icon
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

    // Load page-specific data
    console.log(`About to call loadPageData for: ${pageName}`);
    loadPageData(pageName);
    console.log(`=== NAVIGATE TO PAGE COMPLETE: ${pageName} ===`);
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

function loadPageData(pageName) {
    console.log(`Loading page data for: ${pageName}`);
    
    switch(pageName) {
        case 'dashboard':
            console.log('Loading dashboard...');
            console.log('Dashboard module available:', !!window.dashboardModule);
            console.log('Dashboard module ready flag:', !!window.dashboardModuleReady);
            console.log('LoadDashboard function available:', !!window.dashboardModule?.loadDashboard);
            
            if (window.dashboardModuleReady && window.dashboardModule && window.dashboardModule.loadDashboard) {
                console.log('Calling dashboard loadDashboard function...');
                window.dashboardModule.loadDashboard();
            } else {
                console.error('Dashboard module or loadDashboard function not available!');
                // Fallback: try multiple times with increasing delays
                let retryCount = 0;
                const maxRetries = 5;
                
                const retryDashboard = () => {
                    retryCount++;
                    console.log(`Retrying dashboard load (attempt ${retryCount}/${maxRetries})...`);
                    
                    if (window.dashboardModule && window.dashboardModule.loadDashboard) {
                        console.log('Dashboard module found on retry, loading...');
                        window.dashboardModule.loadDashboard();
                    } else if (retryCount < maxRetries) {
                        setTimeout(retryDashboard, retryCount * 200);
                    } else {
                        console.error('Dashboard module still not available after all retries');
                        // Last resort: show error message
                        const content = document.getElementById('dashboard-content');
                        if (content) {
                            content.innerHTML = `
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error Loading Dashboard</h5>
                                        <p>Dashboard module tidak dapat dimuat. Silakan refresh halaman.</p>
                                        <button onclick="location.reload()" class="btn btn-primary">Refresh Halaman</button>
                                    </div>
                                </div>
                            `;
                        }
                    }
                };
                
                setTimeout(retryDashboard, 100);
            }
            break;
        case 'visi-misi':
            window.visiMisiModule?.loadVisiMisi?.();
            break;
        case 'rencana-strategis':
            console.log('Loading rencana strategis module...');
            console.log('RencanaStrategisModule available:', !!window.RencanaStrategisModule);
            console.log('rencanaStrategisModule available:', !!window.rencanaStrategisModule);
            console.log('loadRencanaStrategis function available:', !!window.loadRencanaStrategis);
            
            // Check if container exists first
            const rencanaContainer = document.getElementById('rencana-strategis-content');
            console.log('Container rencana-strategis-content exists:', !!rencanaContainer);
            
            if (!rencanaContainer) {
                console.error('Container rencana-strategis-content not found! Waiting...');
                setTimeout(() => {
                    const delayedContainer = document.getElementById('rencana-strategis-content');
                    if (delayedContainer) {
                        console.log('Container found after delay, loading module...');
                        loadRencanaStrategisModule();
                    } else {
                        console.error('Container still not found after delay');
                    }
                }, 500);
                return;
            }
            
            loadRencanaStrategisModule();
            
            function loadRencanaStrategisModule() {
                if (window.loadRencanaStrategis) {
                    console.log('Calling loadRencanaStrategis function...');
                    window.loadRencanaStrategis();
                } else if (window.RencanaStrategisModule?.load) {
                    console.log('Calling RencanaStrategisModule.load...');
                    window.RencanaStrategisModule.load();
                } else if (window.rencanaStrategisModule?.load) {
                    console.log('Calling rencanaStrategisModule.load...');
                    window.rencanaStrategisModule.load();
                } else {
                    console.error('No rencana strategis module found!');
                    // Fallback: try multiple times with increasing delays
                    let retryCount = 0;
                    const maxRetries = 5;
                    
                    const retryRencanaStrategis = () => {
                        retryCount++;
                        console.log(`Retry loading rencana strategis module, attempt ${retryCount}`);
                        
                        if (window.loadRencanaStrategis) {
                            console.log('Rencana strategis module found on retry, loading...');
                            window.loadRencanaStrategis();
                        } else if (window.RencanaStrategisModule?.load) {
                            console.log('RencanaStrategisModule found on retry, loading...');
                            window.RencanaStrategisModule.load();
                        } else if (window.rencanaStrategisModule?.load) {
                            console.log('rencanaStrategisModule found on retry, loading...');
                            window.rencanaStrategisModule.load();
                        } else if (retryCount < maxRetries) {
                            setTimeout(retryRencanaStrategis, retryCount * 200);
                        } else {
                            console.error('Rencana strategis module still not available after all retries');
                            // Last resort: show error message
                            const content = document.getElementById('rencana-strategis-content');
                            if (content) {
                                content.innerHTML = `
                                    <div class="card">
                                        <div class="card-body">
                                            <h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error Loading Rencana Strategis</h5>
                                            <p>Rencana strategis module tidak dapat dimuat. Silakan refresh halaman.</p>
                                            <button onclick="location.reload()" class="btn btn-primary">Refresh Halaman</button>
                                        </div>
                                    </div>
                                `;
                            }
                        }
                    };
                    
                    setTimeout(retryRencanaStrategis, 100);
                }
            }
            break;
        case 'inventarisasi-swot':
            window.inventarisasiSwotModule?.load?.();
            break;
        case 'analisis-swot':
            window.analisisSwotModule?.load?.();
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
            window.laporanModule?.load?.();
            break;
        case 'buku-pedoman':
            console.log('Loading Buku Pedoman page...');
            if (window.bukuPedomanManager) {
                console.log('Buku Pedoman manager already initialized');
                // Re-render if needed
                if (window.bukuPedomanManager.renderHandbook) {
                    window.bukuPedomanManager.renderHandbook();
                }
            } else {
                console.log('Initializing Buku Pedoman manager...');
                if (window.initializeBukuPedoman) {
                    try {
                        await window.initializeBukuPedoman();
                        console.log('Buku Pedoman manager initialized successfully');
                    } catch (error) {
                        console.error('Failed to initialize Buku Pedoman manager:', error);
                        // Show error in content area
                        const container = document.getElementById('buku-pedoman-content');
                        if (container) {
                            container.innerHTML = `
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error Loading Buku Pedoman</h5>
                                        <p>Terjadi kesalahan saat memuat buku pedoman:</p>
                                        <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 0.9rem;">${error.message}</pre>
                                        <div style="margin-top: 15px;">
                                            <button onclick="location.reload()" class="btn btn-primary">
                                                <i class="fas fa-refresh"></i> Refresh Halaman
                                            </button>
                                            <button onclick="console.log('Debug info:', {apiService: !!window.apiService, supabaseClient: !!window.supabaseClient, container: !!document.getElementById('buku-pedoman-content')})" class="btn btn-info">
                                                <i class="fas fa-bug"></i> Debug Info
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                    }
                } else {
                    console.error('initializeBukuPedoman function not available');
                    // Fallback: try direct initialization
                    try {
                        if (typeof BukuPedomanManager !== 'undefined') {
                            window.bukuPedomanManager = new BukuPedomanManager();
                        } else {
                            throw new Error('BukuPedomanManager class not available');
                        }
                    } catch (fallbackError) {
                        console.error('Fallback initialization failed:', fallbackError);
                        const container = document.getElementById('buku-pedoman-content');
                        if (container) {
                            container.innerHTML = `
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="text-warning"><i class="fas fa-exclamation-triangle"></i> Buku Pedoman Tidak Tersedia</h5>
                                        <p>Buku pedoman sedang dalam tahap pengembangan atau terjadi masalah teknis.</p>
                                        <p>Silakan hubungi administrator atau coba lagi nanti.</p>
                                        <button onclick="location.reload()" class="btn btn-primary">Refresh Halaman</button>
                                    </div>
                                </div>
                            `;
                        }
                    }
                }
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
            window.ResidualRiskModule?.load?.();
            break;
        case 'risk-register':
            window.loadRiskRegister?.();
            break;
        case 'risk-appetite':
        case 'risk-register-graph':
        case 'master-data':
            loadTabData(pageName);
            break;
        default:
            break;
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
            await loadRiskRegister();
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
        if (!force && kopSettingsCache) {
            renderKopHeader(kopSettingsCache);
            return;
        }
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
    } catch (error) {
        console.error('Kop header error:', error);
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

