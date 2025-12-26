// Modern Risk Profile Module
class ModernRiskProfile {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentFilter = 'all';
        this.selectedRisk = null;
        this.isLoading = false;
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    // Initialize risk profile
    async init() {
        console.log('Initializing Modern Risk Profile...');
        await this.loadData();
        this.initializeHeatMap();
        this.setupEventListeners();
    }

    // Load risk profile data
    async loadData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();

        try {
            console.log('Loading risk profile data...');
            
            // Automatically detect the current port and host
            const baseUrl = `${window.location.protocol}//${window.location.host}`;
            console.log('Using base URL:', baseUrl);
            
            // Try multiple endpoints for better reliability
            const endpoints = [
                '/api/risk-profile/public',
                '/api/risk-profile/simple',
                '/api/risk-profile/debug'
            ];

            let data = null;
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying endpoint: ${baseUrl}${endpoint}`);
                    const response = await fetch(`${baseUrl}${endpoint}`);
                    
                    if (response.ok) {
                        data = await response.json();
                        console.log(`Successfully loaded data from ${endpoint}:`, data);
                        break;
                    }
                } catch (error) {
                    console.warn(`Endpoint ${endpoint} failed:`, error.message);
                    continue;
                }
            }

            if (!data) {
                throw new Error('Failed to load data from all endpoints');
            }

            this.data = Array.isArray(data) ? data : [];
            this.filteredData = [...this.data];
            
            this.updateStatistics();
            this.renderTable();
            this.updateHeatMap();

        } catch (error) {
            console.error('Error loading risk profile data:', error);
            this.showErrorState(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    // Show loading state
    showLoadingState() {
        const tbody = document.getElementById('risk-profile-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center">
                        <div class="flex flex-col items-center gap-2">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p class="text-slate-500">Memuat data risk profile...</p>
                        </div>
                    </td>
                </tr>
            `;
        }

        // Show loading in stats
        const statElements = ['total-profiles', 'high-risk-profiles', 'medium-risk-profiles', 'low-risk-profiles'];
        statElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }
        });
    }

    // Show error state
    showErrorState(message) {
        const tbody = document.getElementById('risk-profile-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-red-500">
                        <div class="flex flex-col items-center gap-2">
                            <span class="material-symbols-outlined text-4xl text-red-300">error</span>
                            <p>Error loading risk profile data</p>
                            <p class="text-sm text-slate-500">${message}</p>
                            <button onclick="modernRiskProfile.loadData()" class="mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">
                                Try Again
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }

        // Reset stats to 0
        const statElements = ['total-profiles', 'high-risk-profiles', 'medium-risk-profiles', 'low-risk-profiles'];
        statElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '0';
            }
        });
    }

    // Update statistics
    updateStatistics() {
        const stats = this.calculateStatistics(this.filteredData);
        
        // Animate counters
        this.animateCounter('total-profiles', stats.total);
        this.animateCounter('high-risk-profiles', stats.high);
        this.animateCounter('medium-risk-profiles', stats.medium);
        this.animateCounter('low-risk-profiles', stats.low);

        console.log('Risk profile statistics updated:', stats);
    }

    // Calculate statistics
    calculateStatistics(data) {
        const stats = { total: 0, high: 0, medium: 0, low: 0 };
        
        data.forEach(item => {
            stats.total++;
            const level = (item.risk_level || '').toLowerCase();
            
            if (level.includes('high') || level.includes('extreme')) {
                stats.high++;
            } else if (level.includes('medium') || level.includes('moderat')) {
                stats.medium++;
            } else if (level.includes('low') || level.includes('rendah')) {
                stats.low++;
            }
        });
        
        return stats;
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

    // Render table
    renderTable() {
        const tbody = document.getElementById('risk-profile-table-body');
        const tableInfo = document.getElementById('table-info');
        
        if (!tbody) return;

        if (this.filteredData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-slate-500">
                        <div class="flex flex-col items-center gap-2">
                            <span class="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                            <p>Tidak ada data risk profile</p>
                            <p class="text-sm">Coba ubah filter atau tambah data baru</p>
                        </div>
                    </td>
                </tr>
            `;
            if (tableInfo) tableInfo.textContent = 'Tidak ada data';
            return;
        }

        // Pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedData = this.filteredData.slice(startIndex, endIndex);

        tbody.innerHTML = paginatedData.map((item, index) => {
            const actualIndex = startIndex + index;
            const riskLevel = item.risk_level || 'Unknown';
            const levelClass = this.getRiskLevelClass(riskLevel);
            const riskCode = item.risk_inputs?.kode_risiko || `RSK-${String(actualIndex + 1).padStart(3, '0')}`;
            const sasaran = item.risk_inputs?.sasaran || 'Tidak ada deskripsi';
            const unitName = item.risk_inputs?.master_work_units?.name || 'Unit tidak diketahui';
            const categoryName = item.risk_inputs?.master_risk_categories?.name || 'Kategori tidak diketahui';
            const riskScore = this.calculateRiskScore(item);

            return `
                <tr class="hover:bg-blue-50/30 transition-colors group cursor-pointer" onclick="modernRiskProfile.selectRisk(${actualIndex})">
                    <td class="px-6 py-4">
                        <span class="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded">${riskCode}</span>
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">
                            ${this.truncateText(sasaran, 50)}
                        </p>
                        <div class="flex items-center gap-2 mt-1.5">
                            <span class="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                                <span class="material-symbols-outlined text-[14px] text-slate-400">business</span> 
                                ${this.truncateText(unitName, 20)}
                            </span>
                            <span class="size-1 bg-slate-300 rounded-full"></span>
                            <span class="text-[11px] text-slate-400">${this.truncateText(categoryName, 15)}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <div class="inline-flex items-center justify-center size-8 rounded-lg bg-slate-100 font-bold text-slate-700 text-sm">
                            ${riskScore}
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${levelClass}">
                            ${riskLevel}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="text-xs text-slate-600">${this.truncateText(categoryName, 20)}</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button class="text-slate-400 hover:text-primary hover:bg-blue-50 transition-all p-1.5 rounded-lg" 
                                onclick="event.stopPropagation(); modernRiskProfile.showRiskDetails(${actualIndex})">
                            <span class="material-symbols-outlined text-[20px]">more_horiz</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Update table info
        if (tableInfo) {
            const start = startIndex + 1;
            const end = Math.min(endIndex, this.filteredData.length);
            tableInfo.textContent = `Showing ${start}-${end} of ${this.filteredData.length} risk profiles`;
        }

        // Update pagination
        this.updatePagination();
    }

    // Update pagination
    updatePagination() {
        const paginationContainer = document.getElementById('pagination-controls');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all hover:border-slate-300 ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                    onclick="modernRiskProfile.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                Prev
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            const isActive = i === this.currentPage;
            paginationHTML += `
                <button class="px-3 py-1.5 ${isActive ? 'bg-primary text-white border border-primary shadow-md shadow-blue-500/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'} rounded-lg text-xs font-bold transition-all" 
                        onclick="modernRiskProfile.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all hover:border-slate-300 ${this.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
                    onclick="modernRiskProfile.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                Next
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    // Go to page
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderTable();
    }

    // Get risk level CSS class
    getRiskLevelClass(level) {
        const levelLower = level.toLowerCase();
        if (levelLower.includes('high') || levelLower.includes('extreme') || levelLower.includes('ekstrem')) {
            return 'bg-red-50 text-red-600 border border-red-100';
        } else if (levelLower.includes('medium') || levelLower.includes('moderat') || levelLower.includes('sedang')) {
            return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
        } else if (levelLower.includes('low') || levelLower.includes('rendah')) {
            return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
        }
        return 'bg-slate-50 text-slate-600 border border-slate-100';
    }

    // Calculate risk score
    calculateRiskScore(item) {
        // This is a simplified calculation - adjust based on your actual scoring logic
        const impact = item.impact_score || item.dampak_score || 1;
        const probability = item.probability_score || item.kemungkinan_score || 1;
        return Math.min(impact * probability, 25);
    }

    // Truncate text
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Initialize heat map
    initializeHeatMap() {
        const heatMap = document.getElementById('heat-map');
        if (!heatMap) return;

        let cells = '';
        
        for (let prob = 5; prob >= 1; prob--) {
            for (let impact = 1; impact <= 5; impact++) {
                const score = prob * impact;
                const cellClass = this.getHeatMapCellClass(score);
                cells += `
                    <div class="heatmap-cell ${cellClass} rounded flex items-center justify-center cursor-pointer relative transition-all hover:scale-110 hover:z-10 hover:shadow-lg" 
                         onclick="modernRiskProfile.filterByScore(${score})" 
                         data-score="${score}"
                         title="Score: ${score} (Impact: ${impact}, Probability: ${prob})">
                        ${score}
                    </div>
                `;
            }
        }
        
        heatMap.innerHTML = cells;
    }

    // Update heat map with data
    updateHeatMap() {
        const cells = document.querySelectorAll('.heatmap-cell');
        
        // Reset all cells
        cells.forEach(cell => {
            const existingBadge = cell.querySelector('.risk-count-badge');
            if (existingBadge) {
                existingBadge.remove();
            }
        });

        // Count risks by score
        const scoreCounts = {};
        this.filteredData.forEach(item => {
            const score = this.calculateRiskScore(item);
            scoreCounts[score] = (scoreCounts[score] || 0) + 1;
        });

        // Add count badges
        Object.entries(scoreCounts).forEach(([score, count]) => {
            const cell = document.querySelector(`[data-score="${score}"]`);
            if (cell && count > 0) {
                const badge = document.createElement('div');
                badge.className = 'absolute -top-2 -right-2 bg-white text-red-600 size-5 rounded-full flex items-center justify-center text-[10px] shadow-sm border border-red-100 font-bold risk-count-badge';
                badge.textContent = count;
                cell.appendChild(badge);
            }
        });
    }

    // Get heat map cell class
    getHeatMapCellClass(score) {
        if (score >= 20) return 'bg-red-500 text-white';
        if (score >= 15) return 'bg-red-300 text-red-900';
        if (score >= 10) return 'bg-orange-300 text-slate-800';
        if (score >= 6) return 'bg-orange-200 text-slate-700';
        if (score >= 3) return 'bg-yellow-100 text-slate-600';
        return 'bg-emerald-50 text-emerald-700';
    }

    // Filter functions
    filterRiskProfile(type) {
        this.currentFilter = type;
        this.currentPage = 1; // Reset to first page
        
        if (type === 'all') {
            this.filteredData = [...this.data];
        } else {
            this.filteredData = this.data.filter(item => {
                const level = (item.risk_level || '').toLowerCase();
                switch (type) {
                    case 'high':
                        return level.includes('high') || level.includes('extreme') || level.includes('ekstrem');
                    case 'medium':
                        return level.includes('medium') || level.includes('moderat') || level.includes('sedang');
                    case 'low':
                        return level.includes('low') || level.includes('rendah');
                    default:
                        return true;
                }
            });
        }
        
        this.updateStatistics();
        this.renderTable();
        this.updateHeatMap();
        this.updateFilterButtons();
    }

    // Update filter buttons
    updateFilterButtons() {
        const buttons = document.querySelectorAll('[onclick^="filterRiskProfile"]');
        buttons.forEach(button => {
            button.classList.remove('border-primary', 'text-primary', 'font-bold');
            button.classList.add('border-transparent', 'text-slate-500', 'font-medium');
        });
        
        const activeButton = document.querySelector(`[onclick="filterRiskProfile('${this.currentFilter}')"]`);
        if (activeButton) {
            activeButton.classList.add('border-primary', 'text-primary', 'font-bold');
            activeButton.classList.remove('border-transparent', 'text-slate-500', 'font-medium');
        }
    }

    // Select risk for analysis
    selectRisk(index) {
        this.selectedRisk = this.filteredData[index];
        this.updateRiskAnalysis();
    }

    // Update risk analysis panel
    updateRiskAnalysis() {
        if (!this.selectedRisk) return;

        const title = document.getElementById('selected-risk-title');
        const level = document.getElementById('selected-risk-level');
        const content = document.getElementById('risk-analysis-content');

        if (!title || !level || !content) return;

        const riskCode = this.selectedRisk.risk_inputs?.kode_risiko || 'RSK-XXX';
        const sasaran = this.selectedRisk.risk_inputs?.sasaran || 'Tidak ada deskripsi';
        const riskLevel = this.selectedRisk.risk_level || 'Unknown';
        const impactScore = this.selectedRisk.impact_score || this.selectedRisk.dampak_score || 1;
        const probabilityScore = this.selectedRisk.probability_score || this.selectedRisk.kemungkinan_score || 1;

        title.textContent = `${riskCode}: ${this.truncateText(sasaran, 30)}`;
        level.textContent = riskLevel;
        level.className = `inline-flex items-center px-2 py-1 rounded text-[10px] font-bold border ${this.getRiskLevelClass(riskLevel)}`;

        content.innerHTML = `
            <div class="space-y-6">
                <div>
                    <div class="flex justify-between text-xs mb-3 items-end">
                        <span class="font-bold text-slate-700">Dampak (Impact)</span>
                        <span class="font-bold text-primary bg-primary-light px-2 py-1 rounded">${impactScore} - ${this.getScoreLabel(impactScore)}</span>
                    </div>
                    <div class="relative h-2 bg-slate-100 rounded-full">
                        <div class="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500" style="width: ${(impactScore / 5) * 100}%"></div>
                    </div>
                    <div class="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
                        <span>Insignificant</span>
                        <span>Catastrophic</span>
                    </div>
                </div>
                <div>
                    <div class="flex justify-between text-xs mb-3 items-end">
                        <span class="font-bold text-slate-700">Kemungkinan (Probability)</span>
                        <span class="font-bold text-primary bg-primary-light px-2 py-1 rounded">${probabilityScore} - ${this.getScoreLabel(probabilityScore)}</span>
                    </div>
                    <div class="relative h-2 bg-slate-100 rounded-full">
                        <div class="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500" style="width: ${(probabilityScore / 5) * 100}%"></div>
                    </div>
                    <div class="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
                        <span>Rare</span>
                        <span>Almost Certain</span>
                    </div>
                </div>
            </div>
            <div class="pt-4 border-t border-slate-100">
                <p class="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Detail Risiko</p>
                <div class="space-y-2 text-sm">
                    <div><span class="font-medium text-slate-600">Unit:</span> ${this.selectedRisk.risk_inputs?.master_work_units?.name || 'N/A'}</div>
                    <div><span class="font-medium text-slate-600">Kategori:</span> ${this.selectedRisk.risk_inputs?.master_risk_categories?.name || 'N/A'}</div>
                    <div><span class="font-medium text-slate-600">Score:</span> ${this.calculateRiskScore(this.selectedRisk)}</div>
                    <div><span class="font-medium text-slate-600">Level:</span> ${riskLevel}</div>
                </div>
            </div>
            <div class="pt-4 border-t border-slate-100">
                <p class="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Deskripsi</p>
                <p class="text-sm text-slate-600 leading-relaxed">${sasaran}</p>
            </div>
        `;
    }

    // Get score label
    getScoreLabel(score) {
        const labels = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
        return labels[Math.min(Math.max(score, 1), 5)] || 'Unknown';
    }

    // Setup event listeners
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('[onclick^="filterRiskProfile"]');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const filterType = button.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.filterRiskProfile(filterType);
            });
        });
    }

    // Handle search
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (searchTerm === '') {
            this.filterRiskProfile(this.currentFilter);
            return;
        }

        this.filteredData = this.data.filter(item => {
            const sasaran = (item.risk_inputs?.sasaran || '').toLowerCase();
            const unitName = (item.risk_inputs?.master_work_units?.name || '').toLowerCase();
            const categoryName = (item.risk_inputs?.master_risk_categories?.name || '').toLowerCase();
            const riskCode = (item.risk_inputs?.kode_risiko || '').toLowerCase();
            const riskLevel = (item.risk_level || '').toLowerCase();
            
            return sasaran.includes(searchTerm) || 
                   unitName.includes(searchTerm) || 
                   categoryName.includes(searchTerm) || 
                   riskCode.includes(searchTerm) ||
                   riskLevel.includes(searchTerm);
        });

        this.currentPage = 1; // Reset to first page
        this.updateStatistics();
        this.renderTable();
        this.updateHeatMap();
    }

    // Utility functions
    async refresh() {
        console.log('Refreshing risk profile data...');
        await this.loadData();
    }

    filterByScore(score) {
        this.filteredData = this.data.filter(item => this.calculateRiskScore(item) === score);
        this.currentPage = 1;
        this.updateStatistics();
        this.renderTable();
        this.updateHeatMap();
        
        // Show notification
        this.showNotification(`Filtered by risk score: ${score}`, 'info');
    }

    showRiskDetails(index) {
        const risk = this.filteredData[index];
        if (!risk) return;
        
        // For now, just select the risk for analysis
        this.selectRisk(index);
        
        // You could also show a modal or navigate to a detail page
        this.showNotification(`Selected risk: ${risk.risk_inputs?.kode_risiko || 'Unknown'}`, 'success');
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            type === 'success' ? 'bg-emerald-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Get current data
    getData() {
        return {
            all: this.data,
            filtered: this.filteredData,
            selected: this.selectedRisk
        };
    }
}

// Initialize modern risk profile
let modernRiskProfile;

document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the modern risk profile page
    if (document.getElementById('risk-profile-table-body') || document.getElementById('total-profiles')) {
        modernRiskProfile = new ModernRiskProfile();
        modernRiskProfile.init();
    }
});

// Export for global access
window.modernRiskProfile = modernRiskProfile;

// Global functions for onclick handlers
function refreshRiskProfile() {
    if (modernRiskProfile) {
        modernRiskProfile.refresh();
    }
}

function filterRiskProfile(type) {
    if (modernRiskProfile) {
        modernRiskProfile.filterRiskProfile(type);
    }
}

// Navigation functions (placeholders)
function showDashboard() { 
    window.location.href = 'dashboard-modern.html'; 
}

function showAnalisisBSC() { 
    alert('Analisis BSC - Coming Soon'); 
}

function showVisiMisi() { 
    alert('Visi Misi - Coming Soon'); 
}

function showRencanaStrategis() { 
    alert('Rencana Strategis - Coming Soon'); 
}

function showRiskRegister() { 
    alert('Risk Register - Coming Soon'); 
}

function showRiskProfile() { 
    /* Already on this page */ 
}

console.log('Modern Risk Profile module loaded');