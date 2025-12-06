const express = require('express');
const router = express.Router();
const streamingController = require('../controllers/streamingController');
const { validateStreamingData } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limit khusus untuk streaming data
const streamingRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute (5 requests per second per machine)
  message: {
    success: false,
    error: 'Too many streaming requests'
  }
});

// @desc    Ingest streaming data from machines
// @route   POST /api/v1/ingest
router.post('/ingest', streamingRateLimit, validateStreamingData, streamingController.ingestData);

// @desc    Get latest machine data
// @route   GET /api/v1/machines/:machineId/latest
router.get('/machines/:machineId/latest', streamingController.getLatestMachineData);

// @desc    Get machine data history
// @route   GET /api/v1/machines/:machineId/history
router.get('/machines/:machineId/history', streamingController.getMachineHistory);

// @desc    Get all machines status
// @route   GET /api/v1/machines/status
router.get('/machines/status', streamingController.getAllMachinesStatus);

module.exports = router;