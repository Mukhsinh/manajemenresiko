const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = 'cc39ee53-4006-4b55-b383-a1ec5c40e676'; // mukhsin9@gmail.com
const TAHUN = 2025;

// Data SWOT profesional berdasarkan jenis dan kategori unit kerja
const swotDataTemplates = {
  // Unit Rawat Inap - Klinis
  'rawat inap_klinis': {
    'Strength': [
      'Tenaga medis dan perawat berpengalaman dengan sertifikasi kompetensi yang memadai',
      'Fasilitas ruang rawat inap dengan standar akreditasi nasional dan internasional',
      'Sistem monitoring pasien 24 jam dengan teknologi terkini dan terintegrasi',
      'Protokol keselamatan pasien yang komprehensif dan terstandarisasi',
      'Kapasitas tempat tidur yang memadai dengan tingkat okupansi optimal'
    ],
    'Weakness': [
      'Keterbatasan jumlah tenaga perawat spesialis pada shift malam dan akhir pekan',
      'Sistem informasi manajemen pasien yang belum terintegrasi penuh antar unit',
      'Keterbatasan ruang isolasi untuk pasien dengan penyakit menular tertentu',
      'Proses discharge planning yang masih memerlukan koordinasi lebih baik',
      'Fasilitas penunjang seperti lift pasien yang perlu pemeliharaan berkala'
    ],
    'Opportunity': [
      'Pengembangan layanan rawat inap berbasis teknologi digital dan telemedicine',
      'Kerjasama dengan institusi pendidikan untuk program magang dan penelitian',
      'Implementasi sistem manajemen kualitas ISO untuk meningkatkan standar pelayanan',
      'Pengembangan paket layanan rawat inap komprehensif untuk pasien BPJS dan umum',
      'Peluang akreditasi internasional JCI untuk meningkatkan reputasi dan daya saing'
    ],
    'Threat': [
      'Persaingan dengan rumah sakit swasta yang memiliki fasilitas lebih modern',
      'Perubahan regulasi BPJS yang dapat mempengaruhi sistem pembiayaan',
      'Risiko infeksi nosokomial dan outbreak penyakit menular di lingkungan rumah sakit',
      'Kenaikan biaya operasional dan pemeliharaan peralatan medis yang signifikan',
      'Tuntutan hukum dari pasien atau keluarga terkait medical malpractice'
    ]
  },

  // Unit Rawat Jalan - Klinis
  'rawat jalan_klinis': {
    'Strength': [
      'Dokter spesialis berpengalaman dengan jadwal praktek yang teratur dan konsisten',
      'Sistem antrian online yang memudahkan pasien dalam mengakses layanan',
      'Fasilitas poliklinik yang nyaman dengan standar kebersihan dan keamanan tinggi',
      'Waktu tunggu pelayanan yang relatif singkat dengan manajemen alur pasien yang baik',
      'Kerjasama dengan laboratorium dan radiologi untuk pemeriksaan penunjang terintegrasi'
    ],
    'Weakness': [
      'Keterbatasan slot jadwal praktek dokter spesialis tertentu pada jam prime time',
      'Sistem rekam medis elektronik yang belum terintegrasi penuh dengan unit lain',
      'Ruang tunggu yang terbatas pada jam-jam sibuk dan hari tertentu',
      'Keterbatasan fasilitas parkir untuk pasien dan pengunjung',
      'Proses rujukan internal yang masih memerlukan koordinasi manual antar poliklinik'
    ],
    'Opportunity': [
      'Pengembangan layanan telemedicine dan konsultasi online untuk follow-up pasien',
      'Implementasi sistem appointment scheduling yang lebih canggih dan user-friendly',
      'Kerjasama dengan perusahaan untuk program medical check-up karyawan',
      'Pengembangan paket screening dan deteksi dini penyakit tidak menular',
      'Ekspansi layanan home care dan mobile clinic untuk menjangkau area terpencil'
    ],
    'Threat': [
      'Kompetisi dengan klinik swasta dan rumah sakit lain dalam menarik pasien',
      'Perubahan pola penyakit dan demografi yang memerlukan adaptasi layanan',
      'Risiko penurunan kunjungan pasien akibat pandemi atau wabah penyakit',
      'Ketergantungan pada sistem BPJS yang dapat berubah sewaktu-waktu',
      'Tuntutan pasien terhadap kualitas layanan yang semakin tinggi dan kompleks'
    ]
  },

  // Unit Penunjang Medis - Klinis
  'penunjang medis_klinis': {
    'Strength': [
      'Peralatan medis modern dengan teknologi terkini dan kalibrasi berkala',
      'Tenaga teknis bersertifikat dengan kompetensi sesuai standar profesi',
      'Sistem quality control dan quality assurance yang ketat dan terstandarisasi',
      'Waktu turnaround time hasil pemeriksaan yang cepat dan akurat',
      'Kerjasama dengan laboratorium rujukan untuk pemeriksaan khusus'
    ],
    'Weakness': [
      'Keterbatasan kapasitas pemeriksaan pada jam-jam sibuk dan hari libur',
      'Sistem informasi laboratorium yang belum terintegrasi penuh dengan HIS',
      'Keterbatasan ruang tunggu dan area persiapan pasien',
      'Biaya maintenance peralatan yang tinggi dan ketergantungan pada vendor',
      'Proses pengambilan sampel yang masih memerlukan koordinasi manual'
    ],
    'Opportunity': [
      'Pengembangan layanan pemeriksaan molekuler dan genetic testing',
      'Implementasi sistem automasi laboratorium untuk meningkatkan efisiensi',
      'Kerjasama dengan institusi penelitian untuk pengembangan metode diagnostik baru',
      'Ekspansi layanan point-of-care testing di unit-unit pelayanan',
      'Sertifikasi akreditasi internasional untuk laboratorium dan radiologi'
    ],
    'Threat': [
      'Persaingan dengan laboratorium swasta yang menawarkan harga kompetitif',
      'Perubahan teknologi diagnostik yang memerlukan investasi peralatan baru',
      'Risiko kontaminasi sampel dan kesalahan pre-analitik',
      'Regulasi ketat terkait limbah medis dan bahan berbahaya',
      'Ketergantungan pada supply chain reagent dan consumables yang tidak stabil'
    ]
  },

  // Unit Administrasi - Non Klinis
  'administrasi_non klinis': {
    'Strength': [
      'Sistem administrasi yang terstruktur dengan SOP yang jelas dan terstandarisasi',
      'Tenaga administrasi yang berpengalaman dengan pemahaman regulasi yang baik',
      'Sistem dokumentasi dan arsip yang tertata rapi dan mudah diakses',
      'Proses perizinan dan akreditasi yang terpelihara dengan baik',
      'Koordinasi antar unit yang efektif dalam mendukung operasional rumah sakit'
    ],
    'Weakness': [
      'Sistem informasi manajemen yang belum terintegrasi penuh antar divisi',
      'Proses birokrasi yang masih panjang untuk beberapa jenis pelayanan',
      'Keterbatasan SDM untuk menangani beban kerja yang meningkat',
      'Sistem backup data dan disaster recovery yang perlu diperkuat',
      'Koordinasi dengan instansi eksternal yang masih memerlukan perbaikan'
    ],
    'Opportunity': [
      'Implementasi sistem digitalisasi dokumen dan workflow automation',
      'Pengembangan dashboard manajemen untuk monitoring kinerja real-time',
      'Kerjasama dengan vendor teknologi untuk solusi enterprise resource planning',
      'Sertifikasi ISO 9001 untuk sistem manajemen kualitas administrasi',
      'Pengembangan sistem customer relationship management untuk stakeholder'
    ],
    'Threat': [
      'Perubahan regulasi pemerintah yang memerlukan adaptasi sistem administrasi',
      'Risiko kehilangan data akibat cyber attack atau system failure',
      'Tuntutan transparansi dan akuntabilitas yang semakin ketat dari publik',
      'Kompleksitas regulasi yang terus bertambah dan berubah',
      'Risiko audit internal dan eksternal yang dapat mengungkap kelemahan sistem'
    ]
  },

  // Unit Manajemen - Non Klinis
  'manajemen_non klinis': {
    'Strength': [
      'Struktur organisasi yang jelas dengan pembagian tugas dan tanggung jawab yang tegas',
      'Sistem perencanaan strategis yang komprehensif dan terukur',
      'Kepemimpinan yang visioner dengan pengalaman manajemen rumah sakit yang luas',
      'Sistem monitoring dan evaluasi kinerja yang regular dan objektif',
      'Budaya organisasi yang mendukung inovasi dan continuous improvement'
    ],
    'Weakness': [
      'Komunikasi vertikal dan horizontal yang masih perlu diperbaiki',
      'Sistem reward dan punishment yang belum optimal dalam memotivasi karyawan',
      'Proses pengambilan keputusan yang kadang memerlukan waktu lama',
      'Keterbatasan anggaran untuk program pengembangan SDM dan infrastruktur',
      'Sistem informasi manajemen yang belum terintegrasi untuk decision support'
    ],
    'Opportunity': [
      'Implementasi balanced scorecard untuk pengukuran kinerja yang komprehensif',
      'Pengembangan program leadership development dan succession planning',
      'Kerjasama dengan konsultan manajemen untuk organizational development',
      'Implementasi sistem enterprise risk management yang terintegrasi',
      'Sertifikasi akreditasi manajemen rumah sakit tingkat nasional dan internasional'
    ],
    'Threat': [
      'Persaingan dalam merekrut dan mempertahankan talenta terbaik',
      'Perubahan ekspektasi stakeholder terhadap kinerja rumah sakit',
      'Tekanan finansial akibat perubahan sistem pembiayaan kesehatan',
      'Risiko reputasi akibat isu-isu yang dapat mempengaruhi citra organisasi',
      'Kompleksitas regulasi dan compliance yang terus meningkat'
    ]
  }
};

// Fungsi untuk mendapatkan template berdasarkan jenis dan kategori
function getSwotTemplate(jenis, kategori) {
  const key = `${jenis}_${kategori}`;
  return swotDataTemplates[key] || swotDataTemplates['administrasi_non klinis']; // default fallback
}

// Fungsi untuk menyesuaikan data SWOT dengan konteks unit kerja spesifik
function customizeSwotData(unitName, jenis, kategori, swotData) {
  const customized = JSON.parse(JSON.stringify(swotData)); // deep copy
  
  // Kustomisasi berdasarkan nama unit kerja
  if (unitName.includes('ICU') || unitName.includes('PICU') || unitName.includes('NICU')) {
    customized.Strength[0] = 'Tenaga medis intensivist dan perawat ICU bersertifikat dengan pengalaman critical care';
    customized.Strength[2] = 'Sistem monitoring pasien kritis 24/7 dengan peralatan life support terkini';
    customized.Weakness[0] = 'Keterbatasan jumlah tenaga spesialis anestesi dan intensivist pada shift tertentu';
    customized.Opportunity[0] = 'Pengembangan layanan telemedicine untuk konsultasi critical care jarak jauh';
    customized.Threat[2] = 'Risiko tinggi infeksi nosokomial pada pasien immunocompromised';
  }
  
  if (unitName.includes('IGD') || unitName.includes('Emergency')) {
    customized.Strength[0] = 'Tim medis emergency yang terlatih dengan sertifikasi ACLS dan ATLS';
    customized.Strength[2] = 'Sistem triase yang efektif dengan response time yang cepat';
    customized.Weakness[0] = 'Keterbatasan kapasitas pada jam-jam sibuk dan kondisi emergency mass casualty';
    customized.Opportunity[0] = 'Pengembangan sistem pre-hospital care dan ambulance service terintegrasi';
    customized.Threat[2] = 'Risiko overload pasien pada situasi bencana atau wabah penyakit';
  }
  
  if (unitName.includes('Laboratorium')) {
    customized.Strength[0] = 'Analis kesehatan bersertifikat dengan kompetensi pemeriksaan klinis lengkap';
    customized.Strength[1] = 'Peralatan analyzer otomatis dengan sistem quality control ketat';
    customized.Weakness[1] = 'Sistem LIS yang belum terintegrasi penuh dengan EMR rumah sakit';
    customized.Opportunity[0] = 'Pengembangan layanan molecular diagnostics dan genetic testing';
    customized.Threat[1] = 'Persaingan dengan laboratorium chain yang memiliki harga kompetitif';
  }
  
  if (unitName.includes('Radiologi')) {
    customized.Strength[0] = 'Dokter radiolog dan radiografer bersertifikat dengan pengalaman imaging lengkap';
    customized.Strength[1] = 'Peralatan imaging modern (CT-Scan, MRI, USG) dengan teknologi terkini';
    customized.Weakness[1] = 'Sistem PACS yang memerlukan upgrade untuk integrasi yang lebih baik';
    customized.Opportunity[0] = 'Pengembangan layanan teleradiology dan AI-assisted diagnosis';
    customized.Threat[1] = 'Biaya maintenance peralatan imaging yang sangat tinggi';
  }
  
  if (unitName.includes('Farmasi')) {
    customized.Strength[0] = 'Apoteker klinis dengan kompetensi pharmaceutical care dan medication therapy management';
    customized.Strength[1] = 'Sistem distribusi obat yang aman dengan barcode dan double check';
    customized.Weakness[1] = 'Sistem informasi farmasi yang belum terintegrasi dengan prescribing system';
    customized.Opportunity[0] = 'Pengembangan layanan clinical pharmacy dan medication reconciliation';
    customized.Threat[1] = 'Fluktuasi harga obat dan keterbatasan supply chain farmasi';
  }
  
  return customized;
}

async function createSwotData() {
  try {
    console.log('🏥 Memulai pembuatan data SWOT Analisis profesional untuk semua unit kerja...\n');
    
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
    
    // Ambil rencana strategis aktif (gunakan yang pertama sebagai default)
    const { data: rencanaStrategis, error: rsError } = await supabase
      .from('rencana_strategis')
      .select('id')
      .or('status.eq.Aktif,status.eq.Draft')
      .limit(1);
    
    if (rsError) {
      throw rsError;
    }
    
    const rencanaStrategisId = rencanaStrategis[0]?.id;
    
    let totalInserted = 0;
    let processedUnits = 0;
    
    // Proses setiap unit kerja
    for (const unit of workUnits) {
      console.log(`🔄 Memproses: ${unit.name} (${unit.jenis} - ${unit.kategori})`);
      
      // Dapatkan template SWOT berdasarkan jenis dan kategori
      const swotTemplate = getSwotTemplate(unit.jenis, unit.kategori);
      
      // Kustomisasi data berdasarkan nama unit kerja
      const customizedSwot = customizeSwotData(unit.name, unit.jenis, unit.kategori, swotTemplate);
      
      // Buat data untuk setiap kategori SWOT
      const swotEntries = [];
      
      for (const [kategori, items] of Object.entries(customizedSwot)) {
        for (let i = 0; i < items.length; i++) {
          swotEntries.push({
            user_id: USER_ID,
            rencana_strategis_id: rencanaStrategisId,
            unit_kerja_id: unit.id,
            tahun: TAHUN,
            kategori: kategori,
            objek_analisis: items[i],
            bobot: Math.floor(Math.random() * 21) + 10, // Random 10-30
            rank: Math.floor(Math.random() * 3) + 3, // Random 3-5
            kuantitas: 1
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
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 SELESAI!');
    console.log(`📊 Total unit kerja diproses: ${processedUnits}`);
    console.log(`📈 Total data SWOT dibuat: ${totalInserted}`);
    console.log(`📋 Rata-rata data per unit: ${Math.round(totalInserted / processedUnits)} data`);
    
    // Tampilkan ringkasan per kategori
    const { data: summary, error: summaryError } = await supabase
      .from('swot_analisis')
      .select('kategori, unit_kerja_id')
      .eq('tahun', TAHUN);
    
    if (!summaryError) {
      const categorySummary = summary.reduce((acc, item) => {
        acc[item.kategori] = (acc[item.kategori] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 Ringkasan per kategori SWOT:');
      Object.entries(categorySummary).forEach(([kategori, count]) => {
        console.log(`   ${kategori}: ${count} data`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Jalankan script
createSwotData();