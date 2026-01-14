// Helper untuk export data ke Excel/CSV/PDF
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
 * Generate PDF from data using Puppeteer
 * @param {Array} data - Data to include in PDF
 * @param {Object} options - PDF options
 * @returns {Promise<Buffer>} PDF buffer
 */
async function exportToPDF(data, options = {}) {
  const {
    title = 'Report',
    columns = null,
    orientation = 'landscape',
    showStats = false,
    statsConfig = null
  } = options;

  try {
    const puppeteer = require('puppeteer');
    
    // Ensure data is an array
    if (!Array.isArray(data)) {
      data = data ? [data] : [];
    }

    // Auto-detect columns if not provided
    const tableColumns = columns || (data.length > 0 ? Object.keys(data[0]) : ['No Data']);
    
    // Generate HTML content
    const htmlContent = generatePDFHTML(data, {
      title,
      columns: tableColumns,
      showStats,
      statsConfig
    });

    // Generate PDF with Puppeteer
    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      });

      const page = await browser.newPage();
      
      // Suppress console warnings
      page.on('console', () => {});
      
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: orientation === 'landscape',
        margin: {
          top: '15mm',
          right: '10mm',
          bottom: '15mm',
          left: '10mm'
        },
        printBackground: true
      });

      await browser.close();
      browser = null;

      console.log(`PDF generated: ${pdfBuffer.length} bytes for ${data.length} records`);
      return pdfBuffer;

    } catch (pdfError) {
      if (browser) {
        try { await browser.close(); } catch (e) {}
      }
      throw pdfError;
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
}

/**
 * Generate HTML content for PDF
 */
function generatePDFHTML(data, options) {
  const { title, columns, showStats, statsConfig } = options;
  
  // Calculate stats if needed
  let statsHTML = '';
  if (showStats && statsConfig) {
    const stats = calculateStats(data, statsConfig);
    statsHTML = `
      <div class="stats-container">
        ${stats.map(s => `
          <div class="stat-box">
            <div class="stat-value">${s.value}</div>
            <div class="stat-label">${s.label}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Generate table rows
  const tableRows = data.map((row, index) => {
    const cells = columns.map(col => {
      let value = row[col];
      if (typeof value === 'object' && value !== null) {
        value = value.name || JSON.stringify(value);
      }
      return `<td>${escapeHtml(String(value || '-'))}</td>`;
    }).join('');
    return `<tr><td>${index + 1}</td>${cells}</tr>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)}</title>
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 15px;
          font-size: 10px;
        }
        .header { 
          text-align: center; 
          margin-bottom: 20px; 
          border-bottom: 2px solid #2c3e50; 
          padding-bottom: 15px; 
        }
        .header h1 { 
          margin: 0 0 5px 0; 
          color: #2c3e50; 
          font-size: 18px; 
        }
        .header p { 
          margin: 0; 
          color: #666; 
          font-size: 10px; 
        }
        .stats-container { 
          display: flex; 
          justify-content: space-around; 
          margin: 15px 0; 
          flex-wrap: wrap;
        }
        .stat-box { 
          text-align: center; 
          padding: 10px 15px; 
          border: 1px solid #ddd; 
          border-radius: 6px; 
          min-width: 100px;
          margin: 5px;
        }
        .stat-value { 
          font-size: 16px; 
          font-weight: bold; 
          color: #2c3e50; 
        }
        .stat-label { 
          font-size: 9px; 
          color: #666; 
          margin-top: 3px; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 15px; 
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 6px 8px; 
          text-align: left; 
          font-size: 9px;
          word-wrap: break-word;
        }
        th { 
          background-color: #2c3e50; 
          color: white; 
          font-weight: bold; 
        }
        tr:nth-child(even) { background-color: #f9f9f9; }
        tr:hover { background-color: #f5f5f5; }
        .footer { 
          margin-top: 20px; 
          text-align: center; 
          font-size: 8px; 
          color: #666; 
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        .risk-low { background-color: #d4edda !important; }
        .risk-medium { background-color: #fff3cd !important; }
        .risk-high { background-color: #f8d7da !important; }
        .risk-extreme { background-color: #f5c6cb !important; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(title)}</h1>
        <p>Generated: ${new Date().toLocaleDateString('id-ID', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <p>Total Records: ${data.length}</p>
      </div>
      
      ${statsHTML}
      
      <table>
        <thead>
          <tr>
            <th>No</th>
            ${columns.map(col => `<th>${escapeHtml(formatColumnName(col))}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows || '<tr><td colspan="' + (columns.length + 1) + '">No data available</td></tr>'}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Risk Management System - ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Calculate statistics from data
 */
function calculateStats(data, config) {
  const stats = [];
  
  if (config.total !== false) {
    stats.push({ label: 'Total Records', value: data.length });
  }
  
  if (config.avgField) {
    const avg = data.reduce((sum, d) => sum + (parseFloat(d[config.avgField]) || 0), 0) / (data.length || 1);
    stats.push({ label: config.avgLabel || 'Average', value: avg.toFixed(2) });
  }
  
  if (config.countByField) {
    const counts = {};
    data.forEach(d => {
      const val = d[config.countByField] || 'Unknown';
      counts[val] = (counts[val] || 0) + 1;
    });
    Object.entries(counts).forEach(([key, count]) => {
      stats.push({ label: key, value: count });
    });
  }
  
  return stats;
}

/**
 * Format column name for display
 */
function formatColumnName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
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

/**
 * Generate template Excel dengan contoh data untuk import
 */
function generateTemplateWithSamples(columns, sampleData, sheetName = 'Template') {
  try {
    // Create worksheet with headers and sample data
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Auto-size columns
    const cols = [];
    columns.forEach(col => {
      const maxLength = Math.max(
        col.length,
        ...sampleData.map(row => String(row[col] || '').length)
      );
      cols.push({ width: Math.min(Math.max(maxLength + 2, 15), 50) });
    });
    worksheet['!cols'] = cols;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Set workbook properties
    workbook.Props = {
      Title: `Template ${sheetName}`,
      Subject: 'Import Template with Sample Data',
      Author: 'Risk Management System',
      CreatedDate: new Date()
    };

    // Write buffer
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });
    
    console.log(`Template with samples generated: ${buffer.length} bytes for ${sampleData.length} sample records`);
    return buffer;
  } catch (error) {
    console.error('Error generating template with samples:', error);
    throw new Error('Failed to generate template: ' + error.message);
  }
}

module.exports = {
  exportToExcel,
  exportToPDF,
  generateTemplate,
  generateTemplateWithSamples,
  generatePDFHTML,
  escapeHtml,
  formatColumnName
};

