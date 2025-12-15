const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Get notifications for current user
router.get('/', authenticateUser, async (req, res) => {
  try {
    // Get EWS alerts count
    let ewsQuery = supabase
      .from('early_warning_system')
      .select('*', { count: 'exact', head: true })
      .eq('status_aktif', true)
      .in('level_peringatan', ['Peringatan', 'Waspada', 'Darurat']);
    
    ewsQuery = buildOrganizationFilter(ewsQuery, req.user);
    const { count: ewsAlerts } = await ewsQuery;

    // Get high risk count
    let risksQuery = supabase
      .from('risk_inputs')
      .select('id');
    risksQuery = buildOrganizationFilter(risksQuery, req.user);
    const { data: accessibleRisks } = await risksQuery;
    
    const accessibleRiskIds = (accessibleRisks || []).map(r => r.id);
    
    let highRiskCount = 0;
    if (accessibleRiskIds.length > 0) {
      const { data: inherentData } = await supabase
        .from('risk_inherent_analysis')
        .select('risk_level')
        .in('risk_input_id', accessibleRiskIds)
        .in('risk_level', ['HIGH RISK', 'EXTREME HIGH']);
      
      highRiskCount = (inherentData || []).length;
    }

    // Get KRI critical count
    let kriQuery = supabase
      .from('key_risk_indicator')
      .select('*', { count: 'exact', head: true })
      .eq('status_indikator', 'Kritis');
    kriQuery = buildOrganizationFilter(kriQuery, req.user);
    const { count: kriCritical } = await kriQuery;

    const totalAlerts = (ewsAlerts || 0) + (highRiskCount || 0) + (kriCritical || 0);

    res.json({
      alerts: totalAlerts,
      messages: 0, // No message system implemented yet
      details: {
        ews_alerts: ewsAlerts || 0,
        high_risks: highRiskCount || 0,
        kri_critical: kriCritical || 0
      }
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ 
      alerts: 0, 
      messages: 0,
      error: error.message 
    });
  }
});

module.exports = router;