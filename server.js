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
app.use('/api/auth', require('./routes/auth'));
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
app.use('/api/ai-assistant', require('./routes/ai-assistant'));
app.use('/api/analisis-swot', require('./routes/analisis-swot'));
app.use('/api/diagram-kartesius', require('./routes/diagram-kartesius'));
app.use('/api/matriks-tows', require('./routes/matriks-tows'));
app.use('/api/sasaran-strategi', require('./routes/sasaran-strategi'));
app.use('/api/strategic-map', require('./routes/strategic-map'));
app.use('/api/indikator-kinerja-utama', require('./routes/indikator-kinerja-utama'));
app.use('/api/notifications', require('./routes/notifications'));

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

