// Using built-in fetch (Node.js 18+)

const API_BASE = 'http://localhost:3000';

async function testKRINoAuth() {
  try {
    console.log('=== Testing KRI without Auth ===');
    
    // Test KRI endpoint without auth
    console.log('1. Testing KRI endpoint (no auth)...');
    const kriResponse = await fetch(`${API_BASE}/api/kri/test-no-auth`);
    
    if (!kriResponse.ok) {
      throw new Error(`KRI no-auth failed: ${kriResponse.status} ${await kriResponse.text()}`);
    }
    
    const kriData = await kriResponse.json();
    console.log('KRI data received:', kriData.length, 'records');
    
    if (kriData.length > 0) {
      console.log('Sample KRI:', {
        kode: kriData[0].kode,
        nama_indikator: kriData[0].nama_indikator,
        status_indikator: kriData[0].status_indikator,
        organization_id: kriData[0].organization_id,
        kategori: kriData[0].master_risk_categories?.name,
        unit_kerja: kriData[0].master_work_units?.name
      });
      
      // Show status distribution
      const statusCount = {};
      kriData.forEach(item => {
        const status = item.status_indikator || 'Unknown';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      
      console.log('Status distribution:', statusCount);
    }
    
    console.log('=== Test completed successfully ===');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run test
testKRINoAuth();