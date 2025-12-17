// Using built-in fetch (Node.js 18+)

const API_BASE = 'http://localhost:3000';

async function testKRIDirect() {
  try {
    console.log('=== Testing KRI Direct API ===');
    
    // Test direct KRI endpoint (no auth)
    console.log('1. Testing direct KRI endpoint...');
    const directResponse = await fetch(`${API_BASE}/api/test-data/kri-direct`);
    
    if (!directResponse.ok) {
      throw new Error(`Direct KRI failed: ${directResponse.status} ${await directResponse.text()}`);
    }
    
    const directData = await directResponse.json();
    console.log('Direct KRI data received:', directData.length, 'records');
    
    if (directData.length > 0) {
      console.log('Sample direct KRI:', {
        kode: directData[0].kode,
        nama_indikator: directData[0].nama_indikator,
        status_indikator: directData[0].status_indikator,
        organization_id: directData[0].organization_id,
        kategori: directData[0].master_risk_categories?.name
      });
    }
    
    // Test data counts
    console.log('2. Testing data counts...');
    const countsResponse = await fetch(`${API_BASE}/api/test-data/data-counts`);
    
    if (!countsResponse.ok) {
      throw new Error(`Data counts failed: ${countsResponse.status} ${await countsResponse.text()}`);
    }
    
    const countsData = await countsResponse.json();
    console.log('Data counts:', {
      key_risk_indicator: countsData.key_risk_indicator,
      risk_inputs: countsData.risk_inputs,
      organizations: countsData.organizations,
      user_profiles: countsData.user_profiles
    });
    
    console.log('=== Test completed successfully ===');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run test
testKRIDirect();