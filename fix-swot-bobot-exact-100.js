const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSwotBobotExact100() {
  console.log('🔧 Fixing SWOT bobot to exactly 100 per perspective...');
  
  try {
    // Get all units and categories
    const { data: allData } = await supabase
      .from('swot_analisis')
      .select('id, unit_kerja_id, kategori, bobot, rank')
      .order('unit_kerja_id')
      .order('kategori')
      .order('created_at');
    
    // Group by unit_kerja_id and kategori
    const grouped = {};
    allData.forEach(item => {
      const key = `${item.unit_kerja_id}_${item.kategori}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    
    // Fixed bobot distribution that sums to 100
    const targetBobots = [5, 10, 15, 25, 45]; // Total = 100
    
    let fixedCount = 0;
    
    for (const [key, items] of Object.entries(grouped)) {
      if (items.length === 5) {
        // Update each item with the correct bobot
        for (let i = 0; i < 5; i++) {
          const newBobot = targetBobots[i];
          const newScore = newBobot * items[i].rank;
          
          await supabase
            .from('swot_analisis')
            .update({
              bobot: newBobot,
              score: newScore,
              updated_at: new Date().toISOString()
            })
            .eq('id', items[i].id);
        }
        fixedCount++;
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} unit-category combinations`);
    
    // Verify the fix
    console.log('🔍 Verifying the fix...');
    
    const { data: verificationData } = await supabase
      .from('swot_analisis')
      .select('unit_kerja_id, kategori, bobot')
      .order('unit_kerja_id')
      .order('kategori');
    
    const verificationGrouped = {};
    verificationData.forEach(item => {
      const key = `${item.unit_kerja_id}_${item.kategori}`;
      if (!verificationGrouped[key]) {
        verificationGrouped[key] = { count: 0, totalBobot: 0 };
      }
      verificationGrouped[key].count++;
      verificationGrouped[key].totalBobot += item.bobot;
    });
    
    let perfectCount = 0;
    let issueCount = 0;
    
    for (const [key, stats] of Object.entries(verificationGrouped)) {
      if (stats.count === 5 && stats.totalBobot === 100) {
        perfectCount++;
      } else {
        console.log(`❌ Issue: ${key} - Count: ${stats.count}, Total Bobot: ${stats.totalBobot}`);
        issueCount++;
      }
    }
    
    console.log(`✅ Perfect combinations: ${perfectCount}`);
    console.log(`❌ Issues remaining: ${issueCount}`);
    
    if (issueCount === 0) {
      console.log('🎉 All SWOT data now has exactly 5 items per perspective with total bobot = 100!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing SWOT bobot:', error);
  }
}

// Run the fix
fixSwotBobotExact100();