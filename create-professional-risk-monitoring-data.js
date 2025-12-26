const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createProfessionalRiskMonitoringData() {
  try {
    console.log('📊 Membuat data profesional untuk Risk Monitoring - Manajemen Risiko Rumah Sakit...');

    // Get existing risk inputs that don't have monitoring yet
    const { data: existingMonitoring } = await supabase
      .from('risk_monitoring')
      .select('risk_input_id');

    const existingRiskInputIds = existingMonitoring?.map(m => m.risk_input_id) || [];

    const { data: riskInputs } = await supabase
      .from('risk_inputs')
      .select('*')
      .not('id', 'in', `(${existingRiskInputIds.length ? existingRiskInputIds.join(',') : 'null'})`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!riskInputs?.length) {
      console.log('ℹ️ Semua risk input sudah memiliki data monitoring');
      return;
    }

    console.log(`📋 Ditemukan ${riskInputs.length} risk input untuk dibuatkan monitoring`);

    // Professional Risk Monitoring Data for Hospital Risk Management
    const riskMonitoringData = riskInputs.map((risk, index) => {
      const monitoringScenarios = [
        {
          pemilik: 'Dr. Ahmad Santoso, Sp.EM',
          risk_management: 'Implementasi sistem triase elektronik dengan algoritma Manchester Triage System, peningkatan rasio perawat-pasien menjadi 1:4, standardisasi protokol emergency response sesuai AHA Guidelines, monitoring real-time melalui dashboard IGD',
          tanggal_terakhir_review_risiko: '2025-01-15',
          tanggal_review_berikutnya: '2025-04-15',
          status_residual: 'Terkendali'
        },
        {
          pemilik: 'Dr. Siti Nurhaliza, M.Kes',
          risk_management: 'Implementasi sistem manajemen mutu terintegrasi ISO 9001:2015, audit internal bulanan dengan checklist KARS, dashboard compliance real-time, program reward and punishment untuk kepatuhan SOP',
          tanggal_terakhir_review_risiko: '2025-01-20',
          tanggal_review_berikutnya: '2025-04-20',
          status_residual: 'Dalam Pemantauan'
        },
        {
          pemilik: 'Drs. Bambang Wijaya, M.M',
          risk_management: 'Implementasi ERP system SAP untuk integrasi keuangan, dashboard keuangan real-time dengan KPI monitoring, program cost reduction 15%, diversifikasi pendapatan melalui layanan unggulan',
          tanggal_terakhir_review_risiko: '2025-01-25',
          tanggal_review_berikutnya: '2025-04-25',
          status_residual: 'Memerlukan Perhatian'
        },
        {
          pemilik: 'Ir. Andi Prasetyo, M.T',
          risk_management: 'Implementasi disaster recovery plan dengan RTO 2 jam dan RPO 15 menit, upgrade infrastruktur IT dengan sistem redundant, penguatan cybersecurity dengan SOC 24/7, backup otomatis setiap 4 jam',
          tanggal_terakhir_review_risiko: '2025-02-01',
          tanggal_review_berikutnya: '2025-05-01',
          status_residual: 'Terkendali'
        },
        {
          pemilik: 'Dra. Retno Wulandari, M.M',
          risk_management: 'Program retention dengan peningkatan tunjangan kinerja 20%, pengembangan karir berkelanjutan melalui beasiswa S2/S3, sistem performance management berbasis KPI, program wellness dan work-life balance',
          tanggal_terakhir_review_risiko: '2025-02-05',
          tanggal_review_berikutnya: '2025-05-05',
          status_residual: 'Dalam Pemantauan'
        }
      ];

      const scenario = monitoringScenarios[index % monitoringScenarios.length];

      return {
        risk_input_id: risk.id,
        pemilik: scenario.pemilik,
        risk_management: scenario.risk_management,
        tanggal_terakhir_review_risiko: scenario.tanggal_terakhir_review_risiko,
        tanggal_review_berikutnya: scenario.tanggal_review_berikutnya,
        status_residual: scenario.status_residual
      };
    });

    // Insert risk monitoring data
    const { data: insertedMonitoring, error: insertError } = await supabase
      .from('risk_monitoring')
      .insert(riskMonitoringData)
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log(`✅ Berhasil membuat ${insertedMonitoring.length} data risk monitoring profesional`);

    console.log('\n📊 Summary Data Risk Monitoring:');
    console.log(`- Total Risk Monitoring: ${insertedMonitoring.length}`);
    console.log(`- Status Terkendali: ${riskMonitoringData.filter(r => r.status_residual === 'Terkendali').length}`);
    console.log(`- Status Dalam Pemantauan: ${riskMonitoringData.filter(r => r.status_residual === 'Dalam Pemantauan').length}`);
    console.log(`- Status Memerlukan Perhatian: ${riskMonitoringData.filter(r => r.status_residual === 'Memerlukan Perhatian').length}`);

    // Display sample data
    console.log('\n📋 Sample Risk Monitoring Data:');
    insertedMonitoring.slice(0, 2).forEach((monitoring, index) => {
      console.log(`\n${index + 1}. Risk Monitoring ID: ${monitoring.id}`);
      console.log(`   Pemilik: ${monitoring.pemilik}`);
      console.log(`   Status Residual: ${monitoring.status_residual}`);
      console.log(`   Review Terakhir: ${monitoring.tanggal_terakhir_review_risiko}`);
      console.log(`   Review Berikutnya: ${monitoring.tanggal_review_berikutnya}`);
    });

  } catch (error) {
    console.error('❌ Error creating risk monitoring data:', error);
    throw error;
  }
}

// Run the function
if (require.main === module) {
  createProfessionalRiskMonitoringData()
    .then(() => {
      console.log('🎉 Selesai membuat data risk monitoring profesional!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = { createProfessionalRiskMonitoringData };