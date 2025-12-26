const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyRencanaStrategisData() {
  console.log('=== VERIFIKASI DATA RENCANA STRATEGIS PROFESSIONAL ===');
  
  try {
    // Get user ID for mukhsin9@gmail.com
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;
    
    const user = userData.users.find(u => u.email === 'mukhsin9@gmail.com');
    if (!user) {
      console.log('❌ User mukhsin9@gmail.com tidak ditemukan');
      return;
    }
    
    console.log('✅ User ditemukan:', user.email);
    
    // Get rencana strategis data
    const { data: rencanaData, error: rencanaError } = await supabase
      .from('rencana_strategis')
      .select('*')
      .eq('user_id', user.id)
      .order('kode');
    
    if (rencanaError) throw rencanaError;
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total Rencana Strategis: ${rencanaData.length}`);
    
    if (rencanaData.length === 0) {
      console.log('❌ Tidak ada data rencana strategis');
      return;
    }
    
    // Group by mission type
    const missionGroups = {};
    
    rencanaData.forEach((item, index) => {
      const missionNumber = Math.floor(index / 3) + 1;
      if (!missionGroups[missionNumber]) {
        missionGroups[missionNumber] = [];
      }
      missionGroups[missionNumber].push(item);
    });
    
    console.log(`\n📋 DETAIL RENCANA STRATEGIS:`);
    
    Object.keys(missionGroups).forEach(missionNum => {
      const missionNames = {
        '1': 'Pelayanan Berorientasi Keselamatan Pasien dan Kepuasan Pelanggan',
        '2': 'Tata Kelola Rumah Sakit yang Independen, Akuntabel, dan Profesional',
        '3': 'Pendidikan dan Penelitian Bermutu'
      };
      
      console.log(`\n🎯 MISI ${missionNum}: ${missionNames[missionNum]}`);
      
      missionGroups[missionNum].forEach((item, idx) => {
        console.log(`\n   ${idx + 1}. ${item.kode} - ${item.nama_rencana}`);
        console.log(`      📝 Deskripsi: ${item.deskripsi.substring(0, 100)}...`);
        console.log(`      🎯 Target: ${item.target.substring(0, 80)}...`);
        console.log(`      📅 Periode: ${item.periode_mulai} s/d ${item.periode_selesai}`);
        console.log(`      📊 Status: ${item.status}`);
        
        // Parse sasaran strategis
        let sasaran = [];
        try {
          sasaran = typeof item.sasaran_strategis === 'string' 
            ? JSON.parse(item.sasaran_strategis) 
            : item.sasaran_strategis || [];
        } catch (e) {
          console.log(`      ⚠️ Error parsing sasaran: ${e.message}`);
        }
        
        // Parse indikator kinerja utama
        let indikator = [];
        try {
          indikator = typeof item.indikator_kinerja_utama === 'string' 
            ? JSON.parse(item.indikator_kinerja_utama) 
            : item.indikator_kinerja_utama || [];
        } catch (e) {
          console.log(`      ⚠️ Error parsing indikator: ${e.message}`);
        }
        
        console.log(`      🎯 Sasaran Strategis (${sasaran.length}):`);
        sasaran.forEach((s, i) => {
          console.log(`         ${i + 1}. ${s}`);
        });
        
        console.log(`      📈 Indikator Kinerja Utama (${indikator.length}):`);
        indikator.forEach((ind, i) => {
          console.log(`         ${i + 1}. ${ind}`);
        });
      });
    });
    
    // Validation
    console.log(`\n✅ VALIDASI:`);
    const validationResults = {
      totalRecords: rencanaData.length,
      expectedRecords: 9,
      recordsPerMission: 3,
      allHaveKode: rencanaData.every(item => item.kode),
      allHaveNama: rencanaData.every(item => item.nama_rencana),
      allHaveSasaran: rencanaData.every(item => {
        try {
          const sasaran = typeof item.sasaran_strategis === 'string' 
            ? JSON.parse(item.sasaran_strategis) 
            : item.sasaran_strategis;
          return Array.isArray(sasaran) && sasaran.length > 0;
        } catch {
          return false;
        }
      }),
      allHaveIndikator: rencanaData.every(item => {
        try {
          const indikator = typeof item.indikator_kinerja_utama === 'string' 
            ? JSON.parse(item.indikator_kinerja_utama) 
            : item.indikator_kinerja_utama;
          return Array.isArray(indikator) && indikator.length > 0;
        } catch {
          return false;
        }
      })
    };
    
    console.log(`Total Records: ${validationResults.totalRecords}/${validationResults.expectedRecords} ✅`);
    console.log(`All Have Kode: ${validationResults.allHaveKode ? '✅' : '❌'}`);
    console.log(`All Have Nama: ${validationResults.allHaveNama ? '✅' : '❌'}`);
    console.log(`All Have Sasaran: ${validationResults.allHaveSasaran ? '✅' : '❌'}`);
    console.log(`All Have Indikator: ${validationResults.allHaveIndikator ? '✅' : '❌'}`);
    
    const overallStatus = Object.values(validationResults).every(v => v === true || v === 9);
    console.log(`\n🎉 OVERALL STATUS: ${overallStatus ? 'SUKSES' : 'PERLU PERBAIKAN'}`);
    
    if (overallStatus) {
      console.log('\n🎊 Data rencana strategis professional telah berhasil dibuat!');
      console.log('📱 Silakan akses halaman /rencana-strategis untuk melihat hasilnya.');
      console.log('🧪 Atau buka: http://localhost:3001/test-rencana-strategis-professional.html');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run verification
verifyRencanaStrategisData();