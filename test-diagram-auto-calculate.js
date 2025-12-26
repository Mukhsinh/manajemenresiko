const { supabaseAdmin } = require('./config/supabase');

async function testAutoCalculateDiagram() {
  try {
    console.log('🧪 Testing Auto-Calculate Diagram Functionality');
    
    // Test data - check what SWOT data exists
    console.log('\n1. Checking available SWOT data...');
    const { data: swotData, error: swotError } = await supabaseAdmin
      .from('swot_analisis')
      .select('tahun, unit_kerja_id, kategori, score, organization_id')
      .limit(10);
    
    if (swotError) {
      console.error('❌ Error fetching SWOT data:', swotError);
      return;
    }
    
    console.log('📊 Sample SWOT data:', swotData);
    
    if (!swotData || swotData.length === 0) {
      console.log('⚠️ No SWOT data found. Cannot test diagram calculation.');
      return;
    }
    
    // Get unique years and organizations
    const uniqueYears = [...new Set(swotData.map(item => item.tahun))];
    const uniqueOrgs = [...new Set(swotData.map(item => item.organization_id).filter(Boolean))];
    
    console.log('📅 Available years:', uniqueYears);
    console.log('🏢 Available organizations:', uniqueOrgs);
    
    // Test calculation for the first available year
    const testYear = uniqueYears[0];
    const testOrgId = uniqueOrgs[0];
    
    console.log(`\n2. Testing calculation for year ${testYear}...`);
    
    // Get all SWOT data for this year and organization
    const { data: yearData, error: yearError } = await supabaseAdmin
      .from('swot_analisis')
      .select('kategori, score, unit_kerja_id, organization_id')
      .eq('tahun', testYear)
      .eq('organization_id', testOrgId);
    
    if (yearError) {
      console.error('❌ Error fetching year data:', yearError);
      return;
    }
    
    console.log(`📈 Found ${yearData.length} SWOT entries for year ${testYear}`);
    
    // Get unique units
    const uniqueUnits = [...new Set(yearData.map(item => item.unit_kerja_id).filter(Boolean))];
    console.log(`🏢 Found ${uniqueUnits.length} unique units:`, uniqueUnits);
    
    // Calculate overall totals
    const overallTotals = {
      Strength: 0,
      Weakness: 0,
      Opportunity: 0,
      Threat: 0
    };
    
    // Group by category and unit
    const grouped = {};
    yearData.forEach(item => {
      const key = `${item.kategori}_${item.unit_kerja_id || 'no_unit'}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    
    // Calculate totals
    Object.keys(grouped).forEach(key => {
      const [kategori] = key.split('_');
      const items = grouped[key];
      const unitTotal = items.reduce((sum, item) => sum + (item.score || 0), 0);
      
      if (overallTotals[kategori] !== undefined) {
        overallTotals[kategori] += unitTotal;
      }
    });
    
    console.log('\n3. Overall calculation results:');
    console.log('📊 Category totals:', overallTotals);
    
    // Calculate axes
    const x_axis = overallTotals.Strength - overallTotals.Weakness;
    const y_axis = overallTotals.Opportunity - overallTotals.Threat;
    
    console.log('📍 Axes:', { x_axis, y_axis });
    
    // Determine quadrant
    let kuadran, strategi;
    if (x_axis >= 0 && y_axis >= 0) {
      kuadran = 'I';
      strategi = 'Growth';
    } else if (x_axis < 0 && y_axis >= 0) {
      kuadran = 'II';
      strategi = 'Stability';
    } else if (x_axis < 0 && y_axis < 0) {
      kuadran = 'III';
      strategi = 'Survival';
    } else {
      kuadran = 'IV';
      strategi = 'Diversification';
    }
    
    console.log('🎯 Position:', { kuadran, strategi });
    
    // Test individual unit calculations
    console.log('\n4. Individual unit calculations:');
    for (const unitId of uniqueUnits.slice(0, 3)) { // Test first 3 units
      const unitData = yearData.filter(item => item.unit_kerja_id === unitId);
      
      const unitTotals = {
        Strength: 0,
        Weakness: 0,
        Opportunity: 0,
        Threat: 0
      };
      
      unitData.forEach(item => {
        if (unitTotals[item.kategori] !== undefined) {
          unitTotals[item.kategori] += (item.score || 0);
        }
      });
      
      const unit_x = unitTotals.Strength - unitTotals.Weakness;
      const unit_y = unitTotals.Opportunity - unitTotals.Threat;
      
      let unit_kuadran;
      if (unit_x >= 0 && unit_y >= 0) unit_kuadran = 'I';
      else if (unit_x < 0 && unit_y >= 0) unit_kuadran = 'II';
      else if (unit_x < 0 && unit_y < 0) unit_kuadran = 'III';
      else unit_kuadran = 'IV';
      
      console.log(`   Unit ${unitId.substring(0, 8)}: Kuadran ${unit_kuadran} (${unit_x.toFixed(1)}, ${unit_y.toFixed(1)})`);
    }
    
    // Check existing diagrams
    console.log('\n5. Checking existing diagrams...');
    const { data: existingDiagrams, error: diagramError } = await supabaseAdmin
      .from('swot_diagram_kartesius')
      .select('*')
      .eq('tahun', testYear)
      .eq('organization_id', testOrgId);
    
    if (diagramError) {
      console.error('❌ Error fetching existing diagrams:', diagramError);
    } else {
      console.log(`📈 Found ${existingDiagrams.length} existing diagrams for year ${testYear}`);
      existingDiagrams.forEach(diagram => {
        console.log(`   - ${diagram.unit_kerja_name || 'Unknown'}: Kuadran ${diagram.kuadran} (${diagram.x_axis}, ${diagram.y_axis})`);
      });
    }
    
    console.log('\n✅ Auto-calculate diagram test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Year tested: ${testYear}`);
    console.log(`   - Units found: ${uniqueUnits.length}`);
    console.log(`   - SWOT entries: ${yearData.length}`);
    console.log(`   - Overall position: Kuadran ${kuadran} (${strategi})`);
    console.log(`   - Existing diagrams: ${existingDiagrams?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAutoCalculateDiagram();