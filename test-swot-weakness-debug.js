const { supabase, supabaseAdmin } = require('./config/supabase');

async function debugSwotWeaknessIssue() {
  console.log('🔍 DEBUGGING SWOT WEAKNESS DISPLAY ISSUE');
  console.log('='.repeat(60));
  
  try {
    // 1. Check raw database data for Weakness
    console.log('\n1. CHECKING RAW DATABASE DATA FOR WEAKNESS:');
    const { data: weaknessData, error: weaknessError } = await supabaseAdmin
      .from('swot_analisis')
      .select('*')
      .eq('kategori', 'Weakness')
      .limit(5);
    
    if (weaknessError) {
      console.error('❌ Error fetching weakness data:', weaknessError);
    } else {
      console.log(`✅ Found ${weaknessData.length} weakness records`);
      weaknessData.forEach((item, index) => {
        console.log(`   ${index + 1}. Score: ${item.score}, Bobot: ${item.bobot}, Rank: ${item.rank}`);
      });
    }

    // 2. Check summary calculation for all categories
    console.log('\n2. CHECKING SUMMARY CALCULATION:');
    const { data: allData, error: allError } = await supabaseAdmin
      .from('swot_analisis')
      .select('kategori, score, bobot, rank, kuantitas');
    
    if (allError) {
      console.error('❌ Error fetching all data:', allError);
    } else {
      const summary = {
        Strength: { totalScore: 0, totalBobot: 0, count: 0 },
        Weakness: { totalScore: 0, totalBobot: 0, count: 0 },
        Opportunity: { totalScore: 0, totalBobot: 0, count: 0 },
        Threat: { totalScore: 0, totalBobot: 0, count: 0 }
      };

      allData.forEach(item => {
        if (summary[item.kategori]) {
          summary[item.kategori].totalScore += item.score || 0;
          summary[item.kategori].totalBobot += item.bobot || 0;
          summary[item.kategori].count++;
        }
      });

      console.log('📊 SUMMARY RESULTS:');
      Object.keys(summary).forEach(kategori => {
        const data = summary[kategori];
        console.log(`   ${kategori}: Score=${data.totalScore}, Bobot=${data.totalBobot}, Count=${data.count}`);
      });
    }

    // 3. Check for null/zero values in database
    console.log('\n3. CHECKING FOR NULL/ZERO VALUES:');
    const { data: zeroScores, error: zeroError } = await supabaseAdmin
      .from('swot_analisis')
      .select('kategori, score, bobot')
      .eq('kategori', 'Weakness')
      .or('score.is.null,score.eq.0');
    
    if (zeroError) {
      console.error('❌ Error checking zero scores:', zeroError);
    } else {
      console.log(`Found ${zeroScores.length} weakness records with null/zero scores`);
      zeroScores.forEach((item, index) => {
        console.log(`   ${index + 1}. Score: ${item.score}, Bobot: ${item.bobot}`);
      });
    }

    // 4. Check score calculation logic
    console.log('\n4. CHECKING SCORE CALCULATION LOGIC:');
    const { data: sampleWeakness, error: sampleError } = await supabaseAdmin
      .from('swot_analisis')
      .select('bobot, rank, score, kuantitas')
      .eq('kategori', 'Weakness')
      .limit(3);
    
    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError);
    } else {
      console.log('Sample weakness records with calculated scores:');
      sampleWeakness.forEach((item, index) => {
        const calculatedScore = (item.bobot || 0) * (item.rank || 0) * (item.kuantitas || 1);
        console.log(`   ${index + 1}. Bobot: ${item.bobot}, Rank: ${item.rank}, Kuantitas: ${item.kuantitas || 1}`);
        console.log(`      Stored Score: ${item.score}, Calculated: ${calculatedScore}, Match: ${item.score === calculatedScore ? '✅' : '❌'}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔍 DEBUG ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug
debugSwotWeaknessIssue().then(() => {
  console.log('Debug script completed');
  process.exit(0);
}).catch(error => {
  console.error('Debug script failed:', error);
  process.exit(1);
});