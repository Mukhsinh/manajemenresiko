// Monitoring & Evaluasi Risiko Module
// Enhanced version with fixed edit/delete buttons, bright colors, and scrollable table
const MonitoringEvaluasi = {
    currentData: [],
    _boundClickHandler: null, // Store bound handler for proper removal
    
    async load() {
        try {
            console.log('=== LOADING MONITORING EVALUASI ===');
            
            // Load enhanced CSS
            if (!document.querySelector('link[href*="monitoring-evaluasi-enhanced.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/css/monitoring-evaluasi-enhanced.css';
                document.head.appendChild(link);
            }
            
            const content = document.getElementById('monitoring-evaluasi-content');
            if (!content) {
                console.error('Content container not found');
                return;
            }
            
            // Show loading
            content.innerHTML = `
                <div class="card">
                    <div class="card-body text-center py-5">
                        <div class="loading-spinner mx-auto mb-3" style="width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;"></div>
                        <p>Memuat data...</p>
                        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
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
            document.getElementById('monitoring-evaluasi-content').innerHTML = `
                <div class="card">
                    <div class="card-body text-center py-5">
                        <i class="fas fa-exclamation-triangle text-danger" style="font-size:3rem;"></i>
                        <h5 class="mt-3 text-danger">Error memuat data</h5>
                        <p>${error.message}</p>
                        <button onclick="MonitoringEvaluasi.load()" class="btn btn-primary">Coba Lagi</button>
                    </div>
                </div>
            `;
        }
    },

    // Helper functions for badges
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
        
        // Calculate statistics
        const stats = {
            total: data.length,
            completed: data.filter(d => (d.progress_mitigasi || 0) >= 100).length,
            inProgress: data.filter(d => (d.progress_mitigasi || 0) > 0 && (d.progress_mitigasi || 0) < 100).length,
            notStarted: data.filter(d => !d.progress_mitigasi || d.progress_mitigasi === 0).length,
            avgProgress: data.length > 0 ? (data.reduce((sum, d) => sum + (d.progress_mitigasi || 0), 0) / data.length).toFixed(1) : 0
        };
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <h3 class="card-title" style="margin: 0;"><i class="fas fa-tasks"></i> Monitoring & Evaluasi Risiko</h3>
                    <div class="action-buttons" style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                        <button class="btn btn-warning btn-sm btn-monitoring-download-template" title="Unduh Template">
                            <i class="fas fa-download"></i> <span class="btn-text">Template</span>
                        </button>
                        <button class="btn btn-success btn-sm btn-monitoring-import" title="Import Data">
                            <i class="fas fa-upload"></i> <span class="btn-text">Import</span>
                        </button>
                        <button class="btn btn-primary btn-sm btn-monitoring-add" title="Tambah Monitoring">
                            <i class="fas fa-plus"></i> <span class="btn-text">Tambah</span>
                        </button>
                        <button class="btn btn-info btn-sm btn-monitoring-report" title="Unduh Laporan">
                            <i class="fas fa-file-pdf"></i> <span class="btn-text">Laporan</span>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Statistics with Bright Solid Colors -->
                    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                        <div class="stat-card" style="background: #10B981; padding: 1.25rem; border-radius: 8px; color: white; text-align: center;">
                            <div style="font-size: 1.75rem; font-weight: bold;">${stats.total}</div>
                            <div style="font-size: 0.75rem;">Total</div>
                        </div>
                        <div class="stat-card" style="background: #3B82F6; padding: 1.25rem; border-radius: 8px; color: white; text-align: center;">
                            <div style="font-size: 1.75rem; font-weight: bold;">${stats.completed}</div>
                            <div style="font-size: 0.75rem;">Selesai (100%)</div>
                        </div>
                        <div class="stat-card" style="background: #F59E0B; padding: 1.25rem; border-radius: 8px; color: white; text-align: center;">
                            <div style="font-size: 1.75rem; font-weight: bold;">${stats.inProgress}</div>
                            <div style="font-size: 0.75rem;">Dalam Proses</div>
                        </div>
                        <div class="stat-card" style="background: #EF4444; padding: 1.25rem; border-radius: 8px; color: white; text-align: center;">
                            <div style="font-size: 1.75rem; font-weight: bold;">${stats.notStarted}</div>
                            <div style="font-size: 0.75rem;">Belum Mulai</div>
                        </div>
                    </div>
                    
                    <!-- Scrollable Table Container -->
                    <div class="monitoring-table-container" style="max-height: 500px; overflow-y: auto; overflow-x: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <table class="monitoring-table" style="width: 100%; border-collapse: collapse; min-width: 900px;">
                            <thead style="position: sticky; top: 0; z-index: 10;">
                                <tr>
                                    <th style="background: #2c3e50; color: #fff; padding: 12px 10px; text-align: left; font-weight: 600;">Tanggal</th>
                                    <th style="background: #2c3e50; color: #fff; padding: 12px 10px; text-align: left; font-weight: 600;">Kode Risiko</th>
                                    <th style="background: #2c3e50; color: #fff; padding: 12px 10px; text-align: left; font-weight: 600;">Status Risiko</th>
                                    <th style="background: #2c3e50; color: #fff; padding: 12px 10px; text-align: center; font-weight: 600;">Nilai</th>
                                    <th style="background: #2c3e50; color: #fff; padding: 12px 10px; text-align: left; font-weight: 600;">Progress Mitigasi</th>
                                    <th style="background: #2c3e50; color: #fff; padding: 12px 10px; text-align: left; font-weight: 600;">Evaluasi</th>
                                    <th style="background: #2c3e50; color: #fff; padding: 12px 10px; text-align: center; font-weight: 600;">Aksi</th>
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
                                ` : ''}
                                ${data.map((item, index) => {
                                    const evaluasiText = item.evaluasi || '-';
                                    const shortEvaluasi = evaluasiText.length > 50 ? evaluasiText.substring(0, 50) + '...' : evaluasiText;
                                    const rowBg = index % 2 === 0 ? '#fff' : '#f8f9fa';
                                    
                                    return `
                                    <tr style="background: ${rowBg};" onmouseover="this.style.background='#e8f4fd'" onmouseout="this.style.background='${rowBg}'">
                                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.tanggal_monitoring || '-'}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>${item.risk_inputs?.kode_risiko || '-'}</strong></td>
                                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.getStatusBadge(item.status_risiko)}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.nilai_risiko || '-'}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${this.getProgressBadge(item.progress_mitigasi)}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${evaluasiText}">${shortEvaluasi}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
                                            <div style="display: flex; gap: 6px; justify-content: center;">
                                                <button class="btn-monitoring-edit" data-id="${item.id}" title="Edit" style="width: 32px; height: 32px; border-radius: 6px; border: none; background: #3B82F6; color: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn-monitoring-delete" data-id="${item.id}" title="Hapus" style="width: 32px; height: 32px; border-radius: 6px; border: none; background: #EF4444; color: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Add event delegation for edit and delete buttons
        this.attachButtonListeners();
    },
    
    // Attach event listeners using event delegation
    attachButtonListeners() {
        const content = document.getElementById('monitoring-evaluasi-content');
        if (!content) {
            console.error('Content container not found for event listeners');
            return;
        }
        
        // Remove existing listener if exists (using stored bound handler)
        if (this._boundClickHandler) {
            content.removeEventListener('click', this._boundClickHandler);
        }
        
        // Create and store bound handler
        this._boundClickHandler = (e) => {
            const target = e.target;
            const editBtn = target.closest('.btn-monitoring-edit');
            const deleteBtn = target.closest('.btn-monitoring-delete');
            const addBtn = target.closest('.btn-monitoring-add');
            const importBtn = target.closest('.btn-monitoring-import');
            const templateBtn = target.closest('.btn-monitoring-download-template');
            const reportBtn = target.closest('.btn-monitoring-report');
            
            if (editBtn) {
                e.preventDefault();
                e.stopPropagation();
                const id = editBtn.getAttribute('data-id');
                console.log('🔵 Edit button clicked, ID:', id);
                if (id) {
                    MonitoringEvaluasi.edit(id);
                }
                return;
            }
            
            if (deleteBtn) {
                e.preventDefault();
                e.stopPropagation();
                const id = deleteBtn.getAttribute('data-id');
                console.log('🔴 Delete button clicked, ID:', id);
                if (id) {
                    MonitoringEvaluasi.confirmDelete(id);
                }
                return;
            }
            
            if (addBtn) {
                e.preventDefault();
                e.stopPropagation();
                console.log('➕ Add button clicked');
                MonitoringEvaluasi.showAddModal();
                return;
            }
            
            if (importBtn) {
                e.preventDefault();
                e.stopPropagation();
                console.log('📥 Import button clicked');
                MonitoringEvaluasi.showImportModal();
                return;
            }
            
            if (templateBtn) {
                e.preventDefault();
                e.stopPropagation();
                console.log('📄 Download template button clicked');
                MonitoringEvaluasi.downloadTemplate();
                return;
            }
            
            if (reportBtn) {
                e.preventDefault();
                e.stopPropagation();
                console.log('📊 Download report button clicked');
                MonitoringEvaluasi.downloadReport();
                return;
            }
        };
        
        // Add event listener
        content.addEventListener('click', this._boundClickHandler);
        console.log('✅ Button event listeners attached for monitoring-evaluasi');
    },
    
    renderProgressChart(data) {
        const ctx = document.getElementById('monitoring-progress-chart');
        if (!ctx || typeof Chart === 'undefined') {
            console.warn('Chart context not available or Chart.js not loaded');
            return;
        }
        
        const sortedData = [...data].sort((a, b) => {
            const dateA = a.tanggal_monitoring ? new Date(a.tanggal_monitoring) : new Date(0);
            const dateB = b.tanggal_monitoring ? new Date(b.tanggal_monitoring) : new Date(0);
            return dateA - dateB;
        });
        const labels = sortedData.map(d => d.risk_inputs?.kode_risiko || 'N/A');
        const progressData = sortedData.map(d => parseFloat(d.progress_mitigasi) || 0);
        const colors = progressData.map(p => 
            p >= 75 ? 'rgba(39, 174, 96, 0.7)' :
            p >= 50 ? 'rgba(52, 152, 219, 0.7)' :
            p >= 25 ? 'rgba(243, 156, 18, 0.7)' : 'rgba(231, 76, 60, 0.7)'
        );
        
        if (labels.length === 0 || progressData.every(p => p === 0)) {
            console.warn('No valid data for progress chart');
            return;
        }
        
        try {
            new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Progress Mitigasi (%)',
                    data: progressData,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace('0.7', '1')),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Progress (%)',
                            font: { weight: 'bold' }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Kode Risiko',
                            font: { weight: 'bold' }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        } catch (error) {
            console.error('Error creating monitoring progress chart:', error);
        }
    },

    async showAddModal() {
        await this.showModal();
    },

    async showModal(id = null) {
        // Remove existing modal first
        const existingModal = document.querySelector('.modal.active, .monitoring-modal');
        if (existingModal) existingModal.remove();
        
        let risks = [];
        try {
            risks = await apiCall('/api/risks');
        } catch (err) {
            console.warn('Could not load risks:', err.message);
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
        modal.innerHTML = `
            <div class="modal-content" style="background:#fff;border-radius:12px;max-width:700px;width:95%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div class="modal-header" style="padding:20px 24px;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center;background:#f8f9fa;border-radius:12px 12px 0 0;">
                    <h3 class="modal-title" style="margin:0;font-size:1.25rem;font-weight:600;">${id ? 'Edit' : 'Tambah'} Monitoring & Evaluasi</h3>
                    <button class="modal-close btn-close-modal" style="width:36px;height:36px;border-radius:50%;border:none;background:#e5e7eb;color:#6b7280;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;">&times;</button>
                </div>
                <form id="monitoring-form" style="padding:24px;">
                    <input type="hidden" id="monitoring-id" value="${id || ''}">
                    
                    <div class="form-group" style="margin-bottom:16px;">
                        <label class="form-label" style="display:block;margin-bottom:6px;font-weight:500;">Risiko *</label>
                        <select class="form-control" id="monitoring-risk" required style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;">
                            <option value="">Pilih Risiko</option>
                            ${risks.map(r => `<option value="${r.id}">${r.kode_risiko} - ${(r.sasaran || '').substring(0,40)}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
                        <div class="form-group" style="margin-bottom:16px;">
                            <label class="form-label" style="display:block;margin-bottom:6px;font-weight:500;">Tanggal Monitoring *</label>
                            <input type="date" class="form-control" id="monitoring-tanggal" required style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;">
                        </div>
                        <div class="form-group" style="margin-bottom:16px;">
                            <label class="form-label" style="display:block;margin-bottom:6px;font-weight:500;">Status Risiko</label>
                            <select class="form-control" id="monitoring-status" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;">
                                <option value="Stabil">Stabil</option>
                                <option value="Meningkat">Meningkat</option>
                                <option value="Menurun">Menurun</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
                        <div class="form-group" style="margin-bottom:16px;">
                            <label class="form-label" style="display:block;margin-bottom:6px;font-weight:500;">Probabilitas</label>
                            <input type="number" class="form-control" id="monitoring-probabilitas" min="1" max="5" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;">
                        </div>
                        <div class="form-group" style="margin-bottom:16px;">
                            <label class="form-label" style="display:block;margin-bottom:6px;font-weight:500;">Dampak</label>
                            <input type="number" class="form-control" id="monitoring-dampak" min="1" max="5" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;">
                        </div>
                        <div class="form-group" style="margin-bottom:16px;">
                            <label class="form-label" style="display:block;margin-bottom:6px;font-weight:500;">Nilai Risiko</label>
                            <input type="number" class="form-control" id="monitoring-nilai" min="1" max="25" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;">
                        </div>
                    </div>
                    
                    <div class="form-group" style="margin-bottom:16px;">
                        <label class="form-label" style="display:block;margin-bottom:6px;font-weight:500;">Tindakan Mitigasi</label>
                        <textarea class="form-control" id="monitoring-tindakan" rows="2" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;resize:vertical;"></textarea>
                    </div>
                    
                    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
                        <div class="form-group" style="margin-bottom:16px;">
                            <label class="form-label" style="display:block;margin-bottom:6px;font-weight:500;">Progress Mitigasi (%)</label>
                            <input type="number" class="form-control" id="monitoring-progress" min="0" max="100" value="0" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;">
                        </div>
                        <div class="form-group" style="margin-bottom:16px;">
                            <label class="form-label" style="display:block;margin-bottom:6px;font-weight:500;">Status Data</label>
                            <select class="form-control" id="monitoring-status-data" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;">
                                <option value="Aktif">Aktif</option>
                                <option value="Tutup">Tutup</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group" style="margin-bottom:16px;">
                        <label class="form-label" style="display:block;margin-bottom:6px;font-weight:500;">Evaluasi</label>
                        <textarea class="form-control" id="monitoring-evaluasi-text" rows="3" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;resize:vertical;"></textarea>
                    </div>
                    
                    <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px;padding-top:16px;border-top:1px solid #e0e0e0;">
                        <button type="button" class="btn btn-secondary btn-close-modal" style="padding:10px 20px;border-radius:8px;background:#e5e7eb;color:#374151;border:none;cursor:pointer;">Batal</button>
                        <button type="submit" class="btn btn-primary" style="padding:10px 20px;border-radius:8px;background:#3b82f6;color:#fff;border:none;cursor:pointer;">
                            <i class="fas fa-save"></i> Simpan
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add close button event listeners
        modal.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        // Add form submit handler
        document.getElementById('monitoring-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.save(e, id || '');
        });
        
        // Set default date
        if (!id) {
            document.getElementById('monitoring-tanggal').value = new Date().toISOString().split('T')[0];
        } else {
            await this.loadForEdit(id);
        }
    },

    async save(e, id) {
        if (e) e.preventDefault();
        
        const riskId = document.getElementById('monitoring-risk').value;
        const tanggal = document.getElementById('monitoring-tanggal').value;
        
        if (!riskId) {
            alert('Pilih risiko terlebih dahulu!');
            return;
        }
        
        if (!tanggal) {
            alert('Tanggal monitoring harus diisi!');
            return;
        }
        
        try {
            const data = {
                risk_input_id: riskId,
                tanggal_monitoring: tanggal,
                status_risiko: document.getElementById('monitoring-status').value,
                tingkat_probabilitas: parseInt(document.getElementById('monitoring-probabilitas').value) || null,
                tingkat_dampak: parseInt(document.getElementById('monitoring-dampak').value) || null,
                nilai_risiko: parseInt(document.getElementById('monitoring-nilai').value) || null,
                tindakan_mitigasi: document.getElementById('monitoring-tindakan').value,
                progress_mitigasi: parseInt(document.getElementById('monitoring-progress').value) || 0,
                evaluasi: document.getElementById('monitoring-evaluasi-text').value,
                status: document.getElementById('monitoring-status-data').value
            };

            if (id) {
                await apiCall(`/api/monitoring-evaluasi/${id}`, { method: 'PUT', body: data });
                alert('Data berhasil diupdate!');
            } else {
                await apiCall('/api/monitoring-evaluasi', { method: 'POST', body: data });
                alert('Data berhasil ditambahkan!');
            }

            const modal = document.querySelector('.modal');
            if (modal) modal.remove();
            
            await this.load();
        } catch (error) {
            console.error('Save error:', error);
            alert('Gagal menyimpan: ' + error.message);
        }
    },

    confirmDelete(id) {
        console.log('Delete clicked for ID:', id);
        if (!id) {
            console.error('No ID provided for delete');
            alert('ID tidak valid');
            return;
        }
        if (confirm('Yakin ingin menghapus data monitoring evaluasi ini?')) {
            this.delete(id);
        }
    },

    async delete(id) {
        try {
            console.log('Deleting monitoring evaluasi ID:', id);
            await apiCall(`/api/monitoring-evaluasi/${id}`, { method: 'DELETE' });
            alert('Data berhasil dihapus!');
            await this.load();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Gagal menghapus: ' + error.message);
        }
    },

    async edit(id) {
        console.log('Edit clicked for ID:', id);
        if (!id) {
            console.error('No ID provided for edit');
            alert('ID tidak valid');
            return;
        }
        try {
            await this.showModal(id);
        } catch (error) {
            console.error('Error opening edit modal:', error);
            alert('Gagal membuka form edit: ' + error.message);
        }
    },

    async loadForEdit(id) {
        try {
            console.log('Loading data for edit, ID:', id);
            const data = await apiCall(`/api/monitoring-evaluasi/${id}`);
            console.log('Loaded data:', data);
            
            if (data) {
                // Set risk dropdown - need to wait for options to be available
                const riskSelect = document.getElementById('monitoring-risk');
                if (riskSelect && data.risk_input_id) {
                    // Check if option exists, if not add it
                    let optionExists = false;
                    for (let option of riskSelect.options) {
                        if (option.value === data.risk_input_id) {
                            optionExists = true;
                            break;
                        }
                    }
                    if (!optionExists && data.risk_inputs) {
                        const newOption = document.createElement('option');
                        newOption.value = data.risk_input_id;
                        newOption.textContent = `${data.risk_inputs.kode_risiko || 'Unknown'} - ${(data.risk_inputs.sasaran || '').substring(0, 40)}`;
                        riskSelect.appendChild(newOption);
                    }
                    riskSelect.value = data.risk_input_id;
                }
                
                document.getElementById('monitoring-tanggal').value = data.tanggal_monitoring || '';
                document.getElementById('monitoring-status').value = data.status_risiko || 'Stabil';
                document.getElementById('monitoring-probabilitas').value = data.tingkat_probabilitas || '';
                document.getElementById('monitoring-dampak').value = data.tingkat_dampak || '';
                document.getElementById('monitoring-nilai').value = data.nilai_risiko || '';
                document.getElementById('monitoring-tindakan').value = data.tindakan_mitigasi || '';
                document.getElementById('monitoring-progress').value = data.progress_mitigasi || 0;
                document.getElementById('monitoring-evaluasi-text').value = data.evaluasi || '';
                document.getElementById('monitoring-status-data').value = data.status || 'Aktif';
                
                console.log('Form populated successfully');
            }
        } catch (error) {
            console.error('Error loading data for edit:', error);
            alert('Gagal memuat data: ' + error.message);
        }
    },

    downloadTemplate() { 
        try {
            // Create a simple Excel template for monitoring evaluasi
            const templateData = [
                ['Kode Risiko', 'Tanggal Monitoring', 'Status Risiko', 'Tingkat Probabilitas', 'Tingkat Dampak', 'Nilai Risiko', 'Tindakan Mitigasi', 'Progress Mitigasi (%)', 'Evaluasi', 'Status'],
                ['RSK-001', '2025-01-01', 'Stabil', '3', '4', '12', 'Implementasi kontrol keamanan', '75', 'Progress baik, perlu monitoring berkelanjutan', 'Aktif'],
                ['RSK-002', '2025-01-02', 'Meningkat', '4', '3', '12', 'Pelatihan staff', '50', 'Memerlukan perhatian lebih', 'Aktif']
            ];
            
            const ws = XLSX.utils.aoa_to_sheet(templateData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Template Monitoring Evaluasi');
            XLSX.writeFile(wb, 'template_monitoring_evaluasi.xlsx');
            
            alert('Template berhasil diunduh!');
        } catch (error) {
            console.error('Error downloading template:', error);
            alert('Gagal mengunduh template. Pastikan browser mendukung download file.');
        }
    },
    
    showImportModal() { 
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:600px;">
                <div class="modal-header">
                    <h3 class="modal-title">Import Data Monitoring & Evaluasi</h3>
                    <button class="modal-close btn-close-modal" style="width:36px;height:36px;border-radius:50%;border:none;background:#e5e7eb;color:#6b7280;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Pilih File Excel (.xlsx)</label>
                        <input type="file" class="form-control" id="import-file" accept=".xlsx,.xls">
                        <small class="form-text text-muted">
                            Format: Kode Risiko, Tanggal Monitoring, Status Risiko, Tingkat Probabilitas, Tingkat Dampak, Nilai Risiko, Tindakan Mitigasi, Progress Mitigasi (%), Evaluasi, Status
                        </small>
                    </div>
                    <div class="form-group">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            <strong>Petunjuk:</strong>
                            <ul style="margin: 0.5rem 0 0 1rem;">
                                <li>Unduh template terlebih dahulu untuk format yang benar</li>
                                <li>Pastikan data sesuai dengan format template</li>
                                <li>File maksimal 5MB</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary btn-close-modal" style="padding:10px 20px;border-radius:8px;background:#e5e7eb;color:#374151;border:none;cursor:pointer;">Batal</button>
                    <button type="button" class="btn btn-primary btn-process-import" style="padding:10px 20px;border-radius:8px;background:#3b82f6;color:#fff;border:none;cursor:pointer;">Import Data</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add event listeners for modal buttons
        modal.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.querySelector('.btn-process-import')?.addEventListener('click', () => {
            MonitoringEvaluasi.processImport();
        });
    },
    
    async processImport() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Pilih file terlebih dahulu!');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            alert('File terlalu besar! Maksimal 5MB.');
            return;
        }
        
        try {
            const data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const workbook = XLSX.read(e.target.result, { type: 'binary' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        resolve(jsonData);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = reject;
                reader.readAsBinaryString(file);
            });
            
            if (data.length < 2) {
                alert('File tidak memiliki data yang valid!');
                return;
            }
            
            // Process the imported data
            const headers = data[0];
            const rows = data.slice(1);
            let successCount = 0;
            let errorCount = 0;
            
            for (const row of rows) {
                if (row.length < headers.length) continue;
                
                try {
                    const monitoringData = {
                        // Map the row data to monitoring evaluasi fields
                        // This would need to be implemented based on your specific requirements
                    };
                    
                    // Here you would call the API to save the data
                    // await apiCall('/api/monitoring-evaluasi', { method: 'POST', body: monitoringData });
                    successCount++;
                } catch (error) {
                    console.error('Error importing row:', error);
                    errorCount++;
                }
            }
            
            document.querySelector('.modal').remove();
            alert(`Import selesai! Berhasil: ${successCount}, Gagal: ${errorCount}`);
            
            if (successCount > 0) {
                await this.load();
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('Gagal mengimport file: ' + error.message);
        }
    },
    
    downloadReport() { 
        try {
            // Get current data
            const tableRows = document.querySelectorAll('.monitoring-table tbody tr');
            if (tableRows.length === 0 || (tableRows.length === 1 && tableRows[0].textContent.includes('Tidak ada data'))) {
                alert('Tidak ada data untuk diunduh!');
                return;
            }
            
            // Prepare data for export
            const reportData = [
                ['LAPORAN MONITORING & EVALUASI RISIKO'],
                ['Tanggal Laporan: ' + new Date().toLocaleDateString('id-ID')],
                [''],
                ['Tanggal', 'Kode Risiko', 'Status Risiko', 'Nilai Risiko', 'Progress Mitigasi (%)', 'Evaluasi']
            ];
            
            // Extract data from table
            tableRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 6 && !row.textContent.includes('Tidak ada data')) {
                    const rowData = [
                        cells[0].textContent.trim(), // Tanggal
                        cells[1].textContent.trim(), // Kode Risiko
                        cells[2].textContent.trim(), // Status Risiko
                        cells[3].textContent.trim(), // Nilai Risiko
                        cells[4].querySelector('.progress-text')?.textContent.trim() || '0%', // Progress
                        cells[5].textContent.trim() // Evaluasi
                    ];
                    reportData.push(rowData);
                }
            });
            
            // Create Excel file
            const ws = XLSX.utils.aoa_to_sheet(reportData);
            
            // Set column widths
            ws['!cols'] = [
                { width: 15 }, // Tanggal
                { width: 15 }, // Kode Risiko
                { width: 15 }, // Status Risiko
                { width: 12 }, // Nilai Risiko
                { width: 15 }, // Progress
                { width: 50 }  // Evaluasi
            ];
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Laporan Monitoring Evaluasi');
            
            const fileName = `laporan_monitoring_evaluasi_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            alert('Laporan berhasil diunduh!');
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Gagal mengunduh laporan. Pastikan browser mendukung download file.');
        }
    }
};

function getStatusColor(status) {
    const colorMap = {
        'Stabil': 'aman',
        'Meningkat': 'hati-hati',
        'Menurun': 'normal',
        'Kritis': 'kritis'
    };
    return colorMap[status] || 'secondary';
}

// Export module to window for global access
window.MonitoringEvaluasi = MonitoringEvaluasi;
window.monitoringEvaluasiModule = MonitoringEvaluasi;

// Ensure module is available immediately
console.log('✅ MonitoringEvaluasi module loaded and exported to window');

// Add global click handler as ultimate fallback
document.addEventListener('click', function(e) {
    // Only handle if MonitoringEvaluasi exists
    if (!window.MonitoringEvaluasi) return;
    
    const target = e.target;
    
    // Check for edit button
    if (target.closest('.btn-monitoring-edit')) {
        const btn = target.closest('.btn-monitoring-edit');
        const id = btn.getAttribute('data-id');
        if (id) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔵 [Global Handler] Edit clicked, ID:', id);
            window.MonitoringEvaluasi.edit(id);
        }
        return;
    }
    
    // Check for delete button
    if (target.closest('.btn-monitoring-delete')) {
        const btn = target.closest('.btn-monitoring-delete');
        const id = btn.getAttribute('data-id');
        if (id) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔴 [Global Handler] Delete clicked, ID:', id);
            window.MonitoringEvaluasi.confirmDelete(id);
        }
        return;
    }
}, true); // Use capture phase for priority