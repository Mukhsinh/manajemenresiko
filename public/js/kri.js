// Key Risk Indicator (KRI) Module
const KRI = {
    async load() {
        try {
            console.log('Loading KRI data...');
            
            // Try main endpoint first
            let data;
            try {
                data = await apiCall('/api/kri');
                console.log('KRI data loaded from main endpoint:', data.length, 'records');
            } catch (authError) {
                console.warn('Main KRI endpoint failed:', authError.message);
                
                // Fallback to test endpoint if auth fails
                try {
                    const response = await fetch('/api/kri/test-no-auth');
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                    }
                    data = await response.json();
                    console.log('KRI data loaded from fallback endpoint:', data.length, 'records');
                } catch (fallbackError) {
                    console.error('Fallback endpoint also failed:', fallbackError.message);
                    throw new Error(`Authentication failed and fallback unavailable: ${authError.message}`);
                }
            }
            
            if (!data || data.length === 0) {
                throw new Error('No KRI data available');
            }
            
            this.render(data);
        } catch (error) {
            console.error('Error loading KRI:', error);
            document.getElementById('kri-content').innerHTML = 
                `<div class="card">
                    <div class="card-body">
                        <h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error Loading KRI</h5>
                        <p>${error.message}</p>
                        <button onclick="KRI.load()" class="btn btn-primary">Retry</button>
                        <button onclick="KRI.loadTestData()" class="btn btn-secondary">Load Test Data</button>
                    </div>
                </div>`;
        }
    },

    async loadTestData() {
        try {
            console.log('Loading KRI test data...');
            const response = await fetch('/api/kri/test-no-auth');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
            const data = await response.json();
            console.log('KRI test data loaded:', data.length, 'records');
            this.render(data);
        } catch (error) {
            console.error('Error loading KRI test data:', error);
            document.getElementById('kri-content').innerHTML = 
                `<div class="card">
                    <div class="card-body">
                        <h5 class="text-danger">Error Loading Test Data</h5>
                        <p>${error.message}</p>
                    </div>
                </div>`;
        }
    },

    /**
     * Renders the KRI page with enhanced styling
     * @param {Array<Object>} data - Array of KRI data
     * @returns {void}
     */
    render(data) {
        /** @type {HTMLElement | null} */
        const content = document.getElementById('kri-content');
        if (!content) {
            console.error('KRI content element not found');
            return;
        }
        
        // Handle empty data
        if (!data || data.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-info-circle" style="font-size: 3rem; color: #3498db; margin-bottom: 1rem;"></i>
                    <h4 style="color: #2c3e50; margin-bottom: 0.5rem;">Tidak Ada Data KRI</h4>
                    <p style="color: #7f8c8d;">Belum ada data Key Risk Indicator. Silakan tambah data KRI terlebih dahulu.</p>
                    <button class="btn btn-primary" onclick="KRI.showAddModal()" style="margin-top: 1rem;">
                        <i class="fas fa-plus-circle"></i> Tambah KRI
                    </button>
                </div>
            `;
            return;
        }
        
        // Store data for matrix chart
        this.currentData = data;
        
        // Add enhanced CSS styling - ONLY for KRI content, NOT page header
        const styleId = 'kri-enhanced-styles';
        if (!document.getElementById(styleId)) {
            /** @type {HTMLStyleElement} */
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                /* Enhanced KRI Styles - Only apply to KRI page */
                #kri .page-header {
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
                    color: inherit !important;
                    padding: 1.5rem !important;
                    margin-bottom: 2rem !important;
                    border-radius: 12px !important;
                    border-left: 4px solid var(--primary-red) !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                }
                
                /* Enhanced KRI Styles - Scoped to KRI content only */
                #kri-content .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    align-items: center;
                }
                
                #kri-content .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                
                #kri-content .chart-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                
                #kri-content .chart-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    color: #2c3e50;
                }
                
                #kri-content .table-container {
                    overflow-x: auto;
                    max-width: 100%;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                
                #kri-content .table td, #kri-content .table th {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 300px;
                    word-wrap: break-word;
                }
                
                #kri-content .badge-status {
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 0.875rem;
                    display: inline-block;
                }
                
                #kri-content .badge-status.badge-aman {
                    background-color: #28a745 !important;
                    color: #ffffff !important;
                }
                
                #kri-content .badge-status.badge-hati-hati {
                    background-color: #ffc107 !important;
                    color: #212529 !important;
                }
                
                #kri-content .badge-status.badge-kritis {
                    background-color: #dc3545 !important;
                    color: #ffffff !important;
                }
                
                /* Icon-only action buttons */
                #kri-content .btn-action {
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    margin: 0 3px;
                    border-radius: 6px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                }
                
                #kri-content .btn-action.btn-edit {
                    background-color: #17a2b8;
                    color: white;
                }
                
                #kri-content .btn-action.btn-delete {
                    background-color: #dc3545;
                    color: white;
                }
                
                #kri-content .btn-action:hover {
                    transform: scale(1.15);
                    box-shadow: 0 3px 8px rgba(0,0,0,0.25);
                }
                
                #kri-content .btn-action.btn-edit:hover {
                    background-color: #138496;
                }
                
                #kri-content .btn-action.btn-delete:hover {
                    background-color: #c82333;
                }
                
                #kri-content .action-cell {
                    white-space: nowrap;
                    text-align: center;
                }
                
                /* Status Matrix Styles */
                #kri-content .status-matrix {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    padding: 15px;
                }
                
                #kri-content .matrix-cell {
                    padding: 20px 15px;
                    border-radius: 10px;
                    text-align: center;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                }
                
                #kri-content .matrix-cell:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
                }
                
                #kri-content .matrix-cell.aman {
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                }
                
                #kri-content .matrix-cell.hati-hati {
                    background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
                    color: #212529;
                }
                
                #kri-content .matrix-cell.kritis {
                    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                    color: white;
                }
                
                #kri-content .matrix-count {
                    font-size: 2.5rem;
                    font-weight: 700;
                    line-height: 1;
                    margin-bottom: 8px;
                }
                
                #kri-content .matrix-label {
                    font-size: 0.9rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                #kri-content .matrix-percent {
                    font-size: 0.8rem;
                    opacity: 0.9;
                    margin-top: 5px;
                }
                
                #kri-content .matrix-icon {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    font-size: 1.2rem;
                    opacity: 0.7;
                }
                
                /* Notification animations */
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Calculate statistics - map "Peringatan" to "Hati-hati"
        const stats = {
            aman: data.filter(d => d.status_indikator === 'Aman').length,
            hati_hati: data.filter(d => d.status_indikator === 'Hati-hati' || d.status_indikator === 'Peringatan').length,
            kritis: data.filter(d => d.status_indikator === 'Kritis').length
        };
        
        // Calculate percentages
        const total = data.length;
        const percentAman = total > 0 ? ((stats.aman / total) * 100).toFixed(1) : 0;
        const percentHatiHati = total > 0 ? ((stats.hati_hati / total) * 100).toFixed(1) : 0;
        const percentKritis = total > 0 ? ((stats.kritis / total) * 100).toFixed(1) : 0;
        
        content.innerHTML = `
            <div class="charts-grid mb-3">
                <div class="chart-card">
                    <h4 class="chart-title"><i class="fas fa-chart-pie" style="margin-right: 8px; color: #3498db;"></i>Status KRI</h4>
                    <canvas id="kri-status-chart" style="max-height: 250px;"></canvas>
                </div>
                <div class="chart-card">
                    <h4 class="chart-title"><i class="fas fa-th-large" style="margin-right: 8px; color: #9b59b6;"></i>Matriks Status</h4>
                    <div class="status-matrix">
                        <div class="matrix-cell aman" onclick="KRI.filterByStatus('Aman')" title="Klik untuk filter">
                            <i class="fas fa-check-circle matrix-icon"></i>
                            <div class="matrix-count">${stats.aman}</div>
                            <div class="matrix-label">Aman</div>
                            <div class="matrix-percent">${percentAman}%</div>
                        </div>
                        <div class="matrix-cell hati-hati" onclick="KRI.filterByStatus('Hati-hati')" title="Klik untuk filter">
                            <i class="fas fa-exclamation-triangle matrix-icon"></i>
                            <div class="matrix-count">${stats.hati_hati}</div>
                            <div class="matrix-label">Hati-hati</div>
                            <div class="matrix-percent">${percentHatiHati}%</div>
                        </div>
                        <div class="matrix-cell kritis" onclick="KRI.filterByStatus('Kritis')" title="Klik untuk filter">
                            <i class="fas fa-times-circle matrix-icon"></i>
                            <div class="matrix-count">${stats.kritis}</div>
                            <div class="matrix-label">Kritis</div>
                            <div class="matrix-percent">${percentKritis}%</div>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 10px;">
                        <small style="color: #7f8c8d;">Total: ${total} indikator</small>
                        <button class="btn btn-sm btn-outline-secondary" onclick="KRI.clearFilter()" style="margin-left: 10px; font-size: 11px;">
                            <i class="fas fa-sync-alt"></i> Reset Filter
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Tombol-tombol di atas header tabel -->
            <div class="kri-action-bar">
                <button class="btn btn-warning" onclick="KRI.downloadTemplate()">
                    <i class="fas fa-download"></i> Unduh Template
                </button>
                <button class="btn btn-success" onclick="KRI.showImportModal()">
                    <i class="fas fa-upload"></i> Import Data
                </button>
                <button class="btn btn-primary" onclick="KRI.showAddModal()">
                    <i class="fas fa-plus"></i> Tambah KRI
                </button>
                <button class="btn btn-info" onclick="KRI.downloadReport()">
                    <i class="fas fa-file-pdf"></i> Unduh Laporan
                </button>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">KEY RISK INDICATOR</h3>
                </div>
                <div class="table-container">
                    <table class="table" id="kri-table">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Nama Indikator</th>
                                <th>Kategori</th>
                                <th>Nilai Aktual</th>
                                <th>Status</th>
                                <th style="width: 90px; text-align: center;">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.length === 0 ? '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>' : ''}
                            ${data.map(item => `
                                <tr data-status="${item.status_indikator === 'Peringatan' ? 'Hati-hati' : item.status_indikator}">
                                    <td>${item.kode}</td>
                                    <td>${item.nama_indikator}</td>
                                    <td>${item.master_risk_categories?.name || '-'}</td>
                                    <td>${item.nilai_aktual || '-'}</td>
                                    <td>
                                        <span class="badge-status badge-${
                                            item.status_indikator === 'Aman' ? 'aman' : 
                                            (item.status_indikator === 'Hati-hati' || item.status_indikator === 'Peringatan') ? 'hati-hati' : 'kritis'
                                        }">${item.status_indikator === 'Peringatan' ? 'Hati-hati' : item.status_indikator}</span>
                                    </td>
                                    <td class="action-cell">
                                        <button class="btn-action btn-edit" onclick="KRI.edit('${item.id}')" title="Edit">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-action btn-delete" onclick="KRI.confirmDelete('${item.id}', '${item.kode}')" title="Hapus">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Render chart
        setTimeout(() => this.renderChart(stats), 100);
    },

    renderChart(stats) {
        const ctx = document.getElementById('kri-status-chart');
        if (!ctx) {
            console.warn('Chart context element not found');
            return;
        }
        
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, showing fallback');
            // Show fallback stats
            const chartCard = ctx.closest('.chart-card');
            if (chartCard) {
                chartCard.innerHTML = `
                    <h4 class="chart-title">Status KRI</h4>
                    <div style="padding: 20px; text-align: center;">
                        <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
                            <div style="margin: 10px;">
                                <div style="font-size: 24px; font-weight: bold; color: #10b981;">${stats.aman}</div>
                                <div>Aman</div>
                            </div>
                            <div style="margin: 10px;">
                                <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${stats.hati_hati}</div>
                                <div>Hati-hati</div>
                            </div>
                            <div style="margin: 10px;">
                                <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${stats.kritis}</div>
                                <div>Kritis</div>
                            </div>
                        </div>
                    </div>
                `;
            }
            return;
        }
        
        try {
            // Destroy existing chart if any
            if (window.kriChartInstance) {
                window.kriChartInstance.destroy();
            }
            
            // Prepare data - ensure at least one value for chart
            const chartData = [
                Math.max(stats.aman, 0),
                Math.max(stats.hati_hati, 0),
                Math.max(stats.kritis, 0)
            ];
            
            // If all are zero, show a placeholder
            if (chartData[0] === 0 && chartData[1] === 0 && chartData[2] === 0) {
                chartData[0] = 1; // Show one slice for empty state
            }
            
            window.kriChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Aman', 'Hati-hati', 'Kritis'],
                    datasets: [{
                        data: chartData,
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 1,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    },
                    layout: {
                        padding: 10
                    }
                }
            });
        } catch (error) {
            console.error('Error creating KRI chart:', error);
        }
    },

    async showAddModal() {
        let kode = '';
        try {
            // Simple kode generation
            kode = `KRI-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
        } catch (error) {
            console.error('Error generating kode:', error);
        }
        await this.showModal(null, kode);
    },

    async showModal(id = null, kode = '') {
        console.log('[KRI] showModal called, id:', id, 'kode:', kode);
        
        // Helper to safely fetch data with fallback
        const safeApiCall = async (endpoint) => {
            // Strategy 1: Try apiCall
            if (typeof window.apiCall === 'function') {
                try {
                    return await window.apiCall(endpoint);
                } catch (e) {
                    console.warn('[KRI] apiCall failed for', endpoint, e.message);
                }
            }
            
            // Strategy 2: Try fetch with token
            try {
                const token = typeof window.getAuthToken === 'function' ? await window.getAuthToken() : null;
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;
                
                const response = await fetch(endpoint, { headers });
                if (response.ok) {
                    return await response.json();
                }
            } catch (e) {
                console.warn('[KRI] fetch failed for', endpoint, e.message);
            }
            
            return [];
        };
        
        let categories = [], risks = [], units = [];
        
        try {
            [categories, risks, units] = await Promise.all([
                safeApiCall('/api/master-data/categories'),
                safeApiCall('/api/risks'),
                safeApiCall('/api/master-data/work-units')
            ]);
        } catch (e) {
            console.warn('[KRI] Error loading dropdown data:', e.message);
        }
        
        // Ensure arrays
        categories = Array.isArray(categories) ? categories : [];
        risks = Array.isArray(risks) ? risks : [];
        units = Array.isArray(units) ? units : [];
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'kri-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Key Risk Indicator</h3>
                    <button type="button" class="modal-close" id="kri-modal-close">&times;</button>
                </div>
                <form id="kri-form-modal">
                    <div class="form-group">
                        <label class="form-label">Kode *</label>
                        <input type="text" class="form-control" id="kri-kode" required 
                               value="${kode}" ${kode ? 'readonly' : ''}>
                        <small style="color: var(--gray-500);">${kode ? 'Kode otomatis digenerate' : ''}</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nama Indikator *</label>
                        <input type="text" class="form-control" id="kri-nama" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Kategori Risiko</label>
                        <select class="form-control" id="kri-kategori">
                            <option value="">Pilih Kategori</option>
                            ${categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Risiko Terkait</label>
                        <select class="form-control" id="kri-risk">
                            <option value="">Pilih Risiko</option>
                            ${risks.map(r => `<option value="${r.id}">${r.kode_risiko || ''} - ${(r.sasaran || '').substring(0, 50)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Unit Kerja</label>
                        <select class="form-control" id="kri-unit">
                            <option value="">Pilih Unit Kerja</option>
                            ${units.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Metode Pengukuran</label>
                        <textarea class="form-control" id="kri-metode" rows="2"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Target Nilai</label>
                        <input type="number" class="form-control" id="kri-target" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nilai Aktual</label>
                        <input type="number" class="form-control" id="kri-aktual" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Batas Aman</label>
                        <input type="number" class="form-control" id="kri-batas-aman" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Batas Peringatan</label>
                        <input type="number" class="form-control" id="kri-batas-peringatan" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Batas Kritis</label>
                        <input type="number" class="form-control" id="kri-batas-kritis" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Periode Pengukuran</label>
                        <select class="form-control" id="kri-periode">
                            <option value="Harian">Harian</option>
                            <option value="Mingguan">Mingguan</option>
                            <option value="Bulanan">Bulanan</option>
                            <option value="Tahunan">Tahunan</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tanggal Pengukuran Terakhir</label>
                        <input type="date" class="form-control" id="kri-tanggal">
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" id="kri-modal-cancel">Batal</button>
                        <button type="submit" class="btn btn-primary">Simpan</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Store id for form submission
        modal.dataset.editId = id || '';
        
        // Add event listeners for close/cancel buttons
        const closeModal = () => {
            console.log('[KRI] Closing modal');
            if (modal && modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        };
        
        // Close button
        const closeBtn = modal.querySelector('#kri-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
            });
        }
        
        // Cancel button
        const cancelBtn = modal.querySelector('#kri-modal-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
            });
        }
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Form submit
        const form = modal.querySelector('#kri-form-modal');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const editId = modal.dataset.editId || '';
                this.save(e, editId);
            });
        }
        
        // Load data for edit
        if (id) {
            await this.loadForEdit(id);
        }
        
        console.log('[KRI] Modal opened successfully');
    },

    async save(e, id) {
        e.preventDefault();
        try {
            console.log('[KRI] save called, id:', id || 'new');
            
            const data = {
                kode: document.getElementById('kri-kode').value,
                nama_indikator: document.getElementById('kri-nama').value,
                kategori_risiko_id: document.getElementById('kri-kategori').value || null,
                risk_input_id: document.getElementById('kri-risk').value || null,
                unit_kerja_id: document.getElementById('kri-unit').value || null,
                metode_pengukuran: document.getElementById('kri-metode').value,
                target_nilai: parseFloat(document.getElementById('kri-target').value) || null,
                nilai_aktual: parseFloat(document.getElementById('kri-aktual').value) || null,
                batas_aman: parseFloat(document.getElementById('kri-batas-aman').value) || null,
                batas_peringatan: parseFloat(document.getElementById('kri-batas-peringatan').value) || null,
                batas_kritis: parseFloat(document.getElementById('kri-batas-kritis').value) || null,
                periode_pengukuran: document.getElementById('kri-periode').value,
                tanggal_pengukuran_terakhir: document.getElementById('kri-tanggal').value || null
            };
            
            console.log('[KRI] Saving data:', data);
            
            // Helper function to make API call with fallback
            const makeApiCall = async (endpoint, method, body = null) => {
                let lastError = null;
                
                // Strategy 1: Try apiCall
                if (typeof window.apiCall === 'function') {
                    try {
                        console.log('[KRI] Trying apiCall for save...');
                        return await window.apiCall(endpoint, { method, body });
                    } catch (apiError) {
                        console.warn('[KRI] apiCall save failed:', apiError.message);
                        lastError = apiError;
                    }
                }
                
                // Strategy 2: Try fetch with token
                try {
                    console.log('[KRI] Trying fetch with token for save...');
                    const token = typeof window.getAuthToken === 'function' ? await window.getAuthToken() : null;
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    
                    const options = { method, headers };
                    if (body) options.body = JSON.stringify(body);
                    
                    const response = await fetch(endpoint, options);
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || `HTTP ${response.status}`);
                    }
                    return await response.json();
                } catch (fetchError) {
                    console.warn('[KRI] Fetch save failed:', fetchError.message);
                    throw lastError || fetchError;
                }
            };
            
            if (id) {
                await makeApiCall(`/api/kri/${id}`, 'PUT', data);
                this.showNotification('KRI berhasil diupdate', 'success');
            } else {
                await makeApiCall('/api/kri', 'POST', data);
                this.showNotification('KRI berhasil disimpan', 'success');
            }
            
            // Close modal
            const modal = document.querySelector('.modal');
            if (modal) modal.remove();
            
            await this.load();
        } catch (error) {
            console.error('[KRI] save error:', error);
            this.showNotification('Error: ' + error.message, 'error');
        }
    },

    async delete(id) {
        if (!confirm('Yakin ingin menghapus?')) return;
        try {
            console.log('[KRI] delete called for ID:', id);
            
            let success = false;
            let lastError = null;
            
            // Strategy 1: Try with apiCall
            if (typeof window.apiCall === 'function') {
                try {
                    await window.apiCall(`/api/kri/${id}`, { method: 'DELETE' });
                    success = true;
                } catch (apiError) {
                    console.warn('[KRI] apiCall delete failed:', apiError.message);
                    lastError = apiError;
                }
            }
            
            // Strategy 2: Try with fetch + token
            if (!success) {
                try {
                    const token = typeof window.getAuthToken === 'function' ? await window.getAuthToken() : null;
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    
                    const response = await fetch(`/api/kri/${id}`, { method: 'DELETE', headers });
                    if (response.ok) {
                        success = true;
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        lastError = new Error(errorData.error || `HTTP ${response.status}`);
                    }
                } catch (fetchError) {
                    lastError = fetchError;
                }
            }
            
            if (!success) {
                throw lastError || new Error('Gagal menghapus data');
            }
            
            await this.load();
            this.showNotification('Data berhasil dihapus', 'success');
        } catch (error) {
            console.error('[KRI] delete error:', error);
            this.showNotification('Error: ' + error.message, 'error');
        }
    },

    // Enhanced delete with confirmation modal
    confirmDelete(id, kode) {
        console.log('[KRI] confirmDelete called for:', id, kode);
        
        // Remove existing modal if any
        const existingModal = document.getElementById('delete-confirm-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'delete-confirm-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <div style="padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc3545; margin-bottom: 15px;"></i>
                    <h4 style="margin-bottom: 10px; color: #2c3e50;">Konfirmasi Hapus</h4>
                    <p style="color: #7f8c8d; margin-bottom: 20px;">
                        Apakah Anda yakin ingin menghapus KRI <strong>${kode}</strong>?<br>
                        <small>Tindakan ini tidak dapat dibatalkan.</small>
                    </p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button type="button" class="btn btn-secondary" id="delete-cancel-btn">
                            <i class="fas fa-times"></i> Batal
                        </button>
                        <button type="button" class="btn btn-danger" id="delete-confirm-btn">
                            <i class="fas fa-trash"></i> Ya, Hapus
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close modal function
        const closeModal = () => {
            if (modal && modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        };
        
        // Cancel button
        const cancelBtn = modal.querySelector('#delete-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
            });
        }
        
        // Confirm button
        const confirmBtn = modal.querySelector('#delete-confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.executeDelete(id);
            });
        }
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    },

    async executeDelete(id) {
        try {
            console.log('[KRI] executeDelete called for ID:', id);
            
            const modal = document.getElementById('delete-confirm-modal');
            if (modal) modal.remove();
            
            let success = false;
            let lastError = null;
            
            // Strategy 1: Try with apiCall (authenticated)
            if (typeof window.apiCall === 'function') {
                try {
                    console.log('[KRI] Trying apiCall for delete...');
                    await window.apiCall(`/api/kri/${id}`, { method: 'DELETE' });
                    success = true;
                    console.log('[KRI] apiCall delete success');
                } catch (apiError) {
                    console.warn('[KRI] apiCall delete failed:', apiError.message);
                    lastError = apiError;
                }
            }
            
            // Strategy 2: Try with fetch + auth token
            if (!success) {
                try {
                    console.log('[KRI] Trying fetch with auth token for delete...');
                    const token = typeof window.getAuthToken === 'function' ? await window.getAuthToken() : null;
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    
                    const response = await fetch(`/api/kri/${id}`, { 
                        method: 'DELETE',
                        headers 
                    });
                    
                    if (response.ok) {
                        success = true;
                        console.log('[KRI] Fetch delete success');
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        lastError = new Error(errorData.error || `HTTP ${response.status}`);
                        console.warn('[KRI] Fetch delete failed:', lastError.message);
                    }
                } catch (fetchError) {
                    console.warn('[KRI] Fetch delete error:', fetchError.message);
                    lastError = fetchError;
                }
            }
            
            if (!success) {
                throw lastError || new Error('Gagal menghapus data');
            }
            
            // Show success notification
            this.showNotification('Data KRI berhasil dihapus', 'success');
            await this.load();
        } catch (error) {
            console.error('[KRI] executeDelete error:', error);
            this.showNotification('Error: ' + error.message, 'error');
        }
    },

    // Filter by status
    filterByStatus(status) {
        const table = document.getElementById('kri-table');
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const rowStatus = row.getAttribute('data-status');
            if (status === 'all' || rowStatus === status) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
        
        // Highlight active matrix cell
        document.querySelectorAll('.matrix-cell').forEach(cell => {
            cell.style.opacity = '0.5';
            cell.style.transform = 'scale(0.95)';
        });
        
        const activeCell = document.querySelector(`.matrix-cell.${status.toLowerCase().replace('-', '-')}`);
        if (activeCell) {
            activeCell.style.opacity = '1';
            activeCell.style.transform = 'scale(1.05)';
        }
        
        this.showNotification(`Menampilkan ${status} saja`, 'info');
    },

    // Clear filter
    clearFilter() {
        const table = document.getElementById('kri-table');
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            row.style.display = '';
        });
        
        // Reset matrix cells
        document.querySelectorAll('.matrix-cell').forEach(cell => {
            cell.style.opacity = '1';
            cell.style.transform = 'scale(1)';
        });
        
        this.showNotification('Filter direset', 'info');
    },

    // Show notification
    showNotification(message, type = 'info') {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        
        const icons = {
            success: 'check-circle',
            error: 'times-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `
            <i class="fas fa-${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    async edit(id) {
        try {
            console.log('[KRI] Edit called for ID:', id);
            
            // Show loading
            this.showNotification('Memuat data...', 'info');
            
            let item = null;
            let lastError = null;
            
            // Strategy 1: Try with apiCall (authenticated)
            if (typeof window.apiCall === 'function') {
                try {
                    console.log('[KRI] Trying apiCall for edit...');
                    item = await window.apiCall(`/api/kri/${id}`);
                    console.log('[KRI] apiCall success:', item);
                } catch (apiError) {
                    console.warn('[KRI] apiCall failed:', apiError.message);
                    lastError = apiError;
                }
            }
            
            // Strategy 2: Try with fetch + auth token
            if (!item) {
                try {
                    console.log('[KRI] Trying fetch with auth token...');
                    const token = typeof window.getAuthToken === 'function' ? await window.getAuthToken() : null;
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    
                    const response = await fetch(`/api/kri/${id}`, { headers });
                    if (response.ok) {
                        item = await response.json();
                        console.log('[KRI] Fetch with token success:', item);
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        lastError = new Error(errorData.error || `HTTP ${response.status}`);
                        console.warn('[KRI] Fetch with token failed:', lastError.message);
                    }
                } catch (fetchError) {
                    console.warn('[KRI] Fetch with token error:', fetchError.message);
                    lastError = fetchError;
                }
            }
            
            // Strategy 3: Try by-id endpoint (no auth)
            if (!item) {
                try {
                    console.log('[KRI] Trying by-id endpoint...');
                    const response = await fetch(`/api/kri/by-id/${id}`);
                    if (response.ok) {
                        item = await response.json();
                        console.log('[KRI] by-id endpoint success:', item);
                    }
                } catch (byIdError) {
                    console.warn('[KRI] by-id endpoint failed:', byIdError.message);
                }
            }
            
            // Strategy 4: Try public/simple endpoint (no auth)
            if (!item) {
                try {
                    console.log('[KRI] Trying simple endpoint...');
                    const response = await fetch(`/api/kri/simple`);
                    if (response.ok) {
                        const allData = await response.json();
                        item = allData.find(d => d.id === id);
                        if (item) {
                            console.log('[KRI] Found item in simple endpoint:', item);
                        }
                    }
                } catch (simpleError) {
                    console.warn('[KRI] Simple endpoint failed:', simpleError.message);
                }
            }
            
            if (!item) {
                throw lastError || new Error('Data tidak ditemukan');
            }
            
            // Open modal with data
            await this.showModal(id, item.kode);
        } catch (error) {
            console.error('[KRI] Error loading data for edit:', error);
            this.showNotification('Error: ' + error.message, 'error');
        }
    },

    async loadForEdit(id) {
        try {
            console.log('[KRI] loadForEdit called for ID:', id);
            
            let data = null;
            
            // Strategy 1: Try apiCall
            if (typeof window.apiCall === 'function') {
                try {
                    data = await window.apiCall(`/api/kri/${id}`);
                    console.log('[KRI] loadForEdit apiCall success');
                } catch (e) {
                    console.warn('[KRI] loadForEdit apiCall failed:', e.message);
                }
            }
            
            // Strategy 2: Try fetch with token
            if (!data) {
                try {
                    const token = typeof window.getAuthToken === 'function' ? await window.getAuthToken() : null;
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    
                    const response = await fetch(`/api/kri/${id}`, { headers });
                    if (response.ok) {
                        data = await response.json();
                        console.log('[KRI] loadForEdit fetch success');
                    }
                } catch (e) {
                    console.warn('[KRI] loadForEdit fetch failed:', e.message);
                }
            }
            
            // Strategy 3: Try by-id endpoint (no auth)
            if (!data) {
                try {
                    console.log('[KRI] Trying by-id endpoint...');
                    const response = await fetch(`/api/kri/by-id/${id}`);
                    if (response.ok) {
                        data = await response.json();
                        console.log('[KRI] loadForEdit by-id success');
                    }
                } catch (e) {
                    console.warn('[KRI] loadForEdit by-id failed:', e.message);
                }
            }
            
            // Strategy 4: Try simple endpoint
            if (!data) {
                try {
                    const response = await fetch(`/api/kri/simple`);
                    if (response.ok) {
                        const allData = await response.json();
                        data = allData.find(d => d.id === id);
                        if (data) console.log('[KRI] loadForEdit found in simple endpoint');
                    }
                } catch (e) {
                    console.warn('[KRI] loadForEdit simple failed:', e.message);
                }
            }
            
            if (!data) {
                throw new Error('Data tidak ditemukan');
            }
            
            // Populate form fields
            const setFieldValue = (fieldId, value) => {
                const field = document.getElementById(fieldId);
                if (field) field.value = value || '';
            };
            
            setFieldValue('kri-kode', data.kode);
            setFieldValue('kri-nama', data.nama_indikator);
            setFieldValue('kri-kategori', data.kategori_risiko_id);
            setFieldValue('kri-risk', data.risk_input_id);
            setFieldValue('kri-unit', data.unit_kerja_id);
            setFieldValue('kri-metode', data.metode_pengukuran);
            setFieldValue('kri-target', data.target_nilai);
            setFieldValue('kri-aktual', data.nilai_aktual);
            setFieldValue('kri-batas-aman', data.batas_aman);
            setFieldValue('kri-batas-peringatan', data.batas_peringatan);
            setFieldValue('kri-batas-kritis', data.batas_kritis);
            setFieldValue('kri-periode', data.periode_pengukuran || 'Bulanan');
            setFieldValue('kri-tanggal', data.tanggal_pengukuran_terakhir);
            
            console.log('[KRI] Form populated successfully');
        } catch (error) {
            console.error('[KRI] loadForEdit error:', error);
            this.showNotification('Error loading data: ' + error.message, 'error');
        }
    },

    async downloadTemplate() { alert('Fitur unduh template akan diimplementasikan'); },
    showImportModal() { alert('Fitur import akan diimplementasikan'); },
    async downloadReport() { alert('Fitur unduh laporan akan diimplementasikan'); }
};

// Make KRI available globally for onclick handlers
window.KRI = KRI;
window.kriModule = KRI;

