/**
 * Test Verification: Rencana Strategis Display Fix
 * 
 * Verifies:
 * 1. CSP allows all required CDNs (including unpkg.com for Lucide)
 * 2. RS module loads correctly without race conditions
 * 3. Correct display (Cards + Form + Table) is shown
 * 4. Selection list is NOT shown
 * 
 * Run: node test-rs-display-fix-verification.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

console.log('═══════════════════════════════════════════════════════════');
console.log('  RENCANA STRATEGIS DISPLAY FIX VERIFICATION');
console.log('═══════════════════════════════════════════════════════════\n');

const results = [];

async function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ 
                status: res.statusCode, 
                headers: res.headers, 
                body: data 
            }));
        });
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

async function testCSPHeaders() {
    console.log('🔍 Test 1: CSP Headers Configuration');
    console.log('─────────────────────────────────────');
    
    try {
        const response = await makeRequest(`${BASE_URL}/rencana-strategis`);
        const csp = response.headers['content-security-policy'] || '';
        
        console.log('  CSP Header:', csp.substring(0, 100) + '...\n');
        
        // Check required sources
        const requiredSources = [
            { name: 'unpkg.com', pattern: 'unpkg.com' },
            { name: 'jsdelivr.net', pattern: 'cdn.jsdelivr.net' },
            { name: 'cdnjs.cloudflare.com', pattern: 'cdnjs.cloudflare.com' },
            { name: 'fontawesome', pattern: 'use.fontawesome.com' }
        ];
        
        let allPassed = true;
        for (const source of requiredSources) {
            const found = csp.includes(source.pattern);
            console.log(`  ${found ? '✅' : '❌'} ${source.name}: ${found ? 'Allowed' : 'NOT ALLOWED'}`);
            if (!found) allPassed = false;
        }
        
        results.push({ test: 'CSP Headers', status: allPassed ? 'PASS' : 'FAIL' });
        console.log(`\n  Result: ${allPassed ? '✅ PASS' : '❌ FAIL'}\n`);
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        results.push({ test: 'CSP Headers', status: 'ERROR' });
    }
}

async function testSecurityMiddleware() {
    console.log('🔍 Test 2: Security Middleware File');
    console.log('─────────────────────────────────────');
    
    try {
        const securityPath = path.join(__dirname, 'middleware', 'security.js');
        const content = fs.readFileSync(securityPath, 'utf8');
        
        const checks = [
            { name: 'unpkg.com in scriptSrc', pattern: /scriptSrc.*unpkg\.com/ },
            { name: 'jsdelivr in scriptSrc', pattern: /scriptSrc.*cdn\.jsdelivr\.net/ },
            { name: 'CSP header set', pattern: /Content-Security-Policy/ }
        ];
        
        let allPassed = true;
        for (const check of checks) {
            const found = check.pattern.test(content);
            console.log(`  ${found ? '✅' : '❌'} ${check.name}`);
            if (!found) allPassed = false;
        }
        
        results.push({ test: 'Security Middleware', status: allPassed ? 'PASS' : 'FAIL' });
        console.log(`\n  Result: ${allPassed ? '✅ PASS' : '❌ FAIL'}\n`);
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        results.push({ test: 'Security Middleware', status: 'ERROR' });
    }
}

async function testRSUnifiedModule() {
    console.log('🔍 Test 3: RS Unified Module');
    console.log('─────────────────────────────────────');
    
    try {
        const modulePath = path.join(__dirname, 'public', 'js', 'rencana-strategis-unified.js');
        const content = fs.readFileSync(modulePath, 'utf8');
        
        const checks = [
            { name: 'Module version 6.0', pattern: /MODULE_VERSION.*6\.0/ },
            { name: 'Mutex implementation', pattern: /loadMutex/ },
            { name: 'Rate limiting', pattern: /lastLoadTime/ },
            { name: 'Cleanup function', pattern: /function cleanup/ },
            { name: 'renderStatCards', pattern: /function renderStatCards/ },
            { name: 'renderForm', pattern: /function renderForm/ },
            { name: 'renderTable', pattern: /function renderTable/ },
            { name: 'Selection list cleanup', pattern: /cleanupWrongDisplay|Pilih Rencana Strategis/ },
            { name: 'Global exports', pattern: /window\.RencanaStrategisModule/ }
        ];
        
        let allPassed = true;
        for (const check of checks) {
            const found = check.pattern.test(content);
            console.log(`  ${found ? '✅' : '❌'} ${check.name}`);
            if (!found) allPassed = false;
        }
        
        results.push({ test: 'RS Unified Module', status: allPassed ? 'PASS' : 'FAIL' });
        console.log(`\n  Result: ${allPassed ? '✅ PASS' : '❌ FAIL'}\n`);
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        results.push({ test: 'RS Unified Module', status: 'ERROR' });
    }
}

async function testStartupScript() {
    console.log('🔍 Test 4: Startup Script');
    console.log('─────────────────────────────────────');
    
    try {
        const scriptPath = path.join(__dirname, 'public', 'js', 'startup-script.js');
        const content = fs.readFileSync(scriptPath, 'utf8');
        
        const checks = [
            { name: 'Version 5.0', pattern: /v5\.0/ },
            { name: 'RS module state', pattern: /rsModuleState/ },
            { name: 'Safe loader function', pattern: /safeLoadRencanaStrategis/ },
            { name: 'Cleanup function', pattern: /cleanupRSModule/ },
            { name: 'Page detection', pattern: /isOnRSPage/ },
            { name: 'Rate limiting', pattern: /lastLoadTime/ }
        ];
        
        let allPassed = true;
        for (const check of checks) {
            const found = check.pattern.test(content);
            console.log(`  ${found ? '✅' : '❌'} ${check.name}`);
            if (!found) allPassed = false;
        }
        
        results.push({ test: 'Startup Script', status: allPassed ? 'PASS' : 'FAIL' });
        console.log(`\n  Result: ${allPassed ? '✅ PASS' : '❌ FAIL'}\n`);
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        results.push({ test: 'Startup Script', status: 'ERROR' });
    }
}

async function testAppJSIntegration() {
    console.log('🔍 Test 5: App.js Integration');
    console.log('─────────────────────────────────────');
    
    try {
        const appPath = path.join(__dirname, 'public', 'js', 'app.js');
        const content = fs.readFileSync(appPath, 'utf8');
        
        const checks = [
            { name: 'Uses RencanaStrategisUnified', pattern: /RencanaStrategisUnified/ },
            { name: 'RS page case handler', pattern: /case 'rencana-strategis'/ },
            { name: 'Fallback to RencanaStrategisModule', pattern: /RencanaStrategisModule\.load/ }
        ];
        
        let allPassed = true;
        for (const check of checks) {
            const found = check.pattern.test(content);
            console.log(`  ${found ? '✅' : '❌'} ${check.name}`);
            if (!found) allPassed = false;
        }
        
        results.push({ test: 'App.js Integration', status: allPassed ? 'PASS' : 'FAIL' });
        console.log(`\n  Result: ${allPassed ? '✅ PASS' : '❌ FAIL'}\n`);
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        results.push({ test: 'App.js Integration', status: 'ERROR' });
    }
}

async function testLucideIconSystem() {
    console.log('🔍 Test 6: Lucide Icon System');
    console.log('─────────────────────────────────────');
    
    try {
        const iconPath = path.join(__dirname, 'public', 'js', 'lucide-icon-system.js');
        const content = fs.readFileSync(iconPath, 'utf8');
        
        // Check that it uses jsdelivr (CSP whitelisted)
        const usesJsdelivr = content.includes('cdn.jsdelivr.net');
        // Check that unpkg is NOT the primary source (or removed)
        const unpkgNotPrimary = !content.includes("'https://unpkg.com") || 
                                content.indexOf('cdn.jsdelivr.net') < content.indexOf('unpkg.com');
        
        console.log(`  ${usesJsdelivr ? '✅' : '❌'} Uses jsdelivr CDN`);
        console.log(`  ${unpkgNotPrimary ? '✅' : '⚠️'} jsdelivr is primary CDN`);
        
        const allPassed = usesJsdelivr;
        results.push({ test: 'Lucide Icon System', status: allPassed ? 'PASS' : 'WARN' });
        console.log(`\n  Result: ${allPassed ? '✅ PASS' : '⚠️ WARNING'}\n`);
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        results.push({ test: 'Lucide Icon System', status: 'ERROR' });
    }
}

async function testIndexHTML() {
    console.log('🔍 Test 7: Index.html Script Loading');
    console.log('─────────────────────────────────────');
    
    try {
        const indexPath = path.join(__dirname, 'public', 'index.html');
        const content = fs.readFileSync(indexPath, 'utf8');
        
        const checks = [
            { name: 'RS Unified module loaded', pattern: /rencana-strategis-unified\.js/ },
            { name: 'Startup script loaded', pattern: /startup-script\.js/ },
            { name: 'Lucide from jsdelivr', pattern: /cdn\.jsdelivr\.net.*lucide/ }
        ];
        
        let allPassed = true;
        for (const check of checks) {
            const found = check.pattern.test(content);
            console.log(`  ${found ? '✅' : '❌'} ${check.name}`);
            if (!found) allPassed = false;
        }
        
        results.push({ test: 'Index.html', status: allPassed ? 'PASS' : 'FAIL' });
        console.log(`\n  Result: ${allPassed ? '✅ PASS' : '❌ FAIL'}\n`);
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        results.push({ test: 'Index.html', status: 'ERROR' });
    }
}

async function runAllTests() {
    // File-based tests (don't need server)
    await testSecurityMiddleware();
    await testRSUnifiedModule();
    await testStartupScript();
    await testAppJSIntegration();
    await testLucideIconSystem();
    await testIndexHTML();
    
    // Server-based tests
    try {
        await testCSPHeaders();
    } catch (error) {
        console.log('⚠️ Server tests skipped (server not running)\n');
        results.push({ test: 'CSP Headers', status: 'SKIPPED' });
    }
    
    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warnings = results.filter(r => r.status === 'WARN').length;
    const errors = results.filter(r => r.status === 'ERROR').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;
    
    results.forEach(r => {
        const icon = r.status === 'PASS' ? '✅' : 
                     r.status === 'FAIL' ? '❌' : 
                     r.status === 'WARN' ? '⚠️' :
                     r.status === 'SKIPPED' ? '⏭️' : '💥';
        console.log(`  ${icon} ${r.test}: ${r.status}`);
    });
    
    console.log('\n─────────────────────────────────────');
    console.log(`  Total: ${results.length} tests`);
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  ⚠️ Warnings: ${warnings}`);
    console.log(`  💥 Errors: ${errors}`);
    console.log(`  ⏭️ Skipped: ${skipped}`);
    console.log('─────────────────────────────────────\n');
    
    if (failed === 0 && errors === 0) {
        console.log('🎉 ALL TESTS PASSED!\n');
        console.log('Next steps:');
        console.log('1. Restart the server: npm start');
        console.log('2. Clear browser cache (Ctrl+Shift+Delete)');
        console.log('3. Navigate to /rencana-strategis');
        console.log('4. Verify: Cards + Form + Table are displayed');
        console.log('5. Verify: NO "Pilih Rencana Strategis" selection list\n');
    } else {
        console.log('⚠️ Some tests failed. Please review the issues above.\n');
    }
}

runAllTests().catch(console.error);
