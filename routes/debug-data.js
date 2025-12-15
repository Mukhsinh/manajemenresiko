const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// Debug route to check data access without authentication
router.get('/visi-misi', async (req, res) => {
  try {
    console.log('Debug: Fetching visi misi data...');
    
    const client = supabaseAdmin;
    
    if (!client) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    const { data, error } = await client
      .from('visi_misi')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Debug visi misi error:', error);
      throw error;
    }

    console.log('Debug visi misi data:', data?.length || 0, 'records');
    res.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('Debug visi misi error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error
    });
  }
});

// Debug route to check rencana strategis data
router.get('/rencana-strategis', async (req, res) => {
  try {
    console.log('Debug: Fetching rencana strategis data...');
    
    const client = supabaseAdmin;
    
    if (!client) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    const { data, error } = await client
      .from('rencana_strategis')
      .select('*, visi_misi(id, visi, misi, tahun)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Debug rencana strategis error:', error);
      throw error;
    }

    console.log('Debug rencana strategis data:', data?.length || 0, 'records');
    res.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('Debug rencana strategis error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error
    });
  }
});

// Debug route to check dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    console.log('Debug: Fetching dashboard data...');
    
    const client = supabaseAdmin;
    
    if (!client) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    // Get basic counts
    const [
      { count: totalRisks },
      { count: lossEvents },
      { data: visiMisiData },
      { data: rencanaData }
    ] = await Promise.all([
      client.from('risk_inputs').select('*', { count: 'exact', head: true }),
      client.from('loss_event').select('*', { count: 'exact', head: true }),
      client.from('visi_misi').select('*').limit(5),
      client.from('rencana_strategis').select('*').limit(5)
    ]);

    const stats = {
      total_risks: totalRisks || 0,
      loss_events: lossEvents || 0,
      inherent_risks: {
        extreme_high: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      residual_risks: {
        extreme_high: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      kri: {
        aman: 0,
        hati_hati: 0,
        kritis: 0
      },
      ews_alerts: {
        normal: 0,
        peringatan: 0,
        waspada: 0,
        darurat: 0
      },
      sample_data: {
        visi_misi: visiMisiData || [],
        rencana_strategis: rencanaData || []
      }
    };

    console.log('Debug dashboard stats:', stats);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Debug dashboard error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error
    });
  }
});

module.exports = router;