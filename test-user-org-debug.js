const { supabase, supabaseAdmin } = require('./config/supabase');

async function debugUserOrganizations() {
  try {
    console.log('=== Debug User Organizations ===');
    
    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('*');
    
    if (usersError) {
      console.error('Error getting users:', usersError);
      return;
    }
    
    console.log('Total users:', users?.length || 0);
    users?.forEach(user => {
      console.log(`- User: ${user.email} (${user.id}) - Role: ${user.role} - Org: ${user.organization_id}`);
    });
    
    // Get all organizations
    const { data: orgs, error: orgsError } = await supabaseAdmin
      .from('organizations')
      .select('*');
    
    if (orgsError) {
      console.error('Error getting organizations:', orgsError);
    } else {
      console.log('\nTotal organizations:', orgs?.length || 0);
      orgs?.forEach(org => {
        console.log(`- Org: ${org.name} (${org.id}) - Code: ${org.code}`);
      });
    }
    
    // Get organization_users mapping
    const { data: orgUsers, error: orgUsersError } = await supabaseAdmin
      .from('organization_users')
      .select('*');
    
    if (orgUsersError) {
      console.error('Error getting organization_users:', orgUsersError);
    } else {
      console.log('\nTotal organization_users mappings:', orgUsers?.length || 0);
      orgUsers?.forEach(ou => {
        console.log(`- User ${ou.user_id} -> Org ${ou.organization_id} (Role: ${ou.role})`);
      });
    }
    
    // Get sample risk data
    const { data: risks, error: risksError } = await supabaseAdmin
      .from('risk_inputs')
      .select('id, kode_risiko, user_id, organization_id')
      .limit(5);
    
    if (risksError) {
      console.error('Error getting risks:', risksError);
    } else {
      console.log('\nSample risk data:');
      risks?.forEach(risk => {
        console.log(`- Risk: ${risk.kode_risiko} - User: ${risk.user_id} - Org: ${risk.organization_id}`);
      });
    }
    
    // Get sample inherent analysis
    const { data: inherent, error: inherentError } = await supabaseAdmin
      .from('risk_inherent_analysis')
      .select('id, risk_input_id, probability, impact, risk_value, risk_level')
      .limit(5);
    
    if (inherentError) {
      console.error('Error getting inherent analysis:', inherentError);
    } else {
      console.log('\nSample inherent analysis:');
      inherent?.forEach(ia => {
        console.log(`- Analysis: ${ia.id} - Risk: ${ia.risk_input_id} - P:${ia.probability} I:${ia.impact} V:${ia.risk_value} L:${ia.risk_level}`);
      });
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugUserOrganizations().then(() => {
  console.log('\nDebug completed');
  process.exit(0);
});