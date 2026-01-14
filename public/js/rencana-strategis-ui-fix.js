/**
 * RENCANA STRATEGIS UI FIX MODULE
 * 
 * Perbaikan untuk:
 * 1. Tombol tidak berfungsi
 * 2. Filter tidak berfungsi
 * 3. Warna header tabel (biru solid)
 * 
 * Version: 1.0.0
 * Date: 2026-01-10
 */

(function() {
  'use strict';

  const RS_UI_FIX = {
    version: '1.0.0',
    initialized: false,
    filterState: {
      year: '',
      status: '',
      search: ''
    },
    debounceTimer: null,
    originalData: []
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function getEl(id) {
    return document.getElementById(id);
  }

  function debounce(func, wait) {
    return function(...args) {
      clearTimeout(RS_UI_FIX.debounceTimer);
      RS_UI_FIX.debounceTimer = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function showLoading(button) {
    if (!button) return;
    button.disabled = true;
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Loading...';
  }

  function hideLoading(button) {
    if (!button) return;
    button.disabled = false;
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    }
  }

  function showToast(message, type = 'success') {
    // Create toast container if not exists
    let container = document.getElementById('rs-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'rs-toast-container';
      container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
    toast.style.cssText = 'min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ============================================
  // BUTTON HANDLERS
  // ============================================

  function handleAddClick() {
    console.log('📝 Add button clicked');
    if (window.RencanaStrategisModule && typeof window.RencanaStrategisModule.showAddForm === 'function') {
      window.RencanaStrategisModule.showAddForm();
    } else {
      // Fallback: scroll to form and reset it
      const formSection = getEl('rs-form-section');
      const formBody = getEl('rs-form-body');
      
      if (formBody && formBody.classList.contains('d-none')) {
        formBody.classList.remove('d-none');
        const toggleBtn = getEl('rs-toggle-form');
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
      }
      
      // Reset form fields
      const form = getEl('rs-form');
      if (form) form.reset();
      
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      const namaInput = getEl('rs-nama');
      if (namaInput) namaInput.focus();
    }
  }

  function handleEditClick(id) {
    console.log('✏️ Edit button clicked for ID:', id);
    if (window.RencanaStrategisModule && typeof window.RencanaStrategisModule.startEdit === 'function') {
      window.RencanaStrategisModule.startEdit(id);
    }
  }

  function handleDeleteClick(id) {
    console.log('🗑️ Delete button clicked for ID:', id);
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      if (window.RencanaStrategisModule && typeof window.RencanaStrategisModule.deleteRencana === 'function') {
        window.RencanaStrategisModule.deleteRencana(id);
      }
    }
  }

  function handleViewClick(id) {
    console.log('👁️ View button clicked for ID:', id);
    if (window.RencanaStrategisModule && typeof window.RencanaStrategisModule.viewDetail === 'function') {
      window.RencanaStrategisModule.viewDetail(id);
    }
  }

  async function handleRefreshClick(button) {
    console.log('🔄 Refresh button clicked');
    showLoading(button);
    try {
      if (window.RencanaStrategisModule && typeof window.RencanaStrategisModule.refreshData === 'function') {
        await window.RencanaStrategisModule.refreshData();
      }
      showToast('Data berhasil diperbarui', 'success');
    } catch (error) {
      console.error('Refresh error:', error);
      showToast('Gagal memperbarui data', 'error');
    } finally {
      hideLoading(button);
    }
  }

  async function handleExportClick(button) {
    console.log('📊 Export button clicked');
    showLoading(button);
    try {
      // Try to export via API
      const token = localStorage.getItem('token');
      const response = await fetch('/api/rencana-strategis/export/excel', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rencana-strategis-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast('Export berhasil', 'success');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast('Gagal export data. Coba lagi nanti.', 'error');
    } finally {
      hideLoading(button);
    }
  }

  // ============================================
  // FILTER FUNCTIONS
  // ============================================

  function applyFilters() {
    console.log('🔍 Applying filters:', RS_UI_FIX.filterState);
    
    const table = document.querySelector('.rencana-strategis-wrapper table tbody');
    if (!table) return;

    const rows = table.querySelectorAll('tr[data-id]');
    let visibleCount = 0;
    const totalCount = rows.length;

    rows.forEach(row => {
      let show = true;

      // Year filter
      if (RS_UI_FIX.filterState.year) {
        const periodeCell = row.querySelector('td:nth-child(4)');
        if (periodeCell) {
          const periodeText = periodeCell.textContent || '';
          if (!periodeText.includes(RS_UI_FIX.filterState.year)) {
            show = false;
          }
        }
      }

      // Status filter
      if (RS_UI_FIX.filterState.status && show) {
        const statusCell = row.querySelector('td:nth-child(5)');
        if (statusCell) {
          const statusText = statusCell.textContent || '';
          if (!statusText.toLowerCase().includes(RS_UI_FIX.filterState.status.toLowerCase())) {
            show = false;
          }
        }
      }

      // Search filter
      if (RS_UI_FIX.filterState.search && show) {
        const namaCell = row.querySelector('td:nth-child(2)');
        if (namaCell) {
          const namaText = namaCell.textContent || '';
          if (!namaText.toLowerCase().includes(RS_UI_FIX.filterState.search.toLowerCase())) {
            show = false;
          }
        }
      }

      row.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    // Update filter count display
    updateFilterCount(visibleCount, totalCount);
  }

  function updateFilterCount(visible, total) {
    let countEl = getEl('rs-filter-count');
    if (!countEl) {
      // Create count element if not exists
      const tableHeader = document.querySelector('.rencana-strategis-wrapper .card-header');
      if (tableHeader) {
        countEl = document.createElement('span');
        countEl.id = 'rs-filter-count';
        countEl.className = 'badge bg-info ms-2';
        const titleEl = tableHeader.querySelector('h5');
        if (titleEl) {
          titleEl.appendChild(countEl);
        }
      }
    }
    
    if (countEl) {
      if (visible === total) {
        countEl.textContent = `${total} data`;
      } else {
        countEl.textContent = `${visible} dari ${total} data`;
      }
    }
  }

  function resetFilters() {
    console.log('🔄 Resetting filters');
    RS_UI_FIX.filterState = {
      year: '',
      status: '',
      search: ''
    };

    // Reset filter inputs
    const yearFilter = getEl('rs-filter-year');
    const statusFilter = getEl('rs-filter-status');
    const searchFilter = getEl('rs-filter-search');

    if (yearFilter) yearFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (searchFilter) searchFilter.value = '';

    applyFilters();
    showToast('Filter direset', 'success');
  }

  // ============================================
  // UI INJECTION
  // ============================================

  function injectFilterUI() {
    const tableCard = document.querySelector('.rencana-strategis-wrapper > .card.shadow-sm');
    if (!tableCard) return;

    // Check if filter already exists
    if (getEl('rs-filter-section')) return;

    const filterHtml = `
      <div id="rs-filter-section" class="card mb-3 border-0 shadow-sm">
        <div class="card-body py-3">
          <div class="row g-2 align-items-end">
            <div class="col-md-2">
              <label class="form-label small text-muted mb-1">Tahun</label>
              <select class="form-select form-select-sm" id="rs-filter-year">
                <option value="">Semua Tahun</option>
                ${generateYearOptions()}
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label small text-muted mb-1">Status</label>
              <select class="form-select form-select-sm" id="rs-filter-status">
                <option value="">Semua Status</option>
                <option value="Draft">Draft</option>
                <option value="Aktif">Aktif</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label small text-muted mb-1">Cari</label>
              <input type="text" class="form-control form-control-sm" id="rs-filter-search" placeholder="Cari nama rencana...">
            </div>
            <div class="col-md-2">
              <button class="btn btn-outline-secondary btn-sm w-100" id="rs-filter-reset">
                <i class="fas fa-times me-1"></i>Reset
              </button>
            </div>
            <div class="col-md-2">
              <button class="btn btn-primary btn-sm w-100" id="rs-add-btn">
                <i class="fas fa-plus me-1"></i>Tambah Data
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    tableCard.insertAdjacentHTML('beforebegin', filterHtml);
    bindFilterEvents();
  }

  function generateYearOptions() {
    const currentYear = new Date().getFullYear();
    let options = '';
    for (let year = currentYear + 2; year >= currentYear - 5; year--) {
      options += `<option value="${year}">${year}</option>`;
    }
    return options;
  }

  function bindFilterEvents() {
    const yearFilter = getEl('rs-filter-year');
    const statusFilter = getEl('rs-filter-status');
    const searchFilter = getEl('rs-filter-search');
    const resetBtn = getEl('rs-filter-reset');
    const addBtn = getEl('rs-add-btn');

    if (yearFilter) {
      yearFilter.addEventListener('change', (e) => {
        RS_UI_FIX.filterState.year = e.target.value;
        applyFilters();
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        RS_UI_FIX.filterState.status = e.target.value;
        applyFilters();
      });
    }

    if (searchFilter) {
      const debouncedSearch = debounce((value) => {
        RS_UI_FIX.filterState.search = value;
        applyFilters();
      }, 300);

      searchFilter.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', resetFilters);
    }

    if (addBtn) {
      addBtn.addEventListener('click', handleAddClick);
    }
  }

  // ============================================
  // EVENT DELEGATION FOR TABLE BUTTONS
  // ============================================

  function setupTableEventDelegation() {
    const container = document.querySelector('.rencana-strategis-wrapper');
    if (!container) return;

    // Remove existing listener to prevent duplicates
    container.removeEventListener('click', handleTableClick);
    container.addEventListener('click', handleTableClick);
  }

  function handleTableClick(e) {
    const target = e.target.closest('button');
    if (!target) return;

    // Get the row and ID
    const row = target.closest('tr');
    const id = row ? row.dataset.id : null;

    // Handle different button types
    if (target.classList.contains('btn-outline-info') || target.querySelector('.fa-eye')) {
      e.preventDefault();
      if (id) handleViewClick(id);
    } else if (target.classList.contains('btn-outline-warning') || target.querySelector('.fa-edit')) {
      e.preventDefault();
      if (id) handleEditClick(id);
    } else if (target.classList.contains('btn-outline-danger') || target.querySelector('.fa-trash')) {
      e.preventDefault();
      if (id) handleDeleteClick(id);
    } else if (target.id === 'rs-refresh-btn' || target.querySelector('.fa-sync-alt')) {
      e.preventDefault();
      handleRefreshClick(target);
    } else if (target.id === 'rs-export-btn' || target.querySelector('.fa-file-excel')) {
      e.preventDefault();
      handleExportClick(target);
    }
  }

  // ============================================
  // CSS INJECTION FOR BLUE HEADER
  // ============================================

  function injectBlueHeaderCSS() {
    const styleId = 'rs-blue-header-style';
    if (document.getElementById(styleId)) return;

    const css = `
      /* Blue Solid Header for Rencana Strategis Tables */
      .rencana-strategis-wrapper .table thead th,
      #rencana-strategis .table thead th,
      [data-page="rencana-strategis"] .table thead th {
        background: #007bff !important;
        background-image: none !important;
        color: white !important;
        border-color: #0056b3 !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        font-size: 0.8rem !important;
        letter-spacing: 0.5px !important;
      }

      .rencana-strategis-wrapper .table thead th:hover,
      #rencana-strategis .table thead th:hover,
      [data-page="rencana-strategis"] .table thead th:hover {
        background: #0056b3 !important;
      }

      /* Remove any gradient from form header too - keep it purple for distinction */
      .rencana-strategis-wrapper #rs-form-section .card-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      }

      /* Filter section styling */
      #rs-filter-section {
        border-radius: 12px !important;
      }

      #rs-filter-section .form-select,
      #rs-filter-section .form-control {
        border-radius: 8px !important;
      }

      /* Toast container */
      #rs-toast-container .alert {
        border-radius: 8px !important;
        border: none !important;
      }

      /* Add data-id to table rows for event delegation */
      .rencana-strategis-wrapper .table tbody tr {
        cursor: default;
      }

      .rencana-strategis-wrapper .table tbody tr:hover {
        background-color: #f8f9fa !important;
      }

      /* Button hover effects */
      .rencana-strategis-wrapper .btn-group-sm .btn {
        transition: all 0.2s ease !important;
      }

      .rencana-strategis-wrapper .btn-group-sm .btn:hover {
        transform: scale(1.1) !important;
      }
    `;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ============================================
  // ADD DATA-ID TO TABLE ROWS
  // ============================================

  function addDataIdToRows() {
    const table = document.querySelector('.rencana-strategis-wrapper table tbody');
    if (!table) return;

    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      // Try to find ID from onclick attributes
      const editBtn = row.querySelector('[onclick*="startEdit"]');
      const deleteBtn = row.querySelector('[onclick*="deleteRencana"]');
      const viewBtn = row.querySelector('[onclick*="viewDetail"]');

      let id = null;
      [editBtn, deleteBtn, viewBtn].forEach(btn => {
        if (btn && !id) {
          const onclick = btn.getAttribute('onclick') || '';
          const match = onclick.match(/['"]([^'"]+)['"]/);
          if (match) id = match[1];
        }
      });

      if (id) {
        row.dataset.id = id;
      }
    });
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    if (RS_UI_FIX.initialized) return;

    console.log('🚀 Initializing Rencana Strategis UI Fix v' + RS_UI_FIX.version);

    // Inject CSS for blue header
    injectBlueHeaderCSS();

    // Wait for DOM to be ready
    const checkAndInit = () => {
      const container = document.querySelector('.rencana-strategis-wrapper');
      if (container) {
        // Inject filter UI
        injectFilterUI();
        
        // Add data-id to rows
        addDataIdToRows();
        
        // Setup event delegation
        setupTableEventDelegation();
        
        // Initial filter count
        const rows = document.querySelectorAll('.rencana-strategis-wrapper table tbody tr[data-id]');
        updateFilterCount(rows.length, rows.length);

        RS_UI_FIX.initialized = true;
        console.log('✅ Rencana Strategis UI Fix initialized successfully');
      } else {
        // Retry after a short delay
        setTimeout(checkAndInit, 500);
      }
    };

    checkAndInit();

    // Re-initialize when content changes (for SPA navigation)
    // DISABLED: MutationObserver can cause performance issues
    // const observer = new MutationObserver((mutations) => {
    //   mutations.forEach((mutation) => {
    //     if (mutation.addedNodes.length > 0) {
    //       const container = document.querySelector('.rencana-strategis-wrapper');
    //       if (container && !getEl('rs-filter-section')) {
    //         setTimeout(() => {
    //           injectFilterUI();
    //           addDataIdToRows();
    //           setupTableEventDelegation();
    //         }, 100);
    //       }
    //     }
    //   });
    // });
    // 
    // const mainContent = document.getElementById('main-content') || document.body;
    // observer.observe(mainContent, { childList: true, subtree: true });
  }

  // ============================================
  // EXPOSE TO GLOBAL SCOPE
  // ============================================

  window.RencanaStrategisUIFix = {
    init,
    applyFilters,
    resetFilters,
    handleAddClick,
    handleEditClick,
    handleDeleteClick,
    handleRefreshClick,
    handleExportClick,
    version: RS_UI_FIX.version
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also initialize when navigating to the page
  window.addEventListener('hashchange', () => {
    if (window.location.hash.includes('rencana-strategis')) {
      setTimeout(init, 100);
    }
  });

})();
