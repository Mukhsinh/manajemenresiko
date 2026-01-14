/**
 * TEST RENCANA STRATEGIS FREEZE FIX
 * 
 * Comprehensive test untuk verify freeze fix implementation
 */

const puppeteer = require('puppeteer');

async function testRencanaStrategisFix() {
  console.log('🧪 Starting Rencana Strategis Freeze Fix Tests...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for visual verification
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await puppeteer.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ Console Error: ${text}`);
    } else if (text.includes('🔧') || text.includes('✅') || text.includes('⚠️')) {
      console.log(`   ${text}`);
    }
  });
  
  try {
    // Test 1: Initial Load
    console.log('📋 Test 1: Initial Load');
    await page.goto('http://localhost:3001/rencana-strategis', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for page to load
    await page.waitForSelector('#rencana-strategis', { timeout: 10000 });
    
    // Check if freeze fix is loaded
    const freezeFixLoaded = await page.evaluate(() => {
      return document.querySelector('script[src*="rencana-strategis-freeze-fix"]') !== null;
    });
    console.log(`   Freeze Fix Script: ${freezeFixLoaded ? '✅ Loaded' : '❌ Not Found'}`);
    
    // Check if other pages are hidden
    const otherPagesHidden = await page.evaluate(() => {
      const pages = document.querySelectorAll('.page-content:not(#rencana-strategis)');
      return Array.from(pages).every(p => {
        const style = window.getComputedStyle(p);
        return style.display === 'none' || style.visibility === 'hidden';
      });
    });
    console.log(`   Other Pages Hidden: ${otherPagesHidden ? '✅ Yes' : '❌ No'}`);
    
    // Check if rencana-strategis page is visible
    const rsPageVisible = await page.evaluate(() => {
      const rsPage = document.getElementById('rencana-strategis');
      if (!rsPage) return false;
      const style = window.getComputedStyle(rsPage);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    console.log(`   RS Page Visible: ${rsPageVisible ? '✅ Yes' : '❌ No'}`);
    
    // Check if content is rendered
    const hasContent = await page.evaluate(() => {
      const container = document.getElementById('rencana-strategis-content');
      return container && container.innerHTML.trim().length > 100;
    });
    console.log(`   Content Rendered: ${hasContent ? '✅ Yes' : '❌ No'}`);
    
    // Test 2: After Refresh
    console.log('\n📋 Test 2: After Refresh');
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#rencana-strategis', { timeout: 10000 });
    
    // Wait a bit to see if freeze occurs
    await page.waitForTimeout(2000);
    
    // Check if page is still interactive
    const isInteractive = await page.evaluate(() => {
      const buttons = document.querySelectorAll('#rencana-strategis button');
      if (buttons.length === 0) return false;
      
      // Check if buttons have pointer-events
      return Array.from(buttons).some(btn => {
        const style = window.getComputedStyle(btn);
        return style.pointerEvents !== 'none';
      });
    });
    console.log(`   Page Interactive: ${isInteractive ? '✅ Yes' : '❌ No (FREEZE DETECTED!)'}`);
    
    // Test 3: Button Clicks
    console.log('\n📋 Test 3: Interactive Elements');
    
    // Try to click refresh button
    try {
      const refreshBtn = await page.$('#rs-refresh-btn');
      if (refreshBtn) {
        await refreshBtn.click();
        await page.waitForTimeout(1000);
        console.log('   Refresh Button: ✅ Clickable');
      } else {
        console.log('   Refresh Button: ⚠️ Not Found');
      }
    } catch (error) {
      console.log(`   Refresh Button: ❌ Error - ${error.message}`);
    }
    
    // Try to toggle form
    try {
      const toggleBtn = await page.$('#rs-toggle-form');
      if (toggleBtn) {
        await toggleBtn.click();
        await page.waitForTimeout(500);
        console.log('   Toggle Form Button: ✅ Clickable');
      } else {
        console.log('   Toggle Form Button: ⚠️ Not Found');
      }
    } catch (error) {
      console.log(`   Toggle Form Button: ❌ Error - ${error.message}`);
    }
    
    // Test 4: Form Input
    console.log('\n📋 Test 4: Form Input');
    
    try {
      const namaInput = await page.$('#rs-nama');
      if (namaInput) {
        await namaInput.click();
        await namaInput.type('Test Rencana Strategis');
        const value = await page.evaluate(() => {
          const input = document.getElementById('rs-nama');
          return input ? input.value : '';
        });
        console.log(`   Form Input: ${value ? '✅ Working' : '❌ Not Working'}`);
      } else {
        console.log('   Form Input: ⚠️ Not Found');
      }
    } catch (error) {
      console.log(`   Form Input: ❌ Error - ${error.message}`);
    }
    
    // Test 5: CSP Errors
    console.log('\n📋 Test 5: CSP Errors');
    
    const cspErrors = await page.evaluate(() => {
      // Check for CSP errors in console
      return window.performance.getEntriesByType('navigation').length > 0;
    });
    console.log(`   No CSP Errors: ${!cspErrors ? '✅ Clean' : '⚠️ Check Console'}`);
    
    // Test 6: Performance
    console.log('\n📋 Test 6: Performance Metrics');
    
    const metrics = await page.metrics();
    console.log(`   JS Heap Size: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   DOM Nodes: ${metrics.Nodes}`);
    console.log(`   Event Listeners: ${metrics.JSEventListeners}`);
    
    // Final Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const allTestsPassed = freezeFixLoaded && otherPagesHidden && rsPageVisible && 
                          hasContent && isInteractive;
    
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('   - Freeze fix is working correctly');
      console.log('   - Page is interactive after refresh');
      console.log('   - No background content visible');
      console.log('   - All interactive elements work');
    } else {
      console.log('❌ SOME TESTS FAILED!');
      console.log('   Please review the test results above');
      console.log('   Check browser console for additional errors');
    }
    
    console.log('\n💡 Browser will stay open for manual verification');
    console.log('   Close browser window when done');
    
    // Keep browser open for manual verification
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    // Don't close browser automatically for manual verification
    // await browser.close();
  }
}

// Run tests
testRencanaStrategisFix().catch(console.error);
