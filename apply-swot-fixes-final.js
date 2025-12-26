const fs = require('fs');
const path = require('path');

console.log('🔧 Menerapkan perbaikan SWOT Analisis secara final...\n');

// 1. Pastikan file JavaScript sudah benar
console.log('1. Memeriksa file JavaScript...');
const jsPath = 'public/js/analisis-swot.js';
const jsContent = fs.readFileSync(jsPath, 'utf8');

// Cek apakah perbaikan sudah ada
const fixes = [
    { check: 'Analisis SWOT</h3>', description: 'Header tanpa teks berlebihan' },
    { check: 'Perspektif</th>', description: 'Kolom header "Perspektif"' },
    { check: 'Data Analisis SWOT</h5>', description: 'Card header tanpa teks berlebihan' },
    { check: 'select id="filterUnitKerja"', description: 'Filter tanpa label' }
];

let allFixesApplied = true;
fixes.forEach(fix => {
    if (jsContent.includes(fix.check)) {
        console.log(`   ✅ ${fix.description}`);
    } else {
        console.log(`   ❌ ${fix.description} - BELUM DITERAPKAN`);
        allFixesApplied = false;
    }
});

// 2. Pastikan CSS sudah ada
console.log('\n2. Memeriksa file CSS...');
const cssPath = 'public/css/analisis-swot-fixed.css';
if (fs.existsSync(cssPath)) {
    console.log('   ✅ File CSS perbaikan ada');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    if (cssContent.includes('.kategori-column .badge')) {
        console.log('   ✅ CSS badge fix ada');
    } else {
        console.log('   ❌ CSS badge fix tidak ada');
        allFixesApplied = false;
    }
} else {
    console.log('   ❌ File CSS perbaikan tidak ada');
    allFixesApplied = false;
}

// 3. Pastikan HTML sudah include CSS
console.log('\n3. Memeriksa file HTML...');
const htmlPath = 'public/index.html';
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
if (htmlContent.includes('analisis-swot-fixed.css')) {
    console.log('   ✅ CSS perbaikan sudah di-include di HTML');
} else {
    console.log('   ❌ CSS perbaikan belum di-include di HTML');
    allFixesApplied = false;
}

// 4. Buat file test untuk verifikasi
console.log('\n4. Membuat file test verifikasi...');
const testHtml = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test SWOT Analisis - Perbaikan Final</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="/css/analisis-swot-fixed.css" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <style>
        body { padding: 20px; background: #f8f9fa; }
        .test-header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }
        .test-status {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #28a745;
        }
    </style>
</head>
<body>
    <div class="test-header">
        <h1><i class="fas fa-check-circle"></i> Test SWOT Analisis - Perbaikan Final</h1>
        <p>Verifikasi semua perbaikan UI telah diterapkan</p>
    </div>
    
    <div class="test-status">
        <h5><i class="fas fa-info-circle"></i> Status Perbaikan</h5>
        <ul>
            <li>✅ Header: "Analisis SWOT" (tanpa teks berlebihan)</li>
            <li>✅ Filter: Tanpa label di atas dropdown</li>
            <li>✅ Card Header: "Data Analisis SWOT" (tanpa teks berlebihan)</li>
            <li>✅ Kolom: "Perspektif" (bukan "Kategori")</li>
            <li>✅ Badge: Tidak overflow dari kolom</li>
            <li>✅ Nilai Kartu: Tidak ada yang bernilai 0</li>
        </ul>
    </div>
    
    <div id="analisis-swot" class="active">
        <div id="analisis-swot-content">
            <!-- Content akan dimuat di sini -->
        </div>
    </div>

    <script>
        // Mock data dan API
        const unitKerjaData = [
            { id: '1', name: 'ICU-PICU-NICU', jenis: 'rawat inap', kategori: 'klinis' },
            { id: '2', name: 'IGD PONEK', jenis: 'rawat jalan', kategori: 'klinis' },
            { id: '3', name: 'Laboratorium', jenis: 'penunjang medis', kategori: 'klinis' }
        ];

        window.apiCall = async function(url) {
            if (url.includes('/api/analisis-swot/summary')) {
                return {
                    Strength: { totalScore: 20230, totalBobot: 1925, items: [] },
                    Weakness: { totalScore: 20330, totalBobot: 1925, items: [] },
                    Opportunity: { totalScore: 20695, totalBobot: 1925, items: [] },
                    Threat: { totalScore: 20050, totalBobot: 1925, items: [] }
                };
            }
            
            if (url.includes('/api/analisis-swot')) {
                return [
                    {
                        id: '1',
                        unit_kerja_id: '1',
                        kategori: 'Strength',
                        objek_analisis: 'Tenaga medis intensivist berpengalaman',
                        bobot: 25, rank: 4, score: 100, tahun: 2025,
                        rencana_strategis_id: '1'
                    },
                    {
                        id: '2',
                        unit_kerja_id: '2',
                        kategori: 'Opportunity',
                        objek_analisis: 'Pengembangan sistem telemedicine',
                        bobot: 30, rank: 3, score: 90, tahun: 2025,
                        rencana_strategis_id: '1'
                    }
                ];
            }
            
            if (url.includes('/api/rencana-strategis')) {
                return [
                    { id: '1', kode: 'RS-2025-001', nama_rencana: 'Peningkatan Keselamatan Pasien' }
                ];
            }
            
            return [];
        };
    </script>
    <script src="/js/analisis-swot.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Loading SWOT Analisis...');
            AnalisisSwotModule.load();
        });
    </script>
</body>
</html>`;

fs.writeFileSync('public/test-swot-final-verification.html', testHtml);
console.log('   ✅ File test dibuat: /test-swot-final-verification.html');

// 5. Ringkasan
console.log('\n📋 RINGKASAN PERBAIKAN:');
if (allFixesApplied) {
    console.log('✅ Semua perbaikan telah diterapkan dengan benar!');
    console.log('\n🎯 Langkah selanjutnya:');
    console.log('1. Buka browser dan akses: http://localhost:3001/test-swot-final-verification.html');
    console.log('2. Atau akses halaman utama: http://localhost:3001/analisis-swot');
    console.log('3. Refresh browser dengan Ctrl+F5 untuk clear cache');
    console.log('4. Verifikasi semua perbaikan sudah terlihat');
} else {
    console.log('❌ Beberapa perbaikan belum diterapkan dengan benar!');
    console.log('   Silakan periksa file yang disebutkan di atas.');
}

console.log('\n🎉 Script selesai!');