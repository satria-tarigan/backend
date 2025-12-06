const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { validateChatRequest } = require('../middleware/validation');

// @desc    Chat with AI
// @route   POST /api/chatbot/chat
router.post('/chat', validateChatRequest, chatbotController.chat);

// @desc    Get chat history
// @route   GET /api/chatbot/history/:sessionId
router.get('/history/:sessionId', chatbotController.getChatHistory);

// @desc    Clear chat session
// @route   DELETE /api/chatbot/session/:sessionId
router.delete('/session/:sessionId', chatbotController.clearChatSession);

// @desc    Get available chatbot models/configurations
// @route   GET /api/chatbot/config
router.get('/config', chatbotController.getConfig);

module.exports = router;