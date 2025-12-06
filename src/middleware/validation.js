const Joi = require('joi');

// Chat request validation
const validateChatRequest = (req, res, next) => {
  const schema = Joi.object({
    message: Joi.string().required().min(1).max(1000),
    sessionId: Joi.string().optional(),
    context: Joi.object().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

// Ticket creation validation
const validateTicketCreate = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().required().min(3).max(200),
    description: Joi.string().required().min(10).max(2000),
    category: Joi.string().required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    requesterName: Joi.string().required().min(2).max(100),
    requesterEmail: Joi.string().email().required(),
    attachments: Joi.array().items(Joi.object()).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

// Ticket update validation
const validateTicketUpdate = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    assignedTo: Joi.string().optional(),
    resolution: Joi.string().optional().max(1000)
  }).min(1);

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

// Streaming data validation
const validateStreamingData = (req, res, next) => {
  const schema = Joi.object({
    machine_id: Joi.string().required().min(3).max(50),
    timestamp: Joi.string().isoDate().optional(),
    metrics: Joi.object({
      air_temperature: Joi.number().min(250).max(350).required(),
      process_temperature: Joi.number().min(260).max(360).required(),
      rotational_speed: Joi.number().min(1000).max(4000).required(),
      torque: Joi.number().min(0).max(100).required(),
      tool_wear: Joi.number().min(0).max(1000).required(),
      quality_variant: Joi.string().valid('H', 'M', 'L').optional(),
      machine_failure: Joi.boolean().optional(),
      failure_mode: Joi.string().valid('tool_wear_failure', 'heat_dissipation_failure', 'power_failure', 'overstrain_failure', 'random_failure').optional()
    }).required(),
    status: Joi.string().valid('active', 'inactive', 'maintenance', 'error').optional(),
    location: Joi.string().min(2).max(100).optional(),
    maintenance_info: Joi.object({
      last_maintenance: Joi.string().isoDate().optional(),
      next_maintenance: Joi.string().isoDate().optional(),
      maintenance_type: Joi.string().optional()
    }).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateChatRequest,
  validateTicketCreate,
  validateTicketUpdate,
  validateStreamingData
};