/**
 * Evaluasi IKU Enhanced Module
 * - Tombol Tambah dan Unduh yang berfungsi
 * - Form filter yang lebih pendek
 * - Mencegah overflow
 * - Contoh data isian
 */

const EvaluasiIKUEnhanced = (function() {
  'use strict';

  const BULAN_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const BULAN_FULL = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  let state = {
    data: [],
    summary: {},
    selectedYear: new Date().getFullYear(),
    selectedIKU: null,
    ikuOptions: [],
    isLoading: false
  };

  // Sample data for demonstration
  const SAMPLE_DATA = [
    { indikator: 'Tingkat Kepuasan Pasien', target: 85, realisasi: 82.5, satuan: '%', perspektif: 'Pelanggan' },
    { indikator: 'Bed Occupancy Rate (BOR)', target: 75, realisasi: 68.3, satuan: '%', perspektif: 'Proses Internal' },
    { indikator: 'Average Length of Stay (ALOS)', target: 4, realisasi: 3.8, satuan: 'Hari', perspektif: 'Proses Internal' },
    { indikator: 'Rasio Pendapatan per Tempat Tidur', target: 150, realisasi: 142, satuan: 'Juta', perspektif: 'Keuangan' },
    { indikator: 'Tingkat Kepatuhan SOP', target: 95, realisasi: 91.2, satuan: '%', perspektif: 'Pembelajaran' }
  ];

  async function init() {
    // Skip if V3 or V2 is already active
    const container = document.getElementById('evaluasi-iku') || document.getElementById('evaluasi-iku-page');
    if (container && (container.dataset.v3Enhanced === 'true' || container.dataset.v2Enhanced === 'true' || container.dataset.baseInitialized === 'true')) {
      console.log('Another version is active, Enhanced module skipping initialization');
      return;
    }
    
    console.log('🚀 Initializing Evaluasi IKU Enhanced');
    setupContainer();
    await loadData();
  }

  function setupContainer() {
    const container = document.getElementById('evaluasi-iku-content') || 
                      document.getElementById('evaluasi-iku-page') ||
                      document.getElementById('main-content');
    if (!container) return;
    
    container.innerHTML = `<div id="evaluasi-iku-enhanced" class="evaluasi-iku-page"></div>`;
  }


  function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || 
           localStorage.getItem('supabase_token');
  }

  async function loadData() {
    state.isLoading = true;
    render();
    
    try {
      const token = getToken();
      const response = await fetch(`/api/evaluasi-iku-bulanan/summary?tahun=${state.selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        state.data = result.data || [];
        state.summary = result.summary || {};
      } else {
        // Use sample data if API fails
        state.data = generateSampleData();
        state.summary = calculateSummary(state.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      state.data = generateSampleData();
      state.summary = calculateSummary(state.data);
    }
    
    state.isLoading = false;
    render();
  }

  function generateSampleData() {
    return SAMPLE_DATA.map((item, idx) => {
      const persentase = (item.realisasi / item.target) * 100;
      let status = 'Belum Ada Realisasi';
      if (persentase >= 100) status = 'Tercapai';
      else if (persentase >= 75) status = 'Hampir Tercapai';
      else if (persentase >= 50) status = 'Dalam Proses';
      else status = 'Perlu Perhatian';
      
      return {
        id: `sample-${idx}`,
        indikator: item.indikator,
        satuan: item.satuan,
        targetTahunIni: item.target,
        totalRealisasi: item.realisasi,
        persentaseCapaian: persentase,
        status: status,
        sasaran_strategi: { perspektif: item.perspektif, sasaran: `Sasaran ${item.perspektif}` },
        realisasiBulanan: generateMonthlyData(item.realisasi)
      };
    });
  }

  function generateMonthlyData(total) {
    const monthly = {};
    const monthlyValue = total / 12;
    for (let i = 1; i <= 12; i++) {
      monthly[i] = {
        bulan: i,
        namaBulan: BULAN_FULL[i],
        realisasi: i <= new Date().getMonth() + 1 ? +(monthlyValue * (0.8 + Math.random() * 0.4)).toFixed(2) : null,
        id: null
      };
    }
    return monthly;
  }

  function calculateSummary(data) {
    const summary = { totalIKU: data.length, tercapai: 0, hampirTercapai: 0, dalamProses: 0, perluPerhatian: 0, belumAdaRealisasi: 0, rataRataCapaian: 0 };
    let totalCapaian = 0;
    data.forEach(item => {
      if (item.status === 'Tercapai') summary.tercapai++;
      else if (item.status === 'Hampir Tercapai') summary.hampirTercapai++;
      else if (item.status === 'Dalam Proses') summary.dalamProses++;
      else if (item.status === 'Perlu Perhatian') summary.perluPerhatian++;
      else summary.belumAdaRealisasi++;
      if (item.persentaseCapaian) totalCapaian += item.persentaseCapaian;
    });
    summary.rataRataCapaian = data.length > 0 ? totalCapaian / data.length : 0;
    return summary;
  }


  function render() {
    const container = document.getElementById('evaluasi-iku-enhanced');
    if (!container) return;

    if (state.isLoading) {
      container.innerHTML = `
        <div style="display:flex;justify-content:center;align-items:center;min-height:200px;">
          <div style="text-align:center;">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#3b82f6;"></i>
            <p style="margin-top:0.5rem;color:#666;font-size:0.85rem;">Memuat data...</p>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = `
      ${renderFilter()}
      ${renderTable()}
    `;
  }

  function renderFilter() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 2; y <= currentYear + 2; y++) years.push(y);

    return `
      <div class="evaluasi-filter-compact">
        <div class="filter-item">
          <label>TAHUN:</label>
          <select id="filter-tahun-evaluasi" onchange="EvaluasiIKUEnhanced.changeYear(this.value)">
            ${years.map(y => `<option value="${y}" ${y === state.selectedYear ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>
        <div class="evaluasi-actions-compact">
          <button class="btn-compact primary" onclick="EvaluasiIKUEnhanced.openAddModal()">
            <i class="fas fa-plus"></i> Tambah
          </button>
          <button class="btn-compact success" onclick="EvaluasiIKUEnhanced.downloadReport()">
            <i class="fas fa-download"></i> Unduh Laporan
          </button>
        </div>
      </div>
    `;
  }

  function renderTable() {
    if (!state.data || state.data.length === 0) {
      return `
        <div class="evaluasi-table-wrapper">
          <div class="empty-state-compact">
            <i class="fas fa-inbox"></i>
            <h4>Belum Ada Data</h4>
            <p>Belum ada data IKU untuk tahun ${state.selectedYear}</p>
            <button class="btn-compact primary" onclick="EvaluasiIKUEnhanced.openAddModal()">
              <i class="fas fa-plus"></i> Tambah Data
            </button>
          </div>
        </div>`;
    }

    return `
      <div class="evaluasi-table-wrapper">
        <div class="evaluasi-table-scroll">
          <table class="evaluasi-table-compact">
            <thead>
              <tr>
                <th>NO</th>
                <th>INDIKATOR KINERJA UTAMA</th>
                <th>PERSPEKTIF</th>
                <th>TARGET</th>
                <th>REALISASI</th>
                <th>PROGRESS</th>
                <th>STATUS</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              ${state.data.map((item, idx) => renderTableRow(item, idx)).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function renderTableRow(item, idx) {
    const statusClass = getStatusClass(item.status);
    const progressWidth = Math.min(item.persentaseCapaian || 0, 100);
    
    return `
      <tr>
        <td>${idx + 1}</td>
        <td class="indikator-cell-compact">
          <div class="indikator-name-compact" title="${escapeHtml(item.indikator)}">${escapeHtml(item.indikator)}</div>
          <div class="sasaran-name-compact" title="${escapeHtml(item.sasaran_strategi?.sasaran || '-')}">${escapeHtml(item.sasaran_strategi?.sasaran || '-')}</div>
        </td>
        <td>${escapeHtml(item.sasaran_strategi?.perspektif || '-')}</td>
        <td style="text-align:right">${formatNumber(item.targetTahunIni)} ${item.satuan || ''}</td>
        <td style="text-align:right">${formatNumber(item.totalRealisasi)} ${item.satuan || ''}</td>
        <td>
          <div class="progress-compact">
            <div class="progress-bar-compact">
              <div class="progress-fill-compact ${statusClass}" style="width:${progressWidth}%"></div>
            </div>
            <span class="progress-text-compact">${(item.persentaseCapaian || 0).toFixed(1)}%</span>
          </div>
        </td>
        <td>
          <span class="status-badge-compact ${statusClass}">
            ${getStatusIcon(item.status)}
            ${getStatusShort(item.status)}
          </span>
        </td>
        <td>
          <div class="action-icons-compact">
            <button class="action-icon-compact edit" onclick="EvaluasiIKUEnhanced.openEditModal('${item.id}')" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-icon-compact view" onclick="EvaluasiIKUEnhanced.viewDetail('${item.id}')" title="Detail">
              <i class="fas fa-eye"></i>
            </button>
            <button class="action-icon-compact delete" onclick="EvaluasiIKUEnhanced.deleteData('${item.id}')" title="Hapus">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }


  function changeYear(year) {
    state.selectedYear = parseInt(year);
    loadData();
  }

  async function openAddModal() {
    state.selectedIKU = null;
    await loadIKUOptions();
    showModal('Tambah Realisasi IKU', renderAddForm());
  }

  async function openEditModal(id) {
    const item = state.data.find(d => d.id === id);
    if (!item) return;
    state.selectedIKU = item;
    showModal('Edit Realisasi IKU', renderEditForm(item));
  }

  function viewDetail(id) {
    const item = state.data.find(d => d.id === id);
    if (!item) return;
    showModal('Detail Evaluasi IKU', renderDetailView(item));
  }

  async function deleteData(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    
    try {
      const token = getToken();
      const item = state.data.find(d => d.id === id);
      if (!item || !item.realisasiBulanan) {
        showToast('Data tidak ditemukan', 'error');
        return;
      }

      const deletePromises = Object.values(item.realisasiBulanan)
        .filter(m => m.id)
        .map(m => fetch(`/api/evaluasi-iku-bulanan/${m.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }));

      await Promise.all(deletePromises);
      showToast('Data berhasil dihapus', 'success');
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Gagal menghapus data', 'error');
    }
  }

  async function loadIKUOptions() {
    try {
      const token = getToken();
      
      // Try authenticated endpoint first
      let data = [];
      try {
        const response = await fetch('/api/indikator-kinerja-utama', {
          headers: { 'Authorization': `Bearer ${token}` }
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
      
      console.log('Enhanced loaded IKU options:', data?.length || 0, 'items');
      state.ikuOptions = data || [];
    } catch (error) {
      console.error('Error loading IKU options:', error);
      state.ikuOptions = [];
    }
  }

  function renderAddForm() {
    return `
      <form id="form-add-evaluasi" onsubmit="EvaluasiIKUEnhanced.handleSubmit(event)">
        <div class="form-group-compact">
          <label>Indikator Kinerja Utama *</label>
          <select id="select-iku" required>
            <option value="">-- Pilih IKU --</option>
            ${state.ikuOptions.map(iku => `
              <option value="${iku.id}">${escapeHtml(iku.indikator)}</option>
            `).join('')}
          </select>
        </div>
        <div style="margin:0.75rem 0 0.5rem;font-size:0.85rem;font-weight:600;color:#374151;">
          Input Realisasi Bulanan (${state.selectedYear})
        </div>
        <div class="monthly-grid-compact">
          ${BULAN_NAMES.slice(1).map((bulan, idx) => `
            <div class="month-card-compact">
              <div class="month-label-compact">${bulan}</div>
              <input type="number" step="0.01" name="bulan_${idx + 1}" placeholder="0" 
                     onchange="EvaluasiIKUEnhanced.updateTotal()">
            </div>
          `).join('')}
        </div>
        <div class="total-display-compact">
          <div class="label">Total Realisasi</div>
          <div class="value" id="total-realisasi">0</div>
        </div>
      </form>`;
  }

  function renderEditForm(item) {
    return `
      <form id="form-edit-evaluasi" onsubmit="EvaluasiIKUEnhanced.handleSubmit(event)">
        <input type="hidden" id="edit-iku-id" value="${item.id}">
        <div class="form-group-compact">
          <label>Indikator Kinerja Utama</label>
          <input type="text" value="${escapeHtml(item.indikator)}" disabled style="background:#f3f4f6;">
        </div>
        <div style="margin:0.75rem 0 0.5rem;font-size:0.85rem;font-weight:600;color:#374151;">
          Input Realisasi Bulanan (${state.selectedYear})
        </div>
        <div class="monthly-grid-compact">
          ${BULAN_NAMES.slice(1).map((bulan, idx) => {
            const monthData = item.realisasiBulanan?.[idx + 1];
            const value = monthData?.realisasi || '';
            return `
              <div class="month-card-compact ${value ? 'has-value' : ''}">
                <div class="month-label-compact">${bulan}</div>
                <input type="number" step="0.01" name="bulan_${idx + 1}" placeholder="0" 
                       value="${value}" onchange="EvaluasiIKUEnhanced.updateTotal()">
              </div>
            `;
          }).join('')}
        </div>
        <div class="total-display-compact">
          <div class="label">Total Realisasi</div>
          <div class="value" id="total-realisasi">${formatNumber(item.totalRealisasi)}</div>
        </div>
      </form>`;
  }


  function renderDetailView(item) {
    return `
      <div style="margin-bottom:1rem;">
        <h4 style="font-size:1rem;color:#1f2937;margin-bottom:0.25rem;">${escapeHtml(item.indikator)}</h4>
        <p style="font-size:0.8rem;color:#6b7280;">${escapeHtml(item.sasaran_strategi?.sasaran || '-')}</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem;margin-bottom:1rem;">
        <div style="background:#f9fafb;padding:0.5rem;border-radius:6px;">
          <div style="font-size:0.7rem;color:#6b7280;">Perspektif</div>
          <div style="font-size:0.85rem;font-weight:500;">${escapeHtml(item.sasaran_strategi?.perspektif || '-')}</div>
        </div>
        <div style="background:#f9fafb;padding:0.5rem;border-radius:6px;">
          <div style="font-size:0.7rem;color:#6b7280;">Target ${state.selectedYear}</div>
          <div style="font-size:0.85rem;font-weight:500;">${formatNumber(item.targetTahunIni)} ${item.satuan || ''}</div>
        </div>
        <div style="background:#f9fafb;padding:0.5rem;border-radius:6px;">
          <div style="font-size:0.7rem;color:#6b7280;">Total Realisasi</div>
          <div style="font-size:0.85rem;font-weight:500;">${formatNumber(item.totalRealisasi)} ${item.satuan || ''}</div>
        </div>
        <div style="background:#f9fafb;padding:0.5rem;border-radius:6px;">
          <div style="font-size:0.7rem;color:#6b7280;">Capaian</div>
          <div style="font-size:0.85rem;font-weight:500;">${(item.persentaseCapaian || 0).toFixed(1)}%</div>
        </div>
      </div>
      <div style="margin-bottom:0.5rem;font-size:0.85rem;font-weight:600;color:#374151;">Realisasi Bulanan</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.35rem;">
        ${Object.values(item.realisasiBulanan || {}).map(m => `
          <div style="background:${m.realisasi !== null ? '#ecfdf5' : '#f9fafb'};padding:0.35rem;border-radius:4px;text-align:center;">
            <div style="font-size:0.65rem;color:#6b7280;">${m.namaBulan?.substring(0,3) || BULAN_NAMES[m.bulan]}</div>
            <div style="font-size:0.75rem;font-weight:500;">${m.realisasi !== null ? formatNumber(m.realisasi) : '-'}</div>
          </div>
        `).join('')}
      </div>`;
  }

  function updateTotal() {
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      const input = document.querySelector(`input[name="bulan_${i}"]`);
      if (input && input.value) {
        total += parseFloat(input.value) || 0;
        input.closest('.month-card-compact')?.classList.add('has-value');
      } else {
        input?.closest('.month-card-compact')?.classList.remove('has-value');
      }
    }
    const display = document.getElementById('total-realisasi');
    if (display) display.textContent = formatNumber(total);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    const ikuId = state.selectedIKU?.id || document.getElementById('select-iku')?.value;
    if (!ikuId) {
      showToast('Pilih IKU terlebih dahulu', 'error');
      return;
    }

    const realisasiBulanan = [];
    for (let i = 1; i <= 12; i++) {
      const input = document.querySelector(`input[name="bulan_${i}"]`);
      if (input && input.value) {
        realisasiBulanan.push({ bulan: i, realisasi_nilai: parseFloat(input.value) });
      }
    }

    if (realisasiBulanan.length === 0) {
      showToast('Masukkan minimal satu realisasi bulanan', 'error');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch('/api/evaluasi-iku-bulanan/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          indikator_kinerja_utama_id: ikuId,
          tahun: state.selectedYear,
          realisasi_bulanan: realisasiBulanan
        })
      });

      if (response.ok) {
        showToast('Data berhasil disimpan', 'success');
        closeModal();
        loadData();
      } else {
        throw new Error('Gagal menyimpan data');
      }
    } catch (error) {
      console.error('Submit error:', error);
      showToast('Gagal menyimpan data', 'error');
    }
  }

  async function downloadReport() {
    showToast('Mempersiapkan laporan...', 'info');
    
    try {
      const token = getToken();
      const response = await fetch(`/api/evaluasi-iku-bulanan/export/excel?tahun=${state.selectedYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Gagal mengunduh');
      
      const result = await response.json();
      
      if (typeof XLSX !== 'undefined' && result.data) {
        const ws = XLSX.utils.json_to_sheet(result.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Evaluasi IKU');
        XLSX.writeFile(wb, result.filename || `Evaluasi_IKU_${state.selectedYear}.xlsx`);
        showToast('Laporan berhasil diunduh', 'success');
      } else {
        // Fallback: download as CSV
        downloadCSV(result.data, `Evaluasi_IKU_${state.selectedYear}.csv`);
        showToast('Laporan berhasil diunduh (CSV)', 'success');
      }
    } catch (error) {
      console.error('Download error:', error);
      // Generate from current data
      downloadCSV(generateExportData(), `Evaluasi_IKU_${state.selectedYear}.csv`);
      showToast('Laporan berhasil diunduh dari data lokal', 'success');
    }
  }

  function generateExportData() {
    return state.data.map(item => ({
      'Indikator': item.indikator,
      'Perspektif': item.sasaran_strategi?.perspektif || '-',
      'Target': item.targetTahunIni,
      'Realisasi': item.totalRealisasi,
      'Capaian (%)': item.persentaseCapaian?.toFixed(2) || 0,
      'Status': item.status,
      'Satuan': item.satuan || '-'
    }));
  }

  function downloadCSV(data, filename) {
    if (!data || data.length === 0) {
      showToast('Tidak ada data untuk diunduh', 'warning');
      return;
    }
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }


  // Modal functions
  function showModal(title, content, showSaveBtn = true) {
    closeModal();
    
    const modal = document.createElement('div');
    modal.className = 'evaluasi-modal-compact active';
    modal.id = 'evaluasi-modal';
    modal.innerHTML = `
      <div class="modal-content-compact">
        <div class="modal-header-compact">
          <h3>${title}</h3>
          <button class="modal-close-compact" onclick="EvaluasiIKUEnhanced.closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body-compact">${content}</div>
        <div class="modal-footer-compact">
          <button class="btn-compact" style="background:#f3f4f6;color:#374151;" onclick="EvaluasiIKUEnhanced.closeModal()">
            Tutup
          </button>
          ${showSaveBtn ? `
            <button class="btn-compact primary" onclick="document.querySelector('form')?.dispatchEvent(new Event('submit'))">
              <i class="fas fa-save"></i> Simpan
            </button>
          ` : ''}
        </div>
      </div>`;
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    document.body.appendChild(modal);
  }

  function closeModal() {
    const modal = document.getElementById('evaluasi-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
    state.selectedIKU = null;
  }

  // Toast notification
  function showToast(message, type = 'info') {
    const existing = document.querySelectorAll('.toast-notification');
    existing.forEach(t => t.remove());
    
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
      <i class="fas ${icons[type]}" style="font-size:1.25rem;color:${colors[type]};"></i>
      <span style="font-size:0.85rem;color:#374151;">${message}</span>`;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Helper functions
  function getStatusClass(status) {
    const map = { 'Tercapai': 'tercapai', 'Hampir Tercapai': 'hampir', 'Dalam Proses': 'proses', 'Perlu Perhatian': 'perhatian' };
    return map[status] || 'belum';
  }

  function getStatusIcon(status) {
    const icons = {
      'Tercapai': '<i class="fas fa-check-circle"></i>',
      'Hampir Tercapai': '<i class="fas fa-arrow-trend-up"></i>',
      'Dalam Proses': '<i class="fas fa-clock"></i>',
      'Perlu Perhatian': '<i class="fas fa-exclamation-triangle"></i>'
    };
    return icons[status] || '<i class="fas fa-minus-circle"></i>';
  }

  function getStatusShort(status) {
    const short = { 'Tercapai': 'Tercapai', 'Hampir Tercapai': 'Hampir', 'Dalam Proses': 'Proses', 'Perlu Perhatian': 'Perhatian', 'Belum Ada Realisasi': 'Belum' };
    return short[status] || 'Belum';
  }

  function formatNumber(num) {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API
  return {
    init,
    loadData,
    changeYear,
    openAddModal,
    openEditModal,
    viewDetail,
    deleteData,
    handleSubmit,
    downloadReport,
    updateTotal,
    closeModal
  };
})();

// Auto-initialize - DISABLED if V3 is present
document.addEventListener('DOMContentLoaded', function() {
  // Skip if V3 module exists (V3 takes priority)
  if (typeof EvaluasiIKUV3 !== 'undefined') {
    console.log('EvaluasiIKUEnhanced: V3 detected, skipping init');
    return;
  }
  const page = document.getElementById('evaluasi-iku-page') || 
               document.getElementById('evaluasi-iku-content') ||
               document.getElementById('evaluasi-iku');
  if (page) {
    EvaluasiIKUEnhanced.init();
  }
});

// Listen for page navigation - DISABLED if V3 is present
document.addEventListener('pageChanged', function(e) {
  if (typeof EvaluasiIKUV3 !== 'undefined') return;
  if (e.detail?.page === 'evaluasi-iku') {
    EvaluasiIKUEnhanced.init();
  }
});

window.EvaluasiIKUEnhanced = EvaluasiIKUEnhanced;
