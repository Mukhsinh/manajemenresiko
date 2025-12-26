const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');
const { exportToExcel } = require('../utils/exportHelper');


// Generate strategic map automatically from all sasaran strategi
router.post('/generate-all', authenticateUser, async (req, res) => {
  try {
    console.log('🗺️ Generating strategic map for all rencana strategis');

    // Get all sasaran strategi for user's organization
    const clientToUse = supabaseAdmin || supabase;
    let sasaranQuery = clientToUse
      .from('sasaran_strategi')
      .select('*');

    // Apply organization filter
    sasaranQuery = buildOrganizationFilter(sasaranQuery, req.user);

    const { data: sasaranList, error: sasaranError } = await sasaranQuery;

    if (sasaranError) {
      console.error('❌ Error fetching sasaran strategi:', sasaranError);
      throw sasaranError;
    }

    console.log('📋 Found sasaran strategi:', sasaranList?.length || 0, 'items');

    if (!sasaranList || sasaranList.length === 0) {
      return res.json({ 
        message: 'Tidak ada sasaran strategi untuk digenerate. Silakan tambahkan sasaran strategi terlebih dahulu.', 
        data: [], 
        generated: 0 
      });
    }

    // Delete existing strategic map entries for user's organization
    console.log('🗑️ Deleting existing strategic map entries...');
    let deleteQuery = clientToUse
      .from('strategic_map')
      .delete();

    // Apply organization filter for delete
    deleteQuery = buildOrganizationFilter(deleteQuery, req.user);

    const { error: deleteError } = await deleteQuery;
    if (deleteError) {
      console.error('❌ Error deleting existing entries:', deleteError);
    }

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
    const processedSasaranIds = new Set(); // Track processed sasaran_strategi_id to prevent duplicates

    console.log('🏗️ Creating strategic map entries...');

    sasaranList.forEach((sasaran, index) => {
      // Skip if this sasaran_strategi_id has already been processed (prevent duplicates)
      if (processedSasaranIds.has(sasaran.id)) {
        console.warn(`⚠️ Skipping duplicate sasaran_strategi_id: ${sasaran.id}`);
        return;
      }
      processedSasaranIds.add(sasaran.id);

      // Handle both short and full perspektif names
      let perspektifInfo = perspektifMap[sasaran.perspektif];
      
      // If not found, try to match by full name
      if (!perspektifInfo) {
        const fullNameMap = {
          'Eksternal Stakeholder': { name: 'Eksternal Stakeholder', y: 100, color: '#3498db' },
          'Internal Business Process': { name: 'Internal Business Process', y: 200, color: '#e74c3c' },
          'Learning & Growth': { name: 'Learning & Growth', y: 300, color: '#f39c12' },
          'Financial': { name: 'Financial', y: 400, color: '#27ae60' }
        };
        perspektifInfo = fullNameMap[sasaran.perspektif];
      }

      if (!perspektifInfo) {
        console.warn('⚠️ Unknown perspektif:', sasaran.perspektif);
        // Default fallback
        perspektifInfo = { name: sasaran.perspektif, y: 100 + (index * 100), color: '#95a5a6' };
      }

      const perspektifKey = perspektifInfo.name; // Use full name for consistency
      if (!perspektifCount[perspektifKey]) {
        perspektifCount[perspektifKey] = 0;
      }
      perspektifCount[perspektifKey]++;

      // Calculate position with better spacing
      const xPosition = 100 + (perspektifCount[perspektifKey] - 1) * 300;
      const yPosition = perspektifInfo.y;

      strategicMapData.push({
        user_id: req.user.id,
        rencana_strategis_id: sasaran.rencana_strategis_id,
        sasaran_strategi_id: sasaran.id,
        perspektif: perspektifInfo.name,
        posisi_x: xPosition,
        posisi_y: yPosition,
        warna: perspektifInfo.color,
        organization_id: sasaran.organization_id || req.user.organizations?.[0] || null
      });

      console.log(`📍 Created entry for: ${sasaran.sasaran} (${perspektifInfo.name}) at (${xPosition}, ${yPosition})`);
    });

    if (strategicMapData.length > 0) {
      console.log('💾 Inserting strategic map data...');
      const { data, error } = await clientToUse
        .from('strategic_map')
        .insert(strategicMapData)
        .select();

      if (error) {
        console.error('❌ Error inserting strategic map data:', error);
        throw error;
      }

      console.log('✅ Strategic map generated successfully');
      res.json({ 
        message: 'Strategic map berhasil digenerate', 
        data, 
        generated: strategicMapData.length,
        summary: {
          total_sasaran: sasaranList.length,
          perspektif_distribution: perspektifCount,
          generated_entries: strategicMapData.length
        }
      });
    } else {
      res.json({ 
        message: 'Tidak ada sasaran strategi yang valid untuk digenerate', 
        data: [], 
        generated: 0 
      });
    }
  } catch (error) {
    console.error('❌ Strategic map generate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate strategic map automatically from sasaran strategi
router.post('/generate', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id } = req.body;

    if (!rencana_strategis_id) {
      return res.status(400).json({ error: 'Rencana strategis ID wajib diisi' });
    }

    console.log('🗺️ Generating strategic map for rencana_strategis_id:', rencana_strategis_id);

    // Get all sasaran strategi for this rencana
    const clientToUse = supabaseAdmin || supabase;
    let sasaranQuery = clientToUse
      .from('sasaran_strategi')
      .select('*')
      .eq('rencana_strategis_id', rencana_strategis_id);

    // Apply organization filter
    sasaranQuery = buildOrganizationFilter(sasaranQuery, req.user);

    const { data: sasaranList, error: sasaranError } = await sasaranQuery;

    if (sasaranError) {
      console.error('❌ Error fetching sasaran strategi:', sasaranError);
      throw sasaranError;
    }

    console.log('📋 Found sasaran strategi:', sasaranList?.length || 0, 'items');

    if (!sasaranList || sasaranList.length === 0) {
      return res.json({ 
        message: 'Tidak ada sasaran strategi untuk digenerate. Silakan tambahkan sasaran strategi terlebih dahulu.', 
        data: [], 
        generated: 0 
      });
    }

    // Delete existing strategic map entries for this rencana strategis
    console.log('🗑️ Deleting existing strategic map entries...');
    let deleteQuery = clientToUse
      .from('strategic_map')
      .delete()
      .eq('rencana_strategis_id', rencana_strategis_id);

    // Apply organization filter for delete
    deleteQuery = buildOrganizationFilter(deleteQuery, req.user);

    const { error: deleteError } = await deleteQuery;
    if (deleteError) {
      console.error('❌ Error deleting existing entries:', deleteError);
    }

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
    const processedSasaranIds = new Set(); // Track processed sasaran_strategi_id to prevent duplicates

    console.log('🏗️ Creating strategic map entries...');

    sasaranList.forEach((sasaran, index) => {
      // Skip if this sasaran_strategi_id has already been processed (prevent duplicates)
      if (processedSasaranIds.has(sasaran.id)) {
        console.warn(`⚠️ Skipping duplicate sasaran_strategi_id: ${sasaran.id}`);
        return;
      }
      processedSasaranIds.add(sasaran.id);

      // Handle both short and full perspektif names
      let perspektifInfo = perspektifMap[sasaran.perspektif];
      
      // If not found, try to match by full name
      if (!perspektifInfo) {
        const fullNameMap = {
          'Eksternal Stakeholder': { name: 'Eksternal Stakeholder', y: 100, color: '#3498db' },
          'Internal Business Process': { name: 'Internal Business Process', y: 200, color: '#e74c3c' },
          'Learning & Growth': { name: 'Learning & Growth', y: 300, color: '#f39c12' },
          'Financial': { name: 'Financial', y: 400, color: '#27ae60' }
        };
        perspektifInfo = fullNameMap[sasaran.perspektif];
      }

      if (!perspektifInfo) {
        console.warn('⚠️ Unknown perspektif:', sasaran.perspektif);
        // Default fallback
        perspektifInfo = { name: sasaran.perspektif, y: 100 + (index * 100), color: '#95a5a6' };
      }

      const perspektifKey = perspektifInfo.name; // Use full name for consistency
      if (!perspektifCount[perspektifKey]) {
        perspektifCount[perspektifKey] = 0;
      }
      perspektifCount[perspektifKey]++;

      // Calculate position with better spacing
      const xPosition = 100 + (perspektifCount[perspektifKey] - 1) * 300;
      const yPosition = perspektifInfo.y;

      strategicMapData.push({
        user_id: req.user.id,
        rencana_strategis_id,
        sasaran_strategi_id: sasaran.id,
        perspektif: perspektifInfo.name,
        posisi_x: xPosition,
        posisi_y: yPosition,
        warna: perspektifInfo.color,
        organization_id: sasaran.organization_id || req.user.organizations?.[0] || null
      });

      console.log(`📍 Created entry for: ${sasaran.sasaran} (${perspektifInfo.name}) at (${xPosition}, ${yPosition})`);
    });

    if (strategicMapData.length > 0) {
      console.log('💾 Inserting strategic map data...');
      const { data, error } = await clientToUse
        .from('strategic_map')
        .insert(strategicMapData)
        .select();

      if (error) {
        console.error('❌ Error inserting strategic map data:', error);
        throw error;
      }

      console.log('✅ Strategic map generated successfully');
      res.json({ 
        message: 'Strategic map berhasil digenerate', 
        data, 
        generated: strategicMapData.length,
        summary: {
          total_sasaran: sasaranList.length,
          perspektif_distribution: perspektifCount,
          generated_entries: strategicMapData.length
        }
      });
    } else {
      res.json({ 
        message: 'Tidak ada sasaran strategi yang valid untuk digenerate', 
        data: [], 
        generated: 0 
      });
    }
  } catch (error) {
    console.error('❌ Strategic map generate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all strategic map
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id } = req.query;
    
    const clientToUse = supabaseAdmin || supabase;
    let query = clientToUse
      .from('strategic_map')
      .select('*, rencana_strategis(nama_rencana), sasaran_strategi(sasaran, perspektif)')
      .order('perspektif', { ascending: true })
      .order('posisi_x', { ascending: true });

    // Apply organization filter
    query = buildOrganizationFilter(query, req.user);

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
    let query = supabase
      .from('strategic_map')
      .select('*, rencana_strategis(nama_rencana), sasaran_strategi(sasaran, perspektif)')
      .eq('strategic_map.id', req.params.id);

    // Apply organization filter
    query = buildOrganizationFilter(query, req.user, 'strategic_map.organization_id');

    const { data, error } = await query.single();

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

    let query = supabase
      .from('strategic_map')
      .update(updateData)
      .eq('strategic_map.id', req.params.id);

    // Apply organization filter
    query = buildOrganizationFilter(query, req.user, 'strategic_map.organization_id');

    const { data, error } = await query.select().single();

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
    let query = supabase
      .from('strategic_map')
      .delete()
      .eq('strategic_map.id', req.params.id);

    // Apply organization filter
    query = buildOrganizationFilter(query, req.user, 'strategic_map.organization_id');

    const { error } = await query;

    if (error) throw error;
    res.json({ message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Strategic map error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export strategic map to Excel
router.get('/actions/export', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id } = req.query;
    
    const clientToUse = supabaseAdmin || supabase;
    let query = clientToUse
      .from('strategic_map')
      .select(`
        *,
        rencana_strategis(nama_rencana, kode),
        sasaran_strategi(sasaran, perspektif)
      `)
      .order('perspektif', { ascending: true })
      .order('posisi_x', { ascending: true });

    // Apply organization filter
    query = buildOrganizationFilter(query, req.user);

    if (rencana_strategis_id) {
      query = query.eq('rencana_strategis_id', rencana_strategis_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Format data for Excel export
    const formattedData = (data || []).map((item, index) => ({
      no: index + 1,
      rencana_strategis: item.rencana_strategis?.nama_rencana || '',
      kode_rencana: item.rencana_strategis?.kode || '',
      perspektif: item.perspektif,
      sasaran_strategi: item.sasaran_strategi?.sasaran || '',
      posisi_x: item.posisi_x,
      posisi_y: item.posisi_y,
      warna: item.warna,
      created_at: new Date(item.created_at).toLocaleDateString('id-ID')
    }));

    const buffer = exportToExcel(formattedData, 'Strategic Map');
    
    // Set headers for file download
    const filename = `strategic-map-${rencana_strategis_id ? 'filtered' : 'all'}-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Strategic map export error:', error);
    res.status(500).json({ error: error.message });
  }
});



// Export strategic map data as JSON for frontend visualization download
router.get('/actions/export-json', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id } = req.query;
    
    const clientToUse = supabaseAdmin || supabase;
    let query = clientToUse
      .from('strategic_map')
      .select(`
        *,
        rencana_strategis(nama_rencana, kode, deskripsi),
        sasaran_strategi(sasaran, perspektif)
      `)
      .order('perspektif', { ascending: true })
      .order('posisi_x', { ascending: true });

    // Apply organization filter
    query = buildOrganizationFilter(query, req.user);

    if (rencana_strategis_id) {
      query = query.eq('rencana_strategis_id', rencana_strategis_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by perspektif for better visualization
    const groupedData = {};
    const perspektifOrder = ['Eksternal Stakeholder', 'Internal Business Process', 'Learning & Growth', 'Financial'];
    
    perspektifOrder.forEach(perspektif => {
      groupedData[perspektif] = (data || []).filter(item => item.perspektif === perspektif);
    });

    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        rencana_strategis: data?.[0]?.rencana_strategis || null,
        total_items: data?.length || 0,
        perspektif_count: Object.keys(groupedData).reduce((acc, key) => {
          acc[key] = groupedData[key].length;
          return acc;
        }, {})
      },
      strategic_map: groupedData,
      raw_data: data || []
    };

    res.json(exportData);
  } catch (error) {
    console.error('Strategic map JSON export error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

