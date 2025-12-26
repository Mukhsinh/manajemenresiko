// Test untuk memverifikasi perbaikan
const fs = require('fs');

console.log('=== VERIFIKASI PERBAIKAN ===');

// Check if the fix is applied
const analisisSwotContent = fs.readFileSync('public/js/analisis-swot.js', 'utf8');

// Check if the problematic line is fixed
const hasProblematicLine = analisisSwotContent.includes('state.unitKerjaList = unitKerjaData || [];');
const hasFixedLine = analisisSwotContent.includes('const unitKerjaData = await api()(\'/api/master-data/work-units\');');

console.log('1. Analisis SWOT Fix:');
console.log(`   - Problematic line removed: ${!hasProblematicLine ? '✓' : '✗'}`);
console.log(`   - Fixed line added: ${hasFixedLine ? '✓' : '✗'}`);

// Check if modules are properly exported
const modules = [
    { file: 'public/js/analisis-swot.js', export: 'window.analisisSwotModule' },
    { file: 'public/js/sasaran-strategi.js', export: 'window.sasaranStrategiModule' },
    { file: 'public/js/indikator-kinerja-utama.js', export: 'window.indikatorKinerjaUtamaModule' }
];

console.log('\n2. Module Exports:');
modules.forEach(({ file, export: exportName }) => {
    const content = fs.readFileSync(file, 'utf8');
    const hasExport = content.includes(exportName);
    console.log(`   - ${file}: ${hasExport ? '✓' : '✗'}`);
});

// Check if loadPageData has correct module calls
const appContent = fs.readFileSync('public/js/app.js', 'utf8');

console.log('\n3. LoadPageData Module Calls:');
const moduleChecks = [
    { case: 'analisis-swot', call: 'window.analisisSwotModule?.load?.()' },
    { case: 'sasaran-strategi', call: 'window.sasaranStrategiModule?.load?.()' },
    { case: 'indikator-kinerja-utama', call: 'window.indikatorKinerjaUtamaModule?.load?.()' }
];

moduleChecks.forEach(({ case: caseName, call }) => {
    const hasCase = appContent.includes(`case '${caseName}':`);
    const hasCall = appContent.includes(call);
    console.log(`   - ${caseName}: case ${hasCase ? '✓' : '✗'}, call ${hasCall ? '✓' : '✗'}`);
});

console.log('\n=== REKOMENDASI ===');
console.log('1. Restart server untuk memastikan perubahan diterapkan');
console.log('2. Clear browser cache dan refresh halaman');
console.log('3. Buka browser developer tools untuk melihat error JavaScript');
console.log('4. Test halaman /analisis-swot, /sasaran-strategi, /indikator-kinerja-utama');

console.log('\n=== LANGKAH SELANJUTNYA ===');
console.log('1. Akses http://localhost:3002/test-modules-debug.html untuk test detail');
console.log('2. Jika masih bermasalah, periksa console browser untuk error');
console.log('3. Pastikan API endpoints dapat diakses dengan authentication yang benar');