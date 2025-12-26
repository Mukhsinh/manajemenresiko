const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
// const { generateKodeKRI } = require('../utils/codeGenerator');
// const { buildOrganizationFilter } = require('../utils/organization');

// Debug endpoint without authentication for testing - MUST BE FIRST
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Debug endpoint accessed for kri');
    
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (
          name
        ),
        master_work_units (
          name,
          code
        ),
        risk_inputs (
          kode_risiko
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
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (
          name
        ),
        master_work_units (
          name,
          code
        ),
        risk_inputs (
          kode_risiko
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('Simple endpoint - returning data:', data?.length || 0, 'items');
    res.json(data || []);
  } catch (error) {
    console.error('Simple KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public endpoint for testing (no auth required) - MUST BE THIRD
router.get('/public', async (req, res) => {
  try {
    console.log('=== KRI PUBLIC ENDPOINT ===');
    
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (
          name
        ),
        master_work_units (
          name,
          code
        ),
        risk_inputs (
          kode_risiko
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('KRI public query error:', error);
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

// Get all KRI
router.get('/', authenticateUser, async (req, res) => {
  try {
    console.log('=== KRI REQUEST ===');
    console.log('User info:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      organizations: req.user.organizations
    });
    
    const client = supabaseAdmin || supabase;
    
    let query = client
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (
          name
        ),
        master_work_units (
          name,
          code
        ),
        risk_inputs (
          kode_risiko
        )
      `)
      .order('created_at', { ascending: false });
    
    // Apply organization filter
    if (!req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
      query = buildOrganizationFilter(query, req.user);
    }

    const { data, error } = await query;

    if (error) {
      console.error('KRI query error:', error);
      throw error;
    }
    
    console.log('Query result:', {
      count: data?.length || 0,
      hasData: data && data.length > 0
    });
    console.log('=== END REQUEST ===');
    
    res.json(data || []);
  } catch (error) {
    console.error('KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    // Use supabaseAdmin to bypass RLS
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    let query = client
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (
          name
        ),
        master_work_units (
          name,
          code
        ),
        risk_inputs (
          kode_risiko
        )
      `)
      .eq('id', req.params.id);
    
    // query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query.single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'KRI tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate kode
router.get('/generate/kode', authenticateUser, async (req, res) => {
  try {
    // Simple kode generation without external dependency
    const kode = `KRI-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    res.json({ kode });
  } catch (error) {
    console.error('Generate kode error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      kode,
      nama_indikator,
      kategori_risiko_id,
      risk_input_id,
      unit_kerja_id,
      metode_pengukuran,
      target_nilai,
      nilai_aktual,
      batas_aman,
      batas_peringatan,
      batas_kritis,
      status_indikator,
      periode_pengukuran,
      tanggal_pengukuran_terakhir
    } = req.body;

    // Generate kode jika tidak ada
    const finalKode = kode || await generateKodeKRI(req.user.id);

    // Determine status based on nilai_aktual
    let finalStatus = status_indikator || 'Aman';
    if (nilai_aktual !== null && nilai_aktual !== undefined) {
      if (batas_kritis && nilai_aktual >= batas_kritis) {
        finalStatus = 'Kritis';
      } else if (batas_peringatan && nilai_aktual >= batas_peringatan) {
        finalStatus = 'Hati-hati';
      } else if (batas_aman && nilai_aktual <= batas_aman) {
        finalStatus = 'Aman';
      }
    }

    // Use supabaseAdmin to bypass RLS
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('key_risk_indicator')
      .insert({
        user_id: req.user.id,
        organization_id: req.user.organization_id,
        kode: finalKode,
        nama_indikator,
        kategori_risiko_id,
        risk_input_id,
        unit_kerja_id,
        metode_pengukuran,
        target_nilai,
        nilai_aktual,
        batas_aman,
        batas_peringatan,
        batas_kritis,
        status_indikator: finalStatus,
        periode_pengukuran,
        tanggal_pengukuran_terakhir: tanggal_pengukuran_terakhir || new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'KRI berhasil dibuat', data });
  } catch (error) {
    console.error('KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      nama_indikator,
      kategori_risiko_id,
      risk_input_id,
      unit_kerja_id,
      metode_pengukuran,
      target_nilai,
      nilai_aktual,
      batas_aman,
      batas_peringatan,
      batas_kritis,
      status_indikator,
      periode_pengukuran,
      tanggal_pengukuran_terakhir
    } = req.body;

    // Determine status based on nilai_aktual
    let finalStatus = status_indikator;
    if (nilai_aktual !== null && nilai_aktual !== undefined) {
      if (batas_kritis && nilai_aktual >= batas_kritis) {
        finalStatus = 'Kritis';
      } else if (batas_peringatan && nilai_aktual >= batas_peringatan) {
        finalStatus = 'Hati-hati';
      } else if (batas_aman && nilai_aktual <= batas_aman) {
        finalStatus = 'Aman';
      }
    }

    // Use supabaseAdmin to bypass RLS
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    let updateQuery = client
      .from('key_risk_indicator')
      .update({
        nama_indikator,
        kategori_risiko_id,
        risk_input_id,
        unit_kerja_id,
        metode_pengukuran,
        target_nilai,
        nilai_aktual,
        batas_aman,
        batas_peringatan,
        batas_kritis,
        status_indikator: finalStatus,
        periode_pengukuran,
        tanggal_pengukuran_terakhir,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id);
    
    // updateQuery = buildOrganizationFilter(updateQuery, req.user);
    const { data, error } = await updateQuery
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'KRI tidak ditemukan' });
    res.json({ message: 'KRI berhasil diupdate', data });
  } catch (error) {
    console.error('KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // Use supabaseAdmin to bypass RLS
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    let deleteQuery = client
      .from('key_risk_indicator')
      .delete()
      .eq('id', req.params.id);
    
    // deleteQuery = buildOrganizationFilter(deleteQuery, req.user);
    const { error } = await deleteQuery;

    if (error) throw error;
    res.json({ message: 'KRI berhasil dihapus' });
  } catch (error) {
    console.error('KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug route to check user organizations and KRI data
router.get('/debug', authenticateUser, async (req, res) => {
  try {
    console.log('KRI Debug - User info:', {
      id: req.user.id,
      email: req.user.email,
      organizations: req.user.organizations,
      role: req.user.role,
      isSuperAdmin: req.user.isSuperAdmin
    });

    // Use supabaseAdmin to bypass RLS
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    // Get total KRI count without filter
    const { count: totalKRI } = await client
      .from('key_risk_indicator')
      .select('*', { count: 'exact', head: true });

    // Get KRI with organization filter
    let filteredQuery = client
      .from('key_risk_indicator')
      .select('*', { count: 'exact', head: true });
    
    // filteredQuery = buildOrganizationFilter(filteredQuery, req.user);
    const { count: filteredKRI } = await filteredQuery;

    // Get sample data
    const { data: sampleData } = await client
      .from('key_risk_indicator')
      .select('id, kode, nama_indikator, organization_id')
      .limit(5);

    // Get user's organization details
    const { data: userOrgs } = await client
      .from('organizations')
      .select('*')
      .in('id', req.user.organizations || []);

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        organizations: req.user.organizations,
        role: req.user.role,
        isSuperAdmin: req.user.isSuperAdmin
      },
      data_counts: {
        total_kri: totalKRI || 0,
        filtered_kri: filteredKRI || 0
      },
      sample_data: sampleData || [],
      user_organizations: userOrgs || []
    });
  } catch (error) {
    console.error('KRI debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

