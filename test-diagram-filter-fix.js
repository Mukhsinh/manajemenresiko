/**
 * Test Diagram Kartesius Filter Fix
 * Verifikasi filter kategori dan tahun berfungsi dengan benar
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function login() {
  const result = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@example.com', password: 'admin123' }
  });
  return result.data?.token;
}

async function testFilters() {
  console.log('🧪 Testing Diagram Kartesius Filters\n');
  
  // Login first
  console.log('1️⃣ Logging in...');
  const token = await login();
  if (!token) {
    console.log('❌ Login failed, trying without auth...');
  } else {
    console.log('✅ Login successful\n');
  }
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  // Test 1: Get work units to see available jenis/kategori
  console.log('2️⃣ Getting work units...');
  const workUnitsResult = await makeRequest('/api/master-data/work-units', { headers });
  const workUnits = workUnitsResult.data || [];
  
  const uniqueJenis = [...new Set(workUnits.map(u => u.jenis).filter(Boolean))];
  const uniqueKategori = [...new Set(workUnits.map(u => u.kategori).filter(Boolean))];
  
  console.log('   Available Jenis:', uniqueJenis);
  console.log('   Available Kategori:', uniqueKategori);
  console.log('');
  
  // Test 2: Get all diagram data
  console.log('3️⃣ Getting all diagram data...');
  const allData = await makeRequest('/api/diagram-kartesius?tahun=2026', { headers });
  console.log(`   Total diagrams: ${allData.data?.length || 0}`);
  console.log('');
  
  // Test 3: Filter by kategori "klinis"
  console.log('4️⃣ Testing filter by kategori "klinis"...');
  const klinisResult = await makeRequest('/api/diagram-kartesius?tahun=2026&kategori=klinis', { headers });
  console.log(`   Results with kategori=klinis: ${klinisResult.data?.length || 0}`);
  if (klinisResult.data?.length > 0) {
    klinisResult.data.slice(0, 3).forEach(item => {
      const unit = item.master_work_units;
      console.log(`   - ${unit?.code || 'N/A'}: ${unit?.name || item.unit_kerja_name} (kategori: ${unit?.kategori || 'N/A'})`);
    });
  }
  console.log('');
  
  // Test 4: Filter by kategori "Klinis" (capitalized)
  console.log('5️⃣ Testing filter by kategori "Klinis" (capitalized)...');
  const klinisCapResult = await makeRequest('/api/diagram-kartesius?tahun=2026&kategori=Klinis', { headers });
  console.log(`   Results with kategori=Klinis: ${klinisCapResult.data?.length || 0}`);
  console.log('');
  
  // Test 5: Filter by jenis "rawat jalan"
  console.log('6️⃣ Testing filter by jenis "rawat jalan"...');
  const rawatJalanResult = await makeRequest('/api/diagram-kartesius?tahun=2026&jenis=rawat%20jalan', { headers });
  console.log(`   Results with jenis=rawat jalan: ${rawatJalanResult.data?.length || 0}`);
  if (rawatJalanResult.data?.length > 0) {
    rawatJalanResult.data.slice(0, 3).forEach(item => {
      const unit = item.master_work_units;
      console.log(`   - ${unit?.code || 'N/A'}: ${unit?.name || item.unit_kerja_name} (jenis: ${unit?.jenis || 'N/A'})`);
    });
  }
  console.log('');
  
  // Test 6: Filter by tahun 2025
  console.log('7️⃣ Testing filter by tahun 2025...');
  const tahun2025Result = await makeRequest('/api/diagram-kartesius?tahun=2025', { headers });
  console.log(`   Results with tahun=2025: ${tahun2025Result.data?.length || 0}`);
  console.log('');
  
  // Test 7: Combined filter
  console.log('8️⃣ Testing combined filter (kategori=klinis, jenis=rawat jalan, tahun=2026)...');
  const combinedResult = await makeRequest('/api/diagram-kartesius?tahun=2026&kategori=klinis&jenis=rawat%20jalan', { headers });
  console.log(`   Results: ${combinedResult.data?.length || 0}`);
  console.log('');
  
  // Summary
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ All diagrams (2026): ${allData.data?.length || 0}`);
  console.log(`✅ Filter kategori=klinis: ${klinisResult.data?.length || 0}`);
  console.log(`✅ Filter kategori=Klinis (cap): ${klinisCapResult.data?.length || 0}`);
  console.log(`✅ Filter jenis=rawat jalan: ${rawatJalanResult.data?.length || 0}`);
  console.log(`✅ Filter tahun=2025: ${tahun2025Result.data?.length || 0}`);
  console.log(`✅ Combined filter: ${combinedResult.data?.length || 0}`);
  
  // Check if case-insensitive works
  if (klinisResult.data?.length === klinisCapResult.data?.length) {
    console.log('\n✅ Case-insensitive filter WORKING!');
  } else {
    console.log('\n⚠️ Case-insensitive filter may have issues');
  }
}

testFilters().catch(console.error);
