const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Get all inventarisasi SWOT
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, unit_kerja_id, kategori, tahun } = req.query;
    
    // Use supabaseAdmin to bypass RLS and avoid ambiguous user_id error
    const clientToUse = supabaseAdmin || supabase;
    let query = clientToUse
      .from('swot_inventarisasi')
      .select(`
        id,
        user_id,
        rencana_strategis_id,
        unit_kerja_id,
        kategori,
        deskripsi,
        tahun,
        organization_id,
        created_at,
        updated_at,
        master_work_units(
          id,
          name,
          code
        ),
        rencana_strategis(
          id,
          kode,
          nama_rencana
        )
      `);
    query = buildOrganizationFilter(query, req.user, 'organization_id');
    query = query.order('tahun', { ascending: false })
      .order('created_at', { ascending: false });

    if (rencana_strategis_id) {
      query = query.eq('rencana_strategis_id', rencana_strategis_id);
    }
    if (unit_kerja_id) {
      query = query.eq('unit_kerja_id', unit_kerja_id);
    }
    if (kategori) {
      query = query.eq('kategori', kategori);
    }
    if (tahun) {
      query = query.eq('tahun', parseInt(tahun));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Inventarisasi SWOT query error:', error);
      throw error;
    }
    
    console.log(`Inventarisasi SWOT: Returning ${(data || []).length} records`);
    res.json(data || []);
  } catch (error) {
    console.error('Inventarisasi SWOT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    // Use supabaseAdmin to bypass RLS and avoid ambiguous user_id error
    const clientToUse = supabaseAdmin || supabase;
    let query = clientToUse
      .from('swot_inventarisasi')
      .select(`
        id,
        user_id,
        rencana_strategis_id,
        unit_kerja_id,
        kategori,
        deskripsi,
        tahun,
        organization_id,
        created_at,
        updated_at,
        master_work_units(
          id,
          name,
          code
        ),
        rencana_strategis(
          id,
          kode,
          nama_rencana
        )
      `)
      .eq('id', req.params.id);
    query = buildOrganizationFilter(query, req.user, 'organization_id');
    const { data, error } = await query.single();

    if (error) {
      console.error('Inventarisasi SWOT get by ID error:', error);
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('Inventarisasi SWOT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      rencana_strategis_id,
      unit_kerja_id,
      kategori,
      deskripsi,
      tahun
    } = req.body;

    if (!kategori || !deskripsi || !tahun) {
      return res.status(400).json({ error: 'Kategori, deskripsi, dan tahun wajib diisi' });
    }

    // Normalize empty strings to null for foreign keys
    const normalizedRencanaStrategisId = rencana_strategis_id && rencana_strategis_id.trim() !== '' ? rencana_strategis_id : null;
    const normalizedUnitKerjaId = unit_kerja_id && unit_kerja_id.trim() !== '' ? unit_kerja_id : null;

    console.log('Creating SWOT with:', { 
      rencana_strategis_id: normalizedRencanaStrategisId, 
      unit_kerja_id: normalizedUnitKerjaId,
      kategori,
      tahun 
    });

    // Get organization_id from rencana_strategis or unit_kerja if not provided
    let organization_id = req.body.organization_id;
    if (!organization_id && normalizedRencanaStrategisId) {
      // Use supabaseAdmin to bypass RLS and avoid ambiguous user_id error
      const clientToUse = supabaseAdmin || supabase;
      const { data: rencana, error: rencanaError } = await clientToUse
        .from('rencana_strategis')
        .select('organization_id')
        .eq('id', normalizedRencanaStrategisId)
        .single();
      
      if (rencanaError) {
        console.error('Error fetching rencana_strategis:', rencanaError);
      } else {
        organization_id = rencana?.organization_id;
        console.log('Organization from rencana_strategis:', organization_id);
      }
    }
    if (!organization_id && normalizedUnitKerjaId) {
      // Use supabaseAdmin to bypass RLS and avoid ambiguous user_id error
      const clientToUse = supabaseAdmin || supabase;
      const { data: unit, error: unitError } = await clientToUse
        .from('master_work_units')
        .select('organization_id')
        .eq('id', normalizedUnitKerjaId)
        .single();
      
      if (unitError) {
        console.error('Error fetching master_work_units:', unitError);
      } else {
        organization_id = unit?.organization_id;
        console.log('Organization from unit_kerja:', organization_id);
      }
    }

    // Use first organization if not specified and user is not superadmin
    if (!organization_id && !req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
      organization_id = req.user.organizations[0];
      console.log('Using user first organization:', organization_id);
    }

    // Validate organization access if not superadmin
    if (!req.user.isSuperAdmin && organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke organisasi ini' });
      }
    }

    const insertData = {
      user_id: req.user.id,
      rencana_strategis_id: normalizedRencanaStrategisId,
      unit_kerja_id: normalizedUnitKerjaId,
      kategori,
      deskripsi,
      tahun: parseInt(tahun),
      organization_id
    };

    console.log('Inserting data:', insertData);

    // Use supabaseAdmin to bypass RLS and avoid ambiguous user_id error during INSERT
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('swot_inventarisasi')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }
    
    console.log('SWOT inventarisasi created successfully:', data.id);
    res.json({ message: 'Data berhasil ditambahkan', data });
  } catch (error) {
    console.error('Inventarisasi SWOT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    // Use supabaseAdmin to bypass RLS and avoid ambiguous user_id error
    const clientToUse = supabaseAdmin || supabase;
    
    // First check if user has access
    const { data: existing, error: checkError } = await clientToUse
      .from('swot_inventarisasi')
      .select('organization_id')
      .eq('id', req.params.id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Data tidak ditemukan' });
    }

    // Check organization access if not superadmin
    if (!req.user.isSuperAdmin && existing.organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(existing.organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
      }
    }

    const {
      rencana_strategis_id,
      unit_kerja_id,
      kategori,
      deskripsi,
      tahun
    } = req.body;

    // Normalize empty strings to null for foreign keys
    const normalizedRencanaStrategisId = rencana_strategis_id && rencana_strategis_id.trim() !== '' ? rencana_strategis_id : null;
    const normalizedUnitKerjaId = unit_kerja_id && unit_kerja_id.trim() !== '' ? unit_kerja_id : null;

    let query = clientToUse
      .from('swot_inventarisasi')
      .update({
        rencana_strategis_id: normalizedRencanaStrategisId,
        unit_kerja_id: normalizedUnitKerjaId,
        kategori,
        deskripsi,
        tahun: tahun ? parseInt(tahun) : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id);
    query = buildOrganizationFilter(query, req.user, 'organization_id');
    const { data, error } = await query.select().single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Data berhasil diupdate', data });
  } catch (error) {
    console.error('Inventarisasi SWOT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // Use supabaseAdmin to bypass RLS and avoid ambiguous user_id error
    const clientToUse = supabaseAdmin || supabase;
    
    // First check if user has access
    const { data: existing, error: checkError } = await clientToUse
      .from('swot_inventarisasi')
      .select('organization_id')
      .eq('id', req.params.id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Data tidak ditemukan' });
    }

    // Check organization access if not superadmin
    if (!req.user.isSuperAdmin && existing.organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(existing.organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
      }
    }

    let query = clientToUse
      .from('swot_inventarisasi')
      .delete()
      .eq('id', req.params.id);
    query = buildOrganizationFilter(query, req.user, 'organization_id');
    const { error } = await query;

    if (error) throw error;
    res.json({ message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Inventarisasi SWOT error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

