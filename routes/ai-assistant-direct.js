const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const logger = require('../utils/logger');

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

// POST /api/ai-assistant/chat - Using direct REST API
router.post('/chat', authenticateUser, async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ 
        error: 'Layanan AI belum dikonfigurasi. Silakan hubungi administrator.' 
      });
    }

    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }

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

    // Try different API endpoints and models
    const apiConfigs = [
      {
        url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        model: 'gemini-1.5-flash'
      },
      {
        url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        model: 'gemini-1.5-pro'
      },
      {
        url: `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        model: 'gemini-pro'
      }
    ];

    let lastError = null;

    for (const config of apiConfigs) {
      try {
        logger.info(`Trying direct API with model: ${config.model}`);

        const requestBody = {
          contents: [{
            parts: [{
              text: conversationContext
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        };

        const response = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          logger.warn(`API ${config.model} failed with status ${response.status}: ${errorText}`);
          lastError = new Error(`API ${config.model} failed: ${response.status} ${errorText}`);
          continue;
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
          const aiResponse = data.candidates[0].content.parts[0].text;
          
          logger.info(`Successfully used direct API with model: ${config.model}`);

          return res.json({
            success: true,
            message: aiResponse,
            model: config.model,
            timestamp: new Date().toISOString()
          });
        } else {
          logger.warn(`API ${config.model} returned unexpected format:`, data);
          lastError = new Error(`API ${config.model} returned unexpected format`);
          continue;
        }

      } catch (apiError) {
        logger.warn(`Direct API ${config.model} failed:`, apiError.message);
        lastError = apiError;
        continue;
      }
    }

    // If all APIs failed
    throw lastError || new Error('All AI APIs failed');

  } catch (error) {
    logger.error('AI Assistant direct API error:', error);
    
    // Handle specific errors
    if (error.message && error.message.includes('API_KEY')) {
      return res.status(500).json({ 
        error: 'API key tidak valid. Silakan hubungi administrator untuk mengkonfigurasi Google AI API key.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        solution: 'Pastikan GEMINI_API_KEY valid dan Google AI API sudah diaktifkan.'
      });
    }
    
    if (error.message && error.message.includes('403')) {
      return res.status(403).json({ 
        error: 'API key tidak memiliki akses ke layanan AI. Silakan periksa konfigurasi API key.',
        solution: 'Pastikan API key memiliki akses ke Generative Language API.'
      });
    }

    if (error.message && error.message.includes('429')) {
      return res.status(429).json({ 
        error: 'Kuota API telah habis. Silakan coba lagi nanti.' 
      });
    }

    if (error.message && error.message.includes('404')) {
      return res.status(503).json({ 
        error: 'Model AI tidak tersedia. Silakan hubungi administrator.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        solution: 'Periksa konfigurasi model AI dan pastikan menggunakan model yang tersedia.'
      });
    }

    // Generic error
    res.status(500).json({ 
      error: 'Terjadi kesalahan saat memproses permintaan AI. Silakan coba lagi.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/ai-assistant/status - Check if AI is available using direct API
router.get('/status', authenticateUser, async (req, res) => {
  try {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    
    if (!hasApiKey) {
      return res.json({
        available: false,
        model: null,
        reason: 'API key not configured'
      });
    }

    // Test direct API call
    try {
      const testUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      const testResponse = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello, test message'
            }]
          }]
        })
      });

      if (testResponse.ok) {
        res.json({
          available: true,
          model: 'gemini-1.5-flash',
          status: 'ready',
          method: 'direct-api'
        });
      } else {
        const errorText = await testResponse.text();
        logger.warn('Direct API test failed:', errorText);
        res.json({
          available: false,
          model: null,
          reason: 'API test failed',
          details: process.env.NODE_ENV === 'development' ? errorText : undefined
        });
      }
    } catch (testError) {
      logger.warn('Direct API test error:', testError.message);
      res.json({
        available: false,
        model: null,
        reason: 'API test error',
        details: process.env.NODE_ENV === 'development' ? testError.message : undefined
      });
    }
  } catch (error) {
    logger.error('AI Assistant status error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;