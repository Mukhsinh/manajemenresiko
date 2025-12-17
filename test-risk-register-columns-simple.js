const axios = require('axios');

async function testRiskRegisterColumnsSimple() {
    try {
        console.log('🚀 Testing Risk Register Columns (Debug Endpoint)...');
        
        // Use debug endpoint that doesn't require auth
        const response = await axios.get('http://localhost:3000/api/reports/risk-register-debug');
        
        console.log('📡 Response Status:', response.status);
        console.log('📊 Message:', response.data.message);
        console.log('📊 Total Records:', response.data.recordCount);
        
        if (response.data.fullData && response.data.fullData.length > 0) {
            const firstRecord = response.data.fullData[0];
            console.log('\n🔍 First Record Analysis:');
            console.log('📝 Risk Code:', firstRecord.kode_risiko);
            console.log('🏢 Work Unit:', firstRecord.master_work_units?.name);
            console.log('📂 Category:', firstRecord.master_risk_categories?.name);
            console.log('🎯 Target:', firstRecord.sasaran?.substring(0, 50) + '...');
            console.log('📅 Registration Date:', firstRecord.tanggal_registrasi);
            console.log('⚠️ Risk Cause:', firstRecord.penyebab_risiko?.substring(0, 50) + '...');
            console.log('💥 Risk Impact:', firstRecord.dampak_risiko?.substring(0, 50) + '...');
            console.log('📊 Status:', firstRecord.status_risiko);
            console.log('🔢 Type:', firstRecord.jenis_risiko);
            
            console.log('\n📈 Inherent Analysis:');
            if (firstRecord.risk_inherent_analysis && firstRecord.risk_inherent_analysis.length > 0) {
                const inherent = firstRecord.risk_inherent_analysis[0];
                console.log('   - Probability:', inherent.probability);
                console.log('   - Impact:', inherent.impact);
                console.log('   - Risk Value:', inherent.risk_value);
                console.log('   - Risk Level:', inherent.risk_level);
                console.log('   - Probability %:', inherent.probability_percentage);
                console.log('   - Financial Impact:', inherent.financial_impact);
            } else {
                console.log('   ❌ No inherent analysis data');
            }
            
            console.log('\n📉 Residual Analysis:');
            if (firstRecord.risk_residual_analysis && firstRecord.risk_residual_analysis.length > 0) {
                const residual = firstRecord.risk_residual_analysis[0];
                console.log('   - Probability:', residual.probability);
                console.log('   - Impact:', residual.impact);
                console.log('   - Risk Value:', residual.risk_value);
                console.log('   - Risk Level:', residual.risk_level);
                console.log('   - Probability %:', residual.probability_percentage);
                console.log('   - Financial Impact:', residual.financial_impact);
            } else {
                console.log('   ❌ No residual analysis data');
            }
            
            console.log('\n🎯 Risk Appetite:');
            if (firstRecord.risk_appetite && firstRecord.risk_appetite.length > 0) {
                const appetite = firstRecord.risk_appetite[0];
                console.log('   - Risk Appetite Level:', appetite.risk_appetite_level);
                console.log('   - Appetite Description:', appetite.appetite_description);
            } else {
                console.log('   ❌ No risk appetite data');
            }
            
            // Check data completeness across all records
            console.log('\n📊 Data Completeness Analysis:');
            let stats = {
                totalRecords: response.data.fullData.length,
                withWorkUnit: 0,
                withCategory: 0,
                withInherent: 0,
                withResidual: 0,
                withAppetite: 0,
                withTreatments: 0,
                withMonitoring: 0,
                withStatus: 0,
                withType: 0,
                withCause: 0,
                withImpact: 0
            };
            
            response.data.fullData.forEach(record => {
                if (record.master_work_units?.name) stats.withWorkUnit++;
                if (record.master_risk_categories?.name) stats.withCategory++;
                if (record.risk_inherent_analysis?.length > 0) stats.withInherent++;
                if (record.risk_residual_analysis?.length > 0) stats.withResidual++;
                if (record.risk_appetite?.length > 0) stats.withAppetite++;
                if (record.risk_treatments?.length > 0) stats.withTreatments++;
                if (record.risk_monitoring?.length > 0) stats.withMonitoring++;
                if (record.status_risiko) stats.withStatus++;
                if (record.jenis_risiko) stats.withType++;
                if (record.penyebab_risiko) stats.withCause++;
                if (record.dampak_risiko) stats.withImpact++;
            });
            
            console.log('🏢 Records with Work Unit:', `${stats.withWorkUnit}/${stats.totalRecords}`);
            console.log('📂 Records with Category:', `${stats.withCategory}/${stats.totalRecords}`);
            console.log('📈 Records with Inherent Analysis:', `${stats.withInherent}/${stats.totalRecords}`);
            console.log('📉 Records with Residual Analysis:', `${stats.withResidual}/${stats.totalRecords}`);
            console.log('🎯 Records with Risk Appetite:', `${stats.withAppetite}/${stats.totalRecords}`);
            console.log('🛡️ Records with Treatments:', `${stats.withTreatments}/${stats.totalRecords}`);
            console.log('📊 Records with Monitoring:', `${stats.withMonitoring}/${stats.totalRecords}`);
            console.log('📊 Records with Status:', `${stats.withStatus}/${stats.totalRecords}`);
            console.log('🔢 Records with Type:', `${stats.withType}/${stats.totalRecords}`);
            console.log('⚠️ Records with Cause:', `${stats.withCause}/${stats.totalRecords}`);
            console.log('💥 Records with Impact:', `${stats.withImpact}/${stats.totalRecords}`);
            
            // Identify missing data issues
            console.log('\n🚨 Missing Data Issues:');
            if (stats.withStatus < stats.totalRecords) {
                console.log(`❌ ${stats.totalRecords - stats.withStatus} records missing Status (status_risiko)`);
            }
            if (stats.withType < stats.totalRecords) {
                console.log(`❌ ${stats.totalRecords - stats.withType} records missing Type (jenis_risiko)`);
            }
            if (stats.withCause < stats.totalRecords) {
                console.log(`❌ ${stats.totalRecords - stats.withCause} records missing Cause (penyebab_risiko)`);
            }
            if (stats.withImpact < stats.totalRecords) {
                console.log(`❌ ${stats.totalRecords - stats.withImpact} records missing Impact (dampak_risiko)`);
            }
            
        } else {
            console.log('❌ No data returned from API');
        }
        
        console.log('\n✅ Risk Register Columns Test COMPLETED!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testRiskRegisterColumnsSimple();