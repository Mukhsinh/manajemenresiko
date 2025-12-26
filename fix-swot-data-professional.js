const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = 'cc39ee53-4006-4b55-b383-a1ec5c40e676'; // mukhsin9@gmail.com
const TAHUN = 2025;

// Mapping unit kerja ke rencana strategis yang relevan
const unitToStrategicPlan = {
  // Unit Klinis -> Keselamatan Pasien
  'rawat inap_klinis': '04b00510-6b9a-43e8-846a-d690f83a6003', // Peningkatan Sistem Keselamatan Pasien
  'rawat jalan_klinis': '04b00510-6b9a-43e8-846a-d690f83a6003', // Peningkatan Sistem Keselamatan Pasien
  'penunjang medis_klinis': '716eb8ed-f56e-4f59-9270-e5c2c140734a', // Program Inovasi Layanan Berkelanjutan
  
  // Unit Administrasi -> Digitalisasi atau Manajemen Keuangan
  'administrasi_non klinis': '3911838f-562e-4c6e-985b-8155a89dcc51', // Digitalisasi Pelayanan Kesehatan
  
  // Unit Manajemen -> Tata Kelola atau SDM
  'manajemen_non klinis': '789308c7-7d0d-4c1e-8c65-3615568c683c' // Implementasi Sistem Tata Kelola
};

// Data SWOT profesional yang berkorelasi dengan rencana strategis
const swotDataTemplates = {
  // Keselamatan Pasien - untuk unit klinis
  '04b00510-6b9a-43e8-846a-d690f83a6003': {
    'rawat inap_klinis': {
      'Strength': [
        'Implementasi protokol keselamatan pasien yang terstandarisasi sesuai standar nasional dan internasional',
        'Sistem monitoring dan surveillance keselamatan pasien 24 jam dengan teknologi terkini',
        'Tim keselamatan pasien multidisiplin yang terlatih dan bersertifikat',
        'Budaya keselamatan pasien yang kuat dengan sistem pelaporan insiden yang transparan',
        'Fasilitas dan peralatan medis yang memenuhi standar keselamatan dan kalibrasi berkala',
        'Sistem identifikasi pasien yang akurat dengan teknologi barcode dan RFID'
      ],
      'Weakness': [
        'Keterbatasan sistem informasi terintegrasi untuk monitoring real-time keselamatan pasien',
        'Variasi tingkat pemahaman dan implementasi protokol keselamatan antar shift kerja',
        'Keterbatasan kapasitas pelatihan berkelanjutan untuk seluruh staf klinis',
        'Sistem dokumentasi insiden keselamatan yang masih memerlukan digitalisasi penuh',
        'Koordinasi antar unit dalam penanganan kasus kompleks yang perlu diperkuat',
        'Keterbatasan sumber daya untuk implementasi teknologi keselamatan terbaru'
      ],
      'Opportunity': [
        'Implementasi sistem early warning system berbasis AI untuk deteksi dini risiko pasien',
        'Pengembangan program patient safety champion di setiap unit pelayanan',
        'Kerjasama dengan institusi internasional untuk benchmarking keselamatan pasien',
        'Implementasi teknologi smart monitoring untuk pencegahan medication error',
        'Pengembangan aplikasi mobile untuk pelaporan insiden dan near miss secara real-time',
        'Sertifikasi akreditasi keselamatan pasien tingkat internasional (JCI Patient Safety)'
      ],
      'Threat': [
        'Peningkatan kompleksitas kasus dan komorbiditas pasien yang meningkatkan risiko',
        'Tuntutan hukum dan litigasi terkait insiden keselamatan pasien',
        'Perubahan regulasi keselamatan pasien yang memerlukan adaptasi sistem',
        'Tekanan finansial yang dapat mempengaruhi investasi dalam sistem keselamatan',
        'Resistensi perubahan dari sebagian staf terhadap implementasi protokol baru',
        'Risiko burnout tenaga kesehatan yang dapat mempengaruhi vigilance keselamatan'
      ]
    },
    'rawat jalan_klinis': {
      'Strength': [
        'Sistem triase dan skrining keselamatan pasien yang efektif di area rawat jalan',
        'Protokol medication reconciliation yang komprehensif untuk mencegah medication error',
        'Tim farmasi klinis yang aktif dalam monitoring keamanan obat dan interaksi',
        'Sistem appointment dan reminder yang mengurangi risiko missed appointment',
        'Fasilitas emergency response yang siap siaga untuk kondisi kegawatdaruratan',
        'Program edukasi pasien dan keluarga tentang keselamatan dan self-care'
      ],
      'Weakness': [
        'Keterbatasan waktu konsultasi yang dapat mempengaruhi thoroughness assessment',
        'Sistem follow-up pasien rawat jalan yang belum optimal untuk monitoring outcome',
        'Koordinasi dengan layanan penunjang yang masih memerlukan perbaikan',
        'Dokumentasi riwayat alergi dan kontraindikasi yang belum terintegrasi penuh',
        'Keterbatasan ruang privasi untuk konsultasi sensitif dan counseling',
        'Sistem backup untuk kondisi emergency di area rawat jalan yang perlu diperkuat'
      ],
      'Opportunity': [
        'Implementasi telemedicine untuk follow-up dan monitoring pasien jarak jauh',
        'Pengembangan patient portal untuk akses informasi kesehatan dan hasil lab',
        'Implementasi sistem clinical decision support untuk bantuan diagnosis',
        'Pengembangan program chronic disease management yang terintegrasi',
        'Kerjasama dengan primary care untuk continuity of care yang optimal',
        'Implementasi wearable technology untuk monitoring vital signs pasien'
      ],
      'Threat': [
        'Peningkatan volume pasien yang dapat mempengaruhi kualitas dan keselamatan',
        'Risiko diagnostic error akibat keterbatasan waktu dan informasi',
        'Kompleksitas polypharmacy pada pasien geriatri dan komorbid',
        'Risiko lost to follow-up pada pasien dengan kondisi kronis',
        'Perubahan pola penyakit dan emerging diseases yang memerlukan adaptasi',
        'Ketergantungan pada sistem teknologi yang rentan terhadap gangguan'
      ]
    }
  },

  // Program Inovasi Layanan - untuk penunjang medis
  '716eb8ed-f56e-4f59-9270-e5c2c140734a': {
    'penunjang medis_klinis': {
      'Strength': [
        'Peralatan diagnostik canggih dengan teknologi terkini dan akurasi tinggi',
        'Tenaga teknis bersertifikat dengan kompetensi sesuai standar profesi internasional',
        'Sistem quality assurance dan quality control yang ketat dan terstandarisasi',
        'Kerjasama dengan laboratorium rujukan nasional dan internasional',
        'Implementasi lean management untuk efisiensi proses dan eliminasi waste',
        'Program continuous improvement dan innovation dalam pelayanan diagnostik'
      ],
      'Weakness': [
        'Keterbatasan integrasi sistem informasi antar unit penunjang medis',
        'Variasi turnaround time yang belum optimal untuk semua jenis pemeriksaan',
        'Keterbatasan kapasitas untuk pemeriksaan khusus dan molekuler',
        'Sistem inventory management yang perlu digitalisasi dan otomasi',
        'Keterbatasan ruang untuk ekspansi layanan dan peralatan baru',
        'Proses maintenance preventif yang belum sepenuhnya terdigitalisasi'
      ],
      'Opportunity': [
        'Implementasi artificial intelligence untuk interpretasi hasil diagnostik',
        'Pengembangan point-of-care testing untuk hasil cepat di unit pelayanan',
        'Kerjasama riset dengan universitas untuk pengembangan metode diagnostik baru',
        'Implementasi blockchain untuk keamanan dan traceability data diagnostik',
        'Pengembangan layanan home sampling dan mobile diagnostics',
        'Sertifikasi akreditasi internasional untuk laboratorium dan imaging'
      ],
      'Threat': [
        'Persaingan dengan laboratorium chain dan imaging center swasta',
        'Perubahan teknologi diagnostik yang memerlukan investasi besar',
        'Regulasi ketat terkait keamanan radiasi dan limbah medis',
        'Fluktuasi supply chain reagent dan spare part peralatan',
        'Tuntutan akurasi dan kecepatan yang semakin tinggi dari klinisi',
        'Risiko obsolescence peralatan dan kebutuhan upgrade berkelanjutan'
      ]
    }
  },

  // Digitalisasi Pelayanan - untuk administrasi
  '3911838f-562e-4c6e-985b-8155a89dcc51': {
    'administrasi_non klinis': {
      'Strength': [
        'Infrastruktur IT yang robust dengan sistem backup dan disaster recovery',
        'Tim IT yang kompeten dalam pengembangan dan maintenance sistem informasi',
        'Implementasi electronic medical record (EMR) yang terintegrasi',
        'Sistem keamanan data dan cybersecurity yang memadai',
        'Program digitalisasi dokumen dan workflow automation yang berkelanjutan',
        'Kerjasama dengan vendor teknologi terpercaya untuk support dan development'
      ],
      'Weakness': [
        'Keterbatasan interoperabilitas sistem dengan external healthcare providers',
        'Variasi tingkat digital literacy di antara pengguna sistem',
        'Keterbatasan bandwidth dan network capacity untuk beban kerja tinggi',
        'Sistem legacy yang masih memerlukan integrasi dengan platform baru',
        'Proses change management yang perlu diperkuat untuk adopsi teknologi',
        'Keterbatasan budget untuk upgrade hardware dan software berkelanjutan'
      ],
      'Opportunity': [
        'Implementasi cloud computing untuk skalabilitas dan cost efficiency',
        'Pengembangan mobile applications untuk akses informasi real-time',
        'Implementasi Internet of Things (IoT) untuk smart hospital management',
        'Kerjasama dengan fintech untuk digital payment dan billing system',
        'Pengembangan big data analytics untuk business intelligence',
        'Implementasi robotic process automation (RPA) untuk efisiensi operasional'
      ],
      'Threat': [
        'Ancaman cybersecurity dan data breach yang semakin sophisticated',
        'Perubahan regulasi data privacy dan protection yang ketat',
        'Ketergantungan pada vendor teknologi dan risiko vendor lock-in',
        'Obsolescence teknologi yang memerlukan investasi berkelanjutan',
        'Kompetisi dengan rumah sakit yang lebih advanced dalam digitalisasi',
        'Risiko system downtime yang dapat mengganggu operasional kritis'
      ]
    }
  },

  // Sistem Tata Kelola - untuk manajemen
  '789308c7-7d0d-4c1e-8c65-3615568c683c': {
    'manajemen_non klinis': {
      'Strength': [
        'Struktur tata kelola yang jelas dengan pembagian peran dan tanggung jawab',
        'Implementasi good corporate governance sesuai standar nasional dan internasional',
        'Sistem manajemen risiko yang komprehensif dan terintegrasi',
        'Program compliance dan audit internal yang regular dan objektif',
        'Budaya transparansi dan akuntabilitas yang kuat di seluruh organisasi',
        'Kepemimpinan yang visioner dengan komitmen terhadap excellence'
      ],
      'Weakness': [
        'Keterbatasan sistem informasi manajemen untuk real-time decision making',
        'Proses komunikasi vertikal dan horizontal yang perlu diperkuat',
        'Sistem performance management yang belum sepenuhnya terintegrasi',
        'Keterbatasan kapasitas untuk strategic planning dan forecasting',
        'Proses succession planning yang perlu dikembangkan lebih sistematis',
        'Koordinasi antar komite dan unit kerja yang masih dapat dioptimalkan'
      ],
      'Opportunity': [
        'Implementasi balanced scorecard untuk pengukuran kinerja komprehensif',
        'Pengembangan dashboard eksekutif untuk monitoring KPI real-time',
        'Sertifikasi ISO 9001 dan akreditasi manajemen rumah sakit',
        'Kerjasama dengan konsultan manajemen untuk organizational development',
        'Implementasi enterprise risk management (ERM) yang sophisticated',
        'Pengembangan program leadership development dan talent management'
      ],
      'Threat': [
        'Perubahan regulasi healthcare yang memerlukan adaptasi governance',
        'Tekanan stakeholder untuk transparansi dan akuntabilitas yang tinggi',
        'Kompetisi dalam merekrut dan mempertahankan talent manajemen',
        'Risiko reputasi akibat isu governance dan compliance',
        'Kompleksitas regulasi yang terus meningkat dan berubah',
        'Tuntutan kinerja finansial dan operasional yang semakin ketat'
      ]
    }
  }
};

// Fungsi untuk mendapatkan rencana strategis berdasarkan jenis dan kategori unit
function getStrategicPlan(jenis, kategori) {
  const key = `${jenis}_${kategori}`;
  return unitToStrategicPlan[key] || '04b00510-6b9a-43e8-846a-d690f83a6003'; // default ke keselamatan pasien
}

// Fungsi untuk mendapatkan data SWOT berdasarkan rencana strategis dan unit
function getSwotData(strategicPlanId, jenis, kategori) {
  const key = `${jenis}_${kategori}`;
  return swotDataTemplates[strategicPlanId]?.[key] || swotDataTemplates['04b00510-6b9a-43e8-846a-d690f83a6003']['rawat inap_klinis'];
}

// Fungsi untuk generate bobot yang total per perspektif = 100
function generateWeights(count) {
  const weights = [];
  let remaining = 100;
  
  for (let i = 0; i < count - 1; i++) {
    const min = Math.max(10, Math.floor(remaining / (count - i) * 0.5));
    const max = Math.min(30, Math.floor(remaining / (count - i) * 1.5));
    const weight = Math.floor(Math.random() * (max - min + 1)) + min;
    weights.push(weight);
    remaining -= weight;
  }
  
  weights.push(Math.max(10, remaining)); // sisa untuk item terakhir
  
  // Shuffle array untuk randomize
  for (let i = weights.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weights[i], weights[j]] = [weights[j], weights[i]];
  }
  
  return weights;
}

async function fixSwotData() {
  try {
    console.log('🔧 Memulai perbaikan data SWOT Analisis...\n');
    
    // 1. Hapus data lama
    console.log('🗑️  Menghapus data SWOT lama...');
    const { error: deleteError } = await supabase
      .from('swot_analisis')
      .delete()
      .eq('tahun', TAHUN);
    
    if (deleteError) {
      throw deleteError;
    }
    console.log('✅ Data lama berhasil dihapus\n');
    
    // 2. Ambil semua unit kerja
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
    
    // 3. Proses setiap unit kerja
    for (const unit of workUnits) {
      console.log(`🔄 Memproses: ${unit.name} (${unit.jenis} - ${unit.kategori})`);
      
      // Tentukan rencana strategis yang sesuai
      const strategicPlanId = getStrategicPlan(unit.jenis, unit.kategori);
      
      // Dapatkan data SWOT yang sesuai
      const swotData = getSwotData(strategicPlanId, unit.jenis, unit.kategori);
      
      // Tentukan jumlah data per perspektif (5 atau 6)
      const itemsPerCategory = Math.random() > 0.5 ? 5 : 6;
      
      console.log(`   📊 Menggunakan ${itemsPerCategory} data per perspektif`);
      
      // Buat data untuk setiap kategori SWOT
      const swotEntries = [];
      
      for (const [kategori, items] of Object.entries(swotData)) {
        // Generate bobot yang totalnya 100 per perspektif
        const weights = generateWeights(itemsPerCategory);
        
        for (let i = 0; i < itemsPerCategory; i++) {
          const itemIndex = i % items.length; // cycle through items if needed
          swotEntries.push({
            user_id: USER_ID,
            rencana_strategis_id: strategicPlanId,
            unit_kerja_id: unit.id,
            tahun: TAHUN,
            kategori: kategori,
            objek_analisis: items[itemIndex],
            bobot: weights[i],
            rank: Math.floor(Math.random() * 3) + 3, // Random 3-5
            // kuantitas dihilangkan dari insert (akan menggunakan default 1)
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
    
    console.log('\n🎉 PERBAIKAN SELESAI!');
    console.log(`📊 Total unit kerja diproses: ${processedUnits}`);
    console.log(`📈 Total data SWOT dibuat: ${totalInserted}`);
    console.log(`📋 Rata-rata data per unit: ${Math.round(totalInserted / processedUnits)} data`);
    
    // Verifikasi bobot per perspektif
    console.log('\n🔍 VERIFIKASI BOBOT PER PERSPEKTIF:');
    
    const { data: verification, error: verifyError } = await supabase
      .from('swot_analisis')
      .select(`
        unit_kerja_id,
        kategori,
        bobot,
        master_work_units!inner(name)
      `)
      .eq('tahun', TAHUN)
      .limit(20); // sample verification
    
    if (!verifyError) {
      const unitCheck = verification.reduce((acc, item) => {
        const key = `${item.master_work_units.name}_${item.kategori}`;
        if (!acc[key]) acc[key] = 0;
        acc[key] += item.bobot;
        return acc;
      }, {});
      
      console.log('📊 Sample verifikasi bobot (harus = 100 per perspektif):');
      Object.entries(unitCheck).slice(0, 8).forEach(([key, total]) => {
        const status = total === 100 ? '✅' : '❌';
        console.log(`   ${status} ${key}: ${total}`);
      });
    }
    
    // Tampilkan ringkasan korelasi dengan rencana strategis
    console.log('\n📋 KORELASI DENGAN RENCANA STRATEGIS:');
    const { data: correlation, error: corrError } = await supabase
      .from('swot_analisis')
      .select(`
        rencana_strategis_id,
        rencana_strategis!inner(nama_rencana),
        master_work_units!inner(jenis, kategori)
      `)
      .eq('tahun', TAHUN);
    
    if (!corrError) {
      const correlationSummary = correlation.reduce((acc, item) => {
        const plan = item.rencana_strategis.nama_rencana;
        const type = `${item.master_work_units.jenis}_${item.master_work_units.kategori}`;
        if (!acc[plan]) acc[plan] = new Set();
        acc[plan].add(type);
        return acc;
      }, {});
      
      Object.entries(correlationSummary).forEach(([plan, types]) => {
        console.log(`📌 ${plan}:`);
        Array.from(types).forEach(type => {
          console.log(`   - ${type.replace('_', ' - ')}`);
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Jalankan perbaikan
fixSwotData();