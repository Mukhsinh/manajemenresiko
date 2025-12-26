const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TAHUN = 2025;

// Fungsi untuk generate bobot yang total per perspektif = 100 dan setiap bobot 1-100
function generateWeights(count) {
  if (count === 1) return [100];
  
  const weights = [];
  let remaining = 100;
  
  // Generate weights untuk n-1 items
  for (let i = 0; i < count - 1; i++) {
    // Hitung range yang masuk akal
    const minRemaining = count - i - 1; // minimal 1 untuk setiap item yang tersisa
    const maxForThis = Math.min(50, remaining - minRemaining); // maksimal 50 atau sisa yang memungkinkan
    const minForThis = Math.max(1, Math.ceil(remaining / (count - i) * 0.3)); // minimal 1
    
    const weight = Math.floor(Math.random() * (maxForThis - minForThis + 1)) + minForThis;
    weights.push(weight);
    remaining -= weight;
  }
  
  // Item terakhir mendapat sisa bobot (pastikan >= 1)
  weights.push(Math.max(1, remaining));
  
  // Jika ada yang melebihi 100, redistribute
  for (let i = 0; i < weights.length; i++) {
    if (weights[i] > 100) {
      const excess = weights[i] - 100;
      weights[i] = 100;
      // Distribute excess ke item lain
      for (let j = 0; j < weights.length && excess > 0; j++) {
        if (i !== j && weights[j] < 100) {
          const canAdd = Math.min(excess, 100 - weights[j]);
          weights[j] += canAdd;
          excess -= canAdd;
        }
      }
    }
  }
  
  // Final check dan adjustment jika total tidak 100
  const currentTotal = weights.reduce((sum, w) => sum + w, 0);
  if (currentTotal !== 100) {
    const diff = 100 - currentTotal;
    // Adjust the largest weight
    const maxIndex = weights.indexOf(Math.max(...weights));
    weights[maxIndex] += diff;
    
    // Ensure it's still within bounds
    if (weights[maxIndex] > 100) {
      weights[maxIndex] = 100;
      // Redistribute the excess
      const excess = weights[maxIndex] - 100;
      for (let i = 0; i < weights.length && excess > 0; i++) {
        if (i !== maxIndex) {
          const canReduce = Math.min(excess, weights[i] - 1);
          weights[i] -= canReduce;
          excess -= canReduce;
        }
      }
    }
    if (weights[maxIndex] < 1) {
      weights[maxIndex] = 1;
    }
  }
  
  // Shuffle array untuk randomize urutan
  for (let i = weights.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weights[i], weights[j]] = [weights[j], weights[i]];
  }
  
  return weights;
}

async function finalFixSwotData() {
  try {
    console.log('🔧 Perbaikan final data SWOT dengan bobot yang benar...\n');
    
    // Hapus semua data lama
    console.log('🗑️  Menghapus semua data SWOT lama...');
    const { error: deleteError } = await supabase
      .from('swot_analisis')
      .delete()
      .eq('tahun', TAHUN);
    
    if (deleteError) {
      throw deleteError;
    }
    console.log('✅ Data lama berhasil dihapus\n');
    
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
    
    // Ambil rencana strategis
    const { data: strategicPlans, error: spError } = await supabase
      .from('rencana_strategis')
      .select('id, nama_rencana')
      .order('nama_rencana');
    
    if (spError) {
      throw spError;
    }
    
    console.log(`📋 Ditemukan ${workUnits.length} unit kerja\n`);
    
    // Mapping unit ke rencana strategis
    const unitToStrategicPlan = {
      'rawat inap_klinis': strategicPlans.find(sp => sp.nama_rencana.includes('Keselamatan Pasien'))?.id,
      'rawat jalan_klinis': strategicPlans.find(sp => sp.nama_rencana.includes('Keselamatan Pasien'))?.id,
      'penunjang medis_klinis': strategicPlans.find(sp => sp.nama_rencana.includes('Inovasi Layanan'))?.id,
      'administrasi_non klinis': strategicPlans.find(sp => sp.nama_rencana.includes('Digitalisasi'))?.id,
      'manajemen_non klinis': strategicPlans.find(sp => sp.nama_rencana.includes('Tata Kelola'))?.id
    };
    
    // Data SWOT yang berkorelasi dengan rencana strategis
    const swotTemplates = {
      'rawat inap_klinis': {
        'Strength': [
          'Implementasi protokol keselamatan pasien yang terstandarisasi sesuai akreditasi nasional',
          'Sistem monitoring dan surveillance keselamatan pasien 24 jam dengan teknologi terkini',
          'Tim keselamatan pasien multidisiplin yang terlatih dan bersertifikat',
          'Budaya keselamatan pasien yang kuat dengan sistem pelaporan insiden transparan',
          'Fasilitas dan peralatan medis yang memenuhi standar keselamatan dengan kalibrasi berkala',
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
          'Implementasi sistem early warning berbasis AI untuk deteksi dini risiko pasien',
          'Pengembangan program patient safety champion di setiap unit pelayanan',
          'Kerjasama dengan institusi internasional untuk benchmarking keselamatan pasien',
          'Implementasi teknologi smart monitoring untuk pencegahan medication error',
          'Pengembangan aplikasi mobile untuk pelaporan insiden dan near miss real-time',
          'Sertifikasi akreditasi keselamatan pasien tingkat internasional JCI Patient Safety'
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
      },
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
      },
      'administrasi_non klinis': {
        'Strength': [
          'Infrastruktur IT yang robust dengan sistem backup dan disaster recovery',
          'Tim IT yang kompeten dalam pengembangan dan maintenance sistem informasi',
          'Implementasi electronic medical record EMR yang terintegrasi',
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
          'Implementasi Internet of Things IoT untuk smart hospital management',
          'Kerjasama dengan fintech untuk digital payment dan billing system',
          'Pengembangan big data analytics untuk business intelligence',
          'Implementasi robotic process automation RPA untuk efisiensi operasional'
        ],
        'Threat': [
          'Ancaman cybersecurity dan data breach yang semakin sophisticated',
          'Perubahan regulasi data privacy dan protection yang ketat',
          'Ketergantungan pada vendor teknologi dan risiko vendor lock-in',
          'Obsolescence teknologi yang memerlukan investasi berkelanjutan',
          'Kompetisi dengan rumah sakit yang lebih advanced dalam digitalisasi',
          'Risiko system downtime yang dapat mengganggu operasional kritis'
        ]
      },
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
          'Implementasi enterprise risk management ERM yang sophisticated',
          'Pengembangan program leadership development dan talent management'
        ],
        'Threat': [
          'Perubahan regulasi healthcare yang memerlukan adaptasi governance',
          'Tekanan stakeholder untuk transparansi dan akuntabilitas yang tinggi',
          'Kompetisi dalam merekrut dan mempertahankan talent manajemen',
          'Risiko reputasi akibat isu-isu yang dapat mempengaruhi citra organisasi',
          'Kompleksitas regulasi yang terus meningkat dan berubah',
          'Tuntutan kinerja finansial dan operasional yang semakin ketat'
        ]
      }
    };
    
    const USER_ID = 'cc39ee53-4006-4b55-b383-a1ec5c40e676';
    let totalInserted = 0;
    let processedUnits = 0;
    
    // Proses setiap unit kerja
    for (const unit of workUnits) {
      console.log(`🔄 Memproses: ${unit.name} (${unit.jenis} - ${unit.kategori})`);
      
      // Tentukan rencana strategis yang sesuai
      const key = `${unit.jenis}_${unit.kategori}`;
      const strategicPlanId = unitToStrategicPlan[key] || strategicPlans[0].id;
      
      // Dapatkan template SWOT yang sesuai
      const template = swotTemplates[key] || swotTemplates['administrasi_non klinis'];
      
      // Tentukan jumlah data per perspektif (5 atau 6)
      const itemsPerCategory = Math.random() > 0.5 ? 5 : 6;
      console.log(`   📊 Menggunakan ${itemsPerCategory} data per perspektif`);
      
      // Buat data untuk setiap kategori SWOT
      const swotEntries = [];
      
      for (const [kategori, items] of Object.entries(template)) {
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
          });
        }
        
        // Verifikasi total bobot untuk kategori ini
        const totalBobot = weights.reduce((sum, w) => sum + w, 0);
        if (totalBobot !== 100) {
          console.log(`   ⚠️  Warning: Total bobot ${kategori} = ${totalBobot} (seharusnya 100)`);
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
    
    console.log('\n🎉 PERBAIKAN FINAL SELESAI!');
    console.log(`📊 Total unit kerja diproses: ${processedUnits}`);
    console.log(`📈 Total data SWOT dibuat: ${totalInserted}`);
    console.log(`📋 Rata-rata data per unit: ${Math.round(totalInserted / processedUnits)} data`);
    
    // Verifikasi final
    console.log('\n🔍 VERIFIKASI FINAL:');
    
    const { data: finalVerification, error: finalError } = await supabase
      .from('swot_analisis')
      .select(`
        unit_kerja_id,
        kategori,
        bobot,
        master_work_units!inner(name)
      `)
      .eq('tahun', TAHUN);
    
    if (!finalError) {
      // Group untuk verifikasi
      const verificationGroups = finalVerification.reduce((acc, item) => {
        const key = `${item.master_work_units.name}_${item.kategori}`;
        if (!acc[key]) {
          acc[key] = { total: 0, count: 0, items: [] };
        }
        acc[key].total += item.bobot;
        acc[key].count += 1;
        acc[key].items.push(item.bobot);
        return acc;
      }, {});
      
      // Hitung statistik
      const allGroups = Object.keys(verificationGroups).length;
      const correctGroups = Object.values(verificationGroups).filter(data => data.total === 100).length;
      const successRate = ((correctGroups / allGroups) * 100).toFixed(2);
      
      console.log(`📈 STATISTIK KEBERHASILAN:`);
      console.log(`   Total grup perspektif: ${allGroups}`);
      console.log(`   Grup dengan bobot = 100: ${correctGroups}`);
      console.log(`   Tingkat keberhasilan: ${successRate}%`);
      
      if (successRate === '100.00') {
        console.log('\n🎉 SEMPURNA! Semua grup perspektif memiliki total bobot = 100');
      } else {
        console.log('\n⚠️  Ada grup yang masih bermasalah:');
        const problematic = Object.entries(verificationGroups)
          .filter(([key, data]) => data.total !== 100)
          .slice(0, 5);
        
        problematic.forEach(([key, data]) => {
          console.log(`   ❌ ${key}: ${data.total} (${data.items.join(', ')})`);
        });
      }
      
      // Sample data yang berhasil
      console.log('\n✅ Sample data yang berhasil (5 grup):');
      Object.entries(verificationGroups)
        .filter(([key, data]) => data.total === 100)
        .slice(0, 5)
        .forEach(([key, data]) => {
          console.log(`   ✅ ${key}: ${data.total} (${data.items.join(' + ')})`);
        });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Jalankan perbaikan final
finalFixSwotData();