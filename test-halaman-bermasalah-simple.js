// Test sederhana untuk memeriksa halaman yang bermasalah
const fs = require('fs');
const path = require('path');

console.log('=== ANALISIS MASALAH HALAMAN ===');

// 1. Check if HTML files exist
console.log('\n1. Checking HTML files...');
const htmlFiles = [
    'public/analisis-swot.html',
    'public/sasaran-strategi.html', 
    'public/indikator-kinerja-utama.html'
];

htmlFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${file}: ${exists ? '✓ EXISTS' : '✗ NOT FOUND'}`);
});

// 2. Check if JS modules exist
console.log('\n2. Checking JavaScript modules...');
const jsFiles = [
    'public/js/analisis-swot.js',
    'public/js/sasaran-strategi.js',
    'public/js/indikator-kinerja-utama.js'
];

jsFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${file}: ${exists ? '✓ EXISTS' : '✗ NOT FOUND'}`);
    
    if (exists) {
        const content = fs.readFileSync(file, 'utf8');
        const hasModule = content.includes('Module') || content.includes('module');
        const hasLoad = content.includes('load()') || content.includes('load:');
        const hasWindowExport = content.includes('window.');
        
        console.log(`  - Has module pattern: ${hasModule ? '✓' : '✗'}`);
        console.log(`  - Has load function: ${hasLoad ? '✓' : '✗'}`);
        console.log(`  - Exports to window: ${hasWindowExport ? '✓' : '✗'}`);
    }
});

// 3. Check index.html for page elements
console.log('\n3. Checking index.html for page elements...');
if (fs.existsSync('public/index.html')) {
    const indexContent = fs.readFileSync('public/index.html', 'utf8');
    
    const pageElements = [
        'id="analisis-swot"',
        'id="sasaran-strategi"',
        'id="indikator-kinerja-utama"'
    ];
    
    pageElements.forEach(element => {
        const exists = indexContent.includes(element);
        console.log(`${element}: ${exists ? '✓ FOUND' : '✗ NOT FOUND'}`);
    });
    
    // Check if JS files are loaded in index.html
    console.log('\n4. Checking if JS files are loaded in index.html...');
    jsFiles.forEach(file => {
        const scriptTag = file.replace('public/', '/');
        const isLoaded = indexContent.includes(scriptTag);
        console.log(`${scriptTag}: ${isLoaded ? '✓ LOADED' : '✗ NOT LOADED'}`);
    });
} else {
    console.log('✗ index.html not found!');
}

// 5. Check app.js for loadPageData function
console.log('\n5. Checking app.js for loadPageData function...');
if (fs.existsSync('public/js/app.js')) {
    const appContent = fs.readFileSync('public/js/app.js', 'utf8');
    
    const pageHandlers = [
        'analisis-swot',
        'sasaran-strategi', 
        'indikator-kinerja-utama'
    ];
    
    pageHandlers.forEach(handler => {
        const hasHandler = appContent.includes(`case '${handler}':`);
        const hasModuleCall = appContent.includes(`${handler.replace('-', '')}Module`) || 
                             appContent.includes(`${handler.replace('-', '_')}Module`);
        
        console.log(`${handler} handler: ${hasHandler ? '✓ FOUND' : '✗ NOT FOUND'}`);
        console.log(`${handler} module call: ${hasModuleCall ? '✓ FOUND' : '✗ NOT FOUND'}`);
    });
} else {
    console.log('✗ app.js not found!');
}

// 6. Check route configuration
console.log('\n6. Checking route configuration...');
if (fs.existsSync('public/js/route-config.js')) {
    const routeContent = fs.readFileSync('public/js/route-config.js', 'utf8');
    
    const routes = [
        '/analisis-swot',
        '/sasaran-strategi',
        '/indikator-kinerja-utama'
    ];
    
    routes.forEach(route => {
        const hasRoute = routeContent.includes(`'${route}':`);
        console.log(`${route}: ${hasRoute ? '✓ CONFIGURED' : '✗ NOT CONFIGURED'}`);
    });
} else {
    console.log('✗ route-config.js not found!');
}

console.log('\n=== ANALISIS COMPLETE ===');
console.log('\nKESIMPULAN:');
console.log('Aplikasi menggunakan SPA (Single Page Application) dengan routing JavaScript.');
console.log('Halaman-halaman tersebut seharusnya dimuat melalui JavaScript modules.');
console.log('Jika halaman tidak berubah, kemungkinan masalah ada di:');
console.log('1. Module tidak ter-load dengan benar');
console.log('2. API endpoint tidak dapat diakses');
console.log('3. Authentication/authorization issue');
console.log('4. JavaScript error yang mencegah module berjalan');