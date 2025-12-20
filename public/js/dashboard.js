// Dashboard Module
let dashboardCharts = {};

// Check if Chart.js is loaded
function isChartJsReady() {
    return typeof Chart !== 'undefined' && Chart !== null;
}

// Wait for Chart.js to be ready
function waitForChartJs(callback, maxAttempts = 50) {
    if (isChartJsReady()) {
        callback();
        return;
    }
    
    let attempts = 0;
    const checkInterval = setInterval(() => {
        attempts++;
        if (isChartJsReady()) {
            clearInterval(checkInterval);
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('Chart.js failed to load after', maxAttempts, 'attempts');
        }
    }, 100);
}

async function loadDashboard() {
    try {
        console.log('=== DASHBOARD LOADING START ===');
        console.log('Current URL:', window.location.href);
        console.log('User authenticated:', !!window.currentUser);
        
        // Show loading state
        const content = document.getElementById('dashboard-content');
        if (content) {
            content.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Memuat data dashboard...</div>';
        } else {
            console.error('Dashboard content element not found!');
            return;
        }
        
        // Try public endpoint first for better reliability
        let stats;
        const endpoints = [
            '/api/dashboard/public',
            '/api/test-data/dashboard',
            '/api/dashboard',
            '/api/simple/dashboard', 
            '/api/debug-data/dashboard'
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Trying endpoint: ${endpoint}`);
                
                let response, data;
                
                if (endpoint === '/api/dashboard') {
                    // Use apiCall for authenticated endpoint
                    try {
                        data = await apiCall(endpoint);
                        console.log(`Dashboard data from authenticated endpoint:`, data);
                    } catch (authError) {
                        console.warn(`Authenticated endpoint failed: ${authError.message}`);
                        continue;
                    }
                } else {
                    // Use direct fetch for public endpoints
                    response = await fetch(`${window.location.origin}${endpoint}`);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    data = await response.json();
                    console.log(`Dashboard response from ${endpoint}:`, data);
                }
                
                // Handle different response formats
                if (data && data.success && data.data) {
                    stats = data.data;
                } else if (data && typeof data === 'object') {
                    stats = data;
                } else {
                    throw new Error('Invalid response format');
                }
                
                console.log(`Dashboard data processed from ${endpoint}:`, stats);
                
                // Validate that we have meaningful data
                if (stats && (stats.total_risks > 0 || stats.sample_data)) {
                    console.log(`Successfully loaded data from ${endpoint}`);
                    break;
                } else {
                    console.warn(`${endpoint} returned empty data, trying next endpoint`);
                    stats = null;
                    continue;
                }
                
            } catch (error) {
                console.warn(`Endpoint ${endpoint} failed:`, error.message);
                continue;
            }
        }
        
        if (!stats) {
            throw new Error('Tidak dapat memuat data dashboard dari semua endpoint yang tersedia.');
        }
        
        renderDashboard(stats);
        
        // Add debug info for troubleshooting
        console.log('=== DASHBOARD LOADING SUCCESS ===');
        console.log('Final stats object:', stats);
        console.log('Dashboard rendered successfully with data:', {
            totalRisks: stats?.total_risks || 0,
            visiMisiCount: stats?.sample_data?.visi_misi?.length || 0,
            rencanaStrategisCount: stats?.sample_data?.rencana_strategis?.length || 0,
            hasInherentRisks: !!(stats?.inherent_risks),
            hasResidualRisks: !!(stats?.residual_risks),
            hasKRI: !!(stats?.kri)
        });
        console.log('=== DASHBOARD LOADING END ===');
    } catch (error) {
        console.error('Error loading dashboard:', error);
        const content = document.getElementById('dashboard-content');
        if (content) {
            content.innerHTML = 
                '<div class="card"><div class="card-body"><h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error memuat dashboard</h5><p>' + error.message + '</p><button onclick="window.dashboardModule.loadDashboard()" class="btn btn-primary">Coba Lagi</button><button onclick="window.dashboardModule.loadTestData()" class="btn btn-secondary">Muat Data Test</button></div></div>';
        }
    }
}

async function loadTestData() {
    try {
        console.log('Loading test dashboard data...');
        
        const content = document.getElementById('dashboard-content');
        if (content) {
            content.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Memuat data test...</div>';
        }
        
        const stats = await apiCall('/api/test-data/dashboard');
        console.log('Test dashboard data loaded:', stats);
        
        if (!stats) {
            throw new Error('No test data received from server');
        }
        
        renderDashboard(stats);
    } catch (error) {
        console.error('Error loading test dashboard:', error);
        const content = document.getElementById('dashboard-content');
        if (content) {
            content.innerHTML = 
                '<div class="card"><div class="card-body"><h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error memuat data test</h5><p>' + error.message + '</p></div></div>';
        }
    }
}

function renderDashboard(stats) {
    console.log('=== RENDER DASHBOARD START ===');
    console.log('Received stats:', stats);
    
    const content = document.getElementById('dashboard-content');
    if (!content) {
        console.error('Dashboard content element not found');
        return;
    }
    
    // Ensure stats is an object
    const safeStats = stats || {};
    console.log('Safe stats:', safeStats);
    console.log('Total risks from safeStats:', safeStats.total_risks);
    console.log('Sample data from safeStats:', safeStats.sample_data);
    
    content.innerHTML = `
        <div class="dashboard-stats-grid">
            <div class="stat-card stat-primary">
                <div class="stat-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="stat-content">
                    <h3 class="stat-number">${safeStats.total_risks || 0}</h3>
                    <p class="stat-label">Total Risiko</p>
                    <small class="stat-description">Data risiko terdaftar</small>
                </div>
            </div>
            <div class="stat-card stat-danger">
                <div class="stat-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="stat-content">
                    <h3 class="stat-number">${safeStats.loss_events || 0}</h3>
                    <p class="stat-label">Loss Events</p>
                    <small class="stat-description">Kejadian kerugian</small>
                </div>
            </div>
            <div class="stat-card stat-success">
                <div class="stat-icon">
                    <i class="fas fa-bullseye"></i>
                </div>
                <div class="stat-content">
                    <h3 class="stat-number">${safeStats.sample_data?.visi_misi?.length || 0}</h3>
                    <p class="stat-label">Visi Misi</p>
                    <small class="stat-description">Visi misi aktif</small>
                </div>
            </div>
            <div class="stat-card stat-warning">
                <div class="stat-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-content">
                    <h3 class="stat-number">${safeStats.sample_data?.rencana_strategis?.length || 0}</h3>
                    <p class="stat-label">Rencana Strategis</p>
                    <small class="stat-description">Rencana strategis</small>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Ringkasan Risiko</h3>
                <p style="margin: 0; color: #6c757d; font-size: 0.875rem;">
                    Distribusi tingkat risiko dalam organisasi
                </p>
            </div>
            <div class="charts-grid">
                <div class="chart-card">
                    <h4 class="chart-title">Inherent Risk</h4>
                    <canvas id="inherent-risk-chart" width="300" height="300"></canvas>
                </div>
                <div class="chart-card">
                    <h4 class="chart-title">Residual Risk</h4>
                    <canvas id="residual-risk-chart" width="300" height="300"></canvas>
                </div>
                <div class="chart-card">
                    <h4 class="chart-title">Key Risk Indicator</h4>
                    <canvas id="kri-chart" width="300" height="300"></canvas>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Data Terbaru</h3>
                <p style="margin: 0; color: #6c757d; font-size: 0.875rem;">
                    Data terbaru dari database organisasi Anda
                </p>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h5><i class="fas fa-bullseye"></i> Visi Misi Terbaru</h5>
                        ${safeStats.sample_data?.visi_misi?.length > 0 ? 
                            safeStats.sample_data.visi_misi.slice(0, 3).map(item => `
                                <div class="data-item">
                                    <strong>Tahun ${item.tahun || 'N/A'}</strong>
                                    <small>${item.visi?.substring(0, 120) || 'Tidak ada deskripsi'}${item.visi?.length > 120 ? '...' : ''}</small>
                                </div>
                            `).join('') : 
                            `<div class="empty-state">
                                <i class="fas fa-info-circle"></i>
                                <p>Belum ada data visi misi. <a href="#" onclick="navigateToPage('visi-misi')">Tambah data visi misi</a></p>
                            </div>`
                        }
                    </div>
                    <div class="col-md-6">
                        <h5><i class="fas fa-chart-line"></i> Rencana Strategis Terbaru</h5>
                        ${safeStats.sample_data?.rencana_strategis?.length > 0 ? 
                            safeStats.sample_data.rencana_strategis.slice(0, 3).map(item => `
                                <div class="data-item" style="border-left-color: #28a745;">
                                    <strong>${item.nama_rencana || 'Rencana Strategis'}</strong>
                                    <small>${item.deskripsi?.substring(0, 120) || 'Tidak ada deskripsi'}${item.deskripsi?.length > 120 ? '...' : ''}</small>
                                </div>
                            `).join('') : 
                            `<div class="empty-state">
                                <i class="fas fa-info-circle"></i>
                                <p>Belum ada data rencana strategis. <a href="#" onclick="navigateToPage('rencana-strategis')">Tambah rencana strategis</a></p>
                            </div>`
                        }
                    </div>
                </div>
                
                ${safeStats.total_risks === 0 ? `
                <div class="alert-info">
                    <h6><i class="fas fa-exclamation-triangle"></i> Mulai Kelola Risiko</h6>
                    <p>
                        Belum ada data risiko yang terdaftar. <a href="#" onclick="navigateToPage('risk-input')">Mulai input data risiko</a> untuk memulai manajemen risiko organisasi Anda.
                    </p>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Wait for Chart.js and DOM to be ready before rendering charts
    waitForChartJs(() => {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
            try {
                renderInherentRiskChart(safeStats.inherent_risks || {});
                renderResidualRiskChart(safeStats.residual_risks || {});
                renderKRIChart(safeStats.kri || {});
            } catch (error) {
                console.error('Error rendering dashboard charts:', error);
            }
        }, 100);
    });
}

function renderInherentRiskChart(data) {
    const ctx = document.getElementById('inherent-risk-chart');
    if (!ctx || !isChartJsReady()) {
        console.warn('Chart context not available or Chart.js not ready');
        return;
    }
    
    if (dashboardCharts.inherent) {
        dashboardCharts.inherent.destroy();
    }
    
    try {
        dashboardCharts.inherent = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Extreme High', 'High', 'Medium', 'Low'],
                datasets: [{
                    data: [
                        data.extreme_high || 0,
                        data.high || 0,
                        data.medium || 0,
                        data.low || 0
                    ],
                    backgroundColor: [
                        '#dc2626',
                        '#f97316',
                        '#f59e0b',
                        '#10b981'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating inherent risk chart:', error);
    }
}

function renderResidualRiskChart(data) {
    const ctx = document.getElementById('residual-risk-chart');
    if (!ctx || !isChartJsReady()) {
        console.warn('Chart context not available or Chart.js not ready');
        return;
    }
    
    if (dashboardCharts.residual) {
        dashboardCharts.residual.destroy();
    }
    
    try {
        dashboardCharts.residual = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Extreme High', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [
                    data.extreme_high || 0,
                    data.high || 0,
                    data.medium || 0,
                    data.low || 0
                ],
                backgroundColor: [
                    '#dc2626',
                    '#f97316',
                    '#f59e0b',
                    '#10b981'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
    } catch (error) {
        console.error('Error creating residual risk chart:', error);
    }
}

function renderKRIChart(data) {
    const ctx = document.getElementById('kri-chart');
    if (!ctx || !isChartJsReady()) {
        console.warn('Chart context not available or Chart.js not ready');
        return;
    }
    
    if (dashboardCharts.kri) {
        dashboardCharts.kri.destroy();
    }
    
    try {
        dashboardCharts.kri = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Aman', 'Hati-hati', 'Kritis'],
            datasets: [{
                data: [
                    data.aman || 0,
                    data.hati_hati || 0,
                    data.kritis || 0
                ],
                backgroundColor: [
                    '#10b981',
                    '#f59e0b',
                    '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
    } catch (error) {
        console.error('Error creating KRI chart:', error);
    }
}

// Export for use in app.js
window.dashboardModule = {
    loadDashboard,
    loadTestData
};

// Set flag to indicate dashboard module is ready
window.dashboardModuleReady = true;
console.log('Dashboard module exported and ready');

