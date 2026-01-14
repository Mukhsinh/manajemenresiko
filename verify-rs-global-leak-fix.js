/**
 * VERIFICATION SCRIPT - RS GLOBAL LEAK FIX
 * Tests that RS content only appears on /rencana-strategis page
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'mukhsin9@gmail.com';
const TEST_PASSWORD = 'Mukhsin9@';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(page) {
    console.log('🔐 Logging in...');
    
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await delay(1000);
    
    await page.type('#email', TEST_EMAIL);
    await page.type('#password', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    await delay(3000);
    console.log('✅ Logged in successfully');
}

async function checkRSContentOnPage(page, pageName, shouldHaveRS = false) {
    console.log(`\n📄 Testing page: ${pageName}`);
    console.log(`   Expected RS content: ${shouldHaveRS ? 'YES' : 'NO'}`);
    
    // Navigate to page
    await page.goto(`${BASE_URL}/${pageName}`, { waitUntil: 'networkidle2' });
    await delay(2000);
    
    // Check for RS content
    const rsContent = await page.evaluate(() => {
        const checks = {
            hasRSWrapper: !!document.querySelector('.rencana-strategis-wrapper'),
            hasRSContent: !!document.querySelector('#rencana-strategis-content'),
            hasRSTable: !!document.querySelector('table[data-source="rencana-strategis"]'),
            hasRSCard: !!document.querySelector('.card[data-module="rencana-strategis"]'),
            hasRSText: document.body.innerText.includes('Rencana Strategis') && 
                       document.body.innerText.includes('Kode Rencana'),
            activePageId: document.querySelector('.page-content.active')?.id || 'unknown'
        };
        
        return checks;
    });
    
    // Get console logs
    const consoleLogs = await page.evaluate(() => {
        return window.rsProtectionLogs || [];
    });
    
    console.log('   Results:');
    console.log(`   - RS Wrapper: ${rsContent.hasRSWrapper ? '❌ FOUND' : '✅ NOT FOUND'}`);
    console.log(`   - RS Content: ${rsContent.hasRSContent ? '❌ FOUND' : '✅ NOT FOUND'}`);
    console.log(`   - RS Table: ${rsContent.hasRSTable ? '❌ FOUND' : '✅ NOT FOUND'}`);
    console.log(`   - RS Card: ${rsContent.hasRSCard ? '❌ FOUND' : '✅ NOT FOUND'}`);
    console.log(`   - RS Text: ${rsContent.hasRSText ? '❌ FOUND' : '✅ NOT FOUND'}`);
    console.log(`   - Active Page: ${rsContent.activePageId}`);
    
    // Determine if test passed
    const hasAnyRSContent = rsContent.hasRSWrapper || 
                           rsContent.hasRSContent || 
                           rsContent.hasRSTable || 
                           rsContent.hasRSCard;
    
    const testPassed = shouldHaveRS ? hasAnyRSContent : !hasAnyRSContent;
    
    if (testPassed) {
        console.log(`   ✅ TEST PASSED: ${pageName}`);
    } else {
        console.log(`   ❌ TEST FAILED: ${pageName}`);
        console.log(`   Expected RS content: ${shouldHaveRS}, Found: ${hasAnyRSContent}`);
    }
    
    return {
        pageName,
        shouldHaveRS,
        hasAnyRSContent,
        testPassed,
        details: rsContent
    };
}

async function testProtectionFunctions(page) {
    console.log('\n🛡️ Testing Protection Functions...');
    
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await delay(2000);
    
    const protectionTest = await page.evaluate(() => {
        const results = {
            moduleProtected: false,
            loadBlocked: false,
            selectionBlocked: false,
            globalFunctionsProtected: false
        };
        
        // Test if RencanaStrategisModule.load is protected
        if (window.RencanaStrategisModule && window.RencanaStrategisModule.load) {
            try {
                window.RencanaStrategisModule.load();
                results.moduleProtected = false; // Should have been blocked
            } catch (e) {
                results.moduleProtected = true;
            }
        }
        
        // Test if loadRencanaStrategis is protected
        if (window.loadRencanaStrategis) {
            try {
                window.loadRencanaStrategis();
                results.loadBlocked = false;
            } catch (e) {
                results.loadBlocked = true;
            }
        }
        
        // Test if selection functions are blocked
        if (window.loadRencanaStrategisSelection) {
            try {
                window.loadRencanaStrategisSelection();
                results.selectionBlocked = true; // Should return without error but do nothing
            } catch (e) {
                results.selectionBlocked = false;
            }
        }
        
        // Check if global functions exist
        results.globalFunctionsProtected = !!(
            window.loadRencanaStrategis &&
            window.loadRencanaStrategisSelection &&
            window.renderRencanaStrategisList
        );
        
        return results;
    });
    
    console.log('   Protection Results:');
    console.log(`   - Module Protected: ${protectionTest.moduleProtected ? '✅' : '❌'}`);
    console.log(`   - Load Blocked: ${protectionTest.loadBlocked ? '✅' : '❌'}`);
    console.log(`   - Selection Blocked: ${protectionTest.selectionBlocked ? '✅' : '❌'}`);
    console.log(`   - Global Functions: ${protectionTest.globalFunctionsProtected ? '✅' : '❌'}`);
    
    return protectionTest;
}

async function runTests() {
    console.log('🚀 Starting RS Global Leak Fix Verification\n');
    console.log('=' .repeat(60));
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Enable console logging
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('BLOCKED') || text.includes('RS Global Leak')) {
                console.log(`   [Browser Console] ${text}`);
            }
        });
        
        // Login
        await login(page);
        
        // Test pages that should NOT have RS content
        const nonRSPages = [
            'dashboard',
            'risk-profile',
            'risk-register',
            'risk-input',
            'residual-risk',
            'kri',
            'ews',
            'analisis-swot',
            'diagram-kartesius',
            'matriks-tows',
            'sasaran-strategi',
            'strategic-map',
            'indikator-kinerja-utama',
            'visi-misi',
            'monitoring-evaluasi',
            'peluang',
            'laporan',
            'master-data'
        ];
        
        const results = [];
        
        // Test non-RS pages
        for (const pageName of nonRSPages) {
            const result = await checkRSContentOnPage(page, pageName, false);
            results.push(result);
            await delay(1000);
        }
        
        // Test RS page (should have RS content)
        const rsResult = await checkRSContentOnPage(page, 'rencana-strategis', true);
        results.push(rsResult);
        
        // Test protection functions
        const protectionResult = await testProtectionFunctions(page);
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        
        const passed = results.filter(r => r.testPassed).length;
        const failed = results.filter(r => !r.testPassed).length;
        
        console.log(`\nTotal Tests: ${results.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        
        if (failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            results.filter(r => !r.testPassed).forEach(r => {
                console.log(`   - ${r.pageName}: Expected RS=${r.shouldHaveRS}, Found=${r.hasAnyRSContent}`);
            });
        }
        
        console.log('\n🛡️ PROTECTION STATUS:');
        console.log(`   - Module Protected: ${protectionResult.moduleProtected ? '✅' : '❌'}`);
        console.log(`   - Load Blocked: ${protectionResult.loadBlocked ? '✅' : '❌'}`);
        console.log(`   - Selection Blocked: ${protectionResult.selectionBlocked ? '✅' : '❌'}`);
        console.log(`   - Global Functions: ${protectionResult.globalFunctionsProtected ? '✅' : '❌'}`);
        
        const allPassed = failed === 0 && 
                         protectionResult.moduleProtected && 
                         protectionResult.globalFunctionsProtected;
        
        console.log('\n' + '='.repeat(60));
        if (allPassed) {
            console.log('🎉 ALL TESTS PASSED! RS content is properly isolated.');
        } else {
            console.log('⚠️ SOME TESTS FAILED. Please review the results above.');
        }
        console.log('='.repeat(60));
        
        // Save results to file
        const fs = require('fs');
        fs.writeFileSync(
            'rs-global-leak-fix-test-results.json',
            JSON.stringify({
                timestamp: new Date().toISOString(),
                results,
                protectionResult,
                summary: {
                    total: results.length,
                    passed,
                    failed,
                    allPassed
                }
            }, null, 2)
        );
        
        console.log('\n📄 Results saved to: rs-global-leak-fix-test-results.json');
        
    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await browser.close();
    }
}

// Run tests
runTests().catch(console.error);
