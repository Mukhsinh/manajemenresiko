const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createProfessionalRiskInputData() {
  try {
    console.log('🏥 Membuat data profesional untuk Risk Input - Manajemen Risiko Rumah Sakit...');

    // Get required reference data
    const { data: organizations } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);

    const { data: riskCategories } = await supabase
      .from('master_risk_categories')
      .select('*');

    const { data: workUnits } = await supabase
      .from('master_work_units')
      .select('*')
      .limit(20);

    const { data: rencanaStrategis } = await supabase
      .from('rencana_strategis')
      .select('*')
      .limit(3);

    if (!organizations?.length || !riskCategories?.length || !workUnits?.length) {
      throw new Error('Data referensi tidak lengkap');
    }

    const orgId = organizations[0].id;
    const userId = 'cc39ee53-4006-4b55-b383-a1ec5c40e676'; // Superadmin user

    // Professional Risk Input Data for Hospital Risk Management
    const riskInputData = [
      // RISIKO OPERASIONAL - Pelayanan Medis
      {
        user_id: userId,
        no: 1,
        kode_risiko: 'RO-001',
        status_risiko: 'Active',
        jenis_risiko: 'Threat',
        kategori_risiko_id: riskCategories.find(c => c.name === 'Risiko Operasional')?.id,
        nama_unit_kerja_id: workUnits.find(w => w.name.includes('IGD'))?.id || workUnits[0].id,
        sasaran: 'Memberikan pelayanan gawat darurat yang cepat, tepat, dan aman 24/7',
        tanggal_registrasi: '2025-01-15',
        penyebab_risiko: 'Keterlambatan respons tim medis, keterbatasan peralatan medis darurat, overload pasien pada jam sibuk, kurangnya koordinasi antar unit',
        dampak_risiko: 'Peningkatan morbiditas dan mortalitas pasien, penurunan kepuasan pasien, risiko malpraktik, kerugian reputasi rumah sakit',
        pihak_terkait: 'Dokter jaga IGD, Perawat IGD, Radiologi, Laboratorium, Farmasi, Keluarga pasien',
        rencana_strategis_id: rencanaStrategis[0]?.id,
        identifikasi_tanggal: '2025-01-10',
        identifikasi_deskripsi: 'Risiko keterlambatan penanganan pasien gawat darurat yang dapat mengancam keselamatan jiwa',
        identifikasi_akar_penyebab: 'Sistem triase yang belum optimal, rasio perawat-pasien tidak seimbang, protokol emergency response belum terstandarisasi',
        identifikasi_indikator: 'Response time > 15 menit, Door to doctor time > 10 menit, Tingkat kepuasan pasien < 80%',
        identifikasi_faktor_positif: 'Tim medis berpengalaman, lokasi strategis, fasilitas peralatan medis memadai',
        identifikasi_deskripsi_dampak: 'Dapat menyebabkan kematian pasien, gugatan hukum, penurunan trust masyarakat, sanksi regulatori',
        pemilik_risiko_nama: 'Dr. Ahmad Santoso, Sp.EM',
        pemilik_risiko_jabatan: 'Kepala Unit Gawat Darurat',
        pemilik_risiko_no_hp: '081234567890',
        pemilik_risiko_email: 'ahmad.santoso@rsudbendan.go.id',
        pemilik_risiko_strategi: 'Implementasi sistem triase elektronik, peningkatan rasio tenaga medis, standardisasi protokol emergency',
        pemilik_risiko_penanganan: 'Pelatihan BLS/ACLS berkala, upgrade peralatan medis, sistem monitoring real-time',
        pemilik_risiko_biaya: 750000000,
        organization_id: orgId
      },

      // RISIKO KEPATUHAN - Akreditasi
      {
        user_id: userId,
        no: 2,
        kode_risiko: 'RK-001',
        status_risiko: 'Active',
        jenis_risiko: 'Threat',
        kategori_risiko_id: riskCategories.find(c => c.name === 'Risiko Kepatuhan')?.id,
        nama_unit_kerja_id: workUnits.find(w => w.name.includes('Akreditasi'))?.id || workUnits[4].id,
        sasaran: 'Mempertahankan status akreditasi KARS Paripurna dan mencapai akreditasi internasional JCI',
        tanggal_registrasi: '2025-01-20',
        penyebab_risiko: 'Perubahan standar akreditasi, ketidakpatuhan terhadap SOP, dokumentasi tidak lengkap, kurangnya pemahaman staf terhadap standar',
        dampak_risiko: 'Penurunan status akreditasi, sanksi regulatori, kehilangan kepercayaan publik, penurunan kerjasama dengan BPJS',
        pihak_terkait: 'Tim Akreditasi, Seluruh unit kerja, Komite Medik, Komite PMKP, Manajemen rumah sakit',
        rencana_strategis_id: rencanaStrategis[2]?.id,
        identifikasi_tanggal: '2025-01-15',
        identifikasi_deskripsi: 'Risiko tidak terpenuhinya standar akreditasi yang dapat mengakibatkan penurunan status akreditasi',
        identifikasi_akar_penyebab: 'Sistem dokumentasi belum terintegrasi, kurangnya monitoring berkala, resistensi perubahan dari staf',
        identifikasi_indikator: 'Tingkat kepatuhan SOP < 95%, Dokumentasi tidak lengkap > 10%, Temuan surveyor > 5 major',
        identifikasi_faktor_positif: 'Komitmen manajemen tinggi, pengalaman akreditasi sebelumnya, tim akreditasi berpengalaman',
        identifikasi_deskripsi_dampak: 'Kehilangan status akreditasi, penurunan pendapatan, sanksi hukum, kerugian reputasi',
        pemilik_risiko_nama: 'Dr. Siti Nurhaliza, M.Kes',
        pemilik_risiko_jabatan: 'Ketua Tim Akreditasi',
        pemilik_risiko_no_hp: '081234567891',
        pemilik_risiko_email: 'siti.nurhaliza@rsudbendan.go.id',
        pemilik_risiko_strategi: 'Implementasi sistem manajemen mutu terintegrasi, audit internal berkala, pelatihan berkelanjutan',
        pemilik_risiko_penanganan: 'Sistem monitoring real-time, dashboard compliance, program reward and punishment',
        pemilik_risiko_biaya: 500000000,
        organization_id: orgId
      },

      // RISIKO KEUANGAN - Manajemen Keuangan
      {
        user_id: userId,
        no: 3,
        kode_risiko: 'RK-002',
        status_risiko: 'Active',
        jenis_risiko: 'Threat',
        kategori_risiko_id: riskCategories.find(c => c.name === 'Risiko Operasional')?.id,
        nama_unit_kerja_id: workUnits.find(w => w.name.includes('Keuangan'))?.id || workUnits[1].id,
        sasaran: 'Mencapai keseimbangan keuangan dan sustainability operasional rumah sakit',
        tanggal_registrasi: '2025-01-25',
        penyebab_risiko: 'Keterlambatan pembayaran BPJS, peningkatan biaya operasional, penurunan jumlah pasien, inflasi harga obat dan alkes',
        dampak_risiko: 'Defisit anggaran, kesulitan cash flow, penurunan kualitas pelayanan, keterlambatan gaji karyawan',
        pihak_terkait: 'Bagian Keuangan, Direksi, BPJS Kesehatan, Supplier, Karyawan, Pasien',
        rencana_strategis_id: rencanaStrategis[1]?.id,
        identifikasi_tanggal: '2025-01-20',
        identifikasi_deskripsi: 'Risiko ketidakseimbangan keuangan yang dapat mengancam sustainability operasional rumah sakit',
        identifikasi_akar_penyebab: 'Sistem penagihan tidak efisien, kontrol biaya kurang ketat, diversifikasi pendapatan terbatas',
        identifikasi_indikator: 'Current ratio < 1.5, Days sales outstanding > 60 hari, Operating margin < 5%',
        identifikasi_faktor_positif: 'Status BLUD memberikan fleksibilitas, lokasi strategis, brand recognition kuat',
        identifikasi_deskripsi_dampak: 'Kesulitan operasional, penurunan kualitas layanan, risiko kebangkrutan, PHK karyawan',
        pemilik_risiko_nama: 'Drs. Bambang Wijaya, M.M',
        pemilik_risiko_jabatan: 'Kepala Bagian Keuangan',
        pemilik_risiko_no_hp: '081234567892',
        pemilik_risiko_email: 'bambang.wijaya@rsudbendan.go.id',
        pemilik_risiko_strategi: 'Diversifikasi sumber pendapatan, optimalisasi sistem penagihan, kontrol biaya ketat',
        pemilik_risiko_penanganan: 'Implementasi ERP system, dashboard keuangan real-time, program cost reduction',
        pemilik_risiko_biaya: 1000000000,
        organization_id: orgId
      },

      // RISIKO TEKNOLOGI - Sistem Informasi
      {
        user_id: userId,
        no: 4,
        kode_risiko: 'RT-001',
        status_risiko: 'Active',
        jenis_risiko: 'Threat',
        kategori_risiko_id: riskCategories.find(c => c.name === 'Technology Risk')?.id,
        nama_unit_kerja_id: workUnits.find(w => w.name.includes('IT') || w.name.includes('Sistem'))?.id || workUnits[2].id,
        sasaran: 'Menjamin ketersediaan dan keamanan sistem informasi rumah sakit 24/7',
        tanggal_registrasi: '2025-02-01',
        penyebab_risiko: 'Serangan siber, kegagalan sistem, human error, kurangnya backup system, infrastruktur IT yang aging',
        dampak_risiko: 'Gangguan operasional, kehilangan data pasien, pelanggaran privasi, kerugian finansial, sanksi regulatori',
        pihak_terkait: 'Tim IT, Seluruh pengguna sistem, Vendor IT, Pasien, Regulator',
        rencana_strategis_id: rencanaStrategis[2]?.id,
        identifikasi_tanggal: '2025-01-28',
        identifikasi_deskripsi: 'Risiko gangguan sistem informasi yang dapat melumpuhkan operasional rumah sakit',
        identifikasi_akar_penyebab: 'Infrastruktur IT belum redundant, sistem keamanan siber belum optimal, SDM IT terbatas',
        identifikasi_indikator: 'System uptime < 99.5%, Security incident > 2 per bulan, Recovery time > 4 jam',
        identifikasi_faktor_positif: 'Sistem SIMRS sudah terintegrasi, tim IT berpengalaman, dukungan vendor kuat',
        identifikasi_deskripsi_dampak: 'Paralisis operasional, kehilangan data kritis, gugatan hukum, kerugian reputasi',
        pemilik_risiko_nama: 'Ir. Andi Prasetyo, M.T',
        pemilik_risiko_jabatan: 'Kepala Unit IT',
        pemilik_risiko_no_hp: '081234567893',
        pemilik_risiko_email: 'andi.prasetyo@rsudbendan.go.id',
        pemilik_risiko_strategi: 'Implementasi disaster recovery plan, upgrade infrastruktur IT, penguatan cybersecurity',
        pemilik_risiko_penanganan: 'Sistem backup otomatis, monitoring 24/7, pelatihan cybersecurity awareness',
        pemilik_risiko_biaya: 800000000,
        organization_id: orgId
      },

      // RISIKO SDM - Manajemen SDM
      {
        user_id: userId,
        no: 5,
        kode_risiko: 'RS-001',
        status_risiko: 'Active',
        jenis_risiko: 'Threat',
        kategori_risiko_id: riskCategories.find(c => c.name === 'Risiko Operasional')?.id,
        nama_unit_kerja_id: workUnits.find(w => w.name.includes('SDM') || w.name.includes('Kepegawaian'))?.id || workUnits[3].id,
        sasaran: 'Mempertahankan dan mengembangkan SDM berkualitas untuk mendukung pelayanan prima',
        tanggal_registrasi: '2025-02-05',
        penyebab_risiko: 'Turnover tinggi, kesulitan rekrutmen tenaga spesialis, aging workforce, kompetisi dengan RS swasta',
        dampak_risiko: 'Penurunan kualitas pelayanan, beban kerja berlebih, burnout syndrome, penurunan produktivitas',
        pihak_terkait: 'Bagian SDM, Seluruh karyawan, Direksi, Serikat pekerja, Pasien',
        rencana_strategis_id: rencanaStrategis[0]?.id,
        identifikasi_tanggal: '2025-02-01',
        identifikasi_deskripsi: 'Risiko kekurangan dan penurunan kualitas SDM yang dapat mempengaruhi kualitas pelayanan',
        identifikasi_akar_penyebab: 'Sistem remunerasi kurang kompetitif, career path tidak jelas, work-life balance buruk',
        identifikasi_indikator: 'Turnover rate > 15%, Vacancy rate > 10%, Employee satisfaction < 70%',
        identifikasi_faktor_positif: 'Status PNS memberikan job security, program pengembangan SDM tersedia, lingkungan kerja kondusif',
        identifikasi_deskripsi_dampak: 'Penurunan service quality, patient safety risk, operational disruption, reputational damage',
        pemilik_risiko_nama: 'Dra. Retno Wulandari, M.M',
        pemilik_risiko_jabatan: 'Kepala Bagian SDM',
        pemilik_risiko_no_hp: '081234567894',
        pemilik_risiko_email: 'retno.wulandari@rsudbendan.go.id',
        pemilik_risiko_strategi: 'Program retention, peningkatan welfare, pengembangan karir berkelanjutan',
        pemilik_risiko_penanganan: 'Sistem performance management, program wellness, succession planning',
        pemilik_risiko_biaya: 600000000,
        organization_id: orgId
      }
    ];

    // Insert risk input data
    const { data: insertedRisks, error: insertError } = await supabase
      .from('risk_inputs')
      .insert(riskInputData)
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log(`✅ Berhasil membuat ${insertedRisks.length} data risk input profesional`);

    // Create related risk analysis data
    for (const risk of insertedRisks) {
      // Create inherent risk analysis
      const inherentData = {
        risk_input_id: risk.id,
        probability: Math.floor(Math.random() * 3) + 3, // 3-5
        impact: Math.floor(Math.random() * 3) + 3, // 3-5
        risk_value: 0, // Will be calculated
        risk_level: '',
        probability_percentage: ['60-80%', '80-90%', '90-95%'][Math.floor(Math.random() * 3)],
        financial_impact: Math.floor(Math.random() * 500000000) + 100000000
      };
      
      inherentData.risk_value = inherentData.probability * inherentData.impact;
      inherentData.risk_level = inherentData.risk_value >= 20 ? 'Sangat Tinggi' : 
                               inherentData.risk_value >= 15 ? 'Tinggi' : 
                               inherentData.risk_value >= 10 ? 'Sedang' : 'Rendah';

      await supabase.from('risk_inherent_analysis').insert(inherentData);

      // Create residual risk analysis
      const residualData = {
        risk_input_id: risk.id,
        probability: Math.max(1, inherentData.probability - Math.floor(Math.random() * 2) - 1),
        impact: Math.max(1, inherentData.impact - Math.floor(Math.random() * 2) - 1),
        risk_value: 0,
        risk_level: '',
        probability_percentage: ['20-40%', '40-60%', '60-80%'][Math.floor(Math.random() * 3)],
        financial_impact: inherentData.financial_impact * 0.6,
        net_risk_value: 0,
        department: risk.nama_unit_kerja_id,
        review_status: 'Reviewed',
        next_review_date: '2025-06-30'
      };

      residualData.risk_value = residualData.probability * residualData.impact;
      residualData.net_risk_value = residualData.risk_value;
      residualData.risk_level = residualData.risk_value >= 20 ? 'Sangat Tinggi' : 
                               residualData.risk_value >= 15 ? 'Tinggi' : 
                               residualData.risk_value >= 10 ? 'Sedang' : 'Rendah';

      await supabase.from('risk_residual_analysis').insert(residualData);
    }

    console.log('✅ Data analisis risiko inherent dan residual berhasil dibuat');
    console.log('\n📊 Summary Data Risk Input:');
    console.log(`- Total Risk Input: ${insertedRisks.length}`);
    console.log(`- Risiko Operasional: ${riskInputData.filter(r => r.kategori_risiko_id === riskCategories.find(c => c.name === 'Risiko Operasional')?.id).length}`);
    console.log(`- Risiko Kepatuhan: ${riskInputData.filter(r => r.kategori_risiko_id === riskCategories.find(c => c.name === 'Risiko Kepatuhan')?.id).length}`);
    console.log(`- Risiko Legal: ${riskInputData.filter(r => r.kategori_risiko_id === riskCategories.find(c => c.name === 'Risiko Legal')?.id).length}`);
    console.log(`- Technology Risk: ${riskInputData.filter(r => r.kategori_risiko_id === riskCategories.find(c => c.name === 'Technology Risk')?.id).length}`);

  } catch (error) {
    console.error('❌ Error creating risk input data:', error);
    throw error;
  }
}

// Run the function
if (require.main === module) {
  createProfessionalRiskInputData()
    .then(() => {
      console.log('🎉 Selesai membuat data risk input profesional!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = { createProfessionalRiskInputData };