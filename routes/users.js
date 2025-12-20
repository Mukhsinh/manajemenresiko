/**
 * User Management Routes
 * Handles user CRUD operations with organization-based filtering
 */

const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

/**
 * DEBUG endpoint - check user authentication
 */
router.get('/debug', authenticateUser, async (req, res) => {
  try {
    console.log('=== USER DEBUG ENDPOINT ===');
    console.log('User:', JSON.stringify(req.user, null, 2));
    console.log('User organizations:', req.user.organizations);
    console.log('User role:', req.user.role);
    console.log('User isSuperAdmin:', req.user.isSuperAdmin);
    
    res.json({
      message: 'User debug info',
      user: {
        id: req.user.id,
        email: req.user.email,
        organizations: req.user.organizations,
        role: req.user.role,
        isSuperAdmin: req.user.isSuperAdmin
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting profile for user ID:', userId);

    // Simple query first
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Query result:', { user, error });

    if (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Error in get user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/users/profile
 * Update current user profile
 */
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from('user_profiles')
      .update({
        full_name: name.trim(),
        email: email.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select(`
        id,
        email,
        full_name,
        role,
        organization_id,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return res.status(500).json({ error: 'Failed to update user profile' });
    }

    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    });

  } catch (error) {
    console.error('Error in update user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users
 * Get users list with organization filtering
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build query with organization filter
    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        organization_id,
        created_at,
        updated_at,
        organizations (
          id,
          name
        )
      `, { count: 'exact' });

    // Apply organization filter
    query = buildOrganizationFilter(query, req.user);

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply role filter
    if (role) {
      query = query.eq('role', role);
    }

    // Apply pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.json({
      users: users || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in get users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/users
 * Create new user (admin only)
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin role required' });
    }

    const { email, name, password, role = 'user' } = req.body;

    // Validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    if (!['admin', 'user', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, user, or viewer' });
    }

    // Check if user has organization access
    if (!req.user.organizations || req.user.organizations.length === 0) {
      return res.status(403).json({ error: 'Access denied: No organization access' });
    }

    const userOrgId = req.user.organizations[0]; // Use first organization

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create user profile
    const { data: newUser, error } = await supabase
      .from('user_profiles')
      .insert({
        email: email.trim(),
        full_name: name.trim(),
        role,
        organization_id: userOrgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        id,
        email,
        full_name,
        role,
        organization_id,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Error in create user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/users/:id/role
 * Update user role (admin only)
 */
router.put('/:id/role', authenticateUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin role required' });
    }

    const { id } = req.params;
    const { role } = req.body;

    // Validation
    if (!['admin', 'user', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, user, or viewer' });
    }

    // Check if user has organization access
    if (!req.user.organizations || req.user.organizations.length === 0) {
      return res.status(403).json({ error: 'Access denied: No organization access' });
    }

    const userOrgId = req.user.organizations[0]; // Use first organization

    // Check if target user exists and belongs to same organization
    const { data: targetUser } = await supabase
      .from('user_profiles')
      .select('id, organization_id, role')
      .eq('id', id)
      .eq('organization_id', userOrgId)
      .single();

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found or access denied' });
    }

    // Update user role
    const { data: updatedUser, error } = await supabase
      .from('user_profiles')
      .update({
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        email,
        full_name,
        role,
        organization_id,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error updating user role:', error);
      return res.status(500).json({ error: 'Failed to update user role' });
    }

    res.json({
      message: 'User role updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error in update user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin role required' });
    }

    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user has organization access
    if (!req.user.organizations || req.user.organizations.length === 0) {
      return res.status(403).json({ error: 'Access denied: No organization access' });
    }

    const userOrgId = req.user.organizations[0]; // Use first organization

    // Check if target user exists and belongs to same organization
    const { data: targetUser } = await supabase
      .from('user_profiles')
      .select('id, organization_id, full_name, email')
      .eq('id', id)
      .eq('organization_id', userOrgId)
      .single();

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found or access denied' });
    }

    // Delete user
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    res.json({
      message: `User ${targetUser.full_name} (${targetUser.email}) deleted successfully`
    });

  } catch (error) {
    console.error('Error in delete user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;