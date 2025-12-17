const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Get dashboard statistics (public endpoint for testing)
router.get('/public', async (req, res) => {
  try {
    console.log('Loading public dashboard data...');
    
    // Use admin client to bypass RLS for public dashboard
    const client = supabaseAdmin || supabase;
    
    if (!client) {
      console.error('Supabase client not available');
      return res.status(500).json({ error: 'Database connection not available' });
    }
    
    // Get total risks without organization filter
    console.log('Fetching total risks...');
    const { count: totalRisks, error: risksError } = await client
      .from('risk_inputs')
      .select('*', { count: 'exact', head: true });
    
    if (risksError) {
      console.error('Error fetching risks:', risksError);
    }
    console.log('Total risks found:', totalRisks);

    // Get sample data
    console.log('Fetching visi misi...');
    const { data: sampleVisiMisi, error: visiError } = await client
      .from('visi_misi')
      .select('id, visi, misi, tahun, status')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (visiError) {
      console.error('Error fetching visi misi:', visiError);
    }
    console.log('Visi misi found:', sampleVisiMisi?.length || 0);

    console.log('Fetching rencana strategis...');
    const { data: sampleRencanaStrategis, error: rencanaError } = await client
      .from('rencana_strategis')
      .select('id, nama_rencana, deskripsi, status')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (rencanaError) {
      console.error('Error fetching rencana strategis:', rencanaError);
    }
    console.log('Rencana strategis found:', sampleRencanaStrategis?.length || 0);

    // Get risk analysis data
    console.log('Fetching inherent risks...');
    const { data: inherentRisksData, error: inherentError } = await client
      .from('risk_inherent_analysis')
      .select('risk_level');
    
    if (inherentError) {
      console.error('Error fetching inherent risks:', inherentError);
    }
    console.log('Inherent risks found:', inherentRisksData?.length || 0);

    console.log('Fetching residual risks...');
    const { data: residualRisksData, error: residualError } = await client
      .from('risk_residual_analysis')
      .select('risk_level');
    
    if (residualError) {
      console.error('Error fetching residual risks:', residualError);
    }
    console.log('Residual risks found:', residualRisksData?.length || 0);

    // Get KRI data
    console.log('Fetching KRI data...');
    const { data: kriData, error: kriError } = await client
      .from('key_risk_indicator')
      .select('status_indikator');
    
    if (kriError) {
      console.error('Error fetching KRI:', kriError);
    }
    console.log('KRI data found:', kriData?.length || 0);

    // Get Loss Events count
    console.log('Fetching loss events...');
    const { count: lossEvents, error: lossError } = await client
      .from('loss_event')
      .select('*', { count: 'exact', head: true });
    
    if (lossError) {
      console.error('Error fetching loss events:', lossError);
    }
    console.log('Loss events found:', lossEvents);

    // Count by risk level
    const countByLevel = (risks, level) => {
      return risks?.filter(r => r.risk_level === level).length || 0;
    };

    const stats = {
      total_risks: totalRisks || 0,
      inherent_risks: {
        extreme_high: countByLevel(inherentRisksData, 'EXTREME HIGH'),
        high: countByLevel(inherentRisksData, 'HIGH RISK'),
        medium: countByLevel(inherentRisksData, 'MEDIUM RISK'),
        low: countByLevel(inherentRisksData, 'LOW RISK')
      },
      residual_risks: {
        extreme_high: countByLevel(residualRisksData, 'EXTREME HIGH'),
        high: countByLevel(residualRisksData, 'HIGH RISK'),
        medium: countByLevel(residualRisksData, 'MEDIUM RISK'),
        low: countByLevel(residualRisksData, 'LOW RISK')
      },
      kri: {
        aman: kriData?.filter(k => k.status_indikator === 'Aman').length || 0,
        hati_hati: kriData?.filter(k => k.status_indikator === 'Hati-hati' || k.status_indikator === 'Peringatan').length || 0,
        kritis: kriData?.filter(k => k.status_indikator === 'Kritis').length || 0
      },
      loss_events: lossEvents || 0,
      sample_data: {
        visi_misi: sampleVisiMisi || [],
        rencana_strategis: sampleRencanaStrategis || []
      }
    };

    console.log('Public dashboard stats:', {
      totalRisks: stats.total_risks,
      visiMisiCount: stats.sample_data.visi_misi.length,
      rencanaStrategisCount: stats.sample_data.rencana_strategis.length,
      lossEvents: stats.loss_events
    });

    res.json(stats);
  } catch (error) {
    console.error('Public dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard statistics (authenticated)
router.get('/', authenticateUser, async (req, res) => {
  try {
    // Get total risks with organization filter
    let risksQuery = supabase
      .from('risk_inputs')
      .select('*', { count: 'exact', head: true });
    risksQuery = buildOrganizationFilter(risksQuery, req.user);
    const { count: totalRisks } = await risksQuery;

    // Get risks by level with organization filter
    // First get risk IDs that user has access to
    let accessibleRisksQuery = supabase
      .from('risk_inputs')
      .select('id');
    accessibleRisksQuery = buildOrganizationFilter(accessibleRisksQuery, req.user);
    const { data: accessibleRisks } = await accessibleRisksQuery;
    
    const accessibleRiskIds = (accessibleRisks || []).map(r => r.id);
    
    // Get inherent risks for accessible risk IDs
    let inherentRisksData = [];
    if (accessibleRiskIds.length > 0) {
      const { data: inherentData } = await supabase
        .from('risk_inherent_analysis')
        .select('risk_level')
        .in('risk_input_id', accessibleRiskIds);
      inherentRisksData = inherentData || [];
    }

    // Get residual risks for accessible risk IDs
    let residualRisksData = [];
    if (accessibleRiskIds.length > 0) {
      const { data: residualData } = await supabase
        .from('risk_residual_analysis')
        .select('risk_level')
        .in('risk_input_id', accessibleRiskIds);
      residualRisksData = residualData || [];
    }

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

    // Get Visi Misi count with organization filter
    let visiMisiQuery = supabase
      .from('visi_misi')
      .select('*', { count: 'exact', head: true });
    visiMisiQuery = buildOrganizationFilter(visiMisiQuery, req.user);
    const { count: visiMisiCount } = await visiMisiQuery;

    // Get Rencana Strategis count with organization filter
    let rencanaStrategisQuery = supabase
      .from('rencana_strategis')
      .select('*', { count: 'exact', head: true });
    rencanaStrategisQuery = buildOrganizationFilter(rencanaStrategisQuery, req.user);
    const { count: rencanaStrategisCount } = await rencanaStrategisQuery;

    // Get sample data for display
    let sampleVisiMisiQuery = supabase
      .from('visi_misi')
      .select('id, visi, misi, tahun, status')
      .order('created_at', { ascending: false })
      .limit(5);
    sampleVisiMisiQuery = buildOrganizationFilter(sampleVisiMisiQuery, req.user);
    const { data: sampleVisiMisi } = await sampleVisiMisiQuery;

    let sampleRencanaStrategisQuery = supabase
      .from('rencana_strategis')
      .select('id, nama_rencana, deskripsi, status')
      .order('created_at', { ascending: false })
      .limit(5);
    sampleRencanaStrategisQuery = buildOrganizationFilter(sampleRencanaStrategisQuery, req.user);
    const { data: sampleRencanaStrategis } = await sampleRencanaStrategisQuery;

    console.log('Dashboard data summary:', {
      totalRisks,
      visiMisiCount,
      rencanaStrategisCount,
      lossEvents,
      sampleVisiMisiCount: sampleVisiMisi?.length || 0,
      sampleRencanaStrategisCount: sampleRencanaStrategis?.length || 0
    });

    // Count by risk level
    const countByLevel = (risks, level) => {
      return risks?.filter(r => r.risk_level === level).length || 0;
    };

    const stats = {
      total_risks: totalRisks || 0,
      inherent_risks: {
        extreme_high: countByLevel(inherentRisksData, 'EXTREME HIGH'),
        high: countByLevel(inherentRisksData, 'HIGH RISK'),
        medium: countByLevel(inherentRisksData, 'MEDIUM RISK'),
        low: countByLevel(inherentRisksData, 'LOW RISK')
      },
      residual_risks: {
        extreme_high: countByLevel(residualRisksData, 'EXTREME HIGH'),
        high: countByLevel(residualRisksData, 'HIGH RISK'),
        medium: countByLevel(residualRisksData, 'MEDIUM RISK'),
        low: countByLevel(residualRisksData, 'LOW RISK')
      },
      kri: {
        aman: kriData?.filter(k => k.status_indikator === 'Aman').length || 0,
        hati_hati: kriData?.filter(k => k.status_indikator === 'Hati-hati' || k.status_indikator === 'Peringatan').length || 0,
        kritis: kriData?.filter(k => k.status_indikator === 'Kritis').length || 0
      },
      loss_events: lossEvents || 0,
      ews_alerts: {
        normal: ewsAlerts?.filter(e => e.level_peringatan === 'Normal').length || 0,
        peringatan: ewsAlerts?.filter(e => e.level_peringatan === 'Peringatan').length || 0,
        waspada: ewsAlerts?.filter(e => e.level_peringatan === 'Waspada').length || 0,
        darurat: ewsAlerts?.filter(e => e.level_peringatan === 'Darurat').length || 0
      },
      sample_data: {
        visi_misi: sampleVisiMisi || [],
        rencana_strategis: sampleRencanaStrategis || []
      },
      counts: {
        visi_misi: visiMisiCount || 0,
        rencana_strategis: rencanaStrategisCount || 0
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

