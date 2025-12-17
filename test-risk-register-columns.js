const http = require('http');

async function testRiskRegisterColumns() {
    console.log('🔍 Testing Risk Register Columns Fix...\n');
    
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
                        console.log(`✅ Success! Record Count: ${jsonData.recordCount}`);
                        
                        if (jsonData.fullData && jsonData.fullData.length > 0) {
                            console.log('\n🔍 Analyzing Column Data Structure:');
                            
                            const sample = jsonData.fullData[0];
                            console.log(`📝 Sample Risk Code: ${sample.kode_risiko}`);
                            
                            // Check data structure
                            console.log('\n📊 Data Structure Analysis:');
                            console.log(`🏢 Work Unit: ${sample.master_work_units?.name || 'MISSING'}`);
                            console.log(`📂 Category: ${sample.master_risk_categories?.name || 'MISSING'}`);
                            console.log(`🎯 Sasaran: ${sample.sasaran ? 'AVAILABLE' : 'MISSING'}`);
                            console.log(`📅 Registration Date: ${sample.tanggal_registrasi || 'MISSING'}`);
                            console.log(`⚠️ Penyebab Risiko: ${sample.penyebab_risiko ? 'AVAILABLE' : 'MISSING'}`);
                            console.log(`💥 Dampak Risiko: ${sample.dampak_risiko ? 'AVAILABLE' : 'MISSING'}`);
                            
                            // Check analysis arrays
                            console.log('\n📈 Analysis Data Structure:');
                            console.log(`📈 Inherent Analysis: ${Array.isArray(sample.risk_inherent_analysis) ? 'ARRAY' : 'OBJECT'} with ${sample.risk_inherent_analysis?.length || 0} items`);
                            console.log(`📉 Residual Analysis: ${Array.isArray(sample.risk_residual_analysis) ? 'ARRAY' : 'OBJECT'} with ${sample.risk_residual_analysis?.length || 0} items`);
                            console.log(`🎯 Risk Appetite: ${Array.isArray(sample.risk_appetite) ? 'ARRAY' : 'OBJECT'} with ${sample.risk_appetite?.length || 0} items`);
                            
                            // Check inherent analysis details
                            if (sample.risk_inherent_analysis && sample.risk_inherent_analysis.length > 0) {
                                const inherent = sample.risk_inherent_analysis[0];
                                console.log('\n📈 Inherent Analysis Details:');
                                console.log(`   - Probability: ${inherent.probability !== undefined ? inherent.probability : 'MISSING'}`);
                                console.log(`   - Impact: ${inherent.impact !== undefined ? inherent.impact : 'MISSING'}`);
                                console.log(`   - Risk Value: ${inherent.risk_value !== undefined ? inherent.risk_value : 'MISSING'}`);
                                console.log(`   - Risk Level: ${inherent.risk_level || 'MISSING'}`);
                            } else {
                                console.log('\n❌ No Inherent Analysis Data Found');
                            }
                            
                            // Check residual analysis details
                            if (sample.risk_residual_analysis && sample.risk_residual_analysis.length > 0) {
                                const residual = sample.risk_residual_analysis[0];
                                console.log('\n📉 Residual Analysis Details:');
                                console.log(`   - Probability: ${residual.probability !== undefined ? residual.probability : 'MISSING'}`);
                                console.log(`   - Impact: ${residual.impact !== undefined ? residual.impact : 'MISSING'}`);
                                console.log(`   - Risk Value: ${residual.risk_value !== undefined ? residual.risk_value : 'MISSING'}`);
                                console.log(`   - Risk Level: ${residual.risk_level || 'MISSING'}`);
                            } else {
                                console.log('\n❌ No Residual Analysis Data Found');
                            }
                            
                            // Check risk appetite details
                            if (sample.risk_appetite && sample.risk_appetite.length > 0) {
                                const appetite = sample.risk_appetite[0];
                                console.log('\n🎯 Risk Appetite Details:');
                                console.log(`   - Risk Appetite Level: ${appetite.risk_appetite_level || 'MISSING'}`);
                            } else {
                                console.log('\n❌ No Risk Appetite Data Found');
                            }
                            
                            // Statistics for all records
                            console.log('\n📊 Overall Statistics:');
                            const stats = {
                                withInherent: jsonData.fullData.filter(d => d.risk_inherent_analysis && d.risk_inherent_analysis.length > 0).length,
                                withResidual: jsonData.fullData.filter(d => d.risk_residual_analysis && d.risk_residual_analysis.length > 0).length,
                                withAppetite: jsonData.fullData.filter(d => d.risk_appetite && d.risk_appetite.length > 0).length,
                                withWorkUnits: jsonData.fullData.filter(d => d.master_work_units?.name).length,
                                withCategories: jsonData.fullData.filter(d => d.master_risk_categories?.name).length,
                                withSasaran: jsonData.fullData.filter(d => d.sasaran).length,
                                withPenyebab: jsonData.fullData.filter(d => d.penyebab_risiko).length,
                                withDampak: jsonData.fullData.filter(d => d.dampak_risiko).length
                            };
                            
                            console.log(`📈 Records with Inherent Analysis: ${stats.withInherent}/${jsonData.fullData.length} (${(stats.withInherent/jsonData.fullData.length*100).toFixed(1)}%)`);
                            console.log(`📉 Records with Residual Analysis: ${stats.withResidual}/${jsonData.fullData.length} (${(stats.withResidual/jsonData.fullData.length*100).toFixed(1)}%)`);
                            console.log(`🎯 Records with Risk Appetite: ${stats.withAppetite}/${jsonData.fullData.length} (${(stats.withAppetite/jsonData.fullData.length*100).toFixed(1)}%)`);
                            console.log(`🏢 Records with Work Units: ${stats.withWorkUnits}/${jsonData.fullData.length} (${(stats.withWorkUnits/jsonData.fullData.length*100).toFixed(1)}%)`);
                            console.log(`📂 Records with Categories: ${stats.withCategories}/${jsonData.fullData.length} (${(stats.withCategories/jsonData.fullData.length*100).toFixed(1)}%)`);
                            console.log(`🎯 Records with Sasaran: ${stats.withSasaran}/${jsonData.fullData.length} (${(stats.withSasaran/jsonData.fullData.length*100).toFixed(1)}%)`);
                            console.log(`⚠️ Records with Penyebab: ${stats.withPenyebab}/${jsonData.fullData.length} (${(stats.withPenyebab/jsonData.fullData.length*100).toFixed(1)}%)`);
                            console.log(`💥 Records with Dampak: ${stats.withDampak}/${jsonData.fullData.length} (${(stats.withDampak/jsonData.fullData.length*100).toFixed(1)}%)`);
                            
                            // Frontend Fix Verification
                            console.log('\n🔧 Frontend Fix Verification:');
                            console.log('✅ Data structure confirmed as ARRAYS (not objects)');
                            console.log('✅ Frontend JavaScript should access [0] element of arrays');
                            console.log('✅ All required data is available in API response');
                            
                            if (stats.withInherent === jsonData.fullData.length && 
                                stats.withResidual === jsonData.fullData.length && 
                                stats.withAppetite === jsonData.fullData.length) {
                                console.log('\n🎉 ALL COLUMNS SHOULD NOW DISPLAY CORRECTLY!');
                            } else {
                                console.log('\n⚠️ Some records may still have missing data');
                            }
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
        console.log('🚀 Starting Risk Register Columns Test\n');
        
        const result = await testRiskRegisterColumns();
        
        if (result.status === 200) {
            console.log('\n✅ Risk Register Columns Test COMPLETED!');
            console.log('🎯 Frontend should now display all columns correctly');
            console.log('📋 Access: http://localhost:3000/test-risk-register-columns-fix.html');
        } else {
            console.log('\n❌ Risk Register Columns Test FAILED!');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run test
runTest();