const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin, getSupabaseClientForRequest } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

async function upsertUserProfile(user) {
  if (!user) return;
  const profile = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email || '',
    updated_at: new Date().toISOString()
  };
  // Use supabaseAdmin to bypass RLS when creating/updating user profiles
  if (supabaseAdmin) {
    await supabaseAdmin.from('user_profiles').upsert(profile, { onConflict: 'id' });
  } else {
    // Fallback to regular supabase if admin client not available
    await supabase.from('user_profiles').upsert(profile, { onConflict: 'id' });
  }
}

async function updateUserProfileOrganization(userId, organization) {
  if (!userId) return;
  const client = supabaseAdmin || supabase;
  await client.from('user_profiles').upsert(
    {
      id: userId,
      organization_id: organization?.id || null,
      organization_code: organization?.code || null,
      organization_name: organization?.name || null,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'id' }
  );
}

router.get('/', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || getSupabaseClientForRequest(req);
    const { data: orgs, error } = await clientToUse
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const organizations = await Promise.all(
      (orgs || []).map(async (org) => {
        try {
          const { data: users, error: usersError } = await clientToUse
            .from('organization_users')
            .select(`
              id,
              role,
              user_id,
              created_at,
              user_profiles (
                full_name,
                email,
                role,
                organization_name,
                organization_code
              )
            `)
            .eq('organization_id', org.id)
            .order('created_at', { ascending: true });

          if (usersError) throw usersError;

          return {
            ...org,
            users: users || []
          };
        } catch (userError) {
          console.error(`Error loading users for organization ${org.id}:`, userError);
          return {
            ...org,
            users: []
          };
        }
      })
    );

    res.json(organizations);
  } catch (error) {
    console.error('Organizations GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateUser, async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama organisasi wajib diisi' });

    // Use admin client for backend operations to bypass RLS
    const clientToUse = supabaseAdmin || supabase;

    // Insert organization
    const { data: orgData, error: orgError } = await clientToUse
      .from('organizations')
      .insert({ name, code, description })
      .select()
      .single();

    if (orgError) throw orgError;

    // Automatically add the creator as admin/manager of the organization
    if (orgData && orgData.id) {
      const { error: userOrgError } = await clientToUse
        .from('organization_users')
        .insert({
          organization_id: orgData.id,
          user_id: req.user.id,
          role: 'admin'
        });

      if (userOrgError) {
        console.error('Error adding user to organization:', userOrgError);
        // Don't fail the request if adding user fails, but log it
      }
    }

    res.json(orgData);
  } catch (error) {
    console.error('Organizations error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = {
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
      updated_at: new Date().toISOString()
    };

    // Use admin client for backend operations
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('organizations')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    // Use admin client for backend operations
    const clientToUse = supabaseAdmin || supabase;
    const { error } = await clientToUse
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Organisasi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/users', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const clientToUse = supabaseAdmin || getSupabaseClientForRequest(req);
    const { data, error } = await clientToUse
      .from('organization_users')
      .select(`
        id,
        role,
        user_id,
        user_profiles (
          full_name,
          email,
          role,
          organization_name,
          organization_code
        )
      `)
      .eq('organization_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data || !Array.isArray(data)) {
      console.warn(`[Organizations] No users found for organization ${id}. Response:`, data);
    } else {
      console.log(`[Organizations] Loaded ${data.length} users for organization ${id}`);
    }
    res.json(data || []);
  } catch (error) {
    console.error(`[Organizations] Error fetching users for organization ${req.params?.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/users', authenticateUser, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase service role key belum dikonfigurasi' });
    }
    const { id } = req.params;
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email user wajib diisi' });

    // Find user by email using listUsers and filter
    // Supabase Admin API doesn't have getUserByEmail, so we use listUsers
    const normalizedEmail = email.trim().toLowerCase();
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return res.status(500).json({ error: 'Error mencari user: ' + listError.message });
    }

    // Find user by email from the list
    const user = usersList?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
    
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan di Supabase Auth. Pastikan user sudah terdaftar terlebih dahulu.' });
    }

    await upsertUserProfile(user);

    // Use admin client for backend operations
    const clientToUse = supabaseAdmin || supabase;
    const { data: organization, error: orgError } = await clientToUse
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (orgError) throw orgError;

    const { data, error } = await clientToUse
      .from('organization_users')
      .upsert(
        {
          organization_id: id,
          user_id: user.id,
          role: role || 'manager'
        },
        { onConflict: 'organization_id,user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    await updateUserProfileOrganization(user.id, organization);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    // Use admin client for backend operations
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('organization_users')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const clientToUse = supabaseAdmin || supabase;

    const { data: membership, error: membershipError } = await clientToUse
      .from('organization_users')
      .select('user_id')
      .eq('id', id)
      .single();

    if (membershipError) throw membershipError;

    const { error } = await clientToUse
      .from('organization_users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (membership?.user_id) {
      await updateUserProfileOrganization(membership.user_id, null);
    }

    res.json({ message: 'User di organisasi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

