const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

// Get all TOWS strategi
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, tipe_strategi, tahun } = req.query;
    
    let query = supabase
      .from('swot_tows_strategi')
      .select('*, rencana_strategis(id, kode, nama_rencana)')
      .eq('swot_tows_strategi.user_id', req.user.id)
      .order('tahun', { ascending: false })
      .order('tipe_strategi', { ascending: true })
      .order('created_at', { ascending: false });

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
    const { data, error } = await supabase
      .from('swot_tows_strategi')
      .select('*, rencana_strategis(id, kode, nama_rencana)')
      .eq('swot_tows_strategi.id', req.params.id)
      .eq('swot_tows_strategi.user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(data);
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

    const { data, error } = await supabase
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

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (rencana_strategis_id !== undefined) updateData.rencana_strategis_id = rencana_strategis_id || null;
    if (tahun !== undefined) updateData.tahun = parseInt(tahun);
    if (tipe_strategi !== undefined) updateData.tipe_strategi = tipe_strategi;
    if (strategi !== undefined) updateData.strategi = strategi;

    const { data, error } = await supabase
      .from('swot_tows_strategi')
      .update(updateData)
      .eq('swot_tows_strategi.id', req.params.id)
      .eq('swot_tows_strategi.user_id', req.user.id)
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
    const { error } = await supabase
      .from('swot_tows_strategi')
      .delete()
      .eq('swot_tows_strategi.id', req.params.id)
      .eq('swot_tows_strategi.user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Strategi berhasil dihapus' });
  } catch (error) {
    console.error('Matriks TOWS error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

