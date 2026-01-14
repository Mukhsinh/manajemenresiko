const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Purple to White Fix...\n');

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

// Purple patterns to check for
const purplePatterns = [
    /#667eea/gi,
    /#764ba2/gi,
    /linear-gradient\(135deg,\s*#667eea\s*0%,\s*#764ba2\s*100%\)/gi,
    /background:\s*purple/gi,
    /background-color:\s*purple/gi,
    /#8A2BE2/gi,
    /#9932CC/gi,
    /#9400D3/gi,
    /#800080/gi
];

// Files to check
const filesToCheck = [
    ...findFiles('public', ['.html', '.css', '.js']),
    ...findFiles('routes', ['.js'])
];

let purpleFound = false;
let filesWithPurple = [];

console.log(`Checking ${filesToCheck.length} files for remaining purple colors...\n`);

for (const filePath of filesToCheck) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let hasPurple = false;
        
        for (const pattern of purplePatterns) {
            const matches = content.match(pattern);
            if (matches) {
                hasPurple = true;
                purpleFound = true;
                console.log(`❌ Purple found in ${filePath}:`);
                matches.forEach(match => {
                    console.log(`   - ${match}`);
                });
            }
        }
        
        if (hasPurple) {
            filesWithPurple.push(filePath);
        }
        
    } catch (error) {
        console.log(`⚠️  Error reading ${filePath}: ${error.message}`);
    }
}

console.log('\n📊 Verification Results:');
console.log(`Files checked: ${filesToCheck.length}`);
console.log(`Files with purple: ${filesWithPurple.length}`);

if (!purpleFound) {
    console.log('✅ SUCCESS: No purple colors found in any files!');
    console.log('🎉 All purple colors have been successfully converted to white.');
} else {
    console.log('❌ ATTENTION: Some purple colors still remain.');
    console.log('Files that still contain purple:');
    filesWithPurple.forEach(file => {
        console.log(`   - ${file}`);
    });
}

// Check specific important files
console.log('\n🔍 Checking key files:');

const keyFiles = [
    'public/js/visi-misi.js',
    'public/css/style.css',
    'public/css/header-fix.css',
    'public/index.html'
];

for (const keyFile of keyFiles) {
    if (fs.existsSync(keyFile)) {
        const content = fs.readFileSync(keyFile, 'utf8');
        let hasPurple = false;
        
        for (const pattern of purplePatterns) {
            if (pattern.test(content)) {
                hasPurple = true;
                break;
            }
        }
        
        if (hasPurple) {
            console.log(`❌ ${keyFile}: Still contains purple`);
        } else {
            console.log(`✅ ${keyFile}: Clean (no purple)`);
        }
    } else {
        console.log(`⚠️  ${keyFile}: File not found`);
    }
}

// Check if CSS overrides are in place
console.log('\n🎨 Checking CSS overrides:');

try {
    const styleCSS = fs.readFileSync('public/css/style.css', 'utf8');
    
    const hasVisiMisiOverride = styleCSS.includes('#visi-misi-content .card-header');
    const hasWhiteBackground = styleCSS.includes('background: #ffffff !important');
    const hasPurpleOverride = styleCSS.includes('*[style*="purple"]');
    
    console.log(`✅ Visi Misi override: ${hasVisiMisiOverride}`);
    console.log(`✅ White background rules: ${hasWhiteBackground}`);
    console.log(`✅ Purple override rules: ${hasPurpleOverride}`);
    
    if (hasVisiMisiOverride && hasWhiteBackground && hasPurpleOverride) {
        console.log('✅ All CSS overrides are in place');
    } else {
        console.log('❌ Some CSS overrides are missing');
    }
} catch (error) {
    console.log('❌ Error checking CSS overrides:', error.message);
}

console.log('\n🔧 Next Steps:');
console.log('1. Open browser and test the application');
console.log('2. Navigate to /purple-to-white-verification.html');
console.log('3. Check visi misi page specifically');
console.log('4. Verify all card headers are white');

if (!purpleFound) {
    console.log('\n🎉 CONGRATULATIONS!');
    console.log('All purple colors have been successfully converted to white.');
    console.log('Your application should now have a clean white theme.');
} else {
    console.log('\n⚠️  MANUAL REVIEW NEEDED');
    console.log('Some purple colors were found and may need manual fixing.');
}

console.log('\n✅ Verification complete!');