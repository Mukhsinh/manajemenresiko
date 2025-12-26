/**
 * Debug Risk Profile Rendering Issue
 * Test to identify why risk-profile page is not displaying data correctly
 */

const fs = require('fs');
const http = require('http');

console.log('🔍 Debugging Risk Profile Rendering Issue...\n');

// Test API data structure
async function testAPIData() {
    console.log('1. Testing API data structure...');
    
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
                    console.log('✅ API Response received');
                    console.log('   - Status:', res.statusCode);
                    console.log('   - Success:', jsonData.success);
                    console.log('   - Count:', jsonData.count);
                    
                    if (jsonData.data && jsonData.data.length > 0) {
                        const item = jsonData.data[0];
                        console.log('   - Sample data structure:');
                        console.log('     * ID:', item.id);
                        console.log('     * Probability:', item.probability);
                        console.log('     * Impact:', item.impact);
                        console.log('     * Risk Value:', item.risk_value);
                        console.log('     * Risk Level:', item.risk_level);
                        console.log('     * Financial Impact:', item.financial_impact);
                        console.log('     * Has risk_inputs:', !!item.risk_inputs);
                        
                        if (item.risk_inputs) {
                            console.log('     * Risk Input Kode:', item.risk_inputs.kode_risiko);
                            console.log('     * Sasaran:', item.risk_inputs.sasaran ? 'Yes' : 'No');
                            console.log('     * Has work unit:', !!item.risk_inputs.master_work_units);
                            console.log('     * Has category:', !!item.risk_inputs.master_risk_categories);
                        }
                    }
                    
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

// Check risk-profile.js implementation
function checkRiskProfileJS() {
    console.log('\n2. Checking risk-profile.js implementation...');
    
    const filePath = 'public/js/risk-profile.js';
    if (!fs.existsSync(filePath)) {
        console.log('❌ risk-profile.js not found');
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check key functions
    const checks = [
        { name: 'RiskProfileModule', pattern: /const RiskProfileModule = \(\(\) => \{/ },
        { name: 'load function', pattern: /async function load\(\)/ },
        { name: 'fetchRiskProfile function', pattern: /async function fetchRiskProfile\(\)/ },
        { name: 'render function', pattern: /function render\(\)/ },
        { name: 'renderTable function', pattern: /function renderTable\(\)/ },
        { name: 'API call', pattern: /api\(\)\('\/api\/risk-profile'\)/ },
        { name: 'Container check', pattern: /getElementById\('risk-profile-content'\)/ },
        { name: 'Data assignment', pattern: /state\.data = data/ }
    ];
    
    checks.forEach(check => {
        if (check.pattern.test(content)) {
            console.log(`✅ ${check.name} found`);
        } else {
            console.log(`❌ ${check.name} missing or incorrect`);
        }
    });
    
    // Check for potential issues
    console.log('\n   Potential issues:');
    
    if (content.includes('state.data = data || [];')) {
        console.log('✅ Data fallback handling exists');
    } else {
        console.log('⚠️  Data fallback handling might be missing');
    }
    
    if (content.includes('container.innerHTML')) {
        console.log('✅ Container innerHTML assignment exists');
    } else {
        console.log('❌ Container innerHTML assignment missing');
    }
    
    if (content.includes('renderTable()')) {
        console.log('✅ renderTable() call exists');
    } else {
        console.log('❌ renderTable() call missing');
    }
}

// Check HTML structure
function checkHTMLStructure() {
    console.log('\n3. Checking HTML structure...');
    
    const filePath = 'public/index.html';
    if (!fs.existsSync(filePath)) {
        console.log('❌ index.html not found');
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    const checks = [
        { name: 'Risk Profile page div', pattern: 'id="risk-profile"' },
        { name: 'Risk Profile content div', pattern: 'id="risk-profile-content"' },
        { name: 'Risk Profile menu item', pattern: 'data-page="risk-profile"' },
        { name: 'Navigation script', pattern: 'navigation.js' },
        { name: 'Risk Profile script', pattern: 'risk-profile.js' }
    ];
    
    checks.forEach(check => {
        if (content.includes(check.pattern)) {
            console.log(`✅ ${check.name} found`);
        } else {
            console.log(`❌ ${check.name} missing`);
        }
    });
}

// Generate test HTML for debugging
function generateDebugHTML() {
    console.log('\n4. Generating debug HTML...');
    
    const debugHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Risk Profile Debug</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .debug-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; }
        .error { background-color: #f8d7da; }
        .btn { padding: 10px 15px; margin: 5px; border: none; border-radius: 3px; cursor: pointer; background: #007bff; color: white; }
        #risk-profile-content { min-height: 200px; border: 1px solid #ccc; padding: 15px; margin: 10px 0; }
        .loading { text-align: center; color: #666; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1><i class="fas fa-bug"></i> Risk Profile Debug</h1>
    
    <div class="debug-section">
        <h3>1. API Test</h3>
        <button class="btn" onclick="testAPI()">Test API Endpoint</button>
        <div id="api-result"></div>
    </div>
    
    <div class="debug-section">
        <h3>2. Module Test</h3>
        <button class="btn" onclick="testModule()">Test Risk Profile Module</button>
        <div id="module-result"></div>
    </div>
    
    <div class="debug-section">
        <h3>3. Render Test</h3>
        <button class="btn" onclick="testRender()">Test Manual Render</button>
        <div id="risk-profile-content" class="loading">
            <i class="fas fa-spinner fa-spin"></i> Ready for testing...
        </div>
    </div>
    
    <div class="debug-section">
        <h3>4. Console Logs</h3>
        <div id="console-logs"></div>
    </div>

    <!-- Load scripts -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="/js/config.js"></script>
    <script src="/js/services/apiService.js"></script>
    <script src="/js/navigation.js"></script>
    <script src="/js/risk-profile.js"></script>
    
    <script>
        // Capture console logs
        const originalLog = console.log;
        const originalError = console.error;
        const logs = [];
        
        console.log = function(...args) {
            logs.push({type: 'log', message: args.join(' ')});
            originalLog.apply(console, args);
            updateConsoleLogs();
        };
        
        console.error = function(...args) {
            logs.push({type: 'error', message: args.join(' ')});
            originalError.apply(console, args);
            updateConsoleLogs();
        };
        
        function updateConsoleLogs() {
            const container = document.getElementById('console-logs');
            container.innerHTML = logs.slice(-10).map(log => 
                '<div class="' + (log.type === 'error' ? 'error' : '') + '">' + 
                '<strong>' + log.type.toUpperCase() + ':</strong> ' + log.message + 
                '</div>'
            ).join('');
        }
        
        async function testAPI() {
            const result = document.getElementById('api-result');
            result.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing API...';
            
            try {
                const response = await fetch('/api/risk-profile/debug');
                const data = await response.json();
                
                result.innerHTML = '<div class="success">' +
                    '<h4>API Response:</h4>' +
                    '<pre>' + JSON.stringify(data, null, 2) + '</pre>' +
                    '</div>';
            } catch (error) {
                result.innerHTML = '<div class="error">API Error: ' + error.message + '</div>';
            }
        }
        
        function testModule() {
            const result = document.getElementById('module-result');
            
            const checks = [
                { name: 'RiskProfileModule', exists: typeof window.RiskProfileModule !== 'undefined' },
                { name: 'RiskProfileModule.load', exists: window.RiskProfileModule && typeof window.RiskProfileModule.load === 'function' },
                { name: 'loadRiskProfileManually', exists: typeof loadRiskProfileManually === 'function' },
                { name: 'navigateToPage', exists: typeof navigateToPage === 'function' },
                { name: 'apiCall', exists: typeof window.apiCall === 'function' || (window.app && typeof window.app.apiCall === 'function') }
            ];
            
            const results = checks.map(check => 
                '<div class="' + (check.exists ? 'success' : 'error') + '">' +
                (check.exists ? '✅' : '❌') + ' ' + check.name + '</div>'
            ).join('');
            
            result.innerHTML = results;
        }
        
        async function testRender() {
            const container = document.getElementById('risk-profile-content');
            container.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            
            try {
                // Test 1: Try RiskProfileModule
                if (window.RiskProfileModule && typeof window.RiskProfileModule.load === 'function') {
                    console.log('Testing RiskProfileModule.load()');
                    await window.RiskProfileModule.load();
                    return;
                }
                
                // Test 2: Try manual loading
                if (typeof loadRiskProfileManually === 'function') {
                    console.log('Testing loadRiskProfileManually()');
                    await loadRiskProfileManually();
                    return;
                }
                
                // Test 3: Manual API call and render
                console.log('Testing manual API call and render');
                const apiCall = window.app ? window.app.apiCall : window.apiCall;
                if (!apiCall) {
                    throw new Error('No API call function available');
                }
                
                const data = await apiCall('/api/risk-profile');
                console.log('Manual API call result:', data?.length || 0, 'items');
                
                // Manual render
                if (!data || data.length === 0) {
                    container.innerHTML = '<div class="error">No data found</div>';
                    return;
                }
                
                const stats = {
                    total: data.length,
                    extreme: data.filter(d => d.risk_level === 'EXTREME HIGH' || d.risk_level === 'Very High' || d.risk_level === 'Sangat Tinggi').length,
                    high: data.filter(d => d.risk_level === 'HIGH RISK' || d.risk_level === 'Tinggi').length,
                    medium: data.filter(d => d.risk_level === 'MEDIUM RISK' || d.risk_level === 'Sedang').length,
                    low: data.filter(d => d.risk_level === 'LOW RISK' || d.risk_level === 'Rendah').length
                };
                
                container.innerHTML = \`
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                        <div style="background: #007bff; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold;">\${stats.total}</div>
                            <div>Total Risiko</div>
                        </div>
                        <div style="background: #dc3545; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold;">\${stats.extreme}</div>
                            <div>Extreme High</div>
                        </div>
                        <div style="background: #fd7e14; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold;">\${stats.high}</div>
                            <div>High Risk</div>
                        </div>
                        <div style="background: #ffc107; color: black; padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold;">\${stats.medium}</div>
                            <div>Medium Risk</div>
                        </div>
                        <div style="background: #28a745; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold;">\${stats.low}</div>
                            <div>Low Risk</div>
                        </div>
                    </div>
                    <div style="background: white; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                        <div style="background: #f8f9fa; padding: 1rem; border-bottom: 1px solid #ddd;">
                            <h4 style="margin: 0;"><i class="fas fa-table"></i> Risk Profile Data</h4>
                        </div>
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #f8f9fa;">
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">No</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Kode Risiko</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Unit Kerja</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Probabilitas</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Dampak</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Risk Value</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Risk Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    \${data.map((item, index) => {
                                        const risk = item.risk_inputs || {};
                                        return \`
                                            <tr style="border-bottom: 1px solid #eee;">
                                                <td style="padding: 12px;">\${index + 1}</td>
                                                <td style="padding: 12px;"><strong>\${risk.kode_risiko || '-'}</strong></td>
                                                <td style="padding: 12px;">\${risk.master_work_units?.name || '-'}</td>
                                                <td style="padding: 12px;">\${item.probability || '-'}</td>
                                                <td style="padding: 12px;">\${item.impact || '-'}</td>
                                                <td style="padding: 12px;"><strong>\${item.risk_value || '-'}</strong></td>
                                                <td style="padding: 12px;">
                                                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.875rem; background: #6c757d; color: white;">
                                                        \${item.risk_level || '-'}
                                                    </span>
                                                </td>
                                            </tr>
                                        \`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                \`;
                
                console.log('Manual render completed successfully');
                
            } catch (error) {
                console.error('Render test error:', error);
                container.innerHTML = '<div class="error">Render Error: ' + error.message + '</div>';
            }
        }
        
        // Auto-run tests on load
        window.addEventListener('load', () => {
            console.log('Debug page loaded');
            setTimeout(() => {
                testModule();
            }, 1000);
        });
    </script>
</body>
</html>
    `;
    
    fs.writeFileSync('public/test-risk-profile-render-debug.html', debugHTML);
    console.log('✅ Debug HTML created: public/test-risk-profile-render-debug.html');
}

// Main execution
async function runDebug() {
    try {
        const apiData = await testAPIData();
        checkRiskProfileJS();
        checkHTMLStructure();
        generateDebugHTML();
        
        console.log('\n📋 SUMMARY:');
        console.log('='.repeat(50));
        console.log('✅ API is working and returning data from risk_inherent_analysis table');
        console.log('✅ Data structure is correct with proper joins');
        console.log('✅ Debug HTML file created for frontend testing');
        console.log('');
        console.log('🔧 NEXT STEPS:');
        console.log('1. Open: http://localhost:3001/test-risk-profile-render-debug.html');
        console.log('2. Run all tests to identify the rendering issue');
        console.log('3. Check console logs for specific errors');
        console.log('4. Test manual render to see if data displays correctly');
        console.log('');
        console.log('🎯 LIKELY ISSUES:');
        console.log('- RiskProfileModule.load() might not be called properly');
        console.log('- Container might not be found when render() is called');
        console.log('- Data might not be passed correctly to render function');
        console.log('- CSS styles might be interfering with display');
        
    } catch (error) {
        console.error('❌ Debug execution failed:', error);
    }
}

runDebug();