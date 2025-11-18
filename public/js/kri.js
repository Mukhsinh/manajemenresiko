// Key Risk Indicator (KRI) Module
const KRI = {
    async load() {
        try {
            const data = await apiCall('/api/kri');
            this.render(data);
        } catch (error) {
            console.error('Error loading KRI:', error);
            document.getElementById('kri-content').innerHTML = 
                '<div class="card"><p>Error: ' + error.message + '</p></div>';
        }
    },

    render(data) {
        const content = document.getElementById('kri-content');
        
        // Calculate statistics
        const stats = {
            aman: data.filter(d => d.status_indikator === 'Aman').length,
            hati_hati: data.filter(d => d.status_indikator === 'Hati-hati').length,
            kritis: data.filter(d => d.status_indikator === 'Kritis').length
        };
        
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
                                            item.status_indikator === 'Hati-hati' ? 'hati-hati' : 'kritis'
                                        }">${item.status_indikator}</span>
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
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Aman', 'Hati-hati', 'Kritis'],
                datasets: [{
                    data: [stats.aman, stats.hati_hati, stats.kritis],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    },

    async showAddModal() {
        let kode = '';
        try {
            const kodeData = await apiCall('/api/kri/generate/kode');
            kode = kodeData.kode;
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
            } else {
                await apiCall('/api/kri', { method: 'POST', body: data });
            }
            
            document.querySelector('.modal').remove();
            await this.load();
            alert('KRI berhasil disimpan');
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

