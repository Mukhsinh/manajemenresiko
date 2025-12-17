const { supabase } = require('./config/supabase');

async function testIndikatorKinerja() {
  try {
    console.log('Testing Indikator Kinerja Utama data...');
    
    // Test 1: Count total records
    const { count, error: countError } = await supabase
      .from('indikator_kinerja_utama')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Count error:', countError);
    } else {
      console.log('Total records:', count);
    }
    
    // Test 2: Get sample data
    const { data, error } = await supabase
      .from('indikator_kinerja_utama')
      .select('*, rencana_strategis(nama_rencana, organization_id), sasaran_strategi(sasaran, perspektif)')
      .limit(5);
    
    if (error) {
      console.error('Data error:', error);
    } else {
      console.log('Sample data count:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('First record:', {
          id: data[0].id,
          indikator: data[0].indikator,
          baseline_nilai: data[0].baseline_nilai,
          target_nilai: data[0].target_nilai,
          rencana_strategis: data[0].rencana_strategis?.nama_rencana,
          organization_id: data[0].rencana_strategis?.organization_id
        });
      }
    }
    
    // Test 3: Check organizations
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(5);
    
    if (orgError) {
      console.error('Organization error:', orgError);
    } else {
      console.log('Organizations count:', orgData?.length || 0);
      if (orgData && orgData.length > 0) {
        console.log('First organization:', orgData[0]);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testIndikatorKinerja();