const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function displaySwotSamples() {
  try {
    console.log('📋 CONTOH DATA SWOT ANALISIS PROFESIONAL\n');
    console.log('=' .repeat(80));
    
    // Ambil contoh data untuk unit kerja yang berbeda-beda
    const sampleUnits = [
      { name: 'ICU-PICU-NICU', type: 'Rawat Inap - Klinis' },
      { name: 'IGD PONEK', type: 'Rawat Jalan - Klinis' },
      { name: 'Laboratorium (PK-PA)', type: 'Penunjang Medis - Klinis' },
      { name: 'Farmasi', type: 'Penunjang Medis - Klinis' },
      { name: 'Unit IT', type: 'Administrasi - Non Klinis' },
      { name: 'Direktur', type: 'Manajemen - Non Klinis' }
    ];
    
    for (const unit of sampleUnits) {
      const { data: swotData, error } = await supabase
        .from('swot_analisis')
        .select(`
          kategori,
          objek_analisis,
          bobot,
          rank,
          score,
          master_work_units!inner(name, jenis, kategori)
        `)
        .eq('master_work_units.name', unit.name)
        .eq('tahun', 2025)
        .order('kategori')
        .order('bobot', { ascending: false });
      
      if (error || !swotData.length) {
        console.log(`❌ Data tidak ditemukan untuk ${unit.name}`);
        continue;
      }
      
      console.log(`\n🏥 ${unit.name.toUpperCase()}`);
      console.log(`📋 Jenis: ${unit.type}`);
      console.log('=' .repeat(80));
      
      // Group by kategori
      const groupedData = swotData.reduce((acc, item) => {
        if (!acc[item.kategori]) acc[item.kategori] = [];
        acc[item.kategori].push(item);
        return acc;
      }, {});
      
      // Display each category
      ['Strength', 'Weakness', 'Opportunity', 'Threat'].forEach(kategori => {
        if (groupedData[kategori]) {
          console.log(`\n💪 ${kategori.toUpperCase()} (${groupedData[kategori].length} items):`);
          console.log('-' .repeat(50));
          
          groupedData[kategori].forEach((item, index) => {
            console.log(`${index + 1}. ${item.objek_analisis}`);
            console.log(`   📊 Bobot: ${item.bobot} | Rank: ${item.rank} | Score: ${item.score}`);
            console.log('');
          });
        }
      });
      
      // Calculate totals
      const totalScore = swotData.reduce((sum, item) => sum + item.score, 0);
      const avgScore = (totalScore / swotData.length).toFixed(2);
      
      console.log(`📈 RINGKASAN:`);
      console.log(`   Total Data: ${swotData.length}`);
      console.log(`   Total Score: ${totalScore}`);
      console.log(`   Rata-rata Score: ${avgScore}`);
      
      console.log('\n' + '=' .repeat(80));
    }
    
    // Summary statistics
    console.log('\n📊 STATISTIK KESELURUHAN DATA SWOT\n');
    
    const { data: allData, error: allError } = await supabase
      .from('swot_analisis')
      .select(`
        kategori,
        bobot,
        rank,
        score,
        master_work_units!inner(jenis, kategori)
      `)
      .eq('tahun', 2025);
    
    if (!allError) {
      // Statistics by work unit type
      const typeStats = allData.reduce((acc, item) => {
        const type = `${item.master_work_units.jenis}_${item.master_work_units.kategori}`;
        if (!acc[type]) {
          acc[type] = { count: 0, totalScore: 0, categories: {} };
        }
        acc[type].count++;
        acc[type].totalScore += item.score;
        
        if (!acc[type].categories[item.kategori]) {
          acc[type].categories[item.kategori] = 0;
        }
        acc[type].categories[item.kategori]++;
        
        return acc;
      }, {});
      
      console.log('📋 DISTRIBUSI PER JENIS UNIT KERJA:');
      console.log('-' .repeat(60));
      
      Object.entries(typeStats).forEach(([type, stats]) => {
        const avgScore = (stats.totalScore / stats.count).toFixed(2);
        console.log(`\n${type.replace('_', ' - ').toUpperCase()}:`);
        console.log(`   Total Data: ${stats.count}`);
        console.log(`   Rata-rata Score: ${avgScore}`);
        console.log(`   Distribusi: S:${stats.categories.Strength || 0} | W:${stats.categories.Weakness || 0} | O:${stats.categories.Opportunity || 0} | T:${stats.categories.Threat || 0}`);
      });
      
      // Overall statistics
      const totalData = allData.length;
      const totalScore = allData.reduce((sum, item) => sum + item.score, 0);
      const avgBobot = allData.reduce((sum, item) => sum + item.bobot, 0) / totalData;
      const avgRank = allData.reduce((sum, item) => sum + item.rank, 0) / totalData;
      const avgScore = totalScore / totalData;
      
      console.log('\n📈 STATISTIK KESELURUHAN:');
      console.log('-' .repeat(40));
      console.log(`Total Data SWOT: ${totalData}`);
      console.log(`Rata-rata Bobot: ${avgBobot.toFixed(2)}`);
      console.log(`Rata-rata Rank: ${avgRank.toFixed(2)}`);
      console.log(`Rata-rata Score: ${avgScore.toFixed(2)}`);
      console.log(`Total Score: ${totalScore}`);
    }
    
    console.log('\n✅ DATA SWOT ANALISIS PROFESIONAL SIAP DIGUNAKAN!');
    console.log('\n📋 Langkah selanjutnya:');
    console.log('1. Akses melalui frontend aplikasi untuk review');
    console.log('2. Lakukan analisis diagram kartesius');
    console.log('3. Buat strategi TOWS berdasarkan hasil analisis');
    console.log('4. Implementasikan dalam perencanaan strategis rumah sakit');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Jalankan script
displaySwotSamples();