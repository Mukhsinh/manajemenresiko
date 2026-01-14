/**
 * TEST: Rencana Strategis Content Isolation
 * Memverifikasi bahwa konten RS tidak muncul di halaman lain
 */

const puppeteer = require('puppeteer');

async function testRSContentIsolation() {
    console.log('🧪 Testing RS Content Isolation...\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Login first
        console.log('1️⃣ Logging in...');
        await page.goto('http://localhost:3000');
        await page.waitForSelector('#login-email', { timeout: 5000 });
        await page.type('#login-email', 'superadmin@example.com');
        await page.type('#login-password', 'superadmin123');
        await page.click('button[type="submit"]');
        await page.waitForSelector('#main-app', { timeout: 10000 });
        console.log('✅ Logged in successfully\n');
        
        // Test pages that should NOT have RS content
        const pagesToTest = [
            { name: 'Dashboard', selector: '[data-page="dashboard"]', pageId: 'dashboard' },
            { name: 'Analisis SWOT', selector: '[data-page="analisis-swot"]', pageId: 'analisis-swot' },
            { name: 'Sasaran Strategi', selector: '[data-page="sasaran-strategi"]', pageId: 'sasaran-strategi' },
            { name: 'Risk Profile', selector: '[data-page="risk-profile"]', pageId: 'risk-profile' },
            { name: 'Risk Register', selector: '[data-page="risk-register"]', pageId: 'risk-register' }
        ];
        
        let allPassed = true;
        
        for (const testPage of pagesToTest) {
            console.log(`\n2️⃣ Testing ${testPage.name}...`);
            
            // Navigate to page
            await page.click(testPage.selector);
            await page.waitForTimeout(2000);
            
            // Check if page is active
            const isActive = await page.evaluate((pageId) => {
                const pageElement = document.getElementById(pageId);
                return pageElement && pageElement.classList.contains('active');
            }, testPage.pageId);
            
            if (!isActive) {
                console.log(`⚠️ Page ${testPage.name} not active, skipping...`);
                continue;
            }
            
            // Check for RS content
            const hasRSContent = await page.evaluate((pageId) => {
                const pageElement = document.getElementById(pageId);
                if (!pageElement) return false;
                
                const text = pageElement.textContent || '';
                const html = pageElement.innerHTML || '';
                
                // Check for RS-specific patterns
                const hasRSCode = /RS-\d{4}-\d{3}/.test(text);
                const hasRSTitle = text.includes('Pilih Rencana Strategis');
                const hasRSTable = html.includes('Kode RS') && html.includes('Nama Rencana');
                const hasRSCards = html.includes('Rencana Aktif') && hasRSCode;
                
                return {
                    hasRSCode,
                    hasRSTitle,
                    hasRSTable,
                    hasRSCards,
                    hasAnyRSContent: hasRSCode || hasRSTitle || hasRSTable || hasRSCards
                };
            }, testPage.pageId);
            
            if (hasRSContent.hasAnyRSContent) {
                console.log(`❌ FAILED: ${testPage.name} contains RS content!`);
                console.log(`   - RS Code: ${hasRSContent.hasRSCode}`);
                console.log(`   - RS Title: ${hasRSContent.hasRSTitle}`);
                console.log(`   - RS Table: ${hasRSContent.hasRSTable}`);
                console.log(`   - RS Cards: ${hasRSContent.hasRSCards}`);
                allPassed = false;
            } else {
                console.log(`✅ PASSED: ${testPage.name} has no RS content`);
            }
        }
        
        // Test Rencana Strategis page (should HAVE RS content)
        console.log(`\n3️⃣ Testing Rencana Strategis page (should have RS content)...`);
        await page.click('[data-page="rencana-strategis"]');
        await page.waitForTimeout(3000);
        
        const rsPageContent = await page.evaluate(() => {
            const container = document.getElementById('rencana-strategis-content');
            if (!container) return null;
            
            const html = container.innerHTML;
            const text = container.textContent || '';
            
            return {
                hasTable: html.includes('<table'),
                hasCards: html.includes('Rencana Aktif') || html.includes('Draft'),
                hasRSCode: /RS-\d{4}-\d{3}/.test(text),
                hasForm: html.includes('form') || html.includes('Tambah Rencana'),
                hasSelectionList: html.includes('Pilih Rencana Strategis') && !html.includes('table')
            };
        });
        
        if (!rsPageContent) {
            console.log('❌ FAILED: Rencana Strategis container not found');
            allPassed = false;
        } else if (rsPageContent.hasSelectionList) {
            console.log('❌ FAILED: Rencana Strategis showing selection list instead of dashboard');
            allPassed = false;
        } else if (!rsPageContent.hasTable || !rsPageContent.hasCards) {
            console.log('❌ FAILED: Rencana Strategis missing proper interface');
            console.log(`   - Has Table: ${rsPageContent.hasTable}`);
            console.log(`   - Has Cards: ${rsPageContent.hasCards}`);
            allPassed = false;
        } else {
            console.log('✅ PASSED: Rencana Strategis has proper dashboard interface');
        }
        
        // Final result
        console.log('\n' + '='.repeat(60));
        if (allPassed) {
            console.log('✅ ALL TESTS PASSED!');
            console.log('RS content is properly isolated to RS page only');
        } else {
            console.log('❌ SOME TESTS FAILED!');
            console.log('RS content is leaking to other pages');
        }
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await browser.close();
    }
}

// Run test
testRSContentIsolation().catch(console.error);
