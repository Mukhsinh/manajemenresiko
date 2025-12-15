const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Get all sasaran strategi
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, tows_strategi_id, perspektif } = req.query;
    
    const clientToUse = supabaseAdmin || supabase;
    let query = clientToUse
      .from('sasaran_strategi')
      .select('*, rencana_strategis(id, kode, nama_rencana, organization_id), swot_tows_strategi(tipe_strategi, strategi)')
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

    if (rencana_strategis_id) {
      query = query.eq('rencana_strategis_id', rencana_strategis_id);
    }
    if (tows_strategi_id) {
      query = query.eq('tows_strategi_id', tows_strategi_id);
    }
    if (perspektif) {
      query = query.eq('perspektif', perspektif);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Sasaran strategi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('sasaran_strategi')
      .select('*, rencana_strategis(id, kode, nama_rencana, organization_id), swot_tows_strategi(tipe_strategi, strategi)')
      .eq('sasaran_strategi.id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    
    // Check organization access through rencana_strategis
    if (!req.user.isSuperAdmin && data.rencana_strategis?.organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(data.rencana_strategis.organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
      }
    }
    
    res.json(data);
  } catch (error) {
    console.error('Sasaran strategi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      rencana_strategis_id,
      tows_strategi_id,
      sasaran,
      perspektif
    } = req.body;

    if (!rencana_strategis_id || !sasaran || !perspektif) {
      return res.status(400).json({ error: 'Rencana strategis, sasaran, dan perspektif wajib diisi' });
    }

    if (!['ES', 'IBP', 'LG', 'Fin'].includes(perspektif)) {
      return res.status(400).json({ error: 'Perspektif harus ES, IBP, LG, atau Fin' });
    }

    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('sasaran_strategi')
      .insert({
        user_id: req.user.id,
        rencana_strategis_id,
        tows_strategi_id: tows_strategi_id || null,
        sasaran,
        perspektif
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Sasaran strategi berhasil ditambahkan', data });
  } catch (error) {
    console.error('Sasaran strategi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      rencana_strategis_id,
      tows_strategi_id,
      sasaran,
      perspektif
    } = req.body;

    if (perspektif && !['ES', 'IBP', 'LG', 'Fin'].includes(perspektif)) {
      return res.status(400).json({ error: 'Perspektif harus ES, IBP, LG, atau Fin' });
    }

    const clientToUse = supabaseAdmin || supabase;
    
    // First check access through rencana_strategis
    const { data: existing, error: checkError } = await clientToUse
      .from('sasaran_strategi')
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

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (rencana_strategis_id !== undefined) updateData.rencana_strategis_id = rencana_strategis_id;
    if (tows_strategi_id !== undefined) updateData.tows_strategi_id = tows_strategi_id || null;
    if (sasaran !== undefined) updateData.sasaran = sasaran;
    if (perspektif !== undefined) updateData.perspektif = perspektif;

    const { data, error } = await clientToUse
      .from('sasaran_strategi')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Sasaran strategi berhasil diupdate', data });
  } catch (error) {
    console.error('Sasaran strategi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    // First check access through rencana_strategis
    const { data: existing, error: checkError } = await clientToUse
      .from('sasaran_strategi')
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
      .from('sasaran_strategi')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Sasaran strategi berhasil dihapus' });
  } catch (error) {
    console.error('Sasaran strategi error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

