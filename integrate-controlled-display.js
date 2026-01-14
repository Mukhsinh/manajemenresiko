/**
 * INTEGRATE CONTROLLED DISPLAY
 * Script to integrate the controlled display system into the main application
 * Created: December 28, 2025
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Integrating Controlled Display System...');

try {
  // 1. Update index.html to include the new scripts
  const indexPath = path.join(__dirname, 'public', 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Add the new scripts before the closing body tag
  const newScripts = `
    <!-- Rencana Strategis Controlled Display System -->
    <script src="/js/rencana-strategis-display-control.js"></script>
    <script src="/js/rencana-strategis-controlled.js"></script>
    
    <!-- Initialize Controlled Display -->
    <script>
        // Override the default rencana strategis loader
        if (window.loadRencanaStrategis) {
            window.loadRencanaStrategisOriginal = window.loadRencanaStrategis;
        }
        
        window.loadRencanaStrategis = async function() {
            console.log('🎯 Loading Rencana Strategis with Controlled Display...');
            
            try {
                // Use the controlled version
                if (window.RencanaStrategisControlled) {
                    await window.RencanaStrategisControlled.load();
                } else {
                    console.warn('⚠️ Controlled module not available, using fallback');
                    if (window.loadRencanaStrategisOriginal) {
                        await window.loadRencanaStrategisOriginal();
                    }
                }
            } catch (error) {
                console.error('❌ Error loading controlled display:', error);
                // Fallback to original if available
                if (window.loadRencanaStrategisOriginal) {
                    await window.loadRencanaStrategisOriginal();
                }
            }
        };
        
        // Also override the enhanced version if it exists
        if (window.RencanaStrategisModuleEnhanced) {
            window.RencanaStrategisModuleEnhancedOriginal = window.RencanaStrategisModuleEnhanced;
            
            // Replace the load function
            window.RencanaStrategisModuleEnhanced.load = window.loadRencanaStrategis;
        }
        
        console.log('✅ Controlled Display System integrated');
    </script>
    
</body>`;
  
  // Replace the closing body tag
  indexContent = indexContent.replace('</body>', newScripts);
  
  // Write back to file
  fs.writeFileSync(indexPath, indexContent, 'utf8');
  console.log('✅ Updated index.html with controlled display scripts');
  
  // 2. Create a backup of the original rencana-strategis.js
  const originalPath = path.join(__dirname, 'public', 'js', 'rencana-strategis.js');
  const backupPath = path.join(__dirname, 'public', 'js', 'rencana-strategis-original.js');
  
  if (fs.existsSync(originalPath) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(originalPath, backupPath);
    console.log('✅ Created backup of original rencana-strategis.js');
  }
  
  // 3. Create a CSS file for the controlled display
  const cssContent = `
/* RENCANA STRATEGIS CONTROLLED DISPLAY STYLES */
/* Created: December 28, 2025 */

/* Ensure proper page display */
#rencana-strategis {
    min-height: 100vh;
    position: relative;
}

#rencana-strategis-content {
    max-width: 100%;
    overflow-x: hidden;
}

/* Statistics cards enhancement */
.statistics-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
}

.statistics-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
}

/* Prevent content overflow */
.table-responsive {
    max-height: 70vh;
    overflow-y: auto;
    border-radius: 8px;
}

/* Smooth scrolling for navigation */
html {
    scroll-behavior: smooth;
}

/* Loading states */
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

/* Action buttons styling */
.btn-group .btn {
    border-radius: 6px !important;
    margin: 0 2px;
}

/* Card hover effects */
.card {
    transition: all 0.3s ease;
}

.card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .statistics-card {
        margin-bottom: 1rem;
    }
    
    .table-responsive {
        max-height: 50vh;
    }
    
    .btn-group {
        flex-direction: column;
    }
    
    .btn-group .btn {
        margin: 2px 0;
        width: 100%;
    }
}

/* Animation for content loading */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.fade-in-up {
    animation: fadeInUp 0.6s ease-out;
}

/* Ensure proper positioning */
.page-content {
    position: relative;
    z-index: 1;
}

.page-content.active {
    display: block !important;
}

/* Statistics cards grid */
.statistics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

/* Table enhancements */
.table th {
    font-weight: 600;
    color: #495057;
    border-bottom: 2px solid #dee2e6;
}

.table td {
    vertical-align: middle;
}

/* Badge styling */
.badge {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
}

/* Empty state styling */
.empty-state {
    padding: 3rem 1rem;
    text-align: center;
}

.empty-state i {
    opacity: 0.5;
}

/* Form styling */
.form-label {
    font-weight: 500;
    color: #495057;
    margin-bottom: 0.5rem;
}

.form-control:focus,
.form-select:focus {
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* Button enhancements */
.btn {
    font-weight: 500;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.btn:hover {
    transform: translateY(-1px);
}

/* Chip/Tag styling */
.chip {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    margin: 0.125rem;
    background-color: #e9ecef;
    border: 1px solid #ced4da;
    border-radius: 1rem;
    font-size: 0.875rem;
}

.chip .btn-close {
    font-size: 0.7rem;
    margin-left: 0.5rem;
}
`;
  
  const cssPath = path.join(__dirname, 'public', 'css', 'rencana-strategis-controlled.css');
  fs.writeFileSync(cssPath, cssContent, 'utf8');
  console.log('✅ Created controlled display CSS file');
  
  // 4. Update the CSS link in index.html
  indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Add the new CSS link
  const cssLink = '    <link rel="stylesheet" href="/css/rencana-strategis-controlled.css">';
  
  if (!indexContent.includes('rencana-strategis-controlled.css')) {
    indexContent = indexContent.replace(
      '<link rel="stylesheet" href="/css/rencana-strategis-display-fix.css">',
      '<link rel="stylesheet" href="/css/rencana-strategis-display-fix.css">\n' + cssLink
    );
    
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log('✅ Added controlled display CSS link to index.html');
  }
  
  // 5. Create a verification script
  const verificationScript = `
/**
 * VERIFY CONTROLLED DISPLAY INTEGRATION
 * Script to verify the controlled display system is working correctly
 */

console.log('🔍 Verifying Controlled Display Integration...');

// Check if all required components are loaded
const checks = {
    displayControl: !!window.RencanaStrategisDisplayControl,
    controlledModule: !!window.RencanaStrategisControlled,
    pageExists: !!document.getElementById('rencana-strategis'),
    containerExists: !!document.getElementById('rencana-strategis-content'),
    cssLoaded: !!document.querySelector('link[href*="rencana-strategis-controlled.css"]')
};

console.log('Integration Status:');
Object.entries(checks).forEach(([key, value]) => {
    console.log(\`  \${key}: \${value ? '✅' : '❌'}\`);
});

const allPassed = Object.values(checks).every(check => check);
console.log(\`Overall Status: \${allPassed ? '✅ PASSED' : '❌ FAILED'}\`);

if (allPassed) {
    console.log('🎉 Controlled Display System is ready!');
} else {
    console.warn('⚠️ Some components are missing. Please check the integration.');
}
`;
  
  const verificationPath = path.join(__dirname, 'public', 'js', 'verify-controlled-display.js');
  fs.writeFileSync(verificationPath, verificationScript, 'utf8');
  console.log('✅ Created verification script');
  
  console.log('\n🎉 Controlled Display System Integration Complete!');
  console.log('\nNext steps:');
  console.log('1. Test the integration by visiting: /test-rencana-strategis-controlled-display.html');
  console.log('2. Check the main application Rencana Strategis page');
  console.log('3. Verify that the page displays statistics correctly and stops at the intended position');
  console.log('4. Run the verification script in browser console: /js/verify-controlled-display.js');
  
} catch (error) {
  console.error('❌ Integration failed:', error);
  process.exit(1);
}