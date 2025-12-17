const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Test endpoint - no auth required for testing
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
    const { data, error } = await supabase
      .from('monitoring_evaluasi_risiko')
      .select(`
        *,
        risk_inputs (
          kode_risiko,
          sasaran
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Monitoring Evaluasi tidak ditemukan' });
    res.json(data);
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

    const { data, error } = await supabase
      .from('monitoring_evaluasi_risiko')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
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
    const { error } = await supabase
      .from('monitoring_evaluasi_risiko')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Monitoring Evaluasi berhasil dihapus' });
  } catch (error) {
    console.error('Monitoring Evaluasi error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

