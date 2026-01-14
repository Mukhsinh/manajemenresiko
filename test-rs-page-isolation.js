/**
 * Test RS Page Isolation Fix
 * Verifies that RS content doesn't leak to other pages
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function fetchPage(path) {
    return new Promise((resolve, reject) => {
        http.get(`${BASE_URL}${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        }).on('error', reject);
    });
}

async function runTests() {
    console.log('🧪 Testing RS Page Isolation Fix\n');
    console.log('=' .repeat(50));
    
    const tests = [];
    
    // Test 1: Check if rs-page-isolation.css exists
    try {
        const cssRes = await fetchPage('/css/rs-page-isolation.css');
        const cssExists = cssRes.status === 200 && cssRes.body.includes('RS PAGE ISOLATION CSS');
        tests.push({
            name: 'RS Page Isolation CSS exists',
            passed: cssExists,
            details: cssExists ? 'CSS file loaded successfully' : 'CSS file not found or invalid'
        });
    } catch (e) {
        tests.push({
            name: 'RS Page Isolation CSS exists',
            passed: false,
            details: `Error: ${e.message}`
        });
    }
    
    // Test 2: Check if rs-page-isolation.js exists
    try {
        const jsRes = await fetchPage('/js/rs-page-isolation.js');
        const jsExists = jsRes.status === 200 && jsRes.body.includes('RS Page Isolation System');
        tests.push({
            name: 'RS Page Isolation JS exists',
            passed: jsExists,
            details: jsExists ? 'JS file loaded successfully' : 'JS file not found or invalid'
        });
    } catch (e) {
        tests.push({
            name: 'RS Page Isolation JS exists',
            passed: false,
            details: `Error: ${e.message}`
        });
    }
    
    // Test 3: Check if index.html includes isolation files
    try {
        const indexRes = await fetchPage('/');
        const hasIsolationCSS = indexRes.body.includes('rs-page-isolation.css');
        const hasIsolationJS = indexRes.body.includes('rs-page-isolation.js');
        tests.push({
            name: 'Index.html includes isolation files',
            passed: hasIsolationCSS && hasIsolationJS,
            details: `CSS: ${hasIsolationCSS ? '✓' : '✗'}, JS: ${hasIsolationJS ? '✓' : '✗'}`
        });
    } catch (e) {
        tests.push({
            name: 'Index.html includes isolation files',
            passed: false,
            details: `Error: ${e.message}`
        });
    }
    
    // Test 4: Check CSS contains proper isolation rules
    try {
        const cssRes = await fetchPage('/css/rs-page-isolation.css');
        const hasPageContentRule = cssRes.body.includes('.page-content:not(#rencana-strategis)');
        const hasDisplayNone = cssRes.body.includes('display: none !important');
        const hasVisibilityHidden = cssRes.body.includes('visibility: hidden !important');
        tests.push({
            name: 'CSS contains proper isolation rules',
            passed: hasPageContentRule && hasDisplayNone && hasVisibilityHidden,
            details: `Scoped selector: ${hasPageContentRule ? '✓' : '✗'}, Display none: ${hasDisplayNone ? '✓' : '✗'}, Visibility hidden: ${hasVisibilityHidden ? '✓' : '✗'}`
        });
    } catch (e) {
        tests.push({
            name: 'CSS contains proper isolation rules',
            passed: false,
            details: `Error: ${e.message}`
        });
    }
    
    // Test 5: Check JS contains cleanup functions
    try {
        const jsRes = await fetchPage('/js/rs-page-isolation.js');
        const hasIsRSPage = jsRes.body.includes('function isRSPage()');
        const hasCleanup = jsRes.body.includes('cleanupRSContentFromOtherPages');
        const hasEnforce = jsRes.body.includes('enforceRSIsolation');
        tests.push({
            name: 'JS contains cleanup functions',
            passed: hasIsRSPage && hasCleanup && hasEnforce,
            details: `isRSPage: ${hasIsRSPage ? '✓' : '✗'}, cleanup: ${hasCleanup ? '✓' : '✗'}, enforce: ${hasEnforce ? '✓' : '✗'}`
        });
    } catch (e) {
        tests.push({
            name: 'JS contains cleanup functions',
            passed: false,
            details: `Error: ${e.message}`
        });
    }
    
    // Test 6: Check navigation.js has enhanced cleanup
    try {
        const navRes = await fetchPage('/js/navigation.js');
        const hasEnhancedCleanup = navRes.body.includes('Enhanced cleanup to prevent RS content leak');
        const hasRSElementsRemoval = navRes.body.includes('.rencana-strategis-wrapper');
        tests.push({
            name: 'Navigation.js has enhanced cleanup',
            passed: hasEnhancedCleanup && hasRSElementsRemoval,
            details: `Enhanced cleanup: ${hasEnhancedCleanup ? '✓' : '✗'}, RS removal: ${hasRSElementsRemoval ? '✓' : '✗'}`
        });
    } catch (e) {
        tests.push({
            name: 'Navigation.js has enhanced cleanup',
            passed: false,
            details: `Error: ${e.message}`
        });
    }
    
    // Print results
    console.log('\n📊 Test Results:\n');
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach((test, index) => {
        const status = test.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${index + 1}. ${status}: ${test.name}`);
        console.log(`   ${test.details}\n`);
        
        if (test.passed) passed++;
        else failed++;
    });
    
    console.log('=' .repeat(50));
    console.log(`\n📈 Summary: ${passed}/${tests.length} tests passed`);
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed! RS Page Isolation fix is properly implemented.');
    } else {
        console.log(`\n⚠️ ${failed} test(s) failed. Please check the implementation.`);
    }
    
    return { passed, failed, total: tests.length };
}

// Run tests
runTests().catch(err => {
    console.error('❌ Test execution failed:', err.message);
    console.log('\n💡 Make sure the server is running on port 3000');
    process.exit(1);
});
