const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TAHUN = 2025;

// Fungsi untuk generate bobot yang total per perspektif = 100
function generateWeights(count) {
  const weights = [];
  let remaining = 100;
  
  // Generate weights untuk n-1 items
  for (let i = 0; i < count - 1; i++) {
    // Hitung range yang masuk akal
    const minRemaining = (count - i - 1) * 10; // minimal 10 untuk setiap item yang tersisa
    const maxForThis = Math.min(30, remaining - minRemaining); // maksimal 30 atau sisa yang memungkinkan
    const minForThis = Math.max(10, remaining - (count - i - 1) * 30); // minimal 10 atau yang diperlukan
    
    const weight = Math.floor(Math.random() * (maxForThis - minForThis + 1)) + minForThis;
    weights.push(weight);
    remaining -= weight;
  }
  
  // Item terakhir mendapat sisa bobot
  weights.push(remaining);
  
  // Shuffle array untuk randomize urutan
  for (let i = weights.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weights[i], weights[j]] = [weights[j], weights[i]];
  }
  
  return weights;
}

async function fixBobotCorrection() {
  try {
    console.log('🔧 Memperbaiki bobot SWOT agar total per perspektif = 100...\n');
    
    // Ambil semua data SWOT yang perlu diperbaiki
    const { data: swotData, error: fetchError } = await supabase
      .from('swot_analisis')
      .select('id, unit_kerja_id, kategori, bobot')
      .eq('tahun', TAHUN)
      .order('unit_kerja_id')
      .order('kategori');
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`📊 Ditemukan ${swotData.length} data SWOT untuk diperbaiki\n`);
    
    // Group data berdasarkan unit_kerja_id dan kategori
    const groupedData = swotData.reduce((acc, item) => {
      const key = `${item.unit_kerja_id}_${item.kategori}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
    
    let updatedGroups = 0;
    let totalUpdated = 0;
    
    // Perbaiki bobot untuk setiap grup
    for (const [key, items] of Object.entries(groupedData)) {
      const [unitId, kategori] = key.split('_');
      const count = items.length;
      
      // Generate bobot baru yang totalnya 100
      const newWeights = generateWeights(count);
      
      // Update setiap item dengan bobot baru
      for (let i = 0; i < items.length; i++) {
        const { error: updateError } = await supabase
          .from('swot_analisis')
          .update({ bobot: newWeights[i] })
          .eq('id', items[i].id);
        
        if (updateError) {
          console.error(`❌ Error updating ${items[i].id}:`, updateError);
          continue;
        }
        
        totalUpdated++;
      }
      
      updatedGroups++;
      
      // Verifikasi total bobot
      const totalBobot = newWeights.reduce((sum, weight) => sum + weight, 0);
      const status = totalBobot === 100 ? '✅' : '❌';
      
      if (updatedGroups % 20 === 0) {
        console.log(`🔄 Progress: ${updatedGroups} grup diproses...`);
      }
    }
    
    console.log('\n🎉 PERBAIKAN BOBOT SELESAI!');
    console.log(`📊 Total grup diproses: ${updatedGroups}`);
    console.log(`📈 Total data diupdate: ${totalUpdated}`);
    
    // Verifikasi hasil perbaikan
    console.log('\n🔍 VERIFIKASI HASIL PERBAIKAN:');
    
    const { data: verification, error: verifyError } = await supabase
      .from('swot_analisis')
      .select(`
        unit_kerja_id,
        kategori,
        bobot,
        master_work_units!inner(name)
      `)
      .eq('tahun', TAHUN);
    
    if (!verifyError) {
      // Group untuk verifikasi
      const verificationGroups = verification.reduce((acc, item) => {
        const key = `${item.master_work_units.name}_${item.kategori}`;
        if (!acc[key]) {
          acc[key] = { total: 0, count: 0 };
        }
        acc[key].total += item.bobot;
        acc[key].count += 1;
        return acc;
      }, {});
      
      // Hitung statistik
      let correctGroups = 0;
      let totalGroups = Object.keys(verificationGroups).length;
      
      console.log('\n📊 Sample verifikasi (20 grup pertama):');
      Object.entries(verificationGroups).slice(0, 20).forEach(([key, data]) => {
        const status = data.total === 100 ? '✅' : '❌';
        if (data.total === 100) correctGroups++;
        console.log(`   ${status} ${key}: ${data.total} (${data.count} items)`);
      });
      
      // Hitung persentase keberhasilan dari semua grup
      const allCorrect = Object.values(verificationGroups).filter(data => data.total === 100).length;
      const successRate = ((allCorrect / totalGroups) * 100).toFixed(2);
      
      console.log(`\n📈 STATISTIK KEBERHASILAN:`);
      console.log(`   Total grup perspektif: ${totalGroups}`);
      console.log(`   Grup dengan bobot = 100: ${allCorrect}`);
      console.log(`   Tingkat keberhasilan: ${successRate}%`);
      
      if (successRate === '100.00') {
        console.log('\n🎉 SEMPURNA! Semua grup perspektif memiliki total bobot = 100');
      } else {
        console.log('\n⚠️  Masih ada grup yang perlu diperbaiki');
        
        // Tampilkan grup yang masih bermasalah
        const problematicGroups = Object.entries(verificationGroups)
          .filter(([key, data]) => data.total !== 100)
          .slice(0, 10);
        
        if (problematicGroups.length > 0) {
          console.log('\n❌ Grup bermasalah (10 pertama):');
          problematicGroups.forEach(([key, data]) => {
            console.log(`   ${key}: ${data.total} (seharusnya 100)`);
          });
        }
      }
    }
    
    // Tampilkan statistik distribusi data per unit
    console.log('\n📋 DISTRIBUSI DATA PER UNIT KERJA:');
    const { data: distribution, error: distError } = await supabase
      .from('swot_analisis')
      .select(`
        kategori,
        master_work_units!inner(name, jenis, kategori)
      `)
      .eq('tahun', TAHUN);
    
    if (!distError) {
      const unitDistribution = distribution.reduce((acc, item) => {
        const unitName = item.master_work_units.name;
        const unitType = `${item.master_work_units.jenis}_${item.master_work_units.kategori}`;
        
        if (!acc[unitType]) {
          acc[unitType] = { units: new Set(), totalData: 0, categories: {} };
        }
        
        acc[unitType].units.add(unitName);
        acc[unitType].totalData++;
        
        if (!acc[unitType].categories[item.kategori]) {
          acc[unitType].categories[item.kategori] = 0;
        }
        acc[unitType].categories[item.kategori]++;
        
        return acc;
      }, {});
      
      Object.entries(unitDistribution).forEach(([type, data]) => {
        const avgPerUnit = Math.round(data.totalData / data.units.size);
        console.log(`\n🏥 ${type.replace('_', ' - ').toUpperCase()}:`);
        console.log(`   Unit kerja: ${data.units.size}`);
        console.log(`   Total data: ${data.totalData}`);
        console.log(`   Rata-rata per unit: ${avgPerUnit}`);
        console.log(`   Distribusi: S:${data.categories.Strength || 0} | W:${data.categories.Weakness || 0} | O:${data.categories.Opportunity || 0} | T:${data.categories.Threat || 0}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Jalankan perbaikan
fixBobotCorrection();