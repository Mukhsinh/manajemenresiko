// Helper untuk export data ke Excel/CSV
const XLSX = require('xlsx');

/**
 * Convert data array ke Excel buffer
 */
function exportToExcel(data, sheetName = 'Data') {
  try {
    // Ensure data is an array
    if (!Array.isArray(data)) {
      data = [];
    }

    // If no data, create a simple message
    if (data.length === 0) {
      data = [{ 'Message': 'No data available', 'Generated': new Date().toISOString() }];
    }

    // Create worksheet with proper formatting
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns
    const cols = [];
    if (data.length > 0) {
      Object.keys(data[0]).forEach(key => {
        const maxLength = Math.max(
          key.length,
          ...data.map(row => String(row[key] || '').length)
        );
        cols.push({ width: Math.min(Math.max(maxLength + 2, 10), 50) });
      });
      worksheet['!cols'] = cols;
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Set workbook properties
    workbook.Props = {
      Title: sheetName,
      Subject: 'Risk Management Report',
      Author: 'Risk Management System',
      CreatedDate: new Date()
    };

    // Write buffer with proper options
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });
    
    console.log(`Excel file generated: ${buffer.length} bytes for ${data.length} records`);
    return buffer;
  } catch (error) {
    console.error('Error generating Excel file:', error);
    throw new Error('Failed to generate Excel file: ' + error.message);
  }
}

/**
 * Generate template Excel untuk import
 */
function generateTemplate(columns, sheetName = 'Template') {
  const templateData = [columns];
  const worksheet = XLSX.utils.aoa_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

module.exports = {
  exportToExcel,
  generateTemplate
};

