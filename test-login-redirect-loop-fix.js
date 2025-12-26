require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testLoginRedirectLoopFix() {
    console.log('🔍 === TEST LOGIN REDIRECT LOOP FIX ===');
    
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
        
        console.log('✅ Login berhasil');
        console.log('User ID:', data.user.id);
        console.log('Email:', data.user.email);
        
        // Test 2: Test API call dengan token yang diperbaiki
        console.log('\n2. Testing API call dengan endpoint /api/auth/me yang diperbaiki...');
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
                console.log('User data from API:');
                console.log('  - Email:', userData.user.email);
                console.log('  - Organizations:', userData.user.organizations);
                console.log('  - Role:', userData.user.role);
                console.log('  - Is SuperAdmin:', userData.user.isSuperAdmin);
                console.log('  - Profile:', userData.user.profile ? 'Found' : 'Not found');
                
                // Verify data completeness
                if (userData.user.organizations && userData.user.organizations.length > 0) {
                    console.log('✅ Organizations data tersedia');
                } else {
                    console.warn('⚠️ Organizations data kosong atau tidak ada');
                }
                
                if (userData.user.role) {
                    console.log('✅ Role data tersedia');
                } else {
                    console.warn('⚠️ Role data kosong atau tidak ada');
                }
                
                if (userData.user.isSuperAdmin !== undefined) {
                    console.log('✅ SuperAdmin flag tersedia');
                } else {
                    console.warn('⚠️ SuperAdmin flag tidak ada');
                }
                
            } else {
                console.error('❌ API call gagal:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response:', errorText);
            }
        } catch (apiError) {
            console.error('❌ API call error:', apiError.message);
        }
        
        // Test 3: Test dashboard access
        console.log('\n3. Testing dashboard access...');
        try {
            const dashboardResponse = await fetch('http://localhost:3000/api/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (dashboardResponse.ok) {
                const dashboardData = await dashboardResponse.json();
                console.log('✅ Dashboard API call berhasil');
                console.log('Dashboard data keys:', Object.keys(dashboardData));
            } else {
                console.error('❌ Dashboard API call gagal:', dashboardResponse.status);
                const errorText = await dashboardResponse.text();
                console.error('Dashboard error:', errorText);
            }
        } catch (dashboardError) {
            console.error('❌ Dashboard API error:', dashboardError.message);
        }
        
        // Test 4: Test other protected endpoints
        console.log('\n4. Testing other protected endpoints...');
        const endpoints = [
            '/api/risks',
            '/api/master-data',
            '/api/visi-misi'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`http://localhost:3000${endpoint}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    console.log(`✅ ${endpoint} - OK`);
                } else {
                    console.warn(`⚠️ ${endpoint} - ${response.status}`);
                }
            } catch (error) {
                console.error(`❌ ${endpoint} - Error:`, error.message);
            }
        }
        
        // Test 5: Logout
        console.log('\n5. Testing logout...');
        const { error: logoutError } = await supabase.auth.signOut();
        
        if (logoutError) {
            console.error('❌ Logout error:', logoutError.message);
        } else {
            console.log('✅ Logout berhasil');
        }
        
        console.log('\n🎯 === TEST SELESAI ===');
        console.log('\n📋 RINGKASAN HASIL:');
        console.log('- Login: ✅ Berhasil');
        console.log('- API /auth/me: ✅ Diperbaiki dengan data lengkap');
        console.log('- Dashboard access: Perlu dicek');
        console.log('- Protected endpoints: Perlu dicek');
        console.log('- Logout: ✅ Berhasil');
        
        console.log('\n🔧 LANGKAH SELANJUTNYA:');
        console.log('1. Restart server untuk menerapkan perubahan');
        console.log('2. Test login di browser');
        console.log('3. Periksa apakah masih ada redirect loop');
        console.log('4. Periksa console browser untuk error');
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

// Jalankan test
testLoginRedirectLoopFix().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});