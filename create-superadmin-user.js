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

async function createSuperAdminUser() {
    console.log('Creating superadmin user...');
    
    const email = 'mukhsin9@gmail.com';
    const password = 'Jlamprang233!!';
    
    try {
        // First, check if user already exists
        console.log('Checking if user already exists...');
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
            console.log('Warning: Could not list users:', listError.message);
        }
        
        const existingUser = existingUsers?.users?.find(user => user.email === email);
        
        if (existingUser) {
            console.log('User already exists. Updating password and metadata...');
            
            // Update existing user
            const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                existingUser.id,
                {
                    password: password,
                    email_confirm: true,
                    user_metadata: {
                        role: 'superadmin',
                        name: 'Super Administrator',
                        full_name: 'Mukhsin'
                    }
                }
            );
            
            if (updateError) {
                throw updateError;
            }
            
            console.log('✓ Superadmin user updated successfully');
            console.log('User ID:', updateData.user.id);
            console.log('Email:', updateData.user.email);
            
        } else {
            // Create new user with superadmin credentials
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: {
                    role: 'superadmin',
                    name: 'Super Administrator',
                    full_name: 'Mukhsin'
                }
            });
            
            if (error) {
                throw error;
            }
            
            console.log('✓ Superadmin user created successfully');
            console.log('User ID:', data.user.id);
            console.log('Email:', data.user.email);
        }
        
        // Now test login
        console.log('\nTesting login with superadmin credentials...');
        
        const supabaseClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (loginError) {
            throw loginError;
        }
        
        console.log('✓ Login test successful');
        console.log('Access token available:', !!loginData.session.access_token);
        console.log('User role:', loginData.user.user_metadata?.role);
        
        // Also check if we can insert into users table (if it exists)
        try {
            const { data: userData, error: userError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
                
            if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.log('Note: Could not query users table:', userError.message);
            } else if (userData) {
                console.log('✓ User found in users table');
            } else {
                console.log('Note: User not found in users table (this may be normal)');
            }
        } catch (e) {
            console.log('Note: Users table query failed:', e.message);
        }
        
        return loginData.session.access_token;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.details) {
            console.error('Details:', error.details);
        }
        return null;
    }
}

// Run the function
createSuperAdminUser().then(token => {
    if (token) {
        console.log('\n✅ Superadmin user setup complete!');
        console.log('Email: mukhsin9@gmail.com');
        console.log('Password: Jlamprang233!!');
        console.log('Role: superadmin');
        console.log('\nYou can now login to the application.');
    } else {
        console.log('\n❌ Failed to setup superadmin user.');
    }
}).catch(console.error);