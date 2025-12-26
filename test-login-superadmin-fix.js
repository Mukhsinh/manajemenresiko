const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSuperadminLoginAndFix() {
    console.log('🔍 Testing superadmin login and diagnosing auth issues...');
    
    const supabaseClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );
    
    try {
        // 1. Test login
        console.log('\n1. Testing login...');
        const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
            email: 'mukhsin9@gmail.com',
            password: 'Jlamprang233!!'
        });
        
        if (loginError) {
            console.error('❌ Login failed:', loginError.message);
            return false;
        }
        
        console.log('✅ Login successful!');
        console.log('User ID:', loginData.user.id);
        console.log('Email:', loginData.user.email);
        console.log('Role:', loginData.user.user_metadata?.role);
        console.log('Session expires at:', new Date(loginData.session.expires_at * 1000).toLocaleString());
        
        // 2. Test session persistence
        console.log('\n2. Testing session persistence...');
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) {
            console.error('❌ Session check failed:', sessionError.message);
        } else if (sessionData.session) {
            console.log('✅ Session persisted successfully');
            console.log('Session user:', sessionData.session.user.email);
        } else {
            console.log('⚠️ No session found after login');
        }
        
        // 3. Test API call with token
        console.log('\n3. Testing API call with auth token...');
        const token = loginData.session.access_token;
        
        try {
            const response = await fetch('http://localhost:3001/api/config', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const config = await response.json();
                console.log('✅ API call successful');
                console.log('Config loaded:', !!config.supabaseUrl);
            } else {
                console.log('⚠️ API call failed:', response.status, response.statusText);
            }
        } catch (apiError) {
            console.log('⚠️ API call error:', apiError.message);
        }
        
        // 4. Test user profile data
        console.log('\n4. Testing user profile data...');
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', loginData.user.id)
            .single();
            
        if (profileError && profileError.code !== 'PGRST116') {
            console.log('⚠️ Profile query error:', profileError.message);
        } else if (profileData) {
            console.log('✅ Profile data found');
            console.log('Username:', profileData.username);
            console.log('Full name:', profileData.full_name);
        } else {
            console.log('ℹ️ No profile data found (this may be normal)');
        }
        
        // 5. Diagnose frontend auth issues
        console.log('\n5. Diagnosing frontend auth state issues...');
        console.log('📋 Common issues and solutions:');
        console.log('');
        console.log('Issue: Auth state shows NOT_AUTHENTICATED after login');
        console.log('Solutions:');
        console.log('- Check if SIGNED_IN event is properly handled');
        console.log('- Verify auth state manager is receiving session updates');
        console.log('- Ensure session persistence is enabled');
        console.log('- Check for race conditions in auth initialization');
        console.log('');
        console.log('Issue: Session not persisting across page reloads');
        console.log('Solutions:');
        console.log('- Verify localStorage/sessionStorage is working');
        console.log('- Check if auth.persistSession is set to true');
        console.log('- Ensure proper session restoration on app init');
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

testSuperadminLoginAndFix();