const express = require('express');
const path = require('path');

// Test server untuk memverifikasi perbaikan rencana strategis
const app = express();
const PORT = 3002;

// Serve static files
app.use(express.static('public'));

// Mock data untuk testing
const mockRencanaStrategis = [
  {
    id: "04b00510-6b9a-43e8-846a-d690f83a6003",
    kode: "RS-2025-001",
    nama_rencana: "Peningkatan Sistem Keselamatan Pasien Terintegrasi",
    deskripsi: "Mengembangkan dan mengimplementasikan sistem keselamatan pasien yang komprehensif dan terintegrasi untuk mengurangi risiko insiden keselamatan pasien dan meningkatkan kualitas pelayanan kesehatan.",
    periode_mulai: "2025-01-01",
    periode_selesai: "2025-12-31",
    target: "Menurunkan angka insiden keselamatan pasien sebesar 50% dan mencapai akreditasi keselamatan pasien tingkat internasional",
    indikator_kinerja: "Jumlah insiden keselamatan pasien per 1000 hari rawat, tingkat kepuasan pasien, skor akreditasi keselamatan pasien",
    status: "Aktif",
    sasaran_strategis: [
      "Implementasi sistem pelaporan insiden keselamatan pasien elektronik",
      "Pelatihan berkelanjutan untuk seluruh staf medis dan non-medis",
      "Pengembangan protokol keselamatan pasien berbasis evidence-based practice"
    ],
    indikator_kinerja_utama: [
      "Angka insiden keselamatan pasien ≤ 2 per 1000 hari rawat",
      "Tingkat kepatuhan terhadap protokol keselamatan pasien ≥ 95%",
      "Skor kepuasan pasien terhadap keselamatan pelayanan ≥ 4.5/5.0"
    ]
  },
  {
    id: "d46e9c2b-afaf-413b-a688-65d5e0a40b98",
    kode: "RS-2025-002",
    nama_rencana: "Sistem Manajemen Keuangan Rumah Sakit Terintegrasi",
    deskripsi: "Mengembangkan sistem manajemen keuangan dan aset yang terintegrasi untuk meningkatkan efisiensi penggunaan sumber daya, transparansi keuangan, dan sustainability rumah sakit.",
    periode_mulai: "2025-01-01",
    periode_selesai: "2025-12-31",
    target: "Mencapai efisiensi operasional 20% dan meningkatkan revenue growth sebesar 15% dengan tetap mempertahankan kualitas pelayanan",
    indikator_kinerja: "Rasio efisiensi operasional, tingkat pertumbuhan pendapatan, return on investment (ROI)",
    status: "Aktif",
    sasaran_strategis: [
      "Implementasi sistem Enterprise Resource Planning (ERP) terintegrasi",
      "Pengembangan sistem cost accounting dan activity-based costing",
      "Optimalisasi manajemen supply chain dan inventory management"
    ],
    indikator_kinerja_utama: [
      "Rasio efisiensi operasional meningkat 20%",
      "Tingkat pertumbuhan pendapatan 15%",
      "Return on Investment (ROI) ≥ 12%"
    ]
  },
  {
    id: "789308c7-7d0d-4c1e-8c65-3615568c683c",
    kode: "RS-2025-003",
    nama_rencana: "Implementasi Sistem Tata Kelola Rumah Sakit Berbasis Manajemen Resiko",
    deskripsi: "Mengembangkan dan mengimplementasikan sistem tata kelola rumah sakit yang menerapkan prinsip-prinsip good corporate governance untuk meningkatkan akuntabilitas, transparansi, dan efektivitas organisasi.",
    periode_mulai: "2025-01-01",
    periode_selesai: "2025-12-31",
    target: "Mencapai skor tata kelola organisasi ≥ 85% berdasarkan standar nasional dan memperoleh sertifikasi ISO 9001:2015",
    indikator_kinerja: "Skor assessment tata kelola, tingkat kepatuhan terhadap regulasi, indeks transparansi organisasi",
    status: "Draft",
    sasaran_strategis: [
      "Pengembangan sistem manajemen risiko terintegrasi",
      "Implementasi sistem audit internal dan eksternal berkelanjutan",
      "Penguatan sistem pelaporan dan transparansi keuangan"
    ],
    indikator_kinerja_utama: [
      "Skor tata kelola organisasi ≥ 85%",
      "Tingkat kepatuhan regulasi 100%",
      "Indeks transparansi organisasi ≥ 4.0/5.0"
    ]
  }
];

// Mock visi misi data
const mockVisiMisi = [
  {
    id: "93924a76-fc9e-48d6-9fe5-062775b78b85",
    visi: "Menjadi rumah sakit terdepan dalam pelayanan kesehatan berkualitas",
    misi: "1. Memberikan pelayanan kesehatan yang berkualitas dan terjangkau\n2. Mengembangkan sumber daya manusia yang kompeten\n3. Menerapkan teknologi kesehatan terkini"
  }
];

// API endpoints
app.get('/api/rencana-strategis/public', (req, res) => {
  console.log('📋 Rencana Strategis Public API called');
  res.json(mockRencanaStrategis);
});

app.get('/api/rencana-strategis', (req, res) => {
  console.log('📋 Rencana Strategis API called');
  res.json(mockRencanaStrategis);
});

app.get('/api/visi-misi/public', (req, res) => {
  console.log('🎯 Visi Misi Public API called');
  res.json(mockVisiMisi);
});

app.get('/api/visi-misi', (req, res) => {
  console.log('🎯 Visi Misi API called');
  res.json(mockVisiMisi);
});

app.get('/api/rencana-strategis/generate/kode/public', (req, res) => {
  const year = new Date().getFullYear();
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const kode = `RS-${year}-${random}`;
  console.log('🔢 Generated kode:', kode);
  res.json({ kode });
});

// Serve test page
app.get('/test-enhanced', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-rencana-strategis-enhanced.html'));
});

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📋 Test enhanced table: http://localhost:${PORT}/test-enhanced`);
  console.log(`🏠 Main app: http://localhost:${PORT}`);
  console.log('');
  console.log('=== TESTING INSTRUCTIONS ===');
  console.log('1. Open http://localhost:3002/test-enhanced to see the enhanced table');
  console.log('2. Check that:');
  console.log('   - Table displays without overflow issues');
  console.log('   - Status badges stay within their columns');
  console.log('   - Text is readable and not cut off');
  console.log('   - Horizontal scroll works smoothly');
  console.log('   - Responsive design works on different screen sizes');
  console.log('3. Test the main app at http://localhost:3002');
  console.log('4. Navigate to Rencana Strategis page and verify the fixes');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down...');
  process.exit(0);
});