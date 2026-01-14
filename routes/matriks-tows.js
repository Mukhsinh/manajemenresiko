const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Get all TOWS strategi
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, tipe_strategi, tahun } = req.query;
    
    // Use supabaseAdmin to bypass RLS
    const clientToUse = supabaseAdmin || supabase;
    let query = clientToUse
      .from('swot_tows_strategi')
      .select('*, rencana_strategis(id, kode, nama_rencana, organization_id)')
      .order('tahun', { ascending: false })
      .order('tipe_strategi', { ascending: true })
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
    if (tipe_strategi) {
      query = query.eq('tipe_strategi', tipe_strategi);
    }
    if (tahun) {
      query = query.eq('tahun', parseInt(tahun));
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Matriks TOWS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    // Use supabaseAdmin to bypass RLS
    const clientToUse = supabaseAdmin || supabase;
    
    // First get the main record
    const { data, error } = await clientToUse
      .from('swot_tows_strategi')
      .select('id, user_id, rencana_strategis_id, tahun, tipe_strategi, strategi, created_at, updated_at')
      .eq('id', req.params.id)
      .single();

    if (error) {
      console.error('Error fetching swot_tows_strategi:', error);
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    
    // If there's a rencana_strategis_id, fetch the related data separately
    let rencanaStrategis = null;
    if (data.rencana_strategis_id) {
      const { data: rsData, error: rsError } = await clientToUse
        .from('rencana_strategis')
        .select('id, kode, nama_rencana, organization_id')
        .eq('id', data.rencana_strategis_id)
        .single();
      
      if (!rsError && rsData) {
        rencanaStrategis = rsData;
        
        // Check organization access through rencana_strategis
        if (!req.user.isSuperAdmin && rsData.organization_id) {
          if (!req.user.organizations || !req.user.organizations.includes(rsData.organization_id)) {
            return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
          }
        }
      }
    }
    
    // Return combined data
    res.json({
      ...data,
      rencana_strategis: rencanaStrategis
    });
  } catch (error) {
    console.error('Matriks TOWS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      rencana_strategis_id,
      tahun,
      tipe_strategi,
      strategi
    } = req.body;

    if (!tipe_strategi || !strategi || !tahun) {
      return res.status(400).json({ error: 'Tipe strategi, strategi, dan tahun wajib diisi' });
    }

    if (!['SO', 'WO', 'ST', 'WT'].includes(tipe_strategi)) {
      return res.status(400).json({ error: 'Tipe strategi harus SO, WO, ST, atau WT' });
    }

    // Use supabaseAdmin to bypass RLS and avoid policy violation
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('swot_tows_strategi')
      .insert({
        user_id: req.user.id,
        rencana_strategis_id: rencana_strategis_id || null,
        tahun: parseInt(tahun),
        tipe_strategi,
        strategi
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Strategi berhasil ditambahkan', data });
  } catch (error) {
    console.error('Matriks TOWS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      rencana_strategis_id,
      tahun,
      tipe_strategi,
      strategi
    } = req.body;

    if (tipe_strategi && !['SO', 'WO', 'ST', 'WT'].includes(tipe_strategi)) {
      return res.status(400).json({ error: 'Tipe strategi harus SO, WO, ST, atau WT' });
    }

    // Use supabaseAdmin to bypass RLS
    const clientToUse = supabaseAdmin || supabase;
    
    // First check access through rencana_strategis
    const { data: existing, error: checkError } = await clientToUse
      .from('swot_tows_strategi')
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

    if (rencana_strategis_id !== undefined) updateData.rencana_strategis_id = rencana_strategis_id || null;
    if (tahun !== undefined) updateData.tahun = parseInt(tahun);
    if (tipe_strategi !== undefined) updateData.tipe_strategi = tipe_strategi;
    if (strategi !== undefined) updateData.strategi = strategi;

    const { data, error } = await clientToUse
      .from('swot_tows_strategi')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Strategi berhasil diupdate', data });
  } catch (error) {
    console.error('Matriks TOWS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // Use supabaseAdmin to bypass RLS
    const clientToUse = supabaseAdmin || supabase;
    
    // First check access through rencana_strategis
    const { data: existing, error: checkError } = await clientToUse
      .from('swot_tows_strategi')
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
      .from('swot_tows_strategi')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Strategi berhasil dihapus' });
  } catch (error) {
    console.error('Matriks TOWS error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

