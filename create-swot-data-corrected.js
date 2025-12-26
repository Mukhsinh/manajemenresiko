const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = 'cc39ee53-4006-4b55-b383-a1ec5c40e676'; // mukhsin9@gmail.com
const TAHUN = 2025;

// Mapping rencana strategis dengan unit kerja berdasarkan relevansi
const rencanaStrategisMapping = {
  // Digitalisasi Pelayanan Kesehatan Terintegrasi
  '3911838f-562e-4c6e-985b-8155a89dcc51': [
    'Unit IT', 'Rekam Medik', 'Unit Pendapatan', 'Unit Akuntansi dan Verifikasi',
    'Laboratorium (PK-PA)', 'Radiologi', 'Farmasi', 'IGD PONEK'
  ],
  
  // Implementasi Sistem Tata Kelola Rumah Sakit Berbasis Manajemen Resiko
  '789308c7-7d0d-4c1e-8c65-3615568c683c': [
    'Unit Manajemen Resiko', 'SPI', 'Direktur', 'Dewan Pengawas',
    'Komite Medik', 'Komite PMKP', 'Komite PPI', 'Akreditasi'
  ],
  
  // Peningkatan Sistem Keselamatan Pasien Terintegrasi
  '04b00510-6b9a-43e8-846a-d690f83a6003': [
    'ICU-PICU-NICU', 'IGD PONEK', 'VK', 'Komite PPI', 'Komite PMKP',
    'Farmasi', 'Laundry & CSSD', 'Security', 'Cleaning service'
  ],
  
  // Sistem Manajemen Keuangan Rumah Sakit Terintegrasi
  'd46e9c2b-afaf-413b-a688-65d5e0a40b98': [
    'Subag Keuangan', 'Unit Akuntansi Manajemen', 'Unit Akuntansi dan Verifikasi',
    'Unit Perbendaharaan', 'Unit Pendapatan', 'Analis Biaya dan Kasir', 'TPPRI', 'TPPRJ'
  ],
  
  // Pengembangan Pusat Pendidikan dan Pelatihan Terpadu
  '6f9adf09-9419-47a3-bd14-3e612c3f6bae': [
    'Unit Diklat', 'Bid Keperawatan', 'Bid Pelayanan Medis',
    'Seksi pengembangan dan etika keperawatan', 'Seksi pengembangan pelayanan Medis'
  ],
  
  // Program Pengembangan Sumber Daya Manusia Berkelanjutan
  'fdb02867-fa72-423f-b7a0-a9ffe6f20fa4': [
    'Subag umpeg', 'Unit Diklat', 'Bid Keperawatan', 'Bid Pelayanan Medis',
    'Seksi pengembangan dan etika keperawatan', 'Seksi pengembangan pelayanan Medis'
  ],
  
  // Program Peningkatan Kepuasan Pelanggan Berkelanjutan
  'ff20b771-8ef9-4096-b6de-c2ec4b43300a': [
    'Instalasi Humas & Komplain', 'Klinik Anak', 'Klinik Penyakit Dalam',
    'Klinik Jantung', 'Klinik Mata', 'Klinik Gigi', 'Hemodialisis'
  ],
  
  // Program Inovasi Layanan Berkelanjutan
  '716eb8ed-f56e-4f59-9270-e5c2c140734a': [
    'Cathlab', 'Rehab. Medik', 'Klinik Bedah Syaraf', 'Klinik Orthopedi',
    'Bid Pengembangan dan penunjang pelayanan', 'BDRS', 'IBS'
  ],
  
  // Sistem Manajemen Pengetahuan dan Knowledge Sharing
  'ec26ad55-d4b8-4c31-8048-18e9f3ac414e': [
    'Unit IT', 'Rekam Medik', 'Komite Medik', 'Unit Diklat',
    'Seksi pelayanan Medis dan Rekam Medis'
  ]
};

// Data SWOT yang berkorelasi dengan rencana strategis
const swotDataByRencanaStrategis = {
  // Digitalisasi Pelayanan Kesehatan Terintegrasi
  '3911838f-562e-4c6e-985b-8155a89dcc51': {
    'Strength': [
      'Infrastruktur teknologi informasi yang mendukung integrasi sistem digital',
      'Tenaga IT yang kompeten dalam pengembangan dan maintenance sistem informasi',
      'Komitmen manajemen terhadap transformasi digital rumah sakit',
      'Sistem jaringan yang stabil dan mendukung konektivitas antar unit',
      'Database pasien yang terstruktur dan dapat diintegrasikan',
      'Pengalaman implementasi sistem informasi pada beberapa unit kerja'
    ],
    'Weakness': [
      'Keterbatasan anggaran untuk investasi teknologi digital yang komprehensif',
      'Resistensi perubahan dari sebagian tenaga kesehatan terhadap digitalisasi',
      'Sistem legacy yang masih terpisah-pisah antar unit kerja',
      'Keterbatasan SDM IT untuk maintenance dan pengembangan berkelanjutan',
      'Proses bisnis yang belum sepenuhnya terstandarisasi untuk digitalisasi',
      'Keterbatasan pelatihan digital literacy untuk seluruh staff'
    ],
    'Opportunity': [
      'Dukungan pemerintah untuk program digitalisasi rumah sakit',
      'Ketersediaan vendor teknologi kesehatan dengan solusi terintegrasi',
      'Tren peningkatan adopsi teknologi digital di sektor kesehatan',
      'Potensi efisiensi operasional dan pengurangan biaya melalui digitalisasi',
      'Peningkatan kualitas pelayanan melalui akses informasi yang cepat',
      'Peluang kerjasama dengan institusi pendidikan untuk pengembangan sistem'
    ],
    'Threat': [
      'Risiko keamanan siber dan perlindungan data pasien yang sensitif',
      'Ketergantungan tinggi pada vendor teknologi eksternal',
      'Perubahan regulasi terkait perlindungan data dan privasi pasien',
      'Biaya maintenance dan upgrade sistem yang terus meningkat',
      'Risiko downtime sistem yang dapat mengganggu operasional',
      'Kompetisi dengan rumah sakit lain yang lebih maju dalam digitalisasi'
    ]
  },

  // Implementasi Sistem Tata Kelola Rumah Sakit Berbasis Manajemen Resiko
  '789308c7-7d0d-4c1e-8c65-3615568c683c': {
    'Strength': [
      'Struktur organisasi yang jelas dengan pembagian tugas dan tanggung jawab',
      'Sistem audit internal yang berfungsi untuk monitoring dan evaluasi',
      'Komitmen manajemen terhadap implementasi good corporate governance',
      'Keberadaan komite-komite yang mendukung tata kelola yang baik',
      'Sistem pelaporan dan dokumentasi yang terstruktur',
      'Pengalaman dalam penerapan standar akreditasi nasional'
    ],
    'Weakness': [
      'Sistem manajemen risiko yang belum terintegrasi secara menyeluruh',
      'Keterbatasan SDM yang memiliki kompetensi manajemen risiko',
      'Budaya organisasi yang masih perlu adaptasi terhadap manajemen risiko',
      'Sistem informasi manajemen yang belum mendukung risk monitoring',
      'Proses identifikasi dan mitigasi risiko yang belum sistematis',
      'Koordinasi antar unit dalam pengelolaan risiko yang masih terbatas'
    ],
    'Opportunity': [
      'Regulasi yang mendorong implementasi manajemen risiko di rumah sakit',
      'Ketersediaan konsultan dan pelatihan manajemen risiko',
      'Tren global menuju risk-based management dalam organisasi kesehatan',
      'Potensi peningkatan efisiensi melalui pengelolaan risiko yang baik',
      'Peluang sertifikasi dan akreditasi manajemen risiko',
      'Dukungan asosiasi rumah sakit untuk implementasi best practice'
    ],
    'Threat': [
      'Kompleksitas regulasi yang terus berkembang dan berubah',
      'Tuntutan stakeholder terhadap transparansi dan akuntabilitas yang tinggi',
      'Risiko reputasi akibat insiden yang tidak terkelola dengan baik',
      'Biaya implementasi sistem manajemen risiko yang signifikan',
      'Resistensi internal terhadap perubahan sistem tata kelola',
      'Persaingan dengan rumah sakit yang sudah mature dalam risk management'
    ]
  },

  // Peningkatan Sistem Keselamatan Pasien Terintegrasi
  '04b00510-6b9a-43e8-846a-d690f83a6003': {
    'Strength': [
      'Komitmen manajemen terhadap keselamatan pasien sebagai prioritas utama',
      'Tim keselamatan pasien yang terlatih dan berpengalaman',
      'Sistem pelaporan insiden keselamatan pasien yang sudah berjalan',
      'Protokol keselamatan pasien yang terstandarisasi',
      'Budaya safety yang mulai berkembang di lingkungan rumah sakit',
      'Fasilitas dan peralatan medis yang mendukung keselamatan pasien'
    ],
    'Weakness': [
      'Sistem monitoring keselamatan pasien yang belum real-time',
      'Keterbatasan SDM yang memiliki sertifikasi keselamatan pasien',
      'Koordinasi antar unit dalam implementasi protokol keselamatan',
      'Sistem informasi yang belum terintegrasi untuk tracking insiden',
      'Budaya blame yang masih ada dalam pelaporan insiden',
      'Keterbatasan anggaran untuk investasi teknologi keselamatan'
    ],
    'Opportunity': [
      'Regulasi yang mendorong implementasi patient safety di rumah sakit',
      'Ketersediaan pelatihan dan sertifikasi keselamatan pasien',
      'Tren global menuju zero harm dalam pelayanan kesehatan',
      'Teknologi baru yang mendukung monitoring keselamatan pasien',
      'Kerjasama dengan organisasi internasional untuk best practice',
      'Dukungan asuransi untuk program keselamatan pasien'
    ],
    'Threat': [
      'Tuntutan hukum dari pasien atau keluarga terkait insiden keselamatan',
      'Dampak reputasi negatif akibat insiden keselamatan pasien',
      'Biaya kompensasi dan litigasi yang tinggi',
      'Tekanan media dan masyarakat terhadap kualitas pelayanan',
      'Persaingan dengan rumah sakit yang memiliki track record safety lebih baik',
      'Perubahan standar keselamatan yang semakin ketat'
    ]
  },

  // Sistem Manajemen Keuangan Rumah Sakit Terintegrasi
  'd46e9c2b-afaf-413b-a688-65d5e0a40b98': {
    'Strength': [
      'Sistem akuntansi yang sesuai dengan standar akuntansi pemerintahan',
      'Tim keuangan yang berpengalaman dan memiliki kompetensi yang memadai',
      'Sistem pengendalian internal keuangan yang sudah berjalan',
      'Laporan keuangan yang rutin dan tepat waktu',
      'Sistem verifikasi dan validasi transaksi keuangan yang ketat',
      'Dukungan sistem informasi keuangan yang terintegrasi'
    ],
    'Weakness': [
      'Sistem perencanaan anggaran yang belum optimal',
      'Keterbatasan analisis keuangan untuk pengambilan keputusan strategis',
      'Proses procurement yang masih memerlukan perbaikan efisiensi',
      'Sistem cost accounting yang belum detail per unit layanan',
      'Keterbatasan dalam cash flow management',
      'Integrasi sistem keuangan dengan sistem operasional yang belum sempurna'
    ],
    'Opportunity': [
      'Implementasi sistem ERP untuk integrasi manajemen keuangan',
      'Peluang optimalisasi revenue melalui analisis profitabilitas layanan',
      'Kerjasama dengan institusi keuangan untuk cash management',
      'Implementasi activity-based costing untuk efisiensi biaya',
      'Peluang diversifikasi sumber pendapatan rumah sakit',
      'Dukungan teknologi fintech untuk sistem pembayaran'
    ],
    'Threat': [
      'Perubahan regulasi keuangan dan perpajakan yang frequent',
      'Ketergantungan pada pendapatan BPJS yang dapat berubah',
      'Inflasi biaya operasional dan investasi yang tinggi',
      'Risiko bad debt dari pasien umum dan asuransi swasta',
      'Kompetisi harga dengan rumah sakit swasta',
      'Audit eksternal yang semakin ketat dan kompleks'
    ]
  },

  // Default untuk rencana strategis lainnya
  'default': {
    'Strength': [
      'SDM yang kompeten dan berpengalaman sesuai bidang keahlian',
      'Fasilitas dan peralatan yang memadai untuk operasional',
      'Sistem operasional yang terstruktur dan terstandarisasi',
      'Komitmen manajemen terhadap peningkatan kualitas layanan',
      'Koordinasi yang baik antar unit kerja terkait',
      'Pengalaman dalam implementasi program-program strategis'
    ],
    'Weakness': [
      'Keterbatasan anggaran untuk pengembangan program strategis',
      'Sistem informasi yang belum terintegrasi secara optimal',
      'Keterbatasan SDM untuk implementasi program baru',
      'Resistensi perubahan dari sebagian stakeholder internal',
      'Proses koordinasi yang masih memerlukan perbaikan',
      'Keterbatasan dalam monitoring dan evaluasi program'
    ],
    'Opportunity': [
      'Dukungan regulasi pemerintah untuk program strategis rumah sakit',
      'Ketersediaan teknologi dan inovasi yang mendukung program',
      'Kerjasama dengan stakeholder eksternal yang strategis',
      'Tren positif dalam pengembangan sektor kesehatan',
      'Peluang peningkatan kualitas dan efisiensi layanan',
      'Dukungan masyarakat terhadap program peningkatan layanan'
    ],
    'Threat': [
      'Persaingan dengan rumah sakit lain dalam implementasi program serupa',
      'Perubahan regulasi yang dapat mempengaruhi program strategis',
      'Keterbatasan sumber daya untuk sustainability program',
      'Ekspektasi stakeholder yang tinggi terhadap hasil program',
      'Risiko operasional dalam implementasi program baru',
      'Perubahan prioritas organisasi yang dapat mempengaruhi program'
    ]
  }
};

// Fungsi untuk mendapatkan rencana strategis yang sesuai dengan unit kerja
function getRencanaStrategisForUnit(unitName) {
  for (const [rencanaId, units] of Object.entries(rencanaStrategisMapping)) {
    if (units.includes(unitName)) {
      return rencanaId;
    }
  }
  // Default ke rencana strategis pertama jika tidak ada mapping
  return Object.keys(rencanaStrategisMapping)[0];
}

// Fungsi untuk mendapatkan data SWOT berdasarkan rencana strategis
function getSwotDataForRencanaStrategis(rencanaStrategisId) {
  return swotDataByRencanaStrategis[rencanaStrategisId] || swotDataByRencanaStrategis['default'];
}

// Fungsi untuk generate bobot yang total per perspektif maksimal 100
function generateBobotForPerspektif(jumlahData) {
  const bobots = [];
  let totalBobot = 0;
  const maxBobotPerPerspektif = 100;
  
  // Generate bobot random untuk n-1 data
  for (let i = 0; i < jumlahData - 1; i++) {
    const sisaData = jumlahData - i;
    const sisaBobot = maxBobotPerPerspektif - totalBobot;
    const minBobot = Math.max(5, Math.floor(sisaBobot / sisaData / 2));
    const maxBobot = Math.min(30, Math.floor(sisaBobot / sisaData * 1.5));
    
    const bobot = Math.floor(Math.random() * (maxBobot - minBobot + 1)) + minBobot;
    bobots.push(bobot);
    totalBobot += bobot;
  }
  
  // Bobot terakhir adalah sisa dari 100
  const bobotTerakhir = maxBobotPerPerspektif - totalBobot;
  bobots.push(Math.max(5, bobotTerakhir));
  
  return bobots;
}

async function createCorrectedSwotData() {
  try {
    console.log('🔄 Membuat data SWOT Analisis yang terkoreksi...\n');
    
    // Ambil semua unit kerja
    const { data: workUnits, error: workUnitsError } = await supabase
      .from('master_work_units')
      .select('id, name, jenis, kategori')
      .order('jenis', { ascending: true })
      .order('kategori', { ascending: true })
      .order('name', { ascending: true });
    
    if (workUnitsError) {
      throw workUnitsError;
    }
    
    console.log(`📋 Ditemukan ${workUnits.length} unit kerja\n`);
    
    let totalInserted = 0;
    let processedUnits = 0;
    
    // Proses setiap unit kerja
    for (const unit of workUnits) {
      console.log(`🔄 Memproses: ${unit.name} (${unit.jenis} - ${unit.kategori})`);
      
      // Tentukan rencana strategis yang sesuai
      const rencanaStrategisId = getRencanaStrategisForUnit(unit.name);
      
      // Dapatkan data SWOT berdasarkan rencana strategis
      const swotData = getSwotDataForRencanaStrategis(rencanaStrategisId);
      
      // Tentukan jumlah data per perspektif (5 atau 6)
      const jumlahDataPerPerspektif = Math.random() > 0.5 ? 5 : 6;
      
      console.log(`   📊 Menggunakan ${jumlahDataPerPerspektif} data per perspektif`);
      console.log(`   🎯 Rencana Strategis: ${rencanaStrategisId}`);
      
      // Buat data untuk setiap kategori SWOT
      const swotEntries = [];
      
      for (const [kategori, items] of Object.entries(swotData)) {
        // Generate bobot untuk perspektif ini
        const bobots = generateBobotForPerspektif(jumlahDataPerPerspektif);
        
        for (let i = 0; i < jumlahDataPerPerspektif; i++) {
          const itemIndex = i % items.length; // Cycle through items if needed
          swotEntries.push({
            user_id: USER_ID,
            rencana_strategis_id: rencanaStrategisId,
            unit_kerja_id: unit.id,
            tahun: TAHUN,
            kategori: kategori,
            objek_analisis: items[itemIndex],
            bobot: bobots[i],
            rank: Math.floor(Math.random() * 3) + 3, // Random 3-5
            kuantitas: 1 // Akan disembunyikan di frontend
          });
        }
      }
      
      // Insert data ke database
      const { data: insertedData, error: insertError } = await supabase
        .from('swot_analisis')
        .insert(swotEntries)
        .select('id');
      
      if (insertError) {
        console.error(`❌ Error inserting data for ${unit.name}:`, insertError);
        continue;
      }
      
      totalInserted += insertedData.length;
      processedUnits++;
      
      console.log(`   ✅ Berhasil menambahkan ${insertedData.length} data SWOT`);
      
      // Delay kecil untuk menghindari rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('\n🎉 SELESAI!');
    console.log(`📊 Total unit kerja diproses: ${processedUnits}`);
    console.log(`📈 Total data SWOT dibuat: ${totalInserted}`);
    console.log(`📋 Rata-rata data per unit: ${Math.round(totalInserted / processedUnits)} data`);
    
    // Verifikasi bobot per perspektif
    console.log('\n🔍 VERIFIKASI BOBOT PER PERSPEKTIF:');
    
    const { data: bobotCheck, error: bobotError } = await supabase
      .from('swot_analisis')
      .select(`
        kategori,
        unit_kerja_id,
        bobot,
        master_work_units!inner(name)
      `)
      .eq('tahun', TAHUN)
      .limit(20); // Sample check
    
    if (!bobotError) {
      const unitSample = bobotCheck.reduce((acc, item) => {
        const unitName = item.master_work_units.name;
        if (!acc[unitName]) acc[unitName] = {};
        if (!acc[unitName][item.kategori]) acc[unitName][item.kategori] = 0;
        acc[unitName][item.kategori] += item.bobot;
        return acc;
      }, {});
      
      console.log('Sample verifikasi bobot (maksimal 100 per perspektif):');
      Object.entries(unitSample).slice(0, 3).forEach(([unitName, categories]) => {
        console.log(`\n${unitName}:`);
        Object.entries(categories).forEach(([kategori, totalBobot]) => {
          const status = totalBobot <= 100 ? '✅' : '❌';
          console.log(`   ${kategori}: ${totalBobot} ${status}`);
        });
      });
    }
    
    console.log('\n✅ KOREKSI BERHASIL DITERAPKAN:');
    console.log('1. ✅ Data berkorelasi dengan rencana strategis');
    console.log('2. ✅ Bobot maksimal per perspektif = 100');
    console.log('3. ✅ Kolom kuantitas tetap ada (akan disembunyikan di frontend)');
    console.log('4. ✅ Jumlah data per perspektif: 5-6 data (konsisten per unit)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Jalankan script
createCorrectedSwotData();