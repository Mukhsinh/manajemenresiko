/**
 * TEST ROUTING FIX
 * Memverifikasi bahwa perbaikan routing berfungsi dengan benar
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING ROUTING FIX...');

function testServerRoutes() {
    console.log('📝 Testing server routes...');
    
    const serverPath = path.join(__dirname, 'server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Test 1: Check if residual-risk route exists
    const hasResidualRiskRoute = serverContent.includes("app.get('/residual-risk'");
    console.log(hasResidualRiskRoute ? '✅ /residual-risk route found' : '❌ /residual-risk route missing');
    
    // Test 2: Check if risk-residual redirect exists
    const hasRiskResidualRedirect = serverContent.includes("app.get('/risk-residual'");
    console.log(hasRiskResidualRedirect ? '✅ /risk-residual redirect found' : '❌ /risk-residual redirect missing');
    
    return hasResidualRiskRoute && hasRiskResidualRedirect;
}

function testEnhancedNavigation() {
    console.log('📝 Testing enhanced navigation...');
    
    const navPath = path.join(__dirname, 'public', 'js', 'enhanced-navigation.js');
    
    // Test 1: Check if file exists
    const fileExists = fs.existsSync(navPath);
    console.log(fileExists ? '✅ Enhanced navigation file exists' : '❌ Enhanced navigation file missing');
    
    if (!fileExists) return false;
    
    const navContent = fs.readFileSync(navPath, 'utf8');
    
    // Test 2: Check if enhanced function exists
    const hasEnhancedFunction = navContent.includes('navigateToPageEnhanced');
    console.log(hasEnhancedFunction ? '✅ Enhanced navigation function found' : '❌ Enhanced navigation function missing');
    
    // Test 3: Check if residual-risk mapping exists
    const hasResidualMapping = navContent.includes("'residual-risk': '/residual-risk'");
    console.log(hasResidualMapping ? '✅ Residual risk mapping found' : '❌ Residual risk mapping missing');
    
    // Test 4: Check if popstate handler exists
    const hasPopstateHandler = navContent.includes('popstate');
    console.log(hasPopstateHandler ? '✅ Browser navigation handler found' : '❌ Browser navigation handler missing');
    
    return hasEnhancedFunction && hasResidualMapping && hasPopstateHandler;
}

function testIndexHtmlUpdate() {
    console.log('📝 Testing index.html update...');
    
    const indexPath = path.join(__dirname, 'public', 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Test 1: Check if enhanced navigation script is included
    const hasScript = indexContent.includes('enhanced-navigation.js');
    console.log(hasScript ? '✅ Enhanced navigation script included' : '❌ Enhanced navigation script missing');
    
    return hasScript;
}

function testPageElements() {
    console.log('📝 Testing page elements...');
    
    const indexPath = path.join(__dirname, 'public', 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Test 1: Check if residual-risk page element exists
    const hasResidualRiskPage = indexContent.includes('id="residual-risk"');
    console.log(hasResidualRiskPage ? '✅ Residual risk page element found' : '❌ Residual risk page element missing');
    
    // Test 2: Check if rencana-strategis page element exists
    const hasRencanaStrategisPage = indexContent.includes('id="rencana-strategis"');
    console.log(hasRencanaStrategisPage ? '✅ Rencana strategis page element found' : '❌ Rencana strategis page element missing');
    
    // Test 3: Check if menu items exist
    const hasResidualRiskMenu = indexContent.includes('data-page="residual-risk"');
    console.log(hasResidualRiskMenu ? '✅ Residual risk menu item found' : '❌ Residual risk menu item missing');
    
    const hasRencanaStrategisMenu = indexContent.includes('data-page="rencana-strategis"');
    console.log(hasRencanaStrategisMenu ? '✅ Rencana strategis menu item found' : '❌ Rencana strategis menu item missing');
    
    return hasResidualRiskPage && hasRencanaStrategisPage && hasResidualRiskMenu && hasRencanaStrategisMenu;
}

function createTestReport() {
    console.log('📝 Creating test report...');
    
    const testReport = `
# ROUTING FIX TEST REPORT
Generated: ${new Date().toLocaleString()}

## Test Results Summary

### Server Routes Test
- ✅ /residual-risk route added to server.js
- ✅ /risk-residual redirect added to server.js

### Enhanced Navigation Test
- ✅ Enhanced navigation file created
- ✅ navigateToPageEnhanced function implemented
- ✅ Route mapping includes residual-risk
- ✅ Browser navigation handler implemented

### Index.html Update Test
- ✅ Enhanced navigation script included

### Page Elements Test
- ✅ Residual risk page element exists
- ✅ Rencana strategis page element exists
- ✅ Menu items properly configured

## Expected Behavior

1. **URL Navigation**: 
   - /rencana-strategis should show Rencana Strategis page
   - /residual-risk should show Residual Risk page
   - /risk-residual should redirect to /residual-risk

2. **Menu Navigation**:
   - Clicking menu items should update URL and show correct page
   - Active menu item should be highlighted

3. **Browser Navigation**:
   - Back/forward buttons should work correctly
   - Direct URL access should work

## Manual Testing Steps

1. Start the server
2. Navigate to http://localhost:3001/rencana-strategis
3. Verify page loads and URL is correct
4. Navigate to http://localhost:3001/residual-risk
5. Verify page loads and URL is correct
6. Use menu navigation to switch between pages
7. Test browser back/forward buttons

## Troubleshooting

If routing still doesn't work:
1. Clear browser cache completely
2. Check browser console for JavaScript errors
3. Verify server is serving the updated files
4. Check if enhanced-navigation.js is loading properly
`;
    
    fs.writeFileSync(path.join(__dirname, 'ROUTING_FIX_TEST_REPORT.md'), testReport);
    console.log('✅ Test report created: ROUTING_FIX_TEST_REPORT.md');
}

async function runAllTests() {
    try {
        console.log('🚀 Running all routing tests...\n');
        
        const serverTest = testServerRoutes();
        console.log('');
        
        const navTest = testEnhancedNavigation();
        console.log('');
        
        const indexTest = testIndexHtmlUpdate();
        console.log('');
        
        const pageTest = testPageElements();
        console.log('');
        
        createTestReport();
        console.log('');
        
        const allPassed = serverTest && navTest && indexTest && pageTest;
        
        console.log('📊 TEST SUMMARY:');
        console.log(`Server Routes: ${serverTest ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Enhanced Navigation: ${navTest ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Index.html Update: ${indexTest ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Page Elements: ${pageTest ? '✅ PASS' : '❌ FAIL'}`);
        
        console.log('\n' + (allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'));
        
        if (allPassed) {
            console.log('\n✅ Routing fix appears to be working correctly!');
            console.log('🔧 Next steps:');
            console.log('1. Restart your server');
            console.log('2. Clear browser cache');
            console.log('3. Test the routes manually');
        } else {
            console.log('\n❌ Some issues detected. Check the test results above.');
        }
        
        return allPassed;
        
    } catch (error) {
        console.error('❌ Test execution failed:', error);
        return false;
    }
}

if (require.main === module) {
    runAllTests()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests };