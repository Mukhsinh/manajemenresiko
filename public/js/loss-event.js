// Loss Event Module
const LossEvent = {
    async load() {
        try {
            const data = await apiCall('/api/loss-event');
            this.render(data);
        } catch (error) {
            console.error('Error loading loss event:', error);
            document.getElementById('loss-event-content').innerHTML = 
                '<div class="card"><p>Error: ' + error.message + '</p></div>';
        }
    },

    render(data) {
        const content = document.getElementById('loss-event-content');
        const totalLoss = data.reduce((sum, item) => sum + (parseFloat(item.dampak_finansial) || 0), 0);
        
        content.innerHTML = `
            <div class="charts-grid mb-3">
                <div class="chart-card">
                    <h4 class="chart-title">Total Kerugian Finansial</h4>
                    <div style="font-size: 2rem; font-weight: 700; color: var(--danger); text-align: center;">
                        Rp ${totalLoss.toLocaleString('id-ID')}
                    </div>
                </div>
                <div class="chart-card">
                    <h4 class="chart-title">Jumlah Kejadian</h4>
                    <div style="font-size: 2rem; font-weight: 700; color: var(--primary-blue); text-align: center;">
                        ${data.length}
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Loss Event</h3>
                    <div class="action-buttons">
                        <button class="btn btn-warning" onclick="LossEvent.downloadTemplate()">
                            <i class="fas fa-download"></i> Unduh Template
                        </button>
                        <button class="btn btn-success" onclick="LossEvent.showImportModal()">
                            <i class="fas fa-upload"></i> Import Data
                        </button>
                        <button class="btn btn-primary" onclick="LossEvent.showAddModal()">
                            <i class="fas fa-plus"></i> Tambah Loss Event
                        </button>
                        <button class="btn btn-info" onclick="LossEvent.downloadReport()">
                            <i class="fas fa-file-pdf"></i> Unduh Laporan
                        </button>
                    </div>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Tanggal Kejadian</th>
                                <th>Deskripsi</th>
                                <th>Dampak Finansial</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.length === 0 ? '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>' : ''}
                            ${data.map(item => `
                                <tr>
                                    <td>${item.kode}</td>
                                    <td>${item.tanggal_kejadian}</td>
                                    <td>${item.deskripsi_kejadian?.substring(0, 50)}...</td>
                                    <td>Rp ${(parseFloat(item.dampak_finansial) || 0).toLocaleString('id-ID')}</td>
                                    <td><span class="badge-status badge-${item.status_penanganan === 'Sudah Ditangani' ? 'aman' : 'hati-hati'}">${item.status_penanganan}</span></td>
                                    <td>
                                        <button class="btn btn-edit btn-sm" onclick="LossEvent.edit('${item.id}')">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button class="btn btn-delete btn-sm" onclick="LossEvent.delete('${item.id}')">
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
        let kode = '';
        try {
            const kodeData = await apiCall('/api/loss-event/generate/kode');
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
                    <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Loss Event</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="loss-form-modal" onsubmit="LossEvent.save(event, '${id || ''}')">
                    <div class="form-group">
                        <label class="form-label">Kode *</label>
                        <input type="text" class="form-control" id="loss-kode" required 
                               value="${kode}" ${kode ? 'readonly' : ''}>
                        <small style="color: var(--gray-500);">${kode ? 'Kode otomatis digenerate' : ''}</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tanggal Kejadian *</label>
                        <input type="date" class="form-control" id="loss-tanggal" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Kategori Risiko</label>
                        <select class="form-control" id="loss-kategori">
                            <option value="">Pilih Kategori</option>
                            ${categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Risiko Terkait</label>
                        <select class="form-control" id="loss-risk">
                            <option value="">Pilih Risiko</option>
                            ${risks.map(r => `<option value="${r.id}">${r.kode_risiko}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Unit Kerja</label>
                        <select class="form-control" id="loss-unit">
                            <option value="">Pilih Unit Kerja</option>
                            ${units.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Deskripsi Kejadian *</label>
                        <textarea class="form-control" id="loss-deskripsi" required rows="4"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Penyebab</label>
                        <textarea class="form-control" id="loss-penyebab" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Dampak Finansial (Rp)</label>
                        <input type="number" class="form-control" id="loss-finansial" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Dampak Non Finansial</label>
                        <textarea class="form-control" id="loss-non-finansial" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tindakan Perbaikan</label>
                        <textarea class="form-control" id="loss-tindakan" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status Penanganan</label>
                        <select class="form-control" id="loss-status">
                            <option value="Belum Ditangani">Belum Ditangani</option>
                            <option value="Sedang Ditangani">Sedang Ditangani</option>
                            <option value="Sudah Ditangani">Sudah Ditangani</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tanggal Penanganan</label>
                        <input type="date" class="form-control" id="loss-tanggal-penanganan">
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
                kode: document.getElementById('loss-kode').value,
                tanggal_kejadian: document.getElementById('loss-tanggal').value,
                kategori_risiko_id: document.getElementById('loss-kategori').value || null,
                risk_input_id: document.getElementById('loss-risk').value || null,
                unit_kerja_id: document.getElementById('loss-unit').value || null,
                deskripsi_kejadian: document.getElementById('loss-deskripsi').value,
                penyebab: document.getElementById('loss-penyebab').value,
                dampak_finansial: parseFloat(document.getElementById('loss-finansial').value) || 0,
                dampak_non_finansial: document.getElementById('loss-non-finansial').value,
                tindakan_perbaikan: document.getElementById('loss-tindakan').value,
                status_penanganan: document.getElementById('loss-status').value,
                tanggal_penanganan: document.getElementById('loss-tanggal-penanganan').value || null
            };
            
            if (id) {
                await apiCall(`/api/loss-event/${id}`, { method: 'PUT', body: data });
                alert('Loss Event berhasil diupdate');
            } else {
                await apiCall('/api/loss-event', { method: 'POST', body: data });
                alert('Loss Event berhasil disimpan');
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
            await apiCall(`/api/loss-event/${id}`, { method: 'DELETE' });
            await this.load();
            alert('Data berhasil dihapus');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async edit(id) {
        let kode = '';
        try {
            const item = await apiCall(`/api/loss-event/${id}`);
            kode = item.kode;
        } catch (error) {
            console.error('Error loading data:', error);
        }
        await this.showModal(id, kode);
    },

    async loadForEdit(id) {
        try {
            const data = await apiCall(`/api/loss-event/${id}`);
            document.getElementById('loss-kode').value = data.kode || '';
            document.getElementById('loss-tanggal').value = data.tanggal_kejadian || '';
            document.getElementById('loss-kategori').value = data.kategori_risiko_id || '';
            document.getElementById('loss-risk').value = data.risk_input_id || '';
            document.getElementById('loss-unit').value = data.unit_kerja_id || '';
            document.getElementById('loss-deskripsi').value = data.deskripsi_kejadian || '';
            document.getElementById('loss-penyebab').value = data.penyebab || '';
            document.getElementById('loss-finansial').value = data.dampak_finansial || '';
            document.getElementById('loss-non-finansial').value = data.dampak_non_finansial || '';
            document.getElementById('loss-tindakan').value = data.tindakan_perbaikan || '';
            document.getElementById('loss-status').value = data.status_penanganan || 'Belum Ditangani';
            document.getElementById('loss-tanggal-penanganan').value = data.tanggal_penanganan || '';
        } catch (error) {
            alert('Error loading data: ' + error.message);
        }
    },

    async downloadTemplate() { alert('Fitur unduh template akan diimplementasikan'); },
    showImportModal() { alert('Fitur import akan diimplementasikan'); },
    async downloadReport() { alert('Fitur unduh laporan akan diimplementasikan'); }
};

window.lossEventModule = LossEvent;

