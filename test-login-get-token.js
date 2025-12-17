// Using built-in fetch (Node.js 18+)

async function getToken() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'amalinda.fajari@gmail.com',
        password: 'password123'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Login result:', result);
    
    if (result.token) {
      console.log('Token:', result.token);
      
      // Test risk profile endpoint with token
      const riskResponse = await fetch('http://localhost:3000/api/reports/risk-profile', {
        headers: {
          'Authorization': `Bearer ${result.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!riskResponse.ok) {
        throw new Error(`Risk Profile HTTP ${riskResponse.status}: ${riskResponse.statusText}`);
      }
      
      const riskData = await riskResponse.json();
      console.log('Risk Profile data:', riskData.length, 'items');
      if (riskData.length > 0) {
        console.log('Sample:', riskData[0]);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getToken();