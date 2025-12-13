// Peluang Module
const Peluang = {
    async load() {
        try {
            const data = await apiCall('/api/peluang');
            this.render(data);
        } catch (error) {
            console.error('Error loading peluang:', error);
            document.getElementById('peluang-content').innerHTML = 
                '<div class="card"><p>Error: ' + error.message + '</p></div>';
        }
    },

    render(data) {
        const content = document.getElementById('peluang-content');
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Peluang</h3>
                    <div class="action-buttons">
                        <button class="btn btn-warning" onclick="Peluang.downloadTemplate()">
                            <i class="fas fa-download"></i> Unduh Template
                        </button>
                        <button class="btn btn-success" onclick="Peluang.showImportModal()">
                            <i class="fas fa-upload"></i> Import Data
                        </button>
                        <button class="btn btn-primary" onclick="Peluang.showAddModal()">
                            <i class="fas fa-plus"></i> Tambah Peluang
                        </button>
                        <button class="btn btn-info" onclick="Peluang.downloadReport()">
                            <i class="fas fa-file-pdf"></i> Unduh Laporan
                        </button>
                    </div>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Nama Peluang</th>
                                <th>Kategori</th>
                                <th>Nilai Peluang</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.length === 0 ? '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>' : ''}
                            ${data.map(item => `
                                <tr>
                                    <td>${item.kode}</td>
                                    <td>${item.nama_peluang}</td>
                                    <td>${item.master_risk_categories?.name || '-'}</td>
                                    <td>${item.nilai_peluang || '-'}</td>
                                    <td><span class="badge-status badge-${item.status === 'Aktif' ? 'aman' : 'secondary'}">${item.status}</span></td>
                                    <td>
                                        <button class="btn btn-edit btn-sm" onclick="Peluang.edit('${item.id}')">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button class="btn btn-delete btn-sm" onclick="Peluang.delete('${item.id}')">
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
            const kodeData = await apiCall('/api/peluang/generate/kode');
            kode = kodeData.kode;
        } catch (error) {
            console.error('Error generating kode:', error);
        }
        this.showModal(null, kode);
    },

    async showModal(id = null, kode = '') {
        // Load master data
        const categories = await apiCall('/api/master-data/categories');
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Peluang</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="peluang-form-modal" onsubmit="Peluang.save(event, '${id || ''}')">
                    <div class="form-group">
                        <label class="form-label">Kode *</label>
                        <input type="text" class="form-control" id="peluang-kode" required 
                               value="${kode}" ${kode ? 'readonly' : ''}>
                        <small style="color: var(--gray-500);">${kode ? 'Kode otomatis digenerate' : ''}</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nama Peluang *</label>
                        <input type="text" class="form-control" id="peluang-nama" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Kategori Peluang</label>
                        <select class="form-control" id="peluang-kategori">
                            <option value="">Pilih Kategori</option>
                            ${categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Deskripsi</label>
                        <textarea class="form-control" id="peluang-deskripsi" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Probabilitas (1-5)</label>
                        <input type="number" class="form-control" id="peluang-probabilitas" min="1" max="5" oninput="Peluang.calculateNilai()">
                        <small class="form-text text-muted">Kemungkinan peluang terjadi</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Dampak Positif (1-5)</label>
                        <input type="number" class="form-control" id="peluang-dampak" min="1" max="5" oninput="Peluang.calculateNilai()">
                        <small class="form-text text-muted">Dampak positif jika peluang direalisasikan</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nilai Peluang (Otomatis)</label>
                        <input type="number" class="form-control" id="peluang-nilai-display" readonly style="font-weight: bold; background: #f0f0f0;">
                        <small class="form-text text-muted">Nilai = Probabilitas × Dampak Positif</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Strategi Pemanfaatan</label>
                        <textarea class="form-control" id="peluang-strategi" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Pemilik Peluang</label>
                        <input type="text" class="form-control" id="peluang-pemilik">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select class="form-control" id="peluang-status">
                            <option value="Draft">Draft</option>
                            <option value="Aktif">Aktif</option>
                            <option value="Selesai">Selesai</option>
                        </select>
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
            const probabilitas = parseInt(document.getElementById('peluang-probabilitas').value) || 0;
            const dampak = parseInt(document.getElementById('peluang-dampak').value) || 0;
            
            // Auto-calculate nilai peluang
            const nilai_peluang = probabilitas && dampak ? probabilitas * dampak : null;
            
            const data = {
                kode: document.getElementById('peluang-kode').value,
                nama_peluang: document.getElementById('peluang-nama').value,
                kategori_peluang_id: document.getElementById('peluang-kategori').value || null,
                deskripsi: document.getElementById('peluang-deskripsi').value,
                probabilitas: probabilitas || null,
                dampak_positif: dampak || null,
                nilai_peluang: nilai_peluang,
                strategi_pemanfaatan: document.getElementById('peluang-strategi').value,
                pemilik_peluang: document.getElementById('peluang-pemilik').value,
                status: document.getElementById('peluang-status').value
            };
            
            console.log('Saving peluang with nilai:', nilai_peluang);
            
            if (id) {
                await apiCall(`/api/peluang/${id}`, { method: 'PUT', body: data });
                alert('Peluang berhasil diupdate dengan nilai: ' + nilai_peluang);
            } else {
                await apiCall('/api/peluang', { method: 'POST', body: data });
                alert('Peluang berhasil disimpan dengan nilai: ' + nilai_peluang);
            }
            
            document.querySelector('.modal').remove();
            await this.load();
        } catch (error) {
            console.error('Save error:', error);
            alert('Error: ' + error.message);
        }
    },

    async delete(id) {
        if (!confirm('Yakin ingin menghapus?')) return;
        try {
            await apiCall(`/api/peluang/${id}`, { method: 'DELETE' });
            await this.load();
            alert('Data berhasil dihapus');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async edit(id) {
        let kode = '';
        try {
            const item = await apiCall(`/api/peluang/${id}`);
            kode = item.kode;
        } catch (error) {
            console.error('Error loading data:', error);
        }
        await this.showModal(id, kode);
    },

    async loadForEdit(id) {
        try {
            const data = await apiCall(`/api/peluang/${id}`);
            document.getElementById('peluang-kode').value = data.kode || '';
            document.getElementById('peluang-nama').value = data.nama_peluang || '';
            document.getElementById('peluang-kategori').value = data.kategori_peluang_id || '';
            document.getElementById('peluang-deskripsi').value = data.deskripsi || '';
            document.getElementById('peluang-probabilitas').value = data.probabilitas || '';
            document.getElementById('peluang-dampak').value = data.dampak_positif || '';
            document.getElementById('peluang-strategi').value = data.strategi_pemanfaatan || '';
            document.getElementById('peluang-pemilik').value = data.pemilik_peluang || '';
            document.getElementById('peluang-status').value = data.status || 'Draft';
            this.calculateNilai();
        } catch (error) {
            alert('Error loading data: ' + error.message);
        }
    },

    calculateNilai() {
        const prob = parseInt(document.getElementById('peluang-probabilitas')?.value) || 0;
        const dampak = parseInt(document.getElementById('peluang-dampak')?.value) || 0;
        const nilai = prob * dampak;
        const display = document.getElementById('peluang-nilai-display');
        if (display) {
            display.value = nilai;
        }
    },

    async downloadTemplate() { alert('Fitur unduh template akan diimplementasikan'); },
    showImportModal() { alert('Fitur import akan diimplementasikan'); },
    async downloadReport() { alert('Fitur unduh laporan akan diimplementasikan'); }
};

window.peluangModule = Peluang;

