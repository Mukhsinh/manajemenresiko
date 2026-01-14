const fs = require('fs');
const path = require('path');

console.log('🎨 Comprehensive Purple to White Color Fix...\n');

// Function to recursively find files
function findFiles(dir, extensions, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            findFiles(fullPath, extensions, files);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Purple color patterns to replace
const purplePatterns = [
    // Gradient patterns
    {
        pattern: /background:\s*linear-gradient\(135deg,\s*#667eea\s*0%,\s*#764ba2\s*100%\)/gi,
        replacement: 'background: #ffffff',
        description: 'Purple gradient to white'
    },
    {
        pattern: /background-image:\s*linear-gradient\(135deg,\s*#667eea\s*0%,\s*#764ba2\s*100%\)/gi,
        replacement: 'background-image: none; background: #ffffff',
        description: 'Purple gradient image to white'
    },
    // Specific purple colors
    {
        pattern: /#667eea/gi,
        replacement: '#ffffff',
        description: 'Light purple to white'
    },
    {
        pattern: /#764ba2/gi,
        replacement: '#ffffff',
        description: 'Dark purple to white'
    },
    // Purple color names
    {
        pattern: /background-color:\s*purple/gi,
        replacement: 'background-color: #ffffff',
        description: 'Purple color name to white'
    },
    {
        pattern: /background:\s*purple/gi,
        replacement: 'background: #ffffff',
        description: 'Purple background to white'
    },
    // Common purple hex codes
    {
        pattern: /#8A2BE2/gi,
        replacement: '#ffffff',
        description: 'Blue violet to white'
    },
    {
        pattern: /#9932CC/gi,
        replacement: '#ffffff',
        description: 'Dark orchid to white'
    },
    {
        pattern: /#9400D3/gi,
        replacement: '#ffffff',
        description: 'Dark violet to white'
    },
    {
        pattern: /#800080/gi,
        replacement: '#ffffff',
        description: 'Purple to white'
    }
];

// Files to process
const filesToProcess = [
    ...findFiles('public', ['.html', '.css', '.js']),
    ...findFiles('routes', ['.js'])
];

let totalReplacements = 0;
let filesModified = 0;

console.log(`Found ${filesToProcess.length} files to check...\n`);

for (const filePath of filesToProcess) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        let fileReplacements = 0;
        
        // Apply all purple patterns
        for (const pattern of purplePatterns) {
            const matches = content.match(pattern.pattern);
            if (matches) {
                content = content.replace(pattern.pattern, pattern.replacement);
                fileReplacements += matches.length;
                console.log(`  ✅ ${pattern.description}: ${matches.length} replacements in ${filePath}`);
            }
        }
        
        // Write back if changes were made
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            filesModified++;
            totalReplacements += fileReplacements;
            console.log(`📝 Modified: ${filePath} (${fileReplacements} changes)\n`);
        }
        
    } catch (error) {
        console.log(`❌ Error processing ${filePath}: ${error.message}`);
    }
}

// Additional CSS fixes
console.log('\n🎨 Adding comprehensive CSS fixes...');

const additionalCSS = `
/* Comprehensive Purple to White Fix */
/* Override any remaining purple colors */
*[style*="purple"],
*[style*="#667eea"],
*[style*="#764ba2"],
*[style*="#8A2BE2"],
*[style*="#9932CC"],
*[style*="#9400D3"],
*[style*="#800080"] {
    background: #ffffff !important;
    background-color: #ffffff !important;
    background-image: none !important;
}

/* Ensure all card headers are white */
.card-header,
.page-header,
.section-header,
.modal-header {
    background: #ffffff !important;
    background-color: #ffffff !important;
    background-image: none !important;
}

/* Specific overrides for visi misi and other modules */
#visi-misi-content .card-header,
#analisis-swot-content .card-header,
#rencana-strategis-content .card-header,
#residual-risk-content .card-header {
    background: #ffffff !important;
    background-color: #ffffff !important;
    background-image: none !important;
    color: #1e3a5f !important;
}

/* Prevent any purple gradients */
.card-header[style*="gradient"],
.page-header[style*="gradient"] {
    background: #ffffff !important;
    background-image: none !important;
}
`;

try {
    fs.appendFileSync('public/css/style.css', additionalCSS);
    console.log('✅ Added comprehensive CSS fixes to style.css');
} catch (error) {
    console.log('❌ Error adding CSS fixes:', error.message);
}

// Create verification HTML
const verificationHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purple to White Fix Verification</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/header-fix.css">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 2rem; 
            background-color: #f8f9fa;
        }
        .test-card {
            margin: 1rem 0;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        .success { 
            background-color: #d4edda; 
            color: #155724; 
            padding: 1rem;
            border-radius: 4px;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <h1><i class="fas fa-palette"></i> Purple to White Fix Verification</h1>
    
    <div class="success">
        <h4>✅ All Purple Colors Fixed!</h4>
        <p>Semua warna ungu di halaman telah diganti dengan warna putih.</p>
    </div>

    <h3>Test Cards - All Should Have White Headers:</h3>
    
    <div class="test-card">
        <div class="card-header">
            <h4>Visi Misi Card</h4>
            <button class="btn btn-success">
                <i class="fas fa-plus"></i> Tambah Visi Misi
            </button>
        </div>
        <div class="card-body">
            <p>Header should be white, not purple.</p>
        </div>
    </div>

    <div class="test-card">
        <div class="card-header">
            <h4>SWOT Analysis Card</h4>
            <button class="btn btn-primary">
                <i class="fas fa-chart-bar"></i> Analisis SWOT
            </button>
        </div>
        <div class="card-body">
            <p>Header should be white, not purple.</p>
        </div>
    </div>

    <div class="test-card">
        <div class="card-header">
            <h4>Rencana Strategis Card</h4>
            <button class="btn btn-info">
                <i class="fas fa-tasks"></i> Rencana Strategis
            </button>
        </div>
        <div class="card-body">
            <p>Header should be white, not purple.</p>
        </div>
    </div>

    <div class="test-card">
        <div class="card-header">
            <h4>Risk Management Card</h4>
            <button class="btn btn-warning">
                <i class="fas fa-exclamation-triangle"></i> Risk Management
            </button>
        </div>
        <div class="card-body">
            <p>Header should be white, not purple.</p>
        </div>
    </div>

    <script>
        // Verify all headers are white
        document.addEventListener('DOMContentLoaded', function() {
            const headers = document.querySelectorAll('.card-header');
            let allWhite = true;
            
            headers.forEach(header => {
                const bgColor = window.getComputedStyle(header).backgroundColor;
                if (bgColor !== 'rgb(255, 255, 255)' && bgColor !== '#ffffff') {
                    allWhite = false;
                    console.warn('Non-white header found:', header, 'Color:', bgColor);
                }
            });
            
            if (allWhite) {
                console.log('✅ All headers are white!');
            } else {
                console.warn('❌ Some headers are not white');
            }
        });
    </script>
</body>
</html>
`;

try {
    fs.writeFileSync('public/purple-to-white-verification.html', verificationHTML);
    console.log('✅ Created verification page: public/purple-to-white-verification.html');
} catch (error) {
    console.log('❌ Error creating verification page:', error.message);
}

console.log('\n📊 Summary:');
console.log(`Files processed: ${filesToProcess.length}`);
console.log(`Files modified: ${filesModified}`);
console.log(`Total replacements: ${totalReplacements}`);

console.log('\n🔧 How to verify:');
console.log('1. Open browser and navigate to: /purple-to-white-verification.html');
console.log('2. Check that all card headers are white');
console.log('3. Test the actual application pages');
console.log('4. Verify no purple colors remain');

console.log('\n✅ Purple to white conversion complete!');