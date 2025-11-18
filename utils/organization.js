const { supabase, supabaseAdmin } = require('../config/supabase');
const logger = require('./logger');

/**
 * Get all organization IDs for a user
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} Array of organization IDs
 */
async function getUserOrganizations(userId) {
  try {
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', userId);

    if (error) {
      logger.error('Error getting user organizations:', error);
      return [];
    }

    return (data || []).map(item => item.organization_id);
  } catch (error) {
    logger.error('Error in getUserOrganizations:', error);
    return [];
  }
}

/**
 * Check if user has access to an organization
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<boolean>} True if user has access
 */
async function checkOrganizationAccess(userId, organizationId) {
  try {
    if (!organizationId) return false;

    const userOrgs = await getUserOrganizations(userId);
    return userOrgs.includes(organizationId);
  } catch (error) {
    logger.error('Error in checkOrganizationAccess:', error);
    return false;
  }
}

/**
 * Check if user is superadmin
 * @param {object} user - User object from req.user
 * @returns {Promise<boolean>} True if user is superadmin
 */
async function isSuperAdmin(user) {
  try {
    if (!user) return false;

    // Check email directly
    if (user.email === 'mukhsin9@gmail.com') return true;

    // Check role from user_profiles
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      logger.warn('Error checking superadmin status:', error);
      return false;
    }

    return data?.role === 'superadmin';
  } catch (error) {
    logger.error('Error in isSuperAdmin:', error);
    return false;
  }
}

/**
 * Get user's role
 * @param {object} user - User object from req.user
 * @returns {Promise<string>} User role (superadmin, admin, manager, or null)
 */
async function getUserRole(user) {
  try {
    if (!user) return null;

    // Check if superadmin by email
    if (user.email === 'mukhsin9@gmail.com') return 'superadmin';

    // Get role from user_profiles
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      logger.warn('Error getting user role:', error);
      return null;
    }

    return data?.role || null;
  } catch (error) {
    logger.error('Error in getUserRole:', error);
    return null;
  }
}

/**
 * Build organization filter for Supabase query
 * @param {object} query - Supabase query builder
 * @param {object} user - User object from req.user (must have isSuperAdmin and organizations)
 * @param {string} organizationIdColumn - Column name for organization_id (default: 'organization_id')
 * @returns {object} Query with organization filter applied (or original query if superadmin)
 */
function buildOrganizationFilter(query, user, organizationIdColumn = 'organization_id') {
  // Superadmin can see everything
  if (user.isSuperAdmin) {
    return query;
  }

  // If user has organizations, filter by them
  if (user.organizations && user.organizations.length > 0) {
    return query.in(organizationIdColumn, user.organizations);
  }

  // User has no organizations, return query that will return empty result
  return query.eq(organizationIdColumn, '00000000-0000-0000-0000-000000000000'); // Non-existent UUID
}

module.exports = {
  getUserOrganizations,
  checkOrganizationAccess,
  isSuperAdmin,
  getUserRole,
  buildOrganizationFilter
};

