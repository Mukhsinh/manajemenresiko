const axios = require('axios');

async function testRiskRegisterColumns() {
    try {
        console.log('🚀 Testing Risk Register Columns Display...');
        
        // Test login first
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@example.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // Get risk register data
        const response = await axios.get('http://localhost:3000/api/reports/risk-register', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 Response Status:', response.status);
        console.log('📊 Total Records:', response.data.length);
        
        if (response.data.length > 0) {
            const firstRecord = response.data[0];
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
            
            console.log('\n🛡️ Risk Treatments:');
            if (firstRecord.risk_treatments && firstRecord.risk_treatments.length > 0) {
                const treatment = firstRecord.risk_treatments[0];
                console.log('   - Treatment Type:', treatment.treatment_type);
                console.log('   - Treatment Description:', treatment.treatment_description);
                console.log('   - Implementation Status:', treatment.implementation_status);
            } else {
                console.log('   ❌ No risk treatment data');
            }
            
            console.log('\n📊 Risk Monitoring:');
            if (firstRecord.risk_monitoring && firstRecord.risk_monitoring.length > 0) {
                const monitoring = firstRecord.risk_monitoring[0];
                console.log('   - Monitoring Frequency:', monitoring.monitoring_frequency);
                console.log('   - Last Review Date:', monitoring.last_review_date);
                console.log('   - Next Review Date:', monitoring.next_review_date);
            } else {
                console.log('   ❌ No risk monitoring data');
            }
            
            // Check data completeness across all records
            console.log('\n📊 Data Completeness Analysis:');
            let stats = {
                totalRecords: response.data.length,
                withWorkUnit: 0,
                withCategory: 0,
                withInherent: 0,
                withResidual: 0,
                withAppetite: 0,
                withTreatments: 0,
                withMonitoring: 0,
                withStatus: 0,
                withType: 0
            };
            
            response.data.forEach(record => {
                if (record.master_work_units?.name) stats.withWorkUnit++;
                if (record.master_risk_categories?.name) stats.withCategory++;
                if (record.risk_inherent_analysis?.length > 0) stats.withInherent++;
                if (record.risk_residual_analysis?.length > 0) stats.withResidual++;
                if (record.risk_appetite?.length > 0) stats.withAppetite++;
                if (record.risk_treatments?.length > 0) stats.withTreatments++;
                if (record.risk_monitoring?.length > 0) stats.withMonitoring++;
                if (record.status_risiko) stats.withStatus++;
                if (record.jenis_risiko) stats.withType++;
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
            
            // Check for missing columns in frontend display
            console.log('\n🔍 Frontend Column Mapping Check:');
            console.log('✅ Available data fields that should be displayed:');
            console.log('   - No (index + 1)');
            console.log('   - Kode Risiko (kode_risiko)');
            console.log('   - Status (status_risiko)');
            console.log('   - Jenis (jenis_risiko)');
            console.log('   - Kategori (master_risk_categories.name)');
            console.log('   - Unit Kerja (master_work_units.name)');
            console.log('   - Sasaran (sasaran)');
            console.log('   - Tanggal Registrasi (tanggal_registrasi)');
            console.log('   - Penyebab Risiko (penyebab_risiko)');
            console.log('   - Dampak Risiko (dampak_risiko)');
            console.log('   - P Inheren (risk_inherent_analysis[0].probability)');
            console.log('   - D Inheren (risk_inherent_analysis[0].impact)');
            console.log('   - Nilai Inheren (risk_inherent_analysis[0].risk_value)');
            console.log('   - Tingkat Inheren (risk_inherent_analysis[0].risk_level)');
            console.log('   - P Residual (risk_residual_analysis[0].probability)');
            console.log('   - D Residual (risk_residual_analysis[0].impact)');
            console.log('   - Nilai Residual (risk_residual_analysis[0].risk_value)');
            console.log('   - Tingkat Residual (risk_residual_analysis[0].risk_level)');
            console.log('   - Risk Appetite (risk_appetite[0].risk_appetite_level)');
            
        } else {
            console.log('❌ No data returned from API');
        }
        
        console.log('\n✅ Risk Register Columns Test COMPLETED!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testRiskRegisterColumns();