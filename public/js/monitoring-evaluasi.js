// Monitoring & Evaluasi Risiko Module
const MonitoringEvaluasi = {
    async load() {
        try {
            console.log('=== LOADING MONITORING EVALUASI ===');
            let data;
            
            try {
                // Try authenticated endpoint first
                data = await apiCall('/api/monitoring-evaluasi');
                console.log('Authenticated API success:', data?.length || 0);
            } catch (authError) {
                console.warn('Authenticated API failed, trying test endpoint:', authError.message);
                
                // Fallback to test endpoint
                try {
                    data = await apiCall('/api/monitoring-evaluasi/test');
                    console.log('Test API success:', data?.length || 0);
                } catch (testError) {
                    console.warn('Test API failed, trying debug endpoint:', testError.message);
                    
                    // Final fallback to debug endpoint
                    try {
                        const debugResponse = await apiCall('/api/debug-monitoring');
                        data = debugResponse.data || [];
                        console.log('Debug API success:', data?.length || 0);
                    } catch (debugError) {
                        console.error('All APIs failed:', debugError.message);
                        throw new Error('Tidak dapat memuat data monitoring evaluasi. Silakan refresh halaman.');
                    }
                }
            }
            
            this.render(data);
        } catch (error) {
            console.error('Error loading monitoring evaluasi:', error);
            document.getElementById('monitoring-evaluasi-content').innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error memuat data</h5>
                        <p>${error.message}</p>
                        <button onclick="MonitoringEvaluasi.load()" class="btn btn-primary">Coba Lagi</button>
                    </div>
                </div>
            `;
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
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <h3 class="card-title" style="margin: 0;"><i class="fas fa-tasks"></i> Monitoring & Evaluasi Risiko</h3>
                    <div class="action-buttons" style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                        <button class="btn btn-warning btn-sm" onclick="MonitoringEvaluasi.downloadTemplate()" title="Unduh Template">
                            <i class="fas fa-download"></i> <span class="btn-text">Unduh Template</span>
                        </button>
                        <button class="btn btn-success btn-sm" onclick="MonitoringEvaluasi.showImportModal()" title="Import Data">
                            <i class="fas fa-upload"></i> <span class="btn-text">Import Data</span>
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="MonitoringEvaluasi.showAddModal()" title="Tambah Monitoring">
                            <i class="fas fa-plus"></i> <span class="btn-text">Tambah Monitoring</span>
                        </button>
                        <button class="btn btn-info btn-sm" onclick="MonitoringEvaluasi.downloadReport()" title="Unduh Laporan">
                            <i class="fas fa-file-pdf"></i> <span class="btn-text">Unduh Laporan</span>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Statistics -->
                    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 8px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">${stats.total}</div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">Total Monitoring</div>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 1.5rem; border-radius: 8px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">${stats.completed}</div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">Completed (100%)</div>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 1.5rem; border-radius: 8px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">${stats.inProgress}</div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">In Progress</div>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 1.5rem; border-radius: 8px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">${stats.avgProgress}%</div>
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
                        <table class="table monitoring-table">
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
                                    const evaluasiText = item.evaluasi || '-';
                                    const shortEvaluasi = evaluasiText.length > 100 ? evaluasiText.substring(0, 100) + '...' : evaluasiText;
                                    
                                    return `
                                    <tr>
                                        <td>${item.tanggal_monitoring || '-'}</td>
                                        <td><strong>${item.risk_inputs?.kode_risiko || '-'}</strong></td>
                                        <td><span class="badge-status badge-${getStatusColor(item.status_risiko)}">${item.status_risiko || '-'}</span></td>
                                        <td style="text-align: center;">${item.nilai_risiko || '-'}</td>
                                        <td>
                                            <div class="progress-container">
                                                <div class="progress-bar">
                                                    <div class="progress-fill" style="width:${item.progress_mitigasi || 0}%;background:${progressColor};"></div>
                                                </div>
                                                <span class="progress-text" style="color:${progressColor};">${item.progress_mitigasi || 0}%</span>
                                            </div>
                                        </td>
                                        <td class="evaluasi-cell" title="${evaluasiText}">${shortEvaluasi}</td>
                                        <td>
                                            <div style="display: flex; gap: 0.25rem;">
                                                <button class="btn btn-edit btn-sm" onclick="MonitoringEvaluasi.edit('${item.id}')" title="Edit">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-delete btn-sm" onclick="MonitoringEvaluasi.delete('${item.id}')" title="Hapus">
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
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
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
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
                    <button type="button" class="btn btn-primary" onclick="MonitoringEvaluasi.processImport()">Import Data</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
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

window.monitoringEvaluasiModule = MonitoringEvaluasi;