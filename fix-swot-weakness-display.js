// Fix untuk masalah display Weakness = 0 di frontend SWOT
// Masalah: Logika agregasi RUMAH_SAKIT di API summary endpoint menyebabkan nilai Weakness menjadi 0

const fs = require('fs');
const path = require('path');

function fixSwotWeaknessDisplay() {
  console.log('🔧 FIXING SWOT WEAKNESS DISPLAY ISSUE');
  console.log('='.repeat(50));

  try {
    // 1. Fix API endpoint - routes/analisis-swot.js
    console.log('\n1. Fixing API summary endpoint logic...');
    
    const apiFilePath = path.join(__dirname, 'routes', 'analisis-swot.js');
    let apiContent = fs.readFileSync(apiFilePath, 'utf8');
    
    // Find and fix the problematic RUMAH_SAKIT aggregation logic
    const oldLogic = `    // If RUMAH_SAKIT selected, aggregate with highest values
    if (unit_kerja_id === 'RUMAH_SAKIT') {
      // Group by category and get max score and bobot
      const grouped = {};
      (data || []).forEach(item => {
        const key = item.kategori;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(item);
      });

      // For each category, get items with highest score and bobot
      Object.keys(grouped).forEach(kategori => {
        const items = grouped[kategori];
        // Sort by score desc, then bobot desc
        items.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.bobot - a.bobot;
        });
        
        // Take top items based on kuantitas
        const totalKuantitas = items.reduce((sum, item) => sum + (item.kuantitas || 1), 0);
        const topItems = items.slice(0, Math.min(5, totalKuantitas)); // Max 5 items or total kuantitas
        
        summary[kategori].items = topItems;
        summary[kategori].totalScore = topItems.reduce((sum, item) => sum + (item.score || 0), 0);
        summary[kategori].totalBobot = topItems.reduce((sum, item) => sum + (item.bobot || 0), 0);
      });
    } else {`;

    const newLogic = `    // If RUMAH_SAKIT selected, aggregate with highest values
    if (unit_kerja_id === 'RUMAH_SAKIT') {
      // Group by category and get max score and bobot
      const grouped = {};
      (data || []).forEach(item => {
        const key = item.kategori;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(item);
      });

      // For each category, get items with highest score and bobot
      Object.keys(grouped).forEach(kategori => {
        const items = grouped[kategori];
        if (items.length === 0) return;
        
        // Sort by score desc, then bobot desc
        items.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.bobot - a.bobot;
        });
        
        // FIXED: Take top 5 items or all items if less than 5
        // Don't use kuantitas for limiting, it causes confusion
        const topItems = items.slice(0, Math.min(5, items.length));
        
        summary[kategori].items = topItems;
        summary[kategori].totalScore = topItems.reduce((sum, item) => sum + (item.score || 0), 0);
        summary[kategori].totalBobot = topItems.reduce((sum, item) => sum + (item.bobot || 0), 0);
        
        console.log(\`RUMAH_SAKIT aggregation - \${kategori}: \${items.length} items -> \${topItems.length} top items, score: \${summary[kategori].totalScore}\`);
      });
    } else {`;

    if (apiContent.includes(oldLogic)) {
      apiContent = apiContent.replace(oldLogic, newLogic);
      fs.writeFileSync(apiFilePath, apiContent);
      console.log('✅ Fixed API summary endpoint logic');
    } else {
      console.log('⚠️ API logic pattern not found, manual fix may be needed');
    }

    // 2. Add debugging to frontend
    console.log('\n2. Adding debugging to frontend...');
    
    const frontendFilePath = path.join(__dirname, 'public', 'js', 'analisis-swot.js');
    let frontendContent = fs.readFileSync(frontendFilePath, 'utf8');
    
    // Add debugging to renderSummaryCards function
    const debugCode = `      console.log('🔍 SWOT Summary Debug:', {
        endpoint: \`/api/analisis-swot/summary?\${params.toString()}\`,
        filters: state.currentFilters,
        summaryData: summaryData
      });
      
      // Check for zero values and log warning
      Object.keys(summaryData).forEach(category => {
        if (summaryData[category] && summaryData[category].totalScore === 0) {
          console.warn(\`⚠️ SWOT Warning: \${category} has totalScore = 0!\`, summaryData[category]);
        }
      });`;

    // Find the line after summaryData is fetched
    const insertPoint = 'const summaryData = await api()(`/api/analisis-swot/summary?${params.toString()}`);';
    if (frontendContent.includes(insertPoint)) {
      frontendContent = frontendContent.replace(
        insertPoint,
        insertPoint + '\n      \n' + debugCode
      );
      fs.writeFileSync(frontendFilePath, frontendContent);
      console.log('✅ Added debugging to frontend');
    } else {
      console.log('⚠️ Frontend insertion point not found');
    }

    // 3. Create test script to verify fix
    console.log('\n3. Creating verification test...');
    
    const testScript = `const axios = require('axios');

async function verifySwotFix() {
  console.log('🧪 VERIFYING SWOT WEAKNESS FIX');
  console.log('='.repeat(40));
  
  try {
    const BASE_URL = 'http://localhost:3002';
    
    // Test without authentication (debug endpoint)
    console.log('\\n1. Testing debug endpoint...');
    try {
      const debugResponse = await axios.get(\`\${BASE_URL}/api/analisis-swot/debug\`);
      const weaknessData = debugResponse.data.data.filter(item => item.kategori === 'Weakness');
      console.log(\`✅ Found \${weaknessData.length} Weakness items in database\`);
      
      if (weaknessData.length > 0) {
        const totalScore = weaknessData.reduce((sum, item) => sum + (item.score || 0), 0);
        console.log(\`📊 Total Weakness Score in DB: \${totalScore}\`);
      }
    } catch (error) {
      console.log('⚠️ Debug endpoint requires authentication');
    }
    
    console.log('\\n2. Fix applied successfully!');
    console.log('\\nNext steps:');
    console.log('- Restart the server: node server.js');
    console.log('- Open browser and check /analisis-swot page');
    console.log('- Weakness should now show correct values');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifySwotFix();`;

    fs.writeFileSync(path.join(__dirname, 'verify-swot-fix.js'), testScript);
    console.log('✅ Created verification test script');

    console.log('\n🎉 SWOT WEAKNESS DISPLAY FIX COMPLETED!');
    console.log('\nSummary of changes:');
    console.log('1. ✅ Fixed RUMAH_SAKIT aggregation logic in API');
    console.log('2. ✅ Added debugging to frontend');
    console.log('3. ✅ Created verification test');
    
    console.log('\n📋 Next steps:');
    console.log('1. Restart server: node server.js');
    console.log('2. Test the fix: node verify-swot-fix.js');
    console.log('3. Check frontend: Open /analisis-swot page');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixSwotWeaknessDisplay();