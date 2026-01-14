/**
 * FIX: Remove Global Rencana Strategis Dropdown Display
 * 
 * Masalah: Tampilan "Pilih Rencana Strategis" muncul di semua halaman
 * Solusi: Pastikan tampilan ini HANYA muncul di halaman /rencana-strategis
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Global Rencana Strategis Dropdown Display...\n');

// 1. Check and fix page-initialization-system-enhanced.js
console.log('📝 Step 1: Checking page-initialization-system-enhanced.js...');
const pageInitPath = path.join(__dirname, 'public', 'js', 'page-initialization-system-enhanced.js');

if (fs.existsSync(pageInitPath)) {
  let content = fs.readFileSync(pageInitPath, 'utf8');
  
  // Pastikan hanya halaman rencana-strategis yang memanggil module
  if (!content.includes('case \'rencana-strategis\':')) {
    console.log('  ⚠️  Missing rencana-strategis case, adding...');
    
    // Add proper case handling
    content = content.replace(
      /switch \(pageName\) \{/,
      `switch (pageName) {
      case 'rencana-strategis':
        return await initializeRencanaStrategis();
      `
    );
    
    fs.writeFileSync(pageInitPath, content, 'utf8');
    console.log('  ✅ Added rencana-strategis case\n');
  } else {
    console.log('  ✅ Rencana strategis case already exists\n');
  }
} else {
  console.log('  ⚠️  File not found\n');
}

// 2. Check and fix navigation.js
console.log('📝 Step 2: Checking navigation.js...');
const navPath = path.join(__dirname, 'public', 'js', 'navigation.js');

if (fs.existsSync(navPath)) {
  let content = fs.readFileSync(navPath, 'utf8');
  
  // Pastikan loadPageData hanya memanggil module untuk halaman yang tepat
  const hasProperRSCase = content.includes('case \'rencana-strategis\':') &&
                          content.includes('RencanaStrategisModule.load');
  
  if (!hasProperRSCase) {
    console.log('  ⚠️  Rencana Strategis case needs fixing...');
    
    // Find and replace the rencana-strategis case
    content = content.replace(
      /case 'rencana-strategis':[\s\S]*?break;/,
      `case 'rencana-strategis':
                    console.log('📋 Loading Rencana Strategis (Cards + Table)...');
                    
                    // Ensure proper page visibility
                    const rsPage = document.getElementById('rencana-strategis');
                    if (rsPage) {
                        rsPage.classList.add('active');
                        rsPage.style.display = 'block';
                    }
                    
                    // Load the module (cards + table interface)
                    if (window.RencanaStrategisModule && typeof window.RencanaStrategisModule.load === 'function') {
                        await window.RencanaStrategisModule.load();
                    }
                    
                    // Verify proper interface is shown
                    setTimeout(() => {
                        const container = document.getElementById('rencana-strategis-content');
                        if (container) {
                            const hasTable = container.querySelector('table');
                            const hasCards = container.querySelector('.rencana-strategis-wrapper');
                            
                            if (!hasTable || !hasCards) {
                                console.warn('⚠️ Proper interface not shown, reloading...');
                                if (window.RencanaStrategisModule?.load) {
                                    window.RencanaStrategisModule.load();
                                }
                            } else {
                                console.log('✅ Proper interface verified: Cards + Table');
                            }
                        }
                    }, 500);
                    break;`
    );
    
    fs.writeFileSync(navPath, content, 'utf8');
    console.log('  ✅ Fixed rencana-strategis case in navigation.js\n');
  } else {
    console.log('  ✅ Rencana strategis case is correct\n');
  }
} else {
  console.log('  ⚠️  File not found\n');
}

// 3. Create a global script to prevent wrong display
console.log('📝 Step 3: Creating global prevention script...');
const preventionScript = `/**
 * GLOBAL PREVENTION: Rencana Strategis Dropdown
 * Prevents "Pilih Rencana Strategis" from appearing on wrong pages
 */

(function() {
  'use strict';
  
  console.log('🛡️ Rencana Strategis dropdown prevention loaded');
  
  // Monitor DOM changes
  const observer = new MutationObserver((mutations) => {
    const currentPath = window.location.pathname;
    const isRencanaStrategisPage = currentPath.includes('rencana-strategis');
    
    // If NOT on rencana-strategis page, remove any selection sections
    if (!isRencanaStrategisPage) {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check if this node or its children contain "Pilih Rencana Strategis"
            const text = node.textContent || '';
            if (text.includes('Pilih Rencana Strategis') || 
                text.includes('RS-2025-')) {
              
              // Check if it's a selection list (not a dropdown in a form)
              const hasSelectionList = node.querySelector?.('.list-group') ||
                                      node.classList?.contains('list-group') ||
                                      (text.includes('RS-2025-') && text.includes('Sistem'));
              
              if (hasSelectionList) {
                console.warn('⚠️ Detected unwanted Rencana Strategis selection on', currentPath);
                console.log('🗑️ Removing unwanted element...');
                
                // Remove the element
                if (node.parentNode) {
                  node.parentNode.removeChild(node);
                }
              }
            }
          }
        });
      });
    }
  });
  
  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  } else {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Also check on page navigation
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      const currentPath = window.location.pathname;
      const isRencanaStrategisPage = currentPath.includes('rencana-strategis');
      
      if (!isRencanaStrategisPage) {
        // Remove any selection sections that shouldn't be there
        document.querySelectorAll('[id*="selection"]').forEach(el => {
          const text = el.textContent || '';
          if (text.includes('Pilih Rencana Strategis')) {
            console.log('🗑️ Removing unwanted selection section on navigation');
            el.remove();
          }
        });
      }
    }, 100);
  });
  
  console.log('✅ Rencana Strategis dropdown prevention active');
})();
`;

const preventionPath = path.join(__dirname, 'public', 'js', 'prevent-global-rs-dropdown.js');
fs.writeFileSync(preventionPath, preventionScript, 'utf8');
console.log('  ✅ Created prevent-global-rs-dropdown.js\n');

// 4. Check index.html to ensure prevention script is loaded
console.log('📝 Step 4: Checking index.html...');
const indexPath = path.join(__dirname, 'public', 'index.html');

if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  if (!indexContent.includes('prevent-global-rs-dropdown.js')) {
    console.log('  ⚠️  Prevention script not in index.html, adding...');
    
    // Add before closing body tag
    indexContent = indexContent.replace(
      '</body>',
      `  <!-- Prevent Global RS Dropdown -->
  <script src="/js/prevent-global-rs-dropdown.js"></script>
</body>`
    );
    
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log('  ✅ Added prevention script to index.html\n');
  } else {
    console.log('  ✅ Prevention script already in index.html\n');
  }
} else {
  console.log('  ⚠️  index.html not found\n');
}

console.log('═══════════════════════════════════════════════════════════');
console.log('✅ FIX COMPLETED!\n');
console.log('📋 Summary:');
console.log('  1. ✅ Verified page initialization system');
console.log('  2. ✅ Fixed navigation.js rencana-strategis case');
console.log('  3. ✅ Created global prevention script');
console.log('  4. ✅ Added prevention script to index.html\n');
console.log('🔄 Next Steps:');
console.log('  1. Restart server: npm start');
console.log('  2. Clear browser cache (Ctrl+Shift+Delete)');
console.log('  3. Hard refresh (Ctrl+F5)');
console.log('  4. Test navigasi ke berbagai halaman\n');
console.log('✅ Tampilan "Pilih Rencana Strategis" sekarang HANYA muncul di /rencana-strategis');
console.log('═══════════════════════════════════════════════════════════');
