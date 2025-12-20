const http = require('http');

async function testResidualAPI() {
  try {
    console.log('=== Testing Residual Risk API Debug ===');
    
    // Test 1: Login
    console.log('\n1. Testing Login...');
    const loginData = JSON.stringify({
      email: 'mukhsin9@gmail.com',
      password: 'admin123'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const loginResult = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('Login Status:', res.statusCode);
            console.log('Login Response:', response);
            resolve({ status: res.statusCode, data: response });
          } catch (e) {
            console.log('Login Raw Response:', data);
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });
    
    const token = loginResult.data.session?.access_token || loginResult.data.token;
    
    if (!token) {
      throw new Error('No token received from login');
    }
    console.log('✅ Login successful, token received');
    
    // Test 2: Residual Risk API
    console.log('\n2. Testing Residual Risk API...');
    const apiOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/reports/residual-risk',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const apiResult = await new Promise((resolve, reject) => {
      const req = http.request(apiOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('API Status:', res.statusCode);
            console.log('API Response Length:', response.length);
            resolve({ status: res.statusCode, data: response });
          } catch (e) {
            console.log('API Raw Response:', data);
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    console.log('✅ API Response Status:', apiResult.status);
    console.log('✅ Data Count:', apiResult.data.length);
    
    if (apiResult.data.length > 0) {
      console.log('\n3. Sample Data Analysis:');
      const sample = apiResult.data[0];
      console.log('Sample Record Structure:');
      console.log('- ID:', sample.id);
      console.log('- Risk Input ID:', sample.risk_input_id);
      console.log('- Probability:', sample.probability);
      console.log('- Impact:', sample.impact);
      console.log('- Risk Value:', sample.risk_value);
      console.log('- Risk Level:', sample.risk_level);
      console.log('- Has Risk Inputs:', !!sample.risk_inputs);
      
      if (sample.risk_inputs) {
        console.log('- Risk Code:', sample.risk_inputs.kode_risiko);
        console.log('- Has Inherent Analysis:', !!sample.risk_inputs.risk_inherent_analysis);
        console.log('- Inherent Analysis Length:', sample.risk_inputs.risk_inherent_analysis?.length || 0);
      }
      
      // Calculate statistics like frontend does
      console.log('\n4. Statistics Calculation:');
      const stats = {
        total: apiResult.data.length,
        avgInherent: apiResult.data.reduce((sum, d) => sum + (d.risk_inputs?.risk_inherent_analysis?.[0]?.risk_value || 0), 0) / (apiResult.data.length || 1),
        avgResidual: apiResult.data.reduce((sum, d) => sum + (d.risk_value || 0), 0) / (apiResult.data.length || 1)
      };
      stats.reduction = stats.avgInherent > 0 ? ((stats.avgInherent - stats.avgResidual) / stats.avgInherent * 100).toFixed(1) : 0;
      
      console.log('Calculated Stats:');
      console.log('- Total:', stats.total);
      console.log('- Avg Inherent:', stats.avgInherent);
      console.log('- Avg Residual:', stats.avgResidual);
      console.log('- Reduction:', stats.reduction + '%');
    } else {
      console.log('❌ No data returned from API');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testResidualAPI();