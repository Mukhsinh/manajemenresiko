// Test SWOT API directly without authentication
const express = require('express');
const { supabaseAdmin } = require('./config/supabase');

async function testSwotSummaryAPI() {
  console.log('🔍 Testing SWOT Summary API Logic');
  console.log('='.repeat(50));
  
  try {
    // Simulate the API logic directly
    console.log('\n1. FETCHING RAW DATA FROM DATABASE:');
    
    const { data, error } = await supabaseAdmin
      .from('swot_analisis')
      .select('kategori, score, bobot, rank, kuantitas, unit_kerja_id, rencana_strategis_id');

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    console.log(`✅ Fetched ${data.length} records from database`);

    // Calculate totals per category (same logic as API)
    const summary = {
      Strength: { totalScore: 0, totalBobot: 0, items: [] },
      Weakness: { totalScore: 0, totalBobot: 0, items: [] },
      Opportunity: { totalScore: 0, totalBobot: 0, items: [] },
      Threat: { totalScore: 0, totalBobot: 0, items: [] }
    };

    data.forEach(item => {
      if (summary[item.kategori]) {
        summary[item.kategori].totalScore += item.score || 0;
        summary[item.kategori].totalBobot += item.bobot || 0;
        summary[item.kategori].items.push(item);
      }
    });

    console.log('\n2. CALCULATED SUMMARY:');
    Object.keys(summary).forEach(kategori => {
      const data = summary[kategori];
      console.log(`   ${kategori}:`);
      console.log(`     Total Score: ${data.totalScore}`);
      console.log(`     Total Bobot: ${data.totalBobot}`);
      console.log(`     Item Count: ${data.items.length}`);
      
      if (kategori === 'Weakness') {
        console.log(`     Sample scores: ${data.items.slice(0, 5).map(i => i.score).join(', ')}`);
      }
    });

    // Check if there are any issues with Weakness specifically
    console.log('\n3. WEAKNESS SPECIFIC ANALYSIS:');
    const weaknessItems = data.filter(item => item.kategori === 'Weakness');
    console.log(`   Total Weakness items: ${weaknessItems.length}`);
    
    const weaknessScores = weaknessItems.map(item => item.score || 0);
    const totalWeaknessScore = weaknessScores.reduce((sum, score) => sum + score, 0);
    const nonZeroScores = weaknessScores.filter(score => score > 0);
    
    console.log(`   Total Weakness Score: ${totalWeaknessScore}`);
    console.log(`   Non-zero scores: ${nonZeroScores.length}/${weaknessScores.length}`);
    console.log(`   Zero scores: ${weaknessScores.length - nonZeroScores.length}`);
    
    if (totalWeaknessScore === 0) {
      console.log('❌ PROBLEM FOUND: All weakness scores are zero!');
      console.log('   Sample weakness records:');
      weaknessItems.slice(0, 5).forEach((item, index) => {
        console.log(`     ${index + 1}. Score: ${item.score}, Bobot: ${item.bobot}, Rank: ${item.rank}`);
      });
    } else {
      console.log('✅ Weakness scores are not zero in database');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ API Test Complete');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
if (require.main === module) {
  testSwotSummaryAPI().then(() => {
    console.log('Test completed');
    process.exit(0);
  }).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testSwotSummaryAPI };