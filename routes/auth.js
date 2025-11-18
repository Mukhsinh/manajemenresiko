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

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: email.trim().toLowerCase(),
          full_name: full_name?.trim() || ''
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

// Login - support both email and name
router.post('/login', async (req, res, next) => {
  try {
    // Validate request body
    const { email, password } = validateRequestBody(req, {
      email: { type: 'string', required: true },
      password: { type: 'string', required: true }
    });

    let loginEmail = email.trim().toLowerCase();
    
    // If input is not an email format, try to find user by name
    if (!email.includes('@')) {
      // Search for user by full_name
      const clientToUse = supabaseAdmin || supabase;
      const { data: profiles, error: profileError } = await clientToUse
        .from('user_profiles')
        .select('email')
        .ilike('full_name', `%${email.trim()}%`)
        .limit(1);
      
      if (profileError || !profiles || profiles.length === 0) {
        throw new AuthenticationError('User tidak ditemukan');
      }
      
      loginEmail = profiles[0].email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    });

    if (error) {
      throw new AuthenticationError(error.message);
    }

    res.json({
      message: 'Login successful',
      user: data.user,
      session: data.session
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
      .select('role, email')
      .eq('id', req.user.id)
      .single();

    const isSuperAdmin = profile?.role === 'superadmin' || profile?.email === 'mukhsin9@gmail.com' || req.user.email === 'mukhsin9@gmail.com';
    
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

    // Create user profile with role
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: email.trim().toLowerCase(),
          full_name: full_name?.trim() || '',
          role: role || 'manager'
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
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.warn('Profile fetch error:', profileError);
      // Continue without profile if it doesn't exist
    }

    res.json({
      user: {
        ...user,
        profile: profile || null
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

