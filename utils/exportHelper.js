// Helper untuk export data ke Excel/CSV
const XLSX = require('xlsx');

/**
 * Convert data array ke Excel buffer
 */
function exportToExcel(data, sheetName = 'Data') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
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

