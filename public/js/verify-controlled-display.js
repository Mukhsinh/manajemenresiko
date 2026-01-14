
/**
 * VERIFY CONTROLLED DISPLAY INTEGRATION
 * Script to verify the controlled display system is working correctly
 */

console.log('🔍 Verifying Controlled Display Integration...');

// Check if all required components are loaded
const checks = {
    displayControl: !!window.RencanaStrategisDisplayControl,
    controlledModule: !!window.RencanaStrategisControlled,
    pageExists: !!document.getElementById('rencana-strategis'),
    containerExists: !!document.getElementById('rencana-strategis-content'),
    cssLoaded: !!document.querySelector('link[href*="rencana-strategis-controlled.css"]')
};

console.log('Integration Status:');
Object.entries(checks).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? '✅' : '❌'}`);
});

const allPassed = Object.values(checks).every(check => check);
console.log(`Overall Status: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);

if (allPassed) {
    console.log('🎉 Controlled Display System is ready!');
} else {
    console.warn('⚠️ Some components are missing. Please check the integration.');
}
