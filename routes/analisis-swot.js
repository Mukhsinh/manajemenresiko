const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

// Get all analisis SWOT
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, kategori, tahun } = req.query;
    
    let query = supabase
      .from('swot_analisis')
      .select('*, rencana_strategis(id, kode, nama_rencana)')
      .eq('user_id', req.user.id)
      .order('tahun', { ascending: false })
      .order('kategori', { ascending: true })
      .order('created_at', { ascending: false });

    if (rencana_strategis_id) {
      query = query.eq('rencana_strategis_id', rencana_strategis_id);
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
    console.error('Analisis SWOT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get summary (total score per kategori)
router.get('/summary', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, tahun } = req.query;
    
    let query = supabase
      .from('swot_analisis')
      .select('kategori, score, bobot, rank')
      .eq('user_id', req.user.id);

    if (rencana_strategis_id) {
      query = query.eq('rencana_strategis_id', rencana_strategis_id);
    }
    if (tahun) {
      query = query.eq('tahun', parseInt(tahun));
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate totals per category
    const summary = {
      Strength: { totalScore: 0, totalBobot: 0, items: [] },
      Weakness: { totalScore: 0, totalBobot: 0, items: [] },
      Opportunity: { totalScore: 0, totalBobot: 0, items: [] },
      Threat: { totalScore: 0, totalBobot: 0, items: [] }
    };

    (data || []).forEach(item => {
      if (summary[item.kategori]) {
        summary[item.kategori].totalScore += item.score || 0;
        summary[item.kategori].totalBobot += item.bobot || 0;
        summary[item.kategori].items.push(item);
      }
    });

    // Calculate differences
    const scoreOpportunity = summary.Opportunity.totalScore;
    const scoreThreat = summary.Threat.totalScore;
    const scoreStrength = summary.Strength.totalScore;
    const scoreWeakness = summary.Weakness.totalScore;

    summary.differences = {
      external: scoreOpportunity - scoreThreat,
      internal: scoreStrength - scoreWeakness
    };

    res.json(summary);
  } catch (error) {
    console.error('Analisis SWOT summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('swot_analisis')
      .select('*, rencana_strategis(id, kode, nama_rencana)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('Analisis SWOT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      rencana_strategis_id,
      tahun,
      kategori,
      objek_analisis,
      bobot,
      rank
    } = req.body;

    if (!kategori || !objek_analisis || !tahun || bobot === undefined || rank === undefined) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    if (bobot < 0 || bobot > 100) {
      return res.status(400).json({ error: 'Bobot harus antara 0-100' });
    }

    if (rank < 1 || rank > 5) {
      return res.status(400).json({ error: 'Rank harus antara 1-5' });
    }

    const { data, error } = await supabase
      .from('swot_analisis')
      .insert({
        user_id: req.user.id,
        rencana_strategis_id: rencana_strategis_id || null,
        tahun: parseInt(tahun),
        kategori,
        objek_analisis,
        bobot: parseInt(bobot),
        rank: parseInt(rank)
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Data berhasil ditambahkan', data });
  } catch (error) {
    console.error('Analisis SWOT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      rencana_strategis_id,
      tahun,
      kategori,
      objek_analisis,
      bobot,
      rank
    } = req.body;

    if (bobot !== undefined && (bobot < 0 || bobot > 100)) {
      return res.status(400).json({ error: 'Bobot harus antara 0-100' });
    }

    if (rank !== undefined && (rank < 1 || rank > 5)) {
      return res.status(400).json({ error: 'Rank harus antara 1-5' });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (rencana_strategis_id !== undefined) updateData.rencana_strategis_id = rencana_strategis_id || null;
    if (tahun !== undefined) updateData.tahun = parseInt(tahun);
    if (kategori !== undefined) updateData.kategori = kategori;
    if (objek_analisis !== undefined) updateData.objek_analisis = objek_analisis;
    if (bobot !== undefined) updateData.bobot = parseInt(bobot);
    if (rank !== undefined) updateData.rank = parseInt(rank);

    const { data, error } = await supabase
      .from('swot_analisis')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Data berhasil diupdate', data });
  } catch (error) {
    console.error('Analisis SWOT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('swot_analisis')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Analisis SWOT error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

