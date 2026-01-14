// Risk Register Enhanced Module
// Versi lengkap dengan kartu summary, tabel scroll, dan tombol yang berfungsi

(function() {
    'use strict';
    
    // State management
    let riskData = [];
    let filteredData = [];
    let isLoading = false;
    let currentPage = 1;
    const itemsPerPage = 50;
    
    // Initialize module
    function init() {
        console.log('🚀 Risk Register Enhanced Module initialized');
        loadRiskRegister();
    }
    
    // Load risk register data
    async function loadRiskRegister() {
        if (isLoading) return;
        isLoading = true;
        
        showLoading();
        
        try {
            const data = await fetchRiskRegisterData();
            riskData = data || [];
            filteredData = [...riskData];
            
            updateSummaryCards();
            renderTable();
            updatePagination();
            
            hideLoading();
        } catch (error) {
            console.error('Error loading risk register:', error);
            showError(error.message);
        } finally {
            isLoading = false;
        }
    }
    
    // Fetch data from API
    async function fetchRiskRegisterData() {
        try {
            // Try using app.apiCall if available
            if (window.app?.apiCall) {
                return await window.app.apiCall('/api/reports/risk-register');
            }
            
            // Fallback to direct fetch
            let token = null;
            if (window.supabaseClient) {
                const session = await window.supabaseClient.auth.getSession();
                token = session.data.session?.access_token;
            }
            
            if (!token) {
                token = localStorage.getItem('supabase.auth.token') || 
                        localStorage.getItem('authToken');
            }
            
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            
            const response = await fetch('/api/reports/risk-register', { headers });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }
    
    // Update summary cards
    function updateSummaryCards() {
        const stats = calculateStats(filteredData);
        
        // Update card values
        const totalCard = document.querySelector('.risk-summary-card.total-risks .card-value');
        const activeCard = document.querySelector('.risk-summary-card.active-risks .card-value');
        const extremeCard = document.querySelector('.risk-summary-card.extreme-risks .card-value');
        const highCard = document.querySelector('.risk-summary-card.high-risks .card-value');
        const mediumCard = document.querySelector('.risk-summary-card.medium-risks .card-value');
        const lowCard = document.querySelector('.risk-summary-card.low-risks .card-value');
        
        if (totalCard) totalCard.textContent = stats.total;
        if (activeCard) activeCard.textContent = stats.active;
        if (extremeCard) extremeCard.textContent = stats.extremeRisk;
        if (highCard) highCard.textContent = stats.highRisk;
        if (mediumCard) mediumCard.textContent = stats.mediumRisk;
        if (lowCard) lowCard.textContent = stats.lowRisk;
    }
    
    // Calculate statistics
    function calculateStats(data) {
        const stats = {
            total: data.length,
            lowRisk: 0,
            mediumRisk: 0,
            highRisk: 0,
            extremeRisk: 0,
            active: 0
        };
        
        data.forEach(risk => {
            // Count by inherent risk level
            const inherent = risk.risk_inherent_analysis?.[0] || risk.risk_inherent_analysis;
            const level = (inherent?.risk_level || '').toLowerCase();
            
            if (level.includes('low')) stats.lowRisk++;
            else if (level.includes('medium')) stats.mediumRisk++;
            else if (level.includes('high') && !level.includes('extreme')) stats.highRisk++;
            else if (level.includes('extreme')) stats.extremeRisk++;
            
            // Count by status
            if ((risk.status_risiko || '').toLowerCase() === 'active') stats.active++;
        });
        
        return stats;
    }
    
    // Render table
    function renderTable() {
        const tbody = document.getElementById('risk-register-tbody');
        const table = document.getElementById('risk-register-data-table');
        
        if (!tbody || !table) return;
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        if (pageData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="19" class="text-center" style="padding: 2rem;">
                        <div class="risk-register-empty">
                            <i class="fas fa-inbox" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 0.5rem;"></i>
                            <p style="margin: 0; color: #64748b;">Tidak ada data risk register</p>
                        </div>
                    </td>
                </tr>
            `;
            table.style.display = 'table';
            return;
        }
        
        let html = '';
        pageData.forEach((risk, index) => {
            const inherent = risk.risk_inherent_analysis?.[0] || risk.risk_inherent_analysis || {};
            const residual = risk.risk_residual_analysis?.[0] || risk.risk_residual_analysis || {};
            const appetite = risk.risk_appetite?.[0] || risk.risk_appetite || {};
            
            html += `
                <tr>
                    <td>${startIndex + index + 1}</td>
                    <td><strong>${escapeHtml(risk.kode_risiko || '-')}</strong></td>
                    <td>${renderStatusBadge(risk.status_risiko)}</td>
                    <td>${renderJenisBadge(risk.jenis_risiko)}</td>
                    <td>${escapeHtml(risk.master_risk_categories?.name || '-')}</td>
                    <td>
                        <div>${escapeHtml(risk.master_work_units?.name || '-')}</div>
                        <small style="color: #94a3b8;">${escapeHtml(risk.master_work_units?.jenis || '')} ${escapeHtml(risk.master_work_units?.kategori || '')}</small>
                    </td>
                    <td class="text-truncate-rr" title="${escapeHtml(risk.sasaran || risk.sasaran_strategis || '')}">${truncateText(risk.sasaran || risk.sasaran_strategis, 35)}</td>
                    <td>${formatDate(risk.tanggal_registrasi)}</td>
                    <td class="text-truncate-rr" title="${escapeHtml(risk.penyebab_risiko || '')}">${truncateText(risk.penyebab_risiko, 30)}</td>
                    <td class="text-truncate-rr" title="${escapeHtml(risk.dampak_risiko || '')}">${truncateText(risk.dampak_risiko, 30)}</td>
                    <td style="text-align: center;">${inherent.probability || '-'}</td>
                    <td style="text-align: center;">${inherent.impact || '-'}</td>
                    <td style="text-align: center;"><strong>${inherent.risk_value || '-'}</strong></td>
                    <td>${renderRiskLevelBadge(inherent.risk_level)}</td>
                    <td style="text-align: center;">${residual.probability || '-'}</td>
                    <td style="text-align: center;">${residual.impact || '-'}</td>
                    <td style="text-align: center;"><strong>${residual.risk_value || '-'}</strong></td>
                    <td>${renderRiskLevelBadge(residual.risk_level)}</td>
                    <td>${escapeHtml(appetite.risk_appetite_level || '-')}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        table.style.display = 'table';
    }
    
    // Update pagination
    function updatePagination() {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage + 1;
        const endIndex = Math.min(currentPage * itemsPerPage, filteredData.length);
        
        const infoEl = document.getElementById('pagination-info');
        const controlsEl = document.getElementById('pagination-controls');
        
        if (infoEl) {
            infoEl.textContent = `Menampilkan ${filteredData.length > 0 ? startIndex : 0} - ${endIndex} dari ${filteredData.length} data`;
        }
        
        if (controlsEl) {
            let html = '';
            
            // Previous button
            html += `<button onclick="window.RiskRegisterEnhanced.goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>`;
            
            // Page numbers
            const maxVisiblePages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            if (startPage > 1) {
                html += `<button onclick="window.RiskRegisterEnhanced.goToPage(1)">1</button>`;
                if (startPage > 2) html += `<span style="padding: 0 0.5rem;">...</span>`;
            }
            
            for (let i = startPage; i <= endPage; i++) {
                html += `<button onclick="window.RiskRegisterEnhanced.goToPage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
            }
            
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) html += `<span style="padding: 0 0.5rem;">...</span>`;
                html += `<button onclick="window.RiskRegisterEnhanced.goToPage(${totalPages})">${totalPages}</button>`;
            }
            
            // Next button
            html += `<button onclick="window.RiskRegisterEnhanced.goToPage(${currentPage + 1})" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>`;
            
            controlsEl.innerHTML = html;
        }
    }
    
    // Go to page
    function goToPage(page) {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        currentPage = page;
        renderTable();
        updatePagination();
        
        // Scroll to top of table
        const container = document.getElementById('table-scroll-container');
        if (container) container.scrollTop = 0;
    }
    
    // Render badges
    function renderStatusBadge(status) {
        const statusLower = (status || 'active').toLowerCase();
        let className = 'status-active';
        
        if (statusLower === 'inactive' || statusLower === 'tidak aktif') {
            className = 'status-inactive';
        } else if (statusLower === 'closed' || statusLower === 'selesai') {
            className = 'status-closed';
        }
        
        return `<span class="status-badge ${className}">${escapeHtml(status || 'Active')}</span>`;
    }
    
    function renderJenisBadge(jenis) {
        const jenisLower = (jenis || 'threat').toLowerCase();
        const className = jenisLower === 'opportunity' ? 'jenis-opportunity' : 'jenis-threat';
        return `<span class="jenis-badge ${className}">${escapeHtml(jenis || 'Threat')}</span>`;
    }
    
    function renderRiskLevelBadge(level) {
        if (!level) return '-';
        
        const levelLower = level.toLowerCase();
        let className = 'risk-level-low';
        
        if (levelLower.includes('extreme')) {
            className = 'risk-level-extreme';
        } else if (levelLower.includes('high')) {
            className = 'risk-level-high';
        } else if (levelLower.includes('medium')) {
            className = 'risk-level-medium';
        }
        
        return `<span class="risk-level-badge ${className}">${escapeHtml(level)}</span>`;
    }
    
    // Helper functions
    function truncateText(text, maxLength = 50) {
        if (!text) return '-';
        const str = String(text);
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    }
    
    function formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Show/hide loading
    function showLoading() {
        const loading = document.getElementById('loading-indicator');
        const table = document.getElementById('risk-register-data-table');
        
        if (loading) loading.style.display = 'flex';
        if (table) table.style.display = 'none';
    }
    
    function hideLoading() {
        const loading = document.getElementById('loading-indicator');
        if (loading) loading.style.display = 'none';
    }
    
    function showError(message) {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ef4444; margin-bottom: 0.5rem;"></i>
                <span style="color: #ef4444;">Error: ${escapeHtml(message)}</span>
                <button class="btn-risk-action btn-refresh" onclick="window.RiskRegisterEnhanced.refresh()" style="margin-top: 1rem;">
                    <i class="fas fa-sync-alt"></i> Coba Lagi
                </button>
            `;
        }
    }
    
    // Filter functions
    function toggleFilterPanel() {
        const panel = document.getElementById('filter-panel');
        if (panel) {
            panel.classList.toggle('show');
        }
    }
    
    function applyFilters() {
        const statusFilter = document.getElementById('filter-status')?.value || '';
        const typeFilter = document.getElementById('filter-type')?.value || '';
        const levelFilter = document.getElementById('filter-level')?.value || '';
        const searchFilter = (document.getElementById('filter-search')?.value || '').toLowerCase();
        
        filteredData = riskData.filter(risk => {
            // Status filter
            if (statusFilter && (risk.status_risiko || '').toLowerCase() !== statusFilter.toLowerCase()) {
                return false;
            }
            
            // Type filter
            if (typeFilter && (risk.jenis_risiko || '').toLowerCase() !== typeFilter.toLowerCase()) {
                return false;
            }
            
            // Level filter
            if (levelFilter) {
                const inherent = risk.risk_inherent_analysis?.[0] || risk.risk_inherent_analysis;
                const level = (inherent?.risk_level || '').toUpperCase();
                if (level !== levelFilter) return false;
            }
            
            // Search filter
            if (searchFilter) {
                const searchFields = [
                    risk.kode_risiko,
                    risk.sasaran,
                    risk.sasaran_strategis,
                    risk.penyebab_risiko,
                    risk.dampak_risiko,
                    risk.master_work_units?.name,
                    risk.master_risk_categories?.name
                ].filter(Boolean).join(' ').toLowerCase();
                
                if (!searchFields.includes(searchFilter)) return false;
            }
            
            return true;
        });
        
        currentPage = 1;
        updateSummaryCards();
        renderTable();
        updatePagination();
    }
    
    // Refresh data
    function refreshRiskRegister() {
        loadRiskRegister();
    }
    
    // Download report - Versi Lengkap
    async function downloadRiskRegisterReport() {
        const btn = event?.target?.closest('button');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Mengunduh...</span>';
            btn.disabled = true;
            
            try {
                // Get auth token
                let token = null;
                if (window.supabaseClient) {
                    const session = await window.supabaseClient.auth.getSession();
                    token = session.data.session?.access_token;
                }
                
                if (!token) {
                    token = localStorage.getItem('supabase.auth.token') || 
                            localStorage.getItem('authToken');
                }
                
                const headers = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;
                
                // Fetch Excel file
                const response = await fetch('/api/reports/risk-register/excel', { headers });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `laporan-risk-register-lengkap-${new Date().toISOString().split('T')[0]}.xlsx`;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                showNotification('Laporan berhasil diunduh!', 'success');
            } catch (error) {
                console.error('Download error:', error);
                showNotification('Gagal mengunduh laporan: ' + error.message, 'error');
            } finally {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        }
    }
    
    // Print report
    function printRiskRegister() {
        window.print();
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            background: type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: '9999',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'slideInRight 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Export module
    window.RiskRegisterEnhanced = {
        init,
        load: loadRiskRegister,
        refresh: refreshRiskRegister,
        goToPage,
        applyFilters
    };
    
    // Global functions for onclick handlers
    window.refreshRiskRegister = refreshRiskRegister;
    window.downloadRiskRegisterReport = downloadRiskRegisterReport;
    window.printRiskRegister = printRiskRegister;
    window.toggleFilterPanel = toggleFilterPanel;
    window.applyFilters = applyFilters;
    
    // Also expose as loadRiskRegister for backward compatibility
    window.loadRiskRegister = loadRiskRegister;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Check if on risk-register page
            if (window.location.hash === '#risk-register' || 
                document.querySelector('[data-page="risk-register"].active') ||
                document.querySelector('#risk-register.active')) {
                init();
            }
        });
    }
})();
