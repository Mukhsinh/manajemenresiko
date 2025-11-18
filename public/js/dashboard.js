// Dashboard Module
let dashboardCharts = {};

async function loadDashboard() {
    try {
        const stats = await apiCall('/api/dashboard');
        renderDashboard(stats);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('dashboard-content').innerHTML = 
            '<div class="card"><p>Error memuat dashboard: ' + error.message + '</p></div>';
    }
}

function renderDashboard(stats) {
    const content = document.getElementById('dashboard-content');
    
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
    
    // Render charts
    renderInherentRiskChart(stats.inherent_risks);
    renderResidualRiskChart(stats.residual_risks);
    renderKRIChart(stats.kri);
}

function renderInherentRiskChart(data) {
    const ctx = document.getElementById('inherent-risk-chart');
    if (!ctx) return;
    
    if (dashboardCharts.inherent) {
        dashboardCharts.inherent.destroy();
    }
    
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
    if (!ctx) return;
    
    if (dashboardCharts.residual) {
        dashboardCharts.residual.destroy();
    }
    
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
}

function renderKRIChart(data) {
    const ctx = document.getElementById('kri-chart');
    if (!ctx) return;
    
    if (dashboardCharts.kri) {
        dashboardCharts.kri.destroy();
    }
    
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
}

// Export for use in app.js
window.dashboardModule = {
    loadDashboard
};

