const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Get all visi misi
router.get('/', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    let query = clientToUse
      .from('visi_misi')
      .select('*')
      .order('tahun', { ascending: false });
    
    // Apply organization filter (superadmin and admin can see all data)
    query = buildOrganizationFilter(query, req.user);

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Visi Misi GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    let query = clientToUse
      .from('visi_misi')
      .select('*')
      .eq('id', req.params.id);
    
    // Apply organization filter (superadmin and admin can see all data)
    query = buildOrganizationFilter(query, req.user);
    
    const { data, error } = await query.single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Visi Misi tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('Visi Misi GET by ID error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create
router.post('/', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    const { visi, misi, tahun, status, organization_id } = req.body;

    // Validate organization access if not superadmin
    if (!req.user.isSuperAdmin && organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke organisasi ini' });
      }
    }

    // Use first organization if not specified and user is not superadmin
    const finalOrgId = organization_id || (req.user.organizations && req.user.organizations.length > 0 ? req.user.organizations[0] : null);

    const { data, error } = await clientToUse
      .from('visi_misi')
      .insert({
        user_id: req.user.id,
        visi,
        misi,
        tahun: tahun || new Date().getFullYear(),
        status: status || 'Aktif',
        organization_id: finalOrgId
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Visi Misi berhasil dibuat', data });
  } catch (error) {
    console.error('Visi Misi POST error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    // First check if record exists and user has access
    let checkQuery = clientToUse
      .from('visi_misi')
      .select('organization_id')
      .eq('id', req.params.id);
    
    // Apply organization filter for access check
    checkQuery = buildOrganizationFilter(checkQuery, req.user);
    
    const { data: existing, error: checkError } = await checkQuery.single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Visi Misi tidak ditemukan atau Anda tidak memiliki akses' });
    }

    const { visi, misi, tahun, status } = req.body;

    const { data, error } = await clientToUse
      .from('visi_misi')
      .update({ visi, misi, tahun, status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Visi Misi tidak ditemukan' });
    res.json({ message: 'Visi Misi berhasil diupdate', data });
  } catch (error) {
    console.error('Visi Misi PUT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    
    // First check if record exists and user has access
    let checkQuery = clientToUse
      .from('visi_misi')
      .select('organization_id')
      .eq('id', req.params.id);
    
    // Apply organization filter for access check
    checkQuery = buildOrganizationFilter(checkQuery, req.user);
    
    const { data: existing, error: checkError } = await checkQuery.single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Visi Misi tidak ditemukan atau Anda tidak memiliki akses' });
    }

    const { error } = await clientToUse
      .from('visi_misi')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Visi Misi berhasil dihapus' });
  } catch (error) {
    console.error('Visi Misi DELETE error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

