const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

// Calculate and generate diagram kartesius from SWOT analysis
router.post('/calculate', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, tahun } = req.body;

    if (!tahun) {
      return res.status(400).json({ error: 'Tahun wajib diisi' });
    }

    // Get SWOT analysis summary
    let analisisQuery = supabase
      .from('swot_analisis')
      .select('kategori, score')
      .eq('user_id', req.user.id)
      .eq('tahun', parseInt(tahun));

    if (rencana_strategis_id) {
      analisisQuery = analisisQuery.eq('rencana_strategis_id', rencana_strategis_id);
    }

    const { data: analisis, error: analisisError } = await analisisQuery;

    if (analisisError) throw analisisError;

    // Calculate totals per category
    const totals = {
      Strength: 0,
      Weakness: 0,
      Opportunity: 0,
      Threat: 0
    };

    (analisis || []).forEach(item => {
      if (totals[item.kategori] !== undefined) {
        totals[item.kategori] += item.score || 0;
      }
    });

    // Calculate axes
    const x_axis = totals.Strength - totals.Weakness;
    const y_axis = totals.Opportunity - totals.Threat;

    // Determine kuadran and strategi
    let kuadran, strategi;
    if (x_axis >= 0 && y_axis >= 0) {
      kuadran = 'I';
      strategi = 'Growth';
    } else if (x_axis < 0 && y_axis >= 0) {
      kuadran = 'II';
      strategi = 'Stability';
    } else if (x_axis < 0 && y_axis < 0) {
      kuadran = 'III';
      strategi = 'Survival';
    } else {
      kuadran = 'IV';
      strategi = 'Diversification';
    }

    // Upsert diagram data
    const { data, error } = await supabase
      .from('swot_diagram_kartesius')
      .upsert({
        user_id: req.user.id,
        rencana_strategis_id: rencana_strategis_id || null,
        tahun: parseInt(tahun),
        x_axis,
        y_axis,
        kuadran,
        strategi
      }, {
        onConflict: 'user_id,rencana_strategis_id,tahun'
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Diagram berhasil dihitung', data });
  } catch (error) {
    console.error('Diagram kartesius error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all diagram kartesius
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, tahun } = req.query;
    
    let query = supabase
      .from('swot_diagram_kartesius')
      .select('*, rencana_strategis(nama_rencana)')
      .eq('swot_diagram_kartesius.user_id', req.user.id)
      .order('tahun', { ascending: false });

    if (rencana_strategis_id) {
      query = query.eq('rencana_strategis_id', rencana_strategis_id);
    }
    if (tahun) {
      query = query.eq('tahun', parseInt(tahun));
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Diagram kartesius error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('swot_diagram_kartesius')
      .select('*, rencana_strategis(nama_rencana)')
      .eq('swot_diagram_kartesius.id', req.params.id)
      .eq('swot_diagram_kartesius.user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('Diagram kartesius error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update (manual override)
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { x_axis, y_axis, kuadran, strategi } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (x_axis !== undefined) updateData.x_axis = parseFloat(x_axis);
    if (y_axis !== undefined) updateData.y_axis = parseFloat(y_axis);
    if (kuadran !== undefined) updateData.kuadran = kuadran;
    if (strategi !== undefined) updateData.strategi = strategi;

    const { data, error } = await supabase
      .from('swot_diagram_kartesius')
      .update(updateData)
      .eq('swot_diagram_kartesius.id', req.params.id)
      .eq('swot_diagram_kartesius.user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Data berhasil diupdate', data });
  } catch (error) {
    console.error('Diagram kartesius error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('swot_diagram_kartesius')
      .delete()
      .eq('swot_diagram_kartesius.id', req.params.id)
      .eq('swot_diagram_kartesius.user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Diagram kartesius error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

