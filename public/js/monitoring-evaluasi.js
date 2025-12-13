// Monitoring & Evaluasi Risiko Module
const MonitoringEvaluasi = {
    async load() {
        try {
            const data = await apiCall('/api/monitoring-evaluasi');
            this.render(data);
        } catch (error) {
            console.error('Error loading monitoring evaluasi:', error);
            document.getElementById('monitoring-evaluasi-content').innerHTML =
                '<div class="card"><p>Error: ' + error.message + '</p></div>';
        }
    },

    render(data) {
        const content = document.getElementById('monitoring-evaluasi-content');
        
        // Calculate statistics
        const stats = {
            total: data.length,
            completed: data.filter(d => d.progress_mitigasi >= 100).length,
            inProgress: data.filter(d => d.progress_mitigasi > 0 && d.progress_mitigasi < 100).length,
            notStarted: data.filter(d => !d.progress_mitigasi || d.progress_mitigasi === 0).length,
            avgProgress: data.length > 0 ? (data.reduce((sum, d) => sum + (d.progress_mitigasi || 0), 0) / data.length).toFixed(1) : 0
        };
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-tasks"></i> Monitoring & Evaluasi Risiko</h3>
                    <div class="action-buttons">
                        <button class="btn btn-warning" onclick="MonitoringEvaluasi.downloadTemplate()">
                            <i class="fas fa-download"></i> Unduh Template
                        </button>
                        <button class="btn btn-success" onclick="MonitoringEvaluasi.showImportModal()">
                            <i class="fas fa-upload"></i> Import Data
                        </button>
                        <button class="btn btn-primary" onclick="MonitoringEvaluasi.showAddModal()">
                            <i class="fas fa-plus"></i> Tambah Monitoring
                        </button>
                        <button class="btn btn-info" onclick="MonitoringEvaluasi.downloadReport()">
                            <i class="fas fa-file-pdf"></i> Unduh Laporan
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Statistics -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 8px; color: white;">
                            <div style="font-size: 2rem; font-weight: bold;">${stats.total}</div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">Total Monitoring</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 1.5rem; border-radius: 8px; color: white;">
                            <div style="font-size: 2rem; font-weight: bold;">${stats.completed}</div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">Completed (100%)</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 1.5rem; border-radius: 8px; color: white;">
                            <div style="font-size: 2rem; font-weight: bold;">${stats.inProgress}</div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">In Progress</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 1.5rem; border-radius: 8px; color: white;">
                            <div style="font-size: 2rem; font-weight: bold;">${stats.avgProgress}%</div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">Avg Progress</div>
                        </div>
                    </div>
                    
                    <!-- Progress Chart -->
                    ${data.length > 0 ? `
                    <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 2rem;">
                        <h4 style="margin-bottom: 1rem;"><i class="fas fa-chart-line"></i> Progress Mitigasi Risiko</h4>
                        <div style="position: relative; height: 300px;">
                            <canvas id="monitoring-progress-chart"></canvas>
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Table -->
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Kode Risiko</th>
                                    <th>Status Risiko</th>
                                    <th>Nilai Risiko</th>
                                    <th>Progress Mitigasi</th>
                                    <th>Evaluasi</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.length === 0 ? '<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>' : ''}
                                ${data.map(item => {
                                    const progressColor = item.progress_mitigasi >= 75 ? '#27ae60' : 
                                                        item.progress_mitigasi >= 50 ? '#3498db' :
                                                        item.progress_mitigasi >= 25 ? '#f39c12' : '#e74c3c';
                                    return `
                                    <tr>
                                        <td>${item.tanggal_monitoring || '-'}</td>
                                        <td><strong>${item.risk_inputs?.kode_risiko || '-'}</strong></td>
                                        <td><span class="badge-status badge-${getStatusColor(item.status_risiko)}">${item.status_risiko || '-'}</span></td>
                                        <td>${item.nilai_risiko || '-'}</td>
                                        <td>
                                            <div style="display:flex;align-items:center;gap:0.5rem;">
                                                <div style="flex:1;height:10px;background:#e5e7eb;border-radius:9999px;overflow:hidden;">
                                                    <div style="width:${item.progress_mitigasi || 0}%;height:100%;background:${progressColor};border-radius:9999px;transition:width 0.3s;"></div>
                                                </div>
                                                <span style="font-weight:bold;color:${progressColor};">${item.progress_mitigasi || 0}%</span>
                                            </div>
                                        </td>
                                        <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.evaluasi || '-'}">${item.evaluasi || '-'}</td>
                                        <td>
                                            <button class="btn btn-edit btn-sm" onclick="MonitoringEvaluasi.edit('${item.id}')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-delete btn-sm" onclick="MonitoringEvaluasi.delete('${item.id}')">
                                                <i class="fas fa-trash"></i>
                                            </button>
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
        
        // Render progress chart - wait for Chart.js
        if (data.length > 0) {
            if (typeof Chart !== 'undefined') {
                setTimeout(() => this.renderProgressChart(data), 100);
            } else {
                const checkChart = setInterval(() => {
                    if (typeof Chart !== 'undefined') {
                        clearInterval(checkChart);
                        setTimeout(() => this.renderProgressChart(data), 100);
                    }
                }, 100);
                setTimeout(() => clearInterval(checkChart), 5000);
            }
        }
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
        const risks = await apiCall('/api/risks');
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:800px;">
                <div class="modal-header">
                    <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Monitoring & Evaluasi</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="monitoring-form" onsubmit="MonitoringEvaluasi.save(event, '${id || ''}')">
                    <div class="form-group">
                        <label class="form-label">Risiko *</label>
                        <select class="form-control" id="monitoring-risk" required>
                            <option value="">Pilih Risiko</option>
                            ${risks.map(r => `<option value="${r.id}">${r.kode_risiko} - ${r.sasaran?.substring(0,50)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tanggal Monitoring *</label>
                        <input type="date" class="form-control" id="monitoring-tanggal" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status Risiko</label>
                        <select class="form-control" id="monitoring-status">
                            <option value="Stabil">Stabil</option>
                            <option value="Meningkat">Meningkat</option>
                            <option value="Menurun">Menurun</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Probabilitas</label>
                        <input type="number" class="form-control" id="monitoring-probabilitas" min="1" max="5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Dampak</label>
                        <input type="number" class="form-control" id="monitoring-dampak" min="1" max="5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nilai Risiko</label>
                        <input type="number" class="form-control" id="monitoring-nilai" min="1" max="25">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tindakan Mitigasi</label>
                        <textarea class="form-control" id="monitoring-tindakan" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Progress Mitigasi (%)</label>
                        <input type="number" class="form-control" id="monitoring-progress" min="0" max="100">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Evaluasi</label>
                        <textarea class="form-control" id="monitoring-evaluasi-text" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status Data</label>
                        <select class="form-control" id="monitoring-status-data">
                            <option value="Aktif">Aktif</option>
                            <option value="Tutup">Tutup</option>
                        </select>
                    </div>
                    <div style="display:flex;gap:1rem;justify-content:flex-end;margin-top:1.5rem;">
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
                risk_input_id: document.getElementById('monitoring-risk').value,
                tanggal_monitoring: document.getElementById('monitoring-tanggal').value,
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
            } else {
                await apiCall('/api/monitoring-evaluasi', { method: 'POST', body: data });
            }

            document.querySelector('.modal').remove();
            await this.load();
            alert('Monitoring berhasil disimpan');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async delete(id) {
        if (!confirm('Yakin ingin menghapus?')) return;
        try {
            await apiCall(`/api/monitoring-evaluasi/${id}`, { method: 'DELETE' });
            await this.load();
            alert('Data berhasil dihapus');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async edit(id) {
        await this.showModal(id);
    },

    async loadForEdit(id) {
        try {
            const data = await apiCall(`/api/monitoring-evaluasi/${id}`);
            document.getElementById('monitoring-risk').value = data.risk_input_id || '';
            document.getElementById('monitoring-tanggal').value = data.tanggal_monitoring || '';
            document.getElementById('monitoring-status').value = data.status_risiko || 'Stabil';
            document.getElementById('monitoring-probabilitas').value = data.tingkat_probabilitas || '';
            document.getElementById('monitoring-dampak').value = data.tingkat_dampak || '';
            document.getElementById('monitoring-nilai').value = data.nilai_risiko || '';
            document.getElementById('monitoring-tindakan').value = data.tindakan_mitigasi || '';
            document.getElementById('monitoring-progress').value = data.progress_mitigasi || '';
            document.getElementById('monitoring-evaluasi-text').value = data.evaluasi || '';
            document.getElementById('monitoring-status-data').value = data.status || 'Aktif';
        } catch (error) {
            alert('Error loading data: ' + error.message);
        }
    },

    downloadTemplate() { alert('Fitur unduh template akan diimplementasikan'); },
    showImportModal() { alert('Fitur import akan diimplementasikan'); },
    downloadReport() { alert('Fitur unduh laporan akan diimplementasikan'); }
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

window.monitoringEvaluasiModule = MonitoringEvaluasi;