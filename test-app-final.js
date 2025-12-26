/**
 * Final Application Test
 * Tests the complete application after fixing all syntax errors
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, text: data }));
        });
        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function testApplicationEndpoints() {
    console.log('🌐 Testing application endpoints...\n');
    
    const tests = [
        {
            name: 'Main Application Page',
            url: '/',
            expectedStatus: 200,
            expectedContent: ['<!DOCTYPE html', 'login-screen', 'app-screen']
        },
        {
            name: 'Test Login Fix Page',
            url: '/test-login-fix-final.html',
            expectedStatus: 200,
            expectedContent: ['Test Login Fix Final', 'console-output', 'test-login-form']
        },
        {
            name: 'API Service JS',
            url: '/js/services/apiService.js',
            expectedStatus: 200,
            expectedContent: ['API_BASE_URL', 'apiCall', 'getAuthToken']
        },
        {
            name: '404 Handler JS',
            url: '/js/404-handler.js',
            expectedStatus: 200,
            expectedContent: ['show404Error', 'navigateTo', 'goBack']
        },
        {
            name: 'App JS',
            url: '/js/app.js',
            expectedStatus: 200,
            expectedContent: ['navigateToPage', 'checkAuth', 'loadPageData']
        }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        try {
            console.log(`🧪 Testing: ${test.name}`);
            
            const response = await makeRequest(`${BASE_URL}${test.url}`);
            const content = response.text;
            
            // Check status
            if (response.status !== test.expectedStatus) {
                console.error(`❌ Status mismatch: expected ${test.expectedStatus}, got ${response.status}`);
                continue;
            }
            
            // Check content
            let contentPassed = true;
            for (const expectedText of test.expectedContent) {
                if (!content.includes(expectedText)) {
                    console.error(`❌ Missing content: "${expectedText}"`);
                    contentPassed = false;
                }
            }
            
            if (contentPassed) {
                console.log(`✅ ${test.name} - PASSED`);
                passedTests++;
            } else {
                console.log(`❌ ${test.name} - FAILED (content check)`);
            }
            
        } catch (error) {
            console.error(`❌ ${test.name} - ERROR: ${error.message}`);
        }
        
        console.log(''); // Empty line for readability
    }
    
    console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Application is ready.');
        return true;
    } else {
        console.log('❌ Some tests failed. Please check the errors above.');
        return false;
    }
}

async function testSyntaxErrors() {
    console.log('🔍 Testing for syntax errors...\n');
    
    try {
        // Test API Service
        const apiServiceResponse = await makeRequest(`${BASE_URL}/js/services/apiService.js`);
        const apiServiceContent = apiServiceResponse.text;
        
        // Check for duplicate API_BASE_URL declaration
        const apiBaseUrlMatches = apiServiceContent.match(/const API_BASE_URL/g);
        if (apiBaseUrlMatches && apiBaseUrlMatches.length > 1) {
            console.error('❌ Duplicate API_BASE_URL declaration found');
            return false;
        } else {
            console.log('✅ API_BASE_URL declaration fixed');
        }
        
        // Test 404 Handler
        const handlerResponse = await makeRequest(`${BASE_URL}/js/404-handler.js`);
        const handlerContent = handlerResponse.text;
        
        // Check for invalid tokens
        if (handlerContent.includes('\\n\\n/**\\n')) {
            console.error('❌ Invalid escape sequences in 404 handler');
            return false;
        } else {
            console.log('✅ 404 handler syntax fixed');
        }
        
        // Test App.js
        const appResponse = await makeRequest(`${BASE_URL}/js/app.js`);
        const appContent = appResponse.text;
        
        // Check for await without async
        const awaitMatches = appContent.match(/^\s*await\s+/gm);
        if (awaitMatches) {
            // Check if these awaits are inside async functions
            let hasInvalidAwait = false;
            const lines = appContent.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith('await ')) {
                    // Look backwards for function declaration
                    let foundAsync = false;
                    for (let j = i - 1; j >= 0; j--) {
                        if (lines[j].includes('async function') || lines[j].includes('async ()') || lines[j].includes('= async')) {
                            foundAsync = true;
                            break;
                        }
                        if (lines[j].includes('function ') && !lines[j].includes('async')) {
                            break;
                        }
                    }
                    
                    if (!foundAsync) {
                        console.error(`❌ Invalid await at line ${i + 1}: ${lines[i].trim()}`);
                        hasInvalidAwait = true;
                    }
                }
            }
            
            if (hasInvalidAwait) {
                return false;
            }
        }
        
        console.log('✅ App.js async/await syntax fixed');
        
        console.log('\n🎉 All syntax errors have been fixed!');
        return true;
        
    } catch (error) {
        console.error('❌ Error testing syntax:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting comprehensive application tests...\n');
    
    const syntaxTest = await testSyntaxErrors();
    console.log('');
    
    const endpointTest = await testApplicationEndpoints();
    console.log('');
    
    console.log('📋 Final Results:');
    console.log(`Syntax Errors Fixed: ${syntaxTest ? '✅ YES' : '❌ NO'}`);
    console.log(`Application Endpoints: ${endpointTest ? '✅ WORKING' : '❌ ISSUES'}`);
    
    if (syntaxTest && endpointTest) {
        console.log('\n🎉 SUCCESS! Application is ready for use.');
        console.log('\n📝 Next Steps:');
        console.log('1. Open browser and go to: http://localhost:3000');
        console.log('2. Try logging in with: mukhsin9@gmail.com / password123');
        console.log('3. Test page: http://localhost:3000/test-login-fix-final.html');
        console.log('4. Check browser console for any remaining issues');
    } else {
        console.log('\n❌ Some issues remain. Please check the errors above.');
    }
}

runAllTests().catch(console.error);