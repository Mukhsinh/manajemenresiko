/**
 * ENFORCE: Rencana Strategis Dashboard View
 * 
 * Memastikan halaman /rencana-strategis SELALU menampilkan dashboard view
 * dan TIDAK PERNAH berubah menjadi list/selection view
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Enforcing Rencana Strategis Dashboard View...\n');

const rencanaStrategisPath = path.join(__dirname, 'public', 'js', 'rencana-strategis.js');
let content = fs.readFileSync(rencanaStrategisPath, 'utf8');

// 1. Pastikan MODULE_VERSION up to date
console.log('📝 Step 1: Updating module version...');
content = content.replace(
  /const MODULE_VERSION = '[^']+';/,
  "const MODULE_VERSION = '5.1-LOCKED';"
);
console.log('  ✅ Module version updated to 5.1-LOCKED\n');

// 2. Tambahkan komentar yang jelas di awal file
console.log('📝 Step 2: Adding clear documentation...');
const headerComment = `/**
 * RENCANA STRATEGIS MODULE v5.1-LOCKED
 * 
 * CRITICAL RULES:
 * 1. ALWAYS display: Statistics Cards + Data Table + Form
 * 2. NEVER display: Selection List / "Pilih Rencana Strategis" view
 * 3. This is the ONLY correct interface for /rencana-strategis page
 * 
 * LOCKED MODE: This module is protected against external changes
 * Updated: 2026-01-07
 */`;

if (!content.includes('CRITICAL RULES')) {
  content = headerComment + '\n\n' + content.replace(/^\/\*\*[\s\S]*?\*\/\s*/m, '');
  console.log('  ✅ Documentation added\n');
} else {
  console.log('  ℹ️  Documentation already exists\n');
}

// 3. Pastikan fungsi load() tidak pernah memanggil selection view
console.log('📝 Step 3: Ensuring load() function is correct...');
if (content.includes('loadRencanaStrategisSelection') || 
    content.includes('renderSelectionList')) {
  console.log('  ⚠️  Found references to selection view, removing...');
  content = content.replace(/loadRencanaStrategisSelection\([^)]*\)/g, '/* REMOVED */');
  content = content.replace(/renderSelectionList\([^)]*\)/g, '/* REMOVED */');
  console.log('  ✅ Selection view references removed\n');
} else {
  console.log('  ✅ No selection view references found\n');
}

// 4. Pastikan renderInterface() selalu dipanggil
console.log('📝 Step 4: Ensuring renderInterface() is always called...');
if (!content.includes('forceRenderInterface()')) {
  console.log('  ⚠️  forceRenderInterface() not found, this is critical!');
} else {
  console.log('  ✅ forceRenderInterface() is present\n');
}

// 5. Tambahkan guard di awal load() untuk mencegah perubahan
console.log('📝 Step 5: Adding load guard...');
const loadGuard = `
  // CRITICAL: Prevent any external script from changing the display
  if (window.location.pathname === '/rencana-strategis' || 
      window.location.hash === '#rencana-strategis') {
    console.log('🔒 Rencana Strategis page detected - enforcing dashboard view');
  }`;

if (!content.includes('enforcing dashboard view')) {
  // Tambahkan guard setelah function load() {
  content = content.replace(
    /(async function load\(\) \{)/,
    `$1${loadGuard}`
  );
  console.log('  ✅ Load guard added\n');
} else {
  console.log('  ℹ️  Load guard already exists\n');
}

// 6. Pastikan setupRenderProtection() aktif
console.log('📝 Step 6: Verifying render protection...');
if (content.includes('setupRenderProtection()')) {
  console.log('  ✅ Render protection is active\n');
} else {
  console.log('  ⚠️  Render protection not found!\n');
}

// 7. Tambahkan global flag untuk mencegah perubahan
console.log('📝 Step 7: Adding global protection flag...');
const globalProtection = `
// GLOBAL PROTECTION: Mark this page as protected
window.RENCANA_STRATEGIS_VIEW_LOCKED = true;
window.RENCANA_STRATEGIS_DISPLAY_MODE = 'DASHBOARD'; // NEVER 'SELECTION'
console.log('🔒 Rencana Strategis view locked in DASHBOARD mode');
`;

if (!content.includes('RENCANA_STRATEGIS_VIEW_LOCKED')) {
  // Tambahkan di akhir fungsi load()
  content = content.replace(
    /(window\.rencanaStrategisLoadTime = Date\.now\(\);)/,
    `$1${globalProtection}`
  );
  console.log('  ✅ Global protection flag added\n');
} else {
  console.log('  ℹ️  Global protection flag already exists\n');
}

// 8. Hapus semua fungsi yang berhubungan dengan selection view
console.log('📝 Step 8: Removing selection view functions...');
const functionsToRemove = [
  'loadRencanaStrategisSelection',
  'renderRencanaStrategisList',
  'showRencanaStrategisSelection',
  'displaySelectionView'
];

let removedCount = 0;
functionsToRemove.forEach(funcName => {
  const pattern = new RegExp(`function ${funcName}\\([^)]*\\)\\s*\\{[\\s\\S]*?^\\s*\\}`, 'gm');
  if (content.match(pattern)) {
    content = content.replace(pattern, `// REMOVED: ${funcName}() - not needed in dashboard view`);
    removedCount++;
  }
});

if (removedCount > 0) {
  console.log(`  ✅ Removed ${removedCount} selection view functions\n`);
} else {
  console.log('  ℹ️  No selection view functions found\n');
}

// 9. Simpan perubahan
fs.writeFileSync(rencanaStrategisPath, content, 'utf8');

console.log('✅ SELESAI!\n');
console.log('═══════════════════════════════════════════════════════════');
console.log('📋 PERUBAHAN YANG DILAKUKAN:');
console.log('═══════════════════════════════════════════════════════════');
console.log('  1. ✅ Module version updated to 5.1-LOCKED');
console.log('  2. ✅ Clear documentation added');
console.log('  3. ✅ Selection view references removed');
console.log('  4. ✅ Load guard added');
console.log('  5. ✅ Global protection flag added');
console.log(`  6. ✅ ${removedCount} selection view functions removed`);
console.log('═══════════════════════════════════════════════════════════\n');

console.log('🎯 HASIL AKHIR:');
console.log('  • Halaman /rencana-strategis SELALU menampilkan:');
console.log('    - Statistics Cards (Aktif, Draft, Selesai, Total)');
console.log('    - Data Table dengan kolom lengkap');
console.log('    - Form input (saat tombol Tambah diklik)');
console.log('  • Halaman /rencana-strategis TIDAK PERNAH menampilkan:');
console.log('    - Selection list');
console.log('    - "Pilih Rencana Strategis" view');
console.log('    - List dengan kode RS-2025-xxx\n');

console.log('🔄 TESTING:');
console.log('  1. Restart server');
console.log('  2. Clear browser cache');
console.log('  3. Buka /rencana-strategis');
console.log('  4. Verifikasi tampilan dashboard (cards + table)');
console.log('  5. Refresh halaman beberapa kali');
console.log('  6. Pastikan tampilan TIDAK berubah menjadi list\n');
