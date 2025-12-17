/**
 * Property-based test runner
 * Runs all property tests and generates reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const TEST_RESULTS_DIR = 'test-results';
const COVERAGE_DIR = 'coverage';

// Ensure directories exist
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

console.log('🧪 Starting Property-Based Test Suite...\n');

// Test suites to run
const testSuites = [
  {
    name: 'Data Display Functionality',
    file: 'tests/property/data-display.test.js',
    description: 'Tests Requirements 11.1, 11.2, 11.3, 11.5'
  },
  {
    name: 'Button Functionality',
    file: 'tests/property/button-functionality.test.js',
    description: 'Tests Requirements 12.1, 12.2, 12.3, 12.4, 12.5'
  },
  {
    name: 'Data Synchronization',
    file: 'tests/property/data-synchronization.test.js',
    description: 'Tests Requirements 13.1, 13.2, 13.3, 13.4, 13.5'
  }
];

let allTestsPassed = true;
const results = [];

// Run each test suite
for (const suite of testSuites) {
  console.log(`\n📋 Running: ${suite.name}`);
  console.log(`📄 ${suite.description}`);
  console.log(`📁 File: ${suite.file}\n`);
  
  try {
    const startTime = Date.now();
    
    // Run the test
    execSync(`npx jest ${suite.file} --verbose --json --outputFile=${TEST_RESULTS_DIR}/${suite.name.toLowerCase().replace(/\s+/g, '-')}.json`, {
      stdio: 'inherit',
      timeout: 60000
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ ${suite.name} - PASSED (${duration}ms)\n`);
    
    results.push({
      name: suite.name,
      status: 'PASSED',
      duration: duration,
      file: suite.file
    });
    
  } catch (error) {
    console.log(`❌ ${suite.name} - FAILED\n`);
    console.error(`Error: ${error.message}\n`);
    
    allTestsPassed = false;
    results.push({
      name: suite.name,
      status: 'FAILED',
      error: error.message,
      file: suite.file
    });
  }
}

// Generate summary report
console.log('\n📊 Test Results Summary');
console.log('========================\n');

results.forEach(result => {
  const status = result.status === 'PASSED' ? '✅' : '❌';
  const duration = result.duration ? ` (${result.duration}ms)` : '';
  console.log(`${status} ${result.name}${duration}`);
  
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
});

const passedCount = results.filter(r => r.status === 'PASSED').length;
const totalCount = results.length;

console.log(`\n📈 Results: ${passedCount}/${totalCount} test suites passed`);

// Generate JSON report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total: totalCount,
    passed: passedCount,
    failed: totalCount - passedCount,
    success: allTestsPassed
  },
  results: results
};

fs.writeFileSync(
  path.join(TEST_RESULTS_DIR, 'property-tests-report.json'),
  JSON.stringify(report, null, 2)
);

console.log(`\n📄 Detailed report saved to: ${TEST_RESULTS_DIR}/property-tests-report.json`);

// Exit with appropriate code
if (allTestsPassed) {
  console.log('\n🎉 All property-based tests passed!');
  process.exit(0);
} else {
  console.log('\n💥 Some property-based tests failed!');
  process.exit(1);
}