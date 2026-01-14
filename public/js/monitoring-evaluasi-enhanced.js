/**
 * Monitoring Evaluasi Enhanced Module
 * - Fixed edit and delete buttons
 * - Bright solid colors for status and progress columns
 * - Scrollable table
 */

const MonitoringEvaluasiEnhanced = {
    currentData: [],
    
    async load() {
        try {
            console.log('=== LOADING MONITORING EVALUASI ENHANCED ===');
            const content = document.getElementById('monitoring-evaluasi-content');
            if (!content) {
                console.error('Content container not found');
                return;
            }
            
            // Show loading
            content.innerHTML = `
                <div class="card">
                    <div class="card-body text-center py-5">
                        <div class="loading-spinner mx-auto mb-3"></div>
                        <p>Memuat data...</p>
                    </div>
                </div>
            `;
            
            let data = [];
            
            // Try multiple endpoints
            const endpoints = [
                '/api/monitoring-evaluasi',
                '/api/monitoring-evaluasi/test',
                '/api/monitoring-evaluasi/simple'
            ];

            for (const endpoint of endpoints) {
                try {
                    data = await apiCall(endpoint);
                    console.log(`Success from ${endpoint}:`, data?.length || 0);
                    break;
                } catch (err) {
                    console.warn(`Failed ${endpoint}:`, err.message);
                }
            }
            
            this.currentData = data || [];
            this.render(data);
        } catch (error) {
            console.error('Error loading monitoring evaluasi:', error);
            this.showError(error.message);
        }
    },
    
    showError(message) {
        const content = document.getElementById('monitoring-evaluasi-content');
        if (content) {
            content.innerHTML = `
                <div class="card">
                    <div class="card-body text-center py-5">
                        <i class="fas fa-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
                        <h5 class="mt-3 text-danger">Error memuat data</h5>
                        <p class="text-muted">${message}</p>
                        <button onclick="MonitoringEvaluasiEnhanced.load()" class="btn btn-primary mt-2">
                            <i class="fas fa-sync-alt"></i> Coba Lagi
                        </button>
                    </div>
                </div>
            `;
        }
    },
    
    getStatusBadge(status) {
        const statusLower = (status || '').toLowerCase();
        let badgeClass = 'status-default';
        
        if (statusLower.includes('stabil')) badgeClass = 'status-stabil';
        else if (statusLower.includes('meningkat')) badgeClass = 'status-meningkat';
        else if (statusLower.includes('menurun')) badgeClass = 'status-menurun';
        
        return `<span class="status-badge ${badgeClass}">${status || '-'}</span>`;
    },

    getProgressBadge(progress) {
        const value = parseInt(progress) || 0;
        let badgeClass = 'progress-low';
        
        if (value >= 100) badgeClass = 'progress-complete';
        else if (value >= 75) badgeClass = 'progress-high';
        else if (value >= 50) badgeClass = 'progress-medium';
        else if (value >= 25) badgeClass = 'progress-medium';
        
        return `
            <span class="progress-badge ${badgeClass}">
                <div class="progress-bar-mini">
                    <div class="fill" style="width: ${Math.min(value, 100)}%"></div>
                </div>
                <span>${value}%</span>
            </span>
        `;
    },
    
    render(data) {
        const content = document.getElementById('monitoring-evaluasi-content');
        if (!content) return;
        
        // Calculate stats
        const stats = {
            total: data.length,
            completed: data.filter(d => (d.progress_mitigasi || 0) >= 100).length,
            inProgress: data.filter(d => (d.progress_mitigasi || 0) > 0 && (d.progress_mitigasi || 0) < 100).length,
            notStarted: data.filter(d => !d.progress_mitigasi || d.progress_mitigasi === 0).length
        };
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <h3 class="card-title" style="margin: 0;">
                        <i class="fas fa-tasks"></i> Monitoring & Evaluasi Risiko
                    </h3>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-warning btn-sm" onclick="MonitoringEvaluasiEnhanced.downloadTemplate()">
                            <i class="fas fa-download"></i> Template
                        </button>
                        <button class="btn btn-success btn-sm" onclick="MonitoringEvaluasiEnhanced.showImportModal()">
                            <i class="fas fa-upload"></i> Import
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="MonitoringEvaluasiEnhanced.showAddModal()">
                            <i class="fas fa-plus"></i> Tambah
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Stats -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                        <div style="background: #10B981; color: #fff; padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold;">${stats.total}</div>
                            <div style="font-size: 0.75rem;">Total</div>
                        </div>
                        <div style="background: #3B82F6; color: #fff; padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold;">${stats.completed}</div>
                            <div style="font-size: 0.75rem;">Selesai</div>
                        </div>
                        <div style="background: #F59E0B; color: #fff; padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold;">${stats.inProgress}</div>
                            <div style="font-size: 0.75rem;">Proses</div>
                        </div>
                        <div style="background: #EF4444; color: #fff; padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold;">${stats.notStarted}</div>
                            <div style="font-size: 0.75rem;">Belum Mulai</div>
                        </div>
                    </div>
                    
                    <!-- Scrollable Table -->
                    <div class="monitoring-table-container">
                        <table class="monitoring-table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Kode Risiko</th>
                                    <th>Status Risiko</th>
                                    <th>Nilai</th>
                                    <th>Progress Mitigasi</th>
                                    <th>Evaluasi</th>
                                    <th style="text-align: center;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.length === 0 ? `
                                    <tr>
                                        <td colspan="7" style="text-align: center; padding: 2rem;">
                                            <i class="fas fa-inbox" style="font-size: 2rem; color: #9ca3af;"></i>
                                            <p style="margin-top: 0.5rem; color: #6b7280;">Tidak ada data</p>
                                        </td>
                                    </tr>
                                ` : data.map(item => this.renderRow(item)).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderRow(item) {
        const evaluasi = item.evaluasi || '-';
        const shortEvaluasi = evaluasi.length > 50 ? evaluasi.substring(0, 50) + '...' : evaluasi;
        
        return `
            <tr data-id="${item.id}">
                <td>${item.tanggal_monitoring || '-'}</td>
                <td><strong>${item.risk_inputs?.kode_risiko || '-'}</strong></td>
                <td>${this.getStatusBadge(item.status_risiko)}</td>
                <td style="text-align: center;">${item.nilai_risiko || '-'}</td>
                <td>${this.getProgressBadge(item.progress_mitigasi)}</td>
                <td class="evaluasi-cell" title="${evaluasi}">${shortEvaluasi}</td>
                <td>
                    <div class="action-btn-group">
                        <button class="btn-action btn-edit" onclick="MonitoringEvaluasiEnhanced.edit('${item.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="MonitoringEvaluasiEnhanced.confirmDelete('${item.id}')" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },
    
    showAddModal() {
        this.showModal(null);
    },
    
    async edit(id) {
        console.log('Edit clicked for ID:', id);
        await this.showModal(id);
    },
    
    async showModal(id = null) {
        // Remove existing modal
        const existingModal = document.querySelector('.monitoring-modal');
        if (existingModal) existingModal.remove();
        
        // Get risks for dropdown
        let risks = [];
        try {
            risks = await apiCall('/api/risks');
        } catch (err) {
            console.warn('Could not load risks:', err.message);
        }
        
        const modal = document.createElement('div');
        modal.className = 'monitoring-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Monitoring & Evaluasi</h3>
                    <button class="modal-close" onclick="MonitoringEvaluasiEnhanced.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="monitoring-form-enhanced">
                        <input type="hidden" id="me-id" value="${id || ''}">
                        
                        <div class="form-group">
                            <label class="form-label">Risiko *</label>
                            <select class="form-control" id="me-risk" required>
                                <option value="">Pilih Risiko</option>
                                ${risks.map(r => `<option value="${r.id}">${r.kode_risiko} - ${(r.sasaran || '').substring(0, 40)}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Tanggal Monitoring *</label>
                                <input type="date" class="form-control" id="me-tanggal" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status Risiko</label>
                                <select class="form-control" id="me-status">
                                    <option value="Stabil">Stabil</option>
                                    <option value="Meningkat">Meningkat</option>
                                    <option value="Menurun">Menurun</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Probabilitas (1-5)</label>
                                <input type="number" class="form-control" id="me-probabilitas" min="1" max="5">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Dampak (1-5)</label>
                                <input type="number" class="form-control" id="me-dampak" min="1" max="5">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Nilai Risiko</label>
                                <input type="number" class="form-control" id="me-nilai" min="1" max="25">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Progress Mitigasi (%)</label>
                                <input type="number" class="form-control" id="me-progress" min="0" max="100" value="0">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Tindakan Mitigasi</label>
                            <textarea class="form-control" id="me-tindakan" rows="2"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Evaluasi</label>
                            <textarea class="form-control" id="me-evaluasi" rows="2"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Status Data</label>
                            <select class="form-control" id="me-status-data">
                                <option value="Aktif">Aktif</option>
                                <option value="Tutup">Tutup</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="MonitoringEvaluasiEnhanced.closeModal()">Batal</button>
                    <button type="button" class="btn btn-primary" onclick="MonitoringEvaluasiEnhanced.save()">
                        <i class="fas fa-save"></i> Simpan
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
        
        // Load data if editing
        if (id) {
            await this.loadForEdit(id);
        } else {
            // Set default date to today
            document.getElementById('me-tanggal').value = new Date().toISOString().split('T')[0];
        }
    },

    async loadForEdit(id) {
        try {
            console.log('Loading data for edit, ID:', id);
            const data = await apiCall(`/api/monitoring-evaluasi/${id}`);
            console.log('Loaded data:', data);
            
            if (data) {
                document.getElementById('me-risk').value = data.risk_input_id || '';
                document.getElementById('me-tanggal').value = data.tanggal_monitoring || '';
                document.getElementById('me-status').value = data.status_risiko || 'Stabil';
                document.getElementById('me-probabilitas').value = data.tingkat_probabilitas || '';
                document.getElementById('me-dampak').value = data.tingkat_dampak || '';
                document.getElementById('me-nilai').value = data.nilai_risiko || '';
                document.getElementById('me-tindakan').value = data.tindakan_mitigasi || '';
                document.getElementById('me-progress').value = data.progress_mitigasi || 0;
                document.getElementById('me-evaluasi').value = data.evaluasi || '';
                document.getElementById('me-status-data').value = data.status || 'Aktif';
            }
        } catch (error) {
            console.error('Error loading data for edit:', error);
            alert('Gagal memuat data: ' + error.message);
        }
    },
    
    closeModal() {
        const modal = document.querySelector('.monitoring-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    async save() {
        const id = document.getElementById('me-id').value;
        const riskId = document.getElementById('me-risk').value;
        const tanggal = document.getElementById('me-tanggal').value;
        
        if (!riskId) {
            alert('Pilih risiko terlebih dahulu!');
            return;
        }
        
        if (!tanggal) {
            alert('Tanggal monitoring harus diisi!');
            return;
        }
        
        const data = {
            risk_input_id: riskId,
            tanggal_monitoring: tanggal,
            status_risiko: document.getElementById('me-status').value,
            tingkat_probabilitas: parseInt(document.getElementById('me-probabilitas').value) || null,
            tingkat_dampak: parseInt(document.getElementById('me-dampak').value) || null,
            nilai_risiko: parseInt(document.getElementById('me-nilai').value) || null,
            tindakan_mitigasi: document.getElementById('me-tindakan').value,
            progress_mitigasi: parseInt(document.getElementById('me-progress').value) || 0,
            evaluasi: document.getElementById('me-evaluasi').value,
            status: document.getElementById('me-status-data').value
        };
        
        try {
            if (id) {
                await apiCall(`/api/monitoring-evaluasi/${id}`, { method: 'PUT', body: data });
                alert('Data berhasil diupdate!');
            } else {
                await apiCall('/api/monitoring-evaluasi', { method: 'POST', body: data });
                alert('Data berhasil ditambahkan!');
            }
            
            this.closeModal();
            await this.load();
        } catch (error) {
            console.error('Save error:', error);
            alert('Gagal menyimpan: ' + error.message);
        }
    },
    
    confirmDelete(id) {
        if (confirm('Yakin ingin menghapus data ini?')) {
            this.delete(id);
        }
    },
    
    async delete(id) {
        try {
            await apiCall(`/api/monitoring-evaluasi/${id}`, { method: 'DELETE' });
            alert('Data berhasil dihapus!');
            await this.load();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Gagal menghapus: ' + error.message);
        }
    },
    
    downloadTemplate() {
        try {
            if (typeof XLSX === 'undefined') {
                alert('Library XLSX tidak tersedia. Silakan refresh halaman.');
                return;
            }
            
            const templateData = [
                ['Kode Risiko', 'Tanggal Monitoring', 'Status Risiko', 'Probabilitas', 'Dampak', 'Nilai Risiko', 'Tindakan Mitigasi', 'Progress (%)', 'Evaluasi', 'Status'],
                ['RSK-001', '2025-01-01', 'Stabil', '3', '4', '12', 'Implementasi kontrol', '75', 'Progress baik', 'Aktif'],
                ['RSK-002', '2025-01-02', 'Meningkat', '4', '3', '12', 'Pelatihan staff', '50', 'Perlu perhatian', 'Aktif']
            ];
            
            const ws = XLSX.utils.aoa_to_sheet(templateData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Template');
            XLSX.writeFile(wb, 'template_monitoring_evaluasi.xlsx');
            
            alert('Template berhasil diunduh!');
        } catch (error) {
            console.error('Download template error:', error);
            alert('Gagal mengunduh template: ' + error.message);
        }
    },
    
    showImportModal() {
        const existingModal = document.querySelector('.monitoring-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'monitoring-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 class="modal-title">Import Data</h3>
                    <button class="modal-close" onclick="MonitoringEvaluasiEnhanced.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Pilih File Excel (.xlsx)</label>
                        <input type="file" class="form-control" id="import-file-me" accept=".xlsx,.xls">
                    </div>
                    <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                        <p style="margin: 0; font-size: 0.875rem; color: #0369a1;">
                            <i class="fas fa-info-circle"></i> Unduh template terlebih dahulu untuk format yang benar.
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="MonitoringEvaluasiEnhanced.closeModal()">Batal</button>
                    <button type="button" class="btn btn-primary" onclick="MonitoringEvaluasiEnhanced.processImport()">
                        <i class="fas fa-upload"></i> Import
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('active'));
    },
    
    async processImport() {
        const fileInput = document.getElementById('import-file-me');
        if (!fileInput.files[0]) {
            alert('Pilih file terlebih dahulu!');
            return;
        }
        
        alert('Fitur import sedang dalam pengembangan.');
        this.closeModal();
    }
};

// Auto-initialize when DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on monitoring-evaluasi page
    if (window.location.hash === '#monitoring-evaluasi' || 
        document.getElementById('monitoring-evaluasi-content')) {
        // Load CSS if not already loaded
        if (!document.querySelector('link[href*="monitoring-evaluasi-enhanced.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/css/monitoring-evaluasi-enhanced.css';
            document.head.appendChild(link);
        }
    }
});

// Make globally available
window.MonitoringEvaluasiEnhanced = MonitoringEvaluasiEnhanced;
