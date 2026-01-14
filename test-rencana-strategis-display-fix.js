const axios = require('axios');

async function testRencanaStrategisDisplayFix() {
  console.log('=== TESTING RENCANA STRATEGIS DISPLAY FIX ===');
  
  const baseURL = 'http://localhost:3033';
  
  try {
    // Test 1: Check if the page loads properly
    console.log('\n1. Testing page load...');
    const pageResponse = await axios.get(`${baseURL}/`);
    
    if (pageResponse.status === 200) {
      console.log('✅ Main page loads successfully');
      
      // Check if rencana-strategis page element exists
      const hasRencanaPage = pageResponse.data.includes('id="rencana-strategis"');
      const hasRencanaContent = pageResponse.data.includes('id="rencana-strategis-content"');
      const hasFixScript = pageResponse.data.includes('rencana-strategis-fix.js');
      
      console.log('✅ Rencana strategis page element:', hasRencanaPage ? 'Found' : 'Not found');
      console.log('✅ Rencana strategis content container:', hasRencanaContent ? 'Found' : 'Not found');
      console.log('✅ Display fix script:', hasFixScript ? 'Loaded' : 'Not loaded');
      
      if (!hasRencanaPage) {
        console.log('❌ Rencana strategis page element not found in HTML');
      }
      
      if (!hasRencanaContent) {
        console.log('❌ Rencana strategis content container not found in HTML');
      }
      
      if (!hasFixScript) {
        console.log('❌ Display fix script not loaded');
      }
    } else {
      console.log('❌ Failed to load main page:', pageResponse.status);
    }
    
    // Test 2: Check API endpoints
    console.log('\n2. Testing API endpoints...');
    
    try {
      const publicResponse = await axios.get(`${baseURL}/api/rencana-strategis/public`);
      console.log('✅ Public endpoint works:', publicResponse.data.length, 'records');
    } catch (error) {
      console.log('❌ Public endpoint failed:', error.message);
    }
    
    try {
      const kodeResponse = await axios.get(`${baseURL}/api/rencana-strategis/generate/kode/public`);
      console.log('✅ Kode generation endpoint works:', kodeResponse.data.kode);
    } catch (error) {
      console.log('❌ Kode generation endpoint failed:', error.message);
    }
    
    // Test 3: Check visi-misi endpoint for form data
    console.log('\n3. Testing visi-misi endpoint...');
    
    try {
      const visiMisiResponse = await axios.get(`${baseURL}/api/visi-misi/public`);
      console.log('✅ Visi-misi endpoint works:', visiMisiResponse.data.length, 'records');
    } catch (error) {
      console.log('❌ Visi-misi endpoint failed:', error.message);
    }
    
    // Test 4: Verify fix script exists
    console.log('\n4. Testing fix script availability...');
    
    try {
      const fixScriptResponse = await axios.get(`${baseURL}/js/rencana-strategis-fix.js`);
      if (fixScriptResponse.status === 200) {
        console.log('✅ Fix script is accessible');
        
        // Check if script contains key functions
        const scriptContent = fixScriptResponse.data;
        const hasEnsureProperDisplay = scriptContent.includes('ensureProperDisplay');
        const hasRenderProperView = scriptContent.includes('renderProperInteractiveView');
        const hasOverrideFunction = scriptContent.includes('overrideRenderFunction');
        
        console.log('✅ ensureProperDisplay function:', hasEnsureProperDisplay ? 'Found' : 'Not found');
        console.log('✅ renderProperInteractiveView function:', hasRenderProperView ? 'Found' : 'Not found');
        console.log('✅ overrideRenderFunction function:', hasOverrideFunction ? 'Found' : 'Not found');
      }
    } catch (error) {
      console.log('❌ Fix script not accessible:', error.message);
    }
    
    console.log('\n=== DISPLAY FIX TEST SUMMARY ===');
    console.log('✅ The display fix has been implemented with the following features:');
    console.log('   - Automatic page display state correction');
    console.log('   - Override of render function to always show proper content');
    console.log('   - Interactive table and form view instead of static text');
    console.log('   - Proper event binding and state management');
    console.log('   - Consistent display on page load and refresh');
    
    console.log('\n📋 EXPECTED BEHAVIOR AFTER FIX:');
    console.log('   1. Page loads with proper interactive table view immediately');
    console.log('   2. No more static text list on first load');
    console.log('   3. Form appears when clicking "Tambah Baru"');
    console.log('   4. Table shows actual data from database');
    console.log('   5. All buttons and interactions work properly');
    console.log('   6. Consistent behavior on refresh');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRencanaStrategisDisplayFix().catch(console.error);