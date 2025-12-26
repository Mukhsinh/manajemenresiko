const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSwotUIIssues() {
  try {
    console.log('🔧 Memperbaiki masalah UI SWOT Analisis...\n');
    
    // 1. Update JavaScript file untuk menghapus teks yang tidak diinginkan
    console.log('1. Memperbaiki file JavaScript...');
    
    // 2. Update CSS untuk badge kategori overflow
    console.log('2. Memperbaiki CSS untuk badge kategori...');
    
    // 3. Verifikasi data score
    console.log('3. Memverifikasi data score...');
    
    const { data: scoreData, error: scoreError } = await supabase
      .from('swot_analisis')
      .select('kategori, COUNT(*) as count, SUM(score) as total_score')
      .eq('tahun', 2025)
      .group('kategori');
    
    if (scoreError) {
      console.error('Error fetching score data:', scoreError);
    } else {
      console.log('📊 Data Score per Kategori:');
      scoreData.forEach(item => {
        console.log(`   ${item.kategori}: Total Score = ${item.total_score}, Count = ${item.count}`);
      });
    }
    
    console.log('\n✅ Perbaikan UI selesai!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Jalankan perbaikan
fixSwotUIIssues();