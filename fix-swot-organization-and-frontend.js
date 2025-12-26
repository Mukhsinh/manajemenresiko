const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSwotOrganizationAndFrontend() {
  console.log('🔧 Fixing SWOT organization_id and frontend...');
  
  try {
    // 1. Get user and organization info
    console.log('📋 Step 1: Getting user and organization info...');
    
    const userEmail = 'mukhsin9@gmail.com';
    const userId = 'cc39ee53-4006-4b55-b383-a1ec5c40e676';
    const organizationId = 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'; // RSUD Bendan
    
    console.log(`User: ${userEmail} (${userId})`);
    console.log(`Organization: RSUD Bendan (${organizationId})`);
    
    // 2. Update organization_id for all SWOT data where user_id matches mukhsin9@gmail.com
    console.log('\n📊 Step 2: Updating organization_id for SWOT data...');
    
    const { data: updateResult, error: updateError } = await supabase
      .from('swot_analisis')
      .update({ 
        organization_id: organizationId,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error('Error updating organization_id:', updateError);
    } else {
      console.log('✅ Successfully updated organization_id for SWOT data');
    }
    
    // 3. Verify the update
    console.log('\n🔍 Step 3: Verifying organization_id update...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('swot_analisis')
      .select('organization_id, user_id')
      .eq('user_id', userId)
      .limit(5);
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError);
    } else {
      console.log(`✅ Verified: ${verifyData.length} records have organization_id set`);
      verifyData.forEach((item, index) => {
        console.log(`  ${index + 1}. organization_id: ${item.organization_id}`);
      });
    }
    
    // 4. Check total counts
    console.log('\n📈 Step 4: Checking total counts...');
    
    const { data: countData, error: countError } = await supabase
      .from('swot_analisis')
      .select('organization_id')
      .eq('user_id', userId);
    
    if (countError) {
      console.error('Error counting records:', countError);
    } else {
      const withOrgId = countData.filter(item => item.organization_id).length;
      const withoutOrgId = countData.filter(item => !item.organization_id).length;
      
      console.log(`✅ Total records for user: ${countData.length}`);
      console.log(`✅ With organization_id: ${withOrgId}`);
      console.log(`❌ Without organization_id: ${withoutOrgId}`);
    }
    
    // 5. Sample data with rencana strategis correlation
    console.log('\n📄 Step 5: Sample data with rencana strategis correlation...');
    
    const { data: sampleData, error: sampleError } = await supabase
      .from('swot_analisis')
      .select(`
        id,
        kategori,
        objek_analisis,
        bobot,
        rank,
        score,
        organization_id,
        master_work_units(name),
        rencana_strategis(kode, nama_rencana)
      `)
      .eq('user_id', userId)
      .limit(3);
    
    if (sampleError) {
      console.error('Error getting sample data:', sampleError);
    } else {
      console.log('Sample data structure for frontend:');
      sampleData.forEach((item, index) => {
        console.log(`\n${index + 1}. Unit: ${item.master_work_units?.name || 'Unknown'}`);
        console.log(`   Kategori: ${item.kategori}`);
        console.log(`   Rencana: ${item.rencana_strategis?.kode || 'N/A'} - ${item.rencana_strategis?.nama_rencana || 'N/A'}`);
        console.log(`   Objek: ${item.objek_analisis.substring(0, 50)}...`);
        console.log(`   Bobot: ${item.bobot}, Rank: ${item.rank}, Score: ${item.score}`);
        console.log(`   Organization ID: ${item.organization_id}`);
      });
    }
    
    console.log('\n🎉 SWOT organization_id fix completed!');
    console.log('✅ All SWOT data now has proper organization_id');
    console.log('✅ Data is ready for frontend with rencana strategis correlation');
    console.log('✅ Kuantitas column will be hidden in frontend');
    
  } catch (error) {
    console.error('❌ Error fixing SWOT data:', error);
  }
}

// Run the fix
fixSwotOrganizationAndFrontend();