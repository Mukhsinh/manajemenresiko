const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

// Get Risk Register data
router.get('/risk-register', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
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
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get risk register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Risk Profile data for charts
router.get('/risk-profile', authenticateUser, async (req, res) => {
  try {
    // First get user's risks
    const { data: userRisks, error: risksError } = await supabase
      .from('risk_inputs')
      .select('id')
      .eq('user_id', req.user.id);

    if (risksError) throw risksError;

    const riskIds = userRisks.map(r => r.id);

    if (riskIds.length === 0) {
      return res.json([]);
    }

    // Then get inherent analysis for those risks
    const { data, error } = await supabase
      .from('risk_inherent_analysis')
      .select(`
        *,
        risk_inputs(
          id,
          kode_risiko,
          sasaran,
          user_id
        )
      `)
      .in('risk_input_id', riskIds);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get risk profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Residual Risk data for charts
router.get('/residual-risk', authenticateUser, async (req, res) => {
  try {
    // First get user's risks
    const { data: userRisks, error: risksError } = await supabase
      .from('risk_inputs')
      .select('id')
      .eq('user_id', req.user.id);

    if (risksError) throw risksError;

    const riskIds = userRisks.map(r => r.id);

    if (riskIds.length === 0) {
      return res.json([]);
    }

    // Then get residual analysis for those risks
    const { data, error } = await supabase
      .from('risk_residual_analysis')
      .select(`
        *,
        risk_inputs(
          id,
          kode_risiko,
          sasaran,
          user_id
        )
      `)
      .in('risk_input_id', riskIds);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get residual risk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Risk Appetite Dashboard data
router.get('/risk-appetite-dashboard', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('risk_appetite')
      .select(`
        *,
        risk_inputs(
          id,
          kode_risiko,
          sasaran
        ),
        risk_inherent_analysis(*),
        risk_residual_analysis(*)
      `)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get risk appetite dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

