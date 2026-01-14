// Visi Misi Module
async function loadVisiMisi() {
    try {
        console.log('Loading visi misi data...');
        
        // Show loading state
        const content = document.getElementById('visi-misi-content');
        if (content) {
            content.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Memuat data visi misi...</div>';
        }
        
        // Try multiple endpoints in order of preference
        let data;
        const endpoints = [
            '/api/visi-misi',
            '/api/simple/visi-misi', 
            '/api/debug-data/visi-misi',
            '/api/test-data/visi-misi'
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Trying endpoint: ${endpoint}`);
                const response = await apiCall(endpoint);
                console.log(`Visi misi response from ${endpoint}:`, response);
                
                // Handle different response formats
                if (response && response.success && response.data) {
                    data = response.data;
                } else if (Array.isArray(response)) {
                    data = response;
                } else if (response && typeof response === 'object') {
                    data = response;
                } else {
                    throw new Error('Invalid response format');
                }
                
                console.log(`Visi misi data processed from ${endpoint}:`, data);
                break;
            } catch (error) {
                console.warn(`Endpoint ${endpoint} failed:`, error.message);
                continue;
            }
        }
        
        if (!data) {
            throw new Error('Tidak dapat memuat data visi misi dari semua endpoint yang tersedia.');
        }
        
        if (!Array.isArray(data)) {
            console.warn('Data is not an array, converting:', data);
            data = Array.isArray(data) ? data : [];
        }
        
        renderVisiMisi(data);
    } catch (error) {
        console.error('Error loading visi misi:', error);
        const content = document.getElementById('visi-misi-content');
        if (content) {
            content.innerHTML = 
                '<div class="card"><div class="card-body"><h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error memuat visi misi</h5><p>' + error.message + '</p><button onclick="window.visiMisiModule.loadVisiMisi()" class="btn btn-primary">Coba Lagi</button><button onclick="loadTestVisiMisi()" class="btn btn-secondary">Muat Data Test</button></div></div>';
        }
    }
}

async function loadTestVisiMisi() {
    try {
        console.log('Loading test visi misi data...');
        
        const content = document.getElementById('visi-misi-content');
        if (content) {
            content.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Memuat data test...</div>';
        }
        
        const data = await apiCall('/api/test-data/visi-misi');
        console.log('Test visi misi data loaded:', data);
        
        if (!Array.isArray(data)) {
            throw new Error('Invalid test data format received from server');
        }
        
        renderVisiMisi(data);
    } catch (error) {
        console.error('Error loading test visi misi:', error);
        const content = document.getElementById('visi-misi-content');
        if (content) {
            content.innerHTML = 
                '<div class="card"><div class="card-body"><h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error memuat data test</h5><p>' + error.message + '</p></div></div>';
        }
    }
}

function renderVisiMisi(data) {
    const content = document.getElementById('visi-misi-content');
    
    // Helper function to format misi as numbered list
    const formatMisi = (misi) => {
        if (!misi) return '-';
        const lines = misi.split('\n').filter(line => line.trim().length > 0);
        if (lines.length === 0) return '-';
        if (lines.length === 1) return lines[0];
        return '<ol style="margin: 0; padding-left: 1.5rem;">' + 
               lines.map(line => `<li>${line}</li>`).join('') + 
               '</ol>';
    };
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header" style="background-color: #ffffff !important; color: #1e3a5f;">
                <button class="btn btn-success" id="btn-tambah-visi-misi" style="background-color: #28a745; color: #ffffff; border: 1px solid #28a745;">
                    <i class="fas fa-plus"></i> Tambah Visi Misi
                </button>
            </div>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th style="width: 80px;">Tahun</th>
                            <th style="width: 30%;">Visi</th>
                            <th style="width: 40%;">Misi</th>
                            <th style="width: 100px;">Status</th>
                            <th style="width: 100px;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="visi-misi-tbody">
                        ${data.length === 0 ? '<tr><td colspan="5" class="text-center">Tidak ada data</td></tr>' : ''}
                        ${data.map(item => `
                            <tr>
                                <td>${item.tahun}</td>
                                <td style="white-space: pre-wrap;">${item.visi || '-'}</td>
                                <td>${formatMisi(item.misi)}</td>
                                <td><span class="badge-status badge-${item.status === 'Aktif' ? 'aman' : 'secondary'}">${item.status}</span></td>
                                <td>
                                    <button class="btn btn-edit btn-sm" data-action="edit" data-id="${item.id}" title="Edit" style="padding: 0.4rem 0.6rem;">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-delete btn-sm" data-action="delete" data-id="${item.id}" title="Hapus" style="padding: 0.4rem 0.6rem;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Attach event listeners after rendering
    attachVisiMisiEventListeners();
}

function attachVisiMisiEventListeners() {
    // Tambah button
    const btnTambah = document.getElementById('btn-tambah-visi-misi');
    if (btnTambah) {
        btnTambah.addEventListener('click', () => showVisiMisiModal());
    }
    
    // Edit and delete buttons
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            editVisiMisi(id);
        });
    });
    
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            deleteVisiMisi(id);
        });
    });
}

function showVisiMisiModal(id = null) {
    // Modal implementation
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h3 class="modal-title">${id ? 'Edit' : 'Tambah'} Visi dan Misi</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <form id="visi-misi-form-modal" onsubmit="saveVisiMisi(event, '${id || ''}')">
                <div class="form-group">
                    <label class="form-label">Tahun *</label>
                    <input type="number" class="form-control" id="vm-tahun" required value="${new Date().getFullYear()}">
                </div>
                <div class="form-group">
                    <label class="form-label">Visi *</label>
                    <textarea class="form-control" id="vm-visi" required rows="3" placeholder="Menjadi rumah sakit umum daerah yang mandiri, inovatif, berkualitas dalam pelayanan, pendidikan dan penelitian"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Misi *</label>
                    <small class="form-hint" style="display: block; margin-bottom: 0.5rem;">Tambahkan misi satu per satu. Klik tombol + untuk menambah misi baru.</small>
                    <div id="misi-container">
                        <div class="misi-item" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <input type="text" class="form-control misi-input" placeholder="Misi 1" required>
                            <button type="button" class="btn btn-danger btn-sm" onclick="removeMisiField(this)" style="min-width: 40px;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="addMisiField()" style="margin-top: 0.5rem;">
                        <i class="fas fa-plus"></i> Tambah Misi
                    </button>
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-control" id="vm-status">
                        <option value="Aktif">Aktif</option>
                        <option value="Tidak Aktif">Tidak Aktif</option>
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
    
    if (id) {
        // Load data for edit
        loadVisiMisiForEdit(id);
    }
}

function addMisiField() {
    const container = document.getElementById('misi-container');
    const count = container.children.length + 1;
    const div = document.createElement('div');
    div.className = 'misi-item';
    div.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem;';
    div.innerHTML = `
        <input type="text" class="form-control misi-input" placeholder="Misi ${count}" required>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeMisiField(this)" style="min-width: 40px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(div);
}

function removeMisiField(button) {
    const container = document.getElementById('misi-container');
    if (container.children.length > 1) {
        button.closest('.misi-item').remove();
        // Update placeholders
        const inputs = container.querySelectorAll('.misi-input');
        inputs.forEach((input, index) => {
            input.placeholder = `Misi ${index + 1}`;
        });
    } else {
        alert('Minimal harus ada 1 misi');
    }
}

async function saveVisiMisi(e, id) {
    e.preventDefault();
    try {
        // Collect all misi inputs
        const misiInputs = document.querySelectorAll('.misi-input');
        const misiArray = Array.from(misiInputs)
            .map(input => input.value.trim())
            .filter(value => value.length > 0);
        
        if (misiArray.length === 0) {
            alert('Minimal harus ada 1 misi');
            return;
        }
        
        // Join with newline for storage
        const misiFormatted = misiArray.join('\n');
        
        const data = {
            tahun: parseInt(document.getElementById('vm-tahun').value),
            visi: document.getElementById('vm-visi').value,
            misi: misiFormatted,
            status: document.getElementById('vm-status').value
        };
        
        if (id) {
            await apiCall(`/api/visi-misi/${id}`, { method: 'PUT', body: data });
        } else {
            await apiCall('/api/visi-misi', { method: 'POST', body: data });
        }
        
        document.querySelector('.modal').remove();
        await loadVisiMisi();
        alert('Visi Misi berhasil disimpan');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteVisiMisi(id) {
    if (!confirm('Yakin ingin menghapus?')) return;
    try {
        await apiCall(`/api/visi-misi/${id}`, { method: 'DELETE' });
        await loadVisiMisi();
        alert('Visi Misi berhasil dihapus');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function editVisiMisi(id) {
    showVisiMisiModal(id);
}

async function loadVisiMisiForEdit(id) {
    try {
        const data = await apiCall(`/api/visi-misi/${id}`);
        document.getElementById('vm-tahun').value = data.tahun;
        document.getElementById('vm-visi').value = data.visi;
        document.getElementById('vm-status').value = data.status;
        
        // Load misi fields
        const container = document.getElementById('misi-container');
        container.innerHTML = ''; // Clear existing
        
        const misiArray = data.misi ? data.misi.split('\n').filter(line => line.trim()) : [''];
        if (misiArray.length === 0) misiArray.push('');
        
        misiArray.forEach((misi, index) => {
            const div = document.createElement('div');
            div.className = 'misi-item';
            div.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem;';
            div.innerHTML = `
                <input type="text" class="form-control misi-input" placeholder="Misi ${index + 1}" value="${misi}" required>
                <button type="button" class="btn btn-danger btn-sm" onclick="removeMisiField(this)" style="min-width: 40px;">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        alert('Error loading data: ' + error.message);
    }
}

// Export
window.visiMisiModule = { loadVisiMisi };
window.addMisiField = addMisiField;
window.removeMisiField = removeMisiField;

