const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

// Calculate and generate diagram kartesius from SWOT analysis
router.post('/calculate', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, unit_kerja_id, tahun } = req.body;

    if (!tahun) {
      return res.status(400).json({ error: 'Tahun wajib diisi' });
    }

    // Get SWOT analysis summary
    const clientToUse = supabaseAdmin || supabase;
    let analisisQuery = clientToUse
      .from('swot_analisis')
      .select('kategori, score, bobot, kuantitas, unit_kerja_id')
      .eq('user_id', req.user.id)
      .eq('tahun', parseInt(tahun));

    if (rencana_strategis_id) {
      analisisQuery = analisisQuery.eq('rencana_strategis_id', rencana_strategis_id);
    }
    
    // If specific unit selected (not RUMAH_SAKIT and not empty)
    if (unit_kerja_id && unit_kerja_id !== 'RUMAH_SAKIT') {
      analisisQuery = analisisQuery.eq('unit_kerja_id', unit_kerja_id);
    }

    const { data: analisis, error: analisisError } = await analisisQuery;

    if (analisisError) throw analisisError;

    if (!analisis || analisis.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data analisis SWOT untuk dihitung' });
    }

    // Calculate totals per category
    const totals = {
      Strength: 0,
      Weakness: 0,
      Opportunity: 0,
      Threat: 0
    };

    // If RUMAH_SAKIT (aggregation), select highest score and bobot
    if (unit_kerja_id === 'RUMAH_SAKIT') {
      const grouped = {};
      analisis.forEach(item => {
        if (!grouped[item.kategori]) {
          grouped[item.kategori] = [];
        }
        grouped[item.kategori].push(item);
      });

      // For each category, get items with highest score and bobot
      Object.keys(grouped).forEach(kategori => {
        const items = grouped[kategori];
        // Sort by score desc, then bobot desc
        items.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.bobot - a.bobot;
        });
        
        // Take top items based on kuantitas (limit to reasonable number)
        const topItems = items.slice(0, Math.min(5, items.length));
        totals[kategori] = topItems.reduce((sum, item) => sum + (item.score || 0), 0);
      });
    } else {
      // Normal calculation for specific unit or all
      (analisis || []).forEach(item => {
        if (totals[item.kategori] !== undefined) {
          totals[item.kategori] += item.score || 0;
        }
      });
    }

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

    // Get unit name if specific unit selected
    let unit_kerja_name = null;
    if (unit_kerja_id && unit_kerja_id !== 'RUMAH_SAKIT') {
      const { data: unitData } = await clientToUse
        .from('master_work_units')
        .select('name')
        .eq('id', unit_kerja_id)
        .single();
      unit_kerja_name = unitData?.name;
    } else if (unit_kerja_id === 'RUMAH_SAKIT') {
      unit_kerja_name = 'Rumah Sakit (Agregasi)';
    }

    // Insert diagram data (allow multiple entries per year/unit)
    const { data, error } = await clientToUse
      .from('swot_diagram_kartesius')
      .insert({
        user_id: req.user.id,
        rencana_strategis_id: rencana_strategis_id || null,
        unit_kerja_id: unit_kerja_id && unit_kerja_id !== 'RUMAH_SAKIT' ? unit_kerja_id : null,
        unit_kerja_name,
        tahun: parseInt(tahun),
        x_axis,
        y_axis,
        kuadran,
        strategi
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
    const { rencana_strategis_id, unit_kerja_id, tahun } = req.query;
    
    const clientToUse = supabaseAdmin || supabase;
    let query = clientToUse
      .from('swot_diagram_kartesius')
      .select('*, rencana_strategis(nama_rencana)')
      .eq('swot_diagram_kartesius.user_id', req.user.id)
      .order('tahun', { ascending: false })
      .order('created_at', { ascending: false });

    if (rencana_strategis_id) {
      query = query.eq('rencana_strategis_id', rencana_strategis_id);
    }
    if (unit_kerja_id === 'RUMAH_SAKIT') {
      query = query.eq('unit_kerja_name', 'Rumah Sakit (Agregasi)');
    } else if (unit_kerja_id) {
      query = query.eq('unit_kerja_id', unit_kerja_id);
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
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
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

    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
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
    const clientToUse = supabaseAdmin || supabase;
    const { error } = await clientToUse
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

