require('dotenv').config();
const { supabaseAdmin } = require('./config/supabase');

async function testConnection() {
    try {
        console.log('Testing Supabase connection...');
        
        if (!supabaseAdmin) {
            console.error('Supabase admin client not available');
            return;
        }
        
        // Test visi misi query
        const { data: visiMisi, error: visiError } = await supabaseAdmin
            .from('visi_misi')
            .select('*')
            .limit(5);
            
        if (visiError) {
            console.error('Visi misi error:', visiError);
        } else {
            console.log('Visi misi data:', visiMisi?.length || 0, 'records');
            if (visiMisi && visiMisi.length > 0) {
                console.log('Sample visi misi:', visiMisi[0]);
            }
        }
        
        // Test rencana strategis query
        const { data: rencana, error: rencanaError } = await supabaseAdmin
            .from('rencana_strategis')
            .select('*')
            .limit(5);
            
        if (rencanaError) {
            console.error('Rencana strategis error:', rencanaError);
        } else {
            console.log('Rencana strategis data:', rencana?.length || 0, 'records');
            if (rencana && rencana.length > 0) {
                console.log('Sample rencana strategis:', rencana[0]);
            }
        }
        
        // Test dashboard query
        const { count: totalRisks, error: riskError } = await supabaseAdmin
            .from('risk_inputs')
            .select('*', { count: 'exact', head: true });
            
        if (riskError) {
            console.error('Risk inputs error:', riskError);
        } else {
            console.log('Total risks:', totalRisks);
        }
        
    } catch (error) {
        console.error('Test connection error:', error);
    }
}

testConnection();