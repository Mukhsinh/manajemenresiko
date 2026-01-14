#!/usr/bin/env node

// Test Port 3033 Verification - Deep Analysis
const axios = require('axios');

const BASE_URL = 'http://localhost:3033';

async function testPort3033() {
    console.log('🔍 DEEP ANALYSIS: Port 3033 Verification');
    console.log('=' .repeat(60));
    
    try {
        // 1. Test basic connectivity
        console.log('\n1. 🌐 Testing Basic Connectivity...');
        const healthResponse = await axios.get(`${BASE_URL}/`);
        console.log(`✅ Server responding on port 3033: ${healthResponse.status}`);
        
        // 2. Test JavaScript file directly
        console.log('\n2. 📄 Testing JavaScript File...');
        const jsResponse = await axios.get(`${BASE_URL}/js/rencana-strategis.js`);
        console.log(`✅ JavaScript file accessible: ${jsResponse.status}`);
        
        // Check for table default version
        const jsContent = jsResponse.data;
        const hasTableDefault = jsContent.includes('Table Default Version');
        const hasCurrentViewTable = jsContent.includes("currentView: 'table'");
        const hasShowTableView = jsContent.includes('showTableView()');
        
        console.log(`   - Contains "Table Default Version": ${hasTableDefault ? '✅' : '❌'}`);
        console.log(`   - Contains "currentView: 'table'": ${hasCurrentViewTable ? '✅' : '❌'}`);
        console.log(`   - Contains "showTableView()": ${hasShowTableView ? '✅' : '❌'}`);
        
        // 3. Test Rencana Strategis page
        console.log('\n3. 🎯 Testing Rencana Strategis Page...');
        try {
            const pageResponse = await axios.get(`${BASE_URL}/rencana-strategis`);
            console.log(`✅ Rencana Strategis page accessible: ${pageResponse.status}`);
            
            // Check if page contains expected elements
            const pageContent = pageResponse.data;
            const hasRencanaStrategisDiv = pageContent.includes('id="rencana-strategis"');
            const hasTableSection = pageContent.includes('table-section');
            const hasJSInclude = pageContent.includes('rencana-strategis.js');
            
            console.log(`   - Contains rencana-strategis div: ${hasRencanaStrategisDiv ? '✅' : '❌'}`);
            console.log(`   - Contains table-section: ${hasTableSection ? '✅' : '❌'}`);
            console.log(`   - Includes rencana-strategis.js: ${hasJSInclude ? '✅' : '❌'}`);
            
        } catch (error) {
            console.log(`❌ Rencana Strategis page error: ${error.message}`);
        }
        
        // 4. Test API endpoints
        console.log('\n4. 🔌 Testing API Endpoints...');
        try {
            const apiResponse = await axios.get(`${BASE_URL}/api/rencana-strategis/public`);
            console.log(`✅ API endpoint accessible: ${apiResponse.status}`);
            console.log(`   - Data count: ${Array.isArray(apiResponse.data) ? apiResponse.data.length : 'N/A'}`);
        } catch (error) {
            console.log(`❌ API endpoint error: ${error.message}`);
        }
        
        // 5. Check for potential blocking issues
        console.log('\n5. 🚫 Checking for Potential Blocking Issues...');
        
        // Check if there are any router conflicts
        try {
            const routerResponse = await axios.get(`${BASE_URL}/js/router.js`);
            const routerContent = routerResponse.data;
            const hasRencanaRoute = routerContent.includes('rencana-strategis');
            console.log(`   - Router includes rencana-strategis route: ${hasRencanaRoute ? '✅' : '❌'}`);
        } catch (error) {
            console.log(`   - Router file not accessible: ${error.message}`);
        }
        
        // Check for navigation conflicts
        try {
            const navResponse = await axios.get(`${BASE_URL}/js/navigation.js`);
            const navContent = navResponse.data;
            const hasNavConflict = navContent.includes('preventDefault') && navContent.includes('rencana-strategis');
            console.log(`   - Navigation conflicts detected: ${hasNavConflict ? '⚠️' : '✅'}`);
        } catch (error) {
            console.log(`   - Navigation file not accessible: ${error.message}`);
        }
        
        // 6. Browser Cache Analysis
        console.log('\n6. 🗄️ Browser Cache Analysis...');
        const jsHeaders = jsResponse.headers;
        console.log(`   - Cache-Control: ${jsHeaders['cache-control'] || 'Not set'}`);
        console.log(`   - ETag: ${jsHeaders['etag'] || 'Not set'}`);
        console.log(`   - Last-Modified: ${jsHeaders['last-modified'] || 'Not set'}`);
        
        // 7. File timestamp check
        console.log('\n7. ⏰ File Timestamp Analysis...');
        const fs = require('fs');
        const path = require('path');
        
        const jsFilePath = path.join(__dirname, 'public', 'js', 'rencana-strategis.js');
        if (fs.existsSync(jsFilePath)) {
            const stats = fs.statSync(jsFilePath);
            console.log(`   - File last modified: ${stats.mtime}`);
            console.log(`   - File size: ${stats.size} bytes`);
            
            // Check if file was recently modified
            const now = new Date();
            const timeDiff = now - stats.mtime;
            const minutesAgo = Math.floor(timeDiff / (1000 * 60));
            console.log(`   - Modified ${minutesAgo} minutes ago`);
            
            if (minutesAgo > 60) {
                console.log(`   ⚠️ WARNING: File was not recently modified. Changes might not be applied.`);
            }
        } else {
            console.log(`   ❌ JavaScript file not found at expected location`);
        }
        
        // 8. Summary and Recommendations
        console.log('\n8. 📋 ANALYSIS SUMMARY');
        console.log('=' .repeat(40));
        
        if (hasTableDefault && hasCurrentViewTable && hasShowTableView) {
            console.log('✅ JavaScript file contains all required table default changes');
        } else {
            console.log('❌ JavaScript file is missing some table default changes');
        }
        
        console.log('\n🔧 RECOMMENDATIONS:');
        console.log('1. Clear browser cache (Ctrl+F5 or Ctrl+Shift+R)');
        console.log('2. Check browser console for JavaScript errors');
        console.log('3. Verify no router conflicts are overriding the page');
        console.log('4. Ensure no authentication redirects are interfering');
        console.log('5. Check if any other JavaScript files are conflicting');
        
        console.log('\n🌐 DIRECT TEST URLS:');
        console.log(`- Main page: ${BASE_URL}/rencana-strategis`);
        console.log(`- JavaScript: ${BASE_URL}/js/rencana-strategis.js`);
        console.log(`- API: ${BASE_URL}/api/rencana-strategis/public`);
        
    } catch (error) {
        console.error('❌ CRITICAL ERROR:', error.message);
        console.log('\n💡 TROUBLESHOOTING STEPS:');
        console.log('1. Verify server is running on port 3033');
        console.log('2. Check if port is blocked by firewall');
        console.log('3. Restart the application server');
        console.log('4. Check server logs for errors');
    }
}

// Run the test
testPort3033().catch(console.error);