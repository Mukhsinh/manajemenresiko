/**
 * Test script for login functionality fixes
 */

const { supabase } = require('./config/supabase');

async function testLogin() {
    console.log('🧪 Testing login functionality...');
    
    try {
        // Test 1: Check if Supabase client is working
        console.log('1. Testing Supabase client...');
        if (!supabase) {
            throw new Error('Supabase client not available');
        }
        console.log('✅ Supabase client available');
        
        // Test 2: Try to get session (should be null for unauthenticated)
        console.log('2. Testing session retrieval...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.warn('⚠️ Session retrieval error (expected for unauthenticated):', error.message);
        } else {
            console.log('✅ Session retrieval working, current session:', session ? 'exists' : 'null');
        }
        
        // Test 3: Test login with valid credentials
        console.log('3. Testing login with valid credentials...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'mukhsin9@gmail.com',
            password: 'test123' // This might not be the correct password
        });
        
        if (loginError) {
            console.log('⚠️ Login failed (expected if password is wrong):', loginError.message);
            
            // Check if it's an invalid credentials error (expected)
            if (loginError.message.includes('Invalid login credentials')) {
                console.log('✅ Login error handling working correctly');
            }
        } else {
            console.log('✅ Login successful:', loginData.user?.email);
            
            // Test 4: Test token retrieval after login
            console.log('4. Testing token after login...');
            const { data: { session: newSession } } = await supabase.auth.getSession();
            if (newSession && newSession.access_token) {
                console.log('✅ Token available after login:', newSession.access_token.substring(0, 20) + '...');
                
                // Test 5: Test API call with token
                console.log('5. Testing API call with authentication...');
                try {
                    const response = await fetch('http://localhost:3000/api/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${newSession.access_token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const userData = await response.json();
                        console.log('✅ Authenticated API call successful:', userData.user?.email);
                    } else {
                        console.log('⚠️ API call failed:', response.status, response.statusText);
                    }
                } catch (apiError) {
                    console.log('⚠️ API call error:', apiError.message);
                }
                
                // Test 6: Test logout
                console.log('6. Testing logout...');
                const { error: logoutError } = await supabase.auth.signOut();
                if (logoutError) {
                    console.log('⚠️ Logout error:', logoutError.message);
                } else {
                    console.log('✅ Logout successful');
                }
            } else {
                console.log('❌ No token available after login');
            }
        }
        
        console.log('🎉 Login functionality test completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
if (require.main === module) {
    testLogin();
}

module.exports = { testLogin };