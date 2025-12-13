const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { generateKodeEWS } = require('../utils/codeGenerator');
const { buildOrganizationFilter } = require('../utils/organization');

// Get all EWS
router.get('/', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('early_warning_system')
      .select(`
        *,
        master_risk_categories (
          name
        )
      `)
      .order('created_at', { ascending: false });
    
    query = buildOrganizationFilter(query, req.user);

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('EWS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('early_warning_system')
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
    if (!data) return res.status(404).json({ error: 'EWS tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('EWS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate kode
router.get('/generate/kode', authenticateUser, async (req, res) => {
  try {
    const kode = await generateKodeEWS(req.user.id);
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
      nama_sistem,
      kategori_risiko_id,
      indikator_peringatan,
      threshold_nilai,
      nilai_aktual,
      level_peringatan,
      status_aktif,
      frekuensi_monitoring,
      tanggal_monitoring_terakhir,
      notifikasi_email
    } = req.body;

    // Generate kode jika tidak ada
    const finalKode = kode || await generateKodeEWS(req.user.id);

    // Determine level peringatan based on nilai_aktual vs threshold
    let finalLevel = level_peringatan || 'Normal';
    if (nilai_aktual !== null && nilai_aktual !== undefined && threshold_nilai) {
      const percentage = (nilai_aktual / threshold_nilai) * 100;
      if (percentage >= 100) {
        finalLevel = 'Darurat';
      } else if (percentage >= 80) {
        finalLevel = 'Waspada';
      } else if (percentage >= 60) {
        finalLevel = 'Peringatan';
      } else {
        finalLevel = 'Normal';
      }
    }

    const { data, error } = await supabase
      .from('early_warning_system')
      .insert({
        user_id: req.user.id,
        kode: finalKode,
        nama_sistem,
        kategori_risiko_id,
        indikator_peringatan,
        threshold_nilai,
        nilai_aktual,
        level_peringatan: finalLevel,
        status_aktif: status_aktif !== undefined ? status_aktif : true,
        frekuensi_monitoring,
        tanggal_monitoring_terakhir: tanggal_monitoring_terakhir || new Date().toISOString().split('T')[0],
        notifikasi_email: notifikasi_email !== undefined ? notifikasi_email : false
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'EWS berhasil dibuat', data });
  } catch (error) {
    console.error('EWS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      nama_sistem,
      kategori_risiko_id,
      indikator_peringatan,
      threshold_nilai,
      nilai_aktual,
      level_peringatan,
      status_aktif,
      frekuensi_monitoring,
      tanggal_monitoring_terakhir,
      notifikasi_email
    } = req.body;

    // Determine level peringatan based on nilai_aktual vs threshold
    let finalLevel = level_peringatan;
    if (nilai_aktual !== null && nilai_aktual !== undefined && threshold_nilai) {
      const percentage = (nilai_aktual / threshold_nilai) * 100;
      if (percentage >= 100) {
        finalLevel = 'Darurat';
      } else if (percentage >= 80) {
        finalLevel = 'Waspada';
      } else if (percentage >= 60) {
        finalLevel = 'Peringatan';
      } else {
        finalLevel = 'Normal';
      }
    }

    const { data, error } = await supabase
      .from('early_warning_system')
      .update({
        nama_sistem,
        kategori_risiko_id,
        indikator_peringatan,
        threshold_nilai,
        nilai_aktual,
        level_peringatan: finalLevel,
        status_aktif,
        frekuensi_monitoring,
        tanggal_monitoring_terakhir,
        notifikasi_email,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'EWS tidak ditemukan' });
    res.json({ message: 'EWS berhasil diupdate', data });
  } catch (error) {
    console.error('EWS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('early_warning_system')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'EWS berhasil dihapus' });
  } catch (error) {
    console.error('EWS error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

