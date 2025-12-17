// Comprehensive test untuk semua aspek laporan
const fs = require('fs');
const path = require('path');

async function testLaporanComprehensive() {
  console.log('🚀 Comprehensive Laporan Test\n');
  
  const results = {
    backend: {},
    frontend: {},
    downloads: {},
    issues: []
  };

  // Test 1: Backend Endpoints
  console.log('📊 Testing Backend Endpoints...');
  
  const endpoints = [
    { name: 'Risk Register Debug', url: '/api/reports/risk-register-debug', auth: false },
    { name: 'Risk Profile Debug', url: '/api/reports/risk-profile-debug', auth: false },
    { name: 'Residual Risk Simple', url: '/api/reports/residual-risk-simple', auth: false },
    { name: 'Test Excel Download', url: '/api/reports/test-excel-download', auth: false }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint.url}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        // Handle Excel download endpoint (binary response)
        if (endpoint.name === 'Test Excel Download') {
          const blob = await response.blob();
          results.backend[endpoint.name] = { 
            status: 'OK', 
            size: blob.size,
            contentType: contentType,
            type: 'binary'
          };
          console.log(`  ✅ ${endpoint.name}: ${blob.size} bytes (${contentType})`);
        } else {
          // Handle JSON response
          const data = await response.json();
          const count = Array.isArray(data) ? data.length : 
                       (data.fullData ? data.fullData.length : 'object');
          results.backend[endpoint.name] = { status: 'OK', count };
          console.log(`  ✅ ${endpoint.name}: ${count} records`);
        }
      } else {
        results.backend[endpoint.name] = { status: 'ERROR', code: response.status };
        console.log(`  ❌ ${endpoint.name}: ${response.status}`);
        results.issues.push(`Backend endpoint ${endpoint.name} failed: ${response.status}`);
      }
    } catch (error) {
      results.backend[endpoint.name] = { status: 'ERROR', error: error.message };
      console.log(`  ❌ ${endpoint.name}: ${error.message}`);
      results.issues.push(`Backend endpoint ${endpoint.name} error: ${error.message}`);
    }
  }

  // Test 2: Frontend Files
  console.log('\n📱 Testing Frontend Files...');
  
  const frontendFiles = [
    { name: 'laporan.js', path: 'public/js/laporan.js' },
    { name: 'index.html', path: 'public/index.html' },
    { name: 'test-laporan-download.html', path: 'public/test-laporan-download.html' }
  ];

  for (const file of frontendFiles) {
    try {
      if (fs.existsSync(file.path)) {
        const content = fs.readFileSync(file.path, 'utf8');
        results.frontend[file.name] = { 
          status: 'OK', 
          size: content.length,
          exists: true
        };
        console.log(`  ✅ ${file.name}: ${content.length} characters`);
        
        // Check for key functions in laporan.js
        if (file.name === 'laporan.js') {
          const functions = ['downloadExcel', 'downloadPDF', 'showPreview', 'updateFilter'];
          const missing = functions.filter(func => !content.includes(func));
          if (missing.length > 0) {
            results.issues.push(`laporan.js missing functions: ${missing.join(', ')}`);
          }
        }
        
        // Check for laporan elements in index.html
        if (file.name === 'index.html') {
          const elements = ['data-page="laporan"', 'id="laporan"', 'laporan.js'];
          const missing = elements.filter(elem => !content.includes(elem));
          if (missing.length > 0) {
            results.issues.push(`index.html missing elements: ${missing.join(', ')}`);
          }
        }
      } else {
        results.frontend[file.name] = { status: 'MISSING', exists: false };
        console.log(`  ❌ ${file.name}: File not found`);
        results.issues.push(`Frontend file ${file.name} not found`);
      }
    } catch (error) {
      results.frontend[file.name] = { status: 'ERROR', error: error.message };
      console.log(`  ❌ ${file.name}: ${error.message}`);
      results.issues.push(`Frontend file ${file.name} error: ${error.message}`);
    }
  }

  // Test 3: Download Functionality
  console.log('\n📥 Testing Download Functionality...');
  
  try {
    // Test Excel download endpoint
    const excelResponse = await fetch('http://localhost:3000/api/reports/test-excel-download');
    
    if (excelResponse.ok) {
      const blob = await excelResponse.blob();
      const contentType = excelResponse.headers.get('content-type');
      
      results.downloads.excel = {
        status: 'OK',
        size: blob.size,
        contentType: contentType,
        isExcel: contentType && contentType.includes('spreadsheet')
      };
      
      console.log(`  ✅ Excel Download: ${blob.size} bytes, ${contentType}`);
      
      if (!contentType || !contentType.includes('spreadsheet')) {
        results.issues.push('Excel download has incorrect content type');
      }
    } else {
      results.downloads.excel = { status: 'ERROR', code: excelResponse.status };
      console.log(`  ❌ Excel Download: ${excelResponse.status}`);
      results.issues.push(`Excel download failed: ${excelResponse.status}`);
    }
  } catch (error) {
    results.downloads.excel = { status: 'ERROR', error: error.message };
    console.log(`  ❌ Excel Download: ${error.message}`);
    results.issues.push(`Excel download error: ${error.message}`);
  }

  // Test 4: Dependencies
  console.log('\n📦 Testing Dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['xlsx', 'puppeteer', 'express', '@supabase/supabase-js'];
    
    results.dependencies = {};
    
    for (const dep of requiredDeps) {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        results.dependencies[dep] = { 
          status: 'OK', 
          version: packageJson.dependencies[dep] 
        };
        console.log(`  ✅ ${dep}: ${packageJson.dependencies[dep]}`);
      } else {
        results.dependencies[dep] = { status: 'MISSING' };
        console.log(`  ❌ ${dep}: Missing`);
        results.issues.push(`Required dependency ${dep} is missing`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Dependencies check failed: ${error.message}`);
    results.issues.push(`Dependencies check failed: ${error.message}`);
  }

  // Test 5: Routes Registration
  console.log('\n🛣️  Testing Routes Registration...');
  
  try {
    const serverJs = fs.readFileSync('server.js', 'utf8');
    const reportsRouteRegistered = serverJs.includes("app.use('/api/reports'");
    
    if (reportsRouteRegistered) {
      results.routes = { status: 'OK', registered: true };
      console.log('  ✅ Reports routes registered in server.js');
    } else {
      results.routes = { status: 'ERROR', registered: false };
      console.log('  ❌ Reports routes not registered in server.js');
      results.issues.push('Reports routes not registered in server.js');
    }
  } catch (error) {
    results.routes = { status: 'ERROR', error: error.message };
    console.log(`  ❌ Routes check failed: ${error.message}`);
    results.issues.push(`Routes check failed: ${error.message}`);
  }

  // Generate Summary
  console.log('\n📋 Test Summary:');
  console.log('================');
  
  const totalTests = Object.keys(results.backend).length + 
                    Object.keys(results.frontend).length + 
                    Object.keys(results.downloads).length + 
                    Object.keys(results.dependencies || {}).length + 1;
  
  const passedTests = Object.values(results.backend).filter(r => r.status === 'OK').length +
                     Object.values(results.frontend).filter(r => r.status === 'OK').length +
                     Object.values(results.downloads).filter(r => r.status === 'OK').length +
                     Object.values(results.dependencies || {}).filter(r => r.status === 'OK').length +
                     (results.routes?.status === 'OK' ? 1 : 0);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (results.issues.length > 0) {
    console.log('\n⚠️  Issues Found:');
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  } else {
    console.log('\n✅ No issues found!');
  }

  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (results.issues.length === 0) {
    console.log('✅ Laporan functionality is working perfectly!');
    console.log('✅ All download features are ready to use');
    console.log('✅ Frontend and backend are properly integrated');
  } else {
    console.log('🔧 Fix the issues listed above to ensure full functionality');
    
    if (results.issues.some(i => i.includes('auth'))) {
      console.log('🔐 Consider implementing proper authentication flow');
    }
    
    if (results.issues.some(i => i.includes('PDF'))) {
      console.log('📄 Implement remaining PDF export functionality');
    }
  }

  // Save results to file
  const reportFile = `laporan-test-report-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: ${reportFile}`);

  return results;
}

// Run the test
testLaporanComprehensive().catch(console.error);