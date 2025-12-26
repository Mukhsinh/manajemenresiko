const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { generateKodeRencanaStrategis } = require('../utils/codeGenerator');
const { exportToExcel, generateTemplate } = require('../utils/exportHelper');
const { buildOrganizationFilter } = require('../utils/organization');

// Public endpoint for testing (no auth required) - MUST BE FIRST
router.get('/public', async (req, res) => {
  try {
    console.log('=== RENCANA STRATEGIS PUBLIC ENDPOINT ===');
    
    const clientToUse = supabaseAdmin || supabase;
    
    let query = clientToUse
      .from('rencana_strategis')
      .select('id, kode, nama_rencana, deskripsi, periode_mulai, periode_selesai, target, indikator_kinerja, status, visi_misi_id, user_id, organization_id, sasaran_strategis, indikator_kinerja_utama, created_at, updated_at, visi_misi(id, visi, misi, tahun)')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Rencana strategis public query error:', error);
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

// Public generate kode endpoint (no auth required)
router.get('/generate/kode/public', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    
    // Get the highest number for current year
    const { data: maxData, error: maxError } = await (supabaseAdmin || supabase)
      .rpc('get_max_rencana_strategis_number', { year_param: year });
    
    if (maxError) {
      console.warn('Error getting max number, using fallback:', maxError);
      // Fallback: query directly
      const { data: fallbackData } = await (supabaseAdmin || supabase)
        .from('rencana_strategis')
        .select('kode')
        .like('kode', `RS-${year}-%`)
        .order('created_at', { ascending: false })
        .limit(1);
      
      let nextNumber = 1;
      if (fallbackData && fallbackData.length > 0) {
        const lastKode = fallbackData[0].kode;
        const match = lastKode.match(/RS-\d{4}-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      const kode = `RS-${year}-${String(nextNumber).padStart(3, '0')}`;
      return res.json({ kode });
    }
    
    const nextNumber = (maxData || 0) + 1;
    const kode = `RS-${year}-${String(nextNumber).padStart(3, '0')}`;
    res.json({ kode });
  } catch (error) {
    console.error('Generate kode public error:', error);
    // Ultimate fallback
    const year = new Date().getFullYear();
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const kode = `RS-${year}-${random}`;
    res.json({ kode });
  }
});

function sendExcel(res, buffer, filename) {
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.send(buffer);
}

// Get all rencana strategis
router.get('/', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    let query = clientToUse
      .from('rencana_strategis')
      .select('id, kode, nama_rencana, deskripsi, periode_mulai, periode_selesai, target, indikator_kinerja, status, visi_misi_id, user_id, organization_id, sasaran_strategis, indikator_kinerja_utama, created_at, updated_at, visi_misi(id, visi, misi, tahun)');
    
    // Apply organization filter (superadmin and admin can see all data)
    query = buildOrganizationFilter(query, req.user);
    
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    
    console.log(`Rencana Strategis: Returning ${(data || []).length} records`);
    res.json(data || []);
  } catch (error) {
    console.error('Rencana Strategis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    let query = clientToUse
      .from('rencana_strategis')
      .select('*')
      .eq('id', req.params.id);
    
    // Apply organization filter (superadmin and admin can see all data)
    query = buildOrganizationFilter(query, req.user);
    
    const { data, error } = await query.single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Rencana Strategis tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('Rencana Strategis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate kode
router.get('/generate/kode', authenticateUser, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    
    // Get the highest number for current year
    const { data: maxData, error: maxError } = await (supabaseAdmin || supabase)
      .rpc('get_max_rencana_strategis_number', { year_param: year });
    
    if (maxError) {
      console.warn('Error getting max number, using fallback:', maxError);
      // Fallback: query directly
      const { data: fallbackData } = await (supabaseAdmin || supabase)
        .from('rencana_strategis')
        .select('kode')
        .like('kode', `RS-${year}-%`)
        .order('created_at', { ascending: false })
        .limit(1);
      
      let nextNumber = 1;
      if (fallbackData && fallbackData.length > 0) {
        const lastKode = fallbackData[0].kode;
        const match = lastKode.match(/RS-\d{4}-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      const kode = `RS-${year}-${String(nextNumber).padStart(3, '0')}`;
      return res.json({ kode });
    }
    
    const nextNumber = (maxData || 0) + 1;
    const kode = `RS-${year}-${String(nextNumber).padStart(3, '0')}`;
    res.json({ kode });
  } catch (error) {
    console.error('Generate kode error:', error);
    // Ultimate fallback
    const year = new Date().getFullYear();
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const kode = `RS-${year}-${random}`;
    res.json({ kode });
  }
});

// Create
router.post('/', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
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

    // Generate kode jika tidak ada
    let finalKode = kode || await generateKodeRencanaStrategis(req.user.id);

    // Get organization_id from visi_misi if not provided
    let organization_id = req.body.organization_id;
    if (!organization_id && visi_misi_id) {
      const { data: visiMisi } = await clientToUse
        .from('visi_misi')
        .select('organization_id')
        .eq('id', visi_misi_id)
        .single();
      organization_id = visiMisi?.organization_id;
    }

    // Use first organization if not specified and user is not superadmin
    if (!organization_id && !req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
      organization_id = req.user.organizations[0];
    }

    // Validate organization access if not superadmin
    if (!req.user.isSuperAdmin && organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke organisasi ini' });
      }
    }

    // Retry logic for duplicate key errors
    let attempts = 0;
    let data = null;
    let insertError = null;

    while (attempts < 3) {
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

      const result = await clientToUse
        .from('rencana_strategis')
        .insert(insertData)
        .select('*')
        .single();

      if (!result.error) {
        data = result.data;
        break;
      }

      insertError = result.error;

      // Check if it's a duplicate key error
      if (result.error.message && result.error.message.includes('duplicate key')) {
        console.log(`Duplicate key detected on attempt ${attempts + 1}, regenerating code...`);
        // Generate a new code and retry
        finalKode = await generateKodeRencanaStrategis(req.user.id);
        attempts++;
      } else {
        // Different error, throw it
        throw result.error;
      }
    }

    if (insertError && !data) {
      throw insertError;
    }

    res.json({ message: 'Rencana Strategis berhasil dibuat', data });
  } catch (error) {
    console.error('Rencana Strategis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    // First check if record exists and user has access
    let checkQuery = clientToUse
      .from('rencana_strategis')
      .select('organization_id')
      .eq('id', req.params.id);
    
    // Apply organization filter for access check
    checkQuery = buildOrganizationFilter(checkQuery, req.user);
    
    const { data: existing, error: checkError } = await checkQuery.single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Rencana Strategis tidak ditemukan atau Anda tidak memiliki akses' });
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

    const { data, error } = await clientToUse
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
    if (!data) return res.status(404).json({ error: 'Rencana Strategis tidak ditemukan' });
    res.json({ message: 'Rencana Strategis berhasil diupdate', data });
  } catch (error) {
    console.error('Rencana Strategis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    // First check if record exists and user has access
    let checkQuery = clientToUse
      .from('rencana_strategis')
      .select('organization_id')
      .eq('id', req.params.id);
    
    // Apply organization filter for access check
    checkQuery = buildOrganizationFilter(checkQuery, req.user);
    
    const { data: existing, error: checkError } = await checkQuery.single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Rencana Strategis tidak ditemukan atau Anda tidak memiliki akses' });
    }

    const { error } = await clientToUse
      .from('rencana_strategis')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Rencana Strategis berhasil dihapus' });
  } catch (error) {
    console.error('Rencana Strategis error:', error);
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
    sendExcel(res, buffer, 'template-rencana-strategis.xlsx');
  } catch (error) {
    console.error('Template rencana strategis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export
router.get('/actions/export', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    let query = clientToUse
      .from('rencana_strategis')
      .select('*, visi_misi(misi)');
    
    // Apply organization filter for export
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
    sendExcel(res, buffer, 'rencana-strategis.xlsx');
  } catch (error) {
    console.error('Export rencana strategis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import
router.post('/actions/import', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Data import tidak valid' });
    }

    // Get visi_misi based on organization
    let visiMisiQuery = clientToUse
      .from('visi_misi')
      .select('id, misi, organization_id');
    
    // Apply organization filter for visi misi access
    visiMisiQuery = buildOrganizationFilter(visiMisiQuery, req.user);
    
    const { data: visiMisiList, error: visiError } = await visiMisiQuery;

    if (visiError) throw visiError;
    const missions = visiMisiList || [];

    const payload = [];
    for (const item of items) {
      const missionName = item.misi || item.Misi;
      const mission = missions.find(m => m.misi === missionName);
      const sasaran = (item.sasaran_strategis || item['Sasaran Strategis'] || '')
        .toString()
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);
      const indikator = (item.indikator_kinerja_utama || item['Indikator Kinerja Utama'] || '')
        .toString()
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);

      // Get organization_id from mission if available
      let org_id = null;
      if (mission?.id) {
        const { data: visiMisiData } = await clientToUse
          .from('visi_misi')
          .select('organization_id')
          .eq('id', mission.id)
          .single();
        org_id = visiMisiData?.organization_id;
      }
      
      // Use first organization if not found
      if (!org_id && req.user.organizations && req.user.organizations.length > 0) {
        org_id = req.user.organizations[0];
      }
      
      payload.push({
        kode: item.kode || await generateKodeRencanaStrategis(req.user.id),
        nama_rencana: item.nama_rencana || item['Nama Rencana'] || '',
        deskripsi: item.deskripsi || '',
        periode_mulai: item.periode_mulai || null,
        periode_selesai: item.periode_selesai || null,
        target: item.target || '',
        indikator_kinerja: item.indikator_kinerja || '',
        status: item.status || 'Draft',
        visi_misi_id: mission?.id || null,
        user_id: req.user.id,
        organization_id: org_id,
        sasaran_strategis: JSON.stringify(sasaran),
        indikator_kinerja_utama: JSON.stringify(indikator)
      });
    }

    const { error } = await clientToUse
      .from('rencana_strategis')
      .upsert(payload, { onConflict: 'kode' });

    if (error) throw error;
    res.json({ message: 'Import rencana strategis berhasil' });
  } catch (error) {
    console.error('Import rencana strategis error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


