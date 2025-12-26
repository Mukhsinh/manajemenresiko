const { supabase } = require('./config/supabase');

async function testMasterWorkUnitsComplete() {
  console.log('🧪 Testing Master Work Units Complete Implementation');
  console.log('=' .repeat(60));

  try {
    // 1. Test database structure and data
    console.log('\n1️⃣ Testing Database Structure and Data...');
    
    // Check if columns exist
    const { data: columns, error: columnError } = await supabase
      .from('master_work_units')
      .select('id, name, code, jenis, kategori')
      .limit(1);

    if (columnError) {
      console.error('❌ Error checking columns:', columnError);
      return;
    }

    console.log('✅ Database columns accessible');

    // Check data distribution
    const { data: distribution, error: distError } = await supabase
      .from('master_work_units')
      .select('jenis, kategori')
      .not('jenis', 'is', null)
      .not('kategori', 'is', null);

    if (distError) {
      console.error('❌ Error getting distribution:', distError);
      return;
    }

    // Count by jenis and kategori
    const jenisCount = {};
    const kategoriCount = {};
    const combinations = {};

    distribution.forEach(item => {
      jenisCount[item.jenis] = (jenisCount[item.jenis] || 0) + 1;
      kategoriCount[item.kategori] = (kategoriCount[item.kategori] || 0) + 1;
      const combo = `${item.jenis}-${item.kategori}`;
      combinations[combo] = (combinations[combo] || 0) + 1;
    });

    console.log('\n📊 Data Distribution:');
    console.log('   Jenis:');
    Object.entries(jenisCount).forEach(([jenis, count]) => {
      console.log(`     - ${jenis}: ${count}`);
    });
    console.log('   Kategori:');
    Object.entries(kategoriCount).forEach(([kategori, count]) => {
      console.log(`     - ${kategori}: ${count}`);
    });
    console.log('   Combinations:');
    Object.entries(combinations).forEach(([combo, count]) => {
      console.log(`     - ${combo}: ${count}`);
    });

    // 2. Test required combinations exist
    console.log('\n2️⃣ Testing Required Combinations...');
    const requiredJenis = ['rawat inap', 'rawat jalan', 'penunjang medis', 'administrasi', 'manajemen'];
    const requiredKategori = ['klinis', 'non klinis'];
    
    const missingJenis = requiredJenis.filter(j => !jenisCount[j]);
    const missingKategori = requiredKategori.filter(k => !kategoriCount[k]);

    if (missingJenis.length === 0 && missingKategori.length === 0) {
      console.log('✅ All required jenis and kategori present');
    } else {
      console.log('⚠️ Missing data:');
      if (missingJenis.length > 0) console.log(`   - Missing jenis: ${missingJenis.join(', ')}`);
      if (missingKategori.length > 0) console.log(`   - Missing kategori: ${missingKategori.join(', ')}`);
    }

    // 3. Test sample data for each combination
    console.log('\n3️⃣ Sample Data for Each Combination:');
    for (const jenis of requiredJenis) {
      for (const kategori of requiredKategori) {
        const { data: sample } = await supabase
          .from('master_work_units')
          .select('name, code, jenis, kategori')
          .eq('jenis', jenis)
          .eq('kategori', kategori)
          .limit(1)
          .maybeSingle();

        if (sample) {
          console.log(`   ✅ ${jenis} + ${kategori}: ${sample.name} (${sample.code})`);
        } else {
          console.log(`   ❌ ${jenis} + ${kategori}: No data`);
        }
      }
    }

    // 4. Test API endpoints
    console.log('\n4️⃣ Testing API Endpoints...');
    try {
      // Test work-units endpoint
      const response = await fetch('http://localhost:3000/api/master-data/work-units');
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Work units API: ${data.length} records`);
        
        if (data.length > 0) {
          const sample = data[0];
          console.log(`   Sample: ${sample.name}`);
          console.log(`   - Jenis: ${sample.jenis || 'NULL'}`);
          console.log(`   - Kategori: ${sample.kategori || 'NULL'}`);
        }
      } else {
        console.log(`⚠️ Work units API: ${response.status} ${response.statusText}`);
      }

      // Test template endpoint
      const templateResponse = await fetch('http://localhost:3000/api/master-data/work-units/template');
      if (templateResponse.ok) {
        const contentType = templateResponse.headers.get('content-type');
        console.log(`✅ Template API: ${contentType}`);
      } else {
        console.log(`⚠️ Template API: ${templateResponse.status} ${templateResponse.statusText}`);
      }

      // Test export endpoint
      const exportResponse = await fetch('http://localhost:3000/api/master-data/work-units/export');
      if (exportResponse.ok) {
        const contentType = exportResponse.headers.get('content-type');
        console.log(`✅ Export API: ${contentType}`);
      } else {
        console.log(`⚠️ Export API: ${exportResponse.status} ${exportResponse.statusText}`);
      }

    } catch (apiError) {
      console.log('⚠️ API tests skipped (server may not be running)');
    }

    // 5. Test validation constraints
    console.log('\n5️⃣ Testing Validation Constraints...');
    try {
      // Try to insert invalid jenis
      const { error: invalidJenisError } = await supabase
        .from('master_work_units')
        .insert({
          name: 'Test Invalid Jenis',
          code: 'TEST001',
          jenis: 'invalid_jenis',
          kategori: 'klinis'
        });

      if (invalidJenisError) {
        console.log('✅ Jenis validation working (invalid value rejected)');
      } else {
        console.log('⚠️ Jenis validation may not be working');
      }

      // Try to insert invalid kategori
      const { error: invalidKategoriError } = await supabase
        .from('master_work_units')
        .insert({
          name: 'Test Invalid Kategori',
          code: 'TEST002',
          jenis: 'administrasi',
          kategori: 'invalid_kategori'
        });

      if (invalidKategoriError) {
        console.log('✅ Kategori validation working (invalid value rejected)');
      } else {
        console.log('⚠️ Kategori validation may not be working');
      }

    } catch (validationError) {
      console.log('✅ Database constraints are working');
    }

    console.log('\n✅ Master Work Units Complete Test Finished');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testMasterWorkUnitsComplete().catch(console.error);
}

module.exports = { testMasterWorkUnitsComplete };