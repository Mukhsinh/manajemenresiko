const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware untuk verifikasi superadmin
const requireSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token tidak valid' });
    }

    // Cek role user
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'superadmin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya superadmin yang dapat mengakses fitur ini.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET - Daftar semua user (hanya superadmin)
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const { organization_id } = req.query;
    
    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        organization_id,
        organization_name,
        created_at,
        updated_at,
        organizations (
          id,
          name,
          code
        )
      `)
      .order('created_at', { ascending: false });

    // Filter berdasarkan organisasi jika diminta
    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Gagal mengambil data user' });
    }

    // Ambil data auth users untuk mendapatkan info tambahan
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
    }

    // Gabungkan data profile dengan auth data
    const enrichedUsers = users.map(user => {
      const authUser = authUsers?.users?.find(au => au.id === user.id);
      return {
        ...user,
        email_confirmed: authUser?.email_confirmed_at ? true : false,
        last_sign_in: authUser?.last_sign_in_at,
        created_at_auth: authUser?.created_at
      };
    });

    res.json(enrichedUsers);
  } catch (error) {
    console.error('Error in user management GET:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET - Detail user berdasarkan ID
router.get('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        organization_id,
        organization_name,
        created_at,
        updated_at,
        organizations (
          id,
          name,
          code
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Gagal mengambil data user' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Ambil data auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id);
    
    if (authError) {
      console.error('Error fetching auth user:', authError);
    }

    const enrichedUser = {
      ...user,
      email_confirmed: authUser?.user?.email_confirmed_at ? true : false,
      last_sign_in: authUser?.user?.last_sign_in_at,
      created_at_auth: authUser?.user?.created_at
    };

    res.json(enrichedUser);
  } catch (error) {
    console.error('Error in user management GET by ID:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT - Update user (hanya superadmin)
router.put('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, organization_id, email } = req.body;

    // Validasi input
    if (!full_name || !role) {
      return res.status(400).json({ error: 'Nama lengkap dan role wajib diisi' });
    }

    // Validasi role
    const validRoles = ['superadmin', 'admin', 'manager', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid' });
    }

    // Update user profile
    const updateData = {
      full_name,
      role,
      updated_at: new Date().toISOString()
    };

    if (organization_id) {
      updateData.organization_id = organization_id;
      
      // Ambil nama organisasi
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organization_id)
        .single();
      
      if (!orgError && org) {
        updateData.organization_name = org.name;
      }
    }

    const { data: updatedUser, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Gagal mengupdate user' });
    }

    // Update email di auth jika berubah
    if (email && email !== updatedUser.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        email: email
      });

      if (authError) {
        console.error('Error updating auth email:', authError);
        // Tidak return error karena profile sudah terupdate
      } else {
        // Update email di profile juga
        await supabase
          .from('user_profiles')
          .update({ email: email })
          .eq('id', id);
      }
    }

    res.json({ 
      message: 'User berhasil diupdate',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error in user management PUT:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE - Hapus user (hanya superadmin)
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah user yang akan dihapus adalah superadmin terakhir
    const { data: superAdmins, error: countError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'superadmin');

    if (countError) {
      console.error('Error counting superadmins:', countError);
      return res.status(500).json({ error: 'Gagal memverifikasi data' });
    }

    const { data: userToDelete, error: userError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', id)
      .single();

    if (userError) {
      console.error('Error fetching user to delete:', userError);
      return res.status(500).json({ error: 'User tidak ditemukan' });
    }

    // Jangan hapus superadmin terakhir
    if (userToDelete.role === 'superadmin' && superAdmins.length <= 1) {
      return res.status(400).json({ error: 'Tidak dapat menghapus superadmin terakhir' });
    }

    // Hapus dari user_profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      return res.status(500).json({ error: 'Gagal menghapus profile user' });
    }

    // Hapus dari auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      // Tidak return error karena profile sudah terhapus
    }

    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Error in user management DELETE:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST - Reset password user (hanya superadmin)
router.post('/:id/reset-password', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const { error } = await supabase.auth.admin.updateUserById(id, {
      password: new_password
    });

    if (error) {
      console.error('Error resetting password:', error);
      return res.status(500).json({ error: 'Gagal reset password' });
    }

    res.json({ message: 'Password berhasil direset' });
  } catch (error) {
    console.error('Error in password reset:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET - Daftar organisasi (untuk dropdown)
router.get('/organizations/list', requireSuperAdmin, async (req, res) => {
  try {
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('id, name, code')
      .order('name');

    if (error) {
      console.error('Error fetching organizations:', error);
      return res.status(500).json({ error: 'Gagal mengambil data organisasi' });
    }

    res.json(organizations);
  } catch (error) {
    console.error('Error in organizations list:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;