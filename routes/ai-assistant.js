const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { authenticateUser } = require('../middleware/auth');
const logger = require('../utils/logger');

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// System prompt untuk konteks manajemen risiko rumah sakit
const SYSTEM_PROMPT = `Anda adalah asisten AI yang ahli dalam manajemen risiko rumah sakit. 
Tugas Anda adalah membantu pengguna dalam:
1. Identifikasi dan analisis risiko di lingkungan rumah sakit
2. Penyusunan rencana mitigasi risiko
3. Best practices dalam manajemen risiko kesehatan
4. Interpretasi data risiko dan rekomendasi tindakan
5. Kepatuhan terhadap standar akreditasi rumah sakit (SNARS, JCI, dll)

Gunakan terminologi medis dan manajemen risiko yang tepat. Berikan jawaban yang praktis, 
dapat ditindaklanjuti, dan sesuai dengan konteks rumah sakit di Indonesia.`;

// POST /api/ai-assistant/chat
router.post('/chat', authenticateUser, async (req, res) => {
  try {
    if (!genAI) {
      return res.status(503).json({ 
        error: 'Layanan AI belum dikonfigurasi. Silakan hubungi administrator.' 
      });
    }

    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }

    // Try different models in order of preference
    const modelsToTry = [
      'gemini-1.5-pro',
      'gemini-1.5-flash', 
      'gemini-pro',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash',
      'models/gemini-pro'
    ];

    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        logger.info(`Trying model: ${modelName}`);
        
        // Get the generative model
        const model = genAI.getGenerativeModel({ model: modelName });

        // Build conversation context
        let conversationContext = SYSTEM_PROMPT + '\n\n';
        
        // Add conversation history (last 5 messages for context)
        if (conversationHistory && conversationHistory.length > 0) {
          const recentHistory = conversationHistory.slice(-5);
          conversationContext += 'Riwayat percakapan:\n';
          recentHistory.forEach((msg, idx) => {
            if (msg.role === 'user') {
              conversationContext += `User: ${msg.content}\n`;
            } else if (msg.role === 'assistant') {
              conversationContext += `Assistant: ${msg.content}\n`;
            }
          });
          conversationContext += '\n';
        }

        conversationContext += `Pertanyaan user: ${message.trim()}\n\nJawab dengan jelas dan praktis:`;

        // Generate response
        const result = await model.generateContent(conversationContext);
        const response = await result.response;
        const text = response.text();

        logger.info(`Successfully used model: ${modelName}`);

        // Return response
        return res.json({
          success: true,
          message: text,
          model: modelName,
          timestamp: new Date().toISOString()
        });

      } catch (modelError) {
        logger.warn(`Model ${modelName} failed:`, modelError.message);
        lastError = modelError;
        continue; // Try next model
      }
    }

    // If all models failed, return error
    throw lastError || new Error('All AI models failed');

  } catch (error) {
    logger.error('AI Assistant error:', error);
    
    // Handle specific Gemini API errors
    if (error.message && error.message.includes('API_KEY')) {
      return res.status(500).json({ 
        error: 'API key tidak valid. Silakan hubungi administrator untuk mengkonfigurasi Google AI API key.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        solution: 'Pastikan GEMINI_API_KEY valid dan Google AI API sudah diaktifkan di Google Cloud Console.'
      });
    }
    
    if (error.message && error.message.includes('SAFETY')) {
      return res.status(400).json({ 
        error: 'Pesan Anda tidak dapat diproses karena alasan keamanan. Silakan coba dengan pertanyaan lain.' 
      });
    }

    // Handle quota exceeded errors
    if (error.message && (error.message.includes('quota') || error.message.includes('QUOTA'))) {
      return res.status(429).json({ 
        error: 'Kuota API telah habis. Silakan coba lagi nanti.' 
      });
    }

    // Handle network errors
    if (error.message && (error.message.includes('network') || error.message.includes('NETWORK'))) {
      return res.status(503).json({ 
        error: 'Tidak dapat terhubung ke layanan AI. Silakan coba lagi.' 
      });
    }

    // Handle model not found errors
    if (error.message && error.message.includes('404 Not Found')) {
      return res.status(503).json({ 
        error: 'Model AI tidak tersedia. Silakan hubungi administrator untuk mengkonfigurasi model yang tepat.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        solution: 'Periksa konfigurasi model AI dan pastikan menggunakan model yang tersedia.'
      });
    }

    // Generic error with details in development
    res.status(500).json({ 
      error: 'Terjadi kesalahan saat memproses permintaan AI. Silakan coba lagi.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/ai-assistant/status - Check if AI is available
router.get('/status', authenticateUser, async (req, res) => {
  try {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    const hasGenAI = !!genAI;
    
    if (!hasApiKey || !hasGenAI) {
      return res.json({
        available: false,
        model: null,
        reason: !hasApiKey ? 'API key not configured' : 'GenAI not initialized'
      });
    }

    // Test if we can actually use the AI
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      // Don't actually generate content, just check if model can be created
      
      res.json({
        available: true,
        model: 'gemini-1.5-pro',
        status: 'ready'
      });
    } catch (testError) {
      logger.warn('AI model test failed:', testError.message);
      res.json({
        available: false,
        model: null,
        reason: 'Model not accessible',
        details: process.env.NODE_ENV === 'development' ? testError.message : undefined
      });
    }
  } catch (error) {
    logger.error('AI Assistant status error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

