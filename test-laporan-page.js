// Test Laporan Page
const http = require('http');

const BASE_URL = 'http://localhost:3001';

async function fetchJSON(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data.substring(0, 200) });
        }
      });
    }).on('error', reject);
  });
}

async function testLaporanEndpoints() {
  console.log('🧪 Testing Laporan Page Endpoints\n');
  
  const endpoints = [
    { name: 'Risk Register', path: '/api/reports/risk-register-debug' },
    { name: 'Risk Profile', path: '/api/reports/risk-profile-debug' },
    { name: 'Residual Risk Simple', path: '/api/reports/residual-risk-simple' },
    { name: 'Test Excel', path: '/api/reports/test-excel-download' }
  ];
  
  for (const ep of endpoints) {
    try {
      console.log(`📡 Testing ${ep.name}...`);
      const result = await fetchJSON(ep.path);
      console.log(`   Status: ${result.status}`);
      if (result.status === 200) {
        console.log(`   ✅ ${ep.name} - OK`);
        if (result.data && typeof result.data === 'object') {
          console.log(`   Records: ${result.data.recordCount || (Array.isArray(result.data) ? result.data.length : 'N/A')}`);
        }
      } else {
        console.log(`   ⚠️ ${ep.name} - Status ${result.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${ep.name} - Error: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('✅ Test completed');
}

testLaporanEndpoints().catch(console.error);
