
// Purple Removal Verification
console.log('🎨 Purple Removal Integration Active');

// Verify CSS files are loaded
const cssFiles = ['remove-purple-colors.css', 'header-fix.css'];
cssFiles.forEach(cssFile => {
    const link = document.querySelector(`link[href*="${cssFile}"]`);
    if (link) {
        console.log(`✅ ${cssFile} loaded`);
    } else {
        console.warn(`⚠️  ${cssFile} not found`);
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
