const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { validateRequestBody } = require('../utils/validation');
const { ValidationError, AuthenticationError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

// Register
router.post('/register', async (req, res, next) => {
  try {
    // Validate request body
    const { email, password, full_name } = validateRequestBody(req, {
      email: { type: 'string', required: true, email: true },
      password: { type: 'string', required: true, minLength: 8 },
      full_name: { type: 'string', required: false, maxLength: 255 }
    });

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: full_name?.trim() || ''
        }
      }
    });

    if (error) {
      throw new ValidationError(error.message);
    }

    // Create user profile di user_profiles untuk isolasi aplikasi
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: email.trim().toLowerCase(),
          full_name: full_name?.trim() || '',
          role: 'user_internal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        logger.error('Profile creation error:', profileError);
        // Don't fail registration if profile creation fails
      }
    }

    res.json({ 
      message: 'Registration successful',
      user: data.user 
    });
  } catch (error) {
    next(error);
  }
});

// Login - hanya menggunakan email untuk isolasi aplikasi
router.post('/login', async (req, res, next) => {
  try {
    // Validate request body
    const { email, password } = validateRequestBody(req, {
      email: { type: 'string', required: true, email: true },
      password: { type: 'string', required: true }
    });

    // Hanya terima email format untuk isolasi aplikasi
    const loginEmail = email.trim().toLowerCase();
    
    // Validasi format email
    if (!loginEmail.includes('@') || !loginEmail.includes('.')) {
      throw new AuthenticationError('Format email tidak valid. Silakan gunakan email yang benar untuk login.');
    }
    
    // Skip profile check before login to avoid RLS issues
    // Will verify profile after successful authentication
    logger.info(`Attempting login with email: ${loginEmail}`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    });

    if (error) {
      logger.error('Login error:', error);
      
      // Provide clear error messages based on error type
      let errorMessage = 'Login gagal. Email atau password salah.';
      
      if (error.message) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('invalid login credentials') || 
            errorMsg.includes('invalid_credentials') ||
            errorMsg.includes('invalid login')) {
          errorMessage = 'Email atau password salah. Silakan periksa kembali email dan password Anda.';
        } else if (errorMsg.includes('email not confirmed') ||
                   errorMsg.includes('email_not_confirmed')) {
          errorMessage = 'Email belum dikonfirmasi. Silakan cek email Anda dan klik link konfirmasi terlebih dahulu.';
        } else if (errorMsg.includes('user not found') ||
                   errorMsg.includes('user_not_found')) {
          errorMessage = 'User tidak ditemukan. Pastikan email yang Anda masukkan sudah terdaftar.';
        } else if (errorMsg.includes('rate limit') ||
                   errorMsg.includes('too many requests')) {
          errorMessage = 'Terlalu banyak percobaan login. Silakan tunggu beberapa menit sebelum mencoba lagi.';
        } else if (errorMsg.includes('network') ||
                   errorMsg.includes('fetch') ||
                   errorMsg.includes('timeout')) {
          errorMessage = 'Koneksi bermasalah. Silakan periksa koneksi internet Anda dan coba lagi.';
        } else {
          // Use original message if it's user-friendly, otherwise use generic message
          if (error.message.length < 150 && !error.message.includes('Error:') && !error.message.includes('at ')) {
            errorMessage = error.message;
          }
        }
      }
      
      throw new AuthenticationError(errorMessage);
    }

    if (!data || !data.user) {
      logger.error('Login successful but no user data returned');
      throw new AuthenticationError('Login berhasil tetapi data user tidak ditemukan. Silakan refresh halaman dan coba login lagi.');
    }

    if (!data.session) {
      logger.error('Login successful but no session returned');
      throw new AuthenticationError('Login berhasil tetapi sesi tidak dibuat. Silakan refresh halaman dan coba login lagi.');
    }

    // Verify user has profile AFTER authentication (to avoid RLS recursion)
    // Use admin client or service role to bypass RLS
    const adminClient = supabaseAdmin || supabase;
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('id, email, full_name, role, organization_id, organization_name')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      logger.warn(`Profile check after login failed: ${profileError.message}`);
      // Don't fail login if profile check fails, just log warning
      // User can still access app and profile will be loaded by frontend
    } else if (!profile) {
      logger.warn(`No profile found for user ${data.user.email} after successful login`);
      // Create profile automatically if missing
      try {
        const { error: createError } = await adminClient
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
            role: 'manager',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (createError) {
          logger.error('Failed to auto-create profile:', createError);
        } else {
          logger.info('Auto-created profile for user:', data.user.email);
        }
      } catch (autoCreateError) {
        logger.error('Exception during auto-create profile:', autoCreateError);
      }
    } else {
      logger.info(`Login successful for user: ${data.user.email}, role: ${profile.role}`);
    }

    res.json({
      message: 'Login successful',
      user: data.user,
      session: data.session,
      profile: profile || null
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.warn('Logout error:', error);
      // Still return success for logout
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout error:', error);
    // Still return success for logout
    res.json({ message: 'Logout successful' });
  }
});

// Register user by admin (only superadmin)
router.post('/register-admin', authenticateUser, async (req, res, next) => {
  try {
    // Check if user is superadmin
    const clientToUse = supabaseAdmin || supabase;
    const { data: profile, error: profileError } = await clientToUse
      .from('user_profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    const isSuperAdmin = profile?.role === 'superadmin' || req.user.email === 'mukhsin9@gmail.com';
    
    if (!isSuperAdmin) {
      throw new AuthenticationError('Hanya superadmin yang dapat mendaftarkan user baru');
    }

    // Validate request body
    const { email, password, full_name, role } = validateRequestBody(req, {
      email: { type: 'string', required: true, email: true },
      password: { type: 'string', required: true, minLength: 8 },
      full_name: { type: 'string', required: true, maxLength: 255 },
      role: { type: 'string', required: false }
    });

    // Create user using admin client
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client tidak tersedia');
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: full_name?.trim() || ''
      }
    });

    if (error) {
      throw new ValidationError(error.message);
    }

    // Create user profile with role di user_profiles untuk isolasi aplikasi
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: email.trim().toLowerCase(),
          full_name: full_name?.trim() || '',
          role: role || 'manager',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        logger.error('Profile creation error:', profileError);
        // Don't fail registration if profile creation fails, but log it
      }
    }

    res.json({ 
      message: 'User berhasil didaftarkan',
      user: data.user
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticateUser, async (req, res, next) => {
  try {
    // User data is already populated by authenticateUser middleware
    const user = req.user;
    
    if (!user) {
      throw new AuthenticationError('User not found in request');
    }

    // Get user profile with organization data
    const { getUserOrganizations, getUserRole, isSuperAdmin } = require('../utils/organization');
    
    // Get additional user data
    const [organizations, role, isSuper] = await Promise.all([
      getUserOrganizations(user.id),
      getUserRole(user),
      isSuperAdmin(user)
    ]);

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.warn('Profile fetch error:', profileError);
    }

    res.json({
      user: {
        ...user,
        profile: profile || null,
        organizations: organizations || [],
        role: role || 'manager',
        isSuperAdmin: isSuper || false
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

