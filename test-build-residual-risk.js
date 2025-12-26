const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🏗️  RESIDUAL RISK BUILD TEST');
console.log('='.repeat(60));

// Test build components
async function testBuildComponents() {
    const results = {
        files: {},
        api: {},
        functionality: {}
    };
    
    console.log('\n📁 1. CHECKING REQUIRED FILES...');
    console.log('-'.repeat(40));
    
    // Check critical files
    const criticalFiles = [
        'public/residual-risk.html',
        'routes/reports.js',
        'config/supabase.js',
        '.env',
        'server.js'
    ];
    
    for (const file of criticalFiles) {
        const exists = fs.existsSync(file);
        results.files[file] = exists;
        console.log(`   ${exists ? '✅' : '❌'} ${file}`);
        
        if (exists && file.endsWith('.html')) {
            const content = fs.readFileSync(file, 'utf8');
            const hasAPI = content.includes('/api/reports/residual-risk-simple');
            const hasDebug = content.includes('toggleDebug');
            console.log(`      ${hasAPI ? '✅' : '❌'} API endpoint reference`);
            console.log(`      ${hasDebug ? '✅' : '❌'} Debug functionality`);
        }
    }
    
    console.log('\n🔌 2. TESTING API ENDPOINTS...');
    console.log('-'.repeat(40));
    
    // Test API endpoints
    const endpoints = [
        '/api/reports/residual-risk-simple',
        '/api/reports/residual-risk',
        '/api/reports/residual-risk/excel'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const result = await testEndpoint(endpoint);
            results.api[endpoint] = result;
            console.log(`   ${result.success ? '✅' : '❌'} ${endpoint} (${result.status || 'ERROR'})`);
            if (result.dataCount !== undefined) {
                console.log(`      📊 Data: ${result.dataCount} records`);
            }
            if (!result.success && result.error) {
                console.log(`      ❌ Error: ${result.error}`);
            }
        } catch (error) {
            results.api[endpoint] = { success: false, error: error.message };
            console.log(`   ❌ ${endpoint} - ${error.message}`);
        }
    }
    
    console.log('\n🎯 3. TESTING FUNCTIONALITY...');
    console.log('-'.repeat(40));
    
    // Test page accessibility
    try {
        const pageResult = await testPageAccess();
        results.functionality.pageAccess = pageResult;
        console.log(`   ${pageResult.success ? '✅' : '❌'} Page Access (${pageResult.status || 'ERROR'})`);
        
        if (pageResult.success) {
            console.log(`      📄 Content Length: ${pageResult.contentLength} chars`);
            console.log(`      🔧 Debug Function: ${pageResult.hasDebug ? '✅' : '❌'}`);
            console.log(`      🎨 Bootstrap CSS: ${pageResult.hasBootstrap ? '✅' : '❌'}`);
            console.log(`      📡 API Integration: ${pageResult.hasAPI ? '✅' : '❌'}`);
        }
    } catch (error) {
        results.functionality.pageAccess = { success: false, error: error.message };
        console.log(`   ❌ Page Access - ${error.message}`);
    }
    
    // Test data processing
    try {
        const dataResult = await testDataProcessing();
        results.functionality.dataProcessing = dataResult;
        console.log(`   ${dataResult.success ? '✅' : '❌'} Data Processing`);
        
        if (dataResult.success) {
            console.log(`      📊 Records Processed: ${dataResult.recordCount}`);
            console.log(`      🔢 Statistics Calculated: ${dataResult.hasStats ? '✅' : '❌'}`);
            console.log(`      📋 Table Generation: ${dataResult.hasTable ? '✅' : '❌'}`);
        }
    } catch (error) {
        results.functionality.dataProcessing = { success: false, error: error.message };
        console.log(`   ❌ Data Processing - ${error.message}`);
    }
    
    return results;
}

async function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3003,
            path: endpoint,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    if (endpoint.includes('excel')) {
                        resolve({
                            success: res.statusCode === 200,
                            status: res.statusCode,
                            contentType: res.headers['content-type']
                        });
                    } else {
                        const jsonData = JSON.parse(data);
                        resolve({
                            success: res.statusCode === 200,
                            status: res.statusCode,
                            dataCount: Array.isArray(jsonData) ? jsonData.length : 'N/A'
                        });
                    }
                } catch (error) {
                    resolve({
                        success: false,
                        error: `Parse error: ${error.message}`
                    });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ success: false, error: error.message });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            resolve({ success: false, error: 'Timeout' });
        });

        req.end();
    });
}

async function testPageAccess() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3003,
            path: '/residual-risk.html',
            method: 'GET',
            headers: { 'Accept': 'text/html' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    success: res.statusCode === 200,
                    status: res.statusCode,
                    contentLength: data.length,
                    hasDebug: data.includes('toggleDebug'),
                    hasBootstrap: data.includes('bootstrap'),
                    hasAPI: data.includes('/api/reports/residual-risk-simple')
                });
            });
        });

        req.on('error', (error) => {
            resolve({ success: false, error: error.message });
        });

        req.end();
    });
}

async function testDataProcessing() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3003,
            path: '/api/reports/residual-risk-simple',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    if (Array.isArray(jsonData) && jsonData.length > 0) {
                        const sample = jsonData[0];
                        const hasRiskInputs = !!sample.risk_inputs;
                        const hasInherentData = !!(sample.risk_inputs && sample.risk_inputs.risk_inherent_analysis);
                        
                        resolve({
                            success: true,
                            recordCount: jsonData.length,
                            hasStats: hasRiskInputs && hasInherentData,
                            hasTable: hasRiskInputs && sample.risk_inputs.kode_risiko
                        });
                    } else {
                        resolve({
                            success: false,
                            error: 'No data or invalid format'
                        });
                    }
                } catch (error) {
                    resolve({
                        success: false,
                        error: `Data processing error: ${error.message}`
                    });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ success: false, error: error.message });
        });

        req.end();
    });
}

// Generate build report
function generateBuildReport(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📋 BUILD TEST REPORT');
    console.log('='.repeat(60));
    
    // File checks
    const filesPassed = Object.values(results.files).every(v => v);
    console.log(`\n📁 Files Check: ${filesPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
    // API checks
    const apiPassed = Object.values(results.api).every(v => v.success);
    console.log(`🔌 API Check: ${apiPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Functionality checks
    const funcPassed = Object.values(results.functionality).every(v => v.success);
    console.log(`🎯 Functionality Check: ${funcPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
    const overallPassed = filesPassed && apiPassed && funcPassed;
    
    console.log('\n' + '='.repeat(60));
    console.log(`🏆 OVERALL BUILD STATUS: ${overallPassed ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log('='.repeat(60));
    
    if (overallPassed) {
        console.log('\n🎉 BUILD SUCCESSFUL!');
        console.log('✨ Residual Risk page is ready for production');
        console.log('🌐 Access URL: http://localhost:3003/residual-risk.html');
        console.log('📊 Features Available:');
        console.log('   • Real-time data loading');
        console.log('   • Statistics calculation');
        console.log('   • Interactive table display');
        console.log('   • Debug mode for troubleshooting');
        console.log('   • Excel export functionality');
    } else {
        console.log('\n❌ BUILD FAILED!');
        console.log('🔧 Please fix the following issues:');
        
        if (!filesPassed) {
            console.log('   • Missing or corrupted files');
        }
        if (!apiPassed) {
            console.log('   • API endpoints not working');
        }
        if (!funcPassed) {
            console.log('   • Page functionality issues');
        }
    }
    
    return overallPassed;
}

// Run build test
async function runBuildTest() {
    console.log('Starting build test...\n');
    
    try {
        const results = await testBuildComponents();
        const success = generateBuildReport(results);
        
        // Save results to file
        const reportFile = `build-test-report-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportFile}`);
        
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('\n❌ Build test failed with error:', error.message);
        process.exit(1);
    }
}

// Execute build test
runBuildTest();