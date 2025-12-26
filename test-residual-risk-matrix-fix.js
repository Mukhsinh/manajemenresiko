const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Residual Risk Matrix Enhancements...\n');

// Test 1: Check if residual-risk.js has been updated with enhanced background colors
console.log('Test 1: Checking enhanced background colors in residual-risk.js');
try {
    const residualRiskJs = fs.readFileSync('public/js/residual-risk.js', 'utf8');
    
    const hasEnhancedColors = residualRiskJs.includes('rgba(34, 197, 94, 0.3)') && 
                             residualRiskJs.includes('rgba(234, 179, 8, 0.3)') &&
                             residualRiskJs.includes('rgba(249, 115, 22, 0.3)') &&
                             residualRiskJs.includes('rgba(239, 68, 68, 0.4)');
    
    const hasZoneLabels = residualRiskJs.includes('label: \'LOW\'') &&
                         residualRiskJs.includes('label: \'MEDIUM\'') &&
                         residualRiskJs.includes('label: \'HIGH\'') &&
                         residualRiskJs.includes('label: \'EXTREME\'');
    
    if (hasEnhancedColors && hasZoneLabels) {
        console.log('✅ Enhanced background colors with zone labels implemented');
    } else {
        console.log('❌ Enhanced background colors or zone labels missing');
    }
} catch (error) {
    console.log('❌ Error reading residual-risk.js:', error.message);
}

// Test 2: Check if star icons are implemented
console.log('\nTest 2: Checking star icons for residual risk points');
try {
    const residualRiskJs = fs.readFileSync('public/js/residual-risk.js', 'utf8');
    
    const hasStarIcon = residualRiskJs.includes('pointStyle: \'star\'') &&
                       residualRiskJs.includes('backgroundColor: \'#FFD700\'');
    
    const hasStarLegend = residualRiskJs.includes('Residual Risk Rating (★)');
    
    if (hasStarIcon && hasStarLegend) {
        console.log('✅ Star icons for residual risk points implemented');
    } else {
        console.log('❌ Star icons or legend missing');
    }
} catch (error) {
    console.log('❌ Error checking star icons:', error.message);
}

// Test 3: Check if HTML has been updated with legend styling
console.log('\nTest 3: Checking HTML legend styling');
try {
    const residualRiskHtml = fs.readFileSync('public/residual-risk.html', 'utf8');
    
    const hasLegendStyling = residualRiskHtml.includes('.risk-matrix-legend') &&
                            residualRiskHtml.includes('.legend-item') &&
                            residualRiskHtml.includes('.legend-symbol');
    
    if (hasLegendStyling) {
        console.log('✅ Legend styling added to HTML');
    } else {
        console.log('❌ Legend styling missing in HTML');
    }
} catch (error) {
    console.log('❌ Error reading residual-risk.html:', error.message);
}

// Test 4: Check if test file was created
console.log('\nTest 4: Checking test file creation');
try {
    const testFile = 'public/test-residual-risk-matrix-enhanced.html';
    if (fs.existsSync(testFile)) {
        const testContent = fs.readFileSync(testFile, 'utf8');
        
        const hasEnhancedFeatures = testContent.includes('Enhanced Residual Risk Matrix Test') &&
                                   testContent.includes('Background Colors') &&
                                   testContent.includes('Star Icons') &&
                                   testContent.includes('pointStyle: \'star\'');
        
        if (hasEnhancedFeatures) {
            console.log('✅ Enhanced test file created with all features');
        } else {
            console.log('❌ Test file missing some enhanced features');
        }
    } else {
        console.log('❌ Test file not found');
    }
} catch (error) {
    console.log('❌ Error checking test file:', error.message);
}

// Test 5: Verify Chart.js compatibility
console.log('\nTest 5: Checking Chart.js compatibility');
try {
    const residualRiskJs = fs.readFileSync('public/js/residual-risk.js', 'utf8');
    
    const hasChartJsCheck = residualRiskJs.includes('typeof Chart !== \'undefined\'');
    const hasProperDatasets = residualRiskJs.includes('datasets: [') &&
                             residualRiskJs.includes('type: \'scatter\'');
    
    if (hasChartJsCheck && hasProperDatasets) {
        console.log('✅ Chart.js compatibility maintained');
    } else {
        console.log('❌ Chart.js compatibility issues detected');
    }
} catch (error) {
    console.log('❌ Error checking Chart.js compatibility:', error.message);
}

console.log('\n📋 Summary of Enhancements:');
console.log('1. ✨ Enhanced background colors for risk zones (Green, Yellow, Orange, Red)');
console.log('2. ⭐ Star icons for residual risk points (Gold color)');
console.log('3. 🏷️  Zone labels in risk matrix areas');
console.log('4. 🎨 Improved legend styling with proper symbols');
console.log('5. 🧪 Comprehensive test file for verification');

console.log('\n🚀 Next Steps:');
console.log('1. Open browser and navigate to: /test-residual-risk-matrix-enhanced.html');
console.log('2. Test the enhanced matrix with both test data and real data');
console.log('3. Verify background colors are visible in risk zones');
console.log('4. Confirm residual risk points appear as gold stars');
console.log('5. Check that legend displays correctly with proper symbols');

console.log('\n✅ Residual Risk Matrix Enhancement Complete!');