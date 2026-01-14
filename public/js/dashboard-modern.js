// Modern Dashboard Module
class ModernDashboard {
    constructor() {
        this.charts = {};
        this.data = null;
        this.isLoading = false;
    }

    // Initialize dashboard
    async init() {
        console.log('Initializing Modern Dashboard...');
        await this.loadData();
        this.setupEventListeners();
    }

    // Load dashboard data
    async loadData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();

        try {
            console.log('Loading dashboard data...');
            
            // Load real data from multiple sources
            const [inherentData, residualData, riskInputs] = await Promise.all([
                this.fetchInherentRisks(),
                this.fetchResidualRisks(),
                this.fetchRiskInputs()
            ]);

            // Combine and process data
            this.data = {
                total_risks: riskInputs.length,
                inherent_risks: this.processRiskLevels(inherentData),
                residual_risks: this.processRiskLevels(residualData),
                risk_inputs: riskInputs,
                inherent_data: inherentData,
                residual_data: residualData
            };

            console.log('Dashboard data processed:', this.data);
            
            this.updateStatistics();
            this.initializeCharts();
            this.loadRecentActivities();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showErrorState(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    // Fetch inherent risks
    async fetchInherentRisks() {
        try {
            const response = await fetch('/api/reports/inherent-risk');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Failed to fetch inherent risks:', error);
        }
        return [];
    }

    // Fetch residual risks
    async fetchResidualRisks() {
        try {
            const response = await fetch('/api/reports/residual-risk');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Failed to fetch residual risks:', error);
        }
        return [];
    }

    // Fetch risk inputs
    async fetchRiskInputs() {
        try {
            const response = await fetch('/api/risk-inputs');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Failed to fetch risk inputs:', error);
        }
        return [];
    }

    // Process risk levels
    processRiskLevels(riskData) {
        const levels = {
            extreme_high: 0,
            high: 0,
            medium: 0,
            low: 0
        };

        riskData.forEach(risk => {
            const level = (risk.risk_level || '').toLowerCase();
            if (level.includes('extreme') || level.includes('sangat tinggi')) {
                levels.extreme_high++;
            } else if (level.includes('high') || level.includes('tinggi')) {
                levels.high++;
            } else if (level.includes('medium') || level.includes('sedang')) {
                levels.medium++;
            } else if (level.includes('low') || level.includes('rendah')) {
                levels.low++;
            }
        });

        return levels;
    }

    // Show loading state
    showLoadingState() {
        const elements = ['total-risks', 'extreme-risks', 'mitigation-risks', 'completed-risks'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>';
            }
        });
    }

    // Show error state
    showErrorState(message) {
        const elements = ['total-risks', 'extreme-risks', 'mitigation-risks', 'completed-risks'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '0';
            }
        });

        // Show error message in activities section
        const activitiesContainer = document.getElementById('recent-activities');
        if (activitiesContainer) {
            activitiesContainer.innerHTML = `
                <div class="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                    <div class="p-2 bg-red-100 rounded-lg text-red-600">
                        <span class="material-symbols-outlined text-[16px]">error</span>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-red-800">Error loading dashboard data</p>
                        <p class="text-xs text-red-600 mt-1">${message}</p>
                        <button onclick="modernDashboard.loadData()" class="text-xs text-red-700 underline mt-2">Try again</button>
                    </div>
                </div>
            `;
        }
    }

    // Update dashboard statistics
    updateStatistics() {
        if (!this.data) return;

        const stats = {
            totalRisks: this.data.total_risks || 0,
            extremeRisks: (this.data.inherent_risks?.extreme_high || 0) + (this.data.inherent_risks?.high || 0),
            mitigationRisks: this.data.residual_risks?.medium || 0,
            completedRisks: this.data.residual_risks?.low || 0
        };

        // Update stat cards with animation
        this.animateCounter('total-risks', stats.totalRisks);
        this.animateCounter('extreme-risks', stats.extremeRisks);
        this.animateCounter('mitigation-risks', stats.mitigationRisks);
        this.animateCounter('completed-risks', stats.completedRisks);

        console.log('Dashboard statistics updated:', stats);
    }

    // Animate counter
    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
            
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = targetValue;
            }
        };

        requestAnimationFrame(animate);
    }

    // Initialize charts
    initializeCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, skipping chart initialization');
            return;
        }

        this.initRiskTrendChart();
        this.initRiskDistributionChart();
    }

    // Initialize risk trend chart
    initRiskTrendChart() {
        const ctx = document.getElementById('risk-trend-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.trend) {
            this.charts.trend.destroy();
        }

        // Generate sample trend data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const trendData = months.map(() => Math.floor(Math.random() * 30) + 10);

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Total Risiko',
                    data: trendData,
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0066cc',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#0066cc',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Initialize risk distribution chart
    initRiskDistributionChart() {
        const ctx = document.getElementById('risk-distribution-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.distribution) {
            this.charts.distribution.destroy();
        }

        // Use real data if available, otherwise sample data
        let data = [0, 0, 0, 0];
        let labels = ['Ekstrem', 'Tinggi', 'Sedang', 'Rendah'];
        
        if (this.data && this.data.inherent_risks) {
            data = [
                this.data.inherent_risks.extreme_high || 0,
                this.data.inherent_risks.high || 0,
                this.data.inherent_risks.medium || 0,
                this.data.inherent_risks.low || 0
            ];
        }

        // If all values are 0, show sample data
        if (data.every(val => val === 0)) {
            data = [3, 7, 12, 8];
        }

        this.charts.distribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#ef4444', '#f59e0b', '#eab308', '#10b981'],
                    borderWidth: 0,
                    hoverBorderWidth: 2,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            },
                            color: '#64748b'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    // Load recent activities
    loadRecentActivities() {
        const activitiesContainer = document.getElementById('recent-activities');
        if (!activitiesContainer) return;

        // Generate sample activities based on data
        const activities = this.generateSampleActivities();

        activitiesContainer.innerHTML = activities.map(activity => `
            <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                <div class="p-2 ${activity.bgColor} rounded-lg ${activity.textColor} flex-shrink-0">
                    <span class="material-symbols-outlined text-[16px]">${activity.icon}</span>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-slate-800">${activity.message}</p>
                    <p class="text-xs text-slate-500 mt-1">${activity.time}</p>
                </div>
                <div class="text-xs text-slate-400">
                    <span class="material-symbols-outlined text-[12px]">chevron_right</span>
                </div>
            </div>
        `).join('');
    }

    // Generate sample activities
    generateSampleActivities() {
        const baseActivities = [
            {
                type: 'add',
                message: 'Risiko baru ditambahkan ke sistem',
                icon: 'add_circle',
                bgColor: 'bg-blue-50',
                textColor: 'text-blue-600',
                time: '2 jam lalu'
            },
            {
                type: 'update',
                message: 'Status mitigasi risiko diperbarui',
                icon: 'update',
                bgColor: 'bg-amber-50',
                textColor: 'text-amber-600',
                time: '4 jam lalu'
            },
            {
                type: 'complete',
                message: 'Analisis risiko diselesaikan',
                icon: 'check_circle',
                bgColor: 'bg-emerald-50',
                textColor: 'text-emerald-600',
                time: '1 hari lalu'
            }
        ];

        // Return a subset based on available data
        const totalRisks = this.data?.total_risks || 0;
        const numActivities = Math.min(Math.max(totalRisks > 0 ? 3 : 1, 1), 3);
        
        return baseActivities.slice(0, numActivities);
    }

    // Setup event listeners
    setupEventListeners() {
        // Refresh functionality
        const refreshBtn = document.querySelector('[onclick*="loadDashboardData"]');
        if (refreshBtn) {
            refreshBtn.onclick = () => this.loadData();
        }
    }

    // Refresh data
    async refresh() {
        console.log('Refreshing dashboard data...');
        await this.loadData();
    }

    // Get current data
    getData() {
        return this.data;
    }

    // Destroy charts
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Initialize modern dashboard
let modernDashboard;

document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the modern dashboard page
    if (document.getElementById('dashboard-content') || document.getElementById('total-risks')) {
        modernDashboard = new ModernDashboard();
        modernDashboard.init();
    }
});

// Export for global access
window.modernDashboard = modernDashboard;

console.log('Modern Dashboard module loaded');