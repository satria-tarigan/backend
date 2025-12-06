const aiAgent = require('../services/aiAgent');

// @desc    Chat with AI
// @route   POST /api/chatbot/chat
exports.chat = async (req, res) => {
  try {
    const { message, sessionId, context } = req.body;

    const response = await aiAgent.chat(message, sessionId, context);

    res.status(200).json({
      success: true,
      data: {
        response: response.response,
        sessionId: response.sessionId,
        timestamp: response.timestamp
      }
    });
  } catch (error) {
    console.error('Chat Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Terjadi kesalahan dalam memproses pesan'
    });
  }
};

// @desc    Get chat history
// @route   GET /api/chatbot/history/:sessionId
exports.getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const history = aiAgent.getConversationHistory(sessionId);

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        history,
        totalMessages: history.length
      }
    });
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan dalam mengambil riwayat percakapan'
    });
  }
};

// @desc    Clear chat session
// @route   DELETE /api/chatbot/session/:sessionId
exports.clearChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const result = aiAgent.clearConversation(sessionId);

    res.status(200).json({
      success: true,
      message: 'Session berhasil dihapus'
    });
  } catch (error) {
    console.error('Clear Session Error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan dalam menghapus session'
    });
  }
};

// @desc    Get chatbot configuration
// @route   GET /api/chatbot/config
exports.getConfig = async (req, res) => {
  try {
    const config = {
      model: 'gemini-pro',
      maxTokens: 2048,
      temperature: 0.7,
      features: [
        'General conversation',
        'Ticket creation assistance',
        'Status tracking',
        'Product information',
        'Indonesian language support'
      ],
      supportedCommands: [
        'buat tiket - Create new ticket',
        'cek status [ticket_id] - Check ticket status',
        'bantuan - Show help menu',
        'info produk - Get product information'
      ]
    };

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get Config Error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan dalam mengambil konfigurasi'
    });
  }
};