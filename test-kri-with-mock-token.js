// Using built-in fetch (Node.js 18+)

const API_BASE = 'http://localhost:3000';

async function testKRIWithMockToken() {
  try {
    console.log('=== Testing KRI with Mock Token ===');
    
    // Get mock token from test endpoint
    console.log('1. Getting mock token...');
    const tokenResponse = await fetch(`${API_BASE}/api/test-data/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Mock login failed: ${tokenResponse.status} ${await tokenResponse.text()}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('Mock token received for user:', tokenData.user?.email);
    
    const token = tokenData.access_token;
    if (!token) {
      throw new Error('No access token received');
    }
    
    // Test KRI endpoint with mock token
    console.log('2. Testing KRI endpoint with mock token...');
    const kriResponse = await fetch(`${API_BASE}/api/kri`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!kriResponse.ok) {
      throw new Error(`KRI request failed: ${kriResponse.status} ${await kriResponse.text()}`);
    }
    
    const kriData = await kriResponse.json();
    console.log('KRI data received:', kriData.length, 'records');
    
    if (kriData.length > 0) {
      console.log('Sample KRI:', {
        kode: kriData[0].kode,
        nama_indikator: kriData[0].nama_indikator,
        status_indikator: kriData[0].status_indikator,
        organization_id: kriData[0].organization_id,
        kategori: kriData[0].master_risk_categories?.name
      });
      
      // Show status distribution
      const statusCount = {};
      kriData.forEach(item => {
        const status = item.status_indikator || 'Unknown';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      
      console.log('Status distribution:', statusCount);
    }
    
    // Test KRI debug endpoint
    console.log('3. Testing KRI debug endpoint...');
    const debugResponse = await fetch(`${API_BASE}/api/kri/debug`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!debugResponse.ok) {
      console.log('Debug endpoint failed:', debugResponse.status, await debugResponse.text());
    } else {
      const debugData = await debugResponse.json();
      console.log('Debug info:');
      console.log('- User organizations:', debugData.user?.organizations);
      console.log('- Total KRI:', debugData.data_counts?.total_kri);
      console.log('- Filtered KRI:', debugData.data_counts?.filtered_kri);
      console.log('- User orgs count:', debugData.user_organizations?.length);
    }
    
    console.log('=== Test completed successfully ===');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run test
testKRIWithMockToken();