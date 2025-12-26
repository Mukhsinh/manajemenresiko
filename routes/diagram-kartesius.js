const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Calculate and generate diagram kartesius from SWOT analysis - AUTO MODE FOR ALL UNITS
router.post('/calculate', authenticateUser, async (req, res) => {
  try {
    const { unit_kerja_id, jenis, kategori, tahun } = req.body;

    if (!tahun) {
      return res.status(400).json({ error: 'Tahun wajib diisi' });
    }

    console.log('🔄 AUTO CALCULATION - Processing units for year:', tahun, 'filters:', { unit_kerja_id, jenis, kategori });

    const clientToUse = supabaseAdmin || supabase;
    
    // Get all SWOT analysis data for the year
    let analisisQuery = clientToUse
      .from('swot_analisis')
      .select(`
        kategori, score, bobot, kuantitas, unit_kerja_id, organization_id, objek_analisis,
        master_work_units!unit_kerja_id(id, name, code, jenis, kategori)
      `)
      .eq('tahun', parseInt(tahun));
    
    // Apply organization filter
    analisisQuery = buildOrganizationFilter(analisisQuery, req.user);

    const { data: analisis, error: analisisError } = await analisisQuery;

    if (analisisError) throw analisisError;

    console.log('📊 Found SWOT analysis data:', analisis?.length || 0, 'items');

    if (!analisis || analisis.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data analisis SWOT untuk dihitung. Pastikan data SWOT sudah diinput untuk tahun yang dipilih.' });
    }

    // Filter by unit kerja, jenis, kategori
    let filteredAnalisis = analisis;
    
    if (unit_kerja_id && unit_kerja_id !== 'AGGREGATE') {
      filteredAnalisis = filteredAnalisis.filter(item => item.unit_kerja_id === unit_kerja_id);
    }
    
    if (jenis || kategori) {
      filteredAnalisis = filteredAnalisis.filter(item => {
        const workUnit = item.master_work_units;
        if (!workUnit) return false;
        
        let matchJenis = true;
        let matchKategori = true;
        
        if (jenis) {
          matchJenis = workUnit.jenis === jenis;
        }
        
        if (kategori) {
          matchKategori = workUnit.kategori === kategori;
        }
        
        return matchJenis && matchKategori;
      });
    }

    // Get unique units from the filtered data
    const uniqueUnits = [...new Set(filteredAnalisis.map(item => item.unit_kerja_id).filter(Boolean))];
    console.log('🏢 Found unique units after filtering:', uniqueUnits.length);

    // Get organization_id for the record
    let organization_id = req.user.organizations?.[0] || null;

    // Get unit names for better display
    const { data: unitData } = await clientToUse
      .from('master_work_units')
      .select('id, name, code')
      .in('id', uniqueUnits);
    
    const unitMap = {};
    (unitData || []).forEach(unit => {
      unitMap[unit.id] = { name: unit.name, code: unit.code };
    });

    const results = [];
    const errors = [];

    // Process each unit individually + aggregate if multiple units
    const unitsToProcess = uniqueUnits.length > 1 ? [...uniqueUnits, 'AGGREGATE'] : uniqueUnits;

    for (const unitId of unitsToProcess) {
      try {
        let unitAnalisis, unitName;
        
        if (unitId === 'AGGREGATE') {
          // Process all units together
          unitAnalisis = filteredAnalisis;
          unitName = 'Semua Unit Kerja (Agregasi Otomatis)';
        } else {
          // Process individual unit
          unitAnalisis = filteredAnalisis.filter(item => item.unit_kerja_id === unitId);
          const unitInfo = unitMap[unitId];
          unitName = unitInfo ? `${unitInfo.name} (${unitInfo.code})` : `Unit ${unitId.substring(0, 8)}...`;
        }

        if (unitAnalisis.length === 0) {
          console.log(`⚠️ No data for unit: ${unitName}`);
          continue;
        }

        // Calculate totals per category for this unit
        const totals = {
          Strength: 0,
          Weakness: 0,
          Opportunity: 0,
          Threat: 0
        };

        // Group by category
        const grouped = {};
        unitAnalisis.forEach(item => {
          if (!grouped[item.kategori]) {
            grouped[item.kategori] = [];
          }
          grouped[item.kategori].push(item);
        });

        // Sum scores for each category
        Object.keys(grouped).forEach(kategori => {
          const items = grouped[kategori];
          const categoryTotal = items.reduce((sum, item) => sum + (item.score || 0), 0);
          
          if (totals[kategori] !== undefined) {
            totals[kategori] = categoryTotal;
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

        console.log(`📍 Unit ${unitName}: (${x_axis.toFixed(1)}, ${y_axis.toFixed(1)}) - Kuadran ${kuadran}`);

        // Check if diagram already exists
        let existingQuery = clientToUse
          .from('swot_diagram_kartesius')
          .select('id')
          .eq('user_id', req.user.id)
          .eq('tahun', parseInt(tahun))
          .eq('unit_kerja_name', unitName);
        
        existingQuery = existingQuery.is('rencana_strategis_id', null);

        const { data: existing } = await existingQuery.single();

        const diagramData = {
          x_axis,
          y_axis,
          kuadran,
          strategi,
          unit_kerja_name: unitName,
          organization_id,
          updated_at: new Date().toISOString()
        };
        
        let data, error;
        
        if (existing) {
          // Update existing record
          const result = await clientToUse
            .from('swot_diagram_kartesius')
            .update(diagramData)
            .eq('id', existing.id)
            .select()
            .single();
          
          data = result.data;
          error = result.error;
        } else {
          // Insert new record
          const insertData = {
            user_id: req.user.id,
            rencana_strategis_id: null,
            unit_kerja_id: unitId === 'AGGREGATE' ? null : unitId,
            tahun: parseInt(tahun),
            ...diagramData
          };
          
          const result = await clientToUse
            .from('swot_diagram_kartesius')
            .insert(insertData)
            .select()
            .single();
          
          data = result.data;
          error = result.error;
        }

        if (error) {
          console.error(`❌ Database error for ${unitName}:`, error);
          errors.push({ unit: unitName, error: error.message });
        } else {
          results.push({
            unit: unitName,
            data,
            calculation: {
              totals,
              axes: { x_axis, y_axis },
              position: { kuadran, strategi }
            }
          });
        }

      } catch (unitError) {
        console.error(`❌ Error processing unit ${unitId}:`, unitError);
        errors.push({ unit: unitMap[unitId]?.name || unitId, error: unitError.message });
      }
    }

    console.log(`✅ AUTO CALCULATION completed: ${results.length} successful, ${errors.length} errors`);
    
    res.json({ 
      message: `Diagram berhasil dihitung untuk ${results.length} unit kerja`,
      results,
      errors,
      summary: {
        total_processed: unitsToProcess.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Diagram kartesius auto calculation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all diagram kartesius
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { unit_kerja_id, jenis, kategori, tahun } = req.query;
    
    const clientToUse = supabaseAdmin || supabase;
    let query = clientToUse
      .from('swot_diagram_kartesius')
      .select(`
        *, 
        rencana_strategis(nama_rencana),
        master_work_units!unit_kerja_id(id, name, code, jenis, kategori)
      `)
      .order('tahun', { ascending: false });

    // Apply organization filter
    query = buildOrganizationFilter(query, req.user);

    // Filter by unit kerja
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
    
    let filteredData = data || [];
    
    // Apply jenis and kategori filters on the result
    if (jenis || kategori) {
      filteredData = filteredData.filter(item => {
        const workUnit = item.master_work_units;
        if (!workUnit) return true; // Keep aggregated data
        
        let matchJenis = true;
        let matchKategori = true;
        
        if (jenis) {
          matchJenis = workUnit.jenis === jenis;
        }
        
        if (kategori) {
          matchKategori = workUnit.kategori === kategori;
        }
        
        return matchJenis && matchKategori;
      });
    }
    
    // Sort by unit kerja code (001, 002, etc.)
    filteredData.sort((a, b) => {
      const codeA = a.master_work_units?.code || '999';
      const codeB = b.master_work_units?.code || '999';
      return codeA.localeCompare(codeB);
    });

    res.json(filteredData);
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