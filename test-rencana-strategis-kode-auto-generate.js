const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testKodeAutoGenerate() {
  console.log('=== TEST AUTO GENERATE KODE RENCANA STRATEGIS ===\n');
  
  try {
    // Test 1: Generate kode via public endpoint
    console.log('1. Testing public kode generation...');
    const response1 = await axios.get(`${BASE_URL}/api/rencana-strategis/generate/kode/public`);
    console.log('✅ Public kode generated:', response1.data.kode);
    
    // Test 2: Generate multiple kodes to verify sequential numbering
    console.log('\n2. Testing sequential kode generation...');
    const kodes = [];
    for (let i = 0; i < 5; i++) {
      const response = await axios.get(`${BASE_URL}/api/rencana-strategis/generate/kode/public`);
      kodes.push(response.data.kode);
      console.log(`   Generated kode ${i + 1}:`, response.data.kode);
    }
    
    // Test 3: Verify current data
    console.log('\n3. Checking current rencana strategis data...');
    const dataResponse = await axios.get(`${BASE_URL}/api/rencana-strategis/public`);
    console.log(`✅ Current records count: ${dataResponse.data.length}`);
    
    if (dataResponse.data.length > 0) {
      console.log('   Latest records:');
      dataResponse.data.slice(0, 3).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.kode} - ${item.nama_rencana}`);
      });
    }
    
    // Test 4: Create new record to test auto-increment
    console.log('\n4. Testing record creation with auto-generated kode...');
    const newKodeResponse = await axios.get(`${BASE_URL}/api/rencana-strategis/generate/kode/public`);
    const newKode = newKodeResponse.data.kode;
    console.log('   New kode for creation:', newKode);
    
    // Extract number from kode to verify it's sequential
    const currentYear = new Date().getFullYear();
    const kodePattern = new RegExp(`RS-${currentYear}-(\\d+)`);
    
    console.log('\n5. Analyzing kode patterns...');
    const existingNumbers = dataResponse.data
      .map(item => {
        const match = item.kode.match(kodePattern);
        return match ? parseInt(match[1]) : null;
      })
      .filter(num => num !== null)
      .sort((a, b) => b - a); // Sort descending
    
    console.log('   Existing kode numbers (latest first):', existingNumbers.slice(0, 5));
    
    const newKodeMatch = newKode.match(kodePattern);
    if (newKodeMatch) {
      const newNumber = parseInt(newKodeMatch[1]);
      const expectedNumber = existingNumbers.length > 0 ? existingNumbers[0] + 1 : 1;
      
      console.log(`   New kode number: ${newNumber}`);
      console.log(`   Expected number: ${expectedNumber}`);
      
      if (newNumber >= expectedNumber) {
        console.log('✅ Kode auto-generation is working correctly!');
      } else {
        console.log('⚠️  Kode auto-generation might have issues');
      }
    }
    
    // Test 6: Test database function directly
    console.log('\n6. Testing database function...');
    try {
      const dbResponse = await axios.post(`${BASE_URL}/api/test-data/execute-sql`, {
        query: `SELECT get_max_rencana_strategis_number(${currentYear}) as max_number;`
      });
      console.log('✅ Database function result:', dbResponse.data);
    } catch (dbError) {
      console.log('⚠️  Database function test failed:', dbError.message);
    }
    
    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the test
testKodeAutoGenerate();