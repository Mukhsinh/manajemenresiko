const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'http://localhost:3003';

async function testEnhancedPage(path, pageName) {
    try {
        console.log(`🌐 Testing Enhanced ${pageName} (${path})...`);
        
        const response = await axios.get(`${BASE_URL}${path}`, {
            timeout: 10000
        });
        
        console.log(`✅ ${pageName} accessible (${response.status})`);
        
        // Parse HTML to check for enhancements
        const $ = cheerio.load(response.data);
        
        // Check for enhanced elements
        const hasEnhancedJS = response.data.includes('enhanced-fix.js');
        const hasSummaryCards = $('.summary-card').length > 0;
        const hasLoadingIndicator = $('#loadingIndicator').length > 0;
        const hasErrorHandling = $('#errorMessage').length > 0;
        const hasBootstrap = response.data.includes('bootstrap');
        const hasFontAwesome = response.data.includes('font-awesome');
        
        // Check for specific enhancements
        let specificChecks = {};
        
        if (path.includes('analisis-swot')) {
            specificChecks = {
                hasSwotManager: response.data.includes('AnalisisSWOTManager'),
                hasSwotModal: $('#addSwotModal').length > 0,
                hasSwotForm: $('#swotForm').length > 0,
                hasSwotTable: $('#swotTable').length > 0,
                hasSummaryCards: $('.summary-card').length >= 4
            };
        } else if (path.includes('residual-risk')) {
            specificChecks = {
                hasResidualManager: response.data.includes('ResidualRiskManager'),
                hasFilterForm: $('#filterForm').length > 0,
                hasRiskTable: $('#residualRiskTable').length > 0,
                hasRiskLevelLegend: $('.risk-level-legend').length > 0,
                hasSummaryCards: $('.summary-card').length >= 4
            };
        }
        
        console.log(`   📋 Enhancement analysis:`, {
            hasEnhancedJS: hasEnhancedJS ? '✅' : '❌',
            hasSummaryCards: hasSummaryCards ? '✅' : '❌',
            hasLoadingIndicator: hasLoadingIndicator ? '✅' : '✅',
            hasErrorHandling: hasErrorHandling ? '✅' : '❌',
            hasBootstrap: hasBootstrap ? '✅' : '❌',
            hasFontAwesome: hasFontAwesome ? '✅' : '❌',
            ...specificChecks
        });
        
        return {
            accessible: true,
            status: response.status,
            enhanced: hasEnhancedJS && hasSummaryCards && hasErrorHandling,
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

async function testAPIIntegration() {
    console.log('\n🔌 Testing API integration with authentication...\n');
    
    // Login first
    try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'mukhsin9@gmail.com',
            password: 'Jlamprang233!!'
        });
        
        const token = loginResponse.data.session?.access_token;
        if (!token) {
            console.log('❌ No access token received from login');
            return;
        }
        
        console.log('✅ Login successful, testing APIs...');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // Test SWOT API
        try {
            const swotResponse = await axios.get(`${BASE_URL}/api/analisis-swot`, { headers });
            console.log(`✅ SWOT API: ${swotResponse.status} (${swotResponse.data.data?.length || 0} records)`);
            
            if (swotResponse.data.data && swotResponse.data.data.length > 0) {
                const sample = swotResponse.data.data[0];
                console.log('   📝 Sample SWOT data:', {
                    faktor: sample.faktor?.substring(0, 30) + '...',
                    jenis: sample.jenis,
                    bobot: sample.bobot,
                    rating: sample.rating,
                    skor: sample.skor
                });
            }
        } catch (error) {
            console.log(`❌ SWOT API error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
        
        // Test Risks API (for residual data)
        try {
            const risksResponse = await axios.get(`${BASE_URL}/api/risks`, { headers });
            console.log(`✅ Risks API: ${risksResponse.status} (${risksResponse.data.data?.length || 0} records)`);
            
            if (risksResponse.data.data && risksResponse.data.data.length > 0) {
                const sample = risksResponse.data.data[0];
                console.log('   📝 Sample Risk data:', {
                    kode_risiko: sample.kode_risiko,
                    risk_event: sample.risk_event?.substring(0, 30) + '...',
                    hasResidualAnalysis: !!sample.risk_residual_analysis,
                    hasInherentAnalysis: !!sample.risk_inherent_analysis
                });
            }
        } catch (error) {
            console.log(`❌ Risks API error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
        
    } catch (error) {
        console.log('❌ Login failed:', error.response?.data?.message || error.message);
    }
}

async function testJavaScriptFiles() {
    console.log('\n📜 Testing JavaScript files...\n');
    
    const jsFiles = [
        '/js/analisis-swot-enhanced-fix.js',
        '/js/residual-risk-enhanced-fix.js'
    ];
    
    for (const jsFile of jsFiles) {
        try {
            const response = await axios.get(`${BASE_URL}${jsFile}`);
            console.log(`✅ ${jsFile}: ${response.status} (${response.data.length} chars)`);
            
            // Check for key classes
            const hasManagerClass = response.data.includes('class ') && 
                                  (response.data.includes('Manager') || response.data.includes('SWOT') || response.data.includes('Risk'));
            const hasErrorHandling = response.data.includes('catch') && response.data.includes('error');
            const hasAPIIntegration = response.data.includes('fetch') && response.data.includes('api');
            
            console.log(`   📋 JS Analysis: Manager Class: ${hasManagerClass ? '✅' : '❌'}, Error Handling: ${hasErrorHandling ? '✅' : '❌'}, API Integration: ${hasAPIIntegration ? '✅' : '❌'}`);
            
        } catch (error) {
            console.log(`❌ ${jsFile}: ${error.response?.status || error.message}`);
        }
    }
}

async function runEnhancedTest() {
    console.log('🚀 Starting comprehensive enhanced pages test...\n');
    
    // Test enhanced pages
    const pages = [
        { path: '/analisis-swot-enhanced-final.html', name: 'Enhanced Analisis SWOT' },
        { path: '/residual-risk-enhanced-final.html', name: 'Enhanced Residual Risk' }
    ];
    
    const results = {};
    
    for (const page of pages) {
        results[page.name] = await testEnhancedPage(page.path, page.name);
        console.log(''); // Add spacing
    }
    
    // Test JavaScript files
    await testJavaScriptFiles();
    
    // Test API integration
    await testAPIIntegration();
    
    // Summary
    console.log('\n📊 Enhanced Pages Test Summary:');
    for (const [pageName, result] of Object.entries(results)) {
        const status = result.accessible ? '✅' : '❌';
        const enhanced = result.enhanced ? '🎉' : '⚠️';
        const details = result.accessible ? 
            `(${result.status}, Enhanced: ${result.enhanced ? '✅' : '❌'})` :
            `(${result.error})`;
        console.log(`   ${pageName}: ${status} ${enhanced} ${details}`);
    }
    
    const allAccessible = Object.values(results).every(r => r.accessible);
    const allEnhanced = Object.values(results).every(r => r.enhanced);
    
    console.log(`\n${allAccessible && allEnhanced ? '🎉' : '⚠️'} Overall Status: ${allAccessible ? 'ACCESSIBLE' : 'NEEDS ATTENTION'} & ${allEnhanced ? 'ENHANCED' : 'NEEDS ENHANCEMENT'}`);
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (allAccessible && allEnhanced) {
        console.log('   ✅ All pages are accessible and enhanced');
        console.log('   ✅ Ready for production use');
        console.log('   📝 Consider adding test data for better demonstration');
    } else {
        console.log('   ⚠️  Some pages need attention');
        console.log('   📝 Check error messages and fix JavaScript issues');
        console.log('   🔧 Ensure all enhanced features are working properly');
    }
}

runEnhancedTest().catch(console.error);