const fs = require('fs');
const path = require('path');

console.log('🎨 Integrating Purple Color Removal...\n');

// Function to add CSS link to HTML files
function addCSSLinkToHTML(filePath, cssFile) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${filePath}`);
            return false;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if CSS is already included
        if (content.includes(cssFile)) {
            console.log(`✅ ${cssFile} already included in ${filePath}`);
            return true;
        }
        
        // Add CSS link before closing head tag
        const cssLink = `    <link rel="stylesheet" href="css/${cssFile}">`;
        
        if (content.includes('</head>')) {
            content = content.replace('</head>', `${cssLink}\n</head>`);
            fs.writeFileSync(filePath, content);
            console.log(`✅ Added ${cssFile} to ${filePath}`);
            return true;
        } else {
            console.log(`⚠️  No </head> tag found in ${filePath}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error updating ${filePath}:`, error.message);
        return false;
    }
}

// Function to add JS script to HTML files
function addJSScriptToHTML(filePath, jsFile) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${filePath}`);
            return false;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if JS is already included
        if (content.includes(jsFile)) {
            console.log(`✅ ${jsFile} already included in ${filePath}`);
            return true;
        }
        
        // Add JS script before closing body tag
        const jsScript = `    <script src="js/${jsFile}"></script>`;
        
        if (content.includes('</body>')) {
            content = content.replace('</body>', `${jsScript}\n</body>`);
            fs.writeFileSync(filePath, content);
            console.log(`✅ Added ${jsFile} to ${filePath}`);
            return true;
        } else {
            console.log(`⚠️  No </body> tag found in ${filePath}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error updating ${filePath}:`, error.message);
        return false;
    }
}

// Main HTML files to update
const mainHTMLFiles = [
    'public/index.html',
    'public/dashboard.html',
    'public/login.html'
];

// Test HTML files to update
const testHTMLFiles = [
    'public/test-visi-misi-background-fix.html',
    'public/test-comprehensive-ui-fix.html',
    'public/test-rencana-strategis-enhanced.html',
    'public/test-swot-analisis-professional.html'
];

console.log('1. Adding CSS files to HTML pages...');

// Add CSS to main files
mainHTMLFiles.forEach(file => {
    addCSSLinkToHTML(file, 'remove-purple-colors.css');
});

// Add CSS to test files
testHTMLFiles.forEach(file => {
    addCSSLinkToHTML(file, 'remove-purple-colors.css');
});

console.log('\n2. Adding JavaScript files to HTML pages...');

// Add JS to main files
mainHTMLFiles.forEach(file => {
    addJSScriptToHTML(file, 'remove-purple-colors.js');
});

// Add JS to test files
testHTMLFiles.forEach(file => {
    addJSScriptToHTML(file, 'remove-purple-colors.js');
});

console.log('\n3. Updating main CSS file with purple removal rules...');

// Add purple removal rules to main CSS file
try {
    const mainCSSPath = 'public/css/style.css';
    let mainCSS = fs.readFileSync(mainCSSPath, 'utf8');
    
    // Check if purple removal rules are already added
    if (!mainCSS.includes('/* Purple Color Removal Rules */')) {
        const purpleRemovalRules = `

/* Purple Color Removal Rules - Added by integrate-purple-removal.js */
/* Import purple removal styles */
@import url('remove-purple-colors.css');

/* Additional global purple removal */
* {
    /* Remove any purple backgrounds */
}

*[style*="purple"],
*[style*="#764ba2"],
*[style*="#667eea"] {
    background: #ffffff !important;
    background-image: none !important;
}

/* Ensure all headers are white */
.card-header,
.page-header,
.section-header,
.modal-header {
    background: #ffffff !important;
    background-image: none !important;
    color: #495057 !important;
}
`;
        
        fs.appendFileSync(mainCSSPath, purpleRemovalRules);
        console.log('✅ Added purple removal rules to main CSS');
    } else {
        console.log('✅ Purple removal rules already exist in main CSS');
    }
} catch (error) {
    console.log('❌ Error updating main CSS:', error.message);
}

console.log('\n4. Creating integration verification script...');

// Create verification script
const verificationScript = `
// Purple Removal Verification
console.log('🎨 Purple Removal Integration Active');

// Verify CSS files are loaded
const cssFiles = ['remove-purple-colors.css', 'header-fix.css'];
cssFiles.forEach(cssFile => {
    const link = document.querySelector(\`link[href*="\${cssFile}"]\`);
    if (link) {
        console.log(\`✅ \${cssFile} loaded\`);
    } else {
        console.warn(\`⚠️  \${cssFile} not found\`);
    }
});

// Verify JS is loaded
if (window.removePurpleColors) {
    console.log('✅ Purple removal JavaScript loaded');
    
    // Run initial scan
    setTimeout(() => {
        window.removePurpleColors.scan();
        console.log('🔍 Initial purple removal scan completed');
    }, 1000);
} else {
    console.warn('⚠️  Purple removal JavaScript not loaded');
}
`;

fs.writeFileSync('public/js/purple-removal-verification.js', verificationScript);
console.log('✅ Created purple removal verification script');

console.log('\n5. Testing file creation verification...');

const filesToCheck = [
    'public/css/remove-purple-colors.css',
    'public/js/remove-purple-colors.js',
    'public/test-remove-purple-colors.html',
    'public/js/purple-removal-verification.js'
];

let allFilesExist = true;
filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
        allFilesExist = false;
    }
});

console.log('\n📋 Integration Summary:');
console.log('1. ✨ Created remove-purple-colors.css for global purple removal');
console.log('2. 🔧 Created remove-purple-colors.js for dynamic purple detection');
console.log('3. 🧪 Created test-remove-purple-colors.html for verification');
console.log('4. 📝 Updated HTML files to include new CSS and JS');
console.log('5. 🎯 Added purple removal rules to main CSS file');

console.log('\n🔧 How to Test:');
console.log('1. Open browser and navigate to: /test-remove-purple-colors.html');
console.log('2. Verify all test elements show white backgrounds');
console.log('3. Test dynamic purple removal functionality');
console.log('4. Check main application pages for purple removal');

if (allFilesExist) {
    console.log('\n✅ Purple color removal integration complete!');
} else {
    console.log('\n⚠️  Some files are missing. Please check the integration.');
}

console.log('\n🎨 All purple colors should now be replaced with white/neutral colors throughout the application.');