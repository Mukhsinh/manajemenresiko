const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Debug endpoint without authentication for testing - MUST BE FIRST
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Debug endpoint accessed for indikator-kinerja-utama');
    
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('indikator_kinerja_utama')
      .select(`
        *,
        rencana_strategis(id, kode, nama_rencana),
        sasaran_strategi(id, sasaran, perspektif)
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
    const clientToUse = supabaseAdmin || supabase;
    
    const { data, error } = await clientToUse
      .from('indikator_kinerja_utama')
      .select('*, rencana_strategis(nama_rencana, kode, organization_id), sasaran_strategi(sasaran, perspektif)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('Simple endpoint - returning data:', data?.length || 0, 'items');
    res.json(data || []);
  } catch (error) {
    console.error('Simple indikator kinerja utama error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public endpoint for testing (no auth required) - MUST BE THIRD
router.get('/public', async (req, res) => {
  try {
    console.log('=== INDIKATOR KINERJA UTAMA PUBLIC ENDPOINT ===');
    
    const clientToUse = supabaseAdmin || supabase;
    
    // Use the same query structure as the main endpoint
    let query = clientToUse
      .from('indikator_kinerja_utama')
      .select('*, rencana_strategis(nama_rencana, kode, organization_id), sasaran_strategi(sasaran, perspektif)')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Indikator kinerja utama public query error:', error);
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

// Get all indikator kinerja utama
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, sasaran_strategi_id, tahun } = req.query;
    
    console.log('=== INDIKATOR KINERJA UTAMA REQUEST ===');
    console.log('User info:', {
      id: req.user.id,
      email: req.user.email,
      isSuperAdmin: req.user.isSuperAdmin,
      role: req.user.role,
      organizations: req.user.organizations
    });
    console.log('Query params:', { rencana_strategis_id, sasaran_strategi_id, tahun });

    // Use supabaseAdmin for better reliability
    const clientToUse = supabaseAdmin || supabase;

    let query = clientToUse
      .from('indikator_kinerja_utama')
      .select('*, rencana_strategis(nama_rencana, kode, organization_id), sasaran_strategi(sasaran, perspektif)')
      .order('created_at', { ascending: false });

    // Apply organization filter through rencana_strategis relationship
    if (!req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
      // Get accessible rencana_strategis IDs first
      let rsQuery = clientToUse
        .from('rencana_strategis')
        .select('id');
      rsQuery = buildOrganizationFilter(rsQuery, req.user);
      const { data: accessibleRS } = await rsQuery;
      const accessibleRSIds = (accessibleRS || []).map(rs => rs.id);
      
      if (accessibleRSIds.length > 0) {
        query = query.in('rencana_strategis_id', accessibleRSIds);
      } else {
        // No accessible rencana strategis, return empty
        return res.json([]);
      }
    }

    // Apply additional filters
    if (rencana_strategis_id) {
      query = query.eq('rencana_strategis_id', rencana_strategis_id);
      console.log('Applied rencana_strategis filter:', rencana_strategis_id);
    }
    if (sasaran_strategi_id) {
      query = query.eq('sasaran_strategi_id', sasaran_strategi_id);
      console.log('Applied sasaran_strategi filter:', sasaran_strategi_id);
    }
    if (tahun) {
      query = query.or(`baseline_tahun.eq.${tahun},target_tahun.eq.${tahun}`);
      console.log('Applied tahun filter:', tahun);
    }

    console.log('Executing query...');
    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    console.log('Query result:', {
      count: data?.length || 0,
      hasData: data && data.length > 0,
      firstItem: data && data.length > 0 ? {
        id: data[0].id,
        indikator: data[0].indikator,
        organization_id: data[0].organization_id,
        rencana_strategis: data[0].rencana_strategis?.nama_rencana
      } : null
    });
    console.log('=== END REQUEST ===');
    
    res.json(data || []);
  } catch (error) {
    console.error('Indikator kinerja utama error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    console.log('=== GET BY ID REQUEST ===');
    console.log('ID:', req.params.id);
    console.log('User:', req.user.id);

    // Use supabaseAdmin for better reliability
    const clientToUse = supabaseAdmin || supabase;

    const { data, error } = await clientToUse
      .from('indikator_kinerja_utama')
      .select(`
        *,
        rencana_strategis!inner(nama_rencana, kode, organization_id),
        sasaran_strategi(sasaran, perspektif)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      console.error('Query error:', error);
      throw error;
    }
    
    if (!data) {
      console.log('No data found for ID:', req.params.id);
      return res.status(404).json({ error: 'Data tidak ditemukan' });
    }
    
    console.log('Found data:', {
      id: data.id,
      indikator: data.indikator,
      rencana_strategis: data.rencana_strategis?.nama_rencana
    });

    // Check organization access through rencana_strategis
    if (!req.user.isSuperAdmin && data.rencana_strategis?.organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(data.rencana_strategis.organization_id)) {
        console.log('Access denied - organization mismatch');
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
      }
    }

    console.log('=== END GET BY ID ===');
    res.json(data);
  } catch (error) {
    console.error('Get by ID error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      rencana_strategis_id,
      sasaran_strategi_id,
      indikator,
      baseline_tahun,
      baseline_nilai,
      target_tahun,
      target_nilai,
      initiatif_strategi,
      pic
    } = req.body;

    if (!rencana_strategis_id || !indikator) {
      return res.status(400).json({ error: 'Rencana strategis dan indikator wajib diisi' });
    }

    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('indikator_kinerja_utama')
      .insert({
        user_id: req.user.id,
        rencana_strategis_id,
        sasaran_strategi_id: sasaran_strategi_id || null,
        indikator,
        baseline_tahun: baseline_tahun ? parseInt(baseline_tahun) : null,
        baseline_nilai: baseline_nilai ? parseFloat(baseline_nilai) : null,
        target_tahun: target_tahun ? parseInt(target_tahun) : null,
        target_nilai: target_nilai ? parseFloat(target_nilai) : null,
        initiatif_strategi: initiatif_strategi || null,
        pic: pic || null
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Indikator kinerja utama berhasil ditambahkan', data });
  } catch (error) {
    console.error('Indikator kinerja utama error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      rencana_strategis_id,
      sasaran_strategi_id,
      indikator,
      baseline_tahun,
      baseline_nilai,
      target_tahun,
      target_nilai,
      initiatif_strategi,
      pic
    } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (rencana_strategis_id !== undefined) updateData.rencana_strategis_id = rencana_strategis_id;
    if (sasaran_strategi_id !== undefined) updateData.sasaran_strategi_id = sasaran_strategi_id || null;
    if (indikator !== undefined) updateData.indikator = indikator;
    if (baseline_tahun !== undefined) updateData.baseline_tahun = baseline_tahun ? parseInt(baseline_tahun) : null;
    if (baseline_nilai !== undefined) updateData.baseline_nilai = baseline_nilai ? parseFloat(baseline_nilai) : null;
    if (target_tahun !== undefined) updateData.target_tahun = target_tahun ? parseInt(target_tahun) : null;
    if (target_nilai !== undefined) updateData.target_nilai = target_nilai ? parseFloat(target_nilai) : null;
    if (initiatif_strategi !== undefined) updateData.initiatif_strategi = initiatif_strategi || null;
    if (pic !== undefined) updateData.pic = pic || null;

    const clientToUse = supabaseAdmin || supabase;
    
    // First check access through rencana_strategis
    const { data: existing, error: checkError } = await clientToUse
      .from('indikator_kinerja_utama')
      .select('rencana_strategis(organization_id)')
      .eq('id', req.params.id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Data tidak ditemukan' });
    }

    // Check organization access through rencana_strategis
    if (!req.user.isSuperAdmin && existing.rencana_strategis?.organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(existing.rencana_strategis.organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
      }
    }

    const { data, error } = await clientToUse
      .from('indikator_kinerja_utama')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Indikator kinerja utama berhasil diupdate', data });
  } catch (error) {
    console.error('Indikator kinerja utama error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    // First check access through rencana_strategis
    const { data: existing, error: checkError } = await clientToUse
      .from('indikator_kinerja_utama')
      .select('rencana_strategis(organization_id)')
      .eq('id', req.params.id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Data tidak ditemukan' });
    }

    // Check organization access through rencana_strategis
    if (!req.user.isSuperAdmin && existing.rencana_strategis?.organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(existing.rencana_strategis.organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
      }
    }

    const { error } = await clientToUse
      .from('indikator_kinerja_utama')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Indikator kinerja utama berhasil dihapus' });
  } catch (error) {
    console.error('Indikator kinerja utama error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

