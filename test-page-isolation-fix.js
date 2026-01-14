/**
 * Test Page Isolation Fix
 * Verifies that the page isolation fix is working correctly
 * Created: 2026-01-10
 */

const http = require('http');

const BASE_URL = 'http://localhost:3003';

async function fetchPage(path) {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}${path}`;
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        }).on('error', reject);
    });
}

async function runTests() {
    console.log('🧪 Testing Page Isolation Fix...\n');
    
    const results = [];
    
    // Test 1: Check if CSS file is accessible
    console.log('Test 1: CSS File Accessibility');
    try {
        const cssRes = await fetchPage('/css/page-isolation-fix.css');
        const passed = cssRes.status === 200;
        results.push({ name: 'CSS File Accessible', passed });
        console.log(passed ? '  ✅ PASS: page-isolation-fix.css is accessible' : '  ❌ FAIL: CSS file not accessible');
    } catch (error) {
        results.push({ name: 'CSS File Accessible', passed: false });
        console.log('  ❌ FAIL:', error.message);
    }
    
    // Test 2: Check if JS file is accessible
    console.log('\nTest 2: JS File Accessibility');
    try {
        const jsRes = await fetchPage('/js/page-navigation-fix.js');
        const passed = jsRes.status === 200;
        results.push({ name: 'JS File Accessible', passed });
        console.log(passed ? '  ✅ PASS: page-navigation-fix.js is accessible' : '  ❌ FAIL: JS file not accessible');
    } catch (error) {
        results.push({ name: 'JS File Accessible', passed: false });
        console.log('  ❌ FAIL:', error.message);
    }
    
    // Test 3: Check if index.html includes the new CSS
    console.log('\nTest 3: CSS Included in index.html');
    try {
        const indexRes = await fetchPage('/');
        const includesCSS = indexRes.data.includes('page-isolation-fix.css');
        results.push({ name: 'CSS Included in HTML', passed: includesCSS });
        console.log(includesCSS ? '  ✅ PASS: CSS is included in index.html' : '  ❌ FAIL: CSS not found in index.html');
    } catch (error) {
        results.push({ name: 'CSS Included in HTML', passed: false });
        console.log('  ❌ FAIL:', error.message);
    }
    
    // Test 4: Check if index.html includes the new JS
    console.log('\nTest 4: JS Included in index.html');
    try {
        const indexRes = await fetchPage('/');
        const includesJS = indexRes.data.includes('page-navigation-fix.js');
        results.push({ name: 'JS Included in HTML', passed: includesJS });
        console.log(includesJS ? '  ✅ PASS: JS is included in index.html' : '  ❌ FAIL: JS not found in index.html');
    } catch (error) {
        results.push({ name: 'JS Included in HTML', passed: false });
        console.log('  ❌ FAIL:', error.message);
    }
    
    // Test 5: Check CSS content for critical rules
    console.log('\nTest 5: CSS Critical Rules');
    try {
        const cssRes = await fetchPage('/css/page-isolation-fix.css');
        const hasPointerEvents = cssRes.data.includes('pointer-events: auto');
        const hasZIndex = cssRes.data.includes('z-index');
        const hasPageContent = cssRes.data.includes('.page-content');
        const passed = hasPointerEvents && hasZIndex && hasPageContent;
        results.push({ name: 'CSS Critical Rules', passed });
        console.log(passed ? '  ✅ PASS: CSS contains critical rules' : '  ❌ FAIL: CSS missing critical rules');
        console.log(`    - pointer-events: ${hasPointerEvents ? '✓' : '✗'}`);
        console.log(`    - z-index: ${hasZIndex ? '✓' : '✗'}`);
        console.log(`    - .page-content: ${hasPageContent ? '✓' : '✗'}`);
    } catch (error) {
        results.push({ name: 'CSS Critical Rules', passed: false });
        console.log('  ❌ FAIL:', error.message);
    }
    
    // Test 6: Check JS content for critical functions
    console.log('\nTest 6: JS Critical Functions');
    try {
        const jsRes = await fetchPage('/js/page-navigation-fix.js');
        const hasEnsureSinglePage = jsRes.data.includes('ensureSinglePageVisible');
        const hasCleanupRS = jsRes.data.includes('cleanupRSContent');
        const hasFixPointerEvents = jsRes.data.includes('fixPointerEvents');
        const passed = hasEnsureSinglePage && hasCleanupRS && hasFixPointerEvents;
        results.push({ name: 'JS Critical Functions', passed });
        console.log(passed ? '  ✅ PASS: JS contains critical functions' : '  ❌ FAIL: JS missing critical functions');
        console.log(`    - ensureSinglePageVisible: ${hasEnsureSinglePage ? '✓' : '✗'}`);
        console.log(`    - cleanupRSContent: ${hasCleanupRS ? '✓' : '✗'}`);
        console.log(`    - fixPointerEvents: ${hasFixPointerEvents ? '✓' : '✗'}`);
    } catch (error) {
        results.push({ name: 'JS Critical Functions', passed: false });
        console.log('  ❌ FAIL:', error.message);
    }
    
    // Test 7: Check startup-script.js version
    console.log('\nTest 7: Startup Script Version');
    try {
        const startupRes = await fetchPage('/js/startup-script.js');
        const hasV4 = startupRes.data.includes('v4.0');
        const hasCleanupRSModule = startupRes.data.includes('cleanupRSModule');
        const passed = hasV4 && hasCleanupRSModule;
        results.push({ name: 'Startup Script Updated', passed });
        console.log(passed ? '  ✅ PASS: startup-script.js is updated to v4.0' : '  ❌ FAIL: startup-script.js not updated');
        console.log(`    - Version 4.0: ${hasV4 ? '✓' : '✗'}`);
        console.log(`    - cleanupRSModule: ${hasCleanupRSModule ? '✓' : '✗'}`);
    } catch (error) {
        results.push({ name: 'Startup Script Updated', passed: false });
        console.log('  ❌ FAIL:', error.message);
    }
    
    // Test 8: Check test page accessibility
    console.log('\nTest 8: Test Page Accessibility');
    try {
        const testRes = await fetchPage('/test-page-isolation-fix.html');
        const passed = testRes.status === 200;
        results.push({ name: 'Test Page Accessible', passed });
        console.log(passed ? '  ✅ PASS: Test page is accessible' : '  ❌ FAIL: Test page not accessible');
    } catch (error) {
        results.push({ name: 'Test Page Accessible', passed: false });
        console.log('  ❌ FAIL:', error.message);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${Math.round(passed / results.length * 100)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed! Page isolation fix is working correctly.');
    } else {
        console.log('\n⚠️ Some tests failed. Please review the issues above.');
    }
    
    console.log('\n📝 Manual Testing Required:');
    console.log('1. Open http://localhost:3003/rencana-strategis');
    console.log('2. Refresh the page (F5)');
    console.log('3. Verify all buttons and forms are clickable');
    console.log('4. Navigate to another page (e.g., Dashboard)');
    console.log('5. Verify RS content does not appear on other pages');
    console.log('6. Navigate back to Rencana Strategis');
    console.log('7. Verify content loads correctly');
    
    console.log('\n🔗 Test Page: http://localhost:3003/test-page-isolation-fix.html');
    
    return failed === 0;
}

// Run tests
runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test error:', error);
    process.exit(1);
});
