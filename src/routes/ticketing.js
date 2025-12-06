const express = require('express');
const router = express.Router();
const ticketingController = require('../controllers/ticketingController');
const { validateTicketCreate, validateTicketUpdate } = require('../middleware/validation');

// @desc    Create new ticket
// @route   POST /api/ticketing/tickets
router.post('/tickets', validateTicketCreate, ticketingController.createTicket);

// @desc    Get all tickets with filters
// @route   GET /api/ticketing/tickets
router.get('/tickets', ticketingController.getTickets);

// @desc    Get ticket by ID
// @route   GET /api/ticketing/tickets/:id
router.get('/tickets/:id', ticketingController.getTicketById);

// @desc    Update ticket status/priority
// @route   PUT /api/ticketing/tickets/:id
router.put('/tickets/:id', validateTicketUpdate, ticketingController.updateTicket);

// @desc    Delete ticket
// @route   DELETE /api/ticketing/tickets/:id
router.delete('/tickets/:id', ticketingController.deleteTicket);

// @desc    Add comment to ticket
// @route   POST /api/ticketing/tickets/:id/comments
router.post('/tickets/:id/comments', ticketingController.addComment);

// @desc    Get ticket analytics
// @route   GET /api/ticketing/analytics
router.get('/analytics', ticketingController.getAnalytics);

// @desc    Get ticket categories
// @route   GET /api/ticketing/categories
router.get('/categories', ticketingController.getCategories);

module.exports = router;