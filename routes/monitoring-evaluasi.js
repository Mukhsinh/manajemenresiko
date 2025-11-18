const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

// Get all monitoring evaluasi
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('monitoring_evaluasi_risiko')
      .select(`
        *,
        risk_inputs (
          kode_risiko,
          sasaran
        )
      `)
      .eq('user_id', req.user.id)
      .order('tanggal_monitoring', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Monitoring Evaluasi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('monitoring_evaluasi_risiko')
      .select(`
        *,
        risk_inputs (
          kode_risiko,
          sasaran
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Monitoring Evaluasi tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('Monitoring Evaluasi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      risk_input_id,
      tanggal_monitoring,
      status_risiko,
      tingkat_probabilitas,
      tingkat_dampak,
      nilai_risiko,
      tindakan_mitigasi,
      progress_mitigasi,
      evaluasi,
      status
    } = req.body;

    const { data, error } = await supabase
      .from('monitoring_evaluasi_risiko')
      .insert({
        user_id: req.user.id,
        risk_input_id,
        tanggal_monitoring: tanggal_monitoring || new Date().toISOString().split('T')[0],
        status_risiko,
        tingkat_probabilitas,
        tingkat_dampak,
        nilai_risiko: nilai_risiko || (tingkat_probabilitas * tingkat_dampak),
        tindakan_mitigasi,
        progress_mitigasi: progress_mitigasi || 0,
        evaluasi,
        status: status || 'Aktif'
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Monitoring Evaluasi berhasil dibuat', data });
  } catch (error) {
    console.error('Monitoring Evaluasi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      tanggal_monitoring,
      status_risiko,
      tingkat_probabilitas,
      tingkat_dampak,
      nilai_risiko,
      tindakan_mitigasi,
      progress_mitigasi,
      evaluasi,
      status
    } = req.body;

    const updateData = {
      tanggal_monitoring,
      status_risiko,
      tingkat_probabilitas,
      tingkat_dampak,
      nilai_risiko: nilai_risiko || (tingkat_probabilitas * tingkat_dampak),
      tindakan_mitigasi,
      progress_mitigasi,
      evaluasi,
      status,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('monitoring_evaluasi_risiko')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Monitoring Evaluasi tidak ditemukan' });
    res.json({ message: 'Monitoring Evaluasi berhasil diupdate', data });
  } catch (error) {
    console.error('Monitoring Evaluasi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('monitoring_evaluasi_risiko')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Monitoring Evaluasi berhasil dihapus' });
  } catch (error) {
    console.error('Monitoring Evaluasi error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

