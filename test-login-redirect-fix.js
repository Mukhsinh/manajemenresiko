/**
 * TEST SCRIPT: Verify Login Redirect Fix
 * 
 * This script tests the login flow after RLS fix
 * Run in browser console after opening the application
 */

console.log('🧪 Starting Login Redirect Fix Verification...\n');

// Test Configuration
const TEST_CONFIG = {
    email: 'mukhsin9@gmail.com',
    // password: '' // Enter password manually in the form
};

// Test Results Container
const testResults = {
    tests: [],
    passed: 0,
    failed: 0,
    warnings: 0
};

function logTest(name, status, message) {
    const result = { name, status, message, timestamp: new Date().toISOString() };
    testResults.tests.push(result);
    
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${name}: ${message}`);
    
    if (status === 'PASS') testResults.passed++;
    else if (status === 'FAIL') testResults.failed++;
    else testResults.warnings++;
    
    return result;
}

async function runTests() {
    console.log('═══════════════════════════════════════════\n');
    console.log('TEST 1: Supabase Client Initialization\n');
    
    // Test 1: Check Supabase Client
    if (typeof window.supabaseClient === 'undefined') {
        logTest('Supabase Client', 'FAIL', 'Supabase client not found. Refresh the page.');
        return false;
    }
    logTest('Supabase Client', 'PASS', 'Supabase client initialized');
    
    // Test 2: Check Auth Service
    console.log('\n═══════════════════════════════════════════\n');
    console.log('TEST 2: Auth Service Availability\n');
    
    if (typeof window.authService === 'undefined') {
        logTest('Auth Service', 'WARN', 'Auth service not found. Will use direct Supabase.');
    } else {
        logTest('Auth Service', 'PASS', 'Auth service available');
    }
    
    // Test 3: Check Current Session
    console.log('\n═══════════════════════════════════════════\n');
    console.log('TEST 3: Current Session Check\n');
    
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error) {
            logTest('Session Check', 'FAIL', `Error: ${error.message}`);
        } else if (session && session.access_token) {
            logTest('Session Check', 'PASS', `Active session found for ${session.user.email}`);
            console.log('   Token:', session.access_token.substring(0, 30) + '...');
            console.log('   Expires:', new Date(session.expires_at * 1000).toLocaleString());
        } else {
            logTest('Session Check', 'WARN', 'No active session. Please login.');
        }
    } catch (error) {
        logTest('Session Check', 'FAIL', `Exception: ${error.message}`);
    }
    
    // Test 4: Check User Profile Access (RLS Test)
    console.log('\n═══════════════════════════════════════════\n');
    console.log('TEST 4: User Profile Access (RLS Verification)\n');
    
    try {
        const { data, error } = await window.supabaseClient
            .from('user_profiles')
            .select('id, email, full_name, role, organization_name')
            .eq('email', TEST_CONFIG.email)
            .single();
        
        if (error) {
            if (error.message.includes('JWT') || error.message.includes('not authenticated')) {
                logTest('User Profile RLS', 'WARN', 'Not authenticated. Please login first.');
            } else {
                logTest('User Profile RLS', 'FAIL', `RLS Error: ${error.message}`);
                console.log('   This indicates RLS policies may be blocking access.');
                console.log('   Check: ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;');
            }
        } else if (data) {
            logTest('User Profile RLS', 'PASS', `Profile accessible for ${data.email}`);
            console.log('   Profile Data:');
            console.log('   - ID:', data.id);
            console.log('   - Email:', data.email);
            console.log('   - Name:', data.full_name);
            console.log('   - Role:', data.role);
            console.log('   - Organization:', data.organization_name);
        } else {
            logTest('User Profile RLS', 'FAIL', 'No profile data returned');
        }
    } catch (error) {
        logTest('User Profile RLS', 'FAIL', `Exception: ${error.message}`);
    }
    
    // Test 5: Check Master Data Access
    console.log('\n═══════════════════════════════════════════\n');
    console.log('TEST 5: Master Data Access (RLS Verification)\n');
    
    const masterTables = [
        'master_probability_criteria',
        'master_impact_criteria',
        'master_risk_categories'
    ];
    
    for (const table of masterTables) {
        try {
            const { data, error, count } = await window.supabaseClient
                .from(table)
                .select('*', { count: 'exact' });
            
            if (error) {
                if (error.message.includes('JWT') || error.message.includes('not authenticated')) {
                    logTest(`Master: ${table}`, 'WARN', 'Not authenticated');
                } else {
                    logTest(`Master: ${table}`, 'FAIL', `RLS Error: ${error.message}`);
                }
            } else {
                logTest(`Master: ${table}`, 'PASS', `Accessible (${count || 0} rows)`);
            }
        } catch (error) {
            logTest(`Master: ${table}`, 'FAIL', `Exception: ${error.message}`);
        }
    }
    
    // Test 6: Check UI Elements
    console.log('\n═══════════════════════════════════════════\n');
    console.log('TEST 6: UI Elements Availability\n');
    
    const uiElements = [
        { id: 'login-screen', name: 'Login Screen' },
        { id: 'app-screen', name: 'App Screen' },
        { id: 'login-email', name: 'Email Input' },
        { id: 'login-password', name: 'Password Input' },
        { id: 'login-form', name: 'Login Form' },
        { id: 'auth-message', name: 'Auth Message' },
        { id: 'user-name', name: 'User Name Display' },
        { id: 'user-avatar', name: 'User Avatar' },
        { id: 'dashboard', name: 'Dashboard Page' }
    ];
    
    for (const elem of uiElements) {
        const element = document.getElementById(elem.id);
        if (element) {
            const isVisible = element.offsetParent !== null;
            const status = isVisible ? 'visible' : 'hidden';
            logTest(`UI: ${elem.name}`, 'PASS', `Element found (${status})`);
        } else {
            logTest(`UI: ${elem.name}`, 'FAIL', 'Element not found in DOM');
        }
    }
    
    // Test 7: Check Current App State
    console.log('\n═══════════════════════════════════════════\n');
    console.log('TEST 7: Current Application State\n');
    
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    
    if (loginScreen && appScreen) {
        const loginVisible = loginScreen.style.display !== 'none' && loginScreen.offsetParent !== null;
        const appVisible = appScreen.style.display !== 'none' && appScreen.offsetParent !== null;
        
        if (loginVisible && !appVisible) {
            logTest('App State', 'WARN', 'Login screen is visible - user not logged in');
            console.log('   ℹ️ Instructions to test:');
            console.log('   1. Enter email:', TEST_CONFIG.email);
            console.log('   2. Enter your password');
            console.log('   3. Click Login button');
            console.log('   4. Watch console for login flow logs');
            console.log('   5. After login, run this test again to verify');
        } else if (!loginVisible && appVisible) {
            logTest('App State', 'PASS', 'App screen is visible - user logged in');
            
            // Check user display
            const userName = document.getElementById('user-name');
            const userAvatar = document.getElementById('user-avatar');
            
            if (userName && userName.textContent) {
                logTest('User Display', 'PASS', `User name shown: "${userName.textContent}"`);
            } else {
                logTest('User Display', 'WARN', 'User name not displayed');
            }
            
            if (userAvatar && userAvatar.textContent) {
                logTest('User Avatar', 'PASS', `Avatar initial: "${userAvatar.textContent}"`);
            } else {
                logTest('User Avatar', 'WARN', 'User avatar not displayed');
            }
            
            // Check active page
            const activePage = document.querySelector('.page-content.active');
            if (activePage) {
                logTest('Active Page', 'PASS', `Page loaded: ${activePage.id}`);
            } else {
                logTest('Active Page', 'WARN', 'No active page found');
            }
        } else if (loginVisible && appVisible) {
            logTest('App State', 'FAIL', 'Both login and app screens visible - UI conflict');
        } else {
            logTest('App State', 'FAIL', 'Neither login nor app screen visible - UI error');
        }
    }
    
    // Print Summary
    console.log('\n═══════════════════════════════════════════\n');
    console.log('TEST SUMMARY\n');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Total Tests: ${testResults.tests.length}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⚠️ Warnings: ${testResults.warnings}`);
    console.log('\n');
    
    const passRate = (testResults.passed / testResults.tests.length * 100).toFixed(1);
    console.log(`Pass Rate: ${passRate}%`);
    
    if (testResults.failed === 0) {
        console.log('\n🎉 All critical tests passed!');
        if (testResults.warnings > 0) {
            console.log('⚠️ Some warnings present - review above for details');
        }
    } else {
        console.log('\n❌ Some tests failed - review above for details');
    }
    
    console.log('\n═══════════════════════════════════════════\n');
    
    return testResults;
}

// Auto-run tests
console.log('Starting automated tests...\n');
runTests().then(results => {
    console.log('\n✅ Test execution completed');
    console.log('📊 Detailed results available in testResults object');
    console.log('💡 Type "testResults" to see full results\n');
    window.testResults = results;
}).catch(error => {
    console.error('\n❌ Test execution failed:', error);
});

// Instructions
console.log('═══════════════════════════════════════════');
console.log('📝 TESTING INSTRUCTIONS');
console.log('═══════════════════════════════════════════\n');
console.log('1. Open DevTools Console (F12)');
console.log('2. Copy and paste this entire script');
console.log('3. Press Enter to run tests');
console.log('4. Review test results above\n');
console.log('To test login flow:');
console.log('1. If not logged in, fill in login form');
console.log('2. Click Login button');
console.log('3. Wait for redirect');
console.log('4. Run this script again to verify\n');
console.log('Expected after fix:');
console.log('✅ All RLS tests should PASS');
console.log('✅ User profile should be accessible');
console.log('✅ App screen should show after login');
console.log('✅ Dashboard should load with data\n');
console.log('═══════════════════════════════════════════\n');

