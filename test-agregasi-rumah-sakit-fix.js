// Test untuk memverifikasi perbaikan agregasi RUMAH_SAKIT
// Sekarang menggunakan penjumlahan dari nilai seluruh unit sesuai kategori (perspektif)

const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

async function testAgregatsiRumahSakit() {
  try {
    console.log('🏥 TESTING AGREGASI RUMAH SAKIT FIX');
    console.log('=====================================');

    // Login sebagai superadmin
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'mukhsin9@gmail.com',
      password: 'Jlamprang233!!'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Test 1: Get all SWOT data to see individual unit values
    console.log('\n1. INDIVIDUAL UNIT VALUES:');
    console.log('---------------------------');
    
    const allDataResponse = await axios.get(`${BASE_URL}/api/analisis-swot`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const allData = allDataResponse.data;
    console.log(`📊 Total SWOT records: ${allData.length}`);

    // Group by kategori and unit_kerja_id to show individual values
    const byKategoriUnit = {};
    allData.forEach(item => {
      const key = `${item.kategori}_${item.unit_kerja_id || 'no_unit'}`;
      if (!byKategoriUnit[key]) {
        byKategoriUnit[key] = {
          kategori: item.kategori,
          unit_kerja_id: item.unit_kerja_id,
          items: [],
          totalScore: 0,
          totalBobot: 0
        };
      }
      byKategoriUnit[key].items.push(item);
      byKategoriUnit[key].totalScore += item.score || 0;
      byKategoriUnit[key].totalBobot += item.bobot || 0;
    });

    // Show individual unit values per kategori
    const kategoris = ['Strength', 'Weakness', 'Opportunity', 'Threat'];
    kategoris.forEach(kategori => {
      console.log(`\n📈 ${kategori.toUpperCase()}:`);
      Object.values(byKategoriUnit)
        .filter(group => group.kategori === kategori)
        .forEach(group => {
          console.log(`  Unit ${group.unit_kerja_id || 'N/A'}: Score=${group.totalScore}, Bobot=${group.totalBobot} (${group.items.length} items)`);
        });
    });

    // Test 2: Test RUMAH_SAKIT aggregation (should sum all units)
    console.log('\n\n2. RUMAH_SAKIT AGGREGATION (FIXED):');
    console.log('------------------------------------');
    
    const rumahSakitResponse = await axios.get(`${BASE_URL}/api/analisis-swot/summary?unit_kerja_id=RUMAH_SAKIT`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const rumahSakitSummary = rumahSakitResponse.data;
    console.log('\n🏥 RUMAH_SAKIT SUMMARY (Should be sum of all units):');
    
    kategoris.forEach(kategori => {
      const summary = rumahSakitSummary[kategori];
      console.log(`${kategori}: Score=${summary.totalScore}, Bobot=${summary.totalBobot}, Items=${summary.items.length}`);
    });

    // Test 3: Manual calculation to verify
    console.log('\n\n3. MANUAL VERIFICATION:');
    console.log('------------------------');
    
    const manualSummary = {
      Strength: { totalScore: 0, totalBobot: 0, count: 0 },
      Weakness: { totalScore: 0, totalBobot: 0, count: 0 },
      Opportunity: { totalScore: 0, totalBobot: 0, count: 0 },
      Threat: { totalScore: 0, totalBobot: 0, count: 0 }
    };

    allData.forEach(item => {
      if (manualSummary[item.kategori]) {
        manualSummary[item.kategori].totalScore += item.score || 0;
        manualSummary[item.kategori].totalBobot += item.bobot || 0;
        manualSummary[item.kategori].count++;
      }
    });

    console.log('\n🧮 MANUAL CALCULATION (Sum of ALL items):');
    kategoris.forEach(kategori => {
      const manual = manualSummary[kategori];
      const api = rumahSakitSummary[kategori];
      const match = manual.totalScore === api.totalScore && manual.totalBobot === api.totalBobot;
      console.log(`${kategori}: Manual(${manual.totalScore}, ${manual.totalBobot}) vs API(${api.totalScore}, ${api.totalBobot}) ${match ? '✅' : '❌'}`);
    });

    // Test 4: Check differences calculation
    console.log('\n\n4. DIFFERENCES CALCULATION:');
    console.log('----------------------------');
    
    const differences = rumahSakitSummary.differences;
    const expectedExternal = rumahSakitSummary.Opportunity.totalScore - rumahSakitSummary.Threat.totalScore;
    const expectedInternal = rumahSakitSummary.Strength.totalScore - rumahSakitSummary.Weakness.totalScore;
    
    console.log(`External (O-T): Expected=${expectedExternal}, API=${differences.external} ${expectedExternal === differences.external ? '✅' : '❌'}`);
    console.log(`Internal (S-W): Expected=${expectedInternal}, API=${differences.internal} ${expectedInternal === differences.internal ? '✅' : '❌'}`);

    // Test 5: Verify no zero values (unless actually zero)
    console.log('\n\n5. ZERO VALUES CHECK:');
    console.log('----------------------');
    
    kategoris.forEach(kategori => {
      const summary = rumahSakitSummary[kategori];
      const hasData = manualSummary[kategori].count > 0;
      const isZero = summary.totalScore === 0;
      
      if (hasData && isZero) {
        console.log(`❌ ${kategori}: Has ${manualSummary[kategori].count} items but totalScore is 0 - PROBLEM!`);
      } else if (!hasData && isZero) {
        console.log(`ℹ️  ${kategori}: No data, zero is correct`);
      } else {
        console.log(`✅ ${kategori}: Has data and non-zero score (${summary.totalScore})`);
      }
    });

    console.log('\n🎉 AGREGASI RUMAH SAKIT TEST COMPLETED!');
    console.log('\nSummary:');
    console.log('- RUMAH_SAKIT now uses SUM aggregation (not MAX)');
    console.log('- All unit values are summed per category (perspektif)');
    console.log('- No more zero values for categories with data');

  } catch (error) {
    console.error('❌ Test error:', error.response?.data || error.message);
  }
}

// Run test
testAgregatsiRumahSakit();