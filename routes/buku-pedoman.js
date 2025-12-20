const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');

// Get handbook content
router.get('/', authenticateUser, async (req, res) => {
  try {
    const handbookContent = {
      title: "Buku Pedoman Sistem Manajemen Risiko",
      subtitle: "Berdasarkan ISO 31000:2018",
      author: "MUKHSIN HADI, SE, M.Si, CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPAB",
      version: "1.0",
      date: new Date().toISOString().split('T')[0],
      chapters: [
        {
          id: 1,
          title: "Pendahuluan",
          sections: [
            {
              id: "1.1",
              title: "Latar Belakang",
              content: `Manajemen risiko merupakan bagian integral dari tata kelola organisasi yang baik. 
              Berdasarkan ISO 31000:2018, manajemen risiko adalah aktivitas terkoordinasi untuk mengarahkan 
              dan mengendalikan organisasi berkaitan dengan risiko. Buku pedoman ini disusun untuk memberikan 
              panduan komprehensif dalam implementasi sistem manajemen risiko yang efektif dan efisien.`
            },
            {
              id: "1.2", 
              title: "Tujuan Buku Pedoman",
              content: `Buku pedoman ini bertujuan untuk:
              1. Memberikan pemahaman komprehensif tentang konsep manajemen risiko
              2. Menyediakan panduan praktis implementasi ISO 31000:2018
              3. Menjelaskan proses bisnis sistem manajemen risiko
              4. Memberikan template dan tools yang dapat digunakan langsung
              5. Memastikan konsistensi penerapan manajemen risiko di seluruh organisasi`
            },
            {
              id: "1.3",
              title: "Ruang Lingkup",
              content: `Buku pedoman ini mencakup:
              - Kerangka kerja manajemen risiko berdasarkan ISO 31000:2018
              - Proses manajemen risiko dari identifikasi hingga monitoring
              - Integrasi dengan Balanced Scorecard (BSC)
              - Sistem informasi manajemen risiko
              - Pelaporan dan komunikasi risiko
              - Budaya risiko organisasi`
            }
          ]
        },
        {
          id: 2,
          title: "Kerangka Kerja Manajemen Risiko ISO 31000:2018",
          sections: [
            {
              id: "2.1",
              title: "Prinsip-Prinsip Manajemen Risiko",
              content: `Berdasarkan ISO 31000:2018, manajemen risiko harus:
              1. Terintegrasi - Bagian integral dari semua aktivitas organisasi
              2. Terstruktur dan komprehensif - Pendekatan terstruktur dan komprehensif
              3. Disesuaikan - Disesuaikan dengan konteks eksternal dan internal organisasi
              4. Inklusif - Melibatkan pemangku kepentingan yang tepat
              5. Dinamis - Responsif terhadap perubahan
              6. Tersedia informasi terbaik - Berdasarkan informasi historis dan terkini
              7. Faktor manusia dan budaya - Mempertimbangkan kemampuan, persepsi, dan niat manusia
              8. Perbaikan berkelanjutan - Terus ditingkatkan melalui pembelajaran dan pengalaman`
            },
            {
              id: "2.2",
              title: "Kerangka Kerja (Framework)",
              content: `Kerangka kerja manajemen risiko terdiri dari:
              
              A. KEPEMIMPINAN DAN KOMITMEN
              - Komitmen manajemen puncak
              - Kebijakan manajemen risiko
              - Alokasi sumber daya
              - Akuntabilitas dan otoritas
              
              B. INTEGRASI
              - Pemahaman organisasi dan konteksnya
              - Integrasi dalam tata kelola
              - Integrasi dalam strategi dan perencanaan
              - Integrasi dalam manajemen kinerja
              
              C. DESAIN
              - Memahami organisasi dan konteksnya
              - Mengartikulasikan komitmen manajemen risiko
              - Menetapkan akuntabilitas
              - Mengintegrasikan ke dalam proses organisasi
              
              D. IMPLEMENTASI
              - Mengimplementasikan kerangka kerja
              - Mengimplementasikan proses manajemen risiko
              
              E. EVALUASI
              - Mengukur kinerja kerangka kerja
              - Mengevaluasi efektivitas kerangka kerja
              
              F. PENINGKATAN
              - Terus menyesuaikan dan meningkatkan kerangka kerja`
            },
            {
              id: "2.3",
              title: "Proses Manajemen Risiko",
              content: `Proses manajemen risiko terdiri dari:
              
              1. KOMUNIKASI DAN KONSULTASI
              - Komunikasi internal dan eksternal
              - Konsultasi dengan pemangku kepentingan
              - Pelaporan risiko
              
              2. PENETAPAN KONTEKS
              - Konteks eksternal (regulasi, teknologi, ekonomi, sosial)
              - Konteks internal (visi, misi, nilai, budaya, struktur)
              - Konteks proses manajemen risiko
              
              3. ASESMEN RISIKO
              a. Identifikasi Risiko
              b. Analisis Risiko
              c. Evaluasi Risiko
              
              4. PERLAKUAN RISIKO
              - Menghindari risiko
              - Mengambil atau meningkatkan risiko
              - Menghilangkan sumber risiko
              - Mengubah kemungkinan
              - Mengubah konsekuensi
              - Berbagi risiko
              - Mempertahankan risiko
              
              5. MONITORING DAN REVIEW
              - Monitoring berkelanjutan
              - Review berkala
              - Pelaporan kinerja
              
              6. PENCATATAN DAN PELAPORAN
              - Dokumentasi proses
              - Pelaporan kepada pemangku kepentingan
              - Audit dan review`
            }
          ]
        },
        {
          id: 3,
          title: "Integrasi dengan Balanced Scorecard",
          sections: [
            {
              id: "3.1",
              title: "Konsep Balanced Scorecard",
              content: `Balanced Scorecard (BSC) adalah sistem manajemen strategis yang menerjemahkan 
              visi dan strategi organisasi ke dalam tujuan dan ukuran kinerja yang komprehensif. 
              BSC menggunakan empat perspektif:
              
              1. PERSPEKTIF KEUANGAN
              - Pertumbuhan pendapatan
              - Efisiensi biaya
              - Pemanfaatan aset
              - Strategi investasi
              
              2. PERSPEKTIF PELANGGAN
              - Kepuasan pelanggan
              - Retensi pelanggan
              - Akuisisi pelanggan
              - Pangsa pasar
              
              3. PERSPEKTIF PROSES BISNIS INTERNAL
              - Inovasi
              - Operasi
              - Layanan purna jual
              - Regulasi dan sosial
              
              4. PERSPEKTIF PEMBELAJARAN DAN PERTUMBUHAN
              - Kapabilitas karyawan
              - Kapabilitas sistem informasi
              - Motivasi, pemberdayaan, dan keselarasan`
            },
            {
              id: "3.2",
              title: "Integrasi Manajemen Risiko dengan BSC",
              content: `Integrasi manajemen risiko dengan BSC dilakukan melalui:
              
              1. IDENTIFIKASI RISIKO STRATEGIS
              - Risiko yang dapat menghambat pencapaian tujuan strategis
              - Risiko pada setiap perspektif BSC
              - Risiko pada hubungan sebab-akibat strategis
              
              2. PEMETAAN RISIKO KE STRATEGIC MAP
              - Mengidentifikasi risiko pada setiap tujuan strategis
              - Menganalisis dampak risiko terhadap pencapaian strategi
              - Memetakan risiko dalam strategic map
              
              3. PENGEMBANGAN KRI (KEY RISK INDICATORS)
              - KRI yang terkait dengan KPI (Key Performance Indicators)
              - Early warning system untuk risiko strategis
              - Dashboard risiko terintegrasi dengan BSC
              
              4. RISK-ADJUSTED PERFORMANCE MEASUREMENT
              - Penyesuaian target dengan tingkat risiko
              - Balanced risk-return dalam pengukuran kinerja
              - Insentif yang mempertimbangkan risiko`
            }
          ]
        },
        {
          id: 4,
          title: "Proses Bisnis Sistem Manajemen Risiko",
          sections: [
            {
              id: "4.1",
              title: "Alur Proses Utama",
              content: `Proses bisnis sistem manajemen risiko terdiri dari:
              
              1. PERENCANAAN STRATEGIS
              - Penetapan visi, misi, dan nilai
              - Analisis SWOT
              - Penyusunan rencana strategis
              - Pengembangan strategic map
              - Penetapan KPI
              
              2. IDENTIFIKASI DAN ASESMEN RISIKO
              - Identifikasi risiko strategis dan operasional
              - Analisis probabilitas dan dampak
              - Penilaian risiko inheren
              - Evaluasi kontrol yang ada
              - Penilaian risiko residual
              
              3. PERLAKUAN RISIKO
              - Penetapan strategi perlakuan risiko
              - Pengembangan rencana mitigasi
              - Implementasi kontrol risiko
              - Monitoring efektivitas kontrol
              
              4. MONITORING DAN PELAPORAN
              - Monitoring KRI dan KPI
              - Early warning system
              - Pelaporan risiko berkala
              - Dashboard manajemen risiko
              
              5. REVIEW DAN PENINGKATAN
              - Review berkala efektivitas manajemen risiko
              - Penyesuaian strategi dan kontrol
              - Pembelajaran dari insiden
              - Peningkatan berkelanjutan`
            },
            {
              id: "4.2",
              title: "Peran dan Tanggung Jawab",
              content: `Struktur organisasi manajemen risiko:
              
              1. DEWAN KOMISARIS/PENGAWAS
              - Oversight manajemen risiko
              - Persetujuan risk appetite dan tolerance
              - Review kinerja manajemen risiko
              
              2. KOMITE RISIKO
              - Pengembangan kebijakan risiko
              - Review dan persetujuan strategi risiko
              - Monitoring implementasi manajemen risiko
              
              3. MANAJEMEN PUNCAK
              - Komitmen dan kepemimpinan
              - Alokasi sumber daya
              - Penetapan budaya risiko
              
              4. RISK MANAGEMENT OFFICE (RMO)
              - Koordinasi aktivitas manajemen risiko
              - Pengembangan metodologi dan tools
              - Pelatihan dan sosialisasi
              - Pelaporan risiko
              
              5. RISK OWNER
              - Identifikasi dan asesmen risiko
              - Implementasi perlakuan risiko
              - Monitoring dan pelaporan risiko
              
              6. SELURUH KARYAWAN
              - Awareness terhadap risiko
              - Implementasi kontrol risiko
              - Pelaporan insiden dan near miss`
            }
          ]
        },
        {
          id: 5,
          title: "Implementasi Sistem Informasi",
          sections: [
            {
              id: "5.1",
              title: "Arsitektur Sistem",
              content: `Sistem informasi manajemen risiko terdiri dari:
              
              1. MODUL PERENCANAAN STRATEGIS
              - Manajemen visi, misi, dan nilai
              - Analisis SWOT dan diagram Kartesius
              - Matriks TOWS
              - Strategic mapping
              - KPI management
              
              2. MODUL MANAJEMEN RISIKO
              - Risk register
              - Risk assessment
              - Risk treatment planning
              - Risk monitoring
              - Incident management
              
              3. MODUL PELAPORAN DAN DASHBOARD
              - Executive dashboard
              - Risk dashboard
              - Performance dashboard
              - Custom reports
              - Alert system
              
              4. MODUL ADMINISTRASI
              - User management
              - Organization structure
              - Master data
              - System configuration
              - Audit trail`
            },
            {
              id: "5.2",
              title: "Fitur Utama Aplikasi",
              content: `Aplikasi PINTAR MR (Manajemen Risiko Terpadu) memiliki fitur:
              
              1. DASHBOARD TERINTEGRASI
              - Real-time risk indicators
              - Performance metrics
              - Alert notifications
              - Trend analysis
              
              2. RISK REGISTER DIGITAL
              - Centralized risk database
              - Risk categorization
              - Risk scoring automation
              - Risk treatment tracking
              
              3. WORKFLOW MANAGEMENT
              - Approval workflow
              - Task assignment
              - Progress tracking
              - Notification system
              
              4. REPORTING ENGINE
              - Standard reports
              - Custom reports
              - Export capabilities
              - Scheduled reports
              
              5. MOBILE ACCESS
              - Mobile-responsive design
              - Offline capabilities
              - Push notifications
              - Mobile reporting`
            }
          ]
        },
        {
          id: 6,
          title: "Panduan Operasional",
          sections: [
            {
              id: "6.1",
              title: "Langkah-Langkah Implementasi",
              content: `Tahapan implementasi sistem manajemen risiko:
              
              FASE 1: PERSIAPAN (Bulan 1-2)
              1. Pembentukan tim implementasi
              2. Sosialisasi dan pelatihan awal
              3. Penyusunan kebijakan dan prosedur
              4. Setup sistem informasi
              
              FASE 2: PILOT PROJECT (Bulan 3-4)
              1. Implementasi di unit pilot
              2. Identifikasi dan asesmen risiko
              3. Pengembangan risk register
              4. Testing sistem dan proses
              
              FASE 3: ROLLOUT (Bulan 5-8)
              1. Implementasi di seluruh organisasi
              2. Pelatihan pengguna
              3. Monitoring dan support
              4. Fine-tuning sistem dan proses
              
              FASE 4: STABILISASI (Bulan 9-12)
              1. Monitoring dan evaluasi
              2. Penyempurnaan proses
              3. Peningkatan kapabilitas
              4. Persiapan sertifikasi`
            },
            {
              id: "6.2",
              title: "Best Practices",
              content: `Praktik terbaik dalam implementasi:
              
              1. KEPEMIMPINAN
              - Komitmen manajemen puncak
              - Komunikasi yang jelas dan konsisten
              - Alokasi sumber daya yang memadai
              - Role modeling dari leadership
              
              2. BUDAYA RISIKO
              - Risk awareness di semua level
              - Open communication tentang risiko
              - Learning from failure
              - Reward system yang mendukung
              
              3. PROSES
              - Integrasi dengan proses bisnis existing
              - Simplicity dan user-friendly
              - Continuous improvement
              - Regular review dan update
              
              4. TEKNOLOGI
              - User-friendly interface
              - Integration capabilities
              - Scalability dan flexibility
              - Security dan data protection
              
              5. PEOPLE
              - Competency development
              - Clear roles dan responsibilities
              - Regular training dan development
              - Performance measurement`
            }
          ]
        },
        {
          id: 7,
          title: "Template dan Tools",
          sections: [
            {
              id: "7.1",
              title: "Template Dokumen",
              content: `Template yang tersedia dalam sistem:
              
              1. RISK REGISTER TEMPLATE
              - Format standar risk register
              - Risk assessment matrix
              - Risk treatment plan
              - Monitoring template
              
              2. POLICY TEMPLATE
              - Risk management policy
              - Risk appetite statement
              - Roles dan responsibilities
              - Governance structure
              
              3. PROCEDURE TEMPLATE
              - Risk identification procedure
              - Risk assessment procedure
              - Risk treatment procedure
              - Monitoring dan reporting procedure
              
              4. REPORTING TEMPLATE
              - Executive risk report
              - Operational risk report
              - Incident report
              - Risk dashboard template`
            },
            {
              id: "7.2",
              title: "Tools dan Metodologi",
              content: `Tools yang terintegrasi dalam sistem:
              
              1. RISK ASSESSMENT TOOLS
              - Probability-Impact matrix
              - Risk scoring calculator
              - Heat map generator
              - Scenario analysis tool
              
              2. ANALYSIS TOOLS
              - SWOT analysis
              - Root cause analysis
              - Bow-tie analysis
              - Monte Carlo simulation
              
              3. MONITORING TOOLS
              - KRI dashboard
              - Alert system
              - Trend analysis
              - Performance metrics
              
              4. REPORTING TOOLS
              - Report generator
              - Data visualization
              - Export utilities
              - Distribution system`
            }
          ]
        },
        {
          id: 8,
          title: "Kesimpulan dan Rekomendasi",
          sections: [
            {
              id: "8.1",
              title: "Kesimpulan",
              content: `Implementasi sistem manajemen risiko berdasarkan ISO 31000:2018 yang terintegrasi 
              dengan Balanced Scorecard memberikan manfaat signifikan bagi organisasi dalam:
              
              1. Meningkatkan kemampuan pencapaian tujuan strategis
              2. Memberikan confidence kepada stakeholders
              3. Meningkatkan efektivitas dan efisiensi operasional
              4. Memperkuat tata kelola organisasi
              5. Membangun budaya risk-aware
              
              Sistem PINTAR MR menyediakan platform terintegrasi yang mendukung implementasi 
              manajemen risiko secara komprehensif dan user-friendly.`
            },
            {
              id: "8.2",
              title: "Rekomendasi",
              content: `Untuk memastikan keberhasilan implementasi, direkomendasikan:
              
              1. KOMITMEN LEADERSHIP
              - Dukungan penuh dari manajemen puncak
              - Alokasi sumber daya yang memadai
              - Komunikasi yang konsisten
              
              2. PENDEKATAN BERTAHAP
              - Implementasi secara bertahap
              - Pilot project sebelum rollout
              - Continuous improvement
              
              3. CAPACITY BUILDING
              - Pelatihan berkelanjutan
              - Pengembangan kompetensi
              - Knowledge sharing
              
              4. MONITORING DAN EVALUASI
              - Regular review dan assessment
              - Performance measurement
              - Feedback dan improvement
              
              5. SUSTAINABILITY
              - Integrasi dengan proses bisnis
              - Budaya organisasi yang mendukung
              - Continuous innovation`
            }
          ]
        }
      ],
      flowchart: {
        title: "Flowchart Proses Bisnis Sistem Manajemen Risiko",
        description: "Diagram alur proses bisnis manajemen risiko terintegrasi",
        processes: [
          {
            id: "start",
            type: "start",
            label: "Mulai",
            x: 50,
            y: 50
          },
          {
            id: "strategic_planning",
            type: "process",
            label: "Perencanaan Strategis\n(Visi, Misi, SWOT, Strategic Map)",
            x: 50,
            y: 150
          },
          {
            id: "risk_identification",
            type: "process", 
            label: "Identifikasi Risiko\n(Risk Register, Kategorisasi)",
            x: 50,
            y: 250
          },
          {
            id: "risk_assessment",
            type: "process",
            label: "Asesmen Risiko\n(Probabilitas, Dampak, Risk Rating)",
            x: 50,
            y: 350
          },
          {
            id: "risk_evaluation",
            type: "decision",
            label: "Evaluasi Risiko\nAcceptable?",
            x: 50,
            y: 450
          },
          {
            id: "risk_treatment",
            type: "process",
            label: "Perlakuan Risiko\n(Mitigasi, Transfer, Accept, Avoid)",
            x: 200,
            y: 450
          },
          {
            id: "implementation",
            type: "process",
            label: "Implementasi\nKontrol Risiko",
            x: 200,
            y: 350
          },
          {
            id: "monitoring",
            type: "process",
            label: "Monitoring & Review\n(KRI, Dashboard, Reporting)",
            x: 200,
            y: 250
          },
          {
            id: "communication",
            type: "process",
            label: "Komunikasi & Konsultasi\n(Stakeholder Engagement)",
            x: 350,
            y: 300
          },
          {
            id: "improvement",
            type: "process",
            label: "Peningkatan Berkelanjutan\n(Lessons Learned, Update)",
            x: 50,
            y: 550
          },
          {
            id: "end",
            type: "end",
            label: "Selesai",
            x: 50,
            y: 650
          }
        ],
        connections: [
          { from: "start", to: "strategic_planning" },
          { from: "strategic_planning", to: "risk_identification" },
          { from: "risk_identification", to: "risk_assessment" },
          { from: "risk_assessment", to: "risk_evaluation" },
          { from: "risk_evaluation", to: "risk_treatment", label: "Tidak" },
          { from: "risk_evaluation", to: "improvement", label: "Ya" },
          { from: "risk_treatment", to: "implementation" },
          { from: "implementation", to: "monitoring" },
          { from: "monitoring", to: "risk_identification", label: "Feedback Loop" },
          { from: "communication", to: "strategic_planning", label: "Input" },
          { from: "communication", to: "risk_identification", label: "Input" },
          { from: "communication", to: "monitoring", label: "Output" },
          { from: "improvement", to: "end" }
        ]
      }
    };

    res.json(handbookContent);
  } catch (error) {
    console.error('Error fetching handbook content:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate PDF report
router.get('/pdf', authenticateUser, async (req, res) => {
  try {
    // This would integrate with PDF generation service
    // For now, return success response
    res.json({ 
      success: true, 
      message: 'PDF generation initiated',
      downloadUrl: '/api/buku-pedoman/download-pdf'
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;