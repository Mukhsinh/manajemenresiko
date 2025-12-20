require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { securityHeaders } = require('./middleware/security');
const { errorHandler } = require('./utils/errors');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware (must be first)
app.use(securityHeaders);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/config', require('./routes/config'));
app.use('/api/test', require('./routes/test'));
app.use('/api/test-data', require('./routes/test-data'));
app.use('/api/simple', require('./routes/simple-data'));
app.use('/api/debug-data', require('./routes/debug-data'));
app.use('/api/debug-monitoring', require('./routes/debug-monitoring'));
app.use('/api/debug-risk-profile', require('./routes/debug-risk-profile'));
app.use('/api/risk-profile-simple', require('./routes/risk-profile-simple'));
app.use('/api/risk-profile-real', require('./routes/risk-profile-real'));

// Risk Profile Excel Export (no auth for testing)
app.get('/api/risk-profile-excel', async (req, res) => {
  try {
    // Get data from risk-profile-real endpoint
    const response = await fetch(`${req.protocol}://${req.get('host')}/api/risk-profile-real`);
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }

    // Prepare Excel data
    const excelData = data.map((item, index) => {
      const risk = item.risk_inputs || {};
      return {
        'No': index + 1,
        'Kode Risiko': risk.kode_risiko || '-',
        'Unit Kerja': risk.master_work_units?.name || '-',
        'Kategori Risiko': risk.master_risk_categories?.name || '-',
        'Sasaran': risk.sasaran || '-',
        'Probabilitas': item.probability || 0,
        'Dampak': item.impact || 0,
        'Risk Value': item.risk_value || 0,
        'Risk Level': item.risk_level || '-',
        'Probabilitas %': item.probability_percentage || '-',
        'Dampak Finansial': item.financial_impact || 0,
        'Tanggal Dibuat': item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'
      };
    });

    // Set headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=risk-profile-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    // For now, return CSV format (can be opened in Excel)
    const headers = Object.keys(excelData[0]);
    const csvContent = [
      headers.join(','),
      ...excelData.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    res.send('\uFEFF' + csvContent); // BOM for UTF-8
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: error.message });
  }
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/risks', require('./routes/risks'));
app.use('/api/master-data', require('./routes/master-data'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/visi-misi', require('./routes/visi-misi'));
app.use('/api/rencana-strategis', require('./routes/rencana-strategis'));
app.use('/api/monitoring-evaluasi', require('./routes/monitoring-evaluasi'));
app.use('/api/peluang', require('./routes/peluang'));
app.use('/api/kri', require('./routes/kri'));
app.use('/api/loss-event', require('./routes/loss-event'));
app.use('/api/ews', require('./routes/ews'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/pengaturan', require('./routes/pengaturan'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/ai-assistant', require('./routes/ai-assistant-direct'));
app.use('/api/analisis-swot', require('./routes/analisis-swot'));
app.use('/api/diagram-kartesius', require('./routes/diagram-kartesius'));
app.use('/api/matriks-tows', require('./routes/matriks-tows'));
app.use('/api/sasaran-strategi', require('./routes/sasaran-strategi'));
app.use('/api/strategic-map', require('./routes/strategic-map'));
app.use('/api/indikator-kinerja-utama', require('./routes/indikator-kinerja-utama'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/test-org-filter', require('./routes/test-org-filter'));
app.use('/api/buku-pedoman', require('./routes/buku-pedoman'));

// Serve index.html for all routes (SPA) - must be last
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server (only if not in Vercel serverless environment)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    logger.info(`========================================`);
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Access: http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`========================================`);
  });
}

// Error handling
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export for Vercel serverless
module.exports = app;

