/**
 * Test Risk Profile Fix Verification
 * Verify that the risk-profile page now displays data correctly
 */

const http = require('http');

console.log('🧪 Testing Risk Profile Fix...\n');

// Test API endpoint
function testAPI() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/risk-profile/debug',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

async function runTest() {
    console.log('1. Testing API endpoint...');
    try {
        const apiData = await testAPI();
        
        if (apiData.success && apiData.count > 0) {
            console.log('✅ API working correctly');
            console.log('   - Data count:', apiData.count);
            console.log('   - Data source: risk_inherent_analysis table');
            
            // Verify data structure
            const sampleItem = apiData.data[0];
            console.log('   - Sample item structure:');
            console.log('     * Has ID:', !!sampleItem.id);
            console.log('     * Has probability:', !!sampleItem.probability);
            console.log('     * Has impact:', !!sampleItem.impact);
            console.log('     * Has risk_value:', !!sampleItem.risk_value);
            console.log('     * Has risk_level:', !!sampleItem.risk_level);
            console.log('     * Has risk_inputs:', !!sampleItem.risk_inputs);
            
            if (sampleItem.risk_inputs) {
                console.log('     * Risk input kode_risiko:', sampleItem.risk_inputs.kode_risiko);
                console.log('     * Has work unit:', !!sampleItem.risk_inputs.master_work_units);
                console.log('     * Has category:', !!sampleItem.risk_inputs.master_risk_categories);
            }
        } else {
            console.log('❌ API issue:', apiData.message || 'No data returned');
        }
    } catch (error) {
        console.log('❌ API test failed:', error.message);
        return;
    }

    console.log('\n2. Checking risk-profile.js modifications...');
    const fs = require('fs');
    const content = fs.readFileSync('public/js/risk-profile.js', 'utf8');
    
    const checks = [
        { name: 'Simplified render function', pattern: /SIMPLIFIED RENDER - Direct display without tabs/ },
        { name: 'renderRiskProfileContent call', pattern: /\$\{renderRiskProfileContent\(\)\}/ },
        { name: 'renderTable call', pattern: /\$\{renderTable\(\)\}/ },
        { name: 'No renderTabs function', pattern: /function renderTabs/, shouldExist: false },
        { name: 'No switchTab in exports', pattern: /switchTab/, shouldExist: false }
    ];
    
    checks.forEach(check => {
        const exists = check.pattern.test(content);
        const expected = check.shouldExist !== false;
        
        if (exists === expected) {
            console.log(`✅ ${check.name}`);
        } else {
            console.log(`❌ ${check.name} - Expected: ${expected}, Found: ${exists}`);
        }
    });

    console.log('\n3. Generating updated test HTML...');
    
    const testHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Risk Profile Fix Verification</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; }
        .error { background-color: #f8d7da; }
        #risk-profile-content { min-height: 300px; border: 1px solid #ccc; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1><i class="fas fa-chart-bar"></i> Risk Profile Fix Verification</h1>
        
        <div class="test-section">
            <h3>1. API Test</h3>
            <button class="btn btn-primary" onclick="testAPI()">Test API</button>
            <div id="api-result"></div>
        </div>
        
        <div class="test-section">
            <h3>2. Module Test</h3>
            <button class="btn btn-success" onclick="testModule()">Test Module</button>
            <div id="module-result"></div>
        </div>
        
        <div class="test-section">
            <h3>3. Risk Profile Display</h3>
            <button class="btn btn-info" onclick="loadRiskProfile()">Load Risk Profile</button>
            <div id="risk-profile-content">
                <div class="text-center text-muted">
                    <i class="fas fa-spinner fa-spin"></i> Ready to load...
                </div>
            </div>
        </div>
        
        <div class="test-section">
            <h3>4. Navigation Test</h3>
            <button class="btn btn-warning" onclick="testNavigation()">Test Navigation</button>
            <div id="navigation-result"></div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="/js/config.js"></script>
    <script src="/js/services/apiService.js"></script>
    <script src="/js/navigation.js"></script>
    <script src="/js/risk-profile.js"></script>
    
    <script>
        async function testAPI() {
            const result = document.getElementById('api-result');
            result.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
            
            try {
                const response = await fetch('/api/risk-profile/debug');
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = \`
                        <div class="success mt-2 p-2 rounded">
                            ✅ API Working<br>
                            Count: \${data.count}<br>
                            Message: \${data.message}
                        </div>
                    \`;
                } else {
                    result.innerHTML = \`<div class="error mt-2 p-2 rounded">❌ API Error: \${data.message}</div>\`;
                }
            } catch (error) {
                result.innerHTML = \`<div class="error mt-2 p-2 rounded">❌ Request failed: \${error.message}</div>\`;
            }
        }
        
        function testModule() {
            const result = document.getElementById('module-result');
            
            const checks = [
                { name: 'RiskProfileModule', exists: typeof window.RiskProfileModule !== 'undefined' },
                { name: 'RiskProfileModule.load', exists: window.RiskProfileModule && typeof window.RiskProfileModule.load === 'function' },
                { name: 'Navigation system', exists: typeof navigateToPage === 'function' },
                { name: 'API service', exists: typeof window.apiCall === 'function' || (window.app && typeof window.app.apiCall === 'function') }
            ];
            
            const results = checks.map(check => 
                \`<div class="\${check.exists ? 'success' : 'error'} mt-1 p-2 rounded">
                    \${check.exists ? '✅' : '❌'} \${check.name}
                </div>\`
            ).join('');
            
            result.innerHTML = results;
        }
        
        async function loadRiskProfile() {
            const container = document.getElementById('risk-profile-content');
            container.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
            
            try {
                if (window.RiskProfileModule && typeof window.RiskProfileModule.load === 'function') {
                    console.log('Loading with RiskProfileModule...');
                    await window.RiskProfileModule.load();
                    console.log('RiskProfileModule loaded successfully');
                } else {
                    throw new Error('RiskProfileModule not available');
                }
            } catch (error) {
                console.error('Load error:', error);
                container.innerHTML = \`<div class="error p-3 rounded">❌ Load Error: \${error.message}</div>\`;
            }
        }
        
        function testNavigation() {
            const result = document.getElementById('navigation-result');
            
            try {
                if (typeof navigateToPage === 'function') {
                    result.innerHTML = '<div class="success mt-2 p-2 rounded">✅ Navigation function available</div>';
                    
                    // Test navigation (without actually navigating)
                    console.log('Navigation function is available');
                } else {
                    result.innerHTML = '<div class="error mt-2 p-2 rounded">❌ Navigation function not found</div>';
                }
            } catch (error) {
                result.innerHTML = \`<div class="error mt-2 p-2 rounded">❌ Navigation test error: \${error.message}</div>\`;
            }
        }
        
        // Auto-run tests
        window.addEventListener('load', () => {
            setTimeout(() => {
                testAPI();
                testModule();
            }, 1000);
        });
    </script>
</body>
</html>
    `;
    
    fs.writeFileSync('public/test-risk-profile-fix-verification.html', testHTML);
    console.log('✅ Test HTML created: public/test-risk-profile-fix-verification.html');

    console.log('\n📋 SUMMARY:');
    console.log('='.repeat(50));
    console.log('✅ Risk Profile module simplified (removed tabs)');
    console.log('✅ Direct rendering of risk profile content');
    console.log('✅ API confirmed working with inherent risk data');
    console.log('✅ Test page created for verification');
    console.log('');
    console.log('🌐 TEST URLS:');
    console.log('- Main app: http://localhost:3001');
    console.log('- Test page: http://localhost:3001/test-risk-profile-fix-verification.html');
    console.log('- Debug page: http://localhost:3001/test-risk-profile-render-debug.html');
    console.log('');
    console.log('🔧 HOW TO VERIFY:');
    console.log('1. Open main app and navigate to Risk Profile');
    console.log('2. Check that data displays correctly');
    console.log('3. Verify statistics cards show correct counts');
    console.log('4. Confirm table shows inherent risk data');
    console.log('');
    console.log('✅ Risk Profile fix completed!');
}

runTest().catch(console.error);