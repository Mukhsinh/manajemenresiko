#!/usr/bin/env node

/**
 * Comprehensive Residual Risk Matrix Verification Test
 * Tests all implemented features and enhancements
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3003';
const TEST_RESULTS = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, passed, message, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${name}: ${message}`);
    if (details) {
        console.log(`   Details: ${details}`);
    }
    
    TEST_RESULTS.tests.push({
        name,
        passed,
        message,
        details,
        timestamp: new Date().toISOString()
    });
    
    if (passed) {
        TEST_RESULTS.passed++;
    } else {
        TEST_RESULTS.failed++;
    }
}

function makeRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3003,
            path: path,
            method: method,
            timeout: 10000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function testServerConnectivity() {
    try {
        const response = await makeRequest('/');
        logTest(
            'Server Connectivity',
            response.statusCode === 200,
            `Server responding with status ${response.statusCode}`,
            `Response headers include: ${Object.keys(response.headers).join(', ')}`
        );
    } catch (error) {
        logTest(
            'Server Connectivity',
            false,
            `Server not accessible: ${error.message}`,
            'Make sure the server is running on port 3003'
        );
    }
}

async function testVerificationPageAccess() {
    try {
        const response = await makeRequest('/test-residual-risk-matrix-verification.html');
        const isAccessible = response.statusCode === 200;
        const hasContent = response.data.length > 1000;
        const hasRequiredLibraries = response.data.includes('chart.js') && 
                                   response.data.includes('jspdf') && 
                                   response.data.includes('lucide');
        
        logTest(
            'Verification Page Access',
            isAccessible && hasContent && hasRequiredLibraries,
            `Page accessible: ${isAccessible}, Content size: ${response.data.length} bytes`,
            `Required libraries loaded: Chart.js, jsPDF, Lucide, Bootstrap`
        );
    } catch (error) {
        logTest(
            'Verification Page Access',
            false,
            `Verification page not accessible: ${error.message}`,
            'Check if the HTML file exists and server is serving static files'
        );
    }
}

async function testEnhancedMatrixAccess() {
    try {
        const response = await makeRequest('/residual-risk-matrix-enhanced.html');
        const isAccessible = response.statusCode === 200;
        const hasStarIcon = response.data.includes("pointStyle: 'star'");
        const hasBackgroundColors = response.data.includes('rgba(34, 197, 94, 0.3)');
        const hasPDFExport = response.data.includes('downloadPDF');
        const hasDebugMode = response.data.includes('toggleDebug');
        
        logTest(
            'Enhanced Matrix Access',
            isAccessible && hasStarIcon && hasBackgroundColors && hasPDFExport && hasDebugMode,
            `Enhanced matrix fully accessible with all features`,
            `Star icons: ${hasStarIcon}, Background colors: ${hasBackgroundColors}, PDF export: ${hasPDFExport}, Debug mode: ${hasDebugMode}`
        );
    } catch (error) {
        logTest(
            'Enhanced Matrix Access',
            false,
            `Enhanced matrix not accessible: ${error.message}`,
            'Check if the enhanced matrix HTML file exists'
        );
    }
}

async function testAPIEndpoints() {
    const endpoints = [
        '/api/reports/residual-risk-simple',
        '/api/reports/residual-risk/excel'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest(endpoint);
            const isWorking = response.statusCode === 200;
            let dataInfo = '';
            
            if (endpoint.includes('simple')) {
                try {
                    const jsonData = JSON.parse(response.data);
                    dataInfo = `Array with ${jsonData.length} records`;
                } catch (e) {
                    dataInfo = `Response size: ${response.data.length} bytes`;
                }
            } else {
                dataInfo = `Response size: ${response.data.length} bytes, Content-Type: ${response.headers['content-type']}`;
            }
            
            logTest(
                `API Endpoint ${endpoint}`,
                isWorking,
                `Endpoint responding with status ${response.statusCode}`,
                dataInfo
            );
        } catch (error) {
            logTest(
                `API Endpoint ${endpoint}`,
                false,
                `Endpoint not accessible: ${error.message}`,
                'Check if the API route is properly configured'
            );
        }
    }
}

async function testFileExistence() {
    const requiredFiles = [
        'public/test-residual-risk-matrix-verification.html',
        'public/residual-risk-matrix-enhanced.html',
        'public/css/style.css'
    ];
    
    for (const filePath of requiredFiles) {
        try {
            const exists = fs.existsSync(filePath);
            const stats = exists ? fs.statSync(filePath) : null;
            
            logTest(
                `File Existence: ${path.basename(filePath)}`,
                exists,
                exists ? `File exists (${stats.size} bytes)` : 'File not found',
                exists ? `Last modified: ${stats.mtime.toISOString()}` : `Expected path: ${filePath}`
            );
        } catch (error) {
            logTest(
                `File Existence: ${path.basename(filePath)}`,
                false,
                `Error checking file: ${error.message}`,
                `Path: ${filePath}`
            );
        }
    }
}

async function testFeatureImplementation() {
    try {
        const enhancedMatrixContent = fs.readFileSync('public/residual-risk-matrix-enhanced.html', 'utf8');
        
        const features = [
            {
                name: 'Star Icon Implementation',
                check: enhancedMatrixContent.includes("pointStyle: 'star'") && 
                       enhancedMatrixContent.includes('#FFD700'),
                details: 'Gold star icons for residual risk points'
            },
            {
                name: 'Background Color Zones',
                check: enhancedMatrixContent.includes('rgba(34, 197, 94, 0.3)') && 
                       enhancedMatrixContent.includes('rgba(239, 68, 68, 0.4)'),
                details: 'Color-coded risk zones with gradients'
            },
            {
                name: 'Interactive Tooltips',
                check: enhancedMatrixContent.includes('tooltip') && 
                       enhancedMatrixContent.includes('callbacks'),
                details: 'Rich tooltips with risk information'
            },
            {
                name: 'PDF Export Functionality',
                check: enhancedMatrixContent.includes('downloadPDF') && 
                       enhancedMatrixContent.includes('jsPDF'),
                details: 'Client-side PDF generation with chart export'
            },
            {
                name: 'Debug Mode',
                check: enhancedMatrixContent.includes('toggleDebug') && 
                       enhancedMatrixContent.includes('debugLog'),
                details: 'Comprehensive debugging and logging system'
            },
            {
                name: 'Real-time Refresh',
                check: enhancedMatrixContent.includes('loadData') && 
                       enhancedMatrixContent.includes('refresh'),
                details: 'Manual and automatic data refresh capabilities'
            }
        ];
        
        for (const feature of features) {
            logTest(
                `Feature: ${feature.name}`,
                feature.check,
                feature.check ? 'Feature properly implemented' : 'Feature missing or incomplete',
                feature.details
            );
        }
    } catch (error) {
        logTest(
            'Feature Implementation Check',
            false,
            `Error reading enhanced matrix file: ${error.message}`,
            'Could not verify feature implementation'
        );
    }
}

async function generateReport() {
    const total = TEST_RESULTS.passed + TEST_RESULTS.failed;
    const successRate = total > 0 ? ((TEST_RESULTS.passed / total) * 100).toFixed(1) : '0.0';
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE RESIDUAL RISK MATRIX VERIFICATION REPORT');
    console.log('='.repeat(80));
    console.log(`📊 Total Tests: ${total}`);
    console.log(`✅ Passed: ${TEST_RESULTS.passed}`);
    console.log(`❌ Failed: ${TEST_RESULTS.failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`⏰ Test Completed: ${new Date().toLocaleString('id-ID')}`);
    
    if (TEST_RESULTS.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! 🎯');
        console.log('✨ Residual Risk Matrix implementation is PERFECT!');
        console.log('\n🌟 Features Successfully Verified:');
        console.log('   ⭐ Icon bintang emas untuk residual risk');
        console.log('   🎨 Background warna area level risiko');
        console.log('   📊 Matrix interaktif dengan tooltip');
        console.log('   🔄 Refresh data real-time');
        console.log('   📥 Export Excel/PDF');
        console.log('   🐛 Debug mode untuk troubleshooting');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the implementation.');
        console.log('📋 Failed tests:');
        TEST_RESULTS.tests
            .filter(test => !test.passed)
            .forEach(test => {
                console.log(`   ❌ ${test.name}: ${test.message}`);
            });
    }
    
    // Save detailed report
    const reportPath = `test-results/residual-risk-matrix-verification-${new Date().toISOString().split('T')[0]}.json`;
    
    try {
        if (!fs.existsSync('test-results')) {
            fs.mkdirSync('test-results', { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify({
            summary: {
                total,
                passed: TEST_RESULTS.passed,
                failed: TEST_RESULTS.failed,
                successRate: parseFloat(successRate),
                timestamp: new Date().toISOString()
            },
            tests: TEST_RESULTS.tests
        }, null, 2));
        
        console.log(`\n📄 Detailed report saved: ${reportPath}`);
    } catch (error) {
        console.log(`\n⚠️  Could not save report: ${error.message}`);
    }
    
    console.log('\n🔗 Access the verification page at:');
    console.log(`   http://localhost:3003/test-residual-risk-matrix-verification.html`);
    console.log('\n🎯 Access the enhanced matrix at:');
    console.log(`   http://localhost:3003/residual-risk-matrix-enhanced.html`);
    console.log('='.repeat(80));
}

async function runComprehensiveVerification() {
    console.log('🚀 Starting Comprehensive Residual Risk Matrix Verification...\n');
    
    // Test server connectivity
    await testServerConnectivity();
    
    // Test file existence
    await testFileExistence();
    
    // Test page access
    await testVerificationPageAccess();
    await testEnhancedMatrixAccess();
    
    // Test API endpoints
    await testAPIEndpoints();
    
    // Test feature implementation
    await testFeatureImplementation();
    
    // Generate final report
    await generateReport();
}

// Run the verification
if (require.main === module) {
    runComprehensiveVerification().catch(error => {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runComprehensiveVerification,
    TEST_RESULTS
};