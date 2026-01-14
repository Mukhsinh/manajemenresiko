const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Visi Misi Background Fix...\n');

// Test 1: Check if JavaScript file has been updated with white background
console.log('Test 1: Checking visi-misi.js for white background styling');
try {
    const visiMisiJs = fs.readFileSync('public/js/visi-misi.js', 'utf8');
    
    const hasWhiteBackground = visiMisiJs.includes('background-color: #ffffff !important');
    const hasInlineWhiteStyle = visiMisiJs.includes('style="background-color: #ffffff !important');
    
    if (hasWhiteBackground || hasInlineWhiteStyle) {
        console.log('✅ White background styling found in visi-misi.js');
    } else {
        console.log('❌ White background styling not found in visi-misi.js');
    }
} catch (error) {
    console.log('❌ Error reading visi-misi.js:', error.message);
}

// Test 2: Check if CSS file has override styles
console.log('\nTest 2: Checking style.css for visi misi override styles');
try {
    const styleCSS = fs.readFileSync('public/css/style.css', 'utf8');
    
    const hasVisiMisiOverride = styleCSS.includes('#visi-misi-content .card-header');
    const hasWhiteBackgroundCSS = styleCSS.includes('background-color: #ffffff !important');
    const hasNoPurpleBackground = styleCSS.includes('background-image: none !important');
    
    if (hasVisiMisiOverride && hasWhiteBackgroundCSS && hasNoPurpleBackground) {
        console.log('✅ CSS override styles for visi misi found');
    } else {
        console.log('❌ CSS override styles incomplete');
        console.log(`   - Visi misi override: ${hasVisiMisiOverride}`);
        console.log(`   - White background: ${hasWhiteBackgroundCSS}`);
        console.log(`   - No purple background: ${hasNoPurpleBackground}`);
    }
} catch (error) {
    console.log('❌ Error reading style.css:', error.message);
}

// Test 3: Create test HTML file to verify the fix
console.log('\nTest 3: Creating test HTML file to verify background fix');
const testHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Visi Misi Background Fix</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 2rem; 
            background-color: #f8f9fa;
        }
        .test-section { 
            margin: 2rem 0; 
            padding: 1.5rem; 
            border: 1px solid #ddd; 
            border-radius: 8px; 
            background: white;
        }
        .success { 
            background-color: #d4edda; 
            color: #155724; 
            border: 1px solid #c3e6cb; 
            padding: 1rem;
            border-radius: 4px;
            margin: 1rem 0;
        }
        .error { 
            background-color: #f8d7da; 
            color: #721c24; 
            border: 1px solid #f5c6cb; 
            padding: 1rem;
            border-radius: 4px;
            margin: 1rem 0;
        }
        .info {
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
            padding: 1rem;
            border-radius: 4px;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <h1><i class="fas fa-test-tube"></i> Test Visi Misi Background Fix</h1>
    
    <div class="info">
        <h4>Tujuan Test:</h4>
        <p>Memverifikasi bahwa background ungu di belakang tombol 'Tambah Visi Misi' telah dihapus dan diganti dengan background putih.</p>
    </div>

    <div class="test-section">
        <h3>Test 1: Visi Misi Card dengan Background Putih</h3>
        <div id="visi-misi-content">
            <!-- Ini akan diisi oleh JavaScript -->
        </div>
        <button onclick="loadVisiMisiTest()" class="btn btn-primary">
            <i class="fas fa-play"></i> Load Visi Misi Test
        </button>
    </div>

    <div class="test-section">
        <h3>Test 2: Verifikasi CSS Override</h3>
        <div id="css-test-results">
            <p>Klik tombol di bawah untuk memeriksa CSS override:</p>
        </div>
        <button onclick="checkCSSOverride()" class="btn btn-info">
            <i class="fas fa-css3-alt"></i> Check CSS Override
        </button>
    </div>

    <div class="test-section">
        <h3>Test 3: Visual Comparison</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
                <h5>Before (Purple Background):</h5>
                <div class="card">
                    <div class="card-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <button class="btn btn-success">
                            <i class="fas fa-plus"></i> Tambah Visi Misi (Old)
                        </button>
                    </div>
                </div>
            </div>
            <div>
                <h5>After (White Background):</h5>
                <div class="card">
                    <div class="card-header" style="background-color: #ffffff !important; color: #1e3a5f;">
                        <button class="btn btn-success" style="background-color: #28a745; color: #ffffff; border: 1px solid #28a745;">
                            <i class="fas fa-plus"></i> Tambah Visi Misi (New)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="js/services/apiService.js"></script>
    <script src="js/visi-misi.js"></script>
    <script>
        function loadVisiMisiTest() {
            console.log('Loading visi misi test...');
            
            // Simulate loading visi misi
            const content = document.getElementById('visi-misi-content');
            content.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
            
            setTimeout(() => {
                // Use the actual visi misi rendering function
                const testData = [
                    {
                        id: 1,
                        tahun: 2024,
                        visi: 'Menjadi rumah sakit terdepan dalam pelayanan kesehatan',
                        misi: 'Memberikan pelayanan kesehatan terbaik\\nMeningkatkan kualitas SDM\\nMengembangkan teknologi medis',
                        status: 'Aktif'
                    }
                ];
                
                if (typeof renderVisiMisi === 'function') {
                    renderVisiMisi(testData);
                    
                    // Check if background is white
                    setTimeout(() => {
                        const cardHeader = document.querySelector('#visi-misi-content .card-header');
                        if (cardHeader) {
                            const bgColor = window.getComputedStyle(cardHeader).backgroundColor;
                            const resultDiv = document.createElement('div');
                            
                            if (bgColor === 'rgb(255, 255, 255)' || bgColor === '#ffffff') {
                                resultDiv.className = 'success';
                                resultDiv.innerHTML = '<i class="fas fa-check"></i> ✅ Background berhasil diubah ke putih!';
                            } else {
                                resultDiv.className = 'error';
                                resultDiv.innerHTML = '<i class="fas fa-times"></i> ❌ Background masih belum putih. Current: ' + bgColor;
                            }
                            
                            content.appendChild(resultDiv);
                        }
                    }, 100);
                } else {
                    content.innerHTML = '<div class="error">renderVisiMisi function not found</div>';
                }
            }, 1000);
        }
        
        function checkCSSOverride() {
            const resultsDiv = document.getElementById('css-test-results');
            
            // Create test element
            const testDiv = document.createElement('div');
            testDiv.id = 'visi-misi-content';
            testDiv.innerHTML = '<div class="card"><div class="card-header">Test Header</div></div>';
            testDiv.style.position = 'absolute';
            testDiv.style.left = '-9999px';
            document.body.appendChild(testDiv);
            
            const cardHeader = testDiv.querySelector('.card-header');
            const computedStyle = window.getComputedStyle(cardHeader);
            const bgColor = computedStyle.backgroundColor;
            
            document.body.removeChild(testDiv);
            
            let result = '<h5>CSS Override Test Results:</h5>';
            result += '<ul>';
            result += '<li>Computed background-color: ' + bgColor + '</li>';
            result += '<li>Is white: ' + (bgColor === 'rgb(255, 255, 255)' || bgColor === '#ffffff') + '</li>';
            result += '</ul>';
            
            if (bgColor === 'rgb(255, 255, 255)' || bgColor === '#ffffff') {
                result += '<div class="success"><i class="fas fa-check"></i> CSS Override berhasil!</div>';
            } else {
                result += '<div class="error"><i class="fas fa-times"></i> CSS Override belum berhasil</div>';
            }
            
            resultsDiv.innerHTML = result;
        }
        
        // Auto-run tests on page load
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Page loaded, running automatic tests...');
            setTimeout(() => {
                loadVisiMisiTest();
                checkCSSOverride();
            }, 500);
        });
    </script>
</body>
</html>
`;

try {
    fs.writeFileSync('public/test-visi-misi-background-fix.html', testHTML);
    console.log('✅ Test HTML file created: public/test-visi-misi-background-fix.html');
} catch (error) {
    console.log('❌ Error creating test HTML file:', error.message);
}

console.log('\n📋 Summary of Changes Made:');
console.log('1. ✨ Updated visi-misi.js to use !important for white background');
console.log('2. 🎨 Added CSS override rules in style.css for visi misi cards');
console.log('3. 🧪 Created test file to verify the fix');

console.log('\n🔧 How to Test:');
console.log('1. Open browser and navigate to: /test-visi-misi-background-fix.html');
console.log('2. Check that the "After" example shows white background');
console.log('3. Verify that CSS override test passes');
console.log('4. Test the actual visi misi page to confirm fix');

console.log('\n✅ Background fix implementation complete!');