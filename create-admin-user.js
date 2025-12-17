const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

async function createAdminUser() {
    console.log('Creating admin user...');
    
    try {
        // Create user with admin credentials
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: 'admin@example.com',
            password: 'admin123',
            email_confirm: true,
            user_metadata: {
                role: 'admin',
                name: 'Administrator'
            }
        });
        
        if (error) {
            throw error;
        }
        
        console.log('✓ Admin user created successfully');
        console.log('User ID:', data.user.id);
        console.log('Email:', data.user.email);
        
        // Now test login
        console.log('\nTesting login with created user...');
        
        const supabaseClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
            email: 'admin@example.com',
            password: 'admin123'
        });
        
        if (loginError) {
            throw loginError;
        }
        
        console.log('✓ Login test successful');
        console.log('Access token available:', !!loginData.session.access_token);
        
        return loginData.session.access_token;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

// Run the function
createAdminUser().then(token => {
    if (token) {
        console.log('\n✓ Admin user setup complete. You can now test AI Assistant.');
    } else {
        console.log('\n❌ Failed to setup admin user.');
    }
}).catch(console.error);