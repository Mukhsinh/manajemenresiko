const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

const arrayOrEmpty = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return value.split(',').map(v => v.trim()).filter(Boolean);
  }
  return [];
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

async function resolveUnitOrganization(unitId) {
  if (!unitId) return null;
  try {
    const { data, error } = await supabase
      .from('master_work_units')
      .select('organization_id')
      .eq('id', unitId)
      .maybeSingle();

    if (error) throw error;
    return data?.organization_id || null;
  } catch (error) {
    console.warn('resolveUnitOrganization error:', error.message);
    return null;
  }
}

function buildRiskPayload(body, userId, isUpdate = false) {
  const payload = {
    nama_unit_kerja_id: body.nama_unit_kerja_id || null,
    kategori_risiko_id: body.kategori_risiko_id || null,
    rencana_strategis_id: body.rencana_strategis_id || null,
    sasaran_strategis: body.sasaran || '',
    tanggal_registrasi: body.tanggal_registrasi || null,
    penyebab_risiko: body.penyebab_risiko || '',
    dampak_risiko: body.dampak_risiko || '',
    pihak_terkait: body.pihak_terkait || '',
    status_risiko: body.status_risiko || 'Active',
    jenis_risiko: body.jenis_risiko || 'Threat',
    kode_risiko: body.kode_risiko || null,
    no: toNumber(body.no),
    identifikasi_tanggal: body.identifikasi_tanggal || null,
    identifikasi_deskripsi: body.identifikasi_deskripsi || '',
    identifikasi_akar_penyebab: body.identifikasi_akar_penyebab || '',
    identifikasi_indikator: body.identifikasi_indikator || '',
    identifikasi_faktor_positif: body.identifikasi_faktor_positif || '',
    identifikasi_deskripsi_dampak: body.identifikasi_deskripsi_dampak || '',
    pemilik_risiko_nama: body.pemilik_risiko_nama || '',
    pemilik_risiko_jabatan: body.pemilik_risiko_jabatan || '',
    pemilik_risiko_no_hp: body.pemilik_risiko_no_hp || '',
    pemilik_risiko_email: body.pemilik_risiko_email || '',
    pemilik_risiko_strategi: body.pemilik_risiko_strategi || '',
    pemilik_risiko_penanganan: body.pemilik_risiko_penanganan || '',
    pemilik_risiko_biaya: toNumber(body.pemilik_risiko_biaya) || 0,
    sasaran_strategis_refs: arrayOrEmpty(body.sasaran_strategis_refs),
    indikator_kinerja_refs: arrayOrEmpty(body.indikator_kinerja_refs),
    organization_id: body.organization_id || null
  };

  if (!isUpdate) {
    payload.user_id = userId;
  }
  return payload;
}

// Get all risks for current user
router.get('/', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('risk_inputs')
      .select(`
        *,
        master_work_units(name),
        master_risk_categories(name),
        rencana_strategis(*, visi_misi(visi, misi)),
        risk_inherent_analysis(*),
        risk_residual_analysis(*),
        risk_treatments(*),
        risk_appetite(*),
        risk_monitoring(*)
      `);

    // Apply organization filter
    query = buildOrganizationFilter(query, req.user);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get risks error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single risk
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('risk_inputs')
      .select(`
        *,
        master_work_units(name),
        master_risk_categories(name),
        rencana_strategis(*, visi_misi(visi, misi)),
        risk_inherent_analysis(*),
        risk_residual_analysis(*),
        risk_treatments(*),
        risk_appetite(*),
        risk_monitoring(*)
      `)
      .eq('id', req.params.id);

    // Apply organization filter
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query.single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Risiko tidak ditemukan' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get risk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create risk input
router.post('/', authenticateUser, async (req, res) => {
  try {
    const riskData = buildRiskPayload(req.body, req.user.id);
    if (!riskData.organization_id && riskData.nama_unit_kerja_id) {
      riskData.organization_id = await resolveUnitOrganization(riskData.nama_unit_kerja_id);
    }

    const { data, error } = await supabase
      .from('risk_inputs')
      .insert(riskData)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Create risk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate Risk Profile (calculate inherent risk)
router.post('/:id/generate-profile', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { probability, impact, financial_impact } = req.body;

    // Get risk input
    const { data: riskInput, error: riskError } = await supabase
      .from('risk_inputs')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (riskError) throw riskError;

    // Calculate inherent risk
    const risk_value = probability * impact;
    let risk_level = 'LOW RISK';
    if (risk_value >= 16) risk_level = 'EXTREME HIGH';
    else if (risk_value >= 10) risk_level = 'HIGH RISK';
    else if (risk_value >= 5) risk_level = 'MEDIUM RISK';

    // Get probability percentage
    const { data: probData } = await supabase
      .from('master_probability_criteria')
      .select('percentage')
      .eq('index', probability)
      .single();

    const probability_percentage = probData?.percentage || '0%';

    // Upsert inherent analysis
    const inherentData = {
      risk_input_id: id,
      probability: probability,
      impact: impact,
      risk_value: risk_value,
      risk_level: risk_level,
      probability_percentage: probability_percentage,
      financial_impact: financial_impact || 0
    };

    const { data: inherent, error: inherentError } = await supabase
      .from('risk_inherent_analysis')
      .upsert(inherentData, { onConflict: 'risk_input_id' })
      .select()
      .single();

    if (inherentError) throw inherentError;

    res.json({
      message: 'Risk profile generated successfully',
      inherent_analysis: inherent
    });
  } catch (error) {
    console.error('Generate profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update risk
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const riskData = buildRiskPayload(req.body, req.user.id, true);
    if (!riskData.organization_id && riskData.nama_unit_kerja_id) {
      riskData.organization_id = await resolveUnitOrganization(riskData.nama_unit_kerja_id);
    }

    const { data, error } = await supabase
      .from('risk_inputs')
      .update(riskData)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Update risk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete risk
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // First check if user has access to this risk
    const { data: existingRisk, error: checkError } = await supabase
      .from('risk_inputs')
      .select('organization_id')
      .eq('id', req.params.id)
      .single();

    if (checkError || !existingRisk) {
      return res.status(404).json({ error: 'Risiko tidak ditemukan' });
    }

    // Check organization access if not superadmin
    if (!req.user.isSuperAdmin && existingRisk.organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(existingRisk.organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
      }
    }

    let query = supabase
      .from('risk_inputs')
      .delete()
      .eq('id', req.params.id);

    // Apply organization filter
    query = buildOrganizationFilter(query, req.user);
    const { error } = await query;

    if (error) throw error;

    res.json({ message: 'Risk deleted successfully' });
  } catch (error) {
    console.error('Delete risk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Calculate residual risk
router.post('/:id/residual-risk', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      probability,
      impact,
      financial_impact,
      probability_percentage,
      net_risk_value,
      department,
      review_status,
      next_review_date
    } = req.body;

    // Verify risk belongs to user
    const { data: riskInput, error: riskError } = await supabase
      .from('risk_inputs')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (riskError || !riskInput) {
      return res.status(404).json({ error: 'Risk not found' });
    }

    const risk_value = probability * impact;
    let risk_level = 'LOW RISK';
    if (risk_value >= 16) risk_level = 'EXTREME HIGH';
    else if (risk_value >= 10) risk_level = 'HIGH RISK';
    else if (risk_value >= 5) risk_level = 'MEDIUM RISK';

    let finalProbabilityPercentage = probability_percentage;
    if (!finalProbabilityPercentage) {
      const { data: probData } = await supabase
        .from('master_probability_criteria')
        .select('percentage')
        .eq('index', probability)
        .maybeSingle();

      finalProbabilityPercentage = probData?.percentage || '0%';
    }

    const residualData = {
      risk_input_id: id,
      probability: probability,
      impact: impact,
      risk_value: risk_value,
      risk_level: risk_level,
      probability_percentage: finalProbabilityPercentage,
      financial_impact: financial_impact || 0,
      net_risk_value: toNumber(net_risk_value),
      department: department || '',
      review_status: review_status || '',
      next_review_date: next_review_date || null
    };

    const { data: residual, error: residualError } = await supabase
      .from('risk_residual_analysis')
      .upsert(residualData, { onConflict: 'risk_input_id' })
      .select()
      .single();

    if (residualError) throw residualError;

    res.json({
      message: 'Residual risk calculated successfully',
      residual_analysis: residual
    });
  } catch (error) {
    console.error('Residual risk error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

