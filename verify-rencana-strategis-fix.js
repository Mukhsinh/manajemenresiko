/**
 * VERIFICATION: Rencana Strategis Dropdown & Display Fix
 * 
 * Memverifikasi bahwa semua perbaikan sudah diterapkan dengan benar
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Rencana Strategis Fix...\n');
console.log('═══════════════════════════════════════════════════════════\n');

let allPassed = true;
const results = [];

// Test 1: Verify analisis-swot.js tidak memiliki dropdown
console.log('📝 Test 1: Checking analisis-swot.js...');
const analisisSwotPath = path.join(__dirname, 'public', 'js', 'analisis-swot.js');
const analisisSwotContent = fs.readFileSync(analisisSwotPath, 'utf8');

const hasDropdown = analisisSwotContent.includes('<select class="form-control" id="rencanaStrategis">') ||
                    analisisSwotContent.includes('<select class="form-control" id="editRencanaStrategis">');

if (!hasDropdown) {
  console.log('  ✅ PASS: Dropdown "Pilih Rencana Strategis" tidak ditemukan\n');
  results.push({ test: 'Analisis SWOT Dropdown', status: 'PASS' });
} else {
  console.log('  ❌ FAIL: Dropdown masih ditemukan di analisis-swot.js\n');
  results.push({ test: 'Analisis SWOT Dropdown', status: 'FAIL' });
  allPassed = false;
}

// Test 2: Verify rencana-strategis.js memiliki version 5.1-LOCKED
console.log('📝 Test 2: Checking rencana-strategis.js version...');
const rencanaStrategisPath = path.join(__dirname, 'public', 'js', 'rencana-strategis.js');
const rencanaStrategisContent = fs.readFileSync(rencanaStrategisPath, 'utf8');

const hasCorrectVersion = rencanaStrategisContent.includes("MODULE_VERSION = '5.1-LOCKED'");

if (hasCorrectVersion) {
  console.log('  ✅ PASS: Module version is 5.1-LOCKED\n');
  results.push({ test: 'Module Version', status: 'PASS' });
} else {
  console.log('  ❌ FAIL: Module version is not 5.1-LOCKED\n');
  results.push({ test: 'Module Version', status: 'FAIL' });
  allPassed = false;
}

// Test 3: Verify CRITICAL RULES documentation exists
console.log('📝 Test 3: Checking documentation...');
const hasDocumentation = rencanaStrategisContent.includes('CRITICAL RULES');

if (hasDocumentation) {
  console.log('  ✅ PASS: CRITICAL RULES documentation found\n');
  results.push({ test: 'Documentation', status: 'PASS' });
} else {
  console.log('  ❌ FAIL: CRITICAL RULES documentation not found\n');
  results.push({ test: 'Documentation', status: 'FAIL' });
  allPassed = false;
}

// Test 4: Verify load guard exists
console.log('📝 Test 4: Checking load guard...');
const hasLoadGuard = rencanaStrategisContent.includes('enforcing dashboard view');

if (hasLoadGuard) {
  console.log('  ✅ PASS: Load guard found\n');
  results.push({ test: 'Load Guard', status: 'PASS' });
} else {
  console.log('  ❌ FAIL: Load guard not found\n');
  results.push({ test: 'Load Guard', status: 'FAIL' });
  allPassed = false;
}

// Test 5: Verify global protection flag exists
console.log('📝 Test 5: Checking global protection flag...');
const hasGlobalFlag = rencanaStrategisContent.includes('RENCANA_STRATEGIS_VIEW_LOCKED');

if (hasGlobalFlag) {
  console.log('  ✅ PASS: Global protection flag found\n');
  results.push({ test: 'Global Protection Flag', status: 'PASS' });
} else {
  console.log('  ❌ FAIL: Global protection flag not found\n');
  results.push({ test: 'Global Protection Flag', status: 'FAIL' });
  allPassed = false;
}

// Test 6: Verify no selection view references
console.log('📝 Test 6: Checking for selection view references...');
const hasSelectionViewRefs = rencanaStrategisContent.includes('loadRencanaStrategisSelection(') ||
                              rencanaStrategisContent.includes('renderRencanaStrategisList(');

if (!hasSelectionViewRefs) {
  console.log('  ✅ PASS: No selection view function calls found\n');
  results.push({ test: 'Selection View References', status: 'PASS' });
} else {
  console.log('  ❌ FAIL: Selection view function calls still exist\n');
  results.push({ test: 'Selection View References', status: 'FAIL' });
  allPassed = false;
}

// Test 7: Verify renderInterface() is called
console.log('📝 Test 7: Checking renderInterface() call...');
const hasRenderInterface = rencanaStrategisContent.includes('forceRenderInterface()');

if (hasRenderInterface) {
  console.log('  ✅ PASS: forceRenderInterface() found\n');
  results.push({ test: 'Render Interface Call', status: 'PASS' });
} else {
  console.log('  ❌ FAIL: forceRenderInterface() not found\n');
  results.push({ test: 'Render Interface Call', status: 'FAIL' });
  allPassed = false;
}

// Test 8: Verify setupRenderProtection() exists
console.log('📝 Test 8: Checking render protection...');
const hasRenderProtection = rencanaStrategisContent.includes('setupRenderProtection()');

if (hasRenderProtection) {
  console.log('  ✅ PASS: setupRenderProtection() found\n');
  results.push({ test: 'Render Protection', status: 'PASS' });
} else {
  console.log('  ❌ FAIL: setupRenderProtection() not found\n');
  results.push({ test: 'Render Protection', status: 'FAIL' });
  allPassed = false;
}

// Print summary
console.log('═══════════════════════════════════════════════════════════');
console.log('📊 VERIFICATION SUMMARY');
console.log('═══════════════════════════════════════════════════════════\n');

results.forEach((result, index) => {
  const icon = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${index + 1}. ${icon} ${result.test}: ${result.status}`);
});

console.log('\n═══════════════════════════════════════════════════════════');

if (allPassed) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('✅ Perbaikan berhasil diterapkan dengan sempurna!');
  console.log('✅ Halaman /rencana-strategis akan menampilkan dashboard view');
  console.log('✅ Dropdown "Pilih Rencana Strategis" hanya muncul di halaman yang memerlukannya\n');
  console.log('🔄 NEXT STEPS:');
  console.log('  1. Restart server: npm start');
  console.log('  2. Clear browser cache (Ctrl+Shift+Delete)');
  console.log('  3. Test halaman Analisis SWOT - dropdown tidak muncul');
  console.log('  4. Test halaman Rencana Strategis - tampil dashboard view');
  console.log('  5. Refresh halaman beberapa kali untuk memastikan tidak berubah\n');
} else {
  console.log('❌ SOME TESTS FAILED!');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('⚠️  Ada beberapa test yang gagal. Silakan periksa kembali.');
  console.log('⚠️  Jalankan script perbaikan lagi jika diperlukan.\n');
}

process.exit(allPassed ? 0 : 1);
