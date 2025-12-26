/**
 * Enhanced Residual Risk Analysis JavaScript
 * Handles data loading, rendering, and interactions for residual risk page
 */

class ResidualRiskManager {
    constructor() {
        this.residualData = [];
        this.debugMode = false;
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        this.debugLog('ResidualRiskManager initialized');
        
        // Initialize Lucide icons if available
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
            this.debugLog('Lucide icons initialized');
        } else {
            this.debugLog('WARNING: Lucide not loaded, icons may not display');
        }
        
        // Auto-load data after a short delay
        setTimeout(() => {
            this.debugLog('Auto-loading data...');
            this.loadData();
        }, 500);
    }
    
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
    
    toggleDebug() {
        this.debugMode = !this.debugMode;
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            debugPanel.style.display = this.debugMode ? 'block' : 'none';
            if (this.debugMode) {
                this.debugLog('Debug mode enabled');
                this.debugLog(`Current URL: ${window.location.href}`);
                this.debugLog(`API URL will be: ${window.location.origin}/api/reports/residual-risk-simple`);
            }
        }
    }
    
    async loadData() {
        if (this.isLoading) {
            this.debugLog('Load already in progress, skipping...');
            return;
        }
        
        this.isLoading = true;
        
        try {
            this.debugLog('Starting data load...');
            
            // Show loading state
            const container = document.getElementById('content-area');
            if (!container) {
                throw new Error('Content area not found');
            }
            
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3 text-muted">Memuat data residual risk...</p>
                </div>
            `;
            
            const apiUrl = '/api/reports/residual-risk-simple';
            this.debugLog(`Fetching data from API: ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            this.debugLog(`API Response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                this.debugLog(`API Error response: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            const responseText = await response.text();
            this.debugLog(`Raw response length: ${responseText.length} characters`);
            
            try {
                this.residualData = JSON.parse(responseText);
            } catch (parseError) {
                this.debugLog(`JSON Parse Error: ${parseError.message}`);
                this.debugLog(`First 500 chars of response: ${responseText.substring(0, 500)}`);
                throw new Error(`Failed to parse JSON response: ${parseError.message}`);
            }
            
            this.debugLog(`Data loaded: ${this.residualData.length} records`);
            
            if (!Array.isArray(this.residualData)) {
                this.debugLog(`ERROR: Data is not an array, type: ${typeof this.residualData}`);
                throw new Error('Invalid data format received from API - expected array');
            }
            
            if (this.residualData.length > 0) {
                this.debugLog(`Sample record keys: ${Object.keys(this.residualData[0]).join(', ')}`);
                if (this.residualData[0].risk_inputs) {
                    this.debugLog(`Sample risk_inputs keys: ${Object.keys(this.residualData[0].risk_inputs).join(', ')}`);
                }
            }
            
            this.debugLog('Rendering content...');
            this.renderContent();
            this.debugLog('✅ Data loaded and rendered successfully');
            
        } catch (error) {
            this.debugLog(`❌ Error loading data: ${error.message}`);
            console.error('Error loading data:', error);
            this.showError('Gagal memuat data: ' + error.message);
        } finally {
            this.isLoading = false;
        }
    }
    
    showError(message) {
        const container = document.getElementById('content-area');
        container.innerHTML = `
            <div class="alert alert-danger">
                <h4><i data-lucide="alert-triangle"></i> Error</h4>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="residualRiskManager.loadData()">
                    <i data-lucide="refresh-cw"></i> Coba Lagi
                </button>
                <button class="btn btn-secondary ms-2" onclick="residualRiskManager.toggleDebug()">
                    <i data-lucide="bug"></i> Show Debug
                </button>
            </div>
        `;
        
        // Initialize Lucide icons after content is rendered
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    renderContent() {
        const container = document.getElementById('content-area');
        
        if (this.residualData.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info text-center">
                    <h4><i data-lucide="info"></i> Tidak Ada Data</h4>
                    <p>Belum ada data residual risk yang tersedia.</p>
                    <button class="btn btn-secondary" onclick="residualRiskManager.toggleDebug()">
                        <i data-lucide="bug"></i> Show Debug Info
                    </button>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        // Calculate statistics
        const stats = this.calculateStatistics();
        this.debugLog(`Statistics calculated: ${JSON.stringify(stats)}`);
        
        container.innerHTML = `
            <div class="alert alert-success">
                <h4><i data-lucide="check-circle"></i> Data Berhasil Dimuat</h4>
                <p>Berhasil memuat ${this.residualData.length} record residual risk analysis.</p>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i data-lucide="pie-chart"></i> Residual Risk Analysis</h3>
                </div>
                <div class="card-body">
                    ${this.renderStatistics(stats)}
                    ${this.renderTable()}
                </div>
            </div>
        `;
        
        // Initialize Lucide icons after content is rendered
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    calculateStatistics() {
        let totalInherent = 0;
        let totalResidual = 0;
        let validInherentCount = 0;
        let riskLevelCounts = {
            'LOW RISK': 0,
            'MEDIUM RISK': 0,
            'HIGH RISK': 0,
            'EXTREME HIGH': 0,
            'VERY HIGH': 0
        };
        
        this.residualData.forEach(item => {
            const risk = item.risk_inputs || {};
            let inherent = {};
            
            // Try to get inherent data - handle both array and object formats
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
            } else if (riskLevel.includes('EXTREME') || riskLevel.includes('VERY HIGH')) {
                riskLevelCounts['EXTREME HIGH']++;
            }
        });

        const avgInherent = validInherentCount > 0 ? totalInherent / validInherentCount : 0;
        const avgResidual = this.residualData.length > 0 ? totalResidual / this.residualData.length : 0;
        const reduction = avgInherent > 0 ? ((avgInherent - avgResidual) / avgInherent * 100).toFixed(1) : '0.0';

        return {
            total: this.residualData.length,
            avgInherent: avgInherent,
            avgResidual: avgResidual,
            reduction: reduction,
            riskLevelCounts: riskLevelCounts,
            validInherentCount: validInherentCount
        };
    }
    
    renderStatistics(stats) {
        return `
            <div class="stats-grid">
                <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
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
                                ${Object.entries(stats.riskLevelCounts || {}).map(([level, count]) => `
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
    
    renderTable() {
        return `
            <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 2rem;">
                <h4 style="margin-bottom: 1rem;"><i data-lucide="table"></i> Detail Residual Risk Analysis</h4>
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
                            ${this.residualData.map((item, index) => {
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
                                
                                // Truncate long text
                                const truncateText = (text, maxLength = 30) => {
                                    if (!text) return '-';
                                    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
                                };
                                
                                return `
                                    <tr>
                                        <td><strong>${index + 1}</strong></td>
                                        <td><strong>${risk.kode_risiko || '-'}</strong></td>
                                        <td>${truncateText(risk.master_work_units?.name)}</td>
                                        <td title="${risk.sasaran || ''}">${truncateText(risk.sasaran, 40)}</td>
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
        `;
    }
    
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
    
    async downloadExcel() {
        try {
            this.debugLog('Starting Excel download...');
            
            const response = await fetch('/api/reports/residual-risk/excel', {
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
            console.error('Error downloading Excel:', error);
            this.showError('Error downloading Excel: ' + error.message);
        }
    }
    
    showSuccessMessage(message) {
        const container = document.getElementById('content-area');
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
        
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Global instance
let residualRiskManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    residualRiskManager = new ResidualRiskManager();
});

// Global functions for button clicks
function toggleDebug() {
    if (residualRiskManager) {
        residualRiskManager.toggleDebug();
    }
}

function loadData() {
    if (residualRiskManager) {
        residualRiskManager.loadData();
    }
}

function downloadExcel() {
    if (residualRiskManager) {
        residualRiskManager.downloadExcel();
    }
}