/**
 * Residual Risk Analysis - TypeScript Implementation
 * Enhanced version with proper typing and comprehensive data handling
 */

// Type definitions
interface RiskInput {
  id: string;
  kode_risiko: string;
  sasaran: string;
  penyebab_risiko: string;
  dampak_risiko: string;
  user_id: string;
  organization_id: string;
  master_work_units?: {
    name: string;
  };
  master_risk_categories?: {
    name: string;
  };
  risk_inherent_analysis?: InherentAnalysis[];
}

interface InherentAnalysis {
  id: string;
  risk_input_id: string;
  probability: number;
  impact: number;
  risk_value: number;
  risk_level: string;
  probability_percentage: string;
  financial_impact: number;
}

interface ResidualRiskData {
  id: string;
  risk_input_id: string;
  probability: number;
  impact: number;
  risk_value: number;
  risk_level: string;
  probability_percentage: string;
  financial_impact: number;
  net_risk_value: number;
  department: string;
  review_status: string;
  next_review_date: string;
  created_at: string;
  updated_at: string;
  risk_inputs: RiskInput;
}

interface RiskStatistics {
  total: number;
  avgInherent: number;
  avgResidual: number;
  reduction: string;
  riskLevelCounts: Record<string, number>;
  validInherentCount: number;
  totalFinancialImpact: number;
  avgFinancialImpact: number;
}

interface APIResponse {
  data?: ResidualRiskData[];
  error?: string;
  message?: string;
}

// Risk level mapping
enum RiskLevel {
  LOW = 'LOW RISK',
  MEDIUM = 'MEDIUM RISK', 
  HIGH = 'HIGH RISK',
  EXTREME = 'EXTREME HIGH',
  VERY_HIGH = 'VERY HIGH'
}

// CSS classes for risk levels
const RISK_LEVEL_CLASSES: Record<string, string> = {
  [RiskLevel.LOW]: 'badge-low-risk',
  [RiskLevel.MEDIUM]: 'badge-medium-risk',
  [RiskLevel.HIGH]: 'badge-high-risk',
  [RiskLevel.EXTREME]: 'badge-extreme-high',
  [RiskLevel.VERY_HIGH]: 'badge-extreme-high'
};

class ResidualRiskManager {
  private residualData: ResidualRiskData[] = [];
  private debugMode: boolean = false;
  private readonly API_ENDPOINT = '/api/reports/residual-risk-simple';
  private readonly EXCEL_ENDPOINT = '/api/reports/residual-risk/excel';

  constructor() {
    this.initializeEventListeners();
    this.initializePage();
  }

  private initializeEventListeners(): void {
    document.addEventListener('DOMContentLoaded', () => {
      this.debugLog('DOM loaded, initializing...');
      this.initializeLucideIcons();
      
      // Auto-load data after a short delay
      setTimeout(() => {
        this.debugLog('Auto-loading data...');
        this.loadData();
      }, 500);
    });
  }

  private initializePage(): void {
    // Initialize Lucide icons if available
    this.initializeLucideIcons();
  }

  private initializeLucideIcons(): void {
    if (typeof (window as any).lucide !== 'undefined') {
      (window as any).lucide.createIcons();
      this.debugLog('Lucide icons initialized');
    } else {
      this.debugLog('WARNING: Lucide not loaded, icons may not display');
    }
  }

  private debugLog(message: string): void {
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

  public toggleDebug(): void {
    this.debugMode = !this.debugMode;
    const debugPanel = document.getElementById('debug-panel');
    
    if (debugPanel) {
      debugPanel.style.display = this.debugMode ? 'block' : 'none';
    }
    
    if (this.debugMode) {
      this.debugLog('Debug mode enabled');
      this.debugLog(`Current URL: ${window.location.href}`);
      this.debugLog(`API URL: ${window.location.origin}${this.API_ENDPOINT}`);
    }
  }

  public async loadData(): Promise<void> {
    try {
      this.debugLog('Starting data load...');
      
      // Show loading state
      this.showLoadingState();
      
      const response = await fetch(this.API_ENDPOINT, {
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
      
      let parsedData: ResidualRiskData[];
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        this.debugLog(`JSON Parse Error: ${parseError}`);
        this.debugLog(`First 500 chars of response: ${responseText.substring(0, 500)}`);
        throw new Error(`Failed to parse JSON response: ${parseError}`);
      }
      
      if (!Array.isArray(parsedData)) {
        this.debugLog(`ERROR: Data is not an array, type: ${typeof parsedData}`);
        throw new Error('Invalid data format received from API - expected array');
      }
      
      this.residualData = parsedData;
      this.debugLog(`Data loaded: ${this.residualData.length} records`);
      
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
      this.debugLog(`❌ Error loading data: ${error}`);
      console.error('Error loading data:', error);
      this.showError(`Gagal memuat data: ${error}`);
    }
  }

  private showLoadingState(): void {
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
  }

  private showError(message: string): void {
    const container = document.getElementById('content-area');
    if (!container) return;
    
    container.innerHTML = `
      <div class="error-panel">
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
    
    this.initializeLucideIcons();
  }

  private renderContent(): void {
    const container = document.getElementById('content-area');
    if (!container) return;
    
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
      this.initializeLucideIcons();
      return;
    }
    
    // Calculate statistics
    const stats = this.calculateStatistics();
    this.debugLog(`Statistics calculated: ${JSON.stringify(stats)}`);
    
    container.innerHTML = `
      <div class="success-panel">
        <h4><i data-lucide="check-circle"></i> Data Berhasil Dimuat</h4>
        <p>Berhasil memuat ${this.residualData.length} record residual risk analysis.</p>
      </div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i data-lucide="pie-chart"></i> Residual Risk Analysis</h3>
        </div>
        <div class="card-body">
          ${this.renderStatistics(stats)}
          ${this.renderRiskMatrix()}
          ${this.renderTable()}
        </div>
      </div>
    `;
    
    this.initializeLucideIcons();
  }

  private calculateStatistics(): RiskStatistics {
    let totalInherent = 0;
    let totalResidual = 0;
    let totalFinancialImpact = 0;
    let validInherentCount = 0;
    
    const riskLevelCounts: Record<string, number> = {
      [RiskLevel.LOW]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.EXTREME]: 0,
      [RiskLevel.VERY_HIGH]: 0
    };
    
    this.residualData.forEach(item => {
      const risk = item.risk_inputs;
      if (!risk) return;
      
      // Get inherent data
      let inherent: InherentAnalysis | undefined;
      if (risk.risk_inherent_analysis && Array.isArray(risk.risk_inherent_analysis) && risk.risk_inherent_analysis.length > 0) {
        inherent = risk.risk_inherent_analysis[0];
      }
      
      const inherentValue = inherent?.risk_value || 0;
      const residualValue = item.risk_value || 0;
      const financialImpact = parseFloat(String(item.financial_impact)) || 0;
      
      if (inherentValue > 0) {
        totalInherent += inherentValue;
        validInherentCount++;
      }
      
      if (residualValue > 0) {
        totalResidual += residualValue;
      }
      
      totalFinancialImpact += financialImpact;
      
      // Count risk levels
      const riskLevel = this.normalizeRiskLevel(item.risk_level);
      if (riskLevel in riskLevelCounts) {
        riskLevelCounts[riskLevel]++;
      }
    });

    const avgInherent = validInherentCount > 0 ? totalInherent / validInherentCount : 0;
    const avgResidual = this.residualData.length > 0 ? totalResidual / this.residualData.length : 0;
    const avgFinancialImpact = this.residualData.length > 0 ? totalFinancialImpact / this.residualData.length : 0;
    const reduction = avgInherent > 0 ? ((avgInherent - avgResidual) / avgInherent * 100).toFixed(1) : '0.0';

    return {
      total: this.residualData.length,
      avgInherent,
      avgResidual,
      reduction,
      riskLevelCounts,
      validInherentCount,
      totalFinancialImpact,
      avgFinancialImpact
    };
  }

  private normalizeRiskLevel(level: string): string {
    const levelUpper = (level || '').toUpperCase();
    
    if (levelUpper.includes('LOW') || levelUpper.includes('RENDAH')) {
      return RiskLevel.LOW;
    } else if (levelUpper.includes('MEDIUM') || levelUpper.includes('SEDANG')) {
      return RiskLevel.MEDIUM;
    } else if (levelUpper.includes('HIGH') && !levelUpper.includes('EXTREME')) {
      return RiskLevel.HIGH;
    } else if (levelUpper.includes('EXTREME') || levelUpper.includes('VERY HIGH') || levelUpper.includes('SANGAT')) {
      return RiskLevel.EXTREME;
    } else {
      return RiskLevel.LOW; // Default fallback
    }
  }

  private renderStatistics(stats: RiskStatistics): string {
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
              <h5><i data-lucide="dollar-sign"></i> Financial Impact</h5>
            </div>
            <div class="card-body">
              <p><strong>Total Financial Impact:</strong> ${this.formatCurrency(stats.totalFinancialImpact)}</p>
              <p><strong>Average per Risk:</strong> ${this.formatCurrency(stats.avgFinancialImpact)}</p>
              <p><strong>Data Coverage:</strong> ${stats.total > 0 ? ((stats.validInherentCount / stats.total) * 100).toFixed(1) : 0}%</p>
              <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderRiskMatrix(): string {
    // Create a simple risk matrix visualization
    const matrixData = this.createMatrixData();
    
    return `
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5><i data-lucide="grid-3x3"></i> Risk Matrix Visualization</h5>
            </div>
            <div class="card-body">
              <div class="risk-matrix-container">
                <canvas id="riskMatrixChart" width="400" height="300"></canvas>
              </div>
              <div class="risk-matrix-legend">
                <div class="legend-item">
                  <span class="legend-symbol" style="background-color: #28a745;"></span>
                  <span>Low Risk (1-4)</span>
                </div>
                <div class="legend-item">
                  <span class="legend-symbol" style="background-color: #ffc107;"></span>
                  <span>Medium Risk (5-9)</span>
                </div>
                <div class="legend-item">
                  <span class="legend-symbol" style="background-color: #fd7e14;"></span>
                  <span>High Risk (10-15)</span>
                </div>
                <div class="legend-item">
                  <span class="legend-symbol" style="background-color: #dc3545;"></span>
                  <span>Extreme Risk (16-25)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private createMatrixData(): any[] {
    return this.residualData.map(item => ({
      x: item.probability || 0,
      y: item.impact || 0,
      value: item.risk_value || 0,
      label: item.risk_inputs?.kode_risiko || 'Unknown',
      level: item.risk_level || 'Unknown'
    }));
  }

  private renderTable(): string {
    return `
      <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 2rem;">
        <h4 style="margin-bottom: 1rem;"><i data-lucide="table"></i> Detail Residual Risk Analysis</h4>
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>No</th>
                <th>Kode Risiko</th>
                <th>Unit Kerja</th>
                <th>Sasaran</th>
                <th>Inherent</th>
                <th>Residual</th>
                <th>Reduction</th>
                <th>Level</th>
                <th>Financial Impact</th>
                <th>Review Status</th>
                <th>Next Review</th>
              </tr>
            </thead>
            <tbody>
              ${this.residualData.map((item, index) => this.renderTableRow(item, index)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  private renderTableRow(item: ResidualRiskData, index: number): string {
    const risk = item.risk_inputs;
    if (!risk) return '';
    
    // Get inherent data
    let inherent: InherentAnalysis | undefined;
    if (risk.risk_inherent_analysis && Array.isArray(risk.risk_inherent_analysis) && risk.risk_inherent_analysis.length > 0) {
      inherent = risk.risk_inherent_analysis[0];
    }
    
    const inherentValue = inherent?.risk_value || 0;
    const inherentLevel = inherent?.risk_level || 'UNKNOWN';
    const residualValue = item.risk_value || 0;
    const financialImpact = parseFloat(String(item.financial_impact)) || 0;
    
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
        <td>${this.formatCurrency(financialImpact)}</td>
        <td><span class="badge-status badge-secondary">${item.review_status || '-'}</span></td>
        <td>${item.next_review_date || '-'}</td>
      </tr>
    `;
  }

  private truncateText(text: string | undefined, maxLength: number = 30): string {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  private getBadgeClass(level: string): string {
    const normalizedLevel = this.normalizeRiskLevel(level);
    return RISK_LEVEL_CLASSES[normalizedLevel] || 'badge-secondary';
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  public async downloadExcel(): Promise<void> {
    try {
      this.debugLog('Starting Excel download...');
      
      const response = await fetch(this.EXCEL_ENDPOINT, {
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
      this.debugLog(`❌ Excel download error: ${error}`);
      this.showError('Error downloading Excel: ' + error);
    }
  }

  private showSuccessMessage(message: string): void {
    const container = document.getElementById('content-area');
    if (!container) return;
    
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
    
    this.initializeLucideIcons();
  }
}

// Global instance
declare global {
  interface Window {
    residualRiskManager: ResidualRiskManager;
  }
}

// Initialize the manager
const residualRiskManager = new ResidualRiskManager();
window.residualRiskManager = residualRiskManager;

// Export for module usage
export { ResidualRiskManager, ResidualRiskData, RiskStatistics };