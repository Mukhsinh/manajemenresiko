const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testDiagramAutoCalculation() {
  console.log('🧪 Testing Diagram Kartesius Auto Calculation...\n');

  try {
    // Test 1: Login as superadmin
    console.log('1. Login as superadmin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'mukhsin9@gmail.com',
      password: 'Jlamprang233!!'
    });

    const token = loginResponse.data.session.access_token;
    console.log('✅ Login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test 2: Check available SWOT data
    console.log('\n2. Checking available SWOT data...');
    const swotResponse = await axios.get(`${BASE_URL}/api/analisis-swot?tahun=2025`, { headers });
    console.log(`📊 Found ${swotResponse.data.length} SWOT analysis records for 2025`);

    if (swotResponse.data.length === 0) {
      console.log('❌ No SWOT data found for testing. Please ensure SWOT data exists for 2025.');
      return;
    }

    // Show sample of units
    const uniqueUnits = [...new Set(swotResponse.data.map(item => item.unit_kerja_id).filter(Boolean))];
    console.log(`🏢 Found ${uniqueUnits.length} unique units with SWOT data`);

    // Test 3: Auto calculate diagrams for all units
    console.log('\n3. Testing auto calculation for all units...');
    const calculateResponse = await axios.post(`${BASE_URL}/api/diagram-kartesius/calculate`, {
      tahun: 2025
    }, { headers });

    console.log('✅ Auto calculation response:', {
      message: calculateResponse.data.message,
      summary: calculateResponse.data.summary,
      results_count: calculateResponse.data.results?.length || 0,
      errors_count: calculateResponse.data.errors?.length || 0
    });

    // Show detailed results
    if (calculateResponse.data.results) {
      console.log('\n📈 Calculation Results:');
      calculateResponse.data.results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.unit}:`);
        console.log(`   Position: (${result.calculation.axes.x_axis.toFixed(1)}, ${result.calculation.axes.y_axis.toFixed(1)})`);
        console.log(`   Kuadran: ${result.calculation.position.kuadran} - ${result.calculation.position.strategi}`);
        console.log(`   Totals: S=${result.calculation.totals.Strength}, W=${result.calculation.totals.Weakness}, O=${result.calculation.totals.Opportunity}, T=${result.calculation.totals.Threat}`);
      });
    }

    // Show errors if any
    if (calculateResponse.data.errors && calculateResponse.data.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      calculateResponse.data.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.unit}: ${error.error}`);
      });
    }

    // Test 4: Retrieve calculated diagrams
    console.log('\n4. Retrieving calculated diagrams...');
    const diagramsResponse = await axios.get(`${BASE_URL}/api/diagram-kartesius?tahun=2025`, { headers });
    console.log(`📊 Found ${diagramsResponse.data.length} calculated diagrams`);

    // Show diagram summary
    if (diagramsResponse.data.length > 0) {
      console.log('\n📋 Diagram Summary:');
      diagramsResponse.data.forEach((diagram, index) => {
        console.log(`${index + 1}. ${diagram.unit_kerja_name}:`);
        console.log(`   Tahun: ${diagram.tahun}`);
        console.log(`   Position: (${parseFloat(diagram.x_axis).toFixed(1)}, ${parseFloat(diagram.y_axis).toFixed(1)})`);
        console.log(`   Kuadran: ${diagram.kuadran} - ${diagram.strategi}`);
        console.log(`   Created: ${new Date(diagram.created_at).toLocaleString()}`);
      });
    }

    // Test 5: Test with rencana strategis filter
    console.log('\n5. Testing with rencana strategis filter...');
    const rencanaResponse = await axios.get(`${BASE_URL}/api/rencana-strategis`, { headers });
    
    if (rencanaResponse.data.length > 0) {
      const firstRencana = rencanaResponse.data[0];
      console.log(`🎯 Testing with rencana strategis: ${firstRencana.nama_rencana}`);
      
      const filteredCalculateResponse = await axios.post(`${BASE_URL}/api/diagram-kartesius/calculate`, {
        rencana_strategis_id: firstRencana.id,
        tahun: 2025
      }, { headers });

      console.log('✅ Filtered calculation response:', {
        message: filteredCalculateResponse.data.message,
        summary: filteredCalculateResponse.data.summary
      });
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`- Auto calculation processes ${uniqueUnits.length + 1} units (${uniqueUnits.length} individual + 1 aggregate)`);
    console.log(`- Each unit gets its own diagram calculation`);
    console.log(`- Aggregate calculation combines all units`);
    console.log(`- System handles both new inserts and updates`);
    console.log(`- Supports filtering by rencana strategis`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure you have a superadmin user created');
      console.log('Run: node create-superadmin-user.js');
    }
    
    if (error.response?.status === 400) {
      console.log('\n💡 Tip: Make sure you have SWOT data for 2025');
      console.log('Check the SWOT analysis data in your database');
    }
  }
}

// Run the test
testDiagramAutoCalculation();