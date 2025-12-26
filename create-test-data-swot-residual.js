const { supabaseAdmin } = require('./config/supabase');

async function createTestData() {
    console.log('🚀 Creating test data for SWOT and Residual Risk...\n');
    
    try {
        // Get organization ID
        const { data: orgs, error: orgError } = await supabaseAdmin
            .from('organizations')
            .select('id')
            .limit(1);
            
        if (orgError || !orgs || orgs.length === 0) {
            console.log('❌ No organization found. Creating default organization...');
            
            const { data: newOrg, error: createOrgError } = await supabaseAdmin
                .from('organizations')
                .insert({
                    name: 'Test Organization',
                    code: 'TEST_ORG',
                    description: 'Test organization for SWOT and Risk data'
                })
                .select()
                .single();
                
            if (createOrgError) {
                console.log('❌ Failed to create organization:', createOrgError);
                return;
            }
            
            console.log('✅ Created organization:', newOrg.name);
            var orgId = newOrg.id;
        } else {
            var orgId = orgs[0].id;
            console.log('✅ Using existing organization ID:', orgId);
        }
        
        // Create SWOT Analysis data
        console.log('\n📊 Creating SWOT Analysis data...');
        
        const swotData = [
            {
                organization_id: orgId,
                faktor: 'Kualitas SDM yang tinggi',
                jenis: 'Strength',
                bobot: 15,
                rating: 4,
                skor: 0.6,
                created_at: new Date().toISOString()
            },
            {
                organization_id: orgId,
                faktor: 'Sistem informasi yang terintegrasi',
                jenis: 'Strength',
                bobot: 20,
                rating: 4,
                skor: 0.8,
                created_at: new Date().toISOString()
            },
            {
                organization_id: orgId,
                faktor: 'Kurangnya anggaran operasional',
                jenis: 'Weakness',
                bobot: 25,
                rating: 3,
                skor: 0.75,
                created_at: new Date().toISOString()
            },
            {
                organization_id: orgId,
                faktor: 'Peluang kerjasama dengan institusi lain',
                jenis: 'Opportunity',
                bobot: 20,
                rating: 3,
                skor: 0.6,
                created_at: new Date().toISOString()
            },
            {
                organization_id: orgId,
                faktor: 'Perubahan regulasi pemerintah',
                jenis: 'Threat',
                bobot: 20,
                rating: 2,
                skor: 0.4,
                created_at: new Date().toISOString()
            }
        ];
        
        const { data: swotResult, error: swotError } = await supabaseAdmin
            .from('analisis_swot')
            .upsert(swotData, { onConflict: 'organization_id,faktor' })
            .select();
            
        if (swotError) {
            console.log('❌ Failed to create SWOT data:', swotError);
        } else {
            console.log('✅ Created SWOT data:', swotResult.length, 'records');
        }
        
        // Create Risk Input data first
        console.log('\n🎯 Creating Risk Input data...');
        
        // Get or create work unit
        let { data: workUnits, error: workUnitError } = await supabaseAdmin
            .from('master_work_units')
            .select('id')
            .limit(1);
            
        if (workUnitError || !workUnits || workUnits.length === 0) {
            const { data: newWorkUnit, error: createWorkUnitError } = await supabaseAdmin
                .from('master_work_units')
                .insert({
                    organization_id: orgId,
                    name: 'Unit Test',
                    code: 'UT001',
                    jenis: 'Operasional',
                    kategori: 'Core'
                })
                .select()
                .single();
                
            if (createWorkUnitError) {
                console.log('❌ Failed to create work unit:', createWorkUnitError);
                return;
            }
            var workUnitId = newWorkUnit.id;
        } else {
            var workUnitId = workUnits[0].id;
        }
        
        // Get or create risk category
        let { data: riskCategories, error: categoryError } = await supabaseAdmin
            .from('master_risk_categories')
            .select('id')
            .limit(1);
            
        if (categoryError || !riskCategories || riskCategories.length === 0) {
            const { data: newCategory, error: createCategoryError } = await supabaseAdmin
                .from('master_risk_categories')
                .insert({
                    organization_id: orgId,
                    name: 'Risiko Operasional',
                    code: 'RO',
                    description: 'Risiko terkait operasional'
                })
                .select()
                .single();
                
            if (createCategoryError) {
                console.log('❌ Failed to create risk category:', createCategoryError);
                return;
            }
            var categoryId = newCategory.id;
        } else {
            var categoryId = riskCategories[0].id;
        }
        
        const riskInputData = [
            {
                organization_id: orgId,
                nama_unit_kerja_id: workUnitId,
                kategori_risiko_id: categoryId,
                kode_risiko: 'R001',
                risk_event: 'Gangguan sistem informasi',
                risk_cause: 'Kerusakan server atau jaringan',
                risk_impact: 'Terhambatnya operasional harian',
                sasaran: 'Menjaga kontinuitas operasional',
                created_at: new Date().toISOString()
            },
            {
                organization_id: orgId,
                nama_unit_kerja_id: workUnitId,
                kategori_risiko_id: categoryId,
                kode_risiko: 'R002',
                risk_event: 'Kehilangan data penting',
                risk_cause: 'Tidak ada backup yang memadai',
                risk_impact: 'Kerugian finansial dan reputasi',
                sasaran: 'Menjaga integritas data',
                created_at: new Date().toISOString()
            }
        ];
        
        const { data: riskInputResult, error: riskInputError } = await supabaseAdmin
            .from('risk_inputs')
            .upsert(riskInputData, { onConflict: 'organization_id,kode_risiko' })
            .select();
            
        if (riskInputError) {
            console.log('❌ Failed to create risk input data:', riskInputError);
            return;
        } else {
            console.log('✅ Created risk input data:', riskInputResult.length, 'records');
        }
        
        // Create Residual Risk Analysis data
        console.log('\n🎯 Creating Residual Risk Analysis data...');
        
        const residualData = riskInputResult.map((risk, index) => ({
            risk_input_id: risk.id,
            probability: 3 + index,
            impact: 4 - index,
            risk_value: (3 + index) * (4 - index),
            risk_level: index === 0 ? 'High' : 'Medium',
            probability_percentage: (3 + index) * 20,
            financial_impact: 1000000 * (index + 1),
            created_at: new Date().toISOString()
        }));
        
        const { data: residualResult, error: residualError } = await supabaseAdmin
            .from('risk_residual_analysis')
            .upsert(residualData, { onConflict: 'risk_input_id' })
            .select();
            
        if (residualError) {
            console.log('❌ Failed to create residual risk data:', residualError);
        } else {
            console.log('✅ Created residual risk data:', residualResult.length, 'records');
        }
        
        console.log('\n🎉 Test data creation completed!');
        console.log('📊 Summary:');
        console.log(`   - SWOT Analysis: ${swotResult?.length || 0} records`);
        console.log(`   - Risk Inputs: ${riskInputResult?.length || 0} records`);
        console.log(`   - Residual Analysis: ${residualResult?.length || 0} records`);
        
    } catch (error) {
        console.log('❌ Error creating test data:', error);
    }
}

createTestData().catch(console.error);