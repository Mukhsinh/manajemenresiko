const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');

// Test route to check data without authentication
router.get('/dashboard', async (req, res) => {
  try {
    console.log('Test dashboard request (no auth)');
    
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
      sample_data: {
        visi_misi: visiMisiData || [],
        rencana_strategis: rencanaData || []
      }
    };

    console.log('Test dashboard stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Test dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test master data endpoints
router.get('/master/:type', async (req, res) => {
  try {
    const { type } = req.params;
    console.log('Test master data request:', type);
    
    const client = supabaseAdmin;
    
    if (!client) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    let tableName;
    switch (type) {
      case 'probability-criteria':
        tableName = 'master_probability_criteria';
        break;
      case 'impact-criteria':
        tableName = 'master_impact_criteria';
        break;
      case 'risk-categories':
        tableName = 'master_risk_categories';
        break;
      case 'work-units':
        tableName = 'master_work_units';
        break;
      default:
        return res.status(400).json({ error: 'Invalid master data type' });
    }

    const { data, error } = await client
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    console.log(`Test ${type} data:`, data?.length || 0, 'records');
    res.json(data || []);
  } catch (error) {
    console.error('Test master data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test risk inputs
router.get('/risk-inputs', async (req, res) => {
  try {
    console.log('Test risk inputs request');
    
    const client = supabaseAdmin;
    
    if (!client) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    const { data, error } = await client
      .from('risk_inputs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    console.log('Test risk inputs data:', data?.length || 0, 'records');
    res.json(data || []);
  } catch (error) {
    console.error('Test risk inputs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test risks endpoint (same as /api/risks but without auth)
router.get('/risks', async (req, res) => {
  try {
    console.log('Test risks request (no auth)');
    
    const client = supabaseAdmin;
    
    if (!client) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    // Get basic risk data
    const { data: risks, error: risksError } = await client
      .from('risk_inputs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (risksError) throw risksError;

    if (!risks || risks.length === 0) {
      return res.json([]);
    }

    // Get related data
    const unitIds = [...new Set(risks.map(r => r.nama_unit_kerja_id).filter(Boolean))];
    const categoryIds = [...new Set(risks.map(r => r.kategori_risiko_id).filter(Boolean))];

    const [
      { data: units },
      { data: categories }
    ] = await Promise.all([
      unitIds.length > 0 ? client.from('master_work_units').select('id, name').in('id', unitIds) : Promise.resolve({ data: [] }),
      categoryIds.length > 0 ? client.from('master_risk_categories').select('id, name').in('id', categoryIds) : Promise.resolve({ data: [] })
    ]);

    // Create lookup maps
    const unitMap = (units || []).reduce((acc, unit) => ({ ...acc, [unit.id]: unit }), {});
    const categoryMap = (categories || []).reduce((acc, cat) => ({ ...acc, [cat.id]: cat }), {});

    // Combine data
    const enrichedRisks = risks.map(risk => ({
      ...risk,
      master_work_units: risk.nama_unit_kerja_id ? unitMap[risk.nama_unit_kerja_id] : null,
      master_risk_categories: risk.kategori_risiko_id ? categoryMap[risk.kategori_risiko_id] : null
    }));

    console.log('Test risks data:', enrichedRisks.length, 'records');
    res.json(enrichedRisks);
  } catch (error) {
    console.error('Test risks error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test visi misi data
router.get('/visi-misi', async (req, res) => {
  try {
    console.log('Test visi misi request');
    
    const client = supabaseAdmin;
    
    if (!client) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    const { data, error } = await client
      .from('visi_misi')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    console.log('Test visi misi data:', data?.length || 0, 'records');
    res.json(data || []);
  } catch (error) {
    console.error('Test visi misi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test rencana strategis data
router.get('/rencana-strategis', async (req, res) => {
  try {
    console.log('Test rencana strategis request');
    
    const client = supabaseAdmin;
    
    if (!client) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    const { data, error } = await client
      .from('rencana_strategis')
      .select('*, visi_misi(id, visi, misi, tahun)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    console.log('Test rencana strategis data:', data?.length || 0, 'records');
    res.json(data || []);
  } catch (error) {
    console.error('Test rencana strategis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test login endpoint (creates a valid session for testing)
router.post('/login', async (req, res) => {
  try {
    console.log('Test login request');
    
    const client = supabaseAdmin;
    
    if (!client) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    // Get a test user
    const { data: users, error: userError } = await client
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (userError || !users || users.length === 0) {
      return res.status(404).json({ error: 'No test user found' });
    }

    const testUser = users[0];
    
    // Create a mock session token (for testing only)
    const mockToken = `sbp_test_${Date.now()}_${testUser.id}`;
    
    console.log('Test login successful for user:', testUser.email);
    
    res.json({
      access_token: mockToken,
      user: {
        id: testUser.id,
        email: testUser.email,
        user_metadata: {
          full_name: testUser.full_name
        },
        app_metadata: {
          role: testUser.role
        }
      },
      session: {
        access_token: mockToken,
        user: {
          id: testUser.id,
          email: testUser.email
        }
      }
    });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test KRI direct (no auth, no filters)
router.get('/kri-direct', async (req, res) => {
  try {
    console.log('Test KRI direct request (no auth, no filters)');
    
    const client = supabaseAdmin;
    
    if (!client) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    const { data, error } = await client
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories (
          name
        ),
        master_work_units (
          name,
          code
        ),
        risk_inputs (
          kode_risiko
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    console.log('Test KRI direct data:', data?.length || 0, 'records');
    res.json(data || []);
  } catch (error) {
    console.error('Test KRI direct error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test all tables data count
router.get('/data-counts', async (req, res) => {
  try {
    console.log('Test data counts request');
    
    const client = supabaseAdmin;
    
    if (!client) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    const tables = [
      'risk_inputs',
      'master_work_units',
      'master_risk_categories',
      'master_probability_criteria',
      'master_impact_criteria',
      'organizations',
      'user_profiles',
      'visi_misi',
      'rencana_strategis',
      'key_risk_indicator'
    ];

    const counts = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await client
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.warn(`Error counting ${table}:`, error.message);
          counts[table] = { error: error.message };
        } else {
          counts[table] = { count: count || 0 };
        }
      } catch (error) {
        console.warn(`Error counting ${table}:`, error.message);
        counts[table] = { error: error.message };
      }
    }

    console.log('Test data counts:', counts);
    res.json(counts);
  } catch (error) {
    console.error('Test data counts error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;