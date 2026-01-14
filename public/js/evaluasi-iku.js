/**
 * Evaluasi IKU Module
 * Handles monthly IKU realization input and yearly accumulation
 */

const EvaluasiIKUModule = (function() {
  'use strict';

  const BULAN_NAMES = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const BULAN_SHORT = [
    '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  let currentData = [];
  let summaryData = {};
  let selectedYear = new Date().getFullYear();
  let selectedIKU = null;

  // Initialize module
  async function init() {
    // Skip if V3 or V2 is already active
    const container = document.getElementById('evaluasi-iku') || document.getElementById('evaluasi-iku-page');
    if (container && (container.dataset.v3Enhanced === 'true' || container.dataset.v2Enhanced === 'true')) {
      console.log('Enhanced version is active, base module skipping initialization');
      return;
    }
    
    // Skip if already initialized
    if (container && container.dataset.baseInitialized === 'true') {
      console.log('Base module already initialized, skipping');
      return;
    }
    
    console.log('🚀 Initializing Evaluasi IKU Module');
    
    if (container) container.dataset.baseInitialized = 'true';
    
    // Set current year as default
    const currentYear = new Date().getFullYear();
    const yearSelect = document.getElementById('evaluasi-filter-tahun') || document.getElementById('filter-tahun');
    if (yearSelect) {
      const option = yearSelect.querySelector(`option[value="${currentYear}"]`);
      if (option) option.selected = true;
      selectedYear = currentYear;
    }
    
    setupEventListeners();
    await loadData();
  }

  // Setup event listeners
  function setupEventListeners() {
    // Year filter - support both IDs
    const yearSelect = document.getElementById('evaluasi-filter-tahun') || document.getElementById('filter-tahun');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        selectedYear = parseInt(e.target.value);
        loadData();
      });
    }

    // Add data button - support both IDs
    const addBtn = document.getElementById('evaluasi-btn-tambah') || document.getElementById('btn-tambah-data');
    if (addBtn) {
      addBtn.addEventListener('click', () => openAddModal());
    }

    // Download button - support both IDs
    const downloadBtn = document.getElementById('evaluasi-btn-unduh') || document.getElementById('btn-unduh-laporan');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => downloadReport());
    }

    // Modal close buttons
    document.querySelectorAll('.evaluasi-modal-close, .btn-cancel-modal').forEach(btn => {
      btn.addEventListener('click', closeModal);
    });

    // Modal backdrop click
    document.querySelectorAll('.evaluasi-modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    });

    // Form submit
    const form = document.getElementById('form-evaluasi-iku');
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }
  }

  // Load data from API
  async function loadData() {
    try {
      showLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`/api/evaluasi-iku-bulanan/summary?tahun=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load data');
      
      const result = await response.json();
      currentData = result.data || [];
      summaryData = result.summary || {};
      
      renderSummaryCards();
      renderDataTable();
      showLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      showLoading(false);
      showNotification('Gagal memuat data', 'error');
    }
  }

  // Render summary cards
  function renderSummaryCards() {
    const container = document.getElementById('evaluasi-summary-cards') || document.getElementById('summary-cards');
    if (!container) return;

    const cards = [
      { key: 'totalIKU', label: 'Total IKU', icon: 'bar-chart-2', class: 'total' },
      { key: 'tercapai', label: 'Tercapai', icon: 'check-circle', class: 'tercapai' },
      { key: 'hampirTercapai', label: 'Hampir Tercapai', icon: 'trending-up', class: 'hampir' },
      { key: 'dalamProses', label: 'Dalam Proses', icon: 'clock', class: 'proses' },
      { key: 'perluPerhatian', label: 'Perlu Perhatian', icon: 'alert-triangle', class: 'perhatian' },
      { key: 'belumAdaRealisasi', label: 'Belum Ada Data', icon: 'minus-circle', class: 'belum' }
    ];

    container.innerHTML = cards.map(card => `
      <div class="summary-card ${card.class}">
        <div class="card-icon">
          <i class="fas fa-${card.icon === 'bar-chart-2' ? 'chart-bar' : card.icon === 'check-circle' ? 'check-circle' : card.icon === 'trending-up' ? 'arrow-trend-up' : card.icon === 'clock' ? 'clock' : card.icon === 'alert-triangle' ? 'triangle-exclamation' : 'circle-minus'}"></i>
        </div>
        <div class="card-value">${summaryData[card.key] || 0}</div>
        <div class="card-label">${card.label}</div>
      </div>
    `).join('');

    // Render progress overview
    const progressContainer = document.getElementById('evaluasi-progress-overview') || document.getElementById('progress-overview');
    if (progressContainer) {
      const avgProgress = summaryData.rataRataCapaian || 0;
      progressContainer.innerHTML = `
        <div class="progress-overview-card">
          <h3>Rata-rata Capaian IKU ${selectedYear}</h3>
          <div class="progress-value">${avgProgress.toFixed(1)}%</div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${Math.min(avgProgress, 100)}%"></div>
          </div>
        </div>
      `;
    }
  }

  // Render data table
  function renderDataTable() {
    const tbody = document.getElementById('evaluasi-iku-table-body') || document.getElementById('evaluasi-table-body');
    if (!tbody) return;

    if (!currentData || currentData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state">
            <i class="fas fa-inbox" style="font-size: 48px; opacity: 0.5; margin-bottom: 1rem;"></i>
            <h4>Belum Ada Data</h4>
            <p>Belum ada data IKU untuk tahun ${selectedYear}</p>
            <button class="btn-action primary" onclick="EvaluasiIKUModule.openAddModal()">
              <i class="fas fa-plus"></i> Tambah Data
            </button>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = currentData.map((item, index) => {
      const statusClass = getStatusClass(item.status);
      const progressWidth = Math.min(item.persentaseCapaian || 0, 100);
      
      return `
        <tr data-id="${item.id}">
          <td>${index + 1}</td>
          <td class="indikator-cell">
            <div class="indikator-name">${escapeHtml(item.indikator || '-')}</div>
            <div class="sasaran-name">${escapeHtml(item.sasaran_strategi?.sasaran || '-')}</div>
          </td>
          <td>${escapeHtml(item.sasaran_strategi?.perspektif || '-')}</td>
          <td class="text-right">${formatNumber(item.targetTahunIni)} ${item.satuan || ''}</td>
          <td class="text-right">${formatNumber(item.totalRealisasi)} ${item.satuan || ''}</td>
          <td class="progress-cell">
            <div class="progress-bar-wrapper">
              <div class="progress-bar">
                <div class="progress-bar-inner ${statusClass}" style="width: ${progressWidth}%"></div>
              </div>
              <span class="progress-value-text">${item.persentaseCapaian?.toFixed(1) || 0}%</span>
            </div>
          </td>
          <td>
            <span class="status-badge ${statusClass}">
              ${getStatusIconFA(item.status)}
              ${item.status || 'Belum Ada Realisasi'}
            </span>
          </td>
          <td>
            <div class="action-icons">
              <button class="action-icon edit" onclick="EvaluasiIKUModule.openEditModal('${item.id}')" title="Edit Realisasi">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-icon view" onclick="EvaluasiIKUModule.viewDetail('${item.id}')" title="Lihat Detail">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-icon delete" onclick="EvaluasiIKUModule.deleteData('${item.id}')" title="Hapus">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Get status icon using Font Awesome
  function getStatusIconFA(status) {
    const iconMap = {
      'Tercapai': '<i class="fas fa-check-circle" style="margin-right:4px"></i>',
      'Hampir Tercapai': '<i class="fas fa-arrow-trend-up" style="margin-right:4px"></i>',
      'Dalam Proses': '<i class="fas fa-clock" style="margin-right:4px"></i>',
      'Perlu Perhatian': '<i class="fas fa-triangle-exclamation" style="margin-right:4px"></i>',
      'Belum Ada Realisasi': '<i class="fas fa-circle-minus" style="margin-right:4px"></i>'
    };
    return iconMap[status] || '';
  }

  // Open add modal - FIXED with better initialization
  function openAddModal() {
    selectedIKU = null;
    
    // Create modal if not exists
    createModalIfNeeded();
    
    const modal = document.getElementById('modal-evaluasi-iku');
    const form = document.getElementById('form-evaluasi-iku');
    const title = document.getElementById('modal-evaluasi-title');
    
    if (title) title.textContent = 'Tambah Realisasi IKU';
    if (form) form.reset();
    
    // Enable IKU select
    const ikuSelect = document.getElementById('select-iku');
    if (ikuSelect) ikuSelect.disabled = false;
    
    // Load IKU options
    loadIKUOptions();
    
    // Reset monthly inputs
    renderMonthlyInputs(null);
    
    if (modal) {
      modal.classList.add('active');
      // Focus on select after modal opens
      setTimeout(() => {
        if (ikuSelect) ikuSelect.focus();
      }, 100);
    }
  }

  // Create modal dynamically if not exists
  function createModalIfNeeded() {
    if (document.getElementById('modal-evaluasi-iku')) return;
    
    const modalHTML = `
      <!-- Add/Edit Modal -->
      <div class="evaluasi-modal" id="modal-evaluasi-iku">
        <div class="evaluasi-modal-content">
          <div class="evaluasi-modal-header">
            <h3 id="modal-evaluasi-title">Tambah Realisasi IKU</h3>
            <button class="evaluasi-modal-close" type="button">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <form id="form-evaluasi-iku">
            <div class="evaluasi-modal-body">
              <div class="form-group">
                <label for="select-iku">Indikator Kinerja Utama *</label>
                <select id="select-iku" required>
                  <option value="">-- Pilih IKU --</option>
                </select>
              </div>
              
              <h4 style="margin: 1.5rem 0 0.5rem; font-size: 1rem; color: #374151;">
                Input Realisasi Bulanan
              </h4>
              <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 1rem;">
                Masukkan nilai realisasi untuk setiap bulan. Total akan dihitung otomatis.
              </p>
              
              <div id="monthly-inputs"></div>
            </div>
            <div class="evaluasi-modal-footer">
              <button type="button" class="btn-action secondary btn-cancel-modal">Batal</button>
              <button type="submit" class="btn-action primary">
                <i class="fas fa-save"></i> Simpan
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Detail Modal -->
      <div class="evaluasi-modal" id="modal-detail-iku">
        <div class="evaluasi-modal-content">
          <div class="evaluasi-modal-header">
            <h3>Detail Evaluasi IKU</h3>
            <button class="evaluasi-modal-close" type="button">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="evaluasi-modal-body" id="detail-content-iku"></div>
          <div class="evaluasi-modal-footer">
            <button type="button" class="btn-action secondary btn-cancel-modal">Tutup</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Re-attach event listeners for new modal
    document.querySelectorAll('.evaluasi-modal-close, .btn-cancel-modal').forEach(btn => {
      btn.addEventListener('click', closeModal);
    });
    
    document.querySelectorAll('.evaluasi-modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    });
    
    const form = document.getElementById('form-evaluasi-iku');
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }
  }

  // Open edit modal
  async function openEditModal(ikuId) {
    const item = currentData.find(d => d.id === ikuId);
    if (!item) return;

    selectedIKU = item;
    
    // Create modal if not exists
    createModalIfNeeded();
    
    const modal = document.getElementById('modal-evaluasi-iku');
    const title = document.getElementById('modal-evaluasi-title');
    
    if (title) title.textContent = 'Edit Realisasi IKU';
    
    // Set IKU select
    const ikuSelect = document.getElementById('select-iku');
    if (ikuSelect) {
      await loadIKUOptions();
      ikuSelect.value = ikuId;
      ikuSelect.disabled = true;
    }

    // Render monthly inputs with existing data
    renderMonthlyInputs(item.realisasiBulanan);
    
    // Update accumulated total
    updateAccumulatedTotal();
    
    if (modal) modal.classList.add('active');
  }

  // Load IKU options for select
  async function loadIKUOptions() {
    const select = document.getElementById('select-iku');
    if (!select) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/indikator-kinerja-utama', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load IKU');
      
      const data = await response.json();
      
      select.innerHTML = `
        <option value="">-- Pilih Indikator Kinerja Utama --</option>
        ${data.map(iku => `
          <option value="${iku.id}">${escapeHtml(iku.indikator)} (${escapeHtml(iku.rencana_strategis?.nama_rencana || '-')})</option>
        `).join('')}
      `;
      
      select.disabled = false;
    } catch (error) {
      console.error('Error loading IKU options:', error);
    }
  }

  // Render monthly input fields
  function renderMonthlyInputs(existingData) {
    const container = document.getElementById('monthly-inputs');
    if (!container) return;

    container.innerHTML = `
      <div class="monthly-grid">
        ${BULAN_NAMES.slice(1).map((bulan, idx) => {
          const monthNum = idx + 1;
          const existing = existingData ? existingData[monthNum] : null;
          const hasValue = existing && existing.realisasi !== null;
          
          return `
            <div class="month-input-card ${hasValue ? 'has-value' : ''}">
              <div class="month-label">${BULAN_SHORT[monthNum]}</div>
              <input type="number" 
                     step="0.01" 
                     name="bulan_${monthNum}" 
                     placeholder="0"
                     value="${hasValue ? existing.realisasi : ''}"
                     onchange="EvaluasiIKUModule.updateAccumulatedTotal()">
            </div>
          `;
        }).join('')}
      </div>
      <div class="accumulated-total" id="accumulated-display">
        <div class="label">Total Realisasi Tahunan</div>
        <div class="value" id="total-realisasi-value">0</div>
      </div>
    `;
  }

  // Update accumulated total display
  function updateAccumulatedTotal() {
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      const input = document.querySelector(`input[name="bulan_${i}"]`);
      if (input && input.value) {
        total += parseFloat(input.value) || 0;
      }
    }
    
    const display = document.getElementById('total-realisasi-value');
    if (display) {
      display.textContent = formatNumber(total);
    }
  }

  // Handle form submit
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    const ikuSelect = document.getElementById('select-iku');
    const ikuId = selectedIKU?.id || ikuSelect?.value;
    
    if (!ikuId) {
      showNotification('Pilih IKU terlebih dahulu', 'error');
      return;
    }

    // Collect monthly data
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
      showNotification('Masukkan minimal satu realisasi bulanan', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch('/api/evaluasi-iku-bulanan/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          indikator_kinerja_utama_id: ikuId,
          tahun: selectedYear,
          realisasi_bulanan: realisasiBulanan
        })
      });

      if (!response.ok) throw new Error('Failed to save data');
      
      const result = await response.json();
      showNotification(result.message || 'Data berhasil disimpan', 'success');
      closeModal();
      loadData();
    } catch (error) {
      console.error('Error saving data:', error);
      showNotification('Gagal menyimpan data', 'error');
    }
  }

  // View detail
  function viewDetail(ikuId) {
    const item = currentData.find(d => d.id === ikuId);
    if (!item) return;

    // Create modal if not exists
    createModalIfNeeded();

    const modal = document.getElementById('modal-detail-iku');
    const content = document.getElementById('detail-content-iku');
    
    if (content) {
      content.innerHTML = `
        <div class="detail-header">
          <h4>${escapeHtml(item.indikator)}</h4>
          <p class="text-muted">${escapeHtml(item.sasaran_strategi?.sasaran || '-')}</p>
        </div>
        
        <div class="detail-info">
          <div class="info-row">
            <span class="info-label">Perspektif:</span>
            <span class="info-value">${escapeHtml(item.sasaran_strategi?.perspektif || '-')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Target ${selectedYear}:</span>
            <span class="info-value">${formatNumber(item.targetTahunIni)} ${item.satuan || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total Realisasi:</span>
            <span class="info-value">${formatNumber(item.totalRealisasi)} ${item.satuan || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Capaian:</span>
            <span class="info-value">${item.persentaseCapaian?.toFixed(1) || 0}%</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="status-badge ${getStatusClass(item.status)}">${item.status}</span>
          </div>
          <div class="info-row">
            <span class="info-label">PIC:</span>
            <span class="info-value">${escapeHtml(item.pic || '-')}</span>
          </div>
        </div>
        
        <h5 style="margin-top: 1.5rem; margin-bottom: 1rem;">Realisasi Bulanan</h5>
        <table class="detail-table">
          <thead>
            <tr>
              <th>Bulan</th>
              <th>Realisasi</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${Object.values(item.realisasiBulanan || {}).map(m => `
              <tr class="${m.realisasi !== null ? 'has-data' : ''}">
                <td>${m.namaBulan}</td>
                <td class="text-right">${m.realisasi !== null ? formatNumber(m.realisasi) : '-'}</td>
                <td>${escapeHtml(m.keterangan || '-')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Total</strong></td>
              <td class="text-right"><strong>${formatNumber(item.totalRealisasi)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      `;
    }
    
    if (modal) modal.classList.add('active');
  }

  // Delete data
  async function deleteData(ikuId) {
    if (!confirm('Apakah Anda yakin ingin menghapus semua realisasi untuk IKU ini?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const item = currentData.find(d => d.id === ikuId);
      
      if (!item || !item.realisasiBulanan) return;

      // Delete all monthly entries for this IKU
      const deletePromises = Object.values(item.realisasiBulanan)
        .filter(m => m.id)
        .map(m => fetch(`/api/evaluasi-iku-bulanan/${m.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }));

      await Promise.all(deletePromises);
      
      showNotification('Data berhasil dihapus', 'success');
      loadData();
    } catch (error) {
      console.error('Error deleting data:', error);
      showNotification('Gagal menghapus data', 'error');
    }
  }

  // Download report - FIXED with better error handling and CSV fallback
  async function downloadReport() {
    showNotification('Menyiapkan laporan...', 'info');
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Try API first
      let exportData = [];
      try {
        const response = await fetch(`/api/evaluasi-iku-bulanan/export/excel?tahun=${selectedYear}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          exportData = result.data || [];
        }
      } catch (apiError) {
        console.warn('API export failed, using local data:', apiError);
      }
      
      // Fallback to local data if API fails
      if (exportData.length === 0 && currentData.length > 0) {
        exportData = currentData.map(item => ({
          'Indikator': item.indikator || '-',
          'Sasaran Strategi': item.sasaran_strategi?.sasaran || '-',
          'Perspektif': item.sasaran_strategi?.perspektif || '-',
          'Target': item.targetTahunIni || 0,
          'Realisasi': item.totalRealisasi || 0,
          'Capaian (%)': item.persentaseCapaian?.toFixed(1) || '0',
          'Status': item.status || 'Belum Ada Realisasi',
          'Satuan': item.satuan || '-',
          'PIC': item.pic || '-'
        }));
      }
      
      if (exportData.length === 0) {
        showNotification('Tidak ada data untuk diunduh', 'error');
        return;
      }
      
      // Try Excel export with SheetJS
      if (typeof XLSX !== 'undefined') {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Evaluasi IKU');
        XLSX.writeFile(wb, `Evaluasi_IKU_${selectedYear}.xlsx`);
        showNotification('Laporan Excel berhasil diunduh', 'success');
      } else {
        // Fallback to CSV
        const headers = Object.keys(exportData[0]).join(',');
        const rows = exportData.map(row => 
          Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        const csv = '\uFEFF' + headers + '\n' + rows; // BOM for Excel UTF-8
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Evaluasi_IKU_${selectedYear}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Laporan CSV berhasil diunduh', 'success');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      showNotification('Gagal mengunduh laporan: ' + error.message, 'error');
    }
  }

  // Close modal
  function closeModal() {
    document.querySelectorAll('.evaluasi-modal').forEach(modal => {
      modal.classList.remove('active');
    });
    selectedIKU = null;
    
    const ikuSelect = document.getElementById('select-iku');
    if (ikuSelect) ikuSelect.disabled = false;
  }

  // Helper functions
  function getStatusClass(status) {
    const statusMap = {
      'Tercapai': 'tercapai',
      'Hampir Tercapai': 'hampir',
      'Dalam Proses': 'proses',
      'Perlu Perhatian': 'perhatian',
      'Belum Ada Realisasi': 'belum'
    };
    return statusMap[status] || 'belum';
  }

  function getStatusIcon(status) {
    const iconMap = {
      'Tercapai': '<i data-lucide="check-circle" style="width:14px;height:14px"></i>',
      'Hampir Tercapai': '<i data-lucide="trending-up" style="width:14px;height:14px"></i>',
      'Dalam Proses': '<i data-lucide="clock" style="width:14px;height:14px"></i>',
      'Perlu Perhatian': '<i data-lucide="alert-triangle" style="width:14px;height:14px"></i>',
      'Belum Ada Realisasi': '<i data-lucide="minus-circle" style="width:14px;height:14px"></i>'
    };
    return iconMap[status] || '';
  }

  function formatNumber(num) {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('id-ID', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    }).format(num);
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showLoading(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
  }

  function showNotification(message, type = 'info') {
    // Use existing notification system or create simple one
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    } else {
      // Create toast notification
      const existingToast = document.querySelector('.evaluasi-toast');
      if (existingToast) existingToast.remove();
      
      const toast = document.createElement('div');
      toast.className = `evaluasi-toast evaluasi-toast-${type}`;
      toast.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        padding: 0.75rem 1rem;
        border-radius: 6px;
        color: white;
        font-size: 0.75rem;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      `;
      toast.textContent = message;
      document.body.appendChild(toast);
      
      // Add animation keyframes if not exists
      if (!document.getElementById('evaluasi-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'evaluasi-toast-styles';
        style.textContent = `
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }
      
      setTimeout(() => toast.remove(), 3000);
    }
  }

  // Public API
  return {
    init,
    loadData,
    openAddModal,
    openEditModal,
    viewDetail,
    deleteData,
    updateAccumulatedTotal,
    closeModal
  };
})();

// Initialize when DOM is ready - DISABLED if V3 is present
document.addEventListener('DOMContentLoaded', function() {
  // Skip if V3 module exists (V3 takes priority)
  if (typeof EvaluasiIKUV3 !== 'undefined') {
    console.log('EvaluasiIKUModule: V3 detected, skipping init');
    return;
  }
  const evaluasiPage = document.getElementById('evaluasi-iku-page') || document.getElementById('evaluasi-iku');
  if (evaluasiPage) {
    EvaluasiIKUModule.init();
  }
});

// Export for global access
window.EvaluasiIKUModule = EvaluasiIKUModule;
