const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');

// Debug endpoint untuk monitoring evaluasi - NO AUTH
router.get('/', async (req, res) => {
  try {
    console.log('=== MONITORING EVALUASI DEBUG ENDPOINT ===');
    
    // Use service role to bypass RLS
    console.log('Calling RPC function with admin client...');
    console.log('supabaseAdmin available:', !!supabaseAdmin);
    console.log('supabase available:', !!supabase);
    
    const client = supabaseAdmin || supabase;
    console.log('Using client type:', supabaseAdmin ? 'admin' : 'regular');
    
    const { data, error } = await client
      .rpc('get_monitoring_evaluasi_debug');

    console.log('RPC result:', { 
      data: data ? `Array(${data.length})` : data, 
      error, 
      dataLength: data?.length,
      firstItem: data?.[0] ? { id: data[0].id, kode_risiko: data[0].kode_risiko } : null
    });

    if (error) {
      console.error('Debug query error:', error);
      throw error;
    }
    
    // Transform data to match expected format
    const transformedData = data?.map(item => ({
      ...item,
      risk_inputs: {
        kode_risiko: item.kode_risiko,
        sasaran: item.sasaran,
        organization_id: item.organization_id
      }
    })) || [];
    
    console.log('Debug query success:', {
      count: transformedData?.length || 0,
      hasData: transformedData && transformedData.length > 0,
      sampleData: transformedData && transformedData.length > 0 ? {
        id: transformedData[0].id,
        tanggal_monitoring: transformedData[0].tanggal_monitoring,
        status_risiko: transformedData[0].status_risiko,
        organization_id: transformedData[0].organization_id
      } : null
    });

    res.json({
      success: true,
      count: transformedData?.length || 0,
      data: transformedData || [],
      message: 'Monitoring evaluasi debug data retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;