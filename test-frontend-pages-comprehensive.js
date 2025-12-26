const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'http://localhost:3003';

async function testFrontendPage(path, pageName) {
    try {
        console.log(`🌐 Testing ${pageName} (${path})...`);
        
        const response = await axios.get(`${BASE_URL}${path}`, {
            timeout: 10000
        });
        
        console.log(`✅ ${pageName} accessible (${response.status})`);
        
        // Parse HTML to check for common issues
        const $ = cheerio.load(response.data);
        
        // Check for basic elements
        const hasTitle = $('title').length > 0;
        const hasScripts = $('script').length > 0;
        const hasStylesheets = $('link[rel="stylesheet"]').length > 0;
        const hasMainContent = $('main, .main, #main, .container').length > 0;
        
        // Check for error messages in HTML
        const hasErrorMessage = response.data.toLowerCase().includes('error') || 
                               response.data.toLowerCase().includes('404') ||
                               response.data.toLowerCase().includes('not found');
        
        // Check for specific elements based on page type
        let specificChecks = {};
        
        if (path.includes('analisis-swot')) {
            specificChecks = {
                hasSwotTable: $('.swot-table, #swot-table, table').length > 0,
                hasSwotForm: $('form, .form').length > 0,
                hasSwotScript: response.data.includes('analisis-swot') || response.data.includes('swot')
            };
        } else if (path.includes('residual-risk')) {
            specificChecks = {
                hasRiskTable: $('.risk-table, #risk-table, table').length > 0,
                hasRiskForm: $('form, .form').length > 0,
                hasRiskScript: response.data.includes('residual-risk') || response.data.includes('risk')
            };
        }
        
        console.log(`   📋 Page analysis:`, {
            hasTitle,
            hasScripts,
            hasStylesheets,
            hasMainContent,
            hasErrorMessage: hasErrorMessage ? '⚠️' : '✅',
            ...specificChecks
        });
        
        // Check for JavaScript errors in console (basic check)
        const hasConsoleError = response.data.includes('console.error') || 
                               response.data.includes('throw new Error');
        
        if (hasConsoleError) {
            console.log('   ⚠️  Potential JavaScript errors detected');
        }
        
        return {
            accessible: true,
            status: response.status,
            hasBasicElements: hasTitle && hasScripts,
            hasErrorMessage,
            specificChecks
        };
        
    } catch (error) {
        console.log(`❌ ${pageName} error:`, error.response?.status || error.message);
        return {
            accessible: false,
            error: error.response?.status || error.message
        };
    }
}

async function testAPIEndpointsFromFrontend() {
    console.log('\n🔌 Testing API endpoints that frontend might use...\n');
    
    // Test without auth first (some endpoints might be public)
    const endpoints = [
        '/api/analisis-swot',
        '/api/risks',
        '/api/risk-profile',
        '/api/dashboard',
        '/api/master-data'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${BASE_URL}${endpoint}`, {
                timeout: 5000
            });
            console.log(`✅ ${endpoint}: ${response.status} (${response.data.data?.length || 0} records)`);
        } catch (error) {
            const status = error.response?.status;
            if (status === 401) {
                console.log(`🔒 ${endpoint}: Requires authentication`);
            } else if (status === 404) {
                console.log(`❌ ${endpoint}: Not found`);
            } else {
                console.log(`❌ ${endpoint}: ${status || error.message}`);
            }
        }
    }
}

async function runFrontendTest() {
    console.log('🚀 Starting comprehensive frontend test...\n');
    
    // Test main pages
    const pages = [
        { path: '/analisis-swot', name: 'Analisis SWOT' },
        { path: '/residual-risk', name: 'Risk Residual' },
        { path: '/dashboard', name: 'Dashboard' },
        { path: '/risk-profile', name: 'Risk Profile' }
    ];
    
    const results = {};
    
    for (const page of pages) {
        results[page.name] = await testFrontendPage(page.path, page.name);
        console.log(''); // Add spacing
    }
    
    // Test API endpoints
    await testAPIEndpointsFromFrontend();
    
    // Summary
    console.log('\n📊 Frontend Test Summary:');
    for (const [pageName, result] of Object.entries(results)) {
        const status = result.accessible ? '✅' : '❌';
        const details = result.accessible ? 
            `(${result.status}, Basic Elements: ${result.hasBasicElements ? '✅' : '❌'})` :
            `(${result.error})`;
        console.log(`   ${pageName}: ${status} ${details}`);
    }
    
    const allAccessible = Object.values(results).every(r => r.accessible);
    console.log(`\n${allAccessible ? '🎉' : '⚠️'} Overall Frontend Status: ${allAccessible ? 'ACCESSIBLE' : 'NEEDS ATTENTION'}`);
}

runFrontendTest().catch(console.error);