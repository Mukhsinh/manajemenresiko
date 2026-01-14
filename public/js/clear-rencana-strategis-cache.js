
// Clear browser cache for rencana strategis
console.log('🧹 Clearing browser cache for Rencana Strategis...');

// Clear localStorage
Object.keys(localStorage).forEach(key => {
    if (key.includes('rencana') || key.includes('strategis')) {
        localStorage.removeItem(key);
        console.log('Cleared localStorage:', key);
    }
});

// Clear sessionStorage
Object.keys(sessionStorage).forEach(key => {
    if (key.includes('rencana') || key.includes('strategis')) {
        sessionStorage.removeItem(key);
        console.log('Cleared sessionStorage:', key);
    }
});

// Force reload of rencana strategis module
if (window.RencanaStrategisModule) {
    delete window.RencanaStrategisModule;
    console.log('Removed old RencanaStrategisModule');
}

// Clear any cached module state
if (window.RencanaStrategisModuleEnhanced && window.RencanaStrategisModuleEnhanced.state) {
    window.RencanaStrategisModuleEnhanced.state.isInitialized = false;
    console.log('Reset enhanced module state');
}

console.log('✅ Cache clearing completed');
