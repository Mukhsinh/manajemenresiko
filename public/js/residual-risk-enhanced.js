/**
 * Residual Risk Analysis Manager - TypeScript-style implementation
 * Handles comprehensive residual risk data display and analysis
 */

// Type definitions (TypeScript-style interfaces in JSDoc)
/**
 * @typedef {Object} RiskInput
 * @property {string} id
 * @property {string} kode_risiko
 * @property {string} sasaran
 * @property {string} user_id
 * @property {string} organization_id
 * @property {WorkUnit} master_work_units
 * @property {RiskCategory} master_risk_categories
 * @property {InherentAnalysis[]} risk_inherent_analysis
 */

/**
 * @typedef {Object} WorkUnit
 * @property {string} name
 * @property {string} jenis
 * @property {string} kategori
 */

/**
 * @typedef {Object} RiskCategory
 * @property {string} name
 */

/**
 * @typedef {Object} InherentAnalysis
 * @property {number} probability
 * @property {number} impact
 * @property {number} risk_value
 * @property {string} risk_level
 * @property {string} probability_percentage
 * @property {number} financial_impact
 */

/**
 * @typedef {Object} ResidualRiskData
 * @property {string} id
 * @property {string} risk_input_id
 * @property {number} probability
 * @property {number} impact
 * @property {number} risk_value
 * @property {string} risk_level
 * @property {string} probability_percentage
 * @property {number} financial_impact
 * @property {number} net_risk_value
 * @property {string} department
 * @property {string} review_status
 * @property {string} next_review_date
 * @property {RiskInput} risk_inputs
 */

/**
 * @typedef {Object} Statistics
 * @property {number} total
 * @property {number} avgInherent
 * @property {number} avgResidual
 * @property {string} reduction
 * @property {Object.<string, number>} riskLevelCounts
 * @property {number} validInherentCount
 */

class ResidualRiskManager {
    constructor() {
        /** @type {ResidualRiskData[]} */
        this.data = [];
        
        /** @type {boolean} */
        this.debugMode = false;
        
        /** @type {Chart|null} */
        this.matrixChart = null;
        
        /** @type {Chart|null} */
        this.comparisonChart = null;
        
        this.apiEndpoints = {
            residualRisk: '/api/reports/residual-risk-simple',
            excelExport: '/api/reports/residual-risk/excel'
        };
    }

    /**
     * Initialize the residual risk manager
     */
    initialize() {
        this.debugLog('Initializing ResidualRiskManager...');
        this.loadData();
    }

    /**
     * Debug logging function
     * @param {string} message - Debug message
     */
    debugLog(message) {
        console.log(`[ResidualRisk] ${message}`);
        
        if (this.debugMode) {
            const debugContent = document.getElementById('debug-content');
            if (debugContent) {
                const timestamp = new Date().toLocaleTimeString();
                debugContent.innerHTML += `<div>[${timestamp}] ${message}</div>`;
                debugContent.scrollTop = debugContent.scrollHeight;
            }
        }
    }

    /**
     * Toggle debug mode
     */
    toggleDebug() {
        this.debugMode = !this.debugMode;
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            debugPanel.style.display = this.debugMode ? 'block' : 'none';
        }
        
        if (this.debugMode) {
            this.debugLog('Debug mode enabled');
            this.debugLog(`Current URL: ${window.location.href}`);
            this.debugLog(`API URL: ${this.apiEndpoints.residualRisk}`);
            this.debugLog(`Data count: ${this.data.length}`);
        }
    }

    /**
     * Load residual risk data from API
     */
    async loadData() {
        try {
            this.debugLog('Starting data load...');
            this.showLoading();

            const response = await fetch(this.apiEndpoints.residualRisk, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            this.debugLog(`API Response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                this.debugLog(`API Error: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const responseText = await response.text();
            this.debugLog(`Response length: ${responseText.length} characters`);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                this.debugLog(`JSON Parse Error: ${parseError.message}`);
                throw new Error(`Failed to parse JSON response: ${parseError.message}`);
            }

            if (!Array.isArray(data)) {
                this.debugLog(`ERROR: Data is not an array, type: ${typeof data}`);
                throw new Error('Invalid data format received from API - expected array');
            }

            this.data = data;
            this.debugLog(`Data loaded successfully: ${this.data.length} records`);

            if (this.data.length > 0) {
                this.debugLog(`Sample record keys: ${Object.keys(this.data[0]).join(', ')}`);
                if (this.data[0].risk_inputs) {
                    this.debugLog(`Sample risk_inputs keys: ${Object.keys(this.data[0].risk_inputs).join(', ')}`);
                }
            }

            this.renderContent();
            this.debugLog('✅ Data loaded and rendered successfully');

        } catch (error) {
            this.debugLog(`❌ Error loading data: ${error.message}`);
            console.error('Error loading data:', error);
            this.showError('Gagal memuat data: ' + error.message);
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        const container = document.getElementById('content-area');
        if (container) {
            container.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3 text-muted ms-3">Memuat data residual risk...</p>
                </div>
            `;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const container = document.getElementById('content-area');
        if (container) {
            container.innerHTML = `
                <div class="error-panel">
                    <h4><i data-lucide="alert-triangle"></i> Error</h4>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="ResidualRiskManager.loadData()">
                        <i data-lucide="refresh-cw"></i> Coba Lagi
                    </button>
                    <button class="btn btn-secondary ms-2" onclick="ResidualRiskManager.toggleDebug()">
                        <i data-lucide="bug"></i> Show Debug
                    </button>
                </div>
            `;

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Calculate statistics from data
     * @returns {Statistics}
     */
    calculateStatistics() {
        let totalInherent = 0;
        let totalResidual = 0;
        let validInherentCount = 0;
        
        /** @type {Object.<string, number>} */
        const riskLevelCounts = {
            'LOW RISK': 0,
            'MEDIUM RISK': 0,
            'HIGH RISK': 0,
            'EXTREME HIGH': 0
        };

        this.data.forEach(item => {
            const risk = item.risk_inputs || {};
            
            // Get inherent data - handle both array and object formats
            let inherent = {};
            if (risk.risk_inherent_analysis) {
                if (Array.isArray(risk.risk_inherent_analysis) && risk.risk_inherent_analysis.length > 0) {
                    inherent = risk.risk_inherent_analysis[0];
                } else if (!Array.isArray(risk.risk_inherent_analysis)) {
                    inherent = risk.risk_inherent_analysis;
                }
            }

            const inherentValue = parseFloat(inherent.risk_value) || 0;
            const residualValue = parseFloat(item.risk_value) || 0;

            if (inherentValue > 0) {
                totalInherent += inherentValue;
                validInherentCount++;
            }

            if (residualValue > 0) {
                totalResidual += residualValue;
            }

            // Count risk levels
            const riskLevel = (item.risk_level || '').toUpperCase();
            if (riskLevel.includes('LOW')) {
                riskLevelCounts['LOW RISK']++;
            } else if (riskLevel.includes('MEDIUM')) {
                riskLevelCounts['MEDIUM RISK']++;
            } else if (riskLevel.includes('HIGH') && !riskLevel.includes('EXTREME')) {
                riskLevelCounts['HIGH RISK']++;
            } else if (riskLevel.includes('EXTREME')) {
                riskLevelCounts['EXTREME HIGH']++;
            }
        });

        const avgInherent = validInherentCount > 0 ? totalInherent / validInherentCount : 0;
        const avgResidual = this.data.length > 0 ? totalResidual / this.data.length : 0;
        const reduction = avgInherent > 0 ? ((avgInherent - avgResidual) / avgInherent * 100).toFixed(1) : '0.0';

        return {
            total: this.data.length,
            avgInherent,
            avgResidual,
            reduction,
            riskLevelCounts,
            validInherentCount
        };
    }

    /**
     * Get badge CSS class for risk level
     * @param {string} level - Risk level
     * @returns {string}
     */
    getBadgeClass(level) {
        const levelUpper = (level || '').toUpperCase();
        
        if (levelUpper.includes('LOW') || levelUpper.includes('RENDAH')) {
            return 'badge-low-risk';
        } else if (levelUpper.includes('MEDIUM') || levelUpper.includes('SEDANG')) {
            return 'badge-medium-risk';
        } else if (levelUpper.includes('HIGH') && !levelUpper.includes('EXTREME')) {
            return 'badge-high-risk';
        } else if (levelUpper.includes('EXTREME') || levelUpper.includes('VERY HIGH') || levelUpper.includes('SANGAT')) {
            return 'badge-extreme-high';
        } else {
            return 'badge-secondary';
        }
    }

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string}
     */
    truncateText(text, maxLength = 30) {
        if (!text) return '-';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    /**
     * Render main content
     */
    renderContent() {
        const container = document.getElementById('content-area');
        if (!container) return;

        if (this.data.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info text-center">
                    <h4><i data-lucide="info"></i> Tidak Ada Data</h4>
                    <p>Belum ada data residual risk yang tersedia.</p>
                    <button class="btn btn-secondary" onclick="ResidualRiskManager.toggleDebug()">
                        <i data-lucide="bug"></i> Show Debug Info
                    </button>
                </div>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }

        const stats = this.calculateStatistics();
        this.debugLog(`Statistics calculated: ${JSON.stringify(stats)}`);

        container.innerHTML = `
            <div class="success-panel">
                <h4><i data-lucide="check-circle"></i> Data Berhasil Dimuat</h4>
                <p>Berhasil memuat ${this.data.length} record residual risk analysis.</p>
            </div>
            
            ${this.renderStatistics(stats)}
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="risk-matrix-container">
                        <h4><i data-lucide="target"></i> Residual Risk Matrix</h4>
                        <div style="position: relative; height: 400px;">
                            <canvas id="residual-risk-matrix"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="chart-container">
                        <h4><i data-lucide="bar-chart-3"></i> Inherent vs Residual Comparison</h4>
                        <div style="position: relative; height: 400px;">
                            <canvas id="comparison-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            ${this.renderTable()}
        `;

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Initialize charts after DOM is ready
        setTimeout(() => {
            this.initializeCharts();
        }, 100);
    }

    /**
     * Render statistics cards
     * @param {Statistics} stats - Calculated statistics
     * @returns {string}
     */
    renderStatistics(stats) {
        return `
            <div class="stats-grid">
                <div class="stat-card" style="background: #ffffff;">
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">Total Residual Risk</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <div class="stat-value">${stats.avgInherent.toFixed(2)}</div>
                    <div class="stat-label">Avg Inherent Value</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <div class="stat-value">${stats.avgResidual.toFixed(2)}</div>
                    <div class="stat-label">Avg Residual Value</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                    <div class="stat-value">${stats.reduction}%</div>
                    <div class="stat-label">Risk Reduction</div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i data-lucide="pie-chart"></i> Risk Level Distribution</h5>
                        </div>
                        <div class="card-body">
                            <div class="risk-level-stats">
                                ${Object.entries(stats.riskLevelCounts).map(([level, count]) => `
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <span class="badge-status ${this.getBadgeClass(level)}">${level}</span>
                                        <strong>${count} risks</strong>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i data-lucide="info"></i> Data Summary</h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Total Records:</strong> ${stats.total}</p>
                            <p><strong>Records with Inherent Data:</strong> ${stats.validInherentCount}</p>
                            <p><strong>Data Coverage:</strong> ${stats.total > 0 ? ((stats.validInherentCount / stats.total) * 100).toFixed(1) : 0}%</p>
                            <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render data table
     * @returns {string}
     */
    renderTable() {
        return `
            <div class="card mt-4">
                <div class="card-header">
                    <h4><i data-lucide="table"></i> Detail Residual Risk Analysis</h4>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Kode Risiko</th>
                                    <th>Unit Kerja</th>
                                    <th>Sasaran</th>
                                    <th>Inherent</th>
                                    <th>Residual</th>
                                    <th>Reduction</th>
                                    <th>Level</th>
                                    <th>Review Status</th>
                                    <th>Next Review</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.data.map((item, index) => {
                                    const risk = item.risk_inputs || {};
                                    
                                    // Get inherent data - handle both array and object formats
                                    let inherent = {};
                                    if (risk.risk_inherent_analysis) {
                                        if (Array.isArray(risk.risk_inherent_analysis) && risk.risk_inherent_analysis.length > 0) {
                                            inherent = risk.risk_inherent_analysis[0];
                                        } else if (!Array.isArray(risk.risk_inherent_analysis)) {
                                            inherent = risk.risk_inherent_analysis;
                                        }
                                    }
                                    
                                    const inherentValue = parseFloat(inherent.risk_value) || 0;
                                    const inherentLevel = inherent.risk_level || 'UNKNOWN';
                                    const residualValue = parseFloat(item.risk_value) || 0;
                                    
                                    // Calculate reduction percentage
                                    let reduction = '-';
                                    if (inherentValue > 0 && residualValue >= 0) {
                                        const reductionPercent = ((inherentValue - residualValue) / inherentValue * 100);
                                        reduction = reductionPercent.toFixed(1) + '%';
                                    }
                                    
                                    return `
                                        <tr>
                                            <td><strong>${index + 1}</strong></td>
                                            <td><strong>${risk.kode_risiko || '-'}</strong></td>
                                            <td>${this.truncateText(risk.master_work_units?.name)}</td>
                                            <td title="${risk.sasaran || ''}">${this.truncateText(risk.sasaran, 40)}</td>
                                            <td><span class="badge-status ${this.getBadgeClass(inherentLevel)}">${inherentValue || '-'}</span></td>
                                            <td><span class="badge-status ${this.getBadgeClass(item.risk_level)}">${residualValue || '-'}</span></td>
                                            <td><strong style="color: #0d4f1c; font-weight: 700;">${reduction}</strong></td>
                                            <td><span class="badge-status ${this.getBadgeClass(item.risk_level)}">${item.risk_level || '-'}</span></td>
                                            <td><span class="badge-status badge-secondary">${item.review_status || '-'}</span></td>
                                            <td>${item.next_review_date || '-'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize charts
     */
    initializeCharts() {
        if (typeof Chart === 'undefined') {
            this.debugLog('Chart.js not available, skipping chart initialization');
            return;
        }

        this.renderMatrixChart();
        this.renderComparisonChart();
    }

    /**
     * Render risk matrix chart
     */
    renderMatrixChart() {
        const ctx = document.getElementById('residual-risk-matrix');
        if (!ctx) {
            this.debugLog('Matrix chart canvas not found');
            return;
        }

        if (this.matrixChart) {
            this.matrixChart.destroy();
        }

        const chartData = this.prepareMatrixData();
        
        try {
            this.matrixChart = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Inherent Risk',
                            data: chartData.inherent,
                            backgroundColor: '#00FFFF',
                            borderColor: '#000000',
                            borderWidth: 2,
                            pointRadius: 8,
                            pointStyle: 'circle'
                        },
                        {
                            label: 'Residual Risk',
                            data: chartData.residual,
                            backgroundColor: '#FFD700',
                            borderColor: '#000000',
                            borderWidth: 2,
                            pointRadius: 10,
                            pointStyle: 'star'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'linear',
                            min: 0.5,
                            max: 5.5,
                            ticks: { stepSize: 1 },
                            title: { display: true, text: 'Impact' }
                        },
                        y: {
                            min: 0.5,
                            max: 5.5,
                            ticks: { stepSize: 1 },
                            title: { display: true, text: 'Probability' }
                        }
                    },
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const point = context.raw;
                                    return [
                                        `Risk Code: ${point.riskCode}`,
                                        `Risk Value: ${point.riskValue}`,
                                        `Level: ${point.riskLevel}`
                                    ];
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            this.debugLog(`Error creating matrix chart: ${error.message}`);
        }
    }

    /**
     * Render comparison chart
     */
    renderComparisonChart() {
        const ctx = document.getElementById('comparison-chart');
        if (!ctx) {
            this.debugLog('Comparison chart canvas not found');
            return;
        }

        if (this.comparisonChart) {
            this.comparisonChart.destroy();
        }

        const chartData = this.prepareComparisonData();
        
        try {
            this.comparisonChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartData.labels,
                    datasets: [
                        {
                            label: 'Inherent Risk',
                            data: chartData.inherent,
                            backgroundColor: 'rgba(244, 67, 54, 0.8)',
                            borderColor: 'rgba(244, 67, 54, 1)',
                            borderWidth: 2
                        },
                        {
                            label: 'Residual Risk',
                            data: chartData.residual,
                            backgroundColor: 'rgba(76, 175, 80, 0.8)',
                            borderColor: 'rgba(76, 175, 80, 1)',
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Risk Value' }
                        },
                        x: {
                            title: { display: true, text: 'Risk Code' }
                        }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                afterLabel: function(context) {
                                    const index = context.dataIndex;
                                    const inherent = chartData.inherent[index];
                                    const residual = chartData.residual[index];
                                    const reduction = inherent > 0 ? ((inherent - residual) / inherent * 100).toFixed(1) : 0;
                                    return `Reduction: ${reduction}%`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            this.debugLog(`Error creating comparison chart: ${error.message}`);
        }
    }

    /**
     * Prepare data for matrix chart
     * @returns {Object}
     */
    prepareMatrixData() {
        const inherent = [];
        const residual = [];

        this.data.forEach(item => {
            const risk = item.risk_inputs || {};
            
            // Get inherent data
            let inherentData = {};
            if (risk.risk_inherent_analysis) {
                if (Array.isArray(risk.risk_inherent_analysis) && risk.risk_inherent_analysis.length > 0) {
                    inherentData = risk.risk_inherent_analysis[0];
                } else if (!Array.isArray(risk.risk_inherent_analysis)) {
                    inherentData = risk.risk_inherent_analysis;
                }
            }

            const basePoint = {
                x: parseFloat(item.impact) || 0,
                y: parseFloat(item.probability) || 0,
                riskCode: risk.kode_risiko || 'N/A',
                riskValue: parseFloat(item.risk_value) || 0,
                riskLevel: item.risk_level || 'UNKNOWN'
            };

            if (basePoint.x > 0 && basePoint.y > 0) {
                // Add residual point
                residual.push(basePoint);

                // Add inherent point if available
                if (inherentData.risk_value) {
                    inherent.push({
                        x: parseFloat(inherentData.impact) || basePoint.x,
                        y: parseFloat(inherentData.probability) || basePoint.y,
                        riskCode: risk.kode_risiko || 'N/A',
                        riskValue: parseFloat(inherentData.risk_value) || 0,
                        riskLevel: inherentData.risk_level || 'UNKNOWN'
                    });
                }
            }
        });

        return { inherent, residual };
    }

    /**
     * Prepare data for comparison chart
     * @returns {Object}
     */
    prepareComparisonData() {
        const labels = [];
        const inherent = [];
        const residual = [];

        this.data.forEach(item => {
            const risk = item.risk_inputs || {};
            
            // Get inherent data
            let inherentData = {};
            if (risk.risk_inherent_analysis) {
                if (Array.isArray(risk.risk_inherent_analysis) && risk.risk_inherent_analysis.length > 0) {
                    inherentData = risk.risk_inherent_analysis[0];
                } else if (!Array.isArray(risk.risk_inherent_analysis)) {
                    inherentData = risk.risk_inherent_analysis;
                }
            }

            const inherentValue = parseFloat(inherentData.risk_value) || 0;
            const residualValue = parseFloat(item.risk_value) || 0;

            labels.push(risk.kode_risiko || 'N/A');
            inherent.push(inherentValue);
            residual.push(residualValue);
        });

        return { labels, inherent, residual };
    }

    /**
     * Download Excel report
     */
    async downloadExcel() {
        try {
            this.debugLog('Starting Excel download...');

            const response = await fetch(this.apiEndpoints.excelExport, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `residual-risk-${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.debugLog('✅ Excel file downloaded successfully');
                this.showSuccessMessage('File Excel berhasil diunduh');
            } else {
                const errorText = await response.text();
                throw new Error(`Download failed: ${response.status} - ${errorText}`);
            }

        } catch (error) {
            this.debugLog(`❌ Excel download error: ${error.message}`);
            this.showError('Error downloading Excel: ' + error.message);
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccessMessage(message) {
        const container = document.getElementById('content-area');
        if (container) {
            const successDiv = document.createElement('div');
            successDiv.className = 'alert alert-success alert-dismissible fade show';
            successDiv.innerHTML = `
                <i data-lucide="check-circle"></i> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            container.insertBefore(successDiv, container.firstChild);

            // Auto dismiss after 3 seconds
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.remove();
                }
            }, 3000);

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
}

// Create global instance
const ResidualRiskManager = new ResidualRiskManager();

// Export for global access
window.ResidualRiskManager = ResidualRiskManager;