/**
 * Login Loop Debug Test
 * Analyzes the automatic login/logout loop issue
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeAuthState() {
    console.log('🔍 Analyzing authentication state...\n');
    
    try {
        // Check current session
        console.log('1. Checking current session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('❌ Session error:', sessionError.message);
        } else if (session) {
            console.log('✅ Active session found:');
            console.log(`   User ID: ${session.user.id}`);
            console.log(`   Email: ${session.user.email}`);
            console.log(`   Expires at: ${new Date(session.expires_at * 1000).toLocaleString()}`);
            console.log(`   Token: ${session.access_token.substring(0, 20)}...`);
            
            // Check if token is expired
            const now = Math.floor(Date.now() / 1000);
            const isExpired = now >= session.expires_at;
            console.log(`   Is expired: ${isExpired ? '❌ YES' : '✅ NO'}`);
            
            if (isExpired) {
                console.log('🔄 Attempting to refresh expired token...');
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                if (refreshError) {
                    console.error('❌ Refresh failed:', refreshError.message);
                } else {
                    console.log('✅ Token refreshed successfully');
                }
            }
        } else {
            console.log('❌ No active session');
        }
        
        console.log('');
        
        // Check user
        console.log('2. Checking current user...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            console.error('❌ User error:', userError.message);
        } else if (user) {
            console.log('✅ User authenticated:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
            console.log(`   Last sign in: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
        } else {
            console.log('❌ No authenticated user');
        }
        
        console.log('');
        
        // Test API call with current session
        if (session && session.access_token) {
            console.log('3. Testing API call with current token...');
            try {
                const response = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ API call successful, got ${data.length} organizations`);
                } else {
                    console.error(`❌ API call failed: ${response.status} ${response.statusText}`);
                    const errorText = await response.text();
                    console.error(`   Error details: ${errorText}`);
                }
            } catch (apiError) {
                console.error('❌ API call exception:', apiError.message);
            }
        } else {
            console.log('3. ⚠️ No token available for API test');
        }
        
        console.log('');
        
        // Check auth state changes
        console.log('4. Setting up auth state listener...');
        let authChangeCount = 0;
        const maxChanges = 10;
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            authChangeCount++;
            console.log(`🔄 Auth state change #${authChangeCount}: ${event}`);
            
            if (session) {
                console.log(`   User: ${session.user.email}`);
                console.log(`   Token: ${session.access_token.substring(0, 20)}...`);
            } else {
                console.log('   No session');
            }
            
            if (authChangeCount >= maxChanges) {
                console.log(`⚠️ Too many auth state changes (${authChangeCount}), stopping listener`);
                subscription.unsubscribe();
            }
        });
        
        // Wait for potential auth state changes
        console.log('⏳ Waiting 10 seconds for auth state changes...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        subscription.unsubscribe();
        console.log(`📊 Total auth state changes detected: ${authChangeCount}`);
        
        if (authChangeCount > 2) {
            console.log('⚠️ WARNING: Multiple auth state changes detected - this may cause login loops');
        }
        
    } catch (error) {
        console.error('❌ Analysis error:', error);
    }
}

async function testLoginLogoutCycle() {
    console.log('\n🔄 Testing login/logout cycle...\n');
    
    try {
        // Clear any existing session
        console.log('1. Clearing existing session...');
        await supabase.auth.signOut();
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Attempt login
        console.log('2. Attempting login...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'mukhsin9@gmail.com',
            password: 'password123'
        });
        
        if (loginError) {
            console.error('❌ Login failed:', loginError.message);
            return;
        }
        
        console.log('✅ Login successful');
        
        // Check session immediately after login
        console.log('3. Checking session after login...');
        const { data: { session: postLoginSession } } = await supabase.auth.getSession();
        
        if (postLoginSession) {
            console.log('✅ Session exists after login');
            console.log(`   Token: ${postLoginSession.access_token.substring(0, 20)}...`);
        } else {
            console.log('❌ No session after login - this is the problem!');
        }
        
        // Wait and check again
        console.log('4. Waiting 2 seconds and checking again...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: { session: delayedSession } } = await supabase.auth.getSession();
        
        if (delayedSession) {
            console.log('✅ Session still exists after delay');
        } else {
            console.log('❌ Session disappeared after delay - this causes logout loop!');
        }
        
        // Manual logout
        console.log('5. Manual logout...');
        await supabase.auth.signOut();
        console.log('✅ Logout completed');
        
    } catch (error) {
        console.error('❌ Login/logout test error:', error);
    }
}

async function runDiagnostics() {
    console.log('🚀 Starting login loop diagnostics...\n');
    
    await analyzeAuthState();
    await testLoginLogoutCycle();
    
    console.log('\n📋 Diagnostic Summary:');
    console.log('1. Check if there are multiple auth state changes');
    console.log('2. Check if session disappears after login');
    console.log('3. Check if token expires immediately');
    console.log('4. Check for conflicting auth listeners');
    
    console.log('\n💡 Possible causes of login loops:');
    console.log('- Multiple auth state listeners');
    console.log('- Session storage conflicts');
    console.log('- Token expiration issues');
    console.log('- Conflicting authentication checks');
    console.log('- Browser storage issues');
}

runDiagnostics().catch(console.error);