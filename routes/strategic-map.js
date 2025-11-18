const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

// Generate strategic map automatically from sasaran strategi
router.post('/generate', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id } = req.body;

    if (!rencana_strategis_id) {
      return res.status(400).json({ error: 'Rencana strategis ID wajib diisi' });
    }

    // Get all sasaran strategi for this rencana
    const { data: sasaranList, error: sasaranError } = await supabase
      .from('sasaran_strategi')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('rencana_strategis_id', rencana_strategis_id);

    if (sasaranError) throw sasaranError;

    // Delete existing strategic map entries
    await supabase
      .from('strategic_map')
      .delete()
      .eq('user_id', req.user.id)
      .eq('rencana_strategis_id', rencana_strategis_id);

    // Map perspektif to full name and default positions
    const perspektifMap = {
      'ES': { name: 'Eksternal Stakeholder', y: 100, color: '#3498db' },
      'IBP': { name: 'Internal Business Process', y: 200, color: '#e74c3c' },
      'LG': { name: 'Learning & Growth', y: 300, color: '#f39c12' },
      'Fin': { name: 'Financial', y: 400, color: '#27ae60' }
    };

    // Group by perspektif and create strategic map entries
    const strategicMapData = [];
    const perspektifCount = {};

    (sasaranList || []).forEach((sasaran, index) => {
      const perspektif = perspektifMap[sasaran.perspektif];
      if (!perspektif) return;

      if (!perspektifCount[sasaran.perspektif]) {
        perspektifCount[sasaran.perspektif] = 0;
      }
      perspektifCount[sasaran.perspektif]++;

      strategicMapData.push({
        user_id: req.user.id,
        rencana_strategis_id,
        sasaran_strategi_id: sasaran.id,
        perspektif: perspektif.name,
        posisi_x: 100 + (perspektifCount[sasaran.perspektif] - 1) * 200,
        posisi_y: perspektif.y,
        warna: perspektif.color
      });
    });

    if (strategicMapData.length > 0) {
      const { data, error } = await supabase
        .from('strategic_map')
        .insert(strategicMapData)
        .select();

      if (error) throw error;
      res.json({ message: 'Strategic map berhasil digenerate', data });
    } else {
      res.json({ message: 'Tidak ada sasaran strategi untuk digenerate', data: [] });
    }
  } catch (error) {
    console.error('Strategic map generate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all strategic map
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id } = req.query;
    
    let query = supabase
      .from('strategic_map')
      .select('*, rencana_strategis(nama_rencana), sasaran_strategi(sasaran, perspektif)')
      .eq('user_id', req.user.id)
      .order('perspektif', { ascending: true })
      .order('posisi_x', { ascending: true });

    if (rencana_strategis_id) {
      query = query.eq('rencana_strategis_id', rencana_strategis_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Strategic map error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('strategic_map')
      .select('*, rencana_strategis(nama_rencana), sasaran_strategi(sasaran, perspektif)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('Strategic map error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update position (manual drag-drop)
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { posisi_x, posisi_y, warna } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (posisi_x !== undefined) updateData.posisi_x = parseFloat(posisi_x);
    if (posisi_y !== undefined) updateData.posisi_y = parseFloat(posisi_y);
    if (warna !== undefined) updateData.warna = warna;

    const { data, error } = await supabase
      .from('strategic_map')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Posisi berhasil diupdate', data });
  } catch (error) {
    console.error('Strategic map error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('strategic_map')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Strategic map error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

