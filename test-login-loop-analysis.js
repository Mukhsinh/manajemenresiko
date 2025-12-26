require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testLoginLoopAnalysis() {
    console.log('🔍 === ANALISIS MASALAH LOGIN LOOP ===');
    
    try {
        // Test 1: Login dengan kredensial yang diberikan
        console.log('\n1. Testing login dengan kredensial superadmin...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'mukhsin9@gmail.com',
            password: 'Jlamprang233!!'
        });
        
        if (error) {
            console.error('❌ Login gagal:', error.message);
            return;
        }
        
        if (!data.session) {
            console.error('❌ Session tidak dibuat setelah login');
            return;
        }
        
        console.log('✅ Login berhasil');
        console.log('User ID:', data.user.id);
        console.log('Email:', data.user.email);
        console.log('Session expires at:', new Date(data.session.expires_at * 1000));
        
        // Test 2: Verifikasi user profile
        console.log('\n2. Checking user profile...');
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
        if (profileError) {
            console.error('❌ Error getting user profile:', profileError.message);
        } else {
            console.log('✅ User profile found:');
            console.log('Role:', profile.role);
            console.log('Organization ID:', profile.organization_id);
            console.log('Organization Name:', profile.organization_name);
        }
        
        // Test 3: Test API call dengan token
        console.log('\n3. Testing API call dengan token...');
        const token = data.session.access_token;
        
        try {
            const response = await fetch('http://localhost:3000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                console.log('✅ API call berhasil');
                console.log('User data from API:', userData.user.email);
                console.log('Organizations:', userData.user.organizations);
                console.log('Role:', userData.user.role);
                console.log('Is SuperAdmin:', userData.user.isSuperAdmin);
            } else {
                console.error('❌ API call gagal:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response:', errorText);
            }
        } catch (apiError) {
            console.error('❌ API call error:', apiError.message);
        }
        
        // Test 4: Test middleware auth
        console.log('\n4. Testing middleware auth...');
        const { authenticateUser } = require('./middleware/auth');
        
        const mockReq = {
            headers: {
                authorization: `Bearer ${token}`
            }
        };
        
        const mockRes = {};
        
        try {
            await new Promise((resolve, reject) => {
                authenticateUser(mockReq, mockRes, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
            
            console.log('✅ Middleware auth berhasil');
            console.log('User from middleware:', mockReq.user.email);
            console.log('Organizations from middleware:', mockReq.user.organizations);
            console.log('Role from middleware:', mockReq.user.role);
            console.log('Is SuperAdmin from middleware:', mockReq.user.isSuperAdmin);
            
        } catch (middlewareError) {
            console.error('❌ Middleware auth error:', middlewareError.message);
        }
        
        // Test 5: Check RLS policies
        console.log('\n5. Testing RLS policies...');
        
        // Test access to dashboard data
        const { data: dashboardData, error: dashboardError } = await supabase
            .from('risk_inputs')
            .select('count')
            .limit(1);
            
        if (dashboardError) {
            console.error('❌ RLS policy error for risk_inputs:', dashboardError.message);
        } else {
            console.log('✅ RLS policy OK for risk_inputs');
        }
        
        // Test 6: Logout
        console.log('\n6. Testing logout...');
        const { error: logoutError } = await supabase.auth.signOut();
        
        if (logoutError) {
            console.error('❌ Logout error:', logoutError.message);
        } else {
            console.log('✅ Logout berhasil');
        }
        
        console.log('\n🎯 === ANALISIS SELESAI ===');
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

// Jalankan test
testLoginLoopAnalysis().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});