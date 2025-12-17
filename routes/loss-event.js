const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { generateKodeLossEvent } = require('../utils/codeGenerator');
const { buildOrganizationFilter } = require('../utils/organization');

// Get all loss events
router.get('/', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('loss_event')
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
      .order('tanggal_kejadian', { ascending: false });
    
    query = buildOrganizationFilter(query, req.user);

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Loss Event error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('loss_event')
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
      .eq('id', req.params.id);
    
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query.single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Loss Event tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('Loss Event error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate kode
router.get('/generate/kode', authenticateUser, async (req, res) => {
  try {
    const kode = await generateKodeLossEvent(req.user.id);
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
      tanggal_kejadian,
      kategori_risiko_id,
      risk_input_id,
      unit_kerja_id,
      deskripsi_kejadian,
      penyebab,
      dampak_finansial,
      dampak_non_finansial,
      tindakan_perbaikan,
      status_penanganan,
      tanggal_penanganan
    } = req.body;

    // Generate kode jika tidak ada
    const finalKode = kode || await generateKodeLossEvent(req.user.id);

    const { data, error } = await supabase
      .from('loss_event')
      .insert({
        user_id: req.user.id,
        organization_id: req.user.organization_id,
        kode: finalKode,
        tanggal_kejadian: tanggal_kejadian || new Date().toISOString().split('T')[0],
        kategori_risiko_id,
        risk_input_id,
        unit_kerja_id,
        deskripsi_kejadian,
        penyebab,
        dampak_finansial: dampak_finansial || 0,
        dampak_non_finansial,
        tindakan_perbaikan,
        status_penanganan: status_penanganan || 'Belum Ditangani',
        tanggal_penanganan
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Loss Event berhasil dibuat', data });
  } catch (error) {
    console.error('Loss Event error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      tanggal_kejadian,
      kategori_risiko_id,
      risk_input_id,
      unit_kerja_id,
      deskripsi_kejadian,
      penyebab,
      dampak_finansial,
      dampak_non_finansial,
      tindakan_perbaikan,
      status_penanganan,
      tanggal_penanganan
    } = req.body;

    let updateQuery = supabase
      .from('loss_event')
      .update({
        tanggal_kejadian,
        kategori_risiko_id,
        risk_input_id,
        unit_kerja_id,
        deskripsi_kejadian,
        penyebab,
        dampak_finansial,
        dampak_non_finansial,
        tindakan_perbaikan,
        status_penanganan,
        tanggal_penanganan,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id);
    
    updateQuery = buildOrganizationFilter(updateQuery, req.user);
    const { data, error } = await updateQuery
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Loss Event tidak ditemukan' });
    res.json({ message: 'Loss Event berhasil diupdate', data });
  } catch (error) {
    console.error('Loss Event error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    let deleteQuery = supabase
      .from('loss_event')
      .delete()
      .eq('id', req.params.id);
    
    deleteQuery = buildOrganizationFilter(deleteQuery, req.user);
    const { error } = await deleteQuery;

    if (error) throw error;
    res.json({ message: 'Loss Event berhasil dihapus' });
  } catch (error) {
    console.error('Loss Event error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

