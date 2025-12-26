// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(endpoint, description) {
  try {
    console.log(`\n🔍 Testing ${description}...`);
    console.log(`   Endpoint: ${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${description} - SUCCESS`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data count: ${Array.isArray(data) ? data.length : (data.data ? data.data.length : 'N/A')}`);
      return { success: true, data, status: response.status };
    } else {
      console.log(`❌ ${description} - FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || data.message || 'Unknown error'}`);
      return { success: false, error: data, status: response.status };
    }
  } catch (error) {
    console.log(`❌ ${description} - ERROR`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runComprehensiveTests() {
  console.log('🚀 COMPREHENSIVE FIXES VERIFICATION');
  console.log('=====================================');
  
  const tests = [
    // Strategic Map
    { endpoint: '/api/strategic-map', description: 'Strategic Map Main Endpoint' },
    
    // Sasaran Strategi
    { endpoint: '/api/sasaran-strategi', description: 'Sasaran Strategi Main Endpoint' },
    { endpoint: '/api/sasaran-strategi/debug', description: 'Sasaran Strategi Debug Endpoint' },
    { endpoint: '/api/sasaran-strategi/simple', description: 'Sasaran Strategi Simple Endpoint' },
    { endpoint: '/api/sasaran-strategi/public', description: 'Sasaran Strategi Public Endpoint' },
    
    // Indikator Kinerja Utama
    { endpoint: '/api/indikator-kinerja-utama', description: 'Indikator Kinerja Utama Main Endpoint' },
    { endpoint: '/api/indikator-kinerja-utama/debug', description: 'Indikator Kinerja Utama Debug Endpoint' },
    { endpoint: '/api/indikator-kinerja-utama/simple', description: 'Indikator Kinerja Utama Simple Endpoint' },
    { endpoint: '/api/indikator-kinerja-utama/public', description: 'Indikator Kinerja Utama Public Endpoint' },
    
    // Risk Profile
    { endpoint: '/api/risk-profile', description: 'Risk Profile Main Endpoint' },
    { endpoint: '/api/risk-profile/debug', description: 'Risk Profile Debug Endpoint' },
    { endpoint: '/api/risk-profile/simple', description: 'Risk Profile Simple Endpoint' },
    { endpoint: '/api/risk-profile/public', description: 'Risk Profile Public Endpoint' },
    
    // Peluang
    { endpoint: '/api/peluang', description: 'Peluang Main Endpoint' },
    { endpoint: '/api/peluang/debug', description: 'Peluang Debug Endpoint' },
    { endpoint: '/api/peluang/simple', description: 'Peluang Simple Endpoint' },
    { endpoint: '/api/peluang/public', description: 'Peluang Public Endpoint' },
    
    // Monitoring Evaluasi
    { endpoint: '/api/monitoring-evaluasi', description: 'Monitoring Evaluasi Main Endpoint' },
    { endpoint: '/api/monitoring-evaluasi/debug', description: 'Monitoring Evaluasi Debug Endpoint' },
    { endpoint: '/api/monitoring-evaluasi/simple', description: 'Monitoring Evaluasi Simple Endpoint' },
    { endpoint: '/api/monitoring-evaluasi/test', description: 'Monitoring Evaluasi Test Endpoint' },
    
    // KRI
    { endpoint: '/api/kri', description: 'KRI Main Endpoint' },
    { endpoint: '/api/kri/debug', description: 'KRI Debug Endpoint' },
    { endpoint: '/api/kri/simple', description: 'KRI Simple Endpoint' },
    { endpoint: '/api/kri/test-no-auth', description: 'KRI Test No Auth Endpoint' }
  ];
  
  const results = {
    total: tests.length,
    passed: 0,
    failed: 0,
    details: []
  };
  
  for (const test of tests) {
    const result = await testEndpoint(test.endpoint, test.description);
    results.details.push({
      ...test,
      ...result
    });
    
    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  // Group results by module
  console.log('\n📋 RESULTS BY MODULE');
  console.log('=====================');
  
  const modules = {
    'Strategic Map': results.details.filter(r => r.description.includes('Strategic Map')),
    'Sasaran Strategi': results.details.filter(r => r.description.includes('Sasaran Strategi')),
    'Indikator Kinerja Utama': results.details.filter(r => r.description.includes('Indikator Kinerja Utama')),
    'Risk Profile': results.details.filter(r => r.description.includes('Risk Profile')),
    'Peluang': results.details.filter(r => r.description.includes('Peluang')),
    'Monitoring Evaluasi': results.details.filter(r => r.description.includes('Monitoring Evaluasi')),
    'KRI': results.details.filter(r => r.description.includes('KRI'))
  };
  
  for (const [moduleName, moduleResults] of Object.entries(modules)) {
    const moduleSuccess = moduleResults.filter(r => r.success).length;
    const moduleTotal = moduleResults.length;
    const moduleRate = moduleTotal > 0 ? ((moduleSuccess / moduleTotal) * 100).toFixed(1) : 0;
    
    console.log(`\n${moduleName}:`);
    console.log(`  ✅ ${moduleSuccess}/${moduleTotal} endpoints working (${moduleRate}%)`);
    
    // Show failed endpoints
    const failed = moduleResults.filter(r => !r.success);
    if (failed.length > 0) {
      console.log(`  ❌ Failed endpoints:`);
      failed.forEach(f => {
        console.log(`     - ${f.endpoint}: ${f.error?.error || f.error || 'Unknown error'}`);
      });
    }
  }
  
  console.log('\n🎯 FIXES VERIFICATION COMPLETE');
  console.log('===============================');
  
  if (results.passed === results.total) {
    console.log('🎉 ALL FIXES SUCCESSFULLY IMPLEMENTED!');
  } else if (results.passed > results.total * 0.8) {
    console.log('✅ MOST FIXES WORKING - Minor issues remain');
  } else {
    console.log('⚠️  SOME FIXES NEED ATTENTION');
  }
  
  return results;
}

// Run the tests
runComprehensiveTests().catch(console.error);