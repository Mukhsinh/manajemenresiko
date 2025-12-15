const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Simple dashboard data with proper organization filtering
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    console.log('Simple dashboard request from user:', req.user?.email || 'unknown', 'Role:', req.user?.role, 'SuperAdmin:', req.user?.isSuperAdmin);
    
    // Use admin client to bypass RLS issues
    const client = supabaseAdmin;
    
    if (!client) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    // Apply organization filters for non-superadmin/admin users
    let risksQuery = client.from('risk_inputs').select('*', { count: 'exact', head: true });
    risksQuery = buildOrganizationFilter(risksQuery, req.user);

    let lossEventsQuery = client.from('loss_event').select('*', { count: 'exact', head: true });
    lossEventsQuery = buildOrganizationFilter(lossEventsQuery, req.user);

    let visiMisiQuery = client.from('visi_misi').select('*').limit(5).order('created_at', { ascending: false });
    visiMisiQuery = buildOrganizationFilter(visiMisiQuery, req.user);

    let rencanaQuery = client.from('rencana_strategis').select('*').limit(5).order('created_at', { ascending: false });
    rencanaQuery = buildOrganizationFilter(rencanaQuery, req.user);

    // Get basic counts with organization filtering
    const [
      { count: totalRisks },
      { count: lossEvents },
      { data: visiMisiData },
      { data: rencanaData }
    ] = await Promise.all([
      risksQuery,
      lossEventsQuery,
      visiMisiQuery,
      rencanaQuery
    ]);

    const stats = {
      total_risks: totalRisks || 0,
      loss_events: lossEvents || 0,
      inherent_risks: {
        extreme_high: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      residual_risks: {
        extreme_high: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      kri: {
        aman: 0,
        hati_hati: 0,
        kritis: 0
      },
      ews_alerts: {
        normal: 0,
        peringatan: 0,
        waspada: 0,
        darurat: 0
      },
      sample_data: {
        visi_misi: visiMisiData || [],
        rencana_strategis: rencanaData || []
      }
    };

    console.log('Returning dashboard stats for user role:', req.user?.role, 'Data counts:', {
      risks: totalRisks,
      lossEvents,
      visiMisi: visiMisiData?.length,
      rencana: rencanaData?.length
    });
    res.json(stats);
  } catch (error) {
    console.error('Simple dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple visi misi data with organization filtering
router.get('/visi-misi', authenticateUser, async (req, res) => {
  try {
    console.log('Simple visi-misi request from user:', req.user?.email || 'unknown', 'Role:', req.user?.role);
    
    // Use admin client to bypass RLS
    const client = supabaseAdmin;
    
    if (!client) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    let query = client
      .from('visi_misi')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply organization filter
    query = buildOrganizationFilter(query, req.user);

    const { data, error } = await query;

    if (error) throw error;

    console.log('Returning visi misi data for role:', req.user?.role, 'Records:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('Simple visi misi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple rencana strategis data with organization filtering
router.get('/rencana-strategis', authenticateUser, async (req, res) => {
  try {
    console.log('Simple rencana-strategis request from user:', req.user?.email || 'unknown', 'Role:', req.user?.role);
    
    // Use admin client to bypass RLS
    const client = supabaseAdmin;
    
    if (!client) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    let query = client
      .from('rencana_strategis')
      .select('*, visi_misi(id, visi, misi, tahun)')
      .order('created_at', { ascending: false });

    // Apply organization filter
    query = buildOrganizationFilter(query, req.user);

    const { data, error } = await query;

    if (error) throw error;

    console.log('Returning rencana strategis data for role:', req.user?.role, 'Records:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('Simple rencana strategis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check authentication
router.get('/debug-auth', authenticateUser, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        organizations: req.user.organizations,
        role: req.user.role,
        isSuperAdmin: req.user.isSuperAdmin
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;