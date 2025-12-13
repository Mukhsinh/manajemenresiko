const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');
const { exportToExcel } = require('../utils/exportHelper');

// Get Risk Register data
router.get('/risk-register', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('risk_inputs')
      .select(`
        *,
        master_work_units(name),
        master_risk_categories(name),
        risk_inherent_analysis(*),
        risk_residual_analysis(*),
        risk_treatments(*),
        risk_appetite(*),
        risk_monitoring(*)
      `)
      .order('created_at', { ascending: false });
    
    query = buildOrganizationFilter(query, req.user);
    
    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get risk register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Risk Profile data for charts
router.get('/risk-profile', authenticateUser, async (req, res) => {
  try {
    // First get user's risks with organization filter and all relations
    let risksQuery = supabase
      .from('risk_inputs')
      .select(`
        id,
        kode_risiko,
        sasaran,
        user_id,
        organization_id,
        master_work_units(name),
        master_risk_categories(name)
      `);
    risksQuery = buildOrganizationFilter(risksQuery, req.user);
    
    const { data: userRisks, error: risksError } = await risksQuery;

    if (risksError) throw risksError;

    const riskIds = (userRisks || []).map(r => r.id);

    if (riskIds.length === 0) {
      return res.json([]);
    }

    // Get inherent analysis separately (without nested embeds)
    const { data: analysisData, error: analysisError } = await supabase
      .from('risk_inherent_analysis')
      .select('*')
      .in('risk_input_id', riskIds);

    if (analysisError) throw analysisError;

    // Merge data: attach risk_inputs to each analysis record
    const mergedData = (analysisData || []).map(analysis => {
      const risk = (userRisks || []).find(r => r.id === analysis.risk_input_id);
      return {
        ...analysis,
        risk_inputs: risk || null
      };
    });

    res.json(mergedData);
  } catch (error) {
    console.error('Get risk profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Residual Risk data for charts
router.get('/residual-risk', authenticateUser, async (req, res) => {
  try {
    // First get user's risks with organization filter and all relations
    let risksQuery = supabase
      .from('risk_inputs')
      .select(`
        id,
        kode_risiko,
        sasaran,
        user_id,
        organization_id,
        master_work_units(name),
        master_risk_categories(name)
      `);
    risksQuery = buildOrganizationFilter(risksQuery, req.user);
    
    const { data: userRisks, error: risksError } = await risksQuery;

    if (risksError) throw risksError;

    const riskIds = (userRisks || []).map(r => r.id);

    if (riskIds.length === 0) {
      return res.json([]);
    }

    // Get residual analysis separately
    const { data: residualData, error: residualError } = await supabase
      .from('risk_residual_analysis')
      .select('*')
      .in('risk_input_id', riskIds);

    if (residualError) throw residualError;

    // Get inherent analysis for comparison
    const { data: inherentData, error: inherentError } = await supabase
      .from('risk_inherent_analysis')
      .select('*')
      .in('risk_input_id', riskIds);

    if (inherentError) throw inherentError;

    // Merge data: attach risk_inputs and inherent_analysis to each residual record
    const mergedData = (residualData || []).map(residual => {
      const risk = (userRisks || []).find(r => r.id === residual.risk_input_id);
      const inherent = (inherentData || []).find(i => i.risk_input_id === residual.risk_input_id);
      
      return {
        ...residual,
        risk_inputs: risk ? {
          ...risk,
          risk_inherent_analysis: inherent ? [inherent] : []
        } : null
      };
    });

    res.json(mergedData);
  } catch (error) {
    console.error('Get residual risk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Risk Appetite Dashboard data
router.get('/risk-appetite-dashboard', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('risk_appetite')
      .select(`
        *,
        risk_inputs(
          id,
          kode_risiko,
          sasaran,
          organization_id
        ),
        risk_inherent_analysis(*),
        risk_residual_analysis(*)
      `);
    
    query = buildOrganizationFilter(query, req.user, 'risk_inputs.organization_id');

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get risk appetite dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to send Excel response
function sendExcelResponse(res, buffer, filename) {
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.send(buffer);
}

// Helper function to flatten nested data for Excel
function flattenRiskData(data) {
  return data.map(item => ({
    'Kode Risiko': item.kode_risiko || '',
    'Unit Kerja': item.master_work_units?.name || '',
    'Kategori Risiko': item.master_risk_categories?.name || '',
    'Sasaran': item.sasaran || '',
    'Status': item.status_risiko || '',
    'Tanggal Registrasi': item.tanggal_registrasi || '',
    'Penyebab Risiko': item.penyebab_risiko || '',
    'Dampak Risiko': item.dampak_risiko || ''
  }));
}

// Excel Export: Risk Register
router.get('/risk-register/excel', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('risk_inputs')
      .select(`
        *,
        master_work_units(name),
        master_risk_categories(name),
        risk_inherent_analysis(*),
        risk_residual_analysis(*)
      `)
      .order('created_at', { ascending: false });
    
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query;

    if (error) throw error;

    const flattened = flattenRiskData(data || []);
    const buffer = exportToExcel(flattened, 'Risk Register');
    sendExcelResponse(res, buffer, `risk-register-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export risk register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel Export: Risk Profile
router.get('/risk-profile/excel', authenticateUser, async (req, res) => {
  try {
    let risksQuery = supabase
      .from('risk_inputs')
      .select(`
        id,
        kode_risiko,
        sasaran,
        master_work_units(name),
        master_risk_categories(name)
      `);
    risksQuery = buildOrganizationFilter(risksQuery, req.user);
    const { data: userRisks } = await risksQuery;
    const riskIds = (userRisks || []).map(r => r.id);

    if (riskIds.length === 0) {
      const buffer = exportToExcel([], 'Risk Profile');
      sendExcelResponse(res, buffer, `risk-profile-${new Date().toISOString().split('T')[0]}.xlsx`);
      return;
    }

    const { data: analysisData } = await supabase
      .from('risk_inherent_analysis')
      .select('*')
      .in('risk_input_id', riskIds);

    const mergedData = (analysisData || []).map(analysis => {
      const risk = (userRisks || []).find(r => r.id === analysis.risk_input_id);
      return {
        'Kode Risiko': risk?.kode_risiko || '',
        'Unit Kerja': risk?.master_work_units?.name || '',
        'Kategori': risk?.master_risk_categories?.name || '',
        'Probabilitas': analysis.probability || '',
        'Dampak': analysis.impact || '',
        'Risk Value': analysis.risk_value || '',
        'Risk Level': analysis.risk_level || '',
        'Probabilitas %': analysis.probability_percentage || '',
        'Dampak Finansial': analysis.financial_impact || ''
      };
    });

    const buffer = exportToExcel(mergedData, 'Risk Profile');
    sendExcelResponse(res, buffer, `risk-profile-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export risk profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel Export: Residual Risk
router.get('/residual-risk/excel', authenticateUser, async (req, res) => {
  try {
    let risksQuery = supabase
      .from('risk_inputs')
      .select(`
        id,
        kode_risiko,
        master_work_units(name),
        master_risk_categories(name)
      `);
    risksQuery = buildOrganizationFilter(risksQuery, req.user);
    const { data: userRisks } = await risksQuery;
    const riskIds = (userRisks || []).map(r => r.id);

    if (riskIds.length === 0) {
      const buffer = exportToExcel([], 'Residual Risk');
      sendExcelResponse(res, buffer, `residual-risk-${new Date().toISOString().split('T')[0]}.xlsx`);
      return;
    }

    const { data: residualData } = await supabase
      .from('risk_residual_analysis')
      .select('*')
      .in('risk_input_id', riskIds);

    const mergedData = (residualData || []).map(residual => {
      const risk = (userRisks || []).find(r => r.id === residual.risk_input_id);
      return {
        'Kode Risiko': risk?.kode_risiko || '',
        'Unit Kerja': risk?.master_work_units?.name || '',
        'Kategori': risk?.master_risk_categories?.name || '',
        'Probabilitas': residual.probability || '',
        'Dampak': residual.impact || '',
        'Risk Value': residual.risk_value || '',
        'Risk Level': residual.risk_level || '',
        'Net Risk Value': residual.net_risk_value || '',
        'Review Status': residual.review_status || ''
      };
    });

    const buffer = exportToExcel(mergedData, 'Residual Risk');
    sendExcelResponse(res, buffer, `residual-risk-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export residual risk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel Export: Risk Appetite
router.get('/risk-appetite/excel', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('risk_appetite')
      .select(`
        *,
        risk_inputs(
          id,
          kode_risiko,
          organization_id
        )
      `);
    query = buildOrganizationFilter(query, req.user, 'risk_inputs.organization_id');
    const { data, error } = await query;

    if (error) throw error;

    const flattened = (data || []).map(item => ({
      'Kode Risiko': item.risk_inputs?.kode_risiko || '',
      'Risk Level': item.risk_level || '',
      'Threshold': item.threshold || '',
      'Current Value': item.current_value || '',
      'Status': item.status || ''
    }));

    const buffer = exportToExcel(flattened, 'Risk Appetite');
    sendExcelResponse(res, buffer, `risk-appetite-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export risk appetite error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel Export: KRI
router.get('/kri/excel', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories(name),
        master_work_units(name),
        risk_inputs(kode_risiko)
      `);
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query;

    if (error) throw error;

    const flattened = (data || []).map(item => ({
      'Kode': item.kode || '',
      'Nama Indikator': item.nama_indikator || '',
      'Kategori': item.master_risk_categories?.name || '',
      'Unit Kerja': item.master_work_units?.name || '',
      'Kode Risiko': item.risk_inputs?.kode_risiko || '',
      'Nilai Aktual': item.nilai_aktual || '',
      'Status': item.status_indikator || '',
      'Periode': item.periode_pengukuran || ''
    }));

    const buffer = exportToExcel(flattened, 'KRI');
    sendExcelResponse(res, buffer, `kri-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel Export: Monitoring & Evaluasi
router.get('/monitoring/excel', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('monitoring_evaluasi_risiko')
      .select(`
        *,
        risk_inputs(
          kode_risiko,
          sasaran
        )
      `)
      .eq('user_id', req.user.id)
      .order('tanggal_monitoring', { ascending: false });

    if (error) throw error;

    const flattened = (data || []).map(item => ({
      'Tanggal Monitoring': item.tanggal_monitoring || '',
      'Kode Risiko': item.risk_inputs?.kode_risiko || '',
      'Status Risiko': item.status_risiko || '',
      'Nilai Risiko': item.nilai_risiko || '',
      'Progress Mitigasi': item.progress_mitigasi || '',
      'Evaluasi': item.evaluasi || ''
    }));

    const buffer = exportToExcel(flattened, 'Monitoring Evaluasi');
    sendExcelResponse(res, buffer, `monitoring-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export monitoring error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel Export: Loss Event
router.get('/loss-event/excel', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('loss_event')
      .select(`
        *,
        master_risk_categories(name),
        master_work_units(name),
        risk_inputs(kode_risiko)
      `);
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query;

    if (error) throw error;

    const flattened = (data || []).map(item => ({
      'Kode': item.kode || '',
      'Tanggal Kejadian': item.tanggal_kejadian || '',
      'Kategori': item.master_risk_categories?.name || '',
      'Unit Kerja': item.master_work_units?.name || '',
      'Kode Risiko': item.risk_inputs?.kode_risiko || '',
      'Deskripsi': item.deskripsi_kejadian || '',
      'Nilai Kerugian': item.nilai_kerugian || '',
      'Status': item.status || ''
    }));

    const buffer = exportToExcel(flattened, 'Loss Event');
    sendExcelResponse(res, buffer, `loss-event-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export loss event error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel Export: Strategic Map
router.get('/strategic-map/excel', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('strategic_map')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const flattened = (data || []).map(item => ({
      'Perspektif': item.perspektif || '',
      'Tujuan Strategis': item.tujuan_strategis || '',
      'Indikator': item.indikator || '',
      'Target': item.target || '',
      'Aktual': item.aktual || ''
    }));

    const buffer = exportToExcel(flattened, 'Strategic Map');
    sendExcelResponse(res, buffer, `strategic-map-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export strategic map error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PDF Export endpoints (structure ready - returns JSON for now)
router.get('/risk-register/pdf', authenticateUser, async (req, res) => {
  try {
    // For now, return JSON. PDF generation can be implemented later with pdfkit or similar
    let query = supabase
      .from('risk_inputs')
      .select(`
        *,
        master_work_units(name),
        master_risk_categories(name)
      `)
      .order('created_at', { ascending: false });
    
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query;

    if (error) throw error;
    res.json({ message: 'PDF export not yet implemented', data: data || [] });
  } catch (error) {
    console.error('Export risk register PDF error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/risk-profile/pdf', authenticateUser, async (req, res) => {
  res.json({ message: 'PDF export not yet implemented' });
});

router.get('/residual-risk/pdf', authenticateUser, async (req, res) => {
  res.json({ message: 'PDF export not yet implemented' });
});

router.get('/risk-appetite/pdf', authenticateUser, async (req, res) => {
  res.json({ message: 'PDF export not yet implemented' });
});

router.get('/kri/pdf', authenticateUser, async (req, res) => {
  res.json({ message: 'PDF export not yet implemented' });
});

router.get('/monitoring/pdf', authenticateUser, async (req, res) => {
  res.json({ message: 'PDF export not yet implemented' });
});

router.get('/loss-event/pdf', authenticateUser, async (req, res) => {
  res.json({ message: 'PDF export not yet implemented' });
});

router.get('/strategic-map/pdf', authenticateUser, async (req, res) => {
  res.json({ message: 'PDF export not yet implemented' });
});

module.exports = router;

