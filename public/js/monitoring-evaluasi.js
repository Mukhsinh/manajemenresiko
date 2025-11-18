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
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Monitoring & Evaluasi Risiko</h3>
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
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Kode Risiko</th>
                                <th>Status Risiko</th>
                                <th>Nilai Risiko</th>
                                <th>Progress Mitigasi</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.length === 0 ? '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>' : ''}
                            ${data.map(item => `
                                <tr>
                                    <td>${item.tanggal_monitoring}</td>
                                    <td>${item.risk_inputs?.kode_risiko || '-'}</td>
                                    <td>${item.status_risiko || '-'}</td>
                                    <td>${item.nilai_risiko || '-'}</td>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:0.5rem;">
                                            <div style="flex:1;height:8px;background:#e5e7eb;border-radius:9999px;">
                                                <div style="width:${item.progress_mitigasi || 0}%;height:100%;background:var(--primary-blue);border-radius:9999px;"></div>
                                            </div>
                                            <span>${item.progress_mitigasi || 0}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <button class="btn btn-edit btn-sm" onclick="MonitoringEvaluasi.edit('${item.id}')">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button class="btn btn-delete btn-sm" onclick="MonitoringEvaluasi.delete('${item.id}')">
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

window.monitoringEvaluasiModule = MonitoringEvaluasi;