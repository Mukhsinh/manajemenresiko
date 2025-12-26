const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSwotDataComprehensive() {
  console.log('🔧 Starting comprehensive SWOT data fix...');
  
  try {
    // 1. Fix bobot over 100 issue first
    console.log('📊 Step 1: Fixing bobot over 100 issue...');
    
    // Get unit kerja with bobot > 100
    const { data: problemUnits } = await supabase
      .from('swot_analisis')
      .select('unit_kerja_id, kategori, bobot')
      .order('unit_kerja_id')
      .order('kategori');
    
    // Group by unit_kerja_id and kategori
    const grouped = {};
    problemUnits.forEach(item => {
      const key = `${item.unit_kerja_id}_${item.kategori}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    
    // Check and fix units with total bobot > 100
    for (const [key, items] of Object.entries(grouped)) {
      const totalBobot = items.reduce((sum, item) => sum + item.bobot, 0);
      if (totalBobot > 100) {
        console.log(`⚠️ Found unit with total bobot ${totalBobot}: ${key}`);
        
        // Redistribute bobot to make total = 100
        const targetBobots = [5, 10, 15, 25, 45]; // Kelipatan 5, total = 100
        
        for (let i = 0; i < Math.min(items.length, 5); i++) {
          const newBobot = targetBobots[i] || 5;
          
          await supabase
            .from('swot_analisis')
            .update({ 
              bobot: newBobot,
              score: newBobot * (items[i].rank || 1),
              updated_at: new Date().toISOString()
            })
            .eq('unit_kerja_id', items[i].unit_kerja_id)
            .eq('kategori', items[i].kategori)
            .eq('id', items[i].id);
        }
      }
    }
    
    // 2. Ensure each perspective has exactly 5 items with proper bobot
    console.log('📋 Step 2: Ensuring 5 items per perspective...');
    
    const { data: allUnits } = await supabase
      .from('master_work_units')
      .select('id, name');
    
    const { data: allRencanaStrategis } = await supabase
      .from('rencana_strategis')
      .select('id, kode, nama_rencana');
    
    const categories = ['Strength', 'Weakness', 'Opportunity', 'Threat'];
    const targetBobots = [5, 10, 15, 25, 45]; // Total = 100
    
    for (const unit of allUnits) {
      for (const category of categories) {
        // Get existing items for this unit and category
        const { data: existingItems } = await supabase
          .from('swot_analisis')
          .select('*')
          .eq('unit_kerja_id', unit.id)
          .eq('kategori', category)
          .order('created_at');
        
        if (existingItems.length < 5) {
          // Add missing items
          const itemsToAdd = 5 - existingItems.length;
          console.log(`➕ Adding ${itemsToAdd} items for ${unit.name} - ${category}`);
          
          for (let i = 0; i < itemsToAdd; i++) {
            const index = existingItems.length + i;
            const bobot = targetBobots[index] || 5;
            const rank = Math.floor(Math.random() * 5) + 1; // Random rank 1-5
            
            // Get a random rencana strategis for correlation
            const randomRS = allRencanaStrategis[Math.floor(Math.random() * allRencanaStrategis.length)];
            
            const sampleData = getSampleSwotData(category, unit.name, index);
            
            await supabase
              .from('swot_analisis')
              .insert({
                user_id: 'cc39ee53-4006-4b55-b383-a1ec5c40e676', // Default user
                rencana_strategis_id: randomRS.id,
                unit_kerja_id: unit.id,
                tahun: 2025,
                kategori: category,
                objek_analisis: sampleData.objek_analisis,
                bobot: bobot,
                kuantitas: 1,
                rank: rank,
                score: bobot * rank
              });
          }
        } else if (existingItems.length > 5) {
          // Remove excess items (keep first 5)
          const itemsToRemove = existingItems.slice(5);
          console.log(`➖ Removing ${itemsToRemove.length} excess items for ${unit.name} - ${category}`);
          
          for (const item of itemsToRemove) {
            await supabase
              .from('swot_analisis')
              .delete()
              .eq('id', item.id);
          }
        }
        
        // Update bobot for existing items to ensure proper distribution
        const { data: finalItems } = await supabase
          .from('swot_analisis')
          .select('*')
          .eq('unit_kerja_id', unit.id)
          .eq('kategori', category)
          .order('created_at')
          .limit(5);
        
        for (let i = 0; i < finalItems.length; i++) {
          const newBobot = targetBobots[i];
          const newScore = newBobot * finalItems[i].rank;
          
          await supabase
            .from('swot_analisis')
            .update({
              bobot: newBobot,
              score: newScore,
              updated_at: new Date().toISOString()
            })
            .eq('id', finalItems[i].id);
        }
      }
    }
    
    console.log('✅ SWOT data fix completed successfully!');
    
    // 3. Verify the fix
    console.log('🔍 Step 3: Verifying the fix...');
    
    const { data: verification } = await supabase
      .from('swot_analisis')
      .select('kategori, unit_kerja_id, bobot')
      .order('unit_kerja_id')
      .order('kategori');
    
    const verificationGrouped = {};
    verification.forEach(item => {
      const key = `${item.unit_kerja_id}_${item.kategori}`;
      if (!verificationGrouped[key]) {
        verificationGrouped[key] = { count: 0, totalBobot: 0 };
      }
      verificationGrouped[key].count++;
      verificationGrouped[key].totalBobot += item.bobot;
    });
    
    let issuesFound = 0;
    for (const [key, stats] of Object.entries(verificationGrouped)) {
      if (stats.count !== 5 || stats.totalBobot !== 100) {
        console.log(`❌ Issue found: ${key} - Count: ${stats.count}, Total Bobot: ${stats.totalBobot}`);
        issuesFound++;
      }
    }
    
    if (issuesFound === 0) {
      console.log('✅ All units now have exactly 5 items per perspective with total bobot = 100');
    } else {
      console.log(`⚠️ Found ${issuesFound} units with issues`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing SWOT data:', error);
  }
}

function getSampleSwotData(category, unitName, index) {
  const samples = {
    Strength: [
      'Tim medis berpengalaman dan berkualitas tinggi',
      'Fasilitas medis modern dan lengkap',
      'Sistem informasi terintegrasi',
      'Lokasi strategis dan mudah diakses',
      'Standar operasional prosedur yang baik'
    ],
    Weakness: [
      'Keterbatasan sumber daya manusia',
      'Sistem dokumentasi yang belum optimal',
      'Koordinasi antar unit yang perlu diperbaiki',
      'Pelatihan berkelanjutan yang terbatas',
      'Infrastruktur teknologi yang perlu upgrade'
    ],
    Opportunity: [
      'Peningkatan kerjasama dengan institusi pendidikan',
      'Pengembangan layanan berbasis teknologi digital',
      'Ekspansi program unggulan',
      'Peningkatan kualitas pelayanan berkelanjutan',
      'Implementasi sistem manajemen modern'
    ],
    Threat: [
      'Persaingan dengan rumah sakit lain',
      'Perubahan regulasi pemerintah',
      'Keterbatasan anggaran operasional',
      'Risiko pandemi dan wabah penyakit',
      'Perubahan teknologi yang cepat'
    ]
  };
  
  const categoryData = samples[category] || samples.Strength;
  return {
    objek_analisis: `${categoryData[index % categoryData.length]} - ${unitName}`
  };
}

// Run the fix
fixSwotDataComprehensive();