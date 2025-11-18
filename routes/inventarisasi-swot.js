const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Get all inventarisasi SWOT
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, unit_kerja_id, kategori, tahun } = req.query;
    
    let query = supabase
      .from('swot_inventarisasi')
      .select('*, master_work_units(name, code), rencana_strategis(nama_rencana)');
    query = buildOrganizationFilter(query, req.user);
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

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Inventarisasi SWOT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('swot_inventarisasi')
      .select('*, master_work_units(name, code), rencana_strategis(nama_rencana)')
      .eq('id', req.params.id);
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query.single();

    if (error) throw error;
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

    // Get organization_id from rencana_strategis or unit_kerja if not provided
    let organization_id = req.body.organization_id;
    if (!organization_id && rencana_strategis_id) {
      const { data: rencana } = await supabase
        .from('rencana_strategis')
        .select('organization_id')
        .eq('id', rencana_strategis_id)
        .single();
      organization_id = rencana?.organization_id;
    }
    if (!organization_id && unit_kerja_id) {
      const { data: unit } = await supabase
        .from('master_work_units')
        .select('organization_id')
        .eq('id', unit_kerja_id)
        .single();
      organization_id = unit?.organization_id;
    }

    // Use first organization if not specified and user is not superadmin
    if (!organization_id && !req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
      organization_id = req.user.organizations[0];
    }

    // Validate organization access if not superadmin
    if (!req.user.isSuperAdmin && organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke organisasi ini' });
      }
    }

    const { data, error } = await supabase
      .from('swot_inventarisasi')
      .insert({
        user_id: req.user.id,
        rencana_strategis_id: rencana_strategis_id || null,
        unit_kerja_id: unit_kerja_id || null,
        kategori,
        deskripsi,
        tahun: parseInt(tahun),
        organization_id
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Data berhasil ditambahkan', data });
  } catch (error) {
    console.error('Inventarisasi SWOT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    // First check if user has access
    const { data: existing, error: checkError } = await supabase
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

    let query = supabase
      .from('swot_inventarisasi')
      .update({
        rencana_strategis_id: rencana_strategis_id || null,
        unit_kerja_id: unit_kerja_id || null,
        kategori,
        deskripsi,
        tahun: tahun ? parseInt(tahun) : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id);
    query = buildOrganizationFilter(query, req.user);
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
    // First check if user has access
    const { data: existing, error: checkError } = await supabase
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

    let query = supabase
      .from('swot_inventarisasi')
      .delete()
      .eq('id', req.params.id);
    query = buildOrganizationFilter(query, req.user);
    const { error } = await query;

    if (error) throw error;
    res.json({ message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Inventarisasi SWOT error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

