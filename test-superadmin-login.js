const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSuperAdminLogin() {
    console.log('Testing superadmin login...');
    
    const supabaseClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: 'mukhsin9@gmail.com',
            password: 'Jlamprang233!!'
        });
        
        if (error) {
            throw error;
        }
        
        console.log('✅ Login successful!');
        console.log('User ID:', data.user.id);
        console.log('Email:', data.user.email);
        console.log('Role:', data.user.user_metadata?.role);
        console.log('Name:', data.user.user_metadata?.name);
        console.log('Access Token Length:', data.session.access_token.length);
        console.log('Token expires at:', new Date(data.session.expires_at * 1000).toLocaleString());
        
        // Test API call with token
        console.log('\nTesting API call with token...');
        const response = await fetch('http://localhost:3001/api/test', {
            headers: {
                'Authorization': `Bearer ${data.session.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ API call successful:', result);
        } else {
            console.log('⚠️ API call failed:', response.status, response.statusText);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        return false;
    }
}

testSuperAdminLogin();