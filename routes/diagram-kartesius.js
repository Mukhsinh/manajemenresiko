const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

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
      .select('kategori, score, bobot, kuantitas, unit_kerja_id, organization_id')
      .eq('tahun', parseInt(tahun));
    
    // Apply organization filter (superadmin and admin can see all data)
    analisisQuery = buildOrganizationFilter(analisisQuery, req.user);

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

    // Check if diagram already exists for this combination
    const existingQuery = clientToUse
      .from('swot_diagram_kartesius')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('tahun', parseInt(tahun));
    
    if (rencana_strategis_id) {
      existingQuery.eq('rencana_strategis_id', rencana_strategis_id);
    } else {
      existingQuery.is('rencana_strategis_id', null);
    }
    
    if (unit_kerja_id && unit_kerja_id !== 'RUMAH_SAKIT') {
      existingQuery.eq('unit_kerja_id', unit_kerja_id);
    } else {
      existingQuery.is('unit_kerja_id', null);
    }

    const { data: existing } = await existingQuery.single();

    let data, error;
    
    if (existing) {
      // Update existing record
      const result = await clientToUse
        .from('swot_diagram_kartesius')
        .update({
          x_axis,
          y_axis,
          kuadran,
          strategi,
          unit_kerja_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Insert new record
      const result = await clientToUse
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
      
      data = result.data;
      error = result.error;
    }

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
      .order('tahun', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply organization filter through rencana_strategis relationship
    // Since diagram kartesius doesn't have direct organization_id, we filter through rencana_strategis
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
    let query = clientToUse
      .from('swot_diagram_kartesius')
      .select('*, rencana_strategis(nama_rencana, organization_id)')
      .eq('swot_diagram_kartesius.id', req.params.id);

    const { data, error } = await query.single();

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
    console.error('Diagram kartesius error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update (manual override)
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { x_axis, y_axis, kuadran, strategi } = req.body;
    const clientToUse = supabaseAdmin || supabase;

    // First check access through rencana_strategis
    const { data: existing, error: checkError } = await clientToUse
      .from('swot_diagram_kartesius')
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

    if (x_axis !== undefined) updateData.x_axis = parseFloat(x_axis);
    if (y_axis !== undefined) updateData.y_axis = parseFloat(y_axis);
    if (kuadran !== undefined) updateData.kuadran = kuadran;
    if (strategi !== undefined) updateData.strategi = strategi;

    const { data, error } = await clientToUse
      .from('swot_diagram_kartesius')
      .update(updateData)
      .eq('id', req.params.id)
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
    
    // First check access through rencana_strategis
    const { data: existing, error: checkError } = await clientToUse
      .from('swot_diagram_kartesius')
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
      .from('swot_diagram_kartesius')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Diagram kartesius error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

