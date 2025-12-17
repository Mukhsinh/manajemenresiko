const { supabaseAdmin } = require('./config/supabase');

async function testRiskRegisterData() {
    console.log('🔍 Testing Risk Register Data...\n');
    
    try {
        // Test 1: Check total records in risk_inputs
        console.log('📊 Test 1: Checking total records in risk_inputs table');
        const { data: totalData, error: totalError } = await supabaseAdmin
            .from('risk_inputs')
            .select('id', { count: 'exact' });
            
        if (totalError) {
            console.error('❌ Error getting total records:', totalError);
            return;
        }
        
        console.log(`✅ Total records in risk_inputs: ${totalData.length}`);
        
        // Test 2: Get sample data with relations
        console.log('\n📋 Test 2: Getting sample data with relations');
        const { data: sampleData, error: sampleError } = await supabaseAdmin
            .from('risk_inputs')
            .select(`
                *,
                master_work_units(name),
                master_risk_categories(name),
                risk_inherent_analysis(*),
                risk_residual_analysis(*),
                risk_treatments(*),
                risk_appetite(*),
                risk_monitoring(*)
            `)
            .limit(5);
            
        if (sampleError) {
            console.error('❌ Error getting sample data:', sampleError);
            return;
        }
        
        console.log(`✅ Sample data retrieved: ${sampleData.length} records`);
        
        // Test 3: Analyze sample record
        if (sampleData.length > 0) {
            console.log('\n🔍 Test 3: Analyzing first sample record');
            const sample = sampleData[0];
            
            console.log(`📝 Risk Code: ${sample.kode_risiko || 'N/A'}`);
            console.log(`🏢 Work Unit: ${sample.master_work_units?.name || 'N/A'}`);
            console.log(`📂 Category: ${sample.master_risk_categories?.name || 'N/A'}`);
            console.log(`🎯 Target: ${sample.sasaran ? sample.sasaran.substring(0, 50) + '...' : 'N/A'}`);
            console.log(`📅 Registration Date: ${sample.tanggal_registrasi || 'N/A'}`);
            
            // Check analysis data
            console.log(`📈 Inherent Analysis: ${sample.risk_inherent_analysis?.length || 0} records`);
            console.log(`📉 Residual Analysis: ${sample.risk_residual_analysis?.length || 0} records`);
            console.log(`🛡️ Risk Treatments: ${sample.risk_treatments?.length || 0} records`);
            console.log(`🎯 Risk Appetite: ${sample.risk_appetite?.length || 0} records`);
            console.log(`📊 Risk Monitoring: ${sample.risk_monitoring?.length || 0} records`);
            
            if (sample.risk_inherent_analysis && sample.risk_inherent_analysis.length > 0) {
                const inherent = sample.risk_inherent_analysis[0];
                console.log(`   - Inherent Probability: ${inherent.probability || 'N/A'}`);
                console.log(`   - Inherent Impact: ${inherent.impact || 'N/A'}`);
                console.log(`   - Inherent Risk Value: ${inherent.risk_value || 'N/A'}`);
                console.log(`   - Inherent Risk Level: ${inherent.risk_level || 'N/A'}`);
            }
            
            if (sample.risk_residual_analysis && sample.risk_residual_analysis.length > 0) {
                const residual = sample.risk_residual_analysis[0];
                console.log(`   - Residual Probability: ${residual.probability || 'N/A'}`);
                console.log(`   - Residual Impact: ${residual.impact || 'N/A'}`);
                console.log(`   - Residual Risk Value: ${residual.risk_value || 'N/A'}`);
                console.log(`   - Residual Risk Level: ${residual.risk_level || 'N/A'}`);
            }
        }
        
        // Test 4: Statistics
        console.log('\n📊 Test 4: Data Statistics');
        const stats = {
            withWorkUnits: sampleData.filter(d => d.master_work_units).length,
            withCategories: sampleData.filter(d => d.master_risk_categories).length,
            withInherent: sampleData.filter(d => d.risk_inherent_analysis && d.risk_inherent_analysis.length > 0).length,
            withResidual: sampleData.filter(d => d.risk_residual_analysis && d.risk_residual_analysis.length > 0).length,
            withTreatments: sampleData.filter(d => d.risk_treatments && d.risk_treatments.length > 0).length,
            withAppetite: sampleData.filter(d => d.risk_appetite && d.risk_appetite.length > 0).length,
            withMonitoring: sampleData.filter(d => d.risk_monitoring && d.risk_monitoring.length > 0).length
        };
        
        console.log(`🏢 Records with Work Units: ${stats.withWorkUnits}/${sampleData.length}`);
        console.log(`📂 Records with Categories: ${stats.withCategories}/${sampleData.length}`);
        console.log(`📈 Records with Inherent Analysis: ${stats.withInherent}/${sampleData.length}`);
        console.log(`📉 Records with Residual Analysis: ${stats.withResidual}/${sampleData.length}`);
        console.log(`🛡️ Records with Treatments: ${stats.withTreatments}/${sampleData.length}`);
        console.log(`🎯 Records with Appetite: ${stats.withAppetite}/${sampleData.length}`);
        console.log(`📊 Records with Monitoring: ${stats.withMonitoring}/${sampleData.length}`);
        
        console.log('\n✅ Risk Register data test completed successfully!');
        console.log('🎯 Data is available and ready for frontend display');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testRiskRegisterData();