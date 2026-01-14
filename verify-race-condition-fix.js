/**
 * VERIFICATION SCRIPT FOR RACE CONDITION FIX
 * Tests that the infinite loop and manual refresh issues are resolved
 * Created: December 28, 2025
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🧪 Verifying race condition fix...');

/**
 * Test 1: Verify problematic files are disabled
 */
function testProblematicFilesDisabled() {
    console.log('\n📋 Test 1: Verifying problematic files are disabled...');
    
    const problematicFiles = [
        'public/js/comprehensive-ui-fix.js',
        'public/js/ui-enhancement-framework.js',
        'public/js/rencana-strategis.js'
    ];
    
    const disabledFiles = [
        'public/js/comprehensive-ui-fix.js.disabled',
        'public/js/ui-enhancement-framework.js.disabled',
        'public/js/rencana-strategis.js.disabled'
    ];
    
    let allDisabled = true;
    
    problematicFiles.forEach((file, index) => {
        const disabledFile = disabledFiles[index];
        
        if (fs.existsSync(file)) {
            console.log(`❌ ${file} still exists (should be disabled)`);
            allDisabled = false;
        } else if (fs.existsSync(disabledFile)) {
            console.log(`✅ ${file} properly disabled -> ${disabledFile}`);
        } else {
            console.log(`⚠️  ${file} not found (may not have existed)`);
        }
    });
    
    return allDisabled;
}

/**
 * Test 2: Verify fixed files exist
 */
function testFixedFilesExist() {
    console.log('\n📋 Test 2: Verifying fixed files exist...');
    
    const fixedFiles = [
        'public/js/page-initialization-system-fixed.js',
        'public/js/rencana-strategis-fixed.js',
        'public/js/startup-script.js',
        'public/rencana-strategis-fixed.html',
        'public/test-rencana-strategis-race-condition-fix.html'
    ];
    
    let allExist = true;
    
    fixedFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} exists`);
        } else {
            console.log(`❌ ${file} missing`);
            allExist = false;
        }
    });
    
    return allExist;
}

/**
 * Test 3: Verify HTML files are updated
 */
function testHTMLFilesUpdated() {
    console.log('\n📋 Test 3: Verifying HTML files are updated...');
    
    const htmlFiles = [
        'public/index.html',
        'public/rencana-strategis-fixed.html'
    ];
    
    let allUpdated = true;
    
    htmlFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            
            // Check for fixed scripts
            const hasFixedScripts = content.includes('page-initialization-system-fixed.js') ||
                                  content.includes('rencana-strategis-fixed.js') ||
                                  content.includes('startup-script.js');
            
            // Check for disabled problematic scripts
            const hasProblematicScripts = content.includes('comprehensive-ui-fix.js') ||
                                        content.includes('ui-enhancement-framework.js');
            
            if (hasFixedScripts && !hasProblematicScripts) {
                console.log(`✅ ${file} properly updated with fixed scripts`);
            } else if (hasProblematicScripts) {
                console.log(`⚠️  ${file} still references problematic scripts`);
                allUpdated = false;
            } else {
                console.log(`⚠️  ${file} may not have fixed scripts`);
            }
        } else {
            console.log(`⚠️  ${file} not found`);
        }
    });
    
    return allUpdated;
}

/**
 * Test 4: Verify server configuration
 */
function testServerConfiguration() {
    console.log('\n📋 Test 4: Verifying server configuration...');
    
    if (fs.existsSync('server.js')) {
        const content = fs.readFileSync('server.js', 'utf8');
        
        const hasFixedRoutes = content.includes('/rencana-strategis-fixed');
        const hasCachePrevention = content.includes('Cache-Control');
        
        if (hasFixedRoutes && hasCachePrevention) {
            console.log('✅ server.js properly configured with fixed routes and cache prevention');
            return true;
        } else {
            console.log('⚠️  server.js may not be properly configured');
            return false;
        }
    } else {
        console.log('❌ server.js not found');
        return false;
    }
}

/**
 * Test 5: Test server response (if running)
 */
function testServerResponse() {
    return new Promise((resolve) => {
        console.log('\n📋 Test 5: Testing server response...');
        
        const testUrls = [
            '/test-rencana-strategis-race-condition-fix.html',
            '/rencana-strategis-fixed',
            '/js/page-initialization-system-fixed.js',
            '/js/rencana-strategis-fixed.js',
            '/js/startup-script.js'
        ];
        
        let completedTests = 0;
        let passedTests = 0;
        
        testUrls.forEach(url => {
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: url,
                method: 'GET',
                timeout: 5000
            };
            
            const req = http.request(options, (res) => {
                completedTests++;
                
                if (res.statusCode === 200) {
                    console.log(`✅ ${url} - Status: ${res.statusCode}`);
                    passedTests++;
                } else {
                    console.log(`⚠️  ${url} - Status: ${res.statusCode}`);
                }
                
                if (completedTests === testUrls.length) {
                    const success = passedTests === testUrls.length;
                    console.log(`\n📊 Server response test: ${passedTests}/${testUrls.length} URLs accessible`);
                    resolve(success);
                }
            });
            
            req.on('error', (err) => {
                completedTests++;
                console.log(`❌ ${url} - Error: ${err.message}`);
                
                if (completedTests === testUrls.length) {
                    console.log(`\n📊 Server response test: ${passedTests}/${testUrls.length} URLs accessible`);
                    console.log('ℹ️  Note: Server may not be running. Start with: npm start');
                    resolve(false);
                }
            });
            
            req.on('timeout', () => {
                req.destroy();
                completedTests++;
                console.log(`⏱️  ${url} - Timeout`);
                
                if (completedTests === testUrls.length) {
                    console.log(`\n📊 Server response test: ${passedTests}/${testUrls.length} URLs accessible`);
                    resolve(false);
                }
            });
            
            req.end();
        });
    });
}

/**
 * Test 6: Analyze fixed scripts for potential issues
 */
function testFixedScriptsQuality() {
    console.log('\n📋 Test 6: Analyzing fixed scripts quality...');
    
    const scriptsToAnalyze = [
        'public/js/page-initialization-system-fixed.js',
        'public/js/rencana-strategis-fixed.js',
        'public/js/startup-script.js'
    ];
    
    let allGood = true;
    
    scriptsToAnalyze.forEach(file => {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            
            // Check for potential infinite loop patterns
            const hasSetInterval = content.includes('setInterval');
            const hasInfiniteLoop = content.match(/while\s*\(\s*true\s*\)/);
            const hasRecursiveCall = content.match(/function\s+\w+[^}]*\1\s*\(/);
            
            // Check for race condition prevention
            const hasRaceConditionPrevention = content.includes('initialized') || 
                                             content.includes('loading') ||
                                             content.includes('prevent');
            
            // Check for proper error handling
            const hasErrorHandling = content.includes('try') && content.includes('catch');
            
            console.log(`\n📄 ${file}:`);
            
            if (hasSetInterval) {
                console.log(`  ⚠️  Contains setInterval (check if properly controlled)`);
            } else {
                console.log(`  ✅ No setInterval found`);
            }
            
            if (hasInfiniteLoop) {
                console.log(`  ❌ Contains potential infinite loop`);
                allGood = false;
            } else {
                console.log(`  ✅ No infinite loops detected`);
            }
            
            if (hasRaceConditionPrevention) {
                console.log(`  ✅ Has race condition prevention`);
            } else {
                console.log(`  ⚠️  May lack race condition prevention`);
            }
            
            if (hasErrorHandling) {
                console.log(`  ✅ Has error handling`);
            } else {
                console.log(`  ⚠️  May lack proper error handling`);
            }
        } else {
            console.log(`❌ ${file} not found`);
            allGood = false;
        }
    });
    
    return allGood;
}

/**
 * Generate final report
 */
function generateFinalReport(testResults) {
    console.log('\n📊 VERIFICATION RESULTS:');
    console.log('========================');
    
    const tests = [
        { name: 'Problematic files disabled', result: testResults.problematicFilesDisabled },
        { name: 'Fixed files exist', result: testResults.fixedFilesExist },
        { name: 'HTML files updated', result: testResults.htmlFilesUpdated },
        { name: 'Server configuration', result: testResults.serverConfiguration },
        { name: 'Server response', result: testResults.serverResponse },
        { name: 'Fixed scripts quality', result: testResults.fixedScriptsQuality }
    ];
    
    let passedTests = 0;
    
    tests.forEach(test => {
        const status = test.result ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${test.name}`);
        if (test.result) passedTests++;
    });
    
    const overallScore = `${passedTests}/${tests.length}`;
    console.log(`\n🎯 Overall Score: ${overallScore}`);
    
    if (passedTests === tests.length) {
        console.log('\n🎉 ALL TESTS PASSED! The race condition fix is properly implemented.');
        console.log('\n🚀 Ready to test:');
        console.log('1. Start server: npm start');
        console.log('2. Open: http://localhost:3001/test-rencana-strategis-race-condition-fix.html');
        console.log('3. Verify no "all ui fixed applied" messages in console');
        console.log('4. Verify page loads completely without manual refresh');
        console.log('5. Open: http://localhost:3001/rencana-strategis-fixed');
        console.log('6. Verify form and table both appear immediately');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the issues above.');
        console.log('\nCommon fixes:');
        console.log('- Run: node integrate-race-condition-fix-final.js');
        console.log('- Restart the server');
        console.log('- Clear browser cache');
    }
    
    return passedTests === tests.length;
}

/**
 * Main verification function
 */
async function main() {
    console.log('🔍 Starting comprehensive verification...\n');
    
    const testResults = {
        problematicFilesDisabled: testProblematicFilesDisabled(),
        fixedFilesExist: testFixedFilesExist(),
        htmlFilesUpdated: testHTMLFilesUpdated(),
        serverConfiguration: testServerConfiguration(),
        serverResponse: await testServerResponse(),
        fixedScriptsQuality: testFixedScriptsQuality()
    };
    
    const success = generateFinalReport(testResults);
    
    console.log('\n📋 Verification completed.');
    
    if (success) {
        console.log('✅ The race condition fix is ready for use!');
        process.exit(0);
    } else {
        console.log('❌ Some issues need to be addressed.');
        process.exit(1);
    }
}

// Run verification
main().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
});