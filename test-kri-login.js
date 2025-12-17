// Using built-in fetch (Node.js 18+)

const API_BASE = 'http://localhost:3000';

async function testKRIWithLogin() {
  try {
    console.log('=== Testing KRI with Login ===');
    
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'mukhsin9@gmail.com',
        password: 'password'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${await loginResponse.text()}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful:', loginData.user?.email);
    
    const token = loginData.access_token;
    if (!token) {
      throw new Error('No access token received');
    }
    
    // Step 2: Test KRI endpoint
    console.log('2. Testing KRI endpoint...');
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
        organization_id: kriData[0].organization_id
      });
    }
    
    // Step 3: Test KRI debug endpoint
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
      console.log('Debug info:', JSON.stringify(debugData, null, 2));
    }
    
    console.log('=== Test completed successfully ===');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run test
testKRIWithLogin();