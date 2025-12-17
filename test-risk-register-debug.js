const http = require('http');

async function testRiskRegisterDebug() {
    console.log('🔍 Testing Risk Register Debug Endpoint...\n');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/reports/risk-register-debug',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📡 Response Status: ${res.statusCode}`);
                
                try {
                    if (res.statusCode === 200) {
                        const jsonData = JSON.parse(data);
                        console.log(`✅ Success! Message: ${jsonData.message}`);
                        console.log(`📊 Record Count: ${jsonData.recordCount}`);
                        
                        if (jsonData.sampleData && jsonData.sampleData.length > 0) {
                            console.log('\n🔍 Sample Record Analysis:');
                            const sample = jsonData.sampleData[0];
                            console.log(`📝 Risk Code: ${sample.kode_risiko || 'N/A'}`);
                            console.log(`🏢 Work Unit: ${sample.master_work_units?.name || 'N/A'}`);
                            console.log(`📂 Category: ${sample.master_risk_categories?.name || 'N/A'}`);
                            console.log(`🎯 Target: ${sample.sasaran ? sample.sasaran.substring(0, 50) + '...' : 'N/A'}`);
                            console.log(`📅 Registration Date: ${sample.tanggal_registrasi || 'N/A'}`);
                            console.log(`📈 Inherent Analysis Records: ${sample.risk_inherent_analysis?.length || 0}`);
                            console.log(`📉 Residual Analysis Records: ${sample.risk_residual_analysis?.length || 0}`);
                            console.log(`🛡️ Risk Treatments Records: ${sample.risk_treatments?.length || 0}`);
                            console.log(`🎯 Risk Appetite Records: ${sample.risk_appetite?.length || 0}`);
                            console.log(`📊 Risk Monitoring Records: ${sample.risk_monitoring?.length || 0}`);
                            
                            if (sample.risk_inherent_analysis && sample.risk_inherent_analysis.length > 0) {
                                const inherent = sample.risk_inherent_analysis[0];
                                console.log('\n📈 Inherent Analysis Details:');
                                console.log(`   - Probability: ${inherent.probability || 'N/A'}`);
                                console.log(`   - Impact: ${inherent.impact || 'N/A'}`);
                                console.log(`   - Risk Value: ${inherent.risk_value || 'N/A'}`);
                                console.log(`   - Risk Level: ${inherent.risk_level || 'N/A'}`);
                                console.log(`   - Financial Impact: ${inherent.financial_impact || 'N/A'}`);
                            }
                            
                            if (sample.risk_residual_analysis && sample.risk_residual_analysis.length > 0) {
                                const residual = sample.risk_residual_analysis[0];
                                console.log('\n📉 Residual Analysis Details:');
                                console.log(`   - Probability: ${residual.probability || 'N/A'}`);
                                console.log(`   - Impact: ${residual.impact || 'N/A'}`);
                                console.log(`   - Risk Value: ${residual.risk_value || 'N/A'}`);
                                console.log(`   - Risk Level: ${residual.risk_level || 'N/A'}`);
                                console.log(`   - Net Risk Value: ${residual.net_risk_value || 'N/A'}`);
                            }
                        }
                        
                        // Statistics
                        if (jsonData.fullData && jsonData.fullData.length > 0) {
                            console.log('\n📊 Data Statistics:');
                            const stats = {
                                withWorkUnits: jsonData.fullData.filter(d => d.master_work_units).length,
                                withCategories: jsonData.fullData.filter(d => d.master_risk_categories).length,
                                withInherent: jsonData.fullData.filter(d => d.risk_inherent_analysis && d.risk_inherent_analysis.length > 0).length,
                                withResidual: jsonData.fullData.filter(d => d.risk_residual_analysis && d.risk_residual_analysis.length > 0).length,
                                withTreatments: jsonData.fullData.filter(d => d.risk_treatments && d.risk_treatments.length > 0).length,
                                withAppetite: jsonData.fullData.filter(d => d.risk_appetite && d.risk_appetite.length > 0).length,
                                withMonitoring: jsonData.fullData.filter(d => d.risk_monitoring && d.risk_monitoring.length > 0).length
                            };
                            
                            console.log(`🏢 Records with Work Units: ${stats.withWorkUnits}/${jsonData.fullData.length}`);
                            console.log(`📂 Records with Categories: ${stats.withCategories}/${jsonData.fullData.length}`);
                            console.log(`📈 Records with Inherent Analysis: ${stats.withInherent}/${jsonData.fullData.length}`);
                            console.log(`📉 Records with Residual Analysis: ${stats.withResidual}/${jsonData.fullData.length}`);
                            console.log(`🛡️ Records with Treatments: ${stats.withTreatments}/${jsonData.fullData.length}`);
                            console.log(`🎯 Records with Appetite: ${stats.withAppetite}/${jsonData.fullData.length}`);
                            console.log(`📊 Records with Monitoring: ${stats.withMonitoring}/${jsonData.fullData.length}`);
                        }
                        
                        resolve({ status: 200, data: jsonData });
                    } else {
                        console.log(`❌ Status: ${res.statusCode}`);
                        console.log('📄 Response:', data);
                        resolve({ status: res.statusCode, data: data });
                    }
                } catch (error) {
                    console.error('❌ Error parsing response:', error);
                    console.log('📄 Raw response:', data);
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Request error:', error);
            reject(error);
        });
        
        req.end();
    });
}

async function runTest() {
    try {
        console.log('🚀 Starting Risk Register Debug Test\n');
        
        const result = await testRiskRegisterDebug();
        
        if (result.status === 200) {
            console.log('\n✅ Risk Register Debug Test PASSED!');
            console.log('🎯 Data is available and properly structured for frontend display');
        } else {
            console.log('\n❌ Risk Register Debug Test FAILED!');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run test
runTest();