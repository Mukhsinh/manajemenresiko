const { supabase } = require('../config/supabase');
const { AuthenticationError } = require('../utils/errors');
const logger = require('../utils/logger');
const { getUserOrganizations, isSuperAdmin, getUserRole } = require('../utils/organization');

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      logger.warn('Authentication failed:', error?.message || 'Invalid token');
      throw new AuthenticationError('Invalid or expired token');
    }

    // Get user's organizations and role
    const [organizations, role, isSuper] = await Promise.all([
      getUserOrganizations(user.id),
      getUserRole(user),
      isSuperAdmin(user)
    ]);

    // Attach user info with organizations and role
    req.user = user;
    req.user.organizations = organizations || [];
    req.user.role = role;
    req.user.isSuperAdmin = isSuper;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has access to an organization
 * Superadmin bypasses this check
 */
const checkOrganizationAccess = async (req, res, next) => {
  try {
    // Superadmin can access everything
    if (req.user.isSuperAdmin) {
      return next();
    }

    const organizationId = req.params.organizationId || req.body.organization_id || req.query.organization_id;

    if (!organizationId) {
      // If no organization_id specified, allow access (will be filtered by organization in query)
      return next();
    }

    const hasAccess = req.user.organizations.includes(organizationId);

    if (!hasAccess) {
      throw new AuthenticationError('Anda tidak memiliki akses ke organisasi ini');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateUser,
  checkOrganizationAccess
};

