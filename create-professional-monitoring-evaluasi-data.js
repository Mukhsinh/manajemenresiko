const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = 'cc39ee53-4006-4b55-b383-a1ec5c40e676'; // mukhsin9@gmail.com

// Template monitoring evaluasi berdasarkan jenis risiko dan unit kerja
const monitoringTemplates = {
  // Template untuk risiko klinis
  klinis: {
    tindakan_mitigasi: [
      'Implementasi protokol keselamatan pasien yang ketat dengan checklist harian',
      'Pelatihan berkala tim medis tentang penanganan kegawatdaruratan',
      'Sistem monitoring pasien 24/7 dengan alarm otomatis',
      'Audit klinis bulanan dan review kasus untuk pembelajaran',
      'Koordinasi multidisiplin dalam penanganan pasien kompleks'
    ],
    evaluasi: [
      'Penurunan insiden keselamatan pasien sebesar 15% dalam 3 bulan terakhir',
      'Peningkatan response time tim medis dari 8 menit menjadi 5 menit',
      'Compliance terhadap protokol mencapai 92% berdasarkan audit internal',
      'Kepuasan pasien meningkat dari 85% menjadi 90% berdasarkan survei',
      'Zero incident untuk kategori risiko tinggi dalam periode monitoring'
    ]
  },
  
  // Template untuk risiko non-klinis
  'non klinis': {
    tindakan_mitigasi: [
      'Penguatan sistem kontrol internal dan segregation of duties',
      'Implementasi sistem informasi terintegrasi dengan backup otomatis',
      'Pelatihan SDM tentang compliance dan manajemen risiko',
      'Audit internal berkala dan monitoring KPI secara real-time',
      'Pengembangan SOP dan prosedur kerja yang terstandarisasi'
    ],
    evaluasi: [
      'Peningkatan efisiensi operasional sebesar 20% melalui digitalisasi',
      'Penurunan error rate dalam proses administrasi menjadi <2%',
      'Compliance terhadap regulasi mencapai 95% berdasarkan audit eksternal',
      'Peningkatan produktivitas SDM sebesar 18% dalam 6 bulan',
      'Implementasi sistem monitoring real-time mengurangi downtime 30%'
    ]
  }
};

// Status risiko berdasarkan tingkat probabilitas dan dampak
function getRiskStatus(probability, impact) {
  const riskValue = probability * impact;
  if (riskValue >= 20) return 'Tinggi';
  if (riskValue >= 12) return 'Sedang';
  if (riskValue >= 6) return 'Rendah';
  return 'Sangat Rendah';
}

// Generate tanggal monitoring yang realistis
function generateMonitoringDates() {
  const today = new Date();
  const lastReview = new Date(today);
  lastReview.setDate(today.getDate() - Math.floor(Math.random() * 30 + 7)); // 7-37 hari lalu
  
  const nextReview = new Date(today);
  nextReview.setDate(today.getDate() + Math.floor(Math.random() * 30 + 14)); // 14-44 hari ke depan
  
  return {
    tanggal_monitoring: lastReview.toISOString().split('T')[0],
    next_review: nextReview.toISOString().split('T')[0]
  };
}

// Generate progress mitigasi yang realistis
function generateProgress(riskLevel, monthsSinceStart) {
  let baseProgress = 0;
  
  switch(riskLevel) {
    case 'Tinggi':
      baseProgress = Math.min(85, 30 + (monthsSinceStart * 15)); // Progress lebih cepat untuk risiko tinggi
      break;
    case 'Sedang':
      baseProgress = Math.min(75, 20 + (monthsSinceStart * 12));
      break;
    case 'Rendah':
      baseProgress = Math.min(90, 40 + (monthsSinceStart * 10));
      break;
    default:
      baseProgress = Math.min(95, 50 + (monthsSinceStart * 8));
  }
  
  return Math.floor(baseProgress + (Math.random() * 10 - 5)); // Variasi ±5%
}

async function createMonitoringEvaluasiData() {
  try {
    console.log('🔍 Memulai pembuatan data Monitoring & Evaluasi Risiko profesional...\n');
    
    // Ambil semua risk_inputs dengan informasi unit kerja
    const { data: riskInputs, error: riskError } = await supabase
      .from('risk_inputs')
      .select(`
        id,
        kode_risiko,
        penyebab_risiko,
        dampak_risiko,
        master_work_units!inner(name, jenis, kategori),
        organization_id
      `)
      .order('created_at');
    
    if (riskError) {
      throw riskError;
    }
    
    console.log(`📋 Ditemukan ${riskInputs.length} risk inputs untuk monitoring\n`);
    
    const monitoringData = [];
    
    for (const risk of riskInputs) {
      const unitKategori = risk.master_work_units.kategori;
      const template = monitoringTemplates[unitKategori] || monitoringTemplates['non klinis'];
      
      // Generate parameter risiko yang realistis
      const probability = Math.floor(Math.random() * 3) + 3; // 3-5
      const impact = Math.floor(Math.random() * 3) + 3; // 3-5
      const riskValue = probability * impact;
      const riskStatus = getRiskStatus(probability, impact);
      
      const dates = generateMonitoringDates();
      const monthsSinceStart = Math.floor(Math.random() * 12) + 1; // 1-12 bulan
      const progress = generateProgress(riskStatus, monthsSinceStart);
      
      // Pilih tindakan mitigasi dan evaluasi yang sesuai
      const tindakanIndex = Math.floor(Math.random() * template.tindakan_mitigasi.length);
      const evaluasiIndex = Math.floor(Math.random() * template.evaluasi.length);
      
      // Kustomisasi berdasarkan unit kerja
      let customTindakan = template.tindakan_mitigasi[tindakanIndex];
      let customEvaluasi = template.evaluasi[evaluasiIndex];
      
      // Kustomisasi untuk unit kerja spesifik
      const unitName = risk.master_work_units.name;
      if (unitName.includes('ICU') || unitName.includes('PICU') || unitName.includes('NICU')) {
        customTindakan = 'Implementasi protokol critical care dengan monitoring kontinyu dan early warning system untuk pasien kritis';
        customEvaluasi = 'Penurunan mortality rate sebesar 12% dan peningkatan patient safety score menjadi 95% dalam 3 bulan terakhir';
      } else if (unitName.includes('IGD') || unitName.includes('Emergency')) {
        customTindakan = 'Optimalisasi sistem triase dan response time dengan protokol emergency yang terstandarisasi';
        customEvaluasi = 'Response time rata-rata turun dari 8 menit menjadi 4 menit dengan zero missed emergency cases';
      } else if (unitName.includes('Laboratorium')) {
        customTindakan = 'Implementasi quality control ketat dan sistem automasi untuk mengurangi human error';
        customEvaluasi = 'Akurasi hasil lab mencapai 99.8% dengan turnaround time membaik 25% dari target standar';
      } else if (unitName.includes('Farmasi')) {
        customTindakan = 'Penerapan sistem barcode dan double-check untuk medication safety dan inventory control';
        customEvaluasi = 'Medication error turun 40% dan stock accuracy mencapai 98% dengan zero stock-out obat kritis';
      } else if (unitName.includes('IT')) {
        customTindakan = 'Penguatan cybersecurity dan implementasi disaster recovery plan dengan backup otomatis';
        customEvaluasi = 'System uptime mencapai 99.9% dengan zero data breach dan recovery time <2 jam';
      }
      
      monitoringData.push({
        risk_input_id: risk.id,
        user_id: USER_ID,
        tanggal_monitoring: dates.tanggal_monitoring,
        status_risiko: riskStatus,
        tingkat_probabilitas: probability,
        tingkat_dampak: impact,
        nilai_risiko: riskValue,
        tindakan_mitigasi: customTindakan,
        progress_mitigasi: progress,
        evaluasi: customEvaluasi,
        status: progress >= 90 ? 'Selesai' : progress >= 70 ? 'Dalam Progress' : 'Aktif',
        organization_id: risk.organization_id
      });
    }
    
    // Insert data ke database
    const { data: insertedData, error: insertError } = await supabase
      .from('monitoring_evaluasi_risiko')
      .insert(monitoringData)
      .select('id, status_risiko, progress_mitigasi');
    
    if (insertError) {
      throw insertError;
    }
    
    console.log('🎉 BERHASIL MEMBUAT DATA MONITORING & EVALUASI RISIKO!\n');
    console.log(`📊 Total data dibuat: ${insertedData.length}`);
    
    // Statistik hasil
    const stats = insertedData.reduce((acc, item) => {
      acc[item.status_risiko] = (acc[item.status_risiko] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Distribusi Status Risiko:');
    Object.entries(stats).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} risiko`);
    });
    
    const avgProgress = insertedData.reduce((sum, item) => sum + item.progress_mitigasi, 0) / insertedData.length;
    console.log(`\n📊 Rata-rata Progress Mitigasi: ${avgProgress.toFixed(1)}%`);
    
    // Contoh data yang dibuat
    console.log('\n📋 CONTOH DATA MONITORING & EVALUASI:');
    console.log('=' .repeat(80));
    
    const { data: sampleData, error: sampleError } = await supabase
      .from('monitoring_evaluasi_risiko')
      .select(`
        tanggal_monitoring,
        status_risiko,
        tingkat_probabilitas,
        tingkat_dampak,
        nilai_risiko,
        tindakan_mitigasi,
        progress_mitigasi,
        evaluasi,
        status,
        risk_inputs!inner(kode_risiko, master_work_units!inner(name))
      `)
      .order('nilai_risiko', { ascending: false })
      .limit(3);
    
    if (!sampleError && sampleData.length > 0) {
      sampleData.forEach((item, index) => {
        console.log(`\n${index + 1}. RISIKO: ${item.risk_inputs.kode_risiko} - ${item.risk_inputs.master_work_units.name}`);
        console.log(`   Status: ${item.status_risiko} (P:${item.tingkat_probabilitas} x D:${item.tingkat_dampak} = ${item.nilai_risiko})`);
        console.log(`   Progress: ${item.progress_mitigasi}% - ${item.status}`);
        console.log(`   Tindakan: ${item.tindakan_mitigasi.substring(0, 80)}...`);
        console.log(`   Evaluasi: ${item.evaluasi.substring(0, 80)}...`);
      });
    }
    
    console.log('\n✅ DATA MONITORING & EVALUASI RISIKO SIAP DIGUNAKAN!');
    console.log('\n📋 Fitur yang tersedia:');
    console.log('• Monitoring berkala dengan tanggal yang realistis');
    console.log('• Evaluasi progress mitigasi yang terukur');
    console.log('• Status risiko berdasarkan probability x impact');
    console.log('• Tindakan mitigasi yang disesuaikan dengan unit kerja');
    console.log('• Tracking progress dengan status yang jelas');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Jalankan script
createMonitoringEvaluasiData();