const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Test organization filter
router.get('/kri', authenticateUser, async (req, res) => {
  try {
    console.log('=== KRI Organization Filter Test ===');
    console.log('User ID:', req.user.id);
    console.log('User Email:', req.user.email);
    console.log('User Role:', req.user.role);
    console.log('User isSuperAdmin:', req.user.isSuperAdmin);
    console.log('User Organizations:', req.user.organizations);

    let query = supabase
      .from('key_risk_indicator')
      .select('id, kode, nama_indikator, organization_id')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('Query before filter:', query);
    
    query = buildOrganizationFilter(query, req.user);
    
    console.log('Query after filter:', query);

    const { data, error } = await query;

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    console.log('Query result count:', data?.length || 0);
    console.log('Sample data:', data?.[0]);

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        isSuperAdmin: req.user.isSuperAdmin,
        organizations: req.user.organizations
      },
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Test org filter error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test loss event filter
router.get('/loss-event', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('loss_event')
      .select('id, kode, deskripsi_kejadian, organization_id')
      .order('created_at', { ascending: false })
      .limit(5);
    
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query;

    if (error) throw error;

    res.json({
      user: {
        id: req.user.id,
        organizations: req.user.organizations
      },
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Test loss event filter error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test ews filter
router.get('/ews', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('early_warning_system')
      .select('id, kode, nama_sistem, organization_id')
      .order('created_at', { ascending: false })
      .limit(5);
    
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query;

    if (error) throw error;

    res.json({
      user: {
        id: req.user.id,
        organizations: req.user.organizations
      },
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Test ews filter error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test risk register filter
router.get('/risk-register', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('risk_inputs')
      .select('id, kode_risiko, sasaran, organization_id')
      .order('created_at', { ascending: false })
      .limit(5);
    
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query;

    if (error) throw error;

    res.json({
      user: {
        id: req.user.id,
        organizations: req.user.organizations
      },
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Test risk register filter error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;