const express = require('express');
const router = express.Router();

// @desc    Get API information
// @route   GET /api
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Benar Benar API v1.0.0',
    version: '1.0.0',
    endpoints: {
      chatbot: '/api/chatbot',
      ticketing: '/api/ticketing',
      health: '/health'
    }
  });
});

// @desc    API status check
// @route   GET /api/status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;