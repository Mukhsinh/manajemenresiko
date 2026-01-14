/**
 * Test Script untuk Verifikasi Perbaikan Tampilan Halaman
 * 
 * Menguji:
 * 1. Analisis SWOT - Enhanced content loading
 * 2. Rencana Strategis - Container detection
 */

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
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
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testAnalisisSwotScriptReference() {
  logSection('TEST 1: Analisis SWOT - Script Reference');
  
  try {
    // Read the HTML file
    const htmlPath = './public/analisis-swot-enhanced-final.html';
    if (!fs.existsSync(htmlPath)) {
      log('❌ File not found: ' + htmlPath, 'red');
      return false;
    }
    
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Check for correct script reference
    const hasCorrectScript = htmlContent.includes('src="/js/analisis-swot-enhanced.js"');
    const hasWrongScript = htmlContent.includes('src="/js/analisis-swot-enhanced-fix.js"');
    
    if (hasCorrectScript && !hasWrongScript) {
      log('✅ Script reference is correct: /js/analisis-swot-enhanced.js', 'green');
      
      // Verify the JS file exists
      const jsPath = './public/js/analisis-swot-enhanced.js';
      if (fs.existsSync(jsPath)) {
        log('✅ JS file exists: ' + jsPath, 'green');
        return true;
      } else {
        log('❌ JS file not found: ' + jsPath, 'red');
        return false;
      }
    } else if (hasWrongScript) {
      log('❌ Still using wrong script reference: /js/analisis-swot-enhanced-fix.js', 'red');
      return false;
    } else {
      log('❌ No script reference found', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Error: ' + error.message, 'red');
    return false;
  }
}

async function testRencanaStrategisContainerFallback() {
  logSection('TEST 2: Rencana Strategis - Container Fallback');
  
  try {
    // Read the JS file
    const jsPath = './public/js/rencana-strategis-optimized-v2.js';
    if (!fs.existsSync(jsPath)) {
      log('❌ File not found: ' + jsPath, 'red');
      return false;
    }
    
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // Check for fallback mechanism
    const hasPrimaryContainer = jsContent.includes("getEl('rencana-strategis-content')");
    const hasFallback1 = jsContent.includes("getEl('rencana-strategis')");
    const hasFallback2 = jsContent.includes('querySelector(\'[data-page="rencana-strategis"]\'');
    const hasLogging = jsContent.includes('Container found:');
    
    let passed = true;
    
    if (hasPrimaryContainer) {
      log('✅ Primary container check exists', 'green');
    } else {
      log('❌ Primary container check missing', 'red');
      passed = false;
    }
    
    if (hasFallback1) {
      log('✅ Fallback 1 exists (rencana-strategis)', 'green');
    } else {
      log('❌ Fallback 1 missing', 'red');
      passed = false;
    }
    
    if (hasFallback2) {
      log('✅ Fallback 2 exists (data-page selector)', 'green');
    } else {
      log('❌ Fallback 2 missing', 'red');
      passed = false;
    }
    
    if (hasLogging) {
      log('✅ Container found logging exists', 'green');
    } else {
      log('⚠️  Container found logging missing (optional)', 'yellow');
    }
    
    return passed;
  } catch (error) {
    log('❌ Error: ' + error.message, 'red');
    return false;
  }
}

async function testIndexHtmlStructure() {
  logSection('TEST 3: Index.html - Page Structure');
  
  try {
    const htmlPath = './public/index.html';
    if (!fs.existsSync(htmlPath)) {
      log('❌ File not found: ' + htmlPath, 'red');
      return false;
    }
    
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Check for required containers
    const hasAnalisisSwotContainer = htmlContent.includes('id="analisis-swot-content"');
    const hasRencanaStrategisContainer = htmlContent.includes('id="rencana-strategis-content"');
    const hasAnalisisSwotPage = htmlContent.includes('id="analisis-swot"');
    const hasRencanaStrategisPage = htmlContent.includes('id="rencana-strategis"');
    
    let passed = true;
    
    if (hasAnalisisSwotContainer) {
      log('✅ Analisis SWOT content container exists', 'green');
    } else {
      log('❌ Analisis SWOT content container missing', 'red');
      passed = false;
    }
    
    if (hasRencanaStrategisContainer) {
      log('✅ Rencana Strategis content container exists', 'green');
    } else {
      log('❌ Rencana Strategis content container missing', 'red');
      passed = false;
    }
    
    if (hasAnalisisSwotPage) {
      log('✅ Analisis SWOT page div exists', 'green');
    } else {
      log('❌ Analisis SWOT page div missing', 'red');
      passed = false;
    }
    
    if (hasRencanaStrategisPage) {
      log('✅ Rencana Strategis page div exists', 'green');
    } else {
      log('❌ Rencana Strategis page div missing', 'red');
      passed = false;
    }
    
    return passed;
  } catch (error) {
    log('❌ Error: ' + error.message, 'red');
    return false;
  }
}

async function testModuleLoading() {
  logSection('TEST 4: Module Loading in app.js');
  
  try {
    const jsPath = './public/js/app.js';
    if (!fs.existsSync(jsPath)) {
      log('❌ File not found: ' + jsPath, 'red');
      return false;
    }
    
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // Check for module loading
    const hasAnalisisSwotLoad = jsContent.includes("case 'analisis-swot':") && 
                                 jsContent.includes('AnalisisSwotModule?.load');
    const hasRencanaStrategisLoad = jsContent.includes("case 'rencana-strategis':") &&
                                     jsContent.includes('safeLoadRencanaStrategis');
    
    let passed = true;
    
    if (hasAnalisisSwotLoad) {
      log('✅ Analisis SWOT module loading configured', 'green');
    } else {
      log('❌ Analisis SWOT module loading not configured', 'red');
      passed = false;
    }
    
    if (hasRencanaStrategisLoad) {
      log('✅ Rencana Strategis module loading configured', 'green');
    } else {
      log('❌ Rencana Strategis module loading not configured', 'red');
      passed = false;
    }
    
    return passed;
  } catch (error) {
    log('❌ Error: ' + error.message, 'red');
    return false;
  }
}

async function runAllTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     TEST PERBAIKAN TAMPILAN HALAMAN - VERIFICATION        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = {
    analisisSwotScript: await testAnalisisSwotScriptReference(),
    rencanaStrategisContainer: await testRencanaStrategisContainerFallback(),
    indexStructure: await testIndexHtmlStructure(),
    moduleLoading: await testModuleLoading()
  };
  
  logSection('SUMMARY');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  const failedTests = totalTests - passedTests;
  
  console.log('\nTest Results:');
  console.log('─'.repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    const color = passed ? 'green' : 'red';
    const testName = test.replace(/([A-Z])/g, ' $1').trim();
    log(`${status} - ${testName}`, color);
  });
  
  console.log('─'.repeat(60));
  log(`\nTotal: ${totalTests} tests`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  if (failedTests > 0) {
    log(`Failed: ${failedTests}`, 'red');
  }
  
  console.log('\n');
  
  if (passedTests === totalTests) {
    log('╔════════════════════════════════════════════════════════════╗', 'green');
    log('║              ✅ ALL TESTS PASSED!                          ║', 'green');
    log('║     Perbaikan tampilan halaman berhasil diverifikasi      ║', 'green');
    log('╚════════════════════════════════════════════════════════════╝', 'green');
    process.exit(0);
  } else {
    log('╔════════════════════════════════════════════════════════════╗', 'red');
    log('║              ❌ SOME TESTS FAILED                          ║', 'red');
    log('║        Silakan periksa error di atas                      ║', 'red');
    log('╚════════════════════════════════════════════════════════════╝', 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  log('\n❌ Fatal error: ' + error.message, 'red');
  console.error(error);
  process.exit(1);
});
