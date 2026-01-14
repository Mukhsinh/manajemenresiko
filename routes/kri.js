const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

// ============================================================================
// IMPORTANT: Route order matters! Specific routes MUST come before /:id
// ============================================================================

// Debug endpoint without authentication for testing
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Debug endpoint accessed for kri');
    
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (name),
        master_work_units (name, code),
        risk_inputs (kode_risiko)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json({ 
      success: true, 
      data: data || [], 
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simple endpoint without auth
router.get('/simple', async (req, res) => {
  try {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (name),
        master_work_units (name, code),
        risk_inputs (kode_risiko)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Simple KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public endpoint (no auth)
router.get('/public', async (req, res) => {
  try {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (name),
        master_work_units (name, code),
        risk_inputs (kode_risiko)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Public endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint without auth (fallback for frontend)
router.get('/test-no-auth', async (req, res) => {
  try {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (name),
        master_work_units (name, code),
        risk_inputs (kode_risiko)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Test no-auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID without auth (fallback for frontend)
router.get('/by-id/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log('=== KRI GET BY ID (no auth) ===', id);
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (name),
        master_work_units (name, code),
        risk_inputs (kode_risiko)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'KRI tidak ditemukan' });
      }
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'KRI tidak ditemukan' });
    
    res.json(data);
  } catch (error) {
    console.error('KRI get by ID (no auth) error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate kode - MUST be before /:id
router.get('/generate/kode', authenticateUser, async (req, res) => {
  try {
    const kode = `KRI-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    res.json({ kode });
  } catch (error) {
    console.error('Generate kode error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all KRI (with auth)
router.get('/', authenticateUser, async (req, res) => {
  try {
    console.log('=== KRI GET ALL ===');
    
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (name),
        master_work_units (name, code),
        risk_inputs (kode_risiko)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('KRI count:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new KRI
router.post('/', authenticateUser, async (req, res) => {
  try {
    console.log('=== KRI CREATE ===');
    
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

    const finalKode = kode || `KRI-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    // Determine status
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

    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('key_risk_indicator')
      .insert({
        user_id: req.user.id,
        organization_id: req.user.organization_id,
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
    
    console.log('KRI created:', finalKode);
    res.json({ message: 'KRI berhasil dibuat', data });
  } catch (error) {
    console.error('KRI create error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID - MUST be after all specific GET routes
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const id = req.params.id;
    console.log('=== KRI GET BY ID ===', id);
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.log('Invalid UUID format:', id);
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (name),
        master_work_units (name, code),
        risk_inputs (kode_risiko)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('KRI get by ID error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'KRI tidak ditemukan' });
      }
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'KRI tidak ditemukan' });
    
    console.log('KRI found:', data.kode);
    res.json(data);
  } catch (error) {
    console.error('KRI get by ID error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update KRI
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    console.log('=== KRI UPDATE ===', req.params.id);
    
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

    // Determine status
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

    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
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
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'KRI tidak ditemukan' });
    
    console.log('KRI updated:', data.kode);
    res.json({ message: 'KRI berhasil diupdate', data });
  } catch (error) {
    console.error('KRI update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete KRI
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    console.log('=== KRI DELETE ===', req.params.id);
    
    const client = supabaseAdmin || supabase;
    
    // Check if exists first
    const { data: existing, error: checkError } = await client
      .from('key_risk_indicator')
      .select('id, kode')
      .eq('id', req.params.id)
      .single();
    
    if (checkError || !existing) {
      return res.status(404).json({ error: 'KRI tidak ditemukan' });
    }
    
    // Delete
    const { error } = await client
      .from('key_risk_indicator')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    
    console.log('KRI deleted:', existing.kode);
    res.json({ message: 'KRI berhasil dihapus', deletedKode: existing.kode });
  } catch (error) {
    console.error('KRI delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
