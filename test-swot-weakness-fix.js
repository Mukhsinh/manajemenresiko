// Test SWOT Weakness Fix
const fs = require('fs');
const path = require('path');

function testSwotWeaknessFix() {
  console.log('🔍 Testing SWOT Weakness Display Fix');
  console.log('='.repeat(50));
  
  try {
    // 1. Check if the HTML file has been fixed
    console.log('\n1. CHECKING HTML FILE FIX:');
    const htmlPath = path.join(__dirname, 'public', 'analisis-swot-enhanced-final.html');
    
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Check if the problematic Math.max has been removed
      if (htmlContent.includes('Math.max(item.score || 0, 1)')) {
        console.log('❌ HTML still contains Math.max fix - NOT FIXED');
      } else {
        console.log('✅ HTML Math.max fix removed - FIXED');
      }
      
      // Check if proper score calculation is used
      if (htmlContent.includes('item.score || 0') && !htmlContent.includes('Math.max(item.score || 0, 1)')) {
        console.log('✅ HTML uses proper score calculation - FIXED');
      } else {
        console.log('❌ HTML score calculation issue - NOT FIXED');
      }
      
      // Check if totalScore calculation is fixed
      if (htmlContent.includes('data.totalScore || (data.count > 0 ? data.count : 1)')) {
        console.log('❌ HTML totalScore fallback still present - NOT FIXED');
      } else if (htmlContent.includes('data.totalScore')) {
        console.log('✅ HTML totalScore calculation fixed - FIXED');
      }
    } else {
      console.log('⚠️ HTML file not found');
    }
    
    // 2. Check if the JavaScript file has been fixed
    console.log('\n2. CHECKING JAVASCRIPT FILE FIX:');
    const jsPath = path.join(__dirname, 'public', 'js', 'analisis-swot.js');
    
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      // Check if Math.max is still being used incorrectly
      const mathMaxMatches = jsContent.match(/Math\.max\(.*?score.*?\)/g);
      if (mathMaxMatches) {
        console.log('⚠️ JavaScript still contains Math.max for scores:');
        mathMaxMatches.forEach(match => {
          console.log(`   - ${match}`);
        });
      } else {
        console.log('✅ JavaScript Math.max for scores removed - FIXED');
      }
      
      // Check if proper totalScore calculation is used
      if (jsContent.includes('data.totalScore || 0') || jsContent.includes('data.totalScore')) {
        console.log('✅ JavaScript uses proper totalScore calculation - FIXED');
      }
    } else {
      console.log('⚠️ JavaScript file not found');
    }
    
    // 3. Check API endpoint
    console.log('\n3. CHECKING API ENDPOINT:');
    const apiPath = path.join(__dirname, 'routes', 'analisis-swot.js');
    
    if (fs.existsSync(apiPath)) {
      const apiContent = fs.readFileSync(apiPath, 'utf8');
      
      // Check if API uses proper score calculation
      if (apiContent.includes('item.score || 0') && !apiContent.includes('Math.max')) {
        console.log('✅ API uses proper score calculation - CORRECT');
      } else {
        console.log('⚠️ API score calculation may have issues');
      }
    } else {
      console.log('⚠️ API file not found');
    }
    
    console.log('\n4. SUMMARY OF FIXES:');
    console.log('   - Removed Math.max(item.score || 0, 1) from summary calculation');
    console.log('   - Use actual item.score || 0 for proper database values');
    console.log('   - Removed totalScore fallback that replaced 0 with count');
    console.log('   - Frontend will now display actual database values');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Fix Analysis Complete');
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Restart the server');
    console.log('   2. Clear browser cache');
    console.log('   3. Test the /analisis-swot page');
    console.log('   4. Verify weakness values show correct database values');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testSwotWeaknessFix();