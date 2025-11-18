// Pengajuan Risiko Module
const PengajuanRisikoUI = {
    async load() {
        try {
            const data = await apiCall('/api/pengajuan-risiko');
            this.render(data);
        } catch (error) {
            console.error('Error loading pengajuan risiko:', error);
            document.getElementById('pengajuan-risiko-content').innerHTML =
                '<div class="card"><p>Error: ' + error.message + '</p></div>';
        }
    },

    render(data) {
        const content = document.getElementById('pengajuan-risiko-content');
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Pengajuan Risiko</h3>
                    <div class="action-buttons">
                        <button class="btn btn-warning" onclick="PengajuanRisikoUI.downloadTemplate()">
                            <i class="fas fa-download"></i> Unduh Template
                        </button>
                        <button class="btn btn-success" onclick="PengajuanRisikoUI.showImportModal()">
                            <i class="fas fa-upload"></i> Import Data
                        </button>
                        <button class="btn btn-primary" onclick="PengajuanRisikoUI.showAddModal()">
                            <i class="fas fa-plus"></i> Ajukan Risiko
                        </button>
                        <button class="btn btn-info" onclick="PengajuanRisikoUI.downloadReport()">
                            <i class="fas fa-file-pdf"></i> Unduh Laporan
                        </button>
                    </div>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Tanggal</th>
                                <th>Kategori</th>
                                <th>Unit Kerja</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.length === 0 ? '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>' : ''}
                            ${data.map(item => `
                                <tr>
                                    <td>${item.kode}</td>
                                    <td>${item.tanggal_pengajuan}</td>
                                    <td>${item.master_risk_categories?.name || '-'}</td>
                                    <td>${item.master_work_units?.name || '-'}</td>
                                    <td>
                                        <span class="badge-status badge-${this.getStatusBadge(item.status_pengajuan)}">${item.status_pengajuan}</span>
                                    </td>
                                    <td>
                                        <button class="btn btn-edit btn-sm" onclick="PengajuanRisikoUI.edit('${item.id}')">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        ${item.status_pengajuan === 'Menunggu Persetujuan' ? `
                                            <button class="btn btn-success btn-sm" onclick="PengajuanRisikoUI.approve('${item.id}', 'Disetujui')">
                                                <i class="fas fa-check"></i> Setuju
                                            </button>
                                            <button class="btn btn-warning btn-sm" onclick="PengajuanRisikoUI.approve('${item.id}', 'Ditolak')">
                                                <i class="fas fa-times"></i> Tolak
                                            </button>
                                        ` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    getStatusBadge(status) {
        switch(status) {
            case 'Disetujui': return 'aman';
            case 'Ditolak': return 'danger';
            default: return 'warning';
        }
    },

    async showAddModal() {
        let kode = '';
        try {
            const kodeData = await apiCall('/api/pengajuan-risiko/generate/kode');
            kode = kodeData.kode;
        } catch (error) {
            console.error('Error generating kode:', error);
        }
        await this.showModal(null, kode);
    },

    async showModal(id = null, kode = '') {
        const [categories, units] = await Promise.all([
            apiCall('/api/master-data/categories'),
            apiCall('/api/master-data/work-units')
        ]);

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:800px;">
                <div class="modal-header">
                    <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Pengajuan Risiko</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="pengajuan-form" onsubmit="PengajuanRisikoUI.save(event, '${id || ''}')">
                    <div class="form-group">
                        <label class="form-label">Kode *</label>
                        <input type="text" class="form-control" id="pengajuan-kode" required value="${kode}" ${kode ? 'readonly' : ''}>
                        <small style="color: var(--gray-500);">${kode ? 'Kode otomatis digenerate' : ''}</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tanggal Pengajuan *</label>
                        <input type="date" class="form-control" id="pengajuan-tanggal" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Kategori Risiko *</label>
                        <select class="form-control" id="pengajuan-kategori" required>
                            <option value="">Pilih Kategori</option>
                            ${categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Unit Kerja *</label>
                        <select class="form-control" id="pengajuan-unit" required>
                            <option value="">Pilih Unit Kerja</option>
                            ${units.map(unit => `<option value="${unit.id}">${unit.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Deskripsi Risiko *</label>
                        <textarea class="form-control" id="pengajuan-deskripsi" required rows="4"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Probabilitas (1-5)</label>
                        <input type="number" class="form-control" id="pengajuan-probabilitas" min="1" max="5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Dampak (1-5)</label>
                        <input type="number" class="form-control" id="pengajuan-dampak" min="1" max="5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Rekomendasi Penanganan</label>
                        <textarea class="form-control" id="pengajuan-rekomendasi" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status Pengajuan</label>
                        <select class="form-control" id="pengajuan-status">
                            <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                            <option value="Disetujui">Disetujui</option>
                            <option value="Ditolak">Ditolak</option>
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
            const probabilitas = parseInt(document.getElementById('pengajuan-probabilitas').value);
            const dampak = parseInt(document.getElementById('pengajuan-dampak').value);
            const data = {
                kode: document.getElementById('pengajuan-kode').value,
                tanggal_pengajuan: document.getElementById('pengajuan-tanggal').value,
                kategori_risiko_id: document.getElementById('pengajuan-kategori').value,
                unit_kerja_id: document.getElementById('pengajuan-unit').value,
                deskripsi_risiko: document.getElementById('pengajuan-deskripsi').value,
                probabilitas: probabilitas || null,
                dampak: dampak || null,
                nilai_risiko: probabilitas && dampak ? probabilitas * dampak : null,
                rekomendasi_penanganan: document.getElementById('pengajuan-rekomendasi').value,
                status_pengajuan: document.getElementById('pengajuan-status').value
            };

            if (id) {
                await apiCall(`/api/pengajuan-risiko/${id}`, { method: 'PUT', body: data });
            } else {
                await apiCall('/api/pengajuan-risiko', { method: 'POST', body: data });
            }

            document.querySelector('.modal').remove();
            await this.load();
            alert('Pengajuan risiko berhasil disimpan');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async approve(id, status) {
        const catatan = prompt('Catatan persetujuan (opsional):', '');
        try {
            await apiCall(`/api/pengajuan-risiko/${id}/approve`, {
                method: 'POST',
                body: { status, catatan_persetujuan: catatan }
            });
            await this.load();
            alert(`Pengajuan risiko berhasil ${status === 'Disetujui' ? 'disetujui' : 'ditolak'}`);
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async delete(id) {
        if (!confirm('Yakin ingin menghapus?')) return;
        try {
            await apiCall(`/api/pengajuan-risiko/${id}`, { method: 'DELETE' });
            await this.load();
            alert('Data berhasil dihapus');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async edit(id) {
        let kode = '';
        try {
            const item = await apiCall(`/api/pengajuan-risiko/${id}`);
            kode = item.kode;
        } catch (error) {
            console.error('Error loading data:', error);
        }
        await this.showModal(id, kode);
    },

    async loadForEdit(id) {
        try {
            const data = await apiCall(`/api/pengajuan-risiko/${id}`);
            document.getElementById('pengajuan-kode').value = data.kode || '';
            document.getElementById('pengajuan-tanggal').value = data.tanggal_pengajuan || '';
            document.getElementById('pengajuan-kategori').value = data.kategori_risiko_id || '';
            document.getElementById('pengajuan-unit').value = data.unit_kerja_id || '';
            document.getElementById('pengajuan-deskripsi').value = data.deskripsi_risiko || '';
            document.getElementById('pengajuan-probabilitas').value = data.probabilitas || '';
            document.getElementById('pengajuan-dampak').value = data.dampak || '';
            document.getElementById('pengajuan-rekomendasi').value = data.rekomendasi_penanganan || '';
            document.getElementById('pengajuan-status').value = data.status_pengajuan || 'Menunggu Persetujuan';
        } catch (error) {
            alert('Error loading data: ' + error.message);
        }
    },

    downloadTemplate() { alert('Fitur unduh template akan diimplementasikan'); },
    showImportModal() { alert('Fitur import akan diimplementasikan'); },
    downloadReport() { alert('Fitur unduh laporan akan diimplementasikan'); }
};

window.pengajuanRisikoModule = PengajuanRisikoUI;

