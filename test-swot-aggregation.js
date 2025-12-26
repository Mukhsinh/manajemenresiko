const { supabase, supabaseAdmin } = require('./config/supabase');

async function testSwotAggregation() {
  console.log('🔍 TESTING SWOT AGGREGATION LOGIC');
  console.log('='.repeat(50));

  try {
    // Get raw data from database
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('swot_analisis')
      .select('kategori, score, bobot, rank, kuantitas, unit_kerja_id, rencana_strategis_id');

    if (error) throw error;

    console.log(`\n📊 Total records: ${data.length}`);

    // Test normal aggregation (without RUMAH_SAKIT filter)
    console.log('\n1. NORMAL AGGREGATION (No filter):');
    const normalSummary = {
      Strength: { totalScore: 0, totalBobot: 0, items: [] },
      Weakness: { totalScore: 0, totalBobot: 0, items: [] },
      Opportunity: { totalScore: 0, totalBobot: 0, items: [] },
      Threat: { totalScore: 0, totalBobot: 0, items: [] }
    };

    (data || []).forEach(item => {
      if (normalSummary[item.kategori]) {
        normalSummary[item.kategori].totalScore += item.score || 0;
        normalSummary[item.kategori].totalBobot += item.bobot || 0;
        normalSummary[item.kategori].items.push(item);
      }
    });

    Object.keys(normalSummary).forEach(kategori => {
      const summary = normalSummary[kategori];
      console.log(`${kategori}: Score=${summary.totalScore}, Items=${summary.items.length}, Bobot=${summary.totalBobot}`);
    });

    // Test RUMAH_SAKIT aggregation logic
    console.log('\n2. RUMAH_SAKIT AGGREGATION LOGIC:');
    const rumahSakitSummary = {
      Strength: { totalScore: 0, totalBobot: 0, items: [] },
      Weakness: { totalScore: 0, totalBobot: 0, items: [] },
      Opportunity: { totalScore: 0, totalBobot: 0, items: [] },
      Threat: { totalScore: 0, totalBobot: 0, items: [] }
    };

    // Group by category and get max score and bobot
    const grouped = {};
    (data || []).forEach(item => {
      const key = item.kategori;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    // For each category, get items with highest score and bobot
    Object.keys(grouped).forEach(kategori => {
      const items = grouped[kategori];
      console.log(`\n${kategori} - Total items: ${items.length}`);
      
      // Sort by score desc, then bobot desc
      items.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.bobot - a.bobot;
      });
      
      // Take top items based on kuantitas
      const totalKuantitas = items.reduce((sum, item) => sum + (item.kuantitas || 1), 0);
      const topItems = items.slice(0, Math.min(5, totalKuantitas)); // Max 5 items or total kuantitas
      
      console.log(`  Total kuantitas: ${totalKuantitas}`);
      console.log(`  Taking top: ${Math.min(5, totalKuantitas)} items`);
      console.log(`  Actual top items taken: ${topItems.length}`);
      
      rumahSakitSummary[kategori].items = topItems;
      rumahSakitSummary[kategori].totalScore = topItems.reduce((sum, item) => sum + (item.score || 0), 0);
      rumahSakitSummary[kategori].totalBobot = topItems.reduce((sum, item) => sum + (item.bobot || 0), 0);
      
      console.log(`  Final Score: ${rumahSakitSummary[kategori].totalScore}`);
      console.log(`  Final Bobot: ${rumahSakitSummary[kategori].totalBobot}`);
    });

    console.log('\n3. RUMAH_SAKIT SUMMARY RESULTS:');
    Object.keys(rumahSakitSummary).forEach(kategori => {
      const summary = rumahSakitSummary[kategori];
      console.log(`${kategori}: Score=${summary.totalScore}, Items=${summary.items.length}, Bobot=${summary.totalBobot}`);
    });

    // Check if Weakness has zero score in RUMAH_SAKIT logic
    if (rumahSakitSummary.Weakness.totalScore === 0) {
      console.log('\n🚨 PROBLEM IDENTIFIED: RUMAH_SAKIT logic results in Weakness score = 0');
      console.log('This explains why frontend shows 0 for Weakness!');
      
      // Check kuantitas values for Weakness
      const weaknessItems = grouped.Weakness || [];
      console.log('\nWeakness items analysis:');
      console.log(`Total Weakness items: ${weaknessItems.length}`);
      
      const kuantitasValues = weaknessItems.map(item => item.kuantitas || 1);
      const totalKuantitas = kuantitasValues.reduce((sum, val) => sum + val, 0);
      console.log(`Kuantitas values: ${kuantitasValues.slice(0, 10).join(', ')}...`);
      console.log(`Total kuantitas: ${totalKuantitas}`);
      console.log(`Math.min(5, ${totalKuantitas}) = ${Math.min(5, totalKuantitas)}`);
      
      if (totalKuantitas === 0) {
        console.log('🔍 ISSUE: Total kuantitas is 0, so no items are selected!');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSwotAggregation();