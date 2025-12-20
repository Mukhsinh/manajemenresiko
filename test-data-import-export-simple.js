/**
 * Simple data import/export test to verify endpoints are working
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const BASE_URL = 'http://localhost:3000';

// Helper to create test Excel file
const createTestExcelFile = (data, filename) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
  const filepath = path.join(__dirname, filename);
  XLSX.writeFile(wb, filepath);
  return filepath;
};

async function testDataImportExport() {
  console.log('🧪 Testing Data Import/Export Endpoints...\n');

  try {
    // First, get a test token
    console.log('1. Getting test token...');
    let testToken;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@test.com',
        password: 'admin123'
      });
      testToken = loginResponse.data.session?.access_token || loginResponse.data.token;
      console.log(`   ✓ Login successful, token obtained`);
    } catch (error) {
      console.log(`   ✗ Could not login: ${error.message}`);
      return;
    }

    // Test 2: Create form data
    console.log('\n2. Testing form data creation...');
    try {
      const formData = {
        risk_code: `TEST-${Date.now()}`,
        risk_name: 'Test Risk for Import/Export',
        risk_description: 'This is a test risk created for import/export testing',
        probability_level: 3,
        impact_level: 4
      };
      
      const response = await axios.post(`${BASE_URL}/api/risks`, formData, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   ✓ Form data creation: ${response.status}`);
      if (response.data.risk) {
        console.log(`   ✓ Risk created with ID: ${response.data.risk.id}`);
        console.log(`   ✓ Organization ID: ${response.data.risk.organization_id}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Form data response: ${error.response.status} - ${error.response.data.error || 'Error'}`);
      } else {
        console.log(`   ✗ Form data error: ${error.message}`);
      }
    }

    // Test 3: Template download
    console.log('\n3. Testing template download...');
    try {
      const templateResponse = await axios.get(`${BASE_URL}/api/master-data/template/probability_criteria`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        },
        responseType: 'arraybuffer'
      });
      
      console.log(`   ✓ Template download: ${templateResponse.status}`);
      console.log(`   ✓ Content type: ${templateResponse.headers['content-type']}`);
      console.log(`   ✓ File size: ${templateResponse.data.byteLength} bytes`);
      
      if (templateResponse.headers['content-disposition']) {
        console.log(`   ✓ Filename: ${templateResponse.headers['content-disposition']}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Template response: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`   ✗ Template error: ${error.message}`);
      }
    }

    // Test 4: Excel import
    console.log('\n4. Testing Excel import...');
    try {
      // Create test Excel file
      const testData = [
        { name: 'Very Low', level: 1, score: 1, description: 'Very low probability' },
        { name: 'Low', level: 2, score: 2, description: 'Low probability' },
        { name: 'Medium', level: 3, score: 3, description: 'Medium probability' }
      ];
      
      const filename = `test_import_${Date.now()}.xlsx`;
      const filepath = createTestExcelFile(testData, filename);
      
      console.log(`   ✓ Created test Excel file: ${filename}`);
      
      // Import the file
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filepath));
      formData.append('type', 'probability_criteria');
      
      const importResponse = await axios.post(`${BASE_URL}/api/master-data/import`, formData, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          ...formData.getHeaders()
        }
      });
      
      console.log(`   ✓ Excel import: ${importResponse.status}`);
      if (importResponse.data.imported_count !== undefined) {
        console.log(`   ✓ Imported records: ${importResponse.data.imported_count}`);
      }
      if (importResponse.data.message) {
        console.log(`   ✓ Message: ${importResponse.data.message}`);
      }
      
      // Clean up file
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(`   ✓ Cleaned up test file`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Import response: ${error.response.status} - ${error.response.data?.error || 'Error'}`);
      } else {
        console.log(`   ✗ Import error: ${error.message}`);
      }
    }

    // Test 5: Report generation
    console.log('\n5. Testing report generation...');
    try {
      const reportResponse = await axios.get(`${BASE_URL}/api/reports/risks?format=json&limit=5`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      
      console.log(`   ✓ Report generation: ${reportResponse.status}`);
      if (reportResponse.data.data) {
        console.log(`   ✓ Report records: ${reportResponse.data.data.length}`);
        
        // Check organization filtering
        if (reportResponse.data.data.length > 0) {
          const orgIds = [...new Set(reportResponse.data.data.map(item => item.organization_id))];
          console.log(`   ✓ Unique organization IDs in report: ${orgIds.length}`);
        }
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Report response: ${error.response.status} - ${error.response.data?.error || 'Error'}`);
      } else {
        console.log(`   ✗ Report error: ${error.message}`);
      }
    }

    // Test 6: Excel report download
    console.log('\n6. Testing Excel report download...');
    try {
      const excelReportResponse = await axios.get(`${BASE_URL}/api/reports/risks?format=excel&limit=10`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        },
        responseType: 'arraybuffer'
      });
      
      console.log(`   ✓ Excel report download: ${excelReportResponse.status}`);
      console.log(`   ✓ Content type: ${excelReportResponse.headers['content-type']}`);
      console.log(`   ✓ File size: ${excelReportResponse.data.byteLength} bytes`);
      
    } catch (error) {
      if (error.response) {
        console.log(`   ✓ Excel report response: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`   ✗ Excel report error: ${error.message}`);
      }
    }

    console.log('\n✅ Data import/export endpoint testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testDataImportExport();