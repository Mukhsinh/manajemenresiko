/**
 * Evaluasi IKU V3 - Single Source Module
 * Prevents duplication by disabling other modules
 */
const EvaluasiIKUV3 = (function() {
  'use strict';
  let isInit = false;
  const BULAN_SHORT = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const PERIODE_OPTIONS = [
    {value:'',label:'-- Pilih Periode --',disabled:true},
    {value:'semua',label:'Semua Periode'},
    {value:'bulanan',label:'Bulanan'},
    {value:'triwulan',label:'Triwulan'},
    {value:'semester',label:'Semester'},
    {value:'tahunan',label:'Tahunan'}
  ];
  let currentData=[], allIKUOptions=[], summaryStats={};
  let selectedYear=null, selectedPeriode='', selectedIKU=null;
  let statusChart=null, trendChart=null;

  async function init() {
    if (isInit) return;
    const container = document.getElementById('evaluasi-iku');
    if (!container) return;
    console.log('🚀 EvaluasiIKUV3 init');
    disableOtherModules();
    container.innerHTML = '';
    injectUI(container);
    createModals();
    setupEventListeners();
    initCharts();
    await loadIKUOptions();
    isInit = true;
  }

  function disableOtherModules() {
    if (window.EvaluasiIKUModule) window.EvaluasiIKUModule.init = ()=>{};
    if (window.EvaluasiIKUEnhancedV2) window.EvaluasiIKUEnhancedV2.init = ()=>{};
  }

  function injectUI(c) {
    const yr = new Date().getFullYear();
    let yOpts = '';
    for (let y=yr-3; y<=yr+2; y++) yOpts += `<option value="${y}">${y}</option>`;
    c.innerHTML = getUIHTML(yOpts);
  }

  function getUIHTML(yOpts) {
    return `<div class="evaluasi-summary-grid">${getSummaryCardsHTML()}</div>
<div class="evaluasi-charts-grid">${getChartsHTML()}</div>
<div class="evaluasi-filter-bar">${getFilterHTML(yOpts)}</div>
<div class="evaluasi-table-section">${getTableHTML()}</div>`;
  }

  function getSummaryCardsHTML() {
    return `
      <div class="evaluasi-summary-card total"><div class="card-icon"><i class="fas fa-chart-bar"></i></div><div class="card-content"><div class="card-value" id="stat-total">0</div><div class="card-label">Total IKU</div></div></div>
      <div class="evaluasi-summary-card tercapai"><div class="card-icon"><i class="fas fa-check-circle"></i></div><div class="card-content"><div class="card-value" id="stat-tercapai">0</div><div class="card-label">Tercapai</div></div></div>
      <div class="evaluasi-summary-card hampir"><div class="card-icon"><i class="fas fa-arrow-trend-up"></i></div><div class="card-content"><div class="card-value" id="stat-hampir">0</div><div class="card-label">Hampir Tercapai</div></div></div>
      <div class="evaluasi-summary-card proses"><div class="card-icon"><i class="fas fa-clock"></i></div><div class="card-content"><div class="card-value" id="stat-proses">0</div><div class="card-label">Dalam Proses</div></div></div>
      <div class="evaluasi-summary-card perhatian"><div class="card-icon"><i class="fas fa-triangle-exclamation"></i></div><div class="card-content"><div class="card-value" id="stat-perhatian">0</div><div class="card-label">Perlu Perhatian</div></div></div>
      <div class="evaluasi-summary-card belum"><div class="card-icon"><i class="fas fa-circle-minus"></i></div><div class="card-content"><div class="card-value" id="stat-belum">0</div><div class="card-label">Belum Ada Data</div></div></div>`;
  }

  function getChartsHTML() {
    return `
      <div class="evaluasi-chart-card"><div class="chart-header"><div class="chart-title"><i class="fas fa-chart-pie"></i> Distribusi Status</div></div><div class="chart-container"><canvas id="chart-status-iku"></canvas></div></div>
      <div class="evaluasi-chart-card"><div class="chart-header"><div class="chart-title"><i class="fas fa-chart-line"></i> Trend Bulanan</div></div><div class="chart-container"><canvas id="chart-trend-iku"></canvas></div></div>`;
  }

  function getFilterHTML(yOpts) {
    return `
      <div class="evaluasi-filter-group"><label>Tahun:</label><select id="filter-tahun-v3"><option value="">-- Pilih Tahun --</option>${yOpts}</select></div>
      <div class="evaluasi-filter-group"><label>Periode:</label><select id="filter-periode-v3" disabled>${PERIODE_OPTIONS.map(o=>`<option value="${o.value}" ${o.disabled?'disabled selected':''}>${o.label}</option>`).join('')}</select><div class="filter-hint warning" id="periode-hint">Pilih tahun terlebih dahulu</div></div>
      <div class="evaluasi-filter-actions" style="display: flex !important; gap: 0.5rem; margin-left: auto;">
        <button type="button" class="btn-primary" id="btn-tambah-v3" style="display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem; font-weight: 500; cursor: pointer; border: none; background: #3b82f6; color: white;"><i class="fas fa-plus"></i> Tambah Data</button>
        <button type="button" class="btn-success" id="btn-unduh-v3" style="display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem; font-weight: 500; cursor: pointer; border: none; background: #10b981; color: white;"><i class="fas fa-download"></i> Unduh Laporan</button>
      </div>`;
  }

  function getTableHTML() {
    return `
      <div class="evaluasi-table-header"><h3><i class="fas fa-table"></i> Data Evaluasi IKU</h3><span id="table-count-v3">0 data</span></div>
      <div class="evaluasi-table-scroll"><table class="evaluasi-data-table"><thead><tr><th style="width:40px">NO</th><th style="width:25%">INDIKATOR KINERJA UTAMA</th><th style="width:10%">PERSPEKTIF</th><th style="width:10%">TARGET</th><th style="width:10%">REALISASI</th><th style="width:15%">PROGRESS</th><th style="width:12%">STATUS</th><th style="width:10%">AKSI</th></tr></thead><tbody id="evaluasi-table-body-v3"><tr><td colspan="8" class="empty-state"><i class="fas fa-filter"></i><h4>Pilih Tahun</h4><p>Silakan pilih tahun untuk menampilkan data</p></td></tr></tbody></table></div>`;
  }

  function createModals() {
    if (document.getElementById('modal-evaluasi-v3')) return;
    const yr = new Date().getFullYear();
    let yOpts = '';
    for (let y=yr-3; y<=yr+2; y++) yOpts += `<option value="${y}">${y}</option>`;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="evaluasi-modal-overlay" id="modal-evaluasi-v3">
        <div class="evaluasi-modal-box">
          <div class="evaluasi-modal-top"><h3 id="modal-title-v3"><i class="fas fa-plus-circle"></i> Tambah Realisasi IKU</h3><button class="modal-close-btn" onclick="EvaluasiIKUV3.closeModal()"><i class="fas fa-times"></i></button></div>
          <form id="form-evaluasi-v3" onsubmit="EvaluasiIKUV3.handleSubmit(event)">
            <div class="evaluasi-modal-body">
              <div class="form-section"><div class="form-section-title"><i class="fas fa-bullseye"></i> Pilih Indikator</div><div class="form-field"><label>IKU <span class="req">*</span></label><select id="select-iku-v3" required><option value="">-- Pilih IKU --</option></select><div class="iku-info-card" id="iku-info-v3" style="display:none"></div></div></div>
              <div class="form-section"><div class="form-section-title"><i class="fas fa-calendar"></i> Tahun</div><div class="form-field"><label>Tahun <span class="req">*</span></label><select id="select-tahun-form-v3" required><option value="">-- Pilih --</option>${yOpts}</select></div></div>
              <div class="form-section"><div class="form-section-title"><i class="fas fa-calendar-alt"></i> Realisasi Bulanan</div><div class="monthly-input-grid" id="monthly-inputs-v3"></div><div class="total-display"><div class="total-label">Total Realisasi</div><div class="total-value" id="total-value-v3">0</div></div></div>
            </div>
            <div class="evaluasi-modal-bottom"><button type="button" class="btn-secondary" onclick="EvaluasiIKUV3.closeModal()"><i class="fas fa-times"></i> Batal</button><button type="submit" class="btn-primary"><i class="fas fa-save"></i> Simpan</button></div>
          </form>
        </div>
      </div>
      <div class="evaluasi-modal-overlay" id="modal-detail-v3">
        <div class="evaluasi-modal-box" style="max-width:600px">
          <div class="evaluasi-modal-top"><h3><i class="fas fa-eye"></i> Detail</h3><button class="modal-close-btn" onclick="EvaluasiIKUV3.closeModal()"><i class="fas fa-times"></i></button></div>
          <div class="evaluasi-modal-body" id="detail-content-v3"></div>
          <div class="evaluasi-modal-bottom"><button type="button" class="btn-secondary" onclick="EvaluasiIKUV3.closeModal()"><i class="fas fa-times"></i> Tutup</button></div>
        </div>
      </div>`);
    renderMonthlyInputs();
  }

  function renderMonthlyInputs(data) {
    const c = document.getElementById('monthly-inputs-v3');
    if (!c) return;
    c.innerHTML = BULAN_SHORT.slice(1).map((b,i) => {
      const m = i+1, ex = data?data[m]:null, has = ex&&ex.realisasi!==null;
      return `<div class="month-box ${has?'filled':''}"><div class="month-name">${b}</div><input type="number" step="0.01" name="bulan_${m}" placeholder="0" value="${has?ex.realisasi:''}" onchange="EvaluasiIKUV3.updateTotal()"></div>`;
    }).join('');
  }

  function updateTotal() {
    let t=0;
    for(let i=1;i<=12;i++){const inp=document.querySelector(`input[name="bulan_${i}"]`);if(inp&&inp.value)t+=parseFloat(inp.value)||0;}
    const d=document.getElementById('total-value-v3');if(d)d.textContent=formatNumber(t);
  }


  function setupEventListeners() {
    const yf = document.getElementById('filter-tahun-v3');
    if (yf) yf.addEventListener('change', e => {
      selectedYear = e.target.value ? parseInt(e.target.value) : null;
      const pf = document.getElementById('filter-periode-v3'), ph = document.getElementById('periode-hint');
      if (selectedYear) { if(pf){pf.disabled=false;pf.value='semua';selectedPeriode='semua';} if(ph)ph.style.display='none'; loadData(); }
      else { if(pf){pf.disabled=true;pf.value='';} if(ph)ph.style.display='block'; selectedPeriode=''; clearData(); }
    });
    const pf = document.getElementById('filter-periode-v3');
    if (pf) pf.addEventListener('change', e => { selectedPeriode = e.target.value; filterAndRenderData(); });
    const ab = document.getElementById('btn-tambah-v3');
    if (ab) ab.addEventListener('click', () => { if(!selectedYear){showNotification('Pilih tahun terlebih dahulu','error');return;} openAddModal(); });
    const db = document.getElementById('btn-unduh-v3');
    if (db) db.addEventListener('click', () => { if(!selectedYear){showNotification('Pilih tahun terlebih dahulu','error');return;} downloadReport(); });
    const is = document.getElementById('select-iku-v3');
    if (is) is.addEventListener('change', onIKUSelectChange);
  }

  function initCharts() {
    const sc = document.getElementById('chart-status-iku');
    if (sc && typeof Chart !== 'undefined') {
      statusChart = new Chart(sc, {type:'doughnut',data:{labels:['Tercapai','Hampir Tercapai','Dalam Proses','Perlu Perhatian','Belum Ada Data'],datasets:[{data:[0,0,0,0,0],backgroundColor:['#22c55e','#f97316','#eab308','#ef4444','#9ca3af'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:11},padding:15}}},cutout:'60%'}});
    }
    const tc = document.getElementById('chart-trend-iku');
    if (tc && typeof Chart !== 'undefined') {
      trendChart = new Chart(tc, {type:'line',data:{labels:BULAN_SHORT.slice(1),datasets:[{label:'Capaian (%)',data:Array(12).fill(0),borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,0.1)',fill:true,tension:0.4,pointRadius:4,pointBackgroundColor:'#3b82f6'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+'%'}}}}});
    }
  }

  async function loadIKUOptions() {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Try authenticated endpoint first
      let data = [];
      try {
        const res = await fetch('/api/indikator-kinerja-utama', {headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'}});
        if (res.ok) {
          data = await res.json() || [];
        }
      } catch(authErr) {
        console.warn('Auth endpoint failed:', authErr);
      }
      
      // Fallback to public endpoint
      if (!data || data.length === 0) {
        try {
          const pubRes = await fetch('/api/indikator-kinerja-utama/public');
          if (pubRes.ok) {
            data = await pubRes.json() || [];
          }
        } catch(pubErr) {
          console.warn('Public endpoint failed:', pubErr);
        }
      }
      
      console.log('V3 loaded IKU options:', data?.length || 0, 'items');
      allIKUOptions = data || [];
      populateIKUDropdown();
    } catch(e) { console.error('Error loading IKU:', e); allIKUOptions = []; }
  }

  function populateIKUDropdown() {
    const s = document.getElementById('select-iku-v3');
    if (!s) return;
    
    console.log('Populating IKU dropdown with', allIKUOptions?.length || 0, 'options');
    
    if (allIKUOptions && allIKUOptions.length > 0) {
      s.innerHTML = `<option value="">-- Pilih IKU --</option>${allIKUOptions.map(iku=>`<option value="${iku.id}" data-perspektif="${escapeHtml(iku.sasaran_strategi?.perspektif||'-')}" data-sasaran="${escapeHtml(iku.sasaran_strategi?.sasaran||'-')}" data-satuan="${escapeHtml(iku.satuan||'-')}" data-target="${iku.targetTahunIni||iku.target_nilai||0}">${escapeHtml(iku.indikator)} (${escapeHtml(iku.rencana_strategis?.nama_rencana||'-')})</option>`).join('')}`;
    } else {
      s.innerHTML = `<option value="">-- Tidak ada data IKU tersedia --</option>`;
    }
  }

  function onIKUSelectChange(e) {
    const s = e.target, opt = s.options[s.selectedIndex], ic = document.getElementById('iku-info-v3');
    if (!ic) return;
    if (s.value) {
      ic.innerHTML = `<div class="iku-title">${escapeHtml(opt.text)}</div><div class="iku-meta"><span><i class="fas fa-layer-group"></i> ${opt.dataset.perspektif}</span><span><i class="fas fa-bullseye"></i> Target: ${formatNumber(parseFloat(opt.dataset.target))} ${opt.dataset.satuan}</span></div>`;
      ic.style.display = 'block';
    } else { ic.style.display = 'none'; }
  }

  async function loadData() {
    if (!selectedYear) return;
    try {
      showLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      let r = { data: [], summary: {} };
      
      // Try authenticated summary endpoint first
      try {
        const res = await fetch(`/api/evaluasi-iku-bulanan/summary?tahun=${selectedYear}`, {headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'}});
        if (res.ok) {
          r = await res.json();
          console.log('V3 loaded from authenticated summary:', r.data?.length || 0, 'items');
        }
      } catch(summaryErr) {
        console.warn('Auth summary endpoint failed:', summaryErr);
      }
      
      // Fallback to public summary endpoint
      if (!r.data || r.data.length === 0) {
        try {
          const pubRes = await fetch(`/api/evaluasi-iku-bulanan/summary/public?tahun=${selectedYear}`);
          if (pubRes.ok) {
            r = await pubRes.json();
            console.log('V3 loaded from public summary:', r.data?.length || 0, 'items');
          }
        } catch(pubErr) {
          console.warn('Public summary endpoint failed:', pubErr);
        }
      }
      
      // Final fallback: load IKU directly
      if (!r.data || r.data.length === 0) {
        try {
          const ikuRes = await fetch('/api/indikator-kinerja-utama', {headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'}});
          if (ikuRes.ok) {
            const ikuData = await ikuRes.json();
            r.data = (ikuData || []).map(iku => ({
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
            r.summary = {
              totalIKU: r.data.length,
              tercapai: 0,
              hampirTercapai: 0,
              dalamProses: 0,
              perluPerhatian: 0,
              belumAdaRealisasi: r.data.length,
              rataRataCapaian: 0
            };
            console.log('V3 loaded from IKU fallback:', r.data.length, 'items');
          }
        } catch(ikuErr) {
          console.warn('IKU endpoint failed:', ikuErr);
        }
      }
      
      currentData = r.data || [];
      summaryStats = r.summary || {};
      console.log('V3 loaded data:', currentData.length, 'items');
      console.log('V3 summary from API:', summaryStats);
      updateSummaryCards();
      updateCharts();
      filterAndRenderData();
      showLoading(false);
    } catch(e) { console.error('Error:', e); showLoading(false); showNotification('Gagal memuat data','error'); }
  }

  function clearData() {
    currentData = []; summaryStats = {};
    updateSummaryCards(); updateCharts();
    const tb = document.getElementById('evaluasi-table-body-v3');
    if (tb) tb.innerHTML = `<tr><td colspan="8" class="empty-state"><i class="fas fa-filter"></i><h4>Pilih Tahun</h4><p>Silakan pilih tahun</p></td></tr>`;
    updateTableCount(0);
  }

  function updateSummaryCards() {
    // Calculate stats from currentData if summaryStats is empty or incomplete
    let stats = { ...summaryStats };
    
    if (currentData && currentData.length > 0) {
      // Recalculate from currentData for accuracy
      stats.totalIKU = currentData.length;
      stats.tercapai = 0;
      stats.hampirTercapai = 0;
      stats.dalamProses = 0;
      stats.perluPerhatian = 0;
      stats.belumAdaRealisasi = 0;
      
      currentData.forEach(item => {
        const status = item.status || 'Belum Ada Realisasi';
        switch(status) {
          case 'Tercapai': stats.tercapai++; break;
          case 'Hampir Tercapai': stats.hampirTercapai++; break;
          case 'Dalam Proses': stats.dalamProses++; break;
          case 'Perlu Perhatian': stats.perluPerhatian++; break;
          default: stats.belumAdaRealisasi++; break;
        }
      });
    }
    
    const set = (id,v) => { const e=document.getElementById(id); if(e)e.textContent=v||0; };
    set('stat-total', stats.totalIKU);
    set('stat-tercapai', stats.tercapai);
    set('stat-hampir', stats.hampirTercapai);
    set('stat-proses', stats.dalamProses);
    set('stat-perhatian', stats.perluPerhatian);
    set('stat-belum', stats.belumAdaRealisasi);
  }

  function updateCharts() {
    // Calculate chart data from currentData
    let chartStats = { tercapai: 0, hampirTercapai: 0, dalamProses: 0, perluPerhatian: 0, belumAdaRealisasi: 0 };
    
    if (currentData && currentData.length > 0) {
      currentData.forEach(item => {
        const status = item.status || 'Belum Ada Realisasi';
        switch(status) {
          case 'Tercapai': chartStats.tercapai++; break;
          case 'Hampir Tercapai': chartStats.hampirTercapai++; break;
          case 'Dalam Proses': chartStats.dalamProses++; break;
          case 'Perlu Perhatian': chartStats.perluPerhatian++; break;
          default: chartStats.belumAdaRealisasi++; break;
        }
      });
    }
    
    if (statusChart) { 
      statusChart.data.datasets[0].data = [chartStats.tercapai, chartStats.hampirTercapai, chartStats.dalamProses, chartStats.perluPerhatian, chartStats.belumAdaRealisasi]; 
      statusChart.update(); 
    }
    
    if (trendChart && currentData.length > 0) {
      const mAvg = Array(12).fill(0), mCnt = Array(12).fill(0);
      currentData.forEach(item => { 
        if(item.realisasiBulanan) {
          Object.values(item.realisasiBulanan).forEach(m => { 
            if(m.realisasi !== null && m.realisasi !== undefined && item.targetTahunIni > 0) { 
              const idx = m.bulan - 1; 
              mAvg[idx] += (m.realisasi / item.targetTahunIni) * 100; 
              mCnt[idx]++; 
            } 
          }); 
        }
      });
      trendChart.data.datasets[0].data = mAvg.map((s,i) => mCnt[i] > 0 ? Math.round(s / mCnt[i]) : 0);
      trendChart.update();
    }
  }


  function filterAndRenderData() {
    let fd = [...currentData];
    if (selectedPeriode && selectedPeriode !== 'semua') {
      fd = currentData.filter(item => {
        const bt = item.jumlahBulanTerisi || 0;
        switch(selectedPeriode) { case 'bulanan': return bt>=1; case 'triwulan': return bt>=3; case 'semester': return bt>=6; case 'tahunan': return bt>=12; default: return true; }
      });
    }
    renderTable(fd);
  }

  function renderTable(data) {
    const tb = document.getElementById('evaluasi-table-body-v3');
    if (!tb) return;
    if (!data || data.length === 0) {
      tb.innerHTML = `<tr><td colspan="8" class="empty-state"><i class="fas fa-inbox"></i><h4>Belum Ada Data</h4><p>Belum ada data untuk tahun ${selectedYear}. Gunakan tombol "Tambah Data" di atas untuk menambahkan realisasi.</p></td></tr>`;
      updateTableCount(0); return;
    }
    tb.innerHTML = data.map((item, idx) => {
      const pct = Math.min(item.persentaseCapaian||0, 100), pc = getProgressClass(pct), sc = getStatusClass(item.status);
      return `<tr data-id="${item.id}"><td>${idx+1}</td><td class="cell-indikator"><div class="indikator-name">${escapeHtml(item.indikator||'-')}</div><div class="sasaran-name">${escapeHtml(item.sasaran_strategi?.sasaran||'-')}</div></td><td>${escapeHtml(item.sasaran_strategi?.perspektif||'-')}</td><td class="cell-number">${formatNumber(item.targetTahunIni)} ${item.satuan||''}</td><td class="cell-number">${formatNumber(item.totalRealisasi)} ${item.satuan||''}</td><td><div class="progress-wrapper"><div class="progress-track"><div class="progress-fill ${pc}" style="width:${pct}%"></div></div><span class="progress-text">${(item.persentaseCapaian||0).toFixed(1)}%</span></div></td><td><span class="status-pill ${sc}">${getStatusIcon(item.status)} ${item.status||'Belum Ada Realisasi'}</span></td><td><div class="action-btns"><button class="action-btn edit" onclick="EvaluasiIKUV3.openEditModal('${item.id}')" title="Edit"><i class="fas fa-edit"></i></button><button class="action-btn view" onclick="EvaluasiIKUV3.viewDetail('${item.id}')" title="Detail"><i class="fas fa-eye"></i></button><button class="action-btn delete" onclick="EvaluasiIKUV3.deleteData('${item.id}')" title="Hapus"><i class="fas fa-trash"></i></button></div></td></tr>`;
    }).join('');
    updateTableCount(data.length);
  }

  function updateTableCount(c) { const e = document.getElementById('table-count-v3'); if(e) e.textContent = `${c} data`; }
  function getProgressClass(p) { if(p>=100) return 'green'; if(p>=50) return 'orange'; if(p>0) return 'red'; return 'gray'; }
  function getStatusClass(s) { const m = {'Tercapai':'tercapai','Hampir Tercapai':'hampir','Dalam Proses':'proses','Perlu Perhatian':'perhatian','Belum Ada Realisasi':'belum'}; return m[s]||'belum'; }
  function getStatusIcon(s) { const m = {'Tercapai':'<i class="fas fa-check-circle"></i>','Hampir Tercapai':'<i class="fas fa-arrow-trend-up"></i>','Dalam Proses':'<i class="fas fa-clock"></i>','Perlu Perhatian':'<i class="fas fa-triangle-exclamation"></i>','Belum Ada Realisasi':'<i class="fas fa-circle-minus"></i>'}; return m[s]||''; }

  function openAddModal() {
    selectedIKU = null;
    const m = document.getElementById('modal-evaluasi-v3'), f = document.getElementById('form-evaluasi-v3'), t = document.getElementById('modal-title-v3');
    if(t) t.innerHTML = '<i class="fas fa-plus-circle"></i> Tambah Realisasi IKU';
    if(f) f.reset();
    
    // Always reload IKU options when opening modal
    loadIKUOptions().then(() => {
      populateIKUDropdown();
    });
    
    const is = document.getElementById('select-iku-v3'); if(is) is.disabled = false;
    const ys = document.getElementById('select-tahun-form-v3'); if(ys && selectedYear) ys.value = selectedYear;
    renderMonthlyInputs(null); updateTotal();
    const ic = document.getElementById('iku-info-v3'); if(ic) ic.style.display = 'none';
    if(m) m.classList.add('show');
  }

  async function openEditModal(ikuId) {
    const item = currentData.find(d => d.id === ikuId);
    if (!item) return;
    selectedIKU = item;
    const m = document.getElementById('modal-evaluasi-v3'), t = document.getElementById('modal-title-v3');
    if(t) t.innerHTML = '<i class="fas fa-edit"></i> Edit Realisasi IKU';
    populateIKUDropdown();
    const is = document.getElementById('select-iku-v3'); if(is) { is.value = ikuId; is.disabled = true; is.dispatchEvent(new Event('change')); }
    const ys = document.getElementById('select-tahun-form-v3'); if(ys) ys.value = selectedYear;
    renderMonthlyInputs(item.realisasiBulanan); updateTotal();
    if(m) m.classList.add('show');
  }

  function closeModal() { document.querySelectorAll('.evaluasi-modal-overlay').forEach(m => m.classList.remove('show')); }

  async function handleSubmit(e) {
    e.preventDefault();
    const is = document.getElementById('select-iku-v3'), ys = document.getElementById('select-tahun-form-v3');
    const ikuId = selectedIKU?.id || is?.value, tahun = ys?.value || selectedYear;
    if (!ikuId) { showNotification('Pilih IKU terlebih dahulu','error'); return; }
    const rb = [];
    for(let i=1;i<=12;i++) { const inp = document.querySelector(`input[name="bulan_${i}"]`); if(inp && inp.value) rb.push({bulan:i, realisasi_nilai:parseFloat(inp.value)}); }
    if (rb.length === 0) { showNotification('Masukkan minimal satu realisasi','error'); return; }
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/evaluasi-iku-bulanan/bulk', {method:'POST',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({indikator_kinerja_utama_id:ikuId,tahun:parseInt(tahun),realisasi_bulanan:rb})});
      if (!res.ok) throw new Error('Failed');
      const r = await res.json();
      showNotification(r.message || 'Data berhasil disimpan','success');
      closeModal(); loadData();
    } catch(e) { console.error('Error:', e); showNotification('Gagal menyimpan data','error'); }
  }


  function viewDetail(ikuId) {
    const item = currentData.find(d => d.id === ikuId);
    if (!item) return;
    const m = document.getElementById('modal-detail-v3'), c = document.getElementById('detail-content-v3');
    if (c) {
      const pct = item.persentaseCapaian||0, pc = getProgressClass(pct);
      c.innerHTML = `<div style="margin-bottom:1.5rem"><h4 style="font-size:1rem;font-weight:600;color:#1f2937;margin-bottom:0.5rem">${escapeHtml(item.indikator)}</h4><p style="font-size:0.8rem;color:#6b7280">${escapeHtml(item.sasaran_strategi?.sasaran||'-')}</p></div><div style="display:grid;gap:0.75rem;margin-bottom:1.5rem"><div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #e5e7eb"><span style="color:#6b7280;font-size:0.8rem">Perspektif:</span><span style="font-weight:500;font-size:0.8rem">${escapeHtml(item.sasaran_strategi?.perspektif||'-')}</span></div><div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #e5e7eb"><span style="color:#6b7280;font-size:0.8rem">Target ${selectedYear}:</span><span style="font-weight:500;font-size:0.8rem">${formatNumber(item.targetTahunIni)} ${item.satuan||''}</span></div><div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #e5e7eb"><span style="color:#6b7280;font-size:0.8rem">Total Realisasi:</span><span style="font-weight:500;font-size:0.8rem">${formatNumber(item.totalRealisasi)} ${item.satuan||''}</span></div><div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid #e5e7eb"><span style="color:#6b7280;font-size:0.8rem">Capaian:</span><div class="progress-wrapper" style="width:150px"><div class="progress-track"><div class="progress-fill ${pc}" style="width:${Math.min(pct,100)}%"></div></div><span class="progress-text">${pct.toFixed(1)}%</span></div></div><div style="display:flex;justify-content:space-between;padding:0.5rem 0"><span style="color:#6b7280;font-size:0.8rem">Status:</span><span class="status-pill ${getStatusClass(item.status)}">${item.status}</span></div></div><h5 style="font-size:0.875rem;font-weight:600;margin-bottom:1rem"><i class="fas fa-calendar-alt" style="color:#3b82f6;margin-right:0.5rem"></i> Realisasi Bulanan</h5><div class="evaluasi-table-scroll" style="max-height:250px"><table class="evaluasi-data-table"><thead><tr><th>Bulan</th><th>Realisasi</th><th>Keterangan</th></tr></thead><tbody>${Object.values(item.realisasiBulanan||{}).map(m=>`<tr style="${m.realisasi!==null?'background:#f0fdf4':''}"><td>${m.namaBulan}</td><td class="cell-number">${m.realisasi!==null?formatNumber(m.realisasi):'-'}</td><td>${escapeHtml(m.keterangan||'-')}</td></tr>`).join('')}</tbody><tfoot><tr style="background:#f8fafc;font-weight:600"><td>Total</td><td class="cell-number">${formatNumber(item.totalRealisasi)}</td><td></td></tr></tfoot></table></div>`;
    }
    if(m) m.classList.add('show');
  }

  async function deleteData(ikuId) {
    if (!confirm('Hapus semua realisasi untuk IKU ini?')) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const item = currentData.find(d => d.id === ikuId);
      if (!item || !item.realisasiBulanan) return;
      const delPromises = Object.values(item.realisasiBulanan).filter(m=>m.id).map(m=>fetch(`/api/evaluasi-iku-bulanan/${m.id}`,{method:'DELETE',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'}}));
      await Promise.all(delPromises);
      showNotification('Data berhasil dihapus','success');
      loadData();
    } catch(e) { console.error('Error:', e); showNotification('Gagal menghapus data','error'); }
  }

  async function downloadReport() {
    showNotification('Menyiapkan laporan...','info');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      try {
        const res = await fetch(`/api/evaluasi-iku-bulanan/export/excel?tahun=${selectedYear}`,{headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'}});
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = `Evaluasi_IKU_${selectedYear}.xlsx`;
          document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
          showNotification('Laporan berhasil diunduh','success'); return;
        }
      } catch(apiErr) { console.warn('API export failed:', apiErr); }
      // CSV fallback
      const csv = generateCSV();
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Evaluasi_IKU_${selectedYear}.csv`;
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
      showNotification('Laporan CSV berhasil diunduh','success');
    } catch(e) { console.error('Error:', e); showNotification('Gagal mengunduh laporan','error'); }
  }

  function generateCSV() {
    const h = ['No','Indikator','Perspektif','Target','Realisasi','Capaian (%)','Status'];
    const rows = currentData.map((item,idx) => [idx+1,`"${(item.indikator||'').replace(/"/g,'""')}"`,`"${(item.sasaran_strategi?.perspektif||'').replace(/"/g,'""')}"`,item.targetTahunIni||0,item.totalRealisasi||0,(item.persentaseCapaian||0).toFixed(1),`"${(item.status||'').replace(/"/g,'""')}"`]);
    return [h.join(','), ...rows.map(r=>r.join(','))].join('\n');
  }

  function escapeHtml(s) { if(!s)return''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function formatNumber(n) { if(n===null||n===undefined||isNaN(n))return'0'; return new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n); }
  function showLoading(show) { const s = document.getElementById('evaluasi-table-section'); if(!s)return; let o = s.querySelector('.loading-overlay'); if(show) { if(!o){o=document.createElement('div');o.className='loading-overlay';o.innerHTML='<div class="loading-spinner"></div>';s.style.position='relative';s.appendChild(o);} } else { if(o)o.remove(); } }
  function showNotification(msg, type='info') { let n = document.querySelector('.evaluasi-notification'); if(!n){n=document.createElement('div');n.className='evaluasi-notification';document.body.appendChild(n);} n.className=`evaluasi-notification ${type}`; n.innerHTML=`<i class="fas fa-${type==='success'?'check-circle':type==='error'?'exclamation-circle':'info-circle'}"></i><span>${msg}</span>`; setTimeout(()=>n.classList.add('show'),10); setTimeout(()=>n.classList.remove('show'),3000); }

  return { init, openAddModal, openEditModal, closeModal, handleSubmit, viewDetail, deleteData, updateTotal };
})();

// Auto-init with auto-load current year
document.addEventListener('DOMContentLoaded', () => { 
  if(document.getElementById('evaluasi-iku')) {
    EvaluasiIKUV3.init();
    // Auto-select current year after init
    setTimeout(() => {
      const yearSelect = document.getElementById('filter-tahun-v3');
      if (yearSelect && !yearSelect.value) {
        const currentYear = new Date().getFullYear();
        yearSelect.value = currentYear.toString();
        yearSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, 300);
  }
});
window.addEventListener('pageshow', () => { 
  if(document.getElementById('evaluasi-iku')) {
    EvaluasiIKUV3.init();
    // Auto-select current year after init
    setTimeout(() => {
      const yearSelect = document.getElementById('filter-tahun-v3');
      if (yearSelect && !yearSelect.value) {
        const currentYear = new Date().getFullYear();
        yearSelect.value = currentYear.toString();
        yearSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, 300);
  }
});
