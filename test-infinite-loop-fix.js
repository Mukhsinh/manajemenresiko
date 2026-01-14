/**
 * TEST VERIFICATION FOR INFINITE LOOP FIX
 * Run this to verify the fix is working
 */

const http = require('http');
const fs = require('fs');

console.log('🧪 Testing infinite loop fix...');

// Test 1: Check if problematic files are disabled
function testProblematicFiles() {
    console.log('\n📋 Test 1: Checking problematic files...');
    
    const problematicFiles = [
        'public/js/comprehensive-ui-fix.js',
        'public/js/ui-enhancement-framework.js'
    ];
    
    problematicFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('setInterval') || content.includes('setTimeout')) {
                console.log(`⚠️  ${file} still contains potential loop triggers`);
            } else {
                console.log(`✅ ${file} appears safe`);
            }
        } else {
            console.log(`ℹ️  ${file} not found (OK)`);
        }
    });
}

// Test 2: Check if fixed files exist
function testFixedFiles() {
    console.log('\n📋 Test 2: Checking fixed files...');
    
    const fixedFiles = [
        'public/js/page-initialization-system-fixed.js',
        'public/js/rencana-strategis-fixed.js',
        'public/js/startup-script.js'
    ];
    
    fixedFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} exists`);
        } else {
            console.log(`❌ ${file} missing`);
        }
    });
}

// Test 3: Test server response
function testServerResponse() {
    console.log('\n📋 Test 3: Testing server response...');
    
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/rencana-strategis',
        method: 'GET'
    };
    
    const req = http.request(options, (res) => {
        console.log(`✅ Server responded with status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            if (data.includes('page-initialization-system-fixed.js')) {
                console.log('✅ Fixed scripts are being served');
            } else {
                console.log('⚠️  Fixed scripts may not be properly integrated');
            }
        });
    });
    
    req.on('error', (err) => {
        console.log(`⚠️  Server test failed: ${err.message}`);
        console.log('ℹ️  Make sure the server is running on port 3001');
    });
    
    req.end();
}

// Run all tests
testProblematicFiles();
testFixedFiles();
testServerResponse();

console.log('\n✅ Test verification completed. Check the results above.');
console.log('\n🚀 To test the fix:');
console.log('1. Start the server: npm start');
console.log('2. Open: http://localhost:3001/rencana-strategis');
console.log('3. Check console for "all ui fixed applied" messages (should be gone)');
console.log('4. Verify page loads without manual refresh');
