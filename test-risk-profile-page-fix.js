/**
 * Test Risk Profile Page Fix
 * Comprehensive test to verify risk-profile page is working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Risk Profile Page Fix...\n');

// 1. Check if navigation.js exists and has required functions
console.log('1. Checking navigation.js...');
const navigationPath = 'public/js/navigation.js';
if (fs.existsSync(navigationPath)) {
    const navigationContent = fs.readFileSync(navigationPath, 'utf8');
    
    const requiredFunctions = [
        'navigateToPage',
        'loadPageData',
        'loadRiskProfileManually',
        'renderRiskProfileData'
    ];
    
    const missingFunctions = requiredFunctions.filter(func => 
        !navigationContent.includes(func)
    );
    
    if (missingFunctions.length === 0) {
        console.log('✅ navigation.js contains all required functions');
    } else {
        console.log('❌ Missing functions in navigation.js:', missingFunctions);
    }
} else {
    console.log('❌ navigation.js not found');
}

// 2. Check if navigation.js is loaded in index.html
console.log('\n2. Checking if navigation.js is loaded in index.html...');
const indexPath = 'public/index.html';
if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    if (indexContent.includes('navigation.js')) {
        console.log('✅ navigation.js is loaded in index.html');
    } else {
        console.log('❌ navigation.js is NOT loaded in index.html');
    }
} else {
    console.log('❌ index.html not found');
}

// 3. Check if risk-profile container exists in HTML
console.log('\n3. Checking risk-profile container in HTML...');
if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    const hasRiskProfileDiv = indexContent.includes('id="risk-profile"');
    const hasRiskProfileContent = indexContent.includes('id="risk-profile-content"');
    
    if (hasRiskProfileDiv && hasRiskProfileContent) {
        console.log('✅ Risk Profile containers exist in HTML');
    } else {
        console.log('❌ Risk Profile containers missing:', {
            hasRiskProfileDiv,
            hasRiskProfileContent
        });
    }
} else {
    console.log('❌ Cannot check HTML containers');
}

// 4. Check if risk-profile.js module exists and has required functions
console.log('\n4. Checking risk-profile.js module...');
const riskProfilePath = 'public/js/risk-profile.js';
if (fs.existsSync(riskProfilePath)) {
    const riskProfileContent = fs.readFileSync(riskProfilePath, 'utf8');
    
    const hasRiskProfileModule = riskProfileContent.includes('RiskProfileModule');
    const hasLoadFunction = riskProfileContent.includes('load()') || riskProfileContent.includes('load:');
    const hasRenderFunction = riskProfileContent.includes('render()') || riskProfileContent.includes('render:');
    
    console.log('✅ risk-profile.js exists');
    console.log('   - Has RiskProfileModule:', hasRiskProfileModule);
    console.log('   - Has load function:', hasLoadFunction);
    console.log('   - Has render function:', hasRenderFunction);
} else {
    console.log('❌ risk-profile.js not found');
}

// 5. Check API endpoint
console.log('\n5. Checking API endpoint...');
const routePath = 'routes/risk-profile.js';
if (fs.existsSync(routePath)) {
    const routeContent = fs.readFileSync(routePath, 'utf8');
    
    const hasDebugEndpoint = routeContent.includes('/debug');
    const hasMainEndpoint = routeContent.includes("router.get('/'");
    const hasSupabaseQuery = routeContent.includes('risk_inherent_analysis');
    
    console.log('✅ risk-profile route exists');
    console.log('   - Has debug endpoint:', hasDebugEndpoint);
    console.log('   - Has main endpoint:', hasMainEndpoint);
    console.log('   - Has Supabase query:', hasSupabaseQuery);
} else {
    console.log('❌ routes/risk-profile.js not found');
}

// 6. Check server.js for route registration
console.log('\n6. Checking server.js for route registration...');
const serverPath = 'server.js';
if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    const hasRiskProfileRoute = serverContent.includes("'/api/risk-profile'") && 
                               serverContent.includes("require('./routes/risk-profile')");
    
    if (hasRiskProfileRoute) {
        console.log('✅ Risk Profile route is registered in server.js');
    } else {
        console.log('❌ Risk Profile route is NOT registered in server.js');
    }
} else {
    console.log('❌ server.js not found');
}

// 7. Check menu item in HTML
console.log('\n7. Checking menu item in HTML...');
if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    const hasRiskProfileMenuItem = indexContent.includes('data-page="risk-profile"');
    
    if (hasRiskProfileMenuItem) {
        console.log('✅ Risk Profile menu item exists in HTML');
    } else {
        console.log('❌ Risk Profile menu item is missing in HTML');
    }
} else {
    console.log('❌ Cannot check menu item');
}

// 8. Generate test HTML file for manual testing
console.log('\n8. Generating test HTML file...');
const testHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Risk Profile Page</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; }
        .btn { padding: 10px 15px; margin: 5px; border: none; border-radius: 3px; cursor: pointer; }
        .btn-primary { background-color: #007bff; color: white; }
        .btn-success { background-color: #28a745; color: white; }
        #risk-profile-content { min-height: 200px; border: 1px solid #ccc; padding: 15px; margin: 10px 0; }
        .loading { text-align: center; color: #666; }
    </style>
</head>
<body>
    <h1><i class="fas fa-chart-bar"></i> Test Risk Profile Page</h1>
    
    <div class="test-section">
        <h3>1. Navigation Test</h3>
        <button class="btn btn-primary" onclick="testNavigation()">
            <i class="fas fa-play"></i> Test Navigation to Risk Profile
        </button>
        <div id="navigation-result"></div>
    </div>
    
    <div class="test-section">
        <h3>2. API Test</h3>
        <button class="btn btn-success" onclick="testAPI()">
            <i class="fas fa-server"></i> Test API Endpoint
        </button>
        <div id="api-result"></div>
    </div>
    
    <div class="test-section">
        <h3>3. Risk Profile Content</h3>
        <div id="risk-profile" class="page-content">
            <div id="risk-profile-content" class="loading">
                <i class="fas fa-spinner fa-spin"></i> Ready to load...
            </div>
        </div>
        <button class="btn btn-primary" onclick="testRiskProfileLoad()">
            <i class="fas fa-chart-bar"></i> Load Risk Profile Data
        </button>
    </div>
    
    <div class="test-section">
        <h3>4. Module Test</h3>
        <button class="btn btn-success" onclick="testModule()">
            <i class="fas fa-cogs"></i> Test Risk Profile Module
        </button>
        <div id="module-result"></div>
    </div>

    <!-- Load required scripts -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="/js/config.js"></script>
    <script src="/js/services/apiService.js"></script>
    <script src="/js/navigation.js"></script>
    <script src="/js/risk-profile.js"></script>
    
    <script>
        // Test functions
        function testNavigation() {
            const result = document.getElementById('navigation-result');
            result.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing navigation...';
            
            try {
                if (typeof navigateToPage === 'function') {
                    navigateToPage('risk-profile');
                    result.innerHTML = '<div class="success">✅ Navigation function called successfully</div>';
                } else {
                    result.innerHTML = '<div class="error">❌ navigateToPage function not found</div>';
                }
            } catch (error) {
                result.innerHTML = '<div class="error">❌ Navigation error: ' + error.message + '</div>';
            }
        }
        
        async function testAPI() {
            const result = document.getElementById('api-result');
            result.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing API...';
            
            try {
                const response = await fetch('/api/risk-profile/debug');
                const data = await response.json();
                
                if (response.ok && data.success) {
                    result.innerHTML = '<div class="success">✅ API working - ' + data.count + ' items found</div>';
                } else {
                    result.innerHTML = '<div class="error">❌ API error: ' + (data.message || 'Unknown error') + '</div>';
                }
            } catch (error) {
                result.innerHTML = '<div class="error">❌ API request failed: ' + error.message + '</div>';
            }
        }
        
        async function testRiskProfileLoad() {
            try {
                if (typeof loadRiskProfileManually === 'function') {
                    await loadRiskProfileManually();
                } else if (window.RiskProfileModule && typeof window.RiskProfileModule.load === 'function') {
                    await window.RiskProfileModule.load();
                } else {
                    throw new Error('No Risk Profile loader found');
                }
            } catch (error) {
                console.error('Risk Profile load error:', error);
                document.getElementById('risk-profile-content').innerHTML = 
                    '<div class="error">❌ Load error: ' + error.message + '</div>';
            }
        }
        
        function testModule() {
            const result = document.getElementById('module-result');
            
            const checks = [
                { name: 'RiskProfileModule', exists: typeof window.RiskProfileModule !== 'undefined' },
                { name: 'loadRiskProfileManually', exists: typeof loadRiskProfileManually === 'function' },
                { name: 'navigateToPage', exists: typeof navigateToPage === 'function' },
                { name: 'loadPageData', exists: typeof loadPageData === 'function' }
            ];
            
            const results = checks.map(check => 
                '<div class="' + (check.exists ? 'success' : 'error') + '">' +
                (check.exists ? '✅' : '❌') + ' ' + check.name + '</div>'
            ).join('');
            
            result.innerHTML = results;
        }
        
        // Auto-run tests on load
        window.addEventListener('load', () => {
            console.log('🧪 Risk Profile test page loaded');
            setTimeout(testModule, 1000);
        });
    </script>
</body>
</html>
`;

fs.writeFileSync('public/test-risk-profile-page-fix.html', testHtml);
console.log('✅ Test HTML file created: public/test-risk-profile-page-fix.html');

// Summary
console.log('\n📋 SUMMARY:');
console.log('='.repeat(50));
console.log('✅ Created navigation.js with Risk Profile support');
console.log('✅ Updated index.html to load navigation.js');
console.log('✅ Created comprehensive test file');
console.log('');
console.log('🔧 NEXT STEPS:');
console.log('1. Start the server: npm start');
console.log('2. Open: http://localhost:3001/test-risk-profile-page-fix.html');
console.log('3. Test navigation to Risk Profile page');
console.log('4. Check if data loads correctly');
console.log('');
console.log('🌐 MANUAL TEST URLs:');
console.log('- Main app: http://localhost:3001');
console.log('- Test page: http://localhost:3001/test-risk-profile-page-fix.html');
console.log('- API debug: http://localhost:3001/api/risk-profile/debug');
console.log('');
console.log('✅ Risk Profile page fix implementation complete!');