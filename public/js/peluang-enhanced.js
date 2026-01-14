// Enhanced Peluang Module with Fixed Edit/Delete Functions
const PeluangEnhanced = {
    currentData: [],
    
    async load() {
        try {
            console.log('=== LOADING PELUANG ENHANCED ===');
            let data;
            
            try {
                data = await apiCall('/api/peluang');
                console.log('Authenticated API success:', data?.length || 0);
            } catch (authError) {
                console.warn('Authenticated API failed, trying public endpoint:', authError.message);
                try {
                    data = await apiCall('/api/peluang/public');
                    console.log('Public API success:', data?.length || 0);
                } catch (publicError) {
                    console.warn('Public API failed, trying debug endpoint:', publicError.message);
                    try {
                        const debugResponse = await apiCall('/api/peluang/debug');
                        data = debugResponse.data || [];
                        console.log('Debug API success:', data?.length || 0);
                    } catch (debugError) {
                        console.error('All APIs failed:', debugError.message);
                        throw new Error('Tidak dapat memuat data peluang. Silakan refresh halaman.');
                    }
                }
            }
            
            this.currentData = data || [];
            this.render(this.currentData);
        } catch (error) {
            console.error('Error loading peluang:', error);
            this.showError(error.message);
        }
    },

    showError(message) {
        const content = document.getElementById('peluang-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error memuat data</h5>
                    <p>${message}</p>
                    <button onclick="PeluangEnhanced.load()" class="btn btn-primary">Coba Lagi</button>
                </div>
            </div>
        `;
    },

    getStatusClass(status) {
        if (!status) return 'status-default';
        const statusLower = status.toLowerCase().replace(/\s+/g, '-');
        const statusMap = {
            'aktif': 'status-aktif',
            'draft': 'status-draft',
            'selesai': 'status-selesai',
            'dalam-perencanaan': 'status-dalam-perencanaan',
            'dalam-implementasi': 'status-dalam-implementasi',
            'ditunda': 'status-ditunda',
            'dibatalkan': 'status-dibatalkan'
        };
        return statusMap[statusLower] || 'status-default';
    },

    render(data) {
        const content = document.getElementById('peluang-content');
        if (!content) return;
        
        // Inject CSS if not exists
        this.injectStyles();
        
        // Calculate statistics
        const totalPeluang = data.length;
        const peluangAktif = data.filter(d => d.status === 'Aktif').length;
        const peluangSelesai = data.filter(d => d.status === 'Selesai').length;
        const rataRata = totalPeluang > 0 
            ? (data.reduce((sum, d) => sum + (d.nilai_peluang || 0), 0) / totalPeluang).toFixed(1) 
            : 0;
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <h3 class="card-title" style="margin: 0;"><i class="fas fa-lightbulb"></i> Peluang</h3>
                    <div class="action-buttons" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-warning btn-sm" onclick="PeluangEnhanced.downloadTemplate()" title="Unduh Template">
                            <i class="fas fa-download"></i> Template
                        </button>
                        <button class="btn btn-success btn-sm" onclick="PeluangEnhanced.showImportModal()" title="Import Data">
                            <i class="fas fa-upload"></i> Import
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="PeluangEnhanced.showAddModal()" title="Tambah Peluang">
                            <i class="fas fa-plus"></i> Tambah
                        </button>
                        <button class="btn btn-info btn-sm" onclick="PeluangEnhanced.downloadReport()" title="Unduh Laporan">
                            <i class="fas fa-file-excel"></i> Laporan
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Statistics -->
                    <div class="peluang-stats-grid">
                        <div class="peluang-stat-card total">
                            <div class="peluang-stat-value">${totalPeluang}</div>
                            <div class="peluang-stat-label">Total Peluang</div>
                        </div>
                        <div class="peluang-stat-card aktif">
                            <div class="peluang-stat-value">${peluangAktif}</div>
                            <div class="peluang-stat-label">Peluang Aktif</div>
                        </div>
                        <div class="peluang-stat-card selesai">
                            <div class="peluang-stat-value">${peluangSelesai}</div>
                            <div class="peluang-stat-label">Peluang Selesai</div>
                        </div>
                        <div class="peluang-stat-card rata-rata">
                            <div class="peluang-stat-value">${rataRata}</div>
                            <div class="peluang-stat-label">Rata-rata Nilai</div>
                        </div>
                    </div>
                    
                    <!-- Table with Scroll -->
                    <div class="peluang-table-container">
                        <table class="peluang-table">
                            <thead>
                                <tr>
                                    <th>Kode</th>
                                    <th>Nama Peluang</th>
                                    <th>Kategori</th>
                                    <th style="text-align: center;">Probabilitas</th>
                                    <th style="text-align: center;">Dampak Positif</th>
                                    <th style="text-align: center;">Nilai Peluang</th>
                                    <th style="text-align: center;">Status</th>
                                    <th style="text-align: center;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.length === 0 ? `
                                    <tr>
                                        <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                                            <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                                            Tidak ada data peluang
                                        </td>
                                    </tr>
                                ` : data.map(item => `
                                    <tr data-id="${item.id}">
                                        <td><strong>${item.kode || '-'}</strong></td>
                                        <td>${item.nama_peluang || '-'}</td>
                                        <td>${item.master_risk_categories?.name || '-'}</td>
                                        <td style="text-align: center;">${item.probabilitas || '-'}</td>
                                        <td style="text-align: center;">${item.dampak_positif || '-'}</td>
                                        <td style="text-align: center;"><strong>${item.nilai_peluang || '-'}</strong></td>
                                        <td style="text-align: center;">
                                            <span class="status-badge ${this.getStatusClass(item.status)}">${item.status || 'Draft'}</span>
                                        </td>
                                        <td>
                                            <div class="action-btn-group">
                                                <button class="btn-action btn-edit-action" onclick="PeluangEnhanced.editItem('${item.id}')" title="Edit">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn-action btn-delete-action" onclick="PeluangEnhanced.deleteItem('${item.id}')" title="Hapus">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    injectStyles() {
        const styleId = 'peluang-enhanced-styles';
        if (document.getElementById(styleId)) return;
        
        const link = document.createElement('link');
        link.id = styleId;
        link.rel = 'stylesheet';
        link.href = '/css/peluang-enhanced.css';
        document.head.appendChild(link);
    },

    async showAddModal() {
        let kode = '';
        try {
            const kodeData = await apiCall('/api/peluang/generate/kode');
            kode = kodeData.kode;
        } catch (error) {
            console.error('Error generating kode:', error);
            kode = 'PLG-' + Date.now().toString().slice(-6);
        }
        this.showModal(null, kode);
    },

    async editItem(id) {
        console.log('Edit item called with ID:', id);
        if (!id) {
            alert('ID tidak valid');
            return;
        }
        
        try {
            // Show loading
            this.showLoading('Memuat data...');
            
            // Fetch item data
            const item = await apiCall(`/api/peluang/${id}`);
            console.log('Loaded item for edit:', item);
            
            if (!item) {
                throw new Error('Data tidak ditemukan');
            }
            
            // Close loading and show modal
            this.closeLoading();
            await this.showModal(id, item.kode, item);
            
        } catch (error) {
            console.error('Error loading item for edit:', error);
            this.closeLoading();
            alert('Gagal memuat data: ' + error.message);
        }
    },

    async deleteItem(id) {
        console.log('Delete item called with ID:', id);
        if (!id) {
            alert('ID tidak valid');
            return;
        }
        
        // Find item name for confirmation
        const item = this.currentData.find(d => d.id === id);
        const itemName = item?.nama_peluang || 'item ini';
        
        if (!confirm(`Yakin ingin menghapus "${itemName}"?`)) {
            return;
        }
        
        try {
            this.showLoading('Menghapus data...');
            
            await apiCall(`/api/peluang/${id}`, { method: 'DELETE' });
            
            this.closeLoading();
            alert('Data berhasil dihapus');
            
            // Reload data
            await this.load();
            
        } catch (error) {
            console.error('Error deleting item:', error);
            this.closeLoading();
            alert('Gagal menghapus data: ' + error.message);
        }
    },

    showLoading(message = 'Loading...') {
        const existing = document.getElementById('peluang-loading-modal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'peluang-loading-modal';
        modal.className = 'peluang-modal';
        modal.innerHTML = `
            <div class="peluang-modal-content" style="max-width: 300px; text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #3b82f6; margin-bottom: 16px;"></i>
                <p style="margin: 0; color: #374151;">${message}</p>
            </div>
        `;
        document.body.appendChild(modal);
    },

    closeLoading() {
        const modal = document.getElementById('peluang-loading-modal');
        if (modal) modal.remove();
    },

    async showModal(id = null, kode = '', existingData = null) {
        // Close any existing modal
        const existingModal = document.querySelector('.peluang-modal');
        if (existingModal) existingModal.remove();
        
        // Load categories
        let categories = [];
        try {
            categories = await apiCall('/api/master-data/categories');
        } catch (error) {
            console.warn('Could not load categories:', error);
        }
        
        const isEdit = !!id;
        const title = isEdit ? 'Edit Peluang' : 'Tambah Peluang';
        
        const modal = document.createElement('div');
        modal.className = 'peluang-modal';
        modal.id = 'peluang-form-modal';
        modal.innerHTML = `
            <div class="peluang-modal-content">
                <div class="peluang-modal-header">
                    <h3>${title}</h3>
                    <button class="peluang-modal-close" onclick="PeluangEnhanced.closeModal()">&times;</button>
                </div>
                <div class="peluang-modal-body">
                    <form id="peluang-form" onsubmit="PeluangEnhanced.saveForm(event, '${id || ''}')">
                        <div class="peluang-form-group">
                            <label class="peluang-form-label">Kode *</label>
                            <input type="text" class="peluang-form-control" id="form-kode" required 
                                   value="${kode}" ${kode ? 'readonly' : ''}>
                        </div>
                        <div class="peluang-form-group">
                            <label class="peluang-form-label">Nama Peluang *</label>
                            <input type="text" class="peluang-form-control" id="form-nama" required>
                        </div>
                        <div class="peluang-form-group">
                            <label class="peluang-form-label">Kategori</label>
                            <select class="peluang-form-control" id="form-kategori">
                                <option value="">Pilih Kategori</option>
                                ${categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="peluang-form-group">
                            <label class="peluang-form-label">Deskripsi</label>
                            <textarea class="peluang-form-control" id="form-deskripsi" rows="3"></textarea>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="peluang-form-group">
                                <label class="peluang-form-label">Probabilitas (1-5)</label>
                                <input type="number" class="peluang-form-control" id="form-probabilitas" 
                                       min="1" max="5" oninput="PeluangEnhanced.calculateNilai()">
                            </div>
                            <div class="peluang-form-group">
                                <label class="peluang-form-label">Dampak Positif (1-5)</label>
                                <input type="number" class="peluang-form-control" id="form-dampak" 
                                       min="1" max="5" oninput="PeluangEnhanced.calculateNilai()">
                            </div>
                        </div>
                        <div class="peluang-form-group">
                            <label class="peluang-form-label">Nilai Peluang (Otomatis)</label>
                            <input type="number" class="peluang-form-control" id="form-nilai" readonly 
                                   style="background: #f3f4f6; font-weight: bold;">
                        </div>
                        <div class="peluang-form-group">
                            <label class="peluang-form-label">Strategi Pemanfaatan</label>
                            <textarea class="peluang-form-control" id="form-strategi" rows="3"></textarea>
                        </div>
                        <div class="peluang-form-group">
                            <label class="peluang-form-label">Pemilik Peluang</label>
                            <input type="text" class="peluang-form-control" id="form-pemilik">
                        </div>
                        <div class="peluang-form-group">
                            <label class="peluang-form-label">Status</label>
                            <select class="peluang-form-control" id="form-status">
                                <option value="Draft">Draft</option>
                                <option value="Aktif">Aktif</option>
                                <option value="Dalam Perencanaan">Dalam Perencanaan</option>
                                <option value="Dalam Implementasi">Dalam Implementasi</option>
                                <option value="Selesai">Selesai</option>
                                <option value="Ditunda">Ditunda</option>
                                <option value="Dibatalkan">Dibatalkan</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="peluang-modal-footer">
                    <button type="button" class="btn-modal-cancel" onclick="PeluangEnhanced.closeModal()">Batal</button>
                    <button type="submit" form="peluang-form" class="btn-modal-save">
                        <i class="fas fa-save"></i> Simpan
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // If editing, populate form with existing data
        if (existingData) {
            this.populateForm(existingData);
        }
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = document.getElementById('form-nama');
            if (firstInput) firstInput.focus();
        }, 100);
    },

    populateForm(data) {
        document.getElementById('form-kode').value = data.kode || '';
        document.getElementById('form-nama').value = data.nama_peluang || '';
        document.getElementById('form-kategori').value = data.kategori_peluang_id || '';
        document.getElementById('form-deskripsi').value = data.deskripsi || '';
        document.getElementById('form-probabilitas').value = data.probabilitas || '';
        document.getElementById('form-dampak').value = data.dampak_positif || '';
        document.getElementById('form-strategi').value = data.strategi_pemanfaatan || '';
        document.getElementById('form-pemilik').value = data.pemilik_peluang || '';
        document.getElementById('form-status').value = data.status || 'Draft';
        this.calculateNilai();
    },

    closeModal() {
        const modal = document.getElementById('peluang-form-modal');
        if (modal) {
            modal.style.animation = 'modalSlideOut 0.2s ease';
            setTimeout(() => modal.remove(), 200);
        }
    },

    calculateNilai() {
        const prob = parseInt(document.getElementById('form-probabilitas')?.value) || 0;
        const dampak = parseInt(document.getElementById('form-dampak')?.value) || 0;
        const nilai = prob * dampak;
        const nilaiInput = document.getElementById('form-nilai');
        if (nilaiInput) {
            nilaiInput.value = nilai || '';
        }
    },

    async saveForm(e, id) {
        e.preventDefault();
        
        const probabilitas = parseInt(document.getElementById('form-probabilitas').value) || 0;
        const dampak = parseInt(document.getElementById('form-dampak').value) || 0;
        const nilai_peluang = probabilitas && dampak ? probabilitas * dampak : null;
        
        const data = {
            kode: document.getElementById('form-kode').value,
            nama_peluang: document.getElementById('form-nama').value,
            kategori_peluang_id: document.getElementById('form-kategori').value || null,
            deskripsi: document.getElementById('form-deskripsi').value,
            probabilitas: probabilitas || null,
            dampak_positif: dampak || null,
            nilai_peluang: nilai_peluang,
            strategi_pemanfaatan: document.getElementById('form-strategi').value,
            pemilik_peluang: document.getElementById('form-pemilik').value,
            status: document.getElementById('form-status').value
        };
        
        try {
            this.showLoading('Menyimpan data...');
            
            if (id) {
                await apiCall(`/api/peluang/${id}`, { method: 'PUT', body: data });
                this.closeLoading();
                alert('Peluang berhasil diupdate');
            } else {
                await apiCall('/api/peluang', { method: 'POST', body: data });
                this.closeLoading();
                alert('Peluang berhasil disimpan');
            }
            
            this.closeModal();
            await this.load();
            
        } catch (error) {
            console.error('Save error:', error);
            this.closeLoading();
            alert('Gagal menyimpan: ' + error.message);
        }
    },

    async downloadTemplate() {
        try {
            const templateData = [
                ['Kode', 'Nama Peluang', 'Kategori Peluang', 'Deskripsi', 'Probabilitas (1-5)', 'Dampak Positif (1-5)', 'Strategi Pemanfaatan', 'Pemilik Peluang', 'Status'],
                ['PLG-001', 'Peningkatan Efisiensi Operasional', 'Operasional', 'Implementasi sistem digital', '4', '5', 'Digitalisasi proses', 'Manager IT', 'Aktif'],
                ['PLG-002', 'Ekspansi Pasar Baru', 'Strategis', 'Membuka cabang baru', '3', '4', 'Riset pasar', 'Manager Marketing', 'Draft']
            ];
            
            const ws = XLSX.utils.aoa_to_sheet(templateData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Template Peluang');
            XLSX.writeFile(wb, 'template_peluang.xlsx');
            
            alert('Template berhasil diunduh!');
        } catch (error) {
            console.error('Error downloading template:', error);
            alert('Gagal mengunduh template');
        }
    },

    showImportModal() {
        const modal = document.createElement('div');
        modal.className = 'peluang-modal';
        modal.id = 'peluang-import-modal';
        modal.innerHTML = `
            <div class="peluang-modal-content" style="max-width: 500px;">
                <div class="peluang-modal-header">
                    <h3>Import Data Peluang</h3>
                    <button class="peluang-modal-close" onclick="document.getElementById('peluang-import-modal').remove()">&times;</button>
                </div>
                <div class="peluang-modal-body">
                    <div class="peluang-form-group">
                        <label class="peluang-form-label">Pilih File Excel (.xlsx)</label>
                        <input type="file" class="peluang-form-control" id="import-file" accept=".xlsx,.xls">
                    </div>
                    <div style="background: #eff6ff; padding: 12px; border-radius: 8px; margin-top: 12px;">
                        <p style="margin: 0; font-size: 0.875rem; color: #1e40af;">
                            <i class="fas fa-info-circle"></i> Unduh template terlebih dahulu untuk format yang benar
                        </p>
                    </div>
                </div>
                <div class="peluang-modal-footer">
                    <button class="btn-modal-cancel" onclick="document.getElementById('peluang-import-modal').remove()">Batal</button>
                    <button class="btn-modal-save" onclick="PeluangEnhanced.processImport()">
                        <i class="fas fa-upload"></i> Import
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async processImport() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput?.files[0];
        
        if (!file) {
            alert('Pilih file terlebih dahulu!');
            return;
        }
        
        try {
            this.showLoading('Mengimport data...');
            
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
                throw new Error('File tidak memiliki data yang valid');
            }
            
            const rows = data.slice(1);
            let successCount = 0;
            
            for (const row of rows) {
                if (row.length < 2) continue;
                
                const peluangData = {
                    kode: row[0],
                    nama_peluang: row[1],
                    deskripsi: row[3],
                    probabilitas: parseInt(row[4]) || null,
                    dampak_positif: parseInt(row[5]) || null,
                    strategi_pemanfaatan: row[6],
                    pemilik_peluang: row[7],
                    status: row[8] || 'Draft'
                };
                
                if (peluangData.probabilitas && peluangData.dampak_positif) {
                    peluangData.nilai_peluang = peluangData.probabilitas * peluangData.dampak_positif;
                }
                
                try {
                    await apiCall('/api/peluang', { method: 'POST', body: peluangData });
                    successCount++;
                } catch (err) {
                    console.error('Error importing row:', err);
                }
            }
            
            this.closeLoading();
            document.getElementById('peluang-import-modal')?.remove();
            alert(`Import selesai! ${successCount} data berhasil diimport.`);
            
            if (successCount > 0) {
                await this.load();
            }
        } catch (error) {
            console.error('Import error:', error);
            this.closeLoading();
            alert('Gagal mengimport: ' + error.message);
        }
    },

    async downloadReport() {
        try {
            if (this.currentData.length === 0) {
                alert('Tidak ada data untuk diunduh!');
                return;
            }
            
            const reportData = [
                ['LAPORAN PELUANG ORGANISASI'],
                ['Tanggal: ' + new Date().toLocaleDateString('id-ID')],
                [''],
                ['Kode', 'Nama Peluang', 'Kategori', 'Probabilitas', 'Dampak Positif', 'Nilai Peluang', 'Status']
            ];
            
            this.currentData.forEach(item => {
                reportData.push([
                    item.kode || '-',
                    item.nama_peluang || '-',
                    item.master_risk_categories?.name || '-',
                    item.probabilitas || '-',
                    item.dampak_positif || '-',
                    item.nilai_peluang || '-',
                    item.status || '-'
                ]);
            });
            
            const ws = XLSX.utils.aoa_to_sheet(reportData);
            ws['!cols'] = [
                { width: 12 }, { width: 30 }, { width: 15 },
                { width: 12 }, { width: 15 }, { width: 12 }, { width: 12 }
            ];
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Laporan Peluang');
            
            const fileName = `laporan_peluang_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            alert('Laporan berhasil diunduh!');
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Gagal mengunduh laporan');
        }
    }
};

// Override the original Peluang module
window.Peluang = PeluangEnhanced;
window.PeluangEnhanced = PeluangEnhanced;
window.peluangModule = PeluangEnhanced;
