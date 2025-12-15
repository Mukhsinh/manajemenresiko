const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

// Test endpoint to check data without authentication
router.get('/data', async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    // Test basic data retrieval
    const results = {};
    
    // Test visi_misi
    const { data: visiMisi, error: visiError } = await clientToUse
      .from('visi_misi')
      .select('*')
      .limit(5);
    
    results.visi_misi = {
      count: visiMisi?.length || 0,
      data: visiMisi || [],
      error: visiError?.message || null
    };
    
    // Test rencana_strategis
    const { data: rencana, error: rencanaError } = await clientToUse
      .from('rencana_strategis')
      .select('*')
      .limit(5);
    
    results.rencana_strategis = {
      count: rencana?.length || 0,
      data: rencana || [],
      error: rencanaError?.message || null
    };
    
    // Test master_work_units
    const { data: workUnits, error: workError } = await clientToUse
      .from('master_work_units')
      .select('*')
      .limit(5);
    
    results.master_work_units = {
      count: workUnits?.length || 0,
      data: workUnits || [],
      error: workError?.message || null
    };
    
    // Test organizations
    const { data: orgs, error: orgError } = await clientToUse
      .from('organizations')
      .select('*');
    
    results.organizations = {
      count: orgs?.length || 0,
      data: orgs || [],
      error: orgError?.message || null
    };
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint with authentication
router.get('/auth-data', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    // Test basic data retrieval with user context
    const results = {};
    
    // Test visi_misi
    const { data: visiMisi, error: visiError } = await clientToUse
      .from('visi_misi')
      .select('*')
      .limit(5);
    
    results.visi_misi = {
      count: visiMisi?.length || 0,
      data: visiMisi || [],
      error: visiError?.message || null
    };
    
    // Test rencana_strategis
    const { data: rencana, error: rencanaError } = await clientToUse
      .from('rencana_strategis')
      .select('*')
      .limit(5);
    
    results.rencana_strategis = {
      count: rencana?.length || 0,
      data: rencana || [],
      error: rencanaError?.message || null
    };
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      user: {
        id: req.user.id,
        email: req.user.email,
        organizations: req.user.organizations,
        isSuperAdmin: req.user.isSuperAdmin
      },
      results
    });
    
  } catch (error) {
    console.error('Test auth endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
module.
exports = router;