/**
 * TEST CONTROLLED DISPLAY VERIFICATION
 * Comprehensive test to verify the controlled display system
 * Created: December 28, 2025
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Controlled Display Verification Tests...\n');

let testsPassed = 0;
let testsTotal = 0;

function runTest(testName, testFunction) {
  testsTotal++;
  try {
    const result = testFunction();
    if (result) {
      console.log(`✅ ${testName}`);
      testsPassed++;
    } else {
      console.log(`❌ ${testName}`);
    }
  } catch (error) {
    console.log(`❌ ${testName} - Error: ${error.message}`);
  }
}

// Test 1: Check if display control script exists
runTest('Display Control Script Exists', () => {
  const scriptPath = path.join(__dirname, 'public', 'js', 'rencana-strategis-display-control.js');
  return fs.existsSync(scriptPath);
});

// Test 2: Check if controlled module script exists
runTest('Controlled Module Script Exists', () => {
  const scriptPath = path.join(__dirname, 'public', 'js', 'rencana-strategis-controlled.js');
  return fs.existsSync(scriptPath);
});

// Test 3: Check if CSS file exists
runTest('Controlled Display CSS Exists', () => {
  const cssPath = path.join(__dirname, 'public', 'css', 'rencana-strategis-controlled.css');
  return fs.existsSync(cssPath);
});

// Test 4: Check if test page exists
runTest('Test Page Exists', () => {
  const testPath = path.join(__dirname, 'public', 'test-rencana-strategis-controlled-display.html');
  return fs.existsSync(testPath);
});

// Test 5: Check if index.html includes the new scripts
runTest('Index.html Includes New Scripts', () => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  return indexContent.includes('rencana-strategis-display-control.js') && 
         indexContent.includes('rencana-strategis-controlled.js');
});

// Test 6: Check if index.html includes the new CSS
runTest('Index.html Includes New CSS', () => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  return indexContent.includes('rencana-strategis-controlled.css');
});

// Test 7: Check if backup of original script exists
runTest('Original Script Backup Exists', () => {
  const backupPath = path.join(__dirname, 'public', 'js', 'rencana-strategis-original.js');
  return fs.existsSync(backupPath);
});

// Test 8: Check if verification script exists
runTest('Verification Script Exists', () => {
  const verifyPath = path.join(__dirname, 'public', 'js', 'verify-controlled-display.js');
  return fs.existsSync(verifyPath);
});

// Test 9: Validate display control script content
runTest('Display Control Script Has Required Functions', () => {
  const scriptPath = path.join(__dirname, 'public', 'js', 'rencana-strategis-display-control.js');
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');
  return scriptContent.includes('RencanaStrategisDisplayControl') &&
         scriptContent.includes('ensurePageVisibility') &&
         scriptContent.includes('controlContentDisplay') &&
         scriptContent.includes('preventUnwantedScrolling');
});

// Test 10: Validate controlled module script content
runTest('Controlled Module Has Required Functions', () => {
  const scriptPath = path.join(__dirname, 'public', 'js', 'rencana-strategis-controlled.js');
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');
  return scriptContent.includes('RencanaStrategisControlled') &&
         scriptContent.includes('renderControlled') &&
         scriptContent.includes('renderStatisticsOnly') &&
         scriptContent.includes('ensureCorrectPosition');
});

// Test 11: Check if CSS has required styles
runTest('CSS Has Required Styles', () => {
  const cssPath = path.join(__dirname, 'public', 'css', 'rencana-strategis-controlled.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  return cssContent.includes('.statistics-card') &&
         cssContent.includes('.table-responsive') &&
         cssContent.includes('scroll-behavior: smooth');
});

// Test 12: Check if integration script exists
runTest('Integration Script Exists', () => {
  const integrationPath = path.join(__dirname, 'integrate-controlled-display.js');
  return fs.existsSync(integrationPath);
});

// Test 13: Validate route handler exists
runTest('Rencana Strategis Route Handler Exists', () => {
  const routePath = path.join(__dirname, 'routes', 'rencana-strategis.js');
  return fs.existsSync(routePath);
});

// Test 14: Check if public endpoint exists in route
runTest('Public Endpoint Exists in Route', () => {
  const routePath = path.join(__dirname, 'routes', 'rencana-strategis.js');
  const routeContent = fs.readFileSync(routePath, 'utf8');
  return routeContent.includes('/public') && routeContent.includes('no auth required');
});

// Test 15: Validate test page has required elements
runTest('Test Page Has Required Elements', () => {
  const testPath = path.join(__dirname, 'public', 'test-rencana-strategis-controlled-display.html');
  const testContent = fs.readFileSync(testPath, 'utf8');
  return testContent.includes('rencana-strategis-content') &&
         testContent.includes('load-module') &&
         testContent.includes('debug-info');
});

console.log('\n📊 Test Results:');
console.log(`Tests Passed: ${testsPassed}/${testsTotal}`);
console.log(`Success Rate: ${Math.round((testsPassed / testsTotal) * 100)}%`);

if (testsPassed === testsTotal) {
  console.log('\n🎉 All tests passed! The controlled display system is properly integrated.');
  console.log('\n📋 Manual Testing Steps:');
  console.log('1. Start your server');
  console.log('2. Visit: http://localhost:3001/test-rencana-strategis-controlled-display.html');
  console.log('3. Click "Load Module" button');
  console.log('4. Verify that statistics cards display correctly');
  console.log('5. Check that the page stops at the correct position');
  console.log('6. Test the main application at: http://localhost:3001/#rencana-strategis');
  
  console.log('\n🔍 Expected Behavior:');
  console.log('- Page should display 4 statistics cards (Rencana Aktif, Draft, Selesai, Total)');
  console.log('- Cards should have proper colors and hover effects');
  console.log('- Page should not scroll automatically beyond the statistics');
  console.log('- Action buttons should be visible below statistics');
  console.log('- No infinite loading or race conditions');
  
} else {
  console.log('\n❌ Some tests failed. Please check the integration.');
  console.log('Run the integration script again if needed: node integrate-controlled-display.js');
}

console.log('\n🛠️ Troubleshooting:');
console.log('- If scripts are not loading, check browser console for errors');
console.log('- If styles are not applied, verify CSS file is linked correctly');
console.log('- If API calls fail, check network tab and server logs');
console.log('- Use browser dev tools to inspect the DOM structure');

// Create a summary report
const reportContent = `
# Controlled Display Integration Report
Generated: ${new Date().toISOString()}

## Test Results
- Tests Passed: ${testsPassed}/${testsTotal}
- Success Rate: ${Math.round((testsPassed / testsTotal) * 100)}%

## Files Created/Modified
- ✅ public/js/rencana-strategis-display-control.js
- ✅ public/js/rencana-strategis-controlled.js
- ✅ public/css/rencana-strategis-controlled.css
- ✅ public/test-rencana-strategis-controlled-display.html
- ✅ public/js/verify-controlled-display.js
- ✅ public/js/rencana-strategis-original.js (backup)
- ✅ public/index.html (updated)

## Integration Status
${testsPassed === testsTotal ? '🎉 COMPLETE' : '⚠️ INCOMPLETE'}

## Next Steps
1. Test the controlled display functionality
2. Verify statistics display correctly
3. Ensure page positioning is correct
4. Check for any console errors
5. Test on different screen sizes

## Support
If you encounter issues, check:
- Browser console for JavaScript errors
- Network tab for failed API requests
- DOM inspector for element visibility
- CSS styles application
`;

const reportPath = path.join(__dirname, 'controlled-display-integration-report.md');
fs.writeFileSync(reportPath, reportContent, 'utf8');
console.log(`\n📄 Integration report saved to: ${reportPath}`);