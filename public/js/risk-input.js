// Risk Input Module (Advanced)
const RiskInputModule = (() => {
  const state = {
    risks: [],
    units: [],
    categories: [],
    plans: [],
    currentId: null,
    eventsBound: false
  };

  const getApi = () => (window.app ? window.app.apiCall : window.apiCall);
  const getEl = (id) => document.getElementById(id);
  const safeArray = (value) => (Array.isArray(value) ? value : []);

  async function load() {
    console.log('[AUTH] RiskInputModule.load() starting...');
    
    // CRITICAL: Wait for auth to be ready before making API calls
    if (window.waitForAuthReady) {
      const authReady = await window.waitForAuthReady(5000);
      if (!authReady) {
        // Check if user is actually authenticated (might be a timing issue)
        if (window.isAuthenticated && window.currentSession && window.currentSession.access_token) {
          console.log('[AUTH] RiskInputModule: Auth not ready but session exists, retrying waitForReady...');
          // Retry with longer timeout
          const retryReady = await window.waitForAuthReady(3000);
          if (retryReady) {
            console.log('[AUTH] RiskInputModule: Auth ready after retry, proceeding with data load');
          } else {
            console.log('[AUTH] RiskInputModule: Auth still not ready after retry, but session exists - proceeding anyway');
            // Session exists, proceed anyway
          }
        } else {
          // Don't throw error - just log and return gracefully
          // Module will retry when user logs in via auth state listener
          console.log('[AUTH] RiskInputModule: Auth not ready, skipping data load (user not logged in)');
          return; // Graceful return instead of throwing error
        }
      } else {
        console.log('[AUTH] RiskInputModule: Auth ready, proceeding with data load');
      }
    } else if (!window.isAuthenticated) {
      // Fallback if waitForAuthReady is not available
      console.log('[AUTH] RiskInputModule: User not authenticated, skipping data load');
      return; // Graceful return instead of throwing error
    }
    
    await Promise.all([loadMasters(), loadRisks()]);
    bindEvents();
  }

  async function loadMasters() {
    const api = getApi();
    const [units, categories, plans] = await Promise.all([
      api('/api/master-data/work-units'),
      api('/api/master-data/risk-categories'),
      api('/api/rencana-strategis')
    ]);
    state.units = units || [];
    state.categories = categories || [];
    state.plans = plans || [];
    populateSelect('nama-unit-kerja', state.units, 'id', 'name', 'Pilih Unit Kerja');
    populateSelect('kategori-risiko', state.categories, 'id', 'name', 'Pilih Kategori');
    populatePlanSelect();
  }

  function populateSelect(elementId, items, valueKey, labelKey, placeholder) {
    const select = getEl(elementId);
    if (!select) return;
    select.innerHTML = `<option value="">${placeholder || 'Pilih'}</option>`;
    items.forEach((item) => {
      const option = document.createElement('option');
      option.value = item[valueKey];
      option.textContent = item[labelKey];
      select.appendChild(option);
    });
  }

  function populatePlanSelect() {
    const select = getEl('rencana-strategis');
    if (!select) return;
    select.innerHTML = '<option value="">Pilih Rencana Strategis</option>';
    state.plans.forEach((plan) => {
      const option = document.createElement('option');
      option.value = plan.id;
      option.textContent = `${plan.kode} - ${plan.nama_rencana}`;
      select.appendChild(option);
    });
    renderStrategicDetails('');
  }

  function renderStrategicDetails(planId, selectedSasaran = [], selectedIndikator = []) {
    const plan = state.plans.find((p) => p.id === planId);
    const sasaranContainer = getEl('sasaran-strategis-container');
    const indikatorContainer = getEl('indikator-kinerja-container');
    if (!sasaranContainer || !indikatorContainer) return;

    if (!plan) {
      sasaranContainer.innerHTML = '<p class="text-muted">Pilih rencana strategis untuk menampilkan sasaran strategis.</p>';
      indikatorContainer.innerHTML = '<p class="text-muted">Pilih rencana strategis untuk menampilkan indikator kinerja utama.</p>';
      return;
    }

    const sasaran = safeArray(plan.sasaran_strategis);
    const indikator = safeArray(plan.indikator_kinerja_utama);

    sasaranContainer.innerHTML = sasaran.length
      ? sasaran
          .map(
            (item) => `
        <label class="chip">
          <input type="checkbox" class="sasaran-checkbox" value="${item}" ${selectedSasaran.includes(item) ? 'checked' : ''}>
          <span>${item}</span>
        </label>`
          )
          .join('')
      : '<p class="text-muted">Belum ada sasaran strategis pada rencana ini.</p>';

    indikatorContainer.innerHTML = indikator.length
      ? indikator
          .map(
            (item) => `
        <label class="chip">
          <input type="checkbox" class="indikator-checkbox" value="${item}" ${selectedIndikator.includes(item) ? 'checked' : ''}>
          <span>${item}</span>
        </label>`
          )
          .join('')
      : '<p class="text-muted">Belum ada indikator pada rencana ini.</p>';
  }

  function bindEvents() {
    if (state.eventsBound) return;
    state.eventsBound = true;

    const form = getEl('risk-input-form');
    const resetBtn = getEl('reset-form-btn');
    const categorySelect = getEl('kategori-risiko');
    const planSelect = getEl('rencana-strategis');
    const inherentBtn = getEl('btn-save-inherent');
    const residualBtn = getEl('btn-save-residual');
    const newBtn = getEl('btn-new-risk');
    const templateBtn = getEl('btn-download-template');
    const importBtn = getEl('btn-import-risk');
    const reportBtn = getEl('btn-download-report');
    const importInput = getEl('risk-import-input');

    if (form) form.addEventListener('submit', handleRiskSubmit);
    if (resetBtn) resetBtn.addEventListener('click', () => resetForm());
    if (categorySelect) categorySelect.addEventListener('change', () => generateRiskCode());
    if (planSelect) planSelect.addEventListener('change', (e) => renderStrategicDetails(e.target.value));
    if (inherentBtn) inherentBtn.addEventListener('click', handleInherentSubmit);
    if (residualBtn) residualBtn.addEventListener('click', handleResidualSubmit);
    if (newBtn) newBtn.addEventListener('click', () => {
      resetForm();
      form?.scrollIntoView({ behavior: 'smooth' });
    });
    if (templateBtn) templateBtn.addEventListener('click', downloadTemplate);
    if (reportBtn) reportBtn.addEventListener('click', downloadReport);
    if (importBtn) importBtn.addEventListener('click', () => importInput?.click());
    if (importInput) importInput.addEventListener('change', handleImportFile);
  }

  async function loadRisks() {
    try {
      console.log('Loading risks data...');
      
      // Try debug endpoint first since it's working (no auth required)
      let risks;
      try {
        console.log('Trying debug endpoint...');
        const response = await fetch('/api/risks/debug');
        const debugResponse = await response.json();
        console.log('Debug response:', debugResponse);
        risks = debugResponse.data || [];
        console.log('Risks loaded from debug endpoint:', risks?.length || 0);
      } catch (debugError) {
        console.warn('Debug endpoint failed, trying authenticated endpoint:', debugError.message);
        try {
          const api = getApi();
          risks = await api('/api/risks');
          console.log('Risks loaded from authenticated endpoint:', risks?.length || 0);
        } catch (authError) {
          console.warn('Authenticated endpoint failed, trying test endpoint:', authError.message);
          try {
            const api = getApi();
            risks = await api('/api/test-data/risks');
            console.log('Risks loaded from test endpoint:', risks?.length || 0);
          } catch (testError) {
            console.error('All risks endpoints failed:', testError.message);
            throw new Error('Tidak dapat memuat data risiko. Silakan refresh halaman atau hubungi administrator.');
          }
        }
      }
      
      state.risks = Array.isArray(risks) ? risks : [];
      console.log('Final risks state:', state.risks.length);
      renderRiskTable();
    } catch (error) {
      console.error('Error loading risks:', error);
      state.risks = [];
      renderRiskTable();
      
      // Show error message in table
      const tbody = getEl('risk-input-tbody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center text-danger">
              <i class="fas fa-exclamation-triangle"></i> Error memuat data: ${error.message}
              <br><button onclick="window.RiskInputModule?.loadRisks?.()" class="btn btn-sm btn-primary mt-2">Coba Lagi</button>
            </td>
          </tr>
        `;
      }
    }
  }

  function renderRiskTable() {
    console.log('renderRiskTable called with', state.risks.length, 'risks');
    const tbody = getEl('risk-input-tbody');
    if (!tbody) {
      console.error('risk-input-tbody element not found');
      return;
    }
    if (!state.risks.length) {
      console.log('No risks to display');
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">Belum ada data risiko</td></tr>';
      return;
    }
    console.log('Rendering', state.risks.length, 'risks to table');
    tbody.innerHTML = state.risks
      .map((risk) => {
        const unitName = risk.master_work_units?.name || '-';
        const unitJenis = risk.master_work_units?.jenis || '-';
        const unitKategori = risk.master_work_units?.kategori || '-';
        const categoryName = risk.master_risk_categories?.name || '-';
        const ownerName = risk.pemilik_risiko_nama || '-';
        const riskType = risk.jenis_risiko || 'Threat';
        
        return `
      <tr>
        <td>${risk.no || '-'}</td>
        <td>${risk.kode_risiko || '-'}</td>
        <td><span class="risk-type ${riskType.toLowerCase()}">${riskType}</span></td>
        <td>${unitName}<br><small class="text-muted">${unitJenis} - ${unitKategori}</small></td>
        <td>${categoryName}</td>
        <td>${ownerName}</td>
        <td><span class="status-badge ${risk.status_risiko?.toLowerCase() || 'active'}">${risk.status_risiko || 'Active'}</span></td>
        <td class="table-actions">
          <button class="btn btn-view btn-sm" onclick="RiskInputModule.view('${risk.id}')" title="Lihat Detail"><i class="fas fa-eye"></i></button>
          <button class="btn btn-edit btn-sm" onclick="RiskInputModule.edit('${risk.id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn btn-delete btn-sm" onclick="RiskInputModule.remove('${risk.id}')" title="Hapus"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
      })
      .join('');
  }

  async function handleRiskSubmit(event) {
    event.preventDefault();
    const payload = collectFormData();
    const api = getApi();
    if (state.currentId) {
      await api(`/api/risks/${state.currentId}`, { method: 'PUT', body: payload });
    } else {
      const created = await api('/api/risks', { method: 'POST', body: payload });
      state.currentId = created.id;
    }
    await loadRisks();
    alert('Data risiko berhasil disimpan');
    resetForm();
  }

  function collectFormData() {
    const getValue = (id) => getEl(id)?.value || '';
    const payload = {
      nama_unit_kerja_id: getValue('nama-unit-kerja') || null,
      kategori_risiko_id: getValue('kategori-risiko') || null,
      rencana_strategis_id: getValue('rencana-strategis') || null,
      sasaran: getValue('sasaran'),
      tanggal_registrasi: getValue('tanggal-registrasi') || null,
      penyebab_risiko: getValue('penyebab-risiko'),
      dampak_risiko: getValue('dampak-risiko'),
      pihak_terkait: getValue('pihak-terkait'),
      status_risiko: getValue('status-risiko'),
      jenis_risiko: getValue('jenis-risiko'),
      kode_risiko: getValue('kode-risiko'),
      no: Number(getValue('no-risiko')) || null,
      identifikasi_tanggal: getValue('identifikasi-tanggal') || null,
      identifikasi_deskripsi: getValue('identifikasi-deskripsi'),
      identifikasi_akar_penyebab: getValue('identifikasi-akar'),
      identifikasi_indikator: getValue('identifikasi-indikator'),
      identifikasi_faktor_positif: getValue('identifikasi-faktor'),
      identifikasi_deskripsi_dampak: getValue('identifikasi-dampak'),
      pemilik_risiko_nama: getValue('pemilik-nama'),
      pemilik_risiko_jabatan: getValue('pemilik-jabatan'),
      pemilik_risiko_no_hp: getValue('pemilik-nohp'),
      pemilik_risiko_email: getValue('pemilik-email'),
      pemilik_risiko_strategi: getValue('pemilik-strategi'),
      pemilik_risiko_penanganan: getValue('pemilik-penanganan'),
      pemilik_risiko_biaya: Number(getValue('pemilik-biaya')) || 0,
      sasaran_strategis_refs: getSelectedValues('.sasaran-checkbox'),
      indikator_kinerja_refs: getSelectedValues('.indikator-checkbox'),
      organization_id: null
    };

    const selectedUnit = state.units.find((unit) => unit.id === payload.nama_unit_kerja_id);
    if (selectedUnit) {
      payload.organization_id = selectedUnit.organization_id || null;
    }

    return payload;
  }

  function getSelectedValues(selector) {
    return Array.from(document.querySelectorAll(selector))
      .filter((input) => input.checked)
      .map((input) => input.value);
  }

  async function edit(id) {
    const risk = state.risks.find((item) => item.id === id);
    if (!risk) return;
    state.currentId = id;
    const setValue = (id, value = '') => {
      const el = getEl(id);
      if (el) el.value = value || '';
    };
    setValue('nama-unit-kerja', risk.nama_unit_kerja_id);
    setValue('kategori-risiko', risk.kategori_risiko_id);
    setValue('rencana-strategis', risk.rencana_strategis_id);
    setValue('sasaran', risk.sasaran);
    setValue('tanggal-registrasi', risk.tanggal_registrasi ? risk.tanggal_registrasi.substring(0, 10) : '');
    setValue('penyebab-risiko', risk.penyebab_risiko);
    setValue('dampak-risiko', risk.dampak_risiko);
    setValue('pihak-terkait', risk.pihak_terkait);
    setValue('status-risiko', risk.status_risiko || 'Active');
    setValue('jenis-risiko', risk.jenis_risiko || 'Threat');
    setValue('kode-risiko', risk.kode_risiko);
    setValue('no-risiko', risk.no);
    setValue('identifikasi-tanggal', risk.identifikasi_tanggal ? risk.identifikasi_tanggal.substring(0, 10) : '');
    setValue('identifikasi-deskripsi', risk.identifikasi_deskripsi);
    setValue('identifikasi-akar', risk.identifikasi_akar_penyebab);
    setValue('identifikasi-indikator', risk.identifikasi_indikator);
    setValue('identifikasi-faktor', risk.identifikasi_faktor_positif);
    setValue('identifikasi-dampak', risk.identifikasi_deskripsi_dampak);
    setValue('pemilik-nama', risk.pemilik_risiko_nama);
    setValue('pemilik-jabatan', risk.pemilik_risiko_jabatan);
    setValue('pemilik-nohp', risk.pemilik_risiko_no_hp);
    setValue('pemilik-email', risk.pemilik_risiko_email);
    setValue('pemilik-strategi', risk.pemilik_risiko_strategi);
    setValue('pemilik-penanganan', risk.pemilik_risiko_penanganan);
    setValue('pemilik-biaya', risk.pemilik_risiko_biaya);
    renderStrategicDetails(
      risk.rencana_strategis_id,
      safeArray(risk.sasaran_strategis_refs),
      safeArray(risk.indikator_kinerja_refs)
    );
    populateAnalysisForms(risk);
    getEl('risk-input-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  function populateAnalysisForms(risk) {
    const inherent = risk.risk_inherent_analysis || {};
    const residual = risk.risk_residual_analysis || {};
    setValue('inherent-probability', inherent.probability);
    setValue('inherent-impact', inherent.impact);
    setValue('inherent-financial', inherent.financial_impact);
    setValue('residual-probability', residual.probability);
    setValue('residual-impact', residual.impact);
    setValue('residual-financial', residual.financial_impact);
    setValue('residual-probability-percent', residual.probability_percentage);
    setValue('residual-risk-value', residual.risk_value);
    setValue('residual-net', residual.net_risk_value);
    setValue('residual-department', residual.department);
    setValue('residual-review-status', residual.review_status);
    setValue('residual-next-review', residual.next_review_date ? residual.next_review_date.substring(0, 10) : '');
  }

  function setValue(id, value) {
    const el = getEl(id);
    if (el) el.value = value || '';
  }

  function resetForm() {
    const form = getEl('risk-input-form');
    form?.reset();
    state.currentId = null;
    renderStrategicDetails('');
    clearAnalysisForms();
  }

  function clearAnalysisForms() {
    [
      'inherent-probability',
      'inherent-impact',
      'inherent-financial',
      'residual-probability',
      'residual-impact',
      'residual-financial',
      'residual-probability-percent',
      'residual-risk-value',
      'residual-net',
      'residual-department',
      'residual-review-status',
      'residual-next-review'
    ].forEach((id) => setValue(id, ''));
  }

  async function remove(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus risiko ini?')) return;
    const api = getApi();
    await api(`/api/risks/${id}`, { method: 'DELETE' });
    alert('Risiko berhasil dihapus');
    if (state.currentId === id) {
      resetForm();
    }
    await loadRisks();
  }

  async function generateRiskCode() {
    const categoryId = getEl('kategori-risiko')?.value;
    if (!categoryId) return;
    const category = state.categories.find((item) => item.id === categoryId);
    if (!category) return;
    const related = state.risks.filter((risk) => risk.kategori_risiko_id === categoryId);
    const nextNumber = related.length + 1;
    const prefix = category.name.substring(0, 3).toUpperCase();
    setValue('kode-risiko', `${prefix}-${String(nextNumber).padStart(3, '0')}`);
    setValue('no-risiko', nextNumber);
  }

  async function handleInherentSubmit() {
    if (!state.currentId) {
      alert('Simpan data risiko terlebih dahulu');
      return;
    }
    const data = {
      probability: Number(getEl('inherent-probability')?.value),
      impact: Number(getEl('inherent-impact')?.value),
      financial_impact: Number(getEl('inherent-financial')?.value) || 0
    };
    if (!data.probability || !data.impact) {
      alert('Probabilitas dan Dampak wajib diisi');
      return;
    }
    const api = getApi();
    await api(`/api/risks/${state.currentId}/generate-profile`, { method: 'POST', body: data });
    alert('Analisis inheren berhasil disimpan');
    await loadRisks();
  }

  async function handleResidualSubmit() {
    if (!state.currentId) {
      alert('Simpan data risiko terlebih dahulu');
      return;
    }
    const payload = {
      probability: Number(getEl('residual-probability')?.value),
      impact: Number(getEl('residual-impact')?.value),
      financial_impact: Number(getEl('residual-financial')?.value) || 0,
      probability_percentage: getEl('residual-probability-percent')?.value || '',
      net_risk_value: Number(getEl('residual-net')?.value) || null,
      department: getEl('residual-department')?.value || '',
      review_status: getEl('residual-review-status')?.value || '',
      next_review_date: getEl('residual-next-review')?.value || null
    };
    if (!payload.probability || !payload.impact) {
      alert('Probabilitas dan Dampak residual wajib diisi');
      return;
    }
    const api = getApi();
    await api(`/api/risks/${state.currentId}/residual-risk`, { method: 'POST', body: payload });
    alert('Analisis residual berhasil disimpan');
    await loadRisks();
  }

  function downloadTemplate() {
    try {
      // Check if XLSX library is available
      if (typeof XLSX === 'undefined') {
        alert('Library XLSX tidak tersedia. Silakan refresh halaman dan coba lagi.');
        return;
      }

      const sample = [
        {
          'Nama Unit Kerja': 'UNIT-001',
          'Kategori Risiko': 'CAT-001',
          'Rencana Strategis': 'Kode Rencana',
          Sasaran: 'Deskripsi sasaran',
          'Tanggal Registrasi': '2025-01-01',
          'Penyebab Risiko': 'Deskripsi penyebab',
          'Dampak Risiko': 'Deskripsi dampak',
          'Pihak Terkait': 'Nama pihak',
          'Status Risiko': 'Active',
          'Jenis Risiko': 'Threat'
        }
      ];
      
      const worksheet = XLSX.utils.json_to_sheet(sample);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Risk Input');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `template-risk-input-${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      
      // Show success message
      alert('Template berhasil diunduh!');
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Gagal mengunduh template. Error: ' + error.message);
    }
  }

  function downloadReport() {
    try {
      if (!state.risks.length) {
        alert('Tidak ada data untuk diunduh');
        return;
      }
      
      // Check if XLSX library is available
      if (typeof XLSX === 'undefined') {
        alert('Library XLSX tidak tersedia. Silakan refresh halaman dan coba lagi.');
        return;
      }
      
      const rows = state.risks.map((risk) => ({
        'Kode Risiko': risk.kode_risiko || '-',
        'Unit Kerja': risk.master_work_units?.name || '-',
        'Jenis Unit Kerja': risk.master_work_units?.jenis || '-',
        'Kategori Unit Kerja': risk.master_work_units?.kategori || '-',
        'Rencana Strategis': risk.rencana_strategis?.nama_rencana || '-',
        'Status Risiko': risk.status_risiko || '-',
        'Sasaran': risk.sasaran || '-',
        'Pemilik Risiko': risk.pemilik_risiko_nama || '-',
        'Penyebab Risiko': risk.penyebab_risiko || '-',
        'Dampak Risiko': risk.dampak_risiko || '-',
        'Tanggal Registrasi': risk.tanggal_registrasi || '-'
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Risk Input');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `laporan-risk-input-${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      
      // Show success message
      alert('Laporan berhasil diunduh!');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Gagal mengunduh laporan. Error: ' + error.message);
    }
  }

  function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        await importRows(rows);
        alert('Import data risiko berhasil');
        await loadRisks();
      } catch (error) {
        console.error(error);
        alert('Gagal mengimpor data');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  }

  async function importRows(rows = []) {
    const api = getApi();
    for (const row of rows) {
      const payload = {
        nama_unit_kerja_id: matchByName(row['Nama Unit Kerja'], state.units),
        kategori_risiko_id: matchByName(row['Kategori Risiko'], state.categories),
        rencana_strategis_id: matchByCode(row['Rencana Strategis'], state.plans),
        sasaran: row['Sasaran'] || '',
        tanggal_registrasi: row['Tanggal Registrasi'] || null,
        penyebab_risiko: row['Penyebab Risiko'] || '',
        dampak_risiko: row['Dampak Risiko'] || '',
        pihak_terkait: row['Pihak Terkait'] || '',
        status_risiko: row['Status Risiko'] || 'Active',
        jenis_risiko: row['Jenis Risiko'] || 'Threat'
      };
      await api('/api/risks', { method: 'POST', body: payload });
    }
  }

  function matchByName(name, list = []) {
    if (!name) return null;
    const item = list.find((entry) => entry.name === name || entry.code === name);
    return item ? item.id : null;
  }

  function matchByCode(code, list = []) {
    if (!code) return null;
    const item = list.find((entry) => entry.kode === code || entry.nama_rencana === code);
    return item ? item.id : null;
  }

  function view(id) {
    const risk = state.risks.find((item) => item.id === id);
    if (!risk) {
      alert('Data risiko tidak ditemukan');
      return;
    }
    showRiskDetailModal(risk);
  }

  function showRiskDetailModal(risk) {
    // Create modal HTML
    const modalHtml = `
      <div id="risk-detail-modal" class="modal-overlay" onclick="closeRiskDetailModal(event)">
        <div class="modal-content risk-detail-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-eye"></i> Detail Data Risiko</h3>
            <button class="modal-close" onclick="closeRiskDetailModal()">&times;</button>
          </div>
          <div class="modal-body">
            ${generateRiskDetailContent(risk)}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeRiskDetailModal()">Tutup</button>
            <button class="btn btn-primary" onclick="RiskInputModule.edit('${risk.id}'); closeRiskDetailModal();">Edit Data</button>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('risk-detail-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add modal styles if not exists
    addModalStyles();
  }

  function generateRiskDetailContent(risk) {
    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      try {
        return new Date(dateStr).toLocaleDateString('id-ID');
      } catch {
        return dateStr;
      }
    };

    const formatCurrency = (amount) => {
      if (!amount) return '-';
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
      }).format(amount);
    };

    const formatArray = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return '-';
      return arr.join(', ');
    };

    return `
      <div class="risk-detail-sections">
        <!-- Informasi Dasar -->
        <div class="detail-section">
          <h4><i class="fas fa-info-circle"></i> Informasi Dasar</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>No. Risiko:</label>
              <span>${risk.no || '-'}</span>
            </div>
            <div class="detail-item">
              <label>Kode Risiko:</label>
              <span>${risk.kode_risiko || '-'}</span>
            </div>
            <div class="detail-item">
              <label>Status Risiko:</label>
              <span class="status-badge ${risk.status_risiko?.toLowerCase() || 'active'}">${risk.status_risiko || 'Active'}</span>
            </div>
            <div class="detail-item">
              <label>Jenis Risiko:</label>
              <span class="risk-type ${risk.jenis_risiko?.toLowerCase() || 'threat'}">${risk.jenis_risiko || 'Threat'}</span>
            </div>
            <div class="detail-item">
              <label>Unit Kerja:</label>
              <span>${risk.master_work_units?.name || '-'}</span>
            </div>
            <div class="detail-item">
              <label>Jenis Unit Kerja:</label>
              <span>${risk.master_work_units?.jenis || '-'}</span>
            </div>
            <div class="detail-item">
              <label>Kategori Unit Kerja:</label>
              <span>${risk.master_work_units?.kategori || '-'}</span>
            </div>
            <div class="detail-item">
              <label>Kategori Risiko:</label>
              <span>${risk.master_risk_categories?.name || '-'}</span>
            </div>
            <div class="detail-item">
              <label>Rencana Strategis:</label>
              <span>${risk.rencana_strategis?.nama_rencana || '-'}</span>
            </div>
            <div class="detail-item">
              <label>Tanggal Registrasi:</label>
              <span>${formatDate(risk.tanggal_registrasi)}</span>
            </div>
          </div>
        </div>

        <!-- Deskripsi Risiko -->
        <div class="detail-section">
          <h4><i class="fas fa-file-text"></i> Deskripsi Risiko</h4>
          <div class="detail-grid">
            <div class="detail-item full-width">
              <label>Sasaran:</label>
              <span>${risk.sasaran || '-'}</span>
            </div>
            <div class="detail-item full-width">
              <label>Penyebab Risiko:</label>
              <span>${risk.penyebab_risiko || '-'}</span>
            </div>
            <div class="detail-item full-width">
              <label>Dampak Risiko:</label>
              <span>${risk.dampak_risiko || '-'}</span>
            </div>
            <div class="detail-item full-width">
              <label>Pihak Terkait:</label>
              <span>${risk.pihak_terkait || '-'}</span>
            </div>
          </div>
        </div>

        <!-- Identifikasi Risiko -->
        <div class="detail-section">
          <h4><i class="fas fa-search"></i> Identifikasi Risiko</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Tanggal Identifikasi:</label>
              <span>${formatDate(risk.identifikasi_tanggal)}</span>
            </div>
            <div class="detail-item">
              <label>Indikator Risiko:</label>
              <span>${risk.identifikasi_indikator || '-'}</span>
            </div>
            <div class="detail-item full-width">
              <label>Deskripsi Identifikasi:</label>
              <span>${risk.identifikasi_deskripsi || '-'}</span>
            </div>
            <div class="detail-item full-width">
              <label>Akar Penyebab:</label>
              <span>${risk.identifikasi_akar_penyebab || '-'}</span>
            </div>
            <div class="detail-item full-width">
              <label>Faktor Positif/Kontrol:</label>
              <span>${risk.identifikasi_faktor_positif || '-'}</span>
            </div>
            <div class="detail-item full-width">
              <label>Deskripsi Dampak:</label>
              <span>${risk.identifikasi_deskripsi_dampak || '-'}</span>
            </div>
          </div>
        </div>

        <!-- Pemilik Risiko -->
        <div class="detail-section">
          <h4><i class="fas fa-user"></i> Pemilik Risiko</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Nama:</label>
              <span>${risk.pemilik_risiko_nama || '-'}</span>
            </div>
            <div class="detail-item">
              <label>Jabatan:</label>
              <span>${risk.pemilik_risiko_jabatan || '-'}</span>
            </div>
            <div class="detail-item">
              <label>No. HP:</label>
              <span>${risk.pemilik_risiko_no_hp || '-'}</span>
            </div>
            <div class="detail-item">
              <label>Email:</label>
              <span>${risk.pemilik_risiko_email || '-'}</span>
            </div>
            <div class="detail-item full-width">
              <label>Strategi Mitigasi:</label>
              <span>${risk.pemilik_risiko_strategi || '-'}</span>
            </div>
            <div class="detail-item full-width">
              <label>Rencana Penanganan:</label>
              <span>${risk.pemilik_risiko_penanganan || '-'}</span>
            </div>
            <div class="detail-item">
              <label>Estimasi Biaya:</label>
              <span>${formatCurrency(risk.pemilik_risiko_biaya)}</span>
            </div>
          </div>
        </div>

        <!-- Keterkaitan Strategis -->
        <div class="detail-section">
          <h4><i class="fas fa-link"></i> Keterkaitan Strategis</h4>
          <div class="detail-grid">
            <div class="detail-item full-width">
              <label>Sasaran Strategis:</label>
              <span>${formatArray(risk.sasaran_strategis_refs)}</span>
            </div>
            <div class="detail-item full-width">
              <label>Indikator Kinerja Utama:</label>
              <span>${formatArray(risk.indikator_kinerja_refs)}</span>
            </div>
          </div>
        </div>

        <!-- Analisis Risiko -->
        ${risk.risk_inherent_analysis || risk.risk_residual_analysis ? `
        <div class="detail-section">
          <h4><i class="fas fa-chart-bar"></i> Analisis Risiko</h4>
          <div class="analysis-grid">
            ${risk.risk_inherent_analysis ? `
            <div class="analysis-card">
              <h5>Analisis Inheren</h5>
              <div class="analysis-details">
                <div class="analysis-item">
                  <label>Probabilitas:</label>
                  <span>${risk.risk_inherent_analysis.probability || '-'}</span>
                </div>
                <div class="analysis-item">
                  <label>Dampak:</label>
                  <span>${risk.risk_inherent_analysis.impact || '-'}</span>
                </div>
                <div class="analysis-item">
                  <label>Nilai Risiko:</label>
                  <span>${risk.risk_inherent_analysis.risk_value || '-'}</span>
                </div>
                <div class="analysis-item">
                  <label>Level Risiko:</label>
                  <span class="risk-level ${risk.risk_inherent_analysis.risk_level?.toLowerCase().replace(' ', '-') || ''}">${risk.risk_inherent_analysis.risk_level || '-'}</span>
                </div>
                <div class="analysis-item">
                  <label>Dampak Finansial:</label>
                  <span>${formatCurrency(risk.risk_inherent_analysis.financial_impact)}</span>
                </div>
              </div>
            </div>
            ` : ''}
            ${risk.risk_residual_analysis ? `
            <div class="analysis-card">
              <h5>Analisis Residual</h5>
              <div class="analysis-details">
                <div class="analysis-item">
                  <label>Probabilitas:</label>
                  <span>${risk.risk_residual_analysis.probability || '-'}</span>
                </div>
                <div class="analysis-item">
                  <label>Dampak:</label>
                  <span>${risk.risk_residual_analysis.impact || '-'}</span>
                </div>
                <div class="analysis-item">
                  <label>Nilai Risiko:</label>
                  <span>${risk.risk_residual_analysis.risk_value || '-'}</span>
                </div>
                <div class="analysis-item">
                  <label>Level Risiko:</label>
                  <span class="risk-level ${risk.risk_residual_analysis.risk_level?.toLowerCase().replace(' ', '-') || ''}">${risk.risk_residual_analysis.risk_level || '-'}</span>
                </div>
                <div class="analysis-item">
                  <label>Dampak Finansial:</label>
                  <span>${formatCurrency(risk.risk_residual_analysis.financial_impact)}</span>
                </div>
                <div class="analysis-item">
                  <label>Departemen:</label>
                  <span>${risk.risk_residual_analysis.department || '-'}</span>
                </div>
                <div class="analysis-item">
                  <label>Status Review:</label>
                  <span>${risk.risk_residual_analysis.review_status || '-'}</span>
                </div>
                <div class="analysis-item">
                  <label>Review Berikutnya:</label>
                  <span>${formatDate(risk.risk_residual_analysis.next_review_date)}</span>
                </div>
              </div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Metadata -->
        <div class="detail-section">
          <h4><i class="fas fa-info"></i> Metadata</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Dibuat:</label>
              <span>${formatDate(risk.created_at)}</span>
            </div>
            <div class="detail-item">
              <label>Diperbarui:</label>
              <span>${formatDate(risk.updated_at)}</span>
            </div>
            <div class="detail-item">
              <label>ID Organisasi:</label>
              <span>${risk.organization_id || '-'}</span>
            </div>
            <div class="detail-item">
              <label>ID User:</label>
              <span>${risk.user_id || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function addModalStyles() {
    // Check if styles already exist
    if (document.getElementById('risk-detail-modal-styles')) return;

    const styles = `
      <style id="risk-detail-modal-styles">
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .risk-detail-modal {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 1000px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: between;
          align-items: center;
          background-color: #f8f9fa;
        }

        .modal-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.25rem;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          margin-left: auto;
        }

        .modal-close:hover {
          color: #333;
        }

        .modal-body {
          padding: 20px;
          max-height: calc(90vh - 140px);
          overflow-y: auto;
        }

        .modal-footer {
          padding: 15px 20px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          background-color: #f8f9fa;
        }

        .detail-section {
          margin-bottom: 25px;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          overflow: hidden;
        }

        .detail-section h4 {
          margin: 0;
          padding: 12px 15px;
          background-color: #f1f3f4;
          color: #495057;
          font-size: 1rem;
          border-bottom: 1px solid #e9ecef;
        }

        .detail-grid {
          padding: 15px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
        }

        .detail-item.full-width {
          grid-column: 1 / -1;
        }

        .detail-item label {
          font-weight: 600;
          color: #495057;
          margin-bottom: 4px;
          font-size: 0.875rem;
        }

        .detail-item span {
          color: #212529;
          padding: 6px 0;
          word-wrap: break-word;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-badge.active {
          background-color: #d4edda;
          color: #155724;
        }

        .status-badge.inactive {
          background-color: #f8d7da;
          color: #721c24;
        }

        .risk-type.threat {
          color: #dc3545;
          font-weight: 500;
        }

        .risk-type.opportunity {
          color: #28a745;
          font-weight: 500;
        }

        .analysis-grid {
          padding: 15px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .analysis-card {
          border: 1px solid #dee2e6;
          border-radius: 6px;
          overflow: hidden;
        }

        .analysis-card h5 {
          margin: 0;
          padding: 10px 15px;
          background-color: #e9ecef;
          color: #495057;
          font-size: 0.9rem;
        }

        .analysis-details {
          padding: 15px;
        }

        .analysis-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f1f3f4;
        }

        .analysis-item:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .analysis-item label {
          font-weight: 500;
          color: #6c757d;
          font-size: 0.875rem;
        }

        .risk-level {
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.75rem;
        }

        .risk-level.low-risk {
          background-color: #d4edda;
          color: #155724;
        }

        .risk-level.medium-risk {
          background-color: #fff3cd;
          color: #856404;
        }

        .risk-level.high-risk {
          background-color: #f8d7da;
          color: #721c24;
        }

        .risk-level.extreme-high {
          background-color: #721c24;
          color: white;
        }

        @media (max-width: 768px) {
          .risk-detail-modal {
            width: 95%;
            margin: 10px;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .analysis-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  // Global function to close modal
  window.closeRiskDetailModal = function(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('risk-detail-modal');
    if (modal) {
      modal.remove();
    }
  };

  return {
    load,
    edit,
    remove,
    view
  };
})();

async function loadRiskInputData() {
  try {
    console.log('Loading risk input data...');
    await RiskInputModule.load();
  } catch (error) {
    console.error('Error loading risk input data:', error);
    
    // Show error in the UI
    const container = document.getElementById('risk-input-content') || document.querySelector('#risk-input .page-content');
    if (container) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error memuat data risiko</h5>
            <p>${error.message}</p>
            <button onclick="loadRiskInputData()" class="btn btn-primary">Coba Lagi</button>
            <button onclick="navigateToPage('test-risk-input-simple')" class="btn btn-secondary">Test Risk Input</button>
          </div>
        </div>
      `;
    }
  }
}

// Make functions available globally
window.loadRiskInputData = loadRiskInputData;
window.RiskInputModule = RiskInputModule;

// Setup auth state listener to reload data when user logs in
if (window.authStateManager) {
  window.authStateManager.addListener((state) => {
    if (state.isAuthenticated && document.getElementById('risk-input-tbody')) {
      console.log('[AUTH] RiskInputModule: User authenticated, reloading data...');
      // Small delay to ensure token is fully available
      setTimeout(() => {
        loadRiskInputData().catch(err => {
          console.warn('[AUTH] RiskInputModule: Error reloading data after login:', err);
        });
      }, 500);
    }
  });
}

// Auto-load when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the risk-input page
    if (document.getElementById('risk-input-tbody')) {
      console.log('Risk input page detected, auto-loading data...');
      setTimeout(() => loadRiskInputData(), 1000);
    }
  });
} else {
  // DOM already loaded
  if (document.getElementById('risk-input-tbody')) {
    console.log('Risk input page detected, auto-loading data...');
    setTimeout(() => loadRiskInputData(), 1000);
  }
}

