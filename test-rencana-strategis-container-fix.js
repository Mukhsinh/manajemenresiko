/**
 * Test untuk memverifikasi perbaikan masalah container Rencana Strategis
 * 
 * Masalah yang diperbaiki:
 * 1. Container rencana-strategis-content not found
 * 2. Race condition antara login dan page initialization
 * 3. Error render saat halaman belum siap
 * 4. Tidak ada fallback handling yang aman
 */

const puppeteer = require('puppeteer');

async function testRencanaStrategisContainerFix() {
    console.log('🧪 Testing Rencana Strategis Container Fix...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        
        if (type === 'error') {
            console.log(`❌ BROWSER ERROR: ${text}`);
        } else if (text.includes('RENCANA STRATEGIS') || text.includes('Container')) {
            console.log(`📋 RENCANA STRATEGIS: ${text}`);
        }
    });
    
    try {
        console.log('🌐 Navigating to application...');
        await page.goto('http://localhost:3000', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        console.log('🔐 Performing login...');
        await page.waitForSelector('#login-email', { timeout: 10000 });
        await page.type('#login-email', 'mukhsin9@gmail.com');
        await page.type('#login-password', 'password123');
        await page.click('button[type="submit"]');
        
        // Wait for login to complete and app to show
        console.log('⏳ Waiting for app to load...');
        await page.waitForSelector('.app-container', { timeout: 15000 });
        
        // Wait for dashboard to load
        await page.waitForSelector('#dashboard.active', { timeout: 10000 });
        console.log('✅ Dashboard loaded successfully');
        
        // Test 1: Navigate to Rencana Strategis via menu click
        console.log('🧭 Test 1: Navigating to Rencana Strategis via menu...');
        await page.click('.menu-item[data-page="rencana-strategis"]');
        
        // Wait for page to become active
        await page.waitForSelector('#rencana-strategis.active', { timeout: 5000 });
        console.log('✅ Rencana Strategis page is active');
        
        // Test 2: Check if container exists or gets created
        console.log('🔍 Test 2: Checking container existence...');
        
        // Wait a bit for module to load
        await page.waitForTimeout(2000);
        
        const containerExists = await page.evaluate(() => {
            const container = document.getElementById('rencana-strategis-content');
            return {
                exists: !!container,
                hasContent: container ? container.innerHTML.length > 100 : false,
                containerInfo: container ? {
                    id: container.id,
                    className: container.className,
                    childrenCount: container.children.length
                } : null
            };
        });
        
        console.log('📦 Container status:', containerExists);
        
        if (containerExists.exists) {
            console.log('✅ Container exists');
            
            if (containerExists.hasContent) {
                console.log('✅ Container has content');
            } else {
                console.log('⚠️ Container exists but has no content');
            }
        } else {
            console.log('❌ Container does not exist');
        }
        
        // Test 3: Check for error messages
        console.log('🔍 Test 3: Checking for error messages...');
        
        const errorMessages = await page.evaluate(() => {
            const alerts = Array.from(document.querySelectorAll('.alert-danger, .alert-warning'));
            return alerts.map(alert => ({
                type: alert.className,
                text: alert.textContent.trim()
            }));
        });
        
        if (errorMessages.length > 0) {
            console.log('⚠️ Error messages found:', errorMessages);
        } else {
            console.log('✅ No error messages found');
        }
        
        // Test 4: Check console for specific errors
        console.log('🔍 Test 4: Checking browser console for errors...');
        
        const logs = await page.evaluate(() => {
            return window.testLogs || [];
        });
        
        // Test 5: Try direct URL navigation
        console.log('🧭 Test 5: Testing direct URL navigation...');
        await page.goto('http://localhost:3000/rencana-strategis', { 
            waitUntil: 'networkidle0',
            timeout: 10000 
        });
        
        // Check if page loads correctly with direct URL
        await page.waitForTimeout(2000);
        
        const directNavResult = await page.evaluate(() => {
            const page = document.getElementById('rencana-strategis');
            const container = document.getElementById('rencana-strategis-content');
            
            return {
                pageExists: !!page,
                pageActive: page ? page.classList.contains('active') : false,
                containerExists: !!container,
                containerHasContent: container ? container.innerHTML.length > 100 : false
            };
        });
        
        console.log('🔗 Direct navigation result:', directNavResult);
        
        // Test 6: Test page refresh scenario
        console.log('🔄 Test 6: Testing page refresh scenario...');
        await page.reload({ waitUntil: 'networkidle0' });
        
        // Should redirect to login, then navigate back
        await page.waitForSelector('#login-email', { timeout: 5000 });
        await page.type('#login-email', 'mukhsin9@gmail.com');
        await page.type('#login-password', 'password123');
        await page.click('button[type="submit"]');
        
        await page.waitForSelector('.app-container', { timeout: 15000 });
        
        // Navigate to rencana strategis again
        await page.click('.menu-item[data-page="rencana-strategis"]');
        await page.waitForSelector('#rencana-strategis.active', { timeout: 5000 });
        
        await page.waitForTimeout(2000);
        
        const refreshResult = await page.evaluate(() => {
            const container = document.getElementById('rencana-strategis-content');
            return {
                containerExists: !!container,
                containerHasContent: container ? container.innerHTML.length > 100 : false
            };
        });
        
        console.log('🔄 Refresh test result:', refreshResult);
        
        // Summary
        console.log('\n📊 TEST SUMMARY:');
        console.log('================');
        console.log(`✅ Menu navigation: ${containerExists.exists ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Container creation: ${containerExists.exists ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Content loading: ${containerExists.hasContent ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Error handling: ${errorMessages.length === 0 ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Direct navigation: ${directNavResult.containerExists ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Refresh handling: ${refreshResult.containerExists ? 'PASS' : 'FAIL'}`);
        
        const allTestsPassed = containerExists.exists && 
                              containerExists.hasContent && 
                              errorMessages.length === 0 && 
                              directNavResult.containerExists && 
                              refreshResult.containerExists;
        
        if (allTestsPassed) {
            console.log('\n🎉 ALL TESTS PASSED! Container fix is working correctly.');
        } else {
            console.log('\n⚠️ Some tests failed. Please check the issues above.');
        }
        
        // Take screenshot for verification
        await page.screenshot({ 
            path: 'rencana-strategis-container-fix-test.png', 
            fullPage: true 
        });
        
        console.log('📸 Screenshot saved as rencana-strategis-container-fix-test.png');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testRencanaStrategisContainerFix()
        .then(() => {
            console.log('✅ Test completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testRencanaStrategisContainerFix };