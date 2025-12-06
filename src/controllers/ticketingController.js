const { v4: uuidv4 } = require('uuid');
const aiAgent = require('../services/aiAgent');

// In-memory storage (replace with database in production)
let tickets = [];
let comments = [];

// @desc    Create new ticket
// @route   POST /api/ticketing/tickets
exports.createTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      requesterName,
      requesterEmail,
      attachments
    } = req.body;

    // Generate ticket ID
    const ticketId = `TK-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const ticket = {
      id: ticketId,
      title,
      description,
      category,
      priority: priority || 'medium',
      status: 'open',
      requesterName,
      requesterEmail,
      attachments: attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTo: null,
      resolution: null
    };

    // Generate AI summary for the ticket
    try {
      const aiSummary = await aiAgent.generateTicketSummary(description);
      ticket.aiSummary = aiSummary;
    } catch (error) {
      console.error('Error generating AI summary:', error);
      ticket.aiSummary = null;
    }

    tickets.push(ticket);

    res.status(201).json({
      success: true,
      message: 'Tiket berhasil dibuat',
      data: ticket
    });
  } catch (error) {
    console.error('Create Ticket Error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan dalam membuat tiket'
    });
  }
};

// @desc    Get all tickets with filters
// @route   GET /api/ticketing/tickets
exports.getTickets = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      assignedTo,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let filteredTickets = [...tickets];

    // Apply filters
    if (status) {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === status);
    }
    if (category) {
      filteredTickets = filteredTickets.filter(ticket => ticket.category === category);
    }
    if (priority) {
      filteredTickets = filteredTickets.filter(ticket => ticket.priority === priority);
    }
    if (assignedTo) {
      filteredTickets = filteredTickets.filter(ticket => ticket.assignedTo === assignedTo);
    }

    // Sort tickets
    filteredTickets.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const multiplier = sortOrder === 'asc' ? 1 : -1;

      if (aValue < bValue) return -1 * multiplier;
      if (aValue > bValue) return 1 * multiplier;
      return 0;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        tickets: paginatedTickets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredTickets.length / limit),
          totalTickets: filteredTickets.length,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get Tickets Error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan dalam mengambil tiket'
    });
  }
};

// @desc    Get ticket by ID
// @route   GET /api/ticketing/tickets/:id
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = tickets.find(t => t.id === id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Tiket tidak ditemukan'
      });
    }

    // Get ticket comments
    const ticketComments = comments.filter(c => c.ticketId === id);

    res.status(200).json({
      success: true,
      data: {
        ...ticket,
        comments: ticketComments
      }
    });
  } catch (error) {
    console.error('Get Ticket Error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan dalam mengambil tiket'
    });
  }
};

// @desc    Update ticket
// @route   PUT /api/ticketing/tickets/:id
exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const ticketIndex = tickets.findIndex(t => t.id === id);

    if (ticketIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Tiket tidak ditemukan'
      });
    }

    // Update ticket
    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'Tiket berhasil diperbarui',
      data: tickets[ticketIndex]
    });
  } catch (error) {
    console.error('Update Ticket Error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan dalam memperbarui tiket'
    });
  }
};

// @desc    Delete ticket
// @route   DELETE /api/ticketing/tickets/:id
exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticketIndex = tickets.findIndex(t => t.id === id);

    if (ticketIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Tiket tidak ditemukan'
      });
    }

    // Delete ticket and associated comments
    tickets.splice(ticketIndex, 1);
    comments = comments.filter(c => c.ticketId !== id);

    res.status(200).json({
      success: true,
      message: 'Tiket berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete Ticket Error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan dalam menghapus tiket'
    });
  }
};

// @desc    Add comment to ticket
// @route   POST /api/ticketing/tickets/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { authorName, authorEmail, content, isInternal = false } = req.body;

    const ticket = tickets.find(t => t.id === id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Tiket tidak ditemukan'
      });
    }

    const comment = {
      id: uuidv4(),
      ticketId: id,
      authorName,
      authorEmail,
      content,
      isInternal,
      createdAt: new Date().toISOString()
    };

    comments.push(comment);

    // Update ticket's updatedAt
    ticket.updatedAt = new Date().toISOString();

    res.status(201).json({
      success: true,
      message: 'Komentar berhasil ditambahkan',
      data: comment
    });
  } catch (error) {
    console.error('Add Comment Error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan dalam menambahkan komentar'
    });
  }
};

// @desc    Get ticket analytics
// @route   GET /api/ticketing/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const totalTickets = tickets.length;

    const statusCount = {
      open: tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length
    };

    const priorityCount = {
      low: tickets.filter(t => t.priority === 'low').length,
      medium: tickets.filter(t => t.priority === 'medium').length,
      high: tickets.filter(t => t.priority === 'high').length,
      urgent: tickets.filter(t => t.priority === 'urgent').length
    };

    const categoryCount = {};
    tickets.forEach(ticket => {
      categoryCount[ticket.category] = (categoryCount[ticket.category] || 0) + 1;
    });

    // Average resolution time (for resolved tickets)
    const resolvedTickets = tickets.filter(t => t.status === 'resolved');
    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      // This is a simplified calculation - in production, use actual resolution dates
      avgResolutionTime = 24; // hours (placeholder)
    }

    res.status(200).json({
      success: true,
      data: {
        totalTickets,
        statusBreakdown: statusCount,
        priorityBreakdown: priorityCount,
        categoryBreakdown: categoryCount,
        averageResolutionTime: avgResolutionTime,
        totalComments: comments.length
      }
    });
  } catch (error) {
    console.error('Get Analytics Error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan dalam mengambil analytics'
    });
  }
};

// @desc    Get ticket categories
// @route   GET /api/ticketing/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      { value: 'technical', label: 'Technical Support' },
      { value: 'billing', label: 'Billing & Payment' },
      { value: 'general', label: 'General Inquiry' },
      { value: 'feature_request', label: 'Feature Request' },
      { value: 'bug_report', label: 'Bug Report' },
      { value: 'account', label: 'Account Management' },
      { value: 'integration', label: 'Integration Help' }
    ];

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get Categories Error:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan dalam mengambil kategori'
    });
  }
};