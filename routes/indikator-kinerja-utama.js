const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Public endpoint for testing (no auth required) - MUST BE FIRST
router.get('/public', async (req, res) => {
  try {
    console.log('=== INDIKATOR KINERJA UTAMA PUBLIC ENDPOINT ===');
    
    // Import supabaseAdmin directly
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    // Use the same query structure as the main endpoint
    let query = client
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

// Debug endpoint - temporary (no auth required) - MUST BE SECOND
router.get('/debug', async (req, res) => {
  try {
    console.log('=== INDIKATOR KINERJA UTAMA DEBUG ENDPOINT ===');
    
    // Import supabaseAdmin directly
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    // Use the same query structure as the main endpoint
    let query = client
      .from('indikator_kinerja_utama')
      .select('*, rencana_strategis(nama_rencana, kode, organization_id), sasaran_strategi(sasaran, perspektif)')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Indikator kinerja utama debug query error:', error);
      throw error;
    }

    console.log('Debug query result:', {
      count: data?.length || 0,
      hasData: data && data.length > 0,
      firstItem: data && data.length > 0 ? {
        id: data[0].id,
        indikator: data[0].indikator,
        organization_id: data[0].organization_id
      } : null
    });

    res.json({
      success: true,
      count: data?.length || 0,
      data: data || [],
      message: 'Indikator kinerja utama debug data retrieved successfully',
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
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;

    let query = client
      .from('indikator_kinerja_utama')
      .select('*, rencana_strategis(nama_rencana, kode, organization_id), sasaran_strategi(sasaran, perspektif)')
      .order('created_at', { ascending: false });

    // NEW APPROACH: Filter by organization_id only, ignore user_id
    // This allows showing all data within the organization regardless of who created it
    const isAdminOrSuper = req.user.isSuperAdmin || 
                          req.user.role === 'superadmin' || 
                          req.user.role === 'admin';

    if (isAdminOrSuper) {
      console.log('Admin/Super admin - showing all data (no filter)');
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
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;

    const { data, error } = await client
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

    const { data, error } = await supabase
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

    // First check access through rencana_strategis
    const { data: existing, error: checkError } = await supabase
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

    const { data, error } = await supabase
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
    // First check access through rencana_strategis
    const { data: existing, error: checkError } = await supabase
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

    const { error } = await supabase
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

