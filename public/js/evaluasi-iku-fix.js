/**
 * Evaluasi IKU Fix Module
 * Fixes:
 * 1. Table not displaying data
 * 2. Charts not showing correct data
 * 3. Duplicate Tambah and Unduh Laporan buttons
 */
(function() {
  'use strict';
  
  const BULAN_SHORT = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  let statusChart = null, trendChart = null;
  let currentData = [], summaryStats = {};
  let selectedYear = new Date().getFullYear();
  let isInitialized = false;

  // Wait for DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initFix, 500); // Delay to let other modules initialize first
  });
  
  // Also listen for page navigation
  document.addEventListener('pageChanged', function(e) {
    if (e.detail?.page === 'evaluasi-iku') {
      isInitialized = false; // Reset for re-initialization
      setTimeout(initFix, 300);
    }
  });
  
  // Listen for hash change
  window.addEventListener('hashchange', function() {
    if (window.location.hash === '#evaluasi-iku' || window.location.hash.includes('evaluasi-iku')) {
      isInitialized = false;
      setTimeout(initFix, 300);
    }
  });

  function initFix() {
    const container = document.getElementById('evaluasi-iku') || 
                      document.getElementById('evaluasi-iku-page');
    if (!container) return;
    
    // Check if page is visible
    const isVisible = container.style.display !== 'none' && 
                      container.offsetParent !== null;
    
    if (!isVisible && !window.location.hash.includes('evaluasi-iku')) {
      return; // Don't initialize if page is not visible
    }
    
    // Prevent multiple initializations
    if (isInitialized) return;
    
    console.log('🔧 Evaluasi IKU Fix initializing...');
    isInitialized = true;
    
    // Fix duplicate buttons
    fixDuplicateButtons();
    
    // Setup year filter with current year
    setupYearFilter();
    
    // Load data automatically after a short delay
    setTimeout(loadDataWithFix, 200);
  }

  function fixDuplicateButtons() {
    // Remove duplicate Tambah buttons
    const tambahBtns = document.querySelectorAll('[id*="btn-tambah"], button:contains("Tambah")');
    const seenTambah = new Set();
    tambahBtns.forEach(btn => {
      const parent = btn.closest('.evaluasi-filter-actions, .filter-actions, .action-buttons');
      if (parent) {
        const key = parent.className;
        if (seenTambah.has(key)) {
          btn.remove();
        } else {
          seenTambah.add(key);
        }
      }
    });
    
    // Remove duplicate Unduh buttons
    const unduhBtns = document.querySelectorAll('[id*="btn-unduh"], button:contains("Unduh")');
    const seenUnduh = new Set();
    unduhBtns.forEach(btn => {
      const parent = btn.closest('.evaluasi-filter-actions, .filter-actions, .action-buttons');
      if (parent) {
        const key = parent.className;
        if (seenUnduh.has(key)) {
          btn.remove();
        } else {
          seenUnduh.add(key);
        }
      }
    });
    
    // Also check for duplicate action containers
    const actionContainers = document.querySelectorAll('.evaluasi-filter-actions');
    if (actionContainers.length > 1) {
      for (let i = 1; i < actionContainers.length; i++) {
        actionContainers[i].remove();
      }
    }
  }

  function setupYearFilter() {
    const yearSelect = document.getElementById('filter-tahun-v3') || 
                       document.getElementById('filter-tahun-evaluasi') ||
                       document.getElementById('filter-tahun');
    
    if (yearSelect && !yearSelect.value) {
      yearSelect.value = selectedYear;
      // Trigger change event
      yearSelect.dispatchEvent(new Event('change'));
    }
    
    // Enable periode filter
    const periodeSelect = document.getElementById('filter-periode-v3');
    if (periodeSelect) {
      periodeSelect.disabled = false;
      if (!periodeSelect.value || periodeSelect.value === '') {
        periodeSelect.value = 'semua';
      }
    }
    
    // Hide hint
    const hint = document.getElementById('periode-hint');
    if (hint) hint.style.display = 'none';
  }

  async function loadDataWithFix() {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Show loading state
      showTableLoading();
      
      let result = { data: [], summary: {} };
      
      // Try summary endpoint
      try {
        const response = await fetch(`/api/evaluasi-iku-bulanan/summary?tahun=${selectedYear}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          result = await response.json();
          console.log('📊 Loaded summary data:', result.data?.length || 0, 'items');
        }
      } catch (err) {
        console.warn('Summary endpoint failed:', err);
      }
      
      // If no data, try loading IKU directly
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
              persentaseCapaian: 0
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
            
            console.log('📊 Loaded IKU data:', result.data.length, 'items');
          }
        } catch (ikuErr) {
          console.warn('IKU endpoint failed:', ikuErr);
        }
      }
      
      currentData = result.data || [];
      summaryStats = result.summary || {};
      
      // Update UI
      updateSummaryCards();
      updateCharts();
      renderTable();
      
    } catch (error) {
      console.error('Error loading data:', error);
      showTableError();
    }
  }

  function showTableLoading() {
    const tbody = document.getElementById('evaluasi-table-body-v3') || 
                  document.getElementById('evaluasi-iku-table-body') ||
                  document.getElementById('evaluasi-table-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state" style="text-align:center;padding:3rem;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#3b82f6;"></i>
            <p style="margin-top:1rem;color:#6b7280;">Memuat data...</p>
          </td>
        </tr>`;
    }
  }

  function showTableError() {
    const tbody = document.getElementById('evaluasi-table-body-v3') || 
                  document.getElementById('evaluasi-iku-table-body') ||
                  document.getElementById('evaluasi-table-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state" style="text-align:center;padding:3rem;">
            <i class="fas fa-exclamation-triangle" style="font-size:2rem;color:#ef4444;"></i>
            <h4 style="margin-top:1rem;">Gagal Memuat Data</h4>
            <p style="color:#6b7280;">Silakan refresh halaman atau coba lagi</p>
            <button class="btn-primary" onclick="location.reload()" style="margin-top:1rem;">
              <i class="fas fa-refresh"></i> Refresh
            </button>
          </td>
        </tr>`;
    }
  }

  function updateSummaryCards() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || 0;
    };
    
    setVal('stat-total', summaryStats.totalIKU);
    setVal('stat-tercapai', summaryStats.tercapai);
    setVal('stat-hampir', summaryStats.hampirTercapai);
    setVal('stat-proses', summaryStats.dalamProses);
    setVal('stat-perhatian', summaryStats.perluPerhatian);
    setVal('stat-belum', summaryStats.belumAdaRealisasi);
  }

  function updateCharts() {
    // Update status chart (pie/doughnut)
    const statusCanvas = document.getElementById('chart-status-iku');
    if (statusCanvas && typeof Chart !== 'undefined') {
      // Destroy existing chart if exists
      if (statusChart) {
        statusChart.destroy();
      }
      
      const chartData = [
        summaryStats.tercapai || 0,
        summaryStats.hampirTercapai || 0,
        summaryStats.dalamProses || 0,
        summaryStats.perluPerhatian || 0,
        summaryStats.belumAdaRealisasi || 0
      ];
      
      // Only create chart if there's data
      const hasData = chartData.some(v => v > 0);
      
      statusChart = new Chart(statusCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Tercapai', 'Hampir Tercapai', 'Dalam Proses', 'Perlu Perhatian', 'Belum Ada Data'],
          datasets: [{
            data: hasData ? chartData : [0, 0, 0, 0, 1],
            backgroundColor: hasData 
              ? ['#22c55e', '#f97316', '#eab308', '#ef4444', '#9ca3af']
              : ['#e5e7eb', '#e5e7eb', '#e5e7eb', '#e5e7eb', '#e5e7eb'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 11 }, padding: 15 }
            }
          },
          cutout: '60%'
        }
      });
    }
    
    // Update trend chart (line)
    const trendCanvas = document.getElementById('chart-trend-iku');
    if (trendCanvas && typeof Chart !== 'undefined') {
      // Destroy existing chart if exists
      if (trendChart) {
        trendChart.destroy();
      }
      
      // Calculate monthly averages
      const monthlyAvg = Array(12).fill(0);
      const monthlyCount = Array(12).fill(0);
      
      currentData.forEach(item => {
        if (item.realisasiBulanan) {
          Object.values(item.realisasiBulanan).forEach(m => {
            if (m.realisasi !== null && item.targetTahunIni > 0) {
              const idx = m.bulan - 1;
              monthlyAvg[idx] += (m.realisasi / item.targetTahunIni) * 100;
              monthlyCount[idx]++;
            }
          });
        }
      });
      
      const trendData = monthlyAvg.map((sum, i) => 
        monthlyCount[i] > 0 ? Math.round(sum / monthlyCount[i]) : 0
      );
      
      trendChart = new Chart(trendCanvas, {
        type: 'line',
        data: {
          labels: BULAN_SHORT.slice(1),
          datasets: [{
            label: 'Capaian (%)',
            data: trendData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#3b82f6'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { callback: v => v + '%' }
            }
          }
        }
      });
    }
  }

  function renderTable() {
    const tbody = document.getElementById('evaluasi-table-body-v3') || 
                  document.getElementById('evaluasi-iku-table-body') ||
                  document.getElementById('evaluasi-table-body');
    
    if (!tbody) return;
    
    // Update table count
    const countEl = document.getElementById('table-count-v3');
    if (countEl) countEl.textContent = `${currentData.length} data`;
    
    if (!currentData || currentData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state" style="text-align:center;padding:3rem;">
            <i class="fas fa-inbox" style="font-size:3rem;color:#9ca3af;opacity:0.5;"></i>
            <h4 style="margin-top:1rem;color:#374151;">Belum Ada Data</h4>
            <p style="color:#6b7280;margin-bottom:1rem;">Belum ada data IKU untuk tahun ${selectedYear}</p>
            <button class="btn-primary" onclick="EvaluasiIKUV3?.openAddModal?.() || EvaluasiIKUModule?.openAddModal?.()">
              <i class="fas fa-plus"></i> Tambah Data
            </button>
          </td>
        </tr>`;
      return;
    }
    
    tbody.innerHTML = currentData.map((item, idx) => {
      const pct = Math.min(item.persentaseCapaian || 0, 100);
      const progressClass = getProgressClass(pct);
      const statusClass = getStatusClass(item.status);
      
      return `
        <tr data-id="${item.id}">
          <td style="text-align:center;">${idx + 1}</td>
          <td class="cell-indikator">
            <div class="indikator-name" style="font-weight:500;color:#1f2937;margin-bottom:0.25rem;">
              ${escapeHtml(item.indikator || '-')}
            </div>
            <div class="sasaran-name" style="font-size:0.75rem;color:#6b7280;">
              ${escapeHtml(item.sasaran_strategi?.sasaran || '-')}
            </div>
          </td>
          <td>${escapeHtml(item.sasaran_strategi?.perspektif || '-')}</td>
          <td style="text-align:right;">${formatNumber(item.targetTahunIni)} ${item.satuan || ''}</td>
          <td style="text-align:right;">${formatNumber(item.totalRealisasi)} ${item.satuan || ''}</td>
          <td>
            <div class="progress-wrapper" style="display:flex;align-items:center;gap:0.5rem;">
              <div class="progress-track" style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;">
                <div class="progress-fill ${progressClass}" style="height:100%;width:${pct}%;border-radius:4px;"></div>
              </div>
              <span class="progress-text" style="font-size:0.75rem;font-weight:500;min-width:45px;">
                ${(item.persentaseCapaian || 0).toFixed(1)}%
              </span>
            </div>
          </td>
          <td>
            <span class="status-pill ${statusClass}" style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.25rem 0.5rem;border-radius:9999px;font-size:0.75rem;">
              ${getStatusIcon(item.status)}
              ${item.status || 'Belum Ada Realisasi'}
            </span>
          </td>
          <td>
            <div class="action-btns" style="display:flex;gap:0.25rem;justify-content:center;">
              <button class="action-btn edit" onclick="EvaluasiIKUV3?.openEditModal?.('${item.id}') || EvaluasiIKUModule?.openEditModal?.('${item.id}')" title="Edit" style="padding:0.25rem 0.5rem;border:none;border-radius:4px;cursor:pointer;background:#3b82f6;color:white;">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn view" onclick="EvaluasiIKUV3?.viewDetail?.('${item.id}') || EvaluasiIKUModule?.viewDetail?.('${item.id}')" title="Detail" style="padding:0.25rem 0.5rem;border:none;border-radius:4px;cursor:pointer;background:#10b981;color:white;">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-btn delete" onclick="EvaluasiIKUV3?.deleteData?.('${item.id}') || EvaluasiIKUModule?.deleteData?.('${item.id}')" title="Hapus" style="padding:0.25rem 0.5rem;border:none;border-radius:4px;cursor:pointer;background:#ef4444;color:white;">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  // Helper functions
  function getProgressClass(pct) {
    if (pct >= 100) return 'green';
    if (pct >= 50) return 'orange';
    if (pct > 0) return 'red';
    return 'gray';
  }

  function getStatusClass(status) {
    const map = {
      'Tercapai': 'tercapai',
      'Hampir Tercapai': 'hampir',
      'Dalam Proses': 'proses',
      'Perlu Perhatian': 'perhatian',
      'Belum Ada Realisasi': 'belum'
    };
    return map[status] || 'belum';
  }

  function getStatusIcon(status) {
    const icons = {
      'Tercapai': '<i class="fas fa-check-circle"></i>',
      'Hampir Tercapai': '<i class="fas fa-arrow-trend-up"></i>',
      'Dalam Proses': '<i class="fas fa-clock"></i>',
      'Perlu Perhatian': '<i class="fas fa-triangle-exclamation"></i>',
      'Belum Ada Realisasi': '<i class="fas fa-circle-minus"></i>'
    };
    return icons[status] || '<i class="fas fa-circle-minus"></i>';
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

  // Expose for external use
  window.EvaluasiIKUFix = {
    init: initFix,
    loadData: loadDataWithFix,
    fixDuplicateButtons: fixDuplicateButtons
  };
})();
