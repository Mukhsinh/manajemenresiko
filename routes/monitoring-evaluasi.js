const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Debug endpoint without authentication for testing - MUST BE FIRST
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Debug endpoint accessed for monitoring-evaluasi');
    
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('monitoring_evaluasi_risiko')
      .select(`
        *,
        risk_inputs (
          kode_risiko,
          sasaran,
          organization_id
        )
      `)
      .order('tanggal_monitoring', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Debug query error:', error);
      throw error;
    }

    console.log('Debug query result:', {
      count: data?.length || 0,
      hasData: data && data.length > 0,
      firstItem: data && data.length > 0 ? {
        id: data[0].id,
        tanggal_monitoring: data[0].tanggal_monitoring,
        organization_id: data[0].organization_id
      } : null
    });

    res.json({
      success: true,
      count: data?.length || 0,
      data: data || [],
      message: 'Monitoring evaluasi debug data retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple endpoint without complex auth for testing - MUST BE SECOND
router.get('/simple', async (req, res) => {
  try {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('monitoring_evaluasi_risiko')
      .select(`
        *,
        risk_inputs (
          kode_risiko,
          sasaran,
          organization_id
        )
      `)
      .order('tanggal_monitoring', { ascending: false });

    if (error) throw error;
    
    console.log('Simple endpoint - returning data:', data?.length || 0, 'items');
    res.json(data || []);
  } catch (error) {
    console.error('Simple monitoring evaluasi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint - no auth required for testing - MUST BE THIRD
router.get('/test', async (req, res) => {
  try {
    console.log('=== MONITORING EVALUASI TEST ENDPOINT ===');
    
    // Use admin client to bypass RLS
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('monitoring_evaluasi_risiko')
      .select(`
        *,
        risk_inputs (
          kode_risiko,
          sasaran,
          organization_id
        )
      `)
      .order('tanggal_monitoring', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Test query error:', error);
      throw error;
    }
    
    console.log('Test query success:', {
      count: data?.length || 0,
      hasData: data && data.length > 0,
      sampleData: data && data.length > 0 ? {
        id: data[0].id,
        tanggal_monitoring: data[0].tanggal_monitoring,
        status_risiko: data[0].status_risiko,
        organization_id: data[0].organization_id
      } : null
    });

    res.json(data || []);
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all monitoring evaluasi
router.get('/', authenticateUser, async (req, res) => {
  try {
    console.log('=== MONITORING EVALUASI REQUEST ===');
    console.log('User info:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      organizations: req.user.organizations
    });

    // Use admin client to bypass RLS issues
    const client = supabaseAdmin || supabase;
    
    let query = client
      .from('monitoring_evaluasi_risiko')
      .select(`
        *,
        risk_inputs (
          kode_risiko,
          sasaran,
          organization_id
        )
      `)
      .order('tanggal_monitoring', { ascending: false });

    // NEW APPROACH: Filter by organization_id only, ignore user_id
    const isAdminOrSuper = req.user.isSuperAdmin || 
                          req.user.role === 'superadmin' || 
                          req.user.role === 'admin';

    if (isAdminOrSuper) {
      console.log('Admin/Super admin - showing all data');
      // Admin can see all data, no filter needed
    } else {
      // Regular users - filter by organization_id instead of user_id
      if (req.user.organizations && req.user.organizations.length > 0) {
        console.log('Regular user - filtering by organization_id:', req.user.organizations);
        query = query.in('organization_id', req.user.organizations);
      } else {
        console.log('Regular user - no organizations, showing all data');
        // If no organization info, show all data (fallback)
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Monitoring evaluasi query error:', error);
      throw error;
    }

    console.log('Query result:', {
      count: data?.length || 0,
      hasData: data && data.length > 0,
      firstItem: data && data.length > 0 ? {
        id: data[0].id,
        tanggal_monitoring: data[0].tanggal_monitoring,
        organization_id: data[0].organization_id
      } : null
    });
    console.log('=== END REQUEST ===');

    res.json(data || []);
  } catch (error) {
    console.error('Monitoring Evaluasi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    // Use admin client to bypass RLS issues (consistent with other endpoints)
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('monitoring_evaluasi_risiko')
      .select(`
        *,
        risk_inputs (
          kode_risiko,
          sasaran
        )
      `)
      .eq('id', req.params.id);
    // Removed .eq('user_id', req.user.id) - causes "Cannot coerce to single JSON object" error
    // when user_id doesn't match (data created by different users)

    if (error) throw error;
    
    // Handle case where no data found or multiple results
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Monitoring Evaluasi tidak ditemukan' });
    }
    
    // Return first result (should be unique by ID)
    res.json(data[0]);
  } catch (error) {
    console.error('Monitoring Evaluasi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      risk_input_id,
      tanggal_monitoring,
      status_risiko,
      tingkat_probabilitas,
      tingkat_dampak,
      nilai_risiko,
      tindakan_mitigasi,
      progress_mitigasi,
      evaluasi,
      status
    } = req.body;

    const { data, error } = await supabase
      .from('monitoring_evaluasi_risiko')
      .insert({
        user_id: req.user.id,
        risk_input_id,
        tanggal_monitoring: tanggal_monitoring || new Date().toISOString().split('T')[0],
        status_risiko,
        tingkat_probabilitas,
        tingkat_dampak,
        nilai_risiko: nilai_risiko || (tingkat_probabilitas * tingkat_dampak),
        tindakan_mitigasi,
        progress_mitigasi: progress_mitigasi || 0,
        evaluasi,
        status: status || 'Aktif'
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Monitoring Evaluasi berhasil dibuat', data });
  } catch (error) {
    console.error('Monitoring Evaluasi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      tanggal_monitoring,
      status_risiko,
      tingkat_probabilitas,
      tingkat_dampak,
      nilai_risiko,
      tindakan_mitigasi,
      progress_mitigasi,
      evaluasi,
      status
    } = req.body;

    const updateData = {
      tanggal_monitoring,
      status_risiko,
      tingkat_probabilitas,
      tingkat_dampak,
      nilai_risiko: nilai_risiko || (tingkat_probabilitas * tingkat_dampak),
      tindakan_mitigasi,
      progress_mitigasi,
      evaluasi,
      status,
      updated_at: new Date().toISOString()
    };

    // Use admin client to bypass RLS issues
    const client = supabaseAdmin || supabase;

    const { data, error } = await client
      .from('monitoring_evaluasi_risiko')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Monitoring Evaluasi tidak ditemukan' });
    res.json({ message: 'Monitoring Evaluasi berhasil diupdate', data });
  } catch (error) {
    console.error('Monitoring Evaluasi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // Use admin client to bypass RLS issues
    const client = supabaseAdmin || supabase;

    const { error } = await client
      .from('monitoring_evaluasi_risiko')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Monitoring Evaluasi berhasil dihapus' });
  } catch (error) {
    console.error('Monitoring Evaluasi error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

