/**
 * RENSTRA ROUTES v1.0 - CLEAN IMPLEMENTATION
 * 
 * Route baru yang bersih untuk halaman /renstra
 * Menggunakan tabel yang sama dengan rencana-strategis
 */

const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');
const { exportToExcel, generateTemplate } = require('../utils/exportHelper');

// Helper function
function getClient() {
  return supabaseAdmin || supabase;
}

function sendExcel(res, buffer, filename) {
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
}

// ============================================
// PUBLIC ENDPOINTS (No Auth Required)
// ============================================

// Public: Get all data
router.get('/public', async (req, res) => {
  try {
    console.log('=== RENSTRA PUBLIC ENDPOINT ===');
    
    const { data, error } = await getClient()
      .from('rencana_strategis')
      .select(`
        id, kode, nama_rencana, deskripsi, 
        periode_mulai, periode_selesai, target, 
        indikator_kinerja, status, visi_misi_id, 
        user_id, organization_id, sasaran_strategis, 
        indikator_kinerja_utama, created_at, updated_at,
        visi_misi(id, visi, misi, tahun)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Renstra public query error:', error);
      throw error;
    }

    console.log(`Renstra public: returning ${data?.length || 0} records`);
    res.json(data || []);
  } catch (error) {
    console.error('Renstra public error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public: Generate kode
router.get('/generate/kode/public', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    
    // Get highest number for current year
    const { data: existing } = await getClient()
      .from('rencana_strategis')
      .select('kode')
      .like('kode', `RS-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1);
    
    let nextNumber = 1;
    if (existing && existing.length > 0) {
      const lastKode = existing[0].kode;
      const match = lastKode.match(/RS-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    const kode = `RS-${year}-${String(nextNumber).padStart(3, '0')}`;
    res.json({ kode });
  } catch (error) {
    console.error('Generate kode error:', error);
    // Fallback
    const year = new Date().getFullYear();
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    res.json({ kode: `RS-${year}-${random}` });
  }
});

// ============================================
// AUTHENTICATED ENDPOINTS
// ============================================

// Get all (authenticated)
router.get('/', authenticateUser, async (req, res) => {
  try {
    let query = getClient()
      .from('rencana_strategis')
      .select(`
        id, kode, nama_rencana, deskripsi, 
        periode_mulai, periode_selesai, target, 
        indikator_kinerja, status, visi_misi_id, 
        user_id, organization_id, sasaran_strategis, 
        indikator_kinerja_utama, created_at, updated_at,
        visi_misi(id, visi, misi, tahun)
      `);
    
    // Apply organization filter
    query = buildOrganizationFilter(query, req.user);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    
    console.log(`Renstra: returning ${(data || []).length} records`);
    res.json(data || []);
  } catch (error) {
    console.error('Renstra error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    let query = getClient()
      .from('rencana_strategis')
      .select('*')
      .eq('id', req.params.id);
    
    query = buildOrganizationFilter(query, req.user);
    
    const { data, error } = await query.single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    
    res.json(data);
  } catch (error) {
    console.error('Renstra get by id error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate kode (authenticated)
router.get('/generate/kode', authenticateUser, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    
    const { data: existing } = await getClient()
      .from('rencana_strategis')
      .select('kode')
      .like('kode', `RS-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1);
    
    let nextNumber = 1;
    if (existing && existing.length > 0) {
      const lastKode = existing[0].kode;
      const match = lastKode.match(/RS-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    const kode = `RS-${year}-${String(nextNumber).padStart(3, '0')}`;
    res.json({ kode });
  } catch (error) {
    console.error('Generate kode error:', error);
    const year = new Date().getFullYear();
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    res.json({ kode: `RS-${year}-${random}` });
  }
});

// Create
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      kode,
      nama_rencana,
      deskripsi,
      periode_mulai,
      periode_selesai,
      target,
      indikator_kinerja,
      status,
      visi_misi_id,
      sasaran_strategis,
      indikator_kinerja_utama
    } = req.body;

    // Generate kode if not provided
    let finalKode = kode;
    if (!finalKode) {
      const year = new Date().getFullYear();
      const { data: existing } = await getClient()
        .from('rencana_strategis')
        .select('kode')
        .like('kode', `RS-${year}-%`)
        .order('created_at', { ascending: false })
        .limit(1);
      
      let nextNumber = 1;
      if (existing && existing.length > 0) {
        const match = existing[0].kode.match(/RS-\d{4}-(\d+)/);
        if (match) nextNumber = parseInt(match[1]) + 1;
      }
      finalKode = `RS-${year}-${String(nextNumber).padStart(3, '0')}`;
    }

    // Get organization_id
    let organization_id = req.body.organization_id;
    if (!organization_id && visi_misi_id) {
      const { data: visiMisi } = await getClient()
        .from('visi_misi')
        .select('organization_id')
        .eq('id', visi_misi_id)
        .single();
      organization_id = visiMisi?.organization_id;
    }
    
    if (!organization_id && !req.user.isSuperAdmin && req.user.organizations?.length > 0) {
      organization_id = req.user.organizations[0];
    }

    // Validate organization access
    if (!req.user.isSuperAdmin && organization_id) {
      if (!req.user.organizations?.includes(organization_id)) {
        return res.status(403).json({ error: 'Tidak memiliki akses ke organisasi ini' });
      }
    }

    const insertData = {
      kode: finalKode,
      nama_rencana,
      deskripsi,
      periode_mulai,
      periode_selesai,
      target,
      indikator_kinerja,
      status: status || 'Draft',
      visi_misi_id,
      user_id: req.user.id,
      organization_id,
      sasaran_strategis: JSON.stringify(sasaran_strategis || []),
      indikator_kinerja_utama: JSON.stringify(indikator_kinerja_utama || [])
    };

    const { data, error } = await getClient()
      .from('rencana_strategis')
      .insert(insertData)
      .select('*')
      .single();

    if (error) throw error;
    
    res.json({ message: 'Data berhasil dibuat', data });
  } catch (error) {
    console.error('Renstra create error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    // Check access
    let checkQuery = getClient()
      .from('rencana_strategis')
      .select('organization_id')
      .eq('id', req.params.id);
    
    checkQuery = buildOrganizationFilter(checkQuery, req.user);
    
    const { data: existing, error: checkError } = await checkQuery.single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Data tidak ditemukan atau tidak memiliki akses' });
    }

    const {
      nama_rencana,
      deskripsi,
      periode_mulai,
      periode_selesai,
      target,
      indikator_kinerja,
      status,
      visi_misi_id,
      sasaran_strategis,
      indikator_kinerja_utama
    } = req.body;

    const { data, error } = await getClient()
      .from('rencana_strategis')
      .update({
        nama_rencana,
        deskripsi,
        periode_mulai,
        periode_selesai,
        target,
        indikator_kinerja,
        status,
        visi_misi_id,
        sasaran_strategis: JSON.stringify(sasaran_strategis || []),
        indikator_kinerja_utama: JSON.stringify(indikator_kinerja_utama || []),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    
    res.json({ message: 'Data berhasil diupdate', data });
  } catch (error) {
    console.error('Renstra update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // Check access
    let checkQuery = getClient()
      .from('rencana_strategis')
      .select('organization_id')
      .eq('id', req.params.id);
    
    checkQuery = buildOrganizationFilter(checkQuery, req.user);
    
    const { data: existing, error: checkError } = await checkQuery.single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Data tidak ditemukan atau tidak memiliki akses' });
    }

    const { error } = await getClient()
      .from('rencana_strategis')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    
    res.json({ message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Renstra delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export
router.get('/actions/export', authenticateUser, async (req, res) => {
  try {
    let query = getClient()
      .from('rencana_strategis')
      .select('*, visi_misi(misi)');
    
    query = buildOrganizationFilter(query, req.user);
    
    const { data, error } = await query;

    if (error) throw error;

    const formatted = (data || []).map(item => ({
      kode: item.kode,
      nama_rencana: item.nama_rencana,
      misi: item.visi_misi?.misi || '',
      sasaran_strategis: Array.isArray(item.sasaran_strategis) ? item.sasaran_strategis.join('; ') : '',
      indikator_kinerja_utama: Array.isArray(item.indikator_kinerja_utama) ? item.indikator_kinerja_utama.join('; ') : '',
      target: item.target,
      periode_mulai: item.periode_mulai,
      periode_selesai: item.periode_selesai,
      status: item.status
    }));

    const buffer = exportToExcel(formatted, 'Rencana Strategis');
    sendExcel(res, buffer, 'renstra-export.xlsx');
  } catch (error) {
    console.error('Renstra export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Template download
router.get('/actions/template', authenticateUser, async (req, res) => {
  try {
    const buffer = generateTemplate(
      ['kode', 'nama_rencana', 'misi', 'sasaran_strategis', 'indikator_kinerja_utama', 'target', 'periode_mulai', 'periode_selesai', 'status'],
      'Template Rencana Strategis'
    );
    sendExcel(res, buffer, 'template-renstra.xlsx');
  } catch (error) {
    console.error('Renstra template error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
