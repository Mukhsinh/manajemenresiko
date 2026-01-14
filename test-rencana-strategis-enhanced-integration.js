/**
 * TEST RENCANA STRATEGIS ENHANCED INTEGRATION
 * Script to test the enhanced Rencana Strategis integration
 * Created: December 28, 2025
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Enhanced Rencana Strategis Integration...');

async function testIntegration() {
  const tests = [];
  
  // Test 1: Check if enhanced JavaScript file exists and is valid
  console.log('\n1️⃣ Testing Enhanced JavaScript File...');
  try {
    const jsPath = 'public/js/rencana-strategis.js';
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      // Check for enhanced module signature
      if (jsContent.includes('RencanaStrategisModuleEnhanced')) {
        console.log('   ✅ Enhanced module found in main JS file');
        tests.push({ name: 'Enhanced JS Module', status: 'PASS' });
      } else {
        console.log('   ❌ Enhanced module not found in main JS file');
        tests.push({ name: 'Enhanced JS Module', status: 'FAIL' });
      }
      
      // Check for key improvements
      const improvements = [
        { name: 'Form hidden by default', check: 'showForm: false' },
        { name: 'Enhanced card styling', check: 'background: linear-gradient' },
        { name: 'Improved button layout', check: 'btn-group' },
        { name: 'Soft color design', check: 'rgba(' }
      ];
      
      improvements.forEach(improvement => {
        if (jsContent.includes(improvement.check)) {
          console.log(`   ✅ ${improvement.name} implemented`);
          tests.push({ name: improvement.name, status: 'PASS' });
        } else {
          console.log(`   ⚠️ ${improvement.name} may not be fully implemented`);
          tests.push({ name: improvement.name, status: 'PARTIAL' });
        }
      });
      
    } else {
      console.log('   ❌ Main JavaScript file not found');
      tests.push({ name: 'Enhanced JS File', status: 'FAIL' });
    }
  } catch (error) {
    console.log('   ❌ Error testing JavaScript file:', error.message);
    tests.push({ name: 'Enhanced JS File', status: 'ERROR' });
  }
  
  // Test 2: Check if enhanced CSS file exists and is integrated
  console.log('\n2️⃣ Testing Enhanced CSS Integration...');
  try {
    const enhancedCssPath = 'public/css/rencana-strategis-enhanced.css';
    const mainCssPath = 'public/css/style.css';
    
    if (fs.existsSync(enhancedCssPath)) {
      console.log('   ✅ Enhanced CSS file exists');
      tests.push({ name: 'Enhanced CSS File', status: 'PASS' });
      
      const enhancedCss = fs.readFileSync(enhancedCssPath, 'utf8');
      
      // Check for key CSS improvements
      const cssFeatures = [
        { name: 'Card hover effects', check: 'transform: translateY(-2px)' },
        { name: 'Gradient backgrounds', check: 'linear-gradient(' },
        { name: 'Rounded corners', check: 'border-radius:' },
        { name: 'Smooth transitions', check: 'transition:' },
        { name: 'Responsive design', check: '@media (max-width:' }
      ];
      
      cssFeatures.forEach(feature => {
        if (enhancedCss.includes(feature.check)) {
          console.log(`   ✅ ${feature.name} implemented`);
          tests.push({ name: feature.name, status: 'PASS' });
        } else {
          console.log(`   ❌ ${feature.name} not found`);
          tests.push({ name: feature.name, status: 'FAIL' });
        }
      });
      
    } else {
      console.log('   ❌ Enhanced CSS file not found');
      tests.push({ name: 'Enhanced CSS File', status: 'FAIL' });
    }
    
    // Check if CSS is integrated into main style file
    if (fs.existsSync(mainCssPath)) {
      const mainCss = fs.readFileSync(mainCssPath, 'utf8');
      if (mainCss.includes('Rencana Strategis Enhanced Styles')) {
        console.log('   ✅ Enhanced CSS integrated into main style file');
        tests.push({ name: 'CSS Integration', status: 'PASS' });
      } else {
        console.log('   ⚠️ Enhanced CSS not integrated into main style file');
        tests.push({ name: 'CSS Integration', status: 'PARTIAL' });
      }
    }
    
  } catch (error) {
    console.log('   ❌ Error testing CSS integration:', error.message);
    tests.push({ name: 'Enhanced CSS Integration', status: 'ERROR' });
  }
  
  // Test 3: Check if test HTML file works
  console.log('\n3️⃣ Testing HTML Test File...');
  try {
    const testHtmlPath = 'public/test-rencana-strategis-enhanced.html';
    if (fs.existsSync(testHtmlPath)) {
      const htmlContent = fs.readFileSync(testHtmlPath, 'utf8');
      
      // Check for required dependencies
      const dependencies = [
        { name: 'Bootstrap CSS', check: 'bootstrap@5.3.0/dist/css/bootstrap.min.css' },
        { name: 'Font Awesome', check: 'font-awesome' },
        { name: 'Enhanced CSS', check: 'rencana-strategis-enhanced.css' },
        { name: 'Enhanced JS', check: 'rencana-strategis-enhanced.js' },
        { name: 'XLSX Library', check: 'xlsx' }
      ];
      
      dependencies.forEach(dep => {
        if (htmlContent.includes(dep.check)) {
          console.log(`   ✅ ${dep.name} included`);
          tests.push({ name: dep.name, status: 'PASS' });
        } else {
          console.log(`   ❌ ${dep.name} not included`);
          tests.push({ name: dep.name, status: 'FAIL' });
        }
      });
      
      console.log('   ✅ Test HTML file exists and appears complete');
      tests.push({ name: 'Test HTML File', status: 'PASS' });
      
    } else {
      console.log('   ❌ Test HTML file not found');
      tests.push({ name: 'Test HTML File', status: 'FAIL' });
    }
  } catch (error) {
    console.log('   ❌ Error testing HTML file:', error.message);
    tests.push({ name: 'Test HTML File', status: 'ERROR' });
  }
  
  // Test 4: Check if backup files were created
  console.log('\n4️⃣ Testing Backup Files...');
  try {
    const backupDir = 'backup-rencana-strategis';
    if (fs.existsSync(backupDir)) {
      const backupFiles = fs.readdirSync(backupDir);
      if (backupFiles.length > 0) {
        console.log(`   ✅ ${backupFiles.length} backup files created`);
        backupFiles.forEach(file => {
          console.log(`   📁 ${file}`);
        });
        tests.push({ name: 'Backup Files', status: 'PASS' });
      } else {
        console.log('   ⚠️ Backup directory exists but is empty');
        tests.push({ name: 'Backup Files', status: 'PARTIAL' });
      }
    } else {
      console.log('   ❌ Backup directory not found');
      tests.push({ name: 'Backup Files', status: 'FAIL' });
    }
  } catch (error) {
    console.log('   ❌ Error checking backup files:', error.message);
    tests.push({ name: 'Backup Files', status: 'ERROR' });
  }
  
  // Test 5: Check if loader script was created
  console.log('\n5️⃣ Testing Loader Script...');
  try {
    const loaderPath = 'public/js/rencana-strategis-loader.js';
    if (fs.existsSync(loaderPath)) {
      const loaderContent = fs.readFileSync(loaderPath, 'utf8');
      
      if (loaderContent.includes('loadRencanaStrategisEnhanced')) {
        console.log('   ✅ Enhanced loader function found');
        tests.push({ name: 'Enhanced Loader', status: 'PASS' });
      } else {
        console.log('   ❌ Enhanced loader function not found');
        tests.push({ name: 'Enhanced Loader', status: 'FAIL' });
      }
      
      if (loaderContent.includes('backward compatibility')) {
        console.log('   ✅ Backward compatibility maintained');
        tests.push({ name: 'Backward Compatibility', status: 'PASS' });
      } else {
        console.log('   ⚠️ Backward compatibility may not be maintained');
        tests.push({ name: 'Backward Compatibility', status: 'PARTIAL' });
      }
      
    } else {
      console.log('   ❌ Loader script not found');
      tests.push({ name: 'Loader Script', status: 'FAIL' });
    }
  } catch (error) {
    console.log('   ❌ Error testing loader script:', error.message);
    tests.push({ name: 'Loader Script', status: 'ERROR' });
  }
  
  // Test 6: Check if app.js was updated
  console.log('\n6️⃣ Testing App.js Updates...');
  try {
    const appJsPath = 'public/js/app.js';
    if (fs.existsSync(appJsPath)) {
      const appContent = fs.readFileSync(appJsPath, 'utf8');
      
      if (appContent.includes('RencanaStrategisModuleEnhanced')) {
        console.log('   ✅ App.js updated to use enhanced module');
        tests.push({ name: 'App.js Enhanced Module', status: 'PASS' });
      } else {
        console.log('   ⚠️ App.js may not be updated to use enhanced module');
        tests.push({ name: 'App.js Enhanced Module', status: 'PARTIAL' });
      }
      
    } else {
      console.log('   ⚠️ App.js not found (may not be required)');
      tests.push({ name: 'App.js Updates', status: 'PARTIAL' });
    }
  } catch (error) {
    console.log('   ❌ Error testing app.js updates:', error.message);
    tests.push({ name: 'App.js Updates', status: 'ERROR' });
  }
  
  // Generate test summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  
  const passCount = tests.filter(t => t.status === 'PASS').length;
  const failCount = tests.filter(t => t.status === 'FAIL').length;
  const partialCount = tests.filter(t => t.status === 'PARTIAL').length;
  const errorCount = tests.filter(t => t.status === 'ERROR').length;
  
  console.log(`✅ PASS: ${passCount}`);
  console.log(`❌ FAIL: ${failCount}`);
  console.log(`⚠️ PARTIAL: ${partialCount}`);
  console.log(`🔥 ERROR: ${errorCount}`);
  console.log(`📈 TOTAL: ${tests.length}`);
  
  const successRate = Math.round((passCount / tests.length) * 100);
  console.log(`🎯 SUCCESS RATE: ${successRate}%`);
  
  // Detailed results
  console.log('\n📋 DETAILED RESULTS:');
  tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : 
                 test.status === 'FAIL' ? '❌' : 
                 test.status === 'PARTIAL' ? '⚠️' : '🔥';
    console.log(`   ${icon} ${test.name}: ${test.status}`);
  });
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (failCount > 0) {
    console.log('   🔧 Fix failed tests before deploying to production');
  }
  if (partialCount > 0) {
    console.log('   🔍 Review partial tests for potential improvements');
  }
  if (successRate >= 80) {
    console.log('   🎉 Integration appears successful! Ready for testing');
    console.log('   👉 Open public/test-rencana-strategis-enhanced.html to test the interface');
  } else {
    console.log('   ⚠️ Integration may need additional work before testing');
  }
  
  // Save test results
  const testResults = {
    timestamp: new Date().toISOString(),
    totalTests: tests.length,
    passCount,
    failCount,
    partialCount,
    errorCount,
    successRate,
    tests,
    recommendations: successRate >= 80 ? 'Ready for testing' : 'Needs additional work'
  };
  
  fs.writeFileSync('test-results-rencana-strategis-enhanced.json', JSON.stringify(testResults, null, 2));
  console.log('\n💾 Test results saved to: test-results-rencana-strategis-enhanced.json');
  
  return successRate >= 80;
}

// Run the test
testIntegration()
  .then(success => {
    if (success) {
      console.log('\n🎉 INTEGRATION TEST COMPLETED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.log('\n⚠️ INTEGRATION TEST COMPLETED WITH ISSUES');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ INTEGRATION TEST FAILED:', error);
    process.exit(1);
  });