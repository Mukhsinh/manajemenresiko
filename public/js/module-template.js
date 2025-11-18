// Template Module dengan fitur lengkap: CRUD, Import/Export, Auto-generate Kode
// Copy template ini untuk membuat modul baru

const ModuleName = {
    async load() {
        try {
            const data = await apiCall('/api/module-name');
            this.render(data);
        } catch (error) {
            console.error('Error loading module:', error);
            document.getElementById('module-content').innerHTML = 
                '<div class="card"><p>Error: ' + error.message + '</p></div>';
        }
    },

    render(data) {
        const content = document.getElementById('module-content');
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Judul Modul</h3>
                    <div class="action-buttons">
                        <button class="btn btn-warning" onclick="ModuleName.downloadTemplate()">
                            <i class="fas fa-download"></i> Unduh Template
                        </button>
                        <button class="btn btn-success" onclick="ModuleName.showImportModal()">
                            <i class="fas fa-upload"></i> Import Data
                        </button>
                        <button class="btn btn-primary" onclick="ModuleName.showAddModal()">
                            <i class="fas fa-plus"></i> Tambah Data
                        </button>
                        <button class="btn btn-info" onclick="ModuleName.downloadReport()">
                            <i class="fas fa-file-pdf"></i> Unduh Laporan
                        </button>
                    </div>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>Nama</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="module-tbody">
                            ${this.renderTableRows(data)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderTableRows(data) {
        if (data.length === 0) {
            return '<tr><td colspan="3" class="text-center">Tidak ada data</td></tr>';
        }
        return data.map(item => `
            <tr>
                <td>${item.kode || '-'}</td>
                <td>${item.nama || '-'}</td>
                <td>
                    <button class="btn btn-edit btn-sm" onclick="ModuleName.edit('${item.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-delete btn-sm" onclick="ModuleName.delete('${item.id}')">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </td>
            </tr>
        `).join('');
    },

    async showAddModal() {
        // Generate kode otomatis
        let kode = '';
        try {
            const kodeData = await apiCall('/api/module-name/generate/kode');
            kode = kodeData.kode;
        } catch (error) {
            console.error('Error generating kode:', error);
        }

        this.showModal(null, kode);
    },

    showModal(id = null, kode = '') {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Data</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="module-form-modal" onsubmit="ModuleName.save(event, '${id || ''}')">
                    <div class="form-group">
                        <label class="form-label">Kode *</label>
                        <input type="text" class="form-control" id="module-kode" required 
                               value="${kode}" ${kode ? 'readonly' : ''}>
                        <small class="text-muted">${kode ? 'Kode otomatis digenerate' : ''}</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nama *</label>
                        <input type="text" class="form-control" id="module-nama" required>
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
                        <button type="submit" class="btn btn-primary">Simpan</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        if (id) {
            this.loadForEdit(id);
        }
    },

    async save(e, id) {
        e.preventDefault();
        try {
            const data = {
                kode: document.getElementById('module-kode').value,
                nama: document.getElementById('module-nama').value
            };
            
            if (id) {
                await apiCall(`/api/module-name/${id}`, { method: 'PUT', body: data });
            } else {
                await apiCall('/api/module-name', { method: 'POST', body: data });
            }
            
            document.querySelector('.modal').remove();
            await this.load();
            alert('Data berhasil disimpan');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async delete(id) {
        if (!confirm('Yakin ingin menghapus?')) return;
        try {
            await apiCall(`/api/module-name/${id}`, { method: 'DELETE' });
            await this.load();
            alert('Data berhasil dihapus');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async edit(id) {
        this.showModal(id);
    },

    async loadForEdit(id) {
        try {
            const data = await apiCall(`/api/module-name/${id}`);
            document.getElementById('module-kode').value = data.kode || '';
            document.getElementById('module-nama').value = data.nama || '';
        } catch (error) {
            alert('Error loading data: ' + error.message);
        }
    },

    async downloadTemplate() {
        try {
            const response = await fetch('/api/module-name/template');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'template-module-name.xlsx';
            a.click();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    showImportModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Import Data</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="import-form" onsubmit="ModuleName.importData(event)">
                    <div class="form-group">
                        <label class="form-label">Pilih File Excel</label>
                        <input type="file" class="form-control" id="import-file" accept=".xlsx,.xls" required>
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
                        <button type="submit" class="btn btn-primary">Import</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async importData(e) {
        e.preventDefault();
        // Implementation for import
        alert('Fitur import akan diimplementasikan');
    },

    async downloadReport() {
        try {
            const response = await fetch('/api/module-name/report');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'laporan-module-name.pdf';
            a.click();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
};

// Export
window.ModuleName = ModuleName;

