/**
 * TEST: Rencana Strategis Isolation Fix
 * Memverifikasi bahwa tampilan rencana strategis TIDAK muncul di halaman lain
 * 
 * Created: 2026-01-07
 */

const puppeteer = require('puppeteer');

async function testRSIsolation() {
    console.log('🧪 Testing Rencana Strategis Isolation...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Login first
        console.log('1️⃣ Logging in...');
        await page.goto('http://localhost:3000/login.html');
        await page.waitForSelector('#email');
        await page.type('#email', 'superadmin@example.com');
        await page.type('#password', 'superadmin123');
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log('✅ Logged in\n');
        
        // Test pages that should NOT show RS content
        const pagesToTest = [
            { name: 'Dashboard', url: 'http://localhost:3000/', selector: '#dashboard' },
            { name: 'Visi Misi', url: 'http://localhost:3000/#visi-misi', selector: '#visi-misi' },
            { name: 'Analisis SWOT', url: 'http://localhost:3000/#analisis-swot', selector: '#analisis-swot' },
            { name: 'Diagram Kartesius', url: 'http://localhost:3000/#diagram-kartesius', selector: '#diagram-kartesius' },
            { name: 'Matriks TOWS', url: 'http://localhost:3000/#matriks-tows', selector: '#matriks-tows' },
            { name: 'Sasaran Strategi', url: 'http://localhost:3000/#sasaran-strategi', selector: '#sasaran-strategi' }
        ];
        
        let allPassed = true;
        
        for (const testPage of pagesToTest) {
            console.log(`\n2️⃣ Testing ${testPage.name}...`);
            await page.goto(testPage.url);
            await page.waitForTimeout(2000); // Wait for any dynamic content
            
            // Check for RS content indicators
            const hasRSContent = await page.evaluate(() => {
                const body = document.body.textContent || '';
                
                // Check for RS selection list
                const hasPilihRS = body.includes('Pilih Rencana Strategis');
                const hasRSCode = /RS-\d{4}-\d{3}/.test(body);
                const hasRSTable = document.querySelector('#rencana-strategis-content table');
                const hasRSCards = document.querySelector('.rencana-strategis-wrapper');
                
                // Check if RS content is visible (not just in hidden page container)
                const visibleRSContent = Array.from(document.querySelectorAll('*')).some(el => {
                    if (el.id === 'rencana-strategis' || el.closest('#rencana-strategis')) {
                        return false; // Ignore content inside the page container
                    }
                    const text = el.textContent || '';
                    const isVisible = el.offsetParent !== null;
                    return isVisible && (
                        (text.includes('Pilih Rencana Strategis') && /RS-\d{4}-\d{3}/.test(text)) ||
                        (el.querySelector && el.querySelector('.rencana-strategis-wrapper'))
                    );
                });
                
                return {
                    hasPilihRS,
                    hasRSCode,
                    hasRSTable: !!hasRSTable,
                    hasRSCards: !!hasRSCards,
                    visibleRSContent
                };
            });
            
            console.log(`   - Has "Pilih Rencana Strategis": ${hasRSContent.hasPilihRS}`);
            console.log(`   - Has RS Code (RS-YYYY-XXX): ${hasRSContent.hasRSCode}`);
            console.log(`   - Has RS Table: ${hasRSContent.hasRSTable}`);
            console.log(`   - Has RS Cards: ${hasRSContent.hasRSCards}`);
            console.log(`   - Visible RS Content: ${hasRSContent.visibleRSContent}`);
            
            if (hasRSContent.visibleRSContent) {
                console.log(`   ❌ FAILED: RS content found on ${testPage.name}`);
                allPassed = false;
            } else {
                console.log(`   ✅ PASSED: No RS content on ${testPage.name}`);
            }
        }
        
        // Test Rencana Strategis page itself (should HAVE RS content)
        console.log(`\n3️⃣ Testing Rencana Strategis page (should have content)...`);
        await page.goto('http://localhost:3000/#rencana-strategis');
        await page.waitForTimeout(3000);
        
        const rsPageContent = await page.evaluate(() => {
            const container = document.getElementById('rencana-strategis-content');
            const hasTable = !!container?.querySelector('table');
            const hasCards = !!container?.querySelector('.rencana-strategis-wrapper');
            const hasForm = !!container?.querySelector('form');
            
            return {
                hasTable,
                hasCards,
                hasForm,
                containerExists: !!container
            };
        });
        
        console.log(`   - Container exists: ${rsPageContent.containerExists}`);
        console.log(`   - Has Table: ${rsPageContent.hasTable}`);
        console.log(`   - Has Cards: ${rsPageContent.hasCards}`);
        console.log(`   - Has Form: ${rsPageContent.hasForm}`);
        
        if (rsPageContent.hasTable && rsPageContent.hasCards) {
            console.log(`   ✅ PASSED: RS page has proper content`);
        } else {
            console.log(`   ❌ FAILED: RS page missing content`);
            allPassed = false;
        }
        
        // Final result
        console.log('\n' + '='.repeat(60));
        if (allPassed) {
            console.log('✅ ALL TESTS PASSED');
            console.log('Rencana Strategis is properly isolated to its own page');
        } else {
            console.log('❌ SOME TESTS FAILED');
            console.log('RS content is appearing on other pages');
        }
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await browser.close();
    }
}

// Run test
testRSIsolation().catch(console.error);
