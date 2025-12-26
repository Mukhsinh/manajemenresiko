const { supabase } = require('./config/supabase');

async function testDiagramKartesiusUpdates() {
  console.log('🧪 Testing Diagram Kartesius Updates...');
  
  try {
    // Test 1: Check master_work_units data structure
    console.log('\n1. Testing master_work_units structure...');
    const { data: workUnits, error: workUnitsError } = await supabase
      .from('master_work_units')
      .select('id, name, code, jenis, kategori')
      .order('code')
      .limit(5);
    
    if (workUnitsError) throw workUnitsError;
    
    console.log('✅ Work units data:', workUnits.map(u => ({
      code: u.code,
      name: u.name,
      jenis: u.jenis,
      kategori: u.kategori
    })));
    
    // Test 2: Check diagram kartesius with work units join
    console.log('\n2. Testing diagram kartesius with work units join...');
    const { data: diagrams, error: diagramsError } = await supabase
      .from('swot_diagram_kartesius')
      .select(`
        id, tahun, x_axis, y_axis, kuadran, strategi, unit_kerja_name,
        master_work_units!unit_kerja_id(id, name, code, jenis, kategori)
      `)
      .order('tahun', { ascending: false })
      .limit(3);
    
    if (diagramsError) throw diagramsError;
    
    console.log('✅ Diagram data with work units:', diagrams.map(d => ({
      tahun: d.tahun,
      unit_kerja_name: d.unit_kerja_name,
      work_unit: d.master_work_units ? {
        code: d.master_work_units.code,
        name: d.master_work_units.name,
        jenis: d.master_work_units.jenis,
        kategori: d.master_work_units.kategori
      } : null,
      position: `(${d.x_axis}, ${d.y_axis})`,
      kuadran: d.kuadran
    })));
    
    // Test 3: Check unique jenis and kategori values
    console.log('\n3. Testing unique jenis and kategori values...');
    const { data: allWorkUnits, error: allError } = await supabase
      .from('master_work_units')
      .select('jenis, kategori');
    
    if (allError) throw allError;
    
    const uniqueJenis = [...new Set(allWorkUnits.map(u => u.jenis).filter(Boolean))];
    const uniqueKategori = [...new Set(allWorkUnits.map(u => u.kategori).filter(Boolean))];
    
    console.log('✅ Unique jenis values:', uniqueJenis);
    console.log('✅ Unique kategori values:', uniqueKategori);
    
    // Test 4: Test filtering by jenis and kategori
    console.log('\n4. Testing filtering by jenis and kategori...');
    const testJenis = uniqueJenis[0];
    const testKategori = uniqueKategori[0];
    
    const { data: filteredUnits, error: filterError } = await supabase
      .from('master_work_units')
      .select('id, name, code, jenis, kategori')
      .eq('jenis', testJenis)
      .eq('kategori', testKategori)
      .limit(3);
    
    if (filterError) throw filterError;
    
    console.log(`✅ Filtered units (jenis: ${testJenis}, kategori: ${testKategori}):`, 
      filteredUnits.map(u => ({ code: u.code, name: u.name })));
    
    console.log('\n🎉 All tests passed! Diagram Kartesius updates are ready.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDiagramKartesiusUpdates();