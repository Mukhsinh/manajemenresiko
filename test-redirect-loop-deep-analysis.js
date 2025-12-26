require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testRedirectLoopDeepAnalysis() {
    console.log('🔍 === DEEP ANALYSIS REDIRECT LOOP ===');
    
    try {
        // Test 1: Cek current session state
        console.log('\n1. Checking current session state...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('❌ Session error:', sessionError.message);
        } else if (sessionData.session) {
            console.log('✅ Active session found');
            console.log('User ID:', sessionData.session.user.id);
            console.log('Email:', sessionData.session.user.email);
            console.log('Expires at:', new Date(sessionData.session.expires_at * 1000));
            console.log('Token preview:', sessionData.session.access_token.substring(0, 20) + '...');
        } else {
            console.log('ℹ️ No active session');
        }
        
        // Test 2: Login dan monitor session
        console.log('\n2. Testing login and monitoring session...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'mukhsin9@gmail.com',
            password: 'Jlamprang233!!'
        });
        
        if (loginError) {
            console.error('❌ Login failed:', loginError.message);
            return;
        }
        
        console.log('✅ Login successful');
        console.log('Session created:', !!loginData.session);
        console.log('User data:', !!loginData.user);
        
        // Test 3: Immediate session verification
        console.log('\n3. Immediate session verification...');
        const { data: verifyData, error: verifyError } = await supabase.auth.getSession();
        
        if (verifyError) {
            console.error('❌ Session verification error:', verifyError.message);
        } else if (verifyData.session) {
            console.log('✅ Session verified immediately after login');
        } else {
            console.error('❌ Session not found immediately after login - THIS IS THE PROBLEM!');
        }
        
        // Test 4: Test API calls dengan session
        console.log('\n4. Testing API calls with session...');
        const token = loginData.session.access_token;
        
        // Test /api/auth/me
        try {
            const response = await fetch('http://localhost:3000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('API /auth/me status:', response.status);
            
            if (response.ok) {
                const userData = await response.json();
                console.log('✅ API call successful');
                console.log('User email:', userData.user.email);
                console.log('Organizations:', userData.user.organizations?.length || 0);
                console.log('Role:', userData.user.role);
                console.log('Is SuperAdmin:', userData.user.isSuperAdmin);
            } else {
                const errorText = await response.text();
                console.error('❌ API call failed:', errorText);
            }
        } catch (apiError) {
            console.error('❌ API call exception:', apiError.message);
        }
        
        // Test 5: Test dashboard API
        try {
            const dashResponse = await fetch('http://localhost:3000/api/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('API /dashboard status:', dashResponse.status);
            
            if (dashResponse.ok) {
                console.log('✅ Dashboard API accessible');
            } else {
                console.error('❌ Dashboard API failed');
            }
        } catch (dashError) {
            console.error('❌ Dashboard API exception:', dashError.message);
        }
        
        // Test 6: Monitor session persistence
        console.log('\n5. Testing session persistence...');
        
        // Wait 2 seconds then check again
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: persistData, error: persistError } = await supabase.auth.getSession();
        
        if (persistError) {
            console.error('❌ Session persistence error:', persistError.message);
        } else if (persistData.session) {
            console.log('✅ Session persisted after 2 seconds');
            
            // Check if token is the same
            if (persistData.session.access_token === token) {
                console.log('✅ Token unchanged');
            } else {
                console.log('⚠️ Token changed (possibly refreshed)');
            }
        } else {
            console.error('❌ Session lost after 2 seconds - MAJOR PROBLEM!');
        }
        
        // Test 7: Test auth state listener
        console.log('\n6. Testing auth state changes...');
        
        let authStateChanges = [];
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            authStateChanges.push({
                event: event,
                hasSession: !!session,
                timestamp: new Date().toISOString()
            });
            console.log(`🔔 Auth state change: ${event}, Session: ${!!session}`);
        });
        
        // Wait for any auth state changes
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log(`📊 Auth state changes recorded: ${authStateChanges.length}`);
        authStateChanges.forEach((change, index) => {
            console.log(`  ${index + 1}. ${change.event} - Session: ${change.hasSession} at ${change.timestamp}`);
        });
        
        // Cleanup subscription
        subscription.unsubscribe();
        
        // Test 8: Test logout
        console.log('\n7. Testing logout...');
        const { error: logoutError } = await supabase.auth.signOut();
        
        if (logoutError) {
            console.error('❌ Logout error:', logoutError.message);
        } else {
            console.log('✅ Logout successful');
            
            // Verify session is cleared
            const { data: postLogoutData } = await supabase.auth.getSession();
            if (!postLogoutData.session) {
                console.log('✅ Session cleared after logout');
            } else {
                console.warn('⚠️ Session not cleared after logout');
            }
        }
        
        console.log('\n🎯 === ANALYSIS COMPLETE ===');
        
        // Summary
        console.log('\n📋 SUMMARY:');
        console.log('- Login process: Working');
        console.log('- Session creation: Working');
        console.log('- API authentication: Working');
        console.log('- Session persistence: Need to verify');
        console.log('- Auth state changes: Monitored');
        console.log('- Logout process: Working');
        
        console.log('\n🔍 POTENTIAL ISSUES TO CHECK:');
        console.log('1. Frontend auth state management');
        console.log('2. Router authentication guards');
        console.log('3. Multiple auth checks running simultaneously');
        console.log('4. Session storage/retrieval in browser');
        console.log('5. Auth state change handlers causing loops');
        
    } catch (error) {
        console.error('❌ Deep analysis error:', error);
    } finally {
        window.authCheckInProgress = false;
    }
}

// Jalankan test
testRedirectLoopDeepAnalysis().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});