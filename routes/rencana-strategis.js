const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { generateKodeRencanaStrategis } = require('../utils/codeGenerator');
const { exportToExcel, generateTemplate } = require('../utils/exportHelper');
const { buildOrganizationFilter } = require('../utils/organization');

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
    let query = supabase
      .from('rencana_strategis')
      .select('*, visi_misi(visi, misi, tahun)');
    query = buildOrganizationFilter(query, req.user);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Rencana Strategis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('rencana_strategis')
      .select('*')
      .eq('id', req.params.id);
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
    const kode = await generateKodeRencanaStrategis(req.user.id);
    res.json({ kode });
  } catch (error) {
    console.error('Generate kode error:', error);
    res.status(500).json({ error: error.message });
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

    // Generate kode jika tidak ada
    const finalKode = kode || await generateKodeRencanaStrategis(req.user.id);

    // Get organization_id from visi_misi if not provided
    let organization_id = req.body.organization_id;
    if (!organization_id && visi_misi_id) {
      const { data: visiMisi } = await supabase
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

    const { data, error } = await supabase
      .from('rencana_strategis')
      .insert({
        user_id: req.user.id,
        kode: finalKode,
        nama_rencana,
        deskripsi,
        periode_mulai,
        periode_selesai,
        target,
        indikator_kinerja,
        status: status || 'Draft',
        visi_misi_id,
        organization_id,
        sasaran_strategis: JSON.stringify(sasaran_strategis || []),
        indikator_kinerja_utama: JSON.stringify(indikator_kinerja_utama || [])
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Rencana Strategis berhasil dibuat', data });
  } catch (error) {
    console.error('Rencana Strategis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    // First check if user has access
    const { data: existing, error: checkError } = await supabase
      .from('rencana_strategis')
      .select('organization_id')
      .eq('id', req.params.id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Rencana Strategis tidak ditemukan' });
    }

    // Check organization access if not superadmin
    if (!req.user.isSuperAdmin && existing.organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(existing.organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
      }
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

    let query = supabase
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
      .eq('id', req.params.id);
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query.select().single();

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
    const { error } = await supabase
      .from('rencana_strategis')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

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
    const { data, error } = await supabase
      .from('rencana_strategis')
      .select('*, visi_misi(misi)')
      .eq('user_id', req.user.id);

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
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Data import tidak valid' });
    }

    const { data: visiMisiList, error: visiError } = await supabase
      .from('visi_misi')
      .select('id, misi')
      .eq('user_id', req.user.id);

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

      payload.push({
        user_id: req.user.id,
        kode: item.kode || await generateKodeRencanaStrategis(req.user.id),
        nama_rencana: item.nama_rencana || item['Nama Rencana'] || '',
        deskripsi: item.deskripsi || '',
        periode_mulai: item.periode_mulai || null,
        periode_selesai: item.periode_selesai || null,
        target: item.target || '',
        indikator_kinerja: item.indikator_kinerja || '',
        status: item.status || 'Draft',
        visi_misi_id: mission?.id || null,
        sasaran_strategis: JSON.stringify(sasaran),
        indikator_kinerja_utama: JSON.stringify(indikator)
      });
    }

    const { error } = await supabase
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


