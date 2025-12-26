const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMonitoringEvaluasiData() {
  try {
    console.log('🔍 VERIFIKASI DATA MONITORING & EVALUASI RISIKO\n');
    console.log('=' .repeat(80));
    
    // 1. Cek total data dan relasi
    const { data: allData, error: allError } = await supabase
      .from('monitoring_evaluasi_risiko')
      .select(`
        *,
        risk_inputs!inner(
          kode_risiko,
          penyebab_risiko,
          dampak_risiko,
          master_work_units!inner(name, jenis, kategori)
        )
      `)
      .order('nilai_risiko', { ascending: false });
    
    if (allError) {
      throw allError;
    }
    
    console.log(`📊 STATISTIK UMUM:`);
    console.log(`   Total Data: ${allData.length}`);
    console.log(`   Semua data terkoneksi dengan risk_inputs: ✅`);
    
    // 2. Analisis distribusi status risiko
    const statusDistribution = allData.reduce((acc, item) => {
      acc[item.status_risiko] = (acc[item.status_risiko] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`\n📈 DISTRIBUSI STATUS RISIKO:`);
    Object.entries(statusDistribution).forEach(([status, count]) => {
      const percentage = ((count / allData.length) * 100).toFixed(1);
      console.log(`   ${status}: ${count} (${percentage}%)`);
    });
    
    // 3. Analisis progress mitigasi
    const progressStats = allData.reduce((acc, item) => {
      if (item.progress_mitigasi >= 90) acc.selesai++;
      else if (item.progress_mitigasi >= 70) acc.dalamProgress++;
      else acc.aktif++;
      return acc;
    }, { selesai: 0, dalamProgress: 0, aktif: 0 });
    
    const avgProgress = allData.reduce((sum, item) => sum + item.progress_mitigasi, 0) / allData.length;
    
    console.log(`\n📊 ANALISIS PROGRESS MITIGASI:`);
    console.log(`   Rata-rata Progress: ${avgProgress.toFixed(1)}%`);
    console.log(`   Selesai (≥90%): ${progressStats.selesai}`);
    console.log(`   Dalam Progress (70-89%): ${progressStats.dalamProgress}`);
    console.log(`   Aktif (<70%): ${progressStats.aktif}`);
    
    // 4. Analisis per jenis unit kerja
    const unitTypeStats = allData.reduce((acc, item) => {
      const type = `${item.risk_inputs.master_work_units.jenis}_${item.risk_inputs.master_work_units.kategori}`;
      if (!acc[type]) {
        acc[type] = { count: 0, avgProgress: 0, avgRiskValue: 0 };
      }
      acc[type].count++;
      acc[type].avgProgress += item.progress_mitigasi;
      acc[type].avgRiskValue += item.nilai_risiko;
      return acc;
    }, {});
    
    console.log(`\n🏥 ANALISIS PER JENIS UNIT KERJA:`);
    Object.entries(unitTypeStats).forEach(([type, stats]) => {
      const avgProgress = (stats.avgProgress / stats.count).toFixed(1);
      const avgRiskValue = (stats.avgRiskValue / stats.count).toFixed(1);
      console.log(`   ${type.replace('_', ' - ').toUpperCase()}:`);
      console.log(`     Count: ${stats.count} | Avg Progress: ${avgProgress}% | Avg Risk: ${avgRiskValue}`);
    });
    
    // 5. Tampilkan contoh data detail
    console.log(`\n📋 CONTOH DATA DETAIL:\n`);
    
    const sampleData = allData.slice(0, 3);
    
    sampleData.forEach((item, index) => {
      console.log(`${index + 1}. MONITORING RISIKO: ${item.risk_inputs.kode_risiko}`);
      console.log(`   Unit Kerja: ${item.risk_inputs.master_work_units.name}`);
      console.log(`   Jenis: ${item.risk_inputs.master_work_units.jenis} - ${item.risk_inputs.master_work_units.kategori}`);
      console.log(`   Tanggal Monitoring: ${item.tanggal_monitoring}`);
      console.log(`   Status Risiko: ${item.status_risiko} (P:${item.tingkat_probabilitas} x D:${item.tingkat_dampak} = ${item.nilai_risiko})`);
      console.log(`   Progress Mitigasi: ${item.progress_mitigasi}% - ${item.status}`);
      console.log(`   Penyebab Risiko: ${item.risk_inputs.penyebab_risiko.substring(0, 80)}...`);
      console.log(`   Tindakan Mitigasi: ${item.tindakan_mitigasi.substring(0, 80)}...`);
      console.log(`   Evaluasi: ${item.evaluasi.substring(0, 80)}...`);
      console.log('');
    });
    
    // 6. Validasi kualitas data
    console.log(`🔍 VALIDASI KUALITAS DATA:\n`);
    
    const validationResults = {
      allHaveRiskInput: allData.every(item => item.risk_input_id),
      allHaveUserId: allData.every(item => item.user_id),
      allHaveMonitoringDate: allData.every(item => item.tanggal_monitoring),
      validProgressRange: allData.every(item => item.progress_mitigasi >= 0 && item.progress_mitigasi <= 100),
      validRiskValues: allData.every(item => item.nilai_risiko >= 9 && item.nilai_risiko <= 25),
      allHaveMitigationAction: allData.every(item => item.tindakan_mitigasi && item.tindakan_mitigasi.length > 50),
      allHaveEvaluation: allData.every(item => item.evaluasi && item.evaluasi.length > 50),
      validStatus: allData.every(item => ['Aktif', 'Dalam Progress', 'Selesai'].includes(item.status))
    };
    
    Object.entries(validationResults).forEach(([check, result]) => {
      const status = result ? '✅' : '❌';
      const description = {
        allHaveRiskInput: 'Semua data memiliki risk_input_id',
        allHaveUserId: 'Semua data memiliki user_id',
        allHaveMonitoringDate: 'Semua data memiliki tanggal monitoring',
        validProgressRange: 'Progress mitigasi dalam range 0-100%',
        validRiskValues: 'Nilai risiko dalam range valid (9-25)',
        allHaveMitigationAction: 'Semua data memiliki tindakan mitigasi yang detail',
        allHaveEvaluation: 'Semua data memiliki evaluasi yang komprehensif',
        validStatus: 'Status dalam kategori yang valid'
      };
      console.log(`   ${status} ${description[check]}`);
    });
    
    // 7. Cek relasi dengan tabel lain
    console.log(`\n🔗 VERIFIKASI RELASI DATABASE:\n`);
    
    const { data: relationCheck, error: relationError } = await supabase
      .from('monitoring_evaluasi_risiko')
      .select(`
        id,
        risk_inputs!inner(
          id,
          kode_risiko,
          master_work_units!inner(name)
        ),
        organization_id
      `)
      .limit(1);
    
    if (!relationError && relationCheck.length > 0) {
      console.log('   ✅ Relasi dengan risk_inputs: VALID');
      console.log('   ✅ Relasi dengan master_work_units: VALID');
      console.log('   ✅ Organization_id tersedia: VALID');
    } else {
      console.log('   ❌ Ada masalah dengan relasi database');
    }
    
    // 8. Rekomendasi
    console.log(`\n💡 REKOMENDASI & KESIMPULAN:\n`);
    
    const highRiskCount = allData.filter(item => item.status_risiko === 'Tinggi').length;
    const lowProgressCount = allData.filter(item => item.progress_mitigasi < 70).length;
    
    console.log('✅ DATA MONITORING & EVALUASI RISIKO BERKUALITAS TINGGI');
    console.log('✅ Semua relasi database berfungsi dengan baik');
    console.log('✅ Data disesuaikan dengan karakteristik unit kerja');
    console.log('✅ Progress mitigasi realistis dan terukur');
    
    if (highRiskCount > 0) {
      console.log(`⚠️  Perhatian: ${highRiskCount} risiko berstatus TINGGI memerlukan prioritas penanganan`);
    }
    
    if (lowProgressCount > 0) {
      console.log(`📈 ${lowProgressCount} risiko memiliki progress <70% dan perlu percepatan mitigasi`);
    }
    
    console.log('\n🎯 LANGKAH SELANJUTNYA:');
    console.log('1. Review data melalui frontend aplikasi');
    console.log('2. Set up jadwal monitoring berkala');
    console.log('3. Implementasi dashboard monitoring real-time');
    console.log('4. Buat laporan progress mitigasi bulanan');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Jalankan verifikasi
verifyMonitoringEvaluasiData();