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

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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

    // Return response
    res.json({
      success: true,
      message: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('AI Assistant error:', error);
    
    // Handle specific Gemini API errors
    if (error.message && error.message.includes('API_KEY')) {
      return res.status(500).json({ 
        error: 'API key tidak valid. Silakan hubungi administrator.' 
      });
    }
    
    if (error.message && error.message.includes('SAFETY')) {
      return res.status(400).json({ 
        error: 'Pesan Anda tidak dapat diproses karena alasan keamanan. Silakan coba dengan pertanyaan lain.' 
      });
    }

    res.status(500).json({ 
      error: 'Terjadi kesalahan saat memproses permintaan AI. Silakan coba lagi.' 
    });
  }
});

// GET /api/ai-assistant/status - Check if AI is available
router.get('/status', authenticateUser, async (req, res) => {
  try {
    const isAvailable = !!genAI && !!process.env.GEMINI_API_KEY;
    res.json({
      available: isAvailable,
      model: isAvailable ? 'gemini-pro' : null
    });
  } catch (error) {
    logger.error('AI Assistant status error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

