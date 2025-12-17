// Test KRI with valid Supabase token

async function testKRIWithValidToken() {
  try {
    console.log('=== Testing KRI with Valid Token ===');
    
    // First, let's check if we can get a valid token from localStorage simulation
    // In real app, this would come from Supabase auth
    
    // Test 1: Try KRI endpoint without token (should fail)
    console.log('1. Testing KRI endpoint without token...');
    try {
      const response = await fetch('http://localhost:3000/api/kri');
      console.log('Response status:', response.status);
      if (!response.ok) {
        console.log('Expected failure:', await response.text());
      }
    } catch (error) {
      console.log('Expected error:', error.message);
    }
    
    // Test 2: Try with mock token (will fail but shows the flow)
    console.log('2. Testing KRI endpoint with mock token...');
    try {
      const response = await fetch('http://localhost:3000/api/kri', {
        headers: {
          'Authorization': 'Bearer mock-token-for-testing'
        }
      });
      console.log('Response status:', response.status);
      if (!response.ok) {
        console.log('Expected failure:', await response.text());
      }
    } catch (error) {
      console.log('Expected error:', error.message);
    }
    
    // Test 3: Use test endpoint (should work)
    console.log('3. Testing KRI test endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/kri/test-no-auth');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Test endpoint works:', data.length, 'records');
        
        if (data.length > 0) {
          console.log('Sample data:', {
            kode: data[0].kode,
            nama_indikator: data[0].nama_indikator,
            status_indikator: data[0].status_indikator
          });
        }
      } else {
        console.log('❌ Test endpoint failed:', response.status);
      }
    } catch (error) {
      console.log('❌ Test endpoint error:', error.message);
    }
    
    console.log('=== Test completed ===');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run test
testKRIWithValidToken();