/**
 * MCP Integration Test for Rencana Strategis Refresh Fix
 * Tests the complete integration using MCP Supabase tools
 */

const { createClient } = require('@supabase/supabase-js');

async function testRencanaStrategisMCPIntegration() {
  console.log('=== TESTING RENCANA STRATEGIS MCP INTEGRATION ===');
  
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('✅ Supabase client initialized');
    
    // Test 1: Verify database connectivity and data
    console.log('\n1. Testing database connectivity...');
    
    const { data: rencanaData, error: rencanaError } = await supabase
      .from('rencana_strategis')
      .select('id, kode, nama_rencana, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (rencanaError) {
      console.error('❌ Database connection error:', rencanaError);
      return { success: false, error: rencanaError.message };
    }
    
    console.log(`✅ Database connected - Found ${rencanaData.length} rencana strategis records`);
    
    // Test 2: Verify data structure consistency
    console.log('\n2. Testing data structure consistency...');
    
    const structureValid = rencanaData.every(record => 
      record.id && 
      record.kode && 
      record.nama_rencana &&
      record.status
    );
    
    if (structureValid) {
      console.log('✅ Data structure is consistent');
    } else {
      console.log('⚠️ Some records have missing required fields');
    }
    
    // Test 3: Test API endpoints
    console.log('\n3. Testing API endpoints...');
    
    const endpoints = [
      'http://localhost:3000/api/rencana-strategis/public',
      'http://localhost:3000/api/rencana-strategis/generate/kode/public'
    ];
    
    const endpointResults = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        
        endpointResults[endpoint] = {
          status: response.status,
          success: response.ok,
          dataType: Array.isArray(data) ? 'array' : typeof data,
          dataLength: Array.isArray(data) ? data.length : null
        };
        
        console.log(`✅ ${endpoint}: ${response.status} - ${endpointResults[endpoint].dataType}`);
      } catch (error) {
        endpointResults[endpoint] = {
          success: false,
          error: error.message
        };
        console.log(`⚠️ ${endpoint}: ${error.message}`);
      }
    }
    
    // Test 4: Verify visi misi data for dropdown consistency
    console.log('\n4. Testing visi misi data...');
    
    const { data: visiMisiData, error: visiMisiError } = await supabase
      .from('visi_misi')
      .select('id, visi, misi, tahun, status')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (visiMisiError) {
      console.log('⚠️ Visi misi query error:', visiMisiError.message);
    } else {
      console.log(`✅ Visi misi data available - ${visiMisiData.length} records`);
      
      // Check for misi structure (important for dropdown)
      const misiStructureValid = visiMisiData.every(record => 
        record.misi && typeof record.misi === 'string'
      );
      
      if (misiStructureValid) {
        console.log('✅ Misi structure is valid for dropdown rendering');
      } else {
        console.log('⚠️ Some misi records may cause dropdown issues');
      }
    }
    
    // Test 5: Check for potential refresh issues in data
    console.log('\n5. Analyzing potential refresh issues...');
    
    const refreshIssueAnalysis = {
      duplicateKodes: false,
      missingRequiredFields: false,
      inconsistentStatus: false,
      jsonFieldIssues: false
    };
    
    // Check for duplicate kodes
    const kodes = rencanaData.map(r => r.kode);
    const uniqueKodes = [...new Set(kodes)];
    refreshIssueAnalysis.duplicateKodes = kodes.length !== uniqueKodes.length;
    
    // Check for missing required fields
    refreshIssueAnalysis.missingRequiredFields = !structureValid;
    
    // Check for inconsistent status values
    const statuses = rencanaData.map(r => r.status).filter(Boolean);
    const validStatuses = ['Draft', 'Final', 'Aktif'];
    refreshIssueAnalysis.inconsistentStatus = statuses.some(status => 
      !validStatuses.includes(status)
    );
    
    // Get full records to check JSON fields
    const { data: fullRecords } = await supabase
      .from('rencana_strategis')
      .select('sasaran_strategis, indikator_kinerja_utama')
      .limit(3);
    
    if (fullRecords) {
      refreshIssueAnalysis.jsonFieldIssues = fullRecords.some(record => {
        try {
          if (record.sasaran_strategis && typeof record.sasaran_strategis === 'string') {
            JSON.parse(record.sasaran_strategis);
          }
          if (record.indikator_kinerja_utama && typeof record.indikator_kinerja_utama === 'string') {
            JSON.parse(record.indikator_kinerja_utama);
          }
          return false;
        } catch (error) {
          return true;
        }
      });
    }
    
    console.log('Refresh issue analysis:', refreshIssueAnalysis);
    
    // Test 6: Generate test recommendations
    console.log('\n6. Generating recommendations...');
    
    const recommendations = [];
    
    if (refreshIssueAnalysis.duplicateKodes) {
      recommendations.push('Fix duplicate kode values in database');
    }
    
    if (refreshIssueAnalysis.missingRequiredFields) {
      recommendations.push('Ensure all records have required fields');
    }
    
    if (refreshIssueAnalysis.inconsistentStatus) {
      recommendations.push('Standardize status values to Draft/Final/Aktif');
    }
    
    if (refreshIssueAnalysis.jsonFieldIssues) {
      recommendations.push('Fix malformed JSON in sasaran_strategis/indikator_kinerja_utama fields');
    }
    
    if (endpointResults['http://localhost:3000/api/rencana-strategis/public']?.success === false) {
      recommendations.push('Ensure server is running and API endpoints are accessible');
    }
    
    if (visiMisiData.length === 0) {
      recommendations.push('Add visi misi data for dropdown functionality');
    }
    
    // Calculate overall health score
    const healthChecks = [
      rencanaData.length > 0,
      structureValid,
      !refreshIssueAnalysis.duplicateKodes,
      !refreshIssueAnalysis.missingRequiredFields,
      !refreshIssueAnalysis.inconsistentStatus,
      !refreshIssueAnalysis.jsonFieldIssues,
      visiMisiData.length > 0
    ];
    
    const healthScore = (healthChecks.filter(Boolean).length / healthChecks.length) * 100;
    
    console.log('\n=== MCP INTEGRATION TEST RESULTS ===');
    console.log(`Database Health Score: ${healthScore.toFixed(1)}%`);
    console.log(`Rencana Strategis Records: ${rencanaData.length}`);
    console.log(`Visi Misi Records: ${visiMisiData.length}`);
    console.log(`Data Structure Valid: ${structureValid ? '✅' : '❌'}`);
    console.log(`API Endpoints Working: ${Object.values(endpointResults).some(r => r.success) ? '✅' : '❌'}`);
    
    if (recommendations.length > 0) {
      console.log('\n📋 RECOMMENDATIONS:');
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    } else {
      console.log('\n🎉 NO ISSUES DETECTED - System is ready for refresh consistency fix!');
    }
    
    return {
      success: healthScore >= 80,
      healthScore,
      dataCount: rencanaData.length,
      visiMisiCount: visiMisiData.length,
      structureValid,
      endpointResults,
      refreshIssueAnalysis,
      recommendations
    };
    
  } catch (error) {
    console.error('❌ MCP integration test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testRencanaStrategisMCPIntegration()
    .then(result => {
      console.log('\n=== MCP INTEGRATION TEST COMPLETE ===');
      console.log('Final Result:', result.success ? '✅ PASSED' : '❌ FAILED');
      if (result.healthScore) {
        console.log(`System Health: ${result.healthScore.toFixed(1)}%`);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testRencanaStrategisMCPIntegration };