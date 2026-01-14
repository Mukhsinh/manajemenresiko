// Script untuk mengintegrasikan Sasaran Strategi Edit Fix v2 ke aplikasi
const fs = require('fs');
const path = require('path');

console.log('=== INTEGRATING SASARAN STRATEGI EDIT FIX V2 ===\n');

// Files yang perlu diupdate
const filesToUpdate = [
  'public/sasaran-strategi-enhanced-final.html',
  'public/test-sasaran-strategi-enhanced.html',
  'public/test-sasaran-strategi-final.html'
];

const fixScriptTag = '<script src="/js/sasaran-strategi-edit-fix-v2.js"></script>';

let updatedCount = 0;
let notFoundCount = 0;

filesToUpdate.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      notFoundCount++;
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if fix already integrated
    if (content.includes('sasaran-strategi-edit-fix-v2.js')) {
      console.log(`✓ Already integrated: ${filePath}`);
      return;
    }

    // Find the sasaran-strategi.js script tag
    const sasaranScriptRegex = /<script src="\/js\/sasaran-strategi\.js"><\/script>/;
    
    if (sasaranScriptRegex.test(content)) {
      // Add fix script right after main module
      content = content.replace(
        sasaranScriptRegex,
        `<script src="/js/sasaran-strategi.js"></script>\n  ${fixScriptTag}`
      );
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      updatedCount++;
    } else {
      console.log(`⚠️  Could not find sasaran-strategi.js script tag in: ${filePath}`);
      notFoundCount++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n=== INTEGRATION SUMMARY ===');
console.log(`✅ Files updated: ${updatedCount}`);
console.log(`⚠️  Files not found/skipped: ${notFoundCount}`);

// Create a backup of original sasaran-strategi.js
try {
  const originalFile = 'public/js/sasaran-strategi.js';
  const backupFile = 'public/js/sasaran-strategi.js.backup';
  
  if (fs.existsSync(originalFile) && !fs.existsSync(backupFile)) {
    fs.copyFileSync(originalFile, backupFile);
    console.log('\n✅ Backup created: public/js/sasaran-strategi.js.backup');
  }
} catch (error) {
  console.error('⚠️  Could not create backup:', error.message);
}

console.log('\n=== NEXT STEPS ===');
console.log('1. Test the fix: http://localhost:3001/test-sasaran-edit-fix-v2.html');
console.log('2. Verify in main app: http://localhost:3001/sasaran-strategi-enhanced-final.html');
console.log('3. Check console for any errors');
console.log('4. Test edit functionality:');
console.log('   - Click Edit button');
console.log('   - Verify form appears only once');
console.log('   - Click X or Batal button');
console.log('   - Verify form closes immediately');
console.log('\n✨ Integration complete!');
