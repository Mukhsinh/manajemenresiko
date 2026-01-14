/**
 * Manual verification script for Rencana Strategis refresh consistency
 * This script can be run in the browser console to test the fixes
 */

function testRencanaStrategisRefreshFix() {
  console.log('=== MANUAL RENCANA STRATEGIS REFRESH FIX TEST ===');
  
  const results = {
    integrationLoaded: false,
    stateManagerAvailable: false,
    patchApplied: false,
    moduleEnhanced: false,
    statePreservation: false,
    displayModelConsistency: false
  };
  
  try {
    // Test 1: Check if integration script loaded
    console.log('\n1. Testing integration script...');
    results.integrationLoaded = !!document.querySelector('script[src*="rencana-strategis-integration.js"]');
    console.log('Integration script loaded:', results.integrationLoaded ? '✅' : '❌');
    
    // Test 2: Check if state manager is available
    console.log('\n2. Testing state manager...');
    results.stateManagerAvailable = typeof window.RencanaStrategisStateManager === 'function';
    console.log('State manager available:', results.stateManagerAvailable ? '✅' : '❌');
    
    // Test 3: Check if patch was applied
    console.log('\n3. Testing patch application...');
    if (window.RencanaStrategisModule && window.RencanaStrategisModule.load) {
      const originalLoad = window.RencanaStrategisModule.load.toString();
      results.patchApplied = originalLoad.includes('Enhanced load with refresh consistency') ||
                            originalLoad.includes('refresh consistency');
    }
    console.log('Patch applied:', results.patchApplied ? '✅' : '❌');
    
    // Test 4: Check if module is enhanced
    console.log('\n4. Testing module enhancement...');
    results.moduleEnhanced = !!(window.RencanaStrategisModuleEnhanced || 
                               (window.RencanaStrategisModule && window.RencanaStrategisModule.stateManager));
    console.log('Module enhanced:', results.moduleEnhanced ? '✅' : '❌');
    
    // Test 5: Test state preservation
    console.log('\n5. Testing state preservation...');
    if (window.RencanaStrategisStateManager) {
      try {
        const stateManager = new window.RencanaStrategisStateManager();
        const testState = { test: true, timestamp: Date.now() };
        stateManager.saveState(testState);
        const restored = stateManager.restoreState();
        results.statePreservation = restored && restored.test === true;
        console.log('State preservation working:', results.statePreservation ? '✅' : '❌');
      } catch (error) {
        console.log('State preservation error:', error.message);
      }
    }
    
    // Test 6: Test display model consistency
    console.log('\n6. Testing display model consistency...');
    if (window.RencanaStrategisStateManager) {
      try {
        const stateManager = new window.RencanaStrategisStateManager();
        const displayModel = stateManager.getCurrentDisplayModel();
        results.displayModelConsistency = displayModel && 
                                         typeof displayModel.formVisible === 'boolean' &&
                                         typeof displayModel.tableVisible === 'boolean';
        console.log('Display model consistency:', results.displayModelConsistency ? '✅' : '❌');
        console.log('Current display model:', displayModel);
      } catch (error) {
        console.log('Display model consistency error:', error.message);
      }
    }
    
    // Overall assessment
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log('\n=== TEST RESULTS SUMMARY ===');
    console.log(`Passed: ${passedTests}/${totalTests} tests (${successRate.toFixed(1)}%)`);
    console.log('Detailed results:', results);
    
    if (successRate >= 80) {
      console.log('🎉 OVERALL RESULT: PASSED - Refresh consistency fix is working!');
    } else if (successRate >= 60) {
      console.log('⚠️ OVERALL RESULT: PARTIAL - Some issues detected, but basic functionality works');
    } else {
      console.log('❌ OVERALL RESULT: FAILED - Significant issues detected');
    }
    
    // Provide recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    if (!results.integrationLoaded) {
      console.log('❌ Integration script not loaded - check if script is included in HTML');
    }
    if (!results.stateManagerAvailable) {
      console.log('❌ State manager not available - check if state manager script loaded');
    }
    if (!results.patchApplied) {
      console.log('❌ Patch not applied - check if patch script loaded after main module');
    }
    if (!results.moduleEnhanced) {
      console.log('❌ Module not enhanced - check if enhancement scripts loaded properly');
    }
    if (!results.statePreservation) {
      console.log('❌ State preservation not working - check sessionStorage permissions');
    }
    if (!results.displayModelConsistency) {
      console.log('❌ Display model inconsistent - check DOM structure and CSS');
    }
    
    return {
      success: successRate >= 80,
      successRate,
      results,
      recommendations: generateRecommendations(results)
    };
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    return {
      success: false,
      error: error.message,
      results
    };
  }
}

function generateRecommendations(results) {
  const recommendations = [];
  
  if (!results.integrationLoaded) {
    recommendations.push('Add integration script to HTML: <script src="/js/rencana-strategis-integration.js"></script>');
  }
  
  if (!results.stateManagerAvailable) {
    recommendations.push('Ensure state manager script loads before integration script');
  }
  
  if (!results.patchApplied) {
    recommendations.push('Verify patch script loads after main rencana-strategis module');
  }
  
  if (!results.moduleEnhanced) {
    recommendations.push('Check if all enhancement scripts are loading without errors');
  }
  
  if (!results.statePreservation) {
    recommendations.push('Check browser sessionStorage permissions and quota');
  }
  
  if (!results.displayModelConsistency) {
    recommendations.push('Verify DOM structure matches expected format for rencana-strategis page');
  }
  
  return recommendations;
}

// Auto-run test when script loads
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(testRencanaStrategisRefreshFix, 1000);
    });
  } else {
    setTimeout(testRencanaStrategisRefreshFix, 1000);
  }
}

// Export for manual execution
if (typeof window !== 'undefined') {
  window.testRencanaStrategisRefreshFix = testRencanaStrategisRefreshFix;
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testRencanaStrategisRefreshFix };
}