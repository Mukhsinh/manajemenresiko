const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

async function getUserOrganizations(userId) {
  const { data, error } = await supabase
    .from('organization_users')
    .select('organization_id, role, organizations (id, name)')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return (data || []).map((entry) => ({
    organization_id: entry.organization_id,
    role: entry.role || 'member',
    organization: entry.organizations || null
  }));
}

function simplifyOrganizations(organizations) {
  return organizations.map((org) => ({
    id: org.organization_id,
    name: org.organization?.name || 'Organisasi',
    role: org.role
  }));
}

async function getOrganizationMembers(organizationId) {
  const { data, error } = await supabase
    .from('organization_users')
    .select('user_id, user_profiles (full_name)')
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  return (data || []).map((entry) => ({
    user_id: entry.user_id,
    full_name: entry.user_profiles?.full_name || 'Pengguna'
  }));
}

async function ensureOrganizationAccess(userId, requestedOrgId) {
  const organizations = await getUserOrganizations(userId);
  if (!organizations.length) {
    return { organizations, activeOrganizationId: null };
  }

  const allowedIds = organizations.map((org) => org.organization_id);
  const activeOrganizationId = requestedOrgId && allowedIds.includes(requestedOrgId)
    ? requestedOrgId
    : allowedIds[0];

  return { organizations, activeOrganizationId };
}

router.get('/context', authenticateUser, async (req, res) => {
  try {
    const { organizations, activeOrganizationId } = await ensureOrganizationAccess(
      req.user.id,
      req.query.organizationId
    );

    if (!activeOrganizationId) {
      return res.status(400).json({ error: 'User belum tergabung organisasi manapun.' });
    }

    res.json({
      organizationId: activeOrganizationId,
      organizations: simplifyOrganizations(organizations)
    });
  } catch (error) {
    console.error('Chat context error:', error);
    res.status(500).json({ error: 'Gagal mengambil konteks chat.' });
  }
});

router.get('/messages', authenticateUser, async (req, res) => {
  try {
    const requestedOrgId = req.query.organizationId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const { organizations, activeOrganizationId } = await ensureOrganizationAccess(
      req.user.id,
      requestedOrgId
    );

    if (!activeOrganizationId) {
      return res.status(400).json({ error: 'User belum tergabung organisasi manapun.' });
    }

    const { data, error } = await supabase
      .from('organization_chat_messages')
      .select(`
        id,
        organization_id,
        message,
        created_at,
        user_id,
        user_profiles (full_name)
      `)
      .eq('organization_id', activeOrganizationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    const members = await getOrganizationMembers(activeOrganizationId);

    res.json({
      organizationId: activeOrganizationId,
      organizations: simplifyOrganizations(organizations),
      members,
      messages: (data || []).map((row) => ({
        id: row.id,
        organization_id: row.organization_id,
        message: row.message,
        created_at: row.created_at,
        user_id: row.user_id,
        full_name: row.user_profiles?.full_name || 'Pengguna'
      }))
    });
  } catch (error) {
    console.error('Chat messages error:', error);
    res.status(500).json({ error: 'Gagal memuat pesan chat.' });
  }
});

router.post('/messages', authenticateUser, async (req, res) => {
  try {
    const requestedOrgId = req.body.organizationId;
    const message = (req.body.message || '').trim();

    if (!message) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    const { activeOrganizationId } = await ensureOrganizationAccess(
      req.user.id,
      requestedOrgId
    );

    if (!activeOrganizationId) {
      return res.status(400).json({ error: 'User belum tergabung organisasi manapun.' });
    }

    const { data, error } = await supabase
      .from('organization_chat_messages')
      .insert({
        organization_id: activeOrganizationId,
        user_id: req.user.id,
        message
      })
      .select(`
        id,
        organization_id,
        message,
        created_at,
        user_id,
        user_profiles (full_name)
      `)
      .single();

    if (error) {
      throw error;
    }

    res.json({
      id: data.id,
      organization_id: data.organization_id,
      message: data.message,
      created_at: data.created_at,
      user_id: data.user_id,
      full_name: data.user_profiles?.full_name || 'Pengguna'
    });
  } catch (error) {
    console.error('Chat send error:', error);
    res.status(500).json({ error: 'Gagal mengirim pesan.' });
  }
});

module.exports = router;


