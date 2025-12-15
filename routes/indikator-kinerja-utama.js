const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Get all indikator kinerja utama
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, sasaran_strategi_id } = req.query;
    
    let query = supabase
      .from('indikator_kinerja_utama')
      .select('*, rencana_strategis(nama_rencana, organization_id), sasaran_strategi(sasaran, perspektif)')
      .order('created_at', { ascending: false });

    // Apply organization filter through rencana_strategis relationship
    if (!req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
      // Get accessible rencana_strategis IDs first
      let rsQuery = supabase
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

    if (rencana_strategis_id) {
      query = query.eq('rencana_strategis_id', rencana_strategis_id);
    }
    if (sasaran_strategi_id) {
      query = query.eq('sasaran_strategi_id', sasaran_strategi_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Indikator kinerja utama error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('indikator_kinerja_utama')
      .select('*, rencana_strategis(nama_rencana, organization_id), sasaran_strategi(sasaran, perspektif)')
      .eq('indikator_kinerja_utama.id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    
    // Check organization access through rencana_strategis
    if (!req.user.isSuperAdmin && data.rencana_strategis?.organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(data.rencana_strategis.organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
      }
    }

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('Indikator kinerja utama error:', error);
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

