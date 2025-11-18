const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'ERROR: Missing Supabase environment variables! Please check your .env file and ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.';
  logger.error(errorMsg);
  
  // In production, we might want to throw, but for development allow graceful degradation
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMsg);
  }
}

// Client for client-side operations (uses anon key)
let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    logger.info('Supabase client initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Supabase client:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
} else {
  logger.warn('WARNING: Supabase client not initialized. Please check .env file.');
}

// Admin client for server-side operations (uses service role key)
let supabaseAdmin = null;
if (supabaseServiceKey && supabaseUrl) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    logger.info('Supabase admin client initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Supabase admin client:', error);
    // Admin client is optional, so we don't throw
  }
} else {
  logger.warn('WARNING: Supabase admin client not initialized. Service role key not provided.');
}

function getSupabaseClientForRequest(req) {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  try {
    const authHeader = req?.headers?.authorization || req?.headers?.Authorization || '';
    if (!authHeader?.startsWith('Bearer ') || !supabaseUrl || !supabaseAnonKey) {
      return supabase;
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (error) {
    logger.error('Failed to create per-request Supabase client:', error);
    return supabase;
  }
}

function createQueryBuilderMock() {
  const buildResponse = async () => ({ data: null, error: null });
  const builder = {
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    gte: () => builder,
    lt: () => builder,
    lte: () => builder,
    like: () => builder,
    ilike: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    upsert: () => builder,
    single: buildResponse,
    maybeSingle: buildResponse,
    is: () => builder,
    not: () => builder,
    contains: () => builder,
    count: () => ({ data: null, error: null }),
    then: (resolve) => resolve({ data: null, error: null })
  };
  return builder;
}

module.exports = {
  supabase: supabase || {
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async (_token) => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: null }, error: null })
    },
    from: () => createQueryBuilderMock()
  },
  supabaseAdmin,
  getSupabaseClientForRequest
};

