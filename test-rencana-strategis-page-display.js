/**
 * TEST: Rencana Strategis Page Display Fix
 * Memverifikasi bahwa halaman Rencana Strategis menampilkan interface lengkap
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logTest(testName, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'cyan');
  }
}

async function testPageStructure() {
  logSection('TEST 1: Page Structure');
  
  try {
    // Test if page endpoint exists
    const response = await axios.get(`${BASE_URL}/rencana-strategis`, {
      validateStatus: () => true
    });
    
    logTest(
      'Page endpoint accessible',
      response.status === 200,
      `Status: ${response.status}`
    );
    
    // Check if HTML contains required elements
    const html = response.data;
    const hasPageContent = html.includes('id="rencana-strategis"');
    const hasPageHeader = html.includes('Rencana Strategis');
    const hasContent = html.includes('rencana-strategis-content');
    
    logTest(
      'Page container exists',
      hasPageContent,
      'Element: #rencana-strategis'
    );
    
    logTest(
      'Page header exists',
      hasPageHeader,
      'Header: "Rencana Strategis"'
    );
    
    logTest(
      'Content container exists',
      hasContent,
      'Element: #rencana-strategis-content'
    );
    
    return hasPageContent && hasPageHeader && hasContent;
    
  } catch (error) {
    logTest('Page structure test', false, error.message);
    return false;
  }
}

async function testModuleLoading() {
  logSection('TEST 2: Module Loading');
  
  try {
    // Test if JavaScript module is accessible
    const response = await axios.get(`${BASE_URL}/js/rencana-strategis.js`, {
      validateStatus: () => true
    });
    
    logTest(
      'Module file accessible',
      response.status === 200,
      `Status: ${response.status}`
    );
    
    const jsContent = response.data;
    
    // Check for critical functions
    const hasLoadFunction = jsContent.includes('async function load()');
    const hasRenderFunction = jsContent.includes('function render()');
    const hasEnsureVisibility = jsContent.includes('ensurePageVisibility');
    const hasModuleExport = jsContent.includes('window.RencanaStrategisModule');
    
    logTest(
      'Load function exists',
      hasLoadFunction,
      'Function: load()'
    );
    
    logTest(
      'Render function exists',
      hasRenderFunction,
      'Function: render()'
    );
    
    logTest(
      'Visibility enforcement exists',
      hasEnsureVisibility,
      'Function: ensurePageVisibility()'
    );
    
    logTest(
      'Module exported globally',
      hasModuleExport,
      'Export: window.RencanaStrategisModule'
    );
    
    return hasLoadFunction && hasRenderFunction && hasEnsureVisibility && hasModuleExport;
    
  } catch (error) {
    logTest('Module loading test', false, error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  logSection('TEST 3: API Endpoints');
  
  try {
    // Test public endpoint (no auth required)
    const publicResponse = await axios.get(`${BASE_URL}/api/rencana-strategis/public`, {
      validateStatus: () => true
    });
    
    logTest(
      'Public API endpoint accessible',
      publicResponse.status === 200,
      `Status: ${publicResponse.status}, Records: ${publicResponse.data?.length || 0}`
    );
    
    // Test kode generation endpoint
    const kodeResponse = await axios.get(`${BASE_URL}/api/rencana-strategis/generate/kode/public`, {
      validateStatus: () => true
    });
    
    logTest(
      'Kode generation endpoint accessible',
      kodeResponse.status === 200 && kodeResponse.data?.kode,
      `Generated: ${kodeResponse.data?.kode || 'N/A'}`
    );
    
    // Validate kode format (RS-YYYY-NNN)
    const kodeFormat = /^RS-\d{4}-\d{3}$/;
    const isValidFormat = kodeFormat.test(kodeResponse.data?.kode);
    
    logTest(
      'Kode format valid',
      isValidFormat,
      `Format: RS-YYYY-NNN`
    );
    
    return publicResponse.status === 200 && kodeResponse.status === 200 && isValidFormat;
    
  } catch (error) {
    logTest('API endpoints test', false, error.message);
    return false;
  }
}

async function testNavigationProtection() {
  logSection('TEST 4: Navigation Protection');
  
  try {
    // Test app.js for navigation protection
    const appResponse = await axios.get(`${BASE_URL}/js/app.js`, {
      validateStatus: () => true
    });
    
    const appContent = appResponse.data;
    
    // Check for lock mechanism
    const hasLockMechanism = appContent.includes('lockRencanaStrategis');
    const hasPreventRedirect = appContent.includes('preventAutoRedirect');
    const hasInlineStyles = appContent.includes('selectedPage.style.display');
    
    logTest(
      'Lock mechanism implemented',
      hasLockMechanism,
      'Flag: lockRencanaStrategis'
    );
    
    logTest(
      'Redirect prevention implemented',
      hasPreventRedirect,
      'Flag: preventAutoRedirect'
    );
    
    logTest(
      'Inline style forcing implemented',
      hasInlineStyles,
      'Styles: display, visibility, opacity'
    );
    
    // Test router.js for lock checking
    const routerResponse = await axios.get(`${BASE_URL}/js/router.js`, {
      validateStatus: () => true
    });
    
    const routerContent = routerResponse.data;
    const hasRouterLockCheck = routerContent.includes('lockRencanaStrategis');
    
    logTest(
      'Router lock check implemented',
      hasRouterLockCheck,
      'Router respects page lock'
    );
    
    return hasLockMechanism && hasPreventRedirect && hasInlineStyles && hasRouterLockCheck;
    
  } catch (error) {
    logTest('Navigation protection test', false, error.message);
    return false;
  }
}

async function testUIComponents() {
  logSection('TEST 5: UI Components');
  
  try {
    const response = await axios.get(`${BASE_URL}/js/rencana-strategis.js`, {
      validateStatus: () => true
    });
    
    const jsContent = response.data;
    
    // Check for UI rendering functions
    const hasStatCards = jsContent.includes('renderStatCards');
    const hasForm = jsContent.includes('renderForm');
    const hasTable = jsContent.includes('renderTableRows');
    const hasMissionOptions = jsContent.includes('renderMissionOptions');
    
    logTest(
      'Statistics cards renderer exists',
      hasStatCards,
      'Function: renderStatCards()'
    );
    
    logTest(
      'Form renderer exists',
      hasForm,
      'Function: renderForm()'
    );
    
    logTest(
      'Table renderer exists',
      hasTable,
      'Function: renderTableRows()'
    );
    
    logTest(
      'Mission options renderer exists',
      hasMissionOptions,
      'Function: renderMissionOptions()'
    );
    
    // Check for event handlers
    const hasSubmitHandler = jsContent.includes('handleSubmit');
    const hasAddForm = jsContent.includes('showAddForm');
    const hasCloseForm = jsContent.includes('closeForm');
    const hasEdit = jsContent.includes('startEdit');
    const hasDelete = jsContent.includes('deleteRencana');
    
    logTest(
      'Form submit handler exists',
      hasSubmitHandler,
      'Handler: handleSubmit()'
    );
    
    logTest(
      'Add form handler exists',
      hasAddForm,
      'Handler: showAddForm()'
    );
    
    logTest(
      'Close form handler exists',
      hasCloseForm,
      'Handler: closeForm()'
    );
    
    logTest(
      'Edit handler exists',
      hasEdit,
      'Handler: startEdit()'
    );
    
    logTest(
      'Delete handler exists',
      hasDelete,
      'Handler: deleteRencana()'
    );
    
    return hasStatCards && hasForm && hasTable && hasMissionOptions &&
           hasSubmitHandler && hasAddForm && hasCloseForm && hasEdit && hasDelete;
    
  } catch (error) {
    logTest('UI components test', false, error.message);
    return false;
  }
}

async function testDataFlow() {
  logSection('TEST 6: Data Flow');
  
  try {
    const response = await axios.get(`${BASE_URL}/js/rencana-strategis.js`, {
      validateStatus: () => true
    });
    
    const jsContent = response.data;
    
    // Check for data management functions
    const hasFetchData = jsContent.includes('fetchData');
    const hasRefreshData = jsContent.includes('refreshData');
    const hasGenerateKode = jsContent.includes('generateKode');
    const hasExport = jsContent.includes('exportData');
    
    logTest(
      'Data fetching implemented',
      hasFetchData,
      'Function: fetchData()'
    );
    
    logTest(
      'Data refresh implemented',
      hasRefreshData,
      'Function: refreshData()'
    );
    
    logTest(
      'Kode generation implemented',
      hasGenerateKode,
      'Function: generateKode()'
    );
    
    logTest(
      'Export functionality implemented',
      hasExport,
      'Function: exportData()'
    );
    
    // Check for state management
    const hasState = jsContent.includes('const state = {');
    const hasStateData = jsContent.includes('state.data');
    const hasStateMissions = jsContent.includes('state.missions');
    const hasStateForm = jsContent.includes('state.formValues');
    
    logTest(
      'State object defined',
      hasState,
      'Object: state'
    );
    
    logTest(
      'Data state managed',
      hasStateData,
      'Property: state.data'
    );
    
    logTest(
      'Missions state managed',
      hasStateMissions,
      'Property: state.missions'
    );
    
    logTest(
      'Form state managed',
      hasStateForm,
      'Property: state.formValues'
    );
    
    return hasFetchData && hasRefreshData && hasGenerateKode && hasExport &&
           hasState && hasStateData && hasStateMissions && hasStateForm;
    
  } catch (error) {
    logTest('Data flow test', false, error.message);
    return false;
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║   RENCANA STRATEGIS PAGE DISPLAY FIX - TEST SUITE        ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝', 'bright');
  
  log(`\nTesting against: ${BASE_URL}`, 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'cyan');
  
  const results = {
    pageStructure: await testPageStructure(),
    moduleLoading: await testModuleLoading(),
    apiEndpoints: await testAPIEndpoints(),
    navigationProtection: await testNavigationProtection(),
    uiComponents: await testUIComponents(),
    dataFlow: await testDataFlow()
  };
  
  // Summary
  logSection('TEST SUMMARY');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  const failedTests = totalTests - passedTests;
  
  log(`Total Tests: ${totalTests}`, 'bright');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 
      passedTests === totalTests ? 'green' : 'yellow');
  
  // Detailed results
  console.log('\nDetailed Results:');
  Object.entries(results).forEach(([test, passed]) => {
    logTest(test, passed);
  });
  
  // Final verdict
  console.log('\n' + '='.repeat(60));
  if (passedTests === totalTests) {
    log('🎉 ALL TESTS PASSED! Page display fix is working correctly.', 'green');
  } else {
    log(`⚠️  ${failedTests} test(s) failed. Please review the issues above.`, 'yellow');
  }
  console.log('='.repeat(60) + '\n');
  
  // Exit code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log('\n❌ Test suite failed with error:', 'red');
  console.error(error);
  process.exit(1);
});
