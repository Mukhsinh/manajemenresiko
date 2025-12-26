const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Debug endpoint without authentication for testing - MUST BE FIRST
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Debug endpoint accessed for sasaran-strategi');
    
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('sasaran_strategi')
      .select(`
        *,
        rencana_strategis(id, kode, nama_rencana),
        swot_tows_strategi(id, tipe_strategi, strategi)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Debug query error:', error);
      throw error;
    }

    console.log(`✅ Debug query successful, returning ${data?.length || 0} items`);
    res.json({ 
      success: true, 
      data: data || [], 
      count: data?.length || 0,
      message: 'Debug data retrieved successfully'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      data: [],
      message: 'Debug endpoint failed'
    });
  }
});

// Simple endpoint without complex auth for testing - MUST BE SECOND
router.get('/simple', async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('sasaran_strategi')
      .select(`
        id,
        sasaran,
        perspektif,
        tows_strategi_id,
        rencana_strategis(nama_rencana),
        swot_tows_strategi(tipe_strategi, strategi)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('Simple endpoint - returning data:', data?.length || 0, 'items');
    res.json(data || []);
  } catch (error) {
    console.error('Simple sasaran strategi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public endpoint for testing (no auth required) - MUST BE THIRD
router.get('/public', async (req, res) => {
  try {
    console.log('=== SASARAN STRATEGI PUBLIC ENDPOINT ===');
    
    const clientToUse = supabaseAdmin || supabase;
    
    let query = clientToUse
      .from('sasaran_strategi')
      .select(`
        *,
        rencana_strategis (
          id,
          nama_rencana,
          kode,
          organization_id
        ),
        swot_tows_strategi (
          id,
          tipe_strategi,
          strategi
        )
      `)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Sasaran strategi public query error:', error);
      throw error;
    }

    console.log('Public query result:', {
      count: data?.length || 0,
      hasData: data && data.length > 0
    });

    res.json(data || []);
  } catch (error) {
    console.error('Public endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Auto-correlate sasaran strategi with TOWS strategi using AI
router.post('/auto-correlate', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    // Get all sasaran strategi without TOWS correlation
    const { data: sasaranList, error: sasaranError } = await clientToUse
      .from('sasaran_strategi')
      .select('id, sasaran, perspektif')
      .is('tows_strategi_id', null);

    if (sasaranError) throw sasaranError;

    // Get all TOWS strategi
    const { data: towsList, error: towsError } = await clientToUse
      .from('swot_tows_strategi')
      .select('id, tipe_strategi, strategi');

    if (towsError) throw towsError;

    if (!sasaranList || sasaranList.length === 0) {
      return res.json({ message: 'Tidak ada sasaran strategi yang perlu dikorelasikan', correlations: [] });
    }

    if (!towsList || towsList.length === 0) {
      return res.json({ message: 'Tidak ada TOWS strategi yang tersedia', correlations: [] });
    }

    // AI-based correlation logic
    const correlations = [];
    
    for (const sasaran of sasaranList) {
      const bestMatch = findBestTowsMatch(sasaran, towsList);
      if (bestMatch) {
        correlations.push({
          sasaran_id: sasaran.id,
          sasaran_text: sasaran.sasaran,
          perspektif: sasaran.perspektif,
          tows_id: bestMatch.id,
          tows_type: bestMatch.tipe_strategi,
          tows_strategy: bestMatch.strategi,
          confidence: bestMatch.confidence
        });

        // Update the database
        await clientToUse
          .from('sasaran_strategi')
          .update({ tows_strategi_id: bestMatch.id })
          .eq('id', sasaran.id);
      }
    }

    res.json({ 
      message: `Berhasil mengkorelasikan ${correlations.length} sasaran strategi dengan TOWS strategi`,
      correlations 
    });
  } catch (error) {
    console.error('Auto-correlate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI function to find best TOWS match for a sasaran
function findBestTowsMatch(sasaran, towsList) {
  const sasaranText = sasaran.sasaran.toLowerCase();
  const perspektif = sasaran.perspektif;
  
  let bestMatch = null;
  let highestScore = 0;

  for (const tows of towsList) {
    let score = 0;
    const towsText = tows.strategi.toLowerCase();
    
    // Keyword matching based on perspektif and content
    const keywordMatches = calculateKeywordMatch(sasaranText, towsText, perspektif, tows.tipe_strategi);
    score += keywordMatches;
    
    // Perspektif-TOWS type correlation
    const typeCorrelation = calculateTypeCorrelation(perspektif, tows.tipe_strategi);
    score += typeCorrelation;
    
    // Content similarity
    const contentSimilarity = calculateContentSimilarity(sasaranText, towsText);
    score += contentSimilarity;
    
    if (score > highestScore && score > 0.3) { // Minimum threshold
      highestScore = score;
      bestMatch = {
        ...tows,
        confidence: Math.round(score * 100)
      };
    }
  }
  
  return bestMatch;
}

function calculateKeywordMatch(sasaranText, towsText, perspektif, tipeStrategi) {
  let score = 0;
  
  // Keywords based on perspektif
  const perspektifKeywords = {
    'ES': ['stakeholder', 'eksternal', 'kepuasan', 'pelayanan', 'kualitas', 'pasien', 'masyarakat'],
    'IBP': ['proses', 'internal', 'operasional', 'efisiensi', 'waktu', 'sistem', 'prosedur'],
    'LG': ['pembelajaran', 'pertumbuhan', 'SDM', 'pelatihan', 'kompetensi', 'pengembangan'],
    'Fin': ['keuangan', 'finansial', 'anggaran', 'biaya', 'pendapatan', 'ekonomi', 'sumber daya']
  };
  
  // Keywords based on TOWS type
  const towsKeywords = {
    'SO': ['memanfaatkan', 'mengoptimalkan', 'kekuatan', 'peluang', 'digital', 'teknologi'],
    'WO': ['mengatasi', 'keterbatasan', 'peluang', 'kerjasama', 'bantuan', 'upgrade'],
    'ST': ['menggunakan', 'menghadapi', 'ancaman', 'keamanan', 'sistem', 'kekuatan'],
    'WT': ['meminimalkan', 'kelemahan', 'menghindari', 'ancaman', 'pelatihan', 'protokol']
  };
  
  // Check perspektif keywords in sasaran
  const perspektifWords = perspektifKeywords[perspektif] || [];
  for (const keyword of perspektifWords) {
    if (sasaranText.includes(keyword)) {
      score += 0.2;
    }
  }
  
  // Check TOWS keywords in strategy
  const towsWords = towsKeywords[tipeStrategi] || [];
  for (const keyword of towsWords) {
    if (towsText.includes(keyword)) {
      score += 0.15;
    }
  }
  
  return score;
}

function calculateTypeCorrelation(perspektif, tipeStrategi) {
  // Correlation matrix between perspektif and TOWS types
  const correlationMatrix = {
    'ES': { 'SO': 0.8, 'WO': 0.6, 'ST': 0.4, 'WT': 0.2 },
    'IBP': { 'SO': 0.7, 'WO': 0.8, 'ST': 0.6, 'WT': 0.5 },
    'LG': { 'SO': 0.9, 'WO': 0.7, 'ST': 0.3, 'WT': 0.8 },
    'Fin': { 'SO': 0.6, 'WO': 0.9, 'ST': 0.5, 'WT': 0.4 }
  };
  
  return (correlationMatrix[perspektif] && correlationMatrix[perspektif][tipeStrategi]) || 0;
}

function calculateContentSimilarity(sasaranText, towsText) {
  // Simple word overlap calculation
  const sasaranWords = sasaranText.split(' ').filter(word => word.length > 3);
  const towsWords = towsText.split(' ').filter(word => word.length > 3);
  
  let commonWords = 0;
  for (const word of sasaranWords) {
    if (towsWords.some(towsWord => towsWord.includes(word) || word.includes(towsWord))) {
      commonWords++;
    }
  }
  
  return commonWords / Math.max(sasaranWords.length, 1) * 0.5;
}

// Get all sasaran strategi (with filters)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, tows_strategi_id, perspektif } = req.query;
    
    const clientToUse = supabaseAdmin || supabase;
    let query = clientToUse
      .from('sasaran_strategi')
      .select(`
        *,
        rencana_strategis(id, kode, nama_rencana, organization_id),
        swot_tows_strategi(id, tipe_strategi, strategi)
      `);

    // Apply organization filter through rencana_strategis relationship
    if (!req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
      let rsQuery = clientToUse
        .from('rencana_strategis')
        .select('id');
      rsQuery = buildOrganizationFilter(rsQuery, req.user);
      const { data: accessibleRS } = await rsQuery;
      const accessibleRSIds = (accessibleRS || []).map(rs => rs.id);
      
      if (accessibleRSIds.length > 0) {
        query = query.in('rencana_strategis_id', accessibleRSIds);
      } else {
        return res.json([]);
      }
    }

    // Apply filters
    if (rencana_strategis_id) {
      query = query.eq('rencana_strategis_id', rencana_strategis_id);
    }
    if (tows_strategi_id) {
      query = query.eq('tows_strategi_id', tows_strategi_id);
    }
    if (perspektif) {
      query = query.eq('perspektif', perspektif);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Sasaran strategi GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    let query = clientToUse
      .from('sasaran_strategi')
      .select(`
        *,
        rencana_strategis(id, kode, nama_rencana, organization_id),
        swot_tows_strategi(id, tipe_strategi, strategi)
      `)
      .eq('id', req.params.id)
      .single();

    // Apply organization filter through rencana_strategis relationship
    const { data, error } = await query;
    
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Sasaran strategi tidak ditemukan' });

    // Additional check for organization access
    if (!req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
      if (data.rencana_strategis?.organization_id) {
        if (!req.user.organizations.includes(data.rencana_strategis.organization_id)) {
          return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
        }
      }
    }

    res.json(data);
  } catch (error) {
    console.error('Sasaran strategi GET by ID error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, tows_strategi_id, perspektif, sasaran } = req.body;

    if (!rencana_strategis_id || !perspektif || !sasaran) {
      return res.status(400).json({ error: 'Rencana strategis, perspektif, dan sasaran wajib diisi' });
    }

    const clientToUse = supabaseAdmin || supabase;

    // Check if rencana_strategis exists and user has access
    let rsQuery = clientToUse
      .from('rencana_strategis')
      .select('id, organization_id')
      .eq('id', rencana_strategis_id)
      .single();

    if (!req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
      rsQuery = buildOrganizationFilter(rsQuery, req.user);
    }

    const { data: rencana, error: rencanaError } = await rsQuery;

    if (rencanaError || !rencana) {
      return res.status(404).json({ error: 'Rencana strategis tidak ditemukan atau Anda tidak memiliki akses' });
    }

    const insertData = {
      user_id: req.user.id,
      rencana_strategis_id,
      tows_strategi_id: tows_strategi_id || null,
      perspektif,
      sasaran,
      organization_id: rencana.organization_id || req.user.organizations?.[0] || null
    };

    const { data, error } = await clientToUse
      .from('sasaran_strategi')
      .insert(insertData)
      .select(`
        *,
        rencana_strategis(id, kode, nama_rencana),
        swot_tows_strategi(id, tipe_strategi, strategi)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Sasaran strategi berhasil ditambahkan', data });
  } catch (error) {
    console.error('Sasaran strategi POST error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { rencana_strategis_id, tows_strategi_id, perspektif, sasaran } = req.body;

    const clientToUse = supabaseAdmin || supabase;

    // First check if record exists and user has access
    let checkQuery = clientToUse
      .from('sasaran_strategi')
      .select(`
        *,
        rencana_strategis(id, organization_id)
      `)
      .eq('id', req.params.id)
      .single();

    const { data: existing, error: checkError } = await checkQuery;

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Sasaran strategi tidak ditemukan' });
    }

    // Check organization access
    if (!req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
      if (existing.rencana_strategis?.organization_id) {
        if (!req.user.organizations.includes(existing.rencana_strategis.organization_id)) {
          return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
        }
      }
    }

    // If rencana_strategis_id is being changed, verify access to new rencana
    if (rencana_strategis_id && rencana_strategis_id !== existing.rencana_strategis_id) {
      let rsQuery = clientToUse
        .from('rencana_strategis')
        .select('id, organization_id')
        .eq('id', rencana_strategis_id)
        .single();

      if (!req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
        rsQuery = buildOrganizationFilter(rsQuery, req.user);
      }

      const { data: newRencana, error: rencanaError } = await rsQuery;

      if (rencanaError || !newRencana) {
        return res.status(404).json({ error: 'Rencana strategis baru tidak ditemukan atau Anda tidak memiliki akses' });
      }
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (rencana_strategis_id !== undefined) updateData.rencana_strategis_id = rencana_strategis_id;
    if (tows_strategi_id !== undefined) updateData.tows_strategi_id = tows_strategi_id || null;
    if (perspektif !== undefined) updateData.perspektif = perspektif;
    if (sasaran !== undefined) updateData.sasaran = sasaran;

    const { data, error } = await clientToUse
      .from('sasaran_strategi')
      .update(updateData)
      .eq('id', req.params.id)
      .select(`
        *,
        rencana_strategis(id, kode, nama_rencana),
        swot_tows_strategi(id, tipe_strategi, strategi)
      `)
      .single();

    if (error) throw error;

    res.json({ message: 'Sasaran strategi berhasil diupdate', data });
  } catch (error) {
    console.error('Sasaran strategi PUT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;

    // First check if record exists and user has access
    let checkQuery = clientToUse
      .from('sasaran_strategi')
      .select(`
        *,
        rencana_strategis(id, organization_id)
      `)
      .eq('id', req.params.id)
      .single();

    const { data: existing, error: checkError } = await checkQuery;

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Sasaran strategi tidak ditemukan' });
    }

    // Check organization access
    if (!req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
      if (existing.rencana_strategis?.organization_id) {
        if (!req.user.organizations.includes(existing.rencana_strategis.organization_id)) {
          return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
        }
      }
    }

    const { error } = await clientToUse
      .from('sasaran_strategi')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Sasaran strategi berhasil dihapus' });
  } catch (error) {
    console.error('Sasaran strategi DELETE error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get report data
router.get('/report', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    let query = clientToUse
      .from('sasaran_strategi')
      .select(`
        *,
        rencana_strategis(id, kode, nama_rencana, organization_id),
        swot_tows_strategi(id, tipe_strategi, strategi)
      `)
      .order('created_at', { ascending: false });

    // Apply organization filter through rencana_strategis relationship
    if (!req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
      let rsQuery = clientToUse
        .from('rencana_strategis')
        .select('id');
      rsQuery = buildOrganizationFilter(rsQuery, req.user);
      const { data: accessibleRS } = await rsQuery;
      const accessibleRSIds = (accessibleRS || []).map(rs => rs.id);
      
      if (accessibleRSIds.length > 0) {
        query = query.in('rencana_strategis_id', accessibleRSIds);
      } else {
        return res.json([]);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    // Format data for report
    const reportData = (data || []).map((item, index) => ({
      no: index + 1,
      rencana_strategis: item.rencana_strategis?.nama_rencana || '-',
      sasaran: item.sasaran,
      perspektif: item.perspektif,
      tipe_tows: item.swot_tows_strategi?.tipe_strategi || '-',
      strategi_tows: item.swot_tows_strategi?.strategi || '-',
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    res.json(reportData);
  } catch (error) {
    console.error('Sasaran strategi report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint without authentication for testing
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Debug endpoint accessed for sasaran-strategi');
    
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('sasaran_strategi')
      .select(`
        *,
        rencana_strategis(id, kode, nama_rencana),
        swot_tows_strategi(id, tipe_strategi, strategi)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Debug query error:', error);
      throw error;
    }

    console.log(`✅ Debug query successful, returning ${data?.length || 0} items`);
    res.json({ 
      success: true, 
      data: data || [], 
      count: data?.length || 0,
      message: 'Debug data retrieved successfully'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      data: [],
      message: 'Debug endpoint failed'
    });
  }
});

module.exports = router;

