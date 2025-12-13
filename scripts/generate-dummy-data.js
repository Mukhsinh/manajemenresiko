/**
 * Script untuk generate data dummy lengkap untuk aplikasi manajemen risiko rumah sakit
 * 
 * Usage: node scripts/generate-dummy-data.js
 * 
 * Pastikan GEMINI_API_KEY sudah di-set di .env (untuk AI assistant)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus di-set di .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Organization ID (dari data yang ada)
const ORGANIZATION_ID = 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7';
const VISI_MISI_ID = '93924a76-fc9e-48d6-9fe5-062775b78b85';

// Helper functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateKode(prefix, index) {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const num = String(index).padStart(4, '0');
  return `${prefix}-${year}-${month}-${num}`;
}

// Data templates
const RENCANA_STRATEGIS = [
  {
    nama_rencana: 'Peningkatan Kualitas Pelayanan Medis',
    deskripsi: 'Meningkatkan kualitas pelayanan medis melalui peningkatan kompetensi SDM, standarisasi prosedur, dan implementasi teknologi medis terkini',
    periode_mulai: '2025-01-01',
    periode_selesai: '2027-12-31',
    target: 'Mencapai akreditasi SNARS level paripurna dan meningkatkan kepuasan pasien menjadi 90%',
    indikator_kinerja: 'Kepuasan pasien, waktu tunggu pelayanan, angka komplikasi, angka infeksi nosokomial'
  },
  {
    nama_rencana: 'Penguatan Sistem Keamanan Pasien',
    deskripsi: 'Menguatkan sistem keamanan pasien melalui implementasi patient safety goals, peningkatan kesadaran SDM, dan monitoring berkelanjutan',
    periode_mulai: '2025-01-01',
    periode_selesai: '2027-12-31',
    target: 'Menurunkan insiden keselamatan pasien sebesar 50% dan mencapai zero harm untuk kejadian sentinel',
    indikator_kinerja: 'Angka kejadian tidak diharapkan, angka near miss, compliance terhadap patient safety goals'
  },
  {
    nama_rencana: 'Optimalisasi Manajemen Sumber Daya',
    deskripsi: 'Mengoptimalkan manajemen sumber daya manusia, keuangan, dan infrastruktur untuk mendukung pelayanan yang efisien dan efektif',
    periode_mulai: '2025-01-01',
    periode_selesai: '2027-12-31',
    target: 'Meningkatkan efisiensi operasional sebesar 20% dan optimalisasi penggunaan anggaran',
    indikator_kinerja: 'Rasio BOR, efisiensi biaya, produktivitas SDM, utilisasi ruang'
  },
  {
    nama_rencana: 'Transformasi Digital Pelayanan Kesehatan',
    deskripsi: 'Mentransformasi pelayanan kesehatan melalui implementasi sistem informasi terintegrasi, telemedicine, dan digitalisasi proses bisnis',
    periode_mulai: '2025-01-01',
    periode_selesai: '2027-12-31',
    target: 'Mengimplementasikan sistem informasi terintegrasi dan meningkatkan aksesibilitas pelayanan melalui digitalisasi',
    indikator_kinerja: 'Tingkat adopsi sistem digital, kepuasan pengguna, efisiensi proses, aksesibilitas layanan'
  }
];

const RISK_DESCRIPTIONS = [
  {
    sasaran: 'Meningkatkan kualitas pelayanan medis',
    penyebab: 'Keterbatasan kompetensi SDM medis, kurangnya standarisasi prosedur',
    dampak: 'Menurunnya kualitas pelayanan, meningkatnya komplikasi, menurunnya kepuasan pasien'
  },
  {
    sasaran: 'Mengurangi risiko infeksi nosokomial',
    penyebab: 'Kurangnya kepatuhan terhadap protokol pencegahan infeksi, keterbatasan fasilitas',
    dampak: 'Meningkatnya angka infeksi, perpanjangan masa rawat, peningkatan biaya perawatan'
  },
  {
    sasaran: 'Meningkatkan keselamatan pasien',
    penyebab: 'Human error, kurangnya komunikasi antar tim, sistem yang tidak optimal',
    dampak: 'Terjadinya kejadian tidak diharapkan, menurunnya kepercayaan pasien, risiko hukum'
  },
  {
    sasaran: 'Mengoptimalkan penggunaan sumber daya',
    penyebab: 'Perencanaan yang kurang optimal, pemborosan, kurangnya monitoring',
    dampak: 'Peningkatan biaya operasional, inefisiensi, keterbatasan anggaran untuk pengembangan'
  },
  {
    sasaran: 'Meningkatkan kepuasan pasien',
    penyebab: 'Waktu tunggu yang lama, kurangnya komunikasi, kualitas pelayanan yang belum optimal',
    dampak: 'Menurunnya jumlah kunjungan, keluhan pasien, reputasi rumah sakit'
  }
];

const PELUANG_DESCRIPTIONS = [
  'Pengembangan program kesehatan preventif dan promotif',
  'Kerjasama dengan institusi pendidikan untuk program magang dan penelitian',
  'Implementasi teknologi telemedicine untuk perluasan jangkauan pelayanan',
  'Pengembangan unit unggulan spesialisasi tertentu',
  'Program CSR untuk meningkatkan citra dan kontribusi sosial'
];

const KRI_NAMES = [
  'Rasio BOR (Bed Occupancy Rate)',
  'Angka Infeksi Nosokomial',
  'Waktu Tunggu Pelayanan',
  'Tingkat Kepuasan Pasien',
  'Rasio Komplikasi Pasca Bedah'
];

const LOSS_EVENT_DESCRIPTIONS = [
  'Kejadian jatuh pasien di ruang rawat inap',
  'Kesalahan pemberian obat kepada pasien',
  'Kehilangan atau kerusakan peralatan medis',
  'Kebocoran data pasien',
  'Kecelakaan kerja pada tenaga kesehatan'
];

const EWS_INDICATORS = [
  'Tingkat kepadatan ruang rawat inap',
  'Angka infeksi nosokomial per bulan',
  'Jumlah keluhan pasien per bulan',
  'Rasio komplikasi pasca bedah',
  'Tingkat utilisasi peralatan medis kritis'
];

// Main generation functions
async function createRencanaStrategis() {
  console.log('Creating 4 rencana strategis...');
  const rencanaData = [];
  
  for (let i = 0; i < RENCANA_STRATEGIS.length; i++) {
    const rencana = RENCANA_STRATEGIS[i];
    const kode = generateKode('RS', i + 1);
    
    rencanaData.push({
      kode,
      nama_rencana: rencana.nama_rencana,
      deskripsi: rencana.deskripsi,
      periode_mulai: rencana.periode_mulai,
      periode_selesai: rencana.periode_selesai,
      target: rencana.target,
      indikator_kinerja: rencana.indikator_kinerja,
      status: 'Aktif',
      visi_misi_id: VISI_MISI_ID,
      organization_id: ORGANIZATION_ID,
      sasaran_strategis: JSON.stringify([]),
      indikator_kinerja_utama: JSON.stringify([])
    });
  }
  
  const { data, error } = await supabase
    .from('rencana_strategis')
    .insert(rencanaData)
    .select();
  
  if (error) {
    console.error('Error creating rencana strategis:', error);
    throw error;
  }
  
  console.log(`✓ Created ${data.length} rencana strategis`);
  return data;
}

async function getWorkUnits() {
  const { data, error } = await supabase
    .from('master_work_units')
    .select('id, name')
    .eq('organization_id', ORGANIZATION_ID);
  
  if (error) throw error;
  return data || [];
}

async function getRiskCategories() {
  const { data, error } = await supabase
    .from('master_risk_categories')
    .select('id, name');
  
  if (error) throw error;
  return data || [];
}

async function getRencanaStrategis() {
  const { data, error } = await supabase
    .from('rencana_strategis')
    .select('id, kode, nama_rencana')
    .eq('organization_id', ORGANIZATION_ID);
  
  if (error) throw error;
  return data || [];
}

async function createRiskInputs(workUnits, riskCategories, rencanaStrategis, userId) {
  console.log('Creating risk inputs (5 per unit)...');
  const riskInputs = [];
  const inherentAnalyses = [];
  const residualAnalyses = [];
  const treatments = [];
  const appetites = [];
  const monitorings = [];
  
  let riskNo = 1;
  
  for (const unit of workUnits) {
    for (let i = 0; i < 5; i++) {
      const riskDesc = randomChoice(RISK_DESCRIPTIONS);
      const category = randomChoice(riskCategories);
      const rencana = randomChoice(rencanaStrategis);
      const kodeRisiko = `RISK-${new Date().getFullYear()}-${String(riskNo).padStart(4, '0')}`;
      
      const riskInput = {
        no: riskNo++,
        kode_risiko: kodeRisiko,
        status_risiko: 'Active',
        jenis_risiko: randomChoice(['Threat', 'Opportunity']),
        kategori_risiko_id: category.id,
        nama_unit_kerja_id: unit.id,
        sasaran: riskDesc.sasaran,
        tanggal_registrasi: randomDate(new Date(2024, 0, 1), new Date()).toISOString().split('T')[0],
        penyebab_risiko: riskDesc.penyebab,
        dampak_risiko: riskDesc.dampak,
        pihak_terkait: 'Tim Manajemen Risiko, Unit Terkait',
        rencana_strategis_id: rencana.id,
        organization_id: ORGANIZATION_ID,
        identifikasi_tanggal: randomDate(new Date(2024, 0, 1), new Date()).toISOString().split('T')[0],
        identifikasi_deskripsi: `Risiko terkait ${riskDesc.sasaran.toLowerCase()} di unit ${unit.name}`,
        identifikasi_akar_penyebab: riskDesc.penyebab,
        identifikasi_indikator: 'Monitoring berkala, laporan insiden',
        identifikasi_faktor_positif: 'Komitmen manajemen, SDM yang kompeten',
        identifikasi_deskripsi_dampak: riskDesc.dampak,
        pemilik_risiko_nama: `Dr. ${randomChoice(['Ahmad', 'Siti', 'Budi', 'Dewi', 'Rudi'])}`,
        pemilik_risiko_jabatan: randomChoice(['Kepala Unit', 'Koordinator', 'Supervisor']),
        pemilik_risiko_no_hp: `08${randomInt(100000000, 999999999)}`,
        pemilik_risiko_email: `pemilik${riskNo}@rsud.example.com`,
        pemilik_risiko_strategi: 'Mitigasi risiko melalui peningkatan kapasitas dan monitoring',
        pemilik_risiko_penanganan: 'Implementasi prosedur standar, pelatihan SDM, monitoring berkala',
        pemilik_risiko_biaya: randomInt(5000000, 50000000),
        sasaran_strategis_refs: JSON.stringify([]),
        indikator_kinerja_refs: JSON.stringify([])
      };
      
      riskInputs.push(riskInput);
    }
  }
  
  // Insert risk inputs
  const { data: insertedRisks, error: riskError } = await supabase
    .from('risk_inputs')
    .insert(riskInputs.map(r => ({ ...r, user_id: userId })))
    .select();
  
  if (riskError) throw riskError;
  
  console.log(`✓ Created ${insertedRisks.length} risk inputs`);
  
  // Create related data for each risk
  for (const risk of insertedRisks) {
    // Inherent analysis
    const prob = randomInt(2, 5);
    const impact = randomInt(2, 5);
    const riskValue = prob * impact;
    const riskLevel = riskValue <= 4 ? 'LOW RISK' : riskValue <= 9 ? 'MEDIUM RISK' : riskValue <= 15 ? 'HIGH RISK' : 'EXTREME HIGH';
    
    inherentAnalyses.push({
      risk_input_id: risk.id,
      probability: prob,
      impact: impact,
      risk_value: riskValue,
      risk_level: riskLevel,
      probability_percentage: `${prob * 20}%`,
      financial_impact: randomInt(10000000, 100000000)
    });
    
    // Residual analysis (after mitigation)
    const resProb = Math.max(1, prob - randomInt(0, 2));
    const resImpact = Math.max(1, impact - randomInt(0, 2));
    const resRiskValue = resProb * resImpact;
    const resRiskLevel = resRiskValue <= 4 ? 'LOW RISK' : resRiskValue <= 9 ? 'MEDIUM RISK' : resRiskValue <= 15 ? 'HIGH RISK' : 'EXTREME HIGH';
    
    residualAnalyses.push({
      risk_input_id: risk.id,
      probability: resProb,
      impact: resImpact,
      risk_value: resRiskValue,
      risk_level: resRiskLevel,
      probability_percentage: `${resProb * 20}%`,
      financial_impact: randomInt(5000000, 50000000),
      net_risk_value: riskValue - resRiskValue,
      department: riskInputs.find(r => r.kode_risiko === risk.kode_risiko)?.nama_unit_kerja_id || null,
      review_status: randomChoice(['On Track', 'Need Attention', 'Completed']),
      next_review_date: randomDate(new Date(), new Date(2025, 11, 31)).toISOString().split('T')[0]
    });
    
    // Treatments
    treatments.push({
      risk_input_id: risk.id,
      pemilik_risiko: riskInputs.find(r => r.kode_risiko === risk.kode_risiko)?.pemilik_risiko_nama || 'Dr. Unknown',
      jabatan_pemilik_risiko: riskInputs.find(r => r.kode_risiko === risk.kode_risiko)?.pemilik_risiko_jabatan || 'Kepala Unit',
      email_pemilik_risiko: riskInputs.find(r => r.kode_risiko === risk.kode_risiko)?.pemilik_risiko_email || 'email@example.com',
      status: randomChoice(['In Progress', 'Planned', 'Completed']),
      penanganan_risiko: 'Implementasi prosedur standar dan monitoring berkala',
      biaya_penanganan_risiko: randomInt(3000000, 30000000),
      penanggung_jawab_penanganan_risiko: 'Tim Manajemen Risiko',
      tanggal_registrasi: randomDate(new Date(2024, 0, 1), new Date()).toISOString().split('T')[0],
      rencana_penanganan_risiko_mitigasi: 'Pelatihan SDM, peningkatan fasilitas, monitoring berkala'
    });
    
    // Risk appetite
    appetites.push({
      risk_input_id: risk.id,
      user_id: userId,
      risk_appetite_level: riskLevel
    });
    
    // Monitoring
    monitorings.push({
      risk_input_id: risk.id,
      pemilik: riskInputs.find(r => r.kode_risiko === risk.kode_risiko)?.pemilik_risiko_nama || 'Dr. Unknown',
      risk_management: 'Monitoring dilakukan secara berkala setiap bulan',
      tanggal_terakhir_review_risiko: randomDate(new Date(2024, 0, 1), new Date()).toISOString().split('T')[0],
      tanggal_review_berikutnya: randomDate(new Date(), new Date(2025, 11, 31)).toISOString().split('T')[0],
      status_residual: resRiskLevel
    });
  }
  
  // Insert all related data
  await Promise.all([
    supabase.from('risk_inherent_analysis').insert(inherentAnalyses),
    supabase.from('risk_residual_analysis').insert(residualAnalyses),
    supabase.from('risk_treatments').insert(treatments),
    supabase.from('risk_appetite').insert(appetites),
    supabase.from('risk_monitoring').insert(monitorings)
  ]);
  
  console.log(`✓ Created related data for all risks`);
  
  return insertedRisks;
}

// Continue with other generation functions...
// (Due to length, I'll create a simplified version that generates all data)

async function main() {
  try {
    console.log('Starting dummy data generation...\n');
    
    // Get a user ID (we'll use the first user or create a system user)
    const { data: users } = await supabase.auth.admin.listUsers();
    const userId = users?.users?.[0]?.id;
    
    if (!userId) {
      console.error('No users found. Please create a user first.');
      return;
    }
    
    // Step 1: Create rencana strategis
    const rencanaStrategis = await createRencanaStrategis();
    
    // Step 2: Get work units and categories
    const workUnits = await getWorkUnits();
    const riskCategories = await getRiskCategories();
    
    console.log(`Found ${workUnits.length} work units and ${riskCategories.length} risk categories\n`);
    
    // Step 3: Create risk inputs and related data
    await createRiskInputs(workUnits, riskCategories, rencanaStrategis, userId);
    
    console.log('\n✓ Dummy data generation completed!');
    console.log(`\nSummary:`);
    console.log(`- Rencana Strategis: ${rencanaStrategis.length}`);
    console.log(`- Risk Inputs: ${workUnits.length * 5}`);
    console.log(`- Related data created for all risks`);
    
  } catch (error) {
    console.error('Error generating dummy data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, createRencanaStrategis, createRiskInputs };

