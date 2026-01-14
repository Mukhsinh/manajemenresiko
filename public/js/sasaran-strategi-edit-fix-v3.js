// Fix untuk form edit Sasaran Strategi - Version 3
// Masalah yang diperbaiki: 
// 1. Form edit tidak menampilkan data yang sudah ada
// 2. Dropdown rencana strategis dan TOWS kosong saat edit
// 3. Tombol batal tidak langsung menghilangkan form

(function() {
  'use strict';

  console.log('Loading Sasaran Strategi Edit Fix v3...');

  // Prevent multiple modal instances
  let isModalOpen = false;
  let currentModal = null;

  // Function to close modal immediately
  function closeModalImmediately() {
    if (currentModal) {
      currentModal.remove();
      currentModal = null;
    }
    isModalOpen = false;
    
    // Remove any orphaned modals
    const orphanedModals = document.querySelectorAll('.modal.sasaran-edit-modal');
    orphanedModals.forEach(modal => modal.remove());
  }

  // Wait for SasaranStrategiModule to be available
  function waitForModule(callback, maxAttempts = 50) {
    let attempts = 0;
    const check = () => {
      attempts++;
      if (window.SasaranStrategiModule) {
        callback();
      } else if (attempts < maxAttempts) {
        setTimeout(check, 100);
      } else {
        console.error('SasaranStrategiModule not found after', maxAttempts, 'attempts');
      }
    };
    check();
  }

  waitForModule(() => {
    console.log('SasaranStrategiModule found, applying edit fix v3...');
    
    // Override showModal function in SasaranStrategiModule
    const originalShowModal = window.SasaranStrategiModule.showModal;
    
    window.SasaranStrategiModule.showModal = async function(id = null) {
      // Prevent opening multiple modals
      if (isModalOpen) {
        console.log('Modal already open, preventing duplicate');
        return;
      }
      
      isModalOpen = true;

      // Get state from module using the new getState method
      let state = { rencanaStrategis: [], towsStrategi: [] };
      
      if (typeof window.SasaranStrategiModule.getState === 'function') {
        state = window.SasaranStrategiModule.getState();
        console.log('Got state from getState():', {
          rencanaCount: state.rencanaStrategis?.length || 0,
          towsCount: state.towsStrategi?.length || 0
        });
      } else {
        // Fallback: fetch data directly from API
        console.log('getState not available, fetching from API...');
        try {
          const api = window.app ? window.app.apiCall : window.apiCall;
          const [rencana, tows] = await Promise.all([
            api('/api/rencana-strategis').catch(() => []),
            api('/api/matriks-tows').catch(() => [])
          ]);
          state.rencanaStrategis = rencana || [];
          state.towsStrategi = tows || [];
          console.log('Fetched from API:', {
            rencanaCount: state.rencanaStrategis.length,
            towsCount: state.towsStrategi.length
          });
        } catch (err) {
          console.error('Failed to fetch dropdown data:', err);
        }
      }

      // Load data first if in edit mode
      let editData = null;
      if (id) {
        try {
          const api = window.app ? window.app.apiCall : window.apiCall;
          console.log('Loading data for edit, ID:', id);
          editData = await api(`/api/sasaran-strategi/${id}`);
          console.log('Loaded edit data:', editData);
        } catch (error) {
          console.error('Error loading data for edit:', error);
          alert('Error loading data: ' + error.message);
          isModalOpen = false;
          return;
        }
      }

      // Create modal
      const modal = document.createElement('div');
      modal.className = 'modal active sasaran-edit-modal';
      modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
      
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto;">
          <div class="modal-header" style="padding: 1rem 1.5rem; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
            <h3 class="modal-title" style="margin: 0; font-size: 1.25rem;">${id ? 'Edit' : 'Tambah'} Sasaran Strategi</h3>
            <button class="modal-close" type="button" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; line-height: 1;">&times;</button>
          </div>
          <form id="sasaran-strategi-form" style="padding: 1.5rem;">
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Rencana Strategis *</label>
              <select class="form-control" id="ss-rencana-strategis" required style="width: 100%; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 4px;">
                <option value="">Pilih Rencana Strategis</option>
                ${(state.rencanaStrategis || []).map(r => `<option value="${r.id}" ${editData && editData.rencana_strategis_id === r.id ? 'selected' : ''}>${r.nama_rencana}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">TOWS Strategi</label>
              <select class="form-control" id="ss-tows-strategi" style="width: 100%; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 4px;">
                <option value="">Pilih TOWS Strategi (Opsional)</option>
                ${(state.towsStrategi || []).map(t => `
                  <option value="${t.id}" title="${t.strategi}" ${editData && editData.tows_strategi_id === t.id ? 'selected' : ''}>
                    ${t.tipe_strategi}: ${t.strategi && t.strategi.length > 60 ? t.strategi.substring(0, 60) + '...' : (t.strategi || '')}
                  </option>
                `).join('')}
              </select>
              <small class="form-text text-muted" style="display: block; margin-top: 0.25rem; font-size: 0.875rem; color: #6c757d;">Pilih strategi TOWS yang relevan dengan sasaran ini (opsional)</small>
            </div>
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Perspektif *</label>
              <select class="form-control" id="ss-perspektif" required style="width: 100%; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 4px;">
                <option value="">Pilih Perspektif</option>
                <option value="ES" ${editData && editData.perspektif === 'ES' ? 'selected' : ''}>ES (Eksternal Stakeholder)</option>
                <option value="IBP" ${editData && editData.perspektif === 'IBP' ? 'selected' : ''}>IBP (Internal Business Process)</option>
                <option value="LG" ${editData && editData.perspektif === 'LG' ? 'selected' : ''}>LG (Learning & Growth)</option>
                <option value="Fin" ${editData && editData.perspektif === 'Fin' ? 'selected' : ''}>Fin (Financial)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Sasaran *</label>
              <textarea class="form-control" id="ss-sasaran" required rows="4" style="width: 100%; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 4px; resize: vertical;">${editData ? editData.sasaran : ''}</textarea>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
              <button type="button" class="btn btn-secondary btn-cancel" style="padding: 0.5rem 1rem; border: 1px solid #6c757d; background: #6c757d; color: white; border-radius: 4px; cursor: pointer;">Batal</button>
              <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1rem; border: 1px solid #007bff; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">Simpan</button>
            </div>
          </form>
        </div>
      `;
      
      document.body.appendChild(modal);
      currentModal = modal;

      // Add event listeners for close buttons - SINGLE CLICK
      const closeBtn = modal.querySelector('.modal-close');
      const cancelBtn = modal.querySelector('.btn-cancel');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeModalImmediately();
        });
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeModalImmediately();
        });
      }

      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModalImmediately();
        }
      });

      // Close on Escape key
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          closeModalImmediately();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);

      // Handle form submission
      const form = modal.querySelector('#sasaran-strategi-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const submitBtn = form.querySelector('button[type="submit"]');
          const originalText = submitBtn.innerHTML;
          submitBtn.innerHTML = 'Menyimpan...';
          submitBtn.disabled = true;
          
          try {
            const api = window.app ? window.app.apiCall : window.apiCall;
            const data = {
              rencana_strategis_id: document.getElementById('ss-rencana-strategis').value,
              tows_strategi_id: document.getElementById('ss-tows-strategi').value || null,
              perspektif: document.getElementById('ss-perspektif').value,
              sasaran: document.getElementById('ss-sasaran').value
            };

            if (id) {
              await api(`/api/sasaran-strategi/${id}`, { method: 'PUT', body: data });
            } else {
              await api('/api/sasaran-strategi', { method: 'POST', body: data });
            }

            // Close modal immediately after successful save
            closeModalImmediately();
            
            // Show success message
            alert('Sasaran strategi berhasil disimpan');
            
            // Reload data
            if (window.SasaranStrategiModule && window.SasaranStrategiModule.load) {
              await window.SasaranStrategiModule.load();
            }
          } catch (error) {
            console.error('Save error:', error);
            alert('Error: ' + error.message);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
          }
        });
      }

      console.log('Modal opened successfully for', id ? 'edit' : 'add');
    };

    // Also override the edit function to prevent double calls
    window.SasaranStrategiModule.edit = async function(id) {
      if (isModalOpen) {
        console.log('Edit called but modal already open, ignoring');
        return;
      }
      console.log('Edit function called with ID:', id);
      await window.SasaranStrategiModule.showModal(id);
    };

    console.log('✓ Sasaran Strategi edit fix v3 applied successfully');
  });

  console.log('✓ Sasaran Strategi edit fix v3 loaded');
})();
