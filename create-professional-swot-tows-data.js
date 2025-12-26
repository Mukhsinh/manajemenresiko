const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function createProfessionalSwotTowsData() {
  try {
    console.log('🚀 Memulai pembuatan data SWOT TOWS Strategi profesional...');

    // Ambil data rencana strategis yang ada
    const { data: rencanaStrategis, error: rsError } = await supabase
      .from('rencana_strategis')
      .select('id, kode, nama_rencana, user_id, organization_id')
      .order('created_at', { ascending: false });

    if (rsError) {
      console.error('❌ Error mengambil data rencana strategis:', rsError);
      return;
    }

    if (!rencanaStrategis || rencanaStrategis.length === 0) {
      console.error('❌ Tidak ada data rencana strategis yang ditemukan');
      return;
    }

    console.log(`📋 Ditemukan ${rencanaStrategis.length} rencana strategis`);

    // Hapus data SWOT TOWS yang ada terlebih dahulu
    const { error: deleteError } = await supabase
      .from('swot_tows_strategi')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('❌ Error menghapus data lama:', deleteError);
    } else {
      console.log('🗑️ Data SWOT TOWS lama berhasil dihapus');
    }

    // Template strategi profesional untuk setiap tipe
    const strategiTemplates = {
      'SO': [
        'Mengoptimalkan kekuatan sumber daya manusia berkualitas untuk memanfaatkan peluang digitalisasi dan teknologi kesehatan terkini',
        'Memanfaatkan sistem manajemen yang efisien untuk mengembangkan layanan inovatif sesuai kebutuhan pasar kesehatan'
      ],
      'WO': [
        'Mengatasi keterbatasan infrastruktur dengan memanfaatkan peluang kerjasama strategis dan investasi teknologi',
        'Memperbaiki sistem operasional melalui adopsi teknologi digital dan otomasi proses bisnis'
      ],
      'ST': [
        'Menggunakan keunggulan kompetensi medis untuk menghadapi tantangan persaingan dan regulasi yang ketat',
        'Memanfaatkan sistem keamanan dan kualitas yang kuat untuk mitigasi risiko operasional dan reputasi'
      ],
      'WT': [
        'Meminimalkan kelemahan kapasitas dengan menghindari ancaman melalui peningkatan efisiensi dan standardisasi',
        'Mengurangi risiko operasional melalui penguatan sistem kontrol internal dan manajemen risiko'
      ]
    };

    const towsData = [];

    // Untuk setiap rencana strategis, buat 2 strategi untuk setiap tipe TOWS
    for (const rencana of rencanaStrategis) {
      for (const [tipeStrategi, strategiList] of Object.entries(strategiTemplates)) {
        for (let i = 0; i < strategiList.length; i++) {
          towsData.push({
            user_id: rencana.user_id,
            rencana_strategis_id: rencana.id,
            tahun: 2025,
            tipe_strategi: tipeStrategi,
            strategi: strategiList[i],
            organization_id: rencana.organization_id
          });
        }
      }
    }

    console.log(`📝 Akan membuat ${towsData.length} data SWOT TOWS strategi`);

    // Insert data dalam batch
    const batchSize = 10;
    for (let i = 0; i < towsData.length; i += batchSize) {
      const batch = towsData.slice(i, i + batchSize);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('swot_tows_strategi')
        .insert(batch)
        .select();

      if (insertError) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError);
        continue;
      }

      console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} berhasil diinsert (${batch.length} records)`);
    }

    // Verifikasi data yang berhasil diinsert
    const { data: verifyData, error: verifyError } = await supabase
      .from('swot_tows_strategi')
      .select('id, tipe_strategi, strategi, rencana_strategis_id')
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('❌ Error verifikasi data:', verifyError);
      return;
    }

    console.log('\n📊 RINGKASAN DATA SWOT TOWS STRATEGI:');
    console.log('=====================================');
    
    const summary = verifyData.reduce((acc, item) => {
      acc[item.tipe_strategi] = (acc[item.tipe_strategi] || 0) + 1;
      return acc;
    }, {});

    Object.entries(summary).forEach(([tipe, count]) => {
      console.log(`${tipe}: ${count} strategi`);
    });

    console.log(`\n✅ Total: ${verifyData.length} data SWOT TOWS strategi berhasil dibuat`);
    console.log('\n🎯 CONTOH DATA YANG DIBUAT:');
    console.log('===========================');
    
    ['SO', 'WO', 'ST', 'WT'].forEach(tipe => {
      const example = verifyData.find(item => item.tipe_strategi === tipe);
      if (example) {
        console.log(`\n${tipe}: ${example.strategi.substring(0, 80)}...`);
      }
    });

    return verifyData;

  } catch (error) {
    console.error('❌ Error dalam createProfessionalSwotTowsData:', error);
    throw error;
  }
}

// Jalankan fungsi jika file dieksekusi langsung
if (require.main === module) {
  createProfessionalSwotTowsData()
    .then(() => {
      console.log('\n🎉 Proses pembuatan data SWOT TOWS strategi selesai!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Proses gagal:', error);
      process.exit(1);
    });
}

module.exports = { createProfessionalSwotTowsData };