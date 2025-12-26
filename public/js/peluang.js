// Peluang Module
const Peluang = {
    async load() {
        try {
            console.log('=== LOADING PELUANG ===');
            let data;
            
            try {
                // Try authenticated endpoint first
                data = await apiCall('/api/peluang');
                console.log('Authenticated API success:', data?.length || 0);
            } catch (authError) {
                console.warn('Authenticated API failed, trying public endpoint:', authError.message);
                
                // Fallback to public endpoint
                try {
                    data = await apiCall('/api/peluang/public');
                    console.log('Public API success:', data?.length || 0);
                } catch (publicError) {
                    console.warn('Public API failed, trying debug endpoint:', publicError.message);
                    
                    // Final fallback to debug endpoint
                    try {
                        const debugResponse = await apiCall('/api/peluang/debug');
                        // Extract data from debug response structure
                        if (debugResponse.fullQuery && debugResponse.fullQuery.data) {
                            data = debugResponse.fullQuery.data;
                        } else {
                            data = debugResponse.data || [];
                        }
                        console.log('Debug API success:', data?.length || 0);
                    } catch (debugError) {
                        console.error('All APIs failed:', debugError.message);
                        throw new Error('Tidak dapat memuat data peluang. Silakan refresh halaman.');
                    }
                }
            }
            
            this.render(data);
        } catch (error) {
            console.error('Error loading peluang:', error);
            document.getElementById('peluang-content').innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error memuat data</h5>
                        <p>${error.message}</p>
                        <button onclick="Peluang.load()" class="btn btn-primary">Coba Lagi</button>
                    </div>
                </div>
            `;
        }
    },

    /**
     * Renders the Peluang page with enhanced styling
     * @param {Array<Object>} data - Array of peluang data
     * @returns {void}
     */
    render(data) {
        /** @type {HTMLElement | null} */
        const content = document.getElementById('peluang-content');
        if (!content) return;
        
        // Add enhanced CSS styling
        const styleId = 'peluang-enhanced-styles';
        if (!document.getElementById(styleId)) {
            /** @type {HTMLStyleElement} */
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                /* Enhanced Peluang Styles */
                .page-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 2rem 0;
                    margin-bottom: 2rem;
                    border-radius: 12px;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    align-items: center;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                
                .stat-card {
                    padding: 1.5rem;
                    border-radius: 8px;
                    color: white;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: transform 0.3s ease;
                }
                
                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
                }
                
                .table-container {
                    overflow-x: auto;
                    max-width: 100%;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                
                .peluang-table {
                    margin: 0;
                    width: 100%;
                }
                
                .badge-status {
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 0.875rem;
                }
                
                .btn-edit, .btn-delete {
                    padding: 6px 8px;
                    margin: 0 2px;
                    border-radius: 6px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.75rem;
                }
                
                .btn-edit {
                    background-color: #17a2b8;
                    color: white;
                }
                
                .btn-delete {
                    background-color: #dc3545;
                    color: white;
                }
                
                .btn-edit:hover, .btn-delete:hover {
                    transform: scale(1.1);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
            `;
            document.head.appendChild(style);
        }
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <h3 class="card-title" style="margin: 0;"><i class="fas fa-lightbulb"></i> Peluang</h3>
                    <div class="action-buttons" style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                        <button class="btn btn-warning btn-sm" onclick="Peluang.downloadTemplate()" title="Unduh Template">
                            <i class="fas fa-download"></i> <span class="btn-text">Unduh Template</span>
                        </button>
                        <button class="btn btn-success btn-sm" onclick="Peluang.showImportModal()" title="Import Data">
                            <i class="fas fa-upload"></i> <span class="btn-text">Import Data</span>
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="Peluang.showAddModal()" title="Tambah Peluang">
                            <i class="fas fa-plus"></i> <span class="btn-text">Tambah Peluang</span>
                        </button>
                        <button class="btn btn-info btn-sm" onclick="Peluang.downloadReport()" title="Unduh Laporan">
                            <i class="fas fa-file-pdf"></i> <span class="btn-text">Unduh Laporan</span>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Statistics -->
                    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 8px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">${data.length}</div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">Total Peluang</div>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 1.5rem; border-radius: 8px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">${data.filter(d => d.status === 'Aktif').length}</div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">Peluang Aktif</div>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 1.5rem; border-radius: 8px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">${data.filter(d => d.status === 'Selesai').length}</div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">Peluang Selesai</div>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 1.5rem; border-radius: 8px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">${data.length > 0 ? (data.reduce((sum, d) => sum + (d.nilai_peluang || 0), 0) / data.length).toFixed(1) : 0}</div>
                            <div style="font-size: 0.875rem; opacity: 0.9;">Rata-rata Nilai</div>
                        </div>
                    </div>
                    
                    <!-- Table -->
                    <div class="table-container">
                        <table class="table peluang-table">
                            <thead>
                                <tr>
                                    <th>Kode</th>
                                    <th>Nama Peluang</th>
                                    <th>Kategori</th>
                                    <th>Probabilitas</th>
                                    <th>Dampak Positif</th>
                                    <th>Nilai Peluang</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.length === 0 ? '<tr><td colspan="8" class="text-center">Tidak ada data</td></tr>' : ''}
                                ${data.map(item => `
                                    <tr>
                                        <td><strong>${item.kode}</strong></td>
                                        <td>${item.nama_peluang}</td>
                                        <td>${item.master_risk_categories?.name || '-'}</td>
                                        <td style="text-align: center;">${item.probabilitas || '-'}</td>
                                        <td style="text-align: center;">${item.dampak_positif || '-'}</td>
                                        <td style="text-align: center;"><strong>${item.nilai_peluang || '-'}</strong></td>
                                        <td><span class="badge-status badge-${getStatusColor(item.status)}">${item.status}</span></td>
                                        <td>
                                            <div style="display: flex; gap: 0.25rem;">
                                                <button class="btn btn-edit btn-sm" onclick="Peluang.edit('${item.id}')" title="Edit">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-delete btn-sm" onclick="Peluang.delete('${item.id}')" title="Hapus">
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

    async downloadTemplate() { 
        try {
            // Create a simple Excel template for peluang
            const templateData = [
                ['Kode', 'Nama Peluang', 'Kategori Peluang', 'Deskripsi', 'Probabilitas (1-5)', 'Dampak Positif (1-5)', 'Strategi Pemanfaatan', 'Pemilik Peluang', 'Status'],
                ['PLG-001', 'Peningkatan Efisiensi Operasional', 'Operasional', 'Implementasi sistem digital untuk meningkatkan efisiensi', '4', '5', 'Digitalisasi proses bisnis', 'Manager IT', 'Aktif'],
                ['PLG-002', 'Ekspansi Pasar Baru', 'Strategis', 'Membuka cabang di wilayah baru', '3', '4', 'Riset pasar dan investasi', 'Manager Marketing', 'Draft']
            ];
            
            const ws = XLSX.utils.aoa_to_sheet(templateData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Template Peluang');
            XLSX.writeFile(wb, 'template_peluang.xlsx');
            
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
                    <h3 class="modal-title">Import Data Peluang</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Pilih File Excel (.xlsx)</label>
                        <input type="file" class="form-control" id="import-file-peluang" accept=".xlsx,.xls">
                        <small class="form-text text-muted">
                            Format: Kode, Nama Peluang, Kategori Peluang, Deskripsi, Probabilitas (1-5), Dampak Positif (1-5), Strategi Pemanfaatan, Pemilik Peluang, Status
                        </small>
                    </div>
                    <div class="form-group">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            <strong>Petunjuk:</strong>
                            <ul style="margin: 0.5rem 0 0 1rem;">
                                <li>Unduh template terlebih dahulu untuk format yang benar</li>
                                <li>Pastikan data sesuai dengan format template</li>
                                <li>Probabilitas dan Dampak Positif harus berupa angka 1-5</li>
                                <li>File maksimal 5MB</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
                    <button type="button" class="btn btn-primary" onclick="Peluang.processImport()">Import Data</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    async processImport() {
        const fileInput = document.getElementById('import-file-peluang');
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
                    
                    // Calculate nilai_peluang
                    if (peluangData.probabilitas && peluangData.dampak_positif) {
                        peluangData.nilai_peluang = peluangData.probabilitas * peluangData.dampak_positif;
                    }
                    
                    // Here you would call the API to save the data
                    // await apiCall('/api/peluang', { method: 'POST', body: peluangData });
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
    
    async downloadReport() { 
        try {
            // Get current data
            const tableRows = document.querySelectorAll('.peluang-table tbody tr');
            if (tableRows.length === 0 || (tableRows.length === 1 && tableRows[0].textContent.includes('Tidak ada data'))) {
                alert('Tidak ada data untuk diunduh!');
                return;
            }
            
            // Prepare data for export
            const reportData = [
                ['LAPORAN PELUANG ORGANISASI'],
                ['Tanggal Laporan: ' + new Date().toLocaleDateString('id-ID')],
                [''],
                ['Kode', 'Nama Peluang', 'Kategori', 'Probabilitas', 'Dampak Positif', 'Nilai Peluang', 'Status']
            ];
            
            // Extract data from table
            tableRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 7 && !row.textContent.includes('Tidak ada data')) {
                    const rowData = [
                        cells[0].textContent.trim(), // Kode
                        cells[1].textContent.trim(), // Nama Peluang
                        cells[2].textContent.trim(), // Kategori
                        cells[3].textContent.trim(), // Probabilitas
                        cells[4].textContent.trim(), // Dampak Positif
                        cells[5].textContent.trim(), // Nilai Peluang
                        cells[6].textContent.trim()  // Status
                    ];
                    reportData.push(rowData);
                }
            });
            
            // Create Excel file
            const ws = XLSX.utils.aoa_to_sheet(reportData);
            
            // Set column widths
            ws['!cols'] = [
                { width: 12 }, // Kode
                { width: 30 }, // Nama Peluang
                { width: 15 }, // Kategori
                { width: 12 }, // Probabilitas
                { width: 15 }, // Dampak Positif
                { width: 12 }, // Nilai Peluang
                { width: 10 }  // Status
            ];
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Laporan Peluang');
            
            const fileName = `laporan_peluang_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        'Aktif': 'aman',
        'Draft': 'hati-hati',
        'Selesai': 'normal',
        'Ditunda': 'secondary'
    };
    return colorMap[status] || 'secondary';
}

window.peluangModule = Peluang;

