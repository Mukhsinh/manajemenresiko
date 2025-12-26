const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixZeroScores() {
  try {
    console.log('🔧 Memperbaiki data score yang bernilai 0...\n');
    
    // 1. Cek data dengan score 0 atau null
    const { data: zeroScores, error: zeroError } = await supabase
      .from('swot_analisis')
      .select('id, bobot, rank, score')
      .or('score.is.null,score.eq.0')
      .eq('tahun', 2025);
    
    if (zeroError) {
      throw zeroError;
    }
    
    console.log(`📊 Ditemukan ${zeroScores.length} data dengan score 0 atau null`);
    
    if (zeroScores.length > 0) {
      console.log('🔄 Memperbaiki data...');
      
      for (const item of zeroScores) {
        const newScore = (item.bobot || 20) * (item.rank || 4);
        
        const { error: updateError } = await supabase
          .from('swot_analisis')
          .update({ score: newScore })
          .eq('id', item.id);
        
        if (updateError) {
          console.error(`❌ Error updating ${item.id}:`, updateError);
        } else {
          console.log(`✅ Updated ${item.id}: score = ${newScore}`);
        }
      }
    }
    
    // 2. Verifikasi hasil perbaikan
    console.log('\n📈 Verifikasi hasil perbaikan...');
    
    const { data: summary, error: summaryError } = await supabase
      .rpc('get_swot_summary_by_category', { target_year: 2025 });
    
    if (summaryError) {
      // Fallback to manual query
      const { data: allData, error: allError } = await supabase
        .from('swot_analisis')
        .select('kategori, bobot, rank, score')
        .eq('tahun', 2025);
      
      if (allError) {
        throw allError;
      }
      
      // Calculate summary manually
      const manualSummary = {};
      allData.forEach(item => {
        if (!manualSummary[item.kategori]) {
          manualSummary[item.kategori] = {
            count: 0,
            total_score: 0,
            min_score: Infinity,
            max_score: -Infinity,
            scores: []
          };
        }
        
        const score = item.score || 0;
        manualSummary[item.kategori].count++;
        manualSummary[item.kategori].total_score += score;
        manualSummary[item.kategori].min_score = Math.min(manualSummary[item.kategori].min_score, score);
        manualSummary[item.kategori].max_score = Math.max(manualSummary[item.kategori].max_score, score);
        manualSummary[item.kategori].scores.push(score);
      });
      
      // Convert to array format
      const summaryArray = Object.entries(manualSummary).map(([kategori, data]) => ({
        kategori,
        count: data.count,
        total_score: data.total_score,
        min_score: data.min_score === Infinity ? 0 : data.min_score,
        max_score: data.max_score === -Infinity ? 0 : data.max_score,
        avg_score: data.count > 0 ? data.total_score / data.count : 0
      }));
      
      console.log('\n📊 RINGKASAN DATA SCORE PER KATEGORI:');
      console.log('=' .repeat(80));
      
      let totalItems = 0;
      let grandTotalScore = 0;
      
      summaryArray.forEach(item => {
        const count = item.count;
        const totalScore = item.total_score;
        const minScore = item.min_score;
        const maxScore = item.max_score;
        const avgScore = item.avg_score.toFixed(2);
        
        totalItems += count;
        grandTotalScore += totalScore;
        
        console.log(`${item.kategori.padEnd(12)} | Count: ${count.toString().padStart(3)} | Total: ${totalScore.toString().padStart(6)} | Min: ${minScore.toString().padStart(3)} | Max: ${maxScore.toString().padStart(3)} | Avg: ${avgScore.padStart(6)}`);
      });
      
      console.log('=' .repeat(80));
      console.log(`TOTAL           | Count: ${totalItems.toString().padStart(3)} | Total: ${grandTotalScore.toString().padStart(6)} | Avg: ${(grandTotalScore / totalItems).toFixed(2).padStart(6)}`);
      
      // 4. Validasi data untuk kartu summary
      console.log('\n🎯 VALIDASI DATA UNTUK KARTU SUMMARY:');
      
      summaryArray.forEach(item => {
        const totalScore = item.total_score;
        const displayScore = Math.max(totalScore, 1); // Ensure minimum 1
        console.log(`📊 ${item.kategori}: ${totalScore} (Display: ${displayScore})`);
      });
      
    } else {
      console.log('Summary data retrieved successfully');
    }
    
    console.log('\n🎉 Perbaikan selesai!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Jalankan perbaikan
fixZeroScores();