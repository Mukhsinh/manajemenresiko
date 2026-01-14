/**
 * Test: Rencana Strategis Unified Fix
 * Verifies CSP, script loading, and display
 */

const http = require('http');

const BASE_URL = 'http://localhost:3002';

async function fetch(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ 
                status: res.statusCode, 
                headers: res.headers,
                body: data 
            }));
        }).on('error', reject);
    });
}

async function runTests() {
    console.log('=== Testing Rencana Strategis Unified Fix ===\n');
    
    let passed = 0;
    let failed = 0;
    
    try {
        // Test 1: Check CSP header includes unpkg.com
        console.log('1. Testing CSP header...');
        const indexRes = await fetch(BASE_URL + '/');
        const csp = indexRes.headers['content-security-policy'] || '';
        
        if (csp.includes('unpkg.com')) {
            console.log('   ✅ CSP includes unpkg.com');
            passed++;
        } else {
            console.log('   ❌ CSP missing unpkg.com');
            console.log('   CSP:', csp.substring(0, 200) + '...');
            failed++;
        }
        
        // Test 2: Check index.html loads correctly
        console.log('\n2. Testing index.html...');
        if (indexRes.status === 200) {
            console.log('   ✅ Index.html loads (status 200)');
            passed++;
        } else {
            console.log('   ❌ Index.html failed (status ' + indexRes.status + ')');
            failed++;
        }
        
        // Test 3: Check unified module is referenced
        console.log('\n3. Testing unified module reference...');
        if (indexRes.body.includes('rencana-strategis-unified.js')) {
            console.log('   ✅ Unified module referenced in HTML');
            passed++;
        } else {
            console.log('   ❌ Unified module NOT referenced');
            failed++;
        }
        
        // Test 4: Check Lucide uses jsdelivr
        console.log('\n4. Testing Lucide CDN...');
        if (indexRes.body.includes('cdn.jsdelivr.net/npm/lucide')) {
            console.log('   ✅ Lucide uses jsdelivr (CSP whitelisted)');
            passed++;
        } else {
            console.log('   ❌ Lucide not using jsdelivr');
            failed++;
        }
        
        // Test 5: Check unified module loads
        console.log('\n5. Testing unified module file...');
        const moduleRes = await fetch(BASE_URL + '/js/rencana-strategis-unified.js');
        if (moduleRes.status === 200 && moduleRes.body.includes('RencanaStrategisModule')) {
            console.log('   ✅ Unified module loads correctly');
            passed++;
        } else {
            console.log('   ❌ Unified module failed to load');
            failed++;
        }
        
        // Test 6: Check unified CSS loads
        console.log('\n6. Testing unified CSS file...');
        const cssRes = await fetch(BASE_URL + '/css/rencana-strategis-unified.css');
        if (cssRes.status === 200 && cssRes.body.includes('rencana-strategis-wrapper')) {
            console.log('   ✅ Unified CSS loads correctly');
            passed++;
        } else {
            console.log('   ❌ Unified CSS failed to load');
            failed++;
        }
        
        // Test 7: Check lucide-icon-system uses jsdelivr
        console.log('\n7. Testing lucide-icon-system...');
        const lucideRes = await fetch(BASE_URL + '/js/lucide-icon-system.js');
        if (lucideRes.status === 200 && lucideRes.body.includes('cdn.jsdelivr.net')) {
            console.log('   ✅ Lucide icon system uses jsdelivr');
            passed++;
        } else {
            console.log('   ❌ Lucide icon system issue');
            failed++;
        }
        
        // Test 8: Check no blocking scripts
        console.log('\n8. Testing for blocking patterns...');
        const hasBlockingPattern = indexRes.body.includes('while(true)') || 
                                   indexRes.body.includes('infinite loop');
        if (!hasBlockingPattern) {
            console.log('   ✅ No obvious blocking patterns');
            passed++;
        } else {
            console.log('   ❌ Potential blocking pattern found');
            failed++;
        }
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
        failed++;
    }
    
    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(failed === 0 ? '\n✅ ALL TESTS PASSED!' : '\n❌ SOME TESTS FAILED');
    
    console.log('\n=== Next Steps ===');
    console.log('1. Open browser: http://localhost:3002');
    console.log('2. Login and navigate to /rencana-strategis');
    console.log('3. Verify: Cards + Table + Form displayed (NOT selection list)');
    console.log('4. Check console: No CSP errors');
    console.log('5. Refresh page: Should maintain correct display');
    
    process.exit(failed === 0 ? 0 : 1);
}

runTests();
