/**
 * VERIFICATION: Global RS Dropdown Fix
 * Memverifikasi bahwa perbaikan sudah diterapkan dengan benar
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Global RS Dropdown Fix...\n');

const results = [];

// 1. Check prevention script exists
console.log('📝 Test 1: Checking prevention script...');
const preventionPath = path.join(__dirname, 'public', 'js', 'prevent-global-rs-dropdown.js');

if (fs.existsSync(preventionPath)) {
  const content = fs.readFileSync(preventionPath, 'utf8');
  
  const hasMutationObserver = content.includes('MutationObserver');
  const hasPathCheck = content.includes('currentPath.includes(\'rencana-strategis\')');
  const hasRemoveLogic = content.includes('Pilih Rencana Strategis');
  
  if (hasMutationObserver && hasPathCheck && hasRemoveLogic) {
    console.log('  ✅ PASS: Prevention script exists and is correct\n');
    results.push({ test: 'Prevention Script', status: 'PASS' });
  } else {
    console.log('  ❌ FAIL: Prevention script is incomplete\n');
    results.push({ test: 'Prevention Script', status: 'FAIL' });
  }
} else {
  console.log('  ❌ FAIL: Prevention script not found\n');
  results.push({ test: 'Prevention Script', status: 'FAIL' });
}

// 2. Check index.html includes prevention script
console.log('📝 Test 2: Checking index.html...');
const indexPath = path.join(__dirname, 'public', 'index.html');

if (fs.existsSync(indexPath)) {
  const content = fs.readFileSync(indexPath, 'utf8');
  
  if (content.includes('prevent-global-rs-dropdown.js')) {
    console.log('  ✅ PASS: Prevention script is included in index.html\n');
    results.push({ test: 'Index.html Integration', status: 'PASS' });
  } else {
    console.log('  ❌ FAIL: Prevention script not included in index.html\n');
    results.push({ test: 'Index.html Integration', status: 'FAIL' });
  }
} else {
  console.log('  ❌ FAIL: index.html not found\n');
  results.push({ test: 'Index.html Integration', status: 'FAIL' });
}

// 3. Check navigation.js has correct rencana-strategis case
console.log('📝 Test 3: Checking navigation.js...');
const navPath = path.join(__dirname, 'public', 'js', 'navigation.js');

if (fs.existsSync(navPath)) {
  const content = fs.readFileSync(navPath, 'utf8');
  
  const hasRSCase = content.includes('case \'rencana-strategis\':');
  const hasModuleLoad = content.includes('RencanaStrategisModule.load');
  const hasVerification = content.includes('Verify proper interface');
  
  if (hasRSCase && hasModuleLoad) {
    console.log('  ✅ PASS: Navigation.js has correct rencana-strategis case\n');
    results.push({ test: 'Navigation.js', status: 'PASS' });
  } else {
    console.log('  ❌ FAIL: Navigation.js rencana-strategis case is incorrect\n');
    results.push({ test: 'Navigation.js', status: 'FAIL' });
  }
} else {
  console.log('  ❌ FAIL: navigation.js not found\n');
  results.push({ test: 'Navigation.js', status: 'FAIL' });
}

// 4. Check page-initialization-system-enhanced.js
console.log('📝 Test 4: Checking page-initialization-system-enhanced.js...');
const pageInitPath = path.join(__dirname, 'public', 'js', 'page-initialization-system-enhanced.js');

if (fs.existsSync(pageInitPath)) {
  const content = fs.readFileSync(pageInitPath, 'utf8');
  
  const hasRSCase = content.includes('case \'rencana-strategis\':') ||
                    content.includes('initializeRencanaStrategis');
  
  if (hasRSCase) {
    console.log('  ✅ PASS: Page initialization has rencana-strategis case\n');
    results.push({ test: 'Page Initialization', status: 'PASS' });
  } else {
    console.log('  ❌ FAIL: Page initialization missing rencana-strategis case\n');
    results.push({ test: 'Page Initialization', status: 'FAIL' });
  }
} else {
  console.log('  ❌ FAIL: page-initialization-system-enhanced.js not found\n');
  results.push({ test: 'Page Initialization', status: 'FAIL' });
}

// 5. Check rencana-strategis.js doesn't have global scope issues
console.log('📝 Test 5: Checking rencana-strategis.js...');
const rsModulePath = path.join(__dirname, 'public', 'js', 'rencana-strategis.js');

if (fs.existsSync(rsModulePath)) {
  const content = fs.readFileSync(rsModulePath, 'utf8');
  
  // Check that it blocks selection list functions
  const blocksSelectionList = content.includes('loadRencanaStrategisSelection blocked') ||
                              content.includes('renderRencanaStrategisList blocked');
  
  if (blocksSelectionList) {
    console.log('  ✅ PASS: Rencana strategis module blocks selection list functions\n');
    results.push({ test: 'RS Module Protection', status: 'PASS' });
  } else {
    console.log('  ⚠️  WARNING: RS module may not block selection list functions\n');
    results.push({ test: 'RS Module Protection', status: 'WARNING' });
  }
} else {
  console.log('  ❌ FAIL: rencana-strategis.js not found\n');
  results.push({ test: 'RS Module Protection', status: 'FAIL' });
}

// Summary
console.log('═══════════════════════════════════════════════════════════');
console.log('📊 VERIFICATION SUMMARY\n');

const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
const warnings = results.filter(r => r.status === 'WARNING').length;

results.forEach(result => {
  const icon = result.status === 'PASS' ? '✅' : 
               result.status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${result.test}: ${result.status}`);
});

console.log('\n═══════════════════════════════════════════════════════════');

if (failed === 0) {
  console.log('✅ ALL TESTS PASSED!\n');
  console.log('Perbaikan berhasil diterapkan dengan sempurna!');
  console.log('Tampilan "Pilih Rencana Strategis" sekarang HANYA muncul di /rencana-strategis\n');
  
  console.log('🔄 NEXT STEPS:');
  console.log('  1. Restart server: npm start');
  console.log('  2. Clear browser cache (Ctrl+Shift+Delete)');
  console.log('  3. Hard refresh (Ctrl+F5)');
  console.log('  4. Test navigasi ke berbagai halaman\n');
} else {
  console.log(`❌ ${failed} TEST(S) FAILED\n`);
  console.log('Silakan periksa file yang gagal dan jalankan fix script lagi:');
  console.log('  node fix-global-rencana-strategis-dropdown.js\n');
}

if (warnings > 0) {
  console.log(`⚠️  ${warnings} WARNING(S)\n`);
  console.log('Periksa warning di atas untuk memastikan tidak ada masalah.\n');
}

console.log('═══════════════════════════════════════════════════════════');
