
// Enhanced Residual Risk JavaScript with comprehensive error handling
class ResidualRiskManager {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        this.data = [];
        this.init();
    }

    init() {
        console.log('🚀 Initializing Residual Risk Manager...');
        this.setupEventListeners();
        this.loadData();
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadData());
        }

        // Filter controls
        const filterForm = document.getElementById('filterForm');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => this.handleFilter(e));
        }

        // Risk level filter
        const riskLevelFilter = document.getElementById('riskLevelFilter');
        if (riskLevelFilter) {
            riskLevelFilter.addEventListener('change', () => this.applyFilters());
        }
    }

    async loadData() {
        try {
            console.log('🎯 Loading residual risk data...');
            this.showLoading(true);

            const headers = {
                'Content-Type': 'application/json'
            };

            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            // Try risks endpoint first (which includes residual analysis)
            const response = await fetch(`${this.apiBaseUrl}/risks`, {
                method: 'GET',
                headers: headers
            });

            if (response.status === 401) {
                console.warn('⚠️ Authentication required, redirecting to login...');
                this.redirectToLogin();
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            this.data = result.data || [];
            
            console.log(`✅ Loaded ${this.data.length} risk records`);
            this.processResidualData();
            this.renderData();
            this.updateSummary();

        } catch (error) {
            console.error('❌ Error loading residual risk data:', error);
            this.showError('Gagal memuat data residual risk: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    processResidualData() {
        // Extract and process residual risk data
        this.residualData = this.data.map(risk => {
            const residual = risk.risk_residual_analysis || {};
            const inherent = risk.risk_inherent_analysis || {};
            
            return {
                id: risk.id,
                kode_risiko: risk.kode_risiko,
                risk_event: risk.risk_event,
                risk_cause: risk.risk_cause,
                risk_impact: risk.risk_impact,
                inherent_probability: inherent.probability || 0,
                inherent_impact: inherent.impact || 0,
                inherent_risk_level: inherent.risk_level || 'Unknown',
                residual_probability: residual.probability || 0,
                residual_impact: residual.impact || 0,
                residual_risk_level: residual.risk_level || 'Unknown',
                residual_risk_value: residual.risk_value || 0,
                financial_impact: residual.financial_impact || 0,
                unit_kerja: risk.master_work_units?.name || 'Unknown',
                kategori_risiko: risk.master_risk_categories?.name || 'Unknown'
            };
        }).filter(item => item.residual_probability > 0 || item.residual_impact > 0);

        console.log(`📊 Processed ${this.residualData.length} residual risk records`);
    }

    renderData() {
        const tableBody = document.getElementById('residualRiskTableBody');
        if (!tableBody) {
            console.warn('⚠️ Residual risk table body not found');
            return;
        }

        if (this.residualData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-info-circle mb-2"></i>
                            <p>Belum ada data residual risk</p>
                            <small>Data akan muncul setelah analisis risiko dilakukan</small>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const rows = this.residualData.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${this.escapeHtml(item.kode_risiko || '-')}</td>
                <td>
                    <div class="risk-event-cell">
                        <strong>${this.escapeHtml(item.risk_event || '-')}</strong>
                        <small class="text-muted d-block">${this.escapeHtml(item.risk_cause || '')}</small>
                    </div>
                </td>
                <td class="text-center">
                    <span class="badge badge-${this.getRiskLevelBadgeClass(item.inherent_risk_level)}">
                        ${item.inherent_probability} x ${item.inherent_impact}
                    </span>
                    <small class="d-block">${item.inherent_risk_level}</small>
                </td>
                <td class="text-center">
                    <span class="badge badge-${this.getRiskLevelBadgeClass(item.residual_risk_level)}">
                        ${item.residual_probability} x ${item.residual_impact}
                    </span>
                    <small class="d-block">${item.residual_risk_level}</small>
                </td>
                <td class="text-right font-weight-bold">
                    ${item.residual_risk_value}
                </td>
                <td class="text-right">
                    ${this.formatCurrency(item.financial_impact)}
                </td>
                <td>${this.escapeHtml(item.unit_kerja)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="residualRiskManager.viewDetails(${item.id})" title="Detail">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-primary" onclick="residualRiskManager.editRisk(${item.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tableBody.innerHTML = rows;
    }

    getRiskLevelBadgeClass(level) {
        const classes = {
            'Very Low': 'success',
            'Low': 'info',
            'Medium': 'warning',
            'High': 'danger',
            'Very High': 'dark'
        };
        return classes[level] || 'secondary';
    }

    formatCurrency(amount) {
        if (!amount || amount === 0) return '-';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    updateSummary() {
        const summary = this.calculateSummary();
        
        // Update summary cards
        this.updateSummaryCard('totalRisks', summary.total);
        this.updateSummaryCard('highRisks', summary.highRisks);
        this.updateSummaryCard('avgRiskValue', summary.avgRiskValue.toFixed(1));
        this.updateSummaryCard('totalFinancialImpact', this.formatCurrency(summary.totalFinancialImpact));

        // Update risk level distribution
        Object.entries(summary.byLevel).forEach(([level, count]) => {
            this.updateSummaryCard(level.toLowerCase().replace(' ', '') + 'Count', count);
        });
    }

    calculateSummary() {
        const total = this.residualData.length;
        const highRisks = this.residualData.filter(item => 
            ['High', 'Very High'].includes(item.residual_risk_level)
        ).length;
        
        const totalRiskValue = this.residualData.reduce((sum, item) => sum + (item.residual_risk_value || 0), 0);
        const avgRiskValue = total > 0 ? totalRiskValue / total : 0;
        
        const totalFinancialImpact = this.residualData.reduce((sum, item) => sum + (item.financial_impact || 0), 0);
        
        const byLevel = this.residualData.reduce((acc, item) => {
            const level = item.residual_risk_level || 'Unknown';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});

        return { total, highRisks, avgRiskValue, totalFinancialImpact, byLevel };
    }

    updateSummaryCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    showLoading(show) {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }

        const table = document.getElementById('residualRiskTable');
        if (table) {
            table.style.opacity = show ? '0.5' : '1';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${message}
                    <button type="button" class="close" data-dismiss="alert">
                        <span>&times;</span>
                    </button>
                </div>
            `;
        } else {
            alert(message);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    redirectToLogin() {
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `/login?redirect=${currentUrl}`;
    }

    applyFilters() {
        // Implementation for filtering
        console.log('🔍 Applying filters...');
    }

    handleFilter(event) {
        event.preventDefault();
        this.applyFilters();
    }

    viewDetails(id) {
        console.log(`👁️ Viewing details for risk: ${id}`);
        // Implementation for viewing details
    }

    editRisk(id) {
        console.log(`✏️ Editing risk: ${id}`);
        // Implementation for editing
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM loaded, initializing Residual Risk manager...');
    window.residualRiskManager = new ResidualRiskManager();
});

// Fallback initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (!window.residualRiskManager) {
            window.residualRiskManager = new ResidualRiskManager();
        }
    });
} else {
    if (!window.residualRiskManager) {
        window.residualRiskManager = new ResidualRiskManager();
    }
}
