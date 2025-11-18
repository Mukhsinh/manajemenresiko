const express = require('express');
const multer = require('multer');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

const readClient = supabaseAdmin || supabase;
const writeClient = supabaseAdmin || supabase;

const ensureClient = () => {
  if (!readClient || !writeClient) {
    throw new Error('Supabase client belum dikonfigurasi. Pastikan variabel lingkungan Supabase terisi.');
  }
};

// Get all pengaturan
router.get('/', authenticateUser, async (req, res) => {
  try {
    ensureClient();
    const { data, error } = await readClient
      .from('pengaturan_aplikasi')
      .select('*')
      .order('kategori', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Pengaturan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by key
router.get('/:kunci', authenticateUser, async (req, res) => {
  try {
    ensureClient();
    const { data, error } = await readClient
      .from('pengaturan_aplikasi')
      .select('*')
      .eq('kunci_pengaturan', req.params.kunci)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Pengaturan tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('Pengaturan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:kunci', authenticateUser, async (req, res) => {
  try {
    ensureClient();

    const { nilai_pengaturan } = req.body;

    const payload = {
      kunci_pengaturan: req.params.kunci,
      nilai_pengaturan,
      user_id: req.user.id,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await writeClient
      .from('pengaturan_aplikasi')
      .upsert(payload, {
        onConflict: 'kunci_pengaturan'
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Pengaturan berhasil diupdate', data });
  } catch (error) {
    console.error('Pengaturan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk update
router.put('/', authenticateUser, async (req, res) => {
  try {
    ensureClient();

    const { pengaturan } = req.body; // Array of {kunci_pengaturan, nilai_pengaturan}

    if (!Array.isArray(pengaturan) || pengaturan.length === 0) {
      return res.status(400).json({ error: 'Daftar pengaturan tidak boleh kosong' });
    }

    const timestamp = new Date().toISOString();

    const upsertPayload = pengaturan.map((p) => ({
      kunci_pengaturan: p.kunci_pengaturan,
      nilai_pengaturan: p.nilai_pengaturan,
      user_id: req.user.id,
      updated_at: timestamp
    }));

    const { error } = await writeClient
      .from('pengaturan_aplikasi')
      .upsert(upsertPayload, {
        onConflict: 'kunci_pengaturan'
      });

    if (error) throw error;

    res.json({ message: 'Pengaturan berhasil diupdate' });
  } catch (error) {
    console.error('Pengaturan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload logo instansi
router.post('/logo', authenticateUser, upload.single('logo'), async (req, res) => {
  try {
    ensureClient();

    if (!req.file) {
      return res.status(400).json({ error: 'File logo tidak ditemukan' });
    }
    const base64 = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    const { error } = await writeClient
      .from('pengaturan_aplikasi')
      .update({
        nilai_pengaturan: dataUri,
        user_id: req.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('kunci_pengaturan', 'logo_instansi');

    if (error) throw error;
    res.json({ message: 'Logo berhasil diunggah', logo: dataUri });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

