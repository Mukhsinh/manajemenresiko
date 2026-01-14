const fs = require('fs');
const path = require('path');

function testKRIHeaderFix() {
    console.log('🧪 Testing KRI Header Color Fix...');
    console.log('=====================================');
    
    // Read the KRI JavaScript file
    const kriFilePath = path.join(__dirname, 'public', 'js', 'kri.js');
    
    if (!fs.existsSync(kriFilePath)) {
        console.log('❌ KRI file not found:', kriFilePath);
        return false;
    }
    
    const kriContent = fs.readFileSync(kriFilePath, 'utf8');
    
    // Check if the problematic CSS is still there
    const hasPurpleGradient = kriContent.includes('background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
    const hasGlobalPageHeader = kriContent.includes('.page-header {') && 
                               kriContent.includes('background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
    const hasSpecificKRISelector = kriContent.includes('#kri .page-header {');
    const hasWhiteBackground = kriContent.includes('background: white');
    
    console.log('🔍 Analysis Results:');
    console.log('-------------------');
    console.log('Purple gradient found:', hasPurpleGradient ? '❌ YES' : '✅ NO');
    console.log('Global .page-header selector:', hasGlobalPageHeader ? '❌ YES (BAD)' : '✅ NO (GOOD)');
    console.log('Specific #kri .page-header selector:', hasSpecificKRISelector ? '✅ YES (GOOD)' : '❌ NO (BAD)');
    console.log('White background specified:', hasWhiteBackground ? '✅ YES (GOOD)' : '❌ NO (BAD)');
    
    // Extract the relevant CSS section
    const cssMatch = kriContent.match(/style\.textContent = `([^`]+)`/);
    if (cssMatch) {
        console.log('\n📄 Current CSS in KRI module:');
        console.log('------------------------------');
        console.log(cssMatch[1]);
    }
    
    // Determine if fix is successful
    const isFixed = !hasGlobalPageHeader && hasSpecificKRISelector && hasWhiteBackground;
    
    console.log('\n🎯 OVERALL RESULT:');
    console.log('==================');
    
    if (isFixed) {
        console.log('✅ HEADER FIX IS SUCCESSFUL!');
        console.log('   - No global .page-header override');
        console.log('   - Uses specific #kri .page-header selector');
        console.log('   - Specifies white background');
        console.log('   - Other pages should not be affected');
    } else {
        console.log('❌ HEADER FIX NEEDS MORE WORK');
        if (hasGlobalPageHeader) {
            console.log('   - Still using global .page-header selector');
        }
        if (!hasSpecificKRISelector) {
            console.log('   - Missing specific #kri .page-header selector');
        }
        if (!hasWhiteBackground) {
            console.log('   - Not specifying white background');
        }
    }
    
    console.log('\n📋 MANUAL TEST INSTRUCTIONS:');
    console.log('============================');
    console.log('1. Open http://localhost:3002 in browser');
    console.log('2. Navigate to different pages and observe header colors');
    console.log('3. Click "Key Risk Indicator" in navigation');
    console.log('4. Verify header stays white/gray (not purple)');
    console.log('5. Navigate to other pages and verify headers are still normal');
    
    return isFixed;
}

// Run the test
if (require.main === module) {
    const result = testKRIHeaderFix();
    process.exit(result ? 0 : 1);
}

module.exports = { testKRIHeaderFix };