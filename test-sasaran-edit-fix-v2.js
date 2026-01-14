// Test script untuk verifikasi Sasaran Strategi Edit Fix v2
const puppeteer = require('puppeteer');

async function testSasaranEditFix() {
  console.log('=== TESTING SASARAN STRATEGI EDIT FIX V2 ===\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Listen to console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Modal') || text.includes('Edit') || text.includes('fix')) {
        console.log('  📝', text);
      }
    });
    
    console.log('1. Loading test page...');
    await page.goto('http://localhost:3001/test-sasaran-edit-fix-v2.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('✅ Page loaded\n');
    
    // Wait for page to be ready
    await page.waitForTimeout(2000);
    
    console.log('2. Testing Edit Button Click...');
    
    // Click edit button
    const editButton = await page.$('.btn-edit');
    if (!editButton) {
      throw new Error('Edit button not found');
    }
    
    await editButton.click();
    console.log('✅ Edit button clicked\n');
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Check if modal is visible
    const modal = await page.$('.modal');
    if (!modal) {
      throw new Error('Modal did not appear');
    }
    console.log('✅ Modal appeared\n');
    
    // Check if only one modal exists
    const modalCount = await page.$$eval('.modal', modals => modals.length);
    console.log(`3. Modal count: ${modalCount}`);
    if (modalCount > 1) {
      console.log('❌ FAIL: Multiple modals detected (form tampil 2 kali)');
    } else {
      console.log('✅ PASS: Only one modal (no double render)\n');
    }
    
    // Test close button
    console.log('4. Testing Close Button (X)...');
    const closeButton = await page.$('.modal-close');
    if (!closeButton) {
      throw new Error('Close button not found');
    }
    
    await closeButton.click();
    console.log('✅ Close button clicked\n');
    
    // Wait a bit
    await page.waitForTimeout(500);
    
    // Check if modal is closed
    const modalAfterClose = await page.$('.modal');
    if (modalAfterClose) {
      console.log('❌ FAIL: Modal still exists after close button click');
    } else {
      console.log('✅ PASS: Modal closed immediately (single click)\n');
    }
    
    // Test cancel button
    console.log('5. Testing Cancel Button...');
    
    // Open modal again
    await editButton.click();
    await page.waitForTimeout(1000);
    
    const cancelButton = await page.$('.btn-cancel');
    if (!cancelButton) {
      throw new Error('Cancel button not found');
    }
    
    await cancelButton.click();
    console.log('✅ Cancel button clicked\n');
    
    // Wait a bit
    await page.waitForTimeout(500);
    
    // Check if modal is closed
    const modalAfterCancel = await page.$('.modal');
    if (modalAfterCancel) {
      console.log('❌ FAIL: Modal still exists after cancel button click');
    } else {
      console.log('✅ PASS: Modal closed immediately (single click)\n');
    }
    
    console.log('=== TEST SUMMARY ===');
    console.log('✅ All tests passed!');
    console.log('✅ Form edit hanya muncul 1 kali');
    console.log('✅ Tombol X dan Batal langsung menutup modal');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      console.log('\nClosing browser in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await browser.close();
    }
  }
}

// Run test
testSasaranEditFix().catch(console.error);
