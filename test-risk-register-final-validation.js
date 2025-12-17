const axios = require('axios');

async function testRiskRegisterFinalValidation() {
    try {
        console.log('🎯 Risk Register Final Validation Test');
        console.log('=====================================');
        
        // Test the debug endpoint
        const response = await axios.get('http://localhost:3000/api/reports/risk-register-debug');
        
        console.log('📡 Response Status:', response.status);
        console.log('📊 Total Records:', response.data.recordCount);
        
        if (response.data.fullData && response.data.fullData.length > 0) {
            const data = response.data.fullData;
            
            console.log('\n🔍 Column Validation Analysis:');
            console.log('==============================');
            
            let validation = {
                totalRecords: data.length,
                columns: {
                    'Kode Risiko': { field: 'kode_risiko', filled: 0, empty: 0 },
                    'Status': { field: 'status_risiko', filled: 0, empty: 0 },
                    'Jenis': { field: 'jenis_risiko', filled: 0, empty: 0 },
                    'Kategori': { field: 'master_risk_categories.name', filled: 0, empty: 0 },
                    'Unit Kerja': { field: 'master_work_units.name', filled: 0, empty: 0 },
                    'Sasaran': { field: 'sasaran', filled: 0, empty: 0 },
                    'Tanggal Registrasi': { field: 'tanggal_registrasi', filled: 0, empty: 0 },
                    'Penyebab Risiko': { field: 'penyebab_risiko', filled: 0, empty: 0 },
                    'Dampak Risiko': { field: 'dampak_risiko', filled: 0, empty: 0 },
                    'P Inheren': { field: 'inherent.probability', filled: 0, empty: 0 },
                    'D Inheren': { field: 'inherent.impact', filled: 0, empty: 0 },
                    'Nilai Inheren': { field: 'inherent.risk_value', filled: 0, empty: 0 },
                    'Tingkat Inheren': { field: 'inherent.risk_level', filled: 0, empty: 0 },
                    'P Residual': { field: 'residual.probability', filled: 0, empty: 0 },
                    'D Residual': { field: 'residual.impact', filled: 0, empty: 0 },
                    'Nilai Residual': { field: 'residual.risk_value', filled: 0, empty: 0 },
                    'Tingkat Residual': { field: 'residual.risk_level', filled: 0, empty: 0 },
                    'Risk Appetite': { field: 'appetite.risk_appetite_level', filled: 0, empty: 0 }
                }
            };
            
            // Validate each record
            data.forEach((record, index) => {
                const inherent = (record.risk_inherent_analysis && record.risk_inherent_analysis.length > 0) 
                    ? record.risk_inherent_analysis[0] : null;
                const residual = (record.risk_residual_analysis && record.risk_residual_analysis.length > 0) 
                    ? record.risk_residual_analysis[0] : null;
                const appetite = (record.risk_appetite && record.risk_appetite.length > 0) 
                    ? record.risk_appetite[0] : null;
                
                // Check each column
                validation.columns['Kode Risiko'][record.kode_risiko ? 'filled' : 'empty']++;
                validation.columns['Status'][record.status_risiko ? 'filled' : 'empty']++;
                validation.columns['Jenis'][record.jenis_risiko ? 'filled' : 'empty']++;
                validation.columns['Kategori'][record.master_risk_categories?.name ? 'filled' : 'empty']++;
                validation.columns['Unit Kerja'][record.master_work_units?.name ? 'filled' : 'empty']++;
                validation.columns['Sasaran'][record.sasaran ? 'filled' : 'empty']++;
                validation.columns['Tanggal Registrasi'][record.tanggal_registrasi ? 'filled' : 'empty']++;
                validation.columns['Penyebab Risiko'][record.penyebab_risiko ? 'filled' : 'empty']++;
                validation.columns['Dampak Risiko'][record.dampak_risiko ? 'filled' : 'empty']++;
                
                validation.columns['P Inheren'][inherent?.probability ? 'filled' : 'empty']++;
                validation.columns['D Inheren'][inherent?.impact ? 'filled' : 'empty']++;
                validation.columns['Nilai Inheren'][inherent?.risk_value ? 'filled' : 'empty']++;
                validation.columns['Tingkat Inheren'][inherent?.risk_level ? 'filled' : 'empty']++;
                
                validation.columns['P Residual'][residual?.probability ? 'filled' : 'empty']++;
                validation.columns['D Residual'][residual?.impact ? 'filled' : 'empty']++;
                validation.columns['Nilai Residual'][residual?.risk_value ? 'filled' : 'empty']++;
                validation.columns['Tingkat Residual'][residual?.risk_level ? 'filled' : 'empty']++;
                
                validation.columns['Risk Appetite'][appetite?.risk_appetite_level ? 'filled' : 'empty']++;
            });
            
            // Display results
            console.log('Column Name                | Filled | Empty | Percentage | Status');
            console.log('---------------------------|--------|-------|------------|--------');
            
            let totalComplete = 0;
            let totalColumns = Object.keys(validation.columns).length;
            
            Object.keys(validation.columns).forEach(columnName => {
                const col = validation.columns[columnName];
                const percentage = ((col.filled / validation.totalRecords) * 100).toFixed(1);
                const isComplete = col.filled === validation.totalRecords;
                const status = isComplete ? '✅ COMPLETE' : '❌ MISSING';
                
                if (isComplete) totalComplete++;
                
                console.log(
                    `${columnName.padEnd(26)} | ${String(col.filled).padStart(6)} | ${String(col.empty).padStart(5)} | ${String(percentage + '%').padStart(10)} | ${status}`
                );
            });
            
            console.log('---------------------------|--------|-------|------------|--------');
            
            const overallPercentage = ((totalComplete / totalColumns) * 100).toFixed(1);
            console.log(`\n📊 OVERALL SUMMARY:`);
            console.log(`   Total Records: ${validation.totalRecords}`);
            console.log(`   Total Columns: ${totalColumns}`);
            console.log(`   Complete Columns: ${totalComplete}`);
            console.log(`   Completion Rate: ${overallPercentage}%`);
            
            if (totalComplete === totalColumns) {
                console.log('\n🎉 SUCCESS: All columns are properly filled!');
                console.log('✅ Risk Register is ready for production use.');
            } else {
                console.log(`\n⚠️  WARNING: ${totalColumns - totalComplete} columns need attention.`);
                console.log('❌ Some data is missing in the Risk Register.');
            }
            
            // Show sample data for verification
            console.log('\n🔍 Sample Record (First Record):');
            console.log('================================');
            const firstRecord = data[0];
            const inherent = firstRecord.risk_inherent_analysis?.[0];
            const residual = firstRecord.risk_residual_analysis?.[0];
            const appetite = firstRecord.risk_appetite?.[0];
            
            console.log(`Kode Risiko: ${firstRecord.kode_risiko || 'MISSING'}`);
            console.log(`Status: ${firstRecord.status_risiko || 'MISSING'}`);
            console.log(`Jenis: ${firstRecord.jenis_risiko || 'MISSING'}`);
            console.log(`Kategori: ${firstRecord.master_risk_categories?.name || 'MISSING'}`);
            console.log(`Unit Kerja: ${firstRecord.master_work_units?.name || 'MISSING'}`);
            console.log(`Sasaran: ${firstRecord.sasaran?.substring(0, 50) + '...' || 'MISSING'}`);
            console.log(`Tanggal: ${firstRecord.tanggal_registrasi || 'MISSING'}`);
            console.log(`Penyebab: ${firstRecord.penyebab_risiko?.substring(0, 50) + '...' || 'MISSING'}`);
            console.log(`Dampak: ${firstRecord.dampak_risiko?.substring(0, 50) + '...' || 'MISSING'}`);
            console.log(`P Inheren: ${inherent?.probability || 'MISSING'}`);
            console.log(`D Inheren: ${inherent?.impact || 'MISSING'}`);
            console.log(`Nilai Inheren: ${inherent?.risk_value || 'MISSING'}`);
            console.log(`Tingkat Inheren: ${inherent?.risk_level || 'MISSING'}`);
            console.log(`P Residual: ${residual?.probability || 'MISSING'}`);
            console.log(`D Residual: ${residual?.impact || 'MISSING'}`);
            console.log(`Nilai Residual: ${residual?.risk_value || 'MISSING'}`);
            console.log(`Tingkat Residual: ${residual?.risk_level || 'MISSING'}`);
            console.log(`Risk Appetite: ${appetite?.risk_appetite_level || 'MISSING'}`);
            
        } else {
            console.log('❌ No data returned from API');
        }
        
        console.log('\n✅ Risk Register Final Validation COMPLETED!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testRiskRegisterFinalValidation();