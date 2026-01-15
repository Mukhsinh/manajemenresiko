/**
 * Evaluasi IKU Buttons Fix - AGGRESSIVE VERSION
 * Ensures Tambah Data and Unduh Laporan buttons are ALWAYS visible above the table
 */
(function() {
  'use strict';

  const BUTTON_STYLES = `
    <style id="evaluasi-buttons-fix-styles">
      /* Force buttons to be visible */
      .evaluasi-filter-bar .evaluasi-filter-actions,
      .evaluasi-filter-section .evaluasi-actions {
        display: flex !important;
        gap: 0.5rem !important;
        margin-left: auto !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      .evaluasi-btn-tambah,
      .evaluasi-btn-unduh,
      #btn-tambah-v3,
      #btn-unduh-v3,
      #btn-tambah-data-fix,
      #btn-unduh-laporan-fix {
        display: inline-flex !important;
        align-items: center !important;
        gap: 0.375rem !important;
        padding: 0.5rem 1rem !important;
        border-radius: 6px !important;
        font-size: 0.8rem !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        border: none !important;
        transition: all 0.2s !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      .evaluasi-btn-tambah,
      #btn-tambah-v3,
      #btn-tambah-data-fix {
        background: #3b82f6 !important;
        color: white !important;
      }
      
      .evaluasi-btn-tambah:hover,
      #btn-tambah-v3:hover,
      #btn-tambah-data-fix:hover {
        background: #2563eb !important;
      }
      
      .evaluasi-btn-unduh,
      #btn-unduh-v3,
      #btn-unduh-laporan-fix {
        background: #10b981 !important;
        color: white !important;
      }
      
      .evaluasi-btn-unduh:hover,
      #btn-unduh-v3:hover,
      #btn-unduh-laporan-fix:hover {
        background: #059669 !important;
      }
      
      /* Injected filter bar with buttons */
      .evaluasi-buttons-bar {
        background: #fff;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }
      
      .evaluasi-buttons-bar .filter-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .evaluasi-buttons-bar label {
        font-size: 0.8rem;
        font-weight: 500;
        color: #374151;
      }
      
      .evaluasi-buttons-bar select,
      .evaluasi-buttons-bar input {
        padding: 0.4rem 0.6rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.8rem;
      }
      
      .evaluasi-buttons-bar .buttons-group {
        display: flex;
        gap: 0.5rem;
        margin-left: auto;
      }
    </style>
  `;

  function injectStyles() {
    if (!document.getElementById('evaluasi-buttons-fix-styles')) {
      document.head.insertAdjacentHTML('beforeend', BUTTON_STYLES);
    }
  }

  function createButtonsBar() {
    const yr = new Date().getFullYear();
    return `
      <div class="evaluasi-buttons-bar" id="evaluasi-buttons-bar-fix">
        <div class="filter-group">
          <label>Tahun:</label>
          <input type="number" id="evaluasi-filter-tahun-fix" value="${yr}" min="2020" max="2030" style="width: 80px;">
        </div>
        <div class="filter-group">
          <label>Periode:</label>
          <select id="evaluasi-filter-periode-fix">
            <option value="semua">Semua Periode</option>
            <option value="bulanan">Bulanan</option>
            <option value="triwulan">Triwulan</option>
            <option value="semester">Semester</option>
            <option value="tahunan">Tahunan</option>
          </select>
        </div>
        <div class="buttons-group">
          <button type="button" id="btn-tambah-data-fix" class="evaluasi-btn-tambah">
            <i class="fas fa-plus"></i> Tambah Data
          </button>
          <button type="button" id="btn-unduh-laporan-fix" class="evaluasi-btn-unduh">
            <i class="fas fa-download"></i> Unduh Laporan
          </button>
        </div>
      </div>
    `;
  }

  function injectButtonsIfNeeded() {
    const container = document.getElementById('evaluasi-iku');
    if (!container) return;
    
    // Check if container is visible
    if (container.style.display === 'none' || !container.classList.contains('active')) {
      return;
    }

    console.log('🔧 Evaluasi IKU Buttons Fix: Checking buttons...');

    // Check if buttons already exist and are visible
    const existingBtnTambah = document.getElementById('btn-tambah-v3') || document.getElementById('btn-tambah-data-fix');
    const existingBtnUnduh = document.getElementById('btn-unduh-v3') || document.getElementById('btn-unduh-laporan-fix');
    
    if (existingBtnTambah && existingBtnUnduh) {
      // Check if they are visible
      const tambahVisible = existingBtnTambah.offsetParent !== null;
      const unduhVisible = existingBtnUnduh.offsetParent !== null;
      
      if (tambahVisible && unduhVisible) {
        console.log('✅ Buttons already visible');
        return;
      }
    }

    // Check if our bar already exists
    if (document.getElementById('evaluasi-buttons-bar-fix')) {
      console.log('✅ Buttons bar already injected');
      return;
    }

    // Find where to inject
    const filterBar = container.querySelector('.evaluasi-filter-bar');
    const tableSection = container.querySelector('.evaluasi-table-section');
    const chartsGrid = container.querySelector('.evaluasi-charts-grid');
    const pageHeader = container.querySelector('.page-header');
    
    // If filter bar exists but buttons are missing, add buttons to it
    if (filterBar) {
      let actionsDiv = filterBar.querySelector('.evaluasi-filter-actions');
      if (!actionsDiv) {
        actionsDiv = document.createElement('div');
        actionsDiv.className = 'evaluasi-filter-actions';
        actionsDiv.style.cssText = 'display: flex; gap: 0.5rem; margin-left: auto;';
        filterBar.appendChild(actionsDiv);
      }
      
      // Check if buttons exist in actions div
      if (!actionsDiv.querySelector('#btn-tambah-v3, #btn-tambah-data-fix')) {
        actionsDiv.innerHTML = `
          <button type="button" id="btn-tambah-data-fix" class="evaluasi-btn-tambah" style="
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            border: none;
            background: #3b82f6;
            color: white;
          ">
            <i class="fas fa-plus"></i> Tambah Data
          </button>
          <button type="button" id="btn-unduh-laporan-fix" class="evaluasi-btn-unduh" style="
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            border: none;
            background: #10b981;
            color: white;
          ">
            <i class="fas fa-download"></i> Unduh Laporan
          </button>
        `;
        console.log('✅ Buttons added to existing filter bar');
        attachButtonListeners();
        return;
      }
    }
    
    // If no filter bar, inject our own bar
    if (!filterBar) {
      const buttonsBarHTML = createButtonsBar();
      
      if (tableSection) {
        tableSection.insertAdjacentHTML('beforebegin', buttonsBarHTML);
      } else if (chartsGrid) {
        chartsGrid.insertAdjacentHTML('afterend', buttonsBarHTML);
      } else if (pageHeader) {
        pageHeader.insertAdjacentHTML('afterend', buttonsBarHTML);
      } else {
        container.insertAdjacentHTML('afterbegin', buttonsBarHTML);
      }
      
      console.log('✅ New buttons bar injected');
      attachButtonListeners();
    }
  }

  function attachButtonListeners() {
    const btnTambah = document.getElementById('btn-tambah-data-fix');
    const btnUnduh = document.getElementById('btn-unduh-laporan-fix');
    
    if (btnTambah && !btnTambah.hasAttribute('data-listener-attached')) {
      btnTambah.setAttribute('data-listener-attached', 'true');
      btnTambah.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('📝 Tambah Data clicked');
        
        // Try to use existing module functions
        if (window.EvaluasiIKUV3 && typeof window.EvaluasiIKUV3.openAddModal === 'function') {
          window.EvaluasiIKUV3.openAddModal();
        } else if (window.EvaluasiIKUModule && typeof window.EvaluasiIKUModule.openAddModal === 'function') {
          window.EvaluasiIKUModule.openAddModal();
        } else {
          openSimpleAddModal();
        }
      });
    }
    
    if (btnUnduh && !btnUnduh.hasAttribute('data-listener-attached')) {
      btnUnduh.setAttribute('data-listener-attached', 'true');
      btnUnduh.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('📥 Unduh Laporan clicked');
        
        // Try to use existing module functions
        if (window.EvaluasiIKUV3 && typeof window.EvaluasiIKUV3.downloadReport === 'function') {
          window.EvaluasiIKUV3.downloadReport();
        } else if (window.EvaluasiIKUModule && typeof window.EvaluasiIKUModule.downloadReport === 'function') {
          window.EvaluasiIKUModule.downloadReport();
        } else {
          downloadSimpleReport();
        }
      });
    }
  }

  function openSimpleAddModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('modal-evaluasi-simple');
    if (existingModal) existingModal.remove();
    
    const yr = new Date().getFullYear();
    let yOpts = '';
    for (let y = yr - 3; y <= yr + 2; y++) {
      yOpts += `<option value="${y}" ${y === yr ? 'selected' : ''}>${y}</option>`;
    }
    
    const modalHTML = `
      <div id="modal-evaluasi-simple" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 1rem;
      ">
        <div style="
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          max-height: 85vh;
          overflow-y: auto;
        ">
          <div style="
            padding: 1rem 1.25rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: space-between;
          ">
            <h3 style="font-size: 1rem; font-weight: 600; color: #1f2937;">
              <i class="fas fa-plus-circle" style="color: #3b82f6; margin-right: 0.5rem;"></i>
              Tambah Realisasi IKU
            </h3>
            <button type="button" onclick="document.getElementById('modal-evaluasi-simple').remove()" style="
              width: 28px;
              height: 28px;
              border-radius: 6px;
              border: none;
              background: #f3f4f6;
              color: #6b7280;
              cursor: pointer;
            ">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <form id="form-evaluasi-simple" onsubmit="window.submitEvaluasiSimple(event)">
            <div style="padding: 1rem 1.25rem;">
              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">
                  Indikator Kinerja Utama <span style="color: #ef4444;">*</span>
                </label>
                <select id="select-iku-simple" required style="
                  width: 100%;
                  padding: 0.5rem 0.625rem;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
                  font-size: 0.8rem;
                ">
                  <option value="">-- Memuat IKU... --</option>
                </select>
              </div>
              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">
                  Tahun <span style="color: #ef4444;">*</span>
                </label>
                <select id="select-tahun-simple" required style="
                  width: 100%;
                  padding: 0.5rem 0.625rem;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
                  font-size: 0.8rem;
                ">
                  ${yOpts}
                </select>
              </div>
              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">
                  Realisasi Bulanan
                </label>
                <div id="monthly-inputs-simple" style="
                  display: grid;
                  grid-template-columns: repeat(4, 1fr);
                  gap: 0.5rem;
                "></div>
              </div>
            </div>
            <div style="
              padding: 0.75rem 1.25rem;
              border-top: 1px solid #e5e7eb;
              display: flex;
              justify-content: flex-end;
              gap: 0.5rem;
            ">
              <button type="button" onclick="document.getElementById('modal-evaluasi-simple').remove()" style="
                padding: 0.5rem 1rem;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 500;
                cursor: pointer;
                border: 1px solid #d1d5db;
                background: #f3f4f6;
                color: #374151;
              ">Batal</button>
              <button type="submit" style="
                padding: 0.5rem 1rem;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 500;
                cursor: pointer;
                border: none;
                background: #3b82f6;
                color: white;
              ">
                <i class="fas fa-save"></i> Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Load IKU options
    loadIKUOptionsSimple();
    
    // Render monthly inputs
    renderMonthlyInputsSimple();
  }

  async function loadIKUOptionsSimple() {
    const select = document.getElementById('select-iku-simple');
    if (!select) return;
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      let data = [];
      
      try {
        const res = await fetch('/api/indikator-kinerja-utama', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch (e) {
        console.warn('Auth endpoint failed:', e);
      }
      
      if (!data || data.length === 0) {
        try {
          const pubRes = await fetch('/api/indikator-kinerja-utama/public');
          if (pubRes.ok) {
            data = await pubRes.json();
          }
        } catch (e) {
          console.warn('Public endpoint failed:', e);
        }
      }
      
      if (data && data.length > 0) {
        select.innerHTML = `<option value="">-- Pilih IKU --</option>` +
          data.map(iku => `<option value="${iku.id}">${escapeHtml(iku.indikator)} (${escapeHtml(iku.rencana_strategis?.nama_rencana || '-')})</option>`).join('');
      } else {
        select.innerHTML = `<option value="">-- Tidak ada IKU tersedia --</option>`;
      }
    } catch (e) {
      console.error('Error loading IKU:', e);
      select.innerHTML = `<option value="">-- Error memuat IKU --</option>`;
    }
  }

  function renderMonthlyInputsSimple() {
    const container = document.getElementById('monthly-inputs-simple');
    if (!container) return;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    container.innerHTML = months.map((m, i) => `
      <div style="
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.5rem;
      ">
        <div style="font-size: 0.65rem; font-weight: 600; color: #6b7280; margin-bottom: 0.25rem; text-transform: uppercase;">${m}</div>
        <input type="number" step="0.01" name="bulan_${i + 1}" placeholder="0" style="
          width: 100%;
          padding: 0.375rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.75rem;
          text-align: right;
        ">
      </div>
    `).join('');
  }

  window.submitEvaluasiSimple = async function(e) {
    e.preventDefault();
    
    const ikuId = document.getElementById('select-iku-simple')?.value;
    const tahun = document.getElementById('select-tahun-simple')?.value;
    
    if (!ikuId) {
      alert('Pilih IKU terlebih dahulu');
      return;
    }
    
    const realisasiBulanan = [];
    for (let i = 1; i <= 12; i++) {
      const input = document.querySelector(`input[name="bulan_${i}"]`);
      if (input && input.value) {
        realisasiBulanan.push({
          bulan: i,
          realisasi_nilai: parseFloat(input.value)
        });
      }
    }
    
    if (realisasiBulanan.length === 0) {
      alert('Masukkan minimal satu realisasi bulanan');
      return;
    }
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/evaluasi-iku-bulanan/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          indikator_kinerja_utama_id: ikuId,
          tahun: parseInt(tahun),
          realisasi_bulanan: realisasiBulanan
        })
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      alert('Data berhasil disimpan');
      document.getElementById('modal-evaluasi-simple')?.remove();
      
      // Reload page or data
      if (window.EvaluasiIKUV3 && typeof window.EvaluasiIKUV3.loadData === 'function') {
        window.EvaluasiIKUV3.loadData();
      } else {
        location.reload();
      }
    } catch (e) {
      console.error('Error:', e);
      alert('Gagal menyimpan data');
    }
  };

  async function downloadSimpleReport() {
    const tahun = document.getElementById('evaluasi-filter-tahun-fix')?.value || 
                  document.getElementById('filter-tahun-v3')?.value ||
                  new Date().getFullYear();
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Try Excel export first
      try {
        const res = await fetch(`/api/evaluasi-iku-bulanan/export/excel?tahun=${tahun}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Evaluasi_IKU_${tahun}.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          alert('Laporan berhasil diunduh');
          return;
        }
      } catch (e) {
        console.warn('Excel export failed:', e);
      }
      
      // Fallback: generate simple CSV
      alert('Fitur unduh laporan sedang disiapkan. Silakan coba lagi nanti.');
    } catch (e) {
      console.error('Error:', e);
      alert('Gagal mengunduh laporan');
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Initialize
  function init() {
    injectStyles();
    
    // Check immediately
    setTimeout(injectButtonsIfNeeded, 100);
    setTimeout(injectButtonsIfNeeded, 500);
    setTimeout(injectButtonsIfNeeded, 1000);
    setTimeout(injectButtonsIfNeeded, 2000);
    
    // Check on hash change
    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#evaluasi-iku') {
        setTimeout(injectButtonsIfNeeded, 100);
        setTimeout(injectButtonsIfNeeded, 500);
      }
    });
    
    // MutationObserver for SPA navigation
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target.id === 'evaluasi-iku' && 
              (target.classList.contains('active') || target.style.display !== 'none')) {
            setTimeout(injectButtonsIfNeeded, 100);
          }
        }
        if (mutation.type === 'childList') {
          const container = document.getElementById('evaluasi-iku');
          if (container && container.classList.contains('active')) {
            setTimeout(injectButtonsIfNeeded, 100);
          }
        }
      }
    });
    
    // Observe the evaluasi-iku container
    const container = document.getElementById('evaluasi-iku');
    if (container) {
      observer.observe(container, { attributes: true, childList: true, subtree: true });
    }
    
    // Also observe body for page changes
    observer.observe(document.body, { childList: true, subtree: false });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Export for external use
  window.EvaluasiIKUButtonsFix = {
    inject: injectButtonsIfNeeded,
    openAddModal: openSimpleAddModal,
    downloadReport: downloadSimpleReport
  };
})();
