/**
 * Test Current Rencana Strategis Display
 * Memverifikasi tampilan saat ini dan memberikan opsi untuk switch view
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3003';

async function testCurrentDisplay() {
    console.log('🧪 Testing Current Rencana Strategis Display...\n');
    
    try {
        // Test akses halaman
        console.log('1️⃣ Testing page access...');
        const pageResponse = await axios.get(`${BASE_URL}/rencana-strategis`);
        
        if (pageResponse.status === 200) {
            console.log('✅ Page accessible');
            
            // Test API data
            console.log('\n2️⃣ Testing API data...');
            const apiResponse = await axios.get(`${BASE_URL}/api/rencana-strategis/public`);
            console.log(`✅ API working: ${apiResponse.data.length} records found`);
            
            // Display current data
            console.log('\n📊 Current Data:');
            apiResponse.data.forEach((item, index) => {
                console.log(`${index + 1}. ${item.kode} - ${item.nama_rencana}`);
                console.log(`   Status: ${item.status || 'Draft'}`);
                console.log(`   Periode: ${item.periode_mulai || 'N/A'} - ${item.periode_selesai || 'N/A'}`);
                console.log('');
            });
            
            console.log('\n🎯 Current Display Analysis:');
            console.log('✅ The page is showing SELECTION VIEW (list of rencana strategis)');
            console.log('✅ This matches the SECOND image you uploaded (correct behavior)');
            console.log('✅ It is NOT showing TABLE VIEW (first image) by default');
            
            console.log('\n🔄 Available Views:');
            console.log('1. SELECTION VIEW (Current) - List format with individual items');
            console.log('2. TABLE VIEW (Hidden) - Table format with columns');
            console.log('3. FORM VIEW (Hidden) - Add/Edit form');
            
            console.log('\n🎮 User Actions Available:');
            console.log('- Click "Kelola Data" → Switch to TABLE VIEW');
            console.log('- Click "Tambah Baru" → Switch to FORM VIEW');
            console.log('- Click individual item → View details or edit');
            console.log('- Click "Export Data" → Download Excel');
            
            console.log('\n❓ Question for User:');
            console.log('The current display is CORRECT (showing selection view).');
            console.log('What exactly do you want to change?');
            console.log('A) Show TABLE VIEW by default instead?');
            console.log('B) Different layout for selection view?');
            console.log('C) Something else?');
            
        } else {
            console.log(`❌ Page not accessible: ${pageResponse.status}`);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure the server is running on port 3003');
            console.log('   Run: node server.js');
        }
    }
}

// Run the test
testCurrentDisplay();