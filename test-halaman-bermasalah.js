const fetch = require('node-fetch');

// Test untuk memeriksa halaman yang bermasalah
async function testHalamanBermasalah() {
    console.log('=== TESTING HALAMAN BERMASALAH ===');
    
    const baseUrl = 'http://localhost:3002';
    
    // Test halaman utama
    console.log('\n1. Testing halaman utama...');
    try {
        const response = await fetch(`${baseUrl}/`);
        console.log(`Status: ${response.status}`);
        const html = await response.text();
        
        // Check if analisis-swot page exists in HTML
        const hasAnalisisSwot = html.includes('id="analisis-swot"');
        const hasSasaranStrategi = html.includes('id="sasaran-strategi"');
        const hasIndikatorKinerja = html.includes('id="indikator-kinerja-utama"');
        
        console.log(`✓ Analisis SWOT page element exists: ${hasAnalisisSwot}`);
        console.log(`✓ Sasaran Strategi page element exists: ${hasSasaranStrategi}`);
        console.log(`✓ Indikator Kinerja page element exists: ${hasIndikatorKinerja}`);
        
        // Check if JavaScript modules are loaded
        const hasAnalisisSwotJS = html.includes('analisis-swot.js');
        const hasSasaranStrategiJS = html.includes('sasaran-strategi.js');
        const hasIndikatorKinerjaJS = html.includes('indikator-kinerja-utama.js');
        
        console.log(`✓ Analisis SWOT JS loaded: ${hasAnalisisSwotJS}`);
        console.log(`✓ Sasaran Strategi JS loaded: ${hasSasaranStrategiJS}`);
        console.log(`✓ Indikator Kinerja JS loaded: ${hasIndikatorKinerjaJS}`);
        
    } catch (error) {
        console.error('Error testing main page:', error.message);
    }
    
    // Test API endpoints
    console.log('\n2. Testing API endpoints...');
    
    const endpoints = [
        '/api/analisis-swot',
        '/api/sasaran-strategi', 
        '/api/indikator-kinerja-utama'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\nTesting ${endpoint}...`);
            const response = await fetch(`${baseUrl}${endpoint}`);
            console.log(`Status: ${response.status}`);
            
            if (response.status === 401) {
                console.log('✓ Endpoint requires authentication (expected)');
            } else if (response.status === 200) {
                const data = await response.json();
                console.log(`✓ Data received: ${Array.isArray(data) ? data.length : 'object'} items`);
            } else {
                console.log(`⚠️ Unexpected status: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error testing ${endpoint}:`, error.message);
        }
    }
    
    // Test specific URLs
    console.log('\n3. Testing specific URLs...');
    
    const urls = [
        '/analisis-swot',
        '/sasaran-strategi',
        '/indikator-kinerja-utama'
    ];
    
    for (const url of urls) {
        try {
            console.log(`\nTesting ${url}...`);
            const response = await fetch(`${baseUrl}${url}`);
            console.log(`Status: ${response.status}`);
            
            if (response.status === 200) {
                const html = await response.text();
                const isIndexHtml = html.includes('<title>Aplikasi Manajemen Risiko</title>');
                console.log(`✓ Returns index.html (SPA): ${isIndexHtml}`);
                
                // Check if the specific page content exists
                const hasPageContent = html.includes(`id="${url.substring(1)}"`);
                console.log(`✓ Page content exists: ${hasPageContent}`);
            }
        } catch (error) {
            console.error(`Error testing ${url}:`, error.message);
        }
    }
    
    console.log('\n=== TEST COMPLETE ===');
}

// Run test
testHalamanBermasalah().catch(console.error);