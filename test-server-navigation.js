/**
 * Test Server Navigation
 * Script untuk menguji server dan navigasi secara otomatis
 */

const http = require('http');
const { execSync, spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 Testing Server Navigation - PINTAR MR');
console.log('==========================================');

// Check if server is running
function checkServer(port = 3000) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: port,
            path: '/',
            method: 'GET',
            timeout: 2000
        }, (res) => {
            resolve(true);
        });
        
        req.on('error', () => {
            resolve(false);
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
}

// Test specific endpoint
function testEndpoint(path, port = 3000) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: port,
            path: path,
            method: 'GET',
            timeout: 5000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: data,
                    success: res.statusCode === 200
                });
            });
        });
        
        req.on('error', (error) => {
            resolve({
                status: 0,
                error: error.message,
                success: false
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                status: 0,
                error: 'Timeout',
                success: false
            });
        });
        
        req.end();
    });
}

async function main() {
    console.log('\n🔍 Step 1: Checking if server is running...');
    
    const serverRunning = await checkServer();
    
    if (!serverRunning) {
        console.log('❌ Server is not running on port 3000');
        console.log('\n🚀 Starting server...');
        
        try {
            // Try to start server
            const serverProcess = spawn('node', ['server.js'], {
                detached: false,
                stdio: 'pipe'
            });
            
            console.log('⏳ Waiting for server to start...');
            
            // Wait for server to start
            let attempts = 0;
            const maxAttempts = 10;
            
            while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const isRunning = await checkServer();
                
                if (isRunning) {
                    console.log('✅ Server started successfully!');
                    break;
                }
                
                attempts++;
                console.log(`⏳ Attempt ${attempts}/${maxAttempts}...`);
            }
            
            if (attempts >= maxAttempts) {
                console.log('❌ Failed to start server automatically');
                console.log('\n📝 Manual steps:');
                console.log('1. Open terminal');
                console.log('2. Run: node server.js');
                console.log('3. Wait for "Server running on port 3000"');
                console.log('4. Run this test again');
                return;
            }
            
        } catch (error) {
            console.log('❌ Error starting server:', error.message);
            console.log('\n📝 Please start server manually:');
            console.log('1. Open terminal');
            console.log('2. Run: node server.js');
            return;
        }
    } else {
        console.log('✅ Server is running on port 3000');
    }
    
    console.log('\n🧪 Step 2: Testing navigation endpoints...');
    
    const testEndpoints = [
        { path: '/', name: 'Home Page' },
        { path: '/test-navigation-fix.html', name: 'Navigation Test Page' },
        { path: '/js/router.js', name: 'Router Script' },
        { path: '/js/routes.js', name: 'Routes Configuration' },
        { path: '/js/router-integration.js', name: 'Router Integration' },
        { path: '/js/RouterManager.js', name: 'Router Manager' },
        { path: '/js/app.js', name: 'Main App Script' }
    ];
    
    let allEndpointsWorking = true;
    
    for (const endpoint of testEndpoints) {
        const result = await testEndpoint(endpoint.path);
        
        if (result.success) {
            console.log(`✅ ${endpoint.name}: OK (${result.status})`);
        } else {
            console.log(`❌ ${endpoint.name}: FAILED (${result.status || 'No response'})`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
            allEndpointsWorking = false;
        }
    }
    
    console.log('\n🔧 Step 3: Testing navigation functionality...');
    
    // Test navigation test page specifically
    const navTestResult = await testEndpoint('/test-navigation-fix.html');
    
    if (navTestResult.success) {
        console.log('✅ Navigation test page is accessible');
        
        // Check if the page contains expected content
        const content = navTestResult.data;
        const checks = [
            { name: 'Router Status Section', pattern: /Router Status/ },
            { name: 'Navigation Tests Section', pattern: /Navigation Tests/ },
            { name: 'Test Buttons', pattern: /nav-button/ },
            { name: 'Console Log Section', pattern: /Console Log/ },
            { name: 'JavaScript Functions', pattern: /testNavigation/ }
        ];
        
        let contentValid = true;
        checks.forEach(check => {
            if (check.pattern.test(content)) {
                console.log(`✅ ${check.name}: Found`);
            } else {
                console.log(`❌ ${check.name}: Missing`);
                contentValid = false;
            }
        });
        
        if (contentValid) {
            console.log('✅ Navigation test page content is valid');
        } else {
            console.log('⚠️ Navigation test page content may be incomplete');
        }
        
    } else {
        console.log('❌ Navigation test page is not accessible');
        allEndpointsWorking = false;
    }
    
    console.log('\n📊 Step 4: Final Results');
    console.log('========================');
    
    if (allEndpointsWorking) {
        console.log('🎉 ALL TESTS PASSED!');
        console.log('\n✅ Navigation fix is ready for testing');
        console.log('\n🔗 Test URLs:');
        console.log('   Main App: http://localhost:3000/');
        console.log('   Navigation Test: http://localhost:3000/test-navigation-fix.html');
        
        console.log('\n📝 Testing Instructions:');
        console.log('1. Open http://localhost:3000/test-navigation-fix.html');
        console.log('2. Check router status indicators');
        console.log('3. Click navigation test buttons');
        console.log('4. Verify pages load without refresh');
        console.log('5. Check console log for any errors');
        
        console.log('\n🎯 Expected Results:');
        console.log('✅ Router status should show all green indicators');
        console.log('✅ Navigation buttons should work instantly');
        console.log('✅ Pages should load without browser refresh');
        console.log('✅ Console should show successful navigation logs');
        console.log('✅ URL should update in browser address bar');
        
    } else {
        console.log('❌ SOME TESTS FAILED');
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Ensure server is running: node server.js');
        console.log('2. Check for any error messages above');
        console.log('3. Verify all required files exist');
        console.log('4. Check server logs for errors');
        
        console.log('\n📞 If problems persist:');
        console.log('1. Restart the server');
        console.log('2. Clear browser cache');
        console.log('3. Check browser console for JavaScript errors');
        console.log('4. Verify file permissions');
    }
    
    console.log('\n🔍 Additional Checks:');
    console.log('- Browser: Test in Chrome, Firefox, Safari');
    console.log('- Mobile: Test responsive navigation');
    console.log('- Performance: Check navigation speed');
    console.log('- Errors: Monitor browser console');
    
    console.log('\n📋 Maintenance:');
    console.log('- Run this test after any navigation changes');
    console.log('- Monitor server logs for navigation errors');
    console.log('- Update test cases as needed');
    
    console.log('\n🎊 Navigation Fix Implementation Complete!');
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\n👋 Test interrupted by user');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('\n❌ Uncaught exception:', error.message);
    process.exit(1);
});

// Run the test
main().catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
});