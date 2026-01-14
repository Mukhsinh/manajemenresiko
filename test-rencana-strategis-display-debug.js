const axios = require('axios');

async function testRencanaStrategisDisplay() {
  console.log('=== TESTING RENCANA STRATEGIS DISPLAY ===');
  
  const baseURL = 'http://localhost:3033';
  
  try {
    // Test public endpoint first
    console.log('\n1. Testing public endpoint...');
    const publicResponse = await axios.get(`${baseURL}/api/rencana-strategis/public`);
    console.log('Public response status:', publicResponse.status);
    console.log('Public data count:', publicResponse.data?.length || 0);
    
    if (publicResponse.data && publicResponse.data.length > 0) {
      console.log('\nSample data from public endpoint:');
      const sample = publicResponse.data[0];
      console.log('Sample record:', {
        id: sample.id,
        kode: sample.kode,
        nama_rencana: sample.nama_rencana,
        deskripsi: sample.deskripsi?.substring(0, 100) + '...',
        periode_mulai: sample.periode_mulai,
        periode_selesai: sample.periode_selesai,
        target: sample.target?.substring(0, 100) + '...',
        sasaran_strategis: sample.sasaran_strategis,
        indikator_kinerja_utama: sample.indikator_kinerja_utama,
        status: sample.status
      });
      
      // Check if sasaran_strategis and indikator_kinerja_utama are properly formatted
      console.log('\nData format analysis:');
      console.log('sasaran_strategis type:', typeof sample.sasaran_strategis);
      console.log('sasaran_strategis value:', sample.sasaran_strategis);
      console.log('indikator_kinerja_utama type:', typeof sample.indikator_kinerja_utama);
      console.log('indikator_kinerja_utama value:', sample.indikator_kinerja_utama);
      
      // Try to parse if they are strings
      if (typeof sample.sasaran_strategis === 'string') {
        try {
          const parsedSasaran = JSON.parse(sample.sasaran_strategis);
          console.log('Parsed sasaran_strategis:', parsedSasaran);
        } catch (e) {
          console.log('sasaran_strategis is not valid JSON');
        }
      }
      
      if (typeof sample.indikator_kinerja_utama === 'string') {
        try {
          const parsedIndikator = JSON.parse(sample.indikator_kinerja_utama);
          console.log('Parsed indikator_kinerja_utama:', parsedIndikator);
        } catch (e) {
          console.log('indikator_kinerja_utama is not valid JSON');
        }
      }
    }
    
    // Test visi misi endpoint
    console.log('\n2. Testing visi misi endpoint...');
    const visiMisiResponse = await axios.get(`${baseURL}/api/visi-misi/public`);
    console.log('Visi misi response status:', visiMisiResponse.status);
    console.log('Visi misi data count:', visiMisiResponse.data?.length || 0);
    
    if (visiMisiResponse.data && visiMisiResponse.data.length > 0) {
      console.log('Sample visi misi:', {
        id: visiMisiResponse.data[0].id,
        visi: visiMisiResponse.data[0].visi?.substring(0, 100) + '...',
        misi: visiMisiResponse.data[0].misi?.substring(0, 100) + '...',
        tahun: visiMisiResponse.data[0].tahun
      });
    }
    
    console.log('\n=== DISPLAY DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('Error testing rencana strategis display:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testRencanaStrategisDisplay();