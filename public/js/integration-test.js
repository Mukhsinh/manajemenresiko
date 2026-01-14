
// Integration Test for Race Condition Fix
console.log('🧪 Testing Race Condition Fix Integration...');

// Test 1: Check if new module is loaded
if (window.RencanaStrategisRaceConditionFix) {
    console.log('✅ Race condition fix module loaded');
} else {
    console.log('❌ Race condition fix module not found');
}

// Test 2: Check if safe loading function exists
if (window.loadRencanaStrategisSafe) {
    console.log('✅ Safe loading function available');
} else {
    console.log('❌ Safe loading function not found');
}

// Test 3: Test initialization
if (window.RencanaStrategisRaceConditionFix && window.RencanaStrategisRaceConditionFix.initialize) {
    console.log('✅ Initialize function available');
    
    // Test initialization (non-blocking)
    window.RencanaStrategisRaceConditionFix.initialize()
        .then(success => {
            if (success) {
                console.log('✅ Race condition fix initialization successful');
            } else {
                console.log('⚠️ Race condition fix initialization completed with warnings');
            }
        })
        .catch(error => {
            console.log('❌ Race condition fix initialization failed:', error);
        });
} else {
    console.log('❌ Initialize function not found');
}

// Test 4: Check lifecycle state
setTimeout(() => {
    if (window.RencanaStrategisRaceConditionFix) {
        const lifecycle = window.RencanaStrategisRaceConditionFix.getLifecycle();
        console.log('📊 Lifecycle state:', lifecycle);
        
        const state = window.RencanaStrategisRaceConditionFix.getState();
        console.log('📊 Module state:', {
            isInitialized: state.isInitialized,
            isLoading: state.isLoading,
            dataCount: state.data.length,
            missionsCount: state.missions.length
        });
    }
}, 2000);

console.log('🧪 Integration test setup complete');
