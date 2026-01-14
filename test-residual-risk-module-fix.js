// Test script to verify Residual Risk Module fix
const fs = require('fs');
const path = require('path');

console.log('=== RESIDUAL RISK MODULE FIX VERIFICATION ===\n');

// Check if the file exists and can be read
const filePath = path.join(__dirname, 'public', 'js', 'residual-risk.js');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log('✅ File exists and is readable');
  console.log(`📄 File size: ${content.length} characters`);
  console.log(`📝 Lines: ${content.split('\n').length}`);
  
  // Check for syntax issues
  const issues = [];
  
  // Check for duplicate code blocks
  if (content.match(/]\],\s*range zones/i)) {
    issues.push('❌ Found malformed duplicate "range zones" text - this should have been removed');
  } else {
    console.log('✅ No malformed duplicate code found');
  }
  
  // Check for proper module structure
  if (content.includes('const ResidualRiskModule = (() => {')) {
    console.log('✅ Module structure is correct');
  } else {
    issues.push('❌ Module structure is incorrect');
  }
  
  // Check for proper exports
  if (content.includes('window.ResidualRiskModule = ResidualRiskModule')) {
    console.log('✅ Module is properly exported to window');
  } else {
    issues.push('❌ Module export is missing');
  }
  
  // Check for load function
  if (content.includes('async function load()')) {
    console.log('✅ Load function exists');
  } else {
    issues.push('❌ Load function is missing');
  }
  
  // Check for render function
  if (content.includes('function render()')) {
    console.log('✅ Render function exists');
  } else {
    issues.push('❌ Render function is missing');
  }
  
  // Check for chart rendering functions
  if (content.includes('function renderResidualMatrix()')) {
    console.log('✅ Matrix rendering function exists');
  } else {
    issues.push('❌ Matrix rendering function is missing');
  }
  
  if (content.includes('function renderComparisonChart()')) {
    console.log('✅ Comparison chart function exists');
  } else {
    issues.push('❌ Comparison chart function is missing');
  }
  
  // Summary
  console.log('\n=== VERIFICATION SUMMARY ===');
  if (issues.length === 0) {
    console.log('✅ ALL CHECKS PASSED - Module should load correctly now!');
    console.log('\n📋 Next steps:');
    console.log('1. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('2. Refresh the Residual Risk page');
    console.log('3. Check browser console for any remaining errors');
  } else {
    console.log('❌ ISSUES FOUND:');
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  
} catch (error) {
  console.error('❌ Error reading file:', error.message);
}
