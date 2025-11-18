const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Get all visi misi
router.get('/', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('visi_misi')
      .select('*');
    query = buildOrganizationFilter(query, req.user);
    query = query.order('tahun', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Visi Misi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('visi_misi')
      .select('*')
      .eq('id', req.params.id);
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query.single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Visi Misi tidak ditemukan' });
    res.json(data);
  } catch (error) {
    console.error('Visi Misi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { visi, misi, tahun, status, organization_id } = req.body;

    // Validate organization access if not superadmin
    if (!req.user.isSuperAdmin && organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke organisasi ini' });
      }
    }

    // Use first organization if not specified and user is not superadmin
    const finalOrgId = organization_id || (req.user.organizations && req.user.organizations.length > 0 ? req.user.organizations[0] : null);

    const { data, error } = await supabase
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
    console.error('Visi Misi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    // First check if user has access
    const { data: existing, error: checkError } = await supabase
      .from('visi_misi')
      .select('organization_id')
      .eq('id', req.params.id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Visi Misi tidak ditemukan' });
    }

    // Check organization access if not superadmin
    if (!req.user.isSuperAdmin && existing.organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(existing.organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
      }
    }

    const { visi, misi, tahun, status } = req.body;

    let query = supabase
      .from('visi_misi')
      .update({ visi, misi, tahun, status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query.select().single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Visi Misi tidak ditemukan' });
    res.json({ message: 'Visi Misi berhasil diupdate', data });
  } catch (error) {
    console.error('Visi Misi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // First check if user has access
    const { data: existing, error: checkError } = await supabase
      .from('visi_misi')
      .select('organization_id')
      .eq('id', req.params.id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Visi Misi tidak ditemukan' });
    }

    // Check organization access if not superadmin
    if (!req.user.isSuperAdmin && existing.organization_id) {
      if (!req.user.organizations || !req.user.organizations.includes(existing.organization_id)) {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke data ini' });
      }
    }

    let query = supabase
      .from('visi_misi')
      .delete()
      .eq('id', req.params.id);
    query = buildOrganizationFilter(query, req.user);
    const { error } = await query;

    if (error) throw error;
    res.json({ message: 'Visi Misi berhasil dihapus' });
  } catch (error) {
    console.error('Visi Misi error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

