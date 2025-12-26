/**
 * Test Server and Router Integration
 * Verifies that the server is running and router works correctly
 */

const http = require('http');

console.log('🧪 Testing Server and Router Integration...');

// Test server availability
function testServerAvailability() {
    return new Promise((resolve, reject) => {
        console.log('\n🌐 Testing server availability...');
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'GET',
            timeout: 5000
        };
        
        const req = http.request(options, (res) => {
            console.log(`✅ Server is running - Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                // Check if HTML contains router scripts
                const hasRouterScript = data.includes('router.js');
                const hasRouteConfig = data.includes('route-config.js');
                const hasRouterIntegration = data.includes('router-integration.js');
                
                console.log(`📜 Router scripts in HTML:`);
                console.log(`  - router.js: ${hasRouterScript ? '✅' : '❌'}`);
                console.log(`  - route-config.js: ${hasRouteConfig ? '✅' : '❌'}`);
                console.log(`  - router-integration.js: ${hasRouterIntegration ? '✅' : '❌'}`);
                
                resolve({
                    status: res.statusCode,
                    hasRouterScripts: hasRouterScript && hasRouteConfig && hasRouterIntegration
                });
            });
        });
        
        req.on('error', (err) => {
            console.log(`❌ Server connection failed: ${err.message}`);
            reject(err);
        });
        
        req.on('timeout', () => {
            console.log('❌ Server connection timeout');
            req.destroy();
            reject(new Error('Connection timeout'));
        });
        
        req.end();
    });
}

// Test specific routes
function testRoutes() {
    return new Promise((resolve, reject) => {
        console.log('\n🧭 Testing specific routes...');
        
        const testRoutes = [
            '/dashboard',
            '/visi-misi',
            '/manajemen-risiko/input-data',
            '/laporan'
        ];
        
        let completedTests = 0;
        const results = [];
        
        testRoutes.forEach((route, index) => {
            const options = {
                hostname: 'localhost',
                port: 3000,
                path: route,
                method: 'GET',
                timeout: 3000
            };
            
            const req = http.request(options, (res) => {
                const result = {
                    route: route,
                    status: res.statusCode,
                    success: res.statusCode === 200
                };
                
                console.log(`${result.success ? '✅' : '❌'} ${route} - Status: ${res.statusCode}`);
                results.push(result);
                
                completedTests++;
                if (completedTests === testRoutes.length) {
                    resolve(results);
                }
                
                // Consume response data to free up memory
                res.on('data', () => {});
                res.on('end', () => {});
            });
            
            req.on('error', (err) => {
                console.log(`❌ ${route} - Error: ${err.message}`);
                results.push({
                    route: route,
                    status: 'ERROR',
                    success: false,
                    error: err.message
                });
                
                completedTests++;
                if (completedTests === testRoutes.length) {
                    resolve(results);
                }
            });
            
            req.on('timeout', () => {
                console.log(`❌ ${route} - Timeout`);
                req.destroy();
                results.push({
                    route: route,
                    status: 'TIMEOUT',
                    success: false
                });
                
                completedTests++;
                if (completedTests === testRoutes.length) {
                    resolve(results);
                }
            });
            
            req.end();
        });
    });
}

// Test API endpoints
function testApiEndpoints() {
    return new Promise((resolve, reject) => {
        console.log('\n🔌 Testing API endpoints...');
        
        const apiEndpoints = [
            '/api/dashboard',
            '/api/visi-misi',
            '/api/risks',
            '/api/master-data'
        ];
        
        let completedTests = 0;
        const results = [];
        
        apiEndpoints.forEach((endpoint) => {
            const options = {
                hostname: 'localhost',
                port: 3000,
                path: endpoint,
                method: 'GET',
                timeout: 3000,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const req = http.request(options, (res) => {
                const result = {
                    endpoint: endpoint,
                    status: res.statusCode,
                    success: res.statusCode === 200 || res.statusCode === 401 // 401 is expected for auth-protected endpoints
                };
                
                console.log(`${result.success ? '✅' : '❌'} ${endpoint} - Status: ${res.statusCode}`);
                results.push(result);
                
                completedTests++;
                if (completedTests === apiEndpoints.length) {
                    resolve(results);
                }
                
                // Consume response data
                res.on('data', () => {});
                res.on('end', () => {});
            });
            
            req.on('error', (err) => {
                console.log(`❌ ${endpoint} - Error: ${err.message}`);
                results.push({
                    endpoint: endpoint,
                    status: 'ERROR',
                    success: false,
                    error: err.message
                });
                
                completedTests++;
                if (completedTests === apiEndpoints.length) {
                    resolve(results);
                }
            });
            
            req.on('timeout', () => {
                console.log(`❌ ${endpoint} - Timeout`);
                req.destroy();
                results.push({
                    endpoint: endpoint,
                    status: 'TIMEOUT',
                    success: false
                });
                
                completedTests++;
                if (completedTests === apiEndpoints.length) {
                    resolve(results);
                }
            });
            
            req.end();
        });
    });
}

// Main test function
async function runTests() {
    try {
        // Test 1: Server availability
        const serverResult = await testServerAvailability();
        
        if (serverResult.status !== 200) {
            console.log('\n❌ Server is not responding correctly. Please check if server is running.');
            return;
        }
        
        if (!serverResult.hasRouterScripts) {
            console.log('\n⚠️ Router scripts are not properly loaded in HTML.');
        }
        
        // Test 2: Route testing
        const routeResults = await testRoutes();
        const successfulRoutes = routeResults.filter(r => r.success).length;
        console.log(`\n📊 Route Test Results: ${successfulRoutes}/${routeResults.length} routes working`);
        
        // Test 3: API endpoint testing
        const apiResults = await testApiEndpoints();
        const successfulApis = apiResults.filter(r => r.success).length;
        console.log(`\n📊 API Test Results: ${successfulApis}/${apiResults.length} endpoints responding`);
        
        // Final summary
        console.log('\n🎯 Test Summary:');
        console.log(`✅ Server Status: ${serverResult.status === 200 ? 'RUNNING' : 'ISSUES'}`);
        console.log(`✅ Router Scripts: ${serverResult.hasRouterScripts ? 'LOADED' : 'MISSING'}`);
        console.log(`✅ Routes Working: ${successfulRoutes}/${routeResults.length}`);
        console.log(`✅ APIs Responding: ${successfulApis}/${apiResults.length}`);
        
        if (serverResult.status === 200 && serverResult.hasRouterScripts && successfulRoutes > 0) {
            console.log('\n🎉 Server and Router integration appears to be working!');
            console.log('💡 You can now test the application in your browser at http://localhost:3000');
        } else {
            console.log('\n⚠️ Some issues detected. Please check the server configuration and router setup.');
        }
        
    } catch (error) {
        console.log(`\n❌ Test failed: ${error.message}`);
        console.log('💡 Make sure the server is running with: node server.js');
    }
}

// Run the tests
runTests();