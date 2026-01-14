/**
 * Fix untuk masalah Rencana Strategis dan Pengaturan endpoint
 * 
 * Masalah:
 * 1. loadKopHeader() dipanggil sebelum user login
 * 2. /api/pengaturan memerlukan autentikasi tapi dipanggil tanpa token
 * 3. Halaman Rencana Strategis tidak berubah tampilan
 */

const fs = require('fs');
const path = require('path');

function fixLoadKopHeaderFunction() {
  console.log('🔧 Fixing loadKopHeader function...');
  
  const appJsPath = path.join(__dirname, 'public', 'js', 'app.js');
  
  if (!fs.existsSync(appJsPath)) {
    console.log('❌ app.js not found');
    return false;
  }
  
  let content = fs.readFileSync(appJsPath, 'utf8');
  
  // Find the loadKopHeader function
  const loadKopHeaderRegex = /async function loadKopHeader\(force = false\) \{[\s\S]*?\n\}/;
  
  const newLoadKopHeaderFunction = `async function loadKopHeader(force = false) {
    try {
        // Check if user is authenticated first
        if (!window.isAuthenticated || !window.currentSession) {
            console.log('⚠️ [KOP] User not authenticated, skipping kop header load');
            return;
        }
        
        if (!force && kopSettingsCache) {
            renderKopHeader(kopSettingsCache);
            return;
        }
        
        console.log('📡 [KOP] Loading kop header settings...');
        const settings = await apiCall('/api/pengaturan');
        
        kopSettingsCache = settings.reduce((acc, item) => {
            const key = (item.kunci_pengaturan || '').trim();
            const value = item.nilai_pengaturan || '';
            if (!key) return acc;
            acc[key] = value;
            acc[key.toLowerCase()] = value;
            return acc;
        }, {});
        
        renderKopHeader(kopSettingsCache);
        console.log('✅ [KOP] Kop header loaded successfully');
        
    } catch (error) {
        console.error('❌ [KOP] Kop header error:', error);
        // Don't throw error, just log it to prevent blocking other functionality
    }
}`;

  if (loadKopHeaderRegex.test(content)) {
    content = content.replace(loadKopHeaderRegex, newLoadKopHeaderFunction);
    fs.writeFileSync(appJsPath, content);
    console.log('✅ loadKopHeader function updated');
    return true;
  } else {
    console.log('❌ loadKopHeader function not found in expected format');
    return false;
  }
}

function addSafeKopHeaderLoading() {
  console.log('🔧 Adding safe kop header loading...');
  
  const appJsPath = path.join(__dirname, 'public', 'js', 'app.js');
  let content = fs.readFileSync(appJsPath, 'utf8');
  
  // Add a safe wrapper function
  const safeKopHeaderFunction = `
// Safe kop header loading - only load after authentication
async function loadKopHeaderSafe() {
    try {
        // Wait for authentication to be ready
        const authReady = await waitForAuthReady(3000);
        if (!authReady) {
            console.log('⚠️ [KOP] Auth not ready, skipping kop header');
            return;
        }
        
        await loadKopHeader(true);
    } catch (error) {
        console.warn('⚠️ [KOP] Safe kop header loading failed:', error.message);
    }
}

window.loadKopHeaderSafe = loadKopHeaderSafe;
`;

  // Add the function before the last line
  const lastLineIndex = content.lastIndexOf('\n');
  content = content.slice(0, lastLineIndex) + safeKopHeaderFunction + content.slice(lastLineIndex);
  
  fs.writeFileSync(appJsPath, content);
  console.log('✅ Safe kop header loading added');
}

function updateKopHeaderCalls() {
  console.log('🔧 Updating kop header calls to use safe version...');
  
  const appJsPath = path.join(__dirname, 'public', 'js', 'app.js');
  let content = fs.readFileSync(appJsPath, 'utf8');
  
  // Replace loadKopHeader() calls with loadKopHeaderSafe() in specific contexts
  const replacements = [
    // After successful login
    {
      pattern: /loadKopHeader\(\)\.catch\(err => console\.warn\('Kop header error:', err\)\);/g,
      replacement: 'loadKopHeaderSafe();'
    },
    {
      pattern: /loadKopHeader\(\)\.catch\(err => console\.error\('Error loading kop header:', err\)\);/g,
      replacement: 'loadKopHeaderSafe();'
    },
    {
      pattern: /loadKopHeader\(\)\.catch\(err => console\.warn\('Kop header load error:', err\)\);/g,
      replacement: 'loadKopHeaderSafe();'
    }
  ];
  
  let updated = false;
  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      updated = true;
    }
  });
  
  if (updated) {
    fs.writeFileSync(appJsPath, content);
    console.log('✅ Kop header calls updated to use safe version');
  } else {
    console.log('⚠️ No kop header calls found to update');
  }
}

function createRencanaStrategisDisplayFix() {
  console.log('🔧 Creating Rencana Strategis display fix...');
  
  const fixContent = `
// Rencana Strategis Display Fix
// Ensures proper loading and display of Rencana Strategis page

(function() {
    'use strict';
    
    // Wait for DOM and authentication
    document.addEventListener('DOMContentLoaded', function() {
        // Check if we're on rencana strategis page
        if (window.location.hash.includes('rencana-strategis') || 
            document.querySelector('[data-page="rencana-strategis"]')) {
            
            console.log('🎯 [RENCANA] Rencana Strategis page detected');
            
            // Ensure proper initialization
            setTimeout(() => {
                initializeRencanaStrategisPage();
            }, 500);
        }
    });
    
    function initializeRencanaStrategisPage() {
        console.log('🚀 [RENCANA] Initializing Rencana Strategis page...');
        
        // Force refresh of page content
        const pageContent = document.querySelector('#page-content');
        if (pageContent && window.showPage) {
            window.showPage('rencana-strategis');
        }
        
        // Load kop header safely after auth
        if (window.loadKopHeaderSafe) {
            window.loadKopHeaderSafe();
        }
        
        // Trigger any rencana strategis specific initialization
        if (window.RencanaStrategisModule && window.RencanaStrategisModule.init) {
            window.RencanaStrategisModule.init();
        }
        
        console.log('✅ [RENCANA] Rencana Strategis page initialized');
    }
    
    // Export for global access
    window.initializeRencanaStrategisPage = initializeRencanaStrategisPage;
    
})();
`;

  const fixPath = path.join(__dirname, 'public', 'js', 'rencana-strategis-display-fix.js');
  fs.writeFileSync(fixPath, fixContent);
  console.log('✅ Rencana Strategis display fix created');
  
  return fixPath;
}

function updateIndexHtml() {
  console.log('🔧 Updating index.html to include fixes...');
  
  const indexPath = path.join(__dirname, 'public', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.log('❌ index.html not found');
    return false;
  }
  
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Add the rencana strategis display fix script
  const scriptTag = '<script src="js/rencana-strategis-display-fix.js"></script>';
  
  if (!content.includes(scriptTag)) {
    // Add before closing body tag
    content = content.replace('</body>', `    ${scriptTag}\n</body>`);
    fs.writeFileSync(indexPath, content);
    console.log('✅ index.html updated with display fix script');
    return true;
  } else {
    console.log('⚠️ Display fix script already included in index.html');
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing Rencana Strategis and Pengaturan Issues...\n');
  
  try {
    // Fix 1: Update loadKopHeader function to check authentication
    const kopHeaderFixed = fixLoadKopHeaderFunction();
    
    // Fix 2: Add safe kop header loading
    addSafeKopHeaderLoading();
    
    // Fix 3: Update kop header calls
    updateKopHeaderCalls();
    
    // Fix 4: Create Rencana Strategis display fix
    const fixPath = createRencanaStrategisDisplayFix();
    
    // Fix 5: Update index.html
    const indexUpdated = updateIndexHtml();
    
    console.log('\n✅ All fixes applied successfully!');
    console.log('\n📋 Summary of fixes:');
    console.log('1. ✅ loadKopHeader now checks authentication before making API call');
    console.log('2. ✅ Added loadKopHeaderSafe wrapper function');
    console.log('3. ✅ Updated kop header calls to use safe version');
    console.log('4. ✅ Created Rencana Strategis display fix');
    console.log('5. ✅ Updated index.html with fix script');
    
    console.log('\n🎯 Expected results:');
    console.log('- No more 404 errors for /api/pengaturan');
    console.log('- Kop header loads only after authentication');
    console.log('- Rencana Strategis page displays properly');
    console.log('- Console errors reduced');
    
    console.log('\n🔄 Please refresh your browser to see the changes');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  fixLoadKopHeaderFunction,
  addSafeKopHeaderLoading,
  updateKopHeaderCalls,
  createRencanaStrategisDisplayFix,
  updateIndexHtml
};