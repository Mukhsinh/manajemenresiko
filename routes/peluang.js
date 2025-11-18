const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { generateKodePeluang } = require('../utils/codeGenerator');

// Get all peluang
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('peluang')
      .select(`
        *,
        master_risk_categories (
          name
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Peluang error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('peluang')
      .select(`
        *,
        master_risk_categories (
          name
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Peluang tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('Peluang error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate kode
router.get('/generate/kode', authenticateUser, async (req, res) => {
  try {
    const kode = await generateKodePeluang(req.user.id);
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
      nama_peluang,
      kategori_peluang_id,
      deskripsi,
      probabilitas,
      dampak_positif,
      nilai_peluang,
      strategi_pemanfaatan,
      pemilik_peluang,
      status
    } = req.body;

    // Generate kode jika tidak ada
    const finalKode = kode || await generateKodePeluang(req.user.id);

    const { data, error } = await supabase
      .from('peluang')
      .insert({
        user_id: req.user.id,
        kode: finalKode,
        nama_peluang,
        kategori_peluang_id,
        deskripsi,
        probabilitas,
        dampak_positif,
        nilai_peluang: nilai_peluang || (probabilitas * dampak_positif),
        strategi_pemanfaatan,
        pemilik_peluang,
        status: status || 'Draft'
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Peluang berhasil dibuat', data });
  } catch (error) {
    console.error('Peluang error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      nama_peluang,
      kategori_peluang_id,
      deskripsi,
      probabilitas,
      dampak_positif,
      nilai_peluang,
      strategi_pemanfaatan,
      pemilik_peluang,
      status
    } = req.body;

    const { data, error } = await supabase
      .from('peluang')
      .update({
        nama_peluang,
        kategori_peluang_id,
        deskripsi,
        probabilitas,
        dampak_positif,
        nilai_peluang: nilai_peluang || (probabilitas * dampak_positif),
        strategi_pemanfaatan,
        pemilik_peluang,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Peluang tidak ditemukan' });
    res.json({ message: 'Peluang berhasil diupdate', data });
  } catch (error) {
    console.error('Peluang error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('peluang')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Peluang berhasil dihapus' });
  } catch (error) {
    console.error('Peluang error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

