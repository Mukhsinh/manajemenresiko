// Public configuration endpoint (no secrets)
const express = require('express');
const router = express.Router();

// Get public configuration
router.get('/', (req, res) => {
  try {
    // Only return public configuration
    const config = {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
      apiBaseUrl: process.env.API_BASE_URL || req.protocol + '://' + req.get('host')
    };

    // Validate that required config is present
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      return res.status(500).json({
        error: 'Server configuration incomplete',
        code: 'CONFIG_ERROR'
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Config endpoint error:', error);
    res.status(500).json({
      error: 'Failed to load configuration',
      code: 'CONFIG_ERROR'
    });
  }
});

module.exports = router;

