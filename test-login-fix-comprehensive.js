/**
 * Comprehensive Login Fix Test
 * Tests login functionality after fixing syntax errors
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

async function testLogin() {
    console.log('🔐 Testing login functionality...');
    
    try {
        // Test with the existing user
        const email = 'mukhsin9@gmail.com';
        const password = 'password123'; // Adjust if needed
        
        console.log(`📧 Attempting login with: ${email}`);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('❌ Login failed:', error.message);
            
            // If password is wrong, try to create/reset user
            if (error.message.includes('Invalid login credentials')) {
                console.log('🔄 Trying to reset password or create user...');
                
                // Try to sign up (will fail if user exists, but that's ok)
                const { data: signupData, error: signupError } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: 'Admin User'
                        }
                    }
                });
                
                if (signupError && !signupError.message.includes('already registered')) {
                    console.error('❌ Signup failed:', signupError.message);
                    return false;
                }
                
                console.log('✅ User exists or created successfully');
                
                // Try login again
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (retryError) {
                    console.error('❌ Retry login failed:', retryError.message);
                    return false;
                }
                
                console.log('✅ Login successful on retry');
                return true;
            }
            
            return false;
        }
        
        if (data.user) {
            console.log('✅ Login successful!');
            console.log('👤 User ID:', data.user.id);
            console.log('📧 Email:', data.user.email);
            console.log('🔑 Access Token:', data.session.access_token.substring(0, 20) + '...');
            
            // Test API call with token
            console.log('🌐 Testing API call with token...');
            
            const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/organizations`, {
                headers: {
                    'Authorization': `Bearer ${data.session.access_token}`,
                    'apikey': process.env.SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const orgs = await response.json();
                console.log('✅ API call successful, organizations:', orgs.length);
            } else {
                console.warn('⚠️ API call failed:', response.status, response.statusText);
            }
            
            // Sign out
            await supabase.auth.signOut();
            console.log('✅ Signed out successfully');
            
            return true;
        }
        
        console.error('❌ No user data returned');
        return false;
        
    } catch (error) {
        console.error('❌ Test error:', error);
        return false;
    }
}

async function testDatabaseConnection() {
    console.log('🗄️ Testing database connection...');
    
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('id, name')
            .limit(1);
        
        if (error) {
            console.error('❌ Database connection failed:', error.message);
            return false;
        }
        
        console.log('✅ Database connection successful');
        console.log('📊 Sample data:', data);
        return true;
        
    } catch (error) {
        console.error('❌ Database test error:', error);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting comprehensive login tests...\n');
    
    const dbTest = await testDatabaseConnection();
    console.log('');
    
    const loginTest = await testLogin();
    console.log('');
    
    console.log('📋 Test Results:');
    console.log(`Database Connection: ${dbTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Login Functionality: ${loginTest ? '✅ PASS' : '❌ FAIL'}`);
    
    if (dbTest && loginTest) {
        console.log('\n🎉 All tests passed! Login should work properly now.');
        console.log('\n📝 Next steps:');
        console.log('1. Open your browser and navigate to the application');
        console.log('2. Try logging in with: mukhsin9@gmail.com');
        console.log('3. Check browser console for any remaining errors');
    } else {
        console.log('\n❌ Some tests failed. Please check the errors above.');
    }
}

runTests().catch(console.error);