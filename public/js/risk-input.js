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
    const api = getApi();
    state.risks = await api('/api/risks');
    renderRiskTable();
  }

  function renderRiskTable() {
    const tbody = getEl('risk-input-tbody');
    if (!tbody) return;
    if (!state.risks.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada data risiko</td></tr>';
      return;
    }
    tbody.innerHTML = state.risks
      .map((risk) => {
        const planName = risk.rencana_strategis?.nama_rencana || '-';
        const unitName = risk.master_work_units?.name || '-';
        return `
      <tr>
        <td>${risk.no || '-'}</td>
        <td>${risk.kode_risiko || '-'}</td>
        <td>${unitName}</td>
        <td>${planName}</td>
        <td><span class="status-badge ${risk.status_risiko?.toLowerCase() || 'active'}">${risk.status_risiko || 'Active'}</span></td>
        <td class="table-actions">
          <button class="btn btn-edit btn-sm" onclick="RiskInputModule.edit('${risk.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-delete btn-sm" onclick="RiskInputModule.remove('${risk.id}')"><i class="fas fa-trash"></i></button>
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
    XLSX.writeFile(workbook, 'template-risk-input.xlsx');
  }

  function downloadReport() {
    if (!state.risks.length) {
      alert('Tidak ada data untuk diunduh');
      return;
    }
    const rows = state.risks.map((risk) => ({
      'Kode Risiko': risk.kode_risiko,
      'Unit Kerja': risk.master_work_units?.name || '-',
      'Rencana Strategis': risk.rencana_strategis?.nama_rencana || '-',
      'Status Risiko': risk.status_risiko,
      'Sasaran': risk.sasaran,
      'Pemilik Risiko': risk.pemilik_risiko_nama || '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Risk Input');
    XLSX.writeFile(workbook, 'laporan-risk-input.xlsx');
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

  return {
    load,
    edit,
    remove
  };
})();

async function loadRiskInputData() {
  await RiskInputModule.load();
}

window.loadRiskInputData = loadRiskInputData;
window.RiskInputModule = RiskInputModule;

