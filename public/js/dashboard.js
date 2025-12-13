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
        const stats = await apiCall('/api/dashboard');
        renderDashboard(stats);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        const content = document.getElementById('dashboard-content');
        if (content) {
            content.innerHTML = 
                '<div class="card"><p>Error memuat dashboard: ' + error.message + '</p></div>';
        }
    }
}

function renderDashboard(stats) {
    const content = document.getElementById('dashboard-content');
    if (!content) {
        console.error('Dashboard content element not found');
        return;
    }
    
    content.innerHTML = `
        <div class="charts-grid">
            <div class="chart-card">
                <h3 class="chart-title">Total Risiko</h3>
                <div style="font-size: 2rem; font-weight: 700; color: var(--primary-blue); text-align: center;">
                    ${stats.total_risks || 0}
                </div>
            </div>
            <div class="chart-card">
                <h3 class="chart-title">Loss Events</h3>
                <div style="font-size: 2rem; font-weight: 700; color: var(--danger); text-align: center;">
                    ${stats.loss_events || 0}
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Ringkasan Risiko</h3>
            </div>
            <div class="charts-grid">
                <div class="chart-card">
                    <h4 class="chart-title">Inherent Risk</h4>
                    <canvas id="inherent-risk-chart"></canvas>
                </div>
                <div class="chart-card">
                    <h4 class="chart-title">Residual Risk</h4>
                    <canvas id="residual-risk-chart"></canvas>
                </div>
                <div class="chart-card">
                    <h4 class="chart-title">Key Risk Indicator</h4>
                    <canvas id="kri-chart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Wait for Chart.js and DOM to be ready before rendering charts
    waitForChartJs(() => {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
            try {
                renderInherentRiskChart(stats.inherent_risks || {});
                renderResidualRiskChart(stats.residual_risks || {});
                renderKRIChart(stats.kri || {});
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
    loadDashboard
};

