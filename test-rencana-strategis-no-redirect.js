/**
 * Test Script: Rencana Strategis No Redirect Fix
 * Tests the fix for unwanted redirects from Rencana Strategis page
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Rencana Strategis No Redirect Fix...\n');

// Test configuration
const testConfig = {
    serverPort: process.env.PORT || 3001,
    testUrl: `http://localhost:${process.env.PORT || 3001}`,
    testPages: [
        '/test-rencana-strategis-no-redirect.html',
        '/rencana-strategis'
    ]
};

console.log('📋 Test Configuration:');
console.log(`   Server Port: ${testConfig.serverPort}`);
console.log(`   Test URL: ${testConfig.testUrl}`);
console.log(`   Test Pages: ${testConfig.testPages.join(', ')}\n`);

// Check if server is running
function checkServerStatus() {
    try {
        const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${testConfig.testUrl}`, { 
            encoding: 'utf8',
            timeout: 5000 
        });
        
        if (response.trim() === '200') {
            console.log('✅ Server is running and accessible');
            return true;
        } else {
            console.log(`⚠️ Server responded with status: ${response.trim()}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Server is not accessible:', error.message);
        return false;
    }
}

// Check if required files exist
function checkRequiredFiles() {
    console.log('📁 Checking required files...');
    
    const requiredFiles = [
        'public/js/router.js',
        'public/js/rencana-strategis.js',
        'public/js/rencana-strategis-fix.js',
        'public/test-rencana-strategis-no-redirect.html',
        'routes/rencana-strategis.js'
    ];
    
    let allFilesExist = true;
    
    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`   ✅ ${file}`);
        } else {
            console.log(`   ❌ ${file} - MISSING`);
            allFilesExist = false;
        }
    });
    
    return allFilesExist;
}

// Test API endpoints
async function testApiEndpoints() {
    console.log('🔌 Testing API endpoints...');
    
    const endpoints = [
        '/api/rencana-strategis/public',
        '/api/rencana-strategis/generate/kode/public',
        '/api/visi-misi/public'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = execSync(`curl -s -w "\\n%{http_code}" ${testConfig.testUrl}${endpoint}`, { 
                encoding: 'utf8',
                timeout: 10000 
            });
            
            const lines = response.trim().split('\n');
            const statusCode = lines[lines.length - 1];
            const body = lines.slice(0, -1).join('\n');
            
            if (statusCode === '200') {
                console.log(`   ✅ ${endpoint} - OK`);
                
                // Try to parse JSON response
                try {
                    const data = JSON.parse(body);
                    if (Array.isArray(data)) {
                        console.log(`      📊 Returned ${data.length} items`);
                    } else if (data.kode) {
                        console.log(`      🔢 Generated kode: ${data.kode}`);
                    }
                } catch (parseError) {
                    console.log(`      ⚠️ Non-JSON response: ${body.substring(0, 100)}...`);
                }
            } else {
                console.log(`   ❌ ${endpoint} - Status: ${statusCode}`);
                if (body) {
                    console.log(`      Error: ${body.substring(0, 200)}...`);
                }
            }
        } catch (error) {
            console.log(`   ❌ ${endpoint} - Error: ${error.message}`);
        }
    }
}

// Test JavaScript modules
function testJavaScriptModules() {
    console.log('📜 Testing JavaScript modules...');
    
    const jsFiles = [
        'public/js/router.js',
        'public/js/rencana-strategis.js',
        'public/js/rencana-strategis-fix.js'
    ];
    
    jsFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            
            // Basic syntax checks
            const hasErrors = content.includes('SyntaxError') || 
                             content.includes('ReferenceError') ||
                             content.includes('TypeError');
            
            // Check for key functions/classes
            let keyFeatures = [];
            
            if (file.includes('router.js')) {
                if (content.includes('class SPARouter')) keyFeatures.push('SPARouter class');
                if (content.includes('handleInitialRoute')) keyFeatures.push('handleInitialRoute');
                if (content.includes('preventAutoRedirect')) keyFeatures.push('preventAutoRedirect');
            }
            
            if (file.includes('rencana-strategis.js')) {
                if (content.includes('RencanaStrategisModule')) keyFeatures.push('RencanaStrategisModule');
                if (content.includes('ensurePageVisibility')) keyFeatures.push('ensurePageVisibility');
                if (content.includes('loadRencanaStrategis')) keyFeatures.push('loadRencanaStrategis');
            }
            
            if (file.includes('rencana-strategis-fix.js')) {
                if (content.includes('ensureRencanaStrategisActive')) keyFeatures.push('ensureRencanaStrategisActive');
                if (content.includes('monitorPageChanges')) keyFeatures.push('monitorPageChanges');
                if (content.includes('preventRedirect')) keyFeatures.push('preventRedirect');
            }
            
            console.log(`   ✅ ${file}`);
            if (keyFeatures.length > 0) {
                console.log(`      🔧 Features: ${keyFeatures.join(', ')}`);
            }
            
            if (hasErrors) {
                console.log(`      ⚠️ Potential syntax issues detected`);
            }
            
        } catch (error) {
            console.log(`   ❌ ${file} - Error reading: ${error.message}`);
        }
    });
}

// Generate test report
function generateTestReport() {
    const report = {
        timestamp: new Date().toISOString(),
        testName: 'Rencana Strategis No Redirect Fix',
        serverPort: testConfig.serverPort,
        results: {
            serverStatus: checkServerStatus(),
            requiredFiles: checkRequiredFiles(),
            // API endpoints will be tested separately
        },
        recommendations: []
    };
    
    // Add recommendations based on results
    if (!report.results.serverStatus) {
        report.recommendations.push('Start the server before running tests');
    }
    
    if (!report.results.requiredFiles) {
        report.recommendations.push('Ensure all required files are present');
    }
    
    // Save report
    const reportPath = `test-results/rencana-strategis-no-redirect-${Date.now()}.json`;
    
    // Create test-results directory if it doesn't exist
    if (!fs.existsSync('test-results')) {
        fs.mkdirSync('test-results', { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Test report saved to: ${reportPath}`);
    
    return report;
}

// Main test execution
async function runTests() {
    console.log('🚀 Starting Rencana Strategis No Redirect Fix Tests...\n');
    
    try {
        // Step 1: Check server status
        const serverRunning = checkServerStatus();
        console.log('');
        
        // Step 2: Check required files
        const filesExist = checkRequiredFiles();
        console.log('');
        
        // Step 3: Test JavaScript modules
        testJavaScriptModules();
        console.log('');
        
        // Step 4: Test API endpoints (only if server is running)
        if (serverRunning) {
            await testApiEndpoints();
            console.log('');
        }
        
        // Step 5: Generate report
        const report = generateTestReport();
        
        // Summary
        console.log('📋 Test Summary:');
        console.log(`   Server Status: ${report.results.serverStatus ? '✅ Running' : '❌ Not Running'}`);
        console.log(`   Required Files: ${report.results.requiredFiles ? '✅ All Present' : '❌ Missing Files'}`);
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach(rec => {
                console.log(`   • ${rec}`);
            });
        }
        
        console.log('\n🎯 Next Steps:');
        console.log('   1. Open browser and navigate to: ' + testConfig.testUrl + '/test-rencana-strategis-no-redirect.html');
        console.log('   2. Run the interactive tests to verify the fix');
        console.log('   3. Test the actual Rencana Strategis page: ' + testConfig.testUrl + '/rencana-strategis');
        console.log('   4. Verify that the page does not redirect back to dashboard');
        
        console.log('\n✅ Test execution completed!');
        
    } catch (error) {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    runTests,
    checkServerStatus,
    checkRequiredFiles,
    testApiEndpoints,
    testJavaScriptModules,
    generateTestReport
};