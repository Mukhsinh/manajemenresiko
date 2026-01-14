/**
 * Sasaran Strategi Module - Complete Fixed Version
 * Features:
 * - Scrollable table (vertical & horizontal)
 * - Working Edit/Delete buttons
 * - Bright solid color badges for perspektif
 * - Fixed column for badge overflow
 */
const SasaranStrategiModule = (() => {
  const state = {
    data: [],
    rencanaStrategis: [],
    towsStrategi: [],
    editingId: null,
    filters: {
      rencana_strategis_id: '',
      tows_strategi_id: '',
      perspektif: ''
    }
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);

  // Bright solid colors for perspektif badges
  const perspektifColors = {
    'LG': { bg: '#10B981', label: 'Learning & Growth' },
    'ES': { bg: '#3B82F6', label: 'Eksternal Stakeholder' },
    'IBP': { bg: '#8B5CF6', label: 'Internal Business Process' },
    'Fin': { bg: '#F59E0B', label: 'Financial' }
  };

  // Bright solid colors for TOWS badges
  const towsColors = {
    'SO': '#059669',
    'WO': '#0891B2',
    'ST': '#D97706',
    'WT': '#E11D48'
  };

  async function load() {
    console.log('Loading Sasaran Strategi module...');
    injectStyles();
    await fetchData();
    render();
    attachEventListeners();
  }

  function injectStyles() {
    const styleId = 'sasaran-strategi-module-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .ss-container { padding: 20px; background: #fff; border-radius: 8px; }
      .ss-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .ss-header h2 { margin: 0; color: #1e3a5f; font-size: 24px; }
      .ss-btn-add { background: #3B82F6; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; }
      .ss-btn-add:hover { background: #2563EB; }
      
      /* Scrollable Table */
      .ss-table-wrapper { width: 100%; max-height: calc(100vh - 300px); min-height: 400px; overflow: auto; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
      .ss-table-wrapper::-webkit-scrollbar { width: 10px; height: 10px; }
      .ss-table-wrapper::-webkit-scrollbar-track { background: #f1f5f9; }
      .ss-table-wrapper::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 5px; }
      .ss-table-wrapper::-webkit-scrollbar-thumb:hover { background: #64748b; }
      
      .ss-table { width: 100%; min-width: 1100px; border-collapse: collapse; }
      .ss-table thead { position: sticky; top: 0; z-index: 10; background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); }
      .ss-table th { padding: 14px 12px; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #fff; text-align: left; white-space: nowrap; }
      .ss-table tbody tr { border-bottom: 1px solid #e8e8e8; transition: background 0.2s; }
      .ss-table tbody tr:hover { background: #f0f7ff; }
      .ss-table td { padding: 12px; font-size: 13px; color: #333; vertical-align: middle; }
      
      /* Column widths */
      .ss-col-no { width: 50px; text-align: center; }
      .ss-col-rencana { width: 180px; }
      .ss-col-sasaran { width: 280px; }
      .ss-col-perspektif { width: 200px; text-align: center; }
      .ss-col-tows { width: 280px; }
      .ss-col-aksi { width: 120px; text-align: center; }
      
      /* Badges */
      .ss-badge { display: inline-block; padding: 6px 12px; font-size: 11px; font-weight: 700; border-radius: 6px; color: #fff; text-transform: uppercase; white-space: nowrap; }
      .ss-badge-tows { padding: 4px 10px; font-size: 10px; margin-bottom: 4px; border-radius: 4px; }
      .ss-tows-text { font-size: 12px; color: #555; line-height: 1.4; margin-top: 4px; }
      
      /* Action Buttons */
      .ss-actions { display: flex; gap: 8px; justify-content: center; }
      .ss-btn-edit, .ss-btn-delete { width: 36px; height: 36px; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
      .ss-btn-edit { background: #FBBF24; color: #1F2937; }
      .ss-btn-edit:hover { background: #F59E0B; transform: translateY(-2px); }
      .ss-btn-delete { background: #EF4444; color: #fff; }
      .ss-btn-delete:hover { background: #DC2626; transform: translateY(-2px); }
      
      /* Modal */
      .ss-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; }
      .ss-modal-content { background: #fff; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
      .ss-modal-header { padding: 20px; background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center; }
      .ss-modal-header h3 { margin: 0; color: #fff; font-size: 18px; }
      .ss-modal-close { background: rgba(255,255,255,0.2); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 20px; }
      .ss-modal-body { padding: 24px; }
      .ss-form-group { margin-bottom: 20px; }
      .ss-form-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #374151; }
      .ss-form-group select, .ss-form-group input, .ss-form-group textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
      .ss-form-group textarea { min-height: 100px; resize: vertical; }
      .ss-modal-footer { padding: 16px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px; background: #f9fafb; border-radius: 0 0 12px 12px; }
      .ss-btn-cancel { padding: 10px 20px; background: #6B7280; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
      .ss-btn-save { padding: 10px 20px; background: #3B82F6; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
      .ss-btn-cancel:hover { background: #4B5563; }
      .ss-btn-save:hover { background: #2563EB; }
      
      /* Filter */
      .ss-filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; }
      .ss-filter-group label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; text-transform: uppercase; }
      .ss-filter-group select { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; }
      
      /* Empty state */
      .ss-empty { text-align: center; padding: 60px 20px; color: #64748b; }
      .ss-empty i { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
    `;
    document.head.appendChild(style);
  }

  async function fetchData() {
    try {
      console.log('Fetching sasaran strategi data...');
      let sasaran = [], rencana = [], tows = [];
      
      try {
        const results = await Promise.all([
          api()('/api/sasaran-strategi'),
          api()('/api/rencana-strategis'),
          api()('/api/matriks-tows')
        ]);
        sasaran = results[0] || [];
        rencana = results[1] || [];
        tows = results[2] || [];
      } catch (e) {
        console.warn('Auth API failed, trying fallback endpoints');
        try {
          const fallbackResults = await Promise.all([
            api()('/api/sasaran-strategi/simple'),
            api()('/api/rencana-strategis/simple'),
            api()('/api/matriks-tows/simple')
          ]);
          sasaran = fallbackResults[0] || [];
          rencana = fallbackResults[1] || [];
          tows = fallbackResults[2] || [];
        } catch (e2) {
          console.error('Fallback also failed:', e2);
        }
      }
      
      state.data = Array.isArray(sasaran) ? sasaran : [];
      state.rencanaStrategis = Array.isArray(rencana) ? rencana : [];
      state.towsStrategi = Array.isArray(tows) ? tows : [];
      
      console.log('Data loaded:', state.data.length, 'sasaran items');
    } catch (error) {
      console.error('Error fetching data:', error);
      state.data = [];
    }
  }


  function render() {
    const container = document.getElementById('sasaran-strategi-content') || 
                      document.querySelector('.main-content') ||
                      document.querySelector('#main-content');
    
    if (!container) {
      console.error('Container not found for Sasaran Strategi');
      return;
    }

    const html = `
      <div class="ss-container">
        <div class="ss-header">
          <h2><i class="fas fa-bullseye"></i> Sasaran Strategi</h2>
          <button class="ss-btn-add" id="ss-btn-add">
            <i class="fas fa-plus"></i> Tambah Sasaran
          </button>
        </div>
        
        <div class="ss-filters">
          <div class="ss-filter-group">
            <label>Rencana Strategis</label>
            <select id="ss-filter-rencana">
              <option value="">Semua Rencana</option>
              ${state.rencanaStrategis.map(r => `<option value="${r.id}">${r.nama_rencana || r.kode || 'N/A'}</option>`).join('')}
            </select>
          </div>
          <div class="ss-filter-group">
            <label>Perspektif</label>
            <select id="ss-filter-perspektif">
              <option value="">Semua Perspektif</option>
              <option value="LG">Learning & Growth</option>
              <option value="ES">Eksternal Stakeholder</option>
              <option value="IBP">Internal Business Process</option>
              <option value="Fin">Financial</option>
            </select>
          </div>
        </div>
        
        <div class="ss-table-wrapper">
          <table class="ss-table">
            <thead>
              <tr>
                <th class="ss-col-no">No</th>
                <th class="ss-col-rencana">Rencana Strategis</th>
                <th class="ss-col-sasaran">Sasaran Strategi</th>
                <th class="ss-col-perspektif">Perspektif</th>
                <th class="ss-col-tows">TOWS Strategi</th>
                <th class="ss-col-aksi">Aksi</th>
              </tr>
            </thead>
            <tbody id="ss-table-body">
              ${renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    attachEventListeners();
  }

  function renderTableRows() {
    if (!state.data || state.data.length === 0) {
      return `<tr><td colspan="6" class="ss-empty"><i class="fas fa-inbox"></i><p>Tidak ada data sasaran strategi</p></td></tr>`;
    }

    return state.data.map((item, index) => {
      const perspektif = item.perspektif || '-';
      const pConfig = perspektifColors[perspektif] || { bg: '#6B7280', label: perspektif };
      
      const towsType = item.swot_tows_strategi?.tipe_strategi || '';
      const towsText = item.swot_tows_strategi?.strategi || '-';
      const towsColor = towsColors[towsType] || '#6B7280';
      
      return `
        <tr data-id="${item.id}">
          <td class="ss-col-no">${index + 1}</td>
          <td class="ss-col-rencana">${item.rencana_strategis?.nama_rencana || '-'}</td>
          <td class="ss-col-sasaran">${item.sasaran || '-'}</td>
          <td class="ss-col-perspektif">
            <span class="ss-badge" style="background: ${pConfig.bg}">${pConfig.label}</span>
          </td>
          <td class="ss-col-tows">
            ${towsType ? `<span class="ss-badge ss-badge-tows" style="background: ${towsColor}">${towsType}</span>` : ''}
            <span class="ss-tows-text">${towsText}</span>
          </td>
          <td class="ss-col-aksi">
            <div class="ss-actions">
              <button class="ss-btn-edit" data-id="${item.id}" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="ss-btn-delete" data-id="${item.id}" title="Hapus">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function attachEventListeners() {
    // Add button
    const addBtn = document.getElementById('ss-btn-add');
    if (addBtn) {
      addBtn.onclick = () => openModal();
    }

    // Filter handlers
    const filterRencana = document.getElementById('ss-filter-rencana');
    const filterPerspektif = document.getElementById('ss-filter-perspektif');
    
    if (filterRencana) {
      filterRencana.onchange = (e) => {
        state.filters.rencana_strategis_id = e.target.value;
        applyFilters();
      };
    }
    
    if (filterPerspektif) {
      filterPerspektif.onchange = (e) => {
        state.filters.perspektif = e.target.value;
        applyFilters();
      };
    }

    // Edit and Delete buttons - using event delegation
    const tableBody = document.getElementById('ss-table-body');
    if (tableBody) {
      tableBody.onclick = (e) => {
        const editBtn = e.target.closest('.ss-btn-edit');
        const deleteBtn = e.target.closest('.ss-btn-delete');
        
        if (editBtn) {
          const id = editBtn.dataset.id;
          console.log('Edit clicked for ID:', id);
          handleEdit(id);
        }
        
        if (deleteBtn) {
          const id = deleteBtn.dataset.id;
          console.log('Delete clicked for ID:', id);
          handleDelete(id);
        }
      };
    }
  }

  function applyFilters() {
    const filtered = state.data.filter(item => {
      if (state.filters.rencana_strategis_id && item.rencana_strategis_id !== state.filters.rencana_strategis_id) {
        return false;
      }
      if (state.filters.perspektif && item.perspektif !== state.filters.perspektif) {
        return false;
      }
      return true;
    });
    
    const tbody = document.getElementById('ss-table-body');
    if (tbody) {
      const originalData = state.data;
      state.data = filtered;
      tbody.innerHTML = renderTableRows();
      state.data = originalData;
    }
  }


  function openModal(editData = null) {
    state.editingId = editData?.id || null;
    
    const modalHtml = `
      <div class="ss-modal" id="ss-modal">
        <div class="ss-modal-content">
          <div class="ss-modal-header">
            <h3>${editData ? 'Edit Sasaran Strategi' : 'Tambah Sasaran Strategi'}</h3>
            <button class="ss-modal-close" id="ss-modal-close">&times;</button>
          </div>
          <div class="ss-modal-body">
            <div class="ss-form-group">
              <label>Rencana Strategis *</label>
              <select id="ss-form-rencana" required>
                <option value="">Pilih Rencana Strategis</option>
                ${state.rencanaStrategis.map(r => `
                  <option value="${r.id}" ${editData?.rencana_strategis_id === r.id ? 'selected' : ''}>
                    ${r.nama_rencana || r.kode || 'N/A'}
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="ss-form-group">
              <label>Sasaran Strategi *</label>
              <textarea id="ss-form-sasaran" placeholder="Masukkan sasaran strategi..." required>${editData?.sasaran || ''}</textarea>
            </div>
            <div class="ss-form-group">
              <label>Perspektif *</label>
              <select id="ss-form-perspektif" required>
                <option value="">Pilih Perspektif</option>
                <option value="LG" ${editData?.perspektif === 'LG' ? 'selected' : ''}>Learning & Growth</option>
                <option value="ES" ${editData?.perspektif === 'ES' ? 'selected' : ''}>Eksternal Stakeholder</option>
                <option value="IBP" ${editData?.perspektif === 'IBP' ? 'selected' : ''}>Internal Business Process</option>
                <option value="Fin" ${editData?.perspektif === 'Fin' ? 'selected' : ''}>Financial</option>
              </select>
            </div>
            <div class="ss-form-group">
              <label>TOWS Strategi (Opsional)</label>
              <select id="ss-form-tows">
                <option value="">Pilih TOWS Strategi</option>
                ${state.towsStrategi.map(t => `
                  <option value="${t.id}" ${editData?.tows_strategi_id === t.id ? 'selected' : ''}>
                    [${t.tipe_strategi || 'N/A'}] ${t.strategi || 'N/A'}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          <div class="ss-modal-footer">
            <button class="ss-btn-cancel" id="ss-btn-cancel">Batal</button>
            <button class="ss-btn-save" id="ss-btn-save">Simpan</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Attach modal event listeners
    document.getElementById('ss-modal-close').onclick = closeModal;
    document.getElementById('ss-btn-cancel').onclick = closeModal;
    document.getElementById('ss-btn-save').onclick = handleSave;
    document.getElementById('ss-modal').onclick = (e) => {
      if (e.target.id === 'ss-modal') closeModal();
    };
  }

  function closeModal() {
    const modal = document.getElementById('ss-modal');
    if (modal) modal.remove();
    state.editingId = null;
  }

  async function handleEdit(id) {
    console.log('Handling edit for ID:', id);
    const item = state.data.find(d => d.id === id);
    if (item) {
      openModal(item);
    } else {
      // Try to fetch from API
      try {
        const data = await api()(`/api/sasaran-strategi/${id}`);
        if (data) {
          openModal(data);
        }
      } catch (error) {
        console.error('Error fetching item:', error);
        alert('Gagal mengambil data untuk diedit');
      }
    }
  }

  async function handleDelete(id) {
    const item = state.data.find(d => d.id === id);
    const sasaranText = item?.sasaran || 'item ini';
    
    if (!confirm(`Apakah Anda yakin ingin menghapus sasaran strategi:\n\n"${sasaranText}"?`)) {
      return;
    }
    
    try {
      await api()(`/api/sasaran-strategi/${id}`, { method: 'DELETE' });
      
      // Remove from local state
      state.data = state.data.filter(d => d.id !== id);
      
      // Re-render table
      const tbody = document.getElementById('ss-table-body');
      if (tbody) {
        tbody.innerHTML = renderTableRows();
      }
      
      alert('Sasaran strategi berhasil dihapus');
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Gagal menghapus sasaran strategi: ' + (error.message || 'Unknown error'));
    }
  }

  async function handleSave() {
    const rencanaId = document.getElementById('ss-form-rencana').value;
    const sasaran = document.getElementById('ss-form-sasaran').value.trim();
    const perspektif = document.getElementById('ss-form-perspektif').value;
    const towsId = document.getElementById('ss-form-tows').value;
    
    // Validation
    if (!rencanaId) {
      alert('Pilih Rencana Strategis');
      return;
    }
    if (!sasaran) {
      alert('Masukkan Sasaran Strategi');
      return;
    }
    if (!perspektif) {
      alert('Pilih Perspektif');
      return;
    }
    
    const payload = {
      rencana_strategis_id: rencanaId,
      sasaran: sasaran,
      perspektif: perspektif,
      tows_strategi_id: towsId || null
    };
    
    try {
      if (state.editingId) {
        // Update
        await api()(`/api/sasaran-strategi/${state.editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        await api()('/api/sasaran-strategi', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      
      closeModal();
      await fetchData();
      render();
      
      alert(state.editingId ? 'Sasaran strategi berhasil diupdate' : 'Sasaran strategi berhasil ditambahkan');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Gagal menyimpan: ' + (error.message || 'Unknown error'));
    }
  }

  // Public API
  return {
    load,
    refresh: async () => {
      await fetchData();
      render();
    }
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('sasaran-strategi')) {
      SasaranStrategiModule.load();
    }
  });
} else {
  if (window.location.pathname.includes('sasaran-strategi')) {
    SasaranStrategiModule.load();
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SasaranStrategiModule;
}
