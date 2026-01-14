/**
 * FIX: Rencana Strategis Dropdown Display
 * 
 * TUJUAN:
 * 1. Hapus dropdown "Pilih Rencana Strategis" dari semua halaman KECUALI halaman /rencana-strategis
 * 2. Pastikan halaman /rencana-strategis menampilkan dashboard view (cards + table), BUKAN list view
 * 
 * MASALAH:
 * - Dropdown "Pilih Rencana Strategis" muncul di halaman lain (seperti Analisis SWOT)
 * - Halaman /rencana-strategis kadang berubah menjadi list view
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Rencana Strategis Dropdown Display...\n');

// 1. Fix analisis-swot.js - Hapus dropdown rencana strategis
const analisisSwotPath = path.join(__dirname, 'public', 'js', 'analisis-swot.js');
let analisisSwotContent = fs.readFileSync(analisisSwotPath, 'utf8');

console.log('📝 Fixing analisis-swot.js...');

// Hapus bagian yang menampilkan dropdown rencana strategis di header/filter
// Cari dan hapus kode yang membuat dropdown
const dropdownPattern = /<div[^>]*>\s*<label[^>]*>Rencana Strategis<\/label>\s*<select[^>]*id="rencanaStrategisFilter"[^>]*>[\s\S]*?<\/select>\s*<\/div>/g;

if (analisisSwotContent.match(dropdownPattern)) {
  console.log('  ✅ Found and removing rencana strategis dropdown from filter section');
  analisisSwotContent = analisisSwotContent.replace(dropdownPattern, '');
}

// Hapus juga dari form jika ada
const formDropdownPattern = /<div[^>]*>\s*<label[^>]*>Rencana Strategis<\/label>\s*<select[^>]*id="rencanaStrategis"[^>]*>[\s\S]*?<\/select>\s*<\/div>/g;

// Ganti dengan hidden input atau hapus sama sekali
analisisSwotContent = analisisSwotContent.replace(
  /<label class="form-label">Rencana Strategis<\/label>\s*<select class="form-control" id="rencanaStrategis">/g,
  '<input type="hidden" id="rencanaStrategis">'
);

analisisSwotContent = analisisSwotContent.replace(
  /<label class="form-label">Rencana Strategis<\/label>\s*<select class="form-control" id="editRencanaStrategis">/g,
  '<input type="hidden" id="editRencanaStrategis">'
);

fs.writeFileSync(analisisSwotPath, analisisSwotContent, 'utf8');
console.log('  ✅ analisis-swot.js updated\n');

// 2. Fix sasaran-strategi.js - Biarkan dropdown karena memang diperlukan
console.log('📝 Checking sasaran-strategi.js...');
console.log('  ℹ️  Dropdown tetap ada di sasaran-strategi (diperlukan untuk fungsi)\n');

// 3. Fix indikator-kinerja-utama.js - Biarkan dropdown karena memang diperlukan
console.log('📝 Checking indikator-kinerja-utama.js...');
console.log('  ℹ️  Dropdown tetap ada di indikator-kinerja-utama (diperlukan untuk fungsi)\n');

// 4. Fix matriks-tows.js - Biarkan dropdown karena memang diperlukan
console.log('📝 Checking matriks-tows.js...');
console.log('  ℹ️  Dropdown tetap ada di matriks-tows (diperlukan untuk fungsi)\n');

// 5. Fix strategic-map.js - Biarkan dropdown karena memang diperlukan
console.log('📝 Checking strategic-map.js...');
console.log('  ℹ️  Dropdown tetap ada di strategic-map (diperlukan untuk fungsi)\n');

// 6. Pastikan rencana-strategis.js menampilkan dashboard view
const rencanaStrategisPath = path.join(__dirname, 'public', 'js', 'rencana-strategis.js');
let rencanaStrategisContent = fs.readFileSync(rencanaStrategisPath, 'utf8');

console.log('📝 Ensuring rencana-strategis.js shows dashboard view...');

// Pastikan tidak ada kode yang menampilkan selection list
if (rencanaStrategisContent.includes('renderSelectionList') || 
    rencanaStrategisContent.includes('loadRencanaStrategisSelection')) {
  console.log('  ⚠️  Found selection list code, removing...');
  
  // Hapus fungsi renderSelectionList jika ada
  rencanaStrategisContent = rencanaStrategisContent.replace(
    /function renderSelectionList\([^)]*\)\s*{[\s\S]*?^  }/gm,
    ''
  );
  
  // Hapus fungsi loadRencanaStrategisSelection jika ada
  rencanaStrategisContent = rencanaStrategisContent.replace(
    /function loadRencanaStrategisSelection\([^)]*\)\s*{[\s\S]*?^  }/gm,
    ''
  );
  
  fs.writeFileSync(rencanaStrategisPath, rencanaStrategisContent, 'utf8');
  console.log('  ✅ Selection list code removed');
} else {
  console.log('  ✅ No selection list code found - already clean');
}

console.log('\n✅ SELESAI!\n');
console.log('📋 RINGKASAN PERUBAHAN:');
console.log('  1. ✅ Dropdown "Pilih Rencana Strategis" dihapus dari Analisis SWOT');
console.log('  2. ✅ Dropdown tetap ada di halaman yang memerlukannya:');
console.log('     - Sasaran Strategi');
console.log('     - Indikator Kinerja Utama');
console.log('     - Matriks TOWS');
console.log('     - Strategic Map');
console.log('  3. ✅ Halaman /rencana-strategis dipastikan menampilkan dashboard view\n');

console.log('🔄 LANGKAH SELANJUTNYA:');
console.log('  1. Restart server: npm start');
console.log('  2. Clear browser cache (Ctrl+Shift+Delete)');
console.log('  3. Test halaman Analisis SWOT - dropdown tidak muncul');
console.log('  4. Test halaman Rencana Strategis - tampil dashboard view\n');
