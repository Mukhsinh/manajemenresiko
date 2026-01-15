/**
 * Evaluasi IKU Enhanced V2 Module
 * Features:
 * 1. Period filter (Bulanan, Triwulan, Semester, Tahunan)
 * 2. Year dropdown in form
 * 3. IKU dropdown integrated with table
 * 4. Scrollable table (horizontal & vertical)
 * 5. Solid color progress bars (green, orange, red)
 */

const EvaluasiIKUEnhancedV2 = (function() {
  'use strict';

  const BULAN_NAMES = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const BULAN_SHORT = [
    '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const PERIODE_OPTIONS = [
    { value: 'semua', label: 'Semua Periode' },
    { value: 'bulanan', label: 'Bulanan' },
    { value: 'triwulan', label: 'Triwulan' },
    { value: 'semester', label: 'Semester' },
    { value: 'tahunan', label: 'Tahunan' }
  ];

  let currentData = [];
  let allIKUOptions = [];
  let summaryData = {};
  let selectedYear = new Date().getFullYear();
  let selectedPeriode = 'semua';
  let selectedIKU = null;

  // Initialize module
  async function init() {
    // Skip if V3 is already active (V3 handles everything)
    const container = document.getElementById('evaluasi-iku');
    if (container && container.dataset.v3Enhanced === 'true') {
      console.log('V3 is active, V2 skipping initialization');
      return;
    }
    
    // Skip if V2 already initialized
    if (container && container.dataset.v2Enhanced === 'true') {
      console.log('V2 already initialized, skipping');
      return;
    }
    
    console.log('🚀 Initializing Evaluasi IKU Enhanced V2');
    
    if (container) container.dataset.v2Enhanced = 'true';

    // Set current year as default
    selectedYear = new Date().getFullYear();
    
    // Inject period filter if not exists
    injectPeriodFilter();
    
    setupEventListeners();
    await loadIKUOptions();
    await loadData();
  }

  // Inject period filter before year filter
  function injectPeriodFilter() {
    const filterSection = document.querySelector('.evaluasi-filter-section');
    if (!filterSection) return;

    // Check if period filter already exists
    if (document.getElementById('filter-periode')) return;

    // Find year filter group
    const yearFilterGroup = filterSection.querySelector('.filter-group');
    if (!yearFilterGroup) return;

    // Create period filter HTML
    const periodeFilterHTML = `
      <div class="filter-group filter-periode">
        <label for="filter-periode">Periode:</label>
        <select id="filter-periode">
          ${PERIODE_OPTIONS.map(opt => 
            `<option value="${opt.value}">${opt.label}</option>`
          ).join('')}
        </select>
      </div>
    `;

    // Insert before year filter
    yearFilterGroup.insertAdjacentHTML('beforebegin', periodeFilterHTML);
  }

  // Setup event listeners
  function setupEventListeners() {
    // Period filter
    const periodeSelect = document.getElementById('filter-periode');
    if (periodeSelect) {
      periodeSelect.addEventListener('change', (e) => {
        selectedPeriode = e.target.value;
        filterAndRenderData();
      });
    }

    // Year filter
    const yearSelect = document.getElementById('evaluasi-filter-tahun') || document.getElementById('filter-tahun');
    if (yearSelect) {
      yearSelect.value = selectedYear;
      yearSelect.addEventListener('change', (e) => {
        selectedYear = parseInt(e.target.value);
        loadData();
      });
    }

    // Add data button
    const addBtn = document.getElementById('evaluasi-btn-tambah') || document.getElementById('btn-tambah-data');
    if (addBtn) {
      addBtn.addEventListener('click', () => openAddModal());
    }

    // Download button
    const downloadBtn = document.getElementById('evaluasi-btn-unduh') || document.getElementById('btn-unduh-laporan');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => downloadReport());
    }
  }

  // Load IKU options for dropdown
  async function loadIKUOptions() {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Try authenticated endpoint first
      let data = [];
      try {
        const response = await fetch('/api/indikator-kinerja-utama', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          data = await response.json();
        }
      } catch (authError) {
        console.warn('Auth endpoint failed:', authError);
      }
      
      // Fallback to public endpoint
      if (!data || data.length === 0) {
        try {
          const publicResponse = await fetch('/api/indikator-kinerja-utama/public');
          if (publicResponse.ok) {
            data = await publicResponse.json();
          }
        } catch (publicError) {
          console.warn('Public endpoint failed:', publicError);
        }
      }
      
      console.log('V2 loaded IKU options:', data?.length || 0, 'items');
      allIKUOptions = data || [];
    } catch (error) {
      console.error('Error loading IKU options:', error);
      allIKUOptions = [];
    }
  }

  // Load data from API
  async function loadData() {
    try {
      showLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      let result = { data: [], summary: {} };
      
      // Try summary endpoint first
      try {
        const response = await fetch(`/api/evaluasi-iku-bulanan/summary?tahun=${selectedYear}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          result = await response.json();
        }
      } catch (summaryError) {
        console.warn('Summary endpoint failed:', summaryError);
      }
      
      // If no data, load IKU directly
      if (!result.data || result.data.length === 0) {
        try {
          const ikuResponse = await fetch('/api/indikator-kinerja-utama', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (ikuResponse.ok) {
            const ikuData = await ikuResponse.json();
            result.data = (ikuData || []).map(iku => ({
              id: iku.id,
              indikator: iku.indikator,
              satuan: iku.satuan,
              pic: iku.pic,
              sasaran_strategi: iku.sasaran_strategi,
              rencana_strategis: iku.rencana_strategis,
              targetTahunIni: iku[`target_${selectedYear}`] || iku.target_nilai || 0,
              totalRealisasi: 0,
              realisasiBulanan: {},
              jumlahBulanTerisi: 0,
              status: 'Belum Ada Realisasi',
              persentaseCapaian: null
            }));
            result.summary = {
              totalIKU: result.data.length,
              tercapai: 0,
              hampirTercapai: 0,
              dalamProses: 0,
              perluPerhatian: 0,
              belumAdaRealisasi: result.data.length,
              rataRataCapaian: 0
            };
          }
        } catch (ikuError) {
          console.warn('IKU endpoint failed:', ikuError);
        }
      }
      
      currentData = result.data || [];
      summaryData = result.summary || {};
      
      console.log('V2 loaded data:', currentData.length, 'items');
      
      renderSummaryCards();
      filterAndRenderData();
      showLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      showLoading(false);
      showNotification('Gagal memuat data', 'error');
    }
  }

  // Filter data based on selected period
  function filterAndRenderData() {
    let filteredData = [...currentData];
    
    if (selectedPeriode !== 'semua') {
      filteredData = currentData.filter(item => {
        const bulanTerisi = item.jumlahBulanTerisi || 0;
        
        switch (selectedPeriode) {
          case 'bulanan':
            return bulanTerisi >= 1;
          case 'triwulan':
            return bulanTerisi >= 3;
          case 'semester':
            return bulanTerisi >= 6;
          case 'tahunan':
            return bulanTerisi >= 12;
          default:
            return true;
        }
      });
    }
    
    renderDataTable(filteredData);
  }

  // Render summary cards
  function renderSummaryCards() {
    const container = document.getElementById('evaluasi-summary-cards') || document.getElementById('summary-cards');
    if (!container) return;

    const cards = [
      { key: 'totalIKU', label: 'Total IKU', icon: 'fa-chart-bar', class: 'total' },
      { key: 'tercapai', label: 'Tercapai', icon: 'fa-check-circle', class: 'tercapai' },
      { key: 'hampirTercapai', label: 'Hampir Tercapai', icon: 'fa-arrow-trend-up', class: 'hampir' },
      { key: 'dalamProses', label: 'Dalam Proses', icon: 'fa-clock', class: 'proses' },
      { key: 'perluPerhatian', label: 'Perlu Perhatian', icon: 'fa-triangle-exclamation', class: 'perhatian' },
      { key: 'belumAdaRealisasi', label: 'Belum Ada Data', icon: 'fa-circle-minus', class: 'belum' }
    ];

    container.innerHTML = cards.map(card => `
      <div class="summary-card ${card.class}">
        <div class="card-icon">
          <i class="fas ${card.icon}"></i>
        </div>
        <div class="card-value">${summaryData[card.key] || 0}</div>
        <div class="card-label">${card.label}</div>
      </div>
    `).join('');
  }

  // Render data table with scrollable container
  function renderDataTable(data) {
    const container = document.querySelector('.evaluasi-table-container') || 
                      document.getElementById('evaluasi-table-container');
    if (!container) return;

    // Wrap table in scrollable wrapper
    container.innerHTML = `
      <div class="evaluasi-table-wrapper">
        <table class="evaluasi-table">
          <thead>
            <tr>
              <th style="width:40px">NO</th>
              <th style="width:25%">INDIKATOR KINERJA UTAMA</th>
              <th style="width:10%">PERSPEKTIF</th>
              <th style="width:10%">TARGET</th>
              <th style="width:10%">REALISASI</th>
              <th style="width:15%">PROGRESS</th>
              <th style="width:12%">STATUS</th>
              <th style="width:10%">AKSI</th>
            </tr>
          </thead>
          <tbody id="evaluasi-iku-table-body">
          </tbody>
        </table>
      </div>
    `;

    const tbody = document.getElementById('evaluasi-iku-table-body');
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state">
            <i class="fas fa-inbox" style="font-size: 48px; opacity: 0.5; margin-bottom: 1rem;"></i>
            <h4>Belum Ada Data</h4>
            <p>Belum ada data IKU untuk tahun ${selectedYear}</p>
            <button class="btn-action primary" onclick="EvaluasiIKUEnhancedV2.openAddModal()">
              <i class="fas fa-plus"></i> Tambah Data
            </button>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map((item, index) => {
      const progressPercent = Math.min(item.persentaseCapaian || 0, 100);
      const progressClass = getProgressColorClass(progressPercent);
      const statusClass = getStatusClass(item.status);
      
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
                <div class="progress-bar-inner ${progressClass}" style="width: ${progressPercent}%"></div>
              </div>
              <span class="progress-value-text">${(item.persentaseCapaian || 0).toFixed(1)}%</span>
            </div>
          </td>
          <td>
            <span class="status-badge ${statusClass}">
              ${getStatusIcon(item.status)}
              ${item.status || 'Belum Ada Realisasi'}
            </span>
          </td>
          <td>
            <div class="action-icons">
              <button class="action-icon edit" onclick="EvaluasiIKUEnhancedV2.openEditModal('${item.id}')" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-icon view" onclick="EvaluasiIKUEnhancedV2.viewDetail('${item.id}')" title="Detail">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-icon delete" onclick="EvaluasiIKUEnhancedV2.deleteData('${item.id}')" title="Hapus">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Get progress bar color class - SOLID COLORS
  function getProgressColorClass(percent) {
    if (percent >= 100) return 'green';      // Solid Green
    if (percent >= 75) return 'orange';      // Solid Orange
    if (percent >= 50) return 'orange';      // Solid Orange
    if (percent > 0) return 'red';           // Solid Red
    return 'gray';                           // Solid Gray
  }

  // Get status class
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

  // Get status icon
  function getStatusIcon(status) {
    const iconMap = {
      'Tercapai': '<i class="fas fa-check-circle" style="margin-right:4px"></i>',
      'Hampir Tercapai': '<i class="fas fa-arrow-trend-up" style="margin-right:4px"></i>',
      'Dalam Proses': '<i class="fas fa-clock" style="margin-right:4px"></i>',
      'Perlu Perhatian': '<i class="fas fa-triangle-exclamation" style="margin-right:4px"></i>',
      'Belum Ada Realisasi': '<i class="fas fa-circle-minus" style="margin-right:4px"></i>'
    };
    return iconMap[status] || '';
  }

  // Open add modal with year dropdown and IKU dropdown
  function openAddModal() {
    selectedIKU = null;
    createModalIfNeeded();
    
    const modal = document.getElementById('modal-evaluasi-iku');
    const form = document.getElementById('form-evaluasi-iku');
    const title = document.getElementById('modal-evaluasi-title');
    
    if (title) title.textContent = 'Tambah Realisasi IKU';
    if (form) form.reset();
    
    // Populate IKU dropdown
    populateIKUDropdown();
    
    // Populate year dropdown
    populateYearDropdown();
    
    // Enable IKU select
    const ikuSelect = document.getElementById('select-iku');
    if (ikuSelect) ikuSelect.disabled = false;
    
    // Reset monthly inputs
    renderMonthlyInputs(null);
    
    // Hide selected IKU info
    const infoCard = document.getElementById('selected-iku-info');
    if (infoCard) infoCard.style.display = 'none';
    
    if (modal) modal.classList.add('active');
  }

  // Populate IKU dropdown from table data
  function populateIKUDropdown() {
    const select = document.getElementById('select-iku');
    if (!select) return;

    // Use allIKUOptions if available, otherwise use currentData
    const options = allIKUOptions.length > 0 ? allIKUOptions : currentData;

    select.innerHTML = `
      <option value="">-- Pilih Indikator Kinerja Utama --</option>
      ${options.map(iku => `
        <option value="${iku.id}" 
                data-perspektif="${escapeHtml(iku.sasaran_strategi?.perspektif || '-')}"
                data-sasaran="${escapeHtml(iku.sasaran_strategi?.sasaran || '-')}"
                data-satuan="${escapeHtml(iku.satuan || '-')}"
                data-target="${iku.targetTahunIni || iku.target_nilai || 0}">
          ${escapeHtml(iku.indikator)}
        </option>
      `).join('')}
    `;

    // Add change listener to show selected IKU info
    select.addEventListener('change', onIKUSelectChange);
  }

  // Handle IKU selection change
  function onIKUSelectChange(e) {
    const select = e.target;
    const selectedOption = select.options[select.selectedIndex];
    const infoCard = document.getElementById('selected-iku-info');
    
    if (!infoCard) return;

    if (select.value) {
      const perspektif = selectedOption.dataset.perspektif || '-';
      const sasaran = selectedOption.dataset.sasaran || '-';
      const satuan = selectedOption.dataset.satuan || '-';
      const target = selectedOption.dataset.target || '0';

      infoCard.innerHTML = `
        <div class="iku-name">${escapeHtml(selectedOption.text)}</div>
        <div class="iku-detail">
          <span><i class="fas fa-layer-group"></i> ${perspektif}</span>
          <span><i class="fas fa-bullseye"></i> Target: ${formatNumber(parseFloat(target))} ${satuan}</span>
        </div>
      `;
      infoCard.style.display = 'block';
    } else {
      infoCard.style.display = 'none';
    }
  }

  // Populate year dropdown in form
  function populateYearDropdown() {
    const select = document.getElementById('select-tahun-form');
    if (!select) return;

    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 2; y <= currentYear + 5; y++) {
      years.push(y);
    }

    select.innerHTML = years.map(y => 
      `<option value="${y}" ${y === selectedYear ? 'selected' : ''}>${y}</option>`
    ).join('');
  }

  // Create modal dynamically if not exists
  function createModalIfNeeded() {
    if (document.getElementById('modal-evaluasi-iku')) return;
    
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let y = currentYear - 2; y <= currentYear + 5; y++) {
      yearOptions.push(`<option value="${y}" ${y === selectedYear ? 'selected' : ''}>${y}</option>`);
    }
    
    const modalHTML = `
      <!-- Add/Edit Modal -->
      <div class="evaluasi-modal" id="modal-evaluasi-iku">
        <div class="evaluasi-modal-content">
          <div class="evaluasi-modal-header">
            <h3 id="modal-evaluasi-title">Tambah Realisasi IKU</h3>
            <button class="evaluasi-modal-close" type="button" onclick="EvaluasiIKUEnhancedV2.closeModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <form id="form-evaluasi-iku" onsubmit="EvaluasiIKUEnhancedV2.handleFormSubmit(event)">
            <div class="evaluasi-modal-body">
              <!-- IKU Selection -->
              <div class="form-group">
                <label for="select-iku">Indikator Kinerja Utama <span class="required">*</span></label>
                <div class="iku-select-wrapper">
                  <select id="select-iku" required>
                    <option value="">-- Pilih IKU --</option>
                  </select>
                </div>
                <div id="selected-iku-info" class="selected-iku-info" style="display:none"></div>
              </div>
              
              <!-- Year Selection -->
              <div class="form-row">
                <div class="form-group">
                  <label for="select-tahun-form">Tahun <span class="required">*</span></label>
                  <select id="select-tahun-form" required>
                    ${yearOptions.join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>&nbsp;</label>
                  <div style="font-size:0.75rem;color:#6b7280;padding-top:0.5rem">
                    <i class="fas fa-info-circle"></i> Pilih tahun untuk input realisasi
                  </div>
                </div>
              </div>
              
              <!-- Monthly Inputs Section -->
              <div class="monthly-section-title">
                <i class="fas fa-calendar-alt"></i> Input Realisasi Bulanan
              </div>
              <p style="font-size:0.75rem;color:#6b7280;margin-bottom:0.75rem">
                Masukkan nilai realisasi untuk setiap bulan. Total akan dihitung otomatis.
              </p>
              
              <div id="monthly-inputs"></div>
            </div>
            <div class="evaluasi-modal-footer">
              <button type="button" class="btn-action secondary" onclick="EvaluasiIKUEnhancedV2.closeModal()">
                <i class="fas fa-times"></i> Batal
              </button>
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
            <button class="evaluasi-modal-close" type="button" onclick="EvaluasiIKUEnhancedV2.closeModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="evaluasi-modal-body" id="detail-content-iku"></div>
          <div class="evaluasi-modal-footer">
            <button type="button" class="btn-action secondary" onclick="EvaluasiIKUEnhancedV2.closeModal()">
              <i class="fas fa-times"></i> Tutup
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // Render monthly input fields
  function renderMonthlyInputs(existingData) {
    const container = document.getElementById('monthly-inputs');
    if (!container) return;

    container.innerHTML = `
      <div class="monthly-grid">
        ${BULAN_SHORT.slice(1).map((bulan, idx) => {
          const monthNum = idx + 1;
          const existing = existingData ? existingData[monthNum] : null;
          const hasValue = existing && existing.realisasi !== null;
          
          return `
            <div class="month-input-card ${hasValue ? 'has-value' : ''}">
              <div class="month-label">${bulan}</div>
              <input type="number" 
                     step="0.01" 
                     name="bulan_${monthNum}" 
                     placeholder="0"
                     value="${hasValue ? existing.realisasi : ''}"
                     onchange="EvaluasiIKUEnhancedV2.updateAccumulatedTotal()">
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

  // Open edit modal
  async function openEditModal(ikuId) {
    const item = currentData.find(d => d.id === ikuId);
    if (!item) return;

    selectedIKU = item;
    createModalIfNeeded();
    
    const modal = document.getElementById('modal-evaluasi-iku');
    const title = document.getElementById('modal-evaluasi-title');
    
    if (title) title.textContent = 'Edit Realisasi IKU';
    
    // Populate and set IKU select
    populateIKUDropdown();
    const ikuSelect = document.getElementById('select-iku');
    if (ikuSelect) {
      ikuSelect.value = ikuId;
      ikuSelect.disabled = true;
      
      // Trigger change to show info
      ikuSelect.dispatchEvent(new Event('change'));
    }

    // Set year
    const yearSelect = document.getElementById('select-tahun-form');
    if (yearSelect) {
      yearSelect.value = selectedYear;
    }

    // Render monthly inputs with existing data
    renderMonthlyInputs(item.realisasiBulanan);
    updateAccumulatedTotal();
    
    if (modal) modal.classList.add('active');
  }

  // Handle form submit
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    const ikuSelect = document.getElementById('select-iku');
    const yearSelect = document.getElementById('select-tahun-form');
    const ikuId = selectedIKU?.id || ikuSelect?.value;
    const tahun = yearSelect?.value || selectedYear;
    
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
          tahun: parseInt(tahun),
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

    createModalIfNeeded();

    const modal = document.getElementById('modal-detail-iku');
    const content = document.getElementById('detail-content-iku');
    
    if (content) {
      const progressPercent = item.persentaseCapaian || 0;
      const progressClass = getProgressColorClass(progressPercent);
      
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
            <span class="info-value">
              <div class="progress-bar-wrapper" style="width:150px">
                <div class="progress-bar">
                  <div class="progress-bar-inner ${progressClass}" style="width:${Math.min(progressPercent, 100)}%"></div>
                </div>
                <span class="progress-value-text">${progressPercent.toFixed(1)}%</span>
              </div>
            </span>
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
        
        <h5 style="margin-top:1.5rem;margin-bottom:1rem;font-size:0.875rem">
          <i class="fas fa-calendar-alt"></i> Realisasi Bulanan
        </h5>
        <div class="evaluasi-table-wrapper" style="max-height:250px">
          <table class="evaluasi-table detail-table">
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
        </div>
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

  // Download report
  async function downloadReport() {
    showNotification('Menyiapkan laporan...', 'info');
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
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
      
      // Fallback to local data
      if (exportData.length === 0 && currentData.length > 0) {
        exportData = currentData.map(item => ({
          'Indikator': item.indikator || '-',
          'Sasaran Strategi': item.sasaran_strategi?.sasaran || '-',
          'Perspektif': item.sasaran_strategi?.perspektif || '-',
          'Target': item.targetTahunIni || 0,
          'Realisasi': item.totalRealisasi || 0,
          'Capaian (%)': (item.persentaseCapaian || 0).toFixed(1),
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
        const csv = '\uFEFF' + headers + '\n' + rows;
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
    const existingToast = document.querySelector('.evaluasi-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `evaluasi-toast evaluasi-toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      color: white;
      font-size: 0.8rem;
      z-index: 9999;
      animation: slideInRight 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" style="margin-right:0.5rem"></i>${message}`;
    document.body.appendChild(toast);
    
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

  // Public API
  return {
    init,
    loadData,
    openAddModal,
    openEditModal,
    viewDetail,
    deleteData,
    updateAccumulatedTotal,
    closeModal,
    handleFormSubmit
  };
})();

// Initialize when DOM is ready - DISABLED if V3 is present
document.addEventListener('DOMContentLoaded', function() {
  // Skip if V3 module exists (V3 takes priority)
  if (typeof EvaluasiIKUV3 !== 'undefined') {
    console.log('EvaluasiIKUEnhancedV2: V3 detected, skipping init');
    return;
  }
  const evaluasiPage = document.getElementById('evaluasi-iku-page') || 
                       document.getElementById('evaluasi-iku') ||
                       document.querySelector('.evaluasi-iku-page');
  if (evaluasiPage) {
    EvaluasiIKUEnhancedV2.init();
  }
});

// Listen for page navigation events (SPA) - DISABLED if V3 is present
document.addEventListener('pageChanged', function(e) {
  if (e.detail && (e.detail.page === 'evaluasi-iku' || e.detail.path?.includes('evaluasi-iku'))) {
    EvaluasiIKUEnhancedV2.init();
  }
});

// Export for global access
window.EvaluasiIKUEnhancedV2 = EvaluasiIKUEnhancedV2;
