/**
 * Navigation System - Enhanced Page Navigation with Risk Profile Support
 * Handles page switching, data loading, and URL routing
 * Updated: 2026-01-10 - Added proper RS cleanup
 */

// Global navigation state
window.navigationState = {
    currentPage: 'dashboard',
    isNavigating: false,
    pageHistory: []
};

/**
 * CRITICAL: Remove RS content from non-RS pages
 * Enhanced cleanup to prevent RS content leak
 */
function cleanupRSSelectionList() {
    const currentPath = window.location.pathname;
    const currentPage = window.navigationState?.currentPage || '';
    const currentHash = window.location.hash;
    const isRSPage = currentPath === '/rencana-strategis' || 
                     currentPath.includes('rencana-strategis') || 
                     currentPage === 'rencana-strategis' ||
                     currentHash === '#rencana-strategis';
    
    if (!isRSPage) {
        console.log('🧹 Cleaning up RS content from non-RS page...');
        
        // Call RS module cleanup if available
        if (window.cleanupRSModule) {
            window.cleanupRSModule();
        }
        
        // Remove RS wrapper elements from all non-RS pages
        const otherPages = document.querySelectorAll('.page-content:not(#rencana-strategis)');
        otherPages.forEach(page => {
            const rsElements = page.querySelectorAll(
                '.rencana-strategis-wrapper, ' +
                '.rencana-strategis-container, ' +
                '.rencana-strategis-selection, ' +
                '.rs-selection-wrapper, ' +
                '.rs-selection-list, ' +
                '#rs-selection-container, ' +
                '[data-module="RencanaStrategisModule"]'
            );
            
            rsElements.forEach(el => {
                console.log('🗑️ Removing RS element:', el.className || el.id);
                el.remove();
            });
        });
        
        // Hide RS page element
        const rsPage = document.getElementById('rencana-strategis');
        if (rsPage) {
            rsPage.classList.remove('active');
            rsPage.style.display = 'none';
            rsPage.style.visibility = 'hidden';
            rsPage.style.opacity = '0';
            rsPage.style.position = 'absolute';
            rsPage.style.left = '-99999px';
        }
    }
}

/**
 * Navigate to a specific page
 * @param {string} pageName - The page to navigate to
 * @param {boolean} updateHistory - Whether to update browser history
 */
async function navigateToPage(pageName, updateHistory = true) {
    console.log(`🧭 Navigating to page: ${pageName}`);
    
    // CRITICAL: Get previous page before navigation
    const previousPage = window.navigationState?.currentPage || '';
    
    // CRITICAL: Cleanup RS module if leaving RS page
    if (previousPage === 'rencana-strategis' && pageName !== 'rencana-strategis') {
        console.log('🧹 Leaving RS page, cleaning up RS module...');
        if (window.RencanaStrategisModule && typeof window.RencanaStrategisModule.cleanup === 'function') {
            window.RencanaStrategisModule.cleanup();
        }
        // Also reset global flags
        window.rencanaStrategisModuleLoaded = false;
        window.rencanaStrategisLoadTime = 0;
        window.RENCANA_STRATEGIS_VIEW_LOCKED = false;
    }
    
    // Cleanup Renstra module if leaving renstra page
    if (previousPage === 'renstra' && pageName !== 'renstra') {
        console.log('🧹 Leaving Renstra page, cleaning up...');
        if (window.RenstraModule && typeof window.RenstraModule.cleanup === 'function') {
            window.RenstraModule.cleanup();
        }
    }
    
    // CRITICAL: Cleanup RS selection list before navigation
    cleanupRSSelectionList();
    
    // Prevent concurrent navigation
    if (window.navigationState.isNavigating) {
        console.log('⚠️ Navigation already in progress, ignoring request');
        return;
    }
    
    window.navigationState.isNavigating = true;
    
    try {
        // Validate page name
        if (!pageName || typeof pageName !== 'string') {
            console.error('❌ Invalid page name:', pageName);
            pageName = 'dashboard';
        }
        
        // Clean page name
        pageName = pageName.toLowerCase().trim();
        
        // Handle URL-style page names
        if (pageName.includes('/')) {
            const parts = pageName.split('/');
            pageName = parts[parts.length - 1] || parts[parts.length - 2] || 'dashboard';
        }
        
        // Map legacy page names
        const pageMapping = {
            'manajemen-risiko': 'dashboard',
            'analisis-risiko': 'dashboard',
            'identifikasi-risiko': 'risk-input'
        };
        
        if (pageMapping[pageName]) {
            pageName = pageMapping[pageName];
        }
        
        console.log(`📄 Final page name: ${pageName}`);
        
        // Hide all pages first
        hideAllPages();
        
        // Show target page
        const success = await showPage(pageName);
        
        if (success) {
            // Update navigation state
            window.navigationState.currentPage = pageName;
            window.navigationState.pageHistory.push(pageName);
            
            // Update active menu item
            updateActiveMenuItem(pageName);
            
            // Update page title
            updatePageTitle(pageName);
            
            // Update browser URL if requested
            if (updateHistory && window.history) {
                const url = pageName === 'dashboard' ? '/' : `/${pageName}`;
                window.history.pushState({ page: pageName }, '', url);
            }
            
            // Load page data
            await loadPageData(pageName);
            
            // CRITICAL: Cleanup RS selection list after navigation
            setTimeout(cleanupRSSelectionList, 100);
            setTimeout(cleanupRSSelectionList, 500);
            
            console.log(`✅ Successfully navigated to: ${pageName}`);
        } else {
            console.error(`❌ Failed to navigate to: ${pageName}`);
            // Fallback to dashboard
            if (pageName !== 'dashboard') {
                await navigateToPage('dashboard', updateHistory);
            }
        }
        
    } catch (error) {
        console.error('❌ Navigation error:', error);
        // Fallback to dashboard on error
        if (pageName !== 'dashboard') {
            await navigateToPage('dashboard', updateHistory);
        }
    } finally {
        window.navigationState.isNavigating = false;
        // Final cleanup
        setTimeout(cleanupRSSelectionList, 200);
    }
}

/**
 * Hide all page content divs
 * Enhanced to properly cleanup RS content
 */
function hideAllPages() {
    console.log('🙈 Hiding all pages...');
    
    // Hide all page-content divs with proper cleanup
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
        page.style.visibility = 'hidden';
        page.style.opacity = '0';
        page.style.position = 'absolute';
        page.style.left = '-99999px';
        page.style.top = '-99999px';
        page.style.zIndex = '-1';
        page.style.pointerEvents = 'none';
    });
    
    // Cleanup RS content from all pages
    cleanupRSSelectionList();
}

/**
 * Show a specific page
 * Enhanced with proper visibility and RS isolation
 * @param {string} pageName - The page to show
 * @returns {boolean} - Success status
 */
async function showPage(pageName) {
    console.log(`👁️ Showing page: ${pageName}`);
    
    try {
        // Find the page element
        let pageElement = document.getElementById(pageName);
        
        // If not found, try with different selectors
        if (!pageElement) {
            pageElement = document.querySelector(`[data-page="${pageName}"]`) ||
                         document.querySelector(`.page-content[id*="${pageName}"]`) ||
                         document.querySelector(`#${pageName}-content`)?.parentElement;
        }
        
        if (pageElement) {
            // Show the page with proper styles
            pageElement.style.display = 'block';
            pageElement.style.visibility = 'visible';
            pageElement.style.opacity = '1';
            pageElement.style.position = 'relative';
            pageElement.style.left = 'auto';
            pageElement.style.top = 'auto';
            pageElement.style.zIndex = '1';
            pageElement.style.pointerEvents = 'auto';
            pageElement.classList.add('active');
            
            // Force reflow to ensure styles are applied
            pageElement.offsetHeight;
            
            // If NOT RS page, cleanup any RS content that might have leaked
            if (pageName !== 'rencana-strategis') {
                const rsElements = pageElement.querySelectorAll(
                    '.rencana-strategis-wrapper, ' +
                    '.rencana-strategis-container, ' +
                    '.rs-selection-wrapper'
                );
                rsElements.forEach(el => {
                    console.log('🗑️ Removing leaked RS element from:', pageName);
                    el.remove();
                });
            }
            
            console.log(`✅ Page element found and shown: ${pageName}`);
            return true;
        } else {
            console.warn(`⚠️ Page element not found: ${pageName}`);
            
            // Try to create a basic page structure for missing pages
            if (pageName === 'risk-profile') {
                return createRiskProfilePage();
            }
            
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error showing page ${pageName}:`, error);
        return false;
    }
}

/**
 * Create Risk Profile page if it doesn't exist
 * @returns {boolean} - Success status
 */
function createRiskProfilePage() {
    console.log('🏗️ Creating Risk Profile page...');
    
    try {
        // Check if page already exists
        let pageElement = document.getElementById('risk-profile');
        
        if (!pageElement) {
            // Create the page element
            pageElement = document.createElement('div');
            pageElement.id = 'risk-profile';
            pageElement.className = 'page-content';
            
            pageElement.innerHTML = `
                <div class="page-header">
                    <h1 class="page-title">
                        <i class="page-title-icon fas fa-chart-bar"></i> 
                        Risk Profile
                    </h1>
                    <p class="page-subtitle">Profil Risiko Inheren</p>
                </div>
                <div id="risk-profile-content">
                    <div class="loading-container">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <p>Memuat data risk profile...</p>
                    </div>
                </div>
            `;
            
            // Insert into main content area
            const mainContent = document.querySelector('.main-content .content-area') ||
                               document.querySelector('.main-content') ||
                               document.querySelector('main');
            
            if (mainContent) {
                mainContent.appendChild(pageElement);
                console.log('✅ Risk Profile page created and added to DOM');
            } else {
                console.error('❌ Could not find main content area to insert page');
                return false;
            }
        }
        
        // Show the page
        pageElement.style.display = 'block';
        pageElement.classList.add('active');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error creating Risk Profile page:', error);
        return false;
    }
}

/**
 * Load data for a specific page
 * @param {string} pageName - The page name
 */
async function loadPageData(pageName) {
    console.log(`📊 Loading data for page: ${pageName}`);
    
    try {
        switch (pageName) {
            case 'dashboard':
                if (typeof loadDashboard === 'function') {
                    await loadDashboard();
                } else if (window.DashboardModule && typeof window.DashboardModule.load === 'function') {
                    await window.DashboardModule.load();
                }
                break;
                
            case 'risk-profile':
                console.log('🎯 Loading Risk Profile data...');
                if (typeof loadRiskProfile === 'function') {
                    await loadRiskProfile();
                } else if (window.RiskProfileModule && typeof window.RiskProfileModule.load === 'function') {
                    await window.RiskProfileModule.load();
                } else {
                    console.warn('⚠️ Risk Profile module not found, loading manually...');
                    await loadRiskProfileManually();
                }
                break;
                
            case 'residual-risk':
                console.log('🎯 Loading Residual Risk data...');
                if (typeof loadResidualRisk === 'function') {
                    await loadResidualRisk();
                } else if (window.ResidualRiskModule && typeof window.ResidualRiskModule.load === 'function') {
                    console.log('🎯 Using ResidualRiskModule.load()...');
                    await window.ResidualRiskModule.load();
                } else {
                    console.warn('⚠️ Residual Risk module not found, loading manually...');
                    await loadResidualRiskManually();
                }
                break;
                
            case 'kri':
                console.log('🎯 Loading KRI data...');
                if (typeof loadKRI === 'function') {
                    await loadKRI();
                } else if (window.kriModule && typeof window.kriModule.load === 'function') {
                    console.log('🎯 Using kriModule.load()...');
                    await window.kriModule.load();
                } else {
                    console.warn('⚠️ KRI module not found, loading manually...');
                    await loadKRIManually();
                }
                break;
                
            case 'risk-register':
                if (typeof loadRiskRegister === 'function') {
                    await loadRiskRegister();
                } else if (window.RiskRegisterModule && typeof window.RiskRegisterModule.load === 'function') {
                    await window.RiskRegisterModule.load();
                }
                break;
                
            case 'risk-input':
                if (typeof loadRiskInput === 'function') {
                    await loadRiskInput();
                } else if (window.RiskInputModule && typeof window.RiskInputModule.load === 'function') {
                    await window.RiskInputModule.load();
                }
                break;
                
            case 'analisis-swot':
                if (typeof loadAnalisisSwot === 'function') {
                    await loadAnalisisSwot();
                } else if (window.analisisSwotModule && typeof window.analisisSwotModule.load === 'function') {
                    await window.analisisSwotModule.load();
                }
                break;
                
            case 'rencana-strategis':
                    console.log('📋 Loading Rencana Strategis (Clean Module)...');
                    
                    // Ensure proper page visibility IMMEDIATELY
                    const rsPage = document.getElementById('rencana-strategis');
                    const rsContent = document.getElementById('rencana-strategis-content');
                    
                    if (rsPage) {
                        rsPage.classList.add('active');
                        rsPage.style.display = 'block';
                        rsPage.style.visibility = 'visible';
                        rsPage.style.opacity = '1';
                        rsPage.style.position = 'relative';
                        rsPage.style.background = '#f8f9fa';
                    }
                    
                    if (rsContent) {
                        rsContent.style.display = 'block';
                        rsContent.style.visibility = 'visible';
                        rsContent.style.opacity = '1';
                        rsContent.style.minHeight = '400px';
                    }
                    
                    // Load the clean module
                    if (window.RencanaStrategisClean && typeof window.RencanaStrategisClean.load === 'function') {
                        await window.RencanaStrategisClean.load();
                    } else if (window.RencanaStrategisModule && typeof window.RencanaStrategisModule.load === 'function') {
                        await window.RencanaStrategisModule.load();
                    }
                    
                    console.log('✅ Rencana Strategis loaded');
                    break;
                
            case 'master-data':
                if (typeof loadMasterData === 'function') {
                    await loadMasterData();
                } else if (window.MasterDataModule && typeof window.MasterDataModule.load === 'function') {
                    await window.MasterDataModule.load();
                }
                break;
                
            case 'laporan':
                if (typeof loadLaporan === 'function') {
                    await loadLaporan();
                } else if (window.LaporanModule && typeof window.LaporanModule.load === 'function') {
                    await window.LaporanModule.load();
                }
                break;
                
            case 'buku-pedoman':
                if (typeof loadBukuPedoman === 'function') {
                    await loadBukuPedoman();
                } else if (window.bukuPedomanModule && typeof window.bukuPedomanModule.load === 'function') {
                    await window.bukuPedomanModule.load();
                }
                break;
                
            default:
                console.log(`ℹ️ No specific data loader for page: ${pageName}`);
                break;
        }
        
        console.log(`✅ Data loaded for page: ${pageName}`);
        
    } catch (error) {
        console.error(`❌ Error loading data for page ${pageName}:`, error);
        
        // Show error message in page content
        const pageContent = document.querySelector(`#${pageName}-content`) ||
                           document.querySelector(`#${pageName} .page-content`);
        
        if (pageContent) {
            pageContent.innerHTML = `
                <div class="error-container">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Error:</strong> Gagal memuat data halaman.
                        <br><small>${error.message}</small>
                    </div>
                    <button class="btn btn-primary" onclick="loadPageData('${pageName}')">
                        <i class="fas fa-refresh"></i> Coba Lagi
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Load Risk Profile data manually if module not available
 */
async function loadRiskProfileManually() {
    console.log('🔧 Loading Risk Profile manually...');
    
    try {
        const container = document.getElementById('risk-profile-content');
        if (!container) {
            console.error('❌ Risk Profile content container not found');
            return;
        }
        
        // Show loading state
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Memuat data risk profile...</p>
            </div>
        `;
        
        // Load data from API
        const apiCall = window.app ? window.app.apiCall : window.apiCall;
        if (!apiCall) {
            throw new Error('API call function not available');
        }
        
        const data = await apiCall('/api/risk-profile');
        console.log('📊 Risk Profile data loaded:', data?.length || 0, 'items');
        
        // Render the data
        renderRiskProfileData(data || []);
        
    } catch (error) {
        console.error('❌ Error loading Risk Profile manually:', error);
        
        const container = document.getElementById('risk-profile-content');
        if (container) {
            container.innerHTML = `
                <div class="error-container">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Error:</strong> Gagal memuat data Risk Profile.
                        <br><small>${error.message}</small>
                    </div>
                    <button class="btn btn-primary" onclick="loadRiskProfileManually()">
                        <i class="fas fa-refresh"></i> Coba Lagi
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Render Risk Profile data
 * @param {Array} data - Risk profile data
 */
function renderRiskProfileData(data) {
    console.log('🎨 Rendering Risk Profile data...');
    
    const container = document.getElementById('risk-profile-content');
    if (!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <h3>Tidak Ada Data Risk Profile</h3>
                <p>Belum ada data analisis risiko inheren. Silakan lakukan input data risiko terlebih dahulu.</p>
                <button class="btn btn-primary" onclick="navigateToPage('risk-input')">
                    <i class="fas fa-plus-circle"></i> Input Data Risiko
                </button>
            </div>
        `;
        return;
    }
    
    // Calculate statistics
    const stats = {
        total: data.length,
        extreme: data.filter(d => 
            d.risk_level === 'EXTREME HIGH' || 
            d.risk_level === 'Very High' || 
            d.risk_level === 'Sangat Tinggi'
        ).length,
        high: data.filter(d => 
            d.risk_level === 'HIGH RISK' || 
            d.risk_level === 'Tinggi'
        ).length,
        medium: data.filter(d => 
            d.risk_level === 'MEDIUM RISK' || 
            d.risk_level === 'Sedang'
        ).length,
        low: data.filter(d => 
            d.risk_level === 'LOW RISK' || 
            d.risk_level === 'Rendah'
        ).length
    };
    
    container.innerHTML = `
        <div class="risk-profile-dashboard">
            <!-- Statistics Cards -->
            <div class="stats-grid">
                <div class="stat-card total">
                    <div class="stat-icon">
                        <i class="fas fa-chart-bar"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.total}</div>
                        <div class="stat-label">Total Risiko</div>
                    </div>
                </div>
                <div class="stat-card extreme">
                    <div class="stat-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.extreme}</div>
                        <div class="stat-label">Extreme High</div>
                    </div>
                </div>
                <div class="stat-card high">
                    <div class="stat-icon">
                        <i class="fas fa-arrow-up"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.high}</div>
                        <div class="stat-label">High Risk</div>
                    </div>
                </div>
                <div class="stat-card medium">
                    <div class="stat-icon">
                        <i class="fas fa-minus"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.medium}</div>
                        <div class="stat-label">Medium Risk</div>
                    </div>
                </div>
                <div class="stat-card low">
                    <div class="stat-icon">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.low}</div>
                        <div class="stat-label">Low Risk</div>
                    </div>
                </div>
            </div>
            
            <!-- Risk Profile Table -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-table"></i> Detail Risk Profile
                    </h3>
                    <div class="card-tools">
                        <button class="btn btn-success" onclick="loadRiskProfileManually()">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                        <button class="btn btn-primary" onclick="downloadRiskProfileReport()">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Kode Risiko</th>
                                    <th>Unit Kerja</th>
                                    <th>Kategori</th>
                                    <th>Probabilitas</th>
                                    <th>Dampak</th>
                                    <th>Risk Value</th>
                                    <th>Risk Level</th>
                                    <th>Dampak Finansial</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map((item, index) => {
                                    const risk = item.risk_inputs || {};
                                    return `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td><strong>${risk.kode_risiko || '-'}</strong></td>
                                            <td>${risk.master_work_units?.name || '-'}</td>
                                            <td>${risk.master_risk_categories?.name || '-'}</td>
                                            <td>${item.probability || '-'}</td>
                                            <td>${item.impact || '-'}</td>
                                            <td><strong>${item.risk_value || '-'}</strong></td>
                                            <td>
                                                <span class="badge badge-${getRiskLevelColor(item.risk_level)}">
                                                    ${item.risk_level || '-'}
                                                </span>
                                            </td>
                                            <td>Rp ${formatNumber(item.financial_impact || 0)}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .risk-profile-dashboard {
                padding: 1rem;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }
            
            .stat-card {
                background: white;
                border-radius: 8px;
                padding: 1.5rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .stat-card.total { border-left: 4px solid #007bff; }
            .stat-card.extreme { border-left: 4px solid #dc3545; }
            .stat-card.high { border-left: 4px solid #fd7e14; }
            .stat-card.medium { border-left: 4px solid #ffc107; }
            .stat-card.low { border-left: 4px solid #28a745; }
            
            .stat-icon {
                font-size: 2rem;
                opacity: 0.7;
            }
            
            .stat-number {
                font-size: 2rem;
                font-weight: bold;
                color: #2c3e50;
            }
            
            .stat-label {
                font-size: 0.875rem;
                color: #6c757d;
            }
            
            .empty-state {
                text-align: center;
                padding: 3rem;
                color: #6c757d;
            }
            
            .empty-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                opacity: 0.5;
            }
            
            .loading-container {
                text-align: center;
                padding: 3rem;
            }
            
            .loading-spinner {
                font-size: 2rem;
                margin-bottom: 1rem;
                color: #007bff;
            }
            
            .error-container {
                text-align: center;
                padding: 2rem;
            }
            
            .badge-extreme { background-color: #dc3545 !important; }
            .badge-high { background-color: #fd7e14 !important; }
            .badge-medium { background-color: #ffc107 !important; color: #212529 !important; }
            .badge-low { background-color: #28a745 !important; }
        </style>
    `;
    
    console.log('✅ Risk Profile data rendered successfully');
}

/**
 * Get risk level color class
 * @param {string} level - Risk level
 * @returns {string} - Color class
 */
function getRiskLevelColor(level) {
    const colorMap = {
        'EXTREME HIGH': 'extreme',
        'HIGH RISK': 'high',
        'MEDIUM RISK': 'medium',
        'LOW RISK': 'low',
        'Very High': 'extreme',
        'Sangat Tinggi': 'extreme',
        'Tinggi': 'high',
        'Sedang': 'medium',
        'Rendah': 'low'
    };
    return colorMap[level] || 'secondary';
}

/**
 * Format number with Indonesian locale
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Download Risk Profile report
 */
async function downloadRiskProfileReport() {
    try {
        const link = document.createElement('a');
        link.href = '/api/risk-profile-excel';
        link.download = `risk-profile-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Risk Profile report download initiated');
    } catch (error) {
        console.error('❌ Error downloading report:', error);
        alert('Gagal mengunduh laporan: ' + error.message);
    }
}

/**
 * Update active menu item
 * @param {string} pageName - The page name
 */
function updateActiveMenuItem(pageName) {
    try {
        // Remove active class from all menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current menu item
        const currentMenuItem = document.querySelector(`.menu-item[data-page="${pageName}"]`);
        if (currentMenuItem) {
            currentMenuItem.classList.add('active');
            
            // Handle submenu expansion
            const parentSubmenu = currentMenuItem.closest('.sidebar-submenu');
            if (parentSubmenu) {
                parentSubmenu.classList.add('expanded');
                const section = parentSubmenu.dataset.submenu;
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
            
            console.log(`✅ Menu item activated: ${pageName}`);
        } else {
            console.warn(`⚠️ Menu item not found for page: ${pageName}`);
        }
    } catch (error) {
        console.error(`❌ Error updating active menu item for ${pageName}:`, error);
    }
}

/**
 * Update page title in header and document
 * @param {string} pageName - The page name
 */
function updatePageTitle(pageName) {
    const titleMap = {
        'dashboard': { title: 'Dashboard', icon: 'fas fa-home' },
        'visi-misi': { title: 'Visi dan Misi', icon: 'fas fa-bullseye' },
        'rencana-strategis': { title: 'Rencana Strategis', icon: 'fas fa-chart-line' },
        'analisis-swot': { title: 'Analisis SWOT', icon: 'fas fa-chart-bar' },
        'diagram-kartesius': { title: 'Diagram Kartesius', icon: 'fas fa-chart-scatter' },
        'matriks-tows': { title: 'Matriks TOWS', icon: 'fas fa-table-cells' },
        'sasaran-strategi': { title: 'Sasaran Strategi', icon: 'fas fa-bullseye' },
        'strategic-map': { title: 'Strategic Map', icon: 'fas fa-project-diagram' },
        'indikator-kinerja-utama': { title: 'Indikator Kinerja Utama', icon: 'fas fa-tachometer-alt' },
        'risk-input': { title: 'Input Data Risiko', icon: 'fas fa-pen-to-square' },
        'monitoring-evaluasi': { title: 'Monitoring & Evaluasi', icon: 'fas fa-clipboard-check' },
        'peluang': { title: 'Peluang', icon: 'fas fa-lightbulb' },
        'risk-profile': { title: 'Risk Profile', icon: 'fas fa-chart-bar' },
        'residual-risk': { title: 'Residual Risk', icon: 'fas fa-chart-pie' },
        'kri': { title: 'Key Risk Indicator', icon: 'fas fa-gauge-high' },
        'loss-event': { title: 'Loss Event', icon: 'fas fa-exclamation-triangle' },
        'ews': { title: 'Early Warning System', icon: 'fas fa-triangle-exclamation' },
        'risk-register': { title: 'Risk Register', icon: 'fas fa-table-list' },
        'laporan': { title: 'Laporan', icon: 'fas fa-file-pdf' },
        'master-data': { title: 'Master Data', icon: 'fas fa-database' },
        'buku-pedoman': { title: 'Buku Pedoman', icon: 'fas fa-book' },
        'pengaturan': { title: 'Pengaturan', icon: 'fas fa-cog' }
    };
    
    const pageInfo = titleMap[pageName] || { title: 'Halaman', icon: 'fas fa-file' };
    
    // Update header title
    const pageTitleEl = document.getElementById('page-title-text');
    const pageTitleIconEl = document.getElementById('page-title-icon');
    
    if (pageTitleEl) {
        pageTitleEl.textContent = pageInfo.title;
    }
    
    if (pageTitleIconEl) {
        pageTitleIconEl.className = `page-title-icon ${pageInfo.icon}`;
    }
    
    // Update document title
    document.title = `${pageInfo.title} - Aplikasi Manajemen Risiko`;
}

/**
 * Manual fallback for loading KRI data
 */
async function loadKRIManually() {
    console.log('🔧 Loading KRI manually...');
    
    const container = document.getElementById('kri-content');
    if (!container) {
        console.error('❌ KRI content container not found');
        return;
    }
    
    try {
        // Show loading state
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Memuat data KRI...</p>
            </div>
        `;
        
        // Check if kriModule is available
        if (window.kriModule && typeof window.kriModule.load === 'function') {
            console.log('🎯 kriModule found, using it...');
            await window.kriModule.load();
            return;
        }
        
        // Fallback: Try to load data directly
        console.log('🔧 Using direct API fallback...');
        
        // Check authentication
        if (!window.isAuthenticated && (!window.authService || !window.authService.isAuthenticated())) {
            throw new Error('Anda harus login terlebih dahulu untuk mengakses halaman ini.');
        }
        
        // Try to get data from simple endpoint
        const response = await fetch('/api/kri/simple');
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Display basic data
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-gauge-high"></i> Key Risk Indicator</h3>
                    <div class="text-muted">Data loaded via fallback method</div>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <h5><i class="fas fa-info-circle"></i> Fallback Mode</h5>
                        <p>Halaman ini dimuat menggunakan mode fallback. Beberapa fitur mungkin tidak tersedia.</p>
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            <i class="fas fa-refresh"></i> Refresh Halaman
                        </button>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <div class="card bg-primary text-white">
                                <div class="card-body">
                                    <h4>${Array.isArray(data) ? data.length : 0}</h4>
                                    <p class="mb-0">Total KRI</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-success text-white">
                                <div class="card-body">
                                    <h4>${Array.isArray(data) ? data.filter(item => item.status_indikator === 'Aman').length : 0}</h4>
                                    <p class="mb-0">Aman</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-warning text-white">
                                <div class="card-body">
                                    <h4>${Array.isArray(data) ? data.filter(item => item.status_indikator === 'Hati-hati' || item.status_indikator === 'Peringatan').length : 0}</h4>
                                    <p class="mb-0">Hati-hati</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-danger text-white">
                                <div class="card-body">
                                    <h4>${Array.isArray(data) ? data.filter(item => item.status_indikator === 'Kritis').length : 0}</h4>
                                    <p class="mb-0">Kritis</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Kode</th>
                                    <th>Nama Indikator</th>
                                    <th>Kategori</th>
                                    <th>Nilai Aktual</th>
                                    <th>Status</th>
                                    <th>Unit Kerja</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Array.isArray(data) ? data.map(item => `
                                    <tr>
                                        <td><strong>${item.kode || '-'}</strong></td>
                                        <td>${item.nama_indikator || '-'}</td>
                                        <td>${item.master_risk_categories?.name || '-'}</td>
                                        <td><span class="badge bg-primary">${item.nilai_aktual || 0}</span></td>
                                        <td><span class="badge ${getKRIStatusBadgeClass(item.status_indikator)}">${item.status_indikator || '-'}</span></td>
                                        <td>${item.master_work_units?.name || '-'}</td>
                                    </tr>
                                `).join('') : '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        console.log('✅ KRI loaded manually with fallback');
        
    } catch (error) {
        console.error('❌ Error loading KRI manually:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Data</h4>
                <p>Gagal memuat data KRI: ${error.message}</p>
                <div class="mt-3">
                    <button class="btn btn-primary" onclick="loadKRIManually()">
                        <i class="fas fa-refresh"></i> Coba Lagi
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.reload()">
                        <i class="fas fa-refresh"></i> Refresh Halaman
                    </button>
                </div>
            </div>
        `;
    }
}

/**
 * Get KRI status badge class
 * @param {string} status - KRI status
 * @returns {string} - Badge class
 */
function getKRIStatusBadgeClass(status) {
    const statusMap = {
        'Aman': 'bg-success',
        'Hati-hati': 'bg-warning',
        'Peringatan': 'bg-warning',
        'Kritis': 'bg-danger'
    };
    return statusMap[status] || 'bg-secondary';
}

/**
 * Manual fallback for loading residual risk data
 */
async function loadResidualRiskManually() {
    console.log('🔧 Loading Residual Risk manually...');
    
    const container = document.getElementById('residual-risk-content');
    if (!container) {
        console.error('❌ Residual risk content container not found');
        return;
    }
    
    try {
        // Show loading state
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Memuat data residual risk...</p>
            </div>
        `;
        
        // Check if ResidualRiskModule is available
        if (window.ResidualRiskModule && typeof window.ResidualRiskModule.load === 'function') {
            console.log('🎯 ResidualRiskModule found, using it...');
            await window.ResidualRiskModule.load();
            return;
        }
        
        // Fallback: Try to load data directly
        console.log('🔧 Using direct API fallback...');
        
        // Check authentication
        if (!window.isAuthenticated && (!window.authService || !window.authService.isAuthenticated())) {
            throw new Error('Anda harus login terlebih dahulu untuk mengakses halaman ini.');
        }
        
        // Try to get data from simple endpoint
        const response = await fetch('/api/reports/residual-risk-simple');
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Display basic data
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-chart-pie"></i> Residual Risk Analysis</h3>
                    <div class="text-muted">Data loaded via fallback method</div>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <h5><i class="fas fa-info-circle"></i> Fallback Mode</h5>
                        <p>Halaman ini dimuat menggunakan mode fallback. Beberapa fitur mungkin tidak tersedia.</p>
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            <i class="fas fa-refresh"></i> Refresh Halaman
                        </button>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <div class="card bg-primary text-white">
                                <div class="card-body">
                                    <h4>${Array.isArray(data) ? data.length : 0}</h4>
                                    <p class="mb-0">Total Residual Risk</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-success text-white">
                                <div class="card-body">
                                    <h4>${Array.isArray(data) ? data.filter(item => item.risk_level === 'Low' || item.risk_level === 'Rendah').length : 0}</h4>
                                    <p class="mb-0">Low Risk</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-warning text-white">
                                <div class="card-body">
                                    <h4>${Array.isArray(data) ? data.filter(item => item.risk_level === 'Medium' || item.risk_level === 'Sedang').length : 0}</h4>
                                    <p class="mb-0">Medium Risk</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-danger text-white">
                                <div class="card-body">
                                    <h4>${Array.isArray(data) ? data.filter(item => item.risk_level === 'High' || item.risk_level === 'Tinggi').length : 0}</h4>
                                    <p class="mb-0">High Risk</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Kode Risiko</th>
                                    <th>Unit Kerja</th>
                                    <th>Sasaran</th>
                                    <th>Risk Value</th>
                                    <th>Risk Level</th>
                                    <th>Department</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Array.isArray(data) ? data.map(item => `
                                    <tr>
                                        <td><strong>${item.risk_inputs?.kode_risiko || '-'}</strong></td>
                                        <td>${item.risk_inputs?.master_work_units?.name || '-'}</td>
                                        <td>${item.risk_inputs?.sasaran || '-'}</td>
                                        <td><span class="badge bg-primary">${item.risk_value || 0}</span></td>
                                        <td><span class="badge ${getRiskLevelBadgeClass(item.risk_level)}">${item.risk_level || '-'}</span></td>
                                        <td>${item.department || '-'}</td>
                                    </tr>
                                `).join('') : '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        console.log('✅ Residual Risk loaded manually with fallback');
        
    } catch (error) {
        console.error('❌ Error loading Residual Risk manually:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Data</h4>
                <p>Gagal memuat data residual risk: ${error.message}</p>
                <div class="mt-3">
                    <button class="btn btn-primary" onclick="loadResidualRiskManually()">
                        <i class="fas fa-refresh"></i> Coba Lagi
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.reload()">
                        <i class="fas fa-refresh"></i> Refresh Halaman
                    </button>
                </div>
            </div>
        `;
    }
}

// Make functions globally available
window.navigateToPage = navigateToPage;
window.loadPageData = loadPageData;
window.loadRiskProfileManually = loadRiskProfileManually;
window.loadKRIManually = loadKRIManually;
window.loadResidualRiskManually = loadResidualRiskManually;
window.downloadRiskProfileReport = downloadRiskProfileReport;
window.updateActiveMenuItem = updateActiveMenuItem;
window.updatePageTitle = updatePageTitle;

console.log('✅ Navigation system loaded');