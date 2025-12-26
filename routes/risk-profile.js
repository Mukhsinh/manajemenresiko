const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Debug endpoint without authentication for testing - MUST BE FIRST
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Debug endpoint accessed for risk-profile');
    
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('risk_inherent_analysis')
      .select(`
        *,
        risk_inputs (
          kode_risiko,
          sasaran,
          organization_id,
          master_work_units (
            name,
            jenis,
            kategori
          ),
          master_risk_categories (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Debug query error:', error);
      throw error;
    }

    console.log(`✅ Debug query successful, returning ${data?.length || 0} items`);
    res.json({ 
      success: true, 
      data: data || [], 
      count: data?.length || 0,
      message: 'Debug data retrieved successfully'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      data: [],
      message: 'Debug endpoint failed'
    });
  }
});

// Simple endpoint without complex auth for testing - MUST BE SECOND
router.get('/simple', async (req, res) => {
  try {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('risk_inherent_analysis')
      .select(`
        *,
        risk_inputs (
          kode_risiko,
          sasaran,
          organization_id,
          master_work_units (
            name,
            jenis,
            kategori
          ),
          master_risk_categories (
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('Simple endpoint - returning data:', data?.length || 0, 'items');
    res.json(data || []);
  } catch (error) {
    console.error('Simple risk profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public endpoint for testing (no auth required) - MUST BE THIRD
router.get('/public', async (req, res) => {
  try {
    console.log('=== RISK PROFILE PUBLIC ENDPOINT ===');
    
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('risk_inherent_analysis')
      .select(`
        *,
        risk_inputs (
          kode_risiko,
          sasaran,
          organization_id,
          master_work_units (
            name,
            jenis,
            kategori
          ),
          master_risk_categories (
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Risk profile public query error:', error);
      throw error;
    }

    console.log('Public query result:', {
      count: data?.length || 0,
      hasData: data && data.length > 0
    });

    res.json(data || []);
  } catch (error) {
    console.error('Public endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all risk profile data (inherent risk analysis)
router.get('/', authenticateUser, async (req, res) => {
  try {
    console.log('=== RISK PROFILE REQUEST ===');
    console.log('User info:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      organizations: req.user.organizations
    });

    const client = supabaseAdmin || supabase;
    
    let query = client
      .from('risk_inherent_analysis')
      .select(`
        *,
        risk_inputs (
          kode_risiko,
          sasaran,
          organization_id,
          master_work_units (
            name,
            jenis,
            kategori
          ),
          master_risk_categories (
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Apply organization filter
    const isAdminOrSuper = req.user.isSuperAdmin || 
                          req.user.role === 'superadmin' || 
                          req.user.role === 'admin';

    if (isAdminOrSuper) {
      console.log('Admin/Super admin - showing all data');
      // Admin can see all data, no filter needed
    } else {
      // Regular users - filter by organization_id through risk_inputs
      if (req.user.organizations && req.user.organizations.length > 0) {
        console.log('Regular user - filtering by organization_id:', req.user.organizations);
        // This is a complex filter through relationship, we'll handle it in post-processing
      } else {
        console.log('Regular user - no organizations, showing all data');
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Risk profile query error:', error);
      throw error;
    }

    // Post-process organization filtering for non-admin users
    let filteredData = data || [];
    if (!isAdminOrSuper && req.user.organizations && req.user.organizations.length > 0) {
      filteredData = filteredData.filter(item => 
        item.risk_inputs && 
        item.risk_inputs.organization_id && 
        req.user.organizations.includes(item.risk_inputs.organization_id)
      );
    }

    console.log('Query result:', {
      count: filteredData.length,
      hasData: filteredData.length > 0,
      firstItem: filteredData.length > 0 ? {
        id: filteredData[0].id,
        risk_level: filteredData[0].risk_level,
        organization_id: filteredData[0].risk_inputs?.organization_id
      } : null
    });
    console.log('=== END REQUEST ===');

    res.json(filteredData);
  } catch (error) {
    console.error('Risk profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('risk_inherent_analysis')
      .select(`
        *,
        risk_inputs (
          kode_risiko,
          sasaran,
          organization_id,
          master_work_units (
            name,
            jenis,
            kategori
          ),
          master_risk_categories (
            name
          )
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Risk profile tidak ditemukan' });
    
    // Check organization access
    if (!req.user.isSuperAdmin && data.risk_inputs?.organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(data.risk_inputs.organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
      }
    }
    
    res.json(data);
  } catch (error) {
    console.error('Risk profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;