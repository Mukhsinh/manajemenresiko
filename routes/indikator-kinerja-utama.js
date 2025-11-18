const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

// Get all indikator kinerja utama
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, sasaran_strategi_id } = req.query;
    
    let query = supabase
      .from('indikator_kinerja_utama')
      .select('*, rencana_strategis(nama_rencana), sasaran_strategi(sasaran, perspektif)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

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
      .select('*, rencana_strategis(nama_rencana), sasaran_strategi(sasaran, perspektif)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

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

    const { data, error } = await supabase
      .from('indikator_kinerja_utama')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
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
    const { error } = await supabase
      .from('indikator_kinerja_utama')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Indikator kinerja utama berhasil dihapus' });
  } catch (error) {
    console.error('Indikator kinerja utama error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

