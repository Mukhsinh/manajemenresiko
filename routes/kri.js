const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { generateKodeKRI } = require('../utils/codeGenerator');
const { buildOrganizationFilter } = require('../utils/organization');

// Get all KRI
router.get('/', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (
          name
        ),
        master_work_units (
          name,
          code
        ),
        risk_inputs (
          kode_risiko
        )
      `)
      .order('created_at', { ascending: false });
    
    query = buildOrganizationFilter(query, req.user);

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (
          name
        ),
        master_work_units (
          name,
          code
        ),
        risk_inputs (
          kode_risiko
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'KRI tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate kode
router.get('/generate/kode', authenticateUser, async (req, res) => {
  try {
    const kode = await generateKodeKRI(req.user.id);
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
      nama_indikator,
      kategori_risiko_id,
      risk_input_id,
      unit_kerja_id,
      metode_pengukuran,
      target_nilai,
      nilai_aktual,
      batas_aman,
      batas_peringatan,
      batas_kritis,
      status_indikator,
      periode_pengukuran,
      tanggal_pengukuran_terakhir
    } = req.body;

    // Generate kode jika tidak ada
    const finalKode = kode || await generateKodeKRI(req.user.id);

    // Determine status based on nilai_aktual
    let finalStatus = status_indikator || 'Aman';
    if (nilai_aktual !== null && nilai_aktual !== undefined) {
      if (batas_kritis && nilai_aktual >= batas_kritis) {
        finalStatus = 'Kritis';
      } else if (batas_peringatan && nilai_aktual >= batas_peringatan) {
        finalStatus = 'Hati-hati';
      } else if (batas_aman && nilai_aktual <= batas_aman) {
        finalStatus = 'Aman';
      }
    }

    const { data, error } = await supabase
      .from('key_risk_indicator')
      .insert({
        user_id: req.user.id,
        kode: finalKode,
        nama_indikator,
        kategori_risiko_id,
        risk_input_id,
        unit_kerja_id,
        metode_pengukuran,
        target_nilai,
        nilai_aktual,
        batas_aman,
        batas_peringatan,
        batas_kritis,
        status_indikator: finalStatus,
        periode_pengukuran,
        tanggal_pengukuran_terakhir: tanggal_pengukuran_terakhir || new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'KRI berhasil dibuat', data });
  } catch (error) {
    console.error('KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      nama_indikator,
      kategori_risiko_id,
      risk_input_id,
      unit_kerja_id,
      metode_pengukuran,
      target_nilai,
      nilai_aktual,
      batas_aman,
      batas_peringatan,
      batas_kritis,
      status_indikator,
      periode_pengukuran,
      tanggal_pengukuran_terakhir
    } = req.body;

    // Determine status based on nilai_aktual
    let finalStatus = status_indikator;
    if (nilai_aktual !== null && nilai_aktual !== undefined) {
      if (batas_kritis && nilai_aktual >= batas_kritis) {
        finalStatus = 'Kritis';
      } else if (batas_peringatan && nilai_aktual >= batas_peringatan) {
        finalStatus = 'Hati-hati';
      } else if (batas_aman && nilai_aktual <= batas_aman) {
        finalStatus = 'Aman';
      }
    }

    const { data, error } = await supabase
      .from('key_risk_indicator')
      .update({
        nama_indikator,
        kategori_risiko_id,
        risk_input_id,
        unit_kerja_id,
        metode_pengukuran,
        target_nilai,
        nilai_aktual,
        batas_aman,
        batas_peringatan,
        batas_kritis,
        status_indikator: finalStatus,
        periode_pengukuran,
        tanggal_pengukuran_terakhir,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'KRI tidak ditemukan' });
    res.json({ message: 'KRI berhasil diupdate', data });
  } catch (error) {
    console.error('KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('key_risk_indicator')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'KRI berhasil dihapus' });
  } catch (error) {
    console.error('KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

