const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { generateKodePeluang } = require('../utils/codeGenerator');

// Public endpoint for testing (no auth required) - MUST BE FIRST
router.get('/public', async (req, res) => {
  try {
    console.log('=== PELUANG PUBLIC ENDPOINT ===');
    
    // Import supabaseAdmin directly
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    // Use the same query structure as the main endpoint
    let query = client
      .from('peluang')
      .select(`
        *,
        master_risk_categories (
          name
        )
      `)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Peluang public query error:', error);
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

// Debug endpoint without authentication for testing - MUST BE FIRST
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Debug endpoint accessed for peluang');
    
    const { supabaseAdmin } = require('../config/supabase');
    
    console.log('Using supabaseAdmin:', !!supabaseAdmin);
    
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('peluang')
      .select(`
        *,
        master_risk_categories (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Peluang debug query error:', error);
      throw error;
    }

    console.log('Debug query result:', {
      count: data?.length || 0,
      hasData: data && data.length > 0,
      firstItem: data && data.length > 0 ? {
        id: data[0].id,
        kode: data[0].kode,
        nama_peluang: data[0].nama_peluang,
        organization_id: data[0].organization_id
      } : null
    });

    res.json({
      success: true,
      count: data?.length || 0,
      data: data || [],
      message: 'Peluang debug data retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple endpoint without complex auth for testing - MUST BE SECOND
router.get('/simple', async (req, res) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('peluang')
      .select(`
        *,
        master_risk_categories (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('Simple endpoint - returning data:', data?.length || 0, 'items');
    res.json(data || []);
  } catch (error) {
    console.error('Simple peluang error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public endpoint for testing (no auth required) - MUST BE THIRD
router.get('/debug', async (req, res) => {
  try {
    console.log('=== PELUANG DEBUG ENDPOINT ===');
    
    // Import supabaseAdmin directly
    const { supabaseAdmin } = require('../config/supabase');
    
    console.log('Using supabaseAdmin:', !!supabaseAdmin);
    
    const client = supabaseAdmin || supabase;
    
    // Use the same query structure as the main endpoint
    let query = client
      .from('peluang')
      .select(`
        *,
        master_risk_categories (
          name
        )
      `)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Peluang debug query error:', error);
      throw error;
    }

    console.log('Debug query result:', {
      count: data?.length || 0,
      hasData: data && data.length > 0,
      firstItem: data && data.length > 0 ? {
        id: data[0].id,
        kode: data[0].kode,
        nama_peluang: data[0].nama_peluang,
        organization_id: data[0].organization_id
      } : null
    });

    res.json({
      success: true,
      count: data?.length || 0,
      data: data || [],
      message: 'Peluang debug data retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all peluang
router.get('/', authenticateUser, async (req, res) => {
  try {
    console.log('=== PELUANG REQUEST ===');
    console.log('User info:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      organizations: req.user.organizations
    });

    // Use supabaseAdmin for better reliability
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;

    let query = client
      .from('peluang')
      .select(`
        *,
        master_risk_categories (
          name
        )
      `)
      .order('created_at', { ascending: false });

    // NEW APPROACH: Filter by organization_id only, ignore user_id
    const isAdminOrSuper = req.user.isSuperAdmin || 
                          req.user.role === 'superadmin' || 
                          req.user.role === 'admin';

    if (isAdminOrSuper) {
      console.log('Admin/Super admin - showing all data');
      // Admin can see all data, no filter needed
    } else {
      // Regular users - filter by organization_id instead of user_id
      if (req.user.organizations && req.user.organizations.length > 0) {
        console.log('Regular user - filtering by organization_id:', req.user.organizations);
        query = query.in('organization_id', req.user.organizations);
      } else {
        console.log('Regular user - no organizations, showing all data');
        // If no organization info, show all data (fallback)
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Peluang query error:', error);
      throw error;
    }

    console.log('Query result:', {
      count: data?.length || 0,
      hasData: data && data.length > 0,
      firstItem: data && data.length > 0 ? {
        id: data[0].id,
        kode: data[0].kode,
        nama_peluang: data[0].nama_peluang,
        organization_id: data[0].organization_id
      } : null
    });
    console.log('=== END REQUEST ===');

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

    // Use supabaseAdmin for better reliability
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;

    const { data, error } = await client
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
    // Use supabaseAdmin for better reliability
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;

    const { error } = await client
      .from('peluang')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Peluang berhasil dihapus' });
  } catch (error) {
    console.error('Peluang error:', error);
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;

