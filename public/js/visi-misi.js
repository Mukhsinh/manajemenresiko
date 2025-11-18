// Visi Misi Module
async function loadVisiMisi() {
    try {
        const data = await apiCall('/api/visi-misi');
        renderVisiMisi(data);
    } catch (error) {
        console.error('Error loading visi misi:', error);
        document.getElementById('visi-misi-content').innerHTML = 
            '<div class="card"><p>Error: ' + error.message + '</p></div>';
    }
}

function renderVisiMisi(data) {
    const content = document.getElementById('visi-misi-content');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Visi dan Misi Organisasi</h3>
                <button class="btn btn-primary" onclick="showVisiMisiModal()">
                    <i class="fas fa-plus"></i> Tambah Visi Misi
                </button>
            </div>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Tahun</th>
                            <th>Visi</th>
                            <th>Misi</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="visi-misi-tbody">
                        ${data.length === 0 ? '<tr><td colspan="5" class="text-center">Tidak ada data</td></tr>' : ''}
                        ${data.map(item => `
                            <tr>
                                <td>${item.tahun}</td>
                                <td>${item.visi}</td>
                                <td>${item.misi}</td>
                                <td><span class="badge-status badge-${item.status === 'Aktif' ? 'aman' : 'secondary'}">${item.status}</span></td>
                                <td>
                                    <button class="btn btn-edit btn-sm" onclick="editVisiMisi('${item.id}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-delete btn-sm" onclick="deleteVisiMisi('${item.id}')">
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
}

function showVisiMisiModal(id = null) {
    // Modal implementation
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
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
                    <textarea class="form-control" id="vm-visi" required rows="4"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Misi *</label>
                    <textarea class="form-control" id="vm-misi" required rows="6"></textarea>
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

async function saveVisiMisi(e, id) {
    e.preventDefault();
    try {
        const data = {
            tahun: parseInt(document.getElementById('vm-tahun').value),
            visi: document.getElementById('vm-visi').value,
            misi: document.getElementById('vm-misi').value,
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
        document.getElementById('vm-misi').value = data.misi;
        document.getElementById('vm-status').value = data.status;
    } catch (error) {
        alert('Error loading data: ' + error.message);
    }
}

// Export
window.visiMisiModule = { loadVisiMisi };

