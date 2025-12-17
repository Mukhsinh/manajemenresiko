const axios = require('axios');

async function testDatabaseMissingFields() {
    try {
        console.log('🚀 Testing Database Missing Fields...');
        
        // Use debug endpoint to get data without auth
        const response = await axios.get('http://localhost:3000/api/reports/risk-register-debug');
        
        console.log('📡 Response Status:', response.status);
        console.log('📊 Total Records:', response.data.recordCount);
        
        if (response.data.fullData && response.data.fullData.length > 0) {
            console.log('\n🔍 Analyzing Missing Fields:');
            
            const data = response.data.fullData;
            let missingFieldsReport = {
                status_risiko: [],
                jenis_risiko: [],
                penyebab_risiko: [],
                dampak_risiko: [],
                inherent_probability: [],
                inherent_impact: [],
                residual_probability: [],
                residual_impact: [],
                risk_appetite: []
            };
            
            data.forEach((record, index) => {
                const inherent = (record.risk_inherent_analysis && record.risk_inherent_analysis.length > 0) 
                    ? record.risk_inherent_analysis[0] : {};
                const residual = (record.risk_residual_analysis && record.risk_residual_analysis.length > 0) 
                    ? record.risk_residual_analysis[0] : {};
                const appetite = (record.risk_appetite && record.risk_appetite.length > 0) 
                    ? record.risk_appetite[0] : {};
                
                // Check for missing fields
                if (!record.status_risiko) {
                    missingFieldsReport.status_risiko.push({
                        index: index + 1,
                        kode_risiko: record.kode_risiko,
                        current_value: record.status_risiko
                    });
                }
                
                if (!record.jenis_risiko) {
                    missingFieldsReport.jenis_risiko.push({
                        index: index + 1,
                        kode_risiko: record.kode_risiko,
                        current_value: record.jenis_risiko
                    });
                }
                
                if (!record.penyebab_risiko) {
                    missingFieldsReport.penyebab_risiko.push({
                        index: index + 1,
                        kode_risiko: record.kode_risiko,
                        current_value: record.penyebab_risiko
                    });
                }
                
                if (!record.dampak_risiko) {
                    missingFieldsReport.dampak_risiko.push({
                        index: index + 1,
                        kode_risiko: record.kode_risiko,
                        current_value: record.dampak_risiko
                    });
                }
                
                if (!inherent.probability) {
                    missingFieldsReport.inherent_probability.push({
                        index: index + 1,
                        kode_risiko: record.kode_risiko,
                        current_value: inherent.probability
                    });
                }
                
                if (!inherent.impact) {
                    missingFieldsReport.inherent_impact.push({
                        index: index + 1,
                        kode_risiko: record.kode_risiko,
                        current_value: inherent.impact
                    });
                }
                
                if (!residual.probability) {
                    missingFieldsReport.residual_probability.push({
                        index: index + 1,
                        kode_risiko: record.kode_risiko,
                        current_value: residual.probability
                    });
                }
                
                if (!residual.impact) {
                    missingFieldsReport.residual_impact.push({
                        index: index + 1,
                        kode_risiko: record.kode_risiko,
                        current_value: residual.impact
                    });
                }
                
                if (!appetite.risk_appetite_level) {
                    missingFieldsReport.risk_appetite.push({
                        index: index + 1,
                        kode_risiko: record.kode_risiko,
                        current_value: appetite.risk_appetite_level
                    });
                }
            });
            
            // Report missing fields
            console.log('\n📊 Missing Fields Report:');
            Object.keys(missingFieldsReport).forEach(field => {
                const missing = missingFieldsReport[field];
                if (missing.length > 0) {
                    console.log(`\n❌ ${field.toUpperCase()}: ${missing.length} records missing`);
                    missing.forEach(item => {
                        console.log(`   - Record ${item.index}: ${item.kode_risiko} (current: ${item.current_value || 'null'})`);
                    });
                } else {
                    console.log(`✅ ${field.toUpperCase()}: All records complete`);
                }
            });
            
            // Generate SQL fix statements
            console.log('\n🛠️ SQL Fix Statements:');
            
            // Fix status_risiko
            if (missingFieldsReport.status_risiko.length > 0) {
                console.log('\n-- Fix status_risiko (set default to Active):');
                missingFieldsReport.status_risiko.forEach(item => {
                    console.log(`UPDATE risk_inputs SET status_risiko = 'Active' WHERE kode_risiko = '${item.kode_risiko}';`);
                });
            }
            
            // Fix jenis_risiko
            if (missingFieldsReport.jenis_risiko.length > 0) {
                console.log('\n-- Fix jenis_risiko (set default to Threat):');
                missingFieldsReport.jenis_risiko.forEach(item => {
                    console.log(`UPDATE risk_inputs SET jenis_risiko = 'Threat' WHERE kode_risiko = '${item.kode_risiko}';`);
                });
            }
            
            // Fix penyebab_risiko
            if (missingFieldsReport.penyebab_risiko.length > 0) {
                console.log('\n-- Fix penyebab_risiko (set default):');
                missingFieldsReport.penyebab_risiko.forEach(item => {
                    console.log(`UPDATE risk_inputs SET penyebab_risiko = 'Penyebab risiko belum diidentifikasi' WHERE kode_risiko = '${item.kode_risiko}';`);
                });
            }
            
            // Fix dampak_risiko
            if (missingFieldsReport.dampak_risiko.length > 0) {
                console.log('\n-- Fix dampak_risiko (set default):');
                missingFieldsReport.dampak_risiko.forEach(item => {
                    console.log(`UPDATE risk_inputs SET dampak_risiko = 'Dampak risiko belum diidentifikasi' WHERE kode_risiko = '${item.kode_risiko}';`);
                });
            }
            
            console.log('\n✅ Database Missing Fields Analysis COMPLETED!');
            
        } else {
            console.log('❌ No data returned from API');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testDatabaseMissingFields();