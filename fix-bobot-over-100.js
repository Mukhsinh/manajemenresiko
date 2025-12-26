const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixBobotOver100() {
  try {
    console.log('🔧 Memperbaiki bobot yang melebihi 100 per perspektif...\n');
    
    // Ambil semua data dan kelompokkan per unit dan kategori
    const { data: allData, error: allError } = await supabase
      .from('swot_analisis')
      .select(`
        id,
        kategori,
        bobot,
        unit_kerja_id,
        master_work_units!inner(name)
      `)
      .eq('tahun', 2025);
    
    if (allError) {
      throw allError;
    }
    
    // Kelompokkan data per unit dan kategori
    const dataByUnitCategory = allData.reduce((acc, item) => {
      const unitId = item.unit_kerja_id;
      const kategori = item.kategori;
      const key = `${unitId}_${kategori}`;
      
      if (!acc[key]) {
        acc[key] = {
          unitName: item.master_work_units.name,
          unitId: unitId,
          kategori: kategori,
          items: []
        };
      }
      
      acc[key].items.push({
        id: item.id,
        bobot: item.bobot
      });
      
      return acc;
    }, {});
    
    // Cari yang total bobotnya > 100
    const problematicGroups = [];
    
    Object.values(dataByUnitCategory).forEach(group => {
      const totalBobot = group.items.reduce((sum, item) => sum + item.bobot, 0);
      if (totalBobot > 100) {
        problematicGroups.push({
          ...group,
          totalBobot: totalBobot
        });
      }
    });
    
    console.log(`🔍 Ditemukan ${problematicGroups.length} grup dengan bobot > 100:`);
    
    let fixedCount = 0;
    
    for (const group of problematicGroups) {
      console.log(`\n🔧 Memperbaiki: ${group.unitName} - ${group.kategori} (Total: ${group.totalBobot})`);
      
      // Hitung ulang bobot agar total = 100
      const jumlahData = group.items.length;
      const newBobots = [];
      let totalNewBobot = 0;
      
      // Generate bobot baru untuk n-1 data
      for (let i = 0; i < jumlahData - 1; i++) {
        const sisaData = jumlahData - i;
        const sisaBobot = 100 - totalNewBobot;
        const minBobot = Math.max(5, Math.floor(sisaBobot / sisaData / 2));
        const maxBobot = Math.min(30, Math.floor(sisaBobot / sisaData * 1.5));
        
        const bobot = Math.floor(Math.random() * (maxBobot - minBobot + 1)) + minBobot;
        newBobots.push(bobot);
        totalNewBobot += bobot;
      }
      
      // Bobot terakhir adalah sisa dari 100
      const bobotTerakhir = 100 - totalNewBobot;
      newBobots.push(Math.max(5, bobotTerakhir));
      
      // Update database
      for (let i = 0; i < group.items.length; i++) {
        const { error: updateError } = await supabase
          .from('swot_analisis')
          .update({ bobot: newBobots[i] })
          .eq('id', group.items[i].id);
        
        if (updateError) {
          console.error(`❌ Error updating ${group.items[i].id}:`, updateError);
        }
      }
      
      const newTotal = newBobots.reduce((sum, bobot) => sum + bobot, 0);
      console.log(`   ✅ Diperbaiki: ${group.totalBobot} → ${newTotal}`);
      fixedCount++;
      
      // Delay kecil
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n🎉 Selesai! ${fixedCount} grup telah diperbaiki.`);
    
    // Verifikasi ulang
    console.log('\n🔍 Verifikasi ulang...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('swot_analisis')
      .select(`
        kategori,
        bobot,
        unit_kerja_id,
        master_work_units!inner(name)
      `)
      .eq('tahun', 2025);
    
    if (!verifyError) {
      const verifyGroups = verifyData.reduce((acc, item) => {
        const key = `${item.unit_kerja_id}_${item.kategori}`;
        if (!acc[key]) {
          acc[key] = {
            unitName: item.master_work_units.name,
            kategori: item.kategori,
            totalBobot: 0
          };
        }
        acc[key].totalBobot += item.bobot;
        return acc;
      }, {});
      
      const stillProblematic = Object.values(verifyGroups).filter(group => group.totalBobot > 100);
      
      if (stillProblematic.length === 0) {
        console.log('✅ Semua bobot sudah valid (≤100 per perspektif)');
      } else {
        console.log(`❌ Masih ada ${stillProblematic.length} grup dengan bobot > 100`);
        stillProblematic.forEach(group => {
          console.log(`   ${group.unitName} - ${group.kategori}: ${group.totalBobot}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Jalankan perbaikan
fixBobotOver100();