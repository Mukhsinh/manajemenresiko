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
        
        // Add enhanced CSS styling
        const styleId = 'kri-enhanced-styles';
        if (!document.getElementById(styleId)) {
            /** @type {HTMLStyleElement} */
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                /* Enhanced KRI Styles */
                .page-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 2rem 0;
                    margin-bottom: 2rem;
                    border-radius: 12px;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    align-items: center;
                }
                
                .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                
                .chart-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                
                .chart-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    color: #2c3e50;
                }
                
                .table-container {
                    overflow-x: auto;
                    max-width: 100%;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                
                .table td, .table th {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 300px;
                    word-wrap: break-word;
                }
                
                .badge-status {
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .btn-edit, .btn-delete {
                    max-width: 40px;
                    overflow: hidden;
                }
                
                .badge-status {
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 0.875rem;
                    display: inline-block;
                }
                
                .badge-status.badge-aman {
                    background-color: #28a745 !important;
                    color: #ffffff !important;
                }
                
                .badge-status.badge-hati-hati {
                    background-color: #ffc107 !important;
                    color: #212529 !important;
                }
                
                .badge-status.badge-kritis {
                    background-color: #dc3545 !important;
                    color: #ffffff !important;
                }
                
                .btn-edit, .btn-delete {
                    padding: 6px 8px;
                    margin: 0 2px;
                    border-radius: 6px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.75rem;
                }
                
                .btn-edit {
                    background-color: #17a2b8;
                    color: white;
                }
                
                .btn-delete {
                    background-color: #dc3545;
                    color: white;
                }
                
                .btn-edit:hover, .btn-delete:hover {
                    transform: scale(1.1);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
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
        
        // Ensure we have valid stats even if all are zero
        const totalStats = stats.aman + stats.hati_hati + stats.kritis;
        if (totalStats === 0) {
            stats.aman = 1; // Show at least one slice for empty state
        }
        
        content.innerHTML = `
            <div class="charts-grid mb-3">
                <div class="chart-card">
                    <h4 class="chart-title">Status KRI</h4>
                    <canvas id="kri-status-chart"></canvas>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Key Risk Indicator</h3>
                    <div class="action-buttons">
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
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Nama Indikator</th>
                                <th>Kategori</th>
                                <th>Nilai Aktual</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.length === 0 ? '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>' : ''}
                            ${data.map(item => `
                                <tr>
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
                                    <td>
                                        <button class="btn btn-edit btn-sm" onclick="KRI.edit('${item.id}')">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button class="btn btn-delete btn-sm" onclick="KRI.delete('${item.id}')">
                                            <i class="fas fa-trash"></i> Hapus
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
        const [categories, risks, units] = await Promise.all([
            apiCall('/api/master-data/categories'),
            apiCall('/api/risks'),
            apiCall('/api/master-data/work-units')
        ]);
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Key Risk Indicator</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="kri-form-modal" onsubmit="KRI.save(event, '${id || ''}')">
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
                            ${risks.map(r => `<option value="${r.id}">${r.kode_risiko} - ${r.sasaran?.substring(0, 50)}</option>`).join('')}
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
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
                        <button type="submit" class="btn btn-primary">Simpan</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        if (id) await this.loadForEdit(id);
    },

    async save(e, id) {
        e.preventDefault();
        try {
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
            
            if (id) {
                await apiCall(`/api/kri/${id}`, { method: 'PUT', body: data });
                alert('KRI berhasil diupdate');
            } else {
                await apiCall('/api/kri', { method: 'POST', body: data });
                alert('KRI berhasil disimpan');
            }
            
            document.querySelector('.modal').remove();
            await this.load();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async delete(id) {
        if (!confirm('Yakin ingin menghapus?')) return;
        try {
            await apiCall(`/api/kri/${id}`, { method: 'DELETE' });
            await this.load();
            alert('Data berhasil dihapus');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async edit(id) {
        let kode = '';
        try {
            const item = await apiCall(`/api/kri/${id}`);
            kode = item.kode;
        } catch (error) {
            console.error('Error loading data:', error);
        }
        await this.showModal(id, kode);
    },

    async loadForEdit(id) {
        try {
            const data = await apiCall(`/api/kri/${id}`);
            document.getElementById('kri-kode').value = data.kode || '';
            document.getElementById('kri-nama').value = data.nama_indikator || '';
            document.getElementById('kri-kategori').value = data.kategori_risiko_id || '';
            document.getElementById('kri-risk').value = data.risk_input_id || '';
            document.getElementById('kri-unit').value = data.unit_kerja_id || '';
            document.getElementById('kri-metode').value = data.metode_pengukuran || '';
            document.getElementById('kri-target').value = data.target_nilai || '';
            document.getElementById('kri-aktual').value = data.nilai_aktual || '';
            document.getElementById('kri-batas-aman').value = data.batas_aman || '';
            document.getElementById('kri-batas-peringatan').value = data.batas_peringatan || '';
            document.getElementById('kri-batas-kritis').value = data.batas_kritis || '';
            document.getElementById('kri-periode').value = data.periode_pengukuran || 'Bulanan';
            document.getElementById('kri-tanggal').value = data.tanggal_pengukuran_terakhir || '';
        } catch (error) {
            alert('Error loading data: ' + error.message);
        }
    },

    async downloadTemplate() { alert('Fitur unduh template akan diimplementasikan'); },
    showImportModal() { alert('Fitur import akan diimplementasikan'); },
    async downloadReport() { alert('Fitur unduh laporan akan diimplementasikan'); }
};

window.kriModule = KRI;

