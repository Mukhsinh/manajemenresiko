
// Enhanced Analisis SWOT JavaScript with comprehensive error handling
class AnalisisSWOTManager {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        this.data = [];
        this.init();
    }

    init() {
        console.log('🚀 Initializing Analisis SWOT Manager...');
        this.setupEventListeners();
        this.loadData();
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('swotForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadData());
        }

        // Add new item button
        const addBtn = document.getElementById('addSwotBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddForm());
        }
    }

    async loadData() {
        try {
            console.log('📊 Loading SWOT data...');
            this.showLoading(true);

            const headers = {
                'Content-Type': 'application/json'
            };

            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(`${this.apiBaseUrl}/analisis-swot`, {
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
            
            console.log(`✅ Loaded ${this.data.length} SWOT records`);
            this.renderData();
            this.updateSummary();

        } catch (error) {
            console.error('❌ Error loading SWOT data:', error);
            this.showError('Gagal memuat data SWOT: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    renderData() {
        const tableBody = document.getElementById('swotTableBody');
        if (!tableBody) {
            console.warn('⚠️ SWOT table body not found');
            return;
        }

        if (this.data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-info-circle mb-2"></i>
                            <p>Belum ada data analisis SWOT</p>
                            <button class="btn btn-primary btn-sm" onclick="swotManager.showAddForm()">
                                <i class="fas fa-plus"></i> Tambah Data
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const rows = this.data.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${this.escapeHtml(item.faktor || '-')}</td>
                <td>
                    <span class="badge badge-${this.getJenisBadgeClass(item.jenis)}">
                        ${item.jenis || '-'}
                    </span>
                </td>
                <td class="text-right">${item.bobot || 0}%</td>
                <td class="text-center">${item.rating || 0}</td>
                <td class="text-right font-weight-bold">${(item.skor || 0).toFixed(2)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="swotManager.editItem(${item.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="swotManager.deleteItem(${item.id})" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tableBody.innerHTML = rows;
    }

    getJenisBadgeClass(jenis) {
        const classes = {
            'Strength': 'success',
            'Weakness': 'warning',
            'Opportunity': 'info',
            'Threat': 'danger'
        };
        return classes[jenis] || 'secondary';
    }

    updateSummary() {
        const summary = this.calculateSummary();
        
        // Update summary cards
        this.updateSummaryCard('totalItems', summary.total);
        this.updateSummaryCard('totalBobot', summary.totalBobot + '%');
        this.updateSummaryCard('avgRating', summary.avgRating.toFixed(1));
        this.updateSummaryCard('totalSkor', summary.totalSkor.toFixed(2));

        // Update by type
        ['Strength', 'Weakness', 'Opportunity', 'Threat'].forEach(type => {
            const count = summary.byType[type] || 0;
            this.updateSummaryCard(type.toLowerCase() + 'Count', count);
        });
    }

    calculateSummary() {
        const total = this.data.length;
        const totalBobot = this.data.reduce((sum, item) => sum + (item.bobot || 0), 0);
        const totalSkor = this.data.reduce((sum, item) => sum + (item.skor || 0), 0);
        const avgRating = total > 0 ? this.data.reduce((sum, item) => sum + (item.rating || 0), 0) / total : 0;
        
        const byType = this.data.reduce((acc, item) => {
            const type = item.jenis || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        return { total, totalBobot, totalSkor, avgRating, byType };
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

        const table = document.getElementById('swotTable');
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

    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        if (successDiv) {
            successDiv.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show">
                    <i class="fas fa-check-circle"></i>
                    ${message}
                    <button type="button" class="close" data-dismiss="alert">
                        <span>&times;</span>
                    </button>
                </div>
            `;
            setTimeout(() => {
                successDiv.innerHTML = '';
            }, 5000);
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

    showAddForm() {
        // Implementation for showing add form modal
        console.log('📝 Showing add form...');
        const modal = document.getElementById('addSwotModal');
        if (modal) {
            $(modal).modal('show');
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        console.log('📤 Submitting SWOT form...');
        
        // Implementation for form submission
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/analisis-swot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showSuccess('Data SWOT berhasil disimpan');
                this.loadData();
                event.target.reset();
            } else {
                throw new Error('Gagal menyimpan data');
            }
        } catch (error) {
            this.showError('Gagal menyimpan data: ' + error.message);
        }
    }

    async editItem(id) {
        console.log(`✏️ Editing SWOT item: ${id}`);
        // Implementation for editing
    }

    async deleteItem(id) {
        if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
            console.log(`🗑️ Deleting SWOT item: ${id}`);
            // Implementation for deletion
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM loaded, initializing SWOT manager...');
    window.swotManager = new AnalisisSWOTManager();
});

// Fallback initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (!window.swotManager) {
            window.swotManager = new AnalisisSWOTManager();
        }
    });
} else {
    if (!window.swotManager) {
        window.swotManager = new AnalisisSWOTManager();
    }
}
