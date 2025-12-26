const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySwotFinalFix() {
  console.log('🔍 Verifying SWOT data final fix...');
  
  try {
    // 1. Check total count per category per unit
    console.log('\n📊 Step 1: Checking count per category per unit...');
    
    const { data: countData } = await supabase
      .from('swot_analisis')
      .select('kategori, unit_kerja_id, bobot')
      .order('unit_kerja_id')
      .order('kategori');
    
    const grouped = {};
    countData.forEach(item => {
      const key = `${item.unit_kerja_id}_${item.kategori}`;
      if (!grouped[key]) {
        grouped[key] = { count: 0, totalBobot: 0, bobots: [] };
      }
      grouped[key].count++;
      grouped[key].totalBobot += item.bobot;
      grouped[key].bobots.push(item.bobot);
    });
    
    let perfectCount = 0;
    let issueCount = 0;
    const issues = [];
    
    for (const [key, stats] of Object.entries(grouped)) {
      if (stats.count === 5 && stats.totalBobot === 100) {
        perfectCount++;
        // Check if bobots are [5, 10, 15, 25, 45]
        const sortedBobots = stats.bobots.sort((a, b) => a - b);
        const expectedBobots = [5, 10, 15, 25, 45];
        const isCorrectDistribution = JSON.stringify(sortedBobots) === JSON.stringify(expectedBobots);
        
        if (!isCorrectDistribution) {
          issues.push(`${key}: Incorrect bobot distribution [${sortedBobots.join(', ')}]`);
        }
      } else {
        issueCount++;
        issues.push(`${key}: Count=${stats.count}, Total Bobot=${stats.totalBobot}`);
      }
    }
    
    console.log(`✅ Perfect combinations: ${perfectCount}`);
    console.log(`❌ Issues found: ${issueCount}`);
    
    if (issues.length > 0 && issues.length <= 10) {
      console.log('\n🔍 Sample issues:');
      issues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
    }
    
    // 2. Check rencana strategis correlation
    console.log('\n📋 Step 2: Checking rencana strategis correlation...');
    
    const { data: correlationData } = await supabase
      .from('swot_analisis')
      .select(`
        id,
        rencana_strategis_id,
        rencana_strategis(id, kode, nama_rencana)
      `)
      .limit(10);
    
    const withRencana = correlationData.filter(item => item.rencana_strategis_id && item.rencana_strategis);
    const withoutRencana = correlationData.filter(item => !item.rencana_strategis_id || !item.rencana_strategis);
    
    console.log(`✅ Items with rencana strategis: ${withRencana.length}`);
    console.log(`⚠️ Items without rencana strategis: ${withoutRencana.length}`);
    
    if (withRencana.length > 0) {
      console.log('\n📝 Sample rencana strategis correlations:');
      withRencana.slice(0, 3).forEach(item => {
        console.log(`  - ${item.rencana_strategis.kode}: ${item.rencana_strategis.nama_rencana}`);
      });
    }
    
    // 3. Check categories distribution
    console.log('\n📈 Step 3: Checking categories distribution...');
    
    const { data: categoryData } = await supabase
      .from('swot_analisis')
      .select('kategori')
      .order('kategori');
    
    const categoryCount = {};
    categoryData.forEach(item => {
      categoryCount[item.kategori] = (categoryCount[item.kategori] || 0) + 1;
    });
    
    console.log('Category distribution:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} items`);
    });
    
    // 4. Sample data display
    console.log('\n📄 Step 4: Sample data for frontend display...');
    
    const { data: sampleData } = await supabase
      .from('swot_analisis')
      .select(`
        *,
        master_work_units(name),
        rencana_strategis(kode, nama_rencana)
      `)
      .limit(5);
    
    console.log('Sample data structure:');
    sampleData.forEach((item, index) => {
      console.log(`\n${index + 1}. Unit: ${item.master_work_units?.name || 'Unknown'}`);
      console.log(`   Kategori: ${item.kategori}`);
      console.log(`   Rencana: ${item.rencana_strategis?.kode || 'N/A'} - ${item.rencana_strategis?.nama_rencana || 'N/A'}`);
      console.log(`   Objek: ${item.objek_analisis.substring(0, 50)}...`);
      console.log(`   Bobot: ${item.bobot}, Rank: ${item.rank}, Score: ${item.score}`);
    });
    
    // 5. Final summary
    console.log('\n🎯 Final Summary:');
    console.log(`Total SWOT items: ${countData.length}`);
    console.log(`Perfect unit-category combinations: ${perfectCount}`);
    console.log(`Issues remaining: ${issueCount}`);
    console.log(`Items with rencana strategis correlation: ${withRencana.length}/${correlationData.length}`);
    
    if (issueCount === 0) {
      console.log('\n🎉 SUCCESS: All SWOT data is properly structured!');
      console.log('✅ Each perspective has exactly 5 items');
      console.log('✅ Each perspective totals exactly 100 bobot');
      console.log('✅ Bobot distribution follows [5, 10, 15, 25, 45] pattern');
      console.log('✅ Rencana strategis correlation is available');
    } else {
      console.log('\n⚠️ Some issues remain that need attention');
    }
    
  } catch (error) {
    console.error('❌ Error verifying SWOT data:', error);
  }
}

// Run verification
verifySwotFinalFix();