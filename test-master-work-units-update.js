const { supabase } = require('./config/supabase');

async function testMasterWorkUnitsUpdate() {
  console.log('🧪 Testing Master Work Units Update with Jenis and Kategori');
  console.log('=' .repeat(60));

  try {
    // 1. Test data retrieval with new columns
    console.log('\n1️⃣ Testing Data Retrieval...');
    const { data: workUnits, error: dataError } = await supabase
      .from('master_work_units')
      .select('id, name, code, jenis, kategori, organizations(name)')
      .limit(5);

    if (dataError) {
      console.error('❌ Error retrieving data:', dataError);
    } else {
      console.log('✅ Data retrieved successfully');
      console.log(`   - Records found: ${workUnits?.length || 0}`);
      
      if (workUnits && workUnits.length > 0) {
        console.log('\n📊 Sample Data:');
        workUnits.forEach((unit, index) => {
          console.log(`   ${index + 1}. ${unit.name}`);
          console.log(`      - Code: ${unit.code}`);
          console.log(`      - Jenis: ${unit.jenis || 'NULL'}`);
          console.log(`      - Kategori: ${unit.kategori || 'NULL'}`);
          console.log(`      - Organization: ${unit.organizations?.name || 'NULL'}`);
        });
      }
    }

    // 2. Test API endpoint
    console.log('\n2️⃣ Testing API Endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/master-data/work-units', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const apiData = await response.json();
        console.log('✅ API endpoint working');
        console.log(`   - API returned: ${apiData?.length || 0} records`);
        
        if (apiData && apiData.length > 0) {
          const sample = apiData[0];
          console.log('\n📊 API Sample Data:');
          console.log(`   - Name: ${sample.name}`);
          console.log(`   - Jenis: ${sample.jenis || 'NULL'}`);
          console.log(`   - Kategori: ${sample.kategori || 'NULL'}`);
        }
      } else {
        console.log('⚠️ API endpoint returned:', response.status, response.statusText);
      }
    } catch (apiError) {
      console.log('⚠️ API test skipped (server may not be running):', apiError.message);
    }

    // 3. Test data validation
    console.log('\n3️⃣ Testing Data Validation...');
    const validJenis = ['rawat inap', 'rawat jalan', 'penunjang medis', 'administrasi', 'manajemen'];
    const validKategori = ['klinis', 'non klinis'];
    
    if (workUnits && workUnits.length > 0) {
      let validJenisCount = 0;
      let validKategoriCount = 0;
      
      workUnits.forEach(unit => {
        if (unit.jenis && validJenis.includes(unit.jenis)) validJenisCount++;
        if (unit.kategori && validKategori.includes(unit.kategori)) validKategoriCount++;
      });
      
      console.log(`   - Valid Jenis values: ${validJenisCount}/${workUnits.length}`);
      console.log(`   - Valid Kategori values: ${validKategoriCount}/${workUnits.length}`);
    }

    console.log('\n✅ Master Work Units Update Test Completed');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMasterWorkUnitsUpdate().catch(console.error);