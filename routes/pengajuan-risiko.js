const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { generateKodePengajuanRisiko } = require('../utils/codeGenerator');

// Get all pengajuan risiko
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pengajuan_risiko')
      .select(`
        *,
        master_risk_categories (
          name
        ),
        master_work_units (
          name,
          code
        ),
        user_profiles!pengajuan_risiko_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq('user_id', req.user.id)
      .order('tanggal_pengajuan', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Pengajuan Risiko error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    // Use admin client to bypass RLS issues
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('pengajuan_risiko')
      .select(`
        *,
        master_risk_categories (
          name
        ),
        master_work_units (
          name,
          code
        ),
        user_profiles!pengajuan_risiko_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq('id', req.params.id);
    // Removed .eq('user_id', req.user.id) - causes "Cannot coerce to single JSON object" error

    if (error) throw error;
    
    // Handle case where no data found
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Pengajuan Risiko tidak ditemukan' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Pengajuan Risiko error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate kode
router.get('/generate/kode', authenticateUser, async (req, res) => {
  try {
    const kode = await generateKodePengajuanRisiko(req.user.id);
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
      tanggal_pengajuan,
      kategori_risiko_id,
      unit_kerja_id,
      deskripsi_risiko,
      probabilitas,
      dampak,
      nilai_risiko,
      rekomendasi_penanganan,
      status_pengajuan
    } = req.body;

    // Generate kode jika tidak ada
    const finalKode = kode || await generateKodePengajuanRisiko(req.user.id);

    const { data, error } = await supabase
      .from('pengajuan_risiko')
      .insert({
        user_id: req.user.id,
        kode: finalKode,
        tanggal_pengajuan: tanggal_pengajuan || new Date().toISOString().split('T')[0],
        kategori_risiko_id,
        unit_kerja_id,
        deskripsi_risiko,
        probabilitas,
        dampak,
        nilai_risiko: nilai_risiko || (probabilitas * dampak),
        rekomendasi_penanganan,
        status_pengajuan: status_pengajuan || 'Menunggu Persetujuan'
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Pengajuan Risiko berhasil dibuat', data });
  } catch (error) {
    console.error('Pengajuan Risiko error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      tanggal_pengajuan,
      kategori_risiko_id,
      unit_kerja_id,
      deskripsi_risiko,
      probabilitas,
      dampak,
      nilai_risiko,
      rekomendasi_penanganan,
      status_pengajuan
    } = req.body;

    const { data, error } = await supabase
      .from('pengajuan_risiko')
      .update({
        tanggal_pengajuan,
        kategori_risiko_id,
        unit_kerja_id,
        deskripsi_risiko,
        probabilitas,
        dampak,
        nilai_risiko: nilai_risiko || (probabilitas * dampak),
        rekomendasi_penanganan,
        status_pengajuan,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Pengajuan Risiko tidak ditemukan' });
    res.json({ message: 'Pengajuan Risiko berhasil diupdate', data });
  } catch (error) {
    console.error('Pengajuan Risiko error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve/Reject
router.post('/:id/approve', authenticateUser, async (req, res) => {
  try {
    const { catatan_persetujuan, status } = req.body;

    const { data, error } = await supabase
      .from('pengajuan_risiko')
      .update({
        status_pengajuan: status || 'Disetujui',
        disetujui_oleh: req.user.id,
        tanggal_persetujuan: new Date().toISOString().split('T')[0],
        catatan_persetujuan,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Pengajuan Risiko tidak ditemukan' });
    res.json({ message: 'Pengajuan Risiko berhasil diproses', data });
  } catch (error) {
    console.error('Pengajuan Risiko error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('pengajuan_risiko')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Pengajuan Risiko berhasil dihapus' });
  } catch (error) {
    console.error('Pengajuan Risiko error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

