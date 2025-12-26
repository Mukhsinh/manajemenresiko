const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRiskProfileData() {
  console.log('=== TESTING RISK PROFILE DATABASE ===\n');

  try {
    // 1. Check risk_inputs table
    console.log('1. Checking risk_inputs table...');
    const { data: riskInputs, error: riskError } = await supabase
      .from('risk_inputs')
      .select('id, kode_risiko, organization_id');
    
    if (riskError) {
      console.error('Error fetching risk_inputs:', riskError);
    } else {
      console.log(`   ✓ Total risk_inputs: ${riskInputs.length}`);
      if (riskInputs.length > 0) {
        console.log(`   Sample: ${riskInputs[0].kode_risiko}`);
      }
    }

    // 2. Check risk_inherent_analysis table
    console.log('\n2. Checking risk_inherent_analysis table...');
    const { data: inherentData, error: inherentError } = await supabase
      .from('risk_inherent_analysis')
      .select('*');
    
    if (inherentError) {
      console.error('Error fetching risk_inherent_analysis:', inherentError);
    } else {
      console.log(`   ✓ Total inherent analysis: ${inherentData.length}`);
      if (inherentData.length > 0) {
        console.log(`   Sample:`, {
          probability: inherentData[0].probability,
          impact: inherentData[0].impact,
          risk_value: inherentData[0].risk_value,
          risk_level: inherentData[0].risk_level
        });
      }
    }

    // 3. Check risk_residual_analysis table
    console.log('\n3. Checking risk_residual_analysis table...');
    const { data: residualData, error: residualError } = await supabase
      .from('risk_residual_analysis')
      .select('*');
    
    if (residualError) {
      console.error('Error fetching risk_residual_analysis:', residualError);
    } else {
      console.log(`   ✓ Total residual analysis: ${residualData.length}`);
    }

    // 4. Test the actual API endpoint query
    console.log('\n4. Testing API endpoint query (simulating /api/risk-profile)...');
    
    const { data: risks, error: risksQueryError } = await supabase
      .from('risk_inputs')
      .select(`
        id,
        kode_risiko,
        sasaran,
        user_id,
        organization_id,
        master_work_units(name),
        master_risk_categories(name)
      `);

    if (risksQueryError) {
      console.error('Error in risks query:', risksQueryError);
    } else {
      console.log(`   ✓ Risks with relations: ${risks.length}`);
      
      const riskIds = risks.map(r => r.id);
      
      if (riskIds.length > 0) {
        const { data: analysis, error: analysisQueryError } = await supabase
          .from('risk_inherent_analysis')
          .select('*')
          .in('risk_input_id', riskIds);

        if (analysisQueryError) {
          console.error('Error in analysis query:', analysisQueryError);
        } else {
          console.log(`   ✓ Matching inherent analysis: ${analysis.length}`);
          
          // Merge data
          const merged = analysis.map(a => {
            const risk = risks.find(r => r.id === a.risk_input_id);
            return {
              ...a,
              risk_inputs: risk
            };
          });
          
          console.log(`   ✓ Merged data: ${merged.length} records`);
          
          // Show distribution
          const distribution = {
            'EXTREME HIGH': merged.filter(d => d.risk_level === 'EXTREME HIGH').length,
            'HIGH RISK': merged.filter(d => d.risk_level === 'HIGH RISK').length,
            'MEDIUM RISK': merged.filter(d => d.risk_level === 'MEDIUM RISK').length,
            'LOW RISK': merged.filter(d => d.risk_level === 'LOW RISK').length
          };
          
          console.log('\n   Distribution by risk level:');
          Object.entries(distribution).forEach(([level, count]) => {
            console.log(`     ${level}: ${count}`);
          });
        }
      }
    }

    // 5. Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Risk Inputs: ${riskInputs?.length || 0}`);
    console.log(`Inherent Analysis: ${inherentData?.length || 0}`);
    console.log(`Residual Analysis: ${residualData?.length || 0}`);
    
    if (riskInputs?.length === 0) {
      console.log('\n⚠️  WARNING: Database is empty!');
      console.log('   The risk-profile page should show "Tidak ada data" message.');
      console.log('   If it shows data, it means the frontend is using mock/dummy data.');
    } else if (inherentData?.length === 0) {
      console.log('\n⚠️  WARNING: No inherent analysis data!');
      console.log('   Risk inputs exist but no analysis has been performed.');
      console.log('   The risk-profile page should show 0 in all cards.');
    } else {
      console.log('\n✓ Database has data. Frontend should display this data.');
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

testRiskProfileData();
