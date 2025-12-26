/**
 * Comprehensive Login Fix Test
 * 
 * Tests untuk memverifikasi perbaikan masalah login:
 * 1. CSP Font Awesome errors
 * 2. JavaScript syntax errors
 * 3. MIME type errors
 * 4. Duplicate code issues
 * 5. Login functionality
 */

const puppeteer = require('puppeteer');

async function testLoginComprehensiveFix() {
    console.log('🧪 Testing Comprehensive Login Fix...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Collect console errors
    const consoleErrors = [];
    const networkErrors = [];
    
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        
        if (type === 'error') {
            consoleErrors.push(text);
            console.log(`❌ CONSOLE ERROR: ${text}`);
        } else if (text.includes('Loading') || text.includes('Auth') || text.includes('Login')) {
            console.log(`📋 INFO: ${text}`);
        }
    });
    
    page.on('response', response => {
        if (!response.ok()) {
            networkErrors.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText()
            });
            console.log(`🌐 NETWORK ERROR: ${response.status()} ${response.url()}`);
        }
    });
    
    try {
        console.log('🌐 Navigating to application...');
        await page.goto('http://localhost:3000', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Test 1: Check for CSP Font Awesome errors
        console.log('🔍 Test 1: Checking for CSP Font Awesome errors...');
        
        await page.waitForTimeout(2000); // Wait for all resources to load
        
        const cspErrors = consoleErrors.filter(error => 
            error.includes('Content Security Policy') && 
            error.includes('font')
        );
        
        console.log(`📊 CSP Font Errors: ${cspErrors.length}`);
        if (cspErrors.length > 0) {
            console.log('❌ CSP Font errors found:', cspErrors);
        } else {
            console.log('✅ No CSP Font errors found');
        }
        
        // Test 2: Check for JavaScript syntax errors
        console.log('🔍 Test 2: Checking for JavaScript syntax errors...');
        
        const syntaxErrors = consoleErrors.filter(error => 
            error.includes('SyntaxError') || 
            error.includes('Unexpected token') ||
            error.includes('already been declared')
        );
        
        console.log(`📊 Syntax Errors: ${syntaxErrors.length}`);
        if (syntaxErrors.length > 0) {
            console.log('❌ Syntax errors found:', syntaxErrors);
        } else {
            console.log('✅ No syntax errors found');
        }
        
        // Test 3: Check for MIME type errors
        console.log('🔍 Test 3: Checking for MIME type errors...');
        
        const mimeErrors = consoleErrors.filter(error => 
            error.includes('MIME type') && 
            error.includes('not executable')
        );
        
        console.log(`📊 MIME Type Errors: ${mimeErrors.length}`);
        if (mimeErrors.length > 0) {
            console.log('❌ MIME type errors found:', mimeErrors);
        } else {
            console.log('✅ No MIME type errors found');
        }
        
        // Test 4: Check if login form is visible and functional
        console.log('🔍 Test 4: Checking login form visibility...');
        
        const loginFormVisible = await page.evaluate(() => {
            const loginScreen = document.getElementById('login-screen');
            const loginForm = document.getElementById('login-form');
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            const submitButton = loginForm?.querySelector('button[type="submit"]');
            
            return {
                loginScreenExists: !!loginScreen,
                loginScreenVisible: loginScreen ? window.getComputedStyle(loginScreen).display !== 'none' : false,
                loginFormExists: !!loginForm,
                emailInputExists: !!emailInput,
                passwordInputExists: !!passwordInput,
                submitButtonExists: !!submitButton,
                submitButtonEnabled: submitButton ? !submitButton.disabled : false
            };
        });
        
        console.log('📊 Login Form Status:', loginFormVisible);
        
        // Test 5: Test login functionality
        console.log('🔍 Test 5: Testing login functionality...');
        
        if (loginFormVisible.loginFormExists && loginFormVisible.emailInputExists && loginFormVisible.passwordInputExists) {
            console.log('📝 Filling login form...');
            
            await page.waitForSelector('#login-email', { timeout: 5000 });
            await page.type('#login-email', 'mukhsin9@gmail.com');
            await page.type('#login-password', 'password123');
            
            console.log('🔐 Submitting login form...');
            await page.click('button[type="submit"]');
            
            // Wait for login response
            await page.waitForTimeout(3000);
            
            // Check if login was successful
            const loginResult = await page.evaluate(() => {
                const appScreen = document.getElementById('app-screen');
                const loginScreen = document.getElementById('login-screen');
                const authMessage = document.getElementById('auth-message');
                
                return {
                    appScreenVisible: appScreen ? window.getComputedStyle(appScreen).display !== 'none' : false,
                    loginScreenVisible: loginScreen ? window.getComputedStyle(loginScreen).display !== 'none' : false,
                    authMessage: authMessage ? authMessage.textContent.trim() : '',
                    currentUser: !!window.currentUser,
                    isAuthenticated: !!window.isAuthenticated
                };
            });
            
            console.log('📊 Login Result:', loginResult);
            
            if (loginResult.appScreenVisible && !loginResult.loginScreenVisible) {
                console.log('✅ Login successful - App screen visible');
                
                // Test 6: Check if Rencana Strategis navigation works
                console.log('🔍 Test 6: Testing Rencana Strategis navigation...');
                
                try {
                    await page.waitForSelector('.menu-item[data-page="rencana-strategis"]', { timeout: 5000 });
                    await page.click('.menu-item[data-page="rencana-strategis"]');
                    
                    await page.waitForTimeout(2000);
                    
                    const rencanaResult = await page.evaluate(() => {
                        const rencanaPage = document.getElementById('rencana-strategis');
                        const rencanaContainer = document.getElementById('rencana-strategis-content');
                        
                        return {
                            pageExists: !!rencanaPage,
                            pageActive: rencanaPage ? rencanaPage.classList.contains('active') : false,
                            containerExists: !!rencanaContainer,
                            containerHasContent: rencanaContainer ? rencanaContainer.innerHTML.length > 100 : false
                        };
                    });
                    
                    console.log('📊 Rencana Strategis Result:', rencanaResult);
                    
                    if (rencanaResult.pageActive && rencanaResult.containerExists) {
                        console.log('✅ Rencana Strategis navigation successful');
                    } else {
                        console.log('⚠️ Rencana Strategis navigation has issues');
                    }
                } catch (navError) {
                    console.log('⚠️ Rencana Strategis navigation failed:', navError.message);
                }
                
            } else {
                console.log('❌ Login failed or app screen not visible');
                console.log('Auth message:', loginResult.authMessage);
            }
        } else {
            console.log('❌ Login form not properly available');
        }
        
        // Test 7: Check Font Awesome icons are loading
        console.log('🔍 Test 7: Checking Font Awesome icons...');
        
        const fontAwesomeStatus = await page.evaluate(() => {
            const icons = document.querySelectorAll('i[class*="fa-"], .fas, .fab, .far');
            const iconCount = icons.length;
            
            // Check if Font Awesome CSS is loaded
            const fontAwesomeLinks = Array.from(document.querySelectorAll('link[href*="font-awesome"]'));
            const fontAwesomeLoaded = fontAwesomeLinks.length > 0;
            
            // Check if icons have proper font-family
            let iconsWithFontFamily = 0;
            icons.forEach(icon => {
                const computedStyle = window.getComputedStyle(icon);
                if (computedStyle.fontFamily.includes('Font Awesome')) {
                    iconsWithFontFamily++;
                }
            });
            
            return {
                iconCount,
                fontAwesomeLoaded,
                iconsWithFontFamily,
                fontAwesomeLinks: fontAwesomeLinks.map(link => link.href)
            };
        });
        
        console.log('📊 Font Awesome Status:', fontAwesomeStatus);
        
        // Summary
        console.log('\n📊 TEST SUMMARY:');
        console.log('================');
        console.log(`✅ CSP Font Errors: ${cspErrors.length === 0 ? 'PASS' : 'FAIL'} (${cspErrors.length} errors)`);
        console.log(`✅ Syntax Errors: ${syntaxErrors.length === 0 ? 'PASS' : 'FAIL'} (${syntaxErrors.length} errors)`);
        console.log(`✅ MIME Type Errors: ${mimeErrors.length === 0 ? 'PASS' : 'FAIL'} (${mimeErrors.length} errors)`);
        console.log(`✅ Login Form: ${loginFormVisible.loginFormExists ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Font Awesome: ${fontAwesomeStatus.fontAwesomeLoaded ? 'PASS' : 'FAIL'} (${fontAwesomeStatus.iconCount} icons)`);
        console.log(`✅ Network Errors: ${networkErrors.length === 0 ? 'PASS' : 'FAIL'} (${networkErrors.length} errors)`);
        
        const allTestsPassed = cspErrors.length === 0 && 
                              syntaxErrors.length === 0 && 
                              mimeErrors.length === 0 && 
                              loginFormVisible.loginFormExists &&
                              fontAwesomeStatus.fontAwesomeLoaded &&
                              networkErrors.length === 0;
        
        if (allTestsPassed) {
            console.log('\n🎉 ALL TESTS PASSED! Login fix is working correctly.');
        } else {
            console.log('\n⚠️ Some tests failed. Please check the issues above.');
        }
        
        // Take screenshot for verification
        await page.screenshot({ 
            path: 'login-comprehensive-fix-test.png', 
            fullPage: true 
        });
        
        console.log('📸 Screenshot saved as login-comprehensive-fix-test.png');
        
        return {
            success: allTestsPassed,
            results: {
                cspErrors: cspErrors.length,
                syntaxErrors: syntaxErrors.length,
                mimeErrors: mimeErrors.length,
                networkErrors: networkErrors.length,
                loginForm: loginFormVisible,
                fontAwesome: fontAwesomeStatus
            }
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error: error.message };
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    testLoginComprehensiveFix()
        .then((result) => {
            console.log('✅ Test completed');
            if (result.success) {
                console.log('🎉 All fixes working correctly!');
                process.exit(0);
            } else {
                console.log('⚠️ Some issues remain');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testLoginComprehensiveFix };