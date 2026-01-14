const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Test script to verify the rencana-strategis refresh consistency fix
 */
async function testRencanaStrategisRefreshFix() {
  console.log('=== TESTING RENCANA STRATEGIS REFRESH FIX ===');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1366, height: 768 });
    
    console.log('✅ Browser launched');
    
    // Navigate to the application
    const baseUrl = 'http://localhost:3000';
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    
    console.log('✅ Navigated to application');
    
    // Test 1: Check if integration script is loaded
    console.log('\n1. Testing integration script loading...');
    
    const integrationScriptLoaded = await page.evaluate(() => {
      return !!document.querySelector('script[src*="rencana-strategis-integration.js"]');
    });
    
    if (integrationScriptLoaded) {
      console.log('✅ Integration script found in DOM');
    } else {
      console.log('⚠️ Integration script not found in DOM');
    }
    
    // Test 2: Check if state manager is available
    console.log('\n2. Testing state manager availability...');
    
    const stateManagerAvailable = await page.evaluate(() => {
      return typeof window.RencanaStrategisStateManager === 'function';
    });
    
    if (stateManagerAvailable) {
      console.log('✅ RencanaStrategisStateManager is available');
    } else {
      console.log('⚠️ RencanaStrategisStateManager not available');
    }
    
    // Test 3: Navigate to rencana-strategis page
    console.log('\n3. Testing navigation to rencana-strategis...');
    
    // Wait for authentication (if needed)
    await page.waitForTimeout(2000);
    
    // Try to navigate to rencana-strategis
    await page.evaluate(() => {
      if (window.navigateToPage) {
        window.navigateToPage('rencana-strategis');
      } else if (window.appRouter) {
        window.appRouter.navigate('/rencana-strategis');
      }
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if rencana-strategis page is active
    const rencanaPageActive = await page.evaluate(() => {
      const rencanaPage = document.getElementById('rencana-strategis');
      return rencanaPage && rencanaPage.classList.contains('active');
    });
    
    if (rencanaPageActive) {
      console.log('✅ Rencana Strategis page is active');
    } else {
      console.log('⚠️ Rencana Strategis page not active');
    }
    
    // Test 4: Check initial display model
    console.log('\n4. Testing initial display model...');
    
    const initialDisplayModel = await page.evaluate(() => {
      const formSection = document.getElementById('form-section');
      const tableSection = document.getElementById('table-section');
      
      return {
        formVisible: formSection ? formSection.style.display !== 'none' : false,
        tableVisible: tableSection ? tableSection.style.display !== 'none' : false,
        formExists: !!formSection,
        tableExists: !!tableSection
      };
    });
    
    console.log('Initial display model:', initialDisplayModel);
    
    // Test 5: Simulate page refresh and check consistency
    console.log('\n5. Testing page refresh consistency...');
    
    // Save current state before refresh
    const preRefreshState = await page.evaluate(() => {
      if (window.RencanaStrategisStateManager) {
        const stateManager = new window.RencanaStrategisStateManager();
        return stateManager.getCurrentDisplayModel();
      }
      return null;
    });
    
    console.log('Pre-refresh state:', preRefreshState);
    
    // Perform page refresh
    await page.reload({ waitUntil: 'networkidle2' });
    
    // Wait for page to fully load after refresh
    await page.waitForTimeout(5000);
    
    // Navigate back to rencana-strategis after refresh
    await page.evaluate(() => {
      if (window.navigateToPage) {
        window.navigateToPage('rencana-strategis');
      } else if (window.appRouter) {
        window.appRouter.navigate('/rencana-strategis');
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Check post-refresh display model
    const postRefreshDisplayModel = await page.evaluate(() => {
      const formSection = document.getElementById('form-section');
      const tableSection = document.getElementById('table-section');
      
      return {
        formVisible: formSection ? formSection.style.display !== 'none' : false,
        tableVisible: tableSection ? tableSection.style.display !== 'none' : false,
        formExists: !!formSection,
        tableExists: !!tableSection
      };
    });
    
    console.log('Post-refresh display model:', postRefreshDisplayModel);
    
    // Test 6: Check if state was restored
    console.log('\n6. Testing state restoration...');
    
    const stateRestored = await page.evaluate(() => {
      if (window.RencanaStrategisStateManager) {
        const stateManager = new window.RencanaStrategisStateManager();
        const restoredState = stateManager.restoreState();
        return !!restoredState;
      }
      return false;
    });
    
    if (stateRestored) {
      console.log('✅ State restoration mechanism working');
    } else {
      console.log('⚠️ State restoration not working');
    }
    
    // Test 7: Check consistency between pre and post refresh
    console.log('\n7. Testing display model consistency...');
    
    const isConsistent = JSON.stringify(initialDisplayModel) === JSON.stringify(postRefreshDisplayModel);
    
    if (isConsistent) {
      console.log('✅ Display model is consistent after refresh');
    } else {
      console.log('⚠️ Display model changed after refresh');
      console.log('Differences:', {
        initial: initialDisplayModel,
        postRefresh: postRefreshDisplayModel
      });
    }
    
    // Test 8: Test form functionality after refresh
    console.log('\n8. Testing form functionality after refresh...');
    
    const formFunctional = await page.evaluate(() => {
      const form = document.getElementById('rs-form');
      const kodeInput = document.getElementById('rs-kode');
      const namaInput = document.getElementById('rs-nama');
      
      return {
        formExists: !!form,
        kodeInputExists: !!kodeInput,
        namaInputExists: !!namaInput,
        kodeValue: kodeInput ? kodeInput.value : null
      };
    });
    
    console.log('Form functionality check:', formFunctional);
    
    if (formFunctional.formExists && formFunctional.kodeInputExists && formFunctional.namaInputExists) {
      console.log('✅ Form is functional after refresh');
    } else {
      console.log('⚠️ Form functionality issues after refresh');
    }
    
    // Test 9: Test table functionality after refresh
    console.log('\n9. Testing table functionality after refresh...');
    
    const tableFunctional = await page.evaluate(() => {
      const table = document.querySelector('.data-table');
      const tbody = table ? table.querySelector('tbody') : null;
      const rows = tbody ? tbody.querySelectorAll('tr') : [];
      
      return {
        tableExists: !!table,
        tbodyExists: !!tbody,
        rowCount: rows.length,
        hasData: rows.length > 0 && !rows[0].querySelector('.table-empty')
      };
    });
    
    console.log('Table functionality check:', tableFunctional);
    
    if (tableFunctional.tableExists && tableFunctional.tbodyExists) {
      console.log('✅ Table is functional after refresh');
    } else {
      console.log('⚠️ Table functionality issues after refresh');
    }
    
    // Generate test report
    const testResults = {
      integrationScriptLoaded,
      stateManagerAvailable,
      rencanaPageActive,
      initialDisplayModel,
      postRefreshDisplayModel,
      stateRestored,
      isConsistent,
      formFunctional,
      tableFunctional
    };
    
    console.log('\n=== TEST RESULTS SUMMARY ===');
    console.log('Integration Script Loaded:', integrationScriptLoaded ? '✅' : '❌');
    console.log('State Manager Available:', stateManagerAvailable ? '✅' : '❌');
    console.log('Page Navigation Working:', rencanaPageActive ? '✅' : '❌');
    console.log('Display Model Consistent:', isConsistent ? '✅' : '❌');
    console.log('State Restoration Working:', stateRestored ? '✅' : '❌');
    console.log('Form Functional After Refresh:', formFunctional.formExists ? '✅' : '❌');
    console.log('Table Functional After Refresh:', tableFunctional.tableExists ? '✅' : '❌');
    
    const overallSuccess = integrationScriptLoaded && 
                          stateManagerAvailable && 
                          rencanaPageActive && 
                          isConsistent && 
                          formFunctional.formExists && 
                          tableFunctional.tableExists;
    
    console.log('\nOVERALL TEST RESULT:', overallSuccess ? '✅ PASSED' : '❌ FAILED');
    
    return {
      success: overallSuccess,
      results: testResults
    };
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRencanaStrategisRefreshFix()
    .then(result => {
      console.log('\n=== TEST EXECUTION COMPLETE ===');
      console.log('Final Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testRencanaStrategisRefreshFix };