const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');
const { exportToExcel } = require('../utils/exportHelper');

// DEBUG: User info endpoint
router.get('/user-debug', authenticateUser, async (req, res) => {
  try {
    console.log('DEBUG: User info:', req.user);
    res.json({
      user: req.user,
      hasOrganizations: !!(req.user.organizations && req.user.organizations.length > 0),
      role: req.user.role,
      isSuperAdmin: req.user.isSuperAdmin,
      organizationCount: req.user.organizations ? req.user.organizations.length : 0
    });
  } catch (error) {
    console.error('User debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DEBUG: Test Excel download without auth
router.get('/test-excel-download', async (req, res) => {
  try {
    console.log('DEBUG: Test Excel download');
    
    // Create comprehensive sample data
    const sampleData = [
      {
        'No': 1,
        'Kode Risiko': 'RISK-2025-001',
        'Unit Kerja': 'IT Department',
        'Kategori Risiko': 'Operational Risk',
        'Sasaran': 'Meningkatkan keamanan sistem informasi',
        'Probabilitas': 4,
        'Dampak': 3,
        'Risk Value': 12,
        'Risk Level': 'HIGH RISK',
        'Status': 'Active',
        'Tanggal Registrasi': '2025-01-15',
        'Penyebab Risiko': 'Kurangnya update sistem keamanan',
        'Dampak Risiko': 'Potensi kebocoran data dan gangguan operasional'
      },
      {
        'No': 2,
        'Kode Risiko': 'RISK-2025-002',
        'Unit Kerja': 'Finance Department',
        'Kategori Risiko': 'Financial Risk',
        'Sasaran': 'Menjaga stabilitas keuangan perusahaan',
        'Probabilitas': 2,
        'Dampak': 4,
        'Risk Value': 8,
        'Risk Level': 'MEDIUM RISK',
        'Status': 'Active',
        'Tanggal Registrasi': '2025-01-16',
        'Penyebab Risiko': 'Fluktuasi nilai tukar mata uang',
        'Dampak Risiko': 'Kerugian finansial dan penurunan profitabilitas'
      },
      {
        'No': 3,
        'Kode Risiko': 'RISK-2025-003',
        'Unit Kerja': 'HR Department',
        'Kategori Risiko': 'Operational Risk',
        'Sasaran': 'Mempertahankan kualitas SDM',
        'Probabilitas': 3,
        'Dampak': 2,
        'Risk Value': 6,
        'Risk Level': 'LOW RISK',
        'Status': 'Monitoring',
        'Tanggal Registrasi': '2025-01-17',
        'Penyebab Risiko': 'Tingkat turnover karyawan tinggi',
        'Dampak Risiko': 'Penurunan produktivitas dan biaya rekrutmen tinggi'
      }
    ];

    console.log('Generating Excel with', sampleData.length, 'records');
    const buffer = exportToExcel(sampleData, 'Test Risk Register');
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Failed to generate Excel buffer');
    }

    console.log('Excel buffer generated:', buffer.length, 'bytes');
    sendExcelResponse(res, buffer, 'test-risk-register.xlsx');
  } catch (error) {
    console.error('Test Excel download error:', error);
    res.status(500).json({ error: 'Failed to generate test Excel: ' + error.message });
  }
});

// DEBUG: Simple test endpoint
router.get('/risk-profile-debug', async (req, res) => {
  try {
    console.log('DEBUG: Risk Profile endpoint called');
    
    // Return hardcoded data for now to test frontend
    const sampleData = [
      {
        id: "22a05dd6-ab42-4cb3-b0b5-2cad19256587",
        risk_input_id: "0217a1c5-37db-4c54-ad42-2428ebc3e45a",
        probability: 4,
        impact: 2,
        risk_value: 8,
        risk_level: "MEDIUM RISK",
        probability_percentage: "80%",
        financial_impact: "14529444.00",
        risk_inputs: {
          id: "0217a1c5-37db-4c54-ad42-2428ebc3e45a",
          kode_risiko: "RISK-2025-0364",
          sasaran: "Meningkatkan kualitas pelayanan",
          master_work_units: { name: "Seksi pengembangan dan etika keperawatan" },
          master_risk_categories: { name: "Risiko Operasional" }
        }
      },
      {
        id: "d7ca9668-cb6d-410d-83cc-77e23a9a3185",
        risk_input_id: "02284cd2-6fb4-4cf4-a557-c2b096874b86",
        probability: 5,
        impact: 5,
        risk_value: 25,
        risk_level: "EXTREME HIGH",
        probability_percentage: "100%",
        financial_impact: "64281995.00",
        risk_inputs: {
          id: "02284cd2-6fb4-4cf4-a557-c2b096874b86",
          kode_risiko: "RISK-2025-0302",
          sasaran: "Meningkatkan kualitas pelayanan",
          master_work_units: { name: "Direktur" },
          master_risk_categories: { name: "Risiko Fraud" }
        }
      }
    ];
    
    console.log('DEBUG: Returning sample data:', sampleData.length, 'items');
    res.json(sampleData);

    if (risksError) {
      console.error('DEBUG: Error getting risks:', risksError);
      throw risksError;
    }

    console.log('DEBUG: Found risks:', userRisks?.length || 0);

    const riskIds = (userRisks || []).map(r => r.id);

    if (riskIds.length === 0) {
      console.log('DEBUG: No risks found');
      return res.json([]);
    }

    // Get inherent analysis
    const { data: analysisData, error: analysisError } = await supabaseAdmin
      .from('risk_inherent_analysis')
      .select('*')
      .in('risk_input_id', riskIds);

    if (analysisError) {
      console.error('DEBUG: Error getting analysis:', analysisError);
      throw analysisError;
    }

    console.log('DEBUG: Found analysis:', analysisData?.length || 0);

    // Merge data
    const mergedData = (analysisData || []).map(analysis => {
      const risk = (userRisks || []).find(r => r.id === analysis.risk_input_id);
      return {
        ...analysis,
        risk_inputs: risk || null
      };
    });

    console.log('DEBUG: Merged data:', mergedData.length);
    res.json(mergedData);
  } catch (error) {
    console.error('DEBUG: Risk profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DEBUG: Risk Register without auth for testing
router.get('/risk-register-debug', async (req, res) => {
  try {
    console.log('Risk Register DEBUG API called');
    
    // Use supabaseAdmin to bypass RLS and get all data
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    console.log('Using client:', client === supabaseAdmin ? 'Admin' : 'Regular');
    
    // Step 1: Get risk inputs with basic relations
    const { data: riskInputs, error: riskError } = await client
      .from('risk_inputs')
      .select(`
        *,
        master_work_units(name),
        master_risk_categories(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (riskError) {
      console.error('Risk inputs query error:', riskError);
      throw riskError;
    }

    console.log('Found risk inputs:', riskInputs?.length || 0);

    // Step 2: Get analysis data separately
    const riskIds = (riskInputs || []).map(r => r.id);
    
    const [inherentResult, residualResult, treatmentResult, appetiteResult, monitoringResult] = await Promise.all([
      client.from('risk_inherent_analysis').select('*').in('risk_input_id', riskIds),
      client.from('risk_residual_analysis').select('*').in('risk_input_id', riskIds),
      client.from('risk_treatments').select('*').in('risk_input_id', riskIds),
      client.from('risk_appetite').select('*').in('risk_input_id', riskIds),
      client.from('risk_monitoring').select('*').in('risk_input_id', riskIds)
    ]);

    console.log('Analysis data counts:', {
      inherent: inherentResult.data?.length || 0,
      residual: residualResult.data?.length || 0,
      treatments: treatmentResult.data?.length || 0,
      appetite: appetiteResult.data?.length || 0,
      monitoring: monitoringResult.data?.length || 0
    });

    // Step 3: Merge data
    const mergedData = (riskInputs || []).map(risk => {
      return {
        ...risk,
        risk_inherent_analysis: (inherentResult.data || []).filter(a => a.risk_input_id === risk.id),
        risk_residual_analysis: (residualResult.data || []).filter(a => a.risk_input_id === risk.id),
        risk_treatments: (treatmentResult.data || []).filter(a => a.risk_input_id === risk.id),
        risk_appetite: (appetiteResult.data || []).filter(a => a.risk_input_id === risk.id),
        risk_monitoring: (monitoringResult.data || []).filter(a => a.risk_input_id === risk.id)
      };
    });
    
    // Return debug info
    res.json({
      message: 'Risk Register Debug Data (Merged)',
      recordCount: mergedData?.length || 0,
      sampleData: mergedData?.slice(0, 3) || [],
      fullData: mergedData || [],
      rawCounts: {
        riskInputs: riskInputs?.length || 0,
        inherent: inherentResult.data?.length || 0,
        residual: residualResult.data?.length || 0,
        treatments: treatmentResult.data?.length || 0,
        appetite: appetiteResult.data?.length || 0,
        monitoring: monitoringResult.data?.length || 0
      }
    });
  } catch (error) {
    console.error('Get risk register debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Risk Register data - NO USER FILTER as requested
router.get('/risk-register', authenticateUser, async (req, res) => {
  try {
    console.log('Risk Register API called by user:', req.user.email, 'Role:', req.user.role);
    
    // Use supabaseAdmin to bypass RLS and get all data
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    console.log('Using client:', client === supabaseAdmin ? 'Admin' : 'Regular');
    
    // Step 1: Get risk inputs with basic relations
    const { data: riskInputs, error: riskError } = await client
      .from('risk_inputs')
      .select(`
        *,
        master_work_units(name),
        master_risk_categories(name)
      `)
      .order('created_at', { ascending: false });

    if (riskError) {
      console.error('Risk inputs query error:', riskError);
      throw riskError;
    }

    console.log('Found risk inputs:', riskInputs?.length || 0);

    // Step 2: Get analysis data separately for better performance
    const riskIds = (riskInputs || []).map(r => r.id);
    
    if (riskIds.length === 0) {
      return res.json([]);
    }

    const [inherentResult, residualResult, treatmentResult, appetiteResult, monitoringResult] = await Promise.all([
      client.from('risk_inherent_analysis').select('*').in('risk_input_id', riskIds),
      client.from('risk_residual_analysis').select('*').in('risk_input_id', riskIds),
      client.from('risk_treatments').select('*').in('risk_input_id', riskIds),
      client.from('risk_appetite').select('*').in('risk_input_id', riskIds),
      client.from('risk_monitoring').select('*').in('risk_input_id', riskIds)
    ]);

    console.log('Analysis data counts:', {
      inherent: inherentResult.data?.length || 0,
      residual: residualResult.data?.length || 0,
      treatments: treatmentResult.data?.length || 0,
      appetite: appetiteResult.data?.length || 0,
      monitoring: monitoringResult.data?.length || 0
    });

    // Step 3: Merge data efficiently
    const mergedData = (riskInputs || []).map(risk => {
      return {
        ...risk,
        risk_inherent_analysis: (inherentResult.data || []).filter(a => a.risk_input_id === risk.id),
        risk_residual_analysis: (residualResult.data || []).filter(a => a.risk_input_id === risk.id),
        risk_treatments: (treatmentResult.data || []).filter(a => a.risk_input_id === risk.id),
        risk_appetite: (appetiteResult.data || []).filter(a => a.risk_input_id === risk.id),
        risk_monitoring: (monitoringResult.data || []).filter(a => a.risk_input_id === risk.id)
      };
    });

    console.log('Merged risk register records:', mergedData?.length || 0);
    res.json(mergedData || []);
  } catch (error) {
    console.error('Get risk register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Risk Profile data for charts (with auth)
router.get('/risk-profile', authenticateUser, async (req, res) => {
  try {
    console.log('Risk Profile API called by user:', req.user.email, 'Role:', req.user.role);
    
    // Use supabaseAdmin to bypass RLS
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    console.log('Using client:', client === supabaseAdmin ? 'Admin' : 'Regular');
    
    // Get user's risks with organization filter and all relations
    let risksQuery = client
      .from('risk_inputs')
      .select(`
        id,
        kode_risiko,
        sasaran,
        user_id,
        organization_id,
        master_work_units(name),
        master_risk_categories(name)
      `);
    
    // Apply organization filter if not super admin
    if (!req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
      // req.user.organizations is already an array of UUIDs, not objects
      const orgIds = Array.isArray(req.user.organizations) ? req.user.organizations : [];
      // Filter out any undefined or null values
      const validOrgIds = orgIds.filter(id => id && typeof id === 'string');
      
      if (validOrgIds.length > 0) {
        risksQuery = risksQuery.in('organization_id', validOrgIds);
      } else {
        // No valid organization IDs, return empty result
        risksQuery = risksQuery.eq('organization_id', '00000000-0000-0000-0000-000000000000');
      }
    }
    
    const { data: userRisks, error: risksError } = await risksQuery;

    if (risksError) {
      console.error('Risk query error:', risksError);
      throw risksError;
    }

    console.log('Found risks:', userRisks?.length || 0);

    const riskIds = (userRisks || []).map(r => r.id);

    if (riskIds.length === 0) {
      return res.json([]);
    }

    // Get inherent analysis separately (without nested embeds)
    const { data: analysisData, error: analysisError } = await client
      .from('risk_inherent_analysis')
      .select('*')
      .in('risk_input_id', riskIds);

    if (analysisError) {
      console.error('Analysis query error:', analysisError);
      throw analysisError;
    }

    console.log('Found analysis:', analysisData?.length || 0);

    // Merge data: attach risk_inputs to each analysis record
    const mergedData = (analysisData || []).map(analysis => {
      const risk = (userRisks || []).find(r => r.id === analysis.risk_input_id);
      return {
        ...analysis,
        risk_inputs: risk || null
      };
    });

    console.log('Merged data:', mergedData.length);
    res.json(mergedData);
  } catch (error) {
    console.error('Get risk profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Residual Risk data for charts
router.get('/residual-risk', authenticateUser, async (req, res) => {
  try {
    console.log('Residual Risk API called by user:', req.user.email, 'Role:', req.user.role);
    
    // Use supabaseAdmin to bypass RLS
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    console.log('Using client:', client === supabaseAdmin ? 'Admin' : 'Regular');
    
    // Get residual analysis data with all relations - NO ORGANIZATION FILTER
    const { data: residualData, error: residualError } = await client
      .from('risk_residual_analysis')
      .select(`
        *,
        risk_inputs(
          id,
          kode_risiko,
          sasaran,
          user_id,
          organization_id,
          master_work_units(name),
          master_risk_categories(name),
          risk_inherent_analysis(*)
        )
      `);

    if (residualError) {
      console.error('Error fetching residual data:', residualError);
      throw residualError;
    }

    console.log('Found residual records:', residualData?.length || 0);
    
    // Filter out records without risk_inputs
    const validData = (residualData || []).filter(item => item.risk_inputs);
    
    console.log('Valid records with risk_inputs:', validData.length);
    
    res.json(validData);
  } catch (error) {
    console.error('Get residual risk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DEBUG: Residual Risk without organization filter
router.get('/residual-risk-debug', authenticateUser, async (req, res) => {
  try {
    console.log('DEBUG: Residual Risk Debug - User:', req.user.email, 'Role:', req.user.role);
    
    // Get all residual analysis data without organization filter
    const { data: residualData, error: residualError } = await supabase
      .from('risk_residual_analysis')
      .select(`
        *,
        risk_inputs(
          id,
          kode_risiko,
          sasaran,
          user_id,
          organization_id,
          master_work_units(name),
          master_risk_categories(name),
          risk_inherent_analysis(*)
        )
      `)
      .limit(10);

    if (residualError) {
      console.error('DEBUG: Residual query error:', residualError);
      throw residualError;
    }

    console.log('DEBUG: Found residual records:', residualData?.length || 0);
    
    res.json({
      message: 'Debug residual risk data',
      recordCount: residualData?.length || 0,
      sampleData: residualData?.slice(0, 3) || [],
      userInfo: {
        email: req.user.email,
        role: req.user.role,
        isSuperAdmin: req.user.isSuperAdmin,
        hasOrganizations: !!(req.user.organizations && req.user.organizations.length > 0)
      }
    });
  } catch (error) {
    console.error('DEBUG: Residual risk debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple Residual Risk endpoint without organization filter
router.get('/residual-risk-simple', async (req, res) => {
  try {
    console.log('Simple Residual Risk API called');
    
    // Use supabaseAdmin to bypass RLS
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    console.log('Using client:', client === supabaseAdmin ? 'Admin' : 'Regular');
    
    // Get residual analysis data with all relations
    const { data: residualData, error: residualError } = await client
      .from('risk_residual_analysis')
      .select(`
        *,
        risk_inputs(
          id,
          kode_risiko,
          sasaran,
          user_id,
          organization_id,
          master_work_units(name),
          master_risk_categories(name),
          risk_inherent_analysis(*)
        )
      `)
      .limit(100);

    if (residualError) {
      console.error('Simple residual query error:', residualError);
      throw residualError;
    }

    console.log('Simple: Found residual records:', residualData?.length || 0);
    
    // Filter out records without risk_inputs
    const validData = (residualData || []).filter(item => item.risk_inputs);
    
    console.log('Simple: Valid records with risk_inputs:', validData.length);
    
    res.json(validData);
  } catch (error) {
    console.error('Simple residual risk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Risk Appetite Dashboard data
router.get('/risk-appetite-dashboard', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('risk_appetite')
      .select(`
        *,
        risk_inputs(
          id,
          kode_risiko,
          sasaran,
          organization_id
        ),
        risk_inherent_analysis(*),
        risk_residual_analysis(*)
      `);
    
    query = buildOrganizationFilter(query, req.user, 'risk_inputs.organization_id');

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Get risk appetite dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to send Excel response
function sendExcelResponse(res, buffer, filename) {
  try {
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty buffer provided');
    }

    console.log(`Sending Excel file: ${filename}, size: ${buffer.length} bytes`);

    // Set proper headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Send the buffer
    res.end(buffer);
  } catch (error) {
    console.error('Error sending Excel response:', error);
    res.status(500).json({ error: 'Failed to generate Excel file: ' + error.message });
  }
}

// Helper function to flatten nested data for Excel
function flattenRiskData(data) {
  return data.map(item => ({
    'Kode Risiko': item.kode_risiko || '',
    'Unit Kerja': item.master_work_units?.name || '',
    'Kategori Risiko': item.master_risk_categories?.name || '',
    'Sasaran': item.sasaran || '',
    'Status': item.status_risiko || '',
    'Tanggal Registrasi': item.tanggal_registrasi || '',
    'Penyebab Risiko': item.penyebab_risiko || '',
    'Dampak Risiko': item.dampak_risiko || ''
  }));
}

// Excel Export: Risk Register
router.get('/risk-register/excel', authenticateUser, async (req, res) => {
  try {
    console.log('Risk Register Excel export requested by user:', req.user.email);
    
    // Use supabaseAdmin to bypass RLS
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    let query = client
      .from('risk_inputs')
      .select(`
        *,
        master_work_units(name),
        master_risk_categories(name),
        risk_inherent_analysis(*),
        risk_residual_analysis(*)
      `)
      .order('created_at', { ascending: false });
    
    // Apply organization filter if not super admin
    if (!req.user.isSuperAdmin && req.user.organizations && req.user.organizations.length > 0) {
      // req.user.organizations is already an array of UUIDs, not objects
      const orgIds = Array.isArray(req.user.organizations) ? req.user.organizations : [];
      // Filter out any undefined or null values
      const validOrgIds = orgIds.filter(id => id && typeof id === 'string');
      
      if (validOrgIds.length > 0) {
        query = query.in('organization_id', validOrgIds);
      } else {
        // No valid organization IDs, return empty result
        query = query.eq('organization_id', '00000000-0000-0000-0000-000000000000');
      }
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Risk register query error:', error);
      throw error;
    }

    console.log('Found risk register data:', data?.length || 0, 'records');

    // If no data, create sample data for testing
    let processedData = data || [];
    if (processedData.length === 0) {
      console.log('No data found, creating sample data');
      processedData = [
        {
          kode_risiko: 'SAMPLE-001',
          sasaran: 'Sample Risk Target',
          status_risiko: 'Active',
          tanggal_registrasi: new Date().toISOString().split('T')[0],
          penyebab_risiko: 'Sample risk cause',
          dampak_risiko: 'Sample risk impact',
          master_work_units: { name: 'Sample Unit' },
          master_risk_categories: { name: 'Sample Category' }
        }
      ];
    }

    const flattened = flattenRiskData(processedData);
    console.log('Flattened data for Excel:', flattened.length, 'records');
    
    const buffer = exportToExcel(flattened, 'Risk Register');
    sendExcelResponse(res, buffer, `risk-register-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export risk register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DEBUG: Risk Register Excel without auth
router.get('/risk-register-excel-debug', async (req, res) => {
  try {
    console.log('DEBUG: Risk Register Excel without auth');
    
    // Use supabaseAdmin to get data
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('risk_inputs')
      .select(`
        *,
        master_work_units(name),
        master_risk_categories(name)
      `)
      .limit(10);

    if (error) {
      console.error('Debug query error:', error);
    }

    console.log('Debug: Found', data?.length || 0, 'risk records');

    // Create comprehensive data
    const sampleData = (data && data.length > 0) ? data.map((item, index) => ({
      'No': index + 1,
      'Kode Risiko': item.kode_risiko || `RISK-${String(index + 1).padStart(3, '0')}`,
      'Unit Kerja': item.master_work_units?.name || 'Sample Unit',
      'Kategori Risiko': item.master_risk_categories?.name || 'Sample Category',
      'Sasaran': item.sasaran || 'Sample target',
      'Status': item.status_risiko || 'Active',
      'Tanggal Registrasi': item.tanggal_registrasi || new Date().toISOString().split('T')[0],
      'Penyebab Risiko': item.penyebab_risiko || 'Sample cause',
      'Dampak Risiko': item.dampak_risiko || 'Sample impact'
    })) : [
      {
        'No': 1,
        'Kode Risiko': 'RISK-001',
        'Unit Kerja': 'IT Department',
        'Kategori Risiko': 'Operational Risk',
        'Sasaran': 'Improve system security',
        'Status': 'Active',
        'Tanggal Registrasi': new Date().toISOString().split('T')[0],
        'Penyebab Risiko': 'Outdated security systems',
        'Dampak Risiko': 'Data breach potential'
      }
    ];

    console.log('Generating Excel with', sampleData.length, 'records');
    const buffer = exportToExcel(sampleData, 'Risk Register Debug');
    sendExcelResponse(res, buffer, 'risk-register-debug.xlsx');
  } catch (error) {
    console.error('Debug Excel export error:', error);
    res.status(500).json({ error: 'Failed to generate debug Excel: ' + error.message });
  }
});

// Excel Export: Risk Profile
router.get('/risk-profile/excel', authenticateUser, async (req, res) => {
  try {
    let risksQuery = supabase
      .from('risk_inputs')
      .select(`
        id,
        kode_risiko,
        sasaran,
        master_work_units(name),
        master_risk_categories(name)
      `);
    risksQuery = buildOrganizationFilter(risksQuery, req.user);
    const { data: userRisks } = await risksQuery;
    const riskIds = (userRisks || []).map(r => r.id);

    if (riskIds.length === 0) {
      const buffer = exportToExcel([], 'Risk Profile');
      sendExcelResponse(res, buffer, `risk-profile-${new Date().toISOString().split('T')[0]}.xlsx`);
      return;
    }

    const { data: analysisData } = await supabase
      .from('risk_inherent_analysis')
      .select('*')
      .in('risk_input_id', riskIds);

    const mergedData = (analysisData || []).map(analysis => {
      const risk = (userRisks || []).find(r => r.id === analysis.risk_input_id);
      return {
        'Kode Risiko': risk?.kode_risiko || '',
        'Unit Kerja': risk?.master_work_units?.name || '',
        'Kategori': risk?.master_risk_categories?.name || '',
        'Probabilitas': analysis.probability || '',
        'Dampak': analysis.impact || '',
        'Risk Value': analysis.risk_value || '',
        'Risk Level': analysis.risk_level || '',
        'Probabilitas %': analysis.probability_percentage || '',
        'Dampak Finansial': analysis.financial_impact || ''
      };
    });

    const buffer = exportToExcel(mergedData, 'Risk Profile');
    sendExcelResponse(res, buffer, `risk-profile-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export risk profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel Export: Residual Risk
router.get('/residual-risk/excel', authenticateUser, async (req, res) => {
  try {
    let risksQuery = supabase
      .from('risk_inputs')
      .select(`
        id,
        kode_risiko,
        master_work_units(name),
        master_risk_categories(name)
      `);
    risksQuery = buildOrganizationFilter(risksQuery, req.user);
    const { data: userRisks } = await risksQuery;
    const riskIds = (userRisks || []).map(r => r.id);

    if (riskIds.length === 0) {
      const buffer = exportToExcel([], 'Residual Risk');
      sendExcelResponse(res, buffer, `residual-risk-${new Date().toISOString().split('T')[0]}.xlsx`);
      return;
    }

    const { data: residualData } = await supabase
      .from('risk_residual_analysis')
      .select('*')
      .in('risk_input_id', riskIds);

    const mergedData = (residualData || []).map(residual => {
      const risk = (userRisks || []).find(r => r.id === residual.risk_input_id);
      return {
        'Kode Risiko': risk?.kode_risiko || '',
        'Unit Kerja': risk?.master_work_units?.name || '',
        'Kategori': risk?.master_risk_categories?.name || '',
        'Probabilitas': residual.probability || '',
        'Dampak': residual.impact || '',
        'Risk Value': residual.risk_value || '',
        'Risk Level': residual.risk_level || '',
        'Net Risk Value': residual.net_risk_value || '',
        'Review Status': residual.review_status || ''
      };
    });

    const buffer = exportToExcel(mergedData, 'Residual Risk');
    sendExcelResponse(res, buffer, `residual-risk-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export residual risk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel Export: Risk Appetite
router.get('/risk-appetite/excel', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('risk_appetite')
      .select(`
        *,
        risk_inputs(
          id,
          kode_risiko,
          organization_id
        )
      `);
    query = buildOrganizationFilter(query, req.user, 'risk_inputs.organization_id');
    const { data, error } = await query;

    if (error) throw error;

    const flattened = (data || []).map(item => ({
      'Kode Risiko': item.risk_inputs?.kode_risiko || '',
      'Risk Level': item.risk_level || '',
      'Threshold': item.threshold || '',
      'Current Value': item.current_value || '',
      'Status': item.status || ''
    }));

    const buffer = exportToExcel(flattened, 'Risk Appetite');
    sendExcelResponse(res, buffer, `risk-appetite-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export risk appetite error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel Export: KRI
router.get('/kri/excel', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('key_risk_indicator')
      .select(`
        *,
        master_risk_categories(name),
        master_work_units(name),
        risk_inputs(kode_risiko)
      `);
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query;

    if (error) throw error;

    const flattened = (data || []).map(item => ({
      'Kode': item.kode || '',
      'Nama Indikator': item.nama_indikator || '',
      'Kategori': item.master_risk_categories?.name || '',
      'Unit Kerja': item.master_work_units?.name || '',
      'Kode Risiko': item.risk_inputs?.kode_risiko || '',
      'Nilai Aktual': item.nilai_aktual || '',
      'Status': item.status_indikator || '',
      'Periode': item.periode_pengukuran || ''
    }));

    const buffer = exportToExcel(flattened, 'KRI');
    sendExcelResponse(res, buffer, `kri-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export KRI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel Export: Monitoring & Evaluasi
router.get('/monitoring/excel', authenticateUser, async (req, res) => {
  try {
    console.log('Monitoring Excel export - User:', req.user?.email, 'ID:', req.user?.id);
    
    // Validate user ID
    if (!req.user?.id) {
      throw new Error('User ID is required but not found');
    }

    // Use supabaseAdmin to bypass RLS if needed
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    let query = client
      .from('monitoring_evaluasi_risiko')
      .select(`
        *,
        risk_inputs(
          kode_risiko,
          sasaran,
          organization_id
        )
      `)
      .order('tanggal_monitoring', { ascending: false });

    // Apply organization filter instead of user filter for better data access
    query = buildOrganizationFilter(query, req.user, 'risk_inputs.organization_id');

    const { data, error } = await query;

    if (error) {
      console.error('Monitoring query error:', error);
      throw error;
    }

    console.log('Found monitoring records:', data?.length || 0);

    // If no data, create sample data
    let processedData = data || [];
    if (processedData.length === 0) {
      console.log('No monitoring data found, creating sample data');
      processedData = [
        {
          tanggal_monitoring: new Date().toISOString().split('T')[0],
          status_risiko: 'Active',
          nilai_risiko: 'Medium',
          progress_mitigasi: '75%',
          evaluasi: 'Progress baik, perlu monitoring berkelanjutan',
          risk_inputs: {
            kode_risiko: 'SAMPLE-MON-001',
            sasaran: 'Sample monitoring target'
          }
        }
      ];
    }

    const flattened = processedData.map(item => ({
      'Tanggal Monitoring': item.tanggal_monitoring || '',
      'Kode Risiko': item.risk_inputs?.kode_risiko || '',
      'Sasaran': item.risk_inputs?.sasaran || '',
      'Status Risiko': item.status_risiko || '',
      'Nilai Risiko': item.nilai_risiko || '',
      'Progress Mitigasi': item.progress_mitigasi || '',
      'Evaluasi': item.evaluasi || ''
    }));

    console.log('Flattened monitoring data:', flattened.length, 'records');
    const buffer = exportToExcel(flattened, 'Monitoring Evaluasi');
    sendExcelResponse(res, buffer, `monitoring-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export monitoring error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel Export: Loss Event
router.get('/loss-event/excel', authenticateUser, async (req, res) => {
  try {
    let query = supabase
      .from('loss_event')
      .select(`
        *,
        master_risk_categories(name),
        master_work_units(name),
        risk_inputs(kode_risiko)
      `);
    query = buildOrganizationFilter(query, req.user);
    const { data, error } = await query;

    if (error) throw error;

    const flattened = (data || []).map(item => ({
      'Kode': item.kode || '',
      'Tanggal Kejadian': item.tanggal_kejadian || '',
      'Kategori': item.master_risk_categories?.name || '',
      'Unit Kerja': item.master_work_units?.name || '',
      'Kode Risiko': item.risk_inputs?.kode_risiko || '',
      'Deskripsi': item.deskripsi_kejadian || '',
      'Nilai Kerugian': item.nilai_kerugian || '',
      'Status': item.status || ''
    }));

    const buffer = exportToExcel(flattened, 'Loss Event');
    sendExcelResponse(res, buffer, `loss-event-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export loss event error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Excel Export: Strategic Map
router.get('/strategic-map/excel', authenticateUser, async (req, res) => {
  try {
    console.log('Strategic Map Excel export - User:', req.user?.email, 'ID:', req.user?.id);
    
    // Validate user ID
    if (!req.user?.id) {
      throw new Error('User ID is required but not found');
    }

    // Use supabaseAdmin to bypass RLS if needed
    const { supabaseAdmin } = require('../config/supabase');
    const client = supabaseAdmin || supabase;
    
    let query = client
      .from('strategic_map')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply organization filter if user has organizations
    query = buildOrganizationFilter(query, req.user);

    const { data, error } = await query;

    if (error) {
      console.error('Strategic map query error:', error);
      throw error;
    }

    console.log('Found strategic map records:', data?.length || 0);

    // If no data, create sample data
    let processedData = data || [];
    if (processedData.length === 0) {
      console.log('No strategic map data found, creating sample data');
      processedData = [
        {
          perspektif: 'Financial',
          tujuan_strategis: 'Meningkatkan profitabilitas',
          indikator: 'ROI',
          target: '15%',
          aktual: '12%'
        },
        {
          perspektif: 'Customer',
          tujuan_strategis: 'Meningkatkan kepuasan pelanggan',
          indikator: 'Customer Satisfaction Score',
          target: '90%',
          aktual: '87%'
        }
      ];
    }

    const flattened = processedData.map(item => ({
      'Perspektif': item.perspektif || '',
      'Tujuan Strategis': item.tujuan_strategis || '',
      'Indikator': item.indikator || '',
      'Target': item.target || '',
      'Aktual': item.aktual || ''
    }));

    console.log('Flattened strategic map data:', flattened.length, 'records');
    const buffer = exportToExcel(flattened, 'Strategic Map');
    sendExcelResponse(res, buffer, `strategic-map-${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Export strategic map error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PDF Export endpoints (structure ready - returns JSON for now)
router.get('/risk-register/pdf', authenticateUser, async (req, res) => {
  try {
    res.status(501).json({ 
      error: 'PDF export not yet implemented',
      message: 'PDF export untuk Risk Register belum diimplementasikan. Silakan gunakan Excel export.',
      availableFormats: ['excel'],
      suggestion: 'Gunakan endpoint /api/reports/risk-register/excel untuk download Excel'
    });
  } catch (error) {
    console.error('Export risk register PDF error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/risk-profile/pdf', authenticateUser, async (req, res) => {
  res.status(501).json({ 
    error: 'PDF export not yet implemented',
    message: 'PDF export untuk Risk Profile belum diimplementasikan. Silakan gunakan Excel export.',
    availableFormats: ['excel']
  });
});

router.get('/residual-risk/pdf', authenticateUser, async (req, res) => {
  try {
    const puppeteer = require('puppeteer');
    
    // Get residual risk data (reuse logic from main endpoint)
    let risksQuery = supabase
      .from('risk_inputs')
      .select(`
        id,
        kode_risiko,
        sasaran,
        user_id,
        organization_id,
        master_work_units(name),
        master_risk_categories(name)
      `);
    risksQuery = buildOrganizationFilter(risksQuery, req.user);
    
    const { data: userRisks, error: risksError } = await risksQuery;
    if (risksError) throw risksError;

    const riskIds = (userRisks || []).map(r => r.id);
    if (riskIds.length === 0) {
      return res.status(404).json({ error: 'No residual risk data found' });
    }

    // Get residual and inherent analysis
    const [residualResult, inherentResult] = await Promise.all([
      supabase.from('risk_residual_analysis').select('*').in('risk_input_id', riskIds),
      supabase.from('risk_inherent_analysis').select('*').in('risk_input_id', riskIds)
    ]);

    if (residualResult.error) throw residualResult.error;
    if (inherentResult.error) throw inherentResult.error;

    // Merge data
    const mergedData = (residualResult.data || []).map(residual => {
      const risk = (userRisks || []).find(r => r.id === residual.risk_input_id);
      const inherent = (inherentResult.data || []).find(i => i.risk_input_id === residual.risk_input_id);
      
      return {
        ...residual,
        risk_inputs: risk ? {
          ...risk,
          risk_inherent_analysis: inherent ? [inherent] : []
        } : null
      };
    });

    // Calculate statistics
    const stats = {
      total: mergedData.length,
      avgInherent: mergedData.reduce((sum, d) => sum + (d.risk_inputs?.risk_inherent_analysis?.[0]?.risk_value || 0), 0) / (mergedData.length || 1),
      avgResidual: mergedData.reduce((sum, d) => sum + (d.risk_value || 0), 0) / (mergedData.length || 1)
    };
    stats.reduction = stats.avgInherent > 0 ? ((stats.avgInherent - stats.avgResidual) / stats.avgInherent * 100).toFixed(1) : 0;

    // Generate HTML for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Residual Risk Analysis Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .stats { display: flex; justify-content: space-around; margin: 30px 0; }
            .stat-box { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
            .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .risk-low { background-color: #d4edda; color: #155724; }
            .risk-medium { background-color: #fff3cd; color: #856404; }
            .risk-high { background-color: #f8d7da; color: #721c24; }
            .risk-extreme { background-color: #f5c6cb; color: #721c24; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Residual Risk Analysis Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString('id-ID', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
        </div>
        
        <div class="stats">
            <div class="stat-box">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Total Residual Risks</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${stats.avgInherent.toFixed(2)}</div>
                <div class="stat-label">Avg Inherent Value</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${stats.avgResidual.toFixed(2)}</div>
                <div class="stat-label">Avg Residual Value</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${stats.reduction}%</div>
                <div class="stat-label">Risk Reduction</div>
            </div>
        </div>
        
        <h2>Residual Risk Details</h2>
        <table>
            <thead>
                <tr>
                    <th>Risk Code</th>
                    <th>Unit Kerja</th>
                    <th>Sasaran</th>
                    <th>Inherent</th>
                    <th>Residual</th>
                    <th>Reduction</th>
                    <th>Level</th>
                    <th>Review Status</th>
                    <th>Next Review</th>
                </tr>
            </thead>
            <tbody>
                ${mergedData.map(item => {
                  const risk = item.risk_inputs || {};
                  const inherent = risk.risk_inherent_analysis?.[0] || {};
                  const reduction = inherent.risk_value && item.risk_value 
                    ? ((inherent.risk_value - item.risk_value) / inherent.risk_value * 100).toFixed(1) + '%'
                    : '-';
                  
                  const getRiskClass = (level) => {
                    const classes = {
                      'EXTREME HIGH': 'risk-extreme',
                      'HIGH RISK': 'risk-high',
                      'MEDIUM RISK': 'risk-medium',
                      'LOW RISK': 'risk-low'
                    };
                    return classes[level] || '';
                  };
                  
                  return `
                    <tr>
                        <td><strong>${risk.kode_risiko || '-'}</strong></td>
                        <td>${risk.master_work_units?.name || '-'}</td>
                        <td>${(risk.sasaran || '').substring(0, 50)}${(risk.sasaran || '').length > 50 ? '...' : ''}</td>
                        <td class="${getRiskClass(inherent.risk_level)}">${inherent.risk_value || '-'}</td>
                        <td class="${getRiskClass(item.risk_level)}">${item.risk_value || '-'}</td>
                        <td><strong>${reduction}</strong></td>
                        <td class="${getRiskClass(item.risk_level)}">${item.risk_level || '-'}</td>
                        <td>${item.review_status || '-'}</td>
                        <td>${item.next_review_date || '-'}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
        
        <div class="footer">
            <p>This report was generated automatically by the Risk Management System</p>
            <p>© ${new Date().getFullYear()} Risk Management Application</p>
        </div>
    </body>
    </html>
    `;

    // Generate PDF with proper error handling
    let browser = null;
    try {
      console.log('Launching Puppeteer for PDF generation...');
      
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      });
      
      const page = await browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });
      
      console.log('Setting HTML content...');
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      console.log('Generating PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        preferCSSPageSize: true
      });
      
      await browser.close();
      browser = null;

      // Validate PDF buffer
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Generated PDF buffer is empty');
      }

      console.log(`PDF generated successfully: ${pdfBuffer.length} bytes`);

      // Send PDF response with proper headers
      const filename = `residual-risk-report-${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.end(pdfBuffer);
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      
      // Ensure browser is closed
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
      
      throw new Error('Failed to generate PDF: ' + pdfError.message);
    }

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
  }
});

router.get('/risk-appetite/pdf', authenticateUser, async (req, res) => {
  res.status(501).json({ 
    error: 'PDF export not yet implemented',
    message: 'PDF export untuk Risk Appetite belum diimplementasikan. Silakan gunakan Excel export.',
    availableFormats: ['excel']
  });
});

router.get('/kri/pdf', authenticateUser, async (req, res) => {
  res.status(501).json({ 
    error: 'PDF export not yet implemented',
    message: 'PDF export untuk KRI belum diimplementasikan. Silakan gunakan Excel export.',
    availableFormats: ['excel']
  });
});

router.get('/monitoring/pdf', authenticateUser, async (req, res) => {
  res.status(501).json({ 
    error: 'PDF export not yet implemented',
    message: 'PDF export untuk Monitoring & Evaluasi belum diimplementasikan. Silakan gunakan Excel export.',
    availableFormats: ['excel']
  });
});

router.get('/loss-event/pdf', authenticateUser, async (req, res) => {
  res.status(501).json({ 
    error: 'PDF export not yet implemented',
    message: 'PDF export untuk Loss Event belum diimplementasikan. Silakan gunakan Excel export.',
    availableFormats: ['excel']
  });
});

router.get('/strategic-map/pdf', authenticateUser, async (req, res) => {
  res.status(501).json({ 
    error: 'PDF export not yet implemented',
    message: 'PDF export untuk Strategic Map belum diimplementasikan. Silakan gunakan Excel export.',
    availableFormats: ['excel']
  });
});

// DEBUG: PDF without auth for testing
router.get('/residual-risk-pdf-debug', async (req, res) => {
  try {
    console.log('DEBUG: PDF generation without auth');
    
    // Check if puppeteer is available
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch (error) {
      console.error('Puppeteer not available:', error.message);
      return res.status(500).json({ 
        error: 'PDF generation not available: Puppeteer not installed',
        details: error.message 
      });
    }
    
    // Create sample data for PDF
    const sampleData = [
      {
        risk_inputs: {
          kode_risiko: 'RISK-001',
          sasaran: 'Improve system security',
          master_work_units: { name: 'IT Department' },
          risk_inherent_analysis: [{ risk_value: 12 }]
        },
        risk_value: 8,
        risk_level: 'MEDIUM RISK',
        review_status: 'Completed',
        next_review_date: '2025-03-01'
      }
    ];
    
    const stats = {
      total: sampleData.length,
      avgInherent: 12,
      avgResidual: 8,
      reduction: 33.3
    };

    // Simple HTML for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Residual Risk Analysis Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .stats { display: flex; justify-content: space-around; margin: 30px 0; }
            .stat-box { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
            .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Residual Risk Analysis Report (Debug)</h1>
            <p>Generated on: ${new Date().toLocaleDateString('id-ID', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
        </div>
        
        <div class="stats">
            <div class="stat-box">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Total Residual Risks</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${stats.avgInherent}</div>
                <div class="stat-label">Avg Inherent Value</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${stats.avgResidual}</div>
                <div class="stat-label">Avg Residual Value</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${stats.reduction}%</div>
                <div class="stat-label">Risk Reduction</div>
            </div>
        </div>
        
        <h2>Residual Risk Details</h2>
        <table>
            <thead>
                <tr>
                    <th>Risk Code</th>
                    <th>Unit Kerja</th>
                    <th>Sasaran</th>
                    <th>Inherent</th>
                    <th>Residual</th>
                    <th>Level</th>
                    <th>Review Status</th>
                </tr>
            </thead>
            <tbody>
                ${sampleData.map(item => {
                  const risk = item.risk_inputs || {};
                  const inherent = risk.risk_inherent_analysis?.[0] || {};
                  
                  return `
                    <tr>
                        <td><strong>${risk.kode_risiko || '-'}</strong></td>
                        <td>${risk.master_work_units?.name || '-'}</td>
                        <td>${(risk.sasaran || '').substring(0, 50)}</td>
                        <td>${inherent.risk_value || '-'}</td>
                        <td>${item.risk_value || '-'}</td>
                        <td>${item.risk_level || '-'}</td>
                        <td>${item.review_status || '-'}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
        
        <div class="footer">
            <p>This is a debug report generated automatically by the Risk Management System</p>
            <p>© ${new Date().getFullYear()} Risk Management Application</p>
        </div>
    </body>
    </html>
    `;

    // Generate PDF with error handling
    let browser = null;
    try {
      console.log('Launching Puppeteer...');
      
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      console.log('Generating PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true
      });
      
      await browser.close();
      browser = null;

      console.log(`PDF generated: ${pdfBuffer.length} bytes`);

      // Send PDF response
      const filename = `residual-risk-debug-${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.end(pdfBuffer);
      
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
      
      throw new Error('Failed to generate PDF: ' + pdfError.message);
    }
    
  } catch (error) {
    console.error('Debug PDF error:', error);
    res.status(500).json({ 
      error: 'Failed to generate debug PDF: ' + error.message,
      stack: error.stack 
    });
  }
});

module.exports = router;

