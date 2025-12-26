// Early Warning System (EWS) Module
const EWS = {
    async load() {
        try {
            const data = await apiCall('/api/ews');
            this.render(data);
        } catch (error) {
            console.error('Error loading EWS:', error);
            document.getElementById('ews-content').innerHTML = 
                '<div class="card"><p>Error: ' + error.message + '</p></div>';
        }
    },

    render(data) {
        const content = document.getElementById('ews-content');
        if (!content) {
            console.error('EWS content element not found');
            return;
        }
        
        // Add enhanced CSS styling for overflow prevention
        const styleId = 'ews-enhanced-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .table-container {
                    overflow-x: auto;
                    max-width: 100%;
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
            `;
            document.head.appendChild(style);
        }
        
        // Handle empty data
        if (!data || data.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-info-circle" style="font-size: 3rem; color: #3498db; margin-bottom: 1rem;"></i>
                    <h4 style="color: #2c3e50; margin-bottom: 0.5rem;">Tidak Ada Data EWS</h4>
                    <p style="color: #7f8c8d;">Belum ada data Early Warning System. Silakan tambah data EWS terlebih dahulu.</p>
                    <button class="btn btn-primary" onclick="EWS.showAddModal()" style="margin-top: 1rem;">
                        <i class="fas fa-plus-circle"></i> Tambah EWS
                    </button>
                </div>
            `;
            return;
        }
        
        // Calculate statistics
        const stats = {
            normal: data.filter(d => d.level_peringatan === 'Normal').length,
            peringatan: data.filter(d => d.level_peringatan === 'Peringatan').length,
            waspada: data.filter(d => d.level_peringatan === 'Waspada').length,
            darurat: data.filter(d => d.level_peringatan === 'Darurat').length
        };
        
        content.innerHTML = `
            <div class="charts-grid mb-3">
                <div class="chart-card">
                    <h4 class="chart-title">Level Peringatan EWS</h4>
                    <canvas id="ews-level-chart"></canvas>
                </div>
                <div class="chart-card">
                    <h4 class="chart-title">Status Aktif</h4>
                    <canvas id="ews-status-chart"></canvas>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Early Warning System</h3>
                    <div class="action-buttons">
                        <button class="btn btn-warning" onclick="EWS.downloadTemplate()">
                            <i class="fas fa-download"></i> Unduh Template
                        </button>
                        <button class="btn btn-success" onclick="EWS.showImportModal()">
                            <i class="fas fa-upload"></i> Import Data
                        </button>
                        <button class="btn btn-primary" onclick="EWS.showAddModal()">
                            <i class="fas fa-plus"></i> Tambah EWS
                        </button>
                        <button class="btn btn-info" onclick="EWS.downloadReport()">
                            <i class="fas fa-file-pdf"></i> Unduh Laporan
                        </button>
                    </div>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Nama Sistem</th>
                                <th>Indikator</th>
                                <th>Nilai Aktual</th>
                                <th>Level Peringatan</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.length === 0 ? '<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>' : ''}
                            ${data.map(item => `
                                <tr>
                                    <td>${item.kode}</td>
                                    <td>${item.nama_sistem}</td>
                                    <td>${item.indikator_peringatan?.substring(0, 30)}...</td>
                                    <td>${item.nilai_aktual || '-'}</td>
                                    <td>
                                        <span class="badge-status badge-${
                                            item.level_peringatan === 'Normal' ? 'normal' : 
                                            item.level_peringatan === 'Peringatan' ? 'peringatan' :
                                            item.level_peringatan === 'Waspada' ? 'waspada' : 'darurat'
                                        }">${item.level_peringatan}</span>
                                    </td>
                                    <td>
                                        <span class="badge-status badge-${item.status_aktif ? 'aman' : 'secondary'}">
                                            ${item.status_aktif ? 'Aktif' : 'Tidak Aktif'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-edit btn-sm" onclick="EWS.edit('${item.id}')">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button class="btn btn-delete btn-sm" onclick="EWS.delete('${item.id}')">
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
        
        // Render charts - wait for Chart.js
        if (typeof Chart !== 'undefined') {
            setTimeout(() => {
                this.renderLevelChart(stats);
                this.renderStatusChart(data);
            }, 100);
        } else {
            const checkChart = setInterval(() => {
                if (typeof Chart !== 'undefined') {
                    clearInterval(checkChart);
                    setTimeout(() => {
                        this.renderLevelChart(stats);
                        this.renderStatusChart(data);
                    }, 100);
                }
            }, 100);
            setTimeout(() => clearInterval(checkChart), 5000);
        }
    },

    renderLevelChart(stats) {
        const ctx = document.getElementById('ews-level-chart');
        if (!ctx) {
            console.warn('EWS level chart context element not found');
            return;
        }
        
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, showing fallback');
            return;
        }
        
        try {
            // Destroy existing chart if any
            if (window.ewsLevelChartInstance) {
                window.ewsLevelChartInstance.destroy();
            }
            
            // Prepare data
            const chartData = [
                Math.max(stats.normal, 0),
                Math.max(stats.peringatan, 0),
                Math.max(stats.waspada, 0),
                Math.max(stats.darurat, 0)
            ];
            
            // If all are zero, show a placeholder
            if (chartData[0] === 0 && chartData[1] === 0 && chartData[2] === 0 && chartData[3] === 0) {
                chartData[0] = 1; // Show one slice for empty state
            }
            
            window.ewsLevelChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Normal', 'Peringatan', 'Waspada', 'Darurat'],
                    datasets: [{
                        data: chartData,
                        backgroundColor: ['#3b82f6', '#f59e0b', '#f97316', '#dc2626']
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
                    }
                }
            });
        } catch (error) {
            console.error('Error rendering EWS level chart:', error);
        }
    },

    renderStatusChart(data) {
        const ctx = document.getElementById('ews-status-chart');
        if (!ctx) {
            console.warn('EWS status chart context element not found');
            return;
        }
        
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, showing fallback');
            return;
        }
        
        const aktif = data.filter(d => d.status_aktif).length;
        const tidakAktif = data.length - aktif;
        
        try {
            // Destroy existing chart if any
            if (window.ewsStatusChartInstance) {
                window.ewsStatusChartInstance.destroy();
            }
            
            // Prepare data
            const chartData = [
                Math.max(aktif, 0),
                Math.max(tidakAktif, 0)
            ];
            
            // If all are zero, show a placeholder
            if (chartData[0] === 0 && chartData[1] === 0) {
                chartData[0] = 1; // Show one slice for empty state
            }
            
            window.ewsStatusChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Aktif', 'Tidak Aktif'],
                    datasets: [{
                        data: chartData,
                        backgroundColor: ['#10b981', '#6b7280']
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
                    }
                }
            });
        } catch (error) {
            console.error('Error creating EWS status chart:', error);
        }
    },

    async showAddModal() {
        let kode = '';
        try {
            const kodeData = await apiCall('/api/ews/generate/kode');
            kode = kodeData.kode;
        } catch (error) {
            console.error('Error generating kode:', error);
        }
        await this.showModal(null, kode);
    },

    async showModal(id = null, kode = '') {
        const categories = await apiCall('/api/master-data/categories');
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Early Warning System</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="ews-form-modal" onsubmit="EWS.save(event, '${id || ''}')">
                    <div class="form-group">
                        <label class="form-label">Kode *</label>
                        <input type="text" class="form-control" id="ews-kode" required 
                               value="${kode}" ${kode ? 'readonly' : ''}>
                        <small style="color: var(--gray-500);">${kode ? 'Kode otomatis digenerate' : ''}</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nama Sistem *</label>
                        <input type="text" class="form-control" id="ews-nama" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Kategori Risiko</label>
                        <select class="form-control" id="ews-kategori">
                            <option value="">Pilih Kategori</option>
                            ${categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Indikator Peringatan *</label>
                        <textarea class="form-control" id="ews-indikator" required rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Threshold Nilai</label>
                        <input type="number" class="form-control" id="ews-threshold" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nilai Aktual</label>
                        <input type="number" class="form-control" id="ews-aktual" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Frekuensi Monitoring</label>
                        <select class="form-control" id="ews-frekuensi">
                            <option value="Harian">Harian</option>
                            <option value="Mingguan">Mingguan</option>
                            <option value="Bulanan">Bulanan</option>
                            <option value="Tahunan">Tahunan</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tanggal Monitoring Terakhir</label>
                        <input type="date" class="form-control" id="ews-tanggal">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status Aktif</label>
                        <select class="form-control" id="ews-status-aktif">
                            <option value="true">Aktif</option>
                            <option value="false">Tidak Aktif</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="ews-notifikasi" style="margin-right: 0.5rem;">
                            Aktifkan Notifikasi Email
                        </label>
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
                kode: document.getElementById('ews-kode').value,
                nama_sistem: document.getElementById('ews-nama').value,
                kategori_risiko_id: document.getElementById('ews-kategori').value || null,
                indikator_peringatan: document.getElementById('ews-indikator').value,
                threshold_nilai: parseFloat(document.getElementById('ews-threshold').value) || null,
                nilai_aktual: parseFloat(document.getElementById('ews-aktual').value) || null,
                frekuensi_monitoring: document.getElementById('ews-frekuensi').value,
                tanggal_monitoring_terakhir: document.getElementById('ews-tanggal').value || null,
                status_aktif: document.getElementById('ews-status-aktif').value === 'true',
                notifikasi_email: document.getElementById('ews-notifikasi').checked
            };
            
            if (id) {
                await apiCall(`/api/ews/${id}`, { method: 'PUT', body: data });
                alert('EWS berhasil diupdate');
            } else {
                await apiCall('/api/ews', { method: 'POST', body: data });
                alert('EWS berhasil disimpan');
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
            await apiCall(`/api/ews/${id}`, { method: 'DELETE' });
            await this.load();
            alert('Data berhasil dihapus');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async edit(id) {
        let kode = '';
        try {
            const item = await apiCall(`/api/ews/${id}`);
            kode = item.kode;
        } catch (error) {
            console.error('Error loading data:', error);
        }
        await this.showModal(id, kode);
    },

    async loadForEdit(id) {
        try {
            const data = await apiCall(`/api/ews/${id}`);
            document.getElementById('ews-kode').value = data.kode || '';
            document.getElementById('ews-nama').value = data.nama_sistem || '';
            document.getElementById('ews-kategori').value = data.kategori_risiko_id || '';
            document.getElementById('ews-indikator').value = data.indikator_peringatan || '';
            document.getElementById('ews-threshold').value = data.threshold_nilai || '';
            document.getElementById('ews-aktual').value = data.nilai_aktual || '';
            document.getElementById('ews-frekuensi').value = data.frekuensi_monitoring || 'Bulanan';
            document.getElementById('ews-tanggal').value = data.tanggal_monitoring_terakhir || '';
            document.getElementById('ews-status-aktif').value = data.status_aktif ? 'true' : 'false';
            document.getElementById('ews-notifikasi').checked = data.notifikasi_email || false;
        } catch (error) {
            alert('Error loading data: ' + error.message);
        }
    },

    async downloadTemplate() { alert('Fitur unduh template akan diimplementasikan'); },
    showImportModal() { alert('Fitur import akan diimplementasikan'); },
    async downloadReport() { alert('Fitur unduh laporan akan diimplementasikan'); }
};

window.ewsModule = EWS;

