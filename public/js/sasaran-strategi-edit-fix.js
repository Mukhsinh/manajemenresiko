// Fix untuk form edit Sasaran Strategi
// Masalah: Form edit tidak menampilkan data yang sudah ada, dan tombol batal/X perlu double click

(function() {
  'use strict';

  // Override showModal function
  if (window.SasaranStrategiModule) {
    const originalShowModal = window.SasaranStrategiModule.showModal;
    
    window.SasaranStrategiModule.showModal = function(id = null) {
      const state = window.SasaranStrategiModule._state || {
        rencanaStrategis: [],
        towsStrategi: []
      };

      const modal = document.createElement('div');
      modal.className = 'modal active';
      modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
      
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto;">
          <div class="modal-header" style="padding: 1rem 1.5rem; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
            <h3 class="modal-title" style="margin: 0; font-size: 1.25rem;">${id ? 'Edit' : 'Tambah'} Sasaran Strategi</h3>
            <button class="modal-close" type="button" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">&times;</button>
          </div>
          <form id="sasaran-strategi-form" style="padding: 1.5rem;">
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Rencana Strategis *</label>
              <select class="form-control" id="ss-rencana-strategis" required style="width: 100%; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 4px;">
                <option value="">Pilih Rencana Strategis</option>
                ${state.rencanaStrategis.map(r => `<option value="${r.id}">${r.nama_rencana}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">TOWS Strategi</label>
              <select class="form-control" id="ss-tows-strategi" style="width: 100%; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 4px;">
                <option value="">Pilih TOWS Strategi (Opsional)</option>
                ${state.towsStrategi.map(t => `
                  <option value="${t.id}" title="${t.strategi}">
                    ${t.tipe_strategi}: ${t.strategi.length > 60 ? t.strategi.substring(0, 60) + '...' : t.strategi}
                  </option>
                `).join('')}
              </select>
              <small class="form-text text-muted" style="display: block; margin-top: 0.25rem; font-size: 0.875rem; color: #6c757d;">Pilih strategi TOWS yang relevan dengan sasaran ini (opsional)</small>
            </div>
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Perspektif *</label>
              <select class="form-control" id="ss-perspektif" required style="width: 100%; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 4px;">
                <option value="">Pilih Perspektif</option>
                <option value="ES">ES (Eksternal Stakeholder)</option>
                <option value="IBP">IBP (Internal Business Process)</option>
                <option value="LG">LG (Learning & Growth)</option>
                <option value="Fin">Fin (Financial)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Sasaran *</label>
              <textarea class="form-control" id="ss-sasaran" required rows="4" style="width: 100%; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 4px; resize: vertical;"></textarea>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
              <button type="button" class="btn btn-secondary btn-cancel" style="padding: 0.5rem 1rem; border: 1px solid #6c757d; background: #6c757d; color: white; border-radius: 4px; cursor: pointer;">Batal</button>
              <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1rem; border: 1px solid #007bff; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">Simpan</button>
            </div>
          </form>
        </div>
      `;
      
      document.body.appendChild(modal);

      // Function to close modal with single click
      const closeModal = () => {
        modal.remove();
      };

      // Add event listeners for close buttons
      const closeBtn = modal.querySelector('.modal-close');
      const cancelBtn = modal.querySelector('.btn-cancel');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeModal();
        });
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeModal();
        });
      }

      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });

      // Handle form submission
      const form = modal.querySelector('#sasaran-strategi-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
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
            closeModal();
            
            // Reload data
            if (window.SasaranStrategiModule && window.SasaranStrategiModule.load) {
              await window.SasaranStrategiModule.load();
            }
            
            alert('Sasaran strategi berhasil disimpan');
          } catch (error) {
            console.error('Save error:', error);
            alert('Error: ' + error.message);
          }
        });
      }

      // Load data for edit mode
      if (id) {
        loadDataForEdit(id);
      }
    };

    // Function to load data for edit
    async function loadDataForEdit(id) {
      try {
        const api = window.app ? window.app.apiCall : window.apiCall;
        console.log('Loading data for edit, ID:', id);
        
        const data = await api(`/api/sasaran-strategi/${id}`);
        console.log('Loaded data:', data);
        
        // Wait a bit for DOM to be ready
        setTimeout(() => {
          const rencanaSelect = document.getElementById('ss-rencana-strategis');
          const towsSelect = document.getElementById('ss-tows-strategi');
          const perspektifSelect = document.getElementById('ss-perspektif');
          const sasaranTextarea = document.getElementById('ss-sasaran');
          
          if (rencanaSelect && data.rencana_strategis_id) {
            rencanaSelect.value = data.rencana_strategis_id;
            console.log('Set rencana strategis:', data.rencana_strategis_id);
          }
          
          if (towsSelect && data.tows_strategi_id) {
            towsSelect.value = data.tows_strategi_id;
            console.log('Set TOWS strategi:', data.tows_strategi_id);
          }
          
          if (perspektifSelect && data.perspektif) {
            perspektifSelect.value = data.perspektif;
            console.log('Set perspektif:', data.perspektif);
          }
          
          if (sasaranTextarea && data.sasaran) {
            sasaranTextarea.value = data.sasaran;
            console.log('Set sasaran:', data.sasaran);
          }
        }, 100);
      } catch (error) {
        console.error('Error loading data for edit:', error);
        alert('Error loading data: ' + error.message);
      }
    }
  }

  console.log('✓ Sasaran Strategi edit fix loaded');
})();
