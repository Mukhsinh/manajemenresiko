const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Get residual risk data for reports
router.get('/', async (req, res) => {
  try {
    console.log('Fetching residual risk data for reports...');
    
    const clientToUse = supabaseAdmin || supabase;
    
    // Get residual risk analysis with related data
    let query = clientToUse
      .from('risk_residual_analysis')
      .select(`
        *,
        risk_inputs!inner(
          id,
          kode_risiko,
          sasaran,
          penyebab_risiko,
          dampak_risiko,
          status_risiko,
          jenis_risiko,
          organization_id,
          master_work_units(id, name, jenis, kategori),
          master_risk_categories(id, name),
          rencana_strategis(id, kode, nama_rencana),
          risk_inherent_analysis(
            probability,
            impact,
            risk_value,
            risk_level,
            probability_percentage,
            financial_impact
          )
        )
      `);

    // Apply filters if provided
    const { rencana_strategis_id, unit_kerja_id, kategori_risiko_id } = req.query;
    
    if (rencana_strategis_id) {
      query = query.eq('risk_inputs.rencana_strategis_id', rencana_strategis_id);
    }
    
    if (unit_kerja_id) {
      query = query.eq('risk_inputs.nama_unit_kerja_id', unit_kerja_id);
    }
    
    if (kategori_risiko_id) {
      query = query.eq('risk_inputs.kategori_risiko_id', kategori_risiko_id);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching residual risk data:', error);
      throw error;
    }

    console.log(`Residual risk data fetched: ${(data || []).length} records`);
    res.json(data || []);
    
  } catch (error) {
    console.error('Residual risk reports error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get residual risk data without authentication (for testing)
router.get('/public', async (req, res) => {
  try {
    console.log('=== RESIDUAL RISK PUBLIC ENDPOINT ===');
    
    const clientToUse = supabaseAdmin || supabase;
    
    // Get residual risk analysis with related data
    let query = clientToUse
      .from('risk_residual_analysis')
      .select(`
        *,
        risk_inputs!inner(
          id,
          kode_risiko,
          sasaran,
          penyebab_risiko,
          dampak_risiko,
          status_risiko,
          jenis_risiko,
          organization_id,
          master_work_units(id, name, jenis, kategori),
          master_risk_categories(id, name),
          rencana_strategis(id, kode, nama_rencana),
          risk_inherent_analysis(
            probability,
            impact,
            risk_value,
            risk_level,
            probability_percentage,
            financial_impact
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data, error } = await query;

    if (error) {
      console.error('Public residual risk query error:', error);
      throw error;
    }

    console.log('Public residual risk query result:', {
      count: data?.length || 0,
      hasData: data && data.length > 0
    });

    res.json(data || []);
  } catch (error) {
    console.error('Public residual risk endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;