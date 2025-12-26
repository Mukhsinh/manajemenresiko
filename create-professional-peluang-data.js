const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createProfessionalPeluangData() {
  try {
    console.log('🌟 Membuat data profesional untuk Peluang - Manajemen Risiko Rumah Sakit...');

    // Get required reference data
    const { data: organizations } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);

    const { data: riskCategories } = await supabase
      .from('master_risk_categories')
      .select('*');

    if (!organizations?.length || !riskCategories?.length) {
      throw new Error('Data referensi tidak lengkap');
    }

    const orgId = organizations[0].id;
    const userId = 'cc39ee53-4006-4b55-b383-a1ec5c40e676'; // Superadmin user

    // Professional Peluang Data for Hospital Risk Management
    const peluangData = [
      // PELUANG TEKNOLOGI - Digitalisasi Pelayanan
      {
        user_id: userId,
        kode: 'PL-001',
        nama_peluang: 'Implementasi Telemedicine dan Digital Health Platform',
        kategori_peluang_id: riskCategories.find(c => c.name === 'Technology Risk')?.id || riskCategories[0].id,
        deskripsi: 'Pengembangan platform telemedicine terintegrasi untuk konsultasi jarak jauh, monitoring pasien real-time, dan layanan kesehatan digital yang dapat meningkatkan aksesibilitas pelayanan dan efisiensi operasional',
        probabilitas: 4, // 80% kemungkinan berhasil
        dampak_positif: 5, // Dampak sangat tinggi
        nilai_peluang: 20, // 4 x 5
        strategi_pemanfaatan: 'Kerjasama dengan vendor teknologi kesehatan terpercaya, pelatihan SDM intensif, implementasi bertahap mulai dari spesialisasi tertentu, integrasi dengan sistem SIMRS existing, program sosialisasi kepada masyarakat',
        pemilik_peluang: 'Ir. Andi Prasetyo, M.T - Kepala Unit IT',
        status: 'Dalam Perencanaan',
        organization_id: orgId
      },

      // PELUANG KERJASAMA - Medical Tourism
      {
        user_id: userId,
        kode: 'PL-002',
        nama_peluang: 'Pengembangan Medical Tourism dan Layanan Kesehatan Internasional',
        kategori_peluang_id: riskCategories.find(c => c.name === 'Risiko Operasional')?.id || riskCategories[1].id,
        deskripsi: 'Mengembangkan layanan medical tourism dengan standar internasional, menarik pasien dari negara tetangga, dan memposisikan rumah sakit sebagai destinasi kesehatan regional',
        probabilitas: 3, // 60% kemungkinan berhasil
        dampak_positif: 4, // Dampak tinggi
        nilai_peluang: 12, // 3 x 4
        strategi_pemanfaatan: 'Akreditasi internasional JCI, pengembangan paket layanan khusus, kerjasama dengan travel agent kesehatan, peningkatan fasilitas VIP, pelatihan bahasa asing untuk staf, marketing digital internasional',
        pemilik_peluang: 'Dr. Siti Nurhaliza, M.Kes - Ketua Tim Akreditasi',
        status: 'Studi Kelayakan',
        organization_id: orgId
      },

      // PELUANG PENDIDIKAN - Teaching Hospital
      {
        user_id: userId,
        kode: 'PL-003',
        nama_peluang: 'Transformasi menjadi Teaching Hospital dan Pusat Pendidikan Kesehatan',
        kategori_peluang_id: riskCategories.find(c => c.name === 'Risiko Operasional')?.id || riskCategories[1].id,
        deskripsi: 'Mengembangkan rumah sakit menjadi teaching hospital dengan program residency, fellowship, dan pusat pelatihan tenaga kesehatan yang dapat meningkatkan revenue dan reputasi akademik',
        probabilitas: 4, // 80% kemungkinan berhasil
        dampak_positif: 4, // Dampak tinggi
        nilai_peluang: 16, // 4 x 4
        strategi_pemanfaatan: 'Kerjasama dengan universitas kedokteran, pengembangan kurikulum pelatihan, sertifikasi sebagai rumah sakit pendidikan, rekrutmen dokter spesialis konsultan, pembangunan fasilitas pendidikan',
        pemilik_peluang: 'Dr. Ahmad Santoso, Sp.EM - Komite Medik',
        status: 'Dalam Perencanaan',
        organization_id: orgId
      },

      // PELUANG KEUANGAN - Green Hospital Initiative
      {
        user_id: userId,
        kode: 'PL-004',
        nama_peluang: 'Green Hospital Initiative dan Sustainability Program',
        kategori_peluang_id: riskCategories.find(c => c.name === 'Risiko Operasional')?.id || riskCategories[1].id,
        deskripsi: 'Implementasi program rumah sakit hijau dengan teknologi hemat energi, manajemen limbah berkelanjutan, dan sertifikasi green building yang dapat mengurangi biaya operasional dan meningkatkan citra positif',
        probabilitas: 3, // 60% kemungkinan berhasil
        dampak_positif: 3, // Dampak sedang-tinggi
        nilai_peluang: 9, // 3 x 3
        strategi_pemanfaatan: 'Instalasi solar panel, sistem manajemen limbah terintegrasi, sertifikasi LEED/GREENSHIP, program reduce-reuse-recycle, kerjasama dengan lembaga lingkungan, CSR program',
        pemilik_peluang: 'Drs. Bambang Wijaya, M.M - Kepala Bagian Keuangan',
        status: 'Studi Kelayakan',
        organization_id: orgId
      },

      // PELUANG LAYANAN - Center of Excellence
      {
        user_id: userId,
        kode: 'PL-005',
        nama_peluang: 'Pengembangan Center of Excellence untuk Spesialisasi Unggulan',
        kategori_peluang_id: riskCategories.find(c => c.name === 'Risiko Operasional')?.id || riskCategories[1].id,
        deskripsi: 'Mengembangkan pusat keunggulan untuk spesialisasi tertentu seperti Cardiac Center, Cancer Center, atau Stroke Center yang dapat menjadi rujukan regional dan meningkatkan competitive advantage',
        probabilitas: 4, // 80% kemungkinan berhasil
        dampak_positif: 5, // Dampak sangat tinggi
        nilai_peluang: 20, // 4 x 5
        strategi_pemanfaatan: 'Investasi peralatan canggih, rekrutmen dokter sub-spesialis, pengembangan protokol klinis terbaru, kerjasama dengan rumah sakit internasional, program fellowship, akreditasi khusus',
        pemilik_peluang: 'Dr. Ahmad Santoso, Sp.EM - Direktur Medis',
        status: 'Dalam Perencanaan',
        organization_id: orgId
      },

      // PELUANG TEKNOLOGI - AI dan Machine Learning
      {
        user_id: userId,
        kode: 'PL-006',
        nama_peluang: 'Implementasi Artificial Intelligence untuk Diagnostic Support',
        kategori_peluang_id: riskCategories.find(c => c.name === 'Technology Risk')?.id || riskCategories[0].id,
        deskripsi: 'Pengembangan sistem AI untuk mendukung diagnosis radiologi, patologi, dan clinical decision support yang dapat meningkatkan akurasi diagnosis dan efisiensi pelayanan',
        probabilitas: 3, // 60% kemungkinan berhasil
        dampak_positif: 4, // Dampak tinggi
        nilai_peluang: 12, // 3 x 4
        strategi_pemanfaatan: 'Kerjasama dengan tech company, pilot project untuk radiologi, pelatihan radiologist dan dokter, integrasi dengan PACS, validasi klinis, regulatory approval',
        pemilik_peluang: 'Ir. Andi Prasetyo, M.T - Kepala Unit IT',
        status: 'Riset dan Pengembangan',
        organization_id: orgId
      }
    ];

    // Insert peluang data
    const { data: insertedPeluang, error: insertError } = await supabase
      .from('peluang')
      .insert(peluangData)
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log(`✅ Berhasil membuat ${insertedPeluang.length} data peluang profesional`);

    console.log('\n📊 Summary Data Peluang:');
    console.log(`- Total Peluang: ${insertedPeluang.length}`);
    console.log(`- Status Dalam Perencanaan: ${peluangData.filter(p => p.status === 'Dalam Perencanaan').length}`);
    console.log(`- Status Studi Kelayakan: ${peluangData.filter(p => p.status === 'Studi Kelayakan').length}`);
    console.log(`- Status Riset dan Pengembangan: ${peluangData.filter(p => p.status === 'Riset dan Pengembangan').length}`);

    // Calculate opportunity statistics
    const totalNilaiPeluang = peluangData.reduce((sum, p) => sum + p.nilai_peluang, 0);
    const avgNilaiPeluang = totalNilaiPeluang / peluangData.length;
    const highValueOpportunities = peluangData.filter(p => p.nilai_peluang >= 15).length;

    console.log('\n📈 Analisis Peluang:');
    console.log(`- Total Nilai Peluang: ${totalNilaiPeluang}`);
    console.log(`- Rata-rata Nilai Peluang: ${avgNilaiPeluang.toFixed(2)}`);
    console.log(`- Peluang Nilai Tinggi (≥15): ${highValueOpportunities}`);

    // Display sample data
    console.log('\n🌟 Sample Peluang Data:');
    insertedPeluang.slice(0, 3).forEach((peluang, index) => {
      console.log(`\n${index + 1}. ${peluang.nama_peluang}`);
      console.log(`   Kode: ${peluang.kode}`);
      console.log(`   Nilai Peluang: ${peluang.nilai_peluang} (P:${peluang.probabilitas} x I:${peluang.dampak_positif})`);
      console.log(`   Status: ${peluang.status}`);
      console.log(`   Pemilik: ${peluang.pemilik_peluang}`);
    });

  } catch (error) {
    console.error('❌ Error creating peluang data:', error);
    throw error;
  }
}

// Run the function
if (require.main === module) {
  createProfessionalPeluangData()
    .then(() => {
      console.log('🎉 Selesai membuat data peluang profesional!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = { createProfessionalPeluangData };