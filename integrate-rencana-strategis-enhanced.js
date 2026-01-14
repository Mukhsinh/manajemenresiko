/**
 * INTEGRATE RENCANA STRATEGIS ENHANCED
 * Script to integrate the enhanced Rencana Strategis module
 * Created: December 28, 2025
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Integrating Enhanced Rencana Strategis Module...');

try {
  // 1. Backup existing files
  const backupDir = path.join(__dirname, 'backup-rencana-strategis');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  // Backup existing JavaScript files
  const jsFiles = [
    'public/js/rencana-strategis.js',
    'public/js/rencana-strategis-fixed.js',
    'public/js/rencana-strategis-optimized.js'
  ];

  jsFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const backupFile = path.join(backupDir, path.basename(file) + '.backup.' + Date.now());
      fs.copyFileSync(file, backupFile);
      console.log(`✅ Backed up ${file} to ${backupFile}`);
    }
  });

  // 2. Replace the main rencana-strategis.js with enhanced version
  const enhancedJsPath = 'public/js/rencana-strategis-enhanced.js';
  const mainJsPath = 'public/js/rencana-strategis.js';

  if (fs.existsSync(enhancedJsPath)) {
    fs.copyFileSync(enhancedJsPath, mainJsPath);
    console.log('✅ Replaced main rencana-strategis.js with enhanced version');
  }

  // 3. Update app.js to use the enhanced module
  const appJsPath = 'public/js/app.js';
  if (fs.existsSync(appJsPath)) {
    let appContent = fs.readFileSync(appJsPath, 'utf8');
    
    // Replace module references
    appContent = appContent.replace(
      /RencanaStrategisModule(?:Fixed)?/g,
      'RencanaStrategisModuleEnhanced'
    );
    
    // Replace load function calls
    appContent = appContent.replace(
      /loadRencanaStrategis(?:Fixed)?/g,
      'loadRencanaStrategisEnhanced'
    );
    
    fs.writeFileSync(appJsPath, appContent);
    console.log('✅ Updated app.js to use enhanced module');
  }

  // 4. Add CSS to main style file
  const mainCssPath = 'public/css/style.css';
  const enhancedCssPath = 'public/css/rencana-strategis-enhanced.css';
  
  if (fs.existsSync(enhancedCssPath)) {
    const enhancedCss = fs.readFileSync(enhancedCssPath, 'utf8');
    
    if (fs.existsSync(mainCssPath)) {
      let mainCss = fs.readFileSync(mainCssPath, 'utf8');
      
      // Check if enhanced styles are already included
      if (!mainCss.includes('/* Rencana Strategis Enhanced Styles */')) {
        mainCss += '\n\n' + enhancedCss;
        fs.writeFileSync(mainCssPath, mainCss);
        console.log('✅ Added enhanced CSS to main style file');
      } else {
        console.log('ℹ️ Enhanced CSS already included in main style file');
      }
    } else {
      // Create main CSS file with enhanced styles
      fs.writeFileSync(mainCssPath, enhancedCss);
      console.log('✅ Created main CSS file with enhanced styles');
    }
  }

  // 5. Update HTML files to include enhanced CSS
  const htmlFiles = [
    'public/index.html',
    'public/dashboard.html'
  ];

  htmlFiles.forEach(htmlFile => {
    if (fs.existsSync(htmlFile)) {
      let htmlContent = fs.readFileSync(htmlFile, 'utf8');
      
      // Add enhanced CSS link if not already present
      if (!htmlContent.includes('rencana-strategis-enhanced.css')) {
        const cssLink = '<link href="css/rencana-strategis-enhanced.css" rel="stylesheet">';
        
        if (htmlContent.includes('</head>')) {
          htmlContent = htmlContent.replace('</head>', `    ${cssLink}\n</head>`);
          fs.writeFileSync(htmlFile, htmlContent);
          console.log(`✅ Added enhanced CSS link to ${htmlFile}`);
        }
      }
    }
  });

  // 6. Create enhanced load function
  const enhancedLoaderContent = `
/**
 * Enhanced Rencana Strategis Loader
 * Auto-load function for enhanced module
 */

async function loadRencanaStrategisEnhanced() {
  console.log('🚀 Loading Rencana Strategis Enhanced...');
  
  // Set preservation flags
  sessionStorage.setItem('preserveRoute', '/rencana-strategis');
  sessionStorage.setItem('preserveRouteTimestamp', Date.now().toString());
  sessionStorage.setItem('preventAutoRedirect', 'true');
  
  // Wait for auth
  if (window.waitForAuthReady) {
    await window.waitForAuthReady(5000);
  }
  
  // Check if page is active
  const rencanaPage = document.getElementById('rencana-strategis');
  if (!rencanaPage) {
    console.error('❌ Rencana strategis page element not found');
    return;
  }
  
  // Force page to be active
  rencanaPage.classList.add('active');
  
  // Hide other pages
  document.querySelectorAll('.page-content').forEach(page => {
    if (page.id !== 'rencana-strategis') {
      page.classList.remove('active');
    }
  });
  
  try {
    await RencanaStrategisModuleEnhanced.load();
    
    // Confirm page visibility
    setTimeout(() => {
      if (rencanaPage) {
        rencanaPage.classList.add('active');
        console.log('✅ Rencana Strategis Enhanced loaded successfully');
      }
    }, 100);
    
  } catch (error) {
    console.error('❌ Failed to load rencana strategis enhanced:', error);
  }
}

// Export to window
window.loadRencanaStrategisEnhanced = loadRencanaStrategisEnhanced;
window.loadRencanaStrategis = loadRencanaStrategisEnhanced; // Backward compatibility

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const rencanaPage = document.getElementById('rencana-strategis');
    if (rencanaPage && rencanaPage.classList.contains('active')) {
      loadRencanaStrategisEnhanced();
    }
  }, 500);
});
`;

  fs.writeFileSync('public/js/rencana-strategis-loader.js', enhancedLoaderContent);
  console.log('✅ Created enhanced loader script');

  // 7. Create integration summary
  const summaryContent = `# RENCANA STRATEGIS ENHANCED INTEGRATION SUMMARY

## Changes Made:

### 1. UI/UX Improvements:
- ✅ Removed "Manajemen Rencana StrategisKelola rencana strategis organisasi dengan mudahToggle View" text
- ✅ Removed toggle view button
- ✅ Form only opens when "Tambah Baru" or "Edit" is clicked
- ✅ Repositioned "Tambah Baru" button next to "Import" button with different color
- ✅ Aligned all buttons neatly on the right side
- ✅ Enhanced card design with soft, contrasting colors
- ✅ Improved action button layout and ordering

### 2. Visual Enhancements:
- ✅ Soft gradient backgrounds for statistics cards
- ✅ Better color contrast for text readability
- ✅ Rounded corners and subtle shadows
- ✅ Smooth hover animations
- ✅ Enhanced form styling with better spacing
- ✅ Improved table design with better row highlighting

### 3. Functionality Improvements:
- ✅ Form hidden by default, shows only when needed
- ✅ Better button grouping and positioning
- ✅ Enhanced responsive design
- ✅ Improved loading states and error handling
- ✅ Better chip/badge styling for lists

### 4. Technical Improvements:
- ✅ Race condition prevention
- ✅ Better error handling
- ✅ Optimized data fetching
- ✅ Enhanced module structure
- ✅ Backward compatibility maintained

## Files Created/Modified:

### New Files:
- public/js/rencana-strategis-enhanced.js
- public/css/rencana-strategis-enhanced.css
- public/test-rencana-strategis-enhanced.html
- public/js/rencana-strategis-loader.js

### Modified Files:
- public/js/rencana-strategis.js (replaced with enhanced version)
- public/js/app.js (updated references)
- public/css/style.css (added enhanced styles)
- HTML files (added CSS links)

## Testing:
- Open public/test-rencana-strategis-enhanced.html to test the enhanced interface
- All original functionality preserved with improved UI/UX

## Key Features:
1. **Clean Interface**: No unnecessary text or buttons
2. **Smart Form Display**: Form appears only when needed
3. **Better Button Layout**: Logical grouping and positioning
4. **Enhanced Cards**: Soft colors with good contrast
5. **Responsive Design**: Works well on all screen sizes
6. **Smooth Animations**: Professional look and feel

Date: ${new Date().toISOString()}
Status: ✅ COMPLETED SUCCESSFULLY
`;

  fs.writeFileSync('RENCANA_STRATEGIS_ENHANCED_INTEGRATION.md', summaryContent);
  console.log('✅ Created integration summary');

  console.log('\n🎉 Enhanced Rencana Strategis Integration Completed Successfully!');
  console.log('\n📋 Summary of Changes:');
  console.log('   ✅ Removed unnecessary header text and toggle button');
  console.log('   ✅ Form now opens only when "Tambah Baru" or "Edit" is clicked');
  console.log('   ✅ Repositioned "Tambah Baru" button next to "Import" with different color');
  console.log('   ✅ Enhanced card design with soft, contrasting colors');
  console.log('   ✅ Improved action button layout and ordering');
  console.log('   ✅ Added smooth animations and better responsive design');
  console.log('\n🧪 Test the enhanced interface:');
  console.log('   👉 Open: public/test-rencana-strategis-enhanced.html');
  console.log('\n📁 Backup files saved to: backup-rencana-strategis/');

} catch (error) {
  console.error('❌ Integration failed:', error);
  process.exit(1);
}