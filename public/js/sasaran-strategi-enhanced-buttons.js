/**
 * Sasaran Strategi Enhanced Buttons Fix
 * - Fixes Edit and Delete button functionality
 * - Ensures proper event handling
 * - Adds scrollable table support
 */

(function() {
  'use strict';
  
  console.log('🔧 Sasaran Strategi Enhanced Buttons loaded');
  
  // Wait for DOM and module to be ready
  function init() {
    // Check if we're on sasaran-strategi page
    if (!window.location.href.includes('sasaran-strategi') && 
        !document.getElementById('sasaran-strategi-content')) {
      return;
    }
    
    console.log('📋 Initializing Sasaran Strategi button fixes...');
    
    // Apply fixes after a short delay to ensure content is loaded
    setTimeout(applyButtonFixes, 500);
    
    // Also observe for dynamic content changes
    observeContentChanges();
  }
  
  function applyButtonFixes() {
    const container = document.getElementById('sasaran-strategi-content');
    if (!container) {
      console.warn('Sasaran Strategi container not found');
      return;
    }
    
    // Fix Edit buttons
    fixEditButtons(container);
    
    // Fix Delete buttons
    fixDeleteButtons(container);
    
    // Ensure table is scrollable
    makeTableScrollable(container);
    
    console.log('✅ Button fixes applied');
  }
  
  function fixEditButtons(container) {
    const editButtons = container.querySelectorAll('[data-edit-id], .btn-edit, .btn-edit-sasaran');
    
    editButtons.forEach(btn => {
      // Remove existing listeners by cloning
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Add new click handler
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const id = this.getAttribute('data-edit-id') || 
                   this.getAttribute('data-id') ||
                   this.closest('tr')?.getAttribute('data-id');
        
        console.log('📝 Edit button clicked, ID:', id);
        
        if (!id) {
          console.error('No ID found for edit button');
          alert('Error: ID tidak ditemukan');
          return;
        }
        
        // Call the edit function
        if (window.SasaranStrategiModule && typeof window.SasaranStrategiModule.edit === 'function') {
          window.SasaranStrategiModule.edit(id);
        } else if (window.sasaranStrategiModule && typeof window.sasaranStrategiModule.edit === 'function') {
          window.sasaranStrategiModule.edit(id);
        } else {
          console.error('SasaranStrategiModule.edit not found');
          // Fallback: try to load and show edit modal directly
          loadAndShowEditModal(id);
        }
      });
      
      // Ensure proper styling
      newBtn.style.cursor = 'pointer';
      newBtn.style.pointerEvents = 'auto';
    });
    
    console.log(`Fixed ${editButtons.length} edit buttons`);
  }
  
  function fixDeleteButtons(container) {
    const deleteButtons = container.querySelectorAll('[data-delete-id], .btn-delete, .btn-delete-sasaran');
    
    deleteButtons.forEach(btn => {
      // Remove existing listeners by cloning
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Add new click handler
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const id = this.getAttribute('data-delete-id') || 
                   this.getAttribute('data-id') ||
                   this.closest('tr')?.getAttribute('data-id');
        
        console.log('🗑️ Delete button clicked, ID:', id);
        
        if (!id) {
          console.error('No ID found for delete button');
          alert('Error: ID tidak ditemukan');
          return;
        }
        
        // Confirm deletion
        if (!confirm('Yakin ingin menghapus sasaran strategi ini?')) {
          return;
        }
        
        // Call the delete function
        if (window.SasaranStrategiModule && typeof window.SasaranStrategiModule.delete === 'function') {
          window.SasaranStrategiModule.delete(id);
        } else if (window.sasaranStrategiModule && typeof window.sasaranStrategiModule.delete === 'function') {
          window.sasaranStrategiModule.delete(id);
        } else {
          console.error('SasaranStrategiModule.delete not found');
          // Fallback: try to delete directly
          deleteItemDirectly(id);
        }
      });
      
      // Ensure proper styling
      newBtn.style.cursor = 'pointer';
      newBtn.style.pointerEvents = 'auto';
    });
    
    console.log(`Fixed ${deleteButtons.length} delete buttons`);
  }
  
  function makeTableScrollable(container) {
    // Find or create table container
    let tableContainer = container.querySelector('.table-container, .table-responsive');
    const table = container.querySelector('table, .sasaran-table');
    
    if (table && !tableContainer) {
      // Wrap table in scrollable container
      tableContainer = document.createElement('div');
      tableContainer.className = 'table-container';
      tableContainer.style.cssText = `
        max-height: 60vh;
        overflow-y: auto;
        overflow-x: auto;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #fff;
      `;
      
      table.parentNode.insertBefore(tableContainer, table);
      tableContainer.appendChild(table);
    }
    
    if (tableContainer) {
      // Ensure scrollable styles
      tableContainer.style.maxHeight = '60vh';
      tableContainer.style.overflowY = 'auto';
      tableContainer.style.overflowX = 'auto';
    }
    
    // Make thead sticky
    const thead = table?.querySelector('thead');
    if (thead) {
      thead.style.position = 'sticky';
      thead.style.top = '0';
      thead.style.zIndex = '10';
    }
    
    console.log('Table scrollability configured');
  }
  
  // Fallback function to load and show edit modal
  async function loadAndShowEditModal(id) {
    try {
      const api = window.app?.apiCall || window.apiCall;
      if (!api) {
        throw new Error('API not available');
      }
      
      const data = await api(`/api/sasaran-strategi/${id}`);
      if (!data) {
        throw new Error('Data tidak ditemukan');
      }
      
      // Get reference data
      const [rencanaList, towsList] = await Promise.all([
        api('/api/rencana-strategis').catch(() => []),
        api('/api/matriks-tows').catch(() => [])
      ]);
      
      showEditModalDirect(data, rencanaList || [], towsList || []);
    } catch (error) {
      console.error('Error loading edit data:', error);
      alert('Error memuat data: ' + error.message);
    }
  }
  
  function showEditModalDirect(editData, rencanaList, towsList) {
    // Remove existing modal
    const existingModal = document.querySelector('.modal.sasaran-edit-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal active sasaran-edit-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px; background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto;">
        <div class="modal-header" style="padding: 1rem 1.5rem; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: white; border-radius: 12px 12px 0 0;">
          <h3 style="margin: 0; font-size: 1.25rem;">Edit Sasaran Strategi</h3>
          <button class="modal-close-btn" type="button" style="background: rgba(255,255,255,0.2); border: none; font-size: 1.5rem; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: white;">&times;</button>
        </div>
        <form id="sasaran-edit-form-direct" style="padding: 1.5rem;">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Rencana Strategis *</label>
            <select id="edit-rencana-direct" required style="width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 6px; font-size: 14px;">
              <option value="">Pilih Rencana Strategis</option>
              ${rencanaList.map(r => `<option value="${r.id}" ${editData.rencana_strategis_id === r.id ? 'selected' : ''}>${r.nama_rencana}</option>`).join('')}
            </select>
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">TOWS Strategi</label>
            <select id="edit-tows-direct" style="width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 6px; font-size: 14px;">
              <option value="">Pilih TOWS Strategi (Opsional)</option>
              ${towsList.map(t => `<option value="${t.id}" ${editData.tows_strategi_id === t.id ? 'selected' : ''}>${t.tipe_strategi}: ${t.strategi?.substring(0, 60) || ''}...</option>`).join('')}
            </select>
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Perspektif *</label>
            <select id="edit-perspektif-direct" required style="width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 6px; font-size: 14px;">
              <option value="">Pilih Perspektif</option>
              <option value="ES" ${editData.perspektif === 'ES' ? 'selected' : ''}>ES (Eksternal Stakeholder)</option>
              <option value="IBP" ${editData.perspektif === 'IBP' ? 'selected' : ''}>IBP (Internal Business Process)</option>
              <option value="LG" ${editData.perspektif === 'LG' ? 'selected' : ''}>LG (Learning & Growth)</option>
              <option value="Fin" ${editData.perspektif === 'Fin' ? 'selected' : ''}>Fin (Financial)</option>
            </select>
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Sasaran *</label>
            <textarea id="edit-sasaran-direct" required rows="4" style="width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 6px; font-size: 14px; resize: vertical;">${editData.sasaran || ''}</textarea>
          </div>
          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn-cancel-direct" style="padding: 0.75rem 1.5rem; border: 1px solid #6c757d; background: #6c757d; color: white; border-radius: 6px; cursor: pointer; font-size: 14px;">Batal</button>
            <button type="submit" style="padding: 0.75rem 1.5rem; border: none; background: #007bff; color: white; border-radius: 6px; cursor: pointer; font-size: 14px;">Simpan</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close handlers
    const closeModal = () => modal.remove();
    
    modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    modal.querySelector('.btn-cancel-direct').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    // Form submit
    modal.querySelector('#sasaran-edit-form-direct').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const api = window.app?.apiCall || window.apiCall;
        const updateData = {
          rencana_strategis_id: document.getElementById('edit-rencana-direct').value,
          tows_strategi_id: document.getElementById('edit-tows-direct').value || null,
          perspektif: document.getElementById('edit-perspektif-direct').value,
          sasaran: document.getElementById('edit-sasaran-direct').value
        };
        
        await api(`/api/sasaran-strategi/${editData.id}`, { method: 'PUT', body: updateData });
        
        closeModal();
        alert('Sasaran strategi berhasil diupdate');
        
        // Reload page or module
        if (window.SasaranStrategiModule?.load) {
          window.SasaranStrategiModule.load();
        } else if (window.sasaranStrategiModule?.load) {
          window.sasaranStrategiModule.load();
        } else {
          location.reload();
        }
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });
  }
  
  // Fallback delete function
  async function deleteItemDirectly(id) {
    try {
      const api = window.app?.apiCall || window.apiCall;
      if (!api) {
        throw new Error('API not available');
      }
      
      await api(`/api/sasaran-strategi/${id}`, { method: 'DELETE' });
      
      alert('Sasaran strategi berhasil dihapus');
      
      // Reload
      if (window.SasaranStrategiModule?.load) {
        window.SasaranStrategiModule.load();
      } else if (window.sasaranStrategiModule?.load) {
        window.sasaranStrategiModule.load();
      } else {
        location.reload();
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
  
  // Observe for dynamic content changes
  function observeContentChanges() {
    const container = document.getElementById('sasaran-strategi-content');
    if (!container) return;
    
    const observer = new MutationObserver((mutations) => {
      let shouldReapply = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldReapply = true;
          break;
        }
      }
      
      if (shouldReapply) {
        setTimeout(applyButtonFixes, 100);
      }
    });
    
    observer.observe(container, {
      childList: true,
      subtree: true
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Also run on page navigation (for SPA)
  window.addEventListener('hashchange', () => setTimeout(init, 300));
  window.addEventListener('popstate', () => setTimeout(init, 300));
  
  // Expose for manual triggering
  window.SasaranStrategiButtonFix = {
    init,
    applyButtonFixes,
    fixEditButtons,
    fixDeleteButtons
  };
  
})();
