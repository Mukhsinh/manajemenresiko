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
        console.log('Loading dashboard data...');
        
        // Show loading state
        const content = document.getElementById('dashboard-content');
        if (content) {
            content.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Memuat data dashboard...</div>';
        }
        
        // Try authenticated endpoint first
        let stats;
        try {
            console.log('Trying authenticated dashboard endpoint...');
            stats = await apiCall('/api/dashboard');
            console.log('Dashboard data loaded from authenticated endpoint:', stats);
        } catch (authError) {
            console.warn('Authenticated dashboard failed:', authError.message);
            
            // Try fallback endpoints
            const fallbackEndpoints = [
                '/api/simple/dashboard', 
                '/api/debug-data/dashboard',
                '/api/test-data/dashboard'
            ];
            
            for (const endpoint of fallbackEndpoints) {
                try {
                    console.log(`Trying fallback endpoint: ${endpoint}`);
                    const response = await apiCall(endpoint);
                    console.log(`Dashboard response from ${endpoint}:`, response);
                    
                    // Handle different response formats
                    if (response && response.success && response.data) {
                        stats = response.data;
                    } else if (response && typeof response === 'object') {
                        stats = response;
                    } else {
                        throw new Error('Invalid response format');
                    }
                    
                    console.log(`Dashboard data processed from ${endpoint}:`, stats);
                    break;
                } catch (error) {
                    console.warn(`Endpoint ${endpoint} failed:`, error.message);
                    continue;
                }
            }
            
            if (!stats) {
                throw new Error('Tidak dapat memuat data dashboard. Silakan login terlebih dahulu atau hubungi administrator.');
            }
        }
        
        renderDashboard(stats);
        
        // Add debug info for troubleshooting
        console.log('Dashboard rendered successfully with data:', {
            totalRisks: stats?.total_risks || 0,
            visiMisiCount: stats?.sample_data?.visi_misi?.length || 0,
            rencanaStrategisCount: stats?.sample_data?.rencana_strategis?.length || 0,
            hasInherentRisks: !!(stats?.inherent_risks),
            hasResidualRisks: !!(stats?.residual_risks),
            hasKRI: !!(stats?.kri)
        });
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
    const content = document.getElementById('dashboard-content');
    if (!content) {
        console.error('Dashboard content element not found');
        return;
    }
    
    // Ensure stats is an object
    const safeStats = stats || {};
    
    content.innerHTML = `
        <div class="charts-grid">
            <div class="chart-card">
                <h3 class="chart-title">Total Risiko</h3>
                <div style="font-size: 2rem; font-weight: 700; color: #007bff; text-align: center;">
                    ${safeStats.total_risks || 0}
                </div>
                <p style="text-align: center; color: #6c757d; font-size: 0.875rem;">
                    Data risiko terdaftar
                </p>
            </div>
            <div class="chart-card">
                <h3 class="chart-title">Loss Events</h3>
                <div style="font-size: 2rem; font-weight: 700; color: #dc3545; text-align: center;">
                    ${safeStats.loss_events || 0}
                </div>
                <p style="text-align: center; color: #6c757d; font-size: 0.875rem;">
                    Kejadian kerugian
                </p>
            </div>
            <div class="chart-card">
                <h3 class="chart-title">Visi Misi</h3>
                <div style="font-size: 2rem; font-weight: 700; color: #28a745; text-align: center;">
                    ${safeStats.sample_data?.visi_misi?.length || 0}
                </div>
                <p style="text-align: center; color: #6c757d; font-size: 0.875rem;">
                    Visi misi aktif
                </p>
            </div>
            <div class="chart-card">
                <h3 class="chart-title">Rencana Strategis</h3>
                <div style="font-size: 2rem; font-weight: 700; color: #ffc107; text-align: center;">
                    ${safeStats.sample_data?.rencana_strategis?.length || 0}
                </div>
                <p style="text-align: center; color: #6c757d; font-size: 0.875rem;">
                    Rencana strategis
                </p>
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
                        <h5>Visi Misi Terbaru</h5>
                        ${safeStats.sample_data?.visi_misi?.length > 0 ? 
                            safeStats.sample_data.visi_misi.slice(0, 3).map(item => `
                                <div style="padding: 0.5rem; border-left: 3px solid #007bff; margin-bottom: 0.5rem; background: #f8f9fa;">
                                    <strong>Tahun ${item.tahun || 'N/A'}</strong><br>
                                    <small>${item.visi?.substring(0, 100) || 'Tidak ada deskripsi'}${item.visi?.length > 100 ? '...' : ''}</small>
                                </div>
                            `).join('') : 
                            `<div style="padding: 1rem; text-align: center; background: #f8f9fa; border-radius: 4px;">
                                <i class="fas fa-info-circle" style="color: #6c757d; margin-bottom: 0.5rem;"></i>
                                <p class="text-muted" style="margin: 0;">Belum ada data visi misi. <a href="#" onclick="window.app?.navigateToPage?.('visi-misi')">Tambah data visi misi</a></p>
                            </div>`
                        }
                    </div>
                    <div class="col-md-6">
                        <h5>Rencana Strategis Terbaru</h5>
                        ${safeStats.sample_data?.rencana_strategis?.length > 0 ? 
                            safeStats.sample_data.rencana_strategis.slice(0, 3).map(item => `
                                <div style="padding: 0.5rem; border-left: 3px solid #28a745; margin-bottom: 0.5rem; background: #f8f9fa;">
                                    <strong>${item.nama_rencana || 'Rencana Strategis'}</strong><br>
                                    <small>${item.deskripsi?.substring(0, 100) || 'Tidak ada deskripsi'}${item.deskripsi?.length > 100 ? '...' : ''}</small>
                                </div>
                            `).join('') : 
                            `<div style="padding: 1rem; text-align: center; background: #f8f9fa; border-radius: 4px;">
                                <i class="fas fa-info-circle" style="color: #6c757d; margin-bottom: 0.5rem;"></i>
                                <p class="text-muted" style="margin: 0;">Belum ada data rencana strategis. <a href="#" onclick="window.app?.navigateToPage?.('rencana-strategis')">Tambah rencana strategis</a></p>
                            </div>`
                        }
                    </div>
                </div>
                
                ${safeStats.total_risks === 0 ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                    <h6 style="color: #856404; margin-bottom: 0.5rem;"><i class="fas fa-exclamation-triangle"></i> Mulai Kelola Risiko</h6>
                    <p style="color: #856404; margin: 0; font-size: 0.875rem;">
                        Belum ada data risiko yang terdaftar. <a href="#" onclick="window.app?.navigateToPage?.('risk-input')" style="color: #856404; font-weight: 600;">Mulai input data risiko</a> untuk memulai manajemen risiko organisasi Anda.
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
                maintainAspectRatio: true
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
            maintainAspectRatio: true
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
            maintainAspectRatio: true
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

