const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Get dashboard statistics
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total risks with organization filter
    let risksQuery = supabase
      .from('risk_inputs')
      .select('*', { count: 'exact', head: true });
    risksQuery = buildOrganizationFilter(risksQuery, req.user);
    const { count: totalRisks } = await risksQuery;

    // Get risks by level with organization filter
    let inherentQuery = supabase
      .from('risk_inherent_analysis')
      .select('risk_level, risk_inputs!inner(organization_id)');
    inherentQuery = buildOrganizationFilter(inherentQuery, req.user, 'risk_inputs.organization_id');
    const { data: inherentRisks } = await inherentQuery;

    let residualQuery = supabase
      .from('risk_residual_analysis')
      .select('risk_level, risk_inputs!inner(organization_id)');
    residualQuery = buildOrganizationFilter(residualQuery, req.user, 'risk_inputs.organization_id');
    const { data: residualRisks } = await residualQuery;

    // Get KRI statistics with organization filter
    let kriQuery = supabase
      .from('key_risk_indicator')
      .select('status_indikator');
    kriQuery = buildOrganizationFilter(kriQuery, req.user);
    const { data: kriData } = await kriQuery;

    // Get Loss Events count with organization filter
    let lossEventsQuery = supabase
      .from('loss_event')
      .select('*', { count: 'exact', head: true });
    lossEventsQuery = buildOrganizationFilter(lossEventsQuery, req.user);
    const { count: lossEvents } = await lossEventsQuery;

    // Get EWS alerts with organization filter
    let ewsQuery = supabase
      .from('early_warning_system')
      .select('level_peringatan, status_aktif')
      .eq('status_aktif', true);
    ewsQuery = buildOrganizationFilter(ewsQuery, req.user);
    const { data: ewsAlerts } = await ewsQuery;

    // Count by risk level
    const countByLevel = (risks, level) => {
      return risks?.filter(r => r.risk_level === level).length || 0;
    };

    const stats = {
      total_risks: totalRisks || 0,
      inherent_risks: {
        extreme_high: countByLevel(inherentRisks, 'EXTREME HIGH'),
        high: countByLevel(inherentRisks, 'HIGH RISK'),
        medium: countByLevel(inherentRisks, 'MEDIUM RISK'),
        low: countByLevel(inherentRisks, 'LOW RISK')
      },
      residual_risks: {
        extreme_high: countByLevel(residualRisks, 'EXTREME HIGH'),
        high: countByLevel(residualRisks, 'HIGH RISK'),
        medium: countByLevel(residualRisks, 'MEDIUM RISK'),
        low: countByLevel(residualRisks, 'LOW RISK')
      },
      kri: {
        aman: kriData?.filter(k => k.status_indikator === 'Aman').length || 0,
        hati_hati: kriData?.filter(k => k.status_indikator === 'Hati-hati').length || 0,
        kritis: kriData?.filter(k => k.status_indikator === 'Kritis').length || 0
      },
      loss_events: lossEvents || 0,
      ews_alerts: {
        normal: ewsAlerts?.filter(e => e.level_peringatan === 'Normal').length || 0,
        peringatan: ewsAlerts?.filter(e => e.level_peringatan === 'Peringatan').length || 0,
        waspada: ewsAlerts?.filter(e => e.level_peringatan === 'Waspada').length || 0,
        darurat: ewsAlerts?.filter(e => e.level_peringatan === 'Darurat').length || 0
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

