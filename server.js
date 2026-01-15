require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { securityHeaders } = require('./middleware/security');
const { errorHandler } = require('./utils/errors');
const logger = require('./utils/logger');
const { findAvailablePort, getPort } = require('./config/port');

const app = express();

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

// Middleware to prevent caching of fixed JS files
app.use('/js/page-initialization-system-fixed.js', (req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use('/js/rencana-strategis-fixed.js', (req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use('/js/rencana-strategis.js', (req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use('/js/startup-script.js', (req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

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

// Risk Profile Excel Export (no auth for testing)
app.get('/api/risk-profile-excel', async (req, res) => {
  try {
    // Get data from the correct risk-profile endpoint
    const response = await fetch(`${req.protocol}://${req.get('host')}/api/risk-profile`, {
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json'
      }
    });
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
        'Jenis Unit Kerja': risk.master_work_units?.jenis || '-',
        'Kategori Unit Kerja': risk.master_work_units?.kategori || '-',
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
app.use('/api/user-management', require('./routes/user-management'));
app.use('/api/risks', require('./routes/risks'));
app.use('/api/risk-profile', require('./routes/risk-profile'));
app.use('/api/master-data', require('./routes/master-data'));
// Add residual risk reports endpoint BEFORE general reports
app.get('/api/reports/residual-risk/test', (req, res) => {
  res.json({ message: 'Residual risk endpoint working', timestamp: new Date().toISOString() });
});

// Residual risk data endpoint
app.get('/api/reports/residual-risk/public', async (req, res) => {
  try {
    console.log('=== RESIDUAL RISK PUBLIC ENDPOINT ===');
    
    // For now, return mock data to test the endpoint
    const mockData = [
      {
        id: 1,
        probability: 3,
        impact: 4,
        risk_value: 12,
        risk_level: 'HIGH RISK',
        probability_percentage: '40-60%',
        financial_impact: 50000000,
        review_status: 'Reviewed',
        next_review_date: '2025-03-01',
        risk_inputs: {
          id: 1,
          kode_risiko: 'RSK-2025-001',
          sasaran: 'Meningkatkan kualitas pelayanan',
          penyebab_risiko: 'Kurangnya tenaga medis',
          dampak_risiko: 'Penurunan kualitas pelayanan',
          status_risiko: 'Active',
          jenis_risiko: 'Threat',
          master_work_units: {
            id: 1,
            name: 'Unit Gawat Darurat',
            jenis: 'Pelayanan',
            kategori: 'Medis'
          },
          master_risk_categories: {
            id: 1,
            name: 'Risiko Operasional'
          },
          rencana_strategis: {
            id: 1,
            kode: 'RS-2025-001',
            nama_rencana: 'Peningkatan Pelayanan Medis'
          },
          risk_inherent_analysis: {
            probability: 4,
            impact: 4,
            risk_value: 16,
            risk_level: 'EXTREME HIGH',
            probability_percentage: '60-80%',
            financial_impact: 75000000
          }
        }
      }
    ];
    
    console.log('Returning mock residual risk data:', mockData.length, 'items');
    res.json(mockData);
  } catch (error) {
    console.error('Residual risk endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/reports/residual-risk', require('./routes/residual-risk-reports'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/visi-misi', require('./routes/visi-misi'));
app.use('/api/rencana-strategis', require('./routes/rencana-strategis'));
app.use('/api/renstra', require('./routes/renstra'));
app.use('/api/monitoring-evaluasi', require('./routes/monitoring-evaluasi'));
app.use('/api/peluang', require('./routes/peluang'));
app.use('/api/kri', require('./routes/kri'));
// app.use('/api/loss-event', require('./routes/loss-event'));
app.use('/api/ews', require('./routes/ews'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/pengaturan', require('./routes/pengaturan'));
// app.use('/api/chat', require('./routes/chat'));
app.use('/api/ai-assistant', require('./routes/ai-assistant-direct'));
app.use('/api/analisis-swot', require('./routes/analisis-swot'));
app.use('/api/diagram-kartesius', require('./routes/diagram-kartesius'));
app.use('/api/matriks-tows', require('./routes/matriks-tows'));
app.use('/api/sasaran-strategi', require('./routes/sasaran-strategi'));
app.use('/api/strategic-map', require('./routes/strategic-map'));
app.use('/api/indikator-kinerja-utama', require('./routes/indikator-kinerja-utama'));
app.use('/api/evaluasi-iku', require('./routes/evaluasi-iku'));
app.use('/api/evaluasi-iku-bulanan', require('./routes/evaluasi-iku-bulanan'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/test-org-filter', require('./routes/test-org-filter'));
app.use('/api/buku-pedoman', require('./routes/buku-pedoman'));

// Serve index.html for all routes (SPA) - must be last

// Route for rencana strategis page - serve main SPA
app.get('/rencana-strategis', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for renstra page (clean implementation) - serve main SPA
app.get('/renstra', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for risk residual page - serve main SPA  
app.get('/risk-residual', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for residual risk page - serve main SPA (alternative URL)
app.get('/residual-risk', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Route for residual risk page
app.get('/residual-risk', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/risk-residual', (req, res) => {
    res.redirect('/residual-risk');
});

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
  // Use async function to handle port finding
  (async () => {
    try {
      const PORT = await findAvailablePort(getPort());
      
      const server = app.listen(PORT, () => {
        logger.info(`========================================`);
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Access: http://localhost:${PORT}`);
        logger.info(`Modern Dashboard: http://localhost:${PORT}/dashboard-modern.html`);
        logger.info(`Modern Risk Profile: http://localhost:${PORT}/risk-profile-modern.html`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`========================================`);
      });
      
      // Handle server errors
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          logger.error(`Port ${PORT} is already in use. Trying to find another port...`);
        } else {
          logger.error('Server error:', err);
          process.exit(1);
        }
      });
      
    } catch (error) {
      logger.error('Failed to start server:', error.message);
      logger.error('Please check if ports 3001-3010 are available or set PORT environment variable');
      process.exit(1);
    }
  })();
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

